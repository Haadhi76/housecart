"use client";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { BookOpen, LogOut, ShoppingCart, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

interface DashboardShellProps {
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
  };
  householdId: string;
  children: ReactNode;
}

const navItems = [
  { href: "/dashboard", label: "Shopping List", icon: ShoppingCart },
  { href: "/dashboard/recipes", label: "Recipes", icon: BookOpen },
  { href: "/dashboard/household", label: "Household", icon: Users },
];

export function DashboardShell({
  user,
  householdId,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="flex min-h-screen flex-col" data-household-id={householdId}>
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-emerald-600" />
            <span className="text-lg font-bold text-gray-900">HouseCart</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-medium text-emerald-700">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                user.displayName.charAt(0).toUpperCase()
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-20 pt-4">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-around">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                  isActive
                    ? "text-emerald-600"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
