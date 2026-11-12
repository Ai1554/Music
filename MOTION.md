# VYBE Motion System

This is the plan and the reference for VYBE's "Shopify-style" motion. It is built as a framework-free module: `motion.css` holds the tokens and motion classes, and `motion.js` is a small engine with no dependencies (about 3.5 KB gzipped).

> **Why not React or GSAP here?** VYBE is a plain HTML/CSS/JS site with no build step. Rewriting it in React during a 3-hour competition would risk breaking a working site and gain nothing for the user. The design is still framework-agnostic: CSS does the animating, and JS only toggles classes or sets one property per frame. The React mapping is in §8.

---

## 1. Scope and constraints
| Target | Budget |
| --- | --- |
| Frame rate | 60 fps on mid-range laptops and phones; never below 30 fps (the 3D scene drops to Battery saver automatically) |
| JS added for motion | ≤ 5 KB gzipped, with no animation library (actual: ~3.5 KB) |
| CSS added | ≤ 4 KB gzipped (actual: ~2.4 KB) |
| Animated properties | `transform`, `translate`, `scale`, `rotate` and `opacity` only. No animated `top`, `left`, `width`, `height` or `box-shadow` on scroll |
| Main-thread work while scrolling | 1 `requestAnimationFrame` callback; all reads happen before all writes |
| Browsers | Latest Chrome, Edge, Safari and Firefox. View Transitions and `linear()` easing are progressive extras, and older browsers get instant page changes and a simpler curve |

## 2. Motion principles
1. **Motion explains.** Things enter from where they come from. Pages slide up, the player rises from the bottom and the sidebar slides in from the left.
2. **Fast in, gentle out.** One house curve, `--m-ease-out` (expo out), is used everywhere. `--m-ease-in` is only for exits.
3. **Reveal once.** Sections animate the first time you see them, then stay still. Lists that re-render (likes, search) never replay.
4. **Music drives the big motion.** The record, the notes and the equalizer react to the audio. The UI chrome stays calm.
5. **The user is in control.** Calm mode turns motion off with one tap, and it's automatic when the OS asks for reduced motion.

## 3. Tokens (`motion.css`)
| Token | Value | Used for |
| --- | --- | --- |
| `--m-dur-xs` | 120ms | Press feedback |
| `--m-dur-s` | 220ms | Hovers, toggles |
| `--m-dur-m` | 420ms | Small entrances, magnetic spring-back |
| `--m-dur-l` | 760ms | Section reveals |
| `--m-dur-xl` | 1100ms | Headlines (split text) |
| `--m-ease-out` | `cubic-bezier(.16,1,.3,1)` | The default for everything |
| `--m-ease-in` | `cubic-bezier(.7,0,.84,0)` | Page exit only |
| `--m-ease-spring` | `linear(…)` spring | Magnetic buttons, logo |
| `--m-rise` | 28px | Reveal distance |
| `--m-stagger` | 45ms | Delay between list items (capped at 14 items) |

**Naming conventions**
- `--m-*`: motion tokens.
- `.m-*`: motion classes added by the engine (`.m-reveal`, `.m-stagger`, `.m-split`, `.m-burst`, `.m-progress`).
- `data-m-*`: opt-in hooks in HTML (`data-m-split`, `data-m-parallax="0.18"`, `data-m-magnetic`).
- `.is-in`: the state class that means "this has been revealed".
- `@keyframes m-*`: motion keyframes (`m-drop`, `m-slide-in`, `m-page-in`…).

