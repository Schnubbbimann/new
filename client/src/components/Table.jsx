import React, { useEffect, useState } from "react";
import Hand from "./Hand";
import Opponent from "./Opponent";

export default function Table({ socket, roomId, name, meId, leaveRoom }) {
  const [game, setGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [myHand, setMyHand] = useState([]);
  const [deckCount, setDeckCount] = useState(0);
  const [discardTop, setDiscardTop] = useState(null);
  const [logs, setLogs] = useState([]);
  const [drewCard, setDrewCard] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [scores, setScores] = useState({});
  const [roundResults, setRoundResults] = useState(null);

  useEffect(() => {
    const onGameStarted = (data) => {
      addLog("Spiel gestartet");
      setPlayers(data.players || []);
    };

    const onStateUpdate = (g) => {
      setGame(g);
      setDeckCount(g.deck.length || 0);
      setDiscardTop((g.discard && g.discard[g.discard.length - 1]) ?? null);
      setScores(g.scores ?? {});
      setPlayers(g.players ?? []);
      // set my hand (server sends full game object; read your private hand)
      if (g.playerState && meId && g.playerState[meId]) {
        setMyHand(g.playerState[meId].hand || []);
      }
      // is my turn?
      const cur = g.players ? g.players[g.turnIndex] : null;
      setIsMyTurn(cur === socket.id);
    };

    const onDrew = (card) => {
      setDrewCard(card);
      addLog("Du hast eine Karte gezogen: " + card);
    };

    const onCaboCalled = (by) => {
      addLog("Cabo ausgerufen vom Spieler " + by);
    };

    const onRoundResult = (res) => {
      setRoundResults(res);
      addLog("Runde beendet — Gewinner: " + res.winner);
    };

    socket.on("gameStarted", onGameStarted);
    socket.on("stateUpdate", onStateUpdate);
    socket.on("drewCard", (d) => onDrew(d.card ?? d));
    socket.on("caboCalled", onCaboCalled);
    socket.on("roundResult", onRoundResult);

    // request server roomUpdate to get names maybe
    socket.emit("roomInfo", roomId, () => {});

    return () => {
      socket.off("gameStarted", onGameStarted);
      socket.off("stateUpdate", onStateUpdate);
      socket.off("drewCard");
      socket.off("caboCalled", onCaboCalled);
      socket.off("roundResult", onRoundResult);
    };
  }, [socket, meId, roomId]);

  function addLog(t) {
    setLogs((l) => [t, ...l].slice(0, 30));
  }

  // actions
  const startGame = () => {
    socket.emit("startGame", roomId, (ok) => {
      if (!ok) alert("Konnte Spiel nicht starten");
    });
  };

  const peekTwo = () => {
    socket.emit("peek", { roomId }, (res) => {
      // server emits peekResult privately
      addLog("Peek angefordert");
    });
  };

  const draw = async () => {
    if (!isMyTurn) return alert("Nicht dein Zug");
    socket.emit("draw", roomId, (card) => {
      // server callback returns card
      setDrewCard(card);
    });
  };

  const replaceWithDrawn = (index) => {
    if (!isMyTurn) return alert("Nicht dein Zug");
    if (drewCard == null) return alert("Keine gezogene Karte");
    socket.emit("replace", { roomId, index, value: drewCard });
    setDrewCard(null);
  };

  const replaceWithDiscard = (index) => {
    if (!isMyTurn) return alert("Nicht dein Zug");
    socket.emit("replace", { roomId, index, value: discardTop });
    setDrewCard(null);
  };

  const discardDrawn = () => {
    if (!isMyTurn) return alert("Nicht dein Zug");
    if (drewCard == null) return alert("Keine gezogene Karte");
    // discard by replacing -1 (server treats replaceCard by pushing old card to discard in engine)
    socket.emit("replace", { roomId, index: -1, value: drewCard });
    setDrewCard(null);
  };

  const callCabo = () => {
    socket.emit("callCabo", roomId);
  };

  const doScore = () => {
    socket.emit("score", roomId);
  };

  return (
    <div className="table card-box">
      <div className="top">
        <div className="room-meta">
          <h2>Raum: {roomId}</h2>
          <div>Spieler: {players.join(", ")}</div>
          <div>Punkte: {Object.entries(scores).map(([p,s])=> <span key={p} className="score-pill">{p}: {s}</span>)}</div>
        </div>

        <div className="controls">
          <button onClick={startGame}>Spiel starten</button>
          <button onClick={peekTwo}>2 Karten anschauen</button>
          <button onClick={draw}>Vom Nachziehstapel ziehen ({deckCount})</button>
          <button onClick={discardDrawn}>Gezogene abwerfen</button>
          <button onClick={callCabo}>Cabo rufen</button>
          <button onClick={doScore}>Punktauswertung erzwingen</button>
          <button onClick={leaveRoom}>Lobby</button>
        </div>
      </div>

      <div className="play-area">
        <div className="opponents">
          {players.filter(p=>p!==socket.id).map((id) => (
            <Opponent key={id} id={id} game={game} />
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
        <Hand
          hand={myHand}
          onReplaceWithDrawn={replaceWithDrawn}
          onReplaceWithDiscard={replaceWithDiscard}
        />
      </div>

      <div className="logs">
        <h4>Logs</h4>
        <ul>
          {logs.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      </div>

      {roundResults && (
        <div className="modal">
          <div className="modal-card">
            <h3>Rundenresultat</h3>
            <div>Gewinner: {roundResults.winner}</div>
            <div>
              Ergebnisse:
              <ul>
                {Object.entries(roundResults.results).map(([p, s]) => (
                  <li key={p}>{p}: {s}</li>
                ))}
              </ul>
            </div>
            <button onClick={() => setRoundResults(null)}>Schließen</button>
          </div>
        </div>
      )}
    </div>
  );

  function leaveRoom() {
    // simply go to lobby (client-side)
    leaveRoom && leaveRoom();
  }
}
