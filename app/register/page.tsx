"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, X, Search, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Image from "next/image"
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import type { CountryCode } from 'libphonenumber-js'

interface Country {
  name: string;
  code: CountryCode;
  phoneCode: string;
}

export default function RegisterPage() {
  const router = useRouter()
  const [showReferralCode, setShowReferralCode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [countries, setCountries] = useState<Country[]>([])
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    passwordConfirm: "",
    referralCode: "",
    phoneNumber: {
      countryCode: "",
      number: ""
    }
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Fetch countries on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('/api/countries')
        const data = await response.json()
        if (data.status === 'success') {
          setCountries(data.data.countries)
        }
      } catch (error) {
        console.error('Error fetching countries:', error)
      }
    }
    fetchCountries()
  }, [])

  const toggleReferralCode = () => {
    setShowReferralCode(prev => !prev)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    if (id === 'phone-number') {
      setFormData(prev => ({
        ...prev,
        phoneNumber: {
          ...prev.phoneNumber,
          number: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [id === 'first-name' ? 'firstName' :
         id === 'last-name' ? 'lastName' :
         id === 'confirm-password' ? 'passwordConfirm' :
         id === 'referral-code' ? 'referralCode' : id]: value
      }))
    }
  }

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    setFormData(prev => ({
      ...prev,
      phoneNumber: {
        ...prev.phoneNumber,
        countryCode: country.phoneCode
      }
    }))
    setOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Password strength validation
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      setIsLoading(false)
      return
    }
    if (!/[A-Z]/.test(formData.password)) {
      setError("Password must include at least one uppercase letter")
      setIsLoading(false)
      return
    }
    if (!/[a-z]/.test(formData.password)) {
      setError("Password must include at least one lowercase letter")
      setIsLoading(false)
      return
    }
    if (!/[0-9]/.test(formData.password)) {
      setError("Password must include at least one number")
      setIsLoading(false)
      return
    }
    if (!/[^A-Za-z0-9]/.test(formData.password)) {
      setError("Password must include at least one special character")
      setIsLoading(false)
      return
    }

    // Validate phone number format
    if (!selectedCountry) {
      setError("Please select a country for your phone number")
      setIsLoading(false)
      return
    }
    // Strict validation with libphonenumber-js
    const phoneNumberObj = parsePhoneNumberFromString(
      formData.phoneNumber.number,
      selectedCountry.code
    )
    if (!phoneNumberObj || !phoneNumberObj.isPossible() || !phoneNumberObj.isValid()) {
      setError("Invalid phone number for the selected country")
      setIsLoading(false)
      return
    }
    const formattedPhone = phoneNumberObj.format('E.164')

    // Basic validation
    if (formData.password !== formData.passwordConfirm) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (!formData.phoneNumber.countryCode || !formData.phoneNumber.number) {
      setError("Please provide a valid phone number")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          passwordConfirm: formData.passwordConfirm,
          referralCode: showReferralCode ? formData.referralCode : undefined,
          phoneNumber: {
            countryCode: selectedCountry.code,
            number: formattedPhone
          }
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed')
      }

      // Always redirect to login page with success message
      router.push('/login?registered=true&message=' + encodeURIComponent(data.message))
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration')
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
            Back
          </Link>
        </Button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md flex items-center flex-col">
        <Image src={"./logo.jpeg"} alt="Website Logo" width={100} height={100} className="rounded-full border border-gray-800 p-2" />

        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight">Create a new account</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-gray-800 bg-gray-950/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">Join Novia AI</CardTitle>
            <CardDescription>Enter your information to create an account</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-900/30 border-red-800 text-red-400">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="first-name">First name</Label>
                  <Input
                    id="first-name"
                    placeholder="John"
                    required
                    className="bg-gray-900 border-gray-800"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input
                    id="last-name"
                    placeholder="Doe"
                    required
                    className="bg-gray-900 border-gray-800"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  className="bg-gray-900 border-gray-800"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              {/* Phone Number Input */}
              <div className="space-y-1">
                <Label>Phone Number</Label>
                <div className="flex gap-2">
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-[140px] justify-between bg-gray-900 border-gray-800"
                      >
                        {selectedCountry ? (
                          <span className="flex items-center gap-2">
                            <span className="text-sm">{selectedCountry.phoneCode}</span>
                            <span className="text-xs text-gray-400">({selectedCountry.code})</span>
                          </span>
                        ) : (
                          "Select country"
                        )}
                        <ChevronLeft className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 bg-gray-900 border-gray-800">
                      <Command>
                        <CommandInput placeholder="Search country..." className="bg-gray-900 border-gray-800" />
                        <CommandEmpty>No country found.</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-auto">
                          {countries.map((country) => (
                            <CommandItem
                              key={country.code}
                              value={country.name}
                              onSelect={() => handleCountrySelect(country)}
                              className="cursor-pointer hover:bg-gray-800"
                            >
                              <span className="flex items-center gap-2">
                                <span>{country.name}</span>
                                <span className="text-sm text-gray-400">({country.phoneCode})</span>
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Input
                    id="phone-number"
                    type="tel"
                    placeholder="Phone number"
                    required
                    className="flex-1 bg-gray-900 border-gray-800"
                    value={formData.phoneNumber.number}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="bg-gray-900 border-gray-800 pr-10"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    minLength={8}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Password must be at least 8 characters long
                </p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    className="bg-gray-900 border-gray-800 pr-10"
                    value={formData.passwordConfirm}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="pt-2">
                {!showReferralCode ? (
                  <button
                    type="button"
                    onClick={toggleReferralCode}
                    className="text-sm font-medium text-emerald-500 hover:text-emerald-400 transition-colors"
                  >
                    I have a referral code
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="referral-code">Referral Code (Optional)</Label>
                      <button
                        type="button"
                        onClick={toggleReferralCode}
                        className="text-gray-400 hover:text-gray-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <Input
                      id="referral-code"
                      placeholder="Enter your referral code here"
                      className="bg-gray-900 border-gray-800"
                      value={formData.referralCode}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full mt-4" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-blue-500 hover:text-blue-400">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}