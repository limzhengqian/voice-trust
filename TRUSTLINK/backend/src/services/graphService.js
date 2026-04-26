// Graph adapter — uses Amazon Neptune (Gremlin) when USE_NEPTUNE=true,
// otherwise falls back to an in-memory adjacency map that mirrors the
// same vertex/edge model so swapping backends is transparent.
//
// Vertex labels: User
// Edge labels:   TRUSTS, GUARANTEES, REPAID, DEFAULTED

import { config } from '../config/index.js';

let gremlin = null;
let g = null;
let connection = null;

async function ensureGremlin() {
  if (g) return g;
  gremlin = await import('gremlin');
  const { driver, process: gp } = gremlin.default;
  const { DriverRemoteConnection } = driver;
  const { AnonymousTraversalSource } = gp;
  connection = new DriverRemoteConnection(config.neptune.endpoint, { mimeType: 'application/vnd.gremlin-v2.0+json' });
  g = AnonymousTraversalSource.traversal().withRemote(connection);
  return g;
}

// ===== In-memory graph =====
const mem = {
  vertices: new Map(),               // id -> {id, label, props}
  edges:    [],                      // {fromId, toId, label, props}
};

function memAddVertex(id, props = {}) {
  if (!mem.vertices.has(id)) mem.vertices.set(id, { id, label: 'User', props: { ...props } });
  return mem.vertices.get(id);
}
function memAddEdge(fromId, toId, label, props = {}) {
  // Replace existing edge of same label between same pair (idempotent)
  const idx = mem.edges.findIndex(e => e.fromId === fromId && e.toId === toId && e.label === label);
  if (idx >= 0) mem.edges[idx].props = { ...mem.edges[idx].props, ...props };
  else mem.edges.push({ fromId, toId, label, props });
}
function memOutEdges(id, label) {
  return mem.edges.filter(e => e.fromId === id && (!label || e.label === label));
}
function memInEdges(id, label) {
  return mem.edges.filter(e => e.toId === id && (!label || e.label === label));
}

// ===== Public API =====

