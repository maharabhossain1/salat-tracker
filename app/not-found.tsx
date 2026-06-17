import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h2 className="text-2xl font-semibold mb-3">404 — Page not found</h2>
      <Link href="/" className="text-sm text-muted-foreground underline underline-offset-4">
        Go home
      </Link>
    </main>
  );
}
