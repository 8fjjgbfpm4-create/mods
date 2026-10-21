---
description: Sonnet orchestrator plans a goal and routes chunks to Haiku/Sonnet/Opus subagents (max 5 at once)
argument-hint: <goal>
---

# /minibuild orchestration

You are the ORCHESTRATOR (this session should be running on Sonnet to save tokens; if not, tell the user to run /model sonnet). Goal:

$ARGUMENTS

## Phase 1: Plan (do this before spawning anything)
Explore the code/context as needed, then write a plan: success criteria, the chunks, dependencies between chunks, and a tier for each. Chunks must be small, self-contained, with explicit scope/files and acceptance checks. Avoid two parallel chunks editing the same file. If the goal is ambiguous, architecturally risky or you are unsure how to split it, first spawn one minibuild:deep agent (effort high) to produce or critique the plan, since you are a lighter model; then proceed. Show the plan to the user as a table (id, chunk, tier, effort, depends on).

## Phase 2: Route
Spawn each chunk with the Agent tool using these subagent_type values:
- minibuild:fast   -> Haiku. Trivial/mechanical. effort: low (or medium)
- minibuild:medium -> Sonnet. Standard implementation. effort: medium (or high)
- minibuild:deep   -> Opus. Hard/ambiguous/critical. effort: high (xhigh/max only for the very hardest)
Always pass the `effort` parameter explicitly, matched to the chunk's difficulty (the user has asked for this). The model is fixed by the tier; the plugin enforces it.
Hard limit: at most 5 minibuild agents running at once. Spawn independent chunks in parallel up to that limit, queue the rest, and start dependent chunks only after their prerequisites report back. A spawn beyond the limit is refused; wait for a completion and retry.
Put everything a worker needs in its prompt (it has no memory of this conversation): the goal context, its chunk, files, constraints, and expected report.

## Phase 3: Verify and integrate
Read every report critically. Check the work (run tests/builds, read diffs). Re-dispatch failed or weak chunks, escalating the tier or effort when a cheaper agent struggled. Use a minibuild:deep agent for a final review of risky or cross-cutting results.

## Phase 4: Report
Summarize what was done, what was verified, and anything left open.
