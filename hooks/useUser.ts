import { useEffect, useState } from "react";
import { AuthError, Session, User } from "@supabase/supabase-js";
import createClient from "@/lib/supabase/client";
import { useCharacterStore } from "@/store/character-store";

export default function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const supabase = createClient();
  const { setCharacter, setUser: setStoreUser } = useCharacterStore();

  useEffect(() => {
    // Initial fetch
    async function fetchUser() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error) {
           // It's okay if no user, but if it's a real error, set it
           // Typically 'AuthSessionMissingError' just means not logged in
           if (error.name !== 'AuthSessionMissingError') {
              setError(error);
           }
        }

        if (user) {
          setUser(user);
          const { data: { session } } = await supabase.auth.getSession();
          setSession(session);
        }
      } catch (error) {
        setError(error as AuthError);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUser();

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (event === 'SIGNED_OUT') {
        // Clear local state and global store on sign out
        setUser(null);
        setSession(null);
        setCharacter(null);
        setStoreUser(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
         // Optionally trigger a store fetch or user set here if needed
         // But usually components react to the user change
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, setCharacter, setStoreUser]);

  return { loading, error, session, user };
}
