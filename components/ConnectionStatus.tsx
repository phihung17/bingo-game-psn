interface ConnectionStatusProps {
  isConnected: boolean;
}

export default function ConnectionStatus({
  isConnected,
}: ConnectionStatusProps) {
  return (
    <div className="text-center my-4">
      <div
        className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold shadow-md border ${
          isConnected
            ? "bg-green-100 text-green-800 border-green-300"
            : "bg-red-100 text-red-800 border-red-300"
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full mr-2 ${
            isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
          }`}
        ></div>
        {/* <svg
          className={`w-4 h-4 mr-2 ${
            isConnected ? "text-green-600" : "text-red-600"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isConnected ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728"
            />
          )}
        </svg> */}
        <span>{isConnected ? "Đã kết nối" : "Mất kết nối"}</span>
      </div>
    </div>
  );
}
