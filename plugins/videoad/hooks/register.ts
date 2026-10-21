import type { Register } from 'claude-code'

const MAX_AGENTS = 3

type Tier = { model: 'sonnet' | 'opus'; efforts: readonly string[]; fallback: string }

const TIERS: Record<string, Tier> = {
  'videoad:strategist': { model: 'opus', efforts: ['high', 'xhigh'], fallback: 'high' },
  'videoad:animator': { model: 'sonnet', efforts: ['medium', 'high'], fallback: 'high' },
  'videoad:critic': { model: 'opus', efforts: ['high', 'xhigh'], fallback: 'high' },
}

const CRAFT = `AD CRAFT RULES (apply always)
- The first 1.5 seconds must stop the scroll: a bold claim, a question, or a striking visual. Never open on a logo or a fade-in.
- One idea per ad. One message, one call to action. Cut anything that does not serve it.
- Pace: a new visual beat every 1-2 seconds. Hard cuts, wipes and scale/position transitions, not slow fades.
- Typography is the hero in a text-and-motion ad: huge, high-contrast, 2-3 sizes only, max ~7 words on screen at a time, animate by word or line with spring easing and slight overshoot.
- Palette: one dominant brand colour, one accent, near-black or near-white background. Add depth with gradients, soft shadows, grain, or an animated background so it never looks flat.
- Motion: ease everything (spring, Easing.bezier). Nothing appears or moves linearly. Stagger elements by 3-6 frames. Add subtle continuous motion (slow zoom, drift) to every held shot.
- Safe zones for vertical: keep key content out of the top 14% and bottom 22%, and away from the right 12%.
- End on a clear CTA card held for at least 1.5 seconds with the brand name and one action.
- Length: 15s default (6s and 30s only if asked). 30 fps.`

const REMOTION = `REMOTION TECHNICAL RULES
- One project in ./videoad-<slug>/. Source of truth is one scene-based composition driven by props and useVideoConfig(), so layout adapts to the aspect ratio. Register three Compositions in src/Root.tsx: Vertical 1080x1920, Square 1080x1080, Landscape 1920x1080, all 30 fps with identical durationInFrames.
- Use useCurrentFrame, interpolate (with extrapolate clamp), spring, Sequence (or TransitionSeries from @remotion/transitions), AbsoluteFill. Never use CSS transitions, CSS animations, setTimeout or Math.random() for visuals: everything must be a pure function of the frame.
- Size text from the composition's width/height, not fixed pixels, so all three ratios look intentional. For landscape use a wider layout, not just a scaled-up vertical one.
- Fonts via @remotion/google-fonts (or a system font stack). Keep total file count modest and components small.
- Cloud sandbox render: Chromium is at /opt/pw-browsers/chromium. Pass --browser-executable=/opt/pw-browsers/chromium (or set browserExecutable) and do not download a browser. Try: npx remotion render src/index.ts Vertical out/vertical.mp4. Preview frames with: npx remotion still src/index.ts Vertical out/f.png --frame=45.
- Install with npm. If npm or the network is blocked, say so plainly instead of faking output.`

const WORKER = `You are a worker in a /videoad run. Do exactly the job you are given and finish with a short report (files written, what to check). Be specific and decisive; no generic filler.`


export const register: Register = on => {
  on('tool.call', { tool: 'Agent' }, async ($, e, next) => {
    const tier = e.input.subagent_type ? TIERS[e.input.subagent_type] : undefined
    if (!tier) return next(e)

    const running = (await $.agent.list()).filter(
      a => a.type.startsWith('videoad:') && (a.status === 'running' || a.status === 'pending'),
    ).length
    if (running >= MAX_AGENTS) {
      return { deny: `videoad: ${running} agents already running (max ${MAX_AGENTS}). Wait for one to finish, then retry.` }
    }

    const asked = e.input.effort
    const effort = asked && tier.efforts.includes(asked) ? asked : tier.fallback
    return next({ ...e, input: { ...e.input, model: tier.model, effort: effort as typeof e.input.effort } })
  })
}
