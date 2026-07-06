// Custom pixel agent: hand-authored paper-doll layers composed on canvas.
// Views: front (down), back (up), side (left; right is mirrored).
// Poses: idle, walkA, walkB. Colors are applied per semantic palette key.

export type AgentView = 'front' | 'back' | 'side'
export type AgentPose = 'idle' | 'walkA' | 'walkB'

export type AgentConfig = {
  name: string
  hair: string
  hairColor: string
  skin: string
  shirt: string
  pants: string
  shoes: string
}

export const AGENT_SKIN_TONES = ['#f2c69a', '#e0a878', '#b97d4e', '#8a5a34']
export const AGENT_HAIR_COLORS = ['#2a2118', '#6e4a2a', '#c9a15a', '#d94f38', '#7a86d1', '#57e39f', '#ff7ad9', '#e8e4da']
export const AGENT_SHIRT_COLORS = ['#e34f3a', '#f2c24e', '#57b36b', '#3f6f9e', '#8a5cb8', '#e8467c', '#e8e4da', '#2c3a44']
export const AGENT_PANTS_COLORS = ['#2c3a44', '#4a2f18', '#3f6f9e', '#6e6a5e', '#41245c', '#7a2f24']
export const AGENT_SHOE_COLORS = ['#4a2f18', '#2c3a44', '#e34f3a', '#e8e4da', '#f2c24e', '#41245c']
export const AGENT_HAIR_STYLES = ['spiky', 'bob', 'long', 'bun', 'buzz', 'none'] as const

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  name: 'Agent',
  hair: 'spiky',
  hairColor: '#2a2118',
  skin: '#f2c69a',
  shirt: '#e34f3a',
  pants: '#2c3a44',
  shoes: '#4a2f18',
}

const OUTLINE = '#241a12'

// Palette keys: o outline, S skin, s skin shade, K eye, T shirt, t shirt
// shade, P pants, p pants shade, F shoe, f shoe shade, H hair, h hair shade.

const BODY_FRONT_IDLE = [
  '.....oooooo.....',
  '....oSSSSSSo....',
  '...oSSSSSSSSo...',
  '...oSSSSSSSSo...',
  '...oSSSSSSSSo...',
  '...oSKSSSSKSo...',
  '...osSSssSSso...',
  '....oSSSSSSo....',
  '.....oSSSSo.....',
  '......oSSo......',
  '...oTTTTTTTTo...',
  '..oTTTTTTTTTTo..',
  '..oTTTTTTTTTTo..',
  '..oTtTTTTTTtTo..',
  '..oStTTTTTTtSo..',
  '...oTTTTTTTTo...',
  '...oPPPooPPPo...',
  '...oPPPooPPPo...',
  '...oPPPooPPPo...',
  '...opPPoopPPo...',
  '...oFFFooFFFo...',
  '...oFFFooFFFo...',
  '....ooo..ooo....',
]

const BODY_FRONT_WALK_A = [
  '.....oooooo.....',
  '....oSSSSSSo....',
  '...oSSSSSSSSo...',
  '...oSSSSSSSSo...',
  '...oSSSSSSSSo...',
  '...oSKSSSSKSo...',
  '...osSSssSSso...',
  '....oSSSSSSo....',
  '.....oSSSSo.....',
  '......oSSo......',
  '...oTTTTTTTTo...',
  '..oTTTTTTTTTTo..',
  '..oTTTTTTTTTTo..',
  '..oStTTTTTTtTo..',
  '...oTTTTTTTtSo..',
  '...oTTTTTTTTo...',
  '...oPPPooPPPo...',
  '...oPPPooPPPo...',
  '...opPPooFFFo...',
  '...oFFFooFFFo...',
  '...oFFFoooooo...',
  '....oooo........',
  '................',
]