export const graph = {
  async ensureUser(userId, name) {
    if (!config.neptune.enabled) {
      memAddVertex(userId, { name });
      return { id: userId, name };
    }
    const t = await ensureGremlin();
    await t.V().has('User', 'userId', userId).fold()
      .coalesce(gremlin.process.statics.unfold(),
                gremlin.process.statics.addV('User').property('userId', userId).property('name', name || userId))
      .next();
    return { id: userId, name };
  },

  async addTrust(fromUserId, toUserId, { strength = 0.7, relationship = '' } = {}) {
    if (!config.neptune.enabled) {
      memAddVertex(fromUserId);
      memAddVertex(toUserId);
      // TRUSTS is bidirectional in the prototype semantics — store both directions.
      memAddEdge(fromUserId, toUserId, 'TRUSTS', { strength, relationship });
      memAddEdge(toUserId, fromUserId, 'TRUSTS', { strength, relationship });
      return { ok: true };
    }
    const t = await ensureGremlin();
    const __ = gremlin.process.statics;
    await t.V().has('User', 'userId', fromUserId).as('a')
      .V().has('User', 'userId', toUserId).as('b')
      .coalesce(__.inE('TRUSTS').where(__.outV().has('userId', fromUserId)),
                __.addE('TRUSTS').from_('a').property('strength', strength).property('relationship', relationship))
      .next();
    return { ok: true };
  },

  async addGuarantees(guarantorId, borrowerId, loanId) {
    if (!config.neptune.enabled) {
      memAddEdge(guarantorId, borrowerId, 'GUARANTEES', { loanId });
      return { ok: true };
    }
    const t = await ensureGremlin();
    await t.V().has('User', 'userId', guarantorId).as('g')
           .V().has('User', 'userId', borrowerId).as('b')
           .addE('GUARANTEES').from_('g').to('b').property('loanId', loanId).next();
    return { ok: true };
  },

  async recordRepayment(borrowerId, loanId) {
    if (!config.neptune.enabled) {
      memAddEdge(borrowerId, loanId, 'REPAID', {});
      return { ok: true };
    }
    const t = await ensureGremlin();
    await t.V().has('User', 'userId', borrowerId)
      .addE('REPAID').to(gremlin.process.statics.V().has('Loan', 'loanId', loanId).fold()
        .coalesce(gremlin.process.statics.unfold(),
                  gremlin.process.statics.addV('Loan').property('loanId', loanId)))
      .next();
    return { ok: true };
  },

  async recordDefault(borrowerId, loanId) {
    if (!config.neptune.enabled) {
      memAddEdge(borrowerId, loanId, 'DEFAULTED', {});
      return { ok: true };
    }
    const t = await ensureGremlin();
    await t.V().has('User', 'userId', borrowerId)
      .addE('DEFAULTED').to(gremlin.process.statics.V().has('Loan', 'loanId', loanId).fold()
        .coalesce(gremlin.process.statics.unfold(),
                  gremlin.process.statics.addV('Loan').property('loanId', loanId)))
      .next();
    return { ok: true };
  },

  // Direct trust neighbours (1-hop)
  async directTrust(userId) {
    if (!config.neptune.enabled) {
      const out = memOutEdges(userId, 'TRUSTS');
      return out.map(e => ({ userId: e.toId, strength: e.props.strength, relationship: e.props.relationship }));
    }
    const t = await ensureGremlin();
    const res = await t.V().has('User', 'userId', userId).outE('TRUSTS').as('e').inV().as('v')
      .select('e','v').by(gremlin.process.statics.valueMap()).toList();
    return res.map(r => ({
      userId: r.get('v').get('userId')[0],
      strength: r.get('e').get('strength')?.[0] ?? 0.7,
      relationship: r.get('e').get('relationship')?.[0] ?? '',
    }));
  },

  // 2-hop "extended" trust (excludes user and direct neighbours)
  async secondDegreeTrust(userId) {
    if (!config.neptune.enabled) {
      const direct = new Set(memOutEdges(userId, 'TRUSTS').map(e => e.toId));
      direct.add(userId);
      const result = new Map();
      for (const id of direct) {
        if (id === userId) continue;
        for (const e of memOutEdges(id, 'TRUSTS')) {
          if (!direct.has(e.toId)) {
            result.set(e.toId, { userId: e.toId, viaUserId: id, strength: e.props.strength });
          }
        }
      }
      return [...result.values()];
    }
    const t = await ensureGremlin();
    const res = await t.V().has('User', 'userId', userId)
      .out('TRUSTS').out('TRUSTS').dedup()
      .where(gremlin.process.statics.not(gremlin.process.statics.has('userId', userId)))
      .valueMap().toList();
    return res.map(v => ({ userId: v.get('userId')[0], viaUserId: null }));
  },

  // Path discovery between two users (shortest path up to 3 hops)
  async path(fromId, toId) {
    if (!config.neptune.enabled) {
      // BFS over TRUSTS in memory
      const visited = new Set([fromId]);
      const q = [[fromId]];
      while (q.length) {
        const path = q.shift();
        const last = path[path.length - 1];
        if (last === toId) return path;
        if (path.length > 4) continue;
        for (const e of memOutEdges(last, 'TRUSTS')) {
          if (!visited.has(e.toId)) {
            visited.add(e.toId);
            q.push([...path, e.toId]);
          }
        }
      }
      return null;
    }
    const t = await ensureGremlin();
    const res = await t.V().has('User','userId',fromId)
      .repeat(gremlin.process.statics.out('TRUSTS').simplePath()).times(3)
      .until(gremlin.process.statics.has('userId', toId))
      .path().limit(1).toList();
    return res[0] ? res[0].objects.map(o => o.value || o) : null;
  },
};
