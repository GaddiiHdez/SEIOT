import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldAlert, FileText, CheckCircle2, Download, Building, Send, Clock, User, Phone, MapPin, AlertTriangle, ArrowRight } from 'lucide-react';
import logoGobierno from '../assets/logo-gobierno.jpg';

const INSTANCIAS_MAP = {
    seder_juridico: 'Dirección Jurídica de la SEDER',
    cefppenay: 'CEFPPENAY',
    senasica: 'SENASICA',
    test_henry: 'Supervisión Técnica (Pruebas - Henry Hernández)'
};

const SeguimientoExpediente = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [expediente, setExpediente] = useState(null);

    // Formulario de registro de atención
    const [instancia, setInstancia] = useState('seder_juridico');
    const [nombreResponsable, setNombreResponsable] = useState('');
    const [cargoResponsable, setCargoResponsable] = useState('');
    const [oficioReferencia, setOficioReferencia] = useState('');
    const [accionesTomadas, setAccionesTomadas] = useState('');
    const [guardandoAtencion, setGuardandoAtencion] = useState(false);
    const [mensajeExito, setMensajeExito] = useState(null);

    useEffect(() => {
        if (!token) {
            setError('No se proporcionó un token de acceso al expediente.');
            setCargando(false);
            return;
        }

        const cargarExpediente = async () => {
            try {
                const res = await fetch(`/api/modulos/seguimiento/${token}`);
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || 'No fue posible cargar el expediente.');
                }
                const data = await res.json();
                setExpediente(data.expediente);
            } catch (err) {
                setError(err.message);
            } finally {
                setCargando(false);
            }
        };

        cargarExpediente();
    }, [token]);

    const handleRegistrarAtencion = async (e) => {
        e.preventDefault();
        if (!accionesTomadas.trim()) {
            alert('Por favor describa las acciones tomadas o el dictamen de atención.');
            return;
        }

        setGuardandoAtencion(true);
        try {
            const res = await fetch(`/api/modulos/seguimiento/${token}/atender`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instancia: INSTANCIAS_MAP[instancia] || instancia,
                    nombre_responsable: nombreResponsable,
                    cargo_responsable: cargoResponsable,
                    oficio_referencia: oficioReferencia,
                    acciones_tomadas: accionesTomadas
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Error al registrar la atención.');
            }

            const data = await res.json();
            setMensajeExito('¡Atención registrada correctamente en la bitácora del SEIOT!');
            // Actualizar atenciones en la vista
            if (data.atencion) {
                setExpediente(prev => ({
                    ...prev,
                    atenciones: [data.atencion, ...(prev.atenciones || [])]
                }));
            }
            // Limpiar formulario
            setOficioReferencia('');
            setAccionesTomadas('');
        } catch (err) {
            alert(err.message);
        } finally {
            setGuardandoAtencion(false);
        }
    };

    if (cargando) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 border-4 border-red-800 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-700 font-bold">Cargando expediente de supervisión...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 text-center border border-gray-200">
                    <div className="w-16 h-16 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso No Disponible</h2>
                    <p className="text-sm text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-2.5 bg-red-800 hover:bg-red-900 text-white rounded-lg font-bold text-sm shadow transition-colors"
                    >
                        Ir al Portal de Inicio de Sesión
                    </button>
                </div>
            </div>
        );
    }

    const { folio, psg, psg_datos = {}, modulo3 = {}, checklist = [], atenciones = [], documentos_firmados = [] } = expediente;

    return (
        <div className="min-h-screen bg-slate-50 text-gray-800 pb-16">
            {/* Encabezado Institucional */}
            <header className="bg-gradient-to-r from-red-950 via-red-900 to-red-950 text-white shadow-lg border-b-4 border-[#BC955B]">
                <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-1.5 rounded-lg shadow-sm">
                            <img src={logoGobierno} alt="Gobierno de Nayarit" className="h-10 w-auto object-contain" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-wide uppercase">Secretaría de Desarrollo Rural</h1>
                            <p className="text-xs text-[#BC955B] font-semibold tracking-wider uppercase">
                                SEIOT — Expediente Oficial de Supervisión
                            </p>
                        </div>
                    </div>
                    <div className="text-center sm:text-right">
                        <span className="inline-block px-3 py-1 bg-amber-500/20 border border-amber-400/40 text-amber-300 rounded-full text-xs font-bold uppercase tracking-wider">
                            ⚠️ Requiere Seguimiento
                        </span>
                        <p className="text-xs text-gray-300 mt-1">Folio: <strong className="text-white">{folio}</strong></p>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 mt-8 space-y-6">
                {/* Banner de Aviso Oficial */}
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-xs flex items-start gap-3">
                    <ShieldAlert size={24} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <h2 className="text-sm font-bold text-amber-900">
                            Supervisión Pecuaria Canalizada para Atención y Seguimiento Institucional
                        </h2>
                        <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                            Este expediente fue remitido automáticamente por el Sistema Estatal de Información de Origen y Trazabilidad (SEIOT) a las dependencias competentes (SENASICA, CEFPPENAY y/o Dirección Jurídica) para su dictamen, seguimiento y registro de atención.
                        </p>
                    </div>
                </div>

                {/* Grid: Identificación PSG + Supervisión */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Ficha PSG */}
                    <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                <Building size={16} className="text-red-800" /> Identificación del Prestador de Servicios (PSG)
                            </h3>
                            <span className="text-xs font-mono font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                                {psg}
                            </span>
                        </div>
                        <div className="p-5 text-xs space-y-2.5">
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500 font-semibold">Titular / Razón Social:</span>
                                <span className="font-bold text-gray-900 text-right">{psg_datos.titular || 'N/D'}</span>
                            </div>
                            {psg_datos.representante && (
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-500 font-semibold">Representante:</span>
                                    <span className="font-medium text-gray-900 text-right">{psg_datos.representante}</span>
                                </div>
                            )}
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500 font-semibold">Municipio:</span>
                                <span className="font-medium text-gray-900">{psg_datos.municipio || 'N/D'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500 font-semibold">Localidad:</span>
                                <span className="font-medium text-gray-900">{psg_datos.localidad || 'N/D'}</span>
                            </div>
                            {psg_datos.domicilio && (
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-500 font-semibold">Domicilio:</span>
                                    <span className="font-medium text-gray-900 text-right">{psg_datos.domicilio}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-500 font-semibold">Teléfono:</span>
                                <span className="font-medium text-gray-900">{psg_datos.telefono || 'N/D'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Ficha Supervisión */}
                    <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                <Clock size={16} className="text-red-800" /> Datos de la Supervisión
                            </h3>
                            <span className="text-xs font-semibold text-gray-500">Módulo 3: Lista de Verificación</span>
                        </div>
                        <div className="p-5 text-xs space-y-2.5">
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500 font-semibold">Fecha de Supervisión:</span>
                                <span className="font-bold text-gray-900">{modulo3.fecha || 'N/D'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500 font-semibold">Horario de Inspección:</span>
                                <span className="font-medium text-gray-900">{modulo3.hora_inicio || '--:--'} a {modulo3.hora_termino || '--:--'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500 font-semibold">Supervisor Oficial:</span>
                                <span className="font-bold text-gray-900 text-right">{modulo3.nombre_supervisor || 'N/D'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500 font-semibold">Instancias Notificadas:</span>
                                <span className="font-bold text-red-900 text-right">
                                    {(modulo3.instancias_notificadas || []).map(id => INSTANCIAS_MAP[id] || id).join(', ') || 'N/D'}
                                </span>
                            </div>

                            {/* Observaciones registradas */}
                            <div className="pt-2">
                                <span className="text-gray-600 font-bold block mb-1 uppercase text-[11px]">Motivo u Observaciones del Supervisor:</span>
                                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-950 font-sans text-xs leading-relaxed whitespace-pre-wrap">
                                    {modulo3.observaciones?.trim() || 'Sin observaciones adicionales registradas.'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Resumen de Incumplimientos en Checklist */}
                {checklist.length > 0 && (
                    <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                            <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-red-800" /> Puntos Evaluados en la Lista de Verificación
                            </h3>
                        </div>
                        <div className="p-5 overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase text-[11px]">
                                        <th className="py-2 px-3 w-16">Punto</th>
                                        <th className="py-2 px-3 w-32">Evaluación</th>
                                        <th className="py-2 px-3">Observación / Hallazgo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {checklist.map(item => {
                                        const esNo = String(item.respuesta).toLowerCase() === 'no';
                                        return (
                                            <tr key={item.pregunta_id} className={`border-b border-gray-100 ${esNo ? 'bg-red-50/50' : 'hover:bg-gray-50'}`}>
                                                <td className="py-2.5 px-3 font-mono font-bold text-gray-700">P{item.pregunta_id}</td>
                                                <td className="py-2.5 px-3">
                                                    <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                                                        esNo
                                                            ? 'bg-red-100 text-red-800 border border-red-300'
                                                            : String(item.respuesta).toLowerCase() === 'si'
                                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {item.respuesta || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 text-gray-700">
                                                    {item.observacion || <span className="text-gray-400 italic">Sin observaciones</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Descarga de Documentos Firmados */}
                <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                        <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                            <FileText size={16} className="text-red-800" /> Documentos Oficiales Digitalizados de la Visita
                        </h3>
                    </div>
                    <div className="p-5">
                        {documentos_firmados.length === 0 ? (
                            <p className="text-xs text-gray-500 italic">
                                No se han subido documentos firmados digitalizados para esta visita todavía.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {documentos_firmados.map(doc => (
                                    <a
                                        key={doc.id}
                                        href={`/api/modulos/seguimiento/${token}/archivo/${doc.modulo}`}
                                        download
                                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-red-400 hover:bg-red-50/30 transition-all text-xs group"
                                    >
                                        <div className="truncate mr-2">
                                            <p className="font-bold text-gray-800 group-hover:text-red-800">Módulo {doc.modulo}</p>
                                            <p className="text-[11px] text-gray-500 truncate">{doc.nombre_archivo}</p>
                                        </div>
                                        <Download size={16} className="text-gray-400 group-hover:text-red-700 shrink-0" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Formulario de Registro de Atención y Seguimiento */}
                <div className="bg-white rounded-xl shadow-md border-2 border-red-900/20 overflow-hidden">
                    <div className="bg-gradient-to-r from-red-900 to-red-800 text-white px-5 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Send size={18} className="text-[#BC955B]" />
                            <h3 className="font-bold text-sm tracking-wide">
                                Registro de Atención y Acciones de Seguimiento
                            </h3>
                        </div>
                        <span className="text-[11px] text-[#BC955B] font-semibold">Formato Oficial de Dictamen</span>
                    </div>

                    <form onSubmit={handleRegistrarAtencion} className="p-6 space-y-4">
                        {mensajeExito && (
                            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-lg text-xs font-bold flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> {mensajeExito}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Instancia que Reporta:</label>
                                <select
                                    value={instancia}
                                    onChange={(e) => setInstancia(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white font-medium outline-none focus:border-red-800"
                                >
                                    <option value="seder_juridico">Dirección Jurídica de la SEDER</option>
                                    <option value="cefppenay">CEFPPENAY</option>
                                    <option value="senasica">SENASICA</option>
                                    <option value="test_henry">Supervisión Técnica (Pruebas - Henry Hernández)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Nombre del Responsable:</label>
                                <input
                                    type="text"
                                    value={nombreResponsable}
                                    onChange={(e) => setNombreResponsable(e.target.value)}
                                    placeholder="Ej. Lic. Carlos Henson"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white font-medium outline-none focus:border-red-800"
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Número de Oficio o Referencia:</label>
                                <input
                                    type="text"
                                    value={oficioReferencia}
                                    onChange={(e) => setOficioReferencia(e.target.value)}
                                    placeholder="Ej. DJ-2026/089"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white font-medium outline-none focus:border-red-800"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-bold text-gray-700 mb-1 text-xs">
                                Acciones Realizadas, Dictamen o Atención Brindada:
                            </label>
                            <textarea
                                value={accionesTomadas}
                                onChange={(e) => setAccionesTomadas(e.target.value)}
                                rows={4}
                                required
                                placeholder="Especifique las medidas adoptadas, emplazamientos, requerimientos de subsanación o resoluciones correspondientes..."
                                className="w-full border border-gray-300 rounded-lg p-3 text-xs bg-white outline-none focus:border-red-800"
                            ></textarea>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                            <p className="text-[11px] text-gray-500">
                                Al registrar el seguimiento, quedará asentado con fecha, hora y sello de auditoría en la base de datos del SEIOT.
                            </p>
                            <button
                                type="submit"
                                disabled={guardandoAtencion}
                                className="w-full sm:w-auto px-6 py-2.5 bg-red-800 hover:bg-red-900 text-white rounded-lg font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Send size={15} /> {guardandoAtencion ? 'Guardando...' : 'Registrar Atención en SEIOT'}
                            </button>
                        </div>
                    </form>

                    {/* Historial de atenciones previas */}
                    {atenciones.length > 0 && (
                        <div className="border-t border-gray-200 bg-gray-50/60 p-6">
                            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
                                Historial de Atenciones Registradas ({atenciones.length})
                            </h4>
                            <div className="space-y-3">
                                {atenciones.map(at => (
                                    <div key={at.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs text-xs space-y-1.5">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="font-bold text-red-900">{at.instancia}</span>
                                            <span className="text-[11px] text-gray-500">
                                                {new Date(at.creado_en).toLocaleString('es-MX')}
                                            </span>
                                        </div>
                                        {(at.nombre_responsable || at.oficio_referencia) && (
                                            <p className="text-[11px] text-gray-600">
                                                {at.nombre_responsable && <span>Por: <strong>{at.nombre_responsable}</strong> </span>}
                                                {at.oficio_referencia && <span>| Oficio: <strong>{at.oficio_referencia}</strong></span>}
                                            </p>
                                        )}
                                        <p className="text-gray-800 pt-1 leading-relaxed whitespace-pre-wrap">{at.acciones_tomadas}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SeguimientoExpediente;