const BODY_FRONT_WALK_B = [
  '.....oooooo.....',
  '....oSSSSSSo....',
  '...oSSSSSSSSo...',
  '...oSSSSSSSSo...',
  '...oSSSSSSSSo...',
  '...oSKSSSSKSo...',
  '...osSSssSSso...',
  '....oSSSSSSo....',
  '.....oSSSSo.....',
  '......oSSo......',
  '...oTTTTTTTTo...',
  '..oTTTTTTTTTTo..',
  '..oTTTTTTTTTTo..',
  '..oTtTTTTTTtSo..',
  '..oStTTTTTTTo...',
  '...oTTTTTTTTo...',
  '...oPPPooPPPo...',
  '...oPPPooPPPo...',
  '...oFFFooPPpo...',
  '...oFFFooFFFo...',
  '...ooooooFFFo...',
  '........oooo....',
  '................',
]

const BODY_BACK_IDLE = [
  '.....oooooo.....',
  '....oSSSSSSo....',
  '...oSSSSSSSSo...',
  '...oSSSSSSSSo...',
  '...oSSSSSSSSo...',
  '...oSSSSSSSSo...',
  '...oSSSSSSSSo...',
  '....oSSSSSSo....',
  '.....oSSSSo.....',
  '......oSSo......',
  '...oTTTTTTTTo...',
  '..oTTTTTTTTTTo..',
  '..oTTTTTTTTTTo..',
  '..oTtTTTTTTtTo..',
  '..oStTTTTTTtSo..',
  '...oTTTTTTTTo...',
  '...oPPPooPPPo...',
  '...oPPPooPPPo...',
  '...oPPPooPPPo...',
  '...opPPoopPPo...',
  '...oFFFooFFFo...',
  '...oFFFooFFFo...',
  '....ooo..ooo....',
]

const BODY_BACK_WALK_A = [
  '.....oooooo.....',
  '....oSSSSSSo....',
  '...oSSSSSSSSo...',
  '...oSSSSSSSSo...',
  '...oSSSSSSSSo...',
  '...oSSSSSSSSo...',
  '...oSSSSSSSSo...',
  '....oSSSSSSo....',
  '.....oSSSSo.....',
  '......oSSo......',
  '...oTTTTTTTTo...',
  '..oTTTTTTTTTTo..',
  '..oTTTTTTTTTTo..',
  '..oStTTTTTTtTo..',
  '...oTTTTTTTtSo..',
  '...oTTTTTTTTo...',
  '...oPPPooPPPo...',
  '...oPPPooPPPo...',
  '...opPPooFFFo...',
  '...oFFFooFFFo...',
  '...oFFFoooooo...',
  '....oooo........',
  '................',
]

const BODY_BACK_WALK_B = [
  '.....oooooo.....',
  '....oSSSSSSo....',
  '...oSSSSSSSSo...',
  '...oSSSSSSSSo...',
  '...oSSSSSSSSo...',
  '...oSSSSSSSSo...',
  '...oSSSSSSSSo...',
  '....oSSSSSSo....',
  '.....oSSSSo.....',
  '......oSSo......',
  '...oTTTTTTTTo...',
  '..oTTTTTTTTTTo..',
  '..oTTTTTTTTTTo..',
  '..oTtTTTTTTtSo..',
  '..oStTTTTTTTo...',
  '...oTTTTTTTTo...',
  '...oPPPooPPPo...',
  '...oPPPooPPPo...',
  '...oFFFooPPpo...',
  '...oFFFooFFFo...',
  '...ooooooFFFo...',
  '........oooo....',
  '................',
]

// Side view faces LEFT.
const BODY_SIDE_IDLE = [
  '.....oooooo.....',
  '....oSSSSSSo....',
  '...oSSSSSSSSo...',
  '...oSSSSSSSSo...',
  '...oSSSSSSSSo...',
  '...oKSSSSSSSo...',
  '...osSSSSSSSo...',
  '....oSSSSSSo....',
  '.....oSSSSo.....',
  '......oSSo......',
  '....oTTTTTTo....',
  '...oTTTTTTTTo...',
  '...oTTtTTTTTo...',
  '...oTTtTTTTTo...',
  '...oTStTTTTTo...',
  '....oTTTTTTo....',
  '....oPPPPPPo....',
  '....oPPPPPPo....',
  '....oPPPPPPo....',
  '....opPPPPpo....',
  '....oFFFFFFo....',
  '...oFFFFFFFo....',
  '....oooooooo....',
]

