/**
 * LANDING PAGE & AUTH REDIRECT
 * ----------------------------------------------------------------------------
 * This is the public facing home page of the application, visible at the root URL (`/`).
 * 
 * FUNCTIONALITY:
 * - Authentication Check: Automatically redirects authenticated users to their
 *   character dashboard (`/client/characters`), skipping this page.
 * - Public Welcome: Displays the application title, description, and "Get Started" 
 *   Call-to-Action for new visitors.
 * - Disclaimer: Includes required legal disclaimers regarding Daggerheart/Darrington Press.
 */

import Link from 'next/link';
import { Github } from 'lucide-react';
import { redirect } from 'next/navigation';
import createClient from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is authenticated, redirect to characters page
  if (user) {
    redirect('/client/characters');
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 text-center space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-dagger-gold">
          Daggerheart Companion
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          A fan-made digital character sheet and companion app for the Daggerheart TTRPG.
        </p>
      </div>

      <div className="space-y-4 w-full max-w-md">
        <Link
          href="/auth/login"
          className="block w-full py-4 bg-dagger-gold hover:bg-yellow-500 text-black font-bold text-xl rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95"
        >
          Get Started
        </Link>
      </div>

      <div className="pt-12 space-y-6 opacity-80 hover:opacity-100 transition-opacity">
        <div className="flex justify-center gap-6">
          <a
            href="https://github.com/galacticeyecodex-debug/dh-cs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <Github size={20} />
            <span>View on GitHub</span>
          </a>
        </div>

        <p className="text-xs text-gray-500 max-w-lg mx-auto italic">
          This application is provided "as-is" and may contain inaccuracies or bugs. Contributions and bug reports are welcome!
        </p>

        <p className="text-xs text-gray-500 max-w-lg mx-auto">
          This product includes materials from the Daggerheart System Reference Document 1.0, © Critical Role, LLC, under the terms of the Darrington Press Community Gaming License. More information at <a href="https://www.daggerheart.com" className="underline hover:text-white">www.daggerheart.com</a>.
        </p>
        <p className="text-xs text-gray-500 max-w-lg mx-auto">
          Darrington Press™ and the Darrington Press authorized work logo are trademarks of Critical Role, LLC and used with permission.
        </p>
      </div>
    </div>
  );
}