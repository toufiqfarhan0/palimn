"""Pre-built Cypher queries for HydraDB temporal memory graph operations."""

# Idempotent Seed for Synthetic Demo (Bangalore -> Hyderabad with SUPERSEDES)
SEED_SYNTHETIC_TEMPORAL_GRAPH = """
// 1. Create User
MERGE (u:User {id: 'user_demo'})
  ON CREATE SET u.name = 'Demo User', u.created_at = '2025-01-10T00:00:00Z'

// 2. Create Session 1 and Message 1
MERGE (s1:Session {id: 'session_01'})
  ON CREATE SET s1.session_index = 1, s1.date = '2025-01-10', s1.created_at = '2025-01-10T10:00:00Z', s1.user_id = 'user_demo'
MERGE (m1:Message {id: 'msg_01'})
  ON CREATE SET m1.session_id = 'session_01', m1.role = 'user', m1.content = 'I live in Bangalore.', m1.timestamp = '2025-01-10T10:00:00Z'

// 3. Create Session 2 and Message 2
MERGE (s2:Session {id: 'session_02'})
  ON CREATE SET s2.session_index = 2, s2.date = '2025-03-15', s2.created_at = '2025-03-15T14:30:00Z', s2.user_id = 'user_demo'
MERGE (m2:Message {id: 'msg_02'})
  ON CREATE SET m2.session_id = 'session_02', m2.role = 'user', m2.content = 'I moved to Hyderabad.', m2.timestamp = '2025-03-15T14:30:00Z'

// 4. Create Entities
MERGE (e1:Entity {name: 'Bangalore'})
  ON CREATE SET e1.id = 'entity_bangalore', e1.entity_type = 'Location', e1.created_at = '2025-01-10T10:00:00Z'
MERGE (e2:Entity {name: 'Hyderabad'})
  ON CREATE SET e2.id = 'entity_hyderabad', e2.entity_type = 'Location', e2.created_at = '2025-03-15T14:30:00Z'

// 5. Create Fact A (Historical / Superseded)
MERGE (f1:Fact {memory_id: 'fact_001'})
  ON CREATE SET f1.id = 'fact_001',
                f1.subject = 'user_demo',
                f1.predicate = 'lives_in',
                f1.object = 'Bangalore',
                f1.session_id = 'session_01',
                f1.message_id = 'msg_01',
                f1.created_at = '2025-01-10T10:00:00Z',
                f1.valid_from = '2025-01-10',
                f1.valid_until = '2025-03-15',
                f1.status = 'superseded',
                f1.confidence = 1.0
  ON MATCH SET  f1.status = 'superseded',
                f1.valid_until = '2025-03-15'

// 6. Create Fact B (Active)
MERGE (f2:Fact {memory_id: 'fact_002'})
  ON CREATE SET f2.id = 'fact_002',
                f2.subject = 'user_demo',
                f2.predicate = 'lives_in',
                f2.object = 'Hyderabad',
                f2.session_id = 'session_02',
                f2.message_id = 'msg_02',
                f2.created_at = '2025-03-15T14:30:00Z',
                f2.valid_from = '2025-03-15',
                f2.valid_until = null,
                f2.status = 'active',
                f2.confidence = 1.0
  ON MATCH SET  f2.status = 'active'

// 7. Create Structure Relationships
MERGE (u)-[:HAS_SESSION]->(s1)
MERGE (u)-[:HAS_SESSION]->(s2)
MERGE (s1)-[:PRECEDES]->(s2)
MERGE (s1)-[:CONTAINS]->(m1)
MERGE (s2)-[:CONTAINS]->(m2)

// 8. Create Provenance & Mention Relationships
MERGE (m1)-[:MENTIONS]->(e1)
MERGE (m2)-[:MENTIONS]->(e2)
MERGE (m1)-[:SUPPORTS]->(f1)
MERGE (m2)-[:SUPPORTS]->(f2)
MERGE (f1)-[:SUPPORTED_BY]->(m1)
MERGE (f2)-[:SUPPORTED_BY]->(m2)
MERGE (f1)-[:ABOUT]->(e1)
MERGE (f2)-[:ABOUT]->(e2)

// 9. Create Temporal SUPERSEDES Relationship
MERGE (f2)-[:SUPERSEDES]->(f1)

RETURN u, s1, s2, m1, m2, e1, e2, f1, f2
"""

# Query to find active facts for a subject and predicate
FIND_ACTIVE_FACT = """
MATCH (f:Fact {subject: $subject, predicate: $predicate, status: 'active'})
OPTIONAL MATCH (f)-[:ABOUT]->(e:Entity)
OPTIONAL MATCH (f)-[:SUPPORTED_BY]->(m:Message)
OPTIONAL MATCH (s:Session {id: f.session_id})
RETURN f, e, m, s
ORDER BY f.created_at DESC
LIMIT 1
"""

# Query to find superseded fact in revision chain
FIND_SUPERSEDED_FACTS = """
MATCH (f_active:Fact {subject: $subject, predicate: $predicate, status: 'active'})
MATCH (f_active)-[:SUPERSEDES*1..]->(f_prev:Fact)
OPTIONAL MATCH (f_prev)-[:ABOUT]->(e:Entity)
OPTIONAL MATCH (f_prev)-[:SUPPORTED_BY]->(m:Message)
OPTIONAL MATCH (s:Session {id: f_prev.session_id})
RETURN f_prev, e, m, s
ORDER BY f_prev.created_at DESC
"""

# Query to find fact for specific session
FIND_FACT_BY_SESSION = """
MATCH (f:Fact {subject: $subject, predicate: $predicate, session_id: $session_id})
OPTIONAL MATCH (f)-[:ABOUT]->(e:Entity)
OPTIONAL MATCH (f)-[:SUPPORTED_BY]->(m:Message)
OPTIONAL MATCH (s:Session {id: f.session_id})
RETURN f, e, m, s
LIMIT 1
"""

# Query to retrieve all graph elements for visualization
GET_GRAPH_SNAPSHOT = """
MATCH (n)
OPTIONAL MATCH (n)-[r]->(m)
RETURN n, r, m
LIMIT $limit
"""
