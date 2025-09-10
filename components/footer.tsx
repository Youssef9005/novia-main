"use client"

import Link from "next/link"
import { Github, Linkedin, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "react-i18next"

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-gray-950 border-t border-gray-800 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="pb-8 mb-8 border-b border-gray-800">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-2xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                  {t('footer.newsletter.title')}
                </span>
              </h3>
              <p className="mt-2 text-gray-400 max-w-md">
                {t('footer.newsletter.description')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input type="email" placeholder={t('footer.newsletter.emailPlaceholder')} className="bg-gray-900 border-gray-800 flex-grow" />
              <Button>{t('footer.newsletter.subscribeButton')}</Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" />
              <span className="text-xl font-bold tracking-tight">Novia AI</span>
            </div>
            <p className="text-sm text-gray-400">
              {t('footer.company.description')}
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">LinkedIn</span>
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">GitHub</span>
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">{t('footer.products.title')}</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                  {t('footer.products.starterPlan')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                  {t('footer.products.proPlan')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                  {t('footer.products.expertPlan')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                  {t('footer.products.customSolutions')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">{t('footer.support.title')}</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                  {t('footer.support.helpCenter')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">
                  {t('footer.support.contactUs')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                  {t('footer.support.faq')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                  {t('footer.support.documentation')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">{t('footer.legal.title')}</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                  {t('footer.legal.privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                  {t('footer.legal.termsOfService')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                  {t('footer.legal.cookiePolicy')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                  {t('footer.legal.riskDisclaimer')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              {t('footer.copyright', { year: new Date().getFullYear() })}
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link href="#" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">
                {t('footer.quickLinks.privacy')}
              </Link>
              <Link href="#" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">
                {t('footer.quickLinks.terms')}
              </Link>
              <Link href="#" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">
                {t('footer.quickLinks.cookies')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
