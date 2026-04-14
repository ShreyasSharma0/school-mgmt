import { useEffect, useState, useCallback } from 'react';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../api/students';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import styles from './StudentsPage.module.css';

const CLASSES = ['1','2','3','4','5','6','7','8','9','10','11','12'];
const SECTIONS = ['A','B','C','D','E'];
const GENDERS = ['Male','Female','Other'];

const emptyForm = { name: '', rollNumber: '', class: '', section: 'A', email: '', phone: '', gender: '', address: '' };

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | 'edit' | 'delete'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getStudents({ search, class: filterClass, limit: 100 });
      setStudents(data.students);
      setTotal(data.total);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [search, filterClass]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const openAdd = () => { setForm(emptyForm); setSelected(null); setModal('add'); };
  const openEdit = (s) => { setForm({ name: s.name, rollNumber: s.rollNumber, class: s.class, section: s.section || 'A', email: s.email || '', phone: s.phone || '', gender: s.gender || '', address: s.address || '' }); setSelected(s); setModal('edit'); };
  const openDelete = (s) => { setSelected(s); setModal('delete'); };

  const handleSave = async () => {
    if (!form.name || !form.rollNumber || !form.class) {
      toast.error('Name, roll number, and class are required');
      return;
    }
    setSaving(true);
    try {
      if (modal === 'add') {
        await createStudent(form);
        toast.success('Student added!');
      } else {
        await updateStudent(selected._id, form);
        toast.success('Student updated!');
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteStudent(selected._id);
      toast.success('Student removed');
      setModal(null);
      load();
    } catch {
      toast.error('Failed to delete student');
    } finally {
      setSaving(false);
    }
  };

  const avatarColors = ['var(--pink)', 'var(--blue-dark)', 'var(--mint-dark)', '#c4a0e8'];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Students</h1>
          <p className={styles.subtitle}>{total} enrolled student{total !== 1 ? 's' : ''}</p>
        </div>
        <button className={styles.addBtn} onClick={openAdd}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Student
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            className={styles.searchInput}
            placeholder="Search by name or roll number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className={styles.select} value={filterClass} onChange={e => setFilterClass(e.target.value)}>
          <option value="">All Classes</option>
          {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        {loading ? (
          <div className={styles.loading}>
            {[1,2,3,4,5].map(i => (
              <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10, marginBottom: 8 }} />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🎓</div>
            <p>{search ? 'No students match your search' : 'No students yet. Add your first student!'}</p>
            {!search && <button className={styles.addBtn} onClick={openAdd} style={{ marginTop: 16 }}>+ Add Student</button>}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll No</th>
                <th>Class</th>
                <th>Contact</th>
                <th>Tasks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s._id} style={{ animationDelay: `${i * 30}ms` }}>
                  <td>
                    <div className={styles.studentCell}>
                      <div className={styles.avatar} style={{ background: avatarColors[i % avatarColors.length] }}>
                        {s.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div className={styles.name}>{s.name}</div>
                        {s.gender && <div className={styles.meta}>{s.gender}</div>}
                      </div>
                    </div>
                  </td>
                  <td><span className={styles.roll}>{s.rollNumber}</span></td>
                  <td><span className={styles.classBadge}>Class {s.class}{s.section}</span></td>
                  <td className={styles.meta}>{s.email || s.phone || '—'}</td>
                  <td>
                    <div className={styles.taskCount}>
                      <span style={{ color: 'var(--mint-dark)', fontWeight: 700 }}>{s.taskStats?.completed || 0}</span>
                      <span style={{ color: 'var(--text-muted)' }}>/{s.taskStats?.total || 0}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.editBtn} onClick={() => openEdit(s)} title="Edit">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className={styles.deleteBtn} onClick={() => openDelete(s)} title="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modal === 'add' || modal === 'edit'} onClose={() => setModal(null)}
        title={modal === 'add' ? 'Add New Student' : 'Edit Student'}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup} style={{ gridColumn: '1/-1' }}>
            <label>Full Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Rahul Sharma" />
          </div>
          <div className={styles.formGroup}>
            <label>Roll Number *</label>
            <input value={form.rollNumber} onChange={e => setForm(f => ({ ...f, rollNumber: e.target.value }))} placeholder="e.g. 10A01" />
          </div>
          <div className={styles.formGroup}>
            <label>Gender</label>
            <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
              <option value="">Select</option>
              {GENDERS.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Class *</label>
            <select value={form.class} onChange={e => setForm(f => ({ ...f, class: e.target.value }))}>
              <option value="">Select Class</option>
              {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Section</label>
            <select value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))}>
              {SECTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="student@email.com" />
          </div>
          <div className={styles.formGroup}>
            <label>Phone</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
          </div>
          <div className={styles.formGroup} style={{ gridColumn: '1/-1' }}>
            <label>Address</label>
            <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Home address…" rows={2} />
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={() => setModal(null)}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : modal === 'add' ? 'Add Student' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={modal === 'delete'} onClose={() => setModal(null)} title="Delete Student">
        <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
          Are you sure you want to remove <strong>{selected?.name}</strong>? This action cannot be undone.
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
