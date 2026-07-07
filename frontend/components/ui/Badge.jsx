export default function Badge({ children, color = 'green' }) {
  const colors = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    yellow: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    navy: 'bg-navy-50 text-navy-700 border-navy-200',
  };

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${colors[color] || colors.green}`}>
      {children}
    </span>
  );
}
