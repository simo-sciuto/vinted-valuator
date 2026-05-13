import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const credentialsSchema = z.object({
  email: z.string().trim().email({ message: "Email non valida" }).max(255),
  password: z
    .string()
    .min(8, { message: "Almeno 8 caratteri" })
    .max(72, { message: "Massimo 72 caratteri" }),
});

const Auth = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(params.get("mode") === "signup" ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast({
        title: "Controlla i dati",
        description: parsed.error.issues[0]?.message ?? "Dati non validi",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        toast({ title: "Benvenuto!", description: "Account creato. Stai per entrare." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Qualcosa è andato storto";
      toast({ title: "Ops", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <Link to="/" className="mb-10 flex items-center justify-center gap-2 font-display text-2xl font-black uppercase tracking-tighter">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-accent border-2 border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Tag className="h-5 w-5" />
          </span>
          STIMA
        </Link>

        <div className="rounded-[32px] border-4 border-black bg-card p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="font-display text-2xl font-black uppercase tracking-tight">
            {mode === "signup" ? "Crea account" : "Bentornato"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground font-medium">
            {mode === "signup" ? "Nessuna carta richiesta." : "Accedi per continuare."}
          </p>

          {/* Google OAuth */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            className="mt-6 h-12 w-full rounded-2xl border-2 border-black font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-0.5 transition-all flex items-center gap-3"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continua con Google
          </Button>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-black/10" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">oppure</span>
            <div className="flex-1 h-px bg-black/10" />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-black uppercase tracking-wider">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@esempio.it"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
                className="h-11 border-2 border-black rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-black uppercase tracking-wider">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder="Almeno 8 caratteri"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                maxLength={72}
                className="h-11 border-2 border-black rounded-xl"
              />
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-2xl border-2 border-black font-black uppercase text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-0.5 transition-all"
              disabled={submitting}
            >
              {submitting ? "Un attimo…" : mode === "signup" ? "Crea account" : "Accedi"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Hai già un account?" : "Non hai un account?"}{" "}
            <button
              type="button"
              className="font-black text-foreground hover:underline"
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
            >
              {mode === "signup" ? "Accedi" : "Registrati"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
