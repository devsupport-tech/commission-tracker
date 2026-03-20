import { useState } from 'react';
import { Plus, Search, MoreVertical, User, Building, Phone, Mail, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import { useReferralSources } from '../hooks/useAirtable';

const typeColors = {
  Adjuster: 'info',
  Contractor: 'purple',
  Realtor: 'success',
  'Property Manager': 'warning',
  'Past Client': 'default',
  Other: 'default',
};

const emptyForm = {
  Name: '',
  Company: '',
  Type: 'Adjuster',
  Email: '',
  Phone: '',
  'Default Comm Type': '% of Revenue',
  'Default Comm Rate': '',
  'Default Flat Amount': '',
  Notes: '',
  Active: true,
};

export default function ReferralSources() {
  const { data: sources, loading, error, refresh, create, update, remove } = useReferralSources();
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);

  const filteredSources = sources.filter(
    source =>
      (source.Name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (source.Company || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (source) => {
    setEditing(source);
    setForm({
      Name: source.Name || '',
      Company: source.Company || '',
      Type: source.Type || 'Adjuster',
      Email: source.Email || '',
      Phone: source.Phone || '',
      'Default Comm Type': source['Default Comm Type'] || '% of Revenue',
      'Default Comm Rate': source['Default Comm Rate'] || '',
      'Default Flat Amount': source['Default Flat Amount'] || '',
      Notes: source.Notes || '',
      Active: source.Active !== false,
    });
    setModalOpen(true);
    setMenuOpen(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fields = { ...form };
      if (fields['Default Comm Rate']) fields['Default Comm Rate'] = Number(fields['Default Comm Rate']);
      if (fields['Default Flat Amount']) fields['Default Flat Amount'] = Number(fields['Default Flat Amount']);

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

  const handleDelete = async (source) => {
    if (!confirm(`Delete "${source.Name}"?`)) return;
    try {
      await remove(source.id);
    } catch (err) {
      alert('Error deleting: ' + err.message);
    }
    setMenuOpen(null);
  };

  if (loading) return <LoadingState message="Loading referral sources..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referral Sources</h1>
          <p className="text-gray-500 mt-1">Manage who sends you work and their commission rates</p>
        </div>
        <Button icon={Plus} onClick={openAdd}>Add Source</Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredSources.length === 0 ? (
            <EmptyState title="No referral sources" description="Add your first referral source to get started" />
          ) : (
            <Table>
              <TableHeader>
                <TableHead>Source</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Default Commission</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead></TableHead>
              </TableHeader>
              <TableBody>
                {filteredSources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          {source.Type === 'Contractor' ? (
                            <Building className="w-5 h-5 text-purple-600" />
                          ) : (
                            <User className="w-5 h-5 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{source.Name}</div>
                          <div className="text-sm text-gray-500">{source.Company}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeColors[source.Type] || 'default'}>{source.Type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {source.Email && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Mail className="w-3 h-3" />{source.Email}
                          </div>
                        )}
                        {source.Phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Phone className="w-3 h-3" />{source.Phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        {source['Default Comm Type'] === 'Flat Rate'
                          ? `$${source['Default Flat Amount'] || source['Default Comm Rate'] || 0}`
                          : `${source['Default Comm Rate'] || 0}%`}
                      </div>
                      <div className="text-sm text-gray-500">{source['Default Comm Type']}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={source.Active !== false ? 'success' : 'default'}>
                        {source.Active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="relative">
                        <button
                          className="p-1 hover:bg-gray-100 rounded"
                          onClick={() => setMenuOpen(menuOpen === source.id ? null : source.id)}
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                        {menuOpen === source.id && (
                          <div className="absolute right-0 top-8 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-32">
                            <button
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => openEdit(source)}
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(source)}
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Referral Source' : 'Add Referral Source'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={form.Name}
                onChange={e => setForm({ ...form, Name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input
                type="text"
                value={form.Company}
                onChange={e => setForm({ ...form, Company: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={form.Type}
              onChange={e => setForm({ ...form, Type: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {['Adjuster', 'Contractor', 'Realtor', 'Property Manager', 'Past Client', 'Other'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.Email}
                onChange={e => setForm({ ...form, Email: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={form.Phone}
                onChange={e => setForm({ ...form, Phone: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Commission Type</label>
              <select
                value={form['Default Comm Type']}
                onChange={e => setForm({ ...form, 'Default Comm Type': e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {['% of Revenue', '% of Profit', 'Flat Rate'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {form['Default Comm Type'] === 'Flat Rate' ? 'Flat Amount ($)' : 'Rate (%)'}
              </label>
              <input
                type="number"
                value={form['Default Comm Type'] === 'Flat Rate' ? form['Default Flat Amount'] : form['Default Comm Rate']}
                onChange={e => {
                  if (form['Default Comm Type'] === 'Flat Rate') {
                    setForm({ ...form, 'Default Flat Amount': e.target.value });
                  } else {
                    setForm({ ...form, 'Default Comm Rate': e.target.value });
                  }
                }}
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
              id="active"
              checked={form.Active}
              onChange={e => setForm({ ...form, Active: e.target.checked })}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="active" className="text-sm text-gray-700">Active</label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.Name}>
              {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
