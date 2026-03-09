// client/src/components/Table.jsx
import React, { useEffect, useState } from "react";
import Hand from "./Hand";
import Opponent from "./Opponent";

export default function Table({ socket, roomId, name, meId, leaveRoom }) {
  const [gamePublic, setGamePublic] = useState(null);
  const [playersOrder, setPlayersOrder] = useState([]);
  const [myHand, setMyHand] = useState([]);
  const [deckCount, setDeckCount] = useState(0);
  const [discardTop, setDiscardTop] = useState(null);
  const [drewCard, setDrewCard] = useState(null);
  const [logs, setLogs] = useState([]);
  const [namesMap, setNamesMap] = useState({});

  useEffect(() => {
    const onGameStarted = (data) => {
      addLog("Spiel gestartet");
      setPlayersOrder(data.players || []);
      setNamesMap(data.names || {});
    };

    const onStateUpdate = (state) => {
      setGamePublic(state);
      setDeckCount(state.deckCount ?? 0);
      setDiscardTop(state.discardTop ?? null);
      setNamesMap(state.names ?? {});
      setPlayersOrder(state.players ?? []);
    };

    const onYourHand = (hand) => {
      setMyHand(hand || []);
    };

    const onDrewCard = (card) => {
      setDrewCard(card);
      addLog("Gezogene Karte: " + card);
    };

    socket.on("gameStarted", onGameStarted);
    socket.on("stateUpdate", onStateUpdate);
    socket.on("yourHand", onYourHand);
    socket.on("drewCard", (d) => onDrewCard(d));
    socket.on("caboCalled", (by) => addLog(`Cabo ausgerufen von ${namesMap[by] || by}`));
    socket.on("roundResult", (res) => {
      addLog("Runde beendet. Gewinner: " + (namesMap[res.winner] || res.winner));
    });

    return () => {
      socket.off("gameStarted", onGameStarted);
      socket.off("stateUpdate", onStateUpdate);
      socket.off("yourHand", onYourHand);
      socket.off("drewCard");
      socket.off("caboCalled");
      socket.off("roundResult");
    };
  }, [socket, namesMap]);

  function addLog(t) { setLogs(l => [t, ...l].slice(0, 40)); }

  // derived
  const isPlaying = !!gamePublic && gamePublic.phase === "playing";
  const isMyTurn = isPlaying && playersOrder[gamePublic?.turnIndex] === socket.id;

  // actions
  const startGame = () => socket.emit("startGame", roomId, (res)=>{ if(!res.ok) alert(res.error) });
  const peekTwo = () => socket.emit("peek", { roomId }, ()=>{ addLog("Peek angefordert") });
  const draw = () => socket.emit("draw", roomId, (card) => { if(card==null) addLog("Keine Karte gezogen"); else setDrewCard(card); });
  const replaceWithDrawn = (index) => {
    if (!isMyTurn) return alert("Nicht dein Zug");
    if (drewCard == null) return alert("Keine gezogene Karte");
    socket.emit("replace", { roomId, index, value: drewCard }, (res)=>{ if(res?.ok) setDrewCard(null) });
  };
  const replaceWithDiscard = (index) => {
    if (!isMyTurn) return alert("Nicht dein Zug");
    socket.emit("replace", { roomId, index, value: discardTop });
  };
  const discardDrawn = () => {
    if (!isMyTurn) return alert("Nicht dein Zug");
    if (drewCard == null) return alert("Keine gezogene Karte");
    socket.emit("replace", { roomId, index: -1, value: drewCard }, (res)=>{ if(res?.ok) setDrewCard(null) });
  };
  const callCabo = () => socket.emit("callCabo", roomId);

  return (
    <div className="table card-box">
      <div className="top">
        <div className="room-meta">
          <h2>Raum: {roomId}</h2>
          <div>Spieler: {playersOrder.map(id => namesMap[id] || id).join(", ")}</div>
          <div>Punkte: {Object.entries(gamePublic?.scores || {}).map(([id,s]) => <span key={id} className="score-pill">{namesMap[id]||id}: {s}</span>)}</div>
        </div>

        <div className="controls">
          {/* startGame button shown always to host/anyone in lobby — but game actions only active when isPlaying */}
          <button onClick={startGame} disabled={isPlaying}>Spiel starten</button>
          <button onClick={peekTwo} disabled={!isPlaying}>2 Karten anschauen</button>
          <button onClick={draw} disabled={!isPlaying}>Vom Nachziehstapel ziehen ({deckCount})</button>
          <button onClick={discardDrawn} disabled={!isPlaying}>Gezogene abwerfen</button>
          <button onClick={callCabo} disabled={!isPlaying}>Cabo rufen</button>
          <button onClick={() => { socket.emit('leaveRoom', roomId); leaveRoom(); }}>Lobby</button>
        </div>
      </div>

      <div className="play-area">
        <div className="opponents">
          {playersOrder.filter(p=>p!==socket.id).map(id => (
            <Opponent key={id} id={id} name={namesMap[id]} gamePublic={gamePublic} />
          ))}
        </div>

        <div className="center">
          <div className="deck">
            <div className="deck-stack">Deck: {deckCount}</div>
            <div className="discard">Ablage: {discardTop ?? "—"}</div>
            <div className="drawn">Gezogene Karte: {drewCard ?? "—"}</div>
          </div>
        </div>
      </div>

      <div className="player-row">
        <Hand hand={myHand} onReplaceWithDrawn={replaceWithDrawn} onReplaceWithDiscard={replaceWithDiscard} />
      </div>

      <div className="logs">
        <h4>Logs</h4>
        <ul>{logs.map((l,i)=><li key={i}>{l}</li>)}</ul>
      </div>
    </div>
  );
}
