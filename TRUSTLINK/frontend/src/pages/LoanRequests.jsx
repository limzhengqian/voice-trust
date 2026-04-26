import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore.js';
import { api } from '../services/api.js';
import { fmtRM } from '../lib/format.js';
import SubHeader from '../components/SubHeader.jsx';
import Avatar from '../components/Avatar.jsx';

export default function LoanRequests() {
  const userId = useAppStore(s => s.userId);
  const showToast = useAppStore(s => s.showToast);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState({});

  const reload = async () => {
    const [loans, all] = await Promise.all([
      api.loansForUser(userId, 'pending'),
      api.listUsers(),
    ]);
    const byId = Object.fromEntries(all.map(u => [u.id, u]));
    setUsers(byId);
    setRequests(loans.filter(l => l.guarantor_id === userId));
  };

  useEffect(() => { if (userId) reload(); }, [userId]);

  const approve = async (loanId) => {
    try { await api.loanApprove(loanId, userId); showToast('✓ Loan approved · funds disbursed'); reload(); }
    catch (e) { showToast(e.message); }
  };
  const reject = async (loanId) => {
    try { await api.loanReject(loanId); showToast('Loan declined'); reload(); }
    catch (e) { showToast(e.message); }
  };

  return (
    <>
      <SubHeader title="Loan Requests" back="/loans" />

      <div style={{ margin: '14px 16px 8px', fontFamily: 'Sora,sans-serif', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Pending Approval
        <span style={{ background: 'var(--tng-danger)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>{requests.length}</span>
      </div>

      {requests.length === 0 && (
        <div style={{ margin: 30, textAlign: 'center', color: 'var(--tng-text-muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✨</div>
          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700 }}>All caught up</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>No pending loan requests right now.</div>
        </div>
      )}

      {requests.map(loan => {
        const borrower = users[loan.borrower_id] || { name: loan.borrower_id };
        return (
          <div key={loan.id} className="card" style={{ margin: '0 16px 10px', padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Avatar user={borrower} size={38} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{borrower.name}</div>
                <div style={{ fontSize: 11, color: 'var(--tng-text-muted)' }}>Trust {borrower.trust_score || '—'} · {loan.purpose || 'Personal'}</div>
              </div>
              <span className="pending-pill"><span className="pending-dot" />Pending</span>
            </div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 26, fontWeight: 800, color: 'var(--tng-blue)', marginBottom: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 600, opacity: .7, marginRight: 2 }}>RM</span>
              {Number(loan.amount).toLocaleString('en-MY')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--tng-text-muted)', marginBottom: 12, display: 'flex', gap: 10 }}>
              <span>📅 {loan.term_months} months</span>
              <span>📈 {(Number(loan.interest_rate) * 100).toFixed(1)}% p.a.</span>
              <span>💸 {fmtRM(loan.monthly_payment)}/mo</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => reject(loan.id)} style={{ flex: 1, padding: 11, borderRadius: 10, fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer', background: 'rgba(224,53,75,.1)', color: 'var(--tng-danger)', border: '1.5px solid rgba(224,53,75,.2)' }}>Decline</button>
              <button onClick={() => approve(loan.id)} style={{ flex: 1, padding: 11, borderRadius: 10, fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer', background: 'var(--tng-success)', color: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(31,179,107,.3)' }}>Approve</button>
            </div>
          </div>
        );
      })}

      <div className="bottom-spacer" style={{ height: 90 }} />
    </>
  );
}
