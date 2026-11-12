/* =========================================================
   VYBE: plain JavaScript player (no frameworks).
   All artists, albums and songs are FICTIONAL sample data.
   Songs are generated live by the music engine in audio.js.
   You can also add your own audio files (kept in this browser).
   The 3D scene (scene.js) reads window.VYBE to react to the music.
   ========================================================= */

// your own uploads have no photo, so they get a generated gradient cover
const UPLOAD_COVER = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset=".5" stop-color="#8b5cf6"/><stop offset="1" stop-color="#ff2e93"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><text x="50" y="66" font-size="44" text-anchor="middle" fill="white">♫</text></svg>')
const IMG = (id, size = 300) => (!id ? UPLOAD_COVER
  : id.startsWith('data:') ? id
  : `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${size}&h=${size}&q=70`)

// Generated cover art for the world music regions (no photo licensing needed)
const cover = (big, small, c1, c2, c3) => 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset=".55" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></linearGradient>
  <pattern id="p" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="2" fill="#fff" opacity=".22"/></pattern></defs>
  <rect width="200" height="200" fill="url(#g)"/><rect width="200" height="200" fill="url(#p)"/>
  <circle cx="100" cy="106" r="60" fill="#000" opacity=".2"/><circle cx="100" cy="106" r="60" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
  <text x="100" y="130" font-size="70" text-anchor="middle">${big}</text><text x="18" y="42" font-size="28">${small}</text></svg>`)

// ---------- 1. Categories (moods & eras) ----------
// colors = 3 colours for the 3D orb; sound = how the music feels
const SCALES = {
  major: [0, 4, 7, 11, 12, 16], minor: [0, 3, 7, 10, 12, 15], soft: [0, 5, 7, 12, 14, 19],
  love: [0, 4, 7, 11, 14, 16], dark: [0, 1, 5, 7, 8, 12], dream: [0, 2, 7, 9, 12, 14],
}

const categories = [
  { id: 'romantic', emoji: '🥰', name: 'Lovesick', tag: 'for when they text back in 2 mins', colors: ['#ff4d8d', '#ff9ec4', '#ffb86b'],
    sound: { scale: 'love', bpm: 76, wave: 'triangle', root: 147 } },
  { id: 'sad', emoji: '💔', name: 'Sad Girl Hours', tag: 'crying in the club but make it aesthetic', colors: ['#3b82f6', '#818cf8', '#c4b5fd'],
    sound: { scale: 'minor', bpm: 62, wave: 'sine', root: 110 } },
  { id: 'party', emoji: '🪩', name: 'Party Mode', tag: 'no thoughts, just bass', colors: ['#f472b6', '#facc15', '#22d3ee'],
    sound: { scale: 'major', bpm: 126, wave: 'square', root: 123 } },
  { id: 'main', emoji: '✨', name: 'Main Character', tag: 'walk like you\'re in a movie trailer', colors: ['#facc15', '#c6ff3d', '#ff2e93'],
    sound: { scale: 'dream', bpm: 100, wave: 'triangle', root: 131 } },
  { id: 'villain', emoji: '😈', name: 'Villain Era', tag: 'unbothered. moisturized. in my lane.', colors: ['#ef4444', '#7f1d1d', '#a855f7'],
    sound: { scale: 'dark', bpm: 96, wave: 'sawtooth', root: 82 } },
  { id: 'study', emoji: '📚', name: 'Locked In', tag: 'study grind, no cap', colors: ['#22d3ee', '#3b82f6', '#c6ff3d'],
    sound: { scale: 'soft', bpm: 72, wave: 'sine', root: 123 } },
  { id: 'chill', emoji: '😌', name: 'Soft Life', tag: 'touch grass, sip chai, breathe', colors: ['#8b5cf6', '#ec4899', '#60a5fa'],
    sound: { scale: 'major', bpm: 84, wave: 'triangle', root: 139 } },
  { id: 'gym', emoji: '💪', name: 'Gym Rat', tag: 'one more set, bestie', colors: ['#ff8a1f', '#ff2e93', '#facc15'],
    sound: { scale: 'minor', bpm: 134, wave: 'sawtooth', root: 104 } },
  { id: 'night', emoji: '🌙', name: '3AM Thoughts', tag: 'overthinking, but make it lo-fi', colors: ['#ff8a1f', '#be185d', '#7c3aed'],
    sound: { scale: 'minor', bpm: 86, wave: 'triangle', root: 92 } },
  { id: 'throwback', emoji: '📼', name: 'Throwback', tag: 'y2k kid, core memories unlocked', colors: ['#22d3ee', '#f472b6', '#c6ff3d'],
    sound: { scale: 'major', bpm: 112, wave: 'square', root: 117 } },

  // ----- Around the world: regional STYLES (all songs and artists are fictional) -----
  { id: 'pk', world: true, emoji: '🇵🇰', name: 'Pakistan', tag: 'sufi soul, qawwali claps & Lahore nights', colors: ['#16a34a', '#86efac', '#facc15'],
    sound: { scale: 'major', root: 110 } },
  { id: 'in', world: true, emoji: '🇮🇳', name: 'India', tag: 'bollywood drama & bhangra dhol', colors: ['#f97316', '#fde68a', '#16a34a'],
    sound: { scale: 'major', root: 117 } },
  { id: 'bd', world: true, emoji: '🇧🇩', name: 'Bangladesh', tag: 'baul folk, river songs & Boishakh colours', colors: ['#16a34a', '#ef4444', '#86efac'],
    sound: { scale: 'major', root: 131 } },
  { id: 'eu', world: true, emoji: '🇪🇺', name: 'Europe', tag: 'euro dance, café nights & Ibiza sunsets', colors: ['#3b82f6', '#facc15', '#a78bfa'],
    sound: { scale: 'major', root: 110 } },
  { id: 'me', world: true, emoji: '🏜️', name: 'Middle East', tag: 'oud strings, desert drums & souk lights', colors: ['#f59e0b', '#b45309', '#14b8a6'],
    sound: { scale: 'major', root: 98 } },
  { id: 'af', world: true, emoji: '🌍', name: 'Africa', tag: 'afrobeats, amapiano & sunshine bass', colors: ['#22c55e', '#facc15', '#ef4444'],
    sound: { scale: 'major', root: 104 } },
  { id: 'la', world: true, emoji: '💃', name: 'Latin America', tag: 'reggaeton heat & samba streets', colors: ['#ef4444', '#f59e0b', '#22d3ee'],
    sound: { scale: 'major', root: 110 } },
  { id: 'as', world: true, emoji: '🌸', name: 'East Asia', tag: 'k-pop sparkle & tokyo city-pop', colors: ['#f472b6', '#a78bfa', '#67e8f9'],
    sound: { scale: 'major', root: 123 } },
]
const moodCats = categories.filter((c) => !c.world)
const worldCats = categories.filter((c) => c.world)
const catById = Object.fromEntries(categories.map((c) => [c.id, c]))

// ---------- 2. Artists ----------
const artists = [
  { name: 'Velvet Hours', genre: 'Bedroom pop · R&B', img: '1583244532610-2a234e7c3eca' },
  { name: 'lowkey.luna', genre: 'Indie · Sad pop', img: '1758273706327-8c06d0700cf4' },
  { name: 'KAIRO-9', genre: 'Synthwave · Phonk', img: '1493225457124-a3eb161ffa5f' },
  { name: 'Noor & the Neons', genre: 'Dance pop · Hyperpop', img: '1593958812614-2db6a598c71c' },
  { name: 'dxpressed', genre: 'Emo rap · Alt', img: '1487724448953-a9d9963d71ae' },
  { name: 'Solenne Vire', genre: 'Ambient · Piano', img: '1447876576829-25dd6c4b3d21' },
  { name: 'Maren Ashfall', genre: 'Lo-fi · Chillhop', img: '1625786682948-2168238883d2' },
  { name: 'Orbit House', genre: 'House · Club', img: '1500627208551-d61d25c348e4' },
  { name: 'Noor-e-Sahar', genre: '🇵🇰 Sufi pop · Qawwali', img: cover('🎤', '🇵🇰', '#16a34a', '#14532d', '#facc15') },
  { name: 'Raag Riders', genre: '🇮🇳 Bollywood · Bhangra', img: cover('🥁', '🇮🇳', '#f97316', '#9a3412', '#16a34a') },
  { name: 'Padma Baul Collective', genre: '🇧🇩 Baul folk', img: cover('🪕', '🇧🇩', '#16a34a', '#991b1b', '#86efac') },
  { name: 'Lumière Club', genre: '🇪🇺 Euro dance', img: cover('🎧', '🇪🇺', '#1d4ed8', '#312e81', '#facc15') },
  { name: 'Layali Ensemble', genre: '🏜️ Arabic pop · Oud', img: cover('🌙', '🏜️', '#f59e0b', '#78350f', '#14b8a6') },
  { name: 'Sunrise Collective', genre: '🌍 Afrobeats · Amapiano', img: cover('🪘', '🌍', '#22c55e', '#713f12', '#ef4444') },
  { name: 'Calle Fuego', genre: '💃 Reggaeton · Samba', img: cover('🎺', '💃', '#ef4444', '#7c2d12', '#22d3ee') },
  { name: 'STARLIT', genre: '🌸 K-pop · City pop', img: cover('✨', '🌸', '#f472b6', '#4c1d95', '#67e8f9') },
]

// ---------- 3. Albums (2 per category, 4 songs each) ----------
// [id, title, artist, category, year, image, sticker, [song titles]]
const albumRows = [
  ['golden-us', 'Golden Hour Us', 'Velvet Hours', 'romantic', 2026, '1615966650071-855b15f29ad1', 'on repeat',
    ['Butterflies (Again)', 'You Had Me at "lol"', 'Sunset Playlist', 'Soft Launch']],
  ['candlelight', 'Candlelight FaceTime', 'lowkey.luna', 'romantic', 2025, '1513279922550-250c2129b13a', 'new',
    ['2AM FaceTime', 'Matching Hoodies', 'Delulu for You', 'Hard Launch']],
  ['rain-repeat', 'Rain on Repeat', 'lowkey.luna', 'sad', 2026, '1509635022432-0220ac12960b', 'no skips',
    ['Left on Read', 'Window Seat Tears', 'Text You Never Sent', 'It Is What It Is']],
  ['umbrella', 'Umbrella for One', 'dxpressed', 'sad', 2025, '1519692933481-e162a57d6721', null,
    ['Grey Sweatshirt', 'Seen 11:42pm', 'Healing Era (Not Yet)', 'Last Bus Home']],
  ['mirrorball', 'Mirrorball Season', 'Noor & the Neons', 'party', 2026, '1713450605268-5f8ba67f5b55', 'trending',
    ['Glitter Emergency', 'Aux Cord Hero', 'Dance Like Nobody\'s Filming', 'Bestie Anthem']],
  ['afterparty', 'Afterparty.exe', 'Orbit House', 'party', 2025, '1578736641330-3155e606cd40', null,
    ['Green Light Riot', 'Bass Face', 'Group Chat on Fire', 'Lights Up, Don\'t Leave']],
  ['trailer', 'Trailer Moment', 'Noor & the Neons', 'main', 2026, '1718382341267-aef8a9e4ecef', 'it\'s giving',
    ['Slow-Mo Walk', 'Wind in My Hair', 'Plot Twist (It\'s Me)', 'Opening Credits']],
  ['romanticize', 'Romanticize Your Life', 'Velvet Hours', 'main', 2025, '1758874385203-08daf7283076', null,
    ['Iced Coffee Era', 'Pinterest Board', 'Glow Up Montage', 'That Girl Morning']],
  ['red-flag', 'Red Flag Anthem', 'KAIRO-9', 'villain', 2026, '1555086156-e6c7353d283f', 'slay',
    ['Unbothered', 'Block Button', 'Main Villain Energy', 'Not Sorry']],
  ['no-apologies', 'No Apologies', 'dxpressed', 'villain', 2025, '1446057032654-9d8885db76c6', null,
    ['Burn the Group Chat', 'Gatekeep', 'Ice Cold Reply', 'Plot Armor']],
  ['afterglow', 'Afterglow', 'Solenne Vire', 'study', 2026, '1505740420928-5e560c06d30e', 'focus',
    ['Low Orbit Study', 'Quiet Hours', 'Deep Work', 'Pomodoro Rain']],
  ['margins', 'Notes in the Margins', 'Maren Ashfall', 'study', 2026, '1766338055584-5ffe426a7e57', null,
    ['Highlighter', 'Open Book', 'Page 214', 'Last-Minute Genius']],
  ['vinyl', 'Sunday Vinyl', 'Maren Ashfall', 'chill', 2025, '1694355450046-ef2187e6e982', 'cozy',
    ['Chai at 4am', 'Window Seat', 'Soft Static', 'Blanket Burrito']],
  ['crate', 'Crate Digging', 'Orbit House', 'chill', 2025, '1456590270581-fb7600bb90cc', null,
    ['Golden Hour Loop', 'Coastline Radio', 'Dust & Needles', 'Do Not Disturb']],
  ['redline', 'Redline Runner', 'KAIRO-9', 'gym', 2026, '1496596634762-c92dca7d13a4', 'beast mode',
    ['Ignition', 'PR Day', 'Final Lap', 'Leg Day Lament']],
  ['main-stage', 'Main Stage', 'Noor & the Neons', 'gym', 2025, '1516450360452-9312f5e86fc7', null,
    ['Hands Up', 'Pre-Workout Panic', 'Sweat Equity', 'Cardio Cutscene']],
  ['neon', 'Neon Hours', 'KAIRO-9', 'night', 2024, '1508700115892-45ecd05ae2ad', 'lo-fi',
    ['Red Glow', 'Midnight Uplink', 'Overthinking.mp3', 'Ceiling Stars']],
  ['spotlight', 'Last Spotlight', 'Solenne Vire', 'night', 2025, '1492377908089-78a79356028f', null,
    ['Empty Stage', 'Encore', 'House Lights', 'Can\'t Sleep Club']],
  ['boombox', 'Boombox Summer', 'Orbit House', 'throwback', 2024, '1487180144351-b8472da7d491', 'y2k',
    ['Flip Phone Love', 'MSN Status', 'Burned CD', 'Ringtone Remix']],
  ['mixtape', 'Mixtape 2007', 'Velvet Hours', 'throwback', 2024, '1466428996289-fb355538da1b', null,
    ['Rewind', 'Side B', 'Dial-Up Dreams', 'Tamagotchi Heart']],

  // Around the world (fictional artists, original titles, generated covers)
  ['chand-raat', 'Chand Raat Sessions', 'Noor-e-Sahar', 'pk', 2026, cover('🌙', '🇵🇰', '#16a34a', '#052e16', '#facc15'), 'sufi',
    ['Chand Raat', 'Lahore Ki Shaam', 'Mehfil-e-Noor', 'Dil Ki Dhadkan']],
  ['monsoon', 'Monsoon Masala', 'Raag Riders', 'in', 2026, cover('🥁', '🇮🇳', '#f97316', '#7c2d12', '#16a34a'), 'dhol',
    ['Baarish Mein', 'Dhol Bajao', 'Mumbai Local', 'Filmi Dil']],
  ['padma', 'Padma River Tapes', 'Padma Baul Collective', 'bd', 2025, cover('🛶', '🇧🇩', '#16a34a', '#14532d', '#ef4444'), 'folk',
    ['Padma Nodi', 'Ektara Gaan', 'Boishakhi Morning', 'Dhaka Rickshaw Ride']],
  ['night-train', 'Night Train to Berlin', 'Lumière Club', 'eu', 2026, cover('🚆', '🇪🇺', '#1d4ed8', '#1e1b4b', '#facc15'), 'euro',
    ['Paris After Midnight', 'Berlin Basement', 'Sevilla Sun', 'Amsterdam on Bikes']],
  ['souk', 'Souk Lights', 'Layali Ensemble', 'me', 2025, cover('🏮', '🏜️', '#f59e0b', '#451a03', '#14b8a6'), 'oud',
    ['Oud at Dusk', 'Hijaz Nights', 'Souk Lights', 'Caravan Heart']],
  ['lagos', 'Lagos to Joburg', 'Sunrise Collective', 'af', 2026, cover('🪘', '🌍', '#22c55e', '#422006', '#ef4444'), 'amapiano',
    ['Lagos Sunrise', 'Amapiano Sunday', 'Jollof Jam', 'Kalimba Kids']],
  ['calle', 'Calle Caliente', 'Calle Fuego', 'la', 2025, cover('🎺', '💃', '#ef4444', '#450a0a', '#f59e0b'), 'fuego',
    ['Fuego Lento', 'Samba de Luz', 'Mango Dance', 'Noche Larga']],
  ['neon-seoul', 'Neon Seoul', 'STARLIT', 'as', 2026, cover('✨', '🌸', '#f472b6', '#2e1065', '#67e8f9'), 'k-pop',
    ['Idol Era', 'Tokyo Train', 'Hanami', 'Seoul Neon']],
]

const albums = albumRows.map(([id, title, artist, mood, year, img, sticker, titles]) => ({ id, title, artist, mood, year, img, sticker, titles }))

// Build the songs. Each one gets its own small twist on the category's sound.
const songs = albums.flatMap((a, ai) => {
  const base = catById[a.mood].sound
  return a.titles.map((title, i) => ({
    id: `${a.id}-${i}`, albumId: a.id, album: a.title, title, artist: a.artist, mood: a.mood, img: a.img,
    duration: 150 + ((ai * 37 + i * 23) % 90),
    plays: 120 + ((ai * 53 + i * 71) % 880), // fake play count in thousands
    sound: {
      scale: SCALES[base.scale],
      wave: base.wave,
      bpm: base.bpm + ((i % 3) - 1) * 4,
      root: base.root * 2 ** ((((ai + i) % 5) - 2) / 12),
    },
  }))
})

const trending = [...songs].sort((a, b) => b.plays - a.plays).slice(0, 10)
// Mix songs from every album so Quick picks feels varied
const quickOrder = [0, 1, 2, 3].flatMap((n) => albums.map((a) => songs.find((s) => s.id === `${a.id}-${n}`)))

// ---------- 4. Music engine (see audio.js) ----------
const engine = window.MusicEngine

// "Your uploads" acts like an extra category
catById.mine = { id: 'mine', emoji: '🎧', name: 'Your music', tag: 'your files, your rules', colors: ['#22d3ee', '#8b5cf6', '#ff2e93'] }
let uploads = [] // filled from IndexedDB at start-up
const findSong = (id) => songs.find((s) => s.id === id) || uploads.find((s) => s.id === id)

// Sound + visual settings (remembered in this browser)
const EQ_PRESETS = {
  Flat: [0, 0, 0, 0, 0],
  'Bass boost': [7, 4, 0, 0, 1],
  Vocal: [-2, -1, 3, 4, 1],
  'Lo-fi': [3, 1, -1, -4, -8],
  Party: [5, 2, -1, 2, 4],
  Night: [2, 1, 0, -2, -4],
}
const settings = (() => {
  const base = { eq: [0, 0, 0, 0, 0], preset: 'Flat', crackle: true, quality: 'auto' }
  try { return { ...base, ...JSON.parse(localStorage.getItem('vybe-settings')) } } catch { return base }
})()
const saveSettings = () => { try { localStorage.setItem('vybe-settings', JSON.stringify(settings)) } catch { /* ignore */ } }
window.VYBE_SETTINGS = settings

// Shared with scene.js
window.VYBE = { level: () => engine.level(), mood: 'all', colors: null, playing: false }

// ---------- 5. Player state ----------
// Demo profiles (no email, no password, stored only on this device)
const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true } catch { return false } },
}
let profiles = store.get('vybe-profiles', [])
let me = profiles.find((p) => p.id === store.get('vybe-current', null)) || null
const likesKey = () => (me ? `vybe-likes-${me.id}` : 'vybe-likes')

const state = { queue: [], index: -1, playing: false, position: 0, queueMood: null, filter: 'all', query: '', shuffle: false, repeat: 'all', likes: loadLikes() }
const $ = (sel) => document.querySelector(sel)
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

// Liked songs: saved in localStorage when possible, with export/import/share-link backups (section 13)
let storageOK = true
function loadLikes() {
  try {
    localStorage.setItem('vybe-test', '1')
    localStorage.removeItem('vybe-test')
    return JSON.parse(localStorage.getItem(likesKey())) || []
  } catch { storageOK = false; return [] }
}
function saveLikes() {
  try { localStorage.setItem(likesKey(), JSON.stringify(state.likes)) } catch { storageOK = false }
}
const announce = (text) => { $('#announce').textContent = text }
const current = () => state.queue[state.index]

function playQueue(list, index = 0, mood = null) {
  if (!list.length) return
  state.queue = list
  state.index = index
  state.queueMood = mood
  startSong()
}
const playMood = (id) => {
  if (state.queueMood === id && current()) return togglePlay()
  playQueue(songs.filter((s) => s.mood === id), 0, id)
}

function startSong() {
  const song = current()
  state.position = 0
  state.playing = true
  if (song.src) {
    engine.playFile(song.src).catch(() => announce('This file could not be played in this browser'))
  } else {
    engine.playSong(song)
  }
  engine.volume($('#volume').value / 100)
  engine.setEQ(settings.eq)
  announce(`Now playing ${song.title} by ${song.artist}`)
  render()
}

function togglePlay() {
  if (!current()) return
  state.playing = !state.playing
  state.playing ? engine.resume() : engine.pause()
  announce(state.playing ? 'Playing' : 'Paused')
  render()
}

function next(auto = false) {
  if (!current()) return
  if (auto && state.repeat === 'one') return startSong()
  const last = state.index === state.queue.length - 1
  if (state.shuffle && state.queue.length > 1) {
    let i
    do { i = Math.floor(Math.random() * state.queue.length) } while (i === state.index)
    state.index = i
  } else if (auto && last && state.repeat === 'off') {
    state.playing = false
    engine.pause()
    announce('End of queue')
    return render()
  } else {
    state.index = (state.index + 1) % state.queue.length
  }
  startSong()
}
engine.onEnded = () => next(true)
function prev() {
  if (!current()) return
  if (state.position > 3) { state.position = 0; engine.seek(0); renderTime(); return }
  state.index = (state.index - 1 + state.queue.length) % state.queue.length
  startSong()
}

function toggleLike(id) {
  const liked = state.likes.includes(id)
  state.likes = liked ? state.likes.filter((x) => x !== id) : [...state.likes, id]
  saveLikes()
  const song = findSong(id)
  announce(`${liked ? 'Removed' : 'Added'} ${song.title} ${liked ? 'from' : 'to'} Liked songs`)
  render()
}

setInterval(() => {
  if (!state.playing || !current()) return
  const fileTime = engine.fileTime()
  if (fileTime !== null) { state.position = fileTime; return renderTime() } // real files end by themselves
  state.position += 1
  if (state.position >= current().duration) next(true)
  else renderTime()
}, 1000)

// ---------- 6. Building pieces of the page ----------
const matches = (item) =>
  state.filter === 'all' || item.mood === state.filter || catById[item.mood].world
const searchMatch = (item, q) =>
  `${item.title} ${item.artist} ${item.album || ''} ${catById[item.mood].name} ${catById[item.mood].tag || ''}`.toLowerCase().includes(q)

function songRow(song, i, list, rank = false) {
  const li = document.createElement('li')
  const isCurrent = current() && current().id === song.id
  const on = isCurrent && state.playing
  const liked = state.likes.includes(song.id)
  const cat = catById[song.mood]
  li.className = `song${isCurrent ? ' current' : ''}`
  li.style.setProperty('--i', i)
  li.style.setProperty('--c', cat.colors[0])
  li.innerHTML = `
    ${rank ? `<span class="rank">${i + 1}</span>` : ''}
    <button class="song-play" type="button" aria-label="${on ? 'Pause' : 'Play'} ${esc(song.title)} by ${esc(song.artist)}">
      <span class="song-art">
        <img src="${IMG(song.img, 120)}" alt="" loading="lazy" onerror="this.style.opacity=0">
        <span class="song-icon" aria-hidden="true">${on ? '<i></i><i></i><i></i>' : '▶&#xFE0E;'}</span>
      </span>
      <span class="song-text"><strong>${esc(song.title)}</strong><span>${esc(song.artist)} · ${cat.emoji} ${esc(cat.name)}</span></span>
      <span class="song-time">${rank ? `${song.plays}K plays` : fmt(song.duration)}</span>
    </button>
    <button class="like" type="button" aria-pressed="${liked}" aria-label="Like ${esc(song.title)}">${liked ? '♥' : '♡'}</button>`
  li.querySelector('.song-play').onclick = () => (isCurrent ? togglePlay() : playQueue(list, i))
  li.querySelector('.like').onclick = () => toggleLike(song.id)
  return li
}

function albumCard(album) {
  const li = document.createElement('li')
  const on = state.playing && current() && current().albumId === album.id
  li.className = `album${on ? ' playing' : ''}`
  li.innerHTML = `
    <div class="album-art">
      <img src="${IMG(album.img, 400)}" alt="Cover photo for ${esc(album.title)}" loading="lazy" onerror="this.style.opacity=0">
      <span class="album-shine" aria-hidden="true"></span>
      ${album.sticker ? `<span class="sticker">${esc(album.sticker)}</span>` : ''}
      <button class="album-play" type="button" aria-label="${on ? 'Pause' : 'Play'} ${esc(album.title)}">${on ? '❚❚' : '▶&#xFE0E;'}</button>
    </div>
    <h3>${esc(album.title)}</h3>
    <p>${esc(album.artist)} · ${album.titles.length} songs</p>`
  li.querySelector('.album-play').onclick = () => {
    if (current() && current().albumId === album.id) return togglePlay()
    playQueue(songs.filter((s) => s.albumId === album.id))
  }
  addTilt(li.querySelector('.album-art'))
  return li
}

function artistCard(artist) {
  const li = document.createElement('li')
  const count = songs.filter((s) => s.artist === artist.name).length
  const firstAlbum = albums.find((a) => a.artist === artist.name)
  li.style.setProperty('--g', catById[firstAlbum.mood].colors[0])
  li.innerHTML = `
    <a class="artist" href="#/artist/${artists.indexOf(artist)}" aria-label="${esc(artist.name)}, ${count} songs. Open artist page">
      <span class="artist-pic"><img src="${IMG(artist.img, 300)}" alt="" loading="lazy" onerror="this.style.opacity=0"></span>
      <strong>${esc(artist.name)}</strong>
      <span>${esc(artist.genre)}</span>
      <span class="artist-count">${count} songs</span>
    </a>`
  return li
}

// 3D tilt that follows the mouse
function addTilt(el) {
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect()
    el.style.setProperty('--rx', `${((e.clientY - r.top) / r.height - 0.5) * -16}deg`)
    el.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 16}deg`)
    el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
  })
  el.addEventListener('pointerleave', () => {
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  })
}

