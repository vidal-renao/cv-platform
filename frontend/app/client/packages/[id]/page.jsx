'use client'

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchWithAuth } from '../../../../lib/api';

const STATUS_STYLES = {
  PICKED_UP:        'bg-green-50 text-green-700 border-green-200',
  READY_FOR_PICKUP: 'bg-blue-50 text-blue-700 border-blue-200',
  ARRIVED:          'bg-yellow-50 text-yellow-700 border-yellow-200',
};
const STATUS_FALLBACK = 'bg-gray-50 text-gray-600 border-gray-200';

export default function ClientPackageDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [pkg, setPkg] = useState(null);
  const [comments, setComments] = useState([]);
  const [proof, setProof] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const commentEndRef = useRef(null);

  const loadData = async () => {
    try {
      const [pkgData, commentsData] = await Promise.all([
        fetchWithAuth(`/client/packages/${id}`),
        fetchWithAuth(`/client/packages/${id}/comments`),
      ]);
      setPkg(pkgData);
      setComments(commentsData);

      // Proof (may 404 if not yet available)
      fetchWithAuth(`/client/packages/${id}/proof`).then(setProof).catch(() => setProof(null));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  // Poll for updates every 30 seconds (proof of delivery, comments)
  useEffect(() => {
    const interval = setInterval(loadData, 30_000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    commentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSending(true);
    try {
      const added = await fetchWithAuth(`/client/packages/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ comment: newComment }),
      });
      setComments(prev => [...prev, added]);
      setNewComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48" /><div className="h-64 bg-gray-200 rounded-2xl" /></div>;
  }

  if (!pkg) {
    return <p className="text-center text-red-500 py-16">Paquete no encontrado.</p>;
  }

  return (
    <div className="space-y-6">

      {/* Back */}
      <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        Volver
      </button>

      {/* Package info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{pkg.tracking_number}</h1>
            <p className="text-sm text-gray-400 mt-1">
              Recibido: {new Date(pkg.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <span className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${STATUS_STYLES[pkg.status] || STATUS_FALLBACK}`}>
            {pkg.status?.replace(/_/g, ' ')}
          </span>
        </div>
        {pkg.weight && <p className="text-sm text-gray-600">Peso: <span className="font-medium">{pkg.weight} kg</span></p>}
        {pkg.cost && <p className="text-sm text-gray-600">Costo: <span className="font-medium text-green-600">${Number(pkg.cost).toFixed(2)}</span></p>}
        {pkg.description && <p className="text-sm text-gray-500">{pkg.description}</p>}
      </div>

      {/* Proof of Delivery */}
      {proof && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h2 className="font-semibold text-green-800">Prueba de Entrega</h2>
          </div>
          <p className="text-xs text-green-600">
            Registrada el {new Date(proof.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
          {proof.notes && <p className="text-sm text-green-700">{proof.notes}</p>}
          <div className="flex gap-4 flex-wrap">
            {proof.signature_data && (
              <div>
                <p className="text-xs text-green-600 mb-1 font-medium">Firma</p>
                <img src={proof.signature_data} alt="Firma" className="border border-green-200 rounded-lg max-h-28 bg-white" />
              </div>
            )}
            {proof.photo_data && (
              <div>
                <p className="text-xs text-green-600 mb-1 font-medium">Foto</p>
                <img src={proof.photo_data} alt="Foto de entrega" className="border border-green-200 rounded-lg max-h-28 object-cover" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comments timeline */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Mensajes</h2>
        </div>

        <div className="px-6 py-4 space-y-4 max-h-80 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aún no hay mensajes. Escríbenos si tienes alguna pregunta.</p>
          ) : comments.map(c => {
            const isClient = c.author_role === 'CLIENT';
            return (
              <div key={c.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-3 text-sm ${
                  isClient
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}>
                  <p>{c.comment}</p>
                  <p className={`text-xs mt-1 ${isClient ? 'text-blue-200' : 'text-gray-400'}`}>
                    {new Date(c.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={commentEndRef} />
        </div>

        <form onSubmit={handleSend} className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <input
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
          <button
            type="submit"
            disabled={sending || !newComment.trim()}
            className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
