/* =========================================================
   VYBE 3D scene, built with Three.js.
   - A spinning 3D vinyl record with a tonearm that drops when music plays
   - A big glossy 3D ♫ note + small notes orbiting the record
   - A field of floating particles
   - Mouse parallax + scroll-driven camera
   Falls back to the CSS background if WebGL is missing or the
   visitor prefers reduced motion (progressive enhancement).

   Performance & battery (Settings → 3D quality):
   - High: full resolution, 60 fps
   - Battery saver: lower resolution, fewer particles, simpler orb, 30 fps
   - Off: no WebGL at all (CSS background only)
   - Auto: starts High, drops to Battery saver when the frame rate
     falls or the battery is low and not charging
   Rendering also pauses when the tab is hidden or the full-screen
   player covers the scene, and slows down once you scroll past the hero.
   ========================================================= */
import * as THREE from 'three'

const canvas = document.getElementById('scene')
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const isSmall = window.innerWidth < 760

function webglAvailable() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch { return false }
}

const stats = (detail) => window.dispatchEvent(new CustomEvent('vybe:stats', { detail }))
let choice = (window.VYBE_SETTINGS && window.VYBE_SETTINGS.quality) || 'auto'
let api = null // set once the scene has started

function goOff() {
  document.body.classList.add('no-3d')
  document.body.classList.remove('has-3d')
  if (api) api.stop()
  stats({ fps: 0, level: 'off' })
}

if (!webglAvailable()) {
  document.body.classList.add('no-3d')
  stats({ fps: 0, level: 'off' })
  window.addEventListener('vybe:quality', () => stats({ fps: 0, level: 'off', reason: 'WebGL not supported' }))
} else {
  // "reduce motion" users start with 3D off, but can switch it on in Settings
  if (choice === 'off' || (reduceMotion && choice === 'auto')) goOff()
  else api = start()
  window.addEventListener('vybe:quality', (e) => {
    choice = e.detail
    if (choice === 'off') return goOff()
    document.body.classList.remove('no-3d')
    if (!api) api = start()
    else api.resume()
    api.setLevel(choice === 'low' ? 'low' : 'high', choice === 'auto' ? 'auto' : '')
  })
}

