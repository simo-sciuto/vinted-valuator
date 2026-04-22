import { Link, NavLink, useNavigate } from "react-router-dom";
import { Sparkles, LogOut, LayoutGrid, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AppHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <>
      {/* Desktop & Tablet Top Header */}
      <div className="fixed top-4 md:top-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
        <header className="pointer-events-auto flex h-14 md:h-16 items-center justify-between rounded-full border-2 border-black dark:border-white bg-background px-4 md:px-6 shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_6px_0px_0px_rgba(255,255,255,0.15)] w-full max-w-5xl transition-all">
          <Link to="/" className="flex items-center gap-2 font-display text-lg md:text-xl font-black uppercase tracking-tighter hover:scale-105 transition-transform">
            <span className="grid h-8 w-8 md:h-10 md:w-10 place-items-center rounded-full bg-accent border-2 border-black text-black">
              <Sparkles className="h-4 w-4 md:h-5 md:w-5" />
            </span>
            <span className="hidden xs:inline">ReVinted</span>
          </Link>

          {user ? (
            <nav className="flex items-center gap-1 md:gap-2">
              <div className="hidden sm:flex items-center gap-1 md:gap-2">
                <NavItem to="/dashboard" icon={<LayoutGrid className="h-4 w-4" />}>
                  Storico
                </NavItem>
                <NavItem to="/sales" icon={<Wallet className="h-4 w-4" />}>
                  Vendite
                </NavItem>
              </div>
              <NavItem to="/new" icon={<Plus className="h-4 w-4" />} primary className="md:px-5">
                <span className="hidden xs:inline">Nuova analisi</span>
                <span className="xs:hidden">Nuova</span>
              </NavItem>
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Esci" className="rounded-full h-9 w-9">
                <LogOut className="h-4 w-4" />
              </Button>
            </nav>
          ) : (
            <div className="flex items-center gap-1 md:gap-2">
              <ThemeToggle />
              <Button variant="ghost" asChild size="sm" className="font-bold uppercase text-xs h-9">
                <Link to="/auth">Accedi</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full font-bold uppercase text-xs h-9 px-4 md:px-6">
                <Link to="/auth?mode=signup">Inizia gratis</Link>
              </Button>
            </div>
          )}
        </header>
      </div>

      {/* Mobile Bottom Navigation (Visible only when logged in) */}
      {user && (
        <div className="sm:hidden fixed bottom-6 left-4 right-4 z-50 pointer-events-none">
          <nav className="pointer-events-auto mx-auto flex h-16 items-center justify-around rounded-full border-2 border-black bg-background/95 backdrop-blur-md px-2 shadow-[0px_8px_24px_rgba(0,0,0,0.2),4px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
            <MobileNavItem to="/dashboard" icon={<LayoutGrid className="h-5 w-5" />} label="Storico" />
            <MobileNavItem to="/new" icon={<Plus className="h-6 w-6" />} label="Nuova" primary />
            <MobileNavItem to="/sales" icon={<Wallet className="h-5 w-5" />} label="Vendite" />
          </nav>
        </div>
      )}
    </>
  );
}

function MobileNavItem({ to, icon, label, primary }: { to: string; icon: React.ReactNode; label: string; primary?: boolean }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center justify-center gap-1 px-4 py-1 rounded-2xl transition-all",
          primary 
            ? "bg-pop text-black border-2 border-black -translate-y-4 scale-110 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[-12px] active:shadow-none"
            : isActive
              ? "text-black font-bold"
              : "text-muted-foreground"
        )
      }
    >
      {icon}
      <span className={cn("text-[10px] font-black uppercase tracking-tighter", primary && "hidden")}>{label}</span>
    </NavLink>
  );
}

function NavItem({
  to,
  icon,
  children,
  primary,
  className,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  primary?: boolean;
  className?: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "inline-flex items-center gap-2 rounded-full px-3 md:px-5 py-2 md:py-2.5 text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all border-2",
          primary
            ? "border-black bg-pop text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none"
            : isActive
              ? "border-black dark:border-white bg-accent text-black"
              : "border-transparent text-muted-foreground hover:border-black dark:hover:border-white hover:bg-muted hover:text-foreground",
          className
        )
      }
    >
      {icon}
      {children}
    </NavLink>
  );
}

