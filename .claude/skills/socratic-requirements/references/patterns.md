# Requirement Anti-Patterns & How to Surface Them

Common traps in requirements gathering. Recognize the pattern, apply the counter-question.

---

## Anti-Pattern 1: Solution-First Thinking

**Signal:** User describes a solution ("I want a dashboard / notification system / API") without stating the problem.

**Counter-question:**

- "What decision or action would that [dashboard/system] enable that you can't do today?"
- "What happens if we don't build that — what breaks?"
- "Why that solution specifically? Have you tried other approaches?"

**Goal:** Force articulation of the underlying need before locking in a solution shape.

---

## Anti-Pattern 2: The Laundry List

**Signal:** User enumerates 10+ features with equal weight. Every item is "important."

**Counter-question:**

- "If you could only ship one of these, which one delivers the most value?"
- "Which of these would you cut if development took twice as long?"
- "Which feature would your users notice immediately if missing?"

**Goal:** Force prioritization. Use `AskUserQuestion` to present the top 3–4 items and ask for ranking.

---

## Anti-Pattern 3: Vague Success Criteria

**Signal:** Success defined as "better UX", "faster", "more reliable", "users will love it."

**Counter-question:**

- "How much faster? What's the current time, and what's the target?"
- "What metric on your dashboard would move if this worked?"
- "In 6 months, what would you show your stakeholders as proof this succeeded?"

**Goal:** Convert adjectives into numbers or observable behaviors.

---

## Anti-Pattern 4: Scope Creep During Session

**Signal:** Each answer introduces new scope. Requirements keep expanding.

**Intervention:**

- "Let's put that in the 'v2 parking lot' and keep v1 tight."
- "I want to capture that idea — but it's separate from the core problem. Can we add it to open questions?"
- Explicitly create an "Out of Scope" list as you go and read it back.

**Goal:** Protect MVP definition. Scope creep in the requirements session predicts scope creep in development.

---

## Anti-Pattern 5: The Assumed User

**Signal:** User describes features without describing who uses them. "People want X."

**Counter-question:**

- "Who specifically? Can you name someone?"
- "Have you talked to any of these users? What did they say?"
- "Is this what users asked for, or what you think they need?"

**Goal:** Requirements must trace back to a real, identifiable user.

---

## Anti-Pattern 6: The HIPPO Problem

_(Highest-Paid Person's Opinion)_

**Signal:** Requirements are justified by authority ("The CEO wants this") rather than evidence.

**Counter-question:**

- "What user behavior or data informed that request?"
- "What happens if users don't actually want this — what's the fallback?"
- "Is there a way to validate this assumption cheaply before building?"

**Goal:** Separate organizational politics from genuine user needs. Note the constraint without accepting it as a requirement.

---

## Anti-Pattern 7: The Waterfall Trap

**Signal:** User wants a complete spec before any development. Treats all unknowns as knowable.

**Counter-question:**

- "Which parts of this are still uncertain? What would help you decide?"
- "What's the cheapest way to test the riskiest assumption?"
- "Can we separate what we know from what we're guessing?"

**Goal:** Identify the exploratory parts. Requirements for uncertain areas should be framed as hypotheses to test.

---

## Anti-Pattern 8: Missing Failure Mode

**Signal:** Requirements only describe the happy path. No error states, edge cases, or failure scenarios.

**Counter-question:**

- "What happens when this fails mid-process?"
- "Who handles exceptions? How?"
- "What's the worst realistic input this could receive?"

**Goal:** Requirements without failure modes are incomplete. Surface at least 2–3 failure scenarios.

---

## Anti-Pattern 9: Constraint Denial

**Signal:** User insists there are "no constraints" or is vague about limitations.

**Counter-question:**

- "Who has veto power over this? What would make them veto it?"
- "What systems does this interact with? Which ones are off-limits to change?"
- "What has killed similar projects in the past?"

**Goal:** Constraints always exist. Unacknowledged constraints become surprises in week 8.

---

## Anti-Pattern 10: Premature Consensus

**Signal:** User agrees with everything, says everything sounds good, doesn't push back.

**Intervention:**

- "I want to make sure we're aligned — what would you change about what I've summarized?"
- "Play devil's advocate: what could go wrong with this approach?"
- "What am I missing that you haven't said yet?"

**Goal:** Passive agreement is not real alignment. Create a small amount of friction to surface unspoken concerns.

---

## Reading the Session Health

| Signal                                       | Interpretation                   | Response                                 |
| -------------------------------------------- | -------------------------------- | ---------------------------------------- |
| User uses "we" naturally                     | Multiple stakeholders involved   | Ask who else needs to agree              |
| User hedges ("maybe", "I think", "probably") | Uncertainty or lack of ownership | Ask who has final say                    |
| User answers questions with questions        | Hasn't thought this through yet  | Slow down, use more open questions       |
| User references a specific competitor        | Has a strong mental model        | Ask what they like/dislike about it      |
| Answers keep changing                        | Problem is still evolving        | Note the instability, don't over-specify |
| User brings up past failed attempts          | High context, learned caution    | Ask what specifically failed and why     |