// Static pieces built once: vibe buttons, chips, tiles, sidebar mixes, artists
function buildStatic() {
  $('#stat-line').textContent = `${songs.length} songs · ${moodCats.length} vibes · ${worldCats.length} world regions`

  $('#vibes').innerHTML = moodCats.map((c) => `
    <button class="vibe" data-mood="${c.id}" type="button" style="--c:${c.colors[0]}" aria-pressed="false" aria-label="Play ${esc(c.name)} mix">
      <span class="vibe-emoji" aria-hidden="true">${c.emoji}</span><span>${esc(c.name)}</span>
    </button>`).join('')

  $('#chips').innerHTML = `<button class="chip" data-filter="all" aria-pressed="true" type="button">All</button>` +
    moodCats.map((c) => `<button class="chip" data-filter="${c.id}" aria-pressed="false" type="button">${c.emoji} ${esc(c.name)}</button>`).join('')

  const tile = (c, i) => {
    const count = songs.filter((s) => s.mood === c.id).length
    const img = albums.find((a) => a.mood === c.id).img
    return `<li style="--c1:${c.colors[0]};--c2:${c.colors[1]};--c3:${c.colors[2]};--i:${i}">
      <button class="tile" data-mood="${c.id}" type="button" aria-label="Play ${esc(c.name)} mix, ${count} songs">
        <img src="${IMG(img, 400)}" alt="" loading="lazy" onerror="this.style.opacity=0">
        <span class="tile-emoji" aria-hidden="true">${c.emoji}</span>
        <span class="tile-text"><strong>${esc(c.name)}</strong><span>${esc(c.tag)}</span></span>
        <span class="tile-count">${count} songs</span>
        <span class="tile-play" aria-hidden="true">▶&#xFE0E;</span>
      </button></li>`
  }
  $('#tiles').innerHTML = moodCats.map(tile).join('')
  $('#world-tiles').innerHTML = worldCats.map(tile).join('')

  $('#side-mixes').innerHTML = moodCats.map((c) => `
    <button class="side-mix" data-mood="${c.id}" type="button" aria-pressed="false"><i style="--c:${c.colors[0]}"></i>${c.emoji} ${esc(c.name)}</button>`).join('')

  artists.forEach((a) => $('#artist-row').append(artistCard(a)))

  // one shelf per category
  const shelf = (c) => `
    <section class="shelf cat-shelf" id="shelf-${c.id}" data-mood="${c.id}" aria-labelledby="shelf-title-${c.id}" style="--c:${c.colors[0]};--c2:${c.colors[1]}">
      <div class="shelf-head">
        <div>
          <p class="eyebrow">${esc(c.tag)}</p>
          <h2 id="shelf-title-${c.id}"><span aria-hidden="true">${c.emoji}</span> ${esc(c.name)}</h2>
        </div>
        <button class="btn btn-cat" data-mood="${c.id}" type="button">▶&#xFE0E; Play mix</button>
      </div>
      <div class="cat-body">
        <ul class="row cat-albums"></ul>
        <ol class="cat-songs"></ol>
      </div>
    </section>`
  $('#mood-shelves').innerHTML = moodCats.map(shelf).join('')
  $('#world-shelves').innerHTML = worldCats.map(shelf).join('')

  document.querySelectorAll('.vibe, .tile, .side-mix, .btn-cat').forEach((btn) => {
    btn.onclick = () => playMood(btn.dataset.mood)
  })
  document.querySelectorAll('.chip').forEach((chip) => {
    chip.onclick = () => {
      state.filter = chip.dataset.filter
      document.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c === chip))
      render()
    }
  })
}

