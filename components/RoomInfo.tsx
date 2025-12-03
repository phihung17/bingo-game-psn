import { GameState } from "../types/game";

interface RoomInfoProps {
  roomId: string;
  playerNumber: number | null;
  gameState: GameState;
}

export default function RoomInfo({
  roomId,
  playerNumber,
  gameState,
}: RoomInfoProps) {
  return (
    <div className="text-center mb-6">
      <div className="bg-white rounded-lg p-4 shadow-md inline-block">
        <p className="font-semibold">
          Mã phòng:{" "}
          <span className="text-blue-600 font-mono text-lg">{roomId}</span>
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
  );
}
