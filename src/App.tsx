import { useCallback, useEffect, useRef, useState } from 'react'
import DesignComponent from '@/imports/ГлавнаяСтраница/index'
import llamaLogo from '@/imports/ГлавнаяСтраница/6074c26ebbcbf7af51fb1cca768037868d3be89b.png'

const DESIGN_W = 1440
const DESIGN_H = 3000
const HEADER_H = 64

/** Scroll-anchor positions on the design canvas (design px). */
const ANCHORS = {
  top: 0,
  about: 242,
  experience: 1267,
  contacts: 2291,
} as const

const MARQUEE_1 =
  'КРЕАТОР  ★  СТРАТЕГ  ★  МЕНЕДЖЕР МАРКЕТПЛЕЙСОВ  ★  КРЕАТОР  ★  СТРАТЕГ  ★  МЕНЕДЖЕР МАРКЕТПЛЕЙСОВ  ★  '
const MARQUEE_2 =
  'БРЕНДИНГ  ★  СТРАТЕГИЯ  ★  ДИЗАЙН  ★  АНАЛИТИКА  ★  БРЕНДИНГ  ★  СТРАТЕГИЯ  ★  ДИЗАЙН  ★  АНАЛИТИКА  ★  '

const marqueeTextStyle: React.CSSProperties = {
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 800,
  fontSize: '48px',
  color: '#000',
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
  paddingRight: '80px',
  whiteSpace: 'nowrap',
}

function MarqueeStrip({
  text,
  top,
  left = '-5.62px',
  width = '1452px',
  height = '119px',
  rotate,
}: {
  text: string
  top: string
  left?: string
  width?: string
  height?: string
  rotate: string
}) {
  return (
    <div
      role="marquee"
      aria-label={text}
      className="strip-in"
      style={{
        position: 'absolute',
        top,
        left,
        width,
        height,
        transform: rotate,
        transformOrigin: 'center center',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#D4FF3F',
        border: '3px solid #000',
        zIndex: 10,
        cursor: 'default',
      }}
    >
      {/* Scrolling track — two copies for a seamless loop */}
      <div
        className="marquee-track"
        style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
      >
        <span style={marqueeTextStyle}>{text}</span>
        <span style={marqueeTextStyle} aria-hidden="true">
          {text}
        </span>
      </div>
    </div>
  )
}

