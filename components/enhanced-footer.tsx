"use client"

import Link from "next/link"
import { Github, Linkedin, Twitter, ArrowRight, Mail, Phone, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { useTranslation } from "react-i18next"

export function EnhancedFooter() {
  const { t } = useTranslation()
  
  return (
    <footer className="bg-gray-950 border-t border-gray-800 relative z-20 mt-auto">
      {/* Newsletter Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-950 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-gray-900/80 backdrop-blur-sm border border-gray-800 p-8 lg:p-12">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full filter blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full filter blur-3xl" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-2 items-center">
              <div>
                <h3 className="text-3xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    {t('enhancedFooter.newsletter.title')}
                  </span>
                </h3>
                <p className="mt-4 text-lg text-gray-400 max-w-md">
                  {t('enhancedFooter.newsletter.description')}
                </p>
              </div>
              <div className="bg-gray-950/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
                <form className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      {t('enhancedFooter.newsletter.emailLabel')}
                    </label>
                    <Input
                      type="email"
                      id="email"
                      placeholder={t('enhancedFooter.newsletter.emailPlaceholder')}
                      className="bg-gray-900 border-gray-800"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="consent"
                      className="rounded border-gray-700 bg-gray-900 text-blue-500 focus:ring-blue-500"
                    />
                    <label htmlFor="consent" className="text-xs text-gray-400">
                      {t('enhancedFooter.newsletter.consentText')}
                    </label>
                  </div>
                  <Button className="w-full">
                    {t('enhancedFooter.newsletter.subscribeButton')} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center gap-2">
              <Image src="/logo.jpeg" alt="Website Logo" width={100} height={100} className="rounded-full border border-gray-800 p-2"/>
              <span className="text-2xl font-bold tracking-tight">Novia AI</span>
            </div>
            <p className="text-gray-400">
              {t('enhancedFooter.company.description')}
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">{t('enhancedFooter.company.social.twitter')}</span>
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">{t('enhancedFooter.company.social.linkedin')}</span>
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">{t('enhancedFooter.company.social.github')}</span>
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 lg:col-span-2 lg:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">{t('enhancedFooter.products.title')}</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    {t('enhancedFooter.products.starterPlan')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    {t('enhancedFooter.products.proPlan')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    {t('enhancedFooter.products.expertPlan')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    {t('enhancedFooter.products.customSolutions')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">{t('enhancedFooter.support.title')}</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    {t('enhancedFooter.support.helpCenter')}
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">
                    {t('enhancedFooter.support.contactUs')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    {t('enhancedFooter.support.faq')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    {t('enhancedFooter.support.documentation')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">{t('enhancedFooter.legal.title')}</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    {t('enhancedFooter.legal.privacyPolicy')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    {t('enhancedFooter.legal.termsOfService')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    {t('enhancedFooter.legal.cookiePolicy')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    {t('enhancedFooter.legal.riskDisclaimer')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">{t('enhancedFooter.contact.title')}</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm">info@novia-ai.com</p>
                  <p className="text-xs text-gray-500">{t('enhancedFooter.contact.emailDescription')}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-emerald-500 mt-0.5" />
                <div>
                  <p className="text-sm">+90 534 486 92 20</p>
                  <p className="text-xs text-gray-500">{t('enhancedFooter.contact.phoneDescription')}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <p className="text-sm">{t('enhancedFooter.contact.locations.turkey')}</p>
                  <p className="text-sm">{t('enhancedFooter.contact.locations.egypt')}</p>
                  <p className="text-sm">{t('enhancedFooter.contact.locations.bahrain')}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} {t('enhancedFooter.copyright')}
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                {t('enhancedFooter.legal.privacyPolicy')}
              </Link>
              <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                {t('enhancedFooter.legal.termsOfService')}
              </Link>
              <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                {t('enhancedFooter.legal.cookiePolicy')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
