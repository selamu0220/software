import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, VideoIdea } from "@shared/schema";
import { Link } from "wouter";
import { formatDate, truncateText } from "@/lib/utils";
import { Calendar, Plus, RefreshCw, Clock, Video, FolderPlus, AlertTriangle } from "lucide-react";

interface DashboardProps {
  user: User | null;
}

export default function Dashboard({ user }: DashboardProps) {
  const [location, setLocation] = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Redirect to login if not authenticated
  if (!user) {
    setLocation('/login');
    return null;
  }

  // Fetch user's video ideas
  const { data: videoIdeas, isLoading, refetch } = useQuery({
    queryKey: ['/api/video-ideas'],
    staleTime: 60000, // 1 minute
  });

  // Fetch calendar entries
  const { data: calendarEntries, isLoading: loadingCalendar } = useQuery({
    queryKey: ['/api/calendar'],
    staleTime: 60000, // 1 minute
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // Get upcoming calendar entries (next 7 days)
  const getUpcomingEntries = () => {
    if (!calendarEntries) return [];
    
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    return calendarEntries
      .filter((entry: any) => {
        const entryDate = new Date(entry.date);
        return entryDate >= today && entryDate <= nextWeek;
      })
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  };

  const upcomingEntries = getUpcomingEntries();

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 font-heading">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Stats Card - Ideas Generated */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ideas Generated</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="animate-pulse h-7 w-16 bg-gray-200 rounded"></div>
              ) : (
                videoIdeas?.length || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {user.isPremium || user.lifetimeAccess 
                ? "Unlimited ideas available" 
                : `${30 - (videoIdeas?.length || 0)} free ideas remaining`}
            </p>
          </CardContent>
        </Card>
        
        {/* Stats Card - Upcoming Videos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Videos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingCalendar ? (
                <div className="animate-pulse h-7 w-16 bg-gray-200 rounded"></div>
              ) : (
                upcomingEntries.length
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              In the next 7 days
            </p>
          </CardContent>
        </Card>
        
        {/* Stats Card - Account Type */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Type</CardTitle>
            <FolderPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user.isPremium || user.lifetimeAccess ? "Premium" : "Free Beta"}
            </div>
            <p className="text-xs text-muted-foreground">
              {user.lifetimeAccess 
                ? "Lifetime access" 
                : user.isPremium 
                  ? "Monthly subscription" 
                  : "Limited features"}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {/* Recent Video Ideas */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent Video Ideas</CardTitle>
              <CardDescription>
                Your latest generated video ideas
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                {isRefreshing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              <Link href="/">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Idea
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-5 w-3/4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-1/2 bg-gray-100 rounded"></div>
                  </div>
                ))}
              </div>
            ) : videoIdeas?.length > 0 ? (
              <div className="space-y-4">
                {videoIdeas.slice(0, 5).map((idea: VideoIdea) => (
                  <div key={idea.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <h3 className="font-medium text-base">{idea.title}</h3>
                    <div className="flex items-center mt-1 text-sm text-muted-foreground">
                      <Badge variant="outline" className="mr-2">
                        {idea.category}
                      </Badge>
                      <span className="flex items-center text-xs">
                        <Clock className="h-3 w-3 mr-1" /> 
                        {formatDate(idea.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertTriangle className="h-8 w-8 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No ideas yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You haven't generated any video ideas yet.
                </p>
                <Link href="/">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Your First Idea
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
          {videoIdeas?.length > 5 && (
            <CardFooter>
              <Link href="/ideas" className="text-sm text-primary hover:text-red-700">
                View all {videoIdeas.length} ideas
              </Link>
            </CardFooter>
          )}
        </Card>
        
        {/* Upcoming Content */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Content</CardTitle>
            <CardDescription>
              Your scheduled videos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCalendar ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-5 w-3/4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-1/2 bg-gray-100 rounded"></div>
                  </div>
                ))}
              </div>
            ) : upcomingEntries.length > 0 ? (
              <div className="space-y-4">
                {upcomingEntries.map((entry: any) => (
                  <div key={entry.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <h3 className="font-medium text-base">
                      {truncateText(entry.title, 50)}
                    </h3>
                    <div className="flex items-center mt-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" /> 
                      {formatDate(entry.date)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No upcoming videos</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You haven't scheduled any videos yet.
                </p>
                <Link href="/calendar">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Content
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Link href="/calendar" className="text-sm text-primary hover:text-red-700">
              View full calendar
            </Link>
          </CardFooter>
        </Card>
      </div>
      
      {/* Upgrade Banner */}
      {!user.isPremium && !user.lifetimeAccess && (
        <Card className="border-2 border-primary bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold mb-2">Upgrade to Premium</h3>
                <p className="text-sm text-muted-foreground">
                  Get unlimited video ideas, advanced calendar features, and more.
                </p>
              </div>
              <Link href="/subscribe">
                <Button className="whitespace-nowrap">
                  Upgrade Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
