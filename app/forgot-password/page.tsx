"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import { useTranslation } from "react-i18next"

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset link')
      }
      
      // Show success message
      setIsSuccess(true)
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center py-12 bg-gradient-to-b from-black to-gray-950">
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
        <Link href="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
          {t('forgotPasswordPage.backToLogin')}
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md flex items-center flex-col">
        <Image src={"./logo.jpeg"} alt="Website Logo" width={100} height={100} className="rounded-full border border-gray-800 p-2" />
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight">
          {isSuccess ? t('forgotPasswordPage.checkYourEmail') : t('forgotPasswordPage.resetYourPassword')}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-gray-800 bg-gray-950/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">{isSuccess ? t('forgotPasswordPage.linkSent') : t('forgotPasswordPage.passwordRecovery')}</CardTitle>
            <CardDescription className="text-center">
              {isSuccess ? t('forgotPasswordPage.linkSentDescription') : t('forgotPasswordPage.enterEmailDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-900/30 border-red-800 text-red-400">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {!isSuccess ? (
              <form className="space-y-4" onSubmit={handleSubmitEmail}>
                <div className="space-y-1">
                  <Label htmlFor="email">{t('forgotPasswordPage.emailAddress')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('forgotPasswordPage.emailPlaceholder')}
                    required
                    className="bg-gray-900 border-gray-800"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t('forgotPasswordPage.sending') : t('forgotPasswordPage.sendResetLink')}
                </Button>
              </form>
            ) : (
              <div className="py-6 space-y-6 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
                  <svg className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium">{t('forgotPasswordPage.emailSentSuccessfully')}</p>
                  <p className="text-sm text-gray-400">
                    {t('forgotPasswordPage.emailSentMessage', { email })}
                  </p>
                </div>
                <Button className="mt-4" asChild>
                  <Link href="/login">{t('forgotPasswordPage.returnToLogin')}</Link>
                </Button>
              </div>
            )}
          </CardContent>
          {!isSuccess && (
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-center text-sm">
                {t('forgotPasswordPage.rememberPassword')}{" "}
                <Link href="/login" className="underline">
                  {t('forgotPasswordPage.signIn')}
                </Link>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
