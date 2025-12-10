require("dotenv").config();

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const { checkWin } = require("./utils/gameUtils");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "192.168.3.25";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// Game state management
const gameRooms = new Map();

// Reusable error handler
const emitError = (socket, message) => {
  socket.emit("error", { message });
};

// Reusable room validation
const validateRoom = (socket, roomId) => {
  const room = gameRooms.get(roomId);
  if (!room) {
    emitError(socket, "Phòng không tồn tại!");
    return null;
  }
  return room;
};

class GameRoom {
  constructor(roomId) {
    this.roomId = roomId;
    this.players = [];
    this.gameState = {
      player1Board: [],
      player2Board: [],
      currentPlayer: 1,
      calledNumbers: [],
      gameStatus: "waiting",
    };
    this.createdAt = Date.now();
  }

  addPlayer(socket) {
    if (this.players.length >= 2) {
      return false;
    }

    const playerNumber = this.players.length + 1;
    const player = {
      id: socket.id,
      socket: socket,
      playerNumber: playerNumber,
      name: `Người chơi ${playerNumber}`,
    };

    this.players.push(player);
    socket.join(this.roomId);

    if (this.players.length === 2) {
      this.initializeGame();
    }

    return player;
  }

  removePlayer(socketId) {
    this.players = this.players.filter((player) => player.id !== socketId);

    if (this.players.length === 0) {
      return true;
    }

    this.gameState.gameStatus = "waiting";
    this.broadcastGameState();
    return false;
  }

  initializeGame() {
    this.gameState = {
      player1Board: [],
      player2Board: [],
      currentPlayer: 1,
      calledNumbers: [],
      gameStatus: "board-creation",
    };

    this.broadcastGameState();
  }

  markNumber(board, number) {
    return board.map((row) =>
      row.map((cell) =>
        cell.number === number ? { ...cell, isMarked: true } : cell
      )
    );
  }

  handleNumberCall(number, playerId) {
    const currentPlayerSocket = this.players.find(
      (p) => p.playerNumber === this.gameState.currentPlayer
    );
    if (!currentPlayerSocket || currentPlayerSocket.id !== playerId) {
      return { success: false, error: "Không phải lượt của bạn!" };
    }

    if (
      !number ||
      number < 1 ||
      number > 25 ||
      this.gameState.calledNumbers.includes(number)
    ) {
      return { success: false, error: "Số không hợp lệ hoặc đã được gọi!" };
    }

    this.gameState.calledNumbers.push(number);

    this.gameState.player1Board = this.markNumber(
      this.gameState.player1Board,
      number
    );
    this.gameState.player2Board = this.markNumber(
      this.gameState.player2Board,
      number
    );

    const player1Wins = checkWin(this.gameState.player1Board);
    const player2Wins = checkWin(this.gameState.player2Board);

    if (player1Wins && player2Wins) {
      this.gameState.gameStatus = "tie";
    } else if (player1Wins) {
      this.gameState.gameStatus = "player1-wins";
    } else if (player2Wins) {
      this.gameState.gameStatus = "player2-wins";
    } else {
      this.gameState.currentPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;
    }

    this.broadcastGameState();
    return { success: true };
  }

  broadcastGameState() {
    this.players.forEach((player) => {
      player.socket.emit("gameStateUpdate", {
        ...this.gameState,
        yourPlayerNumber: player.playerNumber,
        players: this.players.map((p) => ({
          playerNumber: p.playerNumber,
          name: p.name,
          isConnected: true,
        })),
      });
    });
  }

  restartGame() {
    this.initializeGame();
  }

  validateBoard(boardNumbers) {
    if (!boardNumbers || boardNumbers.length !== 25) {
      return { valid: false, error: "Cần đúng 25 số!" };
    }

    for (let num of boardNumbers) {
      if (!num || num < 1 || num > 25 || !Number.isInteger(num)) {
        return { valid: false, error: "Tất cả số phải từ 1-25!" };
      }
    }

    const uniqueNumbers = new Set(boardNumbers);
    if (uniqueNumbers.size !== 25) {
      return { valid: false, error: "Không được trùng số!" };
    }

    return { valid: true };
  }

  createBoardFromNumbers(numbers) {
    const board = [];
    for (let i = 0; i < 5; i++) {
      const row = [];
      for (let j = 0; j < 5; j++) {
        row.push({
          number: numbers[i * 5 + j],
          isMarked: false,
        });
      }
      board.push(row);
    }
    return board;
  }

  submitBoard(playerId, boardNumbers) {
    const player = this.players.find((p) => p.id === playerId);
    if (!player) {
      return { success: false, error: "Người chơi không tồn tại!" };
    }

    const validation = this.validateBoard(boardNumbers);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const board = this.createBoardFromNumbers(boardNumbers);

    if (player.playerNumber === 1) {
      this.gameState.player1Board = board;
    } else {
      this.gameState.player2Board = board;
    }

    if (
      this.gameState.player1Board.length > 0 &&
      this.gameState.player2Board.length > 0
    ) {
      this.gameState.gameStatus = "playing";
    }

    this.broadcastGameState();
    return { success: true };
  }
}

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handler(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinRoom", (roomId) => {
      if (!roomId) {
        roomId = "room_" + Math.random().toString(36).substring(2, 11);
      }

      let room = gameRooms.get(roomId);
      if (!room) {
        room = new GameRoom(roomId);
        gameRooms.set(roomId, room);
      }

      const player = room.addPlayer(socket);
      if (!player) {
        emitError(socket, "Phòng đã đầy!");
        return;
      }

      console.log(`Player ${player.playerNumber} joined room ${roomId}`);

      socket.emit("roomJoined", {
        roomId: roomId,
        playerNumber: player.playerNumber,
        playersCount: room.players.length,
      });

      room.broadcastGameState();
    });

    socket.on("callNumber", (data) => {
      // Input validation
      if (!data || typeof data.number !== "number" || !data.roomId) {
        emitError(socket, "Dữ liệu không hợp lệ!");
        return;
      }

      const { number, roomId } = data;
      const room = validateRoom(socket, roomId);
      if (!room) return;

      const result = room.handleNumberCall(number, socket.id);
      if (!result.success) {
        emitError(socket, result.error);
      }
    });

    socket.on("submitBoard", (data) => {
      // Input validation
      if (!data || !Array.isArray(data.boardNumbers) || !data.roomId) {
        emitError(socket, "Dữ liệu bảng không hợp lệ!");
        return;
      }

      const { boardNumbers, roomId } = data;
      const room = validateRoom(socket, roomId);
      if (!room) return;

      const result = room.submitBoard(socket.id, boardNumbers);
      if (!result.success) {
        emitError(socket, result.error);
      }
    });

    socket.on("restartGame", (roomId) => {
      // Input validation
      if (!roomId || typeof roomId !== "string") {
        emitError(socket, "Mã phòng không hợp lệ!");
        return;
      }

      const room = validateRoom(socket, roomId);
      if (room) {
        room.restartGame();
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      for (const [roomId, room] of gameRooms.entries()) {
        const shouldDeleteRoom = room.removePlayer(socket.id);
        if (shouldDeleteRoom) {
          gameRooms.delete(roomId);
          console.log(`Room ${roomId} deleted`);
        }
      }
    });
  });

  // Clean up empty rooms periodically
  setInterval(() => {
    const now = Date.now();
    for (const [roomId, room] of gameRooms.entries()) {
      if (room.players.length === 0 && now - room.createdAt > 5 * 60 * 1000) {
        gameRooms.delete(roomId);
        console.log(`Cleaned up empty room: ${roomId}`);
      }
    }
  }, 60000);

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
