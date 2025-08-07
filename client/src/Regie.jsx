import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

export default function Regie() {
  const [name, setName] = useState("");
  const [vdoLink, setVdoLink] = useState("");
  const [registered, setRegistered] = useState(false);

  const [players, setPlayers] = useState([]);
  const [scoreInputs, setScoreInputs] = useState({});

  const [frage, setFrage] = useState(null);
  const [alleFragen, setAlleFragen] = useState([]);
  const [ausgewaehlteId, setAusgewaehlteId] = useState("");

  useEffect(() => {
    if (registered) {
      socket.emit("registerDirector", { name, vdoLink });
    }
  }, [registered]);

  useEffect(() => {
    socket.on("playersUpdate", (data) => {
      setPlayers(data);
      const initialScores = {};
      data.forEach((p) => {
        initialScores[p.id] = p.score ?? 0;
      });
      setScoreInputs(initialScores);
    });

    socket.on("receiveAllQuestions", (data) => {
      setAlleFragen(data);
    });

    return () => {
      socket.off("playersUpdate");
      socket.off("receiveAllQuestions");
    };
  }, []);

  useEffect(() => {
    socket.emit("requestAllQuestions");
  }, []);

  const handleRegister = (e) => {
    e.preventDefault();
    setRegistered(true);
  };

  const updateScore = (socketId, newScore) => {
    socket.emit("updateScore", { socketId, newScore });
  };

  const handleInputChange = (socketId, value) => {
    const numeric = parseInt(value, 10);
    if (!isNaN(numeric)) {
      setScoreInputs((prev) => ({ ...prev, [socketId]: numeric }));
    }
  };

  const handleSet = (socketId) => {
    const newScore = scoreInputs[socketId];
    updateScore(socketId, newScore);
  };

  const handleSelectChange = (e) => {
    const selectedId = e.target.value;
    setAusgewaehlteId(selectedId);
    const selected = alleFragen.find((f) => f.id === selectedId);
    setFrage(selected || null);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      {!registered ? (
        <>
          <h1>Regie Registrierung</h1>
          <form
            onSubmit={handleRegister}
            style={{
              maxWidth: "400px",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
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
          <h2>Willkommen in der Regie, {name}!</h2>

          {/* Punktestand Verwaltung */}
          <h3>Spieler & Punktestände</h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {players.map((player) => (
              <div
                key={player.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#eee",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                }}
              >
                <div style={{ flex: 1 }}>
                  <strong>{player.name}</strong> ({player.score ?? 0} Punkte)
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="number"
                    value={scoreInputs[player.id] ?? ""}
                    onChange={(e) =>
                      handleInputChange(player.id, e.target.value)
                    }
                    style={{ width: "80px" }}
                  />
                  <button onClick={() => handleSet(player.id)}>Setzen</button>
                </div>
              </div>
            ))}
          </div>

          {/* Frage auswählen */}
          <div style={{ marginTop: "3rem" }}>
            <label>
              Frage auswählen:
              <select
                value={ausgewaehlteId}
                onChange={handleSelectChange}
                style={{ marginLeft: "1rem", padding: "0.5rem" }}
              >
                <option value="">-- Frage wählen --</option>
                {alleFragen.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.id} – {f.frage}
                  </option>
                ))}
              </select>
            </label>

            {frage && (
              <div style={{ marginTop: "2rem" }}>
                <h2>{frage.frage}</h2>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "1rem",
                    marginTop: "1rem",
                  }}
                >
                  {frage.antworten.map((antwort, index) => (
                    <div
                      key={index}
                      style={{
                        width: 160,
                        textAlign: "center",
                        fontSize: "0.9rem",
                        border: "1px solid #ccc",
                        padding: "0.5rem",
                        borderRadius: "0.5rem",
                      }}
                    >
                      <img
                        src={antwort.image}
                        alt={antwort.name}
                        style={{
                          width: 100,
                          height: 100,
                          objectFit: "cover",
                          borderRadius: "6px",
                        }}
                      />
                      <div style={{ marginTop: "0.5rem", fontWeight: "bold" }}>
                        {antwort.name}
                      </div>
                      <div style={{ color: "#666" }}>{antwort.loesung}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
