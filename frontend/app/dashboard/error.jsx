'use client'

export default function Error({ error }) {
  console.error(error);

  return (
    <div className="p-8 text-red-500">
      Something went wrong
    </div>
  );
}