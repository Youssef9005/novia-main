import { Check } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface PlanCardProps {
  name: string
  price: number
  description: string
  features: string[]
  highlighted?: boolean
  assetCount: number
  assetType?: string[]
  isLoading?: boolean
  originalPrice?: number
  isOnSale?: boolean
  saleEndsAt?: string
  saleDescription?: string
}

export function PlanCard({
  name,
  price,
  description,
  features,
  highlighted = false,
  assetCount,
  assetType,
  isLoading = false,
  originalPrice,
  isOnSale = false,
  saleEndsAt,
  saleDescription
}: PlanCardProps) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  // Check authentication status when component mounts
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token')
        setIsAuthenticated(!!token)
      }
    }
    
    checkAuth()
  }, [])
  
  // Handle plan selection based on authentication status
  const handlePlanSelection = () => {
    if (isLoading) return;
    const url = `/payment?plan=${encodeURIComponent(name)}&price=${price}${assetType ? `&assetType=${encodeURIComponent(assetType.join(','))}` : ''}`;
    if (isAuthenticated) {
      // If user is logged in, redirect to payment page with plan details
      router.push(url)
    } else {
      // If user is not logged in, redirect to registration page
      router.push(`/register?plan=${encodeURIComponent(name)}&price=${price}${assetType ? `&assetType=${encodeURIComponent(assetType.join(','))}` : ''}`)
    }
  }
  
  return (
    <Card
      className={`flex flex-col justify-between relative ${
        highlighted ? "border-blue-500 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/20" : ""
      } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-full min-h-[200px]">
          <div className="animate-pulse text-lg text-gray-400">Loading...</div>
        </div>
      ) : (
        <>
          {highlighted && (
            <div className="absolute -top-5 left-0 right-0 mx-auto w-fit rounded-full bg-blue-500 px-3 py-1 text-xs font-medium">
              Popular
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-2xl">{name}</CardTitle>
            <div className="mt-4 flex items-baseline text-5xl font-extrabold">
              {isOnSale && originalPrice && (
                <span className="text-xl line-through text-gray-400 mr-2">${originalPrice}</span>
              )}
              ${price}
              <span className="ml-1 text-xl font-normal text-gray-400">/mo</span>
            </div>
            <CardDescription className="mt-4">{description}</CardDescription>
            {isOnSale && saleDescription && (
              <p className="mt-2 text-sm text-yellow-500">{saleDescription}</p>
            )}
            {isOnSale && saleEndsAt && (
              <p className="mt-1 text-xs text-gray-400">Sale ends: {new Date(saleEndsAt).toLocaleDateString()}</p>
            )}
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="flex-col items-stretch space-y-2">
            <Button 
              size="lg" 
              variant={highlighted ? "default" : "outline"}
              onClick={handlePlanSelection}
              disabled={isLoading}
            >
              Choose {name}
            </Button>
            <span className="text-center text-sm text-gray-500">Select up to {assetCount} assets</span>
            {assetType && Array.isArray(assetType) && assetType.length > 0 && (
              <span className="text-center text-xs text-blue-500 font-semibold">
                Type: {assetType.map(type =>
                  type === 'crypto' ? 'Crypto' :
                  type === 'stocks' ? 'Stocks' :
                  type === 'forex' ? 'Forex' :
                  type === 'commodities' ? 'Commodities' :
                  type === 'indices' ? 'Indices' :
                  type === 'all' ? 'All' : type
                ).join(', ')}
              </span>
            )}
          </CardFooter>
        </>
      )}
    </Card>
  )
}

// Helper function from utils to enable conditional classnames
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ")
}
