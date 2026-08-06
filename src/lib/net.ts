import { WS_URL } from '@/config/net'
import type { AgentConfig } from '@/lib/pixelCharacter'

export type PlayerDir = 'down' | 'up' | 'left' | 'right'

export type RemotePlayer = {
  id: string
  name: string
  sprite: string
  config?: AgentConfig
  // target position (latest server patch)
  x: number
  y: number
  dir: PlayerDir
  moving: boolean
  // smoothed position (exponential interpolation, advanced by net.update)
  sx: number
  sy: number
  lastSeen: number
}

export type JoinPayload = { name: string; sprite: string; config?: AgentConfig }

const SEND_INTERVAL_MS = 1000 / 12
const PING_INTERVAL_MS = 8000
const RECONNECT_BASE_MS = 1500
const RECONNECT_MAX_MS = 10000
const SMOOTH_RATE = 12

let socket: WebSocket | null = null
let selfId: string | null = null
let joinPayload: JoinPayload | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let pingTimer: ReturnType<typeof setInterval> | null = null
let reconnectDelay = RECONNECT_BASE_MS
let lastMoveSentAt = 0

export const net = {
  connected: false,
  selfId: null as string | null,
  remote: {} as Record<string, RemotePlayer>,

  connect(payload: JoinPayload) {
    joinPayload = payload
    openSocket()
  },

  sendMove(x: number, y: number, dir: PlayerDir, moving: boolean) {
    if (!socket || socket.readyState !== WebSocket.OPEN || !selfId) return
    const now = performance.now()
    if (now - lastMoveSentAt < SEND_INTERVAL_MS) return
    lastMoveSentAt = now
    socket.send(JSON.stringify({ t: 'move', x: Math.round(x), y: Math.round(y), dir, moving }))
  },

  update(dt: number) {
    const factor = Math.min(1, dt * SMOOTH_RATE)
    for (const p of Object.values(net.remote)) {
      p.sx += (p.x - p.sx) * factor
      p.sy += (p.y - p.sy) * factor
    }
  },

  disconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (pingTimer) {
      clearInterval(pingTimer)
      pingTimer = null
    }
    if (socket) {
      socket.onopen = null
      socket.onmessage = null
      socket.onclose = null
      socket.onerror = null
      try {
        socket.close()
      } catch {
        /* noop */
      }
      socket = null
    }
    net.connected = false
    net.selfId = null
    selfId = null
    net.remote = {}
  },
}

function openSocket() {
  if (!joinPayload) return
  try {
    socket = new WebSocket(WS_URL)
  } catch {
    scheduleReconnect()
    return
  }
  socket.onopen = () => {
    net.connected = true
    reconnectDelay = RECONNECT_BASE_MS
    const payload = joinPayload!
    socket!.send(JSON.stringify({ t: 'join', name: payload.name, sprite: payload.sprite, config: payload.config, x: 928, y: 940 }))
    if (!pingTimer) {
      pingTimer = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ t: 'ping' }))
      }, PING_INTERVAL_MS)
    }
  }
  socket.onmessage = (event) => {
    let msg: { t?: string; [key: string]: unknown }
    try {
      msg = JSON.parse(String(event.data))
    } catch {
      return
    }
    handleMessage(msg)
  }
  socket.onclose = () => {
    net.connected = false
    net.selfId = null
    selfId = null
    net.remote = {}
    socket = null
    scheduleReconnect()
  }
  socket.onerror = () => {
    /* onclose follows */
  }
}

function handleMessage(msg: { t?: string; [key: string]: unknown }) {
  if (msg.t === 'welcome') {
    selfId = typeof msg.id === 'string' ? msg.id : null
    net.selfId = selfId
    net.remote = {}
    if (Array.isArray(msg.players)) {
      for (const p of msg.players) applyPlayer(p as Record<string, unknown>)
    }
  } else if (msg.t === 'players') {
    if (Array.isArray(msg.players)) {
      const seen = new Set<string>()
      for (const p of msg.players) {
        const entry = p as Record<string, unknown>
        if (entry.id === selfId) continue
        seen.add(String(entry.id))
        applyPlayer(entry)
      }
      for (const id of Object.keys(net.remote)) {
        if (!seen.has(id)) delete net.remote[id]
      }
    }
  } else if (msg.t === 'joined') {
    const player = msg.player as Record<string, unknown> | undefined
    if (player && player.id !== selfId) applyPlayer(player)
  } else if (msg.t === 'left') {
    if (typeof msg.id === 'string' && msg.id !== selfId) delete net.remote[msg.id]
  }
}

function applyPlayer(p: Record<string, unknown>) {
  const id = String(p.id)
  if (!id) return
  const dir: PlayerDir = p.dir === 'up' || p.dir === 'left' || p.dir === 'right' ? p.dir : 'down'
  const x = Number(p.x) || 928
  const y = Number(p.y) || 940
  const existing = net.remote[id]
  if (existing) {
    existing.x = x
    existing.y = y
    existing.dir = dir
    existing.moving = Boolean(p.moving)
    existing.lastSeen = performance.now()
    if (typeof p.name === 'string' && p.name) existing.name = p.name
    if (typeof p.sprite === 'string' && p.sprite) existing.sprite = p.sprite
    if (p.config && typeof p.config === 'object') existing.config = p.config as AgentConfig
  } else {
    net.remote[id] = {
      id,
      name: typeof p.name === 'string' && p.name ? p.name : 'guest',
      sprite: typeof p.sprite === 'string' && p.sprite ? p.sprite : 'nxr',
      config: p.config && typeof p.config === 'object' ? (p.config as AgentConfig) : undefined,
      x,
      y,
      dir,
      moving: Boolean(p.moving),
      sx: x,
      sy: y,
      lastSeen: performance.now(),
    }
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    openSocket()
  }, reconnectDelay)
  reconnectDelay = Math.min(RECONNECT_MAX_MS, reconnectDelay * 1.7)
}

if (typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).__net = net
}
