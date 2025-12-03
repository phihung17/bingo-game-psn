import { BingoCell } from '../types/game';

interface BoardCreationProps {
  playerNumber: number | null;
  boardInput: string[];
  setBoardInput: (board: string[]) => void;
  isSubmittingBoard: boolean;
  onSubmitBoard: () => void;
  onAutoFillBoard: () => void;
  gameState: {
    player1Board: BingoCell[][];
    player2Board: BingoCell[][];
  };
}

export default function BoardCreation({
  playerNumber,
  boardInput,
  setBoardInput,
  isSubmittingBoard,
  onSubmitBoard,
  onAutoFillBoard,
  gameState
}: BoardCreationProps) {
  const handleBoardInputChange = (index: number, value: string) => {
    const newBoardInput = [...boardInput];
    newBoardInput[index] = value;
    setBoardInput(newBoardInput);
  };

  return (
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
              onClick={onAutoFillBoard}
              disabled={isSubmittingBoard}
              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-4 py-2 rounded font-semibold"
            >
              Tự động điền
            </button>
            <button
              onClick={onSubmitBoard}
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
  );
}
