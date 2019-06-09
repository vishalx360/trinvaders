const gameState = {
  lobbyState: {
    players: {
      imehf: {
        username: "abcd"
      },
      lsceh: {
        username: "nagwxne"
      },
      hehlelkj: {
        username: "ksnegr"
      },
      awef: {
        username: "oang f"
      },
      oagf: {
        username: "ncsgfuyg"
      }
    }
  },
  playState: {
    players: {}
  }
};

// console.log(gameState.lobbyState.players["imehf"].username);
function say(username, id) {
  console.log(`Player ${username} has id:${id}`);
}
var lobbyPlayerList = gameState.lobbyState.players;
var lobbyPlayers = Object.keys(lobbyPlayerList);

for (player in lobbyPlayers) {
  var currentPlayer = lobbyPlayers[player];
  say(lobbyPlayerList[currentPlayer].username, currentPlayer);
}
