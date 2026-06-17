export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center overflow-x-hidden p-4">
      {children}
    </div>
  );
}
