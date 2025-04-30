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
      
      {isPremium ? (
        <ContentCalendar userId={user.id} />
      ) : (
        <div className="space-y-6">
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle>Premium Feature</CardTitle>
              <CardDescription>
                The advanced content calendar is available to premium users only
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <Info className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-medium">Why upgrade to premium?</h3>
                  <p className="text-sm text-muted-foreground">
                    With our premium calendar features, you can:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    <li>Schedule unlimited video ideas</li>
                    <li>Get a visual overview of your content plan</li>
                    <li>Set reminders for recording and editing</li>
                    <li>Maintain a consistent posting schedule</li>
                    <li>Track completed videos and upcoming content</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-md flex items-start gap-4">
                <Clock className="h-6 w-6 text-muted-foreground mt-1" />
                <div>
                  <h3 className="font-medium">Did you know?</h3>
                  <p className="text-sm text-muted-foreground">
                    Consistency is key on YouTube. Channels that post on a regular schedule 
                    see 45% more growth than those with irregular posting patterns.
                  </p>
                </div>
              </div>
              
              <div className="text-center">
                <Link href="/subscribe">
                  <Button size="lg" className="mt-2">
                    Upgrade Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Calendar Preview</CardTitle>
              <CardDescription>
                Here's a preview of what our premium calendar offers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-md overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" 
                  alt="Calendar Preview" 
                  className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-background/80 p-6 rounded-md text-center max-w-md">
                    <h3 className="text-xl font-bold mb-2">Organize Your Content</h3>
                    <p className="mb-4">
                      Plan your videos ahead of time and never miss a publishing date
                    </p>
                    <Link href="/subscribe">
                      <Button>Unlock Premium Features</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
