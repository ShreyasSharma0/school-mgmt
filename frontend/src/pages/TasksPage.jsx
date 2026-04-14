import { useEffect, useState, useCallback } from 'react';
import { getTasks, createTask, updateTask, completeTask, deleteTask } from '../api/tasks';
import { getStudents } from '../api/students';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { format, parseISO } from 'date-fns';
import styles from './TasksPage.module.css';

const SUBJECTS = ['Mathematics','Science','English','Hindi','Social Studies','Computer Science','Physics','Chemistry','Biology','History','Geography','Economics','Other'];
const PRIORITIES = ['low','medium','high'];
const STATUSES = ['pending','in-progress','completed','overdue'];

const emptyForm = { title: '', description: '', student: '', subject: '', dueDate: '', priority: 'medium' };

const statusConfig = {
  pending:     { label: 'Pending',     bg: 'var(--blue-light)',   color: 'var(--blue-dark)' },
  'in-progress':{ label: 'In Progress', bg: 'var(--yellow-light)', color: '#8a7000' },
  completed:   { label: 'Completed',   bg: 'var(--mint-light)',   color: 'var(--mint-dark)' },
  overdue:     { label: 'Overdue',     bg: 'var(--pink-light)',   color: 'var(--pink-dark)' },
};

const priorityConfig = {
  low:    { label: 'Low',    color: 'var(--mint-dark)' },
  medium: { label: 'Medium', color: '#8a7000' },
  high:   { label: 'High',   color: 'var(--pink-dark)' },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getTasks({ status: filterStatus, limit: 200 });
      setTasks(data.tasks);
      setStats(data.stats || {});
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  useEffect(() => {
    getStudents({ limit: 200 }).then(({ data }) => setStudents(data.students)).catch(() => {});
  }, []);

  const openAdd = () => { setForm(emptyForm); setSelected(null); setModal('add'); };
  const openEdit = (t) => {
    setForm({
      title: t.title, description: t.description || '',
      student: t.student?._id || '', subject: t.subject,
      dueDate: t.dueDate ? t.dueDate.substring(0,10) : '',
      priority: t.priority, status: t.status,
    });
    setSelected(t); setModal('edit');
  };
  const openDelete = (t) => { setSelected(t); setModal('delete'); };

  const handleSave = async () => {
    if (!form.title || !form.student || !form.subject || !form.dueDate) {
      toast.error('Title, student, subject, and due date are required'); return;
    }
    setSaving(true);
    try {
      if (modal === 'add') {
        await createTask(form);
        toast.success('Task assigned!');
      } else {
        await updateTask(selected._id, form);
        toast.success('Task updated!');
      }
      setModal(null); loadTasks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    } finally { setSaving(false); }
  };

  const handleComplete = async (t) => {
    try {
      await completeTask(t._id);
      toast.success('Task marked as completed!');
      loadTasks();
    } catch { toast.error('Failed to update task'); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteTask(selected._id);
      toast.success('Task deleted');
      setModal(null); loadTasks();
    } catch { toast.error('Failed to delete task'); }
    finally { setSaving(false); }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Tasks & Assignments</h1>
          <p className={styles.subtitle}>Manage and track student assignments</p>
        </div>
        <button className={styles.addBtn} onClick={openAdd}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Assign Task
        </button>
      </div>

      {/* Stats pills */}
      <div className={styles.statsPills}>
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <button key={key}
            className={`${styles.pill} ${filterStatus === key ? styles.pillActive : ''}`}
            style={filterStatus === key ? { background: cfg.bg, color: cfg.color, borderColor: cfg.color } : {}}
            onClick={() => setFilterStatus(filterStatus === key ? '' : key)}
          >
            <span className={styles.pillDot} style={{ background: cfg.color }} />
            {cfg.label}
            <span className={styles.pillCount}>{stats[key] || 0}</span>
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 14 }} />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className={styles.empty}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <p>No tasks found{filterStatus ? ' for this filter' : '. Assign the first task!'}</p>
          {!filterStatus && <button className={styles.addBtn} onClick={openAdd} style={{ marginTop: 16 }}>+ Assign Task</button>}
        </div>
      ) : (
        <div className={styles.taskGrid}>
          {tasks.map((t, i) => {
            const sc = statusConfig[t.status] || statusConfig.pending;
            const pc = priorityConfig[t.priority] || priorityConfig.medium;
            const isOverdue = t.status === 'overdue';
            const isDone = t.status === 'completed';
            return (
              <div key={t._id} className={styles.taskCard} style={{ animationDelay: `${i * 30}ms`, opacity: isDone ? 0.8 : 1 }}>
                <div className={styles.taskCardTop}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <button
                      className={styles.checkBtn}
                      style={{
                        borderColor: isDone ? 'var(--mint-dark)' : 'var(--border)',
                        background: isDone ? 'var(--mint-dark)' : 'transparent',
                      }}
                      onClick={() => !isDone && handleComplete(t)}
                      title={isDone ? 'Completed' : 'Mark as complete'}
                      disabled={isDone}
                    >
                      {isDone && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>
                      )}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className={styles.taskTitle} style={{ textDecoration: isDone ? 'line-through' : 'none' }}>
                        {t.title}
                      </div>
                      <div className={styles.taskStudent}>
                        {t.student?.name} · Class {t.student?.class}{t.student?.section}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    <button className={styles.iconBtn} onClick={() => openEdit(t)} title="Edit">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => openDelete(t)} title="Delete">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                    </button>
                  </div>
                </div>

                {t.description && (
                  <p className={styles.taskDesc}>{t.description}</p>
                )}

                <div className={styles.taskMeta}>
                  <span className={styles.subject}>{t.subject}</span>
                  <span className={styles.badge} style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                  <span className={styles.badge} style={{ background: pc.color + '18', color: pc.color }}>
                    ↑ {pc.label}
                  </span>
                  <span className={`${styles.dueDate} ${isOverdue ? styles.dueDateOverdue : ''}`}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    {t.dueDate ? format(parseISO(t.dueDate), 'MMM d, yyyy') : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modal === 'add' || modal === 'edit'} onClose={() => setModal(null)}
        title={modal === 'add' ? 'Assign New Task' : 'Edit Task'}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup} style={{ gridColumn: '1/-1' }}>
            <label>Task Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Chapter 5 Exercise" />
          </div>
          <div className={styles.formGroup}>
            <label>Student *</label>
            <select value={form.student} onChange={e => setForm(f => ({ ...f, student: e.target.value }))}>
              <option value="">Select Student</option>
              {students.map(s => <option key={s._id} value={s._id}>{s.name} (Class {s.class}{s.section})</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Subject *</label>
            <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}>
              <option value="">Select Subject</option>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Due Date *</label>
            <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
          <div className={styles.formGroup}>
            <label>Priority</label>
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          {modal === 'edit' && (
            <div className={styles.formGroup} style={{ gridColumn: '1/-1' }}>
              <label>Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUSES.map(s => <option key={s} value={s}>{statusConfig[s]?.label || s}</option>)}
              </select>
            </div>
          )}
          <div className={styles.formGroup} style={{ gridColumn: '1/-1' }}>
            <label>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Additional details or instructions…" rows={3} />
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={() => setModal(null)}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : modal === 'add' ? 'Assign Task' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={modal === 'delete'} onClose={() => setModal(null)} title="Delete Task">
        <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
          Are you sure you want to delete <strong>"{selected?.title}"</strong>?
        </p>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={() => setModal(null)}>Cancel</button>
          <button className={styles.deleteConfirmBtn} onClick={handleDelete} disabled={saving}>
            {saving ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
