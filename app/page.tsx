"use client";

import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { GameState } from "../types/game";
import BingoBoard from "../components/BingoBoard";
import RoomManagement from "../components/RoomManagement";
import BoardCreation from "../components/BoardCreation";
import GameStatus from "../components/GameStatus";
import ConnectionStatus from "../components/ConnectionStatus";
import RoomInfo from "../components/RoomInfo";

export default function BingoGame() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    player1Board: [],
    player2Board: [],
    currentPlayer: 1,
    calledNumbers: [],
    gameStatus: "waiting",
  });
  const [roomId, setRoomId] = useState("");
  const [inputRoomId, setInputRoomId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  const [playerNumber, setPlayerNumber] = useState<number | null>(null);
  const [boardInput, setBoardInput] = useState<string[]>(Array(25).fill(""));
  const [isSubmittingBoard, setIsSubmittingBoard] = useState(false);

  // Reusable error handler
  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(""), 3000);
  };

  // Initialize socket connection
  useEffect(() => {
    const socketUrl =
      (typeof window !== "undefined" && (window as any).__SOCKET_URL__) ||
      process.env.NEXT_PUBLIC_SOCKET_URL;

    const newSocket = io(socketUrl, {
      transports: ["websocket", "polling"],
      timeout: 20000,
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to server");
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from server");
    });

    newSocket.on("roomJoined", (data) => {
      setRoomId(data.roomId);
      setPlayerNumber(data.playerNumber);
      setError("");
      console.log(`Joined room ${data.roomId} as player ${data.playerNumber}`);
    });

    newSocket.on("gameStateUpdate", (newGameState: GameState) => {
      setGameState(newGameState);
      setPlayerNumber(newGameState.yourPlayerNumber || null);

      // Reset board submission state when game state changes
      if (newGameState.gameStatus === "playing") {
        setIsSubmittingBoard(false);
      }
    });

    newSocket.on("error", (errorData) => {
      showError(errorData.message);
      setIsSubmittingBoard(false); // Reset submission state on error
    });

    newSocket.on("connect_error", (error) => {
      showError("Không thể kết nối đến server!");
      console.error("Socket connection error:", error);
    });

    return () => {
      newSocket.close();
    };
  }, []); // No dependencies needed

  // Join or create room
  const handleJoinRoom = () => {
    if (socket) {
      socket.emit("joinRoom", inputRoomId || undefined);
      setInputRoomId("");
    }
  };

  // Handle number click
  const handleNumberClick = (number: number) => {
    if (gameState.calledNumbers.includes(number)) {
      showError("Số này đã được gọi rồi!");
      return;
    }

    if (socket && roomId) {
      socket.emit("callNumber", { number, roomId });
    }
  };

  // Handle board input change
  const handleBoardInputChange = (index: number, value: string) => {
    const newBoardInput = [...boardInput];
    newBoardInput[index] = value;
    setBoardInput(newBoardInput);
  };

  // Submit custom board
  const handleSubmitBoard = () => {
    const numbers = boardInput
      .map((val) => parseInt(val))
      .filter((num) => !isNaN(num));

    if (numbers.length !== 25) {
      showError("Vui lòng nhập đủ 25 số!");
      return;
    }

    // Check for duplicates
    const uniqueNumbers = new Set(numbers);
    if (uniqueNumbers.size !== 25) {
      showError("Không được trùng số!");
      return;
    }

    // Check range
    for (const num of numbers) {
      if (num < 1 || num > 25) {
        showError("Tất cả số phải từ 1-25!");
        return;
      }
    }

    if (socket && roomId) {
      setIsSubmittingBoard(true);
      socket.emit("submitBoard", { boardNumbers: numbers, roomId });
    }
  };

  // Auto-fill board with random numbers
  const handleAutoFillBoard = () => {
    const numbers = Array.from({ length: 25 }, (_, i) => i + 1);

    // Shuffle array
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    setBoardInput(numbers.map((num) => num.toString()));
  };

  // Restart game
  const handleRestartGame = () => {
    if (socket && roomId) {
      socket.emit("restartGame", roomId);
      setBoardInput(Array(25).fill(""));
      setIsSubmittingBoard(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-purple-50 p-4 text-black">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          🎯 Game Bingo Online - 2 Người Chơi
        </h1>

        <ConnectionStatus isConnected={isConnected} />

        {/* Error Display */}
        {error && (
          <div className="text-center mb-4">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          </div>
        )}

        {/* Room Management */}
        {!roomId && (
          <RoomManagement
            isConnected={isConnected}
            inputRoomId={inputRoomId}
            setInputRoomId={setInputRoomId}
            onJoinRoom={handleJoinRoom}
          />
        )}

        {/* Room Info */}
        {roomId && (
          <RoomInfo
            roomId={roomId}
            playerNumber={playerNumber}
            gameState={gameState}
          />
        )}

        {/* Waiting for players */}
        {roomId && gameState.gameStatus === "waiting" && (
          <div className="text-center mb-8">
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              {(gameState.players?.length || 0) < 2 ? (
                <div>
                  <p className="font-semibold">Đang chờ người chơi thứ 2...</p>
                  <p className="text-sm mt-1">
                    Chia sẻ mã phòng để mời bạn bè tham gia!
                  </p>
                </div>
              ) : (
                <p>Đang khởi tạo game...</p>
              )}
            </div>
          </div>
        )}

        {/* Board Creation Phase */}
        {roomId && gameState.gameStatus === "board-creation" && (
          <BoardCreation
            playerNumber={playerNumber}
            boardInput={boardInput}
            setBoardInput={setBoardInput}
            isSubmittingBoard={isSubmittingBoard}
            onSubmitBoard={handleSubmitBoard}
            onAutoFillBoard={handleAutoFillBoard}
            gameState={gameState}
          />
        )}

        {/* Game Playing */}
        {roomId && gameState.gameStatus === "playing" && (
          <>
            {/* Turn Info */}
            <div className="text-center mb-6">
              <div className="bg-white rounded-lg p-4 shadow-md inline-block">
                <p className="text-lg font-semibold">
                  Lượt của:{" "}
                  <span className="text-blue-600">
                    Người chơi {gameState.currentPlayer}
                  </span>
                </p>
                {playerNumber === gameState.currentPlayer && (
                  <p className="text-sm text-green-600 mt-2 font-semibold">
                    👆 Click vào số trên bảng của bạn để gọi số!
                  </p>
                )}
                {playerNumber !== gameState.currentPlayer && (
                  <p className="text-sm text-gray-600 mt-2">
                    Chờ người chơi khác chọn số...
                  </p>
                )}
              </div>
            </div>

            {/* Called Numbers */}
            <div className="text-center mb-6">
              <div className="bg-white rounded-lg p-4 shadow-md">
                <h3 className="font-semibold mb-2">Số đã được gọi:</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {gameState.calledNumbers.map((num) => (
                    <span
                      key={num}
                      className="bg-gray-200 px-2 py-1 rounded text-sm"
                    >
                      {num}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Your Board Only */}
            <div className="flex justify-center">
              {playerNumber === 1 && (
                <BingoBoard
                  board={gameState.player1Board}
                  playerName="Bảng của bạn (Người chơi 1)"
                  isCurrentPlayer={gameState.currentPlayer === 1}
                  gameStatus={gameState.gameStatus}
                  calledNumbers={gameState.calledNumbers}
                  onNumberClick={handleNumberClick}
                />
              )}
              {playerNumber === 2 && (
                <BingoBoard
                  board={gameState.player2Board}
                  playerName="Bảng của bạn (Người chơi 2)"
                  isCurrentPlayer={gameState.currentPlayer === 2}
                  gameStatus={gameState.gameStatus}
                  calledNumbers={gameState.calledNumbers}
                  onNumberClick={handleNumberClick}
                />
              )}
            </div>
          </>
        )}

        {/* Game End */}
        {roomId &&
          (gameState.gameStatus === "player1-wins" ||
            gameState.gameStatus === "player2-wins" ||
            gameState.gameStatus === "tie") && (
            <GameStatus
              gameState={gameState}
              playerNumber={playerNumber}
              onRestartGame={handleRestartGame}
            />
          )}
      </div>
    </div>
  );
}
