"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface BingoCell {
  number: number;
  isMarked: boolean;
}

type GameStatus =
  | "waiting"
  | "board-creation"
  | "playing"
  | "player1-wins"
  | "player2-wins"
  | "tie";

interface Player {
  playerNumber: number;
  name: string;
  isConnected: boolean;
}

interface GameState {
  player1Board: BingoCell[][];
  player2Board: BingoCell[][];
  currentPlayer: 1 | 2;
  calledNumbers: number[];
  gameStatus: GameStatus;
  yourPlayerNumber?: number;
  players?: Player[];
}

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
  const socketRef = useRef<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io();
    socketRef.current = newSocket;
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
      setError(errorData.message);
      setTimeout(() => setError(""), 3000);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Đếm số hàng Bingo đã hoàn thành
  const countCompletedLines = useCallback((board: BingoCell[][]): number => {
    let completedLines = 0;

    // Kiểm tra hàng ngang
    for (let i = 0; i < 5; i++) {
      if (board[i]?.every((cell) => cell.isMarked)) {
        completedLines++;
      }
    }

    // Kiểm tra hàng dọc
    for (let j = 0; j < 5; j++) {
      if (board.every((row) => row[j]?.isMarked)) {
        completedLines++;
      }
    }

    // Kiểm tra đường chéo chính
    if (board.every((row, i) => row[i]?.isMarked)) {
      completedLines++;
    }

    // Kiểm tra đường chéo phụ
    if (board.every((row, i) => row[4 - i]?.isMarked)) {
      completedLines++;
    }

    return completedLines;
  }, []);

  // Join or create room
  const handleJoinRoom = () => {
    if (socket) {
      socket.emit("joinRoom", inputRoomId || undefined);
      setInputRoomId("");
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
      setError("Vui lòng nhập đủ 25 số!");
      setTimeout(() => setError(""), 3000);
      return;
    }

    // Check for duplicates
    const uniqueNumbers = new Set(numbers);
    if (uniqueNumbers.size !== 25) {
      setError("Không được trùng số!");
      setTimeout(() => setError(""), 3000);
      return;
    }

    // Check range
    for (let num of numbers) {
      if (num < 1 || num > 25) {
        setError("Tất cả số phải từ 1-25!");
        setTimeout(() => setError(""), 3000);
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

  // Handle number click
  const handleNumberClick = (number: number) => {
    if (gameState.calledNumbers.includes(number)) {
      setError("Số này đã được gọi rồi!");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (socket && roomId) {
      socket.emit("callNumber", { number, roomId });
    }
  };

  // Render board with player info
  const renderBoard = (
    board: BingoCell[][],
    playerName: string,
    isCurrentPlayer: boolean
  ) => {
    if (!board || board.length === 0) return null;

    const completedLines = countCompletedLines(board);
    return (
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 mb-2">
          <h2
            className={`text-xl font-bold ${
              isCurrentPlayer ? "text-green-600" : "text-blue-600"
            }`}
          >
            {playerName}
          </h2>
          {isCurrentPlayer && gameState.gameStatus === "playing" && (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold">
              Lượt của bạn - Click số để gọi
            </span>
          )}
        </div>
        <div className="mb-3 text-center">
          <span className="text-sm font-semibold text-gray-700">
            Hàng Bingo: {completedLines}/5
          </span>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedLines / 5) * 100}%` }}
            ></div>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-1 bg-gray-300 p-2 rounded-lg">
          {board.map((row, i) =>
            row.map((cell, j) => {
              const isClickable =
                isCurrentPlayer &&
                gameState.gameStatus === "playing" &&
                !gameState.calledNumbers.includes(cell.number);
              const isAlreadyCalled = gameState.calledNumbers.includes(
                cell.number
              );

              return (
                <div
                  key={`${i}-${j}`}
                  onClick={() => isClickable && handleNumberClick(cell.number)}
                  className={`
                    w-12 h-12 flex items-center justify-center text-sm font-bold rounded
                    transition-all duration-200
                    ${
                      cell.isMarked
                        ? "bg-green-500 text-white"
                        : isAlreadyCalled
                        ? "bg-gray-400 text-gray-600"
                        : isClickable
                        ? "bg-white text-gray-800 border border-gray-400 hover:bg-blue-100 hover:border-blue-500 cursor-pointer transform hover:scale-105"
                        : "bg-white text-gray-800 border border-gray-400"
                    }
                  `}
                  title={
                    isClickable
                      ? `Click để gọi số ${cell.number}`
                      : isAlreadyCalled
                      ? `Số ${cell.number} đã được gọi`
                      : ""
                  }
                >
                  {cell.number}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-purple-50 p-4 text-black">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          🎯 Game Bingo Online - 2 Người Chơi
        </h1>

        {/* Connection Status */}
        <div className="text-center mb-4">
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              isConnected
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {isConnected ? "🟢 Đã kết nối" : "🔴 Mất kết nối"}
          </span>
        </div>

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
          <div className="text-center mb-8">
            <div className="bg-white rounded-lg p-6 shadow-md inline-block">
              <h2 className="text-xl font-semibold mb-4">
                Tham gia phòng chơi
              </h2>
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  value={inputRoomId}
                  onChange={(e) => setInputRoomId(e.target.value)}
                  placeholder="Nhập mã phòng (để trống để tạo phòng mới)"
                  className="border border-gray-300 rounded px-3 py-2 w-64"
                  onKeyPress={(e) => e.key === "Enter" && handleJoinRoom()}
                />
                <button
                  onClick={handleJoinRoom}
                  disabled={!isConnected}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded font-semibold"
                >
                  {inputRoomId ? "Tham gia" : "Tạo phòng"}
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Chia sẻ mã phòng với bạn bè để chơi cùng!
              </p>
            </div>
          </div>
        )}

        {/* Room Info */}
        {roomId && (
          <div className="text-center mb-6">
            <div className="bg-white rounded-lg p-4 shadow-md inline-block">
              <p className="font-semibold">
                Mã phòng:{" "}
                <span className="text-blue-600 font-mono text-lg">
                  {roomId}
                </span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Bạn là:{" "}
                <span className="font-semibold">Người chơi {playerNumber}</span>
              </p>
              <p className="text-sm text-gray-600">
                Người chơi trong phòng: {gameState.players?.length || 0}/2
              </p>
            </div>
          </div>
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
          <div className="mb-8">
            <div className="text-center mb-6">
              <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
                <p className="font-semibold">Tạo bảng Bingo của bạn!</p>
                <p className="text-sm mt-1">
                  Nhập 25 số khác nhau từ 1-25 vào các ô bên dưới
                </p>
              </div>
            </div>

            <div className="max-w-2xl mx-auto">
              {/* Board Input Grid */}
              <div className="bg-white rounded-lg p-6 shadow-md mb-6">
                <h3 className="text-lg font-semibold mb-4 text-center">
                  Bảng của bạn (Người chơi {playerNumber})
                </h3>

                <div className="grid grid-cols-5 gap-2 mb-4">
                  {boardInput.map((value, index) => (
                    <input
                      key={index}
                      type="number"
                      min="1"
                      max="25"
                      value={value}
                      onChange={(e) =>
                        handleBoardInputChange(index, e.target.value)
                      }
                      className="w-12 h-12 text-center border border-gray-300 rounded font-bold text-sm focus:border-blue-500 focus:outline-none"
                      placeholder={(index + 1).toString()}
                      disabled={isSubmittingBoard}
                    />
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4">
                  <button
                    onClick={handleAutoFillBoard}
                    disabled={isSubmittingBoard}
                    className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-4 py-2 rounded font-semibold"
                  >
                    Tự động điền
                  </button>
                  <button
                    onClick={handleSubmitBoard}
                    disabled={isSubmittingBoard}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-2 rounded font-semibold"
                  >
                    {isSubmittingBoard ? "Đang gửi..." : "Xác nhận bảng"}
                  </button>
                </div>

                {/* Instructions */}
                <div className="mt-4 text-sm text-gray-600 text-center">
                  <p>
                    💡 Mẹo: Sử dụng "Tự động điền" để tạo bảng ngẫu nhiên, sau
                    đó chỉnh sửa theo ý muốn
                  </p>
                </div>
              </div>

              {/* Waiting for other player */}
              {((playerNumber === 1 && gameState.player1Board.length > 0) ||
                (playerNumber === 2 && gameState.player2Board.length > 0)) && (
                <div className="text-center">
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    <p className="font-semibold">
                      ✅ Bảng của bạn đã được xác nhận!
                    </p>
                    <p className="text-sm mt-1">
                      Đang chờ đối thủ hoàn thành bảng...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
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
              {playerNumber === 1 &&
                renderBoard(
                  gameState.player1Board,
                  "Bảng của bạn (Người chơi 1)",
                  gameState.currentPlayer === 1
                )}
              {playerNumber === 2 &&
                renderBoard(
                  gameState.player2Board,
                  "Bảng của bạn (Người chơi 2)",
                  gameState.currentPlayer === 2
                )}
            </div>

            {/* Game Info - No Progress Shown */}
            {/* <div className="mt-6 text-center">
              <div className="bg-white rounded-lg p-4 shadow-md inline-block">
                <h3 className="font-semibold mb-2">Thông tin game:</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <div>
                    Đối thủ:{" "}
                    {playerNumber === 1 ? "Người chơi 2" : "Người chơi 1"}
                  </div>
                  <div className="text-xs text-gray-500">
                    🤫 Tiến độ được giữ bí mật
                  </div>
                </div>
              </div>
            </div> */}
          </>
        )}

        {/* Game End */}
        {roomId &&
          (gameState.gameStatus === "player1-wins" ||
            gameState.gameStatus === "player2-wins" ||
            gameState.gameStatus === "tie") && (
            <div className="text-center">
              <div className="bg-white rounded-lg p-8 shadow-lg inline-block">
                {gameState.gameStatus === "tie" && (
                  <div>
                    <h2 className="text-3xl font-bold text-yellow-600 mb-4">
                      🤝 Hòa!
                    </h2>
                    <p className="text-lg mb-4">
                      Cả hai người chơi đều thắng cùng lúc!
                    </p>
                  </div>
                )}
                {gameState.gameStatus === "player1-wins" && (
                  <div>
                    <h2 className="text-3xl font-bold text-green-600 mb-4">
                      🎉 Người chơi 1 Thắng!
                    </h2>
                    <p className="text-lg mb-4">
                      Chúc mừng! Bạn đã hoàn thành 5 hàng Bingo!
                    </p>
                  </div>
                )}
                {gameState.gameStatus === "player2-wins" && (
                  <div>
                    <h2 className="text-3xl font-bold text-green-600 mb-4">
                      🎉 Người chơi 2 Thắng!
                    </h2>
                    <p className="text-lg mb-4">
                      Chúc mừng! Bạn đã hoàn thành 5 hàng Bingo!
                    </p>
                  </div>
                )}

                {/* Your Final Board */}
                <div className="flex justify-center mb-6">
                  {playerNumber === 1 &&
                    renderBoard(
                      gameState.player1Board,
                      "Bảng của bạn (Người chơi 1)",
                      false
                    )}
                  {playerNumber === 2 &&
                    renderBoard(
                      gameState.player2Board,
                      "Bảng của bạn (Người chơi 2)",
                      false
                    )}
                </div>

                {/* Final Results Summary */}
                <div className="mb-6 bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Thống kê game:</h3>
                  <div className="text-sm space-y-1">
                    <div className="text-center">
                      Tổng số đã gọi: {gameState.calledNumbers.length} số
                    </div>
                    <div className="text-xs text-gray-600 text-center mt-2">
                      🎯 Game kết thúc khi có người đạt 5 hàng Bingo
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleRestartGame}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold"
                >
                  Chơi Lại
                </button>
              </div>
            </div>
          )}

        {/* Instructions */}
        {/* <div className="mt-8 bg-white rounded-lg p-6 shadow-md">
          <h3 className="text-lg font-semibold mb-3">📋 Cách chơi Online:</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Tạo phòng hoặc tham gia phòng bằng mã phòng</li>
            <li>
              • <strong>🎯 Tự tạo bảng:</strong> Nhập 25 số khác nhau từ 1-25
              vào bảng 5x5
            </li>
            <li>
              • Có thể dùng "Tự động điền" để tạo bảng ngẫu nhiên rồi chỉnh sửa
            </li>
            <li>
              • <strong>Bạn chỉ thấy bảng của mình</strong> - không thấy bảng
              của đối thủ
            </li>
            <li>
              • <strong>🤫 Tiến độ hoàn toàn bí mật</strong> - không ai biết đối
              thủ đang ở đâu
            </li>
            <li>
              • Hai người chơi luân phiên gọi số bằng cách{" "}
              <strong>click vào số trên bảng</strong>
            </li>
            <li>
              • Khi một số được gọi, nó sẽ được đánh dấu trên cả hai bảng (nếu
              có)
            </li>
            <li>• Số đã được gọi sẽ có màu xám và không thể click lại</li>
            <li>• Mỗi hàng/cột/chéo hoàn thành = 1 hàng Bingo</li>
            <li>• Người đầu tiên hoàn thành 5 hàng Bingo sẽ thắng</li>
            <li>• Nếu cả hai cùng đạt 5 hàng trong một lượt thì sẽ hòa</li>
          </ul>
        </div> */}
      </div>
    </div>
  );
}
