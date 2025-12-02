const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// Game state management
const gameRooms = new Map();

class GameRoom {
  constructor(roomId) {
    this.roomId = roomId;
    this.players = [];
    this.gameState = {
      player1Board: [],
      player2Board: [],
      currentPlayer: 1,
      calledNumbers: [],
      gameStatus: 'waiting', // waiting, playing, player1-wins, player2-wins, tie
    };
    this.createdAt = Date.now();
  }

  addPlayer(socket) {
    if (this.players.length >= 2) {
      return false; // Room is full
    }
    
    const playerNumber = this.players.length + 1;
    const player = {
      id: socket.id,
      socket: socket,
      playerNumber: playerNumber,
      name: `Người chơi ${playerNumber}`
    };
    
    this.players.push(player);
    socket.join(this.roomId);
    
    // If room is full, start the game
    if (this.players.length === 2) {
      this.initializeGame();
    }
    
    return player;
  }

  removePlayer(socketId) {
    this.players = this.players.filter(player => player.id !== socketId);
    
    // If room becomes empty, it will be cleaned up
    if (this.players.length === 0) {
      return true; // Room should be deleted
    }
    
    // Reset game if one player leaves
    this.gameState.gameStatus = 'waiting';
    this.broadcastGameState();
    return false;
  }

  generateBoard() {
    const numbers = Array.from({ length: 25 }, (_, i) => i + 1);
    
    // Shuffle array using Fisher-Yates algorithm
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    const board = [];
    for (let i = 0; i < 5; i++) {
      const row = [];
      for (let j = 0; j < 5; j++) {
        row.push({
          number: numbers[i * 5 + j],
          isMarked: false
        });
      }
      board.push(row);
    }
    return board;
  }

  initializeGame() {
    this.gameState = {
      player1Board: [],
      player2Board: [],
      currentPlayer: 1,
      calledNumbers: [],
      gameStatus: 'board-creation' // New status for board creation phase
    };
    
    this.broadcastGameState();
  }

  countCompletedLines(board) {
    let completedLines = 0;

    // Check horizontal lines
    for (let i = 0; i < 5; i++) {
      if (board[i].every(cell => cell.isMarked)) {
        completedLines++;
      }
    }

    // Check vertical lines
    for (let j = 0; j < 5; j++) {
      if (board.every(row => row[j].isMarked)) {
        completedLines++;
      }
    }

    // Check main diagonal
    if (board.every((row, i) => row[i].isMarked)) {
      completedLines++;
    }

    // Check anti-diagonal
    if (board.every((row, i) => row[4 - i].isMarked)) {
      completedLines++;
    }

    return completedLines;
  }

  checkWin(board) {
    return this.countCompletedLines(board) >= 5;
  }

  markNumber(board, number) {
    return board.map(row =>
      row.map(cell =>
        cell.number === number ? { ...cell, isMarked: true } : cell
      )
    );
  }

  handleNumberCall(number, playerId) {
    // Validate turn
    const currentPlayerSocket = this.players.find(p => p.playerNumber === this.gameState.currentPlayer);
    if (!currentPlayerSocket || currentPlayerSocket.id !== playerId) {
      return { success: false, error: 'Không phải lượt của bạn!' };
    }

    // Validate number
    if (!number || number < 1 || number > 25 || this.gameState.calledNumbers.includes(number)) {
      return { success: false, error: 'Số không hợp lệ hoặc đã được gọi!' };
    }

    // Add number to called numbers
    this.gameState.calledNumbers.push(number);

    // Mark number on both boards
    this.gameState.player1Board = this.markNumber(this.gameState.player1Board, number);
    this.gameState.player2Board = this.markNumber(this.gameState.player2Board, number);

    // Check win conditions
    const player1Wins = this.checkWin(this.gameState.player1Board);
    const player2Wins = this.checkWin(this.gameState.player2Board);

    if (player1Wins && player2Wins) {
      this.gameState.gameStatus = 'tie';
    } else if (player1Wins) {
      this.gameState.gameStatus = 'player1-wins';
    } else if (player2Wins) {
      this.gameState.gameStatus = 'player2-wins';
    } else {
      // Switch turn
      this.gameState.currentPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;
    }

    this.broadcastGameState();
    return { success: true };
  }

