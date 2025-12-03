export default function Instructions() {
  return (
    <div className="mt-8 bg-white rounded-lg p-6 shadow-md">
      <h3 className="text-lg font-semibold mb-3">📋 Cách chơi Online:</h3>
      <ul className="text-sm text-gray-700 space-y-1">
        <li>• Tạo phòng hoặc tham gia phòng bằng mã phòng</li>
        <li>
          • <strong>🎯 Tự tạo bảng:</strong> Nhập 25 số khác nhau từ 1-25 vào
          bảng 5x5
        </li>
        <li>
          • Có thể dùng "Tự động điền" để tạo bảng ngẫu nhiên rồi chỉnh sửa
        </li>
        <li>
          • <strong>Bạn chỉ thấy bảng của mình</strong> - không thấy bảng của
          đối thủ
        </li>
        <li>
          • <strong>🤫 Tiến độ hoàn toàn bí mật</strong> - không ai biết đối thủ
          đang ở đâu
        </li>
        <li>
          • Hai người chơi luân phiên gọi số bằng cách{" "}
          <strong>click vào số trên bảng</strong>
        </li>
        <li>
          • Khi một số được gọi, nó sẽ được đánh dấu trên cả hai bảng (nếu có)
        </li>
        <li>• Số đã được gọi sẽ có màu xám và không thể click lại</li>
        <li>• Mỗi hàng/cột/chéo hoàn thành = 1 hàng Bingo</li>
        <li>• Người đầu tiên hoàn thành 5 hàng Bingo sẽ thắng</li>
        <li>• Nếu cả hai cùng đạt 5 hàng trong một lượt thì sẽ hòa</li>
      </ul>
    </div>
  );
}
