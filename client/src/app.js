var config = {
  type: Phaser.AUTO,

  width: window.innerWidth,
  height: window.innerHeight,
  orientation: "LANDSCAPE",
  physics: {
    default: "arcade",
    arcade: {
      fps: 60,
      gravity: {
        y: 0
      }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

var game = new Phaser.Game(config);

function preload() {
  // loading ship image
  this.load.image("ship", "assets/ship.png");
  // loading proShip image

  // this.load.image("proShip", "assets/shipWithBlaster.png");
}

var ship;
// var proShip;
var cursors;

function create() {
  // ship
  ship = this.physics.add.sprite(
    Math.floor(Math.random() * Math.floor(500)),
    Math.floor(Math.random() * Math.floor(500)),
    "ship"
  );
  ship.setDamping(true);
  ship.angle = -90;
  ship.setDrag(0.95);
  ship.setMaxVelocity(200);
  // proShip
  // proShip = this.physics.add.sprite(window.innerWidth / 3, 300, "proShip");
  // proShip.setDamping(true);
  // proShip.angle = -90;
  // proShip.setDrag(0.95);
  // proShip.setMaxVelocity(200);
  // initllizing crusor
  cursors = this.input.keyboard.createCursorKeys();
  // title
  gameTitle = this.add.text(10, 10, "", {
    font: "20px Monospace",
    fill: "#00ff00"
  });
  debug = this.add.text(10, 40, "", {
    font: "16px Monospace",
    fill: "#00ff00"
  });
  debug.setText("DEBUG");
  gameTitle.setText("Welcome to Trinveders[ALPHA]");
}

function update() {
  if (cursors.up.isDown) {
    this.physics.velocityFromRotation(
      ship.rotation,
      200,
      ship.body.acceleration
    );
  } else {
    ship.setAcceleration(0);
  }
  if (cursors.left.isDown) {
    ship.setAngularVelocity(-300);
  } else if (cursors.right.isDown) {
    ship.setAngularVelocity(300);
  } else {
    ship.setAngularVelocity(0);
  }

  this.physics.world.wrap(ship, 48);
  // sendUpdate(ship.x, ship.y, ship.angle);
}

// ClientSocket.on("movement", function(newPosition) {
//   ship.setPosition(newPosition.xPosition, newPosition.yPosition);
//   ship.angle = newPosition.shipRotation;
// });
