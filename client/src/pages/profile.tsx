import { useLocation } from "wouter";
import { User } from "@shared/schema";
import UserProfile from "@/components/profile/UserProfile";

interface ProfileProps {
  user: User | null;
  onProfileUpdate: (user: User) => void;
}

export default function Profile({ user, onProfileUpdate }: ProfileProps) {
  const [location, setLocation] = useLocation();

  // Redirect to login if not authenticated
  if (!user) {
    setLocation('/login');
    return null;
  }

  return (
    <div className="container py-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 font-heading">Profile Settings</h1>
      
      <UserProfile user={user} onProfileUpdate={onProfileUpdate} />
    </div>
  );
}
