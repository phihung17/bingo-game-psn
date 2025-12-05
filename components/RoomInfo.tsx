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
    <div className="mx-auto max-w-lg mb-6">
      <div className="flex items-center justify-center mb-3">
        <h3 className="text-lg font-bold">Phòng {roomId}</h3>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="text-center">
          <p className="font-semibold">Vai trò</p>
          <p className="">Player {playerNumber}</p>
        </div>
        <div className="text-center">
          <p className="font-semibold">Trạng thái</p>
          <p className="">{gameState.players?.length || 0}/2</p>
        </div>
      </div>
    </div>
  );
}
