---
name: socratic-requirements
description: This skill should be used when the user says "help me brainstorm", "I want to build something but don't know where to start", "收集需求", "腦力激盪", "幫我想清楚", "I have an idea", "釐清需求", "我想做一個...", "我有個想法", "幫我分析需求", "需求訪談", "產品規劃", or when the user presents a vague concept that needs to be refined into concrete requirements through dialogue.
version: 0.1.0
---

# Socratic Requirements Gathering

Use iterative Socratic dialogue to transform vague ideas into concrete, actionable requirements. Real needs rarely surface in the first statement — they emerge through guided questioning that challenges assumptions, exposes hidden constraints, and narrows possibility space.

## Core Philosophy

Surface the **real problem** before proposing solutions. Users state symptoms, not root causes. Each question should move from surface-level ("what do you want?") toward deep structure ("why does that matter?", "what breaks if this doesn't work?").

## The Five Question Layers

Work through layers progressively. Use `AskUserQuestion` at each pivot point to present structured choices when multiple paths exist.

### Layer 1 — Context & Motivation (Why this, why now?)

Open with broad context questions to understand the trigger:

- What situation prompted this idea?
- What's the cost of NOT solving this?
- Who is affected, and how often?

### Layer 2 — Problem Definition (What is actually broken?)

Narrow from idea to problem:

- What does the current experience look like (even without the solution)?
- Where does the most friction occur today?
- What have you already tried, and why did it fall short?

### Layer 3 — Constraints & Context (What limits the solution space?)

Expose non-obvious constraints:

- Time, budget, team size limitations?
- Technical debt or legacy systems involved?
- Stakeholder or compliance requirements?
- What would be a complete failure?

### Layer 4 — Success Criteria (What does "done" look like?)

Define measurable outcomes:

- How will you know this succeeded in 3 months?
- What's the minimum version that delivers value?
- What features would you cut if forced to ship in half the time?

### Layer 5 — Prioritization (What matters most?)

When multiple valid directions emerge, use `AskUserQuestion` with concrete options to force ranking:

- Present 2-4 options derived from the conversation
- Ask the user to pick or rank
- Use their choice to collapse the requirement space

## Dialogue Protocol

### Starting the Session

Begin with a single open question — never a list. The first response reveals user vocabulary, mental model, and depth of thinking.

**Opening prompt pattern:**

```
Tell me about the problem you're trying to solve. What's the situation that made you think this is needed?
```

Wait for the answer before forming the next question.

### Progressive Deepening

Each user response should trigger one of three actions:

1. **Clarify** — the answer introduced ambiguity ("when you say X, do you mean A or B?")
2. **Deepen** — the answer is clear but shallow ("why is that important?")
3. **Pivot** — enough depth on this thread, move to next layer

### Using AskUserQuestion for Decision Points

When the conversation reaches a fork — multiple valid interpretations or directions — stop and present choices instead of asking open-ended questions. This prevents decision fatigue and creates explicit commitment.

**When to use AskUserQuestion:**

- After Layer 3, when multiple solution archetypes are visible
- When the user can't articulate a preference verbally
- To force prioritization between competing requirements
- To confirm your synthesis before writing the document

**Example decision point — scope:**

```
AskUserQuestion({
  question: "Based on what you've described, what's the primary focus?",
  options: [
    { label: "Internal tool", description: "Used by your team only, rough edges OK" },
    { label: "Customer-facing product", description: "External users, polish required" },
    { label: "Prototype first", description: "Validate the idea before committing to scope" }
  ]
})
```

**Example decision point — MVP boundary:**

```
AskUserQuestion({
  question: "Which feature set defines your MVP?",
  options: [
    { label: "Core only", description: "[Feature A + B] — ships in 2 weeks" },
    { label: "Core + notifications", description: "[A + B + C] — ships in 4 weeks" },
    { label: "Full feature set", description: "All discussed features — ships in 8 weeks" }
  ]
})
```

### Recognizing Completion

The session is complete when:

- The user can describe their problem without the solution
- Success criteria are specific and measurable
- The top 3 constraints are identified
- MVP scope is agreed upon
- At least one explicit `AskUserQuestion` decision has been made

## Output: Requirements Document

After completing the dialogue, generate a structured Markdown document. Store it where the user directs, or default to `docs/requirements/[topic]-requirements.md`.

### Document Template

```markdown
# [Topic] Requirements

**Date:** [YYYY-MM-DD]
**Status:** Draft
**Session type:** Socratic requirements gathering

---

## Problem Statement

[2-3 sentences describing the real problem, not the solution]

## Context & Background

- **Trigger:** [What prompted this?]
- **Affected users:** [Who and how many?]
- **Current state:** [How is it handled today?]
- **Cost of inaction:** [What happens without this?]

## Constraints

| Constraint | Detail                          |
| ---------- | ------------------------------- |
| Time       | [deadline or pressure]          |
| Team       | [who is building this?]         |
| Technical  | [existing systems, legacy debt] |
| Compliance | [any legal/policy requirements] |

## Success Criteria

- [ ] [Measurable outcome 1]
- [ ] [Measurable outcome 2]
- [ ] [Measurable outcome 3]

## MVP Scope

### In Scope

- [Feature/capability 1]
- [Feature/capability 2]

### Out of Scope (this version)

- [Excluded item 1 — why]
- [Excluded item 2 — why]

## Key Decisions Made

| Decision         | Choice            | Rationale |
| ---------------- | ----------------- | --------- |
| [Decision point] | [What was chosen] | [Why]     |

## Open Questions

- [ ] [Unresolved question that needs follow-up]

## Next Steps

1. [Concrete action 1]
2. [Concrete action 2]
```

## Anti-Patterns to Avoid

**Don't lead with solutions.** If the user says "I want a dashboard," ask "what decisions would that dashboard help you make?" before discussing charts or data.

**Don't ask multiple questions at once.** One question per turn. If you have three questions, pick the most important one.

**Don't accept vague success criteria.** "Better user experience" is not a criterion. Push for: "Users complete onboarding in under 5 minutes" or "Support tickets drop by 20%."

**Don't skip the constraints layer.** Solutions designed without constraints get rebuilt after launch.

**Don't synthesize prematurely.** Wait for genuine convergence before writing the document. A premature document creates false closure.

## Session Length Guidance

- **Simple scope** (single feature, clear domain): 5–8 exchanges
- **Medium scope** (new product area, multiple stakeholders): 10–15 exchanges
- **Complex scope** (strategic initiative, unclear problem): 15–25 exchanges, may need multiple sessions

If after 5 exchanges the user is still describing symptoms without a clear problem statement, explicitly name this: "We're still in the symptom space — let's find the root cause."

## Additional Resources

- **`references/question-bank.md`** — Question library organized by layer and domain
- **`references/patterns.md`** — Common requirement anti-patterns and how to surface them
- **`scripts/generate-doc.sh`** — Scaffold the output requirements document