const BODY_SIDE_WALK_A = [
  '.....oooooo.....',
  '....oSSSSSSo....',
  '...oSSSSSSSSo...',
  '...oSSSSSSSSo...',
  '...oSSSSSSSSo...',
  '...oKSSSSSSSo...',
  '...osSSSSSSSo...',
  '....oSSSSSSo....',
  '.....oSSSSo.....',
  '......oSSo......',
  '....oTTTTTTo....',
  '...oTTTTTTTTo...',
  '...oTTtTTTTTo...',
  '...oTTtTTTTTo...',
  '...oTStTTTTTo...',
  '....oTTTTTTo....',
  '....oPPPPPPo....',
  '...oPPPooPPPo...',
  '..oPPPo..oPPPo..',
  '..opPo....oPpo..',
  '..oFFo....oFFFo.',
  '.oFFFo....oFFFo.',
  '..oooo....ooooo.',
]

const BODY_SIDE_WALK_B = [
  '.....oooooo.....',
  '....oSSSSSSo....',
  '...oSSSSSSSSo...',
  '...oSSSSSSSSo...',
  '...oSSSSSSSSo...',
  '...oKSSSSSSSo...',
  '...osSSSSSSSo...',
  '....oSSSSSSo....',
  '.....oSSSSo.....',
  '......oSSo......',
  '....oTTTTTTo....',
  '...oTTTTTTTTo...',
  '...oTTtTTTTTo...',
  '...oTTtTTTTTo...',
  '...oTStTTTTTo...',
  '....oTTTTTTo....',
  '....oPPPPPPo....',
  '....oPPPPPo.....',
  '....oPPPPPo.....',
  '....opPPPpo.....',
  '....oFFFFFo.....',
  '....oFFFFFFo....',
  '.....oooooo.....',
]

const BODIES: Record<AgentView, Record<AgentPose, string[]>> = {
  front: { idle: BODY_FRONT_IDLE, walkA: BODY_FRONT_WALK_A, walkB: BODY_FRONT_WALK_B },
  back: { idle: BODY_BACK_IDLE, walkA: BODY_BACK_WALK_A, walkB: BODY_BACK_WALK_B },
  side: { idle: BODY_SIDE_IDLE, walkA: BODY_SIDE_WALK_A, walkB: BODY_SIDE_WALK_B },
}

