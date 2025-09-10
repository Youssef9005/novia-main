"use client";
import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowUpRight, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PlanCard } from "@/components/plan-card"
import { FeatureSection } from "@/components/feature-section"
import dynamic from "next/dynamic"
import { ErrorBoundary } from "@/components/error-boundary"
import { SimplifiedHero } from "@/components/simplified-hero"
import Image from "next/image";
import { api } from "@/lib/api"; // Import the api utility
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

// Define Plan interface to match SubscriptionPlan from API
interface Plan {
  _id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  features: string[];
  isOnSale: boolean;
  saleEndsAt?: string;
  saleDescription?: string;
  isActive: boolean;
  assetCount: number;
  assetType?: string | string[];
  maxTradingPairs?: number;
  unlimitedTradingPairs?: boolean;
  includesTelegramGroup?: boolean;
  duration?: number;
  isPopular?: boolean;
  isRecommended?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Dynamically import components with 3D content to avoid SSR issues
const DynamicTransitionSection = dynamic(
  () => import("@/components/transition-section").then((mod) => mod.TransitionSection),
  {
    ssr: false,
    loading: () => (
      <div className="py-32 flex items-center justify-center">
        <div className="animate-pulse text-xl text-gray-400">Loading transition section...</div>
      </div>
    ),
  },
)

const DynamicMarketBackground = dynamic(() => import("@/components/market-background"), {
  ssr: false,
})

export default function Home() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await api.subscriptions.getPlans();
        if (response.status === 'success' && Array.isArray(response.data?.plans)) {
          // Filter for active plans and sort by price
          const activePlans = response.data.plans
            .filter((plan: any) => plan.isActive)
            .sort((a: any, b: any) => a.price - b.price)
            .map((plan: any): Plan => ({
              _id: plan._id,
              title: plan.title,
              description: plan.description,
              price: plan.price,
              originalPrice: plan.originalPrice,
              features: plan.features || [],
              isOnSale: plan.isOnSale || false,
              saleEndsAt: plan.saleEndsAt,
              saleDescription: plan.saleDescription,
              isActive: plan.isActive || false,
              assetCount: plan.assetCount || 0,
              assetType: Array.isArray(plan.assetType) ? plan.assetType : (plan.assetType ? [plan.assetType] : []), // always array
              maxTradingPairs: plan.maxTradingPairs,
              unlimitedTradingPairs: plan.unlimitedTradingPairs,
              includesTelegramGroup: plan.includesTelegramGroup,
              duration: plan.duration,
              isPopular: plan.isPopular,
              isRecommended: plan.isRecommended,
              createdAt: plan.createdAt,
              updatedAt: plan.updatedAt
            }));
          
          setPlans(activePlans);
        } else {
          console.error('Invalid response format:', response);
          setError(t('homepage.pricing.failedToLoad'));
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        setError(t('homepage.pricing.failedToLoad'));
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const renderPlans = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {[1, 2, 3].map((_, i) => (
            <PlanCard key={i} name={t('common.loading')} price={0} description="" features={[]} highlighted={false} assetCount={0} isLoading={true} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-500 text-lg mt-8">
          <p>{error}</p>
        </div>
      );
    }

    if (plans.length === 0) {
      return (
        <div className="text-center text-gray-400 text-lg mt-8">
          <p>{t('homepage.pricing.noPlansAvailable')}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan._id}
            name={plan.title}
            price={plan.price}
            description={plan.description}
            features={plan.features}
            highlighted={plan.title === "Pro"} // Adjust highlight logic as needed
            assetCount={plan.assetCount}
            assetType={plan.assetType}
            originalPrice={plan.originalPrice}
            isOnSale={plan.isOnSale}
            saleEndsAt={plan.saleEndsAt}
            saleDescription={plan.saleDescription}
            maxTradingPairs={plan.maxTradingPairs}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="relative w-full overflow-hidden">
      <div className="fixed inset-0 z-0">
        <ErrorBoundary>
          <DynamicMarketBackground />
        </ErrorBoundary>
      </div>
    
      <div className="relative z-10">
        {/* Using simplified hero section that doesn't rely on Three.js */}
        <SimplifiedHero />
{/* 
        <ErrorBoundary>
          <DynamicTransitionSection />
        </ErrorBoundary> */}

        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                {t('homepage.hero.title')}
              </span>
            </h2>
            <p className="mt-4 text-xl text-gray-400 max-w-3xl mx-auto">
              {t('homepage.hero.subtitle')}
            </p>
          </div>

          <FeatureSection />
        </section>

        <section id="pricing" className="bg-gray-900/60 backdrop-blur-sm py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  {t('homepage.pricing.title')}
                </span>
              </h2>
              <p className="mt-4 text-xl text-gray-400 max-w-3xl mx-auto">
                {t('homepage.pricing.subtitle')}
              </p>
            </div>

            {renderPlans()}

          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="bg-gray-900/70 backdrop-blur-md rounded-2xl p-8 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    {t('homepage.cta.title')}
                  </span>
                </h2>
                <p className="mt-4 text-lg text-gray-400">
                  {t('homepage.cta.subtitle')}
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Button size="lg" asChild>
                    <Link href="/register">
                      {t('common.getStarted')} <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg">
                    {t('common.learnMore')}
                  </Button>
                </div>
              </div>
              <div className="relative h-[400px] rounded-xl overflow-hidden border border-gray-800">
                <Image src={"./logo.jpeg"} alt="Website Logo" fill/>
              </div>
            </div>
          </div>
        </section>

        {/* WhatsApp Floating Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <a
            href="https://wa.me/905344869220"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
            aria-label={t('homepage.whatsapp.ariaLabel')}
          >
            <MessageCircle className="w-6 h-6" />
          </a>
        </div>
      </div>
    </div>
  )
}
