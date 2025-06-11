"use client"

import { motion } from "framer-motion"
import { BarChart3, BellRing, Clock, CreditCard, Globe2, LineChart, Mail, TrendingUp } from "lucide-react"

const features = [
  {
    name: "Real-time Analysis",
    description: "Stay ahead of the market with timely insights and technical patterns.",
    icon: LineChart,
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "Multiple Assets",
    description: "Select from stocks, cryptocurrencies, forex pairs, commodities, and more.",
    icon: Globe2,
    color: "from-purple-500 to-pink-500",
  },
  {
    name: "Expert Insights",
    description: "Benefit from years of trading experience from our team of analysts.",
    icon: TrendingUp,
    color: "from-amber-500 to-orange-500",
  },
  {
    name: "Regular Updates",
    description: "Receive analysis on your schedule – daily, weekly, or bi-weekly.",
    icon: Clock,
    color: "from-emerald-500 to-green-500",
  },
  {
    name: "Price Alerts",
    description: "Get notified when your assets reach critical price levels.",
    icon: BellRing,
    color: "from-rose-500 to-red-500",
  },
  {
    name: "Custom Delivery",
    description: "Receive analysis directly in your inbox when you need it most.",
    icon: Mail,
    color: "from-indigo-500 to-blue-500",
  },
  {
    name: "Advanced Charts",
    description: "Visual representation of trends with clear entry and exit points.",
    icon: BarChart3,
    color: "from-sky-500 to-blue-500",
  },
  {
    name: "Flexible Plans",
    description: "Choose the subscription plan that matches your trading needs.",
    icon: CreditCard,
    color: "from-teal-500 to-green-500",
  },
]

export function FeatureSection() {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {features.map((feature, index) => (
        <motion.div
          key={feature.name}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          viewport={{ once: true }}
          className="relative rounded-2xl border border-gray-800 bg-gray-900/60 p-6 backdrop-blur-sm"
        >
          <div className={`absolute -top-4 -right-4 bg-gradient-to-r ${feature.color} rounded-full p-2.5`}>
            <feature.icon className="h-5 w-5 text-white" />
          </div>
          <h3 className="mt-3 text-lg font-medium">{feature.name}</h3>
          <p className="mt-2 text-sm text-gray-400">{feature.description}</p>
        </motion.div>
      ))}
    </div>
  )
}
