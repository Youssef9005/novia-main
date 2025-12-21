"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/hooks/useAuth"

export default function LoginPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { login, loading: authLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const data = await login(email, password)
      // Store basic user info for navbar and other components to use (backward compatibility)
      if (data?.data?.user) {
        const userInfo = {
          firstName: data.data.user.firstName,
          lastName: data.data.user.lastName,
          email: data.data.user.email
        }
        localStorage.setItem('userInfo', JSON.stringify(userInfo))
      }
      router.push('/profile')
    } catch (err: any) {
      setError(err.message || 'An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }
  return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center py-12 bg-gradient-to-b from-black to-gray-950">
      
        <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ChevronLeft className="mr-2 h-4 w-4" />
              {t('loginPage.back')}
            </Link>
          </Button>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md flex items-center flex-col">
          <Image src={"./logo.jpeg"} alt="Website Logo" width={100} height={100} className="rounded-full border border-gray-800 p-2" />
          <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight">{t('loginPage.signInToAccount')}</h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <Card className="border-gray-800 bg-gray-950/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl">{t('loginPage.welcomeBack')}</CardTitle>
              <CardDescription>{t('loginPage.enterCredentials')}</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4 bg-red-900/30 border-red-800 text-red-400">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1">
                  <Label htmlFor="email">{t('loginPage.emailAddress')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('loginPage.emailPlaceholder')}
                    required
                    className="bg-gray-900 border-gray-800"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{t('loginPage.password')}</Label>
                    <Link href="/forgot-password" className="text-sm font-medium text-blue-500 hover:text-blue-400">
                      {t('loginPage.forgotPassword')}
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      className="bg-gray-900 border-gray-800 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t('loginPage.signingIn') : t('loginPage.signIn')}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-center text-sm">
                {t('loginPage.noAccount')}{" "}
                <Link href="/register" className="font-medium text-blue-500 hover:text-blue-400">
                  {t('loginPage.signUp')}
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>

      </div>
  )
}
