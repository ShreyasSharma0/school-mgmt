import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStudents } from '../api/students';
import { getTasks } from '../api/tasks';
import { format, isAfter } from 'date-fns';
import styles from './DashboardPage.module.css';

const StatCard = ({ label, value, color, icon, delay }) => (
  <div className={styles.statCard} style={{ '--accent': color, animationDelay: delay }}>
    <div className={styles.statIcon} style={{ background: color }}>{icon}</div>
    <div>
      <div className={styles.statValue}>{value ?? '—'}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { admin } = useAuth();
  const [students, setStudents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [taskStats, setTaskStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, tRes] = await Promise.all([getStudents({ limit: 5 }), getTasks({ limit: 8 })]);
        setStudents(sRes.data.students);
        setTasks(tRes.data.tasks);
        setTaskStats(tRes.data.stats || {});
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalStudents = students.length;
  const pending = taskStats.pending || 0;
  const completed = taskStats.completed || 0;
  const overdue = taskStats.overdue || 0;

  const statusColor = {
    pending: 'var(--blue-dark)',
    'in-progress': 'var(--yellow-dark)',
    completed: 'var(--mint-dark)',
    overdue: 'var(--pink-dark)',
  };

  const statusLabel = {
    pending: 'Pending',
    'in-progress': 'In Progress',
    completed: 'Completed',
    overdue: 'Overdue',
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>
            Good {getGreeting()}, <span style={{ color: 'var(--pink-dark)' }}>{admin?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className={styles.date}>{format(new Date(), 'EEEE, MMMM d yyyy')}</p>
        </div>
        <div className={styles.headerActions}>
          <Link to="/students" className={styles.actionBtn} style={{ background: 'var(--pink-light)', color: 'var(--pink-dark)' }}>
            + Add Student
          </Link>
          <Link to="/tasks" className={styles.actionBtn} style={{ background: 'var(--blue-light)', color: 'var(--blue-dark)' }}>
            + Assign Task
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className={styles.stats}>
        <StatCard label="Total Students" value={loading ? '…' : totalStudents} color="var(--pink)" delay="0ms"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
        <StatCard label="Pending Tasks" value={loading ? '…' : pending} color="var(--blue-dark)" delay="80ms"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>}
        />
        <StatCard label="Completed" value={loading ? '…' : completed} color="var(--mint-dark)" delay="160ms"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
        />
        <StatCard label="Overdue" value={loading ? '…' : overdue} color="var(--pink-dark)" delay="240ms"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
        />
      </div>

      {/* Two column */}
      <div className={styles.grid}>
        {/* Recent students */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Recent Students</h2>
            <Link to="/students" className={styles.viewAll}>View all →</Link>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />)}
            </div>
          ) : students.length === 0 ? (
            <EmptyState text="No students yet" link="/students" linkText="Add first student" />
          ) : (
            <div className={styles.list}>
              {students.map((s, i) => (
                <div key={s._id} className={styles.studentRow} style={{ animationDelay: `${i * 50}ms` }}>
                  <div className={styles.studentAvatar} style={{ background: avatarColor(i) }}>
                    {s.name[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className={styles.studentName}>{s.name}</div>
                    <div className={styles.studentMeta}>Class {s.class}{s.section} · Roll {s.rollNumber}</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {s.taskStats?.total || 0} tasks
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent tasks */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Recent Tasks</h2>
            <Link to="/tasks" className={styles.viewAll}>View all →</Link>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />)}
            </div>
          ) : tasks.length === 0 ? (
            <EmptyState text="No tasks yet" link="/tasks" linkText="Assign first task" />
          ) : (
            <div className={styles.list}>
              {tasks.map((t, i) => (
                <div key={t._id} className={styles.taskRow} style={{ animationDelay: `${i * 50}ms` }}>
                  <div className={styles.taskDot} style={{ background: statusColor[t.status] }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className={styles.taskTitle}>{t.title}</div>
                    <div className={styles.taskMeta}>{t.student?.name} · {t.subject}</div>
                  </div>
                  <span className={styles.statusBadge} style={{
                    background: statusColor[t.status] + '22',
                    color: statusColor[t.status],
                  }}>
                    {statusLabel[t.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const EmptyState = ({ text, link, linkText }) => (
  <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
    <div style={{ fontSize: 36, marginBottom: 8 }}>✦</div>
    <div style={{ fontSize: 14, marginBottom: 12 }}>{text}</div>
    <Link to={link} style={{
      fontSize: 13, color: 'var(--pink-dark)', fontWeight: 600, textDecoration: 'none',
      background: 'var(--pink-light)', padding: '6px 14px', borderRadius: 20,
    }}>{linkText}</Link>
  </div>
);

const avatarColors = [
  'linear-gradient(135deg,var(--pink),var(--pink-dark))',
  'linear-gradient(135deg,var(--blue),var(--blue-dark))',
  'linear-gradient(135deg,var(--mint),var(--mint-dark))',
  'linear-gradient(135deg,var(--yellow-dark),#a8b800)',
];
const avatarColor = (i) => avatarColors[i % avatarColors.length];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};
