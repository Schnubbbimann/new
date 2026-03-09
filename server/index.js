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

io.on("connection", socket => {

  socket.on("createRoom", (roomId, cb) => {
    roomManager.createRoom(roomId);
    roomManager.joinRoom(roomId, socket.id);
    socket.join(roomId);
    cb(true);
  });

  socket.on("joinRoom", (roomId, cb) => {
    if (!roomManager.joinRoom(roomId, socket.id)) return cb(false);
    socket.join(roomId);
    cb(true);
  });

  socket.on("startGame", (roomId, cb) => {
    const game = roomManager.startGame(roomId);
    io.to(roomId).emit("gameStarted", {
      players: game.players,
    });
    cb(true);
  });

  socket.on("draw", (roomId, cb) => {
    const room = roomManager.getRoom(roomId);
    const game = room?.game;
    if (!game) return;
    if (game.getCurrentPlayer() !== socket.id) return;

    const card = game.drawCard();
    cb(card);
  });

  socket.on("replace", ({ roomId, index, value }) => {
    const game = roomManager.getRoom(roomId)?.game;
    if (!game) return;

    game.replaceCard(socket.id, index, value);
    game.checkMatches(socket.id);
    game.nextTurn();
    io.to(roomId).emit("stateUpdate", game);
  });

  socket.on("callCabo", (roomId) => {
    const game = roomManager.getRoom(roomId)?.game;
    if (!game) return;

    game.callCabo(socket.id);
    io.to(roomId).emit("caboCalled", socket.id);
  });

  socket.on("score", (roomId) => {
    const game = roomManager.getRoom(roomId)?.game;
    if (!game) return;

    const result = game.scoreRound();
    io.to(roomId).emit("roundResult", result);
  });

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
