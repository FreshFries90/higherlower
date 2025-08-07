// server/index.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite Default-Port
    methods: ["GET", "POST"],
  },
});

app.use(cors());

// 🧠 Spieler-Daten speichern
let players = {};

let directors = {};

io.on("connection", (socket) => {
  console.log("Ein Client verbunden:", socket.id);
  socket.emit("playersUpdate", Object.values(players));
  socket.emit("directorsUpdate", Object.values(directors));

  // Spieler registrieren
  socket.on("registerPlayer", (playerData) => {
    players[socket.id] = {
      id: socket.id,
      name: playerData.name,
      vdoLink: playerData.vdoLink,
      score: 0,
    };

    console.log("Spieler registriert:", players[socket.id]);

    // An alle Viewer und Regie senden
    io.emit("playersUpdate", Object.values(players));
  });
  socket.on("updateScore", ({ socketId, newScore }) => {
    if (players[socketId]) {
      players[socketId].score = newScore;
      io.emit("playersUpdate", Object.values(players));
    }
  });
  // Spieler trennt Verbindung
  socket.on("disconnect", () => {
    if (players[socket.id]) {
      console.log("Spieler getrennt:", players[socket.id]);
      delete players[socket.id];
      io.emit("playersUpdate", Object.values(players));
    } else {
      console.log("Client getrennt:", socket.id);
    }
  });

  socket.on("registerDirector", (directorData) => {
    directors[socket.id] = {
      id: socket.id,
      name: directorData.name,
      vdoLink: directorData.vdoLink,
    };
    console.log("Regisseur registriert:", directors[socket.id]);
    io.emit("directorsUpdate", Object.values(directors));
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
