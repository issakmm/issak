import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, api } from "../App";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "../components/ui/dialog";
import { 
  MessageCircle, 
  ArrowUp, 
  ArrowDown, 
  MapPin, 
  GraduationCap,
  Eye,
  EyeOff,
  Sparkles
} from "lucide-react";

export default function LandingPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login", "register", "verify"
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  useEffect(() => {
    if (user) {
      navigate("/feed");
    }
  }, [user, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email.endsWith(".edu")) {
      toast.error("Only .edu email addresses are allowed");
      return;
    }
    
    setLoading(true);
    try {
      const res = await api.post("/auth/register", { email, password, city });
      setPendingEmail(email);
      setVerificationCode(res.data.verification_code); // For demo - would be sent via email
      toast.success("Registration successful! Check your email for verification code.");
      setAuthMode("verify");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/verify", { 
        email: pendingEmail, 
        code: verificationCode 
      });
      login(res.data.token, res.data.user);
      toast.success("Email verified! Welcome to NearbyTalk!");
      navigate("/feed");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.token, res.data.user);
      toast.success("Welcome back!");
      navigate("/feed");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setCity("");
    setVerificationCode("");
    setPendingEmail("");
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col">
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between p-6 md:p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight">NearbyTalk</span>
          </div>
          <Button 
            data-testid="header-login-btn"
            onClick={() => { resetForm(); setAuthMode("login"); setShowAuth(true); }}
            className="btn-brutal bg-primary text-primary-foreground px-6"
          >
            Sign In
          </Button>
        </header>

        {/* Main Content */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="max-w-3xl mx-auto space-y-8 animate-slide-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Anonymous. Local. Real.</span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
              Your Campus.{" "}
              <span className="text-primary">Your City.</span>
              <br />
              <span className="text-secondary">Unfiltered.</span>
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
              Share thoughts, discover what's happening around you, and connect 
              with your community — all completely anonymous.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                data-testid="get-started-btn"
                onClick={() => { resetForm(); setAuthMode("register"); setShowAuth(true); }}
                size="lg"
                className="btn-brutal bg-primary text-primary-foreground px-8 py-6 text-lg"
              >
                Get Started
              </Button>
              <Button
                data-testid="login-btn"
                onClick={() => { resetForm(); setAuthMode("login"); setShowAuth(true); }}
                size="lg"
                variant="outline"
                className="btn-brutal bg-background px-8 py-6 text-lg"
              >
                I have an account
              </Button>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 stagger-children">
              <div className="card-sticker text-left">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">University Feed</h3>
                <p className="text-muted-foreground">
                  Connect with students from your campus. Share the real college experience.
                </p>
              </div>

              <div className="card-sticker text-left">
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-bold mb-2">City Feed</h3>
                <p className="text-muted-foreground">
                  Discover what's happening in your city. Local vibes, local voices.
                </p>
              </div>

              <div className="card-sticker text-left">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                  <div className="flex items-center gap-1">
                    <ArrowUp className="w-4 h-4 text-[hsl(var(--upvote))]" />
                    <ArrowDown className="w-4 h-4 text-[hsl(var(--downvote))]" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Vote & Discuss</h3>
                <p className="text-muted-foreground">
                  Upvote what resonates. Downvote the rest. Your voice matters.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 p-6 text-center text-sm text-muted-foreground">
          <p>Only .edu email addresses • 100% Anonymous • Built for students</p>
        </footer>
      </div>

      {/* Auth Dialog */}
      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="sm:max-w-md border-2 border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {authMode === "login" && "Welcome Back"}
              {authMode === "register" && "Join NearbyTalk"}
              {authMode === "verify" && "Verify Email"}
            </DialogTitle>
            <DialogDescription>
              {authMode === "login" && "Sign in to continue to your feeds"}
              {authMode === "register" && "Use your .edu email to get started"}
              {authMode === "verify" && `Enter the code sent to ${pendingEmail}`}
            </DialogDescription>
          </DialogHeader>

          {authMode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  data-testid="login-email-input"
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 border-2"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    data-testid="login-password-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 border-2 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <Button
                data-testid="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full btn-brutal bg-primary text-primary-foreground h-12"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => { resetForm(); setAuthMode("register"); }}
                  className="text-primary font-semibold hover:underline"
                >
                  Sign up
                </button>
              </p>
            </form>
          )}

          {authMode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="register-email">University Email</Label>
                <Input
                  id="register-email"
                  data-testid="register-email-input"
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 border-2"
                  required
                />
                <p className="text-xs text-muted-foreground">Must be a .edu email address</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <div className="relative">
                  <Input
                    id="register-password"
                    data-testid="register-password-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 border-2 pr-12"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-city">Your City</Label>
                <Input
                  id="register-city"
                  data-testid="register-city-input"
                  type="text"
                  placeholder="San Francisco"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-12 border-2"
                  required
                />
              </div>
              <Button
                data-testid="register-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full btn-brutal bg-primary text-primary-foreground h-12"
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => { resetForm(); setAuthMode("login"); }}
                  className="text-primary font-semibold hover:underline"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}

          {authMode === "verify" && (
            <form onSubmit={handleVerify} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  data-testid="verification-code-input"
                  type="text"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="h-12 border-2 text-center text-2xl tracking-widest"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-muted-foreground text-center">
                  Demo: Code is shown after registration. In production, check your email.
                </p>
              </div>
              <Button
                data-testid="verify-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full btn-brutal bg-primary text-primary-foreground h-12"
              >
                {loading ? "Verifying..." : "Verify Email"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <button
                  type="button"
                  onClick={() => { resetForm(); setAuthMode("register"); }}
                  className="text-primary font-semibold hover:underline"
                >
                  Use a different email
                </button>
              </p>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
