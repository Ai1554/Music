/* =========================================================
   VYBE music engine (Web Audio API)
   ---------------------------------------------------------
   Two kinds of sources go through ONE shared effects chain:
     1. Generated songs: a small step-sequencer "band"
        (drums + bass + chords + melody + vinyl crackle)
     2. Your own audio files (MP3/WAV/OGG…) at full quality

   source → 5-band EQ → volume → compressor → analyser → speakers
                ↑ reverb send (generated songs only)
   ========================================================= */
;(function () {
  // ---------- music theory helpers ----------
  const SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    bhairav: [0, 1, 4, 5, 7, 8, 11],    // Raag Bhairav: used in Sufi / qawwali
    khamaj: [0, 2, 4, 5, 7, 9, 10],     // Raag Khamaj: light classical & filmi
    pentatonic: [0, 2, 4, 7, 9],         // folk melodies (Baul, East Asian pop)
    hijaz: [0, 1, 4, 5, 7, 8, 10],       // Maqam Hijaz: Middle Eastern
  }
  const midiToHz = (m) => 440 * 2 ** ((m - 69) / 12)
  const hzToMidi = (hz) => Math.round(69 + 12 * Math.log2(hz / 440))

  // A "style" for every mood: chord progression (scale degrees), tempo, drums, sound colour
  const STYLES = {
    romantic:  { scale: 'major',    prog: [0, 4, 5, 3], bpm: 78,  drums: 'lofi',  swing: 0.12, pad: 'sawtooth', lead: 'triangle', cutoff: 1800, verb: 0.35, crackle: false, sevenths: true },
    sad:       { scale: 'minor',    prog: [0, 5, 2, 6], bpm: 68,  drums: 'soft',  swing: 0.08, pad: 'sawtooth', lead: 'sine',     cutoff: 1300, verb: 0.55, crackle: true,  sevenths: true },
    party:     { scale: 'major',    prog: [0, 4, 5, 3], bpm: 124, drums: 'house', swing: 0,    pad: 'sawtooth', lead: 'square',   cutoff: 3200, verb: 0.22, crackle: false, sevenths: false },
    main:      { scale: 'major',    prog: [0, 5, 3, 4], bpm: 104, drums: 'pop',   swing: 0.04, pad: 'sawtooth', lead: 'triangle', cutoff: 2600, verb: 0.3,  crackle: false, sevenths: false },
    villain:   { scale: 'phrygian', prog: [0, 1, 5, 4], bpm: 140, drums: 'trap',  swing: 0,    pad: 'sawtooth', lead: 'sawtooth', cutoff: 1600, verb: 0.3,  crackle: false, sevenths: false },
    study:     { scale: 'dorian',   prog: [1, 4, 0, 5], bpm: 76,  drums: 'lofi',  swing: 0.14, pad: 'triangle', lead: 'sine',     cutoff: 1500, verb: 0.35, crackle: true,  sevenths: true },
    chill:     { scale: 'major',    prog: [3, 0, 4, 5], bpm: 84,  drums: 'lofi',  swing: 0.12, pad: 'triangle', lead: 'triangle', cutoff: 1700, verb: 0.4,  crackle: true,  sevenths: true },
    gym:       { scale: 'minor',    prog: [0, 5, 2, 6], bpm: 132, drums: 'house', swing: 0,    pad: 'sawtooth', lead: 'sawtooth', cutoff: 3000, verb: 0.18, crackle: false, sevenths: false },
    night:     { scale: 'minor',    prog: [0, 6, 5, 4], bpm: 86,  drums: 'lofi',  swing: 0.12, pad: 'sawtooth', lead: 'sine',     cutoff: 1300, verb: 0.5,  crackle: true,  sevenths: true },
    throwback: { scale: 'major',    prog: [0, 5, 3, 4], bpm: 112, drums: 'break', swing: 0.06, pad: 'square',   lead: 'square',   cutoff: 2400, verb: 0.25, crackle: false, sevenths: false },

    // ---- around the world ----
    pk: { scale: 'bhairav',    prog: [0, 0, 3, 0], bpm: 92,  drums: 'qawwali', swing: 0.1,  pad: 'sawtooth', lead: 'harmonium', cutoff: 1500, verb: 0.35, crackle: false, sevenths: false, drone: true, quietPad: true },
    in: { scale: 'khamaj',     prog: [0, 6, 3, 4], bpm: 116, drums: 'bhangra', swing: 0.06, pad: 'sawtooth', lead: 'sitar',     cutoff: 2200, verb: 0.3,  crackle: false, sevenths: false, drone: true },
    bd: { scale: 'pentatonic', prog: [0, 3, 4, 0], bpm: 100, drums: 'folk',    swing: 0.1,  pad: 'triangle', lead: 'pluck',     cutoff: 1700, verb: 0.35, crackle: true,  sevenths: false, drone: true, quietPad: true },
    eu: { scale: 'minor',      prog: [0, 5, 2, 6], bpm: 126, drums: 'house',   swing: 0,    pad: 'sawtooth', lead: 'supersaw',  cutoff: 3400, verb: 0.3,  crackle: false, sevenths: false },
    me: { scale: 'hijaz',      prog: [0, 1, 0, 6], bpm: 100, drums: 'maqsum',  swing: 0.04, pad: 'sawtooth', lead: 'oud',       cutoff: 1800, verb: 0.38, crackle: false, sevenths: false, drone: true, quietPad: true },
    af: { scale: 'dorian',     prog: [1, 4, 0, 5], bpm: 112, drums: 'afro',    swing: 0.08, pad: 'triangle', lead: 'marimba',   cutoff: 2200, verb: 0.25, crackle: false, sevenths: true,  bass: 'log' },
    la: { scale: 'minor',      prog: [0, 5, 2, 6], bpm: 94,  drums: 'dembow',  swing: 0,    pad: 'sawtooth', lead: 'pluck',     cutoff: 2400, verb: 0.25, crackle: false, sevenths: false },
    as: { scale: 'major',      prog: [3, 4, 2, 5], bpm: 122, drums: 'pop',     swing: 0,    pad: 'sawtooth', lead: 'square',    cutoff: 3000, verb: 0.3,  crackle: false, sevenths: true },
  }

  // Drum patterns: 16 steps per bar. k = kick, s = snare/clap, h = closed hat, o = open hat
  const DRUMS = {
    lofi:  { k: 'x.....x...x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', o: '................' },
    soft:  { k: 'x.........x.....', s: '....x.......x...', h: '..x...x...x...x.', o: '................' },
    house: { k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.', o: '..x...x...x...x.' },
    pop:   { k: 'x.....x.x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', o: '..............x.' },
    trap:  { k: 'x......x..x.....', s: '........x.......', h: 'xxxxx.xxxxxxx.xx', o: '................' },
    break: { k: 'x.........x.x...', s: '....x..x....x...', h: 'x.x.x.x.x.x.x.x.', o: '......x.........' },
    // t = tabla / dhol / rim (high drum), c = hand claps
    qawwali: { k: 'x...x.....x.x...', s: '................', h: '................', o: '................', t: '..x...x.x...x.x.', c: '....x.......x...' },
    bhangra: { k: 'x..x..x.x..x..x.', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', o: '................', t: '.x...x...x...x..' },
    folk:    { k: 'x.....x.x.......', s: '................', h: '..x...x...x...x.', o: '................', t: '...x.....x..x...' },
    maqsum:  { k: 'x.....x.x.......', s: '................', h: 'x.x.x.x.x.x.x.x.', o: '................', t: '...x.x.....x.x..' },
    afro:    { k: 'x.....x...x.....', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx', o: '................', t: 'x..x..x...x..x..' },
    dembow:  { k: 'x...x...x...x...', s: '...x..x....x..x.', h: 'x.x.x.x.x.x.x.x.', o: '................' },
  }
  const HAND_DRUMS = ['qawwali', 'bhangra', 'folk', 'maqsum']

  // tiny seeded random generator, so every song is different but always the same
  function seeded(str) {
    let h = 1779033703
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    return () => {
      h = Math.imul(h ^ (h >>> 16), 2246822507)
      h = Math.imul(h ^ (h >>> 13), 3266489909)
      return ((h ^= h >>> 16) >>> 0) / 4294967296
    }
  }

  const EQ_BANDS = [60, 230, 910, 3600, 14000]

  const engine = {
    ctx: null,
    data: new Uint8Array(32),
    onEnded: null,
    mode: 'none', // 'synth' | 'file' | 'none'
    crackleOn: true,

    init() {
      if (this.ctx) return
      const ctx = (this.ctx = new (window.AudioContext || window.webkitAudioContext)())

      // shared output chain
      this.input = ctx.createGain()
      this.eq = EQ_BANDS.map((f, i) => {
        const b = ctx.createBiquadFilter()
        b.type = i === 0 ? 'lowshelf' : i === EQ_BANDS.length - 1 ? 'highshelf' : 'peaking'
        b.frequency.value = f
        b.Q.value = 1
        b.gain.value = 0
        return b
      })
      this.master = ctx.createGain()
      this.master.gain.value = 0.7
      this.comp = ctx.createDynamicsCompressor()
      this.comp.threshold.value = -14
      this.comp.ratio.value = 4
      this.analyser = ctx.createAnalyser()
      this.analyser.fftSize = 64
      let node = this.input
      this.eq.forEach((b) => { node.connect(b); node = b })
      node.connect(this.master)
      this.master.connect(this.comp)
      this.comp.connect(this.analyser)
      this.analyser.connect(ctx.destination)

      // generated-song buses
      this.bus = ctx.createGain()
      this.bus.connect(this.input)
      this.duck = ctx.createGain() // pad + bass get "pumped" by the kick (sidechain feel)
      this.duck.connect(this.bus)
      this.reverb = ctx.createConvolver()
      this.reverb.buffer = this.makeImpulse(2.6)
      this.verbSend = ctx.createGain()
      this.verbSend.connect(this.reverb)
      this.reverb.connect(this.bus)

      // shared noise buffer for drums and crackle
      const len = ctx.sampleRate * 2
      this.noise = ctx.createBuffer(1, len, ctx.sampleRate)
      const d = this.noise.getChannelData(0)
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1

      // your own files play through an <audio> element
      this.audioEl = new Audio()
      this.audioEl.preload = 'metadata'
      this.fileSource = ctx.createMediaElementSource(this.audioEl)
      this.fileSource.connect(this.input)
      this.audioEl.addEventListener('ended', () => this.onEnded && this.onEnded())
    },

    makeImpulse(seconds) {
      const { ctx } = this
      const len = ctx.sampleRate * seconds
      const buf = ctx.createBuffer(2, len, ctx.sampleRate)
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch)
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.6
      }
      return buf
    },

    // ---------- generated songs ----------
    playSong(song) {
      this.init()
      this.stopAll()
      this.mode = 'synth'
      const style = STYLES[song.mood] || STYLES.chill
      const rnd = seeded(song.id)
      const scale = SCALES[style.scale]
      const keyMidi = hzToMidi(song.sound.root) // bass register
      const bpm = style.bpm + Math.round((rnd() - 0.5) * 6)

      // a 2-bar melody "motif" that repeats with variations: sounds like a real hook
      const motif = []
      for (let i = 0; i < 32; i++) {
        const onBeat = i % 4 === 0
        const play = rnd() < (onBeat ? 0.75 : style.drums === 'house' || style.drums === 'trap' ? 0.35 : 0.22)
        motif.push(play ? { deg: Math.floor(rnd() * scale.length), oct: rnd() < 0.2 ? 1 : 0, len: onBeat && rnd() < 0.5 ? 3 : 1 } : null)
      }

      this.song = { style, scale, keyMidi, bpm, motif, rnd, step: 0 }
      this.verbSend.gain.value = style.verb
      this.ctx.resume()
      this.nextTime = this.ctx.currentTime + 0.08
      this.timer = setInterval(() => this.schedule(), 25)
      if (style.crackle && this.crackleOn) this.startCrackle()
    },

    // scale degree → MIDI note (handles octave wrap)
    deg(d, base) {
      const { scale } = this.song
      const L = scale.length
      const oct = Math.floor(d / L)
      return base + scale[((d % L) + L) % L] + 12 * oct
    },

    schedule() {
      const { ctx } = this
      if (!this.song || ctx.state !== 'running') return
      const s = this.song
      const step16 = 60 / s.bpm / 4
      while (this.nextTime < ctx.currentTime + 0.15) {
        const step = s.step
        const inBar = step % 16
        const bar = Math.floor(step / 16)
        // song structure: 4 bars intro, 8 bars full, 4 bars breakdown, repeat
        const section = bar % 16 < 4 ? 'intro' : bar % 16 < 12 ? 'full' : 'break'
        const swing = inBar % 2 === 1 ? s.style.swing * step16 : 0
        const t = this.nextTime + swing
        const chordDeg = s.style.prog[bar % s.style.prog.length]

        // chords: once per bar
        if (inBar === 0) {
          const notes = [0, 2, 4].concat(s.style.sevenths ? [6] : []).map((x) => this.deg(chordDeg + x, s.keyMidi + 12))
          const padVol = (section === 'break' ? 0.05 : 0.07) * (s.style.quietPad ? 0.45 : 1)
          notes.forEach((n) => this.pad(midiToHz(n), t, step16 * 16, padVol))
          // tanpura-style drone (root + fifth) for South Asian & Middle Eastern styles
          if (s.style.drone && bar % 2 === 0) {
            this.drone(midiToHz(s.keyMidi + 12), t, step16 * 32)
            this.drone(midiToHz(s.keyMidi + 19), t, step16 * 32)
          }
        }

        // bass
        const pat = DRUMS[s.style.drums]
        if (section !== 'intro') {
          const bassHit = s.style.drums === 'house' ? inBar % 4 === 2 : pat.k[inBar] === 'x'
          if (bassHit) this.bass(midiToHz(this.deg(chordDeg, s.keyMidi - 12)), t, step16 * (s.style.drums === 'trap' ? 6 : 2.5))
        }

        // drums
        if (section === 'full' || (section === 'break' && inBar >= 12)) {
          if (pat.k[inBar] === 'x') this.kick(t)
          if (pat.s[inBar] === 'x') this.snare(t)
          if (pat.h[inBar] === 'x') this.hat(t, 0.05, s.style.drums === 'trap' && s.rnd() < 0.15, s.style.drums === 'afro' ? 0.05 : 0.12)
          if (pat.o[inBar] === 'x') this.hat(t, 0.22)
          if (pat.t && pat.t[inBar] === 'x') this.tabla(t, s.style.drums === 'afro')
          if (pat.c && pat.c[inBar] === 'x') this.clap(t)
        } else if (section === 'intro' && bar % 16 >= 2) {
          if (pat.h[inBar] === 'x') this.hat(t, 0.04)
          if (pat.t && pat.t[inBar] === 'x') this.tabla(t, s.style.drums === 'afro') // hand drums start early
        }

        // melody (rests in the intro so the song "builds")
        if (section !== 'intro' || bar % 16 >= 2) {
          const m = s.motif[step % 32]
          // every 4th bar, change the hook a little
          if (m && !(bar % 4 === 3 && s.rnd() < 0.4)) {
            const n = this.deg(chordDeg + m.deg, s.keyMidi + 24 + 12 * m.oct)
            this.lead(midiToHz(n), t, step16 * m.len * 0.95, section === 'break' ? 0.05 : 0.08)
          }
        }

        this.nextTime += step16
        s.step++
      }
    },

    pad(freq, t, dur, vol) {
      const { ctx } = this
      const g = ctx.createGain()
      const f = ctx.createBiquadFilter()
      f.type = 'lowpass'
      f.frequency.setValueAtTime(this.song.style.cutoff * 0.5, t)
      f.frequency.linearRampToValueAtTime(this.song.style.cutoff, t + dur * 0.5)
      g.gain.setValueAtTime(0.0001, t)
      g.gain.linearRampToValueAtTime(vol, t + 0.25)
      g.gain.setValueAtTime(vol, t + dur - 0.3)
      g.gain.linearRampToValueAtTime(0.0001, t + dur)
      f.connect(g)
      g.connect(this.duck)
      g.connect(this.verbSend)
      ;[-7, 7].forEach((cents) => { // two slightly detuned oscillators = wide, warm chord
        const o = ctx.createOscillator()
        o.type = this.song.style.pad
        o.frequency.value = freq
        o.detune.value = cents
        o.connect(f)
        o.start(t)
        o.stop(t + dur + 0.05)
      })
    },

    bass(freq, t, dur) {
      const { ctx } = this
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      const f = ctx.createBiquadFilter()
      const trap = this.song.style.drums === 'trap' || this.song.style.bass === 'log'
      o.type = trap ? 'sine' : 'triangle'
      o.frequency.setValueAtTime(trap ? freq * 1.5 : freq, t)
      if (trap) o.frequency.exponentialRampToValueAtTime(freq, t + 0.08) // 808 glide
      f.type = 'lowpass'
      f.frequency.value = 600
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(trap ? 0.55 : 0.35, t + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      o.connect(f).connect(g).connect(this.duck)
      o.start(t)
      o.stop(t + dur + 0.05)
    },

    lead(freq, t, dur, vol) {
      const special = this.song.style.lead
      if (['sitar', 'harmonium', 'pluck', 'oud', 'marimba', 'supersaw'].includes(special)) return this.instrument(special, freq, t, dur, vol)
      const { ctx } = this
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      const f = ctx.createBiquadFilter()
      o.type = this.song.style.lead
      o.frequency.value = freq
      // gentle vibrato makes it sound less robotic
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      lfo.frequency.value = 5.5
      lfoGain.gain.value = freq * 0.004
      lfo.connect(lfoGain).connect(o.frequency)
      f.type = 'lowpass'
      f.frequency.value = this.song.style.cutoff * 1.4
      const peak = o.type === 'sine' || o.type === 'triangle' ? vol * 1.6 : vol * 0.6
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(peak, t + 0.015)
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.12)
      o.connect(f).connect(g)
      g.connect(this.bus)
      g.connect(this.verbSend)
      o.start(t); lfo.start(t)
      o.stop(t + dur + 0.2); lfo.stop(t + dur + 0.2)
    },

    // regional instruments, built from oscillators + filters
    instrument(kind, freq, t, dur, vol) {
      const { ctx } = this
      const g = ctx.createGain()
      const f = ctx.createBiquadFilter()
      g.connect(this.bus)
      g.connect(this.verbSend)
      const oscs = []
      const add = (type, mult = 1, detune = 0) => {
        const o = ctx.createOscillator()
        o.type = type
        o.frequency.value = freq * mult
        o.detune.value = detune
        o.connect(f)
        oscs.push(o)
        return o
      }
      let end = t + dur + 0.2
      if (kind === 'sitar') {
        // bright, nasal string with a "meend" (slide up into the note)
        const o = add('sawtooth')
        o.frequency.setValueAtTime(freq * 0.94, t)
        o.frequency.linearRampToValueAtTime(freq, t + 0.07)
        f.type = 'bandpass'; f.Q.value = 5
        f.frequency.setValueAtTime(freq * 6, t)
        f.frequency.exponentialRampToValueAtTime(freq * 2.5, t + 0.5)
        end = t + Math.max(dur, 0.7)
        g.gain.setValueAtTime(0.0001, t)
        g.gain.exponentialRampToValueAtTime(vol * 2.2, t + 0.01)
        g.gain.exponentialRampToValueAtTime(0.0001, end)
      } else if (kind === 'harmonium') {
        // reedy bellows sound: two detuned reeds, soft attack
        add('sawtooth', 1, -6); add('square', 1, 6)
        f.type = 'lowpass'; f.frequency.value = 1700
        g.gain.setValueAtTime(0.0001, t)
        g.gain.linearRampToValueAtTime(vol * 0.9, t + 0.05)
        g.gain.setValueAtTime(vol * 0.9, t + dur)
        g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.12)
      } else if (kind === 'pluck' || kind === 'oud') {
        // plucked string (ektara / guitar / oud)
        add(kind === 'oud' ? 'sawtooth' : 'triangle')
        oscs[0].frequency.setValueAtTime(freq * 1.01, t)
        oscs[0].frequency.exponentialRampToValueAtTime(freq, t + 0.05)
        f.type = 'lowpass'
        f.frequency.setValueAtTime(kind === 'oud' ? 2600 : 4000, t)
        f.frequency.exponentialRampToValueAtTime(kind === 'oud' ? 500 : 900, t + 0.3)
        end = t + 0.45
        g.gain.setValueAtTime(0.0001, t)
        g.gain.exponentialRampToValueAtTime(vol * (kind === 'oud' ? 1.6 : 2.4), t + 0.005)
        g.gain.exponentialRampToValueAtTime(0.0001, end)
      } else if (kind === 'marimba') {
        // wooden mallet: sine + bright overtone that dies fast
        add('sine'); add('sine', 4)
        f.type = 'lowpass'; f.frequency.value = 5000
        end = t + 0.35
        g.gain.setValueAtTime(0.0001, t)
        g.gain.exponentialRampToValueAtTime(vol * 2.6, t + 0.004)
        g.gain.exponentialRampToValueAtTime(0.0001, end)
      } else if (kind === 'supersaw') {
        // big euro-dance lead: 3 detuned saws
        add('sawtooth', 1, -14); add('sawtooth', 1, 0); add('sawtooth', 1, 14)
        f.type = 'lowpass'; f.frequency.value = this.song.style.cutoff
        g.gain.setValueAtTime(0.0001, t)
        g.gain.exponentialRampToValueAtTime(vol * 0.45, t + 0.01)
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.15)
      }
      f.connect(g)
      oscs.forEach((o) => { o.start(t); o.stop(end + 0.05) })
    },

    drone(freq, t, dur) {
      const { ctx } = this
      const o = ctx.createOscillator()
      const f = ctx.createBiquadFilter()
      const g = ctx.createGain()
      o.type = 'sawtooth'
      o.frequency.value = freq
      f.type = 'lowpass'
      f.frequency.value = 900
      g.gain.setValueAtTime(0.0001, t)
      g.gain.linearRampToValueAtTime(0.03, t + 0.6)
      g.gain.setValueAtTime(0.03, t + dur - 0.5)
      g.gain.linearRampToValueAtTime(0.0001, t + dur)
      o.connect(f).connect(g)
      g.connect(this.bus)
      g.connect(this.verbSend)
      o.start(t)
      o.stop(t + dur + 0.05)
    },

    // tabla "na" / dhol high side / afro rim
    tabla(t, rim = false) {
      const { ctx } = this
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.setValueAtTime(rim ? 900 : 380, t)
      o.frequency.exponentialRampToValueAtTime(rim ? 700 : 300, t + 0.06)
      g.gain.setValueAtTime(rim ? 0.18 : 0.32, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + (rim ? 0.05 : 0.16))
      o.connect(g).connect(this.bus)
      o.start(t)
      o.stop(t + 0.2)
      const n = ctx.createBufferSource() // finger slap
      n.buffer = this.noise
      const f = ctx.createBiquadFilter()
      f.type = 'bandpass'
      f.frequency.value = rim ? 4000 : 2500
      const ng = ctx.createGain()
      ng.gain.setValueAtTime(0.1, t)
      ng.gain.exponentialRampToValueAtTime(0.001, t + 0.03)
      n.connect(f).connect(ng).connect(this.bus)
      n.start(t, Math.random())
      n.stop(t + 0.05)
    },

    // group hand claps (three slightly spread hits)
    clap(t) {
      const { ctx } = this
      for (let i = 0; i < 3; i++) {
        const tt = t + i * 0.012
        const n = ctx.createBufferSource()
        n.buffer = this.noise
        const f = ctx.createBiquadFilter()
        f.type = 'bandpass'
        f.frequency.value = 1150
        f.Q.value = 1.2
        const g = ctx.createGain()
        g.gain.setValueAtTime(0.35, tt)
        g.gain.exponentialRampToValueAtTime(0.001, tt + 0.09)
        n.connect(f).connect(g)
        g.connect(this.bus)
        g.connect(this.verbSend)
        n.start(tt, Math.random())
        n.stop(tt + 0.1)
      }
    },

    kick(t) {
      const { ctx } = this
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      const hand = HAND_DRUMS.includes(this.song.style.drums) // dholak / dhol "dha" instead of a club kick
      o.frequency.setValueAtTime(hand ? 135 : 150, t)
      o.frequency.exponentialRampToValueAtTime(hand ? 72 : 42, t + (hand ? 0.18 : 0.12))
      g.gain.setValueAtTime(0.9, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
      o.connect(g).connect(this.bus)
      o.start(t)
      o.stop(t + 0.4)
      // duck the chords + bass for a moment (the "pumping" sound of modern pop)
      this.duck.gain.cancelScheduledValues(t)
      this.duck.gain.setValueAtTime(0.35, t)
      this.duck.gain.linearRampToValueAtTime(1, t + 0.22)
    },

    snare(t) {
      const { ctx } = this
      const n = ctx.createBufferSource()
      n.buffer = this.noise
      const f = ctx.createBiquadFilter()
      f.type = 'bandpass'
      f.frequency.value = 1800
      const g = ctx.createGain()
      const soft = this.song.style.drums === 'lofi' || this.song.style.drums === 'soft'
      g.gain.setValueAtTime(soft ? 0.25 : 0.45, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + (soft ? 0.12 : 0.2))
      n.connect(f).connect(g)
      g.connect(this.bus)
      g.connect(this.verbSend)
      n.start(t, Math.random())
      n.stop(t + 0.25)
      const o = ctx.createOscillator() // body of the snare
      const og = ctx.createGain()
      o.frequency.value = 190
      og.gain.setValueAtTime(0.2, t)
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
      o.connect(og).connect(this.bus)
      o.start(t)
      o.stop(t + 0.1)
    },

    hat(t, len, roll = false, vol = 0.12) {
      const { ctx } = this
      const hits = roll ? 3 : 1
      for (let i = 0; i < hits; i++) {
        const tt = t + i * (len / 1.5)
        const n = ctx.createBufferSource()
        n.buffer = this.noise
        const f = ctx.createBiquadFilter()
        f.type = 'highpass'
        f.frequency.value = 7500
        const g = ctx.createGain()
        g.gain.setValueAtTime(vol, tt)
        g.gain.exponentialRampToValueAtTime(0.001, tt + len)
        n.connect(f).connect(g).connect(this.bus)
        n.start(tt, Math.random())
        n.stop(tt + len + 0.02)
      }
    },

    startCrackle() {
      const { ctx } = this
      const n = ctx.createBufferSource()
      n.buffer = this.noise
      n.loop = true
      const f = ctx.createBiquadFilter()
      f.type = 'bandpass'
      f.frequency.value = 3000
      f.Q.value = 0.6
      const g = ctx.createGain()
      g.gain.value = 0.018
      n.connect(f).connect(g).connect(this.bus)
      n.start()
      this.crackle = n
      // random vinyl pops
      this.popTimer = setInterval(() => {
        if (ctx.state !== 'running' || Math.random() > 0.5) return
        const p = ctx.createBufferSource()
        p.buffer = this.noise
        const pg = ctx.createGain()
        const t = ctx.currentTime + Math.random() * 0.2
        pg.gain.setValueAtTime(0.12, t)
        pg.gain.exponentialRampToValueAtTime(0.001, t + 0.008)
        p.connect(pg).connect(this.bus)
        p.start(t, Math.random())
        p.stop(t + 0.01)
      }, 180)
    },

    // ---------- your own files ----------
    playFile(url) {
      this.init()
      this.stopAll()
      this.mode = 'file'
      this.audioEl.src = url
      this.ctx.resume()
      return this.audioEl.play()
    },

    // ---------- shared controls ----------
    stopAll() {
      clearInterval(this.timer)
      clearInterval(this.popTimer)
      this.song = null
      if (this.crackle) { try { this.crackle.stop() } catch { /* already stopped */ } this.crackle = null }
      if (this.audioEl) this.audioEl.pause()
      this.mode = 'none'
    },
    pause() {
      if (this.mode === 'file') this.audioEl.pause()
      else if (this.ctx) this.ctx.suspend()
    },
    resume() {
      if (!this.ctx) return
      this.ctx.resume()
      if (this.mode === 'file') this.audioEl.play()
    },
    seek(seconds) { if (this.mode === 'file') this.audioEl.currentTime = seconds },
    fileTime() { return this.mode === 'file' ? this.audioEl.currentTime : null },
    volume(v) { if (this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.03) },
    setEQ(gains) { if (this.eq) gains.forEach((g, i) => { this.eq[i].gain.value = g }) },
    setCrackle(on) {
      this.crackleOn = on
      if (!on && this.crackle) { this.crackle.stop(); this.crackle = null; clearInterval(this.popTimer) }
      else if (on && !this.crackle && this.song && this.song.style.crackle) this.startCrackle()
    },

    /** 0..1 loudness, used by the 3D orb */
    level() {
      if (!this.analyser || this.ctx.state !== 'running') return 0
      this.analyser.getByteFrequencyData(this.data)
      let sum = 0
      for (let i = 1; i < 12; i++) sum += this.data[i]
      return Math.min(1, sum / (11 * 190))
    },
  }

  engine.EQ_BANDS = EQ_BANDS
  window.MusicEngine = engine
})()
