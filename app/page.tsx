import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-3xl font-semibold tracking-tight mb-3">Welcome</h1>
        <p className="text-muted-foreground mb-8">Your new Next.js app is ready.</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Get started
        </Link>
      </div>
    </main>
  );
}
