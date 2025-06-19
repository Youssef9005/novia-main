"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { apiRequest, subscriptionsApi } from "@/lib/api";
import type { SubscriptionPlan } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

export const SubscriptionManagementModal: React.FC<Props> = ({ isOpen, onClose, userId, onSuccess }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [duration, setDuration] = useState<string>("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tradingPairs, setTradingPairs] = useState<{ [key: string]: string[] }>({});
  const [selectedPairs, setSelectedPairs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("forex");

  useEffect(() => {
    if (isOpen) {
      // Fetch plans
      subscriptionsApi.getPlans()
        .then((data) => setPlans(data))
        .catch((err) => {
          console.error("Error fetching plans:", err);
          setPlans([]);
        });

      // Fetch trading pairs
      apiRequest('/trading-pairs')
        .then((data) => setTradingPairs(data.data))
        .catch((err) => {
          console.error("Error fetching trading pairs:", err);
          setTradingPairs({});
        });

      // Fetch user's current selected pairs
      apiRequest(`/users/${userId}/trading-pairs`)
        .then((data) => setSelectedPairs(data.data.selectedPairs))
        .catch((err) => {
          console.error("Error fetching user's trading pairs:", err);
          setSelectedPairs([]);
        });
    }
  }, [isOpen, userId]);

  const handlePairToggle = (pair: string) => {
    setSelectedPairs(prev => 
      prev.includes(pair) 
        ? prev.filter(p => p !== pair)
        : [...prev, pair]
    );
  };

  const handleSelectAll = (category: string) => {
    const categoryPairs = tradingPairs[category] || [];
    setSelectedPairs(prev => {
      const newPairs = [...prev];
      categoryPairs.forEach(pair => {
        if (!newPairs.includes(pair)) {
          newPairs.push(pair);
        }
      });
      return newPairs;
    });
  };

  const handleDeselectAll = (category: string) => {
    const categoryPairs = tradingPairs[category] || [];
    setSelectedPairs(prev => prev.filter(pair => !categoryPairs.includes(pair)));
  };

  const handleConfirm = async () => {
    if (!selectedPlan) return;
    setIsSubmitting(true);
    try {
      // Update subscription
      await apiRequest(`/users/${userId}/subscription`, {
        method: "PATCH",
        body: JSON.stringify({ 
          plan: selectedPlan, 
          duration: parseInt(duration, 10) 
        }),
      });

      // Update trading pairs
      await apiRequest(`/users/${userId}/trading-pairs`, {
        method: "PATCH",
        body: JSON.stringify({ pairs: selectedPairs }),
      });

      toast({
        title: t("common.success"),
        description: t("users.subscription.updateSuccess"),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error updating subscription:", err);
      toast({
        title: t("common.error"),
        description: err.message || t("users.subscription.updateError"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = {
    forex: "الفوركس",
    indices: "المؤشرات",
    commodities: "السلع",
    crypto: "العملات الرقمية"
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{t("users.subscription.managementTitle")}</DialogTitle>
          <DialogDescription>
            {t("users.subscription.managementDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Subscription Plan Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="plan">{t("users.subscription.selectPlan")}</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger id="plan">
                  <SelectValue placeholder={t("users.subscription.selectPlanPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan._id} value={plan._id}>
                      {plan.title} - ${plan.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="duration">{t("users.subscription.duration")}</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>

          {/* Trading Pairs Selection */}
          <div>
            <Label>{t("users.subscription.tradingPairs")}</Label>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                {Object.entries(categories).map(([key, label]) => (
                  <TabsTrigger key={key} value={key}>
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {Object.entries(categories).map(([category, label]) => (
                <TabsContent key={category} value={category}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">{label}</h4>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAll(category)}
                      >
                        {t("common.selectAll")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeselectAll(category)}
                      >
                        {t("common.deselectAll")}
                      </Button>
                    </div>
                  </div>
                  <ScrollArea className="h-[200px] border rounded-md p-4">
                    <div className="grid grid-cols-2 gap-2">
                      {tradingPairs[category]?.map((pair) => (
                        <div key={pair} className="flex items-center space-x-2">
                          <Checkbox
                            id={pair}
                            checked={selectedPairs.includes(pair)}
                            onCheckedChange={() => handlePairToggle(pair)}
                          />
                          <Label htmlFor={pair}>{pair}</Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting || !selectedPlan}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("users.subscription.updatingButton")}
              </>
            ) : (
              t("users.subscription.updateButton")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 