## 4. Motion component library
| Component | How | Where in VYBE |
| --- | --- | --- |
| **Header reveal** | CSS keyframes with a stagger, run once on load | Top bar, logo spin-in, sidebar links, player bar |
| **Scroll reveal** | `.m-reveal` plus an IntersectionObserver that adds `.is-in`, then stops watching | Section headers, spotlight, auth cards, profile and artist heroes |
| **Stagger reveal** | `.m-stagger`: children cascade in using `--i` | Tiles, song grids, trending, artists, albums, stats, lyrics |
| **Split-text headline** | Words are masked and letters rise in with a slight rotate. `aria-label` keeps the real text for screen readers | Page titles (`data-m-split`), replayed on each visit |
| **Parallax** | A single rAF loop moves only the elements on screen | Spotlight background, mood tile photos, hero subtitle, artist and profile avatars |
| **Scroll velocity** | The marquee's `playbackRate` follows scroll speed (Web Animations API) | The Gen Z marquee speeds up as you scroll |
| **Scroll progress** | A 3px gradient bar using `transform: scaleX()` | The top edge of the page |
| **Page transition** | View Transitions API: the old page fades up and blurs out, the new one rises in, and the top bar, sidebar, player and 3D canvas stay fixed | Every route change |
| **Magnetic button** | The button drifts toward the cursor (mouse only) and springs back | Main CTAs, the play button, settings |
| **Cursor spotlight** | A radial highlight follows the pointer (`--sx`/`--sy`) | Song rows, stat cards, auth card |
| **Press feedback** | `:active` scales to 0.95 | All buttons and chips |
| **Heart burst** | 8 particles burst out when you like a song, then remove themselves | Every ♡ |
| **Breathing play button** | A glow pulses while music plays | The player |

## 5. Example code (from the real files)

**Header reveal (CSS only)**
```css
.topbar > * { animation: m-drop var(--m-dur-l) var(--m-ease-out) both; }
.topbar > *:nth-child(2) { animation-delay: 60ms; }
@keyframes m-drop { from { opacity: 0; transform: translateY(-18px); } }
```

**Section parallax (one loop, read-then-write)**
```js
const visible = new Map() // only elements on screen
const io = new IntersectionObserver((es) => es.forEach((e) =>
  e.isIntersecting ? visible.set(e.target, +e.target.dataset.mParallax) : visible.delete(e.target)))
function frame() {
  const reads = []
  visible.forEach((speed, el) => {
    const box = el.parentElement.getBoundingClientRect()            // READ
    reads.push([el, (box.top + box.height / 2 - innerHeight / 2) * speed])
  })
  reads.forEach(([el, y]) => { el.style.translate = `0 ${y}px` })  // WRITE
}
addEventListener('scroll', () => requestAnimationFrame(frame), { passive: true })
```

**Hover micro-interaction (magnetic button)**
```js
document.addEventListener('pointermove', (e) => {
  const btn = e.target.closest('[data-m-magnetic], .btn-hot')
  if (!btn || calm || !matchMedia('(pointer: fine)').matches) return
  const r = btn.getBoundingClientRect()
  btn.style.translate = `${((e.clientX - r.left) / r.width - 0.5) * 10}px ${((e.clientY - r.top) / r.height - 0.5) * 8}px`
}, { passive: true })
```
```css
[data-m-magnetic] { transition: translate var(--m-dur-m) var(--m-ease-spring); }
```

## 6. Performance rules
- **IntersectionObserver, not scroll listeners,** decides what animates. Revealed elements are unobserved, so they cost nothing afterwards.
- **One rAF loop** handles parallax, the progress bar and marquee velocity. It only runs while you scroll, plus a few frames for the velocity to settle.
- **Read, then write** inside the loop, so there's no layout thrashing.
- **`translate` / `scale` / `rotate` as separate properties,** so motion never overrides other transforms (hover lifts, 3D tilt).
- **Lists don't replay.** Once a stagger container is revealed, re-rendered rows appear instantly.
- **Self-pruning.**
  - Page transitions switch themselves off for the session if one takes more than 450ms (slow device).
  - The 3D scene drops to Battery saver on low FPS or low battery.
  - Particles delete themselves when their animation ends.
- **Lazy loading:** images use `loading="lazy"`, and motion only scans newly rendered sections (`Motion.refresh()` after each render).

