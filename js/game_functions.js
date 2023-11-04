/*
Asteroids-JS
This is a modern JS reboot of the classic 1979 Atari space shoot-em up game

Copyright (C) 2021  Phil Spilsbury - <philspil66@gmail.com>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var p1Spawn = [Game.width / 2, Game.height / 2];
var playerVectors = [[[5, 0], [-4, -3], [-3, -2], [-3, 2], [-4, 3], [5, 0]]];
var playerKeys = {
  keyUp: 32,
  keyDown: 38,
  keyLeft: 37,
  keyRight: 39,
  hyperSpace: 40
};
var BIG_SAUCER = 5; // Big saucer size
var SMA_SAUCER = 2.5; // Small saucer size
var BIG_ASTEROID = 12; // Big asteroid size
var MED_ASTEROID = 6; // Medium asteroid size
var SMA_ASTEROID = 3; // Small asteroid size
var ASTEROID_MAX_SPEED = 3;
var SAUCER_SCHEDULE = 6000;
var saucerVectors = [[[-1, 0], [1, 1], [5, 1], [7, 0], [5, -1], [1, -1], [-1, 0]], [[2, 1], [2.5, 2], [3.5, 2], [4, 1]], [[-1, 0], [7, 0]]];
var LEVEL_BASE = 3;
var NEW_LIFE_SCORE = 10000;
var SPAWN_DISTANCE = 200;
var STARTING_LIFES = 30;
var HALO_SIZE = 70;


/**
 * The playScreen.init method initializes the game elements such as the player ship,
 * asteroids, saucer, debris, score, and life indicators.
 * It also sets up other necessary properties for gameplay.
 */
playScreen.init = function () {
  // Create and initialize the player ship
  Game.player = new (Function.prototype.bind.apply(Ship, [null].concat(p1Spawn, [playerKeys, playerVectors, 1.5, Game.firePlayer])))();
  Game.player.updateRotation(Math.random() * Math.PI * 2);

  // Initialize game elements
  Game.asteroids = [];
  Game.saucer = new Ship(0, 0, {}, saucerVectors, 5, Game.fireSaucer);
  Game.saucer.updateRotation(Math.PI * 2);
  Game.saucer.dead = true;
  Game.saucer.hidden = true;

  // Initialize debris
  Game.debris = new Debris(Game.player.x, Game.player.y, Game.player.speedX, Game.player.speedY);
  Game.debris.hidden = true;

  // Initialize score display
  Game.score = new Score(20, 20, 2);

  // Initialize life indicators
  Game.lifeIndicator = [];
  Game.level = 1;
  Game.life = STARTING_LIFES;

  // Create life indicators for the player
  for (var i = 0; i < Game.life; i++) {
    var indicator = new ShipCursor([[30 + 20 * i, 60]], playerVectors, 1.5);
    indicator.updateRotation(3 * Math.PI / 2);
    Game.lifeIndicator.push(indicator);
  }

  // Set up additional gameplay properties
  playScreen.interval = false;
  playScreen.newLifeAt = NEW_LIFE_SCORE;
  playScreen.loadAsteroids = true;
  playScreen.spawnDistance = SPAWN_DISTANCE;
};

/**
 * The playScreen.draw method is responsible for rendering all elements of the game screen.
 * It clears the canvas and then draws the player, asteroids, saucer, debris, score, and life indicators.
 * Additionally, it handles the pause status of the game and displays a halo effect around the player if needed.
 */
playScreen.draw = function () {
  // Clear the canvas by setting the entire canvas to a transparent black color.
  Game.context.clearRect(0, 0, Game.width, Game.height);

  // Draw the player's sprite.
  Game.player.draw();

  // Iterate through the asteroids array and draw each asteroid's sprite.
  Game.asteroids.forEach(function (value) {
    return value.draw();
  });

  // If the saucer is not hidden, draw its sprite.
  if (!Game.saucer.hidden) Game.saucer.draw();

  // If the debris is not hidden, draw its sprite.
  if (!Game.debris.hidden) Game.debris.draw();

  // Draw the current score on the screen.
  Game.score.draw();

  // Iterate through the lifeIndicator array and draw each life indicator's sprite.
  Game.lifeIndicator.forEach(function (value) {
    return value.draw();
  });

  // If the document does not have focus, pause the game and display "PAUSED" on the screen.
  if (!document.hasFocus()) {
    writeCentered(Game.height / 2, "PAUSED", 4);
  }

  // If the spawnHalo flag is true, draw a circle around the player.
  if (playScreen.spawnHalo) {
    drawCircle(Game.player.x, Game.player.y, playScreen.haloSize);
    // Gradually shrink the halo by multiplying its size by 0.90.
    playScreen.haloSize *= 0.90;
  }

  // Display the text "1979 Atari Inc" at the bottom of the screen, centered horizontally.
  writeCentered(660, "1979 Atari Inc", 1);
};

