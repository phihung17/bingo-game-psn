interface RoomManagementProps {
  isConnected: boolean;
  inputRoomId: string;
  setInputRoomId: (value: string) => void;
  onJoinRoom: () => void;
}

export default function RoomManagement({
  isConnected,
  inputRoomId,
  setInputRoomId,
  onJoinRoom,
}: RoomManagementProps) {
  return (
    <div className="text-center mb-8">
      <div className="bg-white rounded-lg p-6 shadow-md inline-block">
        <h2 className="text-xl font-semibold mb-4">Tham gia phòng chơi</h2>
        <div className="flex flex-col md:flex-row items-center gap-2 mb-4">
          <input
            type="text"
            value={inputRoomId}
            onChange={(e) => setInputRoomId(e.target.value)}
            placeholder="Nhập mã phòng (để trống để tạo phòng mới)"
            className="border border-gray-300 rounded px-3 py-2 w-full md:w-64"
            onKeyPress={(e) => e.key === "Enter" && onJoinRoom()}
          />
          <button
            onClick={onJoinRoom}
            disabled={!isConnected}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded font-semibold w-full md:w-auto"
          >
            {inputRoomId ? "Tham gia" : "Tạo phòng"}
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Chia sẻ mã phòng với bạn bè để chơi cùng!
        </p>
      </div>
    </div>
  );
}
