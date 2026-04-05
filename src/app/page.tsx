import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { ShoppingCart } from "lucide-react";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white">
            <ShoppingCart className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
            HouseCart
          </h1>
          <p className="mt-2 text-gray-600">
            Your household&apos;s shared shopping list
          </p>
        </div>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
            {error}
          </div>
        )}
        <LoginForm />
      </div>
    </main>
  );
}
