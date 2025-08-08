import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("https://higherlower-5y6f.onrender.com/");

export default function Viewer() {
  const [players, setPlayers] = useState([]);
  const [directors, setDirectors] = useState([]);

  const [frage, setFrage] = useState(null);
  const [sortierteAntworten, setSortierteAntworten] = useState([]);
  const [verbleibendeAntworten, setVerbleibendeAntworten] = useState([]);

  useEffect(() => {
    socket.emit("registerRole", "viewer");
    socket.emit("requestCurrentQuestion");
    socket.on("playersUpdate", (data) => setPlayers(data));
    socket.on("directorsUpdate", (data) => setDirectors(data));

    socket.on("receiveQuestion", (data) => {
      setFrage(data.frage);
      setSortierteAntworten(data.sortierteAntworten);
      setVerbleibendeAntworten(data.verbleibendeAntworten);
    });

    socket.on("antwortAktualisieren", ({ antwort, index, korrekt }) => {
      if (korrekt) {
        setSortierteAntworten((prev) => {
          const already = prev.find((a) => a.name === antwort.name);
          if (already) return prev;
          const updated = [...prev];
          updated.splice(index, 0, antwort);
          return updated;
        });

        setVerbleibendeAntworten((prev) =>
          prev.filter((a) => a.name !== antwort.name)
        );
      }

      blink(korrekt ? "green" : "red");
    });

    return () => {
      socket.off("playersUpdate");
      socket.off("directorsUpdate");
      socket.off("receiveQuestion");
      socket.off("antwortAktualisieren");
    };
  }, []);

  const blink = (color) => {
    const el = document.getElementById("full");
    if (!el) return;
    el.style.transition = "background-color 0.3s";
    el.style.backgroundColor = color;
    setTimeout(() => {
      el.style.backgroundColor = "";
    }, 300);
  };

  const colorPalette = [
    "#7F5AF0", // Regie
    "#FBBF24", // Spieler 1
    "#F472B6", // Spieler 2
    "#06B6D4", // Spieler 3
    "#22C55E", // Spieler 4
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
      score: p.score ?? 0,
      punkte: p.punkte ?? 0,
    });
  });

  const gap = 16;
  const maxHeight = 208;
  const iframeHeight = maxHeight;
  const iframeWidth = (iframeHeight * 16) / 9;

  return (
    <div
      id="screen"
      style={{
        width: "1920px",
        height: "1080px",
        overflow: "hidden",
        backgroundColor: "#000",
        backgroundImage: "url(/bg.png)",
        backgroundSize: "cover",
        position: "relative",
        fontFamily: "'Luckiest Guy', sans-serif",
        color: "#fff",
      }}
    >
      <div
        id="full"
        style={{
          width: "1920px",
          height: "1080px",
        }}
      >
        <div
          className="logo"
          style={{ textAlign: "center", paddingTop: "150px" }}
        ></div>
        <div
          style={{
            textAlign: "center",
            fontSize: "45px",
            margin: "1rem 0",
          }}
        >
          {frage?.frage || "Warte auf Frage..."}
        </div>

        {/* Sortierte Antworten */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            margin: "1rem",
            padding: "1rem",
            minHeight: 120,
            overflowX: "auto",
            justifyContent: "center",
            flexWrap: "nowrap",
          }}
        >
          {sortierteAntworten.map((antwort) => (
            <div
              key={antwort.name}
              style={{
                width: 93,
                textAlign: "center",
                border: "1px solid #ccc",
                borderRadius: "0.5rem",
                background: "#eee",
                padding: "0.5rem",
              }}
            >
              <img
                src={antwort.image}
                alt={antwort.name}
                style={{
                  width: 60,
                  height: 60,
                  objectFit: "cover",
                  borderRadius: "4px",
                }}
              />
              <div
                style={{
                  fontSize: "0.7rem",
                  marginTop: "0.5rem",
                  color: "#000",
                  fontFamily: "sans-serif",
                  fontWeight: "bold",
                  hyphens: "auto",
                  overflowWrap: "break-word",
                  wordBreak: "normal",
                }}
                lang="de"
              >
                {antwort.name}
              </div>
            </div>
          ))}
        </div>

        <h4 style={{ textAlign: "center" }}>Verbleibende Antworten</h4>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            padding: "1rem",
            justifyContent: "center",
          }}
        >
          {verbleibendeAntworten.map((antwort) => (
            <div
              key={antwort.name}
              style={{
                width: 93,
                textAlign: "center",
                borderRadius: "0.5rem",
                background: "#eee",
                padding: "0.5rem",
              }}
            >
              <img
                src={antwort.image}
                alt={antwort.name}
                style={{
                  width: 60,
                  height: 60,
                  objectFit: "cover",
                  borderRadius: "4px",
                }}
              />
              <div
                style={{
                  fontSize: "0.7rem",
                  marginTop: "0.5rem",
                  color: "#000",
                  fontFamily: "sans-serif",
                  fontWeight: "bold",
                  hyphens: "auto",
                  overflowWrap: "break-word",
                  wordBreak: "normal",
                }}
                lang="de"
              >
                {antwort.name}
              </div>
            </div>
          ))}
        </div>

        {/* Streams */}
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
                <div
                  style={{
                    width: "100%",
                    textAlign: "center",
                    backgroundColor: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    padding: "0.25rem 0",
                    fontSize: "1rem",
                    height: "30px",
                  }}
                >
                  {i === 0 ? "" : `${person.punkte ?? 0} Punkte`}
                </div>

                <iframe
                  src={withAutoplay(person.vdoLink)}
                  allow="autoplay; camera; microphone"
                  style={{
                    width: "100%",
                    height: `${iframeHeight}px`,
                    border: "none",
                    display: "block",
                    filter:
                      person.score === 0 && i !== 0
                        ? "grayscale(100%)"
                        : "none",
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
                    height: "26px",
                    textShadow:
                      "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
                  }}
                >
                  <span
                    style={{
                      marginLeft: "10px",
                    }}
                  >
                    {person.name}
                  </span>
                  <span
                    style={{
                      marginRight: "10px",
                    }}
                  >
                    {i === 0
                      ? "Host"
                      : "❤️".repeat(person.score) +
                        "🖤".repeat(3 - person.score)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
