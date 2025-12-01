import Link from 'next/link';
import { Github } from 'lucide-react';

export default function Page() {
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
          href="/client/characters"
          className="block w-full py-4 bg-dagger-gold hover:bg-yellow-500 text-black font-bold text-xl rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95"
        >
          Go to Characters
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
        
        <p className="text-sm text-gray-500 max-w-lg mx-auto">
          This is a fan-made hobby project and is not affiliated with Darrington Press.
          Daggerheart is a trademark of Darrington Press.
        </p>
      </div>
    </div>
  );
}