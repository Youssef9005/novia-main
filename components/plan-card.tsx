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
  images?: Array<{
    url: string;
    filename: string;
    originalName: string;
    uploadedAt: string;
  }>;
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
  maxTradingPairs = 1,
  images
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
          {images && images.length > 0 ? (
            <div className="w-full h-48 relative bg-gray-100 dark:bg-gray-800 rounded-t-md overflow-hidden">
              <img
                src={images[0].url}
                alt={`${name} plan image`}
                className="object-cover w-full h-full transition-transform hover:scale-105"
                onError={(e) => {
                  console.error('Image failed to load:', images[0].url);
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center"><span class="text-gray-400 text-sm">Image not available</span></div>';
                }}
              />
              {images.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                  +{images.length - 1} more
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-t-md overflow-hidden">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-gray-400 text-sm">No Image Available</span>
              </div>
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
