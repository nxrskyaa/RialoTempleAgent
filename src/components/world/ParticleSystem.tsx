import { useEffect, useRef } from 'react'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  life: number
  hue: number
}

export default function ParticleSystem({ active = true, intensity = 1 }: { active?: boolean; intensity?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !active) return

    const context = canvas.getContext('2d')
    if (!context) return
    const surface = canvas
    const ctx = context

    const particles: Particle[] = []
    let frame = 0
    let raf = 0

    function resize() {
      const rect = surface.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1
      surface.width = Math.max(1, Math.floor(rect.width * ratio))
      surface.height = Math.max(1, Math.floor(rect.height * ratio))
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    function spawn(width: number, height: number) {
      const count = Math.ceil(2 * intensity)
      for (let index = 0; index < count; index++) {
        particles.push({
          x: Math.random() * width,
          y: height + 18,
          vx: (Math.random() - 0.5) * 0.45,
          vy: -0.35 - Math.random() * 0.7,
          size: 1.2 + Math.random() * 3.8,
          life: 0.45 + Math.random() * 0.7,
          hue: Math.random() > 0.5 ? 146 : 43,
        })
      }
    }

    function tick() {
      const width = surface.clientWidth
      const height = surface.clientHeight
      ctx.clearRect(0, 0, width, height)
      frame += 1
      if (frame % 2 === 0) spawn(width, height)

      for (let index = particles.length - 1; index >= 0; index--) {
        const particle = particles[index]
        particle.life -= 0.006
        particle.x += particle.vx + Math.sin(frame * 0.01 + particle.y * 0.02) * 0.26
        particle.y += particle.vy

        if (particle.life <= 0 || particle.y < -30) {
          particles.splice(index, 1)
          continue
        }

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = particle.hue === 146
          ? `rgba(87,227,159,${particle.life * 0.48})`
          : `rgba(242,200,102,${particle.life * 0.42})`
        ctx.shadowColor = particle.hue === 146 ? '#57e39f' : '#f2c866'
        ctx.shadowBlur = 16
        ctx.fill()
      }

      raf = window.requestAnimationFrame(tick)
    }

    resize()
    tick()
    window.addEventListener('resize', resize)

    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [active, intensity])

  return <canvas ref={ref} className="world-particle-canvas" aria-hidden="true" />
}
