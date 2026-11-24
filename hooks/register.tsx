import type { Register, ThemeSetArgs, ThemeStyle } from 'claude-code'

import { makeColors } from './make-colors.js'

// Halftone Sky: a printed-look blue sky with white cumulus clouds.
// Light mode is pale cloud-white; dark mode is a deep version of the photo's
// royal blue. Both sit over the same printed sky.
const { theme, problems } = makeColors({
  label: 'Halftone Sky',
  roles: { accent: '#2b5de6', danger: '#d0393f', success: '#2e8b57', warning: '#c08a1e', pro: '#7b5cd6' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#eaf0fd',
        'surface-1': '#f2f6fe',
        'surface-2': '#f9fbff',
        'text-primary': '#0d1b45',
        'text-secondary': '#2a3c70',
        'text-muted': '#4b5b8c',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0b1c55',
        'surface-1': '#0e2260',
        'surface-2': '#112668',
        'surface-3': '#13296e',
        'text-primary': '#ffffff',
        'text-secondary': '#dfe7ff',
        'text-muted': '#b4c4f2',
      },
    },
  },
})

// ---- The backdrop: the photo redrawn as a halftone print ---------------------
//
// The clouds are first drawn as soft grey light: lobes lit from the upper left
// with shaded undersides, roughened, mottled and smeared sideways by noise.
// That light is then printed as real halftone: a screen of soft dots masked by
// it and cut off at a level, so each dot grows with how bright the cloud is. The sky keeps the photo's
// flat royal blue, its fine dot grain and the print's horizontal lines. It
// holds still like the photo, so once drawn it costs nothing.

type Puff = readonly [x: number, y: number, r: number]

type Mass = { x: number; base: number; width: number; height: number; squareness: number; seed: number; puffs: number }

