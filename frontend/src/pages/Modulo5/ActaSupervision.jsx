import { apiFetch } from '../../utils/api.js';
import React, { useState, useEffect } from 'react';
import { Save, ChevronRight, ChevronLeft, FileText, Home, Download, FolderOpen, Pencil, Lock} from 'lucide-react';
import BotonSubirFirmado from '../../components/BotonSubirFirmado';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoGobierno from '../../assets/logo-gobierno.jpg';
import { generarPdfModulo5 } from '../../utils/generarPdfModulo5';

const InputBloqueFix = ({ labelSide, labelTop, valor, onChange, disabled = false, tipo = "text", placeholder, puedeEditar = false }) => {
    const [desbloqueado, setDesbloqueado] = React.useState(false);
    const bloqueado = disabled && !desbloqueado;
    const esVacio = bloqueado && (!valor || valor === 'null' || valor === 'NULL' || String(valor).trim() === '');
    return (
    <div className="mb-3">
        {labelTop && <label className="block text-xs font-bold text-indigo-700 mb-1 uppercase">{labelTop}</label>}
        <div className="flex border border-gray-300 rounded overflow-hidden shadow-sm w-full">
            <span className="bg-indigo-600 text-white text-[11px] font-bold p-2 min-w-[128px] flex items-center whitespace-nowrap">{labelSide}</span>
            <input type={tipo} className={`w-full p-2 text-sm outline-none ${bloqueado ? (esVacio ? 'bg-red-50 text-red-400 italic' : 'bg-gray-100 text-gray-700 font-bold') : 'bg-white'}`} value={esVacio ? '' : valor} onChange={onChange} disabled={bloqueado} placeholder={esVacio ? 'NO HAY DATOS' : (placeholder || (bloqueado ? 'SE PRECARGA' : 'SE CAPTURA'))} />
            {disabled && puedeEditar && (
                <button onClick={() => setDesbloqueado(!desbloqueado)} title={desbloqueado ? 'Bloquear' : 'Editar'} className={`px-2 flex items-center ${desbloqueado ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {desbloqueado ? <Lock size={14} /> : <Pencil size={14} />}
                </button>
            )}
        </div>
    </div>
    );
};


const ActaSupervision = () => {
    const navigate = useNavigate();
    const { usuario } = useAuth();
    const puedeDescargar = usuario?.es_admin || usuario?.permisos?.descargar_pdfs;
    const puedeEditar = usuario?.es_admin || usuario?.permisos?.editar_campos;
    const soloVista = usuario?.rol === 'vista';
    const puedeAcceder = usuario?.es_admin || usuario?.permisos?.modulo5 || usuario?.rol === 'vista';
    const [pagina, setPagina] = useState(1);
    const [cargando, setCargando] = useState(true);

    const [contexto] = useState(() => {
        const guardado = localStorage.getItem('visitaActiva');
        return guardado ? JSON.parse(guardado) : null;
    });

    // Página 1
    const [actaNo, setActaNo] = useState("");
    const [hora, setHora] = useState("");
    const [tipoPsg, setTipoPsg] = useState(contexto?.datosPsg?.tipo_psg || "");
    const [domicilio, setDomicilio] = useState(contexto?.datosPsg?.domicilio || "");
    const [telefono, setTelefono] = useState(contexto?.datosPsg?.telefono || "");

    // Página 2
    const [horaInicio, setHoraInicio] = useState("");
    const [horaTermino, setHoraTermino] = useState("");
    const [actaHechos, setActaHechos] = useState(false);
    const [otrosDocumentos, setOtrosDocumentos] = useState("");
    const [conclusion, setConclusion] = useState("");

    // Página 3
    const [observacionesDetectadas, setObservacionesDetectadas] = useState("");
    const [medidasPreventivas, setMedidasPreventivas] = useState("");
    const [noRealizo, setNoRealizo] = useState(false);
    const [manifestaciones, setManifestaciones] = useState("");

    // Página 4
    const [nombreTestigo, setNombreTestigo] = useState("");
    const [domicilioTestigo, setDomicilioTestigo] = useState("");
    const [tipoIdTestigo, setTipoIdTestigo] = useState("");
    const [numeroIdTestigo, setNumeroIdTestigo] = useState("");

    // ── BORRADOR .smpbk ──────────────────────────────────────────────────────

    // ── CARGAR DATOS GUARDADOS EN BD ─────────────────────────────────────────
    useEffect(() => {
        if (!contexto?.visita_id) { setCargando(false); return; }

        const cargarDatos = async () => {
            try {
                const response = await apiFetch(`/api/modulos/modulo5/${contexto.visita_id}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.existe && data.datos) {
                        const d = data.datos;
                        if (d.acta_no) setActaNo(d.acta_no);
                        if (d.hora) setHora(d.hora);
                        if (d.tipo_psg) setTipoPsg(d.tipo_psg);
                        if (d.domicilio) setDomicilio(d.domicilio);
                        if (d.telefono) setTelefono(d.telefono);
                        if (d.hora_inicio) setHoraInicio(d.hora_inicio);
                        if (d.hora_termino) setHoraTermino(d.hora_termino);
                        if (d.acta_hechos !== undefined) setActaHechos(d.acta_hechos);
                        if (d.otros_documentos) setOtrosDocumentos(d.otros_documentos);
                        if (d.cumple) setConclusion('cumple');
                        else if (d.presenta_observaciones) setConclusion('observaciones');
                        else if (d.requiere_seguimiento) setConclusion('seguimiento');
                        if (d.observaciones_detectadas) setObservacionesDetectadas(d.observaciones_detectadas);
                        if (d.medidas_preventivas) setMedidasPreventivas(d.medidas_preventivas);
                        if (d.no_realizo_manifestaciones !== undefined) setNoRealizo(d.no_realizo_manifestaciones);
                        if (d.manifestaciones) setManifestaciones(d.manifestaciones);
                        if (d.nombre_testigo) setNombreTestigo(d.nombre_testigo);
                        if (d.domicilio_testigo) setDomicilioTestigo(d.domicilio_testigo);
                        if (d.tipo_id_testigo) setTipoIdTestigo(d.tipo_id_testigo);
                        if (d.numero_id_testigo) setNumeroIdTestigo(d.numero_id_testigo);
                    }
                }
            } catch (error) {
                console.error('Error cargando datos módulo 5:', error);
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
    }, []);

    const guardarBorrador = () => {
        const borrador = {
            modulo: 5, visita_id: contexto.visita_id, folio: contexto.folio,
            campos: { actaNo, hora, tipoPsg, domicilio, telefono, horaInicio, horaTermino,
                      actaHechos, otrosDocumentos, conclusion, observacionesDetectadas,
                      medidasPreventivas, noRealizo, manifestaciones,
                      nombreTestigo, domicilioTestigo, tipoIdTestigo, numeroIdTestigo }
        };
        const blob = new Blob([JSON.stringify(borrador)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `modulo5_${contexto.folio.replace(/\//g, '-')}.smpbk`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const cargarBorrador = (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const b = JSON.parse(ev.target.result);
                if (b.modulo !== 5) { alert('Este borrador no es del Módulo 5.'); return; }
                if (b.visita_id !== contexto.visita_id) { alert('Este borrador es de otra visita.'); return; }
                const c = b.campos;
                if (c.actaNo !== undefined) setActaNo(c.actaNo);
                if (c.hora !== undefined) setHora(c.hora);
                if (c.tipoPsg !== undefined) setTipoPsg(c.tipoPsg);
                if (c.domicilio !== undefined) setDomicilio(c.domicilio);
                if (c.telefono !== undefined) setTelefono(c.telefono);
                if (c.horaInicio !== undefined) setHoraInicio(c.horaInicio);
                if (c.horaTermino !== undefined) setHoraTermino(c.horaTermino);
                if (c.actaHechos !== undefined) setActaHechos(c.actaHechos);
                if (c.otrosDocumentos !== undefined) setOtrosDocumentos(c.otrosDocumentos);
                if (c.conclusion !== undefined) setConclusion(c.conclusion);
                if (c.observacionesDetectadas !== undefined) setObservacionesDetectadas(c.observacionesDetectadas);
                if (c.medidasPreventivas !== undefined) setMedidasPreventivas(c.medidasPreventivas);
                if (c.noRealizo !== undefined) setNoRealizo(c.noRealizo);
                if (c.manifestaciones !== undefined) setManifestaciones(c.manifestaciones);
                if (c.nombreTestigo !== undefined) setNombreTestigo(c.nombreTestigo);
                if (c.domicilioTestigo !== undefined) setDomicilioTestigo(c.domicilioTestigo);
                if (c.tipoIdTestigo !== undefined) setTipoIdTestigo(c.tipoIdTestigo);
                if (c.numeroIdTestigo !== undefined) setNumeroIdTestigo(c.numeroIdTestigo);
                alert('✅ Borrador cargado correctamente.');
            } catch { alert('Archivo inválido.'); }
        };
        reader.readAsText(archivo);
        e.target.value = '';
    };

    useEffect(() => {
        if (!puedeAcceder) {
            alert("No tienes permiso para acceder a este módulo.");
            navigate('/dashboard');
            return;
        }
        if (!contexto) {
            alert("Primero debes iniciar una visita en el Dashboard.");
            navigate('/dashboard');
        }
    }, [contexto, navigate]);

    const handleGuardar = async () => {
        try {
            const response = await apiFetch('/api/modulos/modulo5', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visita_id: contexto.visita_id,
                    acta_no: actaNo,
                    fecha: contexto.fecha,
                    hora,
                    hora_inicio: horaInicio,
                    hora_termino: horaTermino,
                    acta_hechos: actaHechos,
                    otros_documentos: otrosDocumentos,
                    cumple: conclusion === 'cumple',
                    presenta_observaciones: conclusion === 'observaciones',
                    requiere_seguimiento: conclusion === 'seguimiento',
                    observaciones_detectadas: observacionesDetectadas,
                    medidas_preventivas: medidasPreventivas,
                    no_realizo_manifestaciones: noRealizo,
                    manifestaciones,
                    localidad: datosPsg.localidad,
                    municipio: datosPsg.municipio,
                    nombre_psg: datosPsg.nombre_titular,
                    tipo_psg: tipoPsg,
                    nombre_titular: datosPsg.representante || "",
                    domicilio,
                    telefono,
                    nombre_supervisor: contexto?.datosSupervisor?.nombre || supervisor,
                    nombre_testigo: nombreTestigo,
                    domicilio_testigo: domicilioTestigo,
                    tipo_id_testigo: tipoIdTestigo,
                    numero_id_testigo: numeroIdTestigo
                })
            });
            if (!response.ok) { alert("Error al guardar."); return; }
            const contextoActualizado = { ...contexto, avance: { ...contexto.avance, modulo5: true } };
            localStorage.setItem('visitaActiva', JSON.stringify(contextoActualizado));
            alert("¡Acta de Supervisión Guardada!\nEl último módulo ha sido desbloqueado.");
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            alert("Error de conexión al guardar.");
        }
    };

    if (!contexto) return null;
    if (cargando) return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <p className="text-gray-500 font-bold animate-pulse">Cargando datos...</p>
        </div>
    );
    const { folio, datosPsg, supervisor, fecha } = contexto;

    return (
        <div className="min-h-screen bg-gray-100 p-6 font-sans text-gray-800">

            <div className="max-w-6xl mx-auto bg-white rounded-t-xl shadow-sm p-6 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <img src={logoGobierno} alt="Logo Gobierno" className="h-16 object-contain" />
                    <div className="border-l-2 border-gray-300 pl-4 hidden md:block">
                        <h2 className="text-gray-500 font-bold text-xs tracking-widest uppercase">Secretaría de</h2>
                        <h1 className="text-red-900 font-bold text-lg uppercase">Desarrollo Rural</h1>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="font-bold text-gray-800 text-sm md:text-lg">SISTEMA ESTATAL DE INFORMACIÓN DE ORIGEN Y TRAZABILIDAD PECUARIA (SEIOT)</h2>
                </div>
            </div>

            <div className="max-w-6xl mx-auto bg-gray-50 p-4 border-x border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center shadow-inner">
                <div className="bg-white text-indigo-600 px-6 py-2 rounded-full font-bold shadow flex items-center gap-2 border-4 border-indigo-200">
                    <FileText size={20} /> FORMATO DE ACTA DE SUPERVISIÓN
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="flex-1 md:flex-none border-2 border-gray-500 rounded-full px-4 py-1 bg-white text-center flex items-center gap-2">
                        <span className="font-bold text-red-900 uppercase">PSG:</span>
                        <span className="font-bold text-gray-800">{datosPsg.psg}</span>
                    </div>
                    <div className="flex-1 md:flex-none border-2 border-gray-500 rounded-full px-4 py-1 bg-white text-center flex items-center gap-2">
                        <span className="font-bold text-red-900 uppercase">VISITA:</span>
                        <span className="font-bold text-gray-800">{folio}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto bg-white shadow-xl p-8 border border-gray-200 min-h-[500px]">

                {/* PÁGINA 1 */}
                {pagina === 1 && (
                    <div className="animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                            <div>
                                <InputBloqueFix labelTop="(1) No. de Acta :" labelSide="Acta No.:" valor={actaNo} onChange={(e) => setActaNo(e.target.value)} />
                                <InputBloqueFix labelTop="(2) Expediente :" labelSide="Expediente No.:" valor={folio} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloqueFix labelTop="(3) Localidad :" labelSide="Localidad :" valor={datosPsg.localidad} disabled={true} puedeEditar={puedeEditar} />
                            </div>
                            <div>
                                <InputBloqueFix labelTop="(4) Municipio :" labelSide="Municipio :" valor={datosPsg.municipio} disabled={true} puedeEditar={puedeEditar} />
                                <div className="border-l-4 border-pink-600 pl-4 py-1 bg-pink-50/30 rounded-r mb-3">
                                    <label className="block text-[11px] font-bold text-pink-800 mb-1 uppercase">Fecha y Hora :</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <InputBloqueFix labelSide="Fecha :" valor={fecha} disabled={true} puedeEditar={puedeEditar} />
                                        <InputBloqueFix labelSide="Hora :" tipo="time" valor={hora} onChange={(e) => setHora(e.target.value)} />
                                    </div>
                                </div>
                                <InputBloqueFix labelTop="(6) Servidor Público :" labelSide="Nombre:" valor={contexto?.datosSupervisor?.nombre || supervisor} disabled={true} puedeEditar={puedeEditar} />
                            </div>
                        </div>

                        <h3 className="text-indigo-600 font-bold text-center text-lg mt-6 mb-4 uppercase">I. DATOS DEL SUJETO SUPERVISADO</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                            <div>
                                <InputBloqueFix labelTop="(7) Nombre del PSG :" labelSide="Nombre PSG :" valor={datosPsg.nombre_titular} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloqueFix labelTop="(8) Tipo de PSG :" labelSide="Tipo PSG :" valor={tipoPsg} onChange={(e) => setTipoPsg(e.target.value)} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloqueFix labelTop="(9) Nombre del Titular o Representante :" labelSide="Nombre :" valor={datosPsg.representante || ""} disabled={true} puedeEditar={puedeEditar} />
                            </div>
                            <div>
                                <InputBloqueFix labelTop="(10) Domicilio del Establecimiento :" labelSide="Domicilio :" valor={domicilio} onChange={(e) => setDomicilio(e.target.value)} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloqueFix labelTop="(11) Teléfono :" labelSide="Teléfono:" valor={telefono} onChange={(e) => setTelefono(e.target.value)} disabled={true} puedeEditar={puedeEditar} />
                            </div>
                        </div>
                    </div>
                )}

                {/* PÁGINA 2 */}
                {pagina === 2 && (
                    <div className="animate-fade-in space-y-6">
                        <h3 className="text-indigo-600 font-bold text-center text-lg uppercase">II. DATOS DE LA SUPERVISIÓN</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                            <div>
                                <InputBloqueFix labelTop="(12) Fecha de Supervisión :" labelSide="Fecha :" valor={fecha} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloqueFix labelTop="(13) Hora de Inicio :" labelSide="Hora de Inicio :" tipo="time" valor={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
                            </div>
                            <div>
                                <InputBloqueFix labelTop="(14) Hora de Término :" labelSide="Hora Término :" tipo="time" valor={horaTermino} onChange={(e) => setHoraTermino(e.target.value)} />
                                <InputBloqueFix labelTop="(15) Personal supervisor :" labelSide="Nombre:" valor={contexto?.datosSupervisor?.nombre || supervisor} disabled={true} puedeEditar={puedeEditar} />
                            </div>
                        </div>

                        <h3 className="text-indigo-600 font-bold text-center text-lg uppercase mt-4">III. DOCUMENTOS E INSTRUMENTOS APLICADOS</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 items-center">
                            <div className="flex items-center gap-3">
                                <span className="bg-indigo-600 text-white text-xs font-bold p-2 rounded">(16) Acta de Hechos :</span>
                                <input type="checkbox" checked={actaHechos} onChange={(e) => setActaHechos(e.target.checked)} className="w-5 h-5 cursor-pointer" />
                            </div>
                            <InputBloqueFix labelTop="(17) Otros documentos :" labelSide="Especificar :" valor={otrosDocumentos} onChange={(e) => setOtrosDocumentos(e.target.value)} />
                        </div>

                        <h3 className="text-indigo-600 font-bold text-center text-lg uppercase mt-4">IV. RESULTADO DE LA SUPERVISIÓN</h3>
                        <label className="block text-xs font-bold text-indigo-700 mb-2 uppercase">(18) Resultado general:</label>
                        <div className="flex flex-wrap gap-4 justify-between bg-indigo-50 p-4 rounded border border-indigo-200 font-bold text-sm">
                            <label htmlFor="conclusion-cumple-m5" className="flex items-center gap-2 cursor-pointer">
                                <input id="conclusion-cumple-m5" type="radio" name="conclusion" value="cumple" checked={conclusion === 'cumple'} onChange={(e) => setConclusion(e.target.value)} className="w-4 h-4" /> Cumple
                            </label>
                            <label htmlFor="conclusion-observaciones-m5" className="flex items-center gap-2 cursor-pointer">
                                <input id="conclusion-observaciones-m5" type="radio" name="conclusion" value="observaciones" checked={conclusion === 'observaciones'} onChange={(e) => setConclusion(e.target.value)} className="w-4 h-4" /> Presenta Observaciones
                            </label>
                            <label htmlFor="conclusion-seguimiento-m5" className="flex items-center gap-2 cursor-pointer">
                                <input id="conclusion-seguimiento-m5" type="radio" name="conclusion" value="seguimiento" checked={conclusion === 'seguimiento'} onChange={(e) => setConclusion(e.target.value)} className="w-4 h-4" /> Requiere Seguimiento
                            </label>
                        </div>
                    </div>
                )}

                {/* PÁGINA 3 */}
                {pagina === 3 && (
                    <div className="animate-fade-in space-y-6">
                        <h3 className="text-indigo-600 font-bold text-center text-lg uppercase">V. DESCRIPCIÓN DE OBSERVACIONES (CUANDO APLIQUE)</h3>
                        <div>
                            <label className="block text-xs font-bold text-indigo-700 mb-1 uppercase">(19) Observaciones Detectadas Durante la Supervisión:</label>
                            <div className="flex border border-gray-300 rounded overflow-hidden h-32">
                                <span className="bg-indigo-600 text-white text-xs font-bold p-2 w-32 flex flex-col justify-center text-center">Observaciones<br/>Detectadas :</span>
                                <textarea value={observacionesDetectadas} onChange={(e) => setObservacionesDetectadas(e.target.value)} className="w-full p-2 text-sm outline-none resize-none"></textarea>
                            </div>
                        </div>

                        <h3 className="text-indigo-600 font-bold text-center text-lg uppercase mt-4">VI. MEDIDAS PREVENTIVAS O RECOMENDACIONES (CUANDO APLIQUE)</h3>
                        <div>
                            <label className="block text-xs font-bold text-indigo-700 mb-1 uppercase">(20) Medidas Preventivas o Recomendaciones :</label>
                            <div className="flex border border-gray-300 rounded overflow-hidden h-32">
                                <span className="bg-indigo-600 text-white text-xs font-bold p-2 w-32 flex flex-col justify-center text-center">Medidas<br/>Preventivas :</span>
                                <textarea value={medidasPreventivas} onChange={(e) => setMedidasPreventivas(e.target.value)} className="w-full p-2 text-sm outline-none resize-none"></textarea>
                            </div>
                        </div>

                        <h3 className="text-indigo-600 font-bold text-center text-lg uppercase mt-4">VII. MANIFESTACIONES DEL SUPERVISADO</h3>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-indigo-600 text-white text-xs font-bold p-2 w-32 text-center rounded-l">No Realizó<br/>Manifestaciones:</span>
                            <input type="checkbox" checked={noRealizo} onChange={(e) => setNoRealizo(e.target.checked)} className="w-5 h-5 border-gray-300 cursor-pointer" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-indigo-700 mb-1 uppercase">(21) El Titular o Representante del PSG Manifestó lo Siguiente:</label>
                            <div className="flex border border-gray-300 rounded overflow-hidden h-24">
                                <span className="bg-indigo-600 text-white text-xs font-bold p-2 w-32 flex flex-col justify-center text-center">Manifestaciones:</span>
                                <textarea value={manifestaciones} onChange={(e) => setManifestaciones(e.target.value)} className="w-full p-2 text-sm outline-none resize-none"></textarea>
                            </div>
                        </div>
                    </div>
                )}

                {/* PÁGINA 4 */}
                {pagina === 4 && (
                    <div className="animate-fade-in space-y-6">
                        <h3 className="text-indigo-600 font-bold text-center text-lg uppercase">VI. CIERRE DEL ACTA</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                            <div>
                                <InputBloqueFix labelTop="(22) Nombre del Supervisor:" labelSide="Nombre del Supervisor:" valor={contexto?.datosSupervisor?.nombre || supervisor} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloqueFix labelTop="(23) Nombre del Responsable del PSG :" labelSide="Nombre PSG:" valor={datosPsg.nombre_titular} disabled={true} puedeEditar={puedeEditar} />
                            </div>
                            <div>
                                <InputBloqueFix labelTop="(24) Nombre del Testigo :" labelSide="Nombre del Testigo :" valor={nombreTestigo} onChange={(e) => setNombreTestigo(e.target.value)} />
                                <InputBloqueFix labelTop="Domicilio del Testigo :" labelSide="Domicilio del Testigo :" valor={domicilioTestigo} onChange={(e) => setDomicilioTestigo(e.target.value)} />
                                <InputBloqueFix labelTop="Tipo de Identificación del Testigo :" labelSide="Tipo de Identificación :" valor={tipoIdTestigo} onChange={(e) => setTipoIdTestigo(e.target.value)} />
                                <InputBloqueFix labelTop="Número de Identificación del Testigo:" labelSide="Número de Identificación :" valor={numeroIdTestigo} onChange={(e) => setNumeroIdTestigo(e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="max-w-6xl mx-auto mt-6 flex justify-between items-center bg-white p-4 rounded-b-xl shadow-md border border-gray-200">
                <div className="flex gap-2 items-center">
                    {/* Casita - siempre visible */}
                    <button onClick={() => navigate('/dashboard')} className="bg-red-700 text-white p-2 rounded-full shadow hover:bg-red-800 transition-colors">
                        <Home size={22} />
                    </button>
                    {pagina === 4 && (
                        <>
                            {!soloVista && <>
                            <button onClick={guardarBorrador} className="bg-yellow-500 text-white px-4 py-2 rounded-full shadow hover:bg-yellow-600 flex items-center gap-2 text-xs font-bold">
                                <Save size={16} /> BORRADOR
                            </button>
                            <label className="bg-purple-600 text-white px-4 py-2 rounded-full shadow hover:bg-purple-700 flex items-center gap-2 text-xs font-bold cursor-pointer">
                                <FolderOpen size={16} /> CARGAR
                                <input type="file" accept=".smpbk" className="hidden" onChange={cargarBorrador} />
                            </label>
                            </>}
                            {puedeDescargar && !soloVista && <button
                                onClick={() => generarPdfModulo5({
                                    acta_no: actaNo,
                                    folio,
                                    localidad: datosPsg.localidad,
                                    municipio: datosPsg.municipio,
                                    hora, fecha,
                                    nombre_supervisor: contexto?.datosSupervisor?.nombre || supervisor,
                                    nombre_psg: datosPsg.nombre_titular,
                                    tipo_psg: tipoPsg,
                                    nombre_titular: datosPsg.representante || '',
                                    domicilio, telefono,
                                    hora_inicio: horaInicio,
                                    hora_termino: horaTermino,
                                    acta_hechos: actaHechos,
                                    otros_documentos: otrosDocumentos,
                                    cumple: conclusion === 'cumple',
                                    presenta_observaciones: conclusion === 'observaciones',
                                    requiere_seguimiento: conclusion === 'seguimiento',
                                    observaciones_detectadas: observacionesDetectadas,
                                    medidas_preventivas: medidasPreventivas,
                                    no_realizo_manifestaciones: noRealizo,
                                    manifestaciones,
                                    nombre_testigo: nombreTestigo
                                })}
                                className="bg-blue-600 text-white px-4 py-2 rounded-full shadow hover:bg-blue-700 flex items-center gap-2 text-xs font-bold"
                            >
                                <Download size={16} /> DESCARGAR ACTA PRELLENADA
                            </button>}
                            <BotonSubirFirmado visita_id={contexto.visita_id} modulo={5} />
                        </>
                    )}
                </div>

                <div className="flex gap-4 items-center">
                    {pagina > 1 && (
                        <button onClick={() => setPagina(pagina - 1)} className="border-2 border-indigo-600 text-indigo-600 px-4 py-2 rounded-full hover:bg-indigo-50 flex items-center gap-2 text-sm font-bold transition-colors">
                            <ChevronLeft size={20} /> PÁGINA ANTERIOR
                        </button>
                    )}
                    {pagina < 4 ? (
                        <button onClick={() => setPagina(pagina + 1)} className="bg-indigo-600 text-white px-4 py-2 rounded-full shadow hover:bg-indigo-700 flex items-center gap-2 text-sm font-bold transition-transform active:scale-95">
                            PÁGINA SIGUIENTE <ChevronRight size={20} />
                        </button>
                    ) : (
                        !soloVista && <button onClick={handleGuardar} className="border-2 border-black text-black px-4 py-2 rounded flex items-center gap-2 shadow hover:bg-gray-100 font-bold text-xs">
                            <Save size={20} /> GUARDAR
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActaSupervision;