export default function Input({ placeholder, value, onChange }) {

  return (
    <input
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="border border-gray-300 p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );

}