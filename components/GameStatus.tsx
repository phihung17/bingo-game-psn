import { GameState } from "../types/game";
import { countCompletedLines } from "../utils/gameUtils";

interface GameStatusProps {
  gameState: GameState;
  playerNumber: number | null;
  onRestartGame: () => void;
}

export default function GameStatus({
  gameState,
  playerNumber,
  onRestartGame,
}: GameStatusProps) {
  return (
    <div className="text-center">
      <div className="bg-white rounded-lg p-8 shadow-lg inline-block">
        {gameState.gameStatus === "tie" && (
          <div>
            <h2 className="text-3xl font-bold text-yellow-600 mb-4">🤝 Hòa!</h2>
            <p className="text-lg mb-4">
              Cả hai người chơi đều thắng cùng lúc!
            </p>
          </div>
        )}
        {(gameState.gameStatus === "player1-wins" ||
          gameState.gameStatus === "player2-wins") && (
          <div>
            {/* Kiểm tra xem người chơi hiện tại có thắng không */}
            {(gameState.gameStatus === "player1-wins" && playerNumber === 1) ||
            (gameState.gameStatus === "player2-wins" && playerNumber === 2) ? (
              <h2 className="text-3xl font-bold text-green-600 mb-4">
                Ez quá v
              </h2>
            ) : (
              <h2 className="text-3xl font-bold text-red-600 mb-4">
                U so khờ!
              </h2>
            )}
          </div>
        )}

        {/* Your Final Board */}
        <div className="flex justify-center mb-6">
          {playerNumber === 1 && gameState.player1Board && (
            <div className="text-center">
              <h3 className="font-semibold mb-2">Bảng của bạn</h3>
              <div className="grid grid-cols-5 gap-1 bg-gray-300 p-2 rounded-lg">
                {gameState.player1Board.map((row, i) =>
                  row.map((cell, j) => (
                    <div
                      key={`${i}-${j}`}
                      className={`
                        w-12 h-12 flex items-center justify-center text-sm font-bold rounded
                        ${
                          cell.isMarked
                            ? "bg-green-500 text-white"
                            : "bg-white text-gray-800 border border-gray-400"
                        }
                      `}
                    >
                      {cell.number}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {playerNumber === 2 && gameState.player2Board && (
            <div className="text-center">
              <h3 className="font-semibold mb-2">Bảng của bạn</h3>
              <div className="grid grid-cols-5 gap-1 bg-gray-300 p-2 rounded-lg">
                {gameState.player2Board.map((row, i) =>
                  row.map((cell, j) => (
                    <div
                      key={`${i}-${j}`}
                      className={`
                        w-12 h-12 flex items-center justify-center text-sm font-bold rounded
                        ${
                          cell.isMarked
                            ? "bg-green-500 text-white"
                            : "bg-white text-gray-800 border border-gray-400"
                        }
                      `}
                    >
                      {cell.number}
                    </div>
                  ))
                )}
              </div>
            </div>
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
          onClick={onRestartGame}
          className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold"
        >
          Chơi Lại
        </button>
      </div>
    </div>
  );
}
