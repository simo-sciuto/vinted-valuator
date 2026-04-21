import { Link, NavLink, useNavigate } from "react-router-dom";
import { Sparkles, LogOut, LayoutGrid, Plus } from "lucide-react";
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
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-hero text-primary-foreground shadow-pop">
            <Sparkles className="h-4 w-4" />
          </span>
          ReVinted
        </Link>

        {user ? (
          <nav className="flex items-center gap-2">
            <NavItem to="/dashboard" icon={<LayoutGrid className="h-4 w-4" />}>
              Storico
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
      </div>
    </header>
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
          "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
          primary
            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-pop"
            : isActive
              ? "bg-primary-soft text-secondary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )
      }
    >
      {icon}
      {children}
    </NavLink>
  );
}
