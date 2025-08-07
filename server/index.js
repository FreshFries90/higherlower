// server/index.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const parse = require("csv-parse/sync");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite-Frontend
    methods: ["GET", "POST"],
  },
});

app.use(cors());

// 🧠 In-Memory-Speicher
let players = {};
let directors = {};
let fragen = [];

// 📥 CSV-Datei einlesen
function loadFragen() {
  const filePath = path.join(__dirname, "fragen.csv");

  if (!fs.existsSync(filePath)) {
    console.error("❌ Fragen-Datei nicht gefunden:", filePath);
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  // 👉 Semikolon als Trenner verwenden
  const records = parse.parse(content, {
    delimiter: ";",
    skip_empty_lines: true,
  });

  // Header überspringen und alle Zellen trimmen
  fragen = records.slice(1).map((row) => {
    const cleanedRow = row.map((val) => String(val).trim());
    const id = cleanedRow[0];
    const frageText = cleanedRow[1];

    const antworten = [];

    for (let j = 0; j < 15; j++) {
      const name = cleanedRow[2 + j * 2];
      const loesung = cleanedRow[3 + j * 2];

      antworten.push({
        name,
        loesung,
        image: `/fragen/${id}/${j + 1}.png`,
        position: j + 1,
      });
    }

    return {
      id,
      frage: frageText,
      antworten,
    };
  });

  console.log(`✅ ${fragen.length} Fragen geladen`);
}

loadFragen();

io.on("connection", (socket) => {
  console.log("🔌 Client verbunden:", socket.id);

  // Initialdaten senden
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
    console.log("➕ Spieler registriert:", players[socket.id]);
    io.emit("playersUpdate", Object.values(players));
  });

  // Punkte aktualisieren
  socket.on("updateScore", ({ socketId, newScore }) => {
    if (players[socketId]) {
      players[socketId].score = newScore;
      io.emit("playersUpdate", Object.values(players));
    }
  });

  // Regie registrieren
  socket.on("registerDirector", (directorData) => {
    directors[socket.id] = {
      id: socket.id,
      name: directorData.name,
      vdoLink: directorData.vdoLink,
    };
    console.log("🎬 Regie registriert:", directors[socket.id]);
    io.emit("directorsUpdate", Object.values(directors));
  });

  // 🎲 Zufällige Frage anfordern
  socket.on("requestRandomQuestion", () => {
    if (fragen.length === 0) return;

    const index = Math.floor(Math.random() * fragen.length);
    const frage = fragen[index];

    socket.emit("receiveQuestion", frage);
    console.log("📤 Zufällige Frage gesendet:", frage.frage);
  });

  // 📋 Alle Fragen anfordern
  socket.on("requestAllQuestions", () => {
    socket.emit("receiveAllQuestions", fragen);
  });

  // Verbindung trennen
  socket.on("disconnect", () => {
    if (players[socket.id]) {
      console.log("❌ Spieler getrennt:", players[socket.id]);
      delete players[socket.id];
      io.emit("playersUpdate", Object.values(players));
    } else if (directors[socket.id]) {
      console.log("❌ Regie getrennt:", directors[socket.id]);
      delete directors[socket.id];
      io.emit("directorsUpdate", Object.values(directors));
    } else {
      console.log("❌ Client getrennt:", socket.id);
    }
  });
});

// Server starten
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});
