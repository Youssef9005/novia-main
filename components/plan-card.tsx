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
  assetType?: string | string[]
  isLoading?: boolean
  originalPrice?: number
  isOnSale?: boolean
  saleEndsAt?: string
  saleDescription?: string
  maxTradingPairs?: number
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
  saleDescription,
  maxTradingPairs = 1
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
    
    // Handle assetType whether it's a string or array of strings
    const assetTypeParam = assetType 
      ? `&assetType=${encodeURIComponent(Array.isArray(assetType) ? assetType.join(',') : assetType)}` 
      : '';
      
    const url = `/payment?plan=${encodeURIComponent(name)}&price=${price}${assetTypeParam}`;
    
    if (isAuthenticated) {
      // If user is logged in, redirect to payment page with plan details
      router.push(url);
    } else {
      // If user is not logged in, redirect to registration page
      router.push(`/register?plan=${encodeURIComponent(name)}&price=${price}${assetTypeParam}`);
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
          {/* Plan Image */}
          {Array.isArray((features as any)?.images) && (features as any).images.length > 0 ? (
            <div className="w-full h-32 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-t-md overflow-hidden">
              <img
                src={(features as any).images[0].url}
                alt={name + " plan image"}
                className="object-cover w-full h-full"
                style={{ maxHeight: 128 }}
              />
            </div>
          ) : (
            <div className="w-full h-32 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-t-md overflow-hidden">
              <span className="text-gray-400 text-xs">No Image</span>
            </div>
          )}
          {highlighted && (
            <div className="absolute -top-5 left-0 right-0 mx-auto w-fit rounded-full bg-blue-500 px-3 py-1 text-xs font-medium">
              Popular
            </div>
          )}
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{name}</CardTitle>
                {/* Always show asset type badges under the plan name */}
                {(() => {
                  let types: string[] = [];
                  if (Array.isArray(assetType)) {
                    types = assetType;
                  } else if (assetType) {
                    types = [assetType];
                  }
                  return (
                    <div className="flex flex-wrap gap-1 mt-2 mb-1">
                      {types.map((type, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                          {type === 'crypto' ? 'Crypto' :
                           type === 'stocks' ? 'Stocks' :
                           type === 'forex' ? 'Forex' :
                           type === 'commodities' ? 'Commodities' :
                           type === 'indices' ? 'Indices' :
                           type === 'all' ? 'All Assets' : type}
                        </span>
                      ))}
                    </div>
                  );
                })()}
                <div className="mt-2 space-y-1">
                  {/* Trading Pairs Count Badge */}
                  <div>
                    {typeof maxTradingPairs !== 'undefined' && (
                      maxTradingPairs > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          {maxTradingPairs === 1 ? '1 Trading Pair' : `${maxTradingPairs} Trading Pairs`}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          <Check className="h-3 w-3 mr-1" />
                          Unlimited Trading Pairs
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {isOnSale && originalPrice && (
                  <span className="text-sm line-through text-gray-400">${originalPrice}</span>
                )}
                <div className="text-4xl font-extrabold">
                  ${price}
                  <span className="ml-1 text-lg font-normal text-gray-400">/mo</span>
                </div>
              </div>
            </div>
            <CardDescription className="mt-2">
              {description}
              {typeof maxTradingPairs !== 'undefined' && (
                <div className="mt-1 text-xs text-gray-500">
                  {maxTradingPairs === 0
                    ? 'Unlimited asset selection allowed.'
                    : `Select up to ${maxTradingPairs} asset${maxTradingPairs > 1 ? 's' : ''}.`}
                </div>
              )}
            </CardDescription>
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
            <span className="text-center text-sm text-gray-500">
              {maxTradingPairs && maxTradingPairs > 0 
                ? `Select up to ${maxTradingPairs} ${maxTradingPairs === 1 ? 'asset' : 'assets'}`
                : 'Select unlimited assets'
              }
            </span>
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
