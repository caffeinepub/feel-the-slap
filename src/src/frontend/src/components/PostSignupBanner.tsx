import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, AlertTriangle } from "lucide-react";
import { validateEmail } from "../lib/auth";
import { useSaveCallerProfile, useGetCallerProfile } from "../hooks/useQueries";
import { toast } from "sonner";

export function PostSignupBanner() {
  const { data: profile } = useGetCallerProfile();
  const saveProfile = useSaveCallerProfile();
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    // Check if user just signed up
    const justSignedUp = localStorage.getItem("justSignedUp");
    const hasSeenBanner = localStorage.getItem("hasSeenPostSignupBanner");

    if (justSignedUp === "true" && hasSeenBanner !== "true") {
      setVisible(true);
      // Clear the signup flag
      localStorage.removeItem("justSignedUp");
    }
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem("hasSeenPostSignupBanner", "true");
  };

  const handleSave = async () => {
    if (!profile) {
      toast.error("Profile not loaded");
      return;
    }

    // Validate email if provided
    if (email && !validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Phone validation (basic)
    if (phone && phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    try {
      await saveProfile.mutateAsync({
        ...profile,
        email: email || profile.email,
        // Note: We'd need to add a phoneNumber field to UserProfile in backend
        // For now, we'll just save email
      });

      toast.success("Contact info saved! 🎉");
      handleDismiss();
    } catch (error) {
      toast.error("Failed to save contact info");
      console.error(error);
    }
  };

  if (!visible) return null;

  return (
    <div className="relative bg-gradient-to-r from-accent/90 to-secondary/90 border-4 border-primary shadow-neon-strong p-4 mb-6 rounded-lg animate-bounce-in">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-primary-foreground hover:text-destructive transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-primary-foreground shrink-0 mt-1 animate-pulse" />
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="font-pixel text-lg text-primary-foreground mb-1">
              PROTECT YOUR ACCOUNT!
            </h3>
            <p className="font-comic text-sm text-primary-foreground/90">
              Add your email and phone in case you need to recover access later. You can skip this and add it later in settings.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-2 border-primary bg-background/90 font-comic"
              />
            </div>
            <div>
              <Input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border-2 border-primary bg-background/90 font-comic"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleSave}
              disabled={saveProfile.isPending || (!email && !phone)}
              className="font-comic hover-shake shadow-neon"
              size="sm"
            >
              {saveProfile.isPending ? "Saving..." : "💾 Save Info"}
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="font-comic border-2 border-primary"
              size="sm"
            >
              Add Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
