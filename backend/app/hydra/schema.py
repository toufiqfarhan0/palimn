"""Graph schema definitions and node/relationship constants for HydraDB."""
from enum import Enum


class NodeLabel(str, Enum):
    USER = "User"
    SESSION = "Session"
    MESSAGE = "Message"
    ENTITY = "Entity"
    FACT = "Fact"
    EVENT = "Event"
    PREFERENCE = "Preference"
    TOPIC = "Topic"


class RelType(str, Enum):
    HAS_SESSION = "HAS_SESSION"
    PRECEDES = "PRECEDES"
    CONTAINS = "CONTAINS"
    ABOUT = "ABOUT"
    MENTIONS = "MENTIONS"
    SUPPORTS = "SUPPORTS"
    SUPPORTED_BY = "SUPPORTED_BY"
    SUPERSEDES = "SUPERSEDES"
    CONTRADICTS = "CONTRADICTS"
    RELATED_TO = "RELATED_TO"
    OCCURRED_IN = "OCCURRED_IN"


# Cypher queries for schema initialization / index creation
SCHEMA_INITIALIZATION_QUERIES = [
    "CREATE CONSTRAINT IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE",
    "CREATE CONSTRAINT IF NOT EXISTS FOR (s:Session) REQUIRE s.id IS UNIQUE",
    "CREATE CONSTRAINT IF NOT EXISTS FOR (m:Message) REQUIRE m.id IS UNIQUE",
    "CREATE CONSTRAINT IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE",
    "CREATE CONSTRAINT IF NOT EXISTS FOR (f:Fact) REQUIRE f.memory_id IS UNIQUE",
    "CREATE INDEX IF NOT EXISTS FOR (e:Entity) ON (e.name)",
    "CREATE INDEX IF NOT EXISTS FOR (f:Fact) ON (f.subject, f.predicate)",
    "CREATE INDEX IF NOT EXISTS FOR (f:Fact) ON (f.status)",
    "CREATE INDEX IF NOT EXISTS FOR (f:Fact) ON (f.valid_from, f.valid_until)",
    "CREATE INDEX IF NOT EXISTS FOR (f:Fact) ON (f.asserted_at)",
    "CREATE INDEX IF NOT EXISTS FOR (f:Fact) ON (f.is_retroactive)",
]

