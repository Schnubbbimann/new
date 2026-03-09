const CaboGame = require("./gameEngine");

class RoomManager {
  constructor() {
    this.rooms = {};
  }

  createRoom(id) {
    this.rooms[id] = {
      players: [],
      game: null,
    };
  }

  joinRoom(id, player) {
    if (!this.rooms[id]) return false;
    this.rooms[id].players.push(player);
    return true;
  }

  startGame(id) {
    const room = this.rooms[id];
    room.game = new CaboGame(room.players);
    return room.game;
  }

  getRoom(id) {
    return this.rooms[id];
  }
}

module.exports = new RoomManager();
