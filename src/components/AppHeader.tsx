import { Link, NavLink, useNavigate } from "react-router-dom";
import { Sparkles, LogOut, LayoutGrid, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
      <header className="pointer-events-auto flex h-16 items-center justify-between rounded-full border-2 border-black bg-background px-6 shadow-[6px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-5xl transition-all">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-black uppercase tracking-tighter hover:scale-105 transition-transform">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-accent border-2 border-black text-black">
            <Sparkles className="h-5 w-5" />
          </span>
          ReVinted
        </Link>

        {user ? (
          <nav className="flex items-center gap-2">
            <NavItem to="/dashboard" icon={<LayoutGrid className="h-4 w-4" />}>
              Storico
            </NavItem>
            <NavItem to="/sales" icon={<Wallet className="h-4 w-4" />}>
              Vendite
            </NavItem>
            <NavItem to="/new" icon={<Plus className="h-4 w-4" />} primary>
              Nuova analisi
            </NavItem>
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Esci">
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/auth">Accedi</Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link to="/auth?mode=signup">Inizia gratis</Link>
            </Button>
          </div>
        )}
      </header>
    </div>
  );
}

function NavItem({
  to,
  icon,
  children,
  primary,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-2",
          primary
            ? "border-black bg-pop text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none"
            : isActive
              ? "border-black bg-accent text-black"
              : "border-transparent text-muted-foreground hover:border-black hover:bg-muted hover:text-black",
        )
      }
    >
      {icon}
      {children}
    </NavLink>
  );
}
