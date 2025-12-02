# Supabase Storage Setup for Character Avatars

This guide will help you set up the Supabase Storage bucket for character avatar uploads.

## Steps

### 1. Run the Storage SQL Migration

Open your Supabase dashboard and run the SQL in `supabase/storage.sql`:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (in the left sidebar)
3. Click **New Query**
4. Copy and paste the contents of `supabase/storage.sql`
5. Click **Run**

This will:
- Create a public storage bucket called `character-avatars`
- Set up Row Level Security (RLS) policies to:
  - Allow authenticated users to upload their own character avatars
  - Allow users to update/delete their own avatars
  - Allow public read access to all avatars

### 2. Verify the Bucket

1. In your Supabase dashboard, navigate to **Storage** (in the left sidebar)
2. You should see a bucket called `character-avatars`
3. Click on it to verify it was created successfully

### 3. Test the Upload Feature

1. Restart your Next.js development server (important for Next.js config changes)
2. Navigate to the character creation page
3. In Step 1, you should now see an "Upload Image" button instead of URL input
4. Try uploading a character avatar (max 2MB, image files only)
5. The image will be stored in Supabase Storage at: `character-avatars/{user_id}/{filename}`

## How It Works

### File Organization
Images are organized by user ID:
```
character-avatars/
├── user-abc123/
│   ├── character1_timestamp.jpg
│   └── character2_timestamp.png
└── user-xyz789/
    └── character3_timestamp.webp
```

### Security
- Only authenticated users can upload files
- Users can only manage (upload/update/delete) their own files
- All images are publicly readable (perfect for character avatars)
- Files are validated for type and size (max 2MB)

### Next.js Image Optimization
The `next.config.ts` has been configured to allow images from `*.supabase.co`, enabling Next.js automatic image optimization for your character avatars.

## Utilities

Two helper functions are available in `lib/supabase/storage.ts`:

- `uploadCharacterAvatar(userId, file, characterId?)` - Upload a new avatar
- `deleteCharacterAvatar(imageUrl)` - Delete an existing avatar

These are already integrated into the character creation form.
