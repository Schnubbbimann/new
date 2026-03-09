import React from "react";

export default function Opponent({ id, game }) {
  // Show how many cards the opponent has and their revealed values (if any)
  const pState = game?.playerState?.[id];
  const hand = pState?.hand ?? [];
  return (
    <div className="opponent">
      <div className="opponent-name">{id}</div>
      <div className="opponent-cards">
        {hand.map((c, i) => (
          <div key={c?.id ?? i} className="card small">
            <div>{c.revealed ? c.value : "X"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
