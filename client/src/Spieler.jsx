import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

export default function Spieler() {
  const [name, setName] = useState("");
  const [vdoLink, setVdoLink] = useState("");
  const [registered, setRegistered] = useState(false);

  const [frage, setFrage] = useState(null);
  const [sortierteAntworten, setSortierteAntworten] = useState([]);
  const [verbleibendeAntworten, setVerbleibendeAntworten] = useState([]);

  useEffect(() => {
    socket.emit("requestCurrentQuestion");

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
      socket.off("receiveQuestion");
      socket.off("antwortAktualisieren");
    };
  }, []);

  const handleRegister = (e) => {
    e.preventDefault();
    socket.emit("registerPlayer", { name, vdoLink });
    setRegistered(true);
  };

  const blink = (color) => {
    const el = document.getElementById("screen");
    if (!el) return;
    el.style.transition = "background-color 0.3s";
    el.style.backgroundColor = color;
    setTimeout(() => {
      el.style.backgroundColor = "";
    }, 300);
  };

  return (
    <div
      id="screen"
      style={{ padding: "2rem", fontFamily: "sans-serif", minHeight: "100vh" }}
    >
      {!registered ? (
        <>
          <h1>Spieler Registrierung</h1>
          <form
            onSubmit={handleRegister}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              maxWidth: "400px",
            }}
          >
            <label>
              Name:
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            <label>
              VDO.Ninja Link:
              <input
                type="url"
                value={vdoLink}
                onChange={(e) => setVdoLink(e.target.value)}
                required
              />
            </label>

            <button type="submit">Registrieren</button>
          </form>
        </>
      ) : (
        <>
          {frage && (
            <>
              <h2>{frage.frage}</h2>

              {/* Sortierte Antworten oben */}
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  margin: "1rem 0",
                  padding: "1rem",
                  border: "2px dashed #ccc",
                  minHeight: 120,
                  overflowX: "auto",
                  justifyContent: "center",
                }}
              >
                {sortierteAntworten.map((antwort, i) => (
                  <div
                    key={antwort.name}
                    style={{
                      width: 80,
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
                        width: "100%",
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

              {/* Verbleibende Antworten */}
              <h4>Verbleibende Antworten</h4>
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  flexWrap: "wrap",
                  padding: "1rem",
                  border: "2px solid #ccc",
                  justifyContent: "center",
                }}
              >
                {verbleibendeAntworten.map((antwort, i) => (
                  <div
                    key={antwort.name}
                    style={{
                      width: 80,
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
                        width: "100%",
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
            </>
          )}
        </>
      )}
    </div>
  );
}
