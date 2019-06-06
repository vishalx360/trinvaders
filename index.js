var path = require("path");
var express = require("express");
var socket = require("socket.io");
var app = express();

app.use(express.static("client"));
app.get("/", function(req, res) {
  res.sendFile(__dirname + "/client/index.html");
});
app.get("/game", function(req, res) {
  res.sendFile(__dirname + "/client/game.html");
});

var server = app.listen(8081, function() {
  console.log("Hosted at http://localhost:8081");
});

// socket
var gameIo = socket(server);
// counter
var connectCounter = 0;

gameIo.on("connection", function(socket) {
  // counter operation - Adding to counter
  connectCounter++;
  // emitting player status
  gameIo.sockets.emit("newConnection", {
    playerId: socket.id,
    playerCounter: connectCounter
  });
  // local console :DEBUG
  console.log(
    `Players-Count: ${connectCounter}, Player:${socket.id} Connected, `
  );

  // disconnection
  socket.on("disconnect", function() {
    // counter operation
    connectCounter--;
    // emitting player status
    gameIo.sockets.emit("disconnect", {
      playerId: socket.id,
      playerCounter: connectCounter
    });
    // local console :DEBUG
    console.log(
      `Players-Count: ${connectCounter}, Player:${socket.id} Disconnected,`
    );
  });
});
