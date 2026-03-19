'use client'

import { useRef, useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../lib/api';

// ── Signature Pad ────────────────────────────────────────────────────────────
function SignaturePad({ onCapture }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches?.[0] ?? e;
    return {
      x: (src.clientX - rect.left) * (canvas.width / rect.width),
      y: (src.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e, canvas);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stop = () => {
    drawing.current = false;
    onCapture(canvasRef.current.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    onCapture(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">Firma digital</p>
        <button type="button" onClick={clear} className="text-xs text-gray-400 hover:text-red-500 transition">Borrar</button>
      </div>
      <canvas
        ref={canvasRef}
        width={480}
        height={180}
        className="w-full border-2 border-dashed border-gray-300 rounded-xl bg-white touch-none cursor-crosshair"
        onMouseDown={start}
        onMouseMove={draw}
        onMouseUp={stop}
        onMouseLeave={stop}
        onTouchStart={start}
        onTouchMove={draw}
        onTouchEnd={stop}
      />
      <p className="text-xs text-gray-400">Dibuja tu firma en el recuadro</p>
    </div>
  );
}

// ── Camera Capture ───────────────────────────────────────────────────────────
function CameraCapture({ onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [active, setActive] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');

  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setActive(true);
    } catch (err) {
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  };

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const capture = () => {
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPhoto(dataUrl);
    onCapture(dataUrl);
    stopCamera();
  };

  const retake = () => {
    setPhoto(null);
    onCapture(null);
    startCamera();
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">Foto del paquete</p>
      {error && <p className="text-xs text-red-500">{error}</p>}

      {photo ? (
        <div className="relative">
          <img src={photo} alt="Captura" className="w-full rounded-xl border border-gray-200 object-cover max-h-48" />
          <button type="button" onClick={retake} className="mt-2 text-xs text-gray-400 hover:text-blue-500 transition">Tomar otra foto</button>
        </div>
      ) : active ? (
        <div className="space-y-2">
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl border border-gray-200 max-h-48 object-cover" />
          <button
            type="button"
            onClick={capture}
            className="w-full py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition"
          >
            Capturar foto
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startCamera}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Activar cámara
        </button>
      )}
    </div>
  );
}

// ── Main Modal ───────────────────────────────────────────────────────────────
export default function DeliveryProofModal({ packageId, onClose, onSaved }) {
  const [signature, setSignature] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!signature && !photo) {
      return setError('Adjunta al menos una firma o una foto.');
    }
    setSaving(true);
    setError('');
    try {
      const data = await fetchWithAuth(`/packages/${packageId}/proof`, {
        method: 'POST',
        body: JSON.stringify({ signature_data: signature, photo_data: photo, notes }),
      });
      onSaved(data);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Prueba de Entrega</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg">{error}</div>
          )}

          <SignaturePad onCapture={setSignature} />

          <CameraCapture onCapture={setPhoto} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ej: Entregado al portero del edificio"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm transition"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || (!signature && !photo)}
            className="flex-1 py-2.5 bg-green-600 text-white font-medium text-sm rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar prueba de entrega'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
