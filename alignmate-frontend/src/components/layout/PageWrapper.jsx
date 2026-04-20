export default function PageWrapper({ children }) {
  return (
    <div className="bg-background text-foreground">

      {/* subtle gradient background (Stripe style) */}
      <div className="absolute inset-0 -z-10 
                      bg-gradient-to-b 
                      from-indigo-50/40 
                      via-transparent 
                      to-purple-50/40 
                      dark:from-indigo-900/10 
                      dark:to-purple-900/10" />

      <div className="relative space-y-24">
        {children}
      </div>

    </div>
  );
}