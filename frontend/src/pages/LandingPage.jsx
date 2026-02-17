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
  Shield,
  Eye,
  EyeOff,
  Lock,
  MapPin
} from "lucide-react";

export default function LandingPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
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
    
    setLoading(true);
    try {
      const res = await api.post("/auth/register", { email, password, city });
      setPendingEmail(email);
      setVerificationCode(res.data.verification_code);
      toast.success("Check your email for the verification code");
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
      toast.success("Welcome to NearbyTalk");
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
      toast.success("Welcome back");
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-primary" />
          </div>
          <span className="text-lg font-semibold text-foreground">NearbyTalk</span>
        </div>
        <Button 
          data-testid="header-login-btn"
          onClick={() => { resetForm(); setAuthMode("login"); setShowAuth(true); }}
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
        >
          Sign In
        </Button>
      </header>

      {/* Hero Section */}
      <main className="max-w-2xl mx-auto px-6 pt-20 pb-32">
        <div className="space-y-8 animate-fade-in">
          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-semibold text-foreground leading-tight tracking-tight">
              Local conversations.
              <br />
              <span className="text-muted-foreground">Anonymous by design.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Share and discover what's happening in your city — without revealing who you are. University students get access to campus feeds.
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              data-testid="get-started-btn"
              onClick={() => { resetForm(); setAuthMode("register"); setShowAuth(true); }}
              className="btn-minimal bg-primary text-primary-foreground px-6 py-5"
            >
              Get Started
            </Button>
            <Button
              data-testid="login-btn"
              onClick={() => { resetForm(); setAuthMode("login"); setShowAuth(true); }}
              variant="outline"
              className="btn-minimal border-border text-foreground px-6 py-5"
            >
              I have an account
            </Button>
          </div>

          {/* Features */}
          <div className="grid gap-4 pt-12">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-card/50 border border-border/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-1">Privacy First</h3>
                <p className="text-sm text-muted-foreground">
                  Your identity stays hidden. Posts are completely anonymous within your community.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-card/50 border border-border/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-1">University Access</h3>
                <p className="text-sm text-muted-foreground">
                  .edu email holders get access to campus feeds. Everyone can join city conversations.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-card/50 border border-border/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-1">Local Focus</h3>
                <p className="text-sm text-muted-foreground">
                  See what matters in your city. Connect with people nearby.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 text-center text-xs text-muted-foreground border-t border-border/50 bg-background">
        Any email welcome • .edu gets university access • Anonymous posting
      </footer>

      {/* Auth Dialog */}
      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">
              {authMode === "login" && "Welcome back"}
              {authMode === "register" && "Create account"}
              {authMode === "verify" && "Verify email"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {authMode === "login" && "Sign in to continue"}
              {authMode === "register" && "Use any email. .edu emails get university access."}
              {authMode === "verify" && `Enter the code sent to ${pendingEmail}`}
            </DialogDescription>
          </DialogHeader>

          {authMode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-foreground">Email</Label>
                <Input
                  id="login-email"
                  data-testid="login-email-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-foreground">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    data-testid="login-password-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-muted border-border text-foreground pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button
                data-testid="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => { resetForm(); setAuthMode("register"); }}
                  className="text-primary hover:underline"
                >
                  Sign up
                </button>
              </p>
            </form>
          )}

          {authMode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-foreground">Email</Label>
                <Input
                  id="register-email"
                  data-testid="register-email-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  required
                />
                <p className="text-xs text-muted-foreground">.edu emails get university feed access</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-foreground">Password</Label>
                <div className="relative">
                  <Input
                    id="register-password"
                    data-testid="register-password-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-muted border-border text-foreground pr-10"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-city" className="text-foreground">City</Label>
                <Input
                  id="register-city"
                  data-testid="register-city-input"
                  type="text"
                  placeholder="San Francisco"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>
              <Button
                data-testid="register-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground"
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => { resetForm(); setAuthMode("login"); }}
                  className="text-primary hover:underline"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}

          {authMode === "verify" && (
            <form onSubmit={handleVerify} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="verification-code" className="text-foreground">Verification Code</Label>
                <Input
                  id="verification-code"
                  data-testid="verification-code-input"
                  type="text"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="bg-muted border-border text-foreground text-center text-lg tracking-widest"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-muted-foreground text-center">
                  Demo: Code shown after registration
                </p>
              </div>
              <Button
                data-testid="verify-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground"
              >
                {loading ? "Verifying..." : "Verify Email"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <button
                  type="button"
                  onClick={() => { resetForm(); setAuthMode("register"); }}
                  className="text-primary hover:underline"
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
