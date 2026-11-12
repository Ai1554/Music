# VYBE: 3D Music Streaming Interface

**ACM MAJU Vibe Coding Competition, 12 Nov 2026. Brief #3: Music Streaming Interface**

**Team:** _Name (ID)_ · **Live:** _https://your-site.vercel.app_ · **Repo:** _https://github.com/you/vybe_

Headline: **"Don't just hear it. Feel it."** The layout is inspired by music streaming apps (sidebar, mood chips, Quick picks, scrolling shelves). The style is our own: a 3D turntable scene: a spinning vinyl record, a tonearm and glossy 3D music notes that react to the music.

## Audience and task
- **Audience:** students who listen to music while studying, relaxing or training.
- **Primary task:** pick a mood and start the right mix in one tap.
- **Primary action:** the Focus / Chill / Hype / Late night buttons on the landing view.

## Features
1. **10 moods and eras** plus **8 world regions** (112 songs in total), each with its own colours, emoji and sound:
   - 🥰 Lovesick
   - 💔 Sad Girl Hours
   - 🪩 Party Mode
   - ✨ Main Character
   - 😈 Villain Era
   - 📚 Locked In
   - 😌 Soft Life
   - 💪 Gym Rat
   - 🌙 3AM Thoughts
   - 📼 Throwback
2. **80 songs, 20 albums and 8 artists**, all fictional.
3. **Vibe check**: one-tap emoji mood buttons in the hero.
4. **Moods & eras** tile grid, a **Trending top 10**, **Quick picks**, and **one shelf per category** with albums and songs.
5. **Search** plus sticky **mood chips**, which filter everything on the page.
6. **3D turntable scene** (Three.js).
   - A glossy vinyl record with real grooves and a VYBE label in the mood's colours. It spins up when music plays and slows down when paused, and the tonearm swings onto the record.
   - A big 3D ♫ note floats and bounces to the beat, smaller notes orbit the record, and a radial equalizer pulses behind it.
   - Everything follows the mouse in 3D.
7. **Player bar**: play/pause, next/previous, seek, volume and a progress line. The Space bar plays and pauses.
8. **Liked songs** playlist, saved in this browser with localStorage.
9. **Album of the week** banner. Its 3D record slides out of the sleeve when you hover over it.
10. **Full-screen Now Playing view**: click the song in the player bar to open it.
    - A spinning 3D disc, with the previous and next covers fanned behind it.
    - **Up next / Lyrics / About** tabs.
    - The lyrics highlight line by line as the song plays. All the lyrics are original.
11. A **greeting that changes with the time of day**, and artist cards with a coloured glow.

Music is generated live with the Web Audio API. Every category sounds different:
- Sad songs are slow and soft.
- Party and gym songs are fast, with a kick drum.

## Motion
VYBE has Shopify-style motion: headlines rise letter by letter, sections cascade in as you scroll, photos move with parallax, buttons are magnetic, likes burst with hearts, and pages cross-fade. The top bar, player and 3D scene stay fixed while pages change.
- Everything respects **Settings → Animations → Calm** and the device's "reduce motion" setting.
- The full plan, tokens, naming conventions, React mapping and testing checklist are in **[MOTION.md](MOTION.md)**.

## Pages
VYBE is a multi-page app. Each page has its own address, and **the music keeps playing while you move between pages**. The back button works too.

| Page | Address | What's on it |
| --- | --- | --- |
| Home | `#/` | Hero and vibe check, **Made for you** (when signed in), Album of the week, Trending, Quick picks |
| Explore | `#/explore` | Mood chips, Moods & eras tiles, a shelf for each mood |
| World | `#/world` | 8 regions with a shelf for each |
| Artists | `#/artists` → `#/artist/3` | Artist grid and a page for each artist |
| Library | `#/library` | Liked songs and Your music (uploads) |
| Search | `#/search` | Song and album results from the top bar |
| Sign up | `#/signup` | Create a demo profile, with a live preview |
| Sign in | `#/signin` | "Who's listening?" profile picker |
| Profile | `#/profile` | Stats, liked songs, edit, switch, sign out, delete |

On phones, a bottom tab bar replaces the sidebar.

### Sign up / sign in: a demo profile, on purpose
The competition rules say *no login, no authentication and no real user data*. So VYBE uses **local demo profiles**:
- You choose a **nickname** (emails are rejected), an avatar, your main vibe and your home sound. There is **no email and no password**.
- Profiles are stored only in this browser (localStorage). Nothing is sent anywhere.
- Each profile has **its own liked songs** and a personalised **"Made for you"** mix, and the greeting uses your nickname.
- You can edit, switch, sign out or delete a profile at any time.

## Around the world 🌍
There are 8 regional styles with 32 more songs. All of them are generated in the browser and performed by **fictional** local artists, with original titles, lyrics and cover art:

