export default function Button({ children, onClick, type = 'button', variant = 'primary', className = '' }) {
  const base = 'px-4 py-2 rounded-lg font-medium transition inline-flex items-center justify-center gap-1.5 text-sm';

  const variants = {
    primary: 'bg-teal-500 text-navy-900 hover:bg-teal-400 font-bold',
    secondary: 'border border-stone-200 text-navy-700 hover:bg-stone-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-navy-600 hover:bg-stone-100',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
