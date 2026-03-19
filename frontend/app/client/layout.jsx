'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');

    if (!token || !stored) {
      router.replace('/login');
      return;
    }

    const parsed = JSON.parse(stored);
    if (parsed.role !== 'CLIENT') {
      // ADMIN accidentally landed here → redirect to admin dashboard
      router.replace('/dashboard');
      return;
    }

    setUser(parsed);
  }, [router]);

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
