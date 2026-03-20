import { useState, useEffect, useCallback } from 'react';
import { Search, Download, CheckCircle, Clock, XCircle, FileText } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import { useCommissions, useCompanySplits, useContractors } from '../hooks/useAirtable';
import { contractorData } from '../services/airtable';
import { generateHandoffPDF } from '../utils/handoffDocument';

const statusConfig = {
  Pending: { color: 'warning', icon: Clock, label: 'Pending' },
  Approved: { color: 'info', icon: CheckCircle, label: 'Approved' },
  Paid: { color: 'success', icon: CheckCircle, label: 'Paid' },
  Disputed: { color: 'danger', icon: XCircle, label: 'Disputed' },
};

export default function Payments() {
  const { data: payments, loading, error, refresh, markApproved, markPaid } = useCommissions();
  const { data: splits } = useCompanySplits();
  const { data: contractorsList } = useContractors();
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [payForm, setPayForm] = useState({ method: 'Check', reference: '' });
  const [processing, setProcessing] = useState(false);

  const filteredPayments = payments.filter(payment => {
    const status = payment.Status || 'Pending';
    const matchesFilter = filter === 'all' || status === filter;
    const source = payment['Referral Source Name'] || payment['Referral Source'] || '';
    const job = payment['Job ID'] || '';
    const matchesSearch =
      source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totals = {
    pending: payments.filter(p => p.Status === 'Pending').reduce((sum, p) => sum + (p['Commission Amount'] || 0), 0),
    approved: payments.filter(p => p.Status === 'Approved').reduce((sum, p) => sum + (p['Commission Amount'] || 0), 0),
    paid: payments.filter(p => p.Status === 'Paid').reduce((sum, p) => sum + (p['Commission Amount'] || 0), 0),
  };

  // Fetch jobs in background for PDF handoff data
  const fetchJobs = useCallback(async () => {
    if (contractorsList.length === 0) return;
    try {
      const allJobs = await contractorData.fetchAllJobs(contractorsList);
      setJobs(allJobs);
    } catch (err) {
      console.error('Failed to fetch jobs for handoff:', err);
    }
  }, [contractorsList]);

  useEffect(() => {
    if (contractorsList.length > 0 && jobs.length === 0) {
      fetchJobs();
    }
  }, [contractorsList, jobs.length, fetchJobs]);

  const handleHandoff = (payment) => {
    const jobSplits = splits.filter(s => s['Job ID'] === payment['Job ID']);
    const job = jobs.find(j => (j['Claim ID'] || j.id) === payment['Job ID']);
    generateHandoffPDF(payment, { splits: jobSplits, job });
  };

  const handleApprove = async (id) => {
    setProcessing(true);
    try {
      await markApproved(id);
    } catch (err) {
      alert('Error approving: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const openPayModal = (id) => {
    setPayingId(id);
    setPayForm({ method: 'Check', reference: '' });
    setPayModalOpen(true);
  };

  const handleMarkPaid = async () => {
    setProcessing(true);
    try {
      await markPaid(payingId, payForm);
      setPayModalOpen(false);
    } catch (err) {
      alert('Error marking paid: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <LoadingState message="Loading commission payments..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commission Payments</h1>
          <p className="text-gray-500 mt-1">Track and manage commission payouts</p>
        </div>
        <Button icon={Download} variant="secondary">Export</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setFilter(filter === 'Pending' ? 'all' : 'Pending')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filter === 'Pending' ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Pending</span>
            <Clock className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-semibold text-orange-500 mt-1">${totals.pending.toLocaleString()}</p>
        </button>
        <button
          onClick={() => setFilter(filter === 'Approved' ? 'all' : 'Approved')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filter === 'Approved' ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Approved</span>
            <CheckCircle className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-semibold text-blue-500 mt-1">${totals.approved.toLocaleString()}</p>
        </button>
        <button
          onClick={() => setFilter(filter === 'Paid' ? 'all' : 'Paid')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filter === 'Paid' ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Paid (YTD)</span>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-semibold text-green-500 mt-1">${totals.paid.toLocaleString()}</p>
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by source or job..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        {filter !== 'all' && (
          <Button variant="ghost" onClick={() => setFilter('all')}>Clear filter</Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredPayments.length === 0 ? (
            <EmptyState title="No commissions found" description={filter !== 'all' ? 'Try clearing the filter' : 'Commissions will appear here once jobs are processed'} />
          ) : (
            <Table>
              <TableHeader>
                <TableHead>Date</TableHead>
                <TableHead>Referral Source</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Basis</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Handoff</TableHead>
                <TableHead></TableHead>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => {
                  const status = statusConfig[payment.Status] || statusConfig.Pending;
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="text-gray-500">{payment['Date Calculated']}</TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {payment['Referral Source Name'] || payment['Referral Source'] || '—'}
                      </TableCell>
                      <TableCell>
                        <span className="text-purple-600 hover:underline cursor-pointer">
                          {payment['Job ID'] || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">
                            ${(payment['Basis Amount'] || 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">{payment['Commission Basis']}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {payment['Rate Applied'] ? (
                          payment['Commission Basis'] === 'Flat Rate'
                            ? `$${payment['Rate Applied']}`
                            : `${payment['Rate Applied']}%`
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-gray-900">
                          ${(payment['Commission Amount'] || 0).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={status.color} icon={status.icon}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button size="sm" variant="secondary" icon={FileText} onClick={() => handleHandoff(payment)}>
                          PDF
                        </Button>
                      </TableCell>
                      <TableCell>
                        {payment.Status === 'Pending' && (
                          <Button size="sm" variant="success" onClick={() => handleApprove(payment.id)} disabled={processing}>
                            Approve
                          </Button>
                        )}
                        {payment.Status === 'Approved' && (
                          <Button size="sm" variant="primary" onClick={() => openPayModal(payment.id)} disabled={processing}>
                            Mark Paid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Mark Paid Modal */}
      <Modal open={payModalOpen} onClose={() => setPayModalOpen(false)} title="Mark Commission as Paid">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={payForm.method}
              onChange={e => setPayForm({ ...payForm, method: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {['Check', 'ACH', 'Cash'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference # (check number, etc.)</label>
            <input
              type="text"
              value={payForm.reference}
              onChange={e => setPayForm({ ...payForm, reference: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setPayModalOpen(false)}>Cancel</Button>
            <Button onClick={handleMarkPaid} disabled={processing}>
              {processing ? 'Processing...' : 'Confirm Payment'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
