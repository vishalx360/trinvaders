// gameLog ELEMENTS
var UIlog = document.getElementById("log");
var UIcounter = document.getElementById("playerCounter");
var UIplayerListDiv = document.getElementById("playerListDiv");
var UIstatus = document.getElementById("status");

UIstatus.addEventListener("change", function() {
  if (this.checked) {
    console.log("checked");
    ClientSocket.emit("status", true);
  } else {
    console.log("not checked");
    ClientSocket.emit("status", false);
  }
});

let gameState = {
  lobbyState: {
    players: {}
  },
  playState: {
    players: {}
  }
};

// check for localStorage:Username
function getUserName() {
  return localStorage.getItem("userName");
}
if (getUserName() == null) {
  promptName = prompt("Enter a Username");
  localStorage.setItem("userName", promptName);
  location.reload();
} else {
}

var ClientSocket = io.connect("http://localhost:8081/");
ClientSocket.emit("newPlayer", {
  username: getUserName()
});

function updateLobbyUi(state) {
  var items = "";

  function addPlayer(player, username, status) {
    //template
    var newStatus = "";
    var playerRelation = "";
    if (status) {
      newStatus = "ready";
    }
    if (player == ClientSocket.id) {
      playerRelation = " (YOU) ";
    }
    var playerNode =
      "<li><h2 class='" +
      newStatus +
      "'>" +
      username +
      playerRelation +
      "</h2><h3>" +
      player +
      "</h3></li>";

    items += playerNode;
  }

  var lobbyPlayers = Object.keys(state.players);

  for (player in lobbyPlayers) {
    var currentPlayer = lobbyPlayers[player];
    addPlayer(
      currentPlayer,
      state.players[currentPlayer].username,
      state.players[currentPlayer].status
    );
  }

  var playerList = "<ul>" + items + "</ul>";

  UIcounter.textContent = lobbyPlayers.length;

  UIplayerListDiv.innerHTML = playerList;
}

ClientSocket.on("lobbyStateUpdate", function(state) {
  gameState.lobbyState = state;
  updateLobbyUi(state);
});

ClientSocket.on("start", function(data) {
  console.log(data);
});

// DEBUG
ClientSocket.on("newConnection", function(data) {
  var newConnectLog = document.createElement("li");
  newConnectLog.textContent = "Connected: " + data.playerId;
  newConnectLog.style.color = "green";
  UIlog.appendChild(newConnectLog);
});
ClientSocket.on("disconnect", function(data) {
  var newDisconnectLog = document.createElement("li");
  newDisconnectLog.textContent = "Disconnected: " + data.playerId;
  newDisconnectLog.style.color = "red";
  UIlog.appendChild(newDisconnectLog);
});
