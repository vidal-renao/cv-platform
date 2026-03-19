export default function Badge({ children, color = "green" }) {

  const colors = {
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700"
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${colors[color]}`}>
      {children}
    </span>
  );

}