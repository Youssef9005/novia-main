"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useTranslation } from "react-i18next"

export default function AboutPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-950">
      <div className="relative pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              <span className="block">{t('about.title')}</span>
              <span className="block mt-2 bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Novia AI
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 sm:text-xl">
              {t('about.subtitle')}
            </p>
          </div>
        </div>

        <div className="absolute -top-24 left-1/2 -translate-x-1/2 transform opacity-20 blur-3xl">
          <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-blue-500 to-emerald-500" />
        </div>
      </div>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('about.story.title')}</h2>
              <p className="mt-4 text-lg text-gray-400">
                {t('about.story.paragraph1')}
              </p>
              <p className="mt-4 text-lg text-gray-400">
                {t('about.story.paragraph2')}
              </p>
              <p className="mt-4 text-lg text-gray-400">
                {t('about.story.paragraph3')}
              </p>
            </div>
            <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden border border-gray-800">
              <Image src={"./logo.jpeg"} alt="Website Logo" fill />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-gray-900/60 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                {t('about.emailTypes.title')}
              </span>
            </h2>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              {t('about.emailTypes.subtitle')}
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-2">
            {/* Signal Type */}
            <div className="rounded-2xl bg-gradient-to-br from-blue-950 to-gray-950 border border-blue-700 p-8 shadow-xl flex flex-col items-start">
              <div className="flex items-center mb-4">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white text-2xl mr-3">🔔</span>
                <h3 className="text-xl font-bold text-blue-300">{t('about.emailTypes.signal.title')}</h3>
              </div>
              <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-sm overflow-x-auto w-full font-mono mb-4 border border-blue-800">
{`🔔NOVIA AI Buy Signal for🔔 US30
📈Entry: 42335.6572
🎯TP 1: 42356.4017
🎯TP 2: 42377.9929
🎯TP 3: 42399.1607
🎯TP 4: 42420.3286
🛑Stop Loss: 42293.3216`}
              </pre>
              <p className="text-gray-300 text-sm">
                {t('about.emailTypes.signal.description')}
              </p>
            </div>

            {/* Analysis Type */}
            <div className="rounded-2xl bg-gradient-to-br from-emerald-950 to-gray-950 border border-emerald-700 p-8 shadow-xl flex flex-col items-start">
              <div className="flex items-center mb-4">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-600 text-white text-2xl mr-3">📊</span>
                <h3 className="text-xl font-bold text-emerald-300">{t('about.emailTypes.analysis.title')}</h3>
              </div>
              <pre className="bg-gray-900 text-yellow-300 rounded-lg p-4 text-xs overflow-x-auto w-full font-mono mb-4 border border-emerald-800">
{`US Session Analysis Notice for Today
Currency: US100
Anchor Area: 21713.9
If the price is trading above the anchor area, the trend is positive.
First Resistance: 21800.7556
Second Resistance: 21887.6112
Third Resistance: 21974.4668
Fourth Resistance: 22061.3224
If the price is trading below the anchor area, the trend is negative.
First Support: 21627.0444
Second Support: 21540.1888
Third Support: 21453.3332
Fourth Support: 21366.4776`}
              </pre>
              <p className="text-gray-300 text-sm">
                {t('about.emailTypes.analysis.description')}
              </p>
            </div>

            {/* Target Achieved Type */}
            <div className="rounded-2xl bg-gradient-to-br from-purple-950 to-gray-950 border border-purple-700 p-8 shadow-xl flex flex-col items-start">
              <div className="flex items-center mb-4">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-600 text-white text-2xl mr-3">🎯</span>
                <h3 className="text-xl font-bold text-purple-300">{t('about.emailTypes.target.title')}</h3>
              </div>
              <pre className="bg-gray-900 text-purple-300 rounded-lg p-4 text-sm overflow-x-auto w-full font-mono mb-4 border border-purple-800">
{`🎯 US30 reached TP3 ☑️         at 42229.104 | Profit: 63.439 TP☑️`}
              </pre>
              <p className="text-gray-300 text-sm">
                {t('about.emailTypes.target.description')}
              </p>
            </div>

            {/* New Session Type */}
            <div className="rounded-2xl bg-gradient-to-br from-cyan-950 to-gray-950 border border-cyan-700 p-8 shadow-xl flex flex-col items-start">
              <div className="flex items-center mb-4">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-cyan-600 text-white text-2xl mr-3">📢</span>
                <h3 className="text-xl font-bold text-cyan-300">{t('about.emailTypes.newSession.title')}</h3>
              </div>
              <pre className="bg-gray-900 text-cyan-300 rounded-lg p-4 text-sm overflow-x-auto w-full font-mono mb-4 border border-cyan-800">
{`📢 New 4-Hour Session Started with NOVIA AI  - Ready for New Trade 📢`}
              </pre>
              <p className="text-gray-300 text-sm">
                {t('about.emailTypes.newSession.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                {t('about.values.title')}
              </span>
            </h2>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              {t('about.values.subtitle')}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                titleKey: "about.values.accuracy.title",
                descriptionKey: "about.values.accuracy.description",
              },
              {
                titleKey: "about.values.transparency.title",
                descriptionKey: "about.values.transparency.description",
              },
              {
                titleKey: "about.values.education.title",
                descriptionKey: "about.values.education.description",
              },
              {
                titleKey: "about.values.innovation.title",
                descriptionKey: "about.values.innovation.description",
              },
              {
                titleKey: "about.values.integrity.title",
                descriptionKey: "about.values.integrity.description",
              },
              {
                titleKey: "about.values.customerFocus.title",
                descriptionKey: "about.values.customerFocus.description",
              },
            ].map((value, index) => (
              <div key={index} className="rounded-xl bg-gray-950 border border-gray-800 p-6">
                <h3 className="text-xl font-bold text-white mb-2">{t(value.titleKey)}</h3>
                <p className="text-gray-400">{t(value.descriptionKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-gray-900/60 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl max-w-2xl mx-auto">
            {t('about.cta.title')}
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            {t('about.cta.subtitle')}
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/register">
              {t('common.getStarted')} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