function FixedHeader({ onNavigate }: { onNavigate: (designY: number) => void }) {
  const [visible, setVisible] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef({ visible: false, collapsed: false, lastY: 0 })

  useEffect(() => {
    let ticking = false

    const update = () => {
      ticking = false
      const y = window.scrollY
      const s = stateRef.current

      const visibleNow = y > 170
      // Hide while scrolling down (only well past the hero), reveal on scroll up.
      let collapsedNow = s.collapsed
      if (y - s.lastY > 4 && y > 560) collapsedNow = true
      else if (s.lastY - y > 4 || y <= 560) collapsedNow = false

      if (visibleNow !== s.visible || collapsedNow !== s.collapsed) {
        stateRef.current = { ...s, visible: visibleNow, collapsed: collapsedNow, lastY: y }
        setVisible(visibleNow)
        setCollapsed(collapsedNow)
      } else {
        s.lastY = y
      }

      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, y / max) : 0
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${p})`
      }
    }

    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <header
      className={`site-header${visible && !collapsed ? ' site-header--visible' : ''}`}
      aria-hidden={!visible}
    >
      <button
        type="button"
        className="site-header__logo"
        onClick={() => onNavigate(ANCHORS.top)}
        aria-label="Наверх — Васильева Анна"
        tabIndex={visible ? 0 : -1}
      >
        <img src={llamaLogo} alt="" width={44} height={44} />
      </button>

      <nav className="site-header__nav" aria-label="Разделы сайта">
        <button
          type="button"
          className="nav-pill"
          onClick={() => onNavigate(ANCHORS.about)}
          tabIndex={visible ? 0 : -1}
        >
          Креатор
        </button>
        <button
          type="button"
          className="nav-pill"
          onClick={() => onNavigate(ANCHORS.experience)}
          tabIndex={visible ? 0 : -1}
        >
          Стратег
        </button>
        <button
          type="button"
          className="nav-pill"
          onClick={() => onNavigate(ANCHORS.contacts)}
          tabIndex={visible ? 0 : -1}
        >
          Менеджер маркетплейсов
        </button>
      </nav>

      <div ref={progressRef} className="scroll-progress" aria-hidden="true" />
    </header>
  )
}

export default function App() {
  const [scale, setScale] = useState(1)
  const innerRef = useRef<HTMLDivElement>(null)
  const scaleRef = useRef(1)
  scaleRef.current = scale

  // Fit the 1440px design canvas to the viewport
  useEffect(() => {
    const calc = () => {
      const vw = document.documentElement.clientWidth
      setScale(Math.min(1, vw / DESIGN_W))
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])

  // Make the design's own header buttons behave like real nav controls.
  useEffect(() => {
    const inner = innerRef.current
    if (!inner) return

    const btns = Array.from(inner.querySelectorAll<HTMLElement>('[data-name="Button"]'))
    const targets = [ANCHORS.about, ANCHORS.experience, ANCHORS.contacts]
    const cleanups: Array<() => void> = []

    btns.forEach((btn, i) => {
      const target = targets[i]
      if (target === undefined) return
      btn.classList.add('design-nav-btn')
      const handler = () => {
        const y = Math.max(0, target * scaleRef.current - HEADER_H - 12)
        window.scrollTo({ top: y, behavior: 'smooth' })
      }
      btn.addEventListener('click', handler)
      cleanups.push(() => {
        btn.removeEventListener('click', handler)
        btn.classList.remove('design-nav-btn')
      })
    })

    return () => cleanups.forEach((fn) => fn())
  }, [scale])

  // Scroll-reveal: everything marked [data-reveal] fades/slides in when it
  // enters the viewport; data-delay adds stagger.
  useEffect(() => {
    const inner = innerRef.current
    if (!inner) return

    const els = Array.from(inner.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (!els.length) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      els.forEach((el) => el.classList.add('reveal', 'visible'))
      return
    }

    els.forEach((el) => el.classList.add('reveal'))

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const el = entry.target as HTMLElement
          const delay = Number(el.getAttribute('data-delay') || 0)
          el.style.transitionDelay = `${delay}ms`
          el.classList.add('visible')
          obs.unobserve(el)
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -36px 0px' },
    )

    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [scale])

  // Smooth anchor scrolling that accounts for the current design scale.
  const navigate = useCallback((designY: number) => {
    const y = Math.max(0, designY * scaleRef.current - HEADER_H - 12)
    window.scrollTo({ top: y, behavior: 'smooth' })
  }, [])

  const scaledH = Math.round(DESIGN_H * scale)

  return (
    <div
      className="page-shell"
      style={{
        width: '100%',
        overflowX: 'hidden',
        background: '#ff7a01',
      }}
    >
      <FixedHeader onNavigate={navigate} />

      {/* Centered at max 1440px; on wide viewports the design stays native-size */}
      <div
        style={{
          maxWidth: `${DESIGN_W}px`,
          margin: '0 auto',
          position: 'relative',
          height: `${scaledH}px`,
          overflow: 'hidden',
        }}
      >
        {/* Inner: 1440×3000 canvas, scaled to fit the viewport */}
        <div
          ref={innerRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${DESIGN_W}px`,
            height: `${DESIGN_H}px`,
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
          }}
        >
          {/* ── Figma design ── */}
          <DesignComponent />

          {/* ── Marquee strip 1 ─────────────────────────────────────────────
              Matches the design strip geometry exactly: the Figma wrapper is
              1452×190.377 at top 126.51; centred → strip top = 162.2px.    */}
          <MarqueeStrip
            text={MARQUEE_1}
            top="162.2px"
            left="-5.62px"
            rotate="rotate(-2.84deg)"
          />

          {/* ── Marquee strip 2 ─────────────────────────────────────────────
              Desktop2 (top 1267) + inner wrapper 273.5 + (190.39−119)/2
              → strip top = 1576.2px.                                       */}
          <MarqueeStrip
            text={MARQUEE_2}
            top="1576.2px"
            left="-5.63px"
            rotate="rotate(2.84deg)"
          />
        </div>
      </div>
    </div>
  )
}
