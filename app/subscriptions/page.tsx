'use client';

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PlanCard } from "@/components/subscription/PlanCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";

interface Plan {
  _id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  features: string[];
  isOnSale?: boolean;
  saleEndsAt?: Date;
  saleDescription?: string;
  isActive: boolean;
}

export default function SubscriptionsPage() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        console.log('Fetching subscription plans...');
        const response = await api.subscriptions.getPlans();
        console.log('Received plans:', response);
        
        if (!response.data || !response.data.plans) {
          throw new Error('Invalid response format from server');
        }

        // Filter out inactive plans and sort by price
        const activePlans = response.data.plans
          .filter((plan: any) => plan.isActive)
          .sort((a: any, b: any) => a.price - b.price)
          .map((plan: any): Plan => ({
            ...plan,
            saleEndsAt: plan.saleEndsAt ? new Date(plan.saleEndsAt) : undefined
          }));
        
        console.log('Active plans:', activePlans);
        setPlans(activePlans);
      } catch (err: any) {
        console.error('Error fetching plans:', err);
        setError(err.message);
        toast({
          title: t('subscriptionsPage.error'),
          description: err.message || t('subscriptionsPage.failedToLoadPlans'),
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">{t('subscriptionsPage.chooseYourPlan')}</h1>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">{t('subscriptionsPage.error')}</h1>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">{t('subscriptionsPage.noPlansAvailable')}</h1>
          <p className="text-muted-foreground">{t('subscriptionsPage.noPlansMessage')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">{t('subscriptionsPage.chooseYourPlan')}</h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {plans.map((plan, index) => (
          <PlanCard
            key={plan._id}
            plan={plan}
            highlighted={index === 1} // Highlight the middle plan
          />
        ))}
      </div>
    </div>
  );
} 