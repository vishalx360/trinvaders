// IMPORTING LIBRARY
const path = require("path");
const express = require("express");
const socket = require("socket.io");

// initialization of EXPRESS-APP
const app = express();

// setting static to PUBLIC directory
app.use(express.static("public"));

// ROUTING
app.get("/", function(req, res) {
  res.sendFile(__dirname + "/public/index.html");
});
app.get("/lobby", function(req, res) {
  res.sendFile(__dirname + "/public/lobby.html");
});
app.get("/game", function(req, res) {
  res.sendFile(__dirname + "/public/game.html");
});

// initialization of SERVER
const server = app.listen(8081, function() {
  console.log("Hosted at http://localhost:8081");
});

// initialization of SOCKET
const io = socket(server);

const gameState = {
  lobbyState: {
    players: {}
  },
  playState: {
    players: {}
  }
};
// Direct Variable for ease
var lobbyPlayerList = gameState.lobbyState.players;
// server reserved variable : counter
var counter = 0;

// listining for CONNECTION
io.on("connection", function(socket) {
  counter++;
  //lobby adding
  socket.on("newPlayer", function(data) {
    lobbyPlayerList[socket.id] = { username: data.username };
    console.log(lobbyPlayerList);
    io.sockets.emit("lobbyStateUpdate", gameState.lobbyState);
  });
  // status listener
  socket.on("status", function(ready) {
    if (ready) {
      console.log(socket.id + " is ready");
      lobbyPlayerList[socket.id].status = true;
      checkAllReady();
    } else {
      console.log(socket.id + " is not ready");
      lobbyPlayerList[socket.id].status = false;
    }

    function checkAllReady() {
      var list = Object.keys(lobbyPlayerList);
      if (list.length >= 2) {
        list.forEach(function(player) {
          if (lobbyPlayerList[player].status) {
            io.sockets.emit("start", "starting...");
          }
        });
      }
    }
  });

  // DEBUG LOG
  io.sockets.emit("newConnection", { playerId: socket.id });
  // local console :DEBUG
  console.log(`Connected:${socket.id}. Counter:${counter}`);

  // disconnection
  socket.on("disconnect", function() {
    counter--;

    delete lobbyPlayerList[socket.id];
    io.sockets.emit("lobbyStateUpdate", gameState.lobbyState);
    // DEBUG LOG
    io.sockets.emit("disconnect", { playerId: socket.id });
    // local console :DEBUG
    console.log(`Disconnected:${socket.id}. Counter:${counter}`);
  });
});
setInterval(() => {
  io.sockets.emit("lobbyStateUpdate", gameState.lobbyState);
}, 1000 / 0.2);
