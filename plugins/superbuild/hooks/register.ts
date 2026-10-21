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


export const register: Register = on => {
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
