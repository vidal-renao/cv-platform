export default function Table({ children }) {

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100">

      <table className="w-full min-w-[600px]">

        {children}

      </table>

    </div>
  );

}