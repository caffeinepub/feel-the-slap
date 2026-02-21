import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useRegisterUser, useCheckUsername } from "../hooks/useQueries";
import { validatePassword, validateEmail, validateUsername } from "../lib/auth";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export function SignupPage() {
  const navigate = useNavigate();
  const { login, identity, isLoginSuccess } = useInternetIdentity();
  const registerUser = useRegisterUser();
  const checkUsername = useCheckUsername();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const passwordValidation = validatePassword(password);
  const usernameValidation = validateUsername(username);
  const emailValid = validateEmail(email);

  const handleCheckUsername = async () => {
    if (!usernameValidation.valid || !username) return;

    setCheckingUsername(true);
    try {
      const available = await checkUsername.mutateAsync(username);
      setUsernameAvailable(available);
    } catch (error) {
      toast.error("Failed to check username availability");
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleSignup = async () => {
    if (!usernameValidation.valid) {
      toast.error(usernameValidation.error);
      return;
    }

    if (!emailValid) {
      toast.error("Please enter a valid email");
      return;
    }

    if (!passwordValidation.valid) {
      toast.error("Password requirements not met");
      return;
    }

    if (!dateOfBirth) {
      toast.error("Please enter your date of birth");
      return;
    }

    // First, login with Internet Identity
    if (!identity) {
      try {
        await login();
      } catch (error) {
        toast.error("Failed to connect Internet Identity");
        return;
      }
    }
  };

  // Once logged in, register the user
  const handleRegister = async () => {
    if (!identity) return;

    try {
      const dob = new Date(dateOfBirth);
      const dobTimestamp = BigInt(dob.getTime()) * BigInt(1_000_000);

      await registerUser.mutateAsync({
        username,
        email,
        dateOfBirth: dobTimestamp,
        bio: "",
        lastEmotion: "",
        lastBodySensation: "",
        isProfilePublic: true,
      });

      toast.success("Account created! Welcome to FEEL THE SLAP! 🎉");
      navigate({ to: "/" });
    } catch (error) {
      toast.error("Failed to create account");
      console.error(error);
    }
  };

  // Auto-register once identity is available
  if (isLoginSuccess && identity && !registerUser.isSuccess) {
    handleRegister();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 texture-grunge">
      <Card className="w-full max-w-md border-4 border-primary shadow-neon-strong animate-bounce-in">
        <CardHeader>
          <CardTitle className="font-pixel text-2xl text-center text-primary">
            JOIN THE SLAP
          </CardTitle>
          <CardDescription className="text-center font-comic">
            Create your account and start feeling!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="font-comic">
              Username *
            </Label>
            <div className="flex gap-2">
              <Input
                id="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameAvailable(null);
                }}
                onBlur={handleCheckUsername}
                className="border-2 border-primary font-comic"
                placeholder="cooluser123"
              />
              {checkingUsername && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
              {usernameAvailable === true && <CheckCircle className="w-5 h-5 text-secondary" />}
              {usernameAvailable === false && <XCircle className="w-5 h-5 text-destructive" />}
            </div>
            {!usernameValidation.valid && username && (
              <p className="text-xs text-destructive font-comic">{usernameValidation.error}</p>
            )}
            {usernameAvailable === false && (
              <p className="text-xs text-destructive font-comic">Username is taken</p>
            )}
            {usernameAvailable === true && (
              <p className="text-xs text-secondary font-comic">Username is available!</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="font-comic">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-2 border-primary font-comic"
              placeholder="you@example.com"
            />
            {email && !emailValid && (
              <p className="text-xs text-destructive font-comic">Invalid email format</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-comic">
              Password *
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-2 border-primary font-comic"
              placeholder="••••••••"
            />
            {password && !passwordValidation.valid && (
              <div className="text-xs text-destructive font-comic space-y-1">
                <p className="font-bold">Password must have:</p>
                {passwordValidation.errors.map((error) => (
                  <p key={error}>• {error}</p>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dob" className="font-comic">
              Date of Birth *
            </Label>
            <Input
              id="dob"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="border-2 border-primary font-comic"
            />
            <p className="text-xs text-muted-foreground font-comic">
              Required for age verification (18+ content)
            </p>
          </div>

          <Button
            onClick={handleSignup}
            disabled={
              !usernameValidation.valid ||
              !emailValid ||
              !passwordValidation.valid ||
              !dateOfBirth ||
              usernameAvailable === false ||
              registerUser.isPending
            }
            className="w-full font-comic text-lg py-6 hover-shake shadow-neon"
          >
            {registerUser.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating Account...
              </>
            ) : (
              "🚀 CREATE ACCOUNT"
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm font-comic text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:text-accent transition-colors font-bold">
                Login here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
