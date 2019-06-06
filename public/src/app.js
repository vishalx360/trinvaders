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
var ClientSocket = io.connect("http://localhost:8081/");

// Game Initilization
var game = new Phaser.Game(config);

function preload() {
  // loading ship image
  this.load.image("ship", "assets/ship.png");
}
var ship;
var cursors;

function ShipBluePrint(x, y, id) {
  this.id = id;
  this.xPosition = x;
  this.yPosition = y;
}

function create() {
  // ship sprite
  ship = this.physics.add.sprite(
    Math.floor(Math.random() * Math.floor(500)),
    Math.floor(Math.random() * Math.floor(500)),
    "ship"
  );

  ship.setDamping(true);
  ship.angle = -90;
  ship.setDrag(0.95);
  ship.setMaxVelocity(200);

  ClientSocket.emit("newPlayer", {
    xPosition: ship.x,
    yPosition: ship.y
  });

  // initllizing crusor
  cursors = this.input.keyboard.createCursorKeys();
  // title
  gameTitle = this.add.text(10, 10, "", {
    font: "20px Monospace",
    fill: "#00ff00"
  });

  gameTitle.setText("Trinveders[ALPHA]");
}

function update() {
  if (cursors.up.isDown) {
    this.physics.velocityFromRotation(
      ship.rotation,
      100,
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
}

// ClientSocket.on("movement", function(newPosition) {
//   ship.setPosition(newPosition.xPosition, newPosition.yPosition);
//   ship.angle = newPosition.shipRotation;
// });

// gameLog ELEMENTS
var log = document.getElementById("log");
var counter = document.getElementById("playerCounter");

ClientSocket.on("newConnection", function(data) {
  var newConnectLog = document.createElement("li");
  newConnectLog.textContent = "Connected: " + data.playerId;
  newConnectLog.style.color = "green";
  log.appendChild(newConnectLog);
  counter.textContent = data.playerCounter;
});
ClientSocket.on("disconnect", function(data) {
  var newDisconnectLog = document.createElement("li");
  newDisconnectLog.textContent = "Disconnected: " + data.playerId;
  newDisconnectLog.style.color = "red";
  log.appendChild(newDisconnectLog);
  counter.textContent = data.playerCounter;
});
