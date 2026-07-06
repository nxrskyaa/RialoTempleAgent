// Custom pixel agent: hand-authored paper-doll layers composed on canvas.
// Views: front (down), back (up), side (left; right is mirrored).
// Poses: idle, walkA, walkB. Colors are applied per semantic palette key.

export type AgentView = 'front' | 'back' | 'side'
export type AgentPose = 'idle' | 'walkA' | 'walkB'

export type AgentGender = 'male' | 'female'

export type AgentConfig = {
  name: string
  cardText: string
  gender: AgentGender
  outfit: string
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
export const AGENT_GENDERS: AgentGender[] = ['male', 'female']
export const AGENT_OUTFITS = [
  { id: 'tee', label: 'Tee' },
  { id: 'warrior', label: 'Warrior' },
  { id: 'ninja', label: 'Ninja' },
  { id: 'mage', label: 'Mage' },
  { id: 'hoodie', label: 'Hoodie' },
  { id: 'sailor', label: 'Sailor' },
] as const

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  name: 'Agent',
  cardText: 'Exploring the Rialo Temple, one quest at a time.',
  gender: 'male',
  outfit: 'tee',
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

const MALE_BODIES: Record<AgentView, Record<AgentPose, string[]>> = {
  front: { idle: BODY_FRONT_IDLE, walkA: BODY_FRONT_WALK_A, walkB: BODY_FRONT_WALK_B },
  back: { idle: BODY_BACK_IDLE, walkA: BODY_BACK_WALK_A, walkB: BODY_BACK_WALK_B },
  side: { idle: BODY_SIDE_IDLE, walkA: BODY_SIDE_WALK_A, walkB: BODY_SIDE_WALK_B },
}

// The female body reuses the male maps with a fitted waist, a hip flare and
// soft lashes; rows are overridden by index so every pose stays in sync.
const FEMALE_ROWS: Record<AgentView, Record<number, string>> = {
  front: {
    5: '...oSKsSSsKSo...',
    12: '..oTtTTTTTTtTo..',
    13: '...oTTTTTTTTo...',
    14: '...oSTTTTTTSo...',
    15: '..oTTTTTTTTTTo..',
  },
  back: {
    12: '..oTtTTTTTTtTo..',
    13: '...oTTTTTTTTo...',
    14: '...oSTTTTTTSo...',
    15: '..oTTTTTTTTTTo..',
  },
  side: {
    13: '....oTtTTTo.....',
    15: '...oTTTTTTTTo...',
  },
}

function toFemale(view: AgentView, rows: string[]): string[] {
  return rows.map((row, index) => FEMALE_ROWS[view][index] ?? row)
}

const FEMALE_BODIES: Record<AgentView, Record<AgentPose, string[]>> = {
  front: {
    idle: toFemale('front', BODY_FRONT_IDLE),
    walkA: toFemale('front', BODY_FRONT_WALK_A),
    walkB: toFemale('front', BODY_FRONT_WALK_B),
  },
  back: {
    idle: toFemale('back', BODY_BACK_IDLE),
    walkA: toFemale('back', BODY_BACK_WALK_A),
    walkB: toFemale('back', BODY_BACK_WALK_B),
  },
  side: {
    idle: toFemale('side', BODY_SIDE_IDLE),
    walkA: toFemale('side', BODY_SIDE_WALK_A),
    walkB: toFemale('side', BODY_SIDE_WALK_B),
  },
}

const BODIES_BY_GENDER: Record<AgentGender, Record<AgentView, Record<AgentPose, string[]>>> = {
  male: MALE_BODIES,
  female: FEMALE_BODIES,
}

// Outfit overlays are anchored at body row 10 (the shoulders) and stay inside
// rows 10-16, which are identical across idle/walk poses in every view.
// Extra keys: M/m armor plate, G gold trim, R accent red, W white, N/n dark suit.
const OUTFIT_OVERLAYS: Record<string, Record<AgentView, string[]>> = {
  warrior: {
    front: [
      '..MMo......oMM..',
      '..MMM......MMM..',
      '....MMMMMMMM....',
      '....MmMMMMmM....',
      '....MMMmmMMM....',
      '....GGGGGGGG....',
    ],
    back: [
      '..MMo......oMM..',
      '..MMM......MMM..',
      '....MMMMMMMM....',
      '....MMMMMMMM....',
      '....MmMMMMmM....',
      '....GGGGGGGG....',
    ],
    side: [
      '....MMMo........',
      '....MMM.........',
      '.....MMMMMM.....',
      '.....MmMMMM.....',
      '.....MMMMmM.....',
      '.....GGGGGG.....',
    ],
  },
  ninja: {
    front: [
      '...NNNNNNNNNN...',
      '..NNNNNNNNNNNN..',
      '..NnNNNNNNNNnN..',
      '..NnNNNNNNNNnN..',
      '..NNNNNNNNNNNN..',
      '....TTTTTTTT....',
    ],
    back: [
      '...NNNNNNNNNN...',
      '..NNNNNNNNNNNN..',
      '..NnNNNNNNNNnN..',
      '..NnNNNNNNNNnN..',
      '..NNNNNNNNNNNN..',
      '....TTTTTTTT....',
    ],
    side: [
      '....NNNNNN......',
      '...NNNNNNNN.....',
      '...NNnNNNNN.....',
      '...NNnNNNNN.....',
      '...NNNNNNNN.....',
      '....TTTTTT......',
    ],
  },
  mage: {
    front: [
      '................',
      '......G.........',
      '................',
      '...G.......G....',
      '................',
      '........G.......',
      '...GGGGGGGGGG...',
    ],
    back: [
      '................',
      '.........G......',
      '................',
      '....G.......G...',
      '................',
      '......G.........',
      '...GGGGGGGGGG...',
    ],
    side: [
      '................',
      '.......G........',
      '................',
      '.....G..........',
      '.........G......',
      '................',
      '....GGGGGGGG....',
    ],
  },
  hoodie: {
    front: [
      '......W..W......',
      '......W..W......',
      '................',
      '....tttttttt....',
      '....t......t....',
      '................',
    ],
    back: [
      '...tttttttttt...',
      '..tttttttttttt..',
      '..tttttttttttt..',
      '...tttttttttt...',
      '................',
      '................',
    ],
    side: [
      '.....tttttt.....',
      '....tttttttt....',
      '......W.........',
      '................',
      '................',
      '................',
    ],
  },
  sailor: {
    front: [
      '...WW......WW...',
      '..WWWWWWWWWWWW..',
      '................',
      '..WWWWWWWWWWWW..',
      '................',
      '..WWWWWWWWWWWW..',
    ],
    back: [
      '...WWWWWWWWWW...',
      '..WWWWWWWWWWWW..',
      '................',
      '..WWWWWWWWWWWW..',
      '................',
      '..WWWWWWWWWWWW..',
    ],
    side: [
      '....WWWWWW......',
      '...WWWWWWWW.....',
      '................',
      '...WWWWWWWW.....',
      '................',
      '...WWWWWWWW.....',
    ],
  },
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
    // outfit accents
    M: '#9aa3ae',
    m: '#5f6771',
    G: '#f2c24e',
    R: '#d13a2a',
    W: '#e8e4da',
    N: '#23262e',
    n: '#15181e',
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
  const bodies = BODIES_BY_GENDER[config.gender] ?? BODIES_BY_GENDER.male
  drawMap(ctx, bodies[view][pose], palette, x, y, scale)
  const overlay = OUTFIT_OVERLAYS[config.outfit]
  if (overlay) {
    drawMap(ctx, overlay[view], palette, x, y + 10 * scale, scale)
  }
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

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  return lines.slice(0, 3)
}

function drawPixelCorner(ctx: CanvasRenderingContext2D, x: number, y: number, sx: number, sy: number) {
  // small stepped ornament, mirrored by sx/sy
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(sx, sy)
  ctx.fillStyle = '#ffe9a0'
  ctx.fillRect(0, 0, 26, 6)
  ctx.fillRect(0, 0, 6, 26)
  ctx.fillStyle = '#c9973f'
  ctx.fillRect(6, 6, 12, 4)
  ctx.fillRect(6, 6, 4, 12)
  ctx.fillStyle = '#f2c866'
  ctx.fillRect(12, 12, 6, 6)
  ctx.restore()
}

/** Pokemon-style share card. Returns a canvas ready for toBlob/download. */
export async function buildAgentCardCanvas(config: AgentConfig): Promise<HTMLCanvasElement> {
  const width = 640
  const height = 900
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  ctx.imageSmoothingEnabled = false

  // --- outer holo frame with pinstripes and corner ornaments ---
  const frame = ctx.createLinearGradient(0, 0, width, height)
  frame.addColorStop(0, '#8a5a1e')
  frame.addColorStop(0.2, '#f2c866')
  frame.addColorStop(0.42, '#fff3c4')
  frame.addColorStop(0.6, '#c9973f')
  frame.addColorStop(0.82, '#f2c866')
  frame.addColorStop(1, '#8a5a1e')
  ctx.fillStyle = frame
  ctx.fillRect(0, 0, width, height)
  // beveled edge
  ctx.fillStyle = 'rgba(255, 250, 225, 0.5)'
  ctx.fillRect(0, 0, width, 4)
  ctx.fillRect(0, 0, 4, height)
  ctx.fillStyle = 'rgba(70, 42, 8, 0.45)'
  ctx.fillRect(0, height - 4, width, 4)
  ctx.fillRect(width - 4, 0, 4, height)
  ctx.fillStyle = '#0a120d'
  ctx.fillRect(20, 20, width - 40, height - 40)
  ctx.strokeStyle = 'rgba(242, 200, 102, 0.6)'
  ctx.lineWidth = 2
  ctx.strokeRect(27, 27, width - 54, height - 54)
  ctx.strokeStyle = 'rgba(242, 200, 102, 0.22)'
  ctx.strokeRect(33, 33, width - 66, height - 66)
  drawPixelCorner(ctx, 30, 30, 1, 1)
  drawPixelCorner(ctx, width - 30, 30, -1, 1)
  drawPixelCorner(ctx, 30, height - 30, 1, -1)
  drawPixelCorner(ctx, width - 30, height - 30, -1, -1)

  // --- header plate ---
  ctx.fillStyle = '#10231a'
  ctx.fillRect(46, 48, width - 92, 52)
  ctx.strokeStyle = 'rgba(242, 200, 102, 0.7)'
  ctx.lineWidth = 2
  ctx.strokeRect(46, 48, width - 92, 52)
  ctx.fillStyle = '#f2c866'
  ctx.fillRect(46, 48, 6, 52)
  ctx.fillRect(width - 52, 48, 6, 52)
  ctx.font = '900 30px monospace'
  ctx.textAlign = 'left'
  ctx.fillStyle = '#f2c866'
  ctx.fillText('RIALO TEMPLE AGENT', 66, 84)
  ctx.textAlign = 'right'
  ctx.font = '900 13px monospace'
  ctx.fillStyle = '#78ecff'
  ctx.fillText('★ AGENT CARD', width - 66, 82)

  // --- art window: holo bands, scenery, character ---
  const artX = 46
  const artY = 116
  const artW = width - 92
  const artH = 420
  const sky = ctx.createLinearGradient(0, artY, 0, artY + artH)
  sky.addColorStop(0, '#0f2c3a')
  sky.addColorStop(0.45, '#14351f')
  sky.addColorStop(0.66, '#1d4d2c')
  sky.addColorStop(0.67, '#2a6a3c')
  sky.addColorStop(1, '#1f5730')
  ctx.fillStyle = sky
  ctx.fillRect(artX, artY, artW, artH)

  // iridescent holo bands
  ctx.save()
  ctx.beginPath()
  ctx.rect(artX, artY, artW, artH)
  ctx.clip()
  const bandColors = ['rgba(120,236,255,0.10)', 'rgba(200,134,255,0.10)', 'rgba(242,200,102,0.10)', 'rgba(87,227,159,0.08)']
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = bandColors[i % bandColors.length]
    ctx.beginPath()
    ctx.moveTo(artX - 220 + i * 92, artY)
    ctx.lineTo(artX - 150 + i * 92, artY)
    ctx.lineTo(artX + 50 + i * 92, artY + artH)
    ctx.lineTo(artX - 20 + i * 92, artY + artH)
    ctx.closePath()
    ctx.fill()
  }
  // moon + stars
  ctx.fillStyle = 'rgba(255, 244, 200, 0.9)'
  ctx.beginPath()
  ctx.arc(artX + artW - 74, artY + 62, 26, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#0f2c3a'
  ctx.beginPath()
  ctx.arc(artX + artW - 62, artY + 54, 22, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(242, 200, 102, 0.7)'
  const sparkles = [[90, 60], [170, 120], [420, 70], [330, 150], [500, 190], [110, 200], [260, 55], [460, 260]]
  sparkles.forEach(([sx, sy]) => {
    ctx.fillRect(artX + sx, artY + sy - 5, 3, 13)
    ctx.fillRect(artX + sx - 5, artY + sy, 13, 3)
  })
  // layered pagoda silhouette
  ctx.fillStyle = 'rgba(8, 15, 11, 0.7)'
  const px = artX + 56
  const py = artY + 282
  ctx.fillRect(px + 22, py - 118, 44, 16)
  ctx.fillRect(px + 10, py - 102, 68, 10)
  ctx.fillRect(px + 26, py - 92, 36, 22)
  ctx.fillRect(px + 2, py - 70, 84, 10)
  ctx.fillRect(px + 16, py - 60, 56, 28)
  ctx.fillRect(px - 8, py - 32, 104, 10)
  ctx.fillRect(px + 8, py - 22, 72, 22)
  // grass tufts
  ctx.fillStyle = 'rgba(12, 28, 16, 0.8)'
  for (let i = 0; i < 12; i++) {
    ctx.fillRect(artX + 20 + i * 46, artY + artH - 18 - (i % 3) * 6, 6, 12)
  }
  ctx.restore()

  // character + soft shadow
  const portrait = buildAgentPortraitCanvas(config, 16)
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.beginPath()
  ctx.ellipse(artX + artW / 2, artY + artH - 26, 104, 16, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.drawImage(portrait, artX + Math.round((artW - portrait.width) / 2), artY + artH - portrait.height - 30)

  // art window double frame
  ctx.strokeStyle = '#f2c866'
  ctx.lineWidth = 3
  ctx.strokeRect(artX, artY, artW, artH)
  ctx.strokeStyle = 'rgba(255, 243, 196, 0.35)'
  ctx.lineWidth = 1
  ctx.strokeRect(artX + 4, artY + 4, artW - 8, artH - 8)

  // --- name ribbon ---
  const ribbonY = 556
  const ribbon = ctx.createLinearGradient(0, ribbonY, 0, ribbonY + 64)
  ribbon.addColorStop(0, '#ffe9a0')
  ribbon.addColorStop(0.5, '#f2c866')
  ribbon.addColorStop(1, '#c9973f')
  ctx.fillStyle = ribbon
  ctx.beginPath()
  ctx.moveTo(70, ribbonY)
  ctx.lineTo(width - 70, ribbonY)
  ctx.lineTo(width - 46, ribbonY + 32)
  ctx.lineTo(width - 70, ribbonY + 64)
  ctx.lineTo(70, ribbonY + 64)
  ctx.lineTo(46, ribbonY + 32)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#171009'
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.fillStyle = '#171009'
  ctx.font = '900 34px monospace'
  ctx.textAlign = 'center'
  const displayName = (config.name || 'Agent').slice(0, 14).toUpperCase()
  ctx.fillText(displayName, width / 2, ribbonY + 44)

  // --- flavor text box ---
  const flavorY = 648
  const flavorH = 118
  ctx.fillStyle = '#10231a'
  ctx.fillRect(46, flavorY, width - 92, flavorH)
  ctx.strokeStyle = 'rgba(120, 236, 255, 0.45)'
  ctx.lineWidth = 2
  ctx.strokeRect(46, flavorY, width - 92, flavorH)
  ctx.fillStyle = 'rgba(120, 236, 255, 0.8)'
  ;[[46, flavorY], [width - 54, flavorY], [46, flavorY + flavorH - 8], [width - 54, flavorY + flavorH - 8]]
    .forEach(([cx, cy]) => ctx.fillRect(cx, cy, 8, 8))
  ctx.font = 'italic 700 19px monospace'
  ctx.fillStyle = '#e9f4ee'
  const flavor = (config.cardText || DEFAULT_AGENT_CONFIG.cardText).slice(0, 120)
  const lines = wrapCanvasText(ctx, `“${flavor}”`, width - 150)
  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, flavorY + 40 + index * 28)
  })

  // --- footer: divider, logo, credit ---
  ctx.strokeStyle = 'rgba(242, 200, 102, 0.4)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(90, 796)
  ctx.lineTo(width - 90, 796)
  ctx.stroke()
  ctx.fillStyle = '#f2c866'
  ctx.fillRect(width / 2 - 4, 792, 8, 8)
  try {
    const logo = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = '/rialo_logo.png'
    })
    const logoH = 44
    const logoW = Math.round((logo.width / logo.height) * logoH)
    ctx.drawImage(logo, Math.round(width / 2 - logoW / 2), 806, logoW, logoH)
  } catch {
    ctx.fillStyle = '#f2c866'
    ctx.font = '900 26px monospace'
    ctx.fillText('RIALO', width / 2, 836)
  }
  ctx.fillStyle = 'rgba(247, 241, 223, 0.9)'
  ctx.font = '800 17px monospace'
  ctx.fillText('Build by NXR for Rialo', width / 2, 872)

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
