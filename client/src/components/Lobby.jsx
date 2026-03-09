// client/src/components/Lobby.jsx
import React, { useEffect, useState } from "react";

export default function Lobby({ socket, setRoomId, name, setName }) {
  const [roomInput, setRoomInput] = useState("");
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const handler = (data) => {
      if (!data) return;
      setPlayers(Object.values(data.names || {}));
    };
    socket.on("roomUpdate", handler);
    return () => socket.off("roomUpdate", handler);
  }, [socket]);

  const createRoom = () => {
    if (!roomInput || !name) return alert("Bitte Raum-ID und Namen eingeben");
    socket.emit("createRoom", { roomId: roomInput, name }, (res) => {
      if (res && res.ok) setRoomId(roomInput);
      else alert(res?.error || "Fehler beim Erstellen");
    });
  };

  const joinRoom = () => {
    if (!roomInput || !name) return alert("Bitte Raum-ID und Namen eingeben");
    socket.emit("joinRoom", { roomId: roomInput, name }, (res) => {
      if (res && res.ok) setRoomId(roomInput);
      else alert(res?.error || "Fehler beim Beitreten");
    });
  };

  return (
    <div className="lobby card-box">
      <h2>Lobby</h2>
      <div className="form-row">
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Raum-ID" value={roomInput} onChange={(e) => setRoomInput(e.target.value)} />
      </div>
      <div className="buttons">
        <button onClick={createRoom}>Raum erstellen</button>
        <button onClick={joinRoom}>Raum beitreten</button>
      </div>

      <div className="info">
        <p>Spieler im Raum:</p>
        <div className="player-list">{players.length ? players.join(", ") : "—"}</div>
      </div>
    </div>
  );
}
