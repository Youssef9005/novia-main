"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/useAuth"

export default function VerifyEmailPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const params = useParams()
  const { verifyEmail, loading: authLoading } = useAuth()
  const [verifying, setVerifying] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  
  useEffect(() => {
    const runVerification = async () => {
      try {
        const tokenFromParams = params.token as string

        if (!tokenFromParams) {
          throw new Error(t('verifyEmailPage.emailVerificationFailed'))
        }
        await verifyEmail(tokenFromParams)
        setSuccess(true)
      } catch (err: any) {
        console.error('Verification error:', err)
        setError(err.message || t('verifyEmailPage.emailVerificationFailed'))
      } finally {
        setVerifying(false)
      }
    }
    
    runVerification()
  }, [params.token])
  
  return (
      <div className="flex min-h-screen w-full items-center justify-center bg-black bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
    
      <div className="absolute inset-0 z-0">
        {/* Background stars/particles could go here */}
      </div>
      
      <div className="relative z-10 w-full max-w-md px-4 py-8 sm:px-6 md:py-12 lg:py-16">
        <Card className="border-gray-800 bg-gray-950/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {verifying ? t('verifyEmailPage.verifyingEmail') : success ? t('verifyEmailPage.emailVerified') : t('verifyEmailPage.verificationFailed')}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {verifying ? t('verifyEmailPage.verifyingEmail') : success ? t('verifyEmailPage.emailVerifiedSuccessfully') : t('verifyEmailPage.emailVerificationFailed')}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-5">
            {verifying ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-6">
                <Loader2 className="h-16 w-16 animate-spin text-indigo-500" />
                <p className="text-center text-gray-300">{t('verifyEmailPage.verifyingEmail')}</p>
              </div>
            ) : success ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-6">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <h3 className="text-xl font-medium text-green-500">{t('verifyEmailPage.emailVerified')}</h3>
                <p className="text-center text-gray-300">
                  {t('verifyEmailPage.emailVerifiedSuccessfully')}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-4 py-6">
                <XCircle className="h-16 w-16 text-red-500" />
                <h3 className="text-xl font-medium text-red-500">{t('verifyEmailPage.verificationFailed')}</h3>
                <p className="text-center text-gray-300">{error}</p>
                <Alert className="border-red-500/20 bg-red-500/10">
                  <AlertDescription>
                    {t('verifyEmailPage.emailVerificationFailed')}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col">
            <Button
              className="w-full"
              onClick={() => router.push('/login')}
              disabled={verifying || authLoading}
            >
              {success ? t('verifyEmailPage.continueToLogin') : t('verifyEmailPage.tryAgain')}
            </Button>
            
            {!success && !verifying && (
              <div className="mt-4 text-center text-sm text-gray-500">
                Need help?{' '}
                <Link href="/contact" className="text-indigo-500 hover:text-indigo-400">
                  Contact Support
                </Link>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>

      </div>
  )
}
