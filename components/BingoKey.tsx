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

  // Mechanical Keyboard Palette (Soft Pink/White)
  // Unified Style: All keys are White by default (clean look)
  let baseColor = "#fda7f3";
  let textColor = "#831843"; // Pink-900 (High Contrast Dark Pink)

  if (cell.isMarked) {
    baseColor = "#db2777"; // Pink-600 (Active/Marked) -> Deep Pink
    textColor = "#831843"; // White text on dark background
  } else if (isAlreadyCalled) {
    baseColor = "#f3f4f6"; // Gray-100 (Subtle gray for called)
    textColor = "#9ca3af"; // Gray-400 (Dimmed text)
  } else if (isClickable) {
    if (pressed) {
      baseColor = "#fce7f3"; // Pink-100 (Click feedback)
    } else if (hovered) {
      baseColor = "#fdf2f8"; // Pink-50 (Hover feedback)
      textColor = "#be185d"; // Pink-700 (Slightly brighter pink on hover)
    }
  }

  // Animation logic
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Hover effect: Use LOCAL position changes relative to the parent group
      // The parent <group> sets the grid position.
      // This inner <group> handles the vertical animation.

      const targetY =
        hovered && isClickable && !pressed ? 0.15 : pressed ? -0.1 : 0; // Slightly reduced bounce for cuteness

      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        targetY,
        delta * 20 // Ultra snappy/bouncy
      );
    }
  });

  return (
    <group position={position}>
      {/* Inner group for animation so text and box move together */}
      <group ref={groupRef}>
        <RoundedBox
          args={[0.85, 0.4, 0.85]} // Slightly wider/plumper
          radius={0.15} // Much rounder (Chibi/Marshmallow look)
          smoothness={8} // Smoother corners
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
            roughness={0.4} // Matte finish like candy
            metalness={0.1}
          />
        </RoundedBox>

        {/* Number Text - Parented to the animated group, so it stays with the box */}
        <Text
          position={[0, 0.21, 0]} // Just above the surface (0.2)
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.4} // Slightly larger, bolder font
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
