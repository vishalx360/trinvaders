var config = {
  type: Phaser.AUTO,

  width: window.innerWidth,
  height: window.innerHeight,
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
    render: render,
    preload: preload,
    create: create,
    update: update
  }
};

var ship;
var proShip;
var cursors;

var shipDetails;

var game = new Phaser.Game(config);

function preload() {
  this.load.image("bullet", "assets/bullets.png");
  this.load.image("ship", "assets/ship.png");
  this.load.image("proShip", "assets/shipWithBlaster.png");
  console.log(this);
}

function create() {
  ship = this.physics.add.sprite(
    window.innerWidth / 2,
    window.innerHeight / 2,
    "ship"
  );

  ship.setDamping(true);
  ship.angle = -90;
  ship.setDrag(0.95);
  ship.setMaxVelocity(200);

  proShip = this.physics.add.sprite(window.innerWidth / 3, 300, "proShip");

  proShip.setDamping(true);
  proShip.angle = -90;
  proShip.setDrag(0.95);
  proShip.setMaxVelocity(200);

  cursors = this.input.keyboard.createCursorKeys();

  gameTitle = this.add.text(10, 10, "", {
    font: "20px Monospace",
    fill: "#00ff00"
  });

  gameTitle.setText("Welcome to Trinveders[ALPHA]");
  // GameFps = this.add.text(10, 70, "", {
  //   font: "16px Monospace",
  //   fill: "#00ff00"
  // });
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

  this.world.wrap(ship, 0);
}
function render() {}
// software joystick
// var up = document.getElementById("up");
// var left = document.getElementById("left");
// var right = document.getElementById("right");

// up.addEventListener("click", function() {});
// left.addEventListener("click", function() {});
// right.addEventListener("click", function() {});
