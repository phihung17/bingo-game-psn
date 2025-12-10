"use client";

import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  ContactShadows,
} from "@react-three/drei";
import { BingoCell } from "../types/game";
import { countCompletedLines } from "../utils/gameUtils";
import BingoKey from "./BingoKey";

interface BingoBoardProps {
  board: BingoCell[][];
  playerName: string;
  isCurrentPlayer: boolean;
  gameStatus: string;
  calledNumbers: number[];
  onNumberClick?: (number: number) => void;
}

export default function BingoBoard3D({
  board,
  playerName,
  isCurrentPlayer,
  gameStatus,
  calledNumbers,
  onNumberClick,
}: BingoBoardProps) {
  if (!board || board.length === 0) return null;

  const completedLines = countCompletedLines(board);

  // Calculate grid positions
  // Grid is 5x5. Center is (0,0).
  // Spacing 1.0 unit.
  // Range: -2 to 2.

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex flex-col md:flex-row items-center gap-2 mb-2">
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

      <div className="mb-3 text-center w-full max-w-md">
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

      {/* 3D Scene Container */}
      <div className="w-full h-[500px] bg-linear-to-b from-gray-100 to-gray-200 rounded-xl shadow-inner border border-gray-300 relative overflow-hidden">
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 6, 4]} fov={50} />
          <OrbitControls
            enableZoom={false}
            maxPolarAngle={Math.PI / 2.5}
            minPolarAngle={Math.PI / 6}
          />

          <ambientLight intensity={0.5} />
          <directionalLight
            position={[5, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <Environment preset="city" />

          <group position={[0, -0.5, 0]}>
            {/* Base Plate */}
            <mesh position={[0, -0.3, 0]} receiveShadow>
              <boxGeometry args={[5.5, 0.2, 5.5]} />
              <meshStandardMaterial color="#475569" roughness={0.4} />
            </mesh>

            {/* Keys */}
            {board.map((row, i) =>
              row.map((cell, j) => {
                const isClickable =
                  isCurrentPlayer &&
                  gameStatus === "playing" &&
                  !calledNumbers.includes(cell.number);
                const isAlreadyCalled = calledNumbers.includes(cell.number);

                // Map indices 0..4 to local coordinates -2..2
                const x = j - 2;
                const z = i - 2;

                return (
                  <BingoKey
                    key={`${i}-${j}`}
                    cell={cell}
                    position={[x * 1, 0, z * 1]}
                    isClickable={isClickable}
                    isAlreadyCalled={isAlreadyCalled}
                    onClick={() => isClickable && onNumberClick?.(cell.number)}
                  />
                );
              })
            )}
          </group>

          <ContactShadows
            position={[0, -0.5, 0]}
            opacity={0.4}
            scale={10}
            blur={2.5}
            far={1}
          />
        </Canvas>
      </div>

      <p className="mt-2 text-xs text-gray-500 italic">
        * Kéo để xoay góc nhìn, click để chọn số
      </p>
    </div>
  );
}
