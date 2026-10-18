export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative isolate flex min-h-svh items-center justify-center overflow-clip">
      <div className="absolute -inset-5 -z-10 bg-[url('/login-background.png')] bg-cover bg-center bg-no-repeat blur-md" />
      {children}
    </div>
  )
}
