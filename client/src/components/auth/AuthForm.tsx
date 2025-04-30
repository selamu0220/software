import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { User } from "@shared/schema";

// Create the form schema for login
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Extended schema for registration
const registerSchema = loginSchema.extend({
  email: z.string().email("Invalid email address"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

interface AuthFormProps {
  type: "login" | "register";
  onSuccess: (user: User) => void;
}

export default function AuthForm({ type, onSuccess }: AuthFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Create form with zod validation
  const form = useForm<LoginFormValues | RegisterFormValues>({
    resolver: zodResolver(type === "login" ? loginSchema : registerSchema),
    defaultValues: {
      username: "",
      password: "",
      ...(type === "register" ? { email: "", confirmPassword: "" } : {}),
    },
  });

  async function onSubmit(data: LoginFormValues | RegisterFormValues) {
    setLoading(true);
    try {
      // Submit the form data to the server
      const endpoint = type === "login" ? "/api/login" : "/api/register";
      
      let formData: any = {
        username: data.username,
        password: data.password,
      };
      
      if (type === "register") {
        formData.email = (data as RegisterFormValues).email;
      }
      
      const response = await apiRequest("POST", endpoint, formData);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Authentication failed");
      }
      
      const userData = await response.json();
      toast({
        title: type === "login" ? "Login successful" : "Registration successful",
        description: `Welcome ${userData.username}!`,
      });
      
      onSuccess(userData);
    } catch (error: any) {
      toast({
        title: "Authentication failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {type === "login" ? "Sign In" : "Create Account"}
        </CardTitle>
        <CardDescription>
          {type === "login" 
            ? "Enter your credentials to access your account" 
            : "Sign up for a free account to get started"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="yourusername" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {type === "register" && (
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your@email.com" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        {...field} 
                        disabled={loading} 
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={togglePasswordVisibility}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {type === "register" && (
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••" 
                          {...field} 
                          disabled={loading} 
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={togglePasswordVisibility}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {type === "login" ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                type === "login" ? "Sign In" : "Create Account"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 border-t pt-4">
        {type === "login" ? (
          <div className="text-sm text-center text-gray-600">
            Don't have an account?{" "}
            <Link href="/register">
              <a className="text-primary hover:text-red-700 font-medium">
                Sign up
              </a>
            </Link>
          </div>
        ) : (
          <div className="text-sm text-center text-gray-600">
            Already have an account?{" "}
            <Link href="/login">
              <a className="text-primary hover:text-red-700 font-medium">
                Sign in
              </a>
            </Link>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
