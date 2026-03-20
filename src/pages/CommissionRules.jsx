import { useState } from 'react';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import { useCommissionRules, useReferralSources } from '../hooks/useAirtable';

const basisColors = {
  'Revenue Collected': 'info',
  'Net Profit': 'success',
  'Flat Rate': 'purple',
};

const jobTypeColors = {
  Mitigation: 'warning',
  Rebuild: 'info',
  Packout: 'purple',
  Estimate: 'default',
  All: 'success',
};

const emptyForm = {
  'Rule Name': '',
  'Source Type': '',
  'Specific Source': '',
  'Job Type': 'All',
  'Commission Basis': 'Revenue Collected',
  'Rate Type': 'Percentage',
  'Rate Value': '',
  'Min Threshold': '',
  'Max Commission': '',
  Priority: 10,
  Active: true,
  Notes: '',
};

export default function CommissionRules() {
  const { data: rules, loading, error, refresh, create, update, remove } = useCommissionRules();
  const { data: referralSourcesList } = useReferralSources();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (rule) => {
    setEditing(rule);
    setForm({
      'Rule Name': rule['Rule Name'] || '',
      'Source Type': rule['Source Type'] || '',
      'Specific Source': rule['Specific Source'] || '',
      'Job Type': rule['Job Type'] || 'All',
      'Commission Basis': rule['Commission Basis'] || 'Revenue Collected',
      'Rate Type': rule['Rate Type'] || 'Percentage',
      'Rate Value': rule['Rate Value'] || '',
      'Min Threshold': rule['Min Threshold'] || '',
      'Max Commission': rule['Max Commission'] || '',
      Priority: rule.Priority || 10,
      Active: rule.Active !== false,
      Notes: rule.Notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fields = { ...form };
      ['Rate Value', 'Min Threshold', 'Max Commission', 'Priority'].forEach(f => {
        if (fields[f] !== '' && fields[f] !== undefined) fields[f] = Number(fields[f]);
        else delete fields[f];
      });
      if (!fields['Specific Source']) delete fields['Specific Source'];

      if (editing) {
        await update(editing.id, fields);
      } else {
        await create(fields);
      }
      setModalOpen(false);
    } catch (err) {
      alert('Error saving: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rule) => {
    if (!confirm(`Delete rule "${rule['Rule Name']}"?`)) return;
    try {
      await remove(rule.id);
    } catch (err) {
      alert('Error deleting: ' + err.message);
    }
  };

  if (loading) return <LoadingState message="Loading commission rules..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commission Rules</h1>
          <p className="text-gray-500 mt-1">Configure how commissions are calculated by source and job type</p>
        </div>
        <Button icon={Plus} onClick={openAdd}>Add Rule</Button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium">How rules are matched:</p>
          <p className="mt-1">
            Rules are evaluated by priority (highest first). Specific source rules override general source type rules.
            The first matching rule is applied.
          </p>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {rules.length === 0 ? (
            <EmptyState title="No commission rules" description="Add rules to configure how commissions are calculated" />
          ) : (
            <Table>
              <TableHeader>
                <TableHead>Rule Name</TableHead>
                <TableHead>Referral Source</TableHead>
                <TableHead>Job Type</TableHead>
                <TableHead>Commission Basis</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Thresholds</TableHead>
                <TableHead className="text-center">Priority</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead></TableHead>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div className="font-medium text-gray-900">{rule['Rule Name']}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-purple-600">{rule['Specific Source'] || '—'}</div>
                        {rule['Source Type'] && (
                          <Badge variant="default">{rule['Source Type']}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={jobTypeColors[rule['Job Type']] || 'default'}>{rule['Job Type']}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={basisColors[rule['Commission Basis']] || 'default'}>
                        {rule['Commission Basis']}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-gray-900">
                        {rule['Rate Type'] === 'Flat' ? `$${rule['Rate Value']}` : `${rule['Rate Value']}%`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {rule['Min Threshold'] > 0 && (
                          <div className="text-gray-600">Min: ${(rule['Min Threshold'] || 0).toLocaleString()}</div>
                        )}
                        {rule['Max Commission'] && (
                          <div className="text-gray-600">Max: ${(rule['Max Commission'] || 0).toLocaleString()}</div>
                        )}
                        {(!rule['Min Threshold'] || rule['Min Threshold'] === 0) && !rule['Max Commission'] && (
                          <span className="text-gray-400">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                        {rule.Priority}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={rule.Active !== false ? 'success' : 'default'}>
                        {rule.Active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                          onClick={() => openEdit(rule)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                          onClick={() => handleDelete(rule)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Commission Rule' : 'Add Commission Rule'} wide>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name *</label>
            <input
              type="text"
              value={form['Rule Name']}
              onChange={e => setForm({ ...form, 'Rule Name': e.target.value })}
              placeholder="e.g., Adjuster - Mitigation 10%"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referral Source *</label>
            <select
              value={form['Specific Source']}
              onChange={e => {
                const selectedName = e.target.value;
                const source = referralSourcesList.find(s => s.Name === selectedName);
                setForm({
                  ...form,
                  'Specific Source': selectedName,
                  'Source Type': source?.Type || '',
                });
              }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">-- Select a referral source --</option>
              {referralSourcesList
                .filter(s => s.Active !== false)
                .sort((a, b) => (a.Name || '').localeCompare(b.Name || ''))
                .map(s => (
                  <option key={s.id} value={s.Name}>
                    {s.Name} ({s.Type}{s.Company ? ` — ${s.Company}` : ''})
                  </option>
                ))}
            </select>
            {form['Source Type'] && (
              <p className="text-xs text-gray-500 mt-1">Type: {form['Source Type']}</p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
              <select
                value={form['Job Type']}
                onChange={e => setForm({ ...form, 'Job Type': e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {['All', 'Mitigation', 'Rebuild', 'Packout', 'Estimate'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commission Basis</label>
              <select
                value={form['Commission Basis']}
                onChange={e => {
                  const basis = e.target.value;
                  setForm({
                    ...form,
                    'Commission Basis': basis,
                    'Rate Type': basis === 'Flat Rate' ? 'Flat' : 'Percentage',
                  });
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {['Revenue Collected', 'Net Profit', 'Flat Rate'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {form['Commission Basis'] === 'Flat Rate' ? 'Flat Amount ($)' : 'Rate (%)'}
              </label>
              <input
                type="number"
                value={form['Rate Value']}
                onChange={e => setForm({ ...form, 'Rate Value': e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Threshold ($)</label>
              <input
                type="number"
                value={form['Min Threshold']}
                onChange={e => setForm({ ...form, 'Min Threshold': e.target.value })}
                placeholder="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Commission ($)</label>
              <input
                type="number"
                value={form['Max Commission']}
                onChange={e => setForm({ ...form, 'Max Commission': e.target.value })}
                placeholder="No cap"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <input
                type="number"
                value={form.Priority}
                onChange={e => setForm({ ...form, Priority: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.Notes}
              onChange={e => setForm({ ...form, Notes: e.target.value })}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ruleActive"
              checked={form.Active}
              onChange={e => setForm({ ...form, Active: e.target.checked })}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="ruleActive" className="text-sm text-gray-700">Active</label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form['Rule Name'] || !form['Specific Source']}>
              {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
