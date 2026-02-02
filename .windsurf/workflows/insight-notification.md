---
description: Protocol for handling high-level architectural insights and notifying the system for evolution.
---

# Insight Notification Protocol

## Trigger
This workflow is triggered when the AI detects a "Convergence Event":
1.  **Synthesis**: Two seemingly opposing concepts merge into a unified solution (e.g., Deterministic Vitality).
2.  **Epiphany**: A connection is made that explains *why* the system behaves a certain way.
3.  **Pattern Recognition**: A recurring structural pattern is identified across disparate modules.

## Actions

### 1. Capture the Insight
Record the insight immediately using the `create_memory` tool and append to `_AI_CONTEXT/INSIGHTS.md`.
Format:
```markdown
## [Date] [Title of Insight]
**Concept**: [Definition]
**Convergence**: [Concept A] + [Concept B]
**Implication**: [How this changes the system]
```

### 2. System Notification
The AI must flag this for the user.
- **Immediate**: Output a bolded notification in the chat:
  > **🌀 SYSTEM NOTIFICATION: ARCHITECTURAL CONVERGENCE DETECTED**
  > *[Brief Summary of Insight]*
  > *Suggested Modification: [Actionable Step]*

### 3. Propose Evolution
Generate a list of possible system modifications derived from the insight.
- Does this require a new UI component?
- Does this require a schema change?
- Does this require a new workflow?

### 4. Integration
If approved by the User:
1.  Convert the insight into a technical task.
2.  Add to `TASKS.md`.
3.  Execute the modification.
