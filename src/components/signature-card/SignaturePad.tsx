import { useEffect, useRef, useState } from 'react'

type SignaturePadProps = {
  onChange: (dataUrl: string, hasSignature: boolean) => void
}

export default function SignaturePad({ onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1
      canvas.width = rect.width * ratio
      canvas.height = rect.height * ratio
      const context = canvas.getContext('2d')
      if (!context) return
      context.scale(ratio, ratio)
      context.lineCap = 'round'
      context.lineJoin = 'round'
      context.lineWidth = 3
      context.strokeStyle = '#fff9e9'
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  function emitChange(nextHasSignature: boolean) {
    const canvas = canvasRef.current
    onChange(canvas && nextHasSignature ? canvas.toDataURL('image/png') : '', nextHasSignature)
  }

  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    canvas.setPointerCapture(event.pointerId)
    const next = point(event)
    context.beginPath()
    context.moveTo(next.x, next.y)
    setIsDrawing(true)
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing) return
    const context = canvasRef.current?.getContext('2d')
    if (!context) return
    const next = point(event)
    context.lineTo(next.x, next.y)
    context.stroke()
    if (!hasSignature) setHasSignature(true)
  }

  function stop() {
    if (!isDrawing) return
    setIsDrawing(false)
    emitChange(true)
  }

  function clear() {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    emitChange(false)
  }

  return (
    <div className="signature-pad-wrap">
      <canvas
        ref={canvasRef}
        className="signature-pad-canvas"
        onPointerDown={start}
        onPointerMove={draw}
        onPointerUp={stop}
        onPointerLeave={stop}
        aria-label="Draw signature"
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-[var(--temple-soft)]">Draw with mouse or touch</span>
        <button type="button" onClick={clear} className="temple-button-secondary rounded-full px-4 py-2 text-xs font-black">
          Clear
        </button>
      </div>
    </div>
  )
}