| Region | Sound | Built with |
| --- | --- | --- |
| 🇵🇰 Pakistan | Sufi / qawwali | Raag Bhairav scale, harmonium, tanpura drone, dholak and group hand claps |
| 🇮🇳 India | Bollywood / bhangra | Raag Khamaj, sitar slides (meend) and the dhol "chaal" rhythm |
| 🇧🇩 Bangladesh | Baul folk | Pentatonic melody, plucked ektara-style string, khol drum and a river-side drone |
| 🇪🇺 Europe | Euro dance | Supersaw lead and a four-on-the-floor beat |
| 🏜️ Middle East | Arabic pop | Maqam Hijaz, oud-style pluck and the maqsum rhythm |
| 🌍 Africa | Afrobeats / amapiano | Marimba, log-drum bass, shaker and a 3-3-2 rim pattern |
| 💃 Latin America | Reggaeton / samba | Dembow rhythm and a plucked guitar |
| 🌸 East Asia | K-pop / city pop | The "royal road" chord progression (IV–V–iii–vi) |

**Why there are no real hit songs:** commercial songs (Coke Studio, Bollywood, K-pop…) are copyrighted, and the competition requires assets we're allowed to use. Listeners can add real songs they own through **Your music** (upload).

## Improvements after review
| Weakness | What we changed |
| --- | --- |
| **Music sounded like a chiptune** | New engine in `audio.js`: a real step-sequencer "band".<br>• Kick, snare, hi-hats and trap rolls<br>• Bass, including 808 glides for Villain Era<br>• Warm detuned chord pads with real progressions (I–V–vi–IV and others)<br>• A melody hook with vibrato<br>• Swing, reverb, sidechain "pumping", vinyl crackle on lo-fi moods, and an intro → full → breakdown song structure<br>• You can also **upload your own songs** (MP3, WAV, OGG, M4A) and play them at full quality. |
| **Battery and GPU drain** | **Settings → 3D quality**: Auto / High / Battery saver / Off.<br>• Battery saver: 30 fps cap, lower resolution, 35% of the particles, fewer floating notes.<br>• Auto drops to Battery saver when the frame rate falls or the battery is ≤20% and not charging.<br>• Rendering pauses when the tab is hidden or the full-screen player is open, and slows to 30 fps after you scroll past the hero.<br>• A live FPS readout shows what's happening. |
| **Likes lost when the cache is cleared** | • **Export** liked songs to a JSON file and **Import** them back.<br>• **Copy share link**: the playlist travels in the URL, so it opens on any device without an account.<br>• A warning appears when the browser blocks storage (private mode).<br>• Uploaded songs are kept in IndexedDB. |
| **Limited control** | • **5-band equalizer** with presets (Flat, Bass boost, Vocal, Lo-fi, Party, Night)<br>• **Shuffle**, **Repeat** (all / one / off) and a **Sleep timer** (15/30/60 min)<br>• A vinyl crackle toggle<br>• Your own music library |

**Not included on purpose:** connecting to Spotify or Apple Music needs logins, a backend server and their developer keys. The competition rules don't allow any of those.

## Tech
- Plain HTML, CSS and JavaScript. There is no build step.
- Three.js 0.160 is loaded from the jsDelivr CDN through an import map.
- Files:
  - `index.html`: page structure.
  - `style.css`: design system and layout.
  - `audio.js`: music engine (drums, bass, chords, melody, effects, EQ, file playback).
  - `script.js`: data, player, settings, uploads and backups.
  - `motion.js` + `motion.css`: motion system (reveals, split text, parallax, magnetic buttons, page transitions, Calm mode). See **MOTION.md**.
  - `scene.js`: 3D turntable scene (vinyl record, tonearm, extruded 3D notes, equalizer, lights).

## Performance and graceful degradation
- If WebGL is missing, or the "reduce motion" setting is on, the 3D canvas is skipped and a CSS gradient background is shown instead.
- Phones get fewer particles, fewer floating notes and a lower pixel ratio.
- Rendering pauses when the tab is hidden.
- Images lazy-load. If a photo fails to load, a gradient shows in its place.

## Accessibility checks
- [x] Tested at 390px phone width with no sideways scrolling.
- [x] Skip link, visible focus outline, keyboard-friendly controls, and Space for play/pause.
- [x] `aria-label` on icon buttons, `aria-pressed` on chips, a labelled search box, and alt text on album photos.
- [x] A live region announces the song that is playing.
- [x] The 3D canvas is hidden from screen readers (`aria-hidden`).

## Sample data
All artists, albums and songs are **fictional** (in `script.js`).

## AI tools used
| Tool | Helped with |
| --- | --- |
| Claude | Layout, CSS, player script, Three.js scene and shader, README draft |

**What we checked or changed:** _(write YOUR real edits here; judges score this)_

## Limitation and next step
- **Limitation:** the songs are generated tones, not real recordings.
- **Next step:** user-made playlists, and a record that reacts to individual frequency bands.

## Credits
- Photos: [Unsplash](https://unsplash.com) (Unsplash License), loaded from images.unsplash.com.
- 3D: [Three.js](https://threejs.org) (MIT).
- Fonts: Unbounded and Space Grotesk via Google Fonts (Open Font License).

## Run and deploy
- Open `index.html` through a local server, for example the VS Code "Live Server" extension. Modules don't load from `file://`.
- To deploy, push to GitHub, then import the repo in Vercel. You don't need to change any settings.