// Hair overlays share the same 16-wide grid, anchored at the top of the head.
const HAIR: Record<string, Record<AgentView, string[]>> = {
  spiky: {
    front: [
      '..H..HH..HH..H..',
      '...HHHHHHHHHH...',
      '..HHHHHHHHHHHH..',
      '..HHhHHHHHHhHH..',
      '..HHH......HHH..',
      '...H........H...',
    ],
    back: [
      '..H..HH..HH..H..',
      '...HHHHHHHHHH...',
      '..HHHHHHHHHHHH..',
      '..HHHHHHHHHHHH..',
      '..HHhHHHHHHhHH..',
      '...HHHHHHHHHH...',
    ],
    side: [
      '..H.HH..HH.H....',
      '..HHHHHHHHHH....',
      '..HHHHHHHHHHH...',
      '..HHhHHHHHHHH...',
      '..HHH.....HHH...',
      '...H......HH....',
    ],
  },
  bob: {
    front: [
      '....HHHHHHHH....',
      '...HHHHHHHHHH...',
      '..HHHHHHHHHHHH..',
      '..HHhH....HhHH..',
      '..HHH......HHH..',
      '..HHH......HHH..',
    ],
    back: [
      '....HHHHHHHH....',
      '...HHHHHHHHHH...',
      '..HHHHHHHHHHHH..',
      '..HHHHHHHHHHHH..',
      '..HHhHHHHHHhHH..',
      '..HHHHHHHHHHHH..',
    ],
    side: [
      '....HHHHHHHH....',
      '...HHHHHHHHHH...',
      '..HHHHHHHHHHH...',
      '..HHHH....HHH...',
      '..HHH.....HHH...',
      '..HHH.....HHH...',
    ],
  },
  long: {
    front: [
      '....HHHHHHHH....',
      '...HHHHHHHHHH...',
      '..HHHHHHHHHHHH..',
      '..HHhH....HhHH..',
      '..HHH......HHH..',
      '..HHH......HHH..',
      '..HHh......hHH..',
      '..HH........HH..',
      '..HH........HH..',
    ],
    back: [
      '....HHHHHHHH....',
      '...HHHHHHHHHH...',
      '..HHHHHHHHHHHH..',
      '..HHHHHHHHHHHH..',
      '..HHhHHHHHHhHH..',
      '..HHHHHHHHHHHH..',
      '..HHhHHHHHHhHH..',
      '...HHHHHHHHHH...',
      '...HHHHHHHHHH...',
    ],
    side: [
      '....HHHHHHHH....',
      '...HHHHHHHHHH...',
      '..HHHHHHHHHHH...',
      '..HHHH....HHHH..',
      '..HHH.....HHHH..',
      '..HHH.....HHHH..',
      '..HHh......hHH..',
      '...........HHH..',
      '...........HH...',
    ],
  },
  bun: {
    front: [
      '......HHHH......',
      '....HHHHHHHH....',
      '...HHHHHHHHHH...',
      '..HHhH....HhHH..',
      '..HH........HH..',
      '................',
    ],
    back: [
      '......HHHH......',
      '.....HHhHHH.....',
      '...HHHHHHHHHH...',
      '..HHHHHHHHHHHH..',
      '..HHhHHHHHHhHH..',
      '...HHHHHHHHHH...',
    ],
    side: [
      '.....HHHH..HH...',
      '....HHHHHHHHHH..',
      '...HHHHHHHHHhH..',
      '..HHHH....HHHH..',
      '..HH.......HH...',
      '................',
    ],
  },
  buzz: {
    front: [
      '.....HHHHHH.....',
      '....HHHHHHHH....',
      '....Hh....hH....',
      '................',
      '................',
      '................',
    ],
    back: [
      '.....HHHHHH.....',
      '....HHHHHHHH....',
      '....HHHHHHHH....',
      '....HhHHHHhH....',
      '................',
      '................',
    ],
    side: [
      '.....HHHHHH.....',
      '....HHHHHHHH....',
      '....Hh...HHH....',
      '................',
      '................',
      '................',
    ],
  },
  none: {
    front: [''],
    back: [''],
    side: [''],
  },
}

function shade(hex: string, factor: number) {
  const r = Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(1, 3), 16) * factor)))
  const g = Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(3, 5), 16) * factor)))
  const b = Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(5, 7), 16) * factor)))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function paletteFor(config: AgentConfig): Record<string, string> {
  return {
    o: OUTLINE,
    S: config.skin,
    s: shade(config.skin, 0.82),
    K: '#1c1310',
    T: config.shirt,
    t: shade(config.shirt, 0.74),
    P: config.pants,
    p: shade(config.pants, 0.74),
    F: config.shoes,
    f: shade(config.shoes, 0.74),
    H: config.hairColor,
    h: shade(config.hairColor, 0.74),
  }
}

function drawMap(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  palette: Record<string, string>,
  x: number,
  y: number,
  scale: number,
) {
  for (let ry = 0; ry < rows.length; ry++) {
    const row = rows[ry]
    for (let rx = 0; rx < row.length; rx++) {
      const key = row[rx]
      if (key === '.' || key === ' ' || !palette[key]) continue
      ctx.fillStyle = palette[key]
      ctx.fillRect(x + rx * scale, y + ry * scale, scale, scale)
    }
  }
}

export const AGENT_GRID_W = 16
export const AGENT_GRID_H = 23

/** Draws one character frame with its top-left at (x, y). */
export function drawAgentFrame(
  ctx: CanvasRenderingContext2D,
  config: AgentConfig,
  view: AgentView,
  pose: AgentPose,
  x: number,
  y: number,
  scale: number,
) {
  const palette = paletteFor(config)
  drawMap(ctx, BODIES[view][pose], palette, x, y, scale)
  const hair = HAIR[config.hair] ?? HAIR.none
  drawMap(ctx, hair[view], palette, x, y, scale)
}

