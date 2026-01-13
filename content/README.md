# Content Directory

This directory contains modular content for the Daggerheart application.

## Architecture: Data-Driven Campaigns

The application uses a **fully data-driven architecture** where all content—including campaigns—is stored in Supabase and loaded at runtime. This means:

- **No hardcoded campaign references** in the application code
- **New campaigns can be added** by uploading data to Supabase (no code changes)
- **Content is modular** - enable/disable campaigns per character without rebuilding

### How Campaigns Work

1. **Campaign definitions** are stored in the `library` table with `type: 'campaign'`
2. **Campaign content** (NPCs, downtime moves, etc.) references the campaign by ID
3. **The app fetches** available campaigns from Supabase and displays them as toggles
4. **When enabled**, campaign-specific content becomes available to that character

### Adding a New Campaign

To add a new campaign (e.g., "Curse of Strahd"):

1. Create a campaign definition in your private content:
   ```json
   {
     "id": "curse-of-strahd",
     "name": "Curse of Strahd",
     "description": "Gothic horror campaign in Barovia",
     "features": ["dark_gifts", "dread_powers"]
   }
   ```

2. Create associated content (NPCs, downtime moves, etc.)

3. Run `npm run seed:private` to generate the SQL

4. Upload to Supabase - the campaign is now available in the app!

---

## Directory Structure

```
content/
├── README.md                       # This file
├── public/                         # Tracked in git (open content)
│   ├── srd/
│   │   └── json/                   # SRD abilities, ancestries, classes, etc.
│   ├── sql/
│   │   └── seed_public.sql         # Generated SQL seed file
│   └── seed-public-library.js      # npm run seed:public
│
└── private/                        # Gitignored (personal/licensed content)
    ├── playtest/
    │   └── json/                   # Playtest classes, abilities, etc.
    ├── {campaign}/                 # Campaign-specific content
    │   └── json/
    │       ├── campaign.json       # Campaign definition
    │       ├── npcs.json           # Campaign NPCs
    │       └── downtime.json       # Campaign downtime moves (optional)
    ├── sql/
    │   └── seed_private-library.js # Generated SQL seed file
    └── seed-private-library.js     # npm run seed:private
```

## Public Content (`content/public/`)

SRD content that is safe to distribute:
- Core classes, subclasses, and abilities
- Base ancestries and communities
- Standard items and equipment

This content is always available and tracked in the repository.

## Private Content (`content/private/`)

The `private/` subdirectory is **gitignored** and holds:
- **Playtest material** (unreleased classes, abilities)
- **Campaign definitions** (campaign.json files)
- **Campaign content** (NPCs, downtime moves, custom features)
- **Licensed content** you don't want to redistribute

### Setting Up Private Content

1. **Create the private directory structure**:
   ```bash
   mkdir -p content/private/playtest/json
   mkdir -p content/private/{campaign-name}/json
   ```

2. **Initialize as a separate git repository** (optional but recommended):
   ```bash
   cd content/private
   git init
   git remote add origin git@github.com:YOUR_USERNAME/dh-cs-private.git
   ```

3. **Create campaign content**:
   ```bash
   # content/private/strixhaven/json/campaign.json   # Campaign definition
   # content/private/strixhaven/json/npcs.json       # Campaign NPCs
   # content/private/strixhaven/json/downtime.json   # Campaign downtime moves
   ```

4. **Generate SQL seed files**:
   ```bash
   npm run seed:public    # → content/public/sql/seed_public-library.js
   npm run seed:private   # → content/private/sql/seed_private-library.js
   ```

5. **Upload to Supabase**:
   - Go to Supabase Dashboard → SQL Editor
   - Run `seed_public-library.js` first (SRD content)
   - Run `seed_private-library.js` second (private/campaign content)

## How Content Loading Works

```
┌─────────────────────────────────────────────────────────────┐
│                      Supabase (library table)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Classes  │  │ Abilities│  │ Campaigns│  │   NPCs   │    │
│  │ (srd)    │  │ (srd)    │  │(homebrew)│  │(homebrew)│    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ fetch at runtime
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Application                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ useContentAccess hook                                 │  │
│  │  - Fetches available campaigns from Supabase          │  │
│  │  - Tracks which campaigns are enabled per character   │  │
│  └──────────────────────────────────────────────────────┘  │
│                              │                              │
│                              ▼                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Components                                            │  │
│  │  - Show campaign-specific UI based on enabled flags   │  │
│  │  - Load campaign NPCs, downtime moves, etc.           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Library Table Schema

All content is stored in the `library` table with these types:

| Type | Description | Example |
|------|-------------|---------|
| `class` | Character classes | Bard, Guardian, Wizard |
| `subclass` | Subclass options | Troubadour, Stalwart |
| `ability` | Domain abilities | Blade abilities, Arcana spells |
| `ancestry` | Character ancestries | Elf, Dwarf, Katari |
| `community` | Character communities | Highborne, Wildborne |
| `campaign` | Campaign definitions | Strixhaven, Curse of Strahd |
| `campaign_npcs` | NPCs for a campaign | Strixhaven student NPCs |
| `downtime_move` | Campaign downtime moves | Study session, extracurricular |

The `source` field indicates origin:
- `srd` - Official System Reference Document
- `playtest` - Unreleased playtest material  
- `homebrew` - Custom/campaign-specific content
