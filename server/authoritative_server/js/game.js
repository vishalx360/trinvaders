var config = {
    type: Phaser.HEADLESS,
    width: 800,
    height: 600,
    autoFocus: false,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};


const players = {}



function preload() {
    // this.load.setBaseURL("http://localhost:8001/")
    this.load.image('myShip', 'assets/green_ship.png');
    this.load.image('otherPlayer', 'assets/red_ship.png');



}

function create() {
    const self = this
    this.players = this.physics.add.group();


    io.on("connection", (socket) => {
        console.log("Socket connected: ", socket.id)
            // create a new player and add it to our players object
        players[socket.id] = {
            rotation: 0,
            x: Math.floor(Math.random() * 700) + 50,
            y: Math.floor(Math.random() * 500) + 50,
            playerId: socket.id,
            input: {
                left: false,
                right: false,
                up: false
            }
        };
        // add player to server
        addPlayer(self, players[socket.id]);
        // send the players object to the new player
        socket.emit("currentPlayers", players);
        // update all the players of the new player
        socket.broadcast.emit('newPlayer', players[socket.id]);

        socket.on("disconnect", () => {
            // remove player from server
            removePlayer(self, socket.id);
            // remove this player from our players object
            delete players[socket.id];
            // emit a message to all players to remove this player
            io.emit('disconnect', socket.id)
            console.log(socket.id, "disconnected")
        })

        // playerInput
        socket.on("playerInput", function(inputData) {
            handelPlayerInput(self, socket.id, inputData)
        })
    })


}

function update() {
    this.players.getChildren().forEach((player) => {
        const input = players[player.playerId].input
        if (input.left) {
            player.setAngularVelocity(-300);
        } else if (input.right) {
            player.setAngularVelocity(300);
        } else {
            player.setAngularVelocity(0);
        }

        if (input.up) {
            this.physics.velocityFromRotation(player.rotation + 1.5, 200, player.body.acceleration)
        } else {
            player.setAcceleration(0);
        }

        players[player.playerId].x = player.x;
        players[player.playerId].y = player.y;
        players[player.playerId].rotation = player.rotation;

    });
    this.physics.world.wrap(this.players, 5);
    io.emit('playerUpdates', players);
}

function handelPlayerInput(self, playerId, input) {
    self.players.getChildren().forEach((player) => {
        if (playerId === player.playerId) {
            players[player.playerId].input = input;
        }
    })
}

function addPlayer(self, playerInfo) {
    const player = self.physics.add.image(playerInfo.x, playerInfo.y, 'myShip').setOrigin(0.5, 0.5).setDisplaySize(70, 53);
    player.setDrag(100);
    player.setAngularDrag(100);
    player.setMaxVelocity(200);
    player.playerId = playerInfo.playerId
    self.players.add(player)
}

function removePlayer(self, playerId) {
    self.players.getChildren().forEach((player) => {
        if (playerId === player.playerId) {
            player.destroy();
        }
    })
}

const game = new Phaser.Game(config);

window.gameLoaded();