#!/usr/bin/env bash
# Scaffold a requirements document from a topic name.
# Usage: ./generate-doc.sh "topic-name" [output-dir]
#
# Creates docs/requirements/[topic]-requirements.md with today's date pre-filled.

set -e

TOPIC="${1:-untitled}"
OUTPUT_DIR="${2:-docs/requirements}"
SLUG=$(echo "$TOPIC" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
DATE=$(date +%Y-%m-%d)
OUTFILE="${OUTPUT_DIR}/${SLUG}-requirements.md"

mkdir -p "$OUTPUT_DIR"

if [ -f "$OUTFILE" ]; then
  echo "File already exists: $OUTFILE"
  echo "Use a different topic name or delete the existing file."
  exit 1
fi

cat > "$OUTFILE" << EOF
# ${TOPIC} Requirements

**Date:** ${DATE}
**Status:** Draft
**Session type:** Socratic requirements gathering

---

## Problem Statement

<!-- 2-3 sentences: the real problem, not the solution -->

## Context & Background

- **Trigger:**
- **Affected users:**
- **Current state:**
- **Cost of inaction:**

## Constraints

| Constraint | Detail |
|------------|--------|
| Time | |
| Team | |
| Technical | |
| Compliance | |

## Success Criteria

- [ ]
- [ ]
- [ ]

## MVP Scope

### In Scope

-

### Out of Scope (this version)

-

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| | | |

## Open Questions

- [ ]

## Next Steps

1.
2.
EOF

echo "Created: $OUTFILE"