/** 96x96-cell, 6x8 sheet matching the Temple Play sprite contract. */
export function buildAgentSheetCanvas(config: AgentConfig): HTMLCanvasElement {
  const cell = 96
  const cols = 6
  const scale = 4 // 16x23 grid -> 64x92 in a 96 cell
  const canvas = document.createElement('canvas')
  canvas.width = cell * cols
  canvas.height = cell * 8
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  ctx.imageSmoothingEnabled = false

  const baselineY = 94
  const originX = Math.round((cell - AGENT_GRID_W * scale) / 2)
  const originY = baselineY - AGENT_GRID_H * scale

  type RowSpec = { view: AgentView; flip: boolean; frames: Array<{ pose: AgentPose; bob: number }> }
  const idleFrames: Array<{ pose: AgentPose; bob: number }> = [
    { pose: 'idle', bob: 0 }, { pose: 'idle', bob: -1 }, { pose: 'idle', bob: 0 },
    { pose: 'idle', bob: -1 }, { pose: 'idle', bob: 0 }, { pose: 'idle', bob: -1 },
  ]
  const walkFrames: Array<{ pose: AgentPose; bob: number }> = [
    { pose: 'walkA', bob: 0 }, { pose: 'idle', bob: -1 }, { pose: 'walkB', bob: 0 },
    { pose: 'idle', bob: -1 }, { pose: 'walkA', bob: 0 }, { pose: 'walkB', bob: 0 },
  ]
  const rows: RowSpec[] = [
    { view: 'front', flip: false, frames: idleFrames },
    { view: 'back', flip: false, frames: idleFrames },
    { view: 'side', flip: false, frames: idleFrames },
    { view: 'side', flip: true, frames: idleFrames },
    { view: 'front', flip: false, frames: walkFrames },
    { view: 'back', flip: false, frames: walkFrames },
    { view: 'side', flip: false, frames: walkFrames },
    { view: 'side', flip: true, frames: walkFrames },
  ]

  rows.forEach((row, rowIndex) => {
    row.frames.forEach((frame, colIndex) => {
      const cellX = colIndex * cell
      const cellY = rowIndex * cell
      if (row.flip) {
        ctx.save()
        ctx.translate(cellX + cell, cellY)
        ctx.scale(-1, 1)
        drawAgentFrame(ctx, config, row.view, frame.pose, originX, originY + frame.bob, scale)
        ctx.restore()
      } else {
        drawAgentFrame(ctx, config, row.view, frame.pose, cellX + originX, cellY + originY + frame.bob, scale)
      }
    })
  })
  return canvas
}

/** Small front-idle portrait used for pickers/cards. */
export function buildAgentPortraitCanvas(config: AgentConfig, scale = 4): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = AGENT_GRID_W * scale
  canvas.height = AGENT_GRID_H * scale
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.imageSmoothingEnabled = false
    drawAgentFrame(ctx, config, 'front', 'idle', 0, 0, scale)
  }
  return canvas
}

