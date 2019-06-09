var ClientSocket = io.connect("http://localhost:8081/");
// for server to keep list of players

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