/**
 * The playScreen.update method updates the game state during play,
 * handling player and enemy input, updating sprite positions,
 * checking for collisions, and managing game logic.
 */
playScreen.update = function () {
  // If escape key is pressed, go back to the start screen
  if (Key.isDown(27)) {
    // Game.blip4();
    Game.changeState(startScreen);
  }

  // If the document loses focus, pause the game
  if (!document.hasFocus()) {
    return;
  }
  
  // Update the positions of all game sprites
  Game.asteroids.forEach(function (value) {
    return value.update();
  });
  if (!Game.debris.hidden) Game.debris.update();
  if (!Game.saucer.hidden) Game.saucer.update();
  Game.player.update();
  Game.debris.update();

  // Check for collisions between various game objects
  Game.asteroids.forEach(function (asteroid) {

    // Handle collisions between shots fired by the player and asteroids
    // 1. Iterate through each shot fired by the player
    // 2. Check for a collision between the shot and the asteroid
    // 3. Ensure that both the shot and the asteroid are not already dead
    // 4. If a collision occurs, trigger the explosion of both the shot and the asteroid

    // Iterate through each shot fired by the player
    Game.player.shots.forEach(function (shot) {
      // Check for a collision between the shot and the asteroid
      if (playScreen.checkCollision(asteroid, shot)) {
        // Ensure that neither the shot nor the asteroid are already dead
        if (!asteroid.dead && !shot.dead) {
          // Trigger explosions for both the shot and the asteroid upon collision
          asteroid.explode();
          shot.explode();
        }
      }
    });

    // Handle collisions between the player and asteroids
    // 1. Check for a collision between the player and the asteroid
    // 2. Ensure that both the player and the asteroid are not already dead
    // 3. If a collision occurs, trigger the explosion of both the player and the asteroid

    // Check for a collision between the player and the asteroid
    if (playScreen.checkCollision(Game.player, asteroid)) {
      // Ensure that neither the player nor the asteroid are already dead
      if (!asteroid.dead && !Game.player.dead) {
        // Trigger explosions for both the player and the asteroid upon collision
        Game.player.explode();
        asteroid.explode();
      }
    }

    // Handle asteroid destruction and manage resulting debris
    // 1. Check if the asteroid is dead and hasn't been processed yet (not splitted)
    // 2. Mark the asteroid as splitted to avoid processing it multiple times
    // 3. Based on the asteroid's size, create smaller asteroids and update the score

    // Check if the asteroid is dead and hasn't been processed yet
    if (asteroid.dead && !asteroid.splitted) {
      // Mark the asteroid as splitted to avoid further processing
      asteroid.splitted = true;

      // Handle asteroid destruction based on its size
      if (asteroid.size == BIG_ASTEROID) {
        // Update the score for destroying a big asteroid
        Game.score.score += 20;

        // Create two medium asteroids and add them to the game
        Game.asteroids.push(randomAsteroid(MED_ASTEROID, ASTEROID_MAX_SPEED, asteroid.x, asteroid.y));
        Game.asteroids.push(randomAsteroid(MED_ASTEROID, ASTEROID_MAX_SPEED, asteroid.x, asteroid.y));
      } else if (asteroid.size == MED_ASTEROID) {
        // Update the score for destroying a medium asteroid
        Game.score.score += 50;

        // Create two small asteroids and add them to the game
        Game.asteroids.push(randomAsteroid(SMA_ASTEROID, ASTEROID_MAX_SPEED, asteroid.x, asteroid.y));
        Game.asteroids.push(randomAsteroid(SMA_ASTEROID, ASTEROID_MAX_SPEED, asteroid.x, asteroid.y));
      } else {
        // Update the score for destroying a small asteroid
        Game.score.score += 100;
      }
    }
  });

  // Handle collisions between player, player's shots, saucer, and saucer's shots
  // 1. Create two collision arrays:
  //    - collisionArr1: contains player's shots and the player
  //    - collisionArr2: contains saucer's shots and the saucer
  // 2. Iterate through all possible combinations of elements from the two arrays
  // 3. Check for collisions and process the collision effects

  // Create the collision arrays containing shots and their respective owners
  var collisionArr1 = Game.player.shots.slice();
  collisionArr1.push(Game.player);
  var collisionArr2 = Game.saucer.shots.slice();
  collisionArr2.push(Game.saucer);

  // Iterate through all combinations of elements from collisionArr1 and collisionArr2
  for (var i = 0; i < collisionArr1.length; i++) {
    for (var j = 0; j < collisionArr2.length; j++) {
      var sprite1 = collisionArr1[i];
      var sprite2 = collisionArr2[j];

      // Check for collisions between sprite1 and sprite2, and ensure neither is already dead
      if (playScreen.checkCollision(sprite1, sprite2) && !sprite1.dead && !sprite2.dead) {
        // Process the collision effects: explode both sprites
        sprite1.explode();
        sprite2.explode();

        // If sprite2 is the saucer, update the score based on the saucer's size
        if (sprite2 === Game.saucer) {
          if (Game.saucer.size === BIG_SAUCER) {
            Game.score.score += 200;
          } else {
            Game.score.score += 1000;
          }
        }
      }
    }
  }

  // Remove dead asteroids from the game by following these steps:
  // 1. Iterate through the list of asteroids in the game
  // 2. Identify and store the indices of asteroids marked as "done" (i.e., dead)
  // 3. Remove the dead asteroids from the list by their indices
  var removeAsteroids = [];
  
  // Iterate through the list of asteroids and identify dead ones
  Game.asteroids.forEach(function (asteroid, index) {
    // If the asteroid is marked as "done", add its index to the list of dead asteroids
    if (asteroid.done) removeAsteroids.push(index);
  });
  
  // Remove the dead asteroids from the Game.asteroids list using their indices
  removeAsteroids.forEach(function (value) {
    return Game.asteroids.splice(value, 1);
  });

  // Proceed to the next level if all conditions are met:
  // 1. All asteroids are destroyed (Game.asteroids.length === 0)
  // 2. The saucer is destroyed (Game.saucer.dead)
  // 3. The loadAsteroids flag is set (playScreen.loadAsteroids)
  if (Game.asteroids.length === 0 && Game.saucer.dead && playScreen.loadAsteroids) {
    // Schedule the setup of the next level after a short delay
    setTimeout(function () {
      // Increment the game level
      Game.level++;

      // Populate the game with new asteroids, increasing their count based on the current level
      while (Game.asteroids.length < LEVEL_BASE + Game.level) {
        // Generate a random asteroid with specified size and maximum speed
        var asteroid = randomAsteroid(BIG_ASTEROID, ASTEROID_MAX_SPEED);

        // Calculate the distance between the new asteroid and the player
        var playerDistance = Math.hypot(asteroid.x - Game.player.x, asteroid.y - Game.player.y);

        // Add the asteroid to the game only if it is far enough from the player
        if (playerDistance > playScreen.spawnDistance) Game.asteroids.push(asteroid);
      }

      // Reset the loadAsteroids flag to allow the next level to be set up
      playScreen.loadAsteroids = true;
    }, 1000);

    // Set the loadAsteroids flag to false to prevent multiple level setups from being triggered
    playScreen.loadAsteroids = false;
  }

  // Check if the saucer is destroyed and a new saucer spawn is not already scheduled
  if (Game.saucer.dead && !playScreen.sauceScheduled) {
    // Set the sauceScheduled flag to prevent multiple saucer spawns from being scheduled simultaneously
    playScreen.sauceScheduled = true;

    // Calculate the spawn delay for the next saucer, taking into account the current game level and a random factor
    var nextSaucer = (1 / Game.level + 1 + Math.random()) * SAUCER_SCHEDULE;

    // Schedule the spawn of a new saucer after the calculated delay
    setTimeout(playScreen.spawnSaucer, nextSaucer);
  }

  // Check if the player's ship is destroyed and no other respawn event is in progress
  if (Game.player.dead && !playScreen.interval) {
    // Set the interval flag to prevent multiple respawn events from occurring simultaneously
    playScreen.interval = true;

    // Hide the player's ship and create debris at its last position
    Game.player.hidden = true;
    Game.debris = new Debris(Game.player.x, Game.player.y, Game.player.speedX, Game.player.speedY);

    // Hide the debris after a short delay
    setTimeout(function () {
      Game.debris.hidden = true;
    }, 2000);

    // If the player has no remaining lives, trigger the game over screen after a delay
    if (Game.life <= 1) {
      setTimeout(function () {
        Game.changeState(gameOverScreen);
      }, 1000);
    } else {
      // If the player has remaining lives, decrement life count, update the life indicator,
      // and schedule a new player ship to spawn after a delay
      Game.life--;
      Game.lifeIndicator.pop();
      setTimeout(playScreen.spawnPlayer, 1000);
    }
  }


  // Check if the player has activated hyperspace and if no other hyperspace event is in progress
  if (Game.player.hyperSpace == true && !playScreen.interval) {
    // Set the interval flag to prevent multiple hyperspace events from occurring simultaneously
    playScreen.interval = true;

    // Hide the player's ship during hyperspace transition
    Game.player.hidden = true;

    // Schedule the player's ship to reappear at a new location after a short delay
    setTimeout(playScreen.spawnPlayer, 50);
  }


  // Check if the player's score has reached or exceeded the threshold for gaining a new life
  if (Game.score.score >= playScreen.newLifeAt) {
    // Update the threshold for the next new life
    playScreen.newLifeAt += NEW_LIFE_SCORE;

    // Add an extra ship to the player's reserve
    Game.extraShip();

    // Increment the player's remaining lives
    Game.life++;

    // Create a new ship indicator for the life counter display
    var indicator = new ShipCursor([[30 + 20 * Game.lifeIndicator.length, 60]], playerVectors, 1.5);

    // Set the rotation of the ship indicator to face upwards
    indicator.updateRotation(3 * Math.PI / 2);

    // Add the new ship indicator to the life counter display
    Game.lifeIndicator.push(indicator);
  }

  // If Saucer is not dead then apply AI logic for movement, rotation, and shooting
  if (!Game.saucer.dead) {
    // Calculate basic vectors between the player and the saucer
    var p1dx = Game.player.x - Game.saucer.x;
    var p1dy = Game.player.y - Game.saucer.y;
    var p1r = Math.hypot(p1dx, p1dy);

    // Calculate the angle difference between the player and the saucer's current rotation
    var angleDelta = (Math.atan2(p1dy, p1dx) - Game.saucer.rotation) % (Math.PI * 2);

    // Normalize the angle difference to be within the range of -Math.PI to Math.PI
    angleDelta = angleDelta < Math.PI ? angleDelta : angleDelta - 2 * Math.PI;
    angleDelta = angleDelta < -Math.PI ? angleDelta + 2 * Math.PI : angleDelta;

    // Limit the angle difference to the saucer's maximum rotation speed
    angleDelta = Math.abs(angleDelta) < ROTATION_SPEED ? angleDelta : Math.sign(angleDelta) * ROTATION_SPEED;

    // Update the saucer's rotation based on the calculated angle difference
    Game.saucer.updateRotation(Game.saucer.rotation + angleDelta);

    // If the player is within firing range and the saucer is facing the player, fire a shot
    if (p1r < SHOT_DISTANCE && angleDelta < ROTATION_SPEED) {
      Game.saucer.fire();
    }

    // Activate the saucer's thrusters for movement
    Game.saucer.fireThrusters();
  }
};

