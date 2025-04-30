import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, User as UserIcon, Calendar, LogOut, Settings } from "lucide-react";

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Generator", href: "/" },
    { name: "Calendar", href: "/calendar" },
    { name: "Templates", href: "/#templates" },
    { name: "Pricing", href: "/#pricing" },
  ];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <span className="text-primary font-heading font-bold text-2xl cursor-pointer">
                  TubeIdeaGen
                </span>
              </Link>
              <span className="beta-badge">BETA</span>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`${
                    location === link.href || (link.href !== "/" && location.startsWith(link.href))
                      ? "border-primary text-ytdark"
                      : "border-transparent text-ytgray hover:text-ytdark"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative rounded-full p-1">
                    <span className="sr-only">Open user menu</span>
                    <UserIcon className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-4 py-3">
                    <p className="text-sm">Signed in as</p>
                    <p className="text-sm font-medium truncate">{user.username}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/calendar">Calendar</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  {!user.isPremium && !user.lifetimeAccess && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/subscribe">Upgrade to Premium</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="px-3 py-1 text-sm font-medium">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="px-3 py-1 bg-primary text-white text-sm font-medium hover:bg-red-700">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <Button
              variant="ghost"
              className="inline-flex items-center justify-center p-2 rounded-md text-ytgray hover:text-ytdark hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`${
                  location === link.href
                    ? "bg-red-50 border-primary text-primary"
                    : "border-transparent text-ytgray hover:bg-gray-50 hover:border-gray-300 hover:text-ytdark"
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {user ? (
              <>
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-gray-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-ytdark">{user.username}</div>
                    <div className="text-sm font-medium text-ytgray">{user.email}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-base font-medium text-ytgray hover:text-ytdark hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/calendar"
                    className="block px-4 py-2 text-base font-medium text-ytgray hover:text-ytdark hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-5 w-5" />
                      <span>Calendar</span>
                    </div>
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-base font-medium text-ytgray hover:text-ytdark hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Settings className="mr-2 h-5 w-5" />
                      <span>Profile</span>
                    </div>
                  </Link>
                  {!user.isPremium && !user.lifetimeAccess && (
                    <Link
                      href="/subscribe"
                      className="block px-4 py-2 text-base font-medium text-primary hover:text-red-700 hover:bg-gray-100"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Upgrade to Premium
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-ytgray hover:text-ytdark hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <LogOut className="mr-2 h-5 w-5" />
                      <span>Log out</span>
                    </div>
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-3 space-y-1">
                <Link
                  href="/login"
                  className="block px-4 py-2 text-base font-medium text-ytgray hover:text-ytdark hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="block px-4 py-2 text-base font-medium text-primary hover:text-red-700 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
