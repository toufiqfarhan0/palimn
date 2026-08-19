"""Pre-built Cypher queries for HydraDB temporal memory graph operations."""

# Query to find active facts for an entity
FIND_ACTIVE_FACTS_BY_ENTITY = """
MATCH (e:Entity {name: $entity_name})<-[:ABOUT]-(f:Fact {status: 'active'})
RETURN f, e
ORDER BY f.created_at DESC
"""

# Query to find full revision lineage for a predicate of an entity
FIND_REVISION_CHAIN = """
MATCH (e:Entity {name: $entity_name})<-[:ABOUT]-(f:Fact {predicate: $predicate})
OPTIONAL MATCH (f)-[r:SUPERSEDES*0..]->(older:Fact)
RETURN f, older
ORDER BY f.created_at DESC
"""

# Query to retrieve facts valid at a specific timestamp
FIND_FACTS_AT_TIME = """
MATCH (e:Entity {name: $entity_name})<-[:ABOUT]-(f:Fact)
WHERE (f.valid_from IS NULL OR f.valid_from <= $query_time)
  AND (f.valid_until IS NULL OR f.valid_until > $query_time)
RETURN f, e
"""

# Query to write a new fact and link it to Entity, Message, and previous Fact with SUPERSEDES
INSERT_FACT_WITH_REVISION = """
MERGE (e:Entity {name: $subject})
  ON CREATE SET e.id = $entity_id, e.created_at = $created_at
MERGE (m:Message {id: $message_id})
CREATE (f:Fact {
    id: $memory_id,
    subject: $subject,
    predicate: $predicate,
    object: $object,
    session_id: $session_id,
    message_id: $message_id,
    created_at: $created_at,
    valid_from: $valid_from,
    valid_until: $valid_until,
    status: $status,
    confidence: $confidence
})
CREATE (f)-[:ABOUT]->(e)
CREATE (m)-[:SUPPORTS]->(f)
WITH f, e
OPTIONAL MATCH (e)<-[:ABOUT]-(prev:Fact {predicate: $predicate, status: 'active'})
WHERE prev.id <> f.id
FOREACH (_ IN CASE WHEN prev IS NOT NULL THEN [1] ELSE [] END |
    SET prev.status = 'superseded', prev.valid_until = $valid_from
    CREATE (f)-[:SUPERSEDES]->(prev)
)
RETURN f
"""

# Query to retrieve graph visualizer snapshot
GET_GRAPH_SNAPSHOT = """
MATCH (n)
OPTIONAL MATCH (n)-[r]->(m)
RETURN n, r, m
LIMIT $limit
"""
