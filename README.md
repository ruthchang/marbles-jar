# Habit Jar - Marble Count 🫙

A delightful habit tracking app where you collect cute marbles (and other collectibles) as rewards for completing your daily habits.

## Features

- **Visual Progress**: Watch your jar fill up with colorful marbles as you complete habits
- **Physics Simulation**: Realistic marble physics using Matter.js
- **Interactive Jar**: Drag or shake the jar to move marbles around
- **Sound Effects**: Hear the satisfying clinks as marbles collide
- **Multiple Collectibles**: Choose from marbles, stars, hearts, gems, or flowers
- **Daily Reset**: Habits reset each day, but your marbles are forever
- **Persistent Storage**: Your progress is saved locally (optional cloud sync across devices)

## Getting Started

1. Open `index.html` in a modern web browser
2. Add your daily habits using the "+ Add Habit" button
3. Check off habits as you complete them to earn marbles
4. Shake or drag the jar to enjoy your collection!

## Local Development (Auto Refresh)

Run a local server with live reload:

```bash
npm run dev
```

Then open:

- `http://localhost:5500` for the main app
- `http://localhost:5500/collection.html` for the collection page

Any change to `.html`, `.css`, `.js`, or `.json` files will auto-refresh the browser.

## Collectible Types

- 🔮 **Marbles** - Classic colorful glass marbles
- ⭐ **Stars** - Shimmering golden stars
- 💖 **Hearts** - Sweet pink hearts
- 💎 **Gems** - Sparkling precious gems
- 🌸 **Flowers** - Delicate cherry blossoms

## Technical Details

- Built with vanilla HTML, CSS, and JavaScript
- Physics powered by [Matter.js](https://brm.io/matter-js/)
- Sound effects using Web Audio API
- Data stored in localStorage (with optional Supabase sync)

## Optional Cloud Sync

Sign in to sync your habit jar across devices. Sync uses [Supabase](https://supabase.com).

### Setup (for app maintainers)

1. Create a free project at [supabase.com](https://supabase.com)
2. In the SQL Editor, run:

```sql
CREATE TABLE app_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own state"
  ON app_state FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

3. Copy your project URL and anon key from **Settings → API**
4. In `sync-config.js`, set:
   - `SUPABASE_URL` = your project URL
   - `SUPABASE_ANON_KEY` = your anon (public) key

Users can then open Settings → **Sync Across Devices** to sign up or sign in.

## Tips

- On mobile devices, you can physically shake your phone to shake the jar!
- Each collectible type has its own unique collision sound
- Your total marble count persists even after clearing habits

Enjoy watching your progress grow, one cute marble at a time! 🎉
