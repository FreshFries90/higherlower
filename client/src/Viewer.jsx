import { useState, useEffect } from "react";
import { io } from "socket.io-client";

// Google Font "Luckiest Guy" einbinden
const fontLink = document.createElement("link");
fontLink.href =
  "https://fonts.googleapis.com/css2?family=Luckiest+Guy&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

const socket = io("http://localhost:3001");

export default function Viewer() {
  const [players, setPlayers] = useState([]);
  const [directors, setDirectors] = useState([]);

  useEffect(() => {
    socket.emit("registerRole", "viewer");

    socket.on("playersUpdate", (data) => setPlayers(data));
    socket.on("directorsUpdate", (data) => setDirectors(data));

    return () => {
      socket.off("playersUpdate");
      socket.off("directorsUpdate");
    };
  }, []);

  // 🎨 Moderne Farbpalette für Regie + 4 Spieler
  const colorPalette = [
    "#7F5AF0", // Regie – Neon-Violett
    "#FBBF24", // Spieler 1 – TikTok-Gelb
    "#F472B6", // Spieler 2 – Bubblegum Pink
    "#06B6D4", // Spieler 3 – Cyan/Neonblau
    "#22C55E", // Spieler 4 – Limegrün
  ];

  const latestDirector = directors[directors.length - 1];
  const allVisible = [];

  if (latestDirector) {
    allVisible.push({ ...latestDirector, color: colorPalette[0], score: 0 });
  }

  players.forEach((p, i) => {
    allVisible.push({
      ...p,
      color: colorPalette[i + 1] || "#888",
      score: p.score || 0,
    });
  });

  const gap = 16;
  const maxHeight = 208; // fest gesetzt für 5 Teilnehmer + Gap
  const iframeHeight = maxHeight;
  const iframeWidth = (iframeHeight * 16) / 9;

  return (
    <div
      style={{
        width: "1920px",
        height: "1080px",
        overflow: "hidden",
        backgroundColor: "#000",
        position: "relative",
        fontFamily: "'Luckiest Guy', sans-serif",
        color: "#fff",
      }}
    >
      <div
        className="logo"
        style={{
          display: "flex",
          marginTop: "25px",
          justifyContent: "center",
          alignItems: "center",
          height: "20vh",
          position: "relative",
        }}
      >
        <img
          style={{
            height: "100%",
          }}
          src="logo.png"
          alt="Logo"
        />
      </div>
      <div
        className="frage"
        style={{ marginTop: "25px", fontSize: "45px", textAlign: "center" }}
      >
        Sortiere nach der Anzahl an Sitzplätzen im Stadion
      </div>
      {/* Zeitstrahl von 1–15 */}
      <div
        style={{
          position: "absolute",
          top: "375px",
          left: "15rem",
          right: "15rem",
          height: "30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1rem",
          fontSize: "1.2rem",
          color: "#fff",
          fontWeight: "normal",
          textShadow:
            "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
          fontFamily: "'Luckiest Guy', sans-serif",
        }}
      >
        {Array.from({ length: 15 }, (_, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            {i + 1}
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: "50px",
          top: "500px",
          fontSize: "35px",
        }}
      >
        Niedrig
      </div>
      <div
        style={{
          position: "absolute",
          right: "50px",
          top: "500px",
          fontSize: "35px",
        }}
      >
        Hoch
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          gap: `${gap}px`,
          padding: "1rem",
          boxSizing: "border-box",
        }}
      >
        {allVisible.map((person, i) => {
          const withAutoplay = (url) =>
            url.includes("?")
              ? url + "&autoplay&muted"
              : url + "?autoplay&muted";

          return (
            <div
              key={i}
              style={{
                flex: `1 1 ${iframeWidth}px`,
                maxWidth: `${iframeWidth}px`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                backgroundColor: person.color,
                borderRadius: "0.5rem",
                overflow: "hidden",
                boxSizing: "border-box",
              }}
            >
              <iframe
                src={withAutoplay(person.vdoLink)}
                allow="autoplay; camera; microphone"
                style={{
                  width: "100%",
                  height: `${iframeHeight}px`,
                  border: "none",
                  display: "block",
                  filter:
                    person.score === 0 && i !== 0 ? "grayscale(100%)" : "none",
                }}
                title={person.name}
              />
              <div
                style={{
                  width: "100%",
                  backgroundColor: "rgba(0,0,0,0.6)",
                  padding: "0.5rem 0.75rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "1.2rem",
                  fontWeight: "normal",
                  color: "#fff",
                  textShadow:
                    "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
                  boxSizing: "border-box",
                }}
              >
                <span>{person.name}</span>
                <span>
                  {i === 0
                    ? "Host"
                    : "❤️".repeat(person.score) + "🖤".repeat(3 - person.score)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
