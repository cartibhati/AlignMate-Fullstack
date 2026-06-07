export default function PageWrapper({ children }) {
  return (
    <div className="bg-background text-foreground min-h-screen relative overflow-hidden bg-grid">

      {/* subtle gradient background (Stripe style) */}
      <div className="absolute inset-0 -z-10 
                      bg-gradient-to-b 
                      from-primary/5 
                      via-transparent 
                      to-transparent" />

      <div className="relative space-y-24">
        {children}
      </div>

    </div>
  );
}