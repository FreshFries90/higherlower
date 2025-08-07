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
  const maxViewerWidth = 1920;
  const maxHeight = 350;

  const totalGaps = (allVisible.length - 1) * gap;
  const availableWidth = maxViewerWidth - totalGaps;

  let iframeWidth =
    allVisible.length > 0 ? availableWidth / allVisible.length : 0;
  let iframeHeight = (iframeWidth * 9) / 16;

  if (iframeHeight > maxHeight) {
    iframeHeight = maxHeight;
    iframeWidth = (iframeHeight * 16) / 9;
  }

  return (
    <div
      style={{
        width: "1920px",
        height: "1080px",
        overflow: "hidden",
        position: "relative",
        fontFamily: "'Luckiest Guy', sans-serif",
        color: "#fff",
      }}
    >
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
                <span>{i === 0 ? "Host" : `${person.score} P`}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
