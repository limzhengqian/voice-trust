import * as loanService from '../services/loanService.js';
import * as loanModel from '../models/loanModel.js';

export async function postApply(req, res, next) {
  try {
    const { borrower_id, guarantor_id, amount, term_months, purpose, auto_approve } = req.body;
    if (!borrower_id || !amount) {
      return res.status(400).json({ error: 'borrower_id and amount required' });
    }
    const out = await loanService.applyLoan({
      borrower_id, guarantor_id,
      amount: Number(amount),
      term_months: Number(term_months) || 6,
      purpose,
      auto_approve: !!auto_approve,
    });
    res.status(201).json(out);
  } catch (e) { next(e); }
}

export async function postApprove(req, res, next) {
  try {
    const { loan_id, guarantor_id } = req.body;
    if (!loan_id) return res.status(400).json({ error: 'loan_id required' });
    const out = await loanService.approveLoan({ loanId: loan_id, guarantor_id });
    res.json(out);
  } catch (e) { next(e); }
}

export async function postReject(req, res, next) {
  try {
    const { loan_id } = req.body;
    if (!loan_id) return res.status(400).json({ error: 'loan_id required' });
    const out = await loanService.rejectLoan({ loanId: loan_id });
    res.json(out);
  } catch (e) { next(e); }
}

export async function postRepay(req, res, next) {
  try {
    const { loan_id, amount } = req.body;
    if (!loan_id || !amount) return res.status(400).json({ error: 'loan_id and amount required' });
    const out = await loanService.repayLoan({ loanId: loan_id, amount: Number(amount) });
    res.json(out);
  } catch (e) { next(e); }
}

export async function postDefault(req, res, next) {
  try {
    const { loan_id } = req.body;
    if (!loan_id) return res.status(400).json({ error: 'loan_id required' });
    const out = await loanService.defaultLoan({ loanId: loan_id });
    res.json(out);
  } catch (e) { next(e); }
}

export async function getStatus(req, res, next) {
  try {
    const status = await loanService.getLoanStatus(req.params.loanId);
    if (!status) return res.status(404).json({ error: 'Loan not found' });
    res.json(status);
  } catch (e) { next(e); }
}

export async function listForUser(req, res, next) {
  try {
    const { user_id, status } = req.query;
    const loans = await loanModel.listLoans({ userId: user_id, status });
    res.json(loans);
  } catch (e) { next(e); }
}
