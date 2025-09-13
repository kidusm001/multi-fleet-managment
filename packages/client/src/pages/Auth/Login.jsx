import { useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { Button } from "@components/Common/UI/Button";
import { Input } from "@/components/Common/UI/Input";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

const inputStyles =
  "bg-white/10 border-2 border-white/20 text-white placeholder:text-white/50 h-12 px-4 rounded-xl transition-all duration-300 focus:bg-white/15 focus:border-[#f3684e]/50 focus:ring-2 focus:ring-[#f3684e]/20 hover:border-[#f3684e]/30 w-full shadow-lg shadow-black/5 text-base";
const buttonStyles =
  "relative overflow-hidden group bg-gradient-to-r from-[#f3684e] to-[#f3684e]/80 hover:from-[#f3684e]/90 hover:to-[#f3684e]/70 text-white py-3.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.98] w-full";

export default function Login() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const logoSrc = isDark
    ? "/assets/images/logo-light.png"
    : "/assets/images/logo-dark.PNG";
  const navigate = useNavigate();
  const location = useLocation();
  const nextPath = useMemo(() => {
    try {
      const params = new URLSearchParams(location.search);
      const n = params.get('next');
      if (!n) return '/';
      // Basic safety: prevent open redirects
      if (n.startsWith('http://') || n.startsWith('https://')) return '/';
      return n;
    } catch {
      return '/';
    }
  }, [location.search]);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await authClient.signIn.email({
        email: formData.email.trim(),
        password: formData.password
      }, {
        onSuccess: () => {
          navigate(nextPath);
        },
        onError: (ctx) => {
          setError(ctx.error.message);
        }
      });
    } catch (error) {
      setError(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaydaSignIn = async () => {
    setError(null);
    try {
      await authClient.signIn.oauth2({
        providerId: 'fayda',
        callbackURL: nextPath || '/'
      });
    } catch (error) {
      setError(error.message || 'Failed to sign in with Fayda');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-[#1a2327] to-[#1a2327] overflow-hidden">
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-8 relative z-10">
        <div className="relative flex items-center bg-white/80 backdrop-blur-sm px-4 py-[0.2rem] rounded-[1.5rem]">
          <img src={logoSrc} alt="Routegna" className="h-14 object-contain" />
        </div>
      </motion.div>

      <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-5xl">
        <div className="relative grid grid-cols-1 md:grid-cols-2 bg-black/20 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden">
          <div className="hidden md:block relative min-h-[520px]">
            <img src="/assets/images/login-hero.jpg" alt="Fleet operations" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent z-10" />
            <div className="absolute bottom-10 left-10 z-20">
              <motion.h2 initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl font-bold text-white mb-2">
                <span className="bg-gradient-to-r from-white to-[#f3684e] bg-clip-text text-transparent">Manage Your Fleet</span>
              </motion.h2>
              <motion.p initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-white/70 text-lg font-light">
                Streamline operations with smart solutions
              </motion.p>
            </div>
          </div>

          <div className="p-8 flex flex-col items-center justify-center bg-gradient-to-br from-[#324048]/80 to-[#324048]/40 relative z-10 min-h-[520px]">
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-black tracking-tight text-[#f3684e] mb-4"
            >
              Routegna Platform
            </motion.h2>
            <motion.h1
              className="text-4xl font-bold text-white mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Welcome back
            </motion.h1>
            <form onSubmit={handleSubmit} className="space-y-6 w-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleInputChange}
                  placeholder="Email"
                  className={inputStyles}
                  required
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password || ""}
                  onChange={handleInputChange}
                  placeholder="Password"
                  className={inputStyles}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors duration-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </motion.div>
            </form>
            <motion.div
              className="mt-8 w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                onClick={handleSubmit}
                className={buttonStyles}
                disabled={isLoading}
              >
                <span className="relative z-10 flex items-center justify-center">
                  {isLoading && (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  )}
                  {isLoading ? "Signing In..." : "Sign In"}
                </span>
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#f3684e]/0 via-white/10 to-[#f3684e]/0 group-hover:via-white/20 transition-all duration-500 translate-x-[-100%] group-hover:translate-x-[100%]" />
              </Button>
            </motion.div>

            {/* Divider */}
            <motion.div 
              className="flex items-center my-6 w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex-1 border-t border-white/20"></div>
              <span className="px-4 text-white/50 text-sm">or</span>
              <div className="flex-1 border-t border-white/20"></div>
            </motion.div>

            {/* Fayda Sign In Button */}
            <motion.div
              className="mb-6 w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <Button
                onClick={handleFaydaSignIn}
                className="relative overflow-hidden group bg-white hover:bg-gray-50 text-[#073B51] py-3.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.98] w-full border border-gray-200"
                disabled={isLoading}
              >
                <span className="relative z-10 flex items-center justify-center">
                  <img 
                    src="/assets/images/fayda.png" 
                    alt="Fayda" 
                    className="w-5 h-5 mr-2 object-contain rounded-full"
                  />
                  Continue with Fayda
                </span>
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-gray-100/0 via-gray-200/10 to-gray-100/0 group-hover:via-gray-200/20 transition-all duration-500 translate-x-[-100%] group-hover:translate-x-[100%]" />
              </Button>
            </motion.div>
            <motion.div
              className="mt-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-white/70">
                Don't have an account?{" "}
                <Link to="/auth/signup" className="text-[#f3684e] hover:text-[#f3684e]/80 font-medium transition-colors">
                  Sign Up
                </Link>
              </p>
            </motion.div>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm mt-4 text-center"
              >
                {error}
              </motion.p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
