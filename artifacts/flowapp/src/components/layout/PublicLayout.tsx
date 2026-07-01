export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <span className="font-serif text-2xl font-bold tracking-tight text-foreground">FlowApp Studio</span>
        </div>
      </header>
      <main>
        {children}
      </main>
    </div>
  );
}
