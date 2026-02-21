import { Link } from "@tanstack/react-router";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsSiteOwner } from "../hooks/useQueries";
import { Button } from "@/components/ui/button";
import { Sparkles, Shield } from "lucide-react";
import { FriendRequestsModal } from "./FriendRequestsModal";

export function Header() {
  const { identity, isLoginSuccess, clear } = useInternetIdentity();
  const { data: isSiteOwner = false } = useIsSiteOwner();

  return (
    <header className="border-b-4 border-primary bg-card texture-grunge sticky top-0 z-50 shadow-neon">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="flex flex-col hover-glow">
            <h1 className="font-pixel text-xl sm:text-2xl text-primary animate-sparkle leading-tight">
              FEEL THE SLAP
            </h1>
            <p className="font-comic text-xs sm:text-sm text-accent mt-1">
              spill it. slap it. feel it.
            </p>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4">
            {isLoginSuccess && identity ? (
              <>
                <Link to="/">
                  <Button variant="ghost" size="sm" className="hover-shake font-comic">
                    <Sparkles className="w-4 h-4 mr-1" />
                    Feed
                  </Button>
                </Link>
                <Link to="/18plus">
                  <Button variant="ghost" size="sm" className="hover-shake font-comic">
                    18+
                  </Button>
                </Link>
                <Link to="/profile/$userId" params={{ userId: identity?.getPrincipal().toString() || "" }}>
                  <Button variant="ghost" size="sm" className="hover-shake font-comic">
                    Profile
                  </Button>
                </Link>
                <FriendRequestsModal />
                {isSiteOwner && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm" className="hover-shake font-comic">
                      <Shield className="w-4 h-4 mr-1" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Button
                  onClick={clear}
                  variant="outline"
                  size="sm"
                  className="border-2 hover-shake font-comic"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-2 hover-shake font-comic"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 hover-shake font-comic shadow-neon"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
