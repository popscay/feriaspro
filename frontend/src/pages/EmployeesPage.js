import { useEffect, useState, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { employeeApi } from '../services/api';
import {
  Button, Card, Modal, FormGroup, Input, Select,
  Table, Alert, Spinner, EmptyState, PageHeader, StatusBadge
} from '../components/UI';
import styles from '../styles/ui.module.css';

const ROLES = ['ADMIN', 'MANAGER', 'COLLABORATOR'];

function EmployeeForm({ initial, managers, onSubmit, onClose, loading, error }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    email: initial?.email || '',
    role: initial?.role || 'COLLABORATOR',
    managerId: initial?.managerId || '',
  });

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, managerId: form.managerId || null });
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <Alert type="error">{error}</Alert>}
      <FormGroup label="Full Name">
        <Input value={form.name} onChange={set('name')} placeholder="Jane Smith" required />
      </FormGroup>
      <FormGroup label="Email">
        <Input type="email" value={form.email} onChange={set('email')} placeholder="jane@company.com" required />
      </FormGroup>
      <div className={styles.formGrid}>
        <FormGroup label="Role">
          <Select value={form.role} onChange={set('role')}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Manager">
          <Select value={form.managerId} onChange={set('managerId')}>
            <option value="">— No manager —</option>
            {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select>
        </FormGroup>
      </div>
      <div className={styles.modalFooter} style={{ padding: 0, paddingTop: 8 }}>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : initial ? 'Save Changes' : 'Create Employee'}
        </Button>
      </div>
    </form>
  );
}

export default function EmployeesPage() {
  const { currentUserId, currentUser } = useUser();
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | { edit: emp } | { delete: emp }
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [alert, setAlert] = useState(null);

  const isAdmin = currentUser?.role === 'ADMIN';

  const loadData = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const [emps, mgrs] = await Promise.all([
        employeeApi.getAll(currentUserId),
        employeeApi.getManagers(currentUserId),
      ]);
      setEmployees(emps || []);
      setManagers(mgrs || []);
    } catch (e) {
      setAlert({ type: 'error', msg: e.message });
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (data) => {
    setFormLoading(true);
    setFormError('');
    try {
      await employeeApi.create(data, currentUserId);
      setModal(null);
      setAlert({ type: 'success', msg: 'Employee created successfully.' });
      loadData();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (data) => {
    setFormLoading(true);
    setFormError('');
    try {
      await employeeApi.update(modal.edit.id, data, currentUserId);
      setModal(null);
      setAlert({ type: 'success', msg: 'Employee updated.' });
      loadData();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await employeeApi.delete(modal.delete.id, currentUserId);
      setModal(null);
      setAlert({ type: 'success', msg: 'Employee deleted.' });
      loadData();
    } catch (e) {
      setAlert({ type: 'error', msg: e.message });
    } finally {
      setFormLoading(false);
    }
  };

  const columns = ['Name', 'Email', 'Role', 'Manager', ...(isAdmin ? ['Actions'] : [])];

  const roleBadge = (role) => {
    const colors = { ADMIN: '#3d3aff', MANAGER: '#1a7a4a', COLLABORATOR: '#8a5a00' };
    const bgs = { ADMIN: '#eeeeff', MANAGER: '#e8f5ef', COLLABORATOR: '#fdf3e0' };
    return (
      <span style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 20,
        fontSize: '0.75rem',
        fontWeight: 600,
        background: bgs[role] || '#eee',
        color: colors[role] || '#333',
      }}>
        {role}
      </span>
    );
  };

  return (
    <div>
      <PageHeader
        title={currentUser?.role === 'MANAGER' ? 'My Team' : 'Employees'}
        subtitle={`${employees.length} employee${employees.length !== 1 ? 's' : ''}`}
        action={isAdmin && (
          <Button onClick={() => { setModal('create'); setFormError(''); }}>
            + New Employee
          </Button>
        )}
      />

      {alert && (
        <Alert type={alert.type} >{alert.msg}</Alert>
      )}

      <Card>
        {loading ? <Spinner /> : (
          <Table
            columns={columns}
            data={employees}
            emptyState={<EmptyState icon="👥" title="No employees found" />}
            renderRow={(emp) => (
              <tr key={emp.id}>
                <td><strong>{emp.name}</strong></td>
                <td style={{ color: 'var(--color-text-secondary)' }}>{emp.email}</td>
                <td>{roleBadge(emp.role)}</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>{emp.managerName || '—'}</td>
                {isAdmin && (
                  <td>
                    <div className={styles.tableActions}>
                      <Button size="sm" variant="secondary" onClick={() => { setModal({ edit: emp }); setFormError(''); }}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setModal({ delete: emp })}>
                        Delete
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            )}
          />
        )}
      </Card>

      {/* Create modal */}
      {modal === 'create' && (
        <Modal title="New Employee" onClose={() => setModal(null)}>
          <EmployeeForm
            managers={managers}
            onSubmit={handleCreate}
            onClose={() => setModal(null)}
            loading={formLoading}
            error={formError}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {modal?.edit && (
        <Modal title="Edit Employee" onClose={() => setModal(null)}>
          <EmployeeForm
            initial={modal.edit}
            managers={managers}
            onSubmit={handleEdit}
            onClose={() => setModal(null)}
            loading={formLoading}
            error={formError}
          />
        </Modal>
      )}

      {/* Delete modal */}
      {modal?.delete && (
        <Modal
          title="Delete Employee"
          onClose={() => setModal(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} disabled={formLoading}>
                {formLoading ? 'Deleting…' : 'Delete'}
              </Button>
            </>
          }
        >
          <p>Are you sure you want to delete <strong>{modal.delete.name}</strong>? This action cannot be undone.</p>
        </Modal>
      )}
    </div>
  );
}
