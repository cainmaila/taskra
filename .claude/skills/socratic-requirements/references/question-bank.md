# Socratic Question Bank

Organized by layer. Pick ONE question per turn. Prefer questions that expose hidden assumptions.

---

## Layer 1 — Context & Motivation

### Trigger Questions
- What happened that made you think this is needed right now?
- How long has this been a problem? Why act on it now?
- Who asked for this, or is this your own initiative?

### Motivation Depth
- What would change in your work/life if this existed?
- Who else cares about this problem? How do you know?
- Is this a nice-to-have or something that's actively costing you?

### Priority Signal
- If you could only solve one problem this quarter, is this it?
- What are you NOT doing because this problem exists?

---

## Layer 2 — Problem Definition

### Current State
- Walk me through what happens today, step by step.
- Where does the current process break down most often?
- What workarounds do people use? Why don't those work?

### Pain Quantification
- How often does this problem occur? Daily, weekly?
- How long does dealing with it take?
- How many people are affected?

### Root Cause Probing
- Why does that happen?
- And why does THAT happen? (repeat 3–5 times — "5 Whys")
- What would have to be true for this not to be a problem?

### Scope Boundary
- Is this always a problem, or only in specific situations?
- Are there cases where the current approach works fine?
- What's the smallest version of this problem worth solving?

---

## Layer 3 — Constraints

### Technical
- What existing systems does this touch?
- Is there technical debt that limits options?
- What stack or tools are you locked into?

### Organizational
- Who needs to approve this?
- Which teams need to be involved?
- What's the political landscape around this change?

### Time & Resources
- Is there a hard deadline? What drives it?
- How many people can work on this?
- What budget exists (if relevant)?

### Risk
- What's the worst thing that could go wrong?
- What would make this a complete failure?
- What's the rollback plan if this doesn't work?

---

## Layer 4 — Success Criteria

### Outcome Definition
- How will you measure whether this succeeded in 3 months?
- What metric moves if this works?
- Who will notice first if this succeeds? How?

### Minimum Bar
- What's the minimum this needs to do to be worth shipping?
- If you had to cut half the features, which half stays?
- What would make you say "this wasn't worth it"?

### Edge Cases
- What happens when the happy path fails?
- Who are the edge-case users you can't ignore?
- What input would break this if not handled?

---

## Layer 5 — Prioritization

### Feature Triage
- Rank these three features: which is most critical?
- If you shipped only one thing tomorrow, what would it be?
- What can wait until v2?

### Tradeoff Forcing
- Speed vs. quality: which matters more here?
- Broad but shallow vs. narrow but deep: which serves users better?
- Build vs. buy: have you evaluated existing solutions?

---

## Domain-Specific Question Sets

### Product / Feature Development
- Who is the primary user? Describe them.
- What job are they hiring this for? (Jobs-to-be-done framing)
- What alternatives exist? Why won't users just use those?
- How will users discover this feature?

### Technical Architecture
- What scale are you designing for?
- What are the read/write patterns?
- What's the consistency requirement? (eventual vs. strong)
- What happens when a dependency fails?

### Process Improvement
- Who owns this process today?
- What does "done" look like in this process?
- Where do handoffs occur? Where do they fail?
- How do you know when something goes wrong?

### Data / Analytics
- What decisions will this data inform?
- Who consumes this? How often?
- What's the freshness requirement?
- What's the definition of a "good" vs "bad" result?

---

## Synthesis Checks

Use these before writing the requirements document:

- Can you describe the problem in one sentence without mentioning a solution?
- What's the single most important thing this must do?
- What are the top 3 ways this could fail?
- Do all stakeholders agree on the success criteria?
- Is the MVP scope achievable in the stated timeframe?
