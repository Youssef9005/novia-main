"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Loader2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ResetPasswordPage() {
  const router = useRouter()
  const params = useParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [validatingToken, setValidatingToken] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [resetComplete, setResetComplete] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    password: "",
    passwordConfirm: ""
  })
  
  // Skip token validation and go straight to the form
  useEffect(() => {
    const token = params.token as string
    
    if (!token) {
      setError("Invalid password reset link")
      setTokenValid(false)
    } else {
      // We'll assume the token is valid until the user tries to use it
      setTokenValid(true)
    }
    
    setValidatingToken(false)
  }, [params.token])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    // Basic validation
    if (formData.password !== formData.passwordConfirm) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }
    
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      setIsLoading(false)
      return
    }
    
    try {
      const token = params.token as string
      
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password,
          passwordConfirm: formData.passwordConfirm
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password')
      }
      
      setResetComplete(true)
      // Clear form data for security
      setFormData({ password: "", passwordConfirm: "" })
    } catch (err: any) {
      setError(err.message || 'An error occurred while resetting your password')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-black bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
      <div className="absolute inset-0 z-0">
        {/* Background stars/particles could go here */}
      </div>
      
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-10">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </Button>
      </div>
      
      <div className="relative z-10 w-full max-w-md px-4 py-16 sm:px-6">
        <Card className="border-gray-800 bg-gray-950/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Reset Your Password
            </CardTitle>
            <CardDescription className="text-gray-400">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-5">
            {validatingToken ? (
              <div className="flex flex-col items-center justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
                <p className="text-center text-gray-300">Validating your reset link...</p>
              </div>
            ) : resetComplete ? (
              <div className="flex flex-col items-center justify-center py-6">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-xl font-medium mb-2">Password Reset Complete</h3>
                <p className="text-center text-gray-300 mb-6">
                  Your password has been successfully updated. You can now log in with your new password.
                </p>
                <Button asChild className="w-full">
                  <Link href="/login">Go to Login</Link>
                </Button>
              </div>
            ) : tokenValid ? (
              <>
                {error && (
                  <Alert variant="destructive" className="mb-4 bg-red-900/30 border-red-800 text-red-400">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-1">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="bg-gray-900 border-gray-800 pr-10"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isLoading}
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Password must be at least 8 characters long
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="passwordConfirm">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="passwordConfirm"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="bg-gray-900 border-gray-800 pr-10"
                        value={formData.passwordConfirm}
                        onChange={handleChange}
                        disabled={isLoading}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <XCircle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-xl font-medium mb-2">Invalid or Expired Link</h3>
                <p className="text-center text-gray-300 mb-6">
                  {error || "This password reset link is invalid or has expired. Please request a new password reset link."}
                </p>
                <Button asChild className="w-full">
                  <Link href="/forgot-password">Request New Link</Link>
                </Button>
              </div>
            )}
          </CardContent>
          
          {!resetComplete && tokenValid && !validatingToken && (
            <CardFooter className="flex justify-center">
              <div className="text-center text-sm">
                <Link href="/login" className="text-indigo-500 hover:text-indigo-400">
                  Remember your password? Sign in
                </Link>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
