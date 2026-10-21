---
description: Plan and build a high-end Remotion video ad (9:16, 1:1, 16:9) from a brief
argument-hint: <brief>
---

# /videoad: make a genuinely excellent video ad in Remotion

You are the producer. Brief from the user:

$ARGUMENTS

Deliverable: a Remotion project in ./videoad-<slug>/ that renders one 15-second text-and-motion-graphics ad (no photos or footage, no voiceover) in three aspect ratios from one source: Vertical 9:16, Square 1:1, Landscape 16:9, saved as MP4s in out/.

## Step 1: Clarify only if essential
If the brief lacks the product/brand name, the target audience, or the call to action, make a sensible choice and state it rather than interrogating the user. Pick a slug.

## Step 2: Concept (spawn one videoad:strategist, effort high)
Give it the full brief and the path ./videoad-<slug>/CREATIVE.md. Review the result. If the hook is not scroll-stopping, send it back once with specific notes.

## Step 3: Scaffold and build (videoad:animator, effort high)
Have one animator scaffold the project (package.json with remotion, @remotion/cli, react, @remotion/transitions, @remotion/google-fonts; tsconfig; src/index.ts; src/Root.tsx with the three Compositions) and build the shared theme and base components. Then, in parallel (never two agents editing the same file), spawn animators per scene group, each with the storyboard, the style system and its exact files. At most 3 videoad agents run at once.

## Step 4: Render check
Render stills for the key frames and one full vertical render. Fix compile or render errors yourself or via an animator.

## Step 5: Critique loop (videoad:critic, effort high), up to 2 rounds
The critic reviews stills of all three compositions against CREATIVE.md and the craft rules. Apply its fixes (via animators) and re-check. Stop when it signs off or after 2 rounds.

## Step 6: Final render and report
Render all three MP4s into out/. Report: the concept in two sentences, the file paths, the render commands, and any known limitations. If a render could not run in this environment, say exactly that and give the commands to run locally.

Use the Agent tool with subagent_type videoad:strategist, videoad:animator or videoad:critic and pass the effort parameter explicitly (the user asked for it). Workers have no memory of this chat, so put everything they need in each prompt.

AD CRAFT RULES (apply always)
- The first 1.5 seconds must stop the scroll: a bold claim, a question, or a striking visual. Never open on a logo or a fade-in.
- One idea per ad. One message, one call to action. Cut anything that does not serve it.
- Pace: a new visual beat every 1-2 seconds. Hard cuts, wipes and scale/position transitions, not slow fades.
- Typography is the hero in a text-and-motion ad: huge, high-contrast, 2-3 sizes only, max ~7 words on screen at a time, animate by word or line with spring easing and slight overshoot.
- Palette: one dominant brand colour, one accent, near-black or near-white background. Add depth with gradients, soft shadows, grain, or an animated background so it never looks flat.
- Motion: ease everything (spring, Easing.bezier). Nothing appears or moves linearly. Stagger elements by 3-6 frames. Add subtle continuous motion (slow zoom, drift) to every held shot.
- Safe zones for vertical: keep key content out of the top 14% and bottom 22%, and away from the right 12%.
- End on a clear CTA card held for at least 1.5 seconds with the brand name and one action.
- Length: 15s default (6s and 30s only if asked). 30 fps.