// ---------- 7. Drawing (runs after every change) ----------
function renderTime() {
  const song = current()
  if (!song) return
  $('#time-now').textContent = fmt(state.position)
  $('#seek').value = state.position
  $('#seek').setAttribute('aria-valuetext', `${fmt(state.position)} of ${fmt(song.duration)}`)
  $('#progress-fill').style.width = `${(state.position / song.duration) * 100}%`
  tickNP()
}

function render() {
  const song = current()
  const playing = !!(state.playing && song)
  const cat = song ? catById[song.mood] : null
  window.VYBE.playing = playing
  window.VYBE.mood = song ? song.mood : 'all'
  window.VYBE.colors = cat ? cat.colors : null
  document.body.classList.toggle('is-playing', playing)
  document.body.classList.toggle('has-song', !!song)
  document.body.style.setProperty('--accent', cat ? cat.colors[0] : '#ff2e93')

  // player bar
  $('#player').classList.toggle('on', playing)
  $('#player-idle').hidden = !!song
  $('#player-main').hidden = !song
  if (song) {
    $('#now-img').src = IMG(song.img, 120)
    $('#now-img').alt = `Cover of ${song.album}`
    $('#now-title').textContent = song.title
    $('#now-artist').textContent = `${song.artist} · ${cat.emoji} ${cat.name}`
    $('#play').textContent = state.playing ? '❚❚' : '▶︎'
    $('#play').setAttribute('aria-label', state.playing ? 'Pause' : 'Play')
    $('#seek').max = song.duration
    $('#time-total').textContent = fmt(song.duration)
    const liked = state.likes.includes(song.id)
    $('#now-like').textContent = liked ? '♥' : '♡'
    $('#now-like').setAttribute('aria-pressed', liked)
    renderTime()
  }

  // tiles: hide those that don't match the chip
  document.querySelectorAll('.tile').forEach((t) => {
    t.parentElement.hidden = !catById[t.dataset.mood].world && state.filter !== 'all' && t.dataset.mood !== state.filter
    t.classList.toggle('active', playing && state.queueMood === t.dataset.mood)
  })

  // trending (always the full top 10, filtered by chip)
  const trend = trending
  $('#trending').hidden = trend.length === 0
  $('#trending-list').replaceChildren(...trend.map((s, i) => songRow(s, i, trend, true)))

  // quick picks
  const quick = quickOrder
  const shown = quick.slice(0, 12)
  $('#quick-grid').replaceChildren(...shown.map((s, i) => songRow(s, i, shown)))
  $('#quick-empty').hidden = shown.length > 0

  // category shelves
  let visibleShelves = 0
  document.querySelectorAll('.cat-shelf').forEach((shelf) => {
    const id = shelf.dataset.mood
    const albumList = albums.filter((a) => a.mood === id && matches(a))
    const songList = songs.filter((s) => s.mood === id && matches(s)).slice(0, 4)
    shelf.hidden = albumList.length === 0 && songList.length === 0
    if (!shelf.hidden) visibleShelves++
    shelf.querySelector('.cat-albums').replaceChildren(...albumList.map(albumCard))
    shelf.querySelector('.cat-songs').replaceChildren(...songList.map((s, i) => songRow(s, i, songList)))
    shelf.classList.toggle('active', playing && song.mood === id)
  })
  $('#album-empty').hidden = visibleShelves > 0
  $('#count').textContent = state.filter === 'all' ? 'Showing all moods' : `Showing ${catById[state.filter].name}`

  // liked
  const likedSongs = state.likes.map(findSong).filter(Boolean)
  $('#liked-list').replaceChildren(...likedSongs.map((s, i) => songRow(s, i, likedSongs)))
  $('#liked-empty').hidden = likedSongs.length > 0
  $('#play-liked').hidden = likedSongs.length === 0
  $('#liked-badge').textContent = likedSongs.length

  renderNP()
  renderUploads()
  storageStatus()
  renderPages()

  // mood buttons show which mix is playing
  document.querySelectorAll('.vibe, .side-mix').forEach((btn) => {
    const on = playing && state.queueMood === btn.dataset.mood
    btn.classList.toggle('active', on)
    btn.setAttribute('aria-pressed', on)
  })
}

