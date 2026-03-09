import React, { useEffect, useState } from "react";

export default function Lobby({ socket, setRoomId, name, setName }) {
  const [roomInput, setRoomInput] = useState("");
  const [players, setPlayers] = useState([]);
  const [roomPreview, setRoomPreview] = useState(null);

  useEffect(() => {
    const handler = (data) => {
      // if server emits roomUpdate as { players: n, names: {...} }
      if (data && data.names) {
        setPlayers(Object.values(data.names));
      }
    };
    socket.on("roomUpdate", handler);
    return () => socket.off("roomUpdate", handler);
  }, [socket]);

  const createRoom = async () => {
    if (!roomInput || !name) return alert("Bitte Raum-ID und Namen eingeben");
    socket.emit("createRoom", roomInput, (ok) => {
      if (ok) {
        setRoomId(roomInput);
      } else {
        alert("Konnte Raum nicht erstellen");
      }
    });
  };

  const joinRoom = () => {
    if (!roomInput || !name) return alert("Bitte Raum-ID und Namen eingeben");
    socket.emit("joinRoom", roomInput, (ok) => {
      if (ok) {
        setRoomId(roomInput);
      } else {
        alert("Konnte Raum nicht beitreten");
      }
    });
  };

  return (
    <div className="lobby card-box">
      <h2>Lobby</h2>
      <div className="form-row">
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Raum-ID (z.B. abc123)"
          value={roomInput}
          onChange={(e) => setRoomInput(e.target.value)}
        />
      </div>
      <div className="buttons">
        <button onClick={createRoom}>Raum erstellen</button>
        <button onClick={joinRoom}>Raum beitreten</button>
      </div>

      <div className="info">
        <p>Spieler im aktuellen Raum:</p>
        <div className="player-list">{players.join(", ") || "—"}</div>
      </div>

      <div className="hint">
        <p>Tipp: Erstelle einen Raum, teile die Raum-ID mit Freunden und startet das Spiel.</p>
      </div>
    </div>
  );
}
