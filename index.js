const path = require("path");
const express = require("express");
const socket = require("socket.io");
const app = express();

app.use(express.static("public"));
app.get("/", function(req, res) {
  res.sendFile(__dirname + "/public/index.html");
});
app.get("/game", function(req, res) {
  res.sendFile(__dirname + "/public/game.html");
});

const server = app.listen(8081, function() {
  console.log("Hosted at http://localhost:8081");
});

// socket
const io = socket(server);
// counter
var connectedCounter = 0;

var playerList = [];

const gameState = {
  players: {}
};

function ShipBluePrint(id, x, y) {
  this.id = id;
  this.xPosition = x;
  this.yPosition = y;
}

io.on("connection", function(socket) {
  // counter operation - Adding to counter
  //
  connectedCounter++;
  // emitting player status
  io.sockets.emit("newConnection", {
    playerId: socket.id,
    playerCounter: connectedCounter
  });
  // local console :DEBUG
  console.log(
    `Players-Count: ${connectedCounter}, Player:${socket.id} Connected, `
  );

  //start
  socket.on("newPlayer", function(data) {
    gameState.players[socket.id] = {
      xPosition: data.xPosition,
      yPosition: data.yPosition
    };
    console.log(gameState.players);
  });

  // disconnection
  socket.on("disconnect", function() {
    delete gameState.players[socket.id];
    // counter operation
    connectedCounter--;
    // emitting player status
    io.sockets.emit("disconnect", {
      playerId: socket.id,
      playerCounter: connectedCounter
    });
    // local console :DEBUG
    console.log(
      `Players-Count: ${connectedCounter}, Player:${socket.id} Disconnected,`
    );
    console.log(gameState.players);
  });
});