// ---------- 8. Wiring ----------
$('#hero-play').onclick = () => playQueue([...songs].sort(() => Math.random() - 0.5))
$('#play-liked').onclick = () => playQueue(state.likes.map(findSong).filter(Boolean))

$('#search').addEventListener('input', (e) => {
  state.query = e.target.value.trim().toLowerCase()
  if (state.query && route.page !== 'search') location.hash = '#/search'
  else renderSearch()
})
$('#search').addEventListener('keydown', (e) => { if (e.key === 'Enter' && state.query) location.hash = '#/search' })

document.querySelectorAll('.arrow').forEach((btn) => {
  btn.onclick = () => {
    const row = document.getElementById(btn.dataset.scroll)
    row.scrollBy({ left: Number(btn.dataset.dir) * row.clientWidth * 0.8, behavior: 'smooth' })
  }
})

$('#play').onclick = togglePlay
$('#next').onclick = next
$('#prev').onclick = prev
$('#now-like').onclick = () => current() && toggleLike(current().id)
$('#seek').oninput = (e) => { state.position = Number(e.target.value); engine.seek(state.position); renderTime() }
$('#volume').oninput = (e) => engine.volume(e.target.value / 100)

document.addEventListener('keydown', (e) => {
  if (e.code !== 'Space' || ['INPUT', 'BUTTON', 'A', 'TEXTAREA'].includes(e.target.tagName)) return
  e.preventDefault()
  togglePlay()
})

// Top bar gets a background after scrolling
window.addEventListener('scroll', () => $('#topbar').classList.toggle('scrolled', scrollY > 30), { passive: true })


// ---------- 9. Greeting (changes with the time of day) ----------
function greet() {
  const h = new Date().getHours()
  const text = h < 5 ? 'Still up? 🌙 3AM thoughts hit different'
    : h < 12 ? 'Good morning ☀️ start it loud'
    : h < 17 ? 'Good afternoon 🎧 keep the vibe going'
    : h < 21 ? 'Good evening 🌆 what are we feeling?'
    : 'Late night mode 🌙 soft songs only'
  $('#greet').textContent = me ? text.replace(/^(Good \w+|Still up\?|Late night mode)/, (m) => `${m}, ${me.name}`) : text
}

// ---------- 10. Spotlight: Album of the week ----------
const spotlight = albums.find((a) => a.id === 'mirrorball')
function buildSpotlight() {
  $('#spot-bg').src = IMG(spotlight.img, 1200)
  $('#spot-disc-img').src = IMG(spotlight.img, 300)
  $('#spot-cover-img').src = IMG(spotlight.img, 500)
  $('#spot-cover-img').alt = `Cover of ${spotlight.title}`
  $('#spot-title').textContent = spotlight.title
  $('#spot-sub').textContent = `${spotlight.artist} · ${spotlight.titles.length} songs · ${catById[spotlight.mood].emoji} ${catById[spotlight.mood].name}`
  $('#spot-play').onclick = () => {
    if (current() && current().albumId === spotlight.id) return togglePlay()
    playQueue(songs.filter((s) => s.albumId === spotlight.id))
  }
  $('#spot-save').onclick = () => {
    const ids = songs.filter((s) => s.albumId === spotlight.id).map((s) => s.id)
    const allSaved = ids.every((id) => state.likes.includes(id))
    state.likes = allSaved ? state.likes.filter((id) => !ids.includes(id)) : [...new Set([...state.likes, ...ids])]
    saveLikes()
    announce(allSaved ? 'Removed album from Liked songs' : 'Saved the whole album to Liked songs')
    render()
  }
}

