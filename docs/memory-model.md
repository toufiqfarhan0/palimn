# PALIMN Temporal Memory Graph Model

**Temporal Memory for AI Agents** — HackHydra 2026 Track 3

## Graph Model

The PALIMN graph is structured around 8 node types and 11 relationship types.

### Node Types

| Node Type | Description | Key Properties |
| :--- | :--- | :--- |
| **`User`** | Root identity of the user agent | `id`, `name`, `created_at` |
| **`Session`** | Individual multi-turn conversation session | `id`, `session_index`, `timestamp` |
| **`Message`** | Individual turn within a session | `id`, `role`, `content`, `timestamp` |
| **`Entity`** | Subject or object entity (e.g. Person, Location, Preference) | `id`, `name`, `entity_type`, `aliases` |
| **`Fact`** | Grounded atomic temporal statement | `memory_id`, `subject`, `predicate`, `object`, `status`, `valid_from`, `valid_until`, `confidence` |
| **`Event`** | Temporal occurrence bound to a session | `id`, `name`, `timestamp` |
| **`Preference`** | User preference statement | `id`, `name`, `value` |
| **`Topic`** | Topical classification cluster | `id`, `name` |

### Relationships

- `User -[:HAS_SESSION]-> Session`
- `Session -[:PRECEDES]-> Session`
- `Session -[:CONTAINS]-> Message`
- `Message -[:MENTIONS]-> Entity`
- `Message -[:SUPPORTS]-> Fact`
- `Fact -[:ABOUT]-> Entity`
- `Fact -[:SUPPORTED_BY]-> Message`
- `Fact -[:SUPERSEDES]-> Fact`
- `Fact -[:CONTRADICTS]-> Fact`
- `Fact -[:RELATED_TO]-> Fact`
- `Event -[:OCCURRED_IN]-> Session`

## Memory Statuses

Memories transition through explicit lifecycle statuses:

- **`active`**: Currently valid and un-superseded.
- **`historical`**: Historical fact whose validity has expired or shifted.
- **`superseded`**: Replaced by a newer fact pointing backwards via `[:SUPERSEDES]`.
- **`contradicted`**: Contradicted by another fact without clear chronological resolution.
- **`uncertain`**: Low-confidence or ungrounded claim.

## Temporal Supersession Example

### Session 4
> *"I live in Bangalore."*
```
(User)-[:HAS_SESSION]->(Session_4)-[:CONTAINS]->(Message_4_1)
(Fact_1 {
  subject: "user",
  predicate: "lives_in",
  object: "Bangalore",
  status: "active",
  valid_from: "2026-01-10T10:00:00Z",
  valid_until: null
})
(Message_4_1)-[:SUPPORTS]->(Fact_1)
(Fact_1)-[:ABOUT]->(Entity:Bangalore)
```

### Session 19
> *"I moved to Hyderabad."*
```
(Fact_2 {
  subject: "user",
  predicate: "lives_in",
  object: "Hyderabad",
  status: "active",
  valid_from: "2026-03-15T14:30:00Z",
  valid_until: null
})
(Fact_1 {
  status: "superseded",
  valid_until: "2026-03-15T14:30:00Z"
})
(Fact_2)-[:SUPERSEDES]->(Fact_1)
```

### Querying:
- **"Where do I live now?"** -> Matches `status: 'active'` -> `Hyderabad`
- **"Where did I live before Hyderabad?"** -> Follows `[:SUPERSEDES]` incoming/outgoing chain -> `Bangalore`
