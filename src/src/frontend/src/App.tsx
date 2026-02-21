import { RouterProvider, createRouter, createRootRoute, createRoute, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { MarqueeBanner } from "./components/MarqueeBanner";
import { FeedPage } from "./pages/FeedPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { EighteenPlusPage } from "./pages/EighteenPlusPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminPanel } from "./pages/AdminPanel";

const queryClient = new QueryClient();

// Root route with layout
const rootRoute = createRootRoute({
  component: () => (
    <div className="flex flex-col min-h-screen">
      <Header />
      <MarqueeBanner />
      <Outlet />
      <Footer />
      <Toaster />
    </div>
  ),
});

// Define routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: FeedPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  component: SignupPage,
});

const eighteenPlusRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/18plus",
  component: EighteenPlusPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile/$userId",
  component: ProfilePage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPanel,
});

// Create router
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  signupRoute,
  eighteenPlusRoute,
  profileRoute,
  adminRoute,
]);

const router = createRouter({ routeTree });

// TypeScript type augmentation
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
