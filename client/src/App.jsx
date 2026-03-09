import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import Lobby from "./components/Lobby";
import Table from "./components/Table";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "";

const socket = io(SERVER_URL || undefined);

export default function App() {
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [name, setName] = useState("");
  const [meId, setMeId] = useState(null);

  useEffect(() => {
    socket.on("connect", () => {
      setConnected(true);
      setMeId(socket.id);
    });
    socket.on("disconnect", () => setConnected(false));
    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  return (
    <div className="app">
      <header>
        <h1>Cabo Online</h1>
        <div className="status">
          <span className={`dot ${connected ? "online" : "offline"}`}></span>
          {connected ? "Verbunden" : "Nicht verbunden"}
        </div>
      </header>

      {!roomId ? (
        <Lobby
          socket={socket}
          setRoomId={setRoomId}
          name={name}
          setName={setName}
        />
      ) : (
        <Table
          socket={socket}
          roomId={roomId}
          name={name}
          meId={meId}
          leaveRoom={() => setRoomId(null)}
        />
      )}

      <footer>
        <small>Spiel basiert auf deinen Cabo-Regeln (0–13, kein Joker)</small>
      </footer>
    </div>
  );
}
