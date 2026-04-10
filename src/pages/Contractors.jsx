import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building, Edit2, Trash2, Link, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import { useContractors } from '../hooks/useAirtable';

const emptyForm = {
  Name: '',
  'Under CBRS': false,
  'Base ID': '',
  'API Key': '',
  'Claims Table': 'Claims',
  Active: true,
  Notes: '',
};

export default function Contractors({ onSelectContractor }) {
  const navigate = useNavigate();
  const { data: contractorsList, loading, error, refresh, create, update, remove } = useContractors();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (contractor) => {
    setEditing(contractor);
    setForm({
      Name: contractor.Name || '',
      'Under CBRS': contractor['Under CBRS'] || false,
      'Base ID': contractor['Base ID'] || '',
      'API Key': contractor['API Key'] || '',
      'Claims Table': contractor['Claims Table'] || 'Claims',
      Active: contractor.Active !== false,
      Notes: contractor.Notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fields = { ...form };
      if (fields['Under CBRS']) {
        delete fields['Base ID'];
        delete fields['API Key'];
      }

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

  const handleDelete = async (contractor) => {
    if (!confirm(`Delete contractor "${contractor.Name}"? This won't delete their jobs.`)) return;
    try {
      await remove(contractor.id);
    } catch (err) {
      alert('Error deleting: ' + err.message);
    }
  };

  const cbrsCount = contractorsList.filter(c => c['Under CBRS']).length;
  const standaloneCount = contractorsList.filter(c => !c['Under CBRS']).length;

  if (loading) return <LoadingState message="Loading contractors..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contractors</h1>
          <p className="text-gray-500 mt-1">Manage contractor bases — jobs flow from here into the commission tracker</p>
        </div>
        <Button icon={Plus} onClick={openAdd}>Add Contractor</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl border border-gray-200 bg-white">
          <div className="text-sm font-medium text-gray-500">Total Contractors</div>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{contractorsList.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-purple-200 bg-purple-50">
          <div className="text-sm font-medium text-purple-600">Under CBRS</div>
          <p className="text-2xl font-semibold text-purple-700 mt-1">{cbrsCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50">
          <div className="text-sm font-medium text-blue-600">Standalone Bases</div>
          <p className="text-2xl font-semibold text-blue-700 mt-1">{standaloneCount}</p>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {contractorsList.length === 0 ? (
            <EmptyState
              icon={Building}
              title="No contractors yet"
              description="Add your first contractor to start pulling in job data"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableHead>Contractor</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Base ID</TableHead>
                <TableHead>Claims Table</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead></TableHead>
              </TableHeader>
              <TableBody>
                {contractorsList.map((contractor) => (
                  <TableRow key={contractor.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Building className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <button
                            className="font-medium text-purple-600 hover:text-purple-800 hover:underline text-left"
                            onClick={() => {
                              onSelectContractor?.(contractor.Name);
                              navigate('/jobs');
                            }}
                          >
                            {contractor.Name}
                          </button>
                          {contractor.Notes && (
                            <div className="text-sm text-gray-500 truncate max-w-[200px]">{contractor.Notes}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contractor['Under CBRS'] ? (
                        <Badge variant="purple" icon={Link}>CBRS</Badge>
                      ) : (
                        <Badge variant="info" icon={Building}>Own Base</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {contractor['Under CBRS'] ? (
                        <span className="text-sm text-gray-400">Uses CBRS base</span>
                      ) : (
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                          {contractor['Base ID'] || '—'}
                        </code>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{contractor['Claims Table'] || 'Claims'}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={contractor.Active !== false ? 'success' : 'default'}>
                        {contractor.Active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                          onClick={() => openEdit(contractor)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                          onClick={() => handleDelete(contractor)}
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Contractor' : 'Add Contractor'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contractor Name *</label>
            <input
              type="text"
              value={form.Name}
              onChange={e => setForm({ ...form, Name: e.target.value })}
              placeholder="e.g., Acme Restoration"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* CBRS Toggle */}
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="underCbrs"
                checked={form['Under CBRS']}
                onChange={e => setForm({ ...form, 'Under CBRS': e.target.checked })}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-5 h-5"
              />
              <div>
                <label htmlFor="underCbrs" className="text-sm font-medium text-gray-900 cursor-pointer">
                  This contractor is under CBRS
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  If checked, jobs will be pulled from the shared CBRS base and filtered by this contractor's name
                </p>
              </div>
            </div>
          </div>

          {/* Base ID & API Key - only shown for standalone */}
          {!form['Under CBRS'] && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Airtable Base ID *</label>
                <input
                  type="text"
                  value={form['Base ID']}
                  onChange={e => setForm({ ...form, 'Base ID': e.target.value })}
                  placeholder="appXXXXXXXXXXXXXX"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">Find this in your Airtable base URL or API docs</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input
                  type="password"
                  value={form['API Key']}
                  onChange={e => setForm({ ...form, 'API Key': e.target.value })}
                  placeholder="pat..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">Personal access token for this contractor's Airtable base. Leave blank to use the default key.</p>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Claims Table Name</label>
            <input
              type="text"
              value={form['Claims Table']}
              onChange={e => setForm({ ...form, 'Claims Table': e.target.value })}
              placeholder="Claims"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">Default is "Claims" — change if the table has a different name</p>
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
              id="contractorActive"
              checked={form.Active}
              onChange={e => setForm({ ...form, Active: e.target.checked })}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="contractorActive" className="text-sm text-gray-700">Active</label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.Name || (!form['Under CBRS'] && !form['Base ID'])}
            >
              {saving ? 'Saving...' : editing ? 'Update' : 'Add Contractor'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
