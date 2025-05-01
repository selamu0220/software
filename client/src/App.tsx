import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Calendar from "@/pages/calendar";
import Profile from "@/pages/profile";
import Subscribe from "@/pages/subscribe";
import Teleprompter from "@/pages/teleprompter";
import Recording from "@/pages/recording";
import Metrics from "@/pages/metrics";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AssistantSidebar } from "@/components/ui/assistant-sidebar";
import { useEffect, useState } from "react";
import { User } from "@shared/schema";
import { apiRequest } from "./lib/queryClient";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [location] = useLocation();

  // Fetch current user on app load
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Logout function
  const logout = async () => {
    try {
      await apiRequest('POST', '/api/logout', {});
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Login function
  const login = (userData: User) => {
    setUser(userData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const showNavAndFooter = !location.startsWith('/login') && !location.startsWith('/register');

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {showNavAndFooter && <Navbar user={user} onLogout={logout} />}
        <main className="min-h-screen">
          <Switch>
            <Route path="/" component={() => <Home user={user} />} />
            <Route path="/login" component={() => <Login onLogin={login} />} />
            <Route path="/register" component={() => <Register onRegister={login} />} />
            <Route path="/dashboard" component={() => <Dashboard user={user} />} />
            <Route path="/calendar" component={() => <Calendar user={user} />} />
            <Route path="/profile" component={() => <Profile user={user} onProfileUpdate={setUser} />} />
            <Route path="/subscribe" component={() => <Subscribe user={user} onSubscriptionUpdate={setUser} />} />
            <Route path="/teleprompter" component={() => <Teleprompter user={user} />} />
            <Route path="/recording" component={() => <Recording user={user} />} />
            <Route path="/metrics" component={() => <Metrics />} />
            <Route component={NotFound} />
          </Switch>
        </main>
        {showNavAndFooter && <Footer />}
        {/* Sidebar del asistente que se puede abrir/cerrar */}
        <AssistantSidebar />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
