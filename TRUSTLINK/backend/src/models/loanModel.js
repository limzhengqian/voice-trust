import { randomUUID } from 'crypto';
import { config } from '../config/index.js';
import { query } from '../db/pgClient.js';
import { memDb } from '../db/memoryStore.js';

const usePg = () => config.pg.enabled;

export async function createLoan(loan) {
  if (!usePg()) return memDb.createLoan(loan);
  const id = randomUUID();
  const { rows } = await query(
    `INSERT INTO loans
       (id, borrower_id, guarantor_id, amount, term_months, interest_rate, monthly_payment, purpose, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending')
     RETURNING *`,
    [id, loan.borrower_id, loan.guarantor_id || null, loan.amount,
     loan.term_months || 6, loan.interest_rate || 0.068, loan.monthly_payment || 0,
     loan.purpose || null]
  );
  return rows[0];
}

export async function getLoan(id) {
  if (!usePg()) return memDb.getLoan(id);
  const { rows } = await query('SELECT * FROM loans WHERE id=$1', [id]);
  return rows[0] || null;
}

export async function updateLoan(id, patch) {
  if (!usePg()) return memDb.updateLoan(id, patch);
  const fields = Object.keys(patch);
  if (fields.length === 0) return getLoan(id);
  const setClauses = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
  const params = [id, ...fields.map(f => patch[f])];
  const { rows } = await query(
    `UPDATE loans SET ${setClauses} WHERE id = $1 RETURNING *`, params
  );
  return rows[0] || null;
}

export async function listLoans({ userId, status } = {}) {
  if (!usePg()) return memDb.listLoans({ userId, status });
  const where = [];
  const params = [];
  if (userId) {
    params.push(userId);
    where.push(`(borrower_id = $${params.length} OR guarantor_id = $${params.length})`);
  }
  if (status) { params.push(status); where.push(`status = $${params.length}`); }
  const sql = `SELECT l.*, 
                      b.name AS borrower_name, 
                      g.name AS guarantor_name
               FROM loans l
               LEFT JOIN users b ON l.borrower_id = b.id
               LEFT JOIN users g ON l.guarantor_id = g.id` +
              (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
              ' ORDER BY l.created_at DESC';
  const { rows } = await query(sql, params);
  return rows;
}

export async function createRepayment({ loan_id, amount }) {
  if (!usePg()) return memDb.createRepayment({ loan_id, amount });
  const id = randomUUID();
  const { rows } = await query(
    `INSERT INTO repayments (id, loan_id, amount, status)
     VALUES ($1,$2,$3,'paid') RETURNING *`,
    [id, loan_id, amount]
  );
  return rows[0];
}

export async function listRepayments(loan_id) {
  if (!usePg()) return memDb.listRepayments(loan_id);
  const { rows } = await query(
    'SELECT * FROM repayments WHERE loan_id=$1 ORDER BY paid_at ASC',
    [loan_id]
  );
  return rows;
}
