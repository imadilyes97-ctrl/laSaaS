export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#07050a' }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(255, 107, 53, 0.04) 0%, transparent 60%)',
      }} />
      <div className="relative">
        {children}
      </div>
    </div>
  )
}
