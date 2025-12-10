import { Scoreboard as ScoreboardData } from "../types/game";

export function Scoreboard({ scoreboard, playerNumber }: ScoreboardProps) {
  return (
    <div className="bg-light-blue/50 rounded-lg shadow-xl p-6 border-4 border-navy-blue max-w-md mx-auto">
      {/* Combined Player Blocks */}
      <div className="">
        <div className="flex items-center justify-between">
          {/* Player 1 Block */}
          <div className="text-center space-y-2 flex-1">
            <div className="text-xs text-gray-600 font-mono tracking-wide">
              PLAYER 1
            </div>
            <div className="text-sm font-bold tracking-wider text-gray-800">
              {playerNumber === 1 ? "BẠN" : "ĐỐI THỦ"}
            </div>
            <div className="text-3xl font-mono font-bold tracking-wider text-gray-800">
              {String(scoreboard.player1).padStart(2, "0")}
            </div>
          </div>

          {/* Separator */}
          <div className="px-4">
            <div className="text-3xl font-mono font-bold text-blue-400 animate-pulse">
              :
            </div>
          </div>

          {/* Player 2 Block */}
          <div className="text-center space-y-2 flex-1">
            <div className="text-xs text-gray-600 font-mono tracking-wide">
              PLAYER 2
            </div>
            <div className="text-sm font-bold tracking-wider text-pink-500">
              {playerNumber === 2 ? "BẠN" : "ĐỐI THỦ"}
            </div>
            <div className="text-3xl font-mono font-bold tracking-wider text-pink-500">
              {String(scoreboard.player2).padStart(2, "0")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ScoreboardProps {
  scoreboard: ScoreboardData;
  playerNumber: number | null;
}
