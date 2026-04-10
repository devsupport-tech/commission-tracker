import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Overview from './pages/Overview';
import ReferralSources from './pages/ReferralSources';
import Payments from './pages/Payments';
import CompanySplits from './pages/CompanySplits';
import Contractors from './pages/Contractors';
import Jobs from './pages/Jobs';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        {(contractorFilter, setContractorFilter) => (
          <Routes>
            <Route path="/" element={<Overview contractorFilter={contractorFilter} />} />
            <Route path="/referral-sources" element={<ReferralSources />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/company-splits" element={<CompanySplits />} />
            <Route path="/contractors" element={<Contractors onSelectContractor={setContractorFilter} />} />
            <Route path="/jobs" element={<Jobs contractorFilter={contractorFilter} />} />
          </Routes>
        )}
      </Layout>
    </BrowserRouter>
  );
}

export default App;
