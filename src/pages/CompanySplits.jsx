import { useState } from 'react';
import { Plus, Search, Users, Percent, DollarSign } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import { usePartners, useCompanySplits } from '../hooks/useAirtable';

const statusColors = {
  Pending: 'warning',
  Distributed: 'success',
  pending: 'warning',
  distributed: 'success',
};

const emptyPartnerForm = {
  Name: '',
  Role: 'Partner',
  'Split Percentage': '',
  Email: '',
  Phone: '',
  Active: true,
  Notes: '',
};

export default function CompanySplits() {
  const { data: partnersList, loading: partnersLoading, error: partnersError, refresh: refreshPartners, create: createPartner, update: updatePartner, remove: removePartner } = usePartners();
  const { data: splitHistory, loading: splitsLoading, error: splitsError, refresh: refreshSplits, markDistributed } = useCompanySplits();
  const [searchTerm, setSearchTerm] = useState('');
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [partnerForm, setPartnerForm] = useState(emptyPartnerForm);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);

  const loading = partnersLoading || splitsLoading;
  const error = partnersError || splitsError;

  const totalDistributed = splitHistory
    .filter(s => (s.Status || '').toLowerCase() === 'distributed')
    .reduce((sum, s) => sum + (s['Distributable Profit'] || 0), 0);

  const totalPending = splitHistory
    .filter(s => (s.Status || '').toLowerCase() === 'pending')
    .reduce((sum, s) => sum + (s['Distributable Profit'] || 0), 0);

  const partnerTotals = partnersList.map(partner => {
    const total = splitHistory
      .filter(s => (s.Status || '').toLowerCase() === 'distributed')
      .reduce((sum, split) => {
        if (split['Partner'] === partner.Name || split['Partner']?.[0] === partner.id) {
          return sum + (split['Split Amount'] || 0);
        }
        return sum;
      }, 0);
    return { ...partner, totalEarned: total };
  });

  const openAddPartner = () => {
    setEditingPartner(null);
    setPartnerForm(emptyPartnerForm);
    setPartnerModalOpen(true);
  };

  const openEditPartner = (partner) => {
    setEditingPartner(partner);
    setPartnerForm({
      Name: partner.Name || '',
      Role: partner.Role || 'Partner',
      'Split Percentage': partner['Split Percentage'] || '',
      Email: partner.Email || '',
      Phone: partner.Phone || '',
      Active: partner.Active !== false,
      Notes: partner.Notes || '',
    });
    setPartnerModalOpen(true);
  };

  const handleSavePartner = async () => {
    setSaving(true);
    try {
      const fields = { ...partnerForm };
      if (fields['Split Percentage']) fields['Split Percentage'] = Number(fields['Split Percentage']);

      if (editingPartner) {
        await updatePartner(editingPartner.id, fields);
      } else {
        await createPartner(fields);
      }
      setPartnerModalOpen(false);
    } catch (err) {
      alert('Error saving partner: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDistribute = async (id) => {
    setProcessing(true);
    try {
      await markDistributed(id);
    } catch (err) {
      alert('Error distributing: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <LoadingState message="Loading company splits..." />;
  if (error) return <ErrorState message={error} onRetry={() => { refreshPartners(); refreshSplits(); }} />;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Splits</h1>
          <p className="text-gray-500 mt-1">Partner profit distribution after commissions</p>
        </div>
        <Button icon={Plus} onClick={openAddPartner}>Manage Partners</Button>
      </div>

      {/* Partner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {partnerTotals.map(partner => (
          <Card
            key={partner.id}
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => openEditPartner(partner)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{partner.Name}</div>
                  <div className="text-sm text-gray-500">{partner.Role}</div>
                </div>
              </div>
              <Badge variant="info">{partner['Split Percentage']}%</Badge>
            </div>
            <div className="text-2xl font-semibold text-green-600">
              ${partner.totalEarned.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">YTD Distributions</div>
          </Card>
        ))}

        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">Total Distributed</span>
          </div>
          <div className="text-2xl font-semibold text-green-700">
            ${totalDistributed.toLocaleString()}
          </div>
        </Card>

        <Card className="p-4 bg-orange-50 border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-700">Pending Distribution</span>
          </div>
          <div className="text-2xl font-semibold text-orange-700">
            ${totalPending.toLocaleString()}
          </div>
        </Card>
      </div>

      {/* Split Calculation Info */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Net Profit</span>
            </div>
            <span className="text-gray-400">-</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600">Commissions Paid</span>
            </div>
            <span className="text-gray-400">=</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600 font-medium">Distributable Profit</span>
            </div>
            <span className="text-gray-400">-&gt;</span>
            <span className="text-gray-600">Split by Partner %</span>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by job..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Split History Table */}
      <Card>
        <CardHeader>
          <CardTitle icon={Percent}>Split History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {splitHistory.length === 0 ? (
            <EmptyState title="No splits yet" description="Company splits will appear here once commissions are processed" />
          ) : (
            <Table>
              <TableHeader>
                <TableHead>Date</TableHead>
                <TableHead>Job</TableHead>
                <TableHead className="text-right">Net Profit</TableHead>
                <TableHead className="text-right">Commissions</TableHead>
                <TableHead className="text-right">Distributable</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead className="text-right">Split Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead></TableHead>
              </TableHeader>
              <TableBody>
                {splitHistory.map((split) => {
                  const statusKey = split.Status || 'Pending';
                  return (
                    <TableRow key={split.id}>
                      <TableCell className="text-gray-500">{split.Date}</TableCell>
                      <TableCell>
                        <span className="text-purple-600 hover:underline cursor-pointer font-medium">
                          {split['Job ID'] || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${(split['Net Profit'] || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-500">
                        -${(split['Commission Deducted'] || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        ${(split['Distributable Profit'] || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {split['Partner Name'] || split.Partner || '—'}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${(split['Split Amount'] || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={statusColors[statusKey] || 'warning'}>
                          {statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(statusKey || '').toLowerCase() === 'pending' && (
                          <Button size="sm" variant="success" onClick={() => handleDistribute(split.id)} disabled={processing}>
                            Distribute
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

      {/* Partner Modal */}
      <Modal open={partnerModalOpen} onClose={() => setPartnerModalOpen(false)} title={editingPartner ? 'Edit Partner' : 'Add Partner'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={partnerForm.Name}
              onChange={e => setPartnerForm({ ...partnerForm, Name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={partnerForm.Role}
                onChange={e => setPartnerForm({ ...partnerForm, Role: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {['Owner', 'Partner', 'Investor'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Split Percentage (%)</label>
              <input
                type="number"
                value={partnerForm['Split Percentage']}
                onChange={e => setPartnerForm({ ...partnerForm, 'Split Percentage': e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={partnerForm.Email}
                onChange={e => setPartnerForm({ ...partnerForm, Email: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={partnerForm.Phone}
                onChange={e => setPartnerForm({ ...partnerForm, Phone: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={partnerForm.Notes}
              onChange={e => setPartnerForm({ ...partnerForm, Notes: e.target.value })}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="partnerActive"
              checked={partnerForm.Active}
              onChange={e => setPartnerForm({ ...partnerForm, Active: e.target.checked })}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="partnerActive" className="text-sm text-gray-700">Active</label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setPartnerModalOpen(false)}>Cancel</Button>
            {editingPartner && (
              <Button
                variant="danger"
                onClick={async () => {
                  if (!confirm(`Delete partner "${editingPartner.Name}"?`)) return;
                  try {
                    await removePartner(editingPartner.id);
                    setPartnerModalOpen(false);
                  } catch (err) {
                    alert('Error: ' + err.message);
                  }
                }}
              >
                Delete
              </Button>
            )}
            <Button onClick={handleSavePartner} disabled={saving || !partnerForm.Name}>
              {saving ? 'Saving...' : editingPartner ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
