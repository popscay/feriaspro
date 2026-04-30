import styles from '../styles/ui.module.css';

export function Button({ variant = 'primary', size, children, ...props }) {
  const variantClass = {
    primary: styles.btnPrimary,
    secondary: styles.btnSecondary,
    danger: styles.btnDanger,
    success: styles.btnSuccess,
  }[variant] || styles.btnPrimary;

  return (
    <button className={`${styles.btn} ${variantClass} ${size === 'sm' ? styles.btnSm : ''}`} {...props}>
      {children}
    </button>
  );
}

export function StatusBadge({ status }) {
  const cls = {
    PENDING: styles.badgePending,
    APPROVED: styles.badgeApproved,
    REJECTED: styles.badgeRejected,
    CANCELLED: styles.badgeCancelled,
  }[status] || '';

  const dots = {
    PENDING: '●',
    APPROVED: '●',
    REJECTED: '●',
    CANCELLED: '●',
  };

  return <span className={`${styles.badge} ${cls}`}>{dots[status]} {status}</span>;
}

export function Card({ title, action, children }) {
  return (
    <div className={styles.card}>
      {title && (
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function Modal({ title, onClose, children, footer }) {
  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>{children}</div>
        {footer && <div className={styles.modalFooter}>{footer}</div>}
      </div>
    </div>
  );
}

export function FormGroup({ label, error, children }) {
  return (
    <div className={styles.formGroup}>
      {label && <label className={styles.formLabel}>{label}</label>}
      {children}
      {error && <div className={styles.formError}>{error}</div>}
    </div>
  );
}

export function Input({ ...props }) {
  return <input className={styles.formInput} {...props} />;
}

export function Select({ children, ...props }) {
  return <select className={styles.formSelect} {...props}>{children}</select>;
}

export function Alert({ type = 'error', children }) {
  return (
    <div className={`${styles.alert} ${type === 'error' ? styles.alertError : styles.alertSuccess}`}>
      {children}
    </div>
  );
}

export function Spinner() {
  return (
    <div className={styles.spinner}>
      <div className={styles.spinnerCircle} />
    </div>
  );
}

export function EmptyState({ icon, title, description }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>{icon || '📭'}</div>
      <div className={styles.emptyTitle}>{title}</div>
      {description && <p>{description}</p>}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className={styles.pageHeader}>
      <div>
        <h1 className={styles.pageHeading}>{title}</h1>
        {subtitle && <p className={styles.pageSubheading}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Table({ columns, data, renderRow, emptyState }) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col, i) => <th key={i}>{col}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                {emptyState || <EmptyState title="No records found" />}
              </td>
            </tr>
          ) : (
            data.map((row, i) => renderRow(row, i))
          )}
        </tbody>
      </table>
    </div>
  );
}
