"use client"

import { useRef, useEffect, useState } from "react"
import { motion, useMotionValue } from "framer-motion"
import { Canvas, useFrame } from "@react-three/fiber"
import { Float, Text3D, Environment, MeshTransmissionMaterial } from "@react-three/drei"

function FloatingSymbols() {
  const symbolsRef = useRef()

  useFrame((state) => {
    if (symbolsRef.current) {
      symbolsRef.current.rotation.y = state.clock.getElapsedTime() * 0.1
    }
  })

  return (
    <group ref={symbolsRef}>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <Text3D font="/fonts/Inter_Bold.json" size={0.6} height={0.1} position={[-2, 1, 0]} rotation={[0, -0.2, 0]}>
          FOREX
          <MeshTransmissionMaterial
            backside
            backsideThickness={0.3}
            thickness={0.1}
            distortionScale={0}
            temporalDistortion={0.1}
            transmissionSampler
            resolution={256}
            color="#3b82f6"
          />
        </Text3D>
      </Float>

      <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.4}>
        <Text3D font="/fonts/Inter_Bold.json" size={0.6} height={0.1} position={[1, -1, 0]} rotation={[0, 0.2, 0]}>
          CRYPTO
          <MeshTransmissionMaterial
            backside
            backsideThickness={0.3}
            thickness={0.1}
            distortionScale={0}
            temporalDistortion={0.1}
            transmissionSampler
            resolution={256}
            color="#8b5cf6"
          />
        </Text3D>
      </Float>

      <Float speed={1.8} rotationIntensity={0.25} floatIntensity={0.6}>
        <Text3D font="/fonts/Inter_Bold.json" size={0.6} height={0.1} position={[-1, -1.5, 0]} rotation={[0, -0.1, 0]}>
          STOCKS
          <MeshTransmissionMaterial
            backside
            backsideThickness={0.3}
            thickness={0.1}
            distortionScale={0}
            temporalDistortion={0.1}
            transmissionSampler
            resolution={256}
            color="#ef4444"
          />
        </Text3D>
      </Float>

      <Float speed={1.3} rotationIntensity={0.15} floatIntensity={0.3}>
        <Text3D font="/fonts/Inter_Bold.json" size={0.6} height={0.1} position={[2, 0.5, 0]} rotation={[0, 0.3, 0]}>
          GOLD
          <MeshTransmissionMaterial
            backside
            backsideThickness={0.3}
            thickness={0.1}
            distortionScale={0}
            temporalDistortion={0.1}
            transmissionSampler
            resolution={256}
            color="#f59e0b"
          />
        </Text3D>
      </Float>
    </group>
  )
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
      <FloatingSymbols />
      <Environment preset="city" />
    </>
  )
}

export function TransitionSection() {
  const containerRef = useRef(null)
  const scrollYMotion = useMotionValue(0)
  const [isClient, setIsClient] = useState(false)

  // Create static transform values
  const y = { transform: (value) => value * 0.2 - 100 }
  const opacity = {
    transform: (value) => {
      if (value < 0.2) return value * 5
      if (value > 0.8) return (1 - value) * 5
      return 1
    },
  }
  const scale = { transform: (value) => 0.8 + value * 0.2 }
  const rotateX = { transform: (value) => 10 - value * 20 }

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Handle scroll safely
  useEffect(() => {
    if (!isClient) return

    const calculateScrollProgress = () => {
      if (!containerRef.current) return

      const element = containerRef.current
      const elementTop = element.getBoundingClientRect().top
      const elementHeight = element.offsetHeight
      const windowHeight = window.innerHeight

      // Calculate progress (0 to 1)
      let progress = 1 - (elementTop + elementHeight) / (windowHeight + elementHeight)
      progress = Math.min(Math.max(progress, 0), 1)

      // Update the motion value
      scrollYMotion.set(progress)
    }

    window.addEventListener("scroll", calculateScrollProgress)
    calculateScrollProgress() // Initialize

    return () => {
      window.removeEventListener("scroll", calculateScrollProgress)
    }
  }, [isClient, scrollYMotion])

  // Calculate styles manually instead of using useTransform
  const getStyles = () => {
    const value = scrollYMotion.get()
    return {
      y: y.transform(value),
      opacity: opacity.transform(value),
      scale: scale.transform(value),
      rotateX: rotateX.transform(value),
    }
  }

  return (
    <section ref={containerRef} className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 z-0">
        {isClient && (
          <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
            <Scene />
          </Canvas>
        )}
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div className="text-center" style={isClient ? getStyles() : {}}>
          <motion.h2
            className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <span className="block">Choose Your</span>
            <span className="block mt-2 bg-gradient-to-r from-blue-400 via-purple-500 to-emerald-400 bg-clip-text text-transparent">
              Trading Assets
            </span>
          </motion.h2>

          <motion.p
            className="mt-6 text-xl text-gray-400 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            Our analysis covers a wide range of markets including forex, cryptocurrencies, stocks, commodities, and
            more. Select the assets that matter most to your trading strategy.
          </motion.p>

          <motion.div
            className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {[
              { name: "Forex", count: "20+ pairs" },
              { name: "Crypto", count: "50+ coins" },
              { name: "Stocks", count: "100+ companies" },
              { name: "Commodities", count: "15+ assets" },
            ].map((category, index) => (
              <motion.div
                key={index}
                className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl p-4 text-center"
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <h3 className="font-bold">{category.name}</h3>
                <p className="text-sm text-gray-400">{category.count}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" />
    </section>
  )
}
