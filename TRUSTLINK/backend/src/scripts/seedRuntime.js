// Runtime seed: ensures a small mock world exists at boot so the demo
// is interactive immediately. Idempotent — safe to call on every start.

import * as userModel from '../models/userModel.js';
import * as trustService from '../services/trustService.js';
import * as loanService from '../services/loanService.js';
import { graph } from '../services/graphService.js';
import { recalcTrustScore } from '../services/trustScoreService.js';

const MOCK_USERS = [
  { id: 'borrower_01',  name: 'Siti Lim',     phone: '+60 13-887 9921', email: 'siti.lim@gmail.com',     avatar_initials: 'SL', avatar_color: '#1FB36B', trust_score: 670 },
  { id: 'guarantor_01', name: 'Aiman Tan',    phone: '+60 12-555 7788', email: 'aiman.tan@gmail.com',    avatar_initials: 'A',  avatar_color: '#1A4FBE', trust_score: 738 },
  { id: 'guarantor_02', name: 'Farid Ahmad',  phone: '+60 11-111 2222', email: 'farid.ahmad@outlook.com',avatar_initials: 'FA', avatar_color: '#5B3FD9', trust_score: 812 },
  { id: 'peer_01',      name: 'Rajesh Kumar', phone: '+60 11-220 4456', email: 'rajesh.k@yahoo.com',     avatar_initials: 'RK', avatar_color: '#5B3FD9', trust_score: 688 },
  { id: 'peer_02',      name: 'Maya Nair',    phone: '+60 12-998 1122', email: 'maya.nair@gmail.com',    avatar_initials: 'MN', avatar_color: '#94A3B8', trust_score: 742 },
  { id: 'peer_03',      name: 'Hafiz Ramlan', phone: '+60 17-445 2233', email: 'hafiz.r@gmail.com',      avatar_initials: 'HF', avatar_color: '#CBD5E1', trust_score: 701 },
  { id: 'peer_04',      name: 'Lim Mei Ling', phone: '+60 16-554 8829', email: 'lim.ml@gmail.com',       avatar_initials: 'LM', avatar_color: '#1FB36B', trust_score: 720 },
  { id: 'peer_05',      name: 'Ahmad Zikry',  phone: '+60 12-340 1234', email: 'ahmad.z@gmail.com',      avatar_initials: 'AZ', avatar_color: '#5B3FD9', trust_score: 650 },
  { id: 'peer_06',      name: 'Nurul Iman',   phone: '+60 13-887 0001', email: 'nurul.i@gmail.com',      avatar_initials: 'NI', avatar_color: '#1A4FBE', trust_score: 695 },
];

let seeded = false;

export async function seedIfEmpty() {
  if (seeded) return;
  seeded = true;

  // Upsert mock users (idempotent)
  for (const u of MOCK_USERS) {
    await userModel.upsertUser(u);
    await graph.ensureUser(u.id, u.name);
  }

  // Build the prototype's network around guarantor_01 (Aiman):
  //   Farid (guarantor_02) -> Aiman (guarantor_01)   -> Siti (borrower_01), Rajesh (peer_01)
  //   Farid -> Maya (peer_02) [extended]
  //   Siti  -> Hafiz (peer_03) [extended]
  const trustEdges = [
    { sender_id: 'guarantor_02', receiver_id: 'guarantor_01', relationship: 'Family' },
    { sender_id: 'guarantor_01', receiver_id: 'borrower_01',  relationship: 'Niece' },
    { sender_id: 'guarantor_01', receiver_id: 'peer_01',      relationship: 'Colleague' },
    { sender_id: 'guarantor_02', receiver_id: 'peer_02',      relationship: 'Family' },
    { sender_id: 'borrower_01',  receiver_id: 'peer_03',      relationship: 'Friend' },
  ];

  for (const e of trustEdges) {
    const req = await trustService.createTrustLink(e);
    await trustService.acceptTrustLink({ requestId: req.id });
  }

  // Seed two pending loan requests for Aiman to approve (matches prototype).
  const reqA = await loanService.applyLoan({
    borrower_id: 'borrower_01', guarantor_id: 'guarantor_01',
    amount: 2500, term_months: 12, purpose: 'Personal use',
  });
  const reqB = await loanService.applyLoan({
    borrower_id: 'peer_01', guarantor_id: 'guarantor_01',
    amount: 1000, term_months: 6, purpose: 'Medical',
  });

  // One historical active loan + one repayment so the dashboard has data.
  const active = await loanService.applyLoan({
    borrower_id: 'guarantor_01', guarantor_id: 'guarantor_02',
    amount: 3000, term_months: 6, purpose: 'Working capital',
  });
  await loanService.approveLoan({ loanId: active.loan.id, guarantor_id: 'guarantor_02' });
  await loanService.repayLoan({ loanId: active.loan.id, amount: 510 });
  await loanService.repayLoan({ loanId: active.loan.id, amount: 510 });

  // Recompute scores after all activity.
  for (const u of MOCK_USERS) await recalcTrustScore(u.id);

  console.log(`[seed] mock world ready · users=${MOCK_USERS.length} · pending loans=2 · active loans=1`);
  // expose IDs for debug visibility
  console.log(`[seed] pending loan ids: ${reqA.loan.id}, ${reqB.loan.id}`);
}