  broadcastGameState() {
    this.players.forEach(player => {
      player.socket.emit('gameStateUpdate', {
        ...this.gameState,
        yourPlayerNumber: player.playerNumber,
        players: this.players.map(p => ({ 
          playerNumber: p.playerNumber, 
          name: p.name,
          isConnected: true 
        }))
      });
    });
  }

  restartGame() {
    this.initializeGame();
  }

  validateBoard(boardNumbers) {
    // Check if we have exactly 25 numbers
    if (!boardNumbers || boardNumbers.length !== 25) {
      return { valid: false, error: 'Cần đúng 25 số!' };
    }

    // Check if all numbers are between 1-25
    for (let num of boardNumbers) {
      if (!num || num < 1 || num > 25 || !Number.isInteger(num)) {
        return { valid: false, error: 'Tất cả số phải từ 1-25!' };
      }
    }

    // Check for duplicates
    const uniqueNumbers = new Set(boardNumbers);
    if (uniqueNumbers.size !== 25) {
      return { valid: false, error: 'Không được trùng số!' };
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
          isMarked: false
        });
      }
      board.push(row);
    }
    return board;
  }

  submitBoard(playerId, boardNumbers) {
    // Find which player is submitting
    const player = this.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, error: 'Người chơi không tồn tại!' };
    }

    // Validate board
    const validation = this.validateBoard(boardNumbers);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Create board
    const board = this.createBoardFromNumbers(boardNumbers);

    // Set board for the correct player
    if (player.playerNumber === 1) {
      this.gameState.player1Board = board;
    } else {
      this.gameState.player2Board = board;
    }

    // Check if both players have submitted their boards
    if (this.gameState.player1Board.length > 0 && this.gameState.player2Board.length > 0) {
      this.gameState.gameStatus = 'playing';
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
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join or create room
    socket.on('joinRoom', (roomId) => {
      if (!roomId) {
        roomId = 'room_' + Math.random().toString(36).substr(2, 9);
      }

      // Get or create room
      let room = gameRooms.get(roomId);
      if (!room) {
        room = new GameRoom(roomId);
        gameRooms.set(roomId, room);
      }

      // Try to add player to room
      const player = room.addPlayer(socket);
      if (!player) {
        socket.emit('error', { message: 'Phòng đã đầy!' });
        return;
      }

      console.log(`Player ${player.playerNumber} joined room ${roomId}`);
      
      // Send room info to player
      socket.emit('roomJoined', { 
        roomId: roomId, 
        playerNumber: player.playerNumber,
        playersCount: room.players.length
      });

      // Broadcast current game state
      room.broadcastGameState();
    });

    // Handle number call
    socket.on('callNumber', (data) => {
      const { number, roomId } = data;
      const room = gameRooms.get(roomId);
      
      if (!room) {
        socket.emit('error', { message: 'Phòng không tồn tại!' });
        return;
      }

      const result = room.handleNumberCall(number, socket.id);
      if (!result.success) {
        socket.emit('error', { message: result.error });
      }
    });

    // Handle board submission
    socket.on('submitBoard', (data) => {
      const { boardNumbers, roomId } = data;
      const room = gameRooms.get(roomId);
      
      if (!room) {
        socket.emit('error', { message: 'Phòng không tồn tại!' });
        return;
      }

      const result = room.submitBoard(socket.id, boardNumbers);
      if (!result.success) {
        socket.emit('error', { message: result.error });
      }
    });

    // Handle game restart
    socket.on('restartGame', (roomId) => {
      const room = gameRooms.get(roomId);
      if (room) {
        room.restartGame();
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Remove player from all rooms
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
      // Delete rooms that are empty for more than 5 minutes
      if (room.players.length === 0 && (now - room.createdAt) > 5 * 60 * 1000) {
        gameRooms.delete(roomId);
        console.log(`Cleaned up empty room: ${roomId}`);
      }
    }
  }, 60000); // Check every minute

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