/** Pokemon-style share card. Returns a canvas ready for toBlob/download. */
export async function buildAgentCardCanvas(
  config: AgentConfig,
  stats: { badges: number; fishPts: number; pets: number },
): Promise<HTMLCanvasElement> {
  const width = 640
  const height = 900
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  ctx.imageSmoothingEnabled = false

  // outer holo frame
  const frame = ctx.createLinearGradient(0, 0, width, height)
  frame.addColorStop(0, '#f2c866')
  frame.addColorStop(0.35, '#ffe9a0')
  frame.addColorStop(0.6, '#c9973f')
  frame.addColorStop(1, '#f2c866')
  ctx.fillStyle = frame
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#0a120d'
  ctx.fillRect(18, 18, width - 36, height - 36)
  ctx.strokeStyle = 'rgba(242, 200, 102, 0.5)'
  ctx.lineWidth = 2
  ctx.strokeRect(26, 26, width - 52, height - 52)

  // header
  ctx.fillStyle = '#f2c866'
  ctx.font = '900 34px monospace'
  ctx.textAlign = 'left'
  ctx.fillText('RIALO TEMPLE AGENT', 44, 78)
  ctx.font = '900 16px monospace'
  ctx.fillStyle = '#78ecff'
  ctx.textAlign = 'right'
  ctx.fillText('AGENT CARD', width - 44, 76)

  // art window
  const artX = 44
  const artY = 100
  const artW = width - 88
  const artH = 430
  const sky = ctx.createLinearGradient(0, artY, 0, artY + artH)
  sky.addColorStop(0, '#14351f')
  sky.addColorStop(0.62, '#1d4d2c')
  sky.addColorStop(0.63, '#2a6a3c')
  sky.addColorStop(1, '#1f5730')
  ctx.fillStyle = sky
  ctx.fillRect(artX, artY, artW, artH)
  ctx.strokeStyle = '#f2c866'
  ctx.lineWidth = 3
  ctx.strokeRect(artX, artY, artW, artH)

  // sparkles + temple silhouette
  ctx.fillStyle = 'rgba(242, 200, 102, 0.55)'
  const sparkles = [[90, 150], [180, 210], [500, 140], [430, 250], [540, 320], [120, 330], [300, 130]]
  sparkles.forEach(([sx, sy]) => {
    ctx.fillRect(sx, sy, 4, 12)
    ctx.fillRect(sx - 4, sy + 4, 12, 4)
  })
  ctx.fillStyle = 'rgba(10, 18, 13, 0.55)'
  ctx.fillRect(artX + 30, artY + 168, 120, 100)
  ctx.fillRect(artX + 50, artY + 138, 80, 34)
  ctx.fillRect(artX + 70, artY + 116, 40, 26)

  // character (front idle, big)
  const portrait = buildAgentPortraitCanvas(config, 16)
  ctx.drawImage(portrait, artX + Math.round((artW - portrait.width) / 2), artY + artH - portrait.height - 26)
  // ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.fillRect(artX + Math.round(artW / 2) - 90, artY + artH - 24, 180, 10)

  // name plate
  ctx.fillStyle = '#10231a'
  ctx.fillRect(44, 556, width - 88, 74)
  ctx.strokeStyle = 'rgba(242, 200, 102, 0.6)'
  ctx.lineWidth = 2
  ctx.strokeRect(44, 556, width - 88, 74)
  ctx.fillStyle = '#f7f1df'
  ctx.font = '900 40px monospace'
  ctx.textAlign = 'center'
  const displayName = (config.name || 'Agent').slice(0, 14).toUpperCase()
  ctx.fillText(displayName, width / 2, 606)

  // stats row
  const statBoxes = [
    { label: 'BADGES', value: String(stats.badges) },
    { label: 'FISH PTS', value: String(stats.fishPts) },
    { label: 'PETS', value: String(stats.pets) },
  ]
  const boxW = (width - 88 - 24) / 3
  statBoxes.forEach((stat, index) => {
    const bx = 44 + index * (boxW + 12)
    ctx.fillStyle = '#10231a'
    ctx.fillRect(bx, 652, boxW, 92)
    ctx.strokeStyle = 'rgba(120, 236, 255, 0.4)'
    ctx.strokeRect(bx, 652, boxW, 92)
    ctx.fillStyle = '#78ecff'
    ctx.font = '900 15px monospace'
    ctx.fillText(stat.label, bx + boxW / 2, 682)
    ctx.fillStyle = '#f7f1df'
    ctx.font = '900 32px monospace'
    ctx.fillText(stat.value, bx + boxW / 2, 726)
  })

  // footer: rialo logo + credit
  try {
    const logo = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = '/rialo_logo.png'
    })
    const logoH = 54
    const logoW = Math.round((logo.width / logo.height) * logoH)
    ctx.drawImage(logo, Math.round(width / 2 - logoW / 2), 772, logoW, logoH)
  } catch {
    ctx.fillStyle = '#f2c866'
    ctx.font = '900 30px monospace'
    ctx.fillText('RIALO', width / 2, 806)
  }
  ctx.fillStyle = 'rgba(247, 241, 223, 0.85)'
  ctx.font = '800 18px monospace'
  ctx.fillText('Build by NXR for Rialo', width / 2, 862)

  return canvas
}

const STORAGE_KEY = 'temple-custom-agent'

export function loadAgentConfig(): AgentConfig {
  if (typeof window === 'undefined') return DEFAULT_AGENT_CONFIG
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as AgentConfig | null
    if (!stored) return DEFAULT_AGENT_CONFIG
    return { ...DEFAULT_AGENT_CONFIG, ...stored }
  } catch {
    return DEFAULT_AGENT_CONFIG
  }
}

export function saveAgentConfig(config: AgentConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}
