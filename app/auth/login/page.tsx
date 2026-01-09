"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import createClient from "@/lib/supabase/client";
import { CircleAlert, LoaderCircle, Coffee, Heart, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";

/**
 * Validates a redirect path to prevent open redirect attacks.
 * Defense-in-depth: validates on client even though callback also validates.
 */
function isValidRedirectPath(path: string): boolean {
  if (!path.startsWith('/')) return false;
  if (path.startsWith('//')) return false;
  if (path.includes(':')) return false;
  if (path.includes('\\')) return false;
  return true;
}

export default function LoginPage() {
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const searchParams = useSearchParams();

  // Validate the redirect path to prevent open redirect attacks
  const next = useMemo(() => {
    const rawNext = searchParams.get("next") ?? "/client/characters";
    return isValidRedirectPath(rawNext) ? rawNext : "/client/characters";
  }, [searchParams]);

  const loginWithGoogle = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      setError("There was an error logging in with Google. Please try again.");
      console.error("Error logging in with Google:", error);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-dagger-dark relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-dagger-gold/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-dagger-gold/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <Card className="border-white/10 bg-dagger-panel/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center space-y-2 pb-8">
            <div className="mx-auto bg-dagger-dark/50 p-3 rounded-full w-fit mb-2 border border-dagger-gold/20">
              <Shield className="w-8 h-8 text-dagger-gold" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight text-dagger-gold">
              Daggerheart Companion
            </CardTitle>
            <CardDescription className="text-gray-400 text-base">
              Your digital character sheet for the Daggerheart TTRPG
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="rounded-md bg-red-900/20 border border-red-500/20 px-4 py-3"
              >
                <p className="text-sm text-red-400 flex items-center gap-2">
                  <CircleAlert className="size-4" />
                  {error}
                </p>
              </motion.div>
            )}

            <div className="space-y-4">
              <Button
                className="w-full h-12 text-base font-medium relative group overflow-hidden bg-white text-gray-900 hover:bg-gray-100 border border-gray-200 transition-all shadow-sm"
                onClick={loginWithGoogle}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <LoaderCircle className="animate-spin size-5 mr-2" />
                ) : (
                  <GoogleIcon />
                )}
                <span className="ml-2">Continue with Google</span>
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-dagger-panel px-2 text-gray-500">
                  Support the Project
                </span>
              </div>
            </div>

            <div className="bg-dagger-dark/30 rounded-lg p-4 text-center space-y-3 border border-white/5">
              <p className="text-sm text-gray-400">
                This app is a free, fan-made project. If you enjoy using it, consider buying me a coffee!
              </p>
              <Button
                asChild
                className="w-full bg-dagger-gold hover:bg-dagger-gold/90 text-black font-semibold shadow-lg hover:shadow-xl transition-all border-none"
              >
                <a
                  href="https://buymeacoffee.com/galactic.eye.codex"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <Coffee className="size-5" />
                  Buy Me A Coffee
                </a>
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col items-center gap-2 pt-2 pb-6">
            <div className="flex flex-col items-center gap-1 mb-2">
              <p className="text-[10px] text-center text-gray-500 max-w-[280px] leading-tight italic">
                Provided &quot;as-is&quot;. May contain inaccuracies.
              </p>
              <a
                href="https://github.com/galacticeyecodex-debug/dh-cs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-dagger-gold hover:underline flex items-center gap-1"
              >
                View on GitHub / Report Bugs
              </a>
            </div>
            <p className="text-[10px] text-center text-gray-500 max-w-[280px] leading-tight">
              This product includes materials from the Daggerheart System Reference Document 1.0, © Critical Role, LLC, under the terms of the Darrington Press Community Gaming License. More information at <a href="https://www.daggerheart.com" className="underline">www.daggerheart.com</a>.
            </p>
            <p className="text-[10px] text-center text-gray-500 max-w-[280px] leading-tight">
              Darrington Press™ and the Darrington Press authorized work logo are trademarks of Critical Role, LLC and used with permission.
            </p>
            <div className="flex items-center gap-1 text-xs text-gray-600 mt-2">
              <span>Made with</span>
              <Heart className="size-3 text-red-500/50 fill-red-500/20" />
              <span>for the community</span>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

const GoogleIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    className="size-5"
  >
    <path
      fill="#fbc02d"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20 s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    />
    <path
      fill="#e53935"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039 l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    />
    <path
      fill="#4caf50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
    />
    <path
      fill="#1565c0"
      d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    />
  </svg>
);
