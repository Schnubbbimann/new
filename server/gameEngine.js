const { v4: uuidv4 } = require("uuid");

class CaboGame {
  constructor(players) {
    this.id = uuidv4();
    this.players = players;
    this.playerState = {};
    this.turnIndex = 0;
    this.deck = [];
    this.discard = [];
    this.phase = "init"; // init | playing | finalRound | scoring
    this.caboCalledBy = null;
    this.scores = {};
    this.roundNumber = 1;

    players.forEach(p => {
      this.scores[p] = 0;
    });

    this.setupRound();
  }

  setupRound() {
    this.deck = this.createDeck();
    this.discard = [];
    this.playerState = {};
    this.turnIndex = 0;
    this.phase = "playing";
    this.caboCalledBy = null;

    this.shuffle(this.deck);

    this.players.forEach(pid => {
      this.playerState[pid] = {
        hand: [],
        peeked: false,
      };
      for (let i = 0; i < 4; i++) {
        this.playerState[pid].hand.push({
          id: uuidv4(),
          value: this.deck.pop(),
          revealed: false,
        });
      }
    });

    this.discard.push(this.deck.pop());
  }

  createDeck() {
    const deck = [];
    for (let r = 0; r < 4; r++) {
      for (let v = 0; v <= 13; v++) {
        deck.push(v);
      }
    }
    return deck;
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  getCurrentPlayer() {
    return this.players[this.turnIndex];
  }

  nextTurn() {
    this.turnIndex = (this.turnIndex + 1) % this.players.length;

    if (this.phase === "finalRound" &&
        this.getCurrentPlayer() === this.caboCalledBy) {
      this.phase = "scoring";
    }
  }

  drawCard() {
    if (this.deck.length === 0) {
      const top = this.discard.pop();
      this.deck = this.discard;
      this.shuffle(this.deck);
      this.discard = [top];
    }
    return this.deck.pop();
  }

  replaceCard(player, cardIndex, newValue) {
    const old = this.playerState[player].hand[cardIndex].value;
    this.playerState[player].hand[cardIndex] = {
      id: uuidv4(),
      value: newValue,
      revealed: false,
    };
    this.discard.push(old);
  }

  checkMatches(player) {
    const values = {};
    this.playerState[player].hand.forEach((c, i) => {
      if (!values[c.value]) values[c.value] = [];
      values[c.value].push(i);
    });

    Object.values(values).forEach(indices => {
      if (indices.length >= 2) {
        indices.reverse().forEach(i => {
          this.playerState[player].hand.splice(i, 1);
        });
      }
    });
  }

  callCabo(player) {
    if (this.phase !== "playing") return false;
    this.caboCalledBy = player;
    this.phase = "finalRound";
    return true;
  }

  scoreRound() {
    let results = {};
    let lowest = Infinity;
    let winner = null;

    this.players.forEach(p => {
      let sum = this.playerState[p].hand.reduce((a, c) => {
        if (c.value === 13) return a; // 13 zählt 0
        return a + c.value;
      }, 0);

      results[p] = sum;
      if (sum < lowest) {
        lowest = sum;
        winner = p;
      }
    });

    this.players.forEach(p => {
      this.scores[p] += results[p];
    });

    this.roundNumber++;
    return { results, winner, totalScores: this.scores };
  }
}

module.exports = CaboGame;
