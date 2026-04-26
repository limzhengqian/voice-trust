import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PhoneShell from './components/PhoneShell.jsx';
import Home from './pages/Home.jsx';
import TrustNetwork from './pages/TrustNetwork.jsx';
import Connections from './pages/Connections.jsx';
import ApplyLoan from './pages/ApplyLoan.jsx';
import LoanTracking from './pages/LoanTracking.jsx';
import LoanRequests from './pages/LoanRequests.jsx';
import ManageGuarantee from './pages/ManageGuarantee.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PhoneShell />}>
          <Route path="/"            element={<Navigate to="/home" replace />} />
          <Route path="/home"        element={<Home />} />
          <Route path="/network"     element={<TrustNetwork />} />
          <Route path="/connections" element={<Connections />} />
          <Route path="/loan"        element={<ApplyLoan />} />
          <Route path="/loans"       element={<LoanTracking />} />
          <Route path="/requests"    element={<LoanRequests />} />
          <Route path="/manage/:id"  element={<ManageGuarantee />} />
          <Route path="*"            element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
