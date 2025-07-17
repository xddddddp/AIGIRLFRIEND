"use client"

import { useRef } from "react"
import type * as THREE from "three"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Environment } from "@react-three/drei"

interface VRMViewerProps {
  emotion: string
  isSpeaking: boolean
}

function VRMModel({ emotion, isSpeaking }: VRMViewerProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { scene } = useThree()

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle floating animation
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1

      // Breathing effect
      const breathScale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02
      meshRef.current.scale.setScalar(breathScale)

      // Speaking animation
      if (isSpeaking) {
        meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 10) * 0.05
      }
    }
  })

  // Emotion-based color changes
  const getEmotionColor = () => {
    switch (emotion) {
      case "happy":
        return "#ff69b4"
      case "angry":
        return "#ff4444"
      case "love":
        return "#ff1493"
      case "blush":
        return "#ffb6c1"
      default:
        return "#dda0dd"
    }
  }

  return (
    <group>
      {/* Placeholder 3D character - replace with actual VRM model */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <boxGeometry args={[1, 1.5, 0.5]} />
        <meshStandardMaterial color={getEmotionColor()} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[0.4]} />
        <meshStandardMaterial color="#ffdbac" />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.15, 1.1, 0.3]}>
        <sphereGeometry args={[0.05]} />
        <meshStandardMaterial color={emotion === "angry" ? "#ff0000" : "#ff69b4"} />
      </mesh>
      <mesh position={[0.15, 1.1, 0.3]}>
        <sphereGeometry args={[0.05]} />
        <meshStandardMaterial color={emotion === "angry" ? "#ff0000" : "#ff69b4"} />
      </mesh>

      {/* Hair */}
      <mesh position={[0, 1.3, -0.1]}>
        <sphereGeometry args={[0.5, 8, 6]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>

      {/* Speaking indicator */}
      {isSpeaking && (
        <mesh position={[0, 0.8, 0.4]}>
          <sphereGeometry args={[0.1]} />
          <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.5} />
        </mesh>
      )}
    </group>
  )
}

export default function VRMViewer({ emotion, isSpeaking }: VRMViewerProps) {
  return (
    <div className="w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-purple-900/20 to-purple-800/40">
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <pointLight position={[-5, -5, -5]} intensity={0.4} color="#ff69b4" />

        <VRMModel emotion={emotion} isSpeaking={isSpeaking} />

        <OrbitControls enablePan={false} enableZoom={false} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 3} />

        <Environment preset="sunset" />
      </Canvas>

      {/* VRM Model placeholder text */}
      <div className="absolute bottom-4 left-4 right-4 text-center">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2">
          <div className="text-white text-sm opacity-60">VRM Model Placeholder</div>
          <div className="text-white text-xs opacity-40">Replace with VRoid Studio model</div>
        </div>
      </div>
    </div>
  )
}
