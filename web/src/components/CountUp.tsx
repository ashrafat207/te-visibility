import { useEffect, useRef, useState } from 'react'

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

function easeExpoOut(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

export function CountUp({ value, durationMs = 900 }: { value: number; durationMs?: number }) {
  const [display, setDisplay] = useState(0)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value)
      return
    }

    const start = performance.now()
    let frame: number
    function tick(now: number) {
      const t = Math.min(1, (now - start) / durationMs)
      setDisplay(value * easeExpoOut(t))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, durationMs])

  return <span>{fmt.format(display)}</span>
}
