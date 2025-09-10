"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { motion, useMotionValue } from "framer-motion"
import { ArrowRight, BarChart4, LineChart, TrendingUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Canvas, useFrame } from "@react-three/fiber"
import { Float, Text, Environment } from "@react-three/drei"
import { useTranslation } from "react-i18next"

function FloatingCharts({ scrollY = 0 }) {
  const chartRef = useRef()

  useFrame((state) => {
    if (chartRef.current) {
      chartRef.current.rotation.y = state.clock.getElapsedTime() * 0.1
      // Add subtle movement based on scroll (with simple number)
      chartRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.2 + scrollY * 0.001
    }
  })

  return (
    <group ref={chartRef}>
      {/* Floating chart elements */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh position={[-2, 0, 0]}>
          <boxGeometry args={[0.5, 2, 0.1]} />
          <meshStandardMaterial color="#3b82f6" transparent opacity={0.7} />
        </mesh>
      </Float>

      <Float speed={2} rotationIntensity={0.3} floatIntensity={0.3}>
        <mesh position={[-1, 0.5, 0]}>
          <boxGeometry args={[0.5, 1, 0.1]} />
          <meshStandardMaterial color="#10b981" transparent opacity={0.7} />
        </mesh>
      </Float>

      <Float speed={1.8} rotationIntensity={0.2} floatIntensity={0.4}>
        <mesh position={[0, -0.3, 0]}>
          <boxGeometry args={[0.5, 1.5, 0.1]} />
          <meshStandardMaterial color="#ef4444" transparent opacity={0.7} />
        </mesh>
      </Float>

      <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.6}>
        <mesh position={[1, 0.2, 0]}>
          <boxGeometry args={[0.5, 0.8, 0.1]} />
          <meshStandardMaterial color="#8b5cf6" transparent opacity={0.7} />
        </mesh>
      </Float>

      <Float speed={1.7} rotationIntensity={0.15} floatIntensity={0.5}>
        <mesh position={[2, -0.5, 0]}>
          <boxGeometry args={[0.5, 1.2, 0.1]} />
          <meshStandardMaterial color="#f59e0b" transparent opacity={0.7} />
        </mesh>
      </Float>

      {/* Floating text */}
      <Float speed={1} rotationIntensity={0.1} floatIntensity={0.2}>
        <Text
          position={[0, 2, 0]}
          fontSize={0.5}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          font="/fonts/Inter_Bold.json"
        >
          Novia AI
        </Text>
      </Float>
    </group>
  )
}

function TradingSymbols({ scrollY = 0 }) {
  const symbolsRef = useRef()

  useFrame((state) => {
    if (symbolsRef.current) {
      symbolsRef.current.rotation.z = state.clock.getElapsedTime() * 0.05
      // Use simple number for scroll
      symbolsRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.1 - scrollY * 0.0005
    }
  })

  const symbols = [
    { text: "BTC", position: [-3, 2, -1], color: "#f7931a" },
    { text: "ETH", position: [3, 1.5, -2], color: "#627eea" },
    { text: "GOLD", position: [-2.5, -1.5, -1.5], color: "#f59e0b" },
    { text: "EUR", position: [2.5, -2, -1], color: "#3b82f6" },
    { text: "USD", position: [0, 3, -2], color: "#10b981" },
    { text: "JPY", position: [-4, 0, -2.5], color: "#ef4444" },
    { text: "OIL", position: [4, -1, -3], color: "#8b5cf6" },
  ]

  return (
    <group ref={symbolsRef}>
      {symbols.map((symbol, index) => (
        <Float key={index} speed={1 + index * 0.2} rotationIntensity={0.2} floatIntensity={0.5}>
          <Text
            position={symbol.position}
            fontSize={0.4}
            color={symbol.color}
            anchorX="center"
            anchorY="middle"
            font="/fonts/Inter_Bold.json"
          >
            {symbol.text}
          </Text>
        </Float>
      ))}
    </group>
  )
}

function Scene({ scrollY }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
      <FloatingCharts scrollY={scrollY} />
      <TradingSymbols scrollY={scrollY} />
      <Environment preset="city" />
    </>
  )
}

