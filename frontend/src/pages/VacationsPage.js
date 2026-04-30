import { useEffect, useState, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { vacationApi, employeeApi } from '../services/api';
import {
  Button, Card, Modal, FormGroup, Input, Select, Alert,
  StatusBadge, Table, Spinner, EmptyState, PageHeader
} from '../components/UI';
import styles from '../styles/ui.module.css';
import pageStyles from './VacationsPage.module.css';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function VacationForm({ initial, employees, currentUser, onSubmit, onClose, loading, error }) {
  const [form, setForm] = useState({
    employeeId: initial?.employee?.id || (currentUser?.role === 'COLLABORATOR' ? currentUser.id : ''),
    startDate: initial?.startDate || '',
    endDate: initial?.endDate || '',
  });

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, employeeId: Number(form.employeeId) });
  };

  const showEmployeeSelect = currentUser?.role !== 'COLLABORATOR';

  return (
    <form onSubmit={handleSubmit}>
      {error && <Alert type="error">{error}</Alert>}
      {showEmployeeSelect && (
        <FormGroup label="Employee">
          <Select value={form.employeeId} onChange={set('employeeId')} required>
            <option value="">— Select employee —</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
            ))}
          </Select>
        </FormGroup>
      )}
      <div className={styles.formGrid}>
        <FormGroup label="Start Date">
          <Input type="date" value={form.startDate} onChange={set('startDate')} required />
        </FormGroup>
        <FormGroup label="End Date">
          <Input type="date" value={form.endDate} onChange={set('endDate')} required />
        </FormGroup>
      </div>
      <div className={styles.modalFooter} style={{ padding: 0, paddingTop: 8 }}>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : initial ? 'Save Changes' : 'Submit Request'}
        </Button>
      </div>
    </form>
  );
}

function RejectForm({ onSubmit, onClose, loading, error }) {
  const [reason, setReason] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(reason); }}>
      {error && <Alert type="error">{error}</Alert>}
      <FormGroup label="Rejection Reason (optional)">
        <textarea
          className={styles.formInput}
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="Provide a reason for rejection..."
          style={{ resize: 'vertical' }}
        />
      </FormGroup>
      <div className={styles.modalFooter} style={{ padding: 0, paddingTop: 8 }}>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="danger" disabled={loading}>
          {loading ? 'Rejecting…' : 'Reject Request'}
        </Button>
      </div>
    </form>
  );
}

