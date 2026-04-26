// Lightweight in-memory store used when USE_PG=false.
// Mirrors the relational shape so swapping to RDS is a 1:1 mapping.

import { randomUUID } from 'crypto';

const store = {
  users: new Map(),
  trustRequests: new Map(),
  loans: new Map(),
  repayments: new Map(),
};

export const memDb = {
  // ---------- Users ----------
  upsertUser(u) {
    store.users.set(u.id, { trust_score: 50, created_at: new Date().toISOString(), ...u });
    return store.users.get(u.id);
  },
  getUser(id) { return store.users.get(id) || null; },
  listUsers() { return [...store.users.values()]; },
  updateUserScore(id, score) {
    const u = store.users.get(id);
    if (u) { u.trust_score = score; }
    return u;
  },

  // ---------- Trust requests ----------
  createTrustRequest({ sender_id, receiver_id, relationship }) {
    const id = randomUUID();
    const row = {
      id, sender_id, receiver_id, relationship: relationship || null,
      description: null,
      liability_cap: 5000,
      status: 'pending',
      created_at: new Date().toISOString(),
      responded_at: null,
    };
    store.trustRequests.set(id, row);
    return row;
  },
  getTrustRequest(id) { return store.trustRequests.get(id) || null; },
  updateTrustRequestStatus(id, status) {
    const r = store.trustRequests.get(id);
    if (r) { r.status = status; r.responded_at = new Date().toISOString(); }
    return r;
  },
  listTrustRequests({ userId, status } = {}) {
    return [...store.trustRequests.values()].filter(r => {
      if (userId && r.sender_id !== userId && r.receiver_id !== userId) return false;
      if (status && r.status !== status) return false;
      return true;
    });
  },
  // Accepted edges, both directions, treated as bidirectional trust links.
  listAcceptedTrustEdges(userId) {
    return [...store.trustRequests.values()].filter(r =>
      r.status === 'accepted' && (r.sender_id === userId || r.receiver_id === userId)
    );
  },

  // ---------- Loans ----------
  createLoan(loan) {
    const id = randomUUID();
    const row = {
      id,
      borrower_id: loan.borrower_id,
      guarantor_id: loan.guarantor_id || null,
      amount: Number(loan.amount),
      term_months: Number(loan.term_months) || 6,
      interest_rate: Number(loan.interest_rate) || 0.068,
      monthly_payment: Number(loan.monthly_payment) || 0,
      purpose: loan.purpose || null,
      status: 'pending',
      created_at: new Date().toISOString(),
      approved_at: null,
      closed_at: null,
    };
    store.loans.set(id, row);
    return row;
  },
  getLoan(id) { return store.loans.get(id) || null; },
  updateLoan(id, patch) {
    const l = store.loans.get(id);
    if (l) Object.assign(l, patch);
    return l;
  },
  listLoans({ userId, status } = {}) {
    return [...store.loans.values()].filter(l => {
      if (userId && l.borrower_id !== userId && l.guarantor_id !== userId) return false;
      if (status && l.status !== status) return false;
      return true;
    }).map(l => {
      const borrower = store.users.get(l.borrower_id);
      const guarantor = l.guarantor_id ? store.users.get(l.guarantor_id) : null;
      return {
        ...l,
        borrower_name: borrower ? borrower.name : null,
        guarantor_name: guarantor ? guarantor.name : null,
      };
    });
  },

  // ---------- Repayments ----------
  createRepayment({ loan_id, amount }) {
    const id = randomUUID();
    const row = {
      id, loan_id, amount: Number(amount), status: 'paid',
      paid_at: new Date().toISOString(),
    };
    store.repayments.set(id, row);
    return row;
  },
  listRepayments(loan_id) {
    return [...store.repayments.values()].filter(r => r.loan_id === loan_id);
  },
};
