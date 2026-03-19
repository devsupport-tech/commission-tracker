import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Overview from './pages/Overview';
import ReferralSources from './pages/ReferralSources';
import CommissionRules from './pages/CommissionRules';
import Payments from './pages/Payments';
import CompanySplits from './pages/CompanySplits';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/referral-sources" element={<ReferralSources />} />
          <Route path="/commission-rules" element={<CommissionRules />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/company-splits" element={<CompanySplits />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
