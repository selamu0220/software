import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "@shared/schema";
import ContentCalendar from "@/components/calendar/ContentCalendar";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Clock, Info } from "lucide-react";

interface CalendarPageProps {
  user: User | null;
}

export default function CalendarPage({ user }: CalendarPageProps) {
  const [location, setLocation] = useLocation();

  // Redirect to login if not authenticated
  if (!user) {
    setLocation('/login');
    return null;
  }

  const isPremium = user.isPremium || user.lifetimeAccess;

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-heading">Content Calendar</h1>
          <p className="text-muted-foreground">
            Plan and organize your YouTube content schedule
          </p>
        </div>
        
        {!isPremium && (
          <Link href="/subscribe">
            <Button>
              Upgrade to Premium
            </Button>
          </Link>
        )}
      </div>
      
      <ContentCalendar userId={user.id} />
      
      {!isPremium && (
        <div className="mt-8">
          <Card className="border border-primary bg-black/5">
            <CardHeader>
              <CardTitle>Get More with Premium</CardTitle>
              <CardDescription>
                Upgrade to premium for unlimited idea generation and monthly content planning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <Info className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-medium">Premium benefits:</h3>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    <li>Unlimited daily idea generation</li>
                    <li>Monthly content planning (30+ ideas at once)</li>
                    <li>Advanced analytics and performance tracking</li>
                    <li>Priority customer support</li>
                  </ul>
                </div>
              </div>
              
              <div className="text-center">
                <Link href="/subscribe">
                  <Button size="lg">
                    Upgrade Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