// ---------- 11. Lyrics (original, written for this prototype) ----------
const LYRICS = {
  romantic: ['Your name lights up my lock screen', 'and suddenly the room is golden', 'we talk until the sky turns pink', 'I play it cool but I am melting',
    'every song sounds like you now', 'soft launch, hard fall', 'say it back, say it slow', 'this is how the good part goes'],
  sad: ['Rain on the window, phone on the floor', 'typing a message I will never send', 'grey sweatshirt still smells like before', 'I keep replaying how it ends',
    'it is what it is, I say', 'but my heart did not get the memo', 'one more song, then I will sleep', 'one more song, then I will let go'],
  party: ['Lights go up and the bass goes low', 'tell the group chat, here we go', 'glitter in my hair, no plans tonight', 'dancing like the floor is light',
    'turn it up, turn it up', 'hands in the air if you feel the drop', 'nobody leave, nobody stop', 'this is the night we never forget'],
  main: ['Slow-mo walk down a crowded street', 'wind in my hair like a movie scene', 'plot twist, the hero is me', 'roll the credits, I am not done yet',
    'iced coffee, headphones on', 'every stranger is an extra', 'cue the music, cue the sun', 'this is my opening song'],
  villain: ['Read your message, left it there', 'block button looking pretty fair', 'unbothered, I do not care', 'moisturized and in my lane',
    'you wanted drama, here it comes', 'cold reply, no second chance', 'red flag waving like a flag should', 'not sorry, never was'],
  study: ['Tabs open, coffee warm', 'twenty-five minutes, then a break', 'highlighter dreams and quiet storms', 'locked in for my own sake',
    'page by page and line by line', 'future me will say thank you', 'no notifications, just this sound', 'deep work, deep breath, deep focus'],
  chill: ['Chai at four, the city is slow', 'blanket on, the window glows', 'nothing to fix, nowhere to go', 'soft life is the life I chose',
    'breathe in, breathe out', 'let the playlist do the talking', 'sunday feeling every day', 'touch grass, then come back home'],
  gym: ['Laces tight and the music loud', 'one more set, I am not tired', 'leg day pain, but I am proud', 'pre-workout, I am wired',
    'push it, push it, do not quit', 'sweat like the beat depends on it', 'new record on the board today', 'one more rep, then one more play'],
  night: ['It is 3AM and my brain is loud', 'ceiling stars and a sleepy town', 'replaying things I said out loud', 'lo-fi beats to calm me down',
    'neon glow through the blinds', 'thoughts in circles, lines in rhyme', 'tomorrow is a different song', 'for now I hum along'],
  throwback: ['Flip phone open, ringtone on', 'burned a CD with your favourite song', 'MSN status: be right back', 'rewind the tape and play it back',
    'dial-up dreams and summer days', 'side B is where the good stuff stays', 'core memory, unlock it now', 'press play, take a bow'],
}
Object.assign(LYRICS, {
  pk: ['Chand raat, the city is glowing', 'Lahore streets with the lights still on', 'dil keh raha, keep on going', 'qawwali claps until the dawn',
    'mehfil mein, everyone is singing', 'rooh ko sukoon, peace in the sound', 'chai in hand and the dhol is ringing', 'ye raat hamari, this night is ours'],
  in: ['Baarish aayi, the sky is singing', 'dhol bajao, let the people dance', 'Mumbai local, my heart is swinging', 'one more song, one more chance',
    'filmi dil with a filmi feeling', 'monsoon colours on every street', 'nachle yaar, the whole floor is reeling', 'chalo chalo, move your feet'],
  bd: ['Padma nodi, flowing slow', 'ektara gaan from long ago', 'Boishakh morning, red and white', 'rickshaw bells in golden light',
    'amar mon, my heart is free', 'baul songs beneath the tree', 'river wind and village rain', 'sing it once and sing again'],
  eu: ['Paris after midnight, lights on the river', 'Berlin basement, bass in my veins', 'Sevilla sun on a slow guitar', 'Amsterdam bikes, we are not far',
    'one more train to a brand new town', 'dance till the morning, never slow down', 'bonjour, hola, guten Tag', 'every language sings the same song'],
  me: ['Oud at dusk, the desert glows', 'yalla, yalla, the rhythm flows', 'souk lights on a silver street', 'caravan heart and a steady beat',
    'habibi, stay till the stars come out', 'hijaz nights, no room for doubt', 'sand and sky and a lantern flame', 'every drum is calling your name'],
  af: ['Lagos sunrise, the city wakes', 'amapiano, feel the bass it makes', 'jollof jam at the family table', 'dance as long as you are able',
    'kalimba kids in the morning light', 'everything is gonna be alright', 'shake it slow, then shake it fast', 'make this summer last and last'],
  la: ['Fuego lento, slow fire burning', 'samba de luz, the world is turning', 'mango dance on a summer street', 'reggaeton heat beneath our feet',
    'noche larga, the night is long', 'baila conmigo, sing along', 'calle caliente, hands up high', 'dance until the morning sky'],
  as: ['Idol era, sparkle on', 'Tokyo train till the night is gone', 'hanami petals in the air', 'Seoul neon everywhere',
    'fighting! we can make it through', 'city pop and a sky so blue', 'heart beat, heart beat, one two three', 'this is our new melody'],
})
const lyricsFor = (song) => {
  const lines = LYRICS[song.mood]
  // rotate the lines so every song in a mood starts a little differently
  const shift = Number(song.id.split('-').pop()) * 2
  return [...lines.slice(shift), ...lines.slice(0, shift), `♪ ${song.title} ♪`]
}

// ---------- 12. Full-screen Now Playing ----------
let npTab = 'lyrics'
let npOpen = false
let lastFocus = null

function openNP() {
  if (!current()) return
  npOpen = true
  lastFocus = document.activeElement
  $('#np').hidden = false
  document.body.classList.add('np-open')
  renderNP()
  $('#np-close').focus({ preventScroll: true })
}
function closeNP() {
  npOpen = false
  $('#np').hidden = true
  document.body.classList.remove('np-open')
  if (lastFocus) lastFocus.focus()
}

function renderNP() {
  if (!npOpen) return
  const song = current()
  if (!song) return closeNP()
  const cat = catById[song.mood]
  const q = state.queue
  const prevSong = q[(state.index - 1 + q.length) % q.length]
  const nextSong = q[(state.index + 1) % q.length]
  $('#np').style.setProperty('--c', cat.colors[0])
  $('#np').style.setProperty('--c2', cat.colors[1])
  $('#np').classList.toggle('playing', state.playing)
  $('#np-bg').src = IMG(song.img, 900)
  $('#np-img').src = IMG(song.img, 500)
  $('#np-prev-img').src = IMG(prevSong.img, 300)
  $('#np-next-img').src = IMG(nextSong.img, 300)
  $('#np-title').textContent = song.title
  $('#np-meta').textContent = `${song.artist} · ${song.album} · ${cat.emoji} ${cat.name}`
  $('#np-total').textContent = fmt(song.duration)
  $('#np-play').textContent = state.playing ? '❚❚' : '▶︎'
  $('#np-play').setAttribute('aria-label', state.playing ? 'Pause' : 'Play')
  const liked = state.likes.includes(song.id)
  $('#np-like').textContent = liked ? '♥' : '♡'
  $('#np-like').setAttribute('aria-pressed', liked)
  document.querySelectorAll('.np-tab').forEach((t) => t.setAttribute('aria-selected', t.dataset.tab === npTab))

  const panel = $('#np-panel')
  panel.dataset.song = song.id
  if (npTab === 'lyrics' && song.src) {
    panel.innerHTML = `<p class="np-empty">🎧 This is your own file, so there are no lyrics here. Sing along anyway.</p>`
  } else if (npTab === 'lyrics') {
    panel.innerHTML = `<ol class="lyrics">${lyricsFor(song).map((l) => `<li>${esc(l)}</li>`).join('')}</ol>
      <p class="lyrics-note">Original lyrics written for this prototype.</p>`
  } else if (npTab === 'next') {
    const upNext = [1, 2, 3, 4, 5].map((n) => q[(state.index + n) % q.length]).filter((s, i, arr) => s.id !== song.id && arr.indexOf(s) === i)
    panel.innerHTML = '<ol class="np-next"></ol>'
    panel.querySelector('.np-next').append(...upNext.map((s) => {
      const li = document.createElement('li')
      li.innerHTML = `<button type="button"><img src="${IMG(s.img, 80)}" alt="" onerror="this.style.opacity=0"><span><strong>${esc(s.title)}</strong>${esc(s.artist)}</span><em>${fmt(s.duration)}</em></button>`
      li.querySelector('button').onclick = () => { state.index = q.indexOf(s); startSong() }
      return li
    }))
  } else {
    const artist = artists.find((a) => a.name === song.artist)
    if (!artist) {
      panel.innerHTML = `<div class="np-about"><img src="${UPLOAD_COVER}" alt=""><div><strong>${esc(song.title)}</strong><span>Your upload · ${esc(song.type || 'audio file')}</span>
        <p>Playing at full quality from your device. It never leaves this browser.</p></div></div>`
      return tickNP()
    }
    panel.innerHTML = `<div class="np-about">
      <img src="${IMG(artist.img, 160)}" alt="" onerror="this.style.opacity=0">
      <div><strong>${esc(artist.name)}</strong><span>${esc(artist.genre)}</span>
      <p>${esc(song.title)} is from <em>${esc(song.album)}</em>, part of the ${cat.emoji} ${esc(cat.name)} collection: "${esc(cat.tag)}". ${song.plays}K plays this week.</p></div></div>`
  }
  tickNP()
}