export function HeroSection() {
  const { t } = useTranslation()
  const [hover, setHover] = useState(false)
  const containerRef = useRef(null)
  const scrollYMotion = useMotionValue(0)
  const [scrollYValue, setScrollYValue] = useState(0)
  const [isClient, setIsClient] = useState(false)

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Handle scroll safely
  useEffect(() => {
    if (!isClient) return

    const handleScroll = () => {
      const scrollY = window.scrollY
      scrollYMotion.set(scrollY)
      setScrollYValue(scrollY)
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // Initialize

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [isClient, scrollYMotion])

  // Calculate styles manually instead of using useTransform
  const getStyles = () => {
    const value = scrollYMotion.get()
    return {
      y1: value * -0.2,
      y2: value * -0.1,
      opacity: value < 300 ? 1 - (value / 300) * 0.5 : 0.5,
      scale: 1 - (value / 500) * 0.1,
    }
  }

  const styles = isClient ? getStyles() : { y1: 0, y2: 0, opacity: 1, scale: 1 }

  return (
    <section ref={containerRef} className="relative overflow-hidden min-h-screen flex items-center">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        {isClient && (
          <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
            <Scene scrollY={scrollYValue} />
          </Canvas>
        )}
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            style={{
              y: styles.y1,
              opacity: styles.opacity,
            }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h1
              className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="block">{t('heroSection.title')}</span>
              <span className="block mt-2 bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                {t('heroSection.subtitle')}
              </span>
            </motion.h1>

            <motion.p
              className="mt-6 max-w-2xl text-lg text-gray-400 sm:text-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {t('heroSection.description')}
            </motion.p>

            <motion.div
              className="mt-10 flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Button
                size="lg"
                className="w-full sm:w-auto"
                asChild
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
              >
                <Link href="/register">
                  {t('heroSection.getStarted')}
                  <motion.div animate={{ x: hover ? 4 : 0 }} transition={{ duration: 0.2 }}>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </motion.div>
                </Link>
              </Button>

              <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/#pricing">{t('heroSection.viewPricing')}</Link>
              </Button>
            </motion.div>

            <motion.div
              className="mt-8 grid grid-cols-3 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-blue-500/10 p-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <span className="text-sm text-gray-400">{t('heroSection.realtimeAnalysis')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-emerald-500/10 p-2">
                  <BarChart4 className="h-5 w-5 text-emerald-500" />
                </div>
                <span className="text-sm text-gray-400">{t('heroSection.expertInsights')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-purple-500/10 p-2">
                  <LineChart className="h-5 w-5 text-purple-500" />
                </div>
                <span className="text-sm text-gray-400">{t('heroSection.multipleAssets')}</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            style={{ y: styles.y2 }}
            className="relative hidden lg:block"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative">
              <div className="absolute -top-10 -left-10 w-72 h-72 bg-blue-500/10 rounded-full filter blur-3xl opacity-70" />
              <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-purple-500/10 rounded-full filter blur-3xl opacity-70" />

              <motion.div
                className="relative z-10 bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-2xl p-6 shadow-2xl"
                whileHover={{
                  y: -5,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold">{t('heroSection.marketAnalysis')}</h3>
                    <p className="text-sm text-gray-400">Gold (XAU/USD)</p>
                  </div>
                  <div className="text-emerald-500 font-bold">+1.2%</div>
                </div>

                <div className="h-48 w-full bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg mb-6 relative overflow-hidden">
                  <svg viewBox="0 0 100 30" className="w-full h-full">
                    <path
                      d="M0,15 Q10,10 20,15 T40,20 T60,15 T80,10 T100,15"
                      fill="none"
                      stroke="rgba(16, 185, 129, 0.5)"
                      strokeWidth="0.5"
                    />
                    <path
                      d="M0,15 Q10,10 20,15 T40,20 T60,15 T80,10 T100,15"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="0.2"
                    />
                    <path
                      d="M0,30 L0,15 Q10,10 20,15 T40,20 T60,15 T80,10 T100,15 L100,30 Z"
                      fill="url(#gradient)"
                      opacity="0.2"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>

                  <div className="absolute bottom-2 left-2 text-xs text-gray-400">
                    <div className="flex gap-2">
                      <div>09:00</div>
                      <div>12:00</div>
                      <div>15:00</div>
                      <div>18:00</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <h4 className="text-sm font-medium mb-1">{t('heroSection.keySupportLevel')}</h4>
                    <p className="text-xs text-gray-400">$1,920.30 - {t('heroSection.supportDescription')}</p>
                  </div>

                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <h4 className="text-sm font-medium mb-1">{t('heroSection.keyResistanceLevel')}</h4>
                    <p className="text-xs text-gray-400">$1,965.80 - {t('heroSection.resistanceDescription')}</p>
                  </div>

                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <h4 className="text-sm font-medium mb-1">{t('heroSection.tradingRecommendation')}</h4>
                    <p className="text-xs text-gray-400">{t('heroSection.recommendationDescription')}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" }}
        >
          <p className="text-sm text-gray-400 mb-2">{t('heroSection.scrollToExplore')}</p>
          <ChevronDown className="h-6 w-6 text-gray-400" />
        </motion.div>
      </div>

      {/* Gradient overlay */}
      <motion.div
        className="absolute -top-24 left-1/2 -translate-x-1/2 transform opacity-20 blur-3xl"
        style={{ scale: styles.scale }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.25, 0.2],
        }}
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
        }}
      >
        <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-blue-500 to-emerald-500" />
      </motion.div>
    </section>
  )
}
