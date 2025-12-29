"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Key, CreditCard, Settings, Bell, Loader2, Eye, EyeOff, AlertTriangle, Users, Send } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Define types for user state
interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  binanceWalletAddress: string;
  plan: string;
  assets: string[]; // Added for selected assets
  nextPayment: string;
  myReferralCode: string;
  referralPoints: number;
  referralCode: string;
  referredBy: any;
  phoneNumber: {
    countryCode: string;
    number: string;
  };
  notifications: {
    marketing: boolean;
    assetAnalysis: boolean;
    priceAlerts: boolean;
  };
  subscription?: {
    plan?: string;
    status?: string;
    endDate?: string;
    autoRenew?: boolean;
    paymentId?: string;
  };
}

// Define asset lists
const forexAssets = [
  'USDJPY', 'USDCAD', 'EURGBP', 'EURNZD', 'EURCAD', 'EURAUD', 'EURJPY',
  'GBPJPY', 'GBPAUD', 'GBPUSD', 'GBPCAD', 'AUDUSD', 'AUDCAD', 'AUDNZD',
  'AUDJPY', 'NZDJPY', 'NZDUSD', 'GBPNZD', 'EURUSD'
];

const stockIndicesAssets = [
  'US50', 'US100', 'Us30', 'Dxy', 'Uk100', 'Deu40'
];

const commodityAssets = [
  'USOIL', 'XAUUSD', 'XAGUSD', 'XAUUSDG'
];

const cryptoAssets = [
  'SOLUSDT', 'BNBUSDT', 'BTCUSDT', 'SHBUSDT', 'ETHUSDT', 'XRPUSDT'
];

// دالة جديدة تحدد الحد الأقصى للأصول حسب الخطة
function getMaxAssets(plan: string): number {
  switch (plan?.toLowerCase()) {
    case 'basic':
      return 5;
    case 'standard':
    case 'pro':
      return 10;
    case 'expert':
    case 'professional':
      return 0; // 0 يعني غير محدود
    default:
      return 5;
  }
}