// highlight the current lyric line as the song plays
function tickNP() {
  if (!npOpen || !current()) return
  const song = current()
  $('#np-time').textContent = fmt(state.position)
  $('#np-fill').style.width = `${(state.position / song.duration) * 100}%`
  const lines = document.querySelectorAll('.lyrics li')
  if (!lines.length) return
  const idx = Math.min(lines.length - 1, Math.floor((state.position / song.duration) * lines.length))
  lines.forEach((li, i) => li.classList.toggle('on', i === idx))
  lines.forEach((li, i) => li.classList.toggle('past', i < idx))
  const panel = $('#np-panel')
  const on = lines[idx]
  const offset = on.getBoundingClientRect().top - panel.getBoundingClientRect().top
  panel.scrollTo({ top: panel.scrollTop + offset - panel.clientHeight / 2 + on.clientHeight / 2, behavior: 'smooth' })
}

$('#now-open').onclick = openNP
$('#np-close').onclick = closeNP
$('#np-play').onclick = togglePlay
$('#np-next').onclick = next
$('#np-prev').onclick = prev
$('#np-like').onclick = () => current() && toggleLike(current().id)
document.querySelectorAll('.np-tab').forEach((t) => { t.onclick = () => { npTab = t.dataset.tab; renderNP() } })
document.addEventListener('keydown', (e) => {
  if (!npOpen) return
  if (e.key === 'Escape') closeNP()
  // keep keyboard focus inside the full-screen player
  if (e.key === 'Tab') {
    const f = [...$('#np').querySelectorAll('button, [tabindex="0"]')]
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus() }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus() }
  }
})

// 3D tilt on the big disc follows the mouse
$('#np').addEventListener('pointermove', (e) => {
  const x = e.clientX / innerWidth - 0.5
  const y = e.clientY / innerHeight - 0.5
  $('#np-stage').style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 12}deg)`
})

// ---------- 13. Settings drawer ----------
function openSettings() {
  lastFocus = document.activeElement
  $('#settings').hidden = false
  $('#settings-backdrop').hidden = false
  $('#settings-close').focus()
}
function closeSettings() {
  $('#settings').hidden = true
  $('#settings-backdrop').hidden = true
  if (lastFocus) lastFocus.focus()
}
$('#open-settings').onclick = openSettings
document.querySelectorAll('[data-open-settings]').forEach((b) => { b.onclick = openSettings })
$('#settings-close').onclick = closeSettings
$('#settings-backdrop').onclick = closeSettings
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#settings').hidden) closeSettings() })

// Equalizer: presets + 5 sliders
function buildEQ() {
  const labels = ['Bass', 'Low mid', 'Mid', 'Presence', 'Air']
  $('.presets').innerHTML = Object.keys(EQ_PRESETS).map((p) =>
    `<button class="preset" type="button" data-preset="${p}" aria-pressed="${settings.preset === p}">${p}</button>`).join('')
  $('#eq').innerHTML = engine.EQ_BANDS.map((f, i) => `
    <label class="eq-band">
      <span class="eq-val" id="eq-val-${i}">${settings.eq[i] > 0 ? '+' : ''}${settings.eq[i]} dB</span>
      <input type="range" min="-12" max="12" step="1" value="${settings.eq[i]}" data-band="${i}"
        aria-label="${labels[i]} (${f < 1000 ? f + ' Hz' : f / 1000 + ' kHz'})" aria-valuetext="${settings.eq[i]} decibels">
      <span class="eq-lab">${labels[i]}<small>${f < 1000 ? f : f / 1000 + 'k'}</small></span>
    </label>`).join('')
  document.querySelectorAll('.preset').forEach((b) => {
    b.onclick = () => {
      settings.preset = b.dataset.preset
      settings.eq = [...EQ_PRESETS[b.dataset.preset]]
      applyEQ()
      buildEQ()
    }
  })
  document.querySelectorAll('#eq input').forEach((inp) => {
    inp.oninput = () => {
      const i = Number(inp.dataset.band)
      settings.eq[i] = Number(inp.value)
      settings.preset = 'Custom'
      $(`#eq-val-${i}`).textContent = `${settings.eq[i] > 0 ? '+' : ''}${settings.eq[i]} dB`
      inp.setAttribute('aria-valuetext', `${settings.eq[i]} decibels`)
      document.querySelectorAll('.preset').forEach((p) => p.setAttribute('aria-pressed', 'false'))
      applyEQ()
    }
  })
}
function applyEQ() { engine.setEQ(settings.eq); saveSettings() }

$('#crackle').checked = settings.crackle
$('#crackle').onchange = (e) => { settings.crackle = e.target.checked; engine.setCrackle(settings.crackle); saveSettings() }
engine.crackleOn = settings.crackle

// Animations: Full / Calm (motion.js)
document.querySelectorAll('input[name="motion"]').forEach((r) => {
  r.checked = r.value === (settings.motion || (window.Motion && Motion.calm ? 'calm' : 'full'))
  r.onchange = () => {
    settings.motion = r.value
    saveSettings()
    if (window.Motion) Motion.setCalm(r.value === 'calm')
    announce(r.value === 'calm' ? 'Calm animations on' : 'Full motion on')
  }
})

// 3D quality (scene.js listens for this event)
document.querySelectorAll('input[name="quality"]').forEach((r) => {
  r.checked = r.value === settings.quality
  r.onchange = () => {
    settings.quality = r.value
    saveSettings()
    window.dispatchEvent(new CustomEvent('vybe:quality', { detail: r.value }))
  }
})
window.addEventListener('vybe:stats', (e) => {
  const { fps, level, reason } = e.detail
  $('#fps').textContent = level === 'off' ? '3D is off: no GPU work, best battery life.'
    : `3D running at ${fps} fps · ${level === 'high' ? 'High quality' : 'Battery saver'}${reason ? ` (${reason})` : ''}`
})

// ---------- 14. Backup: export, import, share link ----------
function storageStatus() {
  $('#storage-status').textContent = storageOK
    ? `✅ ${state.likes.length} liked songs are saved in this browser. Export a backup in case you clear your browser data.`
    : '⚠️ This browser is blocking storage, so likes only last until you close the tab. Export them to keep them.'
  $('#storage-warning').hidden = storageOK
}
$('#export-likes').onclick = () => {
  const data = { app: 'VYBE', version: 1, exported: new Date().toISOString(),
    likes: state.likes.filter((id) => songs.some((s) => s.id === id)), // uploads stay on the device
    titles: state.likes.map(findSong).filter(Boolean).map((s) => `${s.title} by ${s.artist}`) }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  a.download = 'vybe-liked-songs.json'
  a.click()
  URL.revokeObjectURL(a.href)
  announce('Liked songs exported')
}
$('#import-likes').onchange = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  try {
    const data = JSON.parse(await file.text())
    const ids = (data.likes || []).filter((id) => findSong(id))
    state.likes = [...new Set([...state.likes, ...ids])]
    saveLikes()
    announce(`Imported ${ids.length} liked songs`)
    render()
  } catch { announce('That file is not a VYBE backup') }
  e.target.value = ''
}
$('#share-likes').onclick = async () => {
  const ids = state.likes.filter((id) => songs.some((s) => s.id === id))
  const url = `${location.origin}${location.pathname}#likes=${encodeURIComponent(ids.join(','))}`
  try { await navigator.clipboard.writeText(url); announce('Share link copied') ; $('#share-likes').textContent = '✅ Link copied' }
  catch { prompt('Copy this link:', url) }
  setTimeout(() => { $('#share-likes').textContent = '🔗 Copy share link' }, 2500)
}
// opening a share link adds those songs to your likes
function importFromHash() {
  const m = location.hash.match(/likes=([^&]+)/)
  if (!m) return
  const ids = decodeURIComponent(m[1]).split(',').filter((id) => findSong(id))
  if (!ids.length) return
  state.likes = [...new Set([...state.likes, ...ids])]
  saveLikes()
  history.replaceState(null, '', location.pathname)
  setTimeout(() => { announce(`Added ${ids.length} shared songs to Liked songs`); location.hash = '#/library' }, 300)
}

// ---------- 15. Sleep timer ----------
let sleepTimer = null
let sleepEnd = 0
document.querySelectorAll('input[name="sleep"]').forEach((r) => {
  r.onchange = () => {
    clearInterval(sleepTimer)
    const mins = Number(r.value)
    if (!mins) { $('#sleep-status').textContent = ''; return }
    sleepEnd = Date.now() + mins * 60000
    sleepTimer = setInterval(() => {
      const left = Math.max(0, sleepEnd - Date.now())
      $('#sleep-status').textContent = `Music stops in ${Math.ceil(left / 60000)} min`
      if (left === 0) {
        clearInterval(sleepTimer)
        if (state.playing) togglePlay()
        $('#sleep-status').textContent = 'Sleep timer finished. Good night 🌙'
        document.querySelector('input[name="sleep"][value="0"]').checked = true
      }
    }, 1000)
    $('#sleep-status').textContent = `Music stops in ${mins} min`
  }
})

// ---------- 16. Shuffle + repeat ----------
$('#shuffle').onclick = () => {
  state.shuffle = !state.shuffle
  $('#shuffle').setAttribute('aria-pressed', state.shuffle)
  announce(`Shuffle ${state.shuffle ? 'on' : 'off'}`)
}
$('#repeat').onclick = () => {
  state.repeat = { all: 'one', one: 'off', off: 'all' }[state.repeat]
  $('#repeat').textContent = state.repeat === 'one' ? '🔂\uFE0E' : '🔁\uFE0E'
  $('#repeat').classList.toggle('off', state.repeat === 'off')
  $('#repeat').setAttribute('aria-label', `Repeat: ${state.repeat}`)
  announce(`Repeat ${state.repeat === 'one' ? 'this song' : state.repeat}`)
}

