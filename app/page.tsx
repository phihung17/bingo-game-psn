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
import { Scoreboard } from "../components/Scoreboard";

export default function BingoGame() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    player1Board: [],
    player2Board: [],
    currentPlayer: 1,
    calledNumbers: [],
    gameStatus: "waiting",
    scoreboard: { player1: 0, player2: 0 },
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
      <div className="max-w-6xl mx-auto my-8">
        <h1 className="text-2xl md:text-4xl font-bold text-center text-gray-800">
          🎯 Game Bingo Online - 2 Người Chơi
        </h1>

        <ConnectionStatus isConnected={isConnected} />

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

        {/* Scoreboard */}
        {roomId && (
          <div className="mb-6">
            <Scoreboard
              scoreboard={gameState.scoreboard}
              playerNumber={playerNumber}
            />
          </div>
        )}

        {/* Waiting for players */}
        {roomId && gameState.gameStatus === "waiting" && (
          <div className="text-center mb-8">
            {(gameState.players?.length || 0) < 2 ? (
              <div className="bg-linear-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 text-yellow-800 px-6 py-4 rounded-r-xl shadow-lg max-w-2xl mx-auto">
                <div className="flex items-center justify-center mb-2">
                  <h2 className="text-xl font-bold">
                    Đang chờ người chơi thứ 2...
                  </h2>
                </div>
                <p className="text-yellow-700">
                  Chia sẻ mã phòng để mời bạn bè tham gia!
                </p>
              </div>
            ) : (
              <div className="bg-linear-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 text-blue-800 px-6 py-4 rounded-r-xl shadow-lg max-w-2xl mx-auto">
                <div className="flex items-center justify-center mb-2">
                  <svg
                    className="w-6 h-6 text-blue-500 mr-3 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <h2 className="text-xl font-bold">Đang khởi tạo game...</h2>
                </div>
              </div>
            )}
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
