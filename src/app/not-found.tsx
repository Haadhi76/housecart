import { ShoppingCart } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center">
      <ShoppingCart className="h-16 w-16 text-gray-300" />
      <h1 className="mt-4 text-4xl font-bold text-gray-900">404</h1>
      <p className="mt-2 text-sm text-gray-500">Page not found</p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
