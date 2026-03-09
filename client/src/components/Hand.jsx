import React from "react";

export default function Hand({ hand = [], onReplaceWithDrawn, onReplaceWithDiscard }) {
  return (
    <div className="hand">
      <h4>Deine Hand</h4>
      <div className="cards">
        {hand.map((c, i) => (
          <div key={c?.id ?? i} className="card">
            <div className="card-face">{c.revealed ? c.value : "verdeckt"}</div>
            <div className="card-actions">
              <button onClick={() => onReplaceWithDrawn(i)}>Mit gezogener ersetzen</button>
              <button onClick={() => onReplaceWithDiscard(i)}>Mit Ablage ersetzen</button>
            </div>
          </div>
        ))}
        {hand.length === 0 && <div className="empty">Keine Karten</div>}
      </div>
    </div>
  );
}