/**
 * The playScreen.spawnPlayer method spawns the player ship at a random safe location
 * on the game screen, ensuring there is enough distance between the player ship
 * and other game objects such as asteroids and the saucer.
 */
playScreen.spawnPlayer = function () {
  // Generate random x and y coordinates for the player ship
  var x = Math.random() * Game.width / 2 + Game.width / 4;
  var y = Math.random() * Game.height / 2 + Game.height / 4;
  var objectTooClose = false;

  // Check if any asteroid is too close to the player spawn location
  Game.asteroids.forEach(function (asteroid) {
    var playerDistance = Math.hypot(asteroid.x - x, asteroid.y - y);
    if (playerDistance < playScreen.spawnDistance) objectTooClose = true;
  });

  // Check if the saucer is too close to the player spawn location
  var playerDistance = Math.hypot(Game.saucer.x - x, Game.saucer.y - y);
  if (playerDistance < playScreen.spawnDistance || objectTooClose) objectTooClose = true;

  // If any object is too close, decrease the spawn distance and try again after a short delay
  if (objectTooClose) {
    playScreen.spawnDistance -= 5;
    setTimeout(playScreen.spawnPlayer, 100);
    return;
  }

  // Reset the spawn distance and spawn the player ship
  playScreen.spawnDistance = SPAWN_DISTANCE;
  playScreen.interval = false;
  playScreen.haloSize = HALO_SIZE;
  playScreen.spawnHalo = true;

  // Remove the halo effect after 5 seconds
  setTimeout(function () {
    return playScreen.spawnHalo = false;
  }, 5000);

  // Create the player ship at the spawn location
  Game.player = new Ship(x, y, playerKeys, playerVectors, 1.5, Game.firePlayer);
  Game.player.updateRotation(Math.random() * Math.PI * 2);
};