export default function VacationsPage() {
  const { currentUserId, currentUser } = useUser();
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [alert, setAlert] = useState(null);

  const isAdmin = currentUser?.role === 'ADMIN';
  const isManager = currentUser?.role === 'MANAGER';
  const isCollaborator = currentUser?.role === 'COLLABORATOR';
  const canApproveReject = isAdmin || isManager;

  const loadData = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const [reqs, emps] = await Promise.all([
        vacationApi.getAll(currentUserId),
        isCollaborator ? Promise.resolve([]) : employeeApi.getAll(currentUserId),
      ]);
      setRequests(reqs || []);
      setEmployees(emps || []);
    } catch (e) {
      setAlert({ type: 'error', msg: e.message });
    } finally {
      setLoading(false);
    }
  }, [currentUserId, isCollaborator]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (data) => {
    setFormLoading(true);
    setFormError('');
    try {
      await vacationApi.create(data, currentUserId);
      setModal(null);
      setAlert({ type: 'success', msg: 'Vacation request submitted!' });
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
      await vacationApi.update(modal.edit.id, { startDate: data.startDate, endDate: data.endDate }, currentUserId);
      setModal(null);
      setAlert({ type: 'success', msg: 'Request updated.' });
      loadData();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = async () => {
    setFormLoading(true);
    try {
      await vacationApi.cancel(modal.cancel.id, currentUserId);
      setModal(null);
      setAlert({ type: 'success', msg: 'Request cancelled.' });
      loadData();
    } catch (e) {
      setAlert({ type: 'error', msg: e.message });
    } finally {
      setFormLoading(false);
    }
  };

  const handleApprove = async (req) => {
    try {
      await vacationApi.approve(req.id, currentUserId);
      setAlert({ type: 'success', msg: `Request approved for ${req.employee.name}.` });
      loadData();
    } catch (e) {
      setAlert({ type: 'error', msg: e.message });
    }
  };

  const handleReject = async (reason) => {
    setFormLoading(true);
    setFormError('');
    try {
      await vacationApi.reject(modal.reject.id, { rejectionReason: reason }, currentUserId);
      setModal(null);
      setAlert({ type: 'success', msg: 'Request rejected.' });
      loadData();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    ...(!isCollaborator ? ['Employee'] : []),
    'Start Date', 'End Date', 'Duration', 'Status', 'Actions'
  ];

  const getDuration = (start, end) => {
    const s = new Date(start), e = new Date(end);
    const days = Math.round((e - s) / 86400000) + 1;
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  return (
    <div>
      <PageHeader
        title={isCollaborator ? 'My Vacations' : isManager ? 'Team Requests' : 'Vacation Requests'}
        subtitle={`${requests.length} request${requests.length !== 1 ? 's' : ''}`}
        action={
          <Button onClick={() => { setModal('create'); setFormError(''); }}>
            + New Request
          </Button>
        }
      />

      {alert && <Alert type={alert.type}>{alert.msg}</Alert>}

      <Card>
        {loading ? <Spinner /> : (
          <Table
            columns={columns}
            data={requests}
            emptyState={<EmptyState icon="🏖" title="No vacation requests" description="Submit a request to get started." />}
            renderRow={(req) => (
              <tr key={req.id}>
                {!isCollaborator && (
                  <td>
                    <strong>{req.employee?.name}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {req.employee?.email}
                    </div>
                  </td>
                )}
                <td>{formatDate(req.startDate)}</td>
                <td>{formatDate(req.endDate)}</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>
                  {getDuration(req.startDate, req.endDate)}
                </td>
                <td>
                  <StatusBadge status={req.status} />
                  {req.rejectionReason && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {req.rejectionReason}
                    </div>
                  )}
                </td>
                <td>
                  <div className={styles.tableActions}>
                    {req.status === 'PENDING' && (isCollaborator
                      ? req.employee?.id === currentUser?.id
                      : true) && (
                      <Button size="sm" variant="secondary" onClick={() => { setModal({ edit: req }); setFormError(''); }}>
                        Edit
                      </Button>
                    )}
                    {canApproveReject && req.status === 'PENDING' && (
                      <>
                        <Button size="sm" variant="success" onClick={() => handleApprove(req)}>
                          Approve
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => { setModal({ reject: req }); setFormError(''); }}>
                          Reject
                        </Button>
                      </>
                    )}
                    {req.status !== 'CANCELLED' && req.status !== 'REJECTED' && (
                      (!isCollaborator || req.employee?.id === currentUser?.id) && (
                        <Button size="sm" variant="secondary" onClick={() => setModal({ cancel: req })}>
                          Cancel
                        </Button>
                      )
                    )}
                  </div>
                </td>
              </tr>
            )}
          />
        )}
      </Card>

      {/* Create */}
      {modal === 'create' && (
        <Modal title="New Vacation Request" onClose={() => setModal(null)}>
          <VacationForm
            employees={employees}
            currentUser={currentUser}
            onSubmit={handleCreate}
            onClose={() => setModal(null)}
            loading={formLoading}
            error={formError}
          />
        </Modal>
      )}

      {/* Edit */}
      {modal?.edit && (
        <Modal title="Edit Request" onClose={() => setModal(null)}>
          <VacationForm
            initial={modal.edit}
            employees={employees}
            currentUser={currentUser}
            onSubmit={handleEdit}
            onClose={() => setModal(null)}
            loading={formLoading}
            error={formError}
          />
        </Modal>
      )}

      {/* Reject */}
      {modal?.reject && (
        <Modal title="Reject Request" onClose={() => setModal(null)}>
          <p style={{ marginBottom: 16, color: 'var(--color-text-secondary)' }}>
            Rejecting vacation request for <strong>{modal.reject.employee?.name}</strong>
            {' '}({formatDate(modal.reject.startDate)} – {formatDate(modal.reject.endDate)})
          </p>
          <RejectForm
            onSubmit={handleReject}
            onClose={() => setModal(null)}
            loading={formLoading}
            error={formError}
          />
        </Modal>
      )}

      {/* Cancel */}
      {modal?.cancel && (
        <Modal
          title="Cancel Request"
          onClose={() => setModal(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setModal(null)}>Back</Button>
              <Button variant="danger" onClick={handleCancel} disabled={formLoading}>
                {formLoading ? 'Cancelling…' : 'Cancel Request'}
              </Button>
            </>
          }
        >
          <p>
            Cancel vacation request for <strong>
              {formatDate(modal.cancel.startDate)} – {formatDate(modal.cancel.endDate)}
            </strong>?
          </p>
        </Modal>
      )}
    </div>
  );
}
