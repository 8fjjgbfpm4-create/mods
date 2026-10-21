# isaac-mods

Claude Code mods.

- **superbuild**: `/superbuild <goal>`. Run `/model opus` first. The orchestrator plans the goal, splits it into chunks, and routes each to a Haiku, Sonnet or Opus subagent with matching effort. At most 5 agents run at once.
- **minibuild**: `/minibuild <goal>`. Same routing, but the orchestrator is meant to run on Sonnet (`/model sonnet`) to save tokens, and it escalates ambiguous planning to an Opus agent.
- **videoad**: `/videoad <brief>`. Plans a text-and-motion-graphics ad and builds it in Remotion, rendered in 9:16, 1:1 and 16:9 from one source.

## Install

```
/plugin marketplace add 8fjjgbfpm4-create/mods
/plugin install superbuild@isaac-mods
/plugin install minibuild@isaac-mods
/plugin install videoad@isaac-mods
```
