import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/lib/auth";
import { Header } from "@/components/Header";
import { Layout } from "@/components/Layout";
import Home from "@/pages/Home";
import CreateRoom from "@/pages/CreateRoom";
import JoinRoom from "@/pages/JoinRoom";
import Room from "@/pages/Room";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Account from "@/pages/Account";
import Pricing from "@/pages/Pricing";
import PaymentSuccess from "@/pages/PaymentSuccess";
import QueueTest from "@/pages/QueueTest";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import CaliforniaPrivacyPolicy from "@/pages/CaliforniaPrivacyPolicy";
import VoiceTranslator from "@/pages/VoiceTranslator";
import NotFound from "@/pages/not-found";

// Scroll to top on route change
function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/account" component={Account} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/create" component={CreateRoom} />
      <Route path="/join/:roomId" component={JoinRoom} />
      <Route path="/room/:roomId" component={Room} />
      <Route path="/test/queue" component={QueueTest} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/california-privacy-policy" component={CaliforniaPrivacyPolicy} />
      <Route path="/voice-translator" component={VoiceTranslator} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="voztra-theme">
        <AuthProvider>
          <TooltipProvider>
            <ScrollToTop />
            <Header />
            <Toaster />
            <Layout>
              <Router />
            </Layout>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
