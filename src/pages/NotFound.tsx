import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      <div className="absolute inset-0 gradient-hero opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(350_89%_50%/0.08),transparent_60%)]" />
      <div className="relative z-10 text-center animate-fade-in max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 glow-primary">
          <AlertCircle className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-6xl font-bold text-gradient mb-3">404</h1>
        <p className="text-lg text-foreground mb-2">Página não encontrada</p>
        <p className="text-sm text-muted-foreground mb-8 break-all">
          A rota <span className="font-mono text-foreground/70">{location.pathname}</span> não existe.
        </p>
        <Button asChild className="rounded-xl glow-primary">
          <Link to="/"><Home className="w-4 h-4" /> Voltar ao início</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
