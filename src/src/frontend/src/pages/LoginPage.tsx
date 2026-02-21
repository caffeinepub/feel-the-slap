import { Link, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerProfile } from "../hooks/useQueries";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoggingIn, isLoginSuccess } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useGetCallerProfile();

  useEffect(() => {
    if (isLoginSuccess && profile) {
      toast.success("Welcome back! 🎉");
      navigate({ to: "/" });
    }
  }, [isLoginSuccess, profile, navigate]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      toast.error("Failed to login");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 texture-grunge">
      <Card className="w-full max-w-md border-4 border-primary shadow-neon-strong animate-bounce-in">
        <CardHeader>
          <CardTitle className="font-pixel text-2xl text-center text-primary">
            WELCOME BACK
          </CardTitle>
          <CardDescription className="text-center font-comic">
            Login to continue feeling the slap!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="font-comic text-sm text-muted-foreground">
              We use Internet Identity for secure, password-free authentication.
            </p>
          </div>

          <Button
            onClick={handleLogin}
            disabled={isLoggingIn || profileLoading}
            className="w-full font-comic text-lg py-6 hover-shake shadow-neon"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              "🔐 LOGIN WITH INTERNET IDENTITY"
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground font-comic">OR</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm font-comic text-muted-foreground mb-4">
              Don't have an account yet?
            </p>
            <Link to="/signup">
              <Button
                variant="outline"
                className="w-full border-2 hover-shake font-comic"
              >
                CREATE NEW ACCOUNT
              </Button>
            </Link>
          </div>

          <div className="text-center pt-4 border-t-2 border-border">
            <a
              href="#"
              className="text-sm font-comic text-accent hover:text-primary transition-colors"
            >
              Forgot your identity? Get help →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
