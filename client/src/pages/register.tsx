import { useEffect } from "react";
import { useLocation } from "wouter";
import AuthForm from "@/components/auth/AuthForm";
import { User } from "@shared/schema";

interface RegisterProps {
  onRegister: (user: User) => void;
}

export default function Register({ onRegister }: RegisterProps) {
  const [location, setLocation] = useLocation();

  // If user is already logged in, redirect them to the home page
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (res.ok) {
          setLocation('/');
        }
      } catch (error) {
        // If there's an error, the user is probably not logged in, so we stay on the register page
      }
    };

    checkSession();
  }, [setLocation]);

  const handleRegisterSuccess = (user: User) => {
    onRegister(user);
    setLocation('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 font-heading">Create an Account</h1>
          <p className="mt-2 text-sm text-gray-600">
            Join TubeIdeaGen to generate engaging YouTube video ideas
          </p>
        </div>
        
        <AuthForm 
          type="register" 
          onSuccess={handleRegisterSuccess} 
        />
      </div>
    </div>
  );
}
