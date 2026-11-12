/* =========================================================
   VYBE motion engine (no libraries, ~3.5 KB gzipped)
   - Reveals:   IntersectionObserver adds .is-in (CSS does the animation)
   - Parallax:  ONE requestAnimationFrame loop, only for elements on screen
   - Micro:     magnetic buttons, cursor spotlight, heart burst, scroll bar,
                marquee that speeds up with scroll velocity
   - Pages:     View Transitions API (with fallback)
   - Calm mode: OS "reduce motion" or Settings → Animations: Calm
   Public API: window.Motion.refresh() · Motion.transition(fn) · Motion.setCalm(bool)
   ========================================================= */
;(function () {
  const root = document.documentElement
  const osReduce = window.matchMedia('(prefers-reduced-motion: reduce)')
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
  const saved = (() => { try { return JSON.parse(localStorage.getItem('vybe-settings')) || {} } catch { return {} } })()
  let calm = saved.motion ? saved.motion === 'calm' : osReduce.matches
  root.classList.toggle('m-calm', calm)
  if (document.startViewTransition) root.classList.add('m-vt')

  // ---------- what gets which motion (selectors = the motion "library") ----------
  const REVEAL = '.shelf-head, .spotlight, .page-head, .dropzone, .profile-hero, .artist-hero, .auth-card, .world-note, .notice'
  const STAGGER = '.tiles, .quick-grid, .trending, .artist-grid, .album-grid, .cat-albums, .cat-songs, .stats-grid, .profile-picker, .lyrics'
  const SPLIT = '[data-m-split]'
  const MAGNETIC = '.btn-lime, .btn-hot, .ctrl-main, .icon-btn, .btn-cat'
  const PARALLAX = [
    ['#spot-bg', 0.18],
    ['.tile img', 0.1],
    ['.hero .hero-sub', -0.06],
    ['.artist-pic.big', 0.08],
    ['.profile-avatar.big', 0.08],
  ]

  // ---------- 1. reveals ----------
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return
      e.target.classList.add('is-in')
      revealIO.unobserve(e.target) // reveal once, then forget it (no work later)
    })
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })

  function splitText(el) {
    const text = el.textContent.trim()
    if (el.dataset.mSplitDone === text) return
    el.dataset.mSplitDone = text
    el.setAttribute('aria-label', text) // screen readers read the whole title once
    let ci = 0
    el.innerHTML = text.split(/(\s+)/).map((w) => (/^\s+$/.test(w) ? ' '
      : `<span class="m-word" aria-hidden="true">${[...w].map((ch) => `<span class="m-char" style="--ci:${ci++}">${ch.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>`).join('')}</span>`)).join('')
    el.classList.add('m-split')
    el.classList.remove('is-in')
    revealIO.observe(el)
  }

  function scanReveals(scope = document) {
    scope.querySelectorAll(REVEAL).forEach((el) => {
      if (el.closest('.hero') || el.dataset.mSeen) return
      el.dataset.mSeen = '1'
      el.classList.add('m-reveal')
      revealIO.observe(el)
    })
    scope.querySelectorAll(STAGGER).forEach((el) => {
      if (el.dataset.mSeen) return
      el.dataset.mSeen = '1'
      ;[...el.children].forEach((c, i) => { if (!c.style.getPropertyValue('--i')) c.style.setProperty('--i', i) })
      el.classList.add('m-stagger')
      revealIO.observe(el)
    })
    scope.querySelectorAll(SPLIT).forEach(splitText)
  }

  // ---------- 2. parallax: one rAF loop, only visible elements ----------
  const visible = new Map() // element -> speed
  const parallaxIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) visible.set(e.target, Number(e.target.dataset.mParallax))
      else visible.delete(e.target)
    })
    requestTick()
  }, { rootMargin: '120px 0px' })

  function scanParallax() {
    PARALLAX.forEach(([sel, speed]) => document.querySelectorAll(sel).forEach((el) => {
      if (el.dataset.mParallax) return
      el.dataset.mParallax = speed
      parallaxIO.observe(el)
    }))
  }

  // ---------- 3. scroll-linked effects share the same frame ----------
  const progress = document.createElement('div')
  progress.className = 'm-progress'
  progress.setAttribute('aria-hidden', 'true')
  document.body.append(progress)
  let ticking = false
  let lastY = window.scrollY
  let velocity = 0
  function requestTick() {
    if (ticking) return
    ticking = true
    requestAnimationFrame(frame)
  }
  function frame() {
    ticking = false
    const y = window.scrollY
    velocity = velocity * 0.85 + (y - lastY) * 0.15
    lastY = y
    const max = document.documentElement.scrollHeight - innerHeight
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`
    if (!calm) {
      // read all positions first, then write (avoids layout thrashing)
      const reads = []
      visible.forEach((speed, el) => {
        const box = (el.parentElement || el).getBoundingClientRect()
        reads.push([el, (box.top + box.height / 2 - innerHeight / 2) * speed])
      })
      reads.forEach(([el, offset]) => { el.style.translate = `0 ${offset.toFixed(1)}px` })
      // marquee speeds up while you scroll, then settles
      const anim = marqueeAnim()
      if (anim) anim.playbackRate = 1 + Math.min(Math.abs(velocity) / 8, 4)
    }
    if (Math.abs(velocity) > 0.05) requestTick() // keep easing velocity back to 0
  }
  let marquee = null
  const marqueeAnim = () => {
    if (!marquee || !marquee.isConnected) marquee = document.querySelector('.marquee-track')
    return marquee && marquee.getAnimations ? marquee.getAnimations()[0] : null
  }
  window.addEventListener('scroll', requestTick, { passive: true })
  window.addEventListener('resize', requestTick)

  // ---------- 4. micro-interactions ----------
  // magnetic buttons (mouse only)
  document.addEventListener('pointermove', (e) => {
    if (calm || !finePointer.matches) return
    const btn = e.target.closest && e.target.closest(MAGNETIC)
    if (btn) {
      const r = btn.getBoundingClientRect()
      btn.dataset.mMagnetic = ''
      btn.classList.add('is-pulling')
      btn.style.translate = `${((e.clientX - r.left) / r.width - 0.5) * 10}px ${((e.clientY - r.top) / r.height - 0.5) * 8}px`
    }
    // cursor spotlight on cards
    const card = e.target.closest && e.target.closest('.song, .stats-grid li, .auth-card, .np-next button')
    if (card) {
      const r = card.getBoundingClientRect()
      card.style.setProperty('--sx', `${e.clientX - r.left}px`)
      card.style.setProperty('--sy', `${e.clientY - r.top}px`)
    }
  }, { passive: true })
  document.addEventListener('pointerout', (e) => {
    const btn = e.target.closest && e.target.closest(MAGNETIC)
    if (btn && !btn.contains(e.relatedTarget)) { btn.classList.remove('is-pulling'); btn.style.translate = '' }
  })

  // heart burst when you like a song
  document.addEventListener('click', (e) => {
    const like = e.target.closest && e.target.closest('.like:not(.del)')
    if (!like || calm || like.getAttribute('aria-pressed') !== 'false') return
    const r = like.getBoundingClientRect()
    const x = r.left + r.width / 2
    const y = r.top + r.height / 2
    for (let i = 0; i < 8; i++) {
      const h = document.createElement('span')
      h.className = 'm-burst'
      h.textContent = i % 2 ? '♥' : '✦'
      h.setAttribute('aria-hidden', 'true')
      const a = (i / 8) * Math.PI * 2
      h.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(a) * 38}px;--dy:${Math.sin(a) * 38}px;--rot:${(Math.random() - 0.5) * 90}deg`
      document.body.append(h)
      h.addEventListener('animationend', () => h.remove())
    }
  }, true)

  // ---------- 5. page transitions ----------
  let slowVT = false // set if this device takes too long to snapshot the page
  function transition(update) {
    if (calm || slowVT || !document.startViewTransition) { update(); return }
    // failsafe: the page must change even if the browser skips or delays the transition
    let done = false
    const run = () => { if (!done) { done = true; update() } }
    const t0 = performance.now()
    try {
      const vt = document.startViewTransition(run)
      ;[vt.ready, vt.finished, vt.updateCallbackDone].forEach((p) => p && p.catch(() => {}))
      vt.updateCallbackDone.then(() => { if (performance.now() - t0 > 450) slowVT = true }).catch(() => {})
    } catch { run() }
    setTimeout(run, 350)
  }

  // ---------- public API ----------
  function refresh() {
    scanReveals()
    scanParallax()
    requestTick()
  }
  function setCalm(on) {
    calm = on
    root.classList.toggle('m-calm', on)
    if (on) document.querySelectorAll('[data-m-parallax]').forEach((el) => { el.style.translate = '' })
    requestTick()
  }
  osReduce.addEventListener('change', (e) => { if (!saved.motion) setCalm(e.matches) })

  // replay a split headline (used when you come back to a page)
  function replay(el) {
    if (!el || !el.classList.contains('m-split')) return
    el.classList.remove('is-in')
    void el.offsetWidth // restart the transition
    revealIO.observe(el)
  }

  window.Motion = { refresh, transition, setCalm, replay, get calm() { return calm } }
  if (document.readyState !== 'loading') refresh()
  else document.addEventListener('DOMContentLoaded', refresh)
})()
