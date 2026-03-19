import { useState } from 'react';
import { Search, Filter, Download, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

// Mock data - will be replaced with Airtable data
const mockPayments = [
  {
    id: 1,
    date: '2024-05-31',
    source: 'Mike Johnson',
    job: 'CLM-2024-002',
    jobAddress: '123 Main St, Austin, TX',
    basisAmount: 8500,
    commissionBasis: 'Revenue Collected',
    rate: '10%',
    amount: 850,
    status: 'pending',
    paidDate: null,
  },
  {
    id: 2,
    date: '2024-05-30',
    source: 'ABC Contractors',
    job: 'CLM-2024-001',
    jobAddress: '456 Oak Ave, Dallas, TX',
    basisAmount: 15000,
    commissionBasis: 'Net Profit',
    rate: '8%',
    amount: 1200,
    status: 'approved',
    paidDate: null,
  },
  {
    id: 3,
    date: '2024-05-25',
    source: 'Sarah Miller',
    job: 'CLM-2024-003',
    jobAddress: '789 Pine Rd, Houston, TX',
    basisAmount: 5000,
    commissionBasis: 'Flat Rate',
    rate: '$500',
    amount: 500,
    status: 'paid',
    paidDate: '2024-05-28',
  },
  {
    id: 4,
    date: '2024-05-20',
    source: 'Mike Johnson',
    job: 'CLM-2024-001',
    jobAddress: '456 Oak Ave, Dallas, TX',
    basisAmount: 12000,
    commissionBasis: 'Revenue Collected',
    rate: '10%',
    amount: 1200,
    status: 'paid',
    paidDate: '2024-05-22',
  },
];

const statusConfig = {
  pending: { color: 'warning', icon: Clock, label: 'Pending' },
  approved: { color: 'info', icon: CheckCircle, label: 'Approved' },
  paid: { color: 'success', icon: CheckCircle, label: 'Paid' },
  disputed: { color: 'danger', icon: XCircle, label: 'Disputed' },
};

export default function Payments() {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPayments = mockPayments.filter(payment => {
    const matchesFilter = filter === 'all' || payment.status === filter;
    const matchesSearch =
      payment.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.job.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totals = {
    pending: mockPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    approved: mockPayments.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0),
    paid: mockPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commission Payments</h1>
          <p className="text-gray-500 mt-1">Track and manage commission payouts</p>
        </div>
        <Button icon={Download} variant="secondary">
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setFilter(filter === 'pending' ? 'all' : 'pending')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filter === 'pending'
              ? 'border-orange-300 bg-orange-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Pending</span>
            <Clock className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-semibold text-orange-500 mt-1">
            ${totals.pending.toLocaleString()}
          </p>
        </button>

        <button
          onClick={() => setFilter(filter === 'approved' ? 'all' : 'approved')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filter === 'approved'
              ? 'border-blue-300 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Approved</span>
            <CheckCircle className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-semibold text-blue-500 mt-1">
            ${totals.approved.toLocaleString()}
          </p>
        </button>

        <button
          onClick={() => setFilter(filter === 'paid' ? 'all' : 'paid')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filter === 'paid'
              ? 'border-green-300 bg-green-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Paid (YTD)</span>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-semibold text-green-500 mt-1">
            ${totals.paid.toLocaleString()}
          </p>
        </button>
      </div>

      {/* Search and Filter */}
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
          <Button variant="ghost" onClick={() => setFilter('all')}>
            Clear filter
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableHead>Date</TableHead>
              <TableHead>Referral Source</TableHead>
              <TableHead>Job</TableHead>
              <TableHead>Basis</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead></TableHead>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => {
                const status = statusConfig[payment.status];
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="text-gray-500">{payment.date}</TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {payment.source}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="text-purple-600 hover:underline cursor-pointer">
                          {payment.job}
                        </span>
                        <div className="text-sm text-gray-500 truncate max-w-[200px]">
                          {payment.jobAddress}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">
                          ${payment.basisAmount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.commissionBasis}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{payment.rate}</TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-gray-900">
                        ${payment.amount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={status.color} icon={status.icon}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payment.status === 'pending' && (
                        <Button size="sm" variant="success">
                          Approve
                        </Button>
                      )}
                      {payment.status === 'approved' && (
                        <Button size="sm" variant="primary">
                          Mark Paid
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