function start() {
  document.body.classList.add('has-3d')

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isSmall, alpha: true, powerPreference: 'default' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmall ? 1.25 : 1.75))
  renderer.setSize(window.innerWidth, window.innerHeight)

  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x07021a, 0.035)
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.set(0, 0, 9)

  // ---------- mood colours ----------
  const palette = { all: [new THREE.Color('#ff2e93'), new THREE.Color('#8b5cf6'), new THREE.Color('#22d3ee')] }
  const paletteCache = {}
  const getPalette = (key, hexes) => (paletteCache[key] ||= hexes.map((h) => new THREE.Color(h)))

  // ---------- lights (the record and the notes use real, shiny materials) ----------
  scene.add(new THREE.AmbientLight(0xffffff, 0.45))
  const sun = new THREE.DirectionalLight(0xffffff, 1.6)
  sun.position.set(2, 5, 6)
  scene.add(sun)
  const keyLight = new THREE.PointLight(0xff2e93, 60, 40)
  keyLight.position.set(4, 3, 5)
  const rimLight = new THREE.PointLight(0x22d3ee, 50, 40)
  rimLight.position.set(-5, -2, 4)
  scene.add(keyLight, rimLight)

  const group = new THREE.Group() // everything that floats in the hero
  scene.add(group)

  // ---------- 1. glowing halo behind the record ----------
  const haloCanvas = document.createElement('canvas')
  haloCanvas.width = haloCanvas.height = 256
  const hg = haloCanvas.getContext('2d')
  const grad = hg.createRadialGradient(128, 128, 0, 128, 128, 128)
  grad.addColorStop(0, 'rgba(255,255,255,0.9)')
  grad.addColorStop(0.35, 'rgba(255,255,255,0.35)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  hg.fillStyle = grad
  hg.fillRect(0, 0, 256, 256)
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(haloCanvas), color: 0xff2e93, transparent: true, opacity: 0.45,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }))
  halo.position.z = -1.2
  group.add(halo)

  // ---------- 2. the 3D vinyl record (grooves + VYBE label drawn on a canvas) ----------
  const recCanvas = document.createElement('canvas')
  recCanvas.width = recCanvas.height = 1024
  const recTex = new THREE.CanvasTexture(recCanvas)
  recTex.colorSpace = THREE.SRGBColorSpace
  recTex.anisotropy = 8
  function drawRecord([c1, c2, c3]) {
    const g = recCanvas.getContext('2d')
    const S = 1024
    const C = S / 2
    g.clearRect(0, 0, S, S)
    g.fillStyle = '#08080d'
    g.beginPath(); g.arc(C, C, C, 0, Math.PI * 2); g.fill()
    // grooves
    for (let r = C * 0.36; r < C * 0.985; r += 2.6) {
      g.strokeStyle = `rgba(255,255,255,${0.03 + (Math.round(r) % 7 === 0 ? 0.035 : 0)})`
      g.lineWidth = 1
      g.beginPath(); g.arc(C, C, r, 0, Math.PI * 2); g.stroke()
    }
    // gaps between "tracks"
    ;[0.52, 0.66, 0.8, 0.92].forEach((f) => {
      g.strokeStyle = 'rgba(0,0,0,0.95)'
      g.lineWidth = 6
      g.beginPath(); g.arc(C, C, C * f, 0, Math.PI * 2); g.stroke()
    })
    // coloured label
    const lab = g.createLinearGradient(C - C * 0.34, C - C * 0.34, C + C * 0.34, C + C * 0.34)
    lab.addColorStop(0, c1); lab.addColorStop(0.55, c2); lab.addColorStop(1, c3)
    g.fillStyle = lab
    g.beginPath(); g.arc(C, C, C * 0.34, 0, Math.PI * 2); g.fill()
    g.strokeStyle = 'rgba(255,255,255,0.5)'
    g.lineWidth = 4
    g.beginPath(); g.arc(C, C, C * 0.3, 0, Math.PI * 2); g.stroke()
    g.fillStyle = '#ffffff'
    g.textAlign = 'center'
    g.font = '900 86px "Unbounded", system-ui, sans-serif'
    g.fillText('VYBE', C, C - 34)
    g.font = '600 26px "Space Grotesk", system-ui, sans-serif'
    g.fillText('SIDE A  ·  33⅓ RPM', C, C + 70)
    g.fillText('♪  ♫  ♪', C, C + 112)
    // spindle hole
    g.fillStyle = '#d9d9e3'
    g.beginPath(); g.arc(C, C, 16, 0, Math.PI * 2); g.fill()
    g.fillStyle = '#111'
    g.beginPath(); g.arc(C, C, 9, 0, Math.PI * 2); g.fill()
    recTex.needsUpdate = true
  }
  drawRecord(['#ff2e93', '#8b5cf6', '#22d3ee'])
  document.fonts?.ready.then(() => drawRecord(currentHexes)) // redraw once the brand font has loaded

  const deck = new THREE.Group() // tilted so you see the record face in 3D
  deck.rotation.set(1.05, -0.25, 0.12)
  group.add(deck)
  const discMats = [
    new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.3, metalness: 0.6 }), // edge
    new THREE.MeshStandardMaterial({ map: recTex, roughness: 0.28, metalness: 0.35 }),    // top face
    new THREE.MeshStandardMaterial({ color: 0x0b0b10, roughness: 0.4, metalness: 0.5 }),  // bottom
  ]
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 0.08, 128, 1), discMats)
  deck.add(disc)

  // tonearm: swings onto the record when music plays
  const metal = new THREE.MeshStandardMaterial({ color: 0xd9dbe6, roughness: 0.25, metalness: 0.95 })
  const armPivot = new THREE.Group()
  armPivot.position.set(1.85, 0.2, -1.65)
  deck.add(armPivot)
  const armBase = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.3, 32), metal)
  armBase.position.y = -0.05
  armPivot.add(armBase)
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.4, 16), metal)
  arm.rotation.x = Math.PI / 2
  arm.position.set(0, 0.12, 1.2)
  armPivot.add(arm)
  const armHead = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.09, 0.36), new THREE.MeshStandardMaterial({ color: 0xff2e93, roughness: 0.35, metalness: 0.5 }))
  armHead.position.set(0, 0.06, 2.42)
  armPivot.add(armHead)
  const ARM_REST = 0.18
  const ARM_PLAY = -0.36
  armPivot.rotation.y = ARM_REST

  // ---------- 3. 3D music notes (♫) built from extruded shapes ----------
  function noteGeometries() {
    const heads = [0, 1].map((i) => {
      const sh = new THREE.Shape()
      sh.absellipse(i * 1.3, i * 0.35, 0.44, 0.31, 0, Math.PI * 2, false, 0.38)
      return sh
    })
    const body = new THREE.Shape()
    ;[[0.32, 0.05], [0.46, 0.05], [0.46, 1.86], [1.62, 2.2], [1.62, 0.4], [1.76, 0.4], [1.76, 2.62], [0.32, 2.28]]
      .forEach(([x, y], i) => (i ? body.lineTo(x, y) : body.moveTo(x, y)))
    const bevel = { bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.04, bevelSegments: 4, curveSegments: 32 }
    const headGeo = new THREE.ExtrudeGeometry(heads, { depth: 0.34, ...bevel })
    const bodyGeo = new THREE.ExtrudeGeometry(body, { depth: 0.24, ...bevel })
    headGeo.translate(-0.88, -1.3, -0.17)
    bodyGeo.translate(-0.88, -1.3, -0.12)
    return [headGeo, bodyGeo]
  }
  const [headGeo, bodyGeo] = noteGeometries()
  function makeNote(color) {
    const mat = new THREE.MeshPhysicalMaterial({ color, emissive: color, emissiveIntensity: 0.25, roughness: 0.18, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.1 })
    const g = new THREE.Group()
    g.add(new THREE.Mesh(headGeo, mat), new THREE.Mesh(bodyGeo, mat))
    g.userData.mat = mat
    return g
  }
  const bigNote = makeNote(0xff2e93)
  bigNote.scale.setScalar(0.72)
  bigNote.position.set(-1.25, 1.9, 1.1)
  group.add(bigNote)

  // small notes orbiting the record
  const minis = []
  for (let i = 0; i < 6; i++) {
    const n = makeNote(i % 2 ? 0x22d3ee : 0x8b5cf6)
    n.scale.setScalar(0.22 + (i % 3) * 0.05)
    n.userData.phase = (i / 6) * Math.PI * 2
    n.userData.radius = 2.9 + (i % 2) * 0.45
    minis.push(n)
    group.add(n)
  }

  // ---------- 4. radial equalizer behind the record ----------
  const BAR_COUNT = isSmall ? 40 : 72
  const barGeo = new THREE.BoxGeometry(0.06, 1, 0.06)
  barGeo.translate(0, 0.5, 0)
  const bars = new THREE.InstancedMesh(barGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }), BAR_COUNT)
  bars.position.z = -0.6
  const dummy = new THREE.Object3D()
  group.add(bars)

  let currentHexes = ['#ff2e93', '#8b5cf6', '#22d3ee']
  let lastMood = 'all'
  let spin = 0

  // ---------- particle field ----------
  const COUNT = isSmall ? 900 : 2200
  const positions = new Float32Array(COUNT * 3)
  const colors = new Float32Array(COUNT * 3)
  const tmp = new THREE.Color()
  for (let i = 0; i < COUNT; i++) {
    const r = 6 + Math.random() * 22
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    positions.set([r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta) * 0.6, r * Math.cos(phi) - 6], i * 3)
    tmp.copy(palette.all[i % 3]).lerp(new THREE.Color('#ffffff'), Math.random() * 0.5)
    colors.set([tmp.r, tmp.g, tmp.b], i * 3)
  }
  const starGeo = new THREE.BufferGeometry()
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    size: 0.06, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending,
  }))
  scene.add(stars)

  // ---------- interaction ----------
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 }
  window.addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1
  }, { passive: true })

  let scrollT = 0
  // as you scroll into the music, the orb drifts back and dims so text stays readable
  const onScroll = () => {
    scrollT = Math.min(1, window.scrollY / window.innerHeight)
    canvas.style.opacity = String(1 - scrollT * 0.5)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  function layout() {
    const w = window.innerWidth
    renderer.setSize(w, window.innerHeight)
    camera.aspect = w / window.innerHeight
    camera.updateProjectionMatrix()
  }
  window.addEventListener('resize', layout)

  // ---------- animation loop ----------
  const clock = new THREE.Clock()
  let level = 0
  // ---------- quality levels ----------
  let qLevel = 'high'
  let reason = ''
  function setLevel(next, why = '') {
    qLevel = next
    reason = why
    const low = qLevel === 'low'
    renderer.setPixelRatio(low ? Math.min(window.devicePixelRatio, isSmall ? 0.8 : 1) : Math.min(window.devicePixelRatio, isSmall ? 1.25 : 1.75))
    renderer.setSize(window.innerWidth, window.innerHeight)
    minis.forEach((n, i) => { n.visible = !low || i < 3 })
    starGeo.setDrawRange(0, low ? Math.floor(COUNT * 0.35) : COUNT)
    bars.count = low ? Math.floor(BAR_COUNT / 2) : BAR_COUNT
  }
  if (choice === 'low' || (choice === 'auto' && (isSmall || navigator.connection?.saveData))) setLevel('low', choice === 'auto' ? 'small screen' : '')

  // Auto mode: watch the battery
  if (navigator.getBattery) {
    navigator.getBattery().then((bat) => {
      const check = () => {
        if (choice !== 'auto') return
        if (!bat.charging && bat.level <= 0.2) setLevel('low', 'battery low')
        else if (reason === 'battery low') setLevel('high')
      }
      bat.addEventListener('levelchange', check)
      bat.addEventListener('chargingchange', check)
      check()
    }).catch(() => {})
  }

  // ---------- loop control ----------
  let running = true
  let stopped = false
  let rafId = 0
  const kick = () => { cancelAnimationFrame(rafId); clock.getDelta(); rafId = requestAnimationFrame(tick) }
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden
    if (running && !stopped) kick()
  })

  let lastFrame = 0
  let frames = 0
  let fpsWindowStart = performance.now()
  let slowWindows = 0
  let shownFps = 0

  function tick(now) {
    if (!running || stopped) return
    rafId = requestAnimationFrame(tick)

    // skip work while the full-screen player covers the scene
    if (document.body.classList.contains('np-open')) return

    // frame cap: 60 fps on High, 30 fps on Battery saver or once you scroll past the hero
    const cap = qLevel === 'low' || scrollT >= 1 ? 30 : 60
    if (now - lastFrame < 1000 / cap - 2) return
    lastFrame = now

    // FPS monitor (Auto drops to Battery saver if the device struggles)
    frames++
    if (now - fpsWindowStart > 2000) {
      shownFps = Math.round((frames * 1000) / (now - fpsWindowStart))
      if (choice === 'auto' && qLevel === 'high' && cap === 60) {
        slowWindows = shownFps < 40 ? slowWindows + 1 : 0
        if (slowWindows >= 2) setLevel('low', 'frame rate was low')
      }
      stats({ fps: shownFps, level: qLevel, reason })
      frames = 0
      fpsWindowStart = now
    }

    const dt = Math.min(clock.getDelta(), 0.05)
    const t = clock.elapsedTime
    const vybe = window.VYBE || { level: () => 0, mood: 'all', playing: false }

    // smooth audio level (a gentle "idle" breathing when nothing plays)
    const target = vybe.playing ? vybe.level() : 0.06 + Math.sin(t * 1.5) * 0.03
    level += (target - level) * 0.18

    // mood colours: label is redrawn when the mood changes, materials ease towards it
    const hexes = vybe.colors || ['#ff2e93', '#8b5cf6', '#22d3ee']
    if (vybe.mood !== lastMood) { lastMood = vybe.mood; currentHexes = hexes; drawRecord(hexes) }
    const pal = vybe.colors ? getPalette(vybe.mood, vybe.colors) : palette.all
    bigNote.userData.mat.color.lerp(pal[0], 0.05)
    bigNote.userData.mat.emissive.lerp(pal[0], 0.05)
    minis.forEach((n, i) => { n.userData.mat.color.lerp(pal[1 + (i % 2)], 0.05); n.userData.mat.emissive.lerp(pal[1 + (i % 2)], 0.05) })
    keyLight.color.lerp(pal[0], 0.05)
    rimLight.color.lerp(pal[2], 0.05)
    halo.material.color.lerp(pal[0], 0.05)
    armHead.material.color.lerp(pal[0], 0.05)
    bars.material.color.lerp(pal[2], 0.05)

    // record spins up / slows down like a real turntable
    spin += ((vybe.playing ? 2.2 : 0.25) - spin) * 0.03
    disc.rotation.y -= spin * dt
    armPivot.rotation.y += ((vybe.playing ? ARM_PLAY : ARM_REST) - armPivot.rotation.y) * 0.04
    deck.rotation.x = 1.05 + Math.sin(t * 0.6) * 0.04 - mouse.y * 0.12
    deck.rotation.z = 0.12 + mouse.x * 0.1

    // big ♫ floats, sways and bounces to the beat
    bigNote.position.y = 1.9 + Math.sin(t * 1.6) * 0.16 + level * 0.3
    bigNote.rotation.y = Math.sin(t * 0.8) * 0.5
    bigNote.rotation.z = 0.18 + Math.sin(t * 1.1) * 0.08
    bigNote.scale.setScalar(0.72 * (1 + level * 0.22))

    // small notes orbit on a tilted ring
    minis.forEach((n) => {
      const a = n.userData.phase + t * (vybe.playing ? 0.55 : 0.2)
      const r = n.userData.radius
      n.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.45 + Math.sin(t * 2 + n.userData.phase) * 0.15, Math.sin(a) * 1.4)
      n.rotation.y = a + Math.PI / 2
      n.rotation.z = Math.sin(t + n.userData.phase) * 0.3
    })

    // glow pulses with the music
    halo.material.opacity = 0.32 + level * 0.55
    halo.scale.setScalar(1 + level * 0.35)
    keyLight.intensity = 50 + level * 90

    // radial equalizer
    for (let i = 0; i < BAR_COUNT; i++) {
      const a = (i / BAR_COUNT) * Math.PI * 2 + t * 0.15
      const wave = 0.5 + 0.5 * Math.sin(t * 7 + i * 0.9) * Math.cos(t * 3.1 + i * 0.37)
      const h = 0.12 + level * (0.4 + wave) * 1.3
      dummy.position.set(Math.cos(a) * 2.55, Math.sin(a) * 2.55, 0)
      dummy.rotation.set(0, 0, a - Math.PI / 2)
      dummy.scale.set(1, h, 1)
      dummy.updateMatrix()
      bars.setMatrixAt(i, dummy.matrix)
    }
    bars.instanceMatrix.needsUpdate = true
    bars.material.opacity = 0.25 + level * 0.7

    // stars drift and pulse
    stars.rotation.y += dt * 0.02
    stars.rotation.x = Math.sin(t * 0.05) * 0.1
    stars.material.size = 0.05 + level * 0.05

    // camera: mouse parallax + scroll moves orb up and away
    mouse.x += (mouse.tx - mouse.x) * 0.05
    mouse.y += (mouse.ty - mouse.y) * 0.05
    const wide = window.innerWidth > 1000
    const baseX = wide ? -2.6 : 0          // orb sits to the right of the hero text on desktop
    camera.position.x = baseX + mouse.x * 0.8 + scrollT * (wide ? -1.2 : 0)
    camera.position.y = -mouse.y * 0.5 - scrollT * 1.8
    camera.position.z = (wide ? 9 : 13) + scrollT * 5
    // on phones the orb sits higher up so it doesn't cover the text
    camera.lookAt(baseX + scrollT * (wide ? -1.2 : 0), (wide ? 0 : -2.4) - scrollT * 0.6, 0)
    group.rotation.y = mouse.x * 0.12
    group.scale.setScalar(1 + level * 0.06)

    renderer.render(scene, camera)
  }
  rafId = requestAnimationFrame(tick)
  stats({ fps: 0, level: qLevel, reason })

  return {
    setLevel,
    stop() { stopped = true; cancelAnimationFrame(rafId) },
    resume() { document.body.classList.add('has-3d'); if (stopped) { stopped = false; kick() } },
  }
}
