// imports
const express = require("express");

// server game instance
const path = require('path');
const jsdom = require('jsdom')
    // init
const app = express();
const http = require("http").createServer(app)
const io = require("socket.io")(http);

const { JSDOM } = jsdom;


app.use(express.static('public'))

app.get("/", (req, res) => {
    res.sendFile("/public/index.html");
})

const players = {}





io.on("connection", (socket) => {
    console.log("Socket connection: ", socket.id)

    players[socket.id] = {
        x: Math.floor(Math.random(100, 200)) + 1,
        y: Math.random(100, 200)
    }
    io.sockets.emit("new_player", players[socket.id])

    socket.on("disconnect", () => {

        console.log(socket.id, "disconnected")
    })
})




function setupAuthoritativePhaser() {
    JSDOM.fromFile(path.join(__dirname, 'authoritative_server/index.html'), {
        // To run the scripts in the html file
        runScripts: "dangerously",
        // Also load supported external resources
        resources: "usable",
        // So requestAnimatinFrame events fire
        pretendToBeVisual: true
    }).then((dom) => {

        dom.window.gameLoaded = () => {
            http.listen(8001, () => {
                console.log("Game Server started on http://localhost:8001")
            });
        }

    }).catch((error) => { console.log(error.message) })
}

setupAuthoritativePhaser();