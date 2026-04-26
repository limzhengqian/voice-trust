import * as loanModel from '../models/loanModel.js';
import * as userModel from '../models/userModel.js';
import { graph } from './graphService.js';
import { recalcTrustScore, borrowingPowerFromScore } from './trustScoreService.js';

function monthlyPayment(principal, term_months, annualRate = 0.068) {
  const mr = annualRate / 12;
  if (mr === 0) return principal / term_months;
  return (principal * mr * Math.pow(1 + mr, term_months)) / (Math.pow(1 + mr, term_months) - 1);
}

export async function applyLoan({ borrower_id, guarantor_id, amount, term_months = 6, purpose, auto_approve = false }) {
  const borrower = await userModel.getUser(borrower_id);
  if (!borrower) throw new Error('Borrower not found');

  // Trust-based decisioning: cap requested amount by borrowing power.
  const cap = borrowingPowerFromScore(borrower.trust_score);
  if (amount > cap) {
    const rejected = await loanModel.createLoan({
      borrower_id, guarantor_id, amount, term_months,
      monthly_payment: monthlyPayment(amount, term_months),
      purpose,
    });
    await loanModel.updateLoan(rejected.id, { status: 'rejected' });
    await recalcTrustScore(borrower_id);
    return { loan: { ...rejected, status: 'rejected' }, decision: 'rejected', reason: 'Amount exceeds trust-based borrowing cap', cap };
  }

  const loan = await loanModel.createLoan({
    borrower_id, guarantor_id, amount, term_months,
    monthly_payment: Math.round(monthlyPayment(amount, term_months)),
    purpose,
  });

  // Network-anchor guarantors don't need external approval — their loans
  // become active immediately. Guarantees still require their guarantor to
  // approve via the Loan Requests flow.
  if (auto_approve) {
    const active = await loanModel.updateLoan(loan.id, {
      status: 'active',
      approved_at: new Date().toISOString(),
    });
    return { loan: active, decision: 'approved', cap };
  }

  return { loan, decision: 'pending', cap };
}

export async function approveLoan({ loanId, guarantor_id }) {
  const loan = await loanModel.getLoan(loanId);
  if (!loan) throw new Error('Loan not found');
  if (loan.status !== 'pending') throw new Error(`Loan is already ${loan.status}`);

  const updated = await loanModel.updateLoan(loanId, {
    status: 'active',
    guarantor_id: guarantor_id || loan.guarantor_id,
    approved_at: new Date().toISOString(),
  });

  if (updated.guarantor_id) {
    await graph.addGuarantees(updated.guarantor_id, updated.borrower_id, updated.id);
  }
  return updated;
}

export async function rejectLoan({ loanId }) {
  const loan = await loanModel.getLoan(loanId);
  if (!loan) throw new Error('Loan not found');
  const updated = await loanModel.updateLoan(loanId, { status: 'rejected', closed_at: new Date().toISOString() });
  await recalcTrustScore(loan.borrower_id);
  return updated;
}

export async function repayLoan({ loanId, amount }) {
  const loan = await loanModel.getLoan(loanId);
  if (!loan) throw new Error('Loan not found');
  if (loan.status !== 'active') throw new Error(`Cannot repay loan with status ${loan.status}`);

  const repayment = await loanModel.createRepayment({ loan_id: loanId, amount });
  const allRepayments = await loanModel.listRepayments(loanId);
  const totalPaid = allRepayments.reduce((sum, r) => sum + Number(r.amount), 0);
  const totalDue = Number(loan.monthly_payment) * Number(loan.term_months);

  let updated = loan;
  if (totalPaid >= totalDue || allRepayments.length >= loan.term_months) {
    updated = await loanModel.updateLoan(loanId, { status: 'repaid', closed_at: new Date().toISOString() });
    await graph.recordRepayment(loan.borrower_id, loan.id);
  }

  await recalcTrustScore(loan.borrower_id);

  return {
    repayment,
    loan: updated,
    totalPaid,
    totalDue,
    remaining: Math.max(0, totalDue - totalPaid),
    instalmentsPaid: allRepayments.length,
  };
}

export async function defaultLoan({ loanId }) {
  const loan = await loanModel.getLoan(loanId);
  if (!loan) throw new Error('Loan not found');
  const updated = await loanModel.updateLoan(loanId, { status: 'defaulted', closed_at: new Date().toISOString() });
  await graph.recordDefault(loan.borrower_id, loan.id);
  await recalcTrustScore(loan.borrower_id);
  return updated;
}

export async function getLoanStatus(loanId) {
  const loan = await loanModel.getLoan(loanId);
  if (!loan) return null;
  const repayments = await loanModel.listRepayments(loanId);
  const paid = repayments.reduce((s, r) => s + Number(r.amount), 0);
  const totalDue = Number(loan.monthly_payment) * Number(loan.term_months);
  return {
    ...loan,
    repayments,
    instalments_paid: repayments.length,
    total_paid: paid,
    total_due: totalDue,
    remaining: Math.max(0, totalDue - paid),
  };
}
