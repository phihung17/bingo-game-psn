import { BingoCell } from "../types/game";
import { countCompletedLines } from "../utils/gameUtils";

interface BingoBoardProps {
  board: BingoCell[][];
  playerName: string;
  isCurrentPlayer: boolean;
  gameStatus: string;
  calledNumbers: number[];
  onNumberClick?: (number: number) => void;
}

export default function BingoBoard({
  board,
  playerName,
  isCurrentPlayer,
  gameStatus,
  calledNumbers,
  onNumberClick,
}: BingoBoardProps) {
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
        {isCurrentPlayer && gameStatus === "playing" && (
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
              gameStatus === "playing" &&
              !calledNumbers.includes(cell.number);
            const isAlreadyCalled = calledNumbers.includes(cell.number);

            return (
              <div
                key={`${i}-${j}`}
                onClick={() => isClickable && onNumberClick?.(cell.number)}
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
}
