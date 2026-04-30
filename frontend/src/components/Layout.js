import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { employeeApi } from '../services/api';
import styles from './Layout.module.css';

const NAV_ITEMS = {
ADMIN: [
  { path: '/employees', label: 'Employees', icon: '[+]' },
  { path: '/vacations', label: 'Vacation Requests', icon: '[~]' },
],
MANAGER: [
  { path: '/employees', label: 'My Team', icon: '[+]' },
  { path: '/vacations', label: 'Team Requests', icon: '[~]' },
],
COLLABORATOR: [
  { path: '/vacations', label: 'My Vacations', icon: '[~]' },
],
};

function RoleBadge({ role }) {
  const map = { ADMIN: 'admin', MANAGER: 'manager', COLLABORATOR: 'collaborator' };
  return (
    <span className={`${styles.roleBadge} ${styles[map[role] || '']}`}>
      {role}
    </span>
  );
}

export default function Layout() {
  const { currentUserId, setCurrentUserId, currentUser, setCurrentUser } = useUser();
  const [allEmployees, setAllEmployees] = useState([]);
  const location = useLocation();

  // Load all employees using admin user (id=1) to populate dropdown
  useEffect(() => {
    // We use a fixed admin seed ID for listing all users in the dropdown
    fetch('http://localhost:8080/api/employees', {
      headers: { 'Content-Type': 'application/json', 'X-User-Id': '1' }
    })
      .then(r => r.json())
      .then(json => setAllEmployees(json.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentUserId) {
      setCurrentUser(null);
      return;
    }
    const found = allEmployees.find(e => e.id === Number(currentUserId));
    setCurrentUser(found || null);
  }, [currentUserId, allEmployees, setCurrentUser]);

  const navItems = currentUser ? NAV_ITEMS[currentUser.role] || [] : [];

  const pageTitles = {
    '/employees': currentUser?.role === 'MANAGER' ? 'My Team' : 'Employees',
    '/vacations': currentUser?.role === 'COLLABORATOR' ? 'My Vacations'
      : currentUser?.role === 'MANAGER' ? 'Team Requests' : 'Vacation Requests',
  };

  const currentPage = Object.entries(pageTitles).find(([path]) =>
    location.pathname.startsWith(path)
  );

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoText}>VacaFlow</div>
          <div className={styles.logoSub}>Vacation Management</div>
        </div>

        <nav className={styles.nav}>
          {currentUser && (
            <>
              <div className={styles.navSection}>Navigation</div>
              {navItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.active : ''}`
                  }
                >
                  <span>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className={styles.userSelector}>
          <div className={styles.userLabel}>Logged in as</div>
          <select
            className={styles.userSelect}
            value={currentUserId || ''}
            onChange={e => setCurrentUserId(e.target.value || null)}
          >
            <option value="">— Select user —</option>
            {allEmployees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.role})
              </option>
            ))}
          </select>
          {currentUser && <RoleBadge role={currentUser.role} />}
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topBar}>
          <span className={styles.pageTitle}>
            {currentPage ? currentPage[1] : 'Dashboard'}
          </span>
        </header>
        <main className={styles.content}>
          {!currentUserId ? (
            <div className={styles.noUser}>
              <div className={styles.noUserIcon}>👤</div>
              <h2 className={styles.noUserTitle}>Select a user to get started</h2>
              <p>Use the dropdown in the sidebar to simulate a logged-in user.</p>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