/**
 * The playScreen.spawnSaucer method spawns a saucer at a random location on the game screen
 * while ensuring it is not too close to the player ship.
 */
playScreen.spawnSaucer = function () {
  // Generate random x and y coordinates for the saucer
  var x = Math.round(Math.random()) ? 0 : Game.width;
  var y = Math.random() * Game.height;
  
  // Determine saucer size randomly: BIG_SAUCER or SMA_SAUCER
  var saucerSize = Math.random() >= 0.5 ? BIG_SAUCER : SMA_SAUCER;

  // Check if the saucer spawn location is too close to the player ship
  if (Math.hypot(Game.player.x - x, Game.player.y - y) < playScreen.spawnDistance) {
    playScreen.spawnSaucer();
    return;
  }

  // Create the saucer at the spawn location
  Game.saucer = new Ship(x, y, {}, saucerVectors, saucerSize, Game.fireSaucer);
  Game.saucer.updateRotation(Math.PI);

  // Modify saucer properties
  Game.saucer.updateRotation = function (angle) {
    return Game.saucer.rotation = angle;
  };
  Game.saucer.thrustersLength = 0;
  Game.saucer.shotDistance = SHOT_DISTANCE / 3;
  Game.saucer.maxSpeed = MAX_SPEED / 3;
  Game.saucer.shotInterval = SHOT_INTERVAL * 10;
  Game.saucer.thrustersAcceleration = THRUSTERS_ACCELERATION / 2;
  Game.saucer.blastSize = BLAST_SIZE / 2;
  Game.saucer.thrustSound = saucerSize === BIG_SAUCER ? Game.saucerBig : Game.saucerSmall;
  
  // Mark saucer as not scheduled for spawning
  playScreen.sauceScheduled = false;
};