// ---------- 17. Your own music (saved in IndexedDB on this device) ----------
const db = {
  open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('vybe', 1)
      req.onupgradeneeded = () => req.result.createObjectStore('tracks', { keyPath: 'id' })
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  },
  async all() {
    const d = await this.open()
    return new Promise((res) => { const r = d.transaction('tracks').objectStore('tracks').getAll(); r.onsuccess = () => res(r.result) })
  },
  async put(rec) {
    const d = await this.open()
    return new Promise((res, rej) => { const t = d.transaction('tracks', 'readwrite'); t.objectStore('tracks').put(rec); t.oncomplete = res; t.onerror = () => rej(t.error) })
  },
  async remove(id) {
    const d = await this.open()
    return new Promise((res) => { const t = d.transaction('tracks', 'readwrite'); t.objectStore('tracks').delete(id); t.oncomplete = res })
  },
}

const getDuration = (url) => new Promise((res) => {
  const a = new Audio()
  a.preload = 'metadata'
  a.onloadedmetadata = () => res(isFinite(a.duration) ? a.duration : 180)
  a.onerror = () => res(180)
  a.src = url
})

function toSong(rec) {
  const url = URL.createObjectURL(rec.blob)
  return { id: rec.id, title: rec.title, artist: 'You', album: 'Your uploads', mood: 'mine', img: null, src: url, type: rec.type,
    duration: rec.duration || 180, plays: 0 }
}

