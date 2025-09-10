"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";
import { useTranslation } from "react-i18next";

interface PlanCardProps {
  plan: {
    _id: string;
    title: string;
    description: string;
    price: number;
    originalPrice?: number;
    features: string[];
    isOnSale?: boolean;
    saleEndsAt?: Date;
    saleDescription?: string;
  };
  highlighted?: boolean;
}

export function PlanCard({ plan, highlighted = false }: PlanCardProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const handleSubscribe = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      await api.subscriptions.subscribe({ planId: plan._id });
      
      toast({
        title: t('planCard.success'),
        description: t('planCard.subscriptionSuccess'),
      });
      router.push('/profile');
    } catch (error: any) {
      toast({
        title: t('planCard.error'),
        description: error.message || t('planCard.subscriptionError'),
        variant: "destructive"
      });
    }
  };

  return (
    <Card className={`flex flex-col ${highlighted ? 'border-primary shadow-lg' : ''}`}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{plan.title}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-4">
          {plan.isOnSale ? (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">${plan.price}</span>
              <span className="text-lg text-muted-foreground line-through">${plan.originalPrice}</span>
              {plan.saleEndsAt && (
                <span className="text-sm text-muted-foreground">
                  ({t('planCard.saleEnds', { date: new Date(plan.saleEndsAt).toLocaleDateString() })})
                </span>
              )}
            </div>
          ) : (
            <span className="text-3xl font-bold">${plan.price}</span>
          )}
          {plan.saleDescription && (
            <p className="text-sm text-muted-foreground mt-1">{plan.saleDescription}</p>
          )}
        </div>
        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          variant={highlighted ? "default" : "outline"}
          onClick={handleSubscribe}
        >
          {t('planCard.subscribeNow')}
        </Button>
      </CardFooter>
    </Card>
  );
} 