// A small seeded random, so the clouds come out the same every time.
const seeded = (start: number) => {
  let seed = start

  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// One cloud mass with its base on y = base: big lobes filling a domed outline
// (squarer for a tower), then small ones crowding its top edge, the
// cauliflower edge of a cumulus.
const lobes = ({ x: cx, base, width, height, squareness, seed, puffs }: Mass): Puff[] => {
  const rand = seeded(seed)
  const half = width / 2
  const top = (x: number) => height * Math.max(0, 1 - Math.abs(x / half) ** squareness) ** (1 / squareness)
  const out: Puff[] = []

  // A solid middle first, so no sky shows through the body.
  for (const at of [-0.45, 0, 0.45]) {
    const x = at * half
    out.push([cx + x, base - top(x) * 0.45, Math.max(height * 0.12, top(x) * 0.42)])
  }

  for (let i = 0; i < puffs; i++) {
    const x = (rand() * 2 - 1) * half * 0.85
    const r = height * (0.09 + rand() * 0.15)
    const room = Math.max(0, top(x) - r * 1.6)
    out.push([cx + x, base - (r * 0.6 + rand() * room), r])
  }

  for (let i = 0; i < Math.round(puffs * 0.9); i++) {
    const x = (rand() * 2 - 1) * half * 0.92
    const r = height * (0.035 + rand() * 0.07)
    out.push([cx + x, base - Math.max(r, top(x) - r * (0.3 + rand() * 0.9)), r])
  }

  return out
}

// Laid out after the photo: a bank cut by the left edge, the tall tower,
// a lower shoulder to its right, and a small cloud over a hazy column on the
// right. The middle and the foot stay mostly sky.
const MASSES: readonly Mass[] = [
  { x: 190, base: 560, width: 600, height: 330, squareness: 2, seed: 11, puffs: 34 },
  { x: 640, base: 600, width: 560, height: 520, squareness: 3, seed: 7, puffs: 50 },
  { x: 1030, base: 560, width: 560, height: 300, squareness: 2.2, seed: 19, puffs: 34 },
  { x: 1440, base: 760, width: 250, height: 190, squareness: 2, seed: 23, puffs: 16 },
]

// Faint light under the clouds that the noise smears into streaks.
const HAZE: readonly (readonly [cx: number, cy: number, rx: number, ry: number, light: number])[] = [
  [660, 650, 540, 80, 0.62],
  [260, 600, 280, 50, 0.55],
  [1020, 610, 300, 50, 0.52],
  [1350, 700, 170, 60, 0.58],
  [1450, 900, 190, 200, 0.66],
]

const round = (n: number) => Math.round(n * 10) / 10

const grey = (light: number) => `#${Math.round(light * 255).toString(16).padStart(2, '0').repeat(3)}`

// Lower lobes first, so each upper lobe's shaded underside falls on the one
// below, as it does in a real cumulus.
const LOBES = MASSES.flatMap(lobes)
  .sort((a, b) => b[1] - a[1])
  .map(([x, y, r]) => `<circle cx="${round(x)}" cy="${round(y)}" r="${round(r)}"/>`)
  .join('')

const HAZE_MARKUP = HAZE.map(
  ([cx, cy, rx, ry, light]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${grey(light)}"/>`,
).join('')

const SCENE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<style>
.s0 { stop-color: #2955dd } .s1 { stop-color: #2c5ae3 } .s2 { stop-color: #3361e8 }
.grain { fill: #5b81ee; opacity: 0.6 }
.ink { flood-color: #f7f9ff; flood-opacity: 1 }
.streak { flood-color: #ffffff; flood-opacity: 0.16 }
.line { stroke: #1e49cf; stroke-width: 1; opacity: 0.32 }
</style>
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" class="s0"/><stop offset="0.6" class="s1"/><stop offset="1" class="s2"/>
</linearGradient>
<radialGradient id="lobe" cx="0.5" cy="0.5" r="0.5" fx="0.36" fy="0.3">
<stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#efefef"/>
<stop offset="0.85" stop-color="#b4b4b4"/><stop offset="1" stop-color="#929292"/>
</radialGradient>
<radialGradient id="cone">
<stop offset="0" stop-color="#ffffff" stop-opacity="1"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
</radialGradient>
<linearGradient id="underside" x1="0" y1="200" x2="0" y2="820" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="#000000" stop-opacity="0"/><stop offset="0.55" stop-color="#000000" stop-opacity="0.34"/>
<stop offset="1" stop-color="#000000" stop-opacity="0.6"/>
</linearGradient>
<pattern id="grain" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="2" cy="2" r="0.75" class="grain"/></pattern>
<pattern id="lines" width="10" height="5" patternUnits="userSpaceOnUse"><line x1="0" y1="0.6" x2="10" y2="0.6" class="line"/></pattern>
<pattern id="screen" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="3" fill="url(#cone)"/><circle cx="0" cy="0" r="3" fill="url(#cone)"/><circle cx="6" cy="0" r="3" fill="url(#cone)"/><circle cx="0" cy="6" r="3" fill="url(#cone)"/><circle cx="6" cy="6" r="3" fill="url(#cone)"/></pattern>
<filter id="soften" x="-200" y="-200" width="2000" height="1400" filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation="22"/></filter>
<filter id="billow" x="-10" y="-10" width="1620" height="1020" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="3" result="warp"/>
<feDisplacementMap in="SourceGraphic" in2="warp" scale="44" xChannelSelector="R" yChannelSelector="G" result="w1"/>
<feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="8" result="crinkle"/>
<feDisplacementMap in="w1" in2="crinkle" scale="10" xChannelSelector="R" yChannelSelector="G" result="w2"/>
<feTurbulence type="fractalNoise" baseFrequency="0.0009 0.08" numOctaves="2" seed="5" result="bands"/>
<feColorMatrix in="bands" type="matrix" values="1 0 0 0 0  0 0 0 0 0.5  0 0 0 0 0  0 0 0 0 1" result="sideways"/>
<feDisplacementMap in="w2" in2="sideways" scale="34" xChannelSelector="R" yChannelSelector="G" result="w3"/>
<feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="4" seed="11" result="mottle"/>
<feColorMatrix in="mottle" type="matrix" values="0.8 0 0 0 0.6  0.8 0 0 0 0.6  0.8 0 0 0 0.6  0 0 0 0 1" result="tone"/>
<feComposite in="w3" in2="tone" operator="arithmetic" k1="1" result="toned"/>
<feGaussianBlur in="toned" stdDeviation="2.4"/>
</filter>
<filter id="print" x="0" y="0" width="1600" height="1000" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feComponentTransfer in="SourceAlpha" result="dots"><feFuncA type="linear" slope="8" intercept="-1.8"/></feComponentTransfer>
<feFlood class="ink" result="ink"/>
<feComposite in="ink" in2="dots" operator="in"/>
</filter>
<filter id="streaks" x="0" y="0" width="1600" height="1000" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="0.0006 0.11" numOctaves="2" seed="2" result="noise"/>
<feColorMatrix in="noise" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  2.4 0 0 0 -1.32" result="bands"/>
<feFlood class="streak" result="light"/>
<feComposite in="light" in2="bands" operator="in"/>
</filter>
</defs>
<rect width="1600" height="1000" fill="url(#sky)"/>
<rect width="1600" height="1000" fill="url(#grain)"/>
<rect width="1600" height="1000" fill="#000000" filter="url(#streaks)"/>
<mask id="light" x="0" y="0" width="1600" height="1000" maskUnits="userSpaceOnUse">
<rect width="1600" height="1000" fill="#000000"/>
<g filter="url(#billow)">
<g filter="url(#soften)">${HAZE_MARKUP}</g>
<g fill="url(#lobe)">${LOBES}</g>
</g>
<rect width="1600" height="1000" fill="url(#underside)"/>
</mask>
<g filter="url(#print)"><rect width="1600" height="1000" fill="url(#screen)" mask="url(#light)"/></g>
<rect width="1600" height="1000" fill="url(#lines)"/>
</svg>`

// ---- Messages: sky-blue bubbles for you, cloud cards for replies -------------

const STYLE: ThemeStyle = {
  UserMessage: {
    color: '#ffffff',
    backgroundColor: '#2b5de6',
    radius: [18, 18, 6, 18],
    paddingX: 14,
    paddingY: 10,
  },
  AssistantMessage: {
    backgroundColor: 'surface-1',
    radius: 16,
    paddingX: 16,
    paddingY: 12,
    shadow: { x: 0, y: 2, blur: 10, color: '#0b1a4a22' },
  },
  ToolUse: { backgroundColor: 'surface-1', radius: 10, paddingX: 10 },
}

const LOOK: ThemeSetArgs = {
  colors: theme,
  backdrop: { scene: 'halftone-sky', glass: { blur: 6, opacity: 0.6 } },
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))

    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }

    let set

    try {
      set = await $.theme.set({ ...LOOK, style: STYLE })
    } catch (error) {
      // An older app that doesn't take `style` still gets the colours and sky.
      $.ui.log(String(error))
      set = await $.theme.set(LOOK)
    }

    if (!set.isDrawn) {
      $.ui.status(set.reason)
    }

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }

    const { Svg } = $.ui.resolve(e)

    return <Svg source={SCENE} alt="A royal-blue sky with white cumulus clouds, printed in halftone dots" />
  })
}
