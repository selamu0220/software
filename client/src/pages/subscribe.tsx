import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { User } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import CheckoutForm from "@/components/payment/CheckoutForm";
import { createLifetimePayment, createMonthlySubscription, getStripe } from "@/lib/stripe";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2 } from "lucide-react";

interface SubscribeProps {
  user: User | null;
  onSubscriptionUpdate: (user: User) => void;
}

export default function Subscribe({ user, onSubscriptionUpdate }: SubscribeProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionType, setSubscriptionType] = useState<"monthly" | "lifetime">("monthly");
  
  // Redirect to login if not authenticated
  if (!user) {
    setLocation('/login');
    return null;
  }

  // Redirect to dashboard if already premium
  useEffect(() => {
    if (user.isPremium || user.lifetimeAccess) {
      toast({
        title: "Already subscribed",
        description: "You already have a premium subscription",
      });
      setLocation('/dashboard');
    } else {
      // Create initial payment intent for monthly subscription
      const setupSubscription = async () => {
        try {
          setLoading(true);
          const response = await createMonthlySubscription();
          setClientSecret(response.clientSecret);
          setSubscriptionType("monthly");
        } catch (error) {
          console.error("Error creating subscription:", error);
          toast({
            title: "Error",
            description: "Failed to set up subscription. Please try again.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };
      
      setupSubscription();
    }
  }, [user, setLocation, toast]);

  // Check URL for success parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('success') === 'true') {
      // Fetch updated user data
      const fetchUser = async () => {
        try {
          const res = await fetch('/api/me', { credentials: 'include' });
          if (res.ok) {
            const userData = await res.json();
            onSubscriptionUpdate(userData);
            
            toast({
              title: "Subscription successful",
              description: "Your account has been upgraded to premium",
            });
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
              setLocation('/dashboard');
            }, 2000);
          }
        } catch (error) {
          console.error("Error fetching user:", error);
        }
      };
      
      fetchUser();
    }
  }, [location, onSubscriptionUpdate, setLocation, toast]);

  // Handle payment method change
  const handlePaymentTypeChange = async (type: "monthly" | "lifetime") => {
    try {
      setLoading(true);
      setSubscriptionType(type);
      
      let response;
      if (type === "monthly") {
        response = await createMonthlySubscription();
      } else {
        response = await createLifetimePayment();
      }
      
      setClientSecret(response.clientSecret);
    } catch (error) {
      console.error("Error changing payment type:", error);
      toast({
        title: "Error",
        description: "Failed to update payment type. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    // This will be handled by the URL parameter check
  };

  // Get Stripe elements
  const stripePromise = getStripe();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Setting up payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-2">BETA PRICING</Badge>
          <h1 className="text-4xl font-bold font-heading text-gray-900 mb-3">
            Upgrade to Premium
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Unlock unlimited video ideas, advanced calendar features, and more premium tools to supercharge your YouTube channel.
          </p>
        </div>
        
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Plan Features */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Premium Features</CardTitle>
                <CardDescription>
                  Everything included in your subscription
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm">Unlimited video idea generation</span>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm">Advanced content calendar</span>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm">Thumbnail suggestions</span>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm">Script outline generator</span>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm">Priority support</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Choose your plan:</h3>
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <div>
                      <span className="text-sm font-medium">Monthly: €10/month</span>
                      <p className="text-xs text-muted-foreground">Cancel anytime</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <div>
                      <span className="text-sm font-medium">Lifetime: €70 one-time</span>
                      <p className="text-xs text-muted-foreground">Pay once, use forever</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Payment Form */}
          <div className="md:col-span-2">
            {clientSecret && (
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#FF0000',
                    },
                  },
                }}
              >
                <CheckoutForm 
                  clientSecret={clientSecret} 
                  onSuccess={handleSuccess} 
                />
              </Elements>
            )}
          </div>
        </div>
        
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Questions about our pricing? <a href="#" className="text-primary hover:text-red-700">Contact our support team</a>
          </p>
        </div>
      </div>
    </div>
  );
}
