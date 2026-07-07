export default function Card({ children, variant = 'default', className = '' }) {
  const styles = {
    default: 'bg-white rounded-2xl border border-stone-200 p-6',
    ghost: 'rounded-2xl p-6',
    dashboard: 'bg-white rounded-2xl border border-stone-200 p-6 shadow-sm hover:shadow-md transition-shadow',
  };

  return (
    <div className={`${styles[variant]} ${className}`}>
      {children}
    </div>
  );
}
