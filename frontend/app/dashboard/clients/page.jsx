'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-stone-200" />
          <div className="space-y-1.5">
            <div className="h-3.5 bg-stone-200 rounded w-28" />
            <div className="h-3 bg-stone-200 rounded w-36" />
          </div>
        </div>
      </td>
      <td className="px-6 py-4"><div className="h-3.5 bg-stone-200 rounded w-24" /></td>
      <td className="px-6 py-4"><div className="h-5 bg-stone-200 rounded-full w-16" /></td>
      <td className="px-6 py-4"><div className="h-7 bg-stone-200 rounded-lg w-28" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-stone-200 rounded w-12 ml-auto" /></td>
    </tr>
  );
}
import { fetchWithAuth } from "../../../lib/api";
import { useTranslation } from "../../../lib/i18n";

import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

export default function ClientsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingClient, setEditingClient] = useState(null);
  const [search, setSearch] = useState("");
  const [accessModal, setAccessModal] = useState(null); // { email, accessUrl, phone, notifications }
  const [generatingId, setGeneratingId] = useState(null);
  const [resendingId, setResendingId] = useState(null);
  const [resendModal, setResendModal] = useState(null); // { email, phone, notifications }
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState('');

  const copyAccessLink = async (email, accessUrl) => {
    const text = `Usuario: ${email}\nEnlace seguro: ${accessUrl}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: ""
  });

  const loadClients = async () => {
    try {
      const data = await fetchWithAuth("/clients");
      setClients(data);
    } catch (error) {
      console.error("Error loading clients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(search.toLowerCase()) ||
    client.email?.toLowerCase().includes(search.toLowerCase()) ||
    client.phone?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {

      if (editingClient) {

        await fetchWithAuth(`/clients/${editingClient.id}`, {
          method: "PUT",
          body: JSON.stringify(form)
        });

      } else {

        await fetchWithAuth("/clients", {
          method: "POST",
          body: JSON.stringify(form)
        });

      }

      setForm({ name: "", phone: "", email: "", address: "" });
      setEditingClient(null);
      loadClients();

    } catch (error) {
      setFormError(error.message || 'Error al guardar el cliente. Inténtalo de nuevo.');
    }
  };

  const editClient = (client) => {

    setEditingClient(client);

    setForm({
      name: client.name || "",
      phone: client.phone || "",
      email: client.email || "",
      address: client.address || ""
    });

  };

  const generateAccess = async (clientId) => {
    setGeneratingId(clientId);
    try {
      const data = await fetchWithAuth(`/clients/${clientId}/generate-access`, { method: 'POST' });
      setAccessModal({
        email: data.email,
        accessUrl: data.accessUrl,
        phone: data.phone,
        notifications: data.notifications,
      });
      loadClients(); // refresh has_account flag
    } catch (err) {
      setFormError(err.message);
    } finally {
      setGeneratingId(null);
    }
  };

  const resendAccess = async (clientId) => {
    setResendingId(clientId);
    try {
      const data = await fetchWithAuth(`/clients/${clientId}/resend-access`, { method: 'POST' });
      setResendModal({ email: data.email, accessUrl: data.accessUrl, phone: data.phone, notifications: data.notifications });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setResendingId(null);
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const deleteClient = async (id) => {

    try {

      await fetchWithAuth(`/clients/${id}`, {
        method: "DELETE"
      });

      loadClients();
      setDeleteConfirmId(null);

    } catch (error) {
      console.error("Error deleting client:", error);
      setDeleteConfirmId(null);
    }

  };

  const getStatus = (client) => {
    if (client.status) return client.status.charAt(0).toUpperCase() + client.status.slice(1);
    // Deterministic fallback based on client id (stable across renders)
    const statuses = ["Active", "Pending", "Inactive"];
    const charSum = (client.id || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return statuses[charSum % statuses.length];
  };

  const statusBadge = (status) => {

    const map = {
      Active:"bg-emerald-50 text-emerald-700 border border-emerald-200",
      Pending:"bg-amber-50 text-amber-700 border border-amber-200",
      Inactive:"bg-red-50 text-red-700 border border-red-200"
    };

    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${map[status]}`}>
        {status}
      </span>
    );

  };

  return (

    <div className="space-y-6 animate-fade-in-up">

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-8 space-y-4 animate-fade-in-up">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-navy-900 text-center">{t('clients.table.deleteConfirm')}</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="py-2.5 border border-stone-200 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-50 transition"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                onClick={() => deleteClient(deleteConfirmId)}
                className="py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition"
              >
                {t('clients.table.deleteBtn') || 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACCESS MODAL */}
      {accessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-8 space-y-4 animate-fade-in-up">
            {/* Icon + title */}
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-navy-900 text-center">{t('clients.access.modalTitle')}</h3>

            {/* Notification status badges */}
            <div className="flex justify-center gap-2">
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border ${accessModal.notifications?.email ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-stone-50 text-stone-400 border-stone-200'}`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                {accessModal.notifications?.email ? t('clients.access.emailSent') : t('clients.access.emailNotSent')}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border ${accessModal.notifications?.whatsapp ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-stone-50 text-stone-400 border-stone-200'}`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                {accessModal.notifications?.whatsapp ? t('clients.access.whatsappSent') : t('clients.access.whatsappNotSent')}
              </span>
            </div>

            {/* Credentials box */}
            <div className="bg-stone-50 rounded-lg p-4 space-y-2 text-sm font-mono border border-stone-200">
              <div><span className="text-stone-500">Email:</span> <span className="font-semibold text-navy-900">{accessModal.email}</span></div>
              <div><span className="text-stone-500">Enlace:</span> <span className="font-semibold text-navy-900 break-all">{accessModal.accessUrl}</span></div>
            </div>
            <p className="text-xs text-stone-400 text-center">{t('clients.access.changePasswordNote')}</p>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => copyAccessLink(accessModal.email, accessModal.accessUrl)}
                className="flex items-center justify-center gap-1.5 py-2.5 border border-stone-200 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-50 transition"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    <span className="text-emerald-600">{t('common.copied')}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    {t('common.copy')}
                  </>
                )}
              </button>

              {accessModal.phone ? (
                <a
                  href={`https://wa.me/${accessModal.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola. Tu acceso a CV Platform ha sido creado.\n\nUsuario: ${accessModal.email}\nEnlace seguro: ${accessModal.accessUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-teal-500 text-navy-900 text-sm font-bold rounded-lg hover:bg-teal-400 transition"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
              ) : (
                <button disabled className="flex items-center justify-center gap-1.5 py-2.5 bg-stone-100 text-stone-400 text-sm font-medium rounded-lg cursor-not-allowed">
                  {t('clients.access.noPhone')}
                </button>
              )}
            </div>

            <button
              onClick={() => setAccessModal(null)}
              className="w-full py-2.5 bg-teal-500 text-navy-900 text-sm font-bold rounded-lg hover:bg-teal-400 transition"
            >
              {t('clients.access.understood')}
            </button>
          </div>
        </div>
      )}

      {/* RESEND MODAL */}
      {resendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-8 space-y-4 animate-fade-in-up">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-navy-900 text-center">{t('clients.access.resendTitle')}</h3>
            <p className="text-sm text-stone-500 text-center">{t('clients.access.resendSub')}</p>

            <div className="flex justify-center gap-2">
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border ${resendModal.notifications?.email ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-stone-50 text-stone-400 border-stone-200'}`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                {resendModal.notifications?.email ? t('clients.access.emailSent') : t('clients.access.emailNotSent')}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border ${resendModal.notifications?.whatsapp ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-stone-50 text-stone-400 border-stone-200'}`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                {resendModal.notifications?.whatsapp ? t('clients.access.whatsappSent') : t('clients.access.whatsappNotSent')}
              </span>
            </div>

            <div className="bg-stone-50 rounded-lg p-4 space-y-2 text-sm font-mono border border-stone-200">
              <div><span className="text-stone-500">Email:</span> <span className="font-semibold text-navy-900">{resendModal.email}</span></div>
              <div><span className="text-stone-500">Enlace:</span> <span className="font-semibold text-navy-900 break-all">{resendModal.accessUrl}</span></div>
            </div>
            <p className="text-xs text-stone-400 text-center">{t('clients.access.changePasswordNote')}</p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => copyAccessLink(resendModal.email, resendModal.accessUrl)}
                className="flex items-center justify-center gap-1.5 py-2.5 border border-stone-200 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-50 transition"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    <span className="text-emerald-600">{t('common.copied')}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    {t('common.copy')}
                  </>
                )}
              </button>

              {resendModal.phone ? (
                <a
                  href={`https://wa.me/${resendModal.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola. Tu enlace de acceso a CV Platform:\n\nUsuario: ${resendModal.email}\nEnlace seguro: ${resendModal.accessUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-teal-500 text-navy-900 text-sm font-bold rounded-lg hover:bg-teal-400 transition"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
              ) : (
                <button disabled className="flex items-center justify-center gap-1.5 py-2.5 bg-stone-100 text-stone-400 text-sm font-medium rounded-lg cursor-not-allowed">
                  {t('clients.access.noPhone')}
                </button>
              )}
            </div>

            <button
              onClick={() => setResendModal(null)}
              className="w-full py-2.5 bg-teal-500 text-navy-900 text-sm font-bold rounded-lg hover:bg-teal-400 transition"
            >
              {t('clients.access.understood')}
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-navy-900">
            {t('clients.title')}
          </h1>
          <p className="text-stone-400 text-sm mt-1 font-body">
            {clients.length} {t('clients.totalCount')}
          </p>
        </div>

      </div>


      {/* FORM */}

      <Card>

        <h2 className="font-semibold mb-4">
          {editingClient ? t('clients.form.editTitle') : t('clients.form.addTitle')}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >

          <Input
            placeholder={t('clients.form.namePlaceholder')}
            value={form.name}
            onChange={(e)=>setForm({...form,name:e.target.value})}
          />

          <Input
            placeholder={t('clients.form.phonePlaceholder')}
            value={form.phone}
            onChange={(e)=>setForm({...form,phone:e.target.value})}
          />

          <Input
            placeholder={t('clients.form.emailPlaceholder')}
            value={form.email}
            onChange={(e)=>setForm({...form,email:e.target.value})}
          />

          <Input
            placeholder={t('clients.form.addressPlaceholder')}
            value={form.address}
            onChange={(e)=>setForm({...form,address:e.target.value})}
          />

          {formError && (
            <div className="col-span-2 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formError}
            </div>
          )}

          <div className="col-span-2 flex gap-3 mt-2">

            <Button type="submit">
              {editingClient ? t('clients.form.updateBtn') : t('clients.form.createBtn')}
            </Button>

            {editingClient && (

              <Button
                variant="secondary"
                onClick={()=>{
                  setEditingClient(null);
                  setForm({name:"",phone:"",email:"",address:""});
                  setFormError('');
                }}
              >
                {t('clients.form.cancelBtn')}
              </Button>

            )}

          </div>

        </form>

      </Card>


      {/* TABLE */}

      <Card>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">

          <h2 className="font-display font-bold text-navy-900">
            {t('clients.table.title')}
          </h2>

          <div className="w-full max-w-xs">

            <Input
              placeholder={t('clients.table.searchPlaceholder')}
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
            />

          </div>

        </div>

        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
          {loading ? (

          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider font-body">{t('clients.table.colClient')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider font-body">{t('clients.table.colPhone')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider font-body">{t('clients.table.colStatus')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider font-body">{t('clients.table.colAccess')}</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-stone-500 uppercase tracking-wider font-body">{t('clients.table.colActions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-100">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>

        ) : filteredClients.length === 0 ? (

          <div className="px-6 py-12 text-center text-stone-400 text-sm">
            <svg className="w-12 h-12 text-stone-300 mb-3 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {t('clients.table.empty')}
          </div>

        ) : (

          <table className="min-w-full divide-y divide-stone-200">

            <thead className="bg-stone-50">

              <tr>

                <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider font-body">{t('clients.table.colClient')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider font-body">{t('clients.table.colPhone')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider font-body">{t('clients.table.colStatus')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider font-body">{t('clients.table.colAccess')}</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-stone-500 uppercase tracking-wider font-body">{t('clients.table.colActions')}</th>

              </tr>

            </thead>

            <tbody className="bg-white divide-y divide-stone-100">

              {filteredClients.map(client => {

                const status = getStatus(client);

                return (

                <tr
                  key={client.id}
                  className="hover:bg-stone-50/50 transition-colors group"
                >

                  <td className="px-6 py-4 whitespace-nowrap">

                    <div className="flex items-center gap-3">

                      <div className="w-9 h-9 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center font-semibold text-sm font-display">
                        {client.name?.charAt(0).toUpperCase()}
                      </div>

                      <div>

                        <div className="font-medium text-navy-900">
                          {client.name}
                        </div>

                        <div className="text-sm text-stone-500 font-body">
                          {client.email}
                        </div>

                      </div>

                    </div>

                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500 font-body">
                    {client.phone || '\u2014'}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {statusBadge(status)}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {client.has_account ? (
                      <button
                        onClick={() => resendAccess(client.id)}
                        disabled={resendingId === client.id}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg transition disabled:opacity-60"
                      >
                        {resendingId === client.id ? (
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        )}
                        {t('clients.access.resend')}
                      </button>
                    ) : (
                      <button
                        onClick={() => generateAccess(client.id)}
                        disabled={generatingId === client.id}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-900 bg-teal-500 hover:bg-teal-400 px-3 py-1.5 rounded-lg transition disabled:opacity-60"
                      >
                        {generatingId === client.id ? (
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        )}
                        {t('clients.access.generate')}
                      </button>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right">

                    <div className="opacity-0 group-hover:opacity-100 transition flex justify-end gap-3">

                      <button
                        onClick={()=>router.push(`/dashboard/clients/${client.id}`)}
                        className="text-stone-400 hover:text-navy-700 transition-colors"
                        title="View profile"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="View profile">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>

                      <button
                        onClick={()=>editClient(client)}
                        className="text-stone-400 hover:text-teal-600 transition-colors"
                        aria-label="Edit client"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      <button
                        onClick={()=>setDeleteConfirmId(client.id)}
                        className="text-stone-400 hover:text-red-500 transition-colors"
                        aria-label="Delete client"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>

                    </div>

                  </td>

                </tr>

                )

              })}

            </tbody>

          </table>

        )}
        </div>
        </div>

      </Card>

    </div>

  );

}
