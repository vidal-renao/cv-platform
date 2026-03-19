'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function SkeletonRow() {
  return (
    <tr className="border-t animate-pulse">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-200" />
          <div className="space-y-1.5">
            <div className="h-3.5 bg-gray-200 rounded w-28" />
            <div className="h-3 bg-gray-200 rounded w-36" />
          </div>
        </div>
      </td>
      <td className="p-4"><div className="h-3.5 bg-gray-200 rounded w-24" /></td>
      <td className="p-4"><div className="h-5 bg-gray-200 rounded-full w-16" /></td>
      <td className="p-4"><div className="h-7 bg-gray-200 rounded-lg w-28" /></td>
      <td className="p-4"><div className="h-4 bg-gray-200 rounded w-12 ml-auto" /></td>
    </tr>
  );
}
import { fetchWithAuth } from "../../../lib/api";
import { useTranslation } from "../../../lib/i18n";

import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Table from "../../../components/ui/Table";

export default function ClientsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingClient, setEditingClient] = useState(null);
  const [search, setSearch] = useState("");
  const [accessModal, setAccessModal] = useState(null); // { email, tempPassword, phone, notifications }
  const [generatingId, setGeneratingId] = useState(null);
  const [resendingId, setResendingId] = useState(null);
  const [resendModal, setResendModal] = useState(null); // { email, phone, notifications }
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState('');

  const copyCredentials = async (email, password) => {
    const text = `Usuario: ${email}\nContraseña: ${password}`;
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
        tempPassword: data.tempPassword,
        phone: data.phone,
        notifications: data.notifications,
      });
      loadClients(); // refresh has_account flag
    } catch (err) {
      alert(err.message);
    } finally {
      setGeneratingId(null);
    }
  };

  const resendAccess = async (clientId) => {
    setResendingId(clientId);
    try {
      const data = await fetchWithAuth(`/clients/${clientId}/resend-access`, { method: 'POST' });
      setResendModal({ email: data.email, phone: data.phone, notifications: data.notifications });
    } catch (err) {
      alert(err.message);
    } finally {
      setResendingId(null);
    }
  };

  const deleteClient = async (id) => {

    if (!confirm(t('clients.table.deleteConfirm'))) return;

    try {

      await fetchWithAuth(`/clients/${id}`, {
        method: "DELETE"
      });

      loadClients();

    } catch (error) {
      console.error("Error deleting client:", error);
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
      Active:"bg-green-100 text-green-700",
      Pending:"bg-yellow-100 text-yellow-700",
      Inactive:"bg-red-100 text-red-700"
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${map[status]}`}>
        {t(`clients.status.${status}`) !== `clients.status.${status}` ? t(`clients.status.${status}`) : status}
      </span>
    );

  };

  return (

    <div className="space-y-10">

      {/* ACCESS MODAL */}
      {accessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 space-y-4">
            {/* Icon + title */}
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center">{t('clients.access.modalTitle')}</h3>

            {/* Notification status badges */}
            <div className="flex justify-center gap-2">
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border ${accessModal.notifications?.email ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                {accessModal.notifications?.email ? t('clients.access.emailSent') : t('clients.access.emailNotSent')}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border ${accessModal.notifications?.whatsapp ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                {accessModal.notifications?.whatsapp ? t('clients.access.whatsappSent') : t('clients.access.whatsappNotSent')}
              </span>
            </div>

            {/* Credentials box */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm font-mono border border-gray-200">
              <div><span className="text-gray-500">Email:</span> <span className="font-semibold text-gray-900">{accessModal.email}</span></div>
              <div><span className="text-gray-500">{t('clients.access.passwordLabel')}</span> <span className="font-semibold text-gray-900">{accessModal.tempPassword}</span></div>
            </div>
            <p className="text-xs text-gray-400 text-center">{t('clients.access.changePasswordNote')}</p>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => copyCredentials(accessModal.email, accessModal.tempPassword)}
                className="flex items-center justify-center gap-1.5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    <span className="text-green-600">{t('common.copied')}</span>
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
                  href={`https://wa.me/${accessModal.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`¡Hola! Tu acceso a CV Platform ha sido creado.\n\n📧 Usuario: ${accessModal.email}\n🔑 Contraseña: ${accessModal.tempPassword}\n\n👉 Ingresa en: ${typeof window !== 'undefined' ? window.location.origin : ''}/login`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
              ) : (
                <button disabled className="flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed">
                  {t('clients.access.noPhone')}
                </button>
              )}
            </div>

            <button
              onClick={() => setAccessModal(null)}
              className="w-full py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition"
            >
              {t('clients.access.understood')}
            </button>
          </div>
        </div>
      )}

      {/* RESEND MODAL */}
      {resendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 space-y-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center">{t('clients.access.resendTitle')}</h3>
            <p className="text-sm text-gray-500 text-center">{t('clients.access.resendSub')}</p>

            <div className="flex justify-center gap-2">
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border ${resendModal.notifications?.email ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                {resendModal.notifications?.email ? t('clients.access.emailSent') : t('clients.access.emailNotSent')}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border ${resendModal.notifications?.whatsapp ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                {resendModal.notifications?.whatsapp ? t('clients.access.whatsappSent') : t('clients.access.whatsappNotSent')}
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-sm font-mono border border-gray-200">
              <span className="text-gray-500">Email:</span> <span className="font-semibold text-gray-900">{resendModal.email}</span>
            </div>

            <button
              onClick={() => setResendModal(null)}
              className="w-full py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition"
            >
              {t('clients.access.understood')}
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}

      <div className="flex items-center justify-between">

        <h1 className="text-3xl font-bold">
          {t('clients.title')}
        </h1>

        <div className="text-sm text-gray-500">
          {clients.length} {t('clients.totalCount')}
        </div>

      </div>


      {/* FORM */}

      <Card>

        <h2 className="font-semibold mb-4">
          {editingClient ? t('clients.form.editTitle') : t('clients.form.addTitle')}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-2 gap-4"
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

        <div className="flex items-center justify-between mb-4">

          <h2 className="font-semibold">
            {t('clients.table.title')}
          </h2>

          <div className="w-64">

            <Input
              placeholder={t('clients.table.searchPlaceholder')}
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
            />

          </div>

        </div>

        {loading ? (

          <Table>
            <thead className="bg-gray-50 text-sm text-gray-600">
              <tr>
                <th className="text-left p-4">{t('clients.table.colClient')}</th>
                <th className="text-left p-4">{t('clients.table.colPhone')}</th>
                <th className="text-left p-4">{t('clients.table.colStatus')}</th>
                <th className="text-left p-4">{t('clients.table.colAccess')}</th>
                <th className="text-right p-4">{t('clients.table.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </Table>

        ) : filteredClients.length === 0 ? (

          <div className="p-4 text-gray-500">
            {t('clients.table.empty')}
          </div>

        ) : (

          <Table>

            <thead className="bg-gray-50 text-sm text-gray-600">

              <tr>

                <th className="text-left p-4">{t('clients.table.colClient')}</th>
                <th className="text-left p-4">{t('clients.table.colPhone')}</th>
                <th className="text-left p-4">{t('clients.table.colStatus')}</th>
                <th className="text-right p-4">{t('clients.table.colActions')}</th>

              </tr>

            </thead>

            <tbody>

              {filteredClients.map(client => {

                const status = getStatus(client);

                return (

                <tr
                  key={client.id}
                  className="border-t hover:bg-gray-50 transition group"
                >

                  <td className="p-4">

                    <div className="flex items-center gap-3">

                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                        {client.name?.charAt(0).toUpperCase()}
                      </div>

                      <div>

                        <div className="font-medium text-gray-900">
                          {client.name}
                        </div>

                        <div className="text-sm text-gray-500">
                          {client.email}
                        </div>

                      </div>

                    </div>

                  </td>

                  <td className="p-4">
                    {client.phone}
                  </td>

                  <td className="p-4">
                    {statusBadge(status)}
                  </td>

                  <td className="p-4">
                    {client.has_account ? (
                      <button
                        onClick={() => resendAccess(client.id)}
                        disabled={resendingId === client.id}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition disabled:opacity-60"
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
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition disabled:opacity-60"
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

                  <td className="p-4 text-right">

                    <div className="opacity-0 group-hover:opacity-100 transition flex justify-end gap-3">

                      <button
                        onClick={()=>router.push(`/dashboard/clients/${client.id}`)}
                        className="text-gray-500 hover:text-primary-600"
                        title="View profile"
                      >
                        👁️
                      </button>

                      <button
                        onClick={()=>editClient(client)}
                        className="text-gray-500 hover:text-blue-600"
                      >
                        ✏️
                      </button>

                      <button
                        onClick={()=>deleteClient(client.id)}
                        className="text-gray-500 hover:text-red-600"
                      >
                        🗑️
                      </button>

                    </div>

                  </td>

                </tr>

                )

              })}

            </tbody>

          </Table>

        )}

      </Card>

    </div>

  );

}