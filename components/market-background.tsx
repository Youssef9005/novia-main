"use client"

import { useRef, useEffect, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { useInView } from "framer-motion"
import { Environment, Line } from "@react-three/drei"
import { Mesh, Group, Material } from "three"

interface CandleStickProps {
  position?: [number, number, number]
  height?: number
  width?: number
  color?: string
  up?: boolean
}

function CandleStick({ position = [0, 0, 0], height = 1, width = 0.2, color = "green", up = true }: CandleStickProps) {
  // Properly type the points ref to match what Line component expects
  const points = useRef<[number, number, number][]>([
    [0, 0, 0],
    [0, 0, 0],
  ])

  useEffect(() => {
    // Create a candlestick shape
    const x = position[0]
    const y = position[1]
    const z = position[2]

    // Ensure positive height
    const safeHeight = Math.max(0.1, Math.abs(height))

    // Wick
    points.current = [
      [x, y - safeHeight / 2, z],
      [x, y + safeHeight / 2, z],
    ]
  }, [position, height, width])

  return (
    <>
      <Line points={points.current} color={up ? "#22c55e" : "#ef4444"} lineWidth={1} />
      <mesh position={position}>
        <boxGeometry args={[width, Math.max(0.1, height / 2), width]} />
        <meshStandardMaterial color={up ? "#22c55e" : "#ef4444"} transparent opacity={0.7} />
      </mesh>
    </>
  )
}

interface ChartLineProps {
  color?: string
  offset?: number
  scrollY?: number
}

function ChartLine({ color = "#3b82f6", offset = 0, scrollY = 0 }: ChartLineProps) {
  // Properly type the linePoints ref to match what Line component expects
  const linePoints = useRef<[number, number, number][]>([
    [0, 0, 0],
    [0.1, 0.1, 0],
  ])
  const line = useRef<any>(null)

  useEffect(() => {
    // Create a wavy line simulating a chart
    const points: [number, number, number][] = []
    const segments = 100
    const curve = 5

    for (let i = 0; i < segments; i++) {
      const x = (i - segments / 2) * 0.2
      const y = Math.sin(i * 0.2 + offset) * 0.5 + Math.sin(i * 0.1) * 0.5 + Math.cos(i * 0.05) * 0.5
      const z = Math.cos(i * 0.1) * 0.5
      points.push([x, y, z])
    }

    // Only update if we have valid points
    if (points.length >= 2) {
      linePoints.current = points
    }
  }, [offset])

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * 0.1
    if (line.current) {
      line.current.material.opacity = Math.sin(t) * 0.2 + 0.8

      // Add subtle movement based on scroll
      line.current.position.y = Math.sin(t * 5) * 0.05 - scrollY * 0.0005
    }
  })

  return (
    <Line
      ref={line}
      points={linePoints.current}
      color={color}
      lineWidth={1.5}
      transparent
      opacity={0.6}
    />
  )
}

interface ParticleProps {
  scrollY?: number
}

function Particle({ scrollY = 0 }: ParticleProps) {
  const mesh = useRef<Mesh>(null)
  const initialPosition = useRef<[number, number, number]>([(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10])
  const speed = useRef<number>(Math.random() * 0.02 + 0.01)

  useFrame((state) => {
    if (mesh.current) {
      // Continuous movement
      mesh.current.position.y =
        initialPosition.current[1] + Math.sin(state.clock.getElapsedTime() * speed.current * 5) * 2

      // Scroll-based movement
      mesh.current.position.x = initialPosition.current[0] - scrollY * 0.001 * speed.current

      // Reset position when it goes off screen
      if (mesh.current.position.x < -15) {
        mesh.current.position.x = 15
      }
    }
  })

  return (
    <mesh ref={mesh} position={initialPosition.current}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshStandardMaterial
        color={["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"][Math.floor(Math.random() * 5)]}
        emissive={["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"][Math.floor(Math.random() * 5)]}
        emissiveIntensity={0.5}
        transparent
        opacity={0.7}
      />
    </mesh>
  )
}

interface SceneProps {
  scrollY?: number
}

function Scene({ scrollY = 0 }: SceneProps) {
  const group = useRef<Group>(null)

  useFrame((state) => {
    if (group.current) {
      // Base rotation
      group.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.2
      group.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.05) * 0.1

      // Add scroll-based effects
      group.current.position.y = -scrollY * 0.001
      group.current.rotation.z = scrollY * 0.0001
    }
  })

  return (
    <group ref={group}>
      <ChartLine color="#3b82f6" offset={0} scrollY={scrollY} />
      <ChartLine color="#8b5cf6" offset={2} scrollY={scrollY} />
      <ChartLine color="#10b981" offset={4} scrollY={scrollY} />
      <ChartLine color="#64748b" offset={6} scrollY={scrollY} />

      {[-5, -3, -1, 1, 3, 5].map((pos, i) => (
        <CandleStick
          key={i}
          position={[pos, Math.sin(pos) * 0.5, 0]}
          height={Math.max(0.2, Math.abs(Math.sin(pos * 0.5) + 0.5) * 0.8)}
          up={i % 2 === 0}
        />
      ))}

      {/* Add floating particles - reduced count for performance */}
      {Array.from({ length: 20 }).map((_, i) => (
        <Particle key={i} scrollY={scrollY} />
      ))}
    </group>
  )
}

export default function MarketBackground() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref)
  const [scrollY, setScrollY] = useState<number>(0)
  const [isClient, setIsClient] = useState<boolean>(false)

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Handle scroll manually
  useEffect(() => {
    if (!isClient) return

    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // Initialize

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [isClient])

  return (
    <div ref={ref} className="h-full w-full bg-black">
      {isInView && isClient && (
        <Canvas
          camera={{ position: [0, 0, 10], fov: 30 }}
          dpr={[1, 2]}
          className="bg-gradient-to-b from-black via-gray-950 to-gray-900"
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 10]} intensity={1} />
          <Scene scrollY={scrollY} />
          <Environment preset="city" />
        </Canvas>
      )}
    </div>
  )
}
