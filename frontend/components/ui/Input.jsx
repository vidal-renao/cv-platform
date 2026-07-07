export default function Input({ placeholder, value, onChange, type = 'text', className = '' }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-navy-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 transition font-body ${className}`}
    />
  );
}