export default function ProfilePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>("")
  const [updateSuccess, setUpdateSuccess] = useState("")
  const [formLoading, setFormLoading] = useState(false)
  const [user, setUser] = useState<UserData>({
    firstName: "",
    lastName: "",
    email: "",
    plan: "Free",
    assets: [],
    nextPayment: "",
    myReferralCode: "",
    binanceWalletAddress: "",
    referralPoints: 0,
    referralCode: "",
    referredBy: null,
    phoneNumber: {
      countryCode: "+20",
      number: ""
    },
    notifications: {
      marketing: true,
      assetAnalysis: true,
      priceAlerts: true
    }
  })
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    passwordConfirm: ""
  })
  
  // Add new state for verification
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");

  // Add new state for password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        router.push('/login')
        return
      }
      
      const response = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.status === 401) {
        localStorage.removeItem('token')
        router.push('/login')
        return
      }
      
      if (!response.ok) {
        throw new Error(t('profilePage.failedToFetchProfile'))
      }
      
      const data = await response.json()
      
      setUser({
        firstName: data.data.user.firstName || "",
        lastName: data.data.user.lastName || "",
        email: data.data.user.email || "",
        plan: data.data.user.plan || "Free",
        assets: data.data.user.selectedAssets || [],
        nextPayment: data.data.user.nextPaymentDate ? new Date(data.data.user.nextPaymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : t('profilePage.notAvailable'),
        myReferralCode: data.data.user.myReferralCode || "",
        binanceWalletAddress: data.data.user.binanceWalletAddress || "",
        referralPoints: data.data.user.referralPoints || 0,
        referralCode: data.data.user.referralCode || "",
        referredBy: data.data.user.referredBy || null,
        phoneNumber: data.data.user.phoneNumber || { countryCode: "+20", number: "" },
        notifications: {
          marketing: data.data.user.notifications?.marketing ?? true,
          assetAnalysis: data.data.user.notifications?.assetAnalysis ?? true,
          priceAlerts: data.data.user.notifications?.priceAlerts ?? true
        },
        subscription: data.data.user.subscription || undefined
      })
    } catch (err: any) {
      setError(err.message || "Failed to load profile data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserProfile()
  }, [router])

  const handleAssetChange = (asset: string) => {
    setUser(prevUser => {
      const currentAssets = prevUser.assets || [];
      const isSelected = currentAssets.includes(asset);
      const maxAssets = getMaxAssets(prevUser.plan);

      if (isSelected) {
        return { ...prevUser, assets: currentAssets.filter(a => a !== asset) };
      } else if (maxAssets === 0 || currentAssets.length < maxAssets) {
        return { ...prevUser, assets: [...currentAssets, asset] };
      } else {
        toast({
          title: t('profilePage.limitReached'),
          description: t('profilePage.maxAssetsMessage', { count: maxAssets }),
          variant: "destructive",
        });
        return prevUser;
      }
    });
  };
  
  // Update user profile information
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await api.users.updateMe({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        binanceWalletAddress: user.binanceWalletAddress,
        selectedAssets: user.assets, // Send selected assets to backend
        phoneNumber: user.phoneNumber
      });

      if (response.status === 'success') {
        // Update local storage user data to reflect changes immediately
        const updatedUser = { ...user, ...response.data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        setUser(updatedUser);
        toast({
          title: t('profilePage.success'),
          description: t('profilePage.profileUpdatedSuccess'),
        });
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      toast({
        title: t('profilePage.error'),
        description: err.message || t('profilePage.failedToUpdateProfile'),
        variant: "destructive"
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Update notification settings
  const handleUpdateNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    setUpdateSuccess("");
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await api.users.updateNotifications({
        emailNotifications: user.notifications.marketing,
        pushNotifications: user.notifications.assetAnalysis,
        marketingEmails: user.notifications.priceAlerts
      });

      if (response.status === 'success') {
        toast({
          title: "Success",
          description: "Notification preferences updated successfully",
        });
      } else {
        throw new Error(response.message || 'Failed to update notification preferences');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update notification preferences');
      toast({
        title: "Error",
        description: err.message || "Failed to update notification preferences",
        variant: "destructive"
      });
    } finally {
      setFormLoading(false);
    }
  };
  
  // Update password change handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    setUpdateSuccess("");
    
    // Validate that passwords match
    if (passwordData.newPassword !== passwordData.passwordConfirm) {
      setError("New password and confirmation do not match");
      setFormLoading(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // First, request password change verification
      const response = await api.users.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.passwordConfirm
      });

      if (response.status === 'success') {
        setVerificationSent(true);
        toast({
          title: "Verification Email Sent",
          description: "Please check your email to confirm the password change.",
        });
      } else {
        throw new Error(response.message || 'Failed to request password change');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request password change');
      toast({
        title: "Error",
        description: err.message || "Failed to request password change",
        variant: "destructive"
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Add verification handler
  const handleVerifyPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await api.users.updatePassword({
        token: verificationToken
      });

      if (response.status === 'success') {
        setVerificationSent(false);
        setVerificationToken("");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          passwordConfirm: ""
        });
        toast({
          title: "Success",
          description: "Password changed successfully",
        });
      } else {
        throw new Error(response.message || 'Failed to verify password change');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify password change');
      toast({
        title: "Error",
        description: err.message || "Failed to verify password change",
        variant: "destructive"
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Add cancel subscription handler
  const handleCancelSubscription = async () => {
    setFormLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel subscription');
      }

      // Update local user state
      setUser(prevUser => ({
        ...prevUser,
        subscription: {
          ...prevUser.subscription,
          status: 'cancelled',
          autoRenew: false
        }
      }));

      toast({
        title: t('profilePage.success'),
        description: t('profilePage.subscriptionCancelledSuccess'),
      });

      // Close the dialog
      setShowCancelDialog(false);

      // Refresh user data
      fetchUserProfile();
    } catch (err: any) {
      toast({
        title: t('profilePage.error'),
        description: err.message || t('profilePage.failedToCancelSubscription'),
        variant: "destructive"
      });
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
        <Loader2 className="h-12 w-12 animate-spin text-yellow-500" />
        <p className="ml-4 text-yellow-500">{t('profilePage.loadingProfile')}</p>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen bg-black bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
      <div className="absolute inset-0 z-0">
        {/* Background elements could go here */}
      </div>
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-white text-center mb-12">{t('profilePage.myProfile')}</h1>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6 h-auto mb-8 bg-gray-900 border border-gray-700">
            <TabsTrigger value="profile" className="flex flex-col h-auto py-3 data-[state=active]:bg-gray-800 text-gray-300 data-[state=active]:text-white">
              <User className="h-5 w-5 mb-1" />
              <span className="text-xs sm:text-sm">{t('profilePage.profile')}</span>
            </TabsTrigger>
            <TabsTrigger value="password" className="flex flex-col h-auto py-3 data-[state=active]:bg-gray-800 text-gray-300 data-[state=active]:text-white">
              <Key className="h-5 w-5 mb-1" />
              <span className="text-xs sm:text-sm">{t('profilePage.password')}</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex flex-col h-auto py-3 data-[state=active]:bg-gray-800 text-gray-300 data-[state=active]:text-white">
              <CreditCard className="h-5 w-5 mb-1" />
              <span className="text-xs sm:text-sm">{t('profilePage.subscription')}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex flex-col h-auto py-3 data-[state=active]:bg-gray-800 text-gray-300 data-[state=active]:text-white">
              <Bell className="h-5 w-5 mb-1" />
              <span className="text-xs sm:text-sm">{t('profilePage.notifications')}</span>
            </TabsTrigger>
            <TabsTrigger value="asset-preferences" className="flex flex-col h-auto py-3 data-[state=active]:bg-gray-800 text-gray-300 data-[state=active]:text-white">
              <Settings className="h-5 w-5 mb-1" />
              <span className="text-xs sm:text-sm">{t('profilePage.assetPreferences')}</span>
            </TabsTrigger>
            <TabsTrigger value="referral" className="flex flex-col h-auto py-3 data-[state=active]:bg-gray-800 text-gray-300 data-[state=active]:text-white">
              <Users className="h-5 w-5 mb-1" />
              <span className="text-xs sm:text-sm">{t('profilePage.referral')}</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card className="border-gray-800 bg-gray-950/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">{t('profilePage.personalInformation')}</CardTitle>
                <CardDescription className="text-gray-400">{t('profilePage.updatePersonalDetails')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {updateSuccess && (
                  <Alert className="bg-green-500/20 text-green-400 border-green-500">
                    <AlertDescription>{updateSuccess}</AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-gray-300">{t('profilePage.firstName')}</Label>
                      <Input 
                        id="firstName" 
                        value={user.firstName} 
                        onChange={(e) => setUser({ ...user, firstName: e.target.value })} 
                        className="bg-gray-800 text-white border-gray-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-gray-300">{t('profilePage.lastName')}</Label>
                      <Input 
                        id="lastName" 
                        value={user.lastName} 
                        onChange={(e) => setUser({ ...user, lastName: e.target.value })} 
                        className="bg-gray-800 text-white border-gray-700"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">{t('profilePage.email')}</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={user.email} 
                      onChange={(e) => setUser({ ...user, email: e.target.value })} 
                      className="bg-gray-800 text-white border-gray-700"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="countryCode" className="text-gray-300">{t('profilePage.countryCode')}</Label>
                      <Input 
                        id="countryCode" 
                        value={user.phoneNumber.countryCode} 
                        onChange={(e) => setUser({ 
                          ...user, 
                          phoneNumber: { ...user.phoneNumber, countryCode: e.target.value }
                        })} 
                        className="bg-gray-800 text-white border-gray-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber" className="text-gray-300">{t('profilePage.phoneNumber')}</Label>
                      <Input 
                        id="phoneNumber" 
                        value={user.phoneNumber.number} 
                        onChange={(e) => setUser({ 
                          ...user, 
                          phoneNumber: { ...user.phoneNumber, number: e.target.value }
                        })} 
                        className="bg-gray-800 text-white border-gray-700"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="binanceWalletAddress" className="text-gray-300">{t('profilePage.binanceWallet')}</Label>
                    <Input 
                      id="binanceWalletAddress" 
                      type="text" 
                      value={user.binanceWalletAddress} 
                      onChange={(e) => setUser({ ...user, binanceWalletAddress: e.target.value })} 
                      placeholder="Your Binance Wallet Address (optional)" 
                      className="bg-gray-800 text-white border-gray-700"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-black" disabled={formLoading}>
                    {formLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t('profilePage.updateProfile')
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password">
            <Card className="border-gray-800 bg-gray-950/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">{t('profilePage.changePassword')}</CardTitle>
                <CardDescription className="text-gray-400">
                  {verificationSent 
                    ? t('profilePage.verificationDescription')
                    : t('profilePage.updatePasswordDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {updateSuccess && (
                  <Alert className="bg-green-500/20 text-green-400 border-green-500">
                    <AlertDescription>{updateSuccess}</AlertDescription>
                  </Alert>
                )}
                {!verificationSent ? (
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-gray-300">Current Password</Label>
                      <div className="relative">
                        <Input 
                          id="currentPassword" 
                          type={showCurrentPassword ? "text" : "password"} 
                          value={passwordData.currentPassword} 
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} 
                          className="bg-gray-800 text-white border-gray-700 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-gray-300">New Password</Label>
                      <div className="relative">
                        <Input 
                          id="newPassword" 
                          type={showNewPassword ? "text" : "password"} 
                          value={passwordData.newPassword} 
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} 
                          className="bg-gray-800 text-white border-gray-700 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passwordConfirm" className="text-gray-300">Confirm New Password</Label>
                      <div className="relative">
                        <Input 
                          id="passwordConfirm" 
                          type={showConfirmPassword ? "text" : "password"} 
                          value={passwordData.passwordConfirm} 
                          onChange={(e) => setPasswordData({ ...passwordData, passwordConfirm: e.target.value })} 
                          className="bg-gray-800 text-white border-gray-700 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-black" disabled={formLoading}>
                      {formLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        t('profilePage.requestPasswordChange')
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyPasswordChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="verificationToken" className="text-gray-300">Verification Code</Label>
                      <Input 
                        id="verificationToken" 
                        value={verificationToken} 
                        onChange={(e) => setVerificationToken(e.target.value)} 
                        placeholder="Enter the code from your email"
                        className="bg-gray-800 text-white border-gray-700"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                        onClick={() => setVerificationSent(false)}
                      >
                        {t('profilePage.back')}
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-black" 
                        disabled={formLoading}
                      >
                        {formLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          t('profilePage.verifyChangePassword')
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription">
            <Card className="border-gray-800 bg-gray-950/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">{t('profilePage.subscriptionDetails')}</CardTitle>
                <CardDescription className="text-gray-400">{t('profilePage.manageSubscription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">{t('profilePage.currentPlan')}</Label>
                  <p className="text-white text-lg font-semibold">
                    {user.subscription?.plan || (user.plan === 'Free' ? t('profilePage.free') : user.plan)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">{t('profilePage.subscriptionStatus')}</Label>
                  <p className={`text-lg font-semibold ${
                    user.subscription?.status === 'active' ? 'text-green-500' : 
                    user.subscription?.status === 'cancelled' ? 'text-red-500' : 
                    'text-yellow-500'
                  }`}>
                    {user.subscription?.status ? 
                      (user.subscription.status === 'active' ? t('profilePage.active') :
                       user.subscription.status === 'cancelled' ? t('profilePage.cancelled') :
                       user.subscription.status === 'expired' ? t('profilePage.expired') :
                       user.subscription.status.charAt(0).toUpperCase() + user.subscription.status.slice(1)) :
                      t('profilePage.notActive')}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">{t('profilePage.nextPaymentDate')}</Label>
                  <p className="text-white text-lg font-semibold">
                    {user.subscription?.endDate ? new Date(user.subscription.endDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : t('profilePage.notAvailable')}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">{t('profilePage.autoRenew')}</Label>
                  <p className="text-white text-lg font-semibold">
                    {user.subscription?.autoRenew ? t('profilePage.enabled') : t('profilePage.disabled')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">{t('profilePage.paymentId')}</Label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      value={user.subscription?.paymentId || t('profilePage.notAvailable')} 
                      readOnly 
                      className="bg-gray-800 text-white border-gray-700"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        if (user.subscription?.paymentId) {
                          navigator.clipboard.writeText(user.subscription.paymentId);
                          toast({
                            title: "Copied!",
                            description: t('profilePage.paymentIdDescription'),
                          });
                        }
                      }}
                      disabled={!user.subscription?.paymentId}
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      {t('profilePage.copy')}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-400">{t('profilePage.paymentIdDescription')}</p>
                </div>

                <div className="space-y-4 mt-6">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-5 w-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">{t('profilePage.telegramNotifications')}</h3>
                  </div>
                  
                  <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                    <h4 className="text-white font-medium mb-2">{t('profilePage.telegramInstructions')}</h4>
                    <ol className="text-gray-300 space-y-2 ml-4 list-decimal">
                      <li>{t('profilePage.telegramStep1')}</li>
                      <li>{t('profilePage.telegramStep2')}</li>
                      <li>{t('profilePage.telegramStep3')}</li>
                      <li>{t('profilePage.telegramStep4')}</li>
                      <li>{t('profilePage.telegramStep5')}</li>
                    </ol>
                  </div>

                  <Button 
                    onClick={() => window.open('https://t.me/novia_ai_subscribe_bot', '_blank')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>{t('profilePage.openTelegramBot')}</span>
                  </Button>
                </div>
                
                <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full border-red-500 text-red-500 hover:bg-red-900/20 hover:text-red-400">
                      {t('profilePage.cancelSubscription')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-gray-800">
                    <DialogHeader>
                      <DialogTitle className="text-white">{t('profilePage.cancelSubscriptionTitle')}</DialogTitle>
                      <DialogDescription className="text-gray-400">
                        {t('profilePage.cancelSubscriptionWarning')}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex items-start space-x-3 text-yellow-500">
                        <AlertTriangle className="h-5 w-5 mt-0.5" />
                        <p className="text-sm">
                          {t('profilePage.cancelSubscriptionNote')}
                        </p>
                      </div>
                      <div className="flex items-start space-x-3 text-gray-400">
                        <p className="text-sm">
                          {t('profilePage.cancelSubscriptionActive')}
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowCancelDialog(false)}
                        className="border-gray-700 text-gray-300 hover:bg-gray-800"
                      >
                        {t('profilePage.keepSubscription')}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleCancelSubscription}
                        disabled={formLoading}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {formLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          t('profilePage.yesCancelSubscription')
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-gray-800 bg-gray-950/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">{t('profilePage.notificationSettings')}</CardTitle>
                <CardDescription className="text-gray-400">{t('profilePage.manageNotificationPreferences')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {updateSuccess && (
                  <Alert className="bg-green-500/20 text-green-400 border-green-500">
                    <AlertDescription>{updateSuccess}</AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleUpdateNotifications} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="marketing-notifications" className="text-gray-300">{t('profilePage.marketingEmails')}</Label>
                    <Switch
                      id="marketing-notifications"
                      checked={user.notifications.marketing}
                      onCheckedChange={(checked) => setUser(prev => ({ ...prev, notifications: { ...prev.notifications, marketing: checked } }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="asset-analysis-notifications" className="text-gray-300">{t('profilePage.assetAnalysisUpdates')}</Label>
                    <Switch
                      id="asset-analysis-notifications"
                      checked={user.notifications.assetAnalysis}
                      onCheckedChange={(checked) => setUser(prev => ({ ...prev, notifications: { ...prev.notifications, assetAnalysis: checked } }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="price-alerts" className="text-gray-300">{t('profilePage.priceAlerts')}</Label>
                    <Switch
                      id="price-alerts"
                      checked={user.notifications.priceAlerts}
                      onCheckedChange={(checked) => setUser(prev => ({ ...prev, notifications: { ...prev.notifications, priceAlerts: checked } }))}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-black" disabled={formLoading}>
                    {formLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t('profilePage.saveNotificationPreferences')
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="asset-preferences">
            <Card className="border-gray-800 bg-gray-950/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">{t('profilePage.assetPreferencesTitle')}</CardTitle>
                <CardDescription className="text-gray-400">
                  {getMaxAssets(user.plan) === 0
                    ? t('profilePage.assetPreferencesUnlimited')
                    : t('profilePage.assetPreferencesLimited', { count: getMaxAssets(user.plan) })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">{t('profilePage.forex')}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {forexAssets.map(asset => (
                      <div key={asset} className="flex items-center space-x-2">
                        <Checkbox
                          id={`forex-${asset}`}
                          checked={user.assets.includes(asset)}
                          onCheckedChange={() => handleAssetChange(asset)}
                          disabled={getMaxAssets(user.plan) !== 0 && user.assets.length >= getMaxAssets(user.plan) && !user.assets.includes(asset)}
                          className="border-gray-600 data-[state=checked]:bg-yellow-600 data-[state=checked]:text-black"
                        />
                        <Label htmlFor={`forex-${asset}`} className="text-gray-300 cursor-pointer">
                          {asset}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">{t('profilePage.stockIndices')}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {stockIndicesAssets.map(asset => (
                      <div key={asset} className="flex items-center space-x-2">
                        <Checkbox
                          id={`stock-${asset}`}
                          checked={user.assets.includes(asset)}
                          onCheckedChange={() => handleAssetChange(asset)}
                          disabled={getMaxAssets(user.plan) !== 0 && user.assets.length >= getMaxAssets(user.plan) && !user.assets.includes(asset)}
                          className="border-gray-600 data-[state=checked]:bg-yellow-600 data-[state=checked]:text-black"
                        />
                        <Label htmlFor={`stock-${asset}`} className="text-gray-300 cursor-pointer">
                          {asset}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">{t('profilePage.commodities')}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {commodityAssets.map(asset => (
                      <div key={asset} className="flex items-center space-x-2">
                        <Checkbox
                          id={`commodity-${asset}`}
                          checked={user.assets.includes(asset)}
                          onCheckedChange={() => handleAssetChange(asset)}
                          disabled={getMaxAssets(user.plan) !== 0 && user.assets.length >= getMaxAssets(user.plan) && !user.assets.includes(asset)}
                          className="border-gray-600 data-[state=checked]:bg-yellow-600 data-[state=checked]:text-black"
                        />
                        <Label htmlFor={`commodity-${asset}`} className="text-gray-300 cursor-pointer">
                          {asset}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">{t('profilePage.cryptocurrencies')}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {cryptoAssets.map(asset => (
                      <div key={asset} className="flex items-center space-x-2">
                        <Checkbox
                          id={`crypto-${asset}`}
                          checked={user.assets.includes(asset)}
                          onCheckedChange={() => handleAssetChange(asset)}
                          disabled={getMaxAssets(user.plan) !== 0 && user.assets.length >= getMaxAssets(user.plan) && !user.assets.includes(asset)}
                          className="border-gray-600 data-[state=checked]:bg-yellow-600 data-[state=checked]:text-black"
                        />
                        <Label htmlFor={`crypto-${asset}`} className="text-gray-300 cursor-pointer">
                          {asset}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-black" onClick={handleUpdateProfile} disabled={formLoading}>
                  {formLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('profilePage.saveAssetPreferences')
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referral">
            <Card className="border-gray-800 bg-gray-950/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">{t('profilePage.referralProgram')}</CardTitle>
                <CardDescription className="text-gray-400">{t('profilePage.referralDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                    <h3 className="text-lg font-semibold text-white mb-2">{t('profilePage.yourReferralCode')}</h3>
                    <div className="flex items-center space-x-2">
                      <Input 
                        value={user.myReferralCode} 
                        readOnly 
                        className="bg-gray-800 text-white border-gray-700"
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          navigator.clipboard.writeText(user.myReferralCode);
                          toast({
                            title: "Copied!",
                            description: "Referral code copied to clipboard",
                          });
                        }}
                        className="border-gray-700 text-gray-300 hover:bg-gray-800"
                      >
                        {t('profilePage.copy')}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                    <h3 className="text-lg font-semibold text-white mb-2">{t('profilePage.totalReferrals')}</h3>
                    <p className="text-3xl font-bold text-yellow-500">{user.referralPoints / 10}</p>
                    <p className="text-sm text-gray-400">{t('profilePage.peopleUsedCode')}</p>
                  </div>
                  
                  <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                    <h3 className="text-lg font-semibold text-white mb-2">{t('profilePage.currentPoints')}</h3>
                    <p className="text-3xl font-bold text-yellow-500">{user.referralPoints}</p>
                    <p className="text-sm text-gray-400">{t('profilePage.availablePoints')}</p>
                  </div>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                  <h3 className="text-lg font-semibold text-white mb-4">{t('profilePage.howItWorks')}</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-yellow-500/20 p-2 rounded-full">
                        <span className="text-yellow-500 font-bold">1</span>
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{t('profilePage.shareYourCode')}</h4>
                        <p className="text-gray-400">{t('profilePage.shareCodeDescription')}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-yellow-500/20 p-2 rounded-full">
                        <span className="text-yellow-500 font-bold">2</span>
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{t('profilePage.theySignUp')}</h4>
                        <p className="text-gray-400">{t('profilePage.signUpDescription')}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-yellow-500/20 p-2 rounded-full">
                        <span className="text-yellow-500 font-bold">3</span>
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{t('profilePage.earnMorePoints')}</h4>
                        <p className="text-gray-400">{t('profilePage.earnPointsDescription')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {user.referredBy && (
                  <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                    <h3 className="text-lg font-semibold text-white mb-2">{t('profilePage.referredBy')}</h3>
                    <p className="text-gray-300">
                      {t('profilePage.referredByText')} <span className="text-yellow-500">{user.referredBy.name || user.referredBy.email}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-12 text-center text-gray-500 text-sm">
          <p className="mb-2">Your referral code: <span className="font-bold text-white">{user.myReferralCode}</span></p>
          {user.referredBy && (
            <p className="mb-2">Referred by: <span className="font-bold text-white">{user.referredBy.name || user.referredBy.email}</span></p>
          )}
          <p>Referral Points: <span className="font-bold text-white">{user.referralPoints}</span></p>
        </div>

        {/* Selected Assets Section - Read Only
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Selected Trading Pairs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {user.assets && user.assets.length > 0 ? (
              user.assets.map((asset, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                >
                  <span className="text-gray-700 font-medium">{asset}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 col-span-full">No trading pairs selected</p>
            )}
          </div>
        </div> */}
      </div>
    </div>
  )
}
