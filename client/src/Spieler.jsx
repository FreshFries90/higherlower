import { useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

export default function Spieler() {
  const [name, setName] = useState("");
  const [vdoLink, setVdoLink] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const playerData = { name, vdoLink };
    socket.emit("registerPlayer", playerData);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Spieler Registrierung</h1>
      <form
        onSubmit={handleSubmit}
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
    </div>
  );
}
