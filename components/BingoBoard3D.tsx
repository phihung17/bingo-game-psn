"use client";

import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  ContactShadows,
  RoundedBox,
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
      <div className="w-full h-[500px] bg-[#fdf2f8] rounded-xl shadow-inner border border-pink-100 relative overflow-hidden">
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 9, 6]} fov={40} />
          <OrbitControls
            enableZoom={false}
            maxPolarAngle={Math.PI / 2.2}
            minPolarAngle={Math.PI / 6}
          />

          <ambientLight intensity={0.9} />
          <directionalLight
            position={[5, 12, 5]}
            intensity={0.8}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0001}
          />
          <Environment preset="studio" />

          <group position={[0, -0.5, 0]}>
            {/* Replaced Base Plate with KeyboardCase */}
            <KeyboardCase />

            {/* Keys - Lifted up to sit on the plate */}
            <group position={[0, 0.6, 0]}>
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
                      onClick={() =>
                        isClickable && onNumberClick?.(cell.number)
                      }
                    />
                  );
                })
              )}
            </group>
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

function KeyboardCase() {
  return (
    <group>
      {/* Main Base - Thick Chunky Wedge Case */}
      <RoundedBox
        args={[6.2, 1.2, 6.2]} // Wider bezel relative to 5x5 grid
        radius={0.4}
        smoothness={8}
        position={[0, -0.2, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#fce7f3" roughness={0.2} metalness={0.0} />
      </RoundedBox>

      {/* Inner Plate/Slight Recess - Darker pink to creating depth contrast */}
      <RoundedBox
        args={[5.4, 0.5, 5.4]}
        radius={0.1}
        position={[0, 0.3, 0]} // Sitting slightly above center of thick base, but below keys
        receiveShadow
      >
        <meshStandardMaterial color="#fbcfe8" roughness={0.5} />
      </RoundedBox>
    </group>
  );
}
