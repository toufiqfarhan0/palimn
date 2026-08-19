# PALIMN Temporal Memory Graph Model

**Temporal Memory for AI Agents** — HackHydra 2026 Track 3

## Graph Model

The PALIMN graph is structured around 8 node types and 11 relationship types.

### Node Types

| Node Type | Description | Key Properties |
| :--- | :--- | :--- |
| **`User`** | Root identity of the user agent | `id`, `name`, `created_at` |
| **`Session`** | Individual multi-turn conversation session | `id`, `session_index`, `date`, `created_at` |
| **`Message`** | Individual turn within a session | `id`, `session_id`, `role`, `content`, `timestamp` |
| **`Entity`** | Subject or object entity (e.g. Location, Person) | `id`, `name`, `entity_type`, `created_at` |
| **`Fact`** | Grounded atomic temporal statement | `memory_id`, `subject`, `predicate`, `object`, `session_id`, `message_id`, `session_date`, `status`, `valid_from`, `valid_until`, `confidence` |
| **`Event`** | Temporal occurrence bound to a session | `id`, `name`, `timestamp` |
| **`Preference`** | User preference statement | `id`, `name`, `value` |
| **`Topic`** | Topical classification cluster | `id`, `name` |

### Relationships

- `User -[:HAS_SESSION]-> Session`
- `Session -[:PRECEDES]-> Session`
- `Session -[:CONTAINS]-> Message`
- `Session -[:ABOUT]-> Topic`
- `Message -[:MENTIONS]-> Entity`
- `Message -[:SUPPORTS]-> Fact`
- `Fact -[:ABOUT]-> Entity`
- `Fact -[:SUPPORTED_BY]-> Message`
- `Fact -[:SUPERSEDES]-> Fact`
- `Fact -[:CONTRADICTS]-> Fact`
- `Fact -[:RELATED_TO]-> Fact`
- `Event -[:OCCURRED_IN]-> Session`
- `Event -[:ABOUT]-> Entity`
- `Preference -[:ABOUT]-> Entity`

---

## Memory Statuses

Memories transition through explicit lifecycle statuses:

- **`active`**: Currently valid and un-superseded.
- **`historical`**: Historical fact whose validity has expired or shifted.
- **`superseded`**: Replaced by a newer fact pointing backwards via `[:SUPERSEDES]`.
- **`contradicted`**: Contradicted by another fact without clear chronological resolution.
- **`uncertain`**: Low-confidence or ungrounded claim.

---

## Synthetic Temporal Revision Example

### Session 01 (`2025-01-10`)
> Message 01: *"I live in Bangalore."*
```
(User:user_demo)-[:HAS_SESSION]->(Session:session_01)-[:CONTAINS]->(Message:msg_01)
(Fact:fact_001 {
  subject: "user_demo",
  predicate: "lives_in",
  object: "Bangalore",
  status: "superseded",
  valid_from: "2025-01-10",
  valid_until: "2025-03-15",
  confidence: 1.0
})
(Message:msg_01)-[:SUPPORTS]->(Fact:fact_001)
(Fact:fact_001)-[:SUPPORTED_BY]->(Message:msg_01)
(Fact:fact_001)-[:ABOUT]->(Entity:Bangalore)
```

### Session 02 (`2025-03-15`)
> Message 02: *"I moved to Hyderabad."*
```
(Session:session_01)-[:PRECEDES]->(Session:session_02)
(User:user_demo)-[:HAS_SESSION]->(Session:session_02)-[:CONTAINS]->(Message:msg_02)
(Fact:fact_002 {
  subject: "user_demo",
  predicate: "lives_in",
  object: "Hyderabad",
  status: "active",
  valid_from: "2025-03-15",
  valid_until: null,
  confidence: 1.0
})
(Message:msg_02)-[:SUPPORTS]->(Fact:fact_002)
(Fact:fact_002)-[:SUPPORTED_BY]->(Message:msg_02)
(Fact:fact_002)-[:ABOUT]->(Entity:Hyderabad)
(Fact:fact_002)-[:SUPERSEDES]->(Fact:fact_001)
```

---

## Temporal Retrieval Queries

1. **Current State**:
   - `"Where do I live now?"` / `"What city do I currently live in?"`
   - Resolution: Queries active fact (`status: 'active'`) -> `Hyderabad` (Confidence: 1.0).

2. **Historical State**:
   - `"Where did I live before Hyderabad?"` / `"What city did I previously live in?"`
   - Resolution: Follows `[:SUPERSEDES]` lineage from Fact B back to Fact A -> `Bangalore`.

3. **Session-Scoped State**:
   - `"Where did I live in Session 01?"` -> `Bangalore`
   - `"Where did I live in Session 02?"` -> `Hyderabad`

4. **Missing Information & Abstention**:
   - `"Where did I live in Session 99?"` -> `{"decision": "abstain", "reason": "no_matching_memory", "confidence": 0.0, "evidence": []}`
   - Does not invent or hallucinate facts.
