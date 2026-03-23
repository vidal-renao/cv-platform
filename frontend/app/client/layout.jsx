'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  // Feedback widget state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

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

  async function handleFeedbackSend() {
    if (!feedbackText.trim() || feedbackSending) return;

    setFeedbackSending(true);
    try {
      const token = localStorage.getItem('token');

      // Get first ADMIN/SUPERADMIN contact
      const contactsRes = await fetch('/api/chat/contacts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const contacts = await contactsRes.json();
      const adminContact = Array.isArray(contacts)
        ? contacts.find((c) => c.role === 'SUPERADMIN' || c.role === 'ADMIN')
        : null;

      if (!adminContact) {
        console.error('[Feedback] No admin contact found');
        setFeedbackSending(false);
        return;
      }

      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recipientId: adminContact.id, content: feedbackText.trim() }),
      });

      setFeedbackSent(true);
      setFeedbackText('');
      setTimeout(() => {
        setFeedbackSent(false);
        setFeedbackOpen(false);
      }, 2000);
    } catch (err) {
      console.error('[Feedback] Error sending:', err);
    } finally {
      setFeedbackSending(false);
    }
  }

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Floating feedback widget */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {feedbackOpen && (
          <div className="w-[300px] bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col overflow-hidden">
            <div className="px-4 py-3 bg-blue-600 text-white text-sm font-semibold flex items-center justify-between">
              <span>Enviar feedback</span>
              <button
                onClick={() => { setFeedbackOpen(false); setFeedbackSent(false); setFeedbackText(''); }}
                className="text-white/80 hover:text-white text-lg leading-none"
                aria-label="Cerrar"
              >
                &times;
              </button>
            </div>
            <div className="p-3 flex flex-col gap-2">
              {feedbackSent ? (
                <p className="text-center text-green-600 text-sm font-medium py-4">Mensaje enviado</p>
              ) : (
                <>
                  <textarea
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                    rows={4}
                    placeholder="Escribe tu mensaje..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    maxLength={2000}
                    disabled={feedbackSending}
                  />
                  <button
                    onClick={handleFeedbackSend}
                    disabled={feedbackSending || !feedbackText.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                  >
                    {feedbackSending ? 'Enviando...' : 'Enviar'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <button
          onClick={() => { setFeedbackOpen((prev) => !prev); setFeedbackSent(false); }}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
          aria-label="Abrir feedback"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
