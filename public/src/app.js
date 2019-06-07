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
var myShip;
var cursors;
var playerList = {};

function addShip(player, playerID, givenScene) {
  var ship;
  ship = givenScene.physics.add.sprite(
    player.xPosition,
    player.yPosition,
    "ship"
  );
  ship.setDamping(true);
  ship.angle = -90;
  ship.setDrag(0.95);
  ship.setMaxVelocity(200);

  playerList[playerID] = {
    xPosition: player.xPosition,
    yPosition: player.xPosition
  };
}

function create() {
  // ship sprite

  myShip = this.physics.add.sprite(
    Math.floor(Math.random() * Math.floor(500)),
    Math.floor(Math.random() * Math.floor(500)),
    "ship"
  );
  myShip.setDamping(true);
  myShip.angle = -90;
  myShip.setDrag(0.95);
  myShip.setMaxVelocity(200);

  playerList[ClientSocket.id] = {
    xPosition: myShip.x,
    yPosition: myShip.y
  };

  ClientSocket.emit("newPlayer", {
    xPosition: myShip.x,
    yPosition: myShip.y
  });

  var that = this;
  ClientSocket.on("state", function(gameState) {
    // check if player is already drawn by checking the PlayerList
    for (let player in gameState.players) {
      if (Object.keys(playerList).indexOf(player) > -1) {
        // its already created
      } else {
        addShip(gameState.players[player], player, that);
      }
    }

    // try to remove player who is disconncted
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
      myShip.rotation,
      100,
      myShip.body.acceleration
    );
  } else {
    myShip.setAcceleration(0);
  }
  if (cursors.left.isDown) {
    myShip.setAngularVelocity(-300);
  } else if (cursors.right.isDown) {
    myShip.setAngularVelocity(300);
  } else {
    myShip.setAngularVelocity(0);
  }

  this.physics.world.wrap(myShip, 48);
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