/**
 * The playScreen.rotateVector method rotates a given vector by the specified angle.
 * @param {Array} vector - The vector to be rotated.
 * @param {number} angle - The angle (in radians) to rotate the vector by.
 * @returns {Array} - The rotated vector.
 */
playScreen.rotateVector = function (vector, angle) {
  // Calculate the rotated vector coordinates
  var x = vector[0] * Math.cos(angle) - vector[1] * Math.sin(angle);
  var y = vector[1] * Math.cos(angle) + vector[0] * Math.sin(angle);

  // Return the rotated vector
  return [x, y];
};

/**
 * The playScreen.checkCollision method checks if two sprites collide
 * using their bounding boxes.
 * @param {Object} sprite1 - The first sprite object.
 * @param {Object} sprite2 - The second sprite object.
 * @returns {boolean} - True if the sprites collide, false otherwise.
 */
playScreen.checkCollision = function (sprite1, sprite2) {
  // Obtain the corner points of the sprites
  var p1c = sprite1.corners;
  var p2c = sprite2.corners;

  // Translate sprites to make p1c[0] the origin
  var p1cT = sprite1.corners.map(function (val) {
    return [val[0] - p1c[0][0], val[1] - p1c[0][1]];
  });
  var p2cT = sprite2.corners.map(function (val) {
    return [val[0] - p1c[0][0], val[1] - p1c[0][1]];
  });

  // Calculate the rotation to align the sprite1 bounding box
  var angle = Math.atan2(p1cT[2][1], p1cT[2][0]);

  // Rotate vectors to align
  var p1cTR = p1cT.map(function (val) {
    return playScreen.rotateVector(val, angle);
  });
  var p2cTR = p2cT.map(function (val) {
    return playScreen.rotateVector(val, angle);
  });

  // Calculate extreme points of the bounding boxes
  var p1left = Math.min.apply(Math, _toConsumableArray(p1cTR.map(function (value) {
    return value[0];
  })));
  var p1right = Math.max.apply(Math, _toConsumableArray(p1cTR.map(function (value) {
    return value[0];
  })));
  var p1top = Math.min.apply(Math, _toConsumableArray(p1cTR.map(function (value) {
    return value[1];
  })));
  var p1bottom = Math.max.apply(Math, _toConsumableArray(p1cTR.map(function (value) {
    return value[1];
  })));
  var p2left = Math.min.apply(Math, _toConsumableArray(p2cTR.map(function (value) {
    return value[0];
  })));
  var p2right = Math.max.apply(Math, _toConsumableArray(p2cTR.map(function (value) {
    return value[0];
  })));
  var p2top = Math.min.apply(Math, _toConsumableArray(p2cTR.map(function (value) {
    return value[1];
  })));
  var p2bottom = Math.max.apply(Math, _toConsumableArray(p2cTR.map(function (value) {
    return value[1];
  })));

  // Check if bounding boxes overlap in both axes
  if (p2left < p1right && p1left < p2right && p2top < p1bottom && p1top < p2bottom) return true;
  
  // If no overlap, return false
  return false;
};