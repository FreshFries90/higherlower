import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const socket = io("https://higherlower-5y6f.onrender.com/");

export default function Regie() {
  const [name, setName] = useState("");
  const [vdoLink, setVdoLink] = useState("");
  const [registered, setRegistered] = useState(false);

  const [frage, setFrage] = useState(null);
  const [alleFragen, setAlleFragen] = useState([]);
  const [ausgewaehlteId, setAusgewaehlteId] = useState("");

  const [players, setPlayers] = useState([]);

  const [sortierteAntworten, setSortierteAntworten] = useState([]);
  const [verbleibendeAntworten, setVerbleibendeAntworten] = useState([]);

  useEffect(() => {
    if (registered) {
      socket.emit("registerDirector", { name, vdoLink });
    }
  }, [registered]);

  useEffect(() => {
    socket.emit("requestAllQuestions");
    socket.on("receiveAllQuestions", (data) => setAlleFragen(data));

    socket.on("playersUpdate", (data) => setPlayers(data));

    return () => {
      socket.off("receiveAllQuestions");
      socket.off("playersUpdate");
    };
  }, []);

  const handleRegister = (e) => {
    e.preventDefault();
    setRegistered(true);
  };

  const handleSelectChange = (e) => {
    const selectedId = e.target.value;
    setAusgewaehlteId(selectedId);

    const selected = alleFragen.find((f) => f.id === selectedId);
    setFrage(selected || null);

    if (selected?.antworten?.length === 15) {
      const antworten = [...selected.antworten];
      const startAntwort = antworten.splice(
        Math.floor(Math.random() * 13) + 1,
        1
      )[0];
      const verbleibend = shuffleArray(antworten);

      setSortierteAntworten([startAntwort]);
      setVerbleibendeAntworten(verbleibend);

      socket.emit("frageVerteilen", {
        frage: selected,
        sortierteAntworten: [startAntwort],
        verbleibendeAntworten: verbleibend,
      });
    }
  };

  const shuffleArray = (array) =>
    array
      .map((val) => ({ val, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ val }) => val);

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const fromVerbleibend = source.droppableId === "verbleibend";
    const dragged = fromVerbleibend
      ? verbleibendeAntworten[source.index]
      : sortierteAntworten[source.index];

    if (!dragged) return;

    const alreadyInSorted = sortierteAntworten.find(
      (a) => a.name === dragged.name
    );
    if (alreadyInSorted && fromVerbleibend) return;

    const korrekt = isInsertCorrect(dragged, destination.index);

    if (!korrekt) {
      flashRed(destination.index);
      socket.emit("antwortAktualisieren", {
        antwort: dragged,
        index: destination.index,
        korrekt: false,
      });
      return;
    }

    const newSorted = [...sortierteAntworten];
    newSorted.splice(destination.index, 0, dragged);
    setSortierteAntworten(newSorted);

    if (fromVerbleibend) {
      setVerbleibendeAntworten((prev) =>
        prev.filter((a) => a.name !== dragged.name)
      );
    }

    socket.emit("antwortAktualisieren", {
      antwort: dragged,
      index: destination.index,
      korrekt: true,
    });
  };

  const isInsertCorrect = (antwort, insertIndex) => {
    const before = sortierteAntworten[insertIndex - 1];
    const after = sortierteAntworten[insertIndex];

    if (before && after) {
      return (
        antwort.position > before.position &&
        antwort.position < after.position &&
        after.position - before.position > 1
      );
    }

    if (!before && after) {
      return antwort.position < after.position;
    }

    if (before && !after) {
      return antwort.position > before.position;
    }

    return false;
  };

  const flashRed = (index) => {
    const el = document.getElementById(`slot-${index}`);
    if (!el) return;
    el.style.transition = "background-color 0.2s";
    el.style.backgroundColor = "red";
    setTimeout(() => {
      el.style.backgroundColor = "";
    }, 300);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      {!registered ? (
        <>
          <h1>Regie Registrierung</h1>
          <form
            onSubmit={handleRegister}
            style={{
              maxWidth: 400,
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
          <h2>Willkommen, {name}!</h2>

          <div style={{ marginTop: "2rem" }}>
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
          </div>

          {frage && (
            <>
              <h3 style={{ marginTop: "2rem" }}>{frage.frage}</h3>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="sortiert" direction="horizontal">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        display: "flex",
                        gap: "1rem",
                        margin: "1rem 0",
                        padding: "1rem",
                        border: "2px dashed #ccc",
                        minHeight: 120,
                        overflowX: "auto",
                        justifyContent: "flex-start",
                      }}
                    >
                      {sortierteAntworten.map((antwort, i) => (
                        <Draggable
                          key={antwort.name}
                          draggableId={antwort.name}
                          index={i}
                          isDragDisabled
                        >
                          {(provided) => (
                            <div
                              id={`slot-${i}`}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                width: 80,
                                textAlign: "center",
                                border: "1px solid #ccc",
                                borderRadius: "0.5rem",
                                background: "#fafafa",
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
                                  fontSize: "0.75rem",
                                  marginTop: "0.5rem",
                                }}
                              >
                                {antwort.name}
                                <br></br>
                                {antwort.loesung}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                <h4>Verbleibende Antworten</h4>
                <Droppable droppableId="verbleibend" direction="horizontal">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
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
                        <Draggable
                          key={antwort.name}
                          draggableId={antwort.name}
                          index={i}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                width: 80,
                                textAlign: "center",
                                border: "1px solid #ccc",
                                borderRadius: "0.5rem",
                                background: "#fff",
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
                                  fontSize: "0.75rem",
                                  marginTop: "0.5rem",
                                }}
                              >
                                {antwort.name}
                                <br></br>
                                {antwort.loesung}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {/* Score & Punkte Steuerung */}
            </>
          )}
          <h3>Spieler bearbeiten</h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "2rem",
              marginTop: "1rem",
            }}
          >
            {players.map((p) => (
              <div
                key={p.id}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "0.5rem",
                  padding: "1rem",
                  minWidth: "250px",
                }}
              >
                <strong>{p.name}</strong>

                <div style={{ marginTop: "0.5rem" }}>
                  <label>
                    ❤️ Leben:
                    <input
                      type="number"
                      min={0}
                      max={3}
                      value={p.score ?? 0}
                      onChange={(e) =>
                        socket.emit("updateScore", {
                          socketId: p.id,
                          newScore: parseInt(e.target.value, 10),
                        })
                      }
                      style={{ marginLeft: "0.5rem", width: "50px" }}
                    />
                  </label>
                </div>

                <div style={{ marginTop: "0.5rem" }}>
                  <label>
                    🧠 Punkte:
                    <input
                      type="number"
                      min={0}
                      value={p.punkte ?? 0}
                      onChange={(e) =>
                        socket.emit("updatePunkte", {
                          socketId: p.id,
                          newPunkte: parseInt(e.target.value, 10),
                        })
                      }
                      style={{ marginLeft: "0.5rem", width: "50px" }}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
