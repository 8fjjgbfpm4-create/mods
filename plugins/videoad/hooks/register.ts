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

const AGENTS = [
  {
    name: 'strategist',
    description: 'videoad STRATEGIST (Opus): turns a brief into the ad concept: audience, single big idea, hook options, script with timings, shot-by-shot storyboard, and a style system (palette, fonts, motion language).',
    model: 'opus',
    effort: 'high',
    prompt: `${WORKER}\n\nYou are a world-class ad creative director. Output a concise creative document saved to the path you are given, containing: audience and one-sentence big idea; 3 hook candidates and the chosen one with why; a timed script (on-screen words per beat); a shot-by-shot storyboard with duration in frames at 30fps, the visual, the motion and the transition for each beat; and a style system (hex colours, fonts, easing, background treatment). Respect these:\n\n${CRAFT}`,
  },
  {
    name: 'animator',
    description: 'videoad ANIMATOR (Sonnet): implements Remotion scenes, components and compositions from a storyboard and style system, and renders them.',
    model: 'sonnet',
    effort: 'high',
    prompt: `${WORKER}\n\nYou are an expert Remotion engineer and motion designer. Implement exactly what the storyboard and style system specify; polish the motion rather than adding scope.\n\n${REMOTION}\n\n${CRAFT}`,
  },
  {
    name: 'critic',
    description: 'videoad CRITIC (Opus): reviews rendered still frames and the code against the storyboard and ad-craft rules and returns a prioritized fix list.',
    model: 'opus',
    effort: 'high',
    prompt: `${WORKER}\n\nYou are a ruthless ad reviewer. Render stills with remotion still at the key frames (hook at ~frame 10 and 30, mid beats, the CTA) in all three compositions, view them with the Read tool, and judge: scroll-stopping hook, legibility, hierarchy, safe zones, overflow or clipping in each aspect ratio, palette, motion quality, CTA clarity. Return a prioritized numbered fix list with exact file and value changes. If it is genuinely excellent, say so.\n\n${CRAFT}\n\n${REMOTION}`,
  },
] as const

const brief = (goal: string) => `# /videoad: make a genuinely excellent video ad in Remotion

You are the producer. Brief from the user:

${goal}

Deliverable: a Remotion project in ./videoad-<slug>/ that renders one 15-second text-and-motion-graphics ad (no photos or footage, no voiceover) in three aspect ratios from one source: Vertical 9:16, Square 1:1, Landscape 16:9, saved as MP4s in out/.

## Step 1: Clarify only if essential
If the brief lacks the product/brand name, the target audience, or the call to action, make a sensible choice and state it rather than interrogating the user. Pick a slug.

## Step 2: Concept (spawn one videoad:strategist, effort high)
Give it the full brief and the path ./videoad-<slug>/CREATIVE.md. Review the result. If the hook is not scroll-stopping, send it back once with specific notes.

## Step 3: Scaffold and build (videoad:animator, effort high)
Have one animator scaffold the project (package.json with remotion, @remotion/cli, react, @remotion/transitions, @remotion/google-fonts; tsconfig; src/index.ts; src/Root.tsx with the three Compositions) and build the shared theme and base components. Then, in parallel (never two agents editing the same file), spawn animators per scene group, each with the storyboard, the style system and its exact files. At most ${MAX_AGENTS} videoad agents run at once.

## Step 4: Render check
Render stills for the key frames and one full vertical render. Fix compile or render errors yourself or via an animator.

## Step 5: Critique loop (videoad:critic, effort high), up to 2 rounds
The critic reviews stills of all three compositions against CREATIVE.md and the craft rules. Apply its fixes (via animators) and re-check. Stop when it signs off or after 2 rounds.

## Step 6: Final render and report
Render all three MP4s into out/. Report: the concept in two sentences, the file paths, the render commands, and any known limitations. If a render could not run in this environment, say exactly that and give the commands to run locally.

Use the Agent tool with subagent_type videoad:strategist, videoad:animator or videoad:critic and pass the effort parameter explicitly (the user asked for it). Workers have no memory of this chat, so put everything they need in each prompt.

${CRAFT}`

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    for (const a of AGENTS) await $.agent.register(a)
    await $.command.register({
      name: 'videoad',
      description: 'Plan and build a high-end Remotion video ad (9:16, 1:1, 16:9) from a brief',
      argumentHint: '<brief>',
    })
    return next(e)
  })

  on('command.run', { command: 'videoad' }, async ($, e) => {
    const goal = String(e.args ?? '').trim()
    if (!goal) return { text: 'Usage: /videoad <brief: product, audience, message, call to action>' }
    void $.prompt.submit({ text: brief(goal) }).catch(() => {})
    return { text: `videoad: planning and building an ad for "${goal}"` }
  })

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
