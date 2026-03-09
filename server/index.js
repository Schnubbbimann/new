const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const roomManager = require("./roomManager");

const app = express();
app.use(cors());

// 🔥 React Build ausliefern
app.use(express.static(path.join(__dirname, "../client/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {

  /* ========================
     ROOM MANAGEMENT
  ======================== */

  socket.on("createRoom", ({ roomId, name }, cb) => {
    if (!roomId) return cb && cb({ ok: false, error: "no roomId" });

    if (!roomManager.getRoom(roomId)) {
      roomManager.createRoom(roomId);
    }

    roomManager.joinRoom(roomId, socket.id, name || "Spieler");
    socket.join(roomId);

    const room = roomManager.getRoom(roomId);
    io.to(roomId).emit("roomUpdate", {
      players: room.players.length,
      names: room.names
    });

    cb && cb({ ok: true });
  });

  socket.on("joinRoom", ({ roomId, name }, cb) => {
    const room = roomManager.getRoom(roomId);
    if (!room) return cb && cb({ ok: false, error: "Room not found" });

    roomManager.joinRoom(roomId, socket.id, name || "Spieler");
    socket.join(roomId);

    io.to(roomId).emit("roomUpdate", {
      players: room.players.length,
      names: room.names
    });

    cb && cb({ ok: true });
  });

  socket.on("disconnect", () => {
    for (const roomId of Object.keys(roomManager.rooms)) {
      const room = roomManager.rooms[roomId];
      if (room.players.includes(socket.id)) {
        roomManager.leaveRoom(roomId, socket.id);

        io.to(roomId).emit("roomUpdate", {
          players: roomManager.rooms[roomId]?.players.length || 0,
          names: roomManager.rooms[roomId]?.names || {}
        });
      }
    }
  });

  /* ========================
     GAME START
  ======================== */

  socket.on("startGame", (roomId, cb) => {
    const room = roomManager.getRoom(roomId);
    if (!room) return cb && cb({ ok: false, error: "Room not found" });

    const game = roomManager.startGame(roomId);

    broadcastState(roomId);

    io.to(roomId).emit("gameStarted", {
      players: room.players,
      names: room.names
    });

    cb && cb({ ok: true });
  });

  /* ========================
     GAME ACTIONS
  ======================== */

  socket.on("draw", (roomId, cb) => {
    const room = roomManager.getRoom(roomId);
    const game = room?.game;
    if (!game) return cb && cb(null);

    if (game.getCurrentPlayer() !== socket.id) return cb && cb(null);

    const card = game.drawCard();
    cb && cb(card);
  });

  socket.on("replace", ({ roomId, index, value }, cb) => {
    const room = roomManager.getRoom(roomId);
    const game = room?.game;
    if (!game) return cb && cb({ ok: false });

    if (game.getCurrentPlayer() !== socket.id) {
      return cb && cb({ ok: false, error: "Not your turn" });
    }

    if (index === -1) {
      game.discard.push(value);
      game.nextTurn();
    } else {
      game.replaceCard(socket.id, index, value);
    }

    broadcastState(roomId);
    cb && cb({ ok: true });
  });

  socket.on("callCabo", (roomId, cb) => {
    const room = roomManager.getRoom(roomId);
    const game = room?.game;
    if (!game) return cb && cb({ ok: false });

    game.callCabo(socket.id);
    broadcastState(roomId);
    cb && cb({ ok: true });
  });

  socket.on("score", (roomId, cb) => {
    const room = roomManager.getRoom(roomId);
    const game = room?.game;
    if (!game) return cb && cb({ ok: false });

    const result = game.score();
    io.to(roomId).emit("roundResult", result);
    cb && cb({ ok: true });
  });

  /* ========================
     HELPER
  ======================== */

  function broadcastState(roomId) {
    const room = roomManager.getRoom(roomId);
    if (!room || !room.game) return;

    const game = room.game;

    // Public state
    io.to(roomId).emit("stateUpdate", {
      ...game.getPublicState(),
      names: room.names
    });

    // Private hands
    room.players.forEach((playerId) => {
      io.to(playerId).emit("yourHand", game.getPrivateHand(playerId));
    });
  }

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
