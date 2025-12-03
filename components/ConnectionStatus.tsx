interface ConnectionStatusProps {
  isConnected: boolean;
}

export default function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  return (
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
  );
}
