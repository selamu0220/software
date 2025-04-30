import { useState, useEffect } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, LifeBuoy } from "lucide-react";
import { SUBSCRIPTION_PLANS } from "@/lib/stripe";

interface CheckoutFormProps {
  clientSecret: string;
  onSuccess: () => void;
}

export default function CheckoutForm({ clientSecret, onSuccess }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "lifetime">("monthly");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    if (!stripe) {
      return;
    }

    // Listen for changes in the PaymentIntent
    const clientSecretParam = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecretParam) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecretParam).then(({ paymentIntent }) => {
      if (!paymentIntent) {
        return;
      }
      
      switch (paymentIntent.status) {
        case "succeeded":
          toast({
            title: "Payment succeeded!",
            description: "Thank you for your subscription.",
          });
          onSuccess();
          break;
        case "processing":
          toast({
            title: "Your payment is processing.",
            description: "We'll update you when the payment is completed.",
          });
          break;
        case "requires_payment_method":
          toast({
            title: "Payment failed.",
            description: "Please try another payment method.",
            variant: "destructive",
          });
          break;
        default:
          toast({
            title: "Something went wrong.",
            description: "Please try again later.",
            variant: "destructive",
          });
          break;
      }
    });
  }, [stripe, toast, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/subscribe?success=true`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        toast({
          title: "Payment failed",
          description: error.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error("Payment confirmation error:", e);
      toast({
        title: "Payment failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanChange = (value: string) => {
    setSelectedPlan(value as "monthly" | "lifetime");
    
    // Here we would normally update the payment intent on the server
    // For this prototype, we'll just show a message
    toast({
      title: "Selected plan",
      description: `You've selected the ${value === "monthly" ? "monthly" : "lifetime"} plan.`,
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Subscribe to Premium</CardTitle>
        <CardDescription>
          Unlock unlimited video ideas and advanced features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="payment-form" onSubmit={handleSubmit}>
          <RadioGroup 
            value={selectedPlan} 
            onValueChange={handlePlanChange}
            className="mb-8 space-y-4"
          >
            <div className="flex items-center space-x-2 rounded-md border p-4 cursor-pointer hover:bg-muted">
              <RadioGroupItem value="monthly" id="monthly" />
              <Label htmlFor="monthly" className="flex-1 cursor-pointer">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Monthly Plan</div>
                    <div className="text-sm text-muted-foreground">
                      Cancel anytime
                    </div>
                  </div>
                  <div className="font-bold">
                    {SUBSCRIPTION_PLANS.monthly.priceDisplay}/mo
                  </div>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 rounded-md border p-4 cursor-pointer hover:bg-muted">
              <RadioGroupItem value="lifetime" id="lifetime" />
              <Label htmlFor="lifetime" className="flex-1 cursor-pointer">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Lifetime Access</div>
                    <div className="text-sm text-muted-foreground">
                      One-time payment
                    </div>
                  </div>
                  <div className="font-bold">
                    {SUBSCRIPTION_PLANS.lifetime.priceDisplay}
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>
          
          <div className="mb-6">
            <PaymentElement id="payment-element" />
          </div>
          
          {errorMessage && (
            <div className="p-3 mb-4 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
              {errorMessage}
            </div>
          )}
          
          <Button
            type="submit"
            disabled={isLoading || !stripe || !elements}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {selectedPlan === "monthly" ? (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Subscribe Now
                  </>
                ) : (
                  <>
                    <LifeBuoy className="mr-2 h-4 w-4" />
                    Purchase Lifetime Access
                  </>
                )}
              </>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-start text-sm text-muted-foreground">
        <p>
          Your payment is secured using Stripe. We do not store your payment details.
        </p>
        <p className="mt-2">
          By subscribing, you agree to our terms of service and privacy policy.
        </p>
      </CardFooter>
    </Card>
  );
}
