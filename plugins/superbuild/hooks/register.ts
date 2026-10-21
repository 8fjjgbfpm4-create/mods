import type { Register } from 'claude-code'

const MAX_AGENTS = 5

type Tier = { model: 'haiku' | 'sonnet' | 'opus'; efforts: readonly string[]; fallback: string }

const TIERS: Record<string, Tier> = {
  'superbuild:fast': { model: 'haiku', efforts: ['low', 'medium'], fallback: 'low' },
  'superbuild:medium': { model: 'sonnet', efforts: ['medium', 'high'], fallback: 'medium' },
  'superbuild:deep': { model: 'opus', efforts: ['high', 'xhigh', 'max'], fallback: 'high' },
}

const WORKER_RULES =
  'You are a worker in a /superbuild run. Do exactly the chunk you are given, stay inside its stated scope and files, ' +
  'and finish with a short report: what you did, files touched, anything the orchestrator must know or verify. Do not expand scope.'

const AGENTS = [
  {
    name: 'fast',
    description: 'superbuild FAST tier (Haiku, low effort): trivial, mechanical, well-specified chunks such as renames, boilerplate, simple lookups, formatting, small config edits.',
    model: 'haiku',
    effort: 'low',
    prompt: `${WORKER_RULES} You handle simple, mechanical work: be quick and literal.`,
  },
  {
    name: 'medium',
    description: 'superbuild MEDIUM tier (Sonnet, medium effort): ordinary implementation chunks such as a feature in known files, tests, refactors with a clear spec, moderate debugging.',
    model: 'sonnet',
    effort: 'medium',
    prompt: `${WORKER_RULES} You handle standard implementation work: read the surrounding code, match its conventions, and verify with tests or checks where possible.`,
  },
  {
    name: 'deep',
    description: 'superbuild DEEP tier (Opus, high effort): hard chunks such as architecture, tricky algorithms, subtle bugs, security-sensitive code, cross-cutting design, final review.',
    model: 'opus',
    effort: 'high',
    prompt: `${WORKER_RULES} You handle the hardest work: reason carefully about edge cases, invariants and failure modes, and verify your result before reporting.`,
  },
] as const

const orchestratorBrief = (goal: string) => `# /superbuild orchestration

You are the ORCHESTRATOR (this session should be running on Opus; if not, tell the user to run /model opus). Goal:

${goal}

## Phase 1: Plan (do this before spawning anything)
Explore the code/context as needed, then write a plan: success criteria, the chunks, dependencies between chunks, and a tier for each. Chunks must be small, self-contained, with explicit scope/files and acceptance checks. Avoid two parallel chunks editing the same file. Show the plan to the user as a table (id, chunk, tier, effort, depends on).

## Phase 2: Route
Spawn each chunk with the Agent tool using these subagent_type values:
- superbuild:fast   -> Haiku. Trivial/mechanical. effort: low (or medium)
- superbuild:medium -> Sonnet. Standard implementation. effort: medium (or high)
- superbuild:deep   -> Opus. Hard/ambiguous/critical. effort: high (xhigh/max only for the very hardest)
Always pass the \`effort\` parameter explicitly, matched to the chunk's difficulty (the user has asked for this). The model is fixed by the tier; the plugin enforces it.
Hard limit: at most ${MAX_AGENTS} superbuild agents running at once. Spawn independent chunks in parallel up to that limit, queue the rest, and start dependent chunks only after their prerequisites report back. A spawn beyond the limit is refused; wait for a completion and retry.
Put everything a worker needs in its prompt (it has no memory of this conversation): the goal context, its chunk, files, constraints, and expected report.

## Phase 3: Verify and integrate
Read every report critically. Check the work (run tests/builds, read diffs). Re-dispatch failed or weak chunks, escalating the tier or effort when a cheaper agent struggled. Use a superbuild:deep agent for a final review of risky or cross-cutting results.

## Phase 4: Report
Summarize what was done, what was verified, and anything left open.`

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    for (const a of AGENTS) await $.agent.register(a)
    await $.command.register({
      name: 'superbuild',
      description: 'Opus orchestrator plans a goal and routes chunks to Haiku/Sonnet/Opus subagents (max 5 at once)',
      argumentHint: '<goal>',
    })
    return next(e)
  })

  on('command.run', { command: 'superbuild' }, async ($, e) => {
    const goal = String(e.args ?? '').trim()
    if (!goal) return { text: 'Usage: /superbuild <goal>' }
    await $.prompt.submit({ text: orchestratorBrief(goal) })
    return { text: `superbuild: orchestrator planning "${goal}" (max ${MAX_AGENTS} agents at once)` }
  })

  // Enforce tier model, effort bounds and the concurrency cap on every superbuild spawn.
  on('tool.call', { tool: 'Agent' }, async ($, e, next) => {
    const tier = e.input.subagent_type ? TIERS[e.input.subagent_type] : undefined
    if (!tier) return next(e)

    const running = (await $.agent.list()).filter(
      a => a.type.startsWith('superbuild:') && (a.status === 'running' || a.status === 'pending'),
    ).length
    if (running >= MAX_AGENTS) {
      return { deny: `superbuild: ${running} agents already running (max ${MAX_AGENTS}). Wait for one to finish, then retry.` }
    }

    const asked = e.input.effort
    const effort = asked && tier.efforts.includes(asked) ? asked : tier.fallback
    return next({ ...e, input: { ...e.input, model: tier.model, effort: effort as typeof e.input.effort } })
  })
}
