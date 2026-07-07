export default function Table({ children }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
      <table className="w-full min-w-[600px]">
        {children}
      </table>
    </div>
  );
}
