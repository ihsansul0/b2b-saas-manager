import Link from "next/link";
import { Button } from "~/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-900">
      <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">

        {/* THE HERO SECTION */}
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem] text-center">
          B2B SaaS <span className="text-slate-500">Manager</span>
        </h1>

        <p className="text-lg text-slate-600 max-w-2xl text-center">
          The ultimate multi-tenant project management tool. Secure, fast, and built on the modern Next.js App Router.
        </p>

        {/* THE CALL TO ACTION */}
        <div className="flex flex-col items-center gap-2 mt-4">
          <Link href="/dashboard">
            <Button size="lg" className="font-semibold text-lg px-8 py-6">
              Enter the Dashboard
            </Button>
          </Link>
        </div>

      </div>
    </main>
  );
}