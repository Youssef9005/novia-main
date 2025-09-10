"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, TrendingUp, BarChart4, LineChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useTranslation } from "react-i18next"

export function SimplifiedHero() {
  const { t } = useTranslation()
  const [hover, setHover] = useState(false)

  return (
    <section className="relative overflow-hidden min-h-screen flex items-center">
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 transform opacity-20 blur-3xl">
        <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-blue-500 to-emerald-500" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <motion.h1
              className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="block">{t('simplifiedHero.expertMarket')}</span>
              <span className="block mt-2 bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                {t('simplifiedHero.analysis')}
              </span>
            </motion.h1>

            <motion.p
              className="mt-6 max-w-2xl text-lg text-gray-400 sm:text-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {t('simplifiedHero.description')}
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
                  {t('simplifiedHero.getStarted')}
                  <motion.div animate={{ x: hover ? 4 : 0 }} transition={{ duration: 0.2 }}>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </motion.div>
                </Link>
              </Button>

              <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/#pricing">{t('simplifiedHero.viewPricing')}</Link>
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
                <span className="text-sm text-gray-400">{t('simplifiedHero.realtimeAnalysis')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-emerald-500/10 p-2">
                  <BarChart4 className="h-5 w-5 text-emerald-500" />
                </div>
                <span className="text-sm text-gray-400">{t('simplifiedHero.expertInsights')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-purple-500/10 p-2">
                  <LineChart className="h-5 w-5 text-purple-500" />
                </div>
                <span className="text-sm text-gray-400">{t('simplifiedHero.multipleAssets')}</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
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
                    <h3 className="text-lg font-bold">{t('simplifiedHero.marketAnalysis')}</h3>
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
                    <h4 className="text-sm font-medium mb-1">{t('simplifiedHero.keySupportLevel')}</h4>
                    <p className="text-xs text-gray-400">{t('simplifiedHero.supportLevelDescription')}</p>
                  </div>

                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <h4 className="text-sm font-medium mb-1">{t('simplifiedHero.keyResistanceLevel')}</h4>
                    <p className="text-xs text-gray-400">{t('simplifiedHero.resistanceLevelDescription')}</p>
                  </div>

                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <h4 className="text-sm font-medium mb-1">{t('simplifiedHero.tradingRecommendation')}</h4>
                    <p className="text-xs text-gray-400">{t('simplifiedHero.tradingRecommendationDescription')}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
