import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { User } from "@shared/schema";

interface PricingProps {
  user: User | null;
}

export default function Pricing({ user }: PricingProps) {
  const isAuthenticated = !!user;
  const isPremium = user?.isPremium || user?.lifetimeAccess;

  return (
    <section id="pricing" className="py-12 bg-ytlight">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center mb-10">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase font-heading">Pricing</h2>
          <p className="mt-2 text-3xl leading-8 font-bold tracking-tight text-ytdark sm:text-4xl font-heading">
            Simple, Transparent Pricing
          </p>
          <p className="mt-4 max-w-2xl text-xl text-ytgray lg:mx-auto">
            Free during Beta, with affordable options when we launch.
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto">
          {/* Free Tier */}
          <Card className="bg-white rounded-lg shadow-sm divide-y divide-gray-200">
            <div className="p-6">
              <h2 className="text-xl leading-6 font-medium text-ytdark">Free Beta</h2>
              <p className="mt-4 text-sm text-ytgray">Get full access during our beta period!</p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-ytdark">€0</span>
                <span className="text-base font-medium text-ytgray">/mo</span>
              </p>
              {!isAuthenticated ? (
                <Link href="/register">
                  <Button className="mt-8 block w-full">Sign Up Free</Button>
                </Link>
              ) : (
                <Button className="mt-8 block w-full" disabled>
                  {isPremium ? "Current Plan" : "Already Registered"}
                </Button>
              )}
            </div>
            <div className="pt-6 pb-8 px-6">
              <h3 className="text-xs font-medium text-ytgray tracking-wide uppercase">What's included</h3>
              <ul className="mt-6 space-y-4">
                <li className="flex space-x-3">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="text-sm text-ytgray">Generate up to 30 ideas/month</span>
                </li>
                <li className="flex space-x-3">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="text-sm text-ytgray">Basic content calendar</span>
                </li>
                <li className="flex space-x-3">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="text-sm text-ytgray">Save and export ideas</span>
                </li>
                <li className="flex space-x-3">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="text-sm text-ytgray">Access to all templates</span>
                </li>
              </ul>
            </div>
          </Card>

          {/* Premium Tier */}
          <Card className={`bg-white rounded-lg shadow-sm divide-y divide-gray-200 ${isPremium ? '' : 'border-2 border-primary'}`}>
            <div className="p-6">
              <h2 className="text-xl leading-6 font-medium text-ytdark">
                Premium 
                {!isPremium && <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full ml-2">COMING SOON</span>}
              </h2>
              <p className="mt-4 text-sm text-ytgray">Everything you need for serious YouTube growth.</p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-ytdark">€10</span>
                <span className="text-base font-medium text-ytgray">/mo</span>
              </p>
              <p className="mt-4 text-sm text-ytgray">Or <span className="font-bold text-ytdark">€70</span> lifetime access</p>
              
              {!isAuthenticated ? (
                <Link href="/register">
                  <Button className="mt-8 block w-full">Sign Up First</Button>
                </Link>
              ) : isPremium ? (
                <Button className="mt-8 block w-full" disabled>
                  Current Plan
                </Button>
              ) : (
                <Link href="/subscribe">
                  <Button className="mt-8 block w-full">Upgrade Now</Button>
                </Link>
              )}
            </div>
            <div className="pt-6 pb-8 px-6">
              <h3 className="text-xs font-medium text-ytgray tracking-wide uppercase">What's included</h3>
              <ul className="mt-6 space-y-4">
                <li className="flex space-x-3">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="text-sm text-ytgray"><span className="font-semibold text-ytdark">Unlimited</span> idea generation</span>
                </li>
                <li className="flex space-x-3">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="text-sm text-ytgray">Advanced content calendar</span>
                </li>
                <li className="flex space-x-3">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="text-sm text-ytgray">Thumbnail suggestions</span>
                </li>
                <li className="flex space-x-3">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="text-sm text-ytgray">Script outline generator</span>
                </li>
                <li className="flex space-x-3">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="text-sm text-ytgray">Priority support</span>
                </li>
                <li className="flex space-x-3">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="text-sm text-ytgray">All future features</span>
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
