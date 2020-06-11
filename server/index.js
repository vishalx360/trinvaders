// imports
const express = require("express");
const fs = require("fs");
// server game instance
const path = require('path');
const jsdom = require('jsdom');
// init
const app = express();
const http = require("http").createServer(app)
const io = require("socket.io")(http);

const DatauriParser = require('datauri/parser');
const parser = new DatauriParser();

const { JSDOM } = jsdom;
// middleware
app.use(express.static(__dirname + '/public'));
// routes
app.get("/", (req, res) => {
    res.sendFile(__dirname + '/index.html');
})

const PORT = process.env.PORT || 3000;

function setupAuthoritativePhaser() {
    JSDOM.fromFile(path.join(__dirname, 'authoritative_server/index.html'), {
        // To run the scripts in the html file
        runScripts: "dangerously",
        // Also load supported external resources
        resources: "usable",
        // So requestAnimatinFrame events fire
        pretendToBeVisual: true
    }).then((dom) => {
        dom.window.URL.createObjectURL = (blob) => {
            if (blob) {
                return parser.format(blob.type, blob[Object.getOwnPropertySymbols(blob)[0]]._buffer).content;
            }
        };
        dom.window.URL.revokeObjectURL = (objectURL) => {};
        dom.window.gameLoaded = () => {
            http.listen(PORT, () => {
                console.log(`############## Game Server started on http://localhost:${PORT}`)
            });
        }
        dom.window.io = io;
    }).catch((error) => {
        console.log(error.message)
    })
}

setupAuthoritativePhaser();
