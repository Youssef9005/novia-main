"use client"

import { motion } from "framer-motion"
import { BarChart3, BellRing, Clock, CreditCard, Globe2, LineChart, Mail, TrendingUp } from "lucide-react"
import { useTranslation } from "react-i18next"

export function FeatureSection() {
  const { t } = useTranslation()

  const features = [
    {
      nameKey: "featureSection.realtimeAnalysis.name",
      descriptionKey: "featureSection.realtimeAnalysis.description",
      icon: LineChart,
      color: "from-blue-500 to-cyan-500",
    },
    {
      nameKey: "featureSection.multipleAssets.name",
      descriptionKey: "featureSection.multipleAssets.description",
      icon: Globe2,
      color: "from-purple-500 to-pink-500",
    },
    {
      nameKey: "featureSection.expertInsights.name",
      descriptionKey: "featureSection.expertInsights.description",
      icon: TrendingUp,
      color: "from-amber-500 to-orange-500",
    },
    {
      nameKey: "featureSection.regularUpdates.name",
      descriptionKey: "featureSection.regularUpdates.description",
      icon: Clock,
      color: "from-emerald-500 to-green-500",
    },
    {
      nameKey: "featureSection.priceAlerts.name",
      descriptionKey: "featureSection.priceAlerts.description",
      icon: BellRing,
      color: "from-rose-500 to-red-500",
    },
    {
      nameKey: "featureSection.customDelivery.name",
      descriptionKey: "featureSection.customDelivery.description",
      icon: Mail,
      color: "from-indigo-500 to-blue-500",
    },
    {
      nameKey: "featureSection.advancedCharts.name",
      descriptionKey: "featureSection.advancedCharts.description",
      icon: BarChart3,
      color: "from-sky-500 to-blue-500",
    },
    {
      nameKey: "featureSection.flexiblePlans.name",
      descriptionKey: "featureSection.flexiblePlans.description",
      icon: CreditCard,
      color: "from-teal-500 to-green-500",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {features.map((feature, index) => (
        <motion.div
          key={feature.nameKey}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          viewport={{ once: true }}
          className="relative rounded-2xl border border-gray-800 bg-gray-900/60 p-6 backdrop-blur-sm"
        >
          <div className={`absolute -top-4 -right-4 bg-gradient-to-r ${feature.color} rounded-full p-2.5`}>
            <feature.icon className="h-5 w-5 text-white" />
          </div>
          <h3 className="mt-3 text-lg font-medium">{t(feature.nameKey)}</h3>
          <p className="mt-2 text-sm text-gray-400">{t(feature.descriptionKey)}</p>
        </motion.div>
      ))}
    </div>
  )
}
