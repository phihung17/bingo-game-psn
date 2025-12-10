"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { BingoCell } from "../types/game";

interface BingoKeyProps {
  cell: BingoCell;
  position: [number, number, number];
  isClickable: boolean;
  isAlreadyCalled: boolean;
  onClick: () => void;
}

export default function BingoKey({
  cell,
  position,
  isClickable,
  isAlreadyCalled,
  onClick,
}: BingoKeyProps) {
  const groupRef = useRef<THREE.Group>(null); // Animate the whole group (box + text)
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  // Enhanced Color Palette
  let baseColor = "#f3f4f6"; // Gray-100 (Default)
  let textColor = "#1f2937"; // Gray-800

  if (cell.isMarked) {
    baseColor = "#15803d"; // Green-700 (Darker for better contrast)
    textColor = "#ffffff"; // White text
  } else if (isAlreadyCalled) {
    baseColor = "#9ca3af"; // Gray-400
    textColor = "#7f1d1d"; // Red-900 (Dark Red)
  } else if (isClickable) {
    if (pressed) {
      baseColor = "#93c5fd"; // Blue-300
    } else if (hovered) {
      baseColor = "#bfdbfe"; // Blue-200
      textColor = "#1e40af"; // Blue-800
    }
  }

  // Animation logic
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Hover effect: Use LOCAL position changes relative to the parent group
      // The parent <group> sets the grid position.
      // This inner <group> handles the vertical animation.

      const targetY =
        hovered && isClickable && !pressed ? 0.2 : pressed ? -0.1 : 0;

      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        targetY,
        delta * 15 // Snappier animation
      );
    }
  });

  return (
    <group position={position}>
      {/* Inner group for animation so text and box move together */}
      <group ref={groupRef}>
        <RoundedBox
          args={[0.8, 0.4, 0.8]} // Width, Height, Depth
          radius={0.08} // Slightly more rounded
          smoothness={4}
          onPointerOver={() => {
            if (isClickable) {
              setHovered(true);
              document.body.style.cursor = "pointer";
            }
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = "auto";
          }}
          onPointerDown={() => isClickable && setPressed(true)}
          onPointerUp={() => {
            setPressed(false);
            if (isClickable) onClick();
          }}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={baseColor}
            roughness={0.3}
            metalness={0.1}
          />
        </RoundedBox>

        {/* Number Text - Parented to the animated group, so it stays with the box */}
        <Text
          position={[0, 0.21, 0]} // Just above the surface (0.2)
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.35}
          fontWeight="bold" // Make text bolder
          color={textColor}
          anchorX="center"
          anchorY="middle"
          renderOrder={1} // Help with z-fighting
        >
          {cell.number}
        </Text>
      </group>
    </group>
  );
}