## 7. Accessibility and UX guidelines
- **Calm mode** (Settings → Animations). It turns off parallax, page transitions, split text and the moving marquee, and shortens reveals to a 300ms fade.
- **OS "reduce motion"** turns Calm on automatically. Users can still switch to Full in Settings.
- **No content depends on motion.** Everything is readable if JS fails, and reduced-motion CSS forces revealed states.
- **Screen readers.** Split titles keep `aria-label` with the full text, and the letter spans are `aria-hidden`. Decorative elements (particles, progress bar, 3D canvas) are `aria-hidden`.
- **Focus.** On every page change, focus moves to the new page's heading, and the change is announced in a live region.
- **Don't overwhelm.**
  - At most one "hero" motion per screen.
  - Staggers are capped at 14 items.
  - Nothing loops forever except music-linked elements (record, equalizer, marquee), and those can be paused or turned off with Calm.
- **Touch devices** don't get magnetic or hover effects (`(hover: hover) and (pointer: fine)` only).

## 8. React mapping (for a React project)
The same system ports directly:
```jsx
// useReveal.js: same IntersectionObserver idea, one shared observer
export function useReveal(ref, { once = true } = {}) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); if (once) io.disconnect() }
    }, { rootMargin: '0px 0px -8% 0px' })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  return inView
}
// <section ref={ref} className={`m-reveal ${inView ? 'is-in' : ''}`}>  (motion.css is reused as-is)
```
- **Page transitions:** wrap your router's navigate call in `document.startViewTransition(() => flushSync(() => navigate(to)))`.
- **Parallax:** a `<Parallax speed={0.18}>` component that registers its ref in the same single rAF loop (via context).
- **Reduced motion:** a `MotionContext` holding `calm`, initialised from `matchMedia('(prefers-reduced-motion)')` and Settings.
- **When to add a library:** GSAP (now free) or Motion (framer-motion) are worth it for timeline-heavy storytelling pages. For UI motion like this, CSS + IntersectionObserver + Web Animations is smaller and faster.

## 9. Rollout
| Phase | Contents | Status |
| --- | --- | --- |
| MVP | Tokens, header reveal, scroll and stagger reveals, press feedback, Calm mode, reduced motion | ✅ Done |
| 2 | Split-text titles, parallax, magnetic buttons, cursor spotlight, heart burst, progress bar, marquee velocity | ✅ Done |
| 3 | View Transitions between pages, with failsafe and slow-device auto-off | ✅ Done |
| Next | Shared-element transitions (album cover → full-screen player), scroll-driven CSS (`animation-timeline: view()`) when Safari support lands | Planned |

## 10. Testing checklist
- [x] No console errors on desktop (1440px) or mobile (iPhone 13), and no horizontal overflow.
- [x] Reveals fire on scroll. Re-rendering lists (liking a song) does not replay them.
- [x] Parallax only runs for on-screen elements and resets in Calm mode.
- [x] The heart burst creates 8 particles and removes them after about 0.8s.
- [x] `prefers-reduced-motion: reduce` turns on Calm automatically, and titles are fully visible.
- [x] Page changes keep the music playing, and focus moves to the page heading.
- [x] When a View Transition is skipped, aborted or slow, the page still changes (failsafe).
- [ ] Manual: Chrome DevTools Performance panel, scroll the Home page and confirm no long tasks over 50ms.
- [ ] Manual: VoiceOver/NVDA reads split titles once, not letter by letter.
- [ ] Manual: Safari and Firefox. Pages switch instantly (no View Transitions) and everything else animates.

## 11. Maintaining it
- **New section that should reveal:** add its selector to `REVEAL` or `STAGGER` in `motion.js`. Nothing else is needed.
- **New parallax element:** add `[selector, speed]` to `PARALLAX` (keep speeds between -0.2 and 0.2).
- **New headline:** add `data-m-split` to the `<h1>`. Only use it on static text.
- **Change the feel of the whole site:** edit the tokens in `motion.css`, never hard-coded durations.