async function addFiles(files) {
  const list = [...files].filter((f) => f.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(f.name))
  if (!list.length) return announce('Those were not audio files')
  for (const f of list) {
    const id = `up-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const tmpUrl = URL.createObjectURL(f)
    const duration = await getDuration(tmpUrl)
    URL.revokeObjectURL(tmpUrl)
    const rec = { id, title: f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '), type: f.type || 'audio', duration, blob: f, added: Date.now() }
    try { await db.put(rec) } catch { /* storage full or blocked: still playable this session */ }
    uploads.push(toSong(rec))
  }
  announce(`Added ${list.length} song${list.length > 1 ? 's' : ''} to Your music`)
  render()
}

function renderUploads() {
  const list = $('#mine-list')
  list.replaceChildren(...uploads.map((s, i) => {
    const li = songRow(s, i, uploads)
    const del = document.createElement('button')
    del.className = 'like del'
    del.type = 'button'
    del.setAttribute('aria-label', `Remove ${s.title}`)
    del.textContent = '✕'
    del.onclick = async () => {
      await db.remove(s.id).catch(() => {})
      if (current() && current().id === s.id) { engine.stopAll(); state.playing = false; state.queue = []; state.index = -1 }
      uploads = uploads.filter((u) => u.id !== s.id)
      announce(`Removed ${s.title}`)
      render()
    }
    li.append(del)
    return li
  }))
  $('#play-mine').hidden = uploads.length === 0
}
$('#play-mine').onclick = () => playQueue(uploads, 0, 'mine')
$('#file-input').onchange = (e) => { addFiles(e.target.files); e.target.value = '' }
const dz = $('#dropzone')
;['dragenter', 'dragover'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('over') }))
;['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, () => dz.classList.remove('over')))
dz.addEventListener('drop', (e) => { e.preventDefault(); addFiles(e.dataTransfer.files) })

async function loadUploads() {
  try {
    const recs = await db.all()
    uploads = recs.sort((a, b) => a.added - b.added).map(toSong)
    render()
  } catch { /* IndexedDB blocked: uploads work for this session only */ }
}


// ---------- 18. Pages (hash router) ----------
// Each page has its own address (#/explore, #/world …). Music keeps playing while you move between pages.
const PAGES = {
  home: 'Home', explore: 'Explore', world: 'Around the world', artists: 'Artists', artist: 'Artist',
  library: 'Your library', search: 'Search', signup: 'Create profile', signin: 'Sign in', profile: 'Profile',
}
const route = { page: 'home', param: null }

function go() {
  const h = location.hash
  if (h && !h.startsWith('#/')) return // normal in-page links (skip link, share links) are left alone
  const [page, param] = h.replace(/^#\/?/, '').split('/')
  route.page = PAGES[page] ? page : 'home'
  route.param = param ?? null
  // profile pages need a signed-in profile
  if (route.page === 'profile' && !me) { location.replace('#/signin'); return }
  const apply = () => {
    document.querySelectorAll('.page').forEach((p) => { p.hidden = p.dataset.page !== route.page })
    document.body.dataset.page = route.page
    document.querySelectorAll('[data-route]').forEach((a) => {
      const on = a.dataset.route === route.page || (route.page === 'artist' && a.dataset.route === 'artists') ||
        ((route.page === 'signin' || route.page === 'signup') && a.dataset.route === 'profile')
      a.classList.toggle('active', on)
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current')
    })
    if (route.page === 'signup') setupSignup(route.param === 'edit')
    renderPages()
    document.title = `${route.page === 'home' ? "VYBE: Don't just hear it. Feel it." : `${PAGES[route.page]} · VYBE`}`
    window.scrollTo({ top: 0, behavior: 'instant' })
    // move keyboard / screen-reader focus to the new page's heading
    const heading = document.querySelector(`.page[data-page="${route.page}"] .page-title, .page[data-page="${route.page}"] h1`)
    if (heading && route.page !== 'home') { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }) }
    if (window.Motion && route.ready) Motion.replay(heading)
  }
  // smooth page change (View Transitions API); instant in Calm mode or older browsers
  if (window.Motion && route.ready) Motion.transition(apply); else apply()
  route.ready = true
  announce(`${PAGES[route.page]} page`)
}
window.addEventListener('hashchange', go)

// everything that depends on the current page / profile
function renderPages() {
  renderAccount()
  renderForYou()
  if (route.page === 'artist') renderArtistPage()
  if (route.page === 'search') renderSearch()
  if (route.page === 'profile') renderProfile()
  if (route.page === 'signin') renderPicker()
  if (window.Motion) Motion.refresh()
  $('#library-sub').textContent = me ? `${me.avatar} ${me.name}'s library · saved on this device` : 'Guest library · saved on this device'
}

// ---------- 19. Search page ----------
function renderSearch() {
  if (route.page !== 'search') return
  const q = state.query
  $('#search-title').textContent = q ? `Results for "${$('#search').value.trim()}"` : 'Search'
  const songHits = q ? [...songs, ...uploads].filter((s) => searchMatch(s, q)).slice(0, 30) : []
  const albumHits = q ? albums.filter((a) => searchMatch(a, q)) : []
  $('#search-songs').replaceChildren(...songHits.map((s, i) => songRow(s, i, songHits)))
  $('#search-albums').replaceChildren(...albumHits.map(albumCard))
  $('#search-songs').closest('section').hidden = songHits.length === 0
  $('#search-albums').closest('section').hidden = albumHits.length === 0
  $('#search-empty').hidden = !q || songHits.length + albumHits.length > 0
  if (!q) $('#search-empty').hidden = false
}

// ---------- 20. Artist page ----------
function renderArtistPage() {
  const artist = artists[Number(route.param)]
  if (!artist) { $('#artist-page').innerHTML = '<p class="empty">Artist not found. <a href="#/artists">See all artists</a></p>'; return }
  const list = songs.filter((s) => s.artist === artist.name)
  const their = albums.filter((a) => a.artist === artist.name)
  const cat = catById[their[0].mood]
  const box = $('#artist-page')
  box.style.setProperty('--g', cat.colors[0])
  box.innerHTML = `
    <section class="artist-hero">
      <span class="artist-pic big"><img src="${IMG(artist.img, 500)}" alt="" onerror="this.style.opacity=0"></span>
      <div>
        <p class="eyebrow">Artist · ${esc(artist.genre)}</p>
        <h1 class="page-title" tabindex="-1">${esc(artist.name)}</h1>
        <p class="artist-meta">${list.length} songs · ${their.length} album${their.length > 1 ? 's' : ''} · ${their.map((a) => `${catById[a.mood].emoji} ${esc(catById[a.mood].name)}`).join(' · ')}</p>
        <p class="artist-note">Fictional artist created for this prototype.</p>
        <div class="spot-actions">
          <button class="btn btn-hot" type="button" id="artist-play">▶︎ Play ${esc(artist.name)}</button>
          <a class="btn btn-ghost" href="#/artists">← All artists</a>
        </div>
      </div>
    </section>
    <section class="shelf"><h2>Popular songs</h2><ol class="quick-grid" id="artist-songs"></ol></section>
    <section class="shelf"><h2>Albums</h2><ul class="album-grid" id="artist-albums"></ul></section>`
  $('#artist-songs').replaceChildren(...list.map((s, i) => songRow(s, i, list)))
  $('#artist-albums').replaceChildren(...their.map(albumCard))
  $('#artist-play').onclick = () => playQueue(list)
}

// ---------- 21. Demo profiles: sign up, sign in, profile ----------
const AVATARS = ['🎧', '😎', '🦋', '👽', '🐱', '🦄', '🔥', '🌙', '🎸', '🪩', '🍓', '🐼']
let draft = null // the sign-up form state

function setupSignup(edit) {
  const editing = edit && me
  draft = editing ? { ...me } : { name: '', avatar: AVATARS[0], mood: 'chill', region: '' }
  $('#su-title').textContent = editing ? 'Edit your profile' : 'Create your vibe profile'
  $('#su-eyebrow').textContent = editing ? 'Your profile' : 'Join VYBE · free forever'
  $('#su-submit').textContent = editing ? 'Save changes ✓' : 'Create profile ✨'
  $('#su-switch').hidden = !!editing
  $('#su-name').value = draft.name
  $('#su-name-err').textContent = ''
  $('#su-name').removeAttribute('aria-invalid')
  $('#su-avatars').innerHTML = AVATARS.map((a) => `
    <label class="avatar-opt"><input type="radio" name="avatar" value="${a}" ${a === draft.avatar ? 'checked' : ''}><span aria-hidden="true">${a}</span><span class="sr-only">Avatar ${a}</span></label>`).join('')
  $('#su-mood').innerHTML = moodCats.map((c) => `
    <label class="pick-opt" style="--c:${c.colors[0]}"><input type="radio" name="mood" value="${c.id}" ${c.id === draft.mood ? 'checked' : ''}><span>${c.emoji} ${esc(c.name)}</span></label>`).join('')
  $('#su-region').innerHTML = `<label class="pick-opt"><input type="radio" name="region" value="" ${!draft.region ? 'checked' : ''}><span>🎵 No preference</span></label>` +
    worldCats.map((c) => `
    <label class="pick-opt" style="--c:${c.colors[0]}"><input type="radio" name="region" value="${c.id}" ${c.id === draft.region ? 'checked' : ''}><span>${c.emoji} ${esc(c.name)}</span></label>`).join('')
  updatePreview()
}

function updatePreview() {
  const f = $('#signup-form')
  draft.name = $('#su-name').value.trim()
  draft.avatar = f.avatar.value
  draft.mood = f.mood.value
  draft.region = f.region.value
  const c = catById[draft.mood]
  $('#su-preview-avatar').textContent = draft.avatar
  $('#su-preview-name').textContent = draft.name || 'your name here'
  $('#su-preview-vibe').textContent = `${c.emoji} ${c.name}${draft.region ? ` · ${catById[draft.region].emoji} ${catById[draft.region].name}` : ''}`
  document.querySelector('.auth-art').style.setProperty('--c', c.colors[0])
  document.querySelector('.auth-art').style.setProperty('--c2', c.colors[1])
}
$('#signup-form').addEventListener('input', updatePreview)
$('#signup-form').addEventListener('change', updatePreview)

function validName(name) {
  if (name.length < 2) return 'Your nickname needs at least 2 characters.'
  if (name.length > 20) return 'Keep it to 20 characters or fewer.'
  if (/@/.test(name)) return 'That looks like an email. Please use a nickname instead.'
  if (!/^[\p{L}\p{N} ._-]+$/u.test(name)) return 'Use letters, numbers, spaces, dots, dashes or underscores.'
  if (profiles.some((p) => p.name.toLowerCase() === name.toLowerCase() && (!me || p.id !== me.id || route.param !== 'edit')))
    return 'That nickname is already used on this device. Try another one.'
  return ''
}

$('#signup-form').addEventListener('submit', (e) => {
  e.preventDefault()
  updatePreview()
  const err = validName(draft.name)
  $('#su-name-err').textContent = err
  if (err) { $('#su-name').setAttribute('aria-invalid', 'true'); $('#su-name').focus(); return }
  $('#su-name').removeAttribute('aria-invalid')
  if (route.param === 'edit' && me) {
    Object.assign(me, { name: draft.name, avatar: draft.avatar, mood: draft.mood, region: draft.region })
    store.set('vybe-profiles', profiles)
    announce('Profile updated')
    location.hash = '#/profile'
  } else {
    const profile = { id: `p${Date.now().toString(36)}`, name: draft.name, avatar: draft.avatar, mood: draft.mood, region: draft.region, created: Date.now() }
    profiles.push(profile)
    store.set('vybe-profiles', profiles)
    signIn(profile.id, true)
  }
})

function signIn(id, isNew = false) {
  me = profiles.find((p) => p.id === id) || null
  store.set('vybe-current', me ? me.id : null)
  state.likes = loadLikes()
  greet()
  announce(me ? `${isNew ? 'Welcome to VYBE' : 'Welcome back'}, ${me.name}` : 'Signed out')
  location.hash = me ? '#/' : '#/signin'
  render()
}
function signOut() { signIn(null) }

function renderPicker() {
  $('#profile-picker').innerHTML = profiles.map((p) => `
    <li><button class="profile-tile ${me && me.id === p.id ? 'is-me' : ''}" type="button" data-id="${p.id}" style="--c:${catById[p.mood].colors[0]}">
      <span class="profile-avatar" aria-hidden="true">${p.avatar}</span>
      <strong>${esc(p.name)}</strong><span>${catById[p.mood].emoji} ${esc(catById[p.mood].name)}</span>
    </button></li>`).join('')
  $('#no-profiles').hidden = profiles.length > 0
  document.querySelectorAll('.profile-tile').forEach((b) => { b.onclick = () => signIn(b.dataset.id) })
  $('#guest-btn').onclick = () => {
    if (!me) return // the link itself takes guests home
    me = null
    store.set('vybe-current', null)
    state.likes = loadLikes()
    greet()
    announce('Listening as a guest')
    render()
  }
}

function renderAccount() {
  $('#account').innerHTML = me
    ? `<a class="me-chip" href="#/profile" aria-label="Your profile: ${esc(me.name)}"><span class="me-avatar" aria-hidden="true">${me.avatar}</span><span class="me-name">${esc(me.name)}</span></a>`
    : `<a class="btn btn-ghost btn-sm" href="#/signin">Sign in</a><a class="btn btn-lime btn-sm" href="#/signup">Sign up</a>`
  $('#tab-avatar').textContent = me ? me.avatar : '👤'
}

function forYouSongs() {
  if (!me) return []
  const fav = songs.filter((s) => s.mood === me.mood)
  const home = me.region ? songs.filter((s) => s.mood === me.region) : []
  const liked = state.likes.map(findSong).filter((s) => s && !s.src)
  const mix = []
  for (let i = 0; i < 8; i++) { if (fav[i]) mix.push(fav[i]); if (home[i]) mix.push(home[i]) }
  return [...new Set([...mix, ...liked])].slice(0, 12)
}
function renderForYou() {
  const list = forYouSongs()
  $('#for-you').hidden = !me
  if (!me) return
  $('#for-you-title').textContent = `Made for ${me.name} ${me.avatar}`
  $('#for-you-sub').textContent = `${catById[me.mood].emoji} ${catById[me.mood].name}${me.region ? ` + ${catById[me.region].emoji} ${catById[me.region].name}` : ''} · updated as you like songs`
  $('#for-you-list').replaceChildren(...list.map((s, i) => songRow(s, i, list)))
  $('#play-for-you').onclick = () => playQueue(list)
}

function renderProfile() {
  if (!me) return
  const c = catById[me.mood]
  const likedSongs = state.likes.map(findSong).filter(Boolean)
  const counts = {}
  likedSongs.forEach((s) => { counts[s.mood] = (counts[s.mood] || 0) + 1 })
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  const box = $('#profile-page')
  box.style.setProperty('--c', c.colors[0])
  box.style.setProperty('--c2', c.colors[1])
  box.innerHTML = `
    <section class="profile-hero">
      <span class="profile-avatar big" aria-hidden="true">${me.avatar}</span>
      <div>
        <p class="eyebrow">Demo profile · on this device since ${new Date(me.created).toLocaleDateString()}</p>
        <h1 class="page-title" tabindex="-1">${esc(me.name)}</h1>
        <p class="artist-meta">${c.emoji} ${esc(c.name)}${me.region ? ` · ${catById[me.region].emoji} ${esc(catById[me.region].name)}` : ''}</p>
        <div class="spot-actions">
          <button class="btn btn-hot" type="button" id="pf-play">▶︎ Play my mix</button>
          <a class="btn btn-ghost" href="#/signup/edit">✎ Edit profile</a>
          <a class="btn btn-ghost" href="#/signin">⇄ Switch profile</a>
          <button class="btn btn-ghost" type="button" id="pf-out">Sign out</button>
        </div>
      </div>
    </section>
    <ul class="stats-grid">
      <li><strong>${likedSongs.length}</strong><span>liked songs</span></li>
      <li><strong>${uploads.length}</strong><span>your uploads</span></li>
      <li><strong>${top ? catById[top[0]].emoji : '—'}</strong><span>${top ? `most liked: ${esc(catById[top[0]].name)}` : 'like songs to find your top vibe'}</span></li>
      <li><strong>${profiles.length}</strong><span>profile${profiles.length > 1 ? 's' : ''} on this device</span></li>
    </ul>
    <section class="shelf">
      <h2>Your liked songs</h2>
      <ol class="quick-grid" id="pf-liked"></ol>
      ${likedSongs.length ? '' : '<p class="empty">No liked songs yet. Tap ♡ on any song.</p>'}
    </section>
    <section class="shelf danger">
      <h2>Privacy</h2>
      <p class="set-note">This profile only exists in this browser. Nothing is sent to a server, and there's no email or password.</p>
      <button class="btn btn-ghost" type="button" id="pf-delete">🗑 Delete this profile and its likes</button>
    </section>`
  $('#pf-liked').replaceChildren(...likedSongs.map((s, i) => songRow(s, i, likedSongs)))
  $('#pf-play').onclick = () => playQueue(forYouSongs())
  $('#pf-out').onclick = signOut
  $('#pf-delete').onclick = () => {
    if (!confirm(`Delete the profile "${me.name}" and its liked songs from this device?`)) return
    try { localStorage.removeItem(likesKey()) } catch { /* ignore */ }
    profiles = profiles.filter((p) => p.id !== me.id)
    store.set('vybe-profiles', profiles)
    signOut()
  }
}

// ---------- start-up ----------
greet()
buildStatic()
buildSpotlight()
buildEQ()
importFromHash()
window.addEventListener('hashchange', () => { importFromHash(); render() })
render()
go()
loadUploads()
