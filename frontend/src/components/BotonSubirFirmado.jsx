import { apiFetch, API_URL } from '../utils/api.js';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, CheckCircle, Lock, Loader, Eye, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Componente reutilizable para subir el PDF firmado de cada módulo.
 * Props:
 *   - visita_id: número
 *   - modulo: número (1 al 6)
 */
const BotonSubirFirmado = ({ visita_id, modulo }) => {
    const [estado, setEstado] = useState('cargando');
    const { usuario } = useAuth();
    const puedeEliminar = usuario?.es_admin || usuario?.permisos?.eliminar_documentos; // 'cargando' | 'libre' | 'subido' | 'subiendo'
    const [docInfo, setDocInfo] = useState(null);
    const inputRef = useRef(null);

    // Al montar, consulta si ya hay documento firmado para este módulo
    useEffect(() => {
        if (!visita_id) return;
        apiFetch(`/api/modulos/firmado/${visita_id}/${modulo}`)
            .then(res => res.json())
            .then(data => {
                if (data.existe) {
                    setEstado('subido');
                    setDocInfo(data.documento);
                } else {
                    setEstado('libre');
                }
            })
            .catch(() => setEstado('libre'));
    }, [visita_id, modulo]);

    const handleSubir = async (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;

        setEstado('subiendo');

        const formData = new FormData();
        formData.append('archivo', archivo);
        formData.append('visita_id', visita_id);
        formData.append('modulo', modulo);

        try {
            const token = localStorage.getItem('seiot_token');
            const res = await fetch(`${API_URL}/api/modulos/subir-firmado`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await res.json();

            if (res.status === 409) {
                // Ya existe — aunque no debería llegar aquí por la verificación previa
                alert('Ya existe un documento firmado para este módulo.');
                setEstado('subido');
            } else if (res.ok) {
                setEstado('subido');
                setDocInfo(data.documento);
                alert('✅ Documento firmado subido correctamente.');
            } else {
                alert(`Error: ${data.error}`);
                setEstado('libre');
            }
        } catch (error) {
            alert('Error de conexión al subir el archivo.');
            setEstado('libre');
        }

        // Limpiar input para permitir re-selección si fuera necesario
        if (inputRef.current) inputRef.current.value = '';
    };

    // ── ESTADO: cargando ──
    if (estado === 'cargando') {
        return (
            <button disabled className="bg-gray-300 text-gray-500 px-4 py-2 rounded flex items-center gap-2 text-xs font-bold cursor-wait">
                <Loader size={16} className="animate-spin" /> VERIFICANDO...
            </button>
        );
    }

    // ── ESTADO: ya subido / bloqueado ──
    if (estado === 'subido') {
        const fecha = docInfo?.fecha_subida
            ? new Date(docInfo.fecha_subida).toLocaleDateString('es-MX')
            : '';
        const urlArchivo = docInfo?.nombre_archivo
            ? `${API_URL}/uploads/documentos_firmados/${docInfo.nombre_archivo}`
            : null;

        const handleEliminar = async () => {
            if (!confirm('¿Estás seguro de eliminar el documento firmado? Esta acción no se puede deshacer.')) return;
            try {
                const res = await apiFetch(`/api/modulos/firmado/${visita_id}/${modulo}`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    setEstado('libre');
                    setDocInfo(null);
                    alert('Documento eliminado. Puedes subir uno nuevo.');
                } else {
                    alert('Error al eliminar el documento.');
                }
            } catch {
                alert('Error de conexión al eliminar.');
            }
        };

        return (
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-green-50 border border-green-300 px-4 py-2 rounded text-xs font-bold text-green-800">
                    <CheckCircle size={16} className="text-green-600" />
                    <span>DOCUMENTO FIRMADO</span>
                    <Lock size={12} className="text-green-500" />
                    {fecha && <span className="text-green-600 font-normal">({fecha})</span>}
                </div>
                {urlArchivo && (
                    <a
                        href={urlArchivo}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="bg-blue-600 text-white px-3 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-1 text-xs font-bold transition-all active:scale-95"
                        title="Ver / Descargar documento firmado"
                    >
                        <Eye size={14} /> VER
                    </a>
                )}
                {puedeEliminar && (
                <button
                    onClick={handleEliminar}
                    className="bg-red-600 text-white px-3 py-2 rounded shadow hover:bg-red-700 flex items-center gap-1 text-xs font-bold transition-all active:scale-95"
                    title="Eliminar documento firmado"
                >
                    <Trash2 size={14} /> ELIMINAR
                </button>
                )}
            </div>
        );
    }

    // ── ESTADO: subiendo ──
    if (estado === 'subiendo') {
        return (
            <button disabled className="bg-green-400 text-white px-4 py-2 rounded flex items-center gap-2 text-xs font-bold cursor-wait">
                <Loader size={16} className="animate-spin" /> SUBIENDO...
            </button>
        );
    }

    // ── ESTADO: libre (puede subir) ──
    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleSubir}
            />
            <button
                onClick={() => inputRef.current?.click()}
                className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 flex items-center gap-2 text-xs font-bold transition-all active:scale-95"
            >
                <Upload size={16} /> SUBIR FIRMADO
            </button>
        </>
    );
};

export default BotonSubirFirmado;