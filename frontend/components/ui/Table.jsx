export default function Table({ children }) {

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100">

      <table className="w-full">

        {children}

      </table>

    </div>
  );

}