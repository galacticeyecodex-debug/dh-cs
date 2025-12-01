# Daggerheart Web Companion

A mobile-first, digital character sheet for the [Daggerheart](https://darringtonpress.com/daggerheart/) Tabletop RPG. Built with Next.js 15, TypeScript, and Supabase.

## Features

- **Mobile-First Design** - Optimized for portrait mobile usage with touch interactions
- **3D Dice Rolling** - Interactive dice roller with physics simulation
- **Card-Based UI** - Manage abilities, equipment, and features as interactive cards
- **Cloud Sync** - Character data stored securely in Supabase
- **Google OAuth** - Easy authentication with your Google account
- **Real-Time Updates** - Optimistic UI updates for smooth interactions

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Backend:** [Supabase](https://supabase.com/) (PostgreSQL + Auth)
- **UI Components:** [Radix UI](https://www.radix-ui.com/) (via shadcn/ui)
- **3D Dice:** [@3d-dice/dice-box](https://github.com/3d-dice/dice-box)

## Getting Started

### Prerequisites

- Node.js 20+ installed
- A Supabase account and project
- Google OAuth credentials (for authentication)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/galacticeyecodex-debug/dh-cs.git
cd dh-cs
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. **Supabase Setup**:

   This project leverages Supabase for its backend, including the PostgreSQL database and authentication. Follow these detailed steps to set up your own Supabase instance:

   *   **Create a New Supabase Project**:
       1.  Go to [Supabase](https://supabase.com/) and sign up or log in.
       2.  Click "New project" to create a new project.
       3.  Remember your project's **Project URL** and **Anon Key**; these will be needed for your `.env.local` file (Step 3).

   *   **Apply Initial Schema**:
       1.  In your Supabase project dashboard, navigate to the **SQL Editor** (usually found under "Database" -> "SQL Editor").
       2.  Open the local file `supabase/schema.sql` from your cloned repository.
       3.  Copy the *entire content* of `supabase/schema.sql` and paste it into the Supabase SQL Editor.
       4.  Execute the SQL. This script creates core tables like `profiles`, `character_cards`, `character_inventory` and sets up their initial Row Level Security (RLS) policies.

   *   **Generate Game Data (Seed)**:
       1.  Game data (classes, abilities, etc.) is sourced from JSON files in `srd/json/`.
       2.  In your local project directory, run the parser script:
           ```bash
           node scripts/parse_json_srd.js
           ```
       3.  This command generates a new SQL file: `supabase/seed_library.sql`.
       4.  **Important**: Always examine the output of the parser script for "Total entries" to ensure data was parsed correctly. If "Total entries: 0" appears, there's an issue with the SRD JSON files or the script itself.

   *   **Seed Database with Game Data and Core Tables**:
       1.  Open the *newly generated* local file `supabase/seed_library.sql`.
       2.  Copy its entire content and paste it into the Supabase SQL Editor.
       3.  Execute this SQL. This script will create the `public.characters` and `public.library` tables (along with their RLS policies as defined in the seed script) and populate the `public.library` table with game data.

   *   **Configure Google OAuth (Optional, but Recommended)**:
       1.  In your Supabase project dashboard, navigate to "Authentication" -> "Providers".
       2.  Enable the "Google" provider and follow the instructions to set up your Google OAuth credentials. This is essential for the application's authentication flow.

5. Start the development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## Development

### Recommended Workflow

Always lint before building for fastest feedback:
```bash
npm run lint         # Fast - catches issues early
npm run build        # Slower - verifies compilation
```

Or as a one-liner:
```bash
npm run lint && npm run build
```

### Project Structure

```
dh-cs/
├── app/                  # Next.js App Router pages
│   ├── (playground)/     # Authenticated app views
│   ├── auth/             # Authentication routes
│   └── create-character/ # Character creation wizard
├── components/           # Reusable UI components
│   ├── ui/               # Shadcn/ui primitives
│   └── views/            # Feature-specific views (Character, Playmat, Inventory)
├── srd/                  # Source of Truth for game data (JSON files)
├── store/                # Zustand state management
├── lib/supabase/         # Supabase client utilities
└── scripts/              # Node.js data processing scripts
```
For detailed documentation, see [CLAUDE.md](./CLAUDE.md) or [GEMINI.md](./GEMINI.md).

## Deployment

This application can be easily deployed to [Render](https://render.com), a unified platform for cloud applications.

### Deploying to Render

1.  **Create a New Web Service**:
    *   Log in to your Render account.
    *   Go to the Dashboard and click "New" -> "Web Service".
2.  **Connect to your Repository**:
    *   Select "Build and deploy from a Git repository".
    *   Connect your GitHub account and choose the `galacticeyecodex-debug/dh-cs` repository.
    *   Ensure the branch is set to `main`.
3.  **Configure your Web Service**:
    *   **Name**: Choose a unique name for your service (e.g., `daggerheart-companion`).
    *   **Region**: Select a region close to your users.
    *   **Root Directory**: Leave empty or set to `/` (if the project root is the repository root).
    *   **Runtime**: `Node`
    *   **Build Command**: `npm run build`
    *   **Start Command**: `npm start`
    *   **Plan Type**: Choose an appropriate plan (e.g., "Free" for testing, "Starter" for production).
4.  **Set Environment Variables**:
    *   Add the following environment variables in the "Environment" section of your Render service settings:
        *   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key.
        *   `NEXT_PUBLIC_SITE_URL`: The public URL of your Render app (e.g., `https://your-app-name.onrender.com`). Render provides this after deployment.
5.  **Create Web Service**: Click "Create Web Service". Render will automatically build and deploy your application.

### Environment Variables for Production

Set these in your hosting platform (e.g., Render Dashboard):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_SITE_URL=https://your-app.onrender.com
```

## Contributing

This is a personal project, but contributions are welcome! Please:

1. Follow the existing code style
2. Run `npm run lint && npm run build` before committing
3. Write meaningful commit messages
4. Update documentation as needed

## License

This project is private and not currently licensed for public use.

## Acknowledgments

- Built with the amazing [Daggerheart SRD](https://darringtonpress.com/daggerheart/)
- Inspired by the need for a mobile-friendly character sheet
- Original authentication boilerplate from [shsfwork/supabase-auth-nextjs-google-boilerplate](https://github.com/shsfwork/supabase-auth-nextjs-google-boilerplate)

### Critical Fix for Production Deployment

⚠️ **Important:** The original boilerplate has a critical bug that breaks OAuth redirects when deployed behind reverse proxies (Render, Railway, Fly.io, etc.).

**Problem:** OAuth callbacks redirect to `localhost:10000` instead of your production URL.

**Root Cause:** The boilerplate uses `new URL(request.url).origin` which returns the internal proxy URL rather than the public-facing URL.

**Solution (commit `d85bfab`):** Use forwarded headers instead:

```typescript
// app/auth/callback/route.ts
const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
const protocol = request.headers.get('x-forwarded-proto') || 'https';
const origin = `${protocol}://${host}`;
```

This fix is **essential** for any cloud deployment. Without it, Google OAuth will redirect users to your hosting platform's internal URL instead of your public domain.

See [GitHub Issue #1](https://github.com/glacticeye/dh-cs/issues/1) for details on other security improvements made to the boilerplate.
