import { Link, NavLink, useNavigate } from "react-router-dom";
import { Tag, LogOut, LayoutGrid, Plus, Wallet, Scale, Calculator } from "lucide-react";
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
              <Tag className="h-4 w-4 md:h-5 md:w-5" />
            </span>
            <span>STIMA</span>
          </Link>

          {user ? (
            <nav className="flex items-center gap-2">
              {/* Secondary nav — all in one grouped pill */}
              <div className="hidden sm:flex items-center gap-0.5 rounded-full border-2 border-black bg-muted p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <GroupNavItem to="/dashboard" icon={<LayoutGrid className="h-3.5 w-3.5" />}>Storico</GroupNavItem>
                <GroupNavItem to="/deal-checker" icon={<Scale className="h-3.5 w-3.5" />}>Check</GroupNavItem>
                <GroupNavItem to="/calculator" icon={<Calculator className="h-3.5 w-3.5" />}>Calc</GroupNavItem>
                <GroupNavItem to="/sales" icon={<Wallet className="h-3.5 w-3.5" />}>Vendite</GroupNavItem>
              </div>

              {/* Primary CTA */}
              <NavLink
                to="/new"
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-black bg-pop px-4 py-2 text-[11px] font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Nuova</span>
              </NavLink>

              {/* Utility */}
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

      {/* Mobile Bottom Navigation */}
      {user && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50">
          <nav className="relative bg-background/95 backdrop-blur-md border-t-2 border-black">
            {/* Floating center button */}
            <NavLink
              to="/new"
              className={({ isActive }) =>
                cn(
                  "absolute left-1/2 -translate-x-1/2 -top-6 flex h-14 w-14 items-center justify-center rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all",
                  isActive ? "bg-pop/80" : "bg-pop"
                )
              }
            >
              <Plus className="h-7 w-7 text-black" />
            </NavLink>

            <div className="flex h-16 items-center px-2">
              <div className="flex flex-1 justify-around">
                <MobileNavItem to="/dashboard" icon={<LayoutGrid className="h-5 w-5" />} label="Storico" />
                <MobileNavItem to="/deal-checker" icon={<Scale className="h-5 w-5" />} label="Check" />
              </div>
              <div className="w-16 shrink-0" />
              <div className="flex flex-1 justify-around">
                <MobileNavItem to="/calculator" icon={<Calculator className="h-5 w-5" />} label="Calc" />
                <MobileNavItem to="/sales" icon={<Wallet className="h-5 w-5" />} label="Vendite" />
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

function MobileNavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-[52px]",
          isActive ? "text-foreground" : "text-muted-foreground"
        )
      }
    >
      {icon}
      <span className="text-[9px] font-black uppercase tracking-tight">{label}</span>
    </NavLink>
  );
}

function GroupNavItem({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all",
          isActive
            ? "bg-black text-white dark:bg-accent dark:text-black"
            : "text-muted-foreground hover:bg-background hover:text-foreground"
        )
      }
    >
      {icon}
      {children}
    </NavLink>
  );
}

