'use client'

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { fetchWithAuth } from '../../../../lib/api';
import { useTranslation } from '../../../../lib/i18n';

const DeliveryProofModal = dynamic(() => import('../../../../components/DeliveryProofModal'), { ssr: false });

const STATUS_STYLES = {
  PICKED_UP:        'bg-green-50 text-green-700 border-green-200',
  READY_FOR_PICKUP: 'bg-blue-50 text-blue-700 border-blue-200',
  ARRIVED:          'bg-yellow-50 text-yellow-700 border-yellow-200',
};
const STATUS_FALLBACK = 'bg-gray-50 text-gray-600 border-gray-200';
const VALID_STATUSES = ['ARRIVED', 'READY_FOR_PICKUP', 'PICKED_UP'];

export default function AdminPackageDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const router = useRouter();
  const [pkg, setPkg] = useState(null);
  const [comments, setComments] = useState([]);
  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const commentEndRef = useRef(null);

  const loadData = async () => {
    try {
      const [pkgRes, commentsRes] = await Promise.all([
        fetchWithAuth(`/packages`).then(list => list.find(p => p.id === id)),
        fetchWithAuth(`/packages/${id}/comments`),
      ]);
      setPkg(pkgRes || null);
      setComments(commentsRes);
      fetchWithAuth(`/packages/${id}/proof`).then(setProof).catch(() => setProof(null));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  useEffect(() => {
    commentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSending(true);
    try {
      const added = await fetchWithAuth(`/packages/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ comment: newComment, is_internal: isInternal }),
      });
      setComments(prev => [...prev, added]);
      setNewComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await fetchWithAuth(`/packages/${id}/comments/${commentId}`, { method: 'DELETE' });
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (status) => {
    setChangingStatus(true);
    try {
      await fetchWithAuth(`/packages/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setPkg(prev => ({ ...prev, status }));
    } catch (err) {
      console.error(err);
    } finally {
      setChangingStatus(false);
    }
  };

  const onProofSaved = (savedProof) => {
    setProof(savedProof);
    setPkg(prev => ({ ...prev, status: 'PICKED_UP' }));
    setShowProofModal(false);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-40 bg-gray-200 rounded-2xl" />
        <div className="h-64 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (!pkg) {
    return <p className="text-center text-red-500 py-16">{t('packagesDetail.notFound')}</p>;
  }

  const msgCount = comments.length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {showProofModal && (
        <DeliveryProofModal
          packageId={id}
          onClose={() => setShowProofModal(false)}
          onSaved={onProofSaved}
        />
      )}

      <Link href="/dashboard/packages" className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 w-fit">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        {t('packagesDetail.back')}
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{pkg.tracking_number}</h1>
            <p className="text-sm text-gray-400 mt-1">
              {t('packagesDetail.clientLabel')}: <span className="text-gray-600 font-medium">{pkg.client_name || '—'}</span>
              {pkg.weight ? ` · ${pkg.weight} kg` : ''}
              {pkg.cost ? ` · $${Number(pkg.cost).toFixed(2)}` : ''}
            </p>
            {pkg.description && <p className="text-sm text-gray-500 mt-2">{pkg.description}</p>}
          </div>
          <div className="flex items-center gap-3">
            <select
              value={pkg.status}
              disabled={changingStatus}
              onChange={e => handleStatusChange(e.target.value)}
              className={`text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 transition ${STATUS_STYLES[pkg.status] || STATUS_FALLBACK} disabled:opacity-50`}
            >
              {VALID_STATUSES.map(s => (
                <option key={s} value={s}>
                  {t(`packages.status.${s}`) !== `packages.status.${s}` ? t(`packages.status.${s}`) : s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowProofModal(true)}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
            >
              {proof ? t('packagesDetail.updateProof') : t('packagesDetail.proofOfDelivery')}
            </button>
          </div>
        </div>

        {proof && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3 flex-wrap">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-sm text-green-700 font-medium">{t('packagesDetail.proofRecorded')}</span>
            {proof.signature_data && <img src={proof.signature_data} alt="Signature" className="h-12 border border-gray-200 rounded" />}
            {proof.photo_data && <img src={proof.photo_data} alt="Photo" className="h-12 border border-gray-200 rounded object-cover" />}
            {proof.notes && <span className="text-xs text-gray-400">{proof.notes}</span>}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{t('packagesDetail.comments')}</h2>
          <span className="text-xs text-gray-400">
            {msgCount} {msgCount === 1 ? t('packagesDetail.message') : t('packagesDetail.messages')}
          </span>
        </div>

        <div className="px-6 py-4 space-y-3 max-h-96 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">{t('packagesDetail.noComments')}</p>
          ) : comments.map(c => {
            const isAdmin = c.author_role === 'ADMIN';
            return (
              <div key={c.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                <div className={`group relative max-w-sm rounded-2xl px-4 py-3 text-sm ${
                  c.is_internal
                    ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-br-none'
                    : isAdmin
                    ? 'bg-primary-600 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}>
                  {c.is_internal && (
                    <span className="text-xs font-semibold text-amber-600 block mb-1">{t('packagesDetail.internalNote')}</span>
                  )}
                  <p>{c.comment}</p>
                  <div className="flex items-center justify-between gap-3 mt-1">
                    <p className={`text-xs ${c.is_internal ? 'text-amber-500' : isAdmin ? 'text-primary-200' : 'text-gray-400'}`}>
                      {c.author_email?.split('@')[0]} · {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-600 text-xs"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={commentEndRef} />
        </div>

        <form onSubmit={handleSend} className="px-6 py-4 border-t border-gray-100 space-y-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={e => setIsInternal(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-400"
              />
              <span className="text-sm text-gray-600">{t('packagesDetail.internalNoteOnly')}</span>
            </label>
          </div>
          <div className="flex gap-3">
            <input
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder={isInternal ? t('packagesDetail.internalPlaceholder') : t('packagesDetail.messagePlaceholder')}
              className={`flex-1 px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition ${
                isInternal ? 'border-amber-200 focus:ring-amber-300 bg-amber-50' : 'border-gray-200 focus:ring-primary-400'
              }`}
            />
            <button
              type="submit"
              disabled={sending || !newComment.trim()}
              className="px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              {t('packagesDetail.send')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
