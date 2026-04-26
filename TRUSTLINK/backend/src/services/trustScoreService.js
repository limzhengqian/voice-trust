// Rule-based trust score (no Bedrock).
//
// Base 50, plus signals from repayments, active guarantor support and
// strong trust links, minus defaults / rejections. Capped at 850 to match
// the prototype's "/ 850" indicator. Returns an integer.

import * as userModel from '../models/userModel.js';
import * as loanModel from '../models/loanModel.js';
import * as trustModel from '../models/trustModel.js';

const BASE = 500;
const MAX  = 850;

// Weights calibrated so a fresh user with 1–3 trust links lands in the
// 550–750 "Fair → Strong" band that the prototype's borrowing-power
// table expects.
const W = {
  REPAYMENT: 8,         // per successful repayment instalment
  COMPLETED_LOAN: 25,   // per fully repaid loan
  ACTIVE_GUARANTOR: 25, // per outgoing accepted link (someone you back / are backed by)
  STRONG_LINK: 40,      // per accepted trust link
  DEFAULT: -150,        // per defaulted loan
  REJECTED: -10,        // per rejected loan application
};

export function computeBreakdown({ repayments, completedLoans, guarantors, strongLinks, defaults, rejected }) {
  return {
    base: BASE,
    repaymentBonus: repayments * W.REPAYMENT,
    completedLoanBonus: completedLoans * W.COMPLETED_LOAN,
    guarantorBonus: guarantors * W.ACTIVE_GUARANTOR,
    strongLinkBonus: strongLinks * W.STRONG_LINK,
    defaultPenalty: defaults * W.DEFAULT,
    rejectedPenalty: rejected * W.REJECTED,
  };
}

export async function recalcTrustScore(userId) {
  const loans = await loanModel.listLoans({ userId });

  // Borrower-side aggregations
  const borrowerLoans = loans.filter(l => l.borrower_id === userId);
  const completedLoans = borrowerLoans.filter(l => l.status === 'repaid').length;
  const defaults       = borrowerLoans.filter(l => l.status === 'defaulted').length;
  const rejected       = borrowerLoans.filter(l => l.status === 'rejected').length;

  let repayments = 0;
  for (const l of borrowerLoans) {
    const r = await loanModel.listRepayments(l.id);
    repayments += r.length;
  }

  // Trust signals
  const acceptedEdges = await trustModel.listTrustRequests({ userId, status: 'accepted' });
  const strongLinks = acceptedEdges.length;

  // Active guarantors = people who accepted a trust link sent BY this user (they back you)
  const guarantors = acceptedEdges.filter(r => r.sender_id === userId).length;

  const b = computeBreakdown({ repayments, completedLoans, guarantors, strongLinks, defaults, rejected });
  const total = Object.values(b).reduce((a, n) => a + n, 0);
  const score = Math.max(0, Math.min(MAX, Math.round(total)));

  await userModel.setTrustScore(userId, score);
  return { score, breakdown: b };
}

// Convenience for endpoints that need to express borrowing power
// (mirrors the prototype's "RM 12.5K" tile — driven by score band).
export function borrowingPowerFromScore(score) {
  if (score >= 800) return 12500;
  if (score >= 700) return 8000;
  if (score >= 600) return 4000;
  if (score >= 500) return 2000;
  return 500;
}

export function tierFromScore(score) {
  if (score >= 800) return 'Excellent';
  if (score >= 700) return 'Strong';
  if (score >= 600) return 'Good';
  if (score >= 500) return 'Fair';
  return 'Building';
}
