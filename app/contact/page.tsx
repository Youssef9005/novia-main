"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, MapPin } from "lucide-react"
import { useTranslation } from "react-i18next"

export default function ContactPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-950">
      <div className="relative pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              <span className="block">{t('contact.title')}</span>
              <span className="block mt-2 bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                {t('contact.subtitle')}
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 sm:text-xl">
              {t('contact.description')}
            </p>
          </div>
        </div>

        <div className="absolute -top-24 left-1/2 -translate-x-1/2 transform opacity-20 blur-3xl">
          <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-blue-500 to-emerald-500" />
        </div>
      </div>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="border-gray-800 bg-gray-950/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl">{t('contact.form.title')}</CardTitle>
                <CardDescription>
                  {t('contact.form.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="first-name">{t('contact.form.firstName')}</Label>
                      <Input
                        id="first-name"
                        placeholder={t('contact.form.firstNamePlaceholder')}
                        className="bg-gray-900 border-gray-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="last-name">{t('contact.form.lastName')}</Label>
                      <Input
                        id="last-name"
                        placeholder={t('contact.form.lastNamePlaceholder')}
                        className="bg-gray-900 border-gray-800"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email">{t('contact.form.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('contact.form.emailPlaceholder')}
                      className="bg-gray-900 border-gray-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="subject">{t('contact.form.subject')}</Label>
                    <Input id="subject" placeholder={t('contact.form.subjectPlaceholder')} className="bg-gray-900 border-gray-800" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="message">{t('contact.form.message')}</Label>
                    <Textarea
                      id="message"
                      placeholder={t('contact.form.messagePlaceholder')}
                      className="min-h-[150px] bg-gray-900 border-gray-800"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {t('contact.form.sendButton')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-8">
              <Card className="border-gray-800 bg-gray-950/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl">{t('contact.info.title')}</CardTitle>
                  <CardDescription>{t('contact.info.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <Mail className="h-6 w-6 text-blue-500 mt-1" />
                    <div>
                      <h3 className="font-medium">{t('contact.info.email')}</h3>
                      <p className="text-sm text-gray-400">info@novia-ai.com</p>
                      <p className="text-sm text-gray-400">support@novia-ai.com</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Phone className="h-6 w-6 text-emerald-500 mt-1" />
                    <div>
                      <h3 className="font-medium">{t('contact.info.phone')}</h3>
                      <p className="text-sm text-gray-400">+90 534 486 92 20</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <MapPin className="h-6 w-6 text-purple-500 mt-1" />
                    <div>
                      <h3 className="font-medium">{t('contact.info.location')}</h3>
                      <p className="text-sm text-gray-400">
                        Turkey istanbul
                        <br />
                        Egypt Cairo
                        <br />
                        Bahrain
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
