// Thin fetch wrapper around the Express backend.
// Base URL comes from VITE_API_BASE (defaults to localhost:4000).

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

async function request(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = body?.error || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return body;
}

export const api = {
  // ---- Users ----
  listUsers: () => request('/users'),
  getUser:   (id) => request(`/users/${id}`),
  recalcScore: (id) => request(`/users/${id}/recalc`, { method: 'POST' }),
  login:     (user_id) => request('/users/login', { method: 'POST', body: JSON.stringify({ user_id }) }),

  // ---- Trust ----
  trustNetwork:  (userId) => request(`/trust/network/${userId}`),
  trustStrength: (userId) => request(`/trust/strength/${userId}`),
  trustRequests: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/trust/requests${qs ? '?' + qs : ''}`);
  },
  trustRequest: (sender_id, receiver_id, relationship) =>
    request('/trust/request', { method: 'POST', body: JSON.stringify({ sender_id, receiver_id, relationship }) }),
  trustAccept: (request_id) =>
    request('/trust/accept', { method: 'POST', body: JSON.stringify({ request_id }) }),
  trustReject: (request_id) =>
    request('/trust/reject', { method: 'POST', body: JSON.stringify({ request_id }) }),
  updateRelationship: (payload) =>
    request('/trust/relationship', { method: 'POST', body: JSON.stringify(payload) }),

  // ---- Loans ----
  loanApply: (payload) =>
    request('/loan/apply', { method: 'POST', body: JSON.stringify(payload) }),
  loanApprove: (loan_id, guarantor_id) =>
    request('/loan/approve', { method: 'POST', body: JSON.stringify({ loan_id, guarantor_id }) }),
  loanReject: (loan_id) =>
    request('/loan/reject', { method: 'POST', body: JSON.stringify({ loan_id }) }),
  loanRepay:  (loan_id, amount) =>
    request('/loan/repay', { method: 'POST', body: JSON.stringify({ loan_id, amount }) }),
  loanStatus: (loan_id) => request(`/loan/status/${loan_id}`),
  loansForUser: (user_id, status) => {
    const qs = new URLSearchParams({ user_id, ...(status ? { status } : {}) }).toString();
    return request(`/loan?${qs}`);
  },
};
