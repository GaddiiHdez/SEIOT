import { apiFetch } from '../../utils/api.js';
import React, { useState, useEffect } from 'react';
import { Save, ChevronRight, ChevronLeft, FileText, Home, Download, FolderOpen, Pencil, Lock, CheckSquare } from 'lucide-react';
import BotonSubirFirmado from '../../components/BotonSubirFirmado';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoGobierno from '../../assets/logo-gobierno.jpg';
import { generarPdfModulo4 } from '../../utils/generarPdfModulo4';

const InputBloque = ({ labelSide, labelTop, valor, onChange, disabled = false, tipo = "text", placeholder, puedeEditar = false }) => {
    const [desbloqueado, setDesbloqueado] = React.useState(false);
    const bloqueado = disabled && !desbloqueado;
    const esVacio = bloqueado && (!valor || valor === 'null' || valor === 'NULL' || String(valor).trim() === '');
    return (
    <div className="mb-3">
        {labelTop && <label className="block text-xs font-bold text-pink-700 mb-1 uppercase">{labelTop}</label>}
        <div className="flex border border-gray-300 rounded overflow-hidden shadow-sm w-full">
            <span className="bg-pink-600 text-white text-[11px] font-bold p-2 min-w-[128px] flex items-center whitespace-nowrap">{labelSide}</span>
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

const ActaHechos = () => {
    const navigate = useNavigate();
    const { usuario } = useAuth();
    const puedeDescargar = usuario?.es_admin || usuario?.permisos?.descargar_pdfs;
    const puedeEditar = usuario?.es_admin || usuario?.permisos?.editar_campos;
    const soloVista = usuario?.rol === 'vista';
    const puedeAcceder = usuario?.es_admin || usuario?.permisos?.modulo4 || usuario?.rol === 'vista';
    const [pagina, setPagina] = useState(1);
    const [cargando, setCargando] = useState(true);

    const [contexto] = useState(() => {
        const guardado = localStorage.getItem('visitaActiva');
        return guardado ? JSON.parse(guardado) : null;
    });

    const [actaNo, setActaNo] = useState("");
    const [fecha, setFecha] = useState(contexto?.fecha || "");
    const [hora, setHora] = useState("");
    const [tipoPsg, setTipoPsg] = useState(contexto?.datosPsg?.tipo_psg || "");
    const [telefono, setTelefono] = useState(contexto?.datosPsg?.telefono || "");
    const [domicilio, setDomicilio] = useState(contexto?.datosPsg?.domicilio || "");
    const [horaInicio, setHoraInicio] = useState("");
    const [horaTermino, setHoraTermino] = useState("");
    const [hechosObservados, setHechosObservados] = useState("");
    const [noRealizo, setNoRealizo] = useState(false);
    const [manifestaciones, setManifestaciones] = useState("");
    const [nombreTestigo, setNombreTestigo] = useState("");
    const [tipoIdTestigo, setTipoIdTestigo] = useState("");
    const [domicilioTestigo, setDomicilioTestigo] = useState("");
    const [numeroIdTestigo, setNumeroIdTestigo] = useState("");
    const [nombreTestigoCierre, setNombreTestigoCierre] = useState("");

    // ── CARGAR DATOS GUARDADOS EN BD ─────────────────────────────────────────
    useEffect(() => {
        if (!contexto?.visita_id) { setCargando(false); return; }

        const cargarDatos = async () => {
            try {
                const response = await apiFetch(`/api/modulos/modulo4/${contexto.visita_id}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.existe && data.datos) {
                        const d = data.datos;
                        if (d.acta_no) setActaNo(d.acta_no);
                        if (d.fecha) setFecha(new Date(d.fecha).toLocaleDateString('es-MX'));
                        if (d.hora) setHora(d.hora);
                        if (d.tipo_psg) setTipoPsg(d.tipo_psg);
                        if (d.telefono) setTelefono(d.telefono);
                        if (d.domicilio) setDomicilio(d.domicilio);
                        if (d.hora_inicio) setHoraInicio(d.hora_inicio);
                        if (d.hora_termino) setHoraTermino(d.hora_termino);
                        if (d.hechos_observados) setHechosObservados(d.hechos_observados);
                        if (d.no_realizo_manifestaciones !== undefined) setNoRealizo(d.no_realizo_manifestaciones);
                        if (d.manifestaciones) setManifestaciones(d.manifestaciones);
                        if (d.nombre_testigo) setNombreTestigo(d.nombre_testigo);
                        if (d.tipo_id_testigo) setTipoIdTestigo(d.tipo_id_testigo);
                        if (d.domicilio_testigo) setDomicilioTestigo(d.domicilio_testigo);
                        if (d.numero_id_testigo) setNumeroIdTestigo(d.numero_id_testigo);
                        if (d.nombre_testigo_cierre) setNombreTestigoCierre(d.nombre_testigo_cierre);
                    } else {
                        // Jalar datos del Modulo 3 si no existe registro
                        const responseM3 = await apiFetch(`/api/modulos/modulo3/${contexto.visita_id}`);
                        if (responseM3.ok) {
                            const dataM3 = await responseM3.json();
                            if (dataM3.existe && dataM3.datos) {
                                const d3 = dataM3.datos;
                                if (d3.fecha) setFecha(new Date(d3.fecha).toLocaleDateString('es-MX'));
                                if (d3.hora_inicio) {
                                    setHoraInicio(d3.hora_inicio);
                                    setHora(d3.hora_inicio);
                                }
                                if (d3.hora_termino) setHoraTermino(d3.hora_termino);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error cargando datos módulo 4:', error);
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
    }, [contexto?.visita_id]);

    // ── BORRADOR .smpbk ──────────────────────────────────────────────────────
    const guardarBorrador = () => {
        const borrador = {
            modulo: 4, visita_id: contexto.visita_id, folio: contexto.folio,
            campos: { actaNo, hora, tipoPsg, telefono, domicilio, horaInicio, horaTermino,
                      hechosObservados, noRealizo, manifestaciones,
                      nombreTestigo, tipoIdTestigo, domicilioTestigo, numeroIdTestigo, nombreTestigoCierre }
        };
        const blob = new Blob([JSON.stringify(borrador)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `modulo4_${contexto.folio.replace(/\//g, '-')}.smpbk`;
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
                if (b.modulo !== 4) { alert('Este borrador no es del Módulo 4.'); return; }
                if (b.visita_id !== contexto.visita_id) { alert('Este borrador es de otra visita.'); return; }
                const c = b.campos;
                if (c.actaNo !== undefined) setActaNo(c.actaNo);
                if (c.hora !== undefined) setHora(c.hora);
                if (c.tipoPsg !== undefined) setTipoPsg(c.tipoPsg);
                if (c.telefono !== undefined) setTelefono(c.telefono);
                if (c.domicilio !== undefined) setDomicilio(c.domicilio);
                if (c.horaInicio !== undefined) setHoraInicio(c.horaInicio);
                if (c.horaTermino !== undefined) setHoraTermino(c.horaTermino);
                if (c.hechosObservados !== undefined) setHechosObservados(c.hechosObservados);
                if (c.noRealizo !== undefined) setNoRealizo(c.noRealizo);
                if (c.manifestaciones !== undefined) setManifestaciones(c.manifestaciones);
                if (c.nombreTestigo !== undefined) setNombreTestigo(c.nombreTestigo);
                if (c.tipoIdTestigo !== undefined) setTipoIdTestigo(c.tipoIdTestigo);
                if (c.domicilioTestigo !== undefined) setDomicilioTestigo(c.domicilioTestigo);
                if (c.numeroIdTestigo !== undefined) setNumeroIdTestigo(c.numeroIdTestigo);
                if (c.nombreTestigoCierre !== undefined) setNombreTestigoCierre(c.nombreTestigoCierre);
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

    const handleFinalizarVisita = async () => {
        try {
            // Guardar los datos del Módulo 4 primero
            const saveResponse = await apiFetch('/api/modulos/modulo4', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visita_id: contexto.visita_id,
                    acta_no: actaNo,
                    fecha: fecha,
                    hora,
                    hora_inicio: horaInicio,
                    hora_termino: horaTermino,
                    hechos_observados: hechosObservados,
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
                    numero_id_testigo: numeroIdTestigo,
                    nombre_testigo_cierre: nombreTestigoCierre
                })
            });

            if (!saveResponse.ok) {
                alert("Error al guardar los datos del acta de hechos.");
                return;
            }

            // Marcar la visita como finalizada en la BD
            const finalizeResponse = await apiFetch(`/api/psg/visitas/finalizar/${contexto.visita_id}`, {
                method: 'POST'
            });

            if (!finalizeResponse.ok) {
                alert("Error al finalizar la visita.");
                return;
            }

            // Actualizar contexto local para indicar el cambio de estado
            const contextoActualizado = { 
                ...contexto, 
                estado_visita: 'finalizado',
                avance: { ...contexto.avance, modulo4: true } 
            };
            localStorage.setItem('visitaActiva', JSON.stringify(contextoActualizado));
            
            alert("¡Visita Finalizada Exitosamente!\nLa visita ha sido registrada como concluida.");
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            alert("Error de conexión al finalizar la visita.");
        }
    };

    const handleGuardar = async () => {
        try {
            const response = await apiFetch('/api/modulos/modulo4', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visita_id: contexto.visita_id,
                    acta_no: actaNo,
                    fecha: fecha,
                    hora,
                    hora_inicio: horaInicio,
                    hora_termino: horaTermino,
                    hechos_observados: hechosObservados,
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
                    numero_id_testigo: numeroIdTestigo,
                    nombre_testigo_cierre: nombreTestigoCierre
                })
            });
            if (!response.ok) { alert("Error al guardar."); return; }
            const contextoActualizado = { ...contexto, avance: { ...contexto.avance, modulo4: true } };
            localStorage.setItem('visitaActiva', JSON.stringify(contextoActualizado));
            alert("¡Acta de Hechos Guardada!\nEl siguiente módulo ha sido desbloqueado.");
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

    const { folio, datosPsg, supervisor } = contexto;

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
                <div className="bg-white text-pink-600 px-6 py-2 rounded-full font-bold shadow flex items-center gap-2 border-4 border-pink-200">
                    <FileText size={20} /> FORMATO DE ACTA DE HECHOS
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="flex-1 border-2 border-gray-500 rounded-full px-4 py-1 bg-white text-center flex items-center gap-2">
                        <span className="font-bold text-red-900 uppercase">PSG:</span>
                        <span className="font-bold text-gray-800">{datosPsg.psg}</span>
                    </div>
                    <div className="flex-1 border-2 border-gray-500 rounded-full px-4 py-1 bg-white text-center flex items-center gap-2">
                        <span className="font-bold text-red-900 uppercase">VISITA:</span>
                        <span className="font-bold text-gray-800">{folio}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto bg-white shadow-xl p-8 border border-gray-200 min-h-[500px]">

                {pagina === 1 && (
                    <div className="animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                            <div>
                                <InputBloque labelTop="(1) No. de Acta :" labelSide="Acta No.:" valor={actaNo} onChange={(e) => setActaNo(e.target.value)} />
                                <InputBloque labelTop="(2) Expediente :" labelSide="Expediente No.:" valor={folio} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloque labelTop="(3) Localidad :" labelSide="Localidad :" valor={datosPsg.localidad} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloque labelTop="(4) Municipio :" labelSide="Municipio :" valor={datosPsg.municipio} disabled={true} puedeEditar={puedeEditar} />
                            </div>
                            <div>
                                <div className="border-l-4 border-pink-600 pl-4 py-1 bg-pink-50/30 rounded-r mb-3">
                                    <label className="block text-[11px] font-bold text-pink-800 mb-1 uppercase">(5) Fecha y Hora :</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <InputBloque labelSide="Fecha :" valor={fecha} disabled={true} puedeEditar={puedeEditar} />
                                        <InputBloque labelSide="Hora :" tipo="time" valor={hora} onChange={(e) => setHora(e.target.value)} />
                                    </div>
                                </div>
                                <InputBloque labelTop="(6) Servidor Público :" labelSide="Nombre:" valor={contexto?.datosSupervisor?.nombre || supervisor} disabled={true} puedeEditar={puedeEditar} />
                            </div>
                        </div>

                        <h3 className="text-pink-600 font-bold text-center text-lg mt-6 mb-4 uppercase">I. DATOS GENERALES DEL SUJETO SUPERVISADO:</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                            <div>
                                <InputBloque labelTop="(7) Nombre del PSG :" labelSide="Nombre PSG :" valor={datosPsg.nombre_titular} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloque labelTop="(8) Tipo de PSG :" labelSide="Tipo PSG :" valor={tipoPsg} onChange={(e) => setTipoPsg(e.target.value)} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloque labelTop="(9) Nombre del Titular o Representante :" labelSide="Nombre :" valor={datosPsg.representante || ""} disabled={true} puedeEditar={puedeEditar} />
                            </div>
                            <div>
                                <InputBloque labelTop="(10) Domicilio del Establecimiento :" labelSide="Domicilio :" valor={domicilio} onChange={(e) => setDomicilio(e.target.value)} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloque labelTop="(11) Teléfono :" labelSide="Teléfono:" valor={telefono} onChange={(e) => setTelefono(e.target.value)} disabled={true} puedeEditar={puedeEditar} />
                            </div>
                        </div>
                    </div>
                )}

                {pagina === 2 && (
                    <div className="animate-fade-in space-y-6">
                        <h3 className="text-pink-600 font-bold text-center text-lg uppercase">II. DATOS DE LA SUPERVISIÓN</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                            <div>
                                <InputBloque labelTop="Fecha de Supervisión :" labelSide="Fecha :" valor={fecha} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloque labelTop="Hora Término :" labelSide="Hora Término :" tipo="time" valor={horaTermino} onChange={(e) => setHoraTermino(e.target.value)} />
                            </div>
                            <div>
                                <InputBloque labelTop="Hora de Inicio :" labelSide="Hora de Inicio :" tipo="time" valor={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
                                <InputBloque labelTop="Personal supervisor :" labelSide="Nombre:" valor={contexto?.datosSupervisor?.nombre || supervisor} disabled={true} puedeEditar={puedeEditar} />
                            </div>
                        </div>

                        <h3 className="text-pink-600 font-bold text-center text-lg uppercase mt-4">III. DESCRIPCIÓN DE LOS HECHOS</h3>
                        <div>
                            <label className="block text-xs font-bold text-orange-500 mb-1 uppercase">Hecho(s) observado(s):</label>
                            <div className="flex border border-gray-300 rounded overflow-hidden h-32">
                                <span className="bg-pink-600 text-white text-xs font-bold p-2 w-32 flex flex-col justify-center text-center uppercase">Hecho(s)<br/>Observado(s):</span>
                                <textarea value={hechosObservados} onChange={(e) => setHechosObservados(e.target.value)} className="w-full p-2 text-sm outline-none resize-none"></textarea>
                            </div>
                        </div>

                        <h3 className="text-pink-600 font-bold text-center text-lg uppercase mt-4">IV. MANIFESTACIONES DEL SUPERVISADO (SI LAS HUBIERE)</h3>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-pink-600 text-white text-xs font-bold p-2 w-32 text-center rounded-l uppercase">No Realizó<br/>Manifestaciones:</span>
                            <input type="checkbox" checked={noRealizo} onChange={(e) => setNoRealizo(e.target.checked)} className="w-5 h-5 border-gray-300 cursor-pointer" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-orange-500 mb-1 uppercase">El titular o representante del PSG manifestó lo siguiente:</label>
                            <div className="flex border border-gray-300 rounded overflow-hidden h-24">
                                <span className="bg-pink-600 text-white text-xs font-bold p-2 w-32 flex flex-col justify-center text-center uppercase tracking-tighter">Manifestación<br/>Sujeto:</span>
                                <textarea value={manifestaciones} onChange={(e) => setManifestaciones(e.target.value)} className="w-full p-2 text-sm outline-none resize-none"></textarea>
                            </div>
                        </div>
                    </div>
                )}

                {pagina === 3 && (
                    <div className="animate-fade-in space-y-6">
                        <h3 className="text-pink-600 font-bold text-center text-lg uppercase">V. TESTIGOS (CUANDO APLIQUE)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                            <div>
                                <InputBloque labelTop="Nombre del Testigo :" labelSide="Nombre del Testigo :" valor={nombreTestigo} onChange={(e) => setNombreTestigo(e.target.value)} />
                                <InputBloque labelTop="Tipo de Identificación del Testigo :" labelSide="Tipo de Identificación :" valor={tipoIdTestigo} onChange={(e) => setTipoIdTestigo(e.target.value)} />
                            </div>
                            <div>
                                <InputBloque labelTop="Domicilio del Testigo :" labelSide="Domicilio :" valor={domicilioTestigo} onChange={(e) => setDomicilioTestigo(e.target.value)} />
                                <InputBloque labelTop="Número de Identificación del Testigo:" labelSide="Número ID.:" valor={numeroIdTestigo} onChange={(e) => setNumeroIdTestigo(e.target.value)} />
                            </div>
                        </div>

                        <h3 className="text-pink-600 font-bold text-center text-lg uppercase mt-4">VI. CIERRE DEL ACTA</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                            <div>
                                <InputBloque labelTop="Nombre del Supervisor:" labelSide="Nombre del Supervisor:" valor={contexto?.datosSupervisor?.nombre || supervisor} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloque labelTop="Nombre del Testigo :" labelSide="Nombre del Testigo :" valor={nombreTestigoCierre} onChange={(e) => setNombreTestigoCierre(e.target.value)} />
                            </div>
                            <div>
                                <InputBloque labelTop="Nombre del Responsable del PSG :" labelSide="Nombre PSG:" valor={datosPsg.nombre_titular} disabled={true} puedeEditar={puedeEditar} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="max-w-6xl mx-auto mt-6 flex justify-between items-center bg-white p-4 rounded-b-xl shadow-md border border-gray-200">
                <div className="flex gap-2 items-center">
                    <button onClick={() => navigate('/dashboard')} className="bg-red-700 text-white p-2 rounded-full shadow hover:bg-red-800 transition-colors">
                        <Home size={22} />
                    </button>
                    {pagina === 3 && (
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
                                onClick={() => generarPdfModulo4({
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
                                    hechos_observados: hechosObservados,
                                    no_realizo_manifestaciones: noRealizo,
                                    manifestaciones,
                                    nombre_testigo: nombreTestigo,
                                    domicilio_testigo: domicilioTestigo,
                                    nombre_testigo_cierre: nombreTestigoCierre
                                })}
                                className="bg-blue-600 text-white px-4 py-2 rounded-full shadow hover:bg-blue-700 flex items-center gap-2 text-xs font-bold transition-all active:scale-95"
                            >
                                <Download size={16} /> DESCARGAR ACTA PRELLENADA
                            </button>}
                            <BotonSubirFirmado visita_id={contexto.visita_id} modulo={4} />
                        </>
                    )}
                </div>

                <div className="flex gap-4 items-center">
                    {pagina > 1 && (
                        <button onClick={() => setPagina(pagina - 1)} className="border-2 border-pink-600 text-pink-600 px-4 py-2 rounded-full hover:bg-pink-50 flex items-center gap-2 text-sm font-bold transition-colors">
                            <ChevronLeft size={20} /> PÁGINA ANTERIOR
                        </button>
                    )}
                    {pagina < 3 ? (
                        <button onClick={() => setPagina(pagina + 1)} className="bg-pink-600 text-white px-4 py-2 rounded-full shadow hover:bg-pink-700 flex items-center gap-2 text-sm font-bold transition-transform active:scale-95">
                            PÁGINA SIGUIENTE <ChevronRight size={20} />
                        </button>
                    ) : (
                        !soloVista && (
                            <div className="flex gap-2">
                                <button onClick={handleFinalizarVisita} className="bg-gradient-to-r from-red-600 to-rose-700 text-white px-4 py-2 rounded flex items-center gap-2 shadow-lg hover:from-red-700 hover:to-rose-800 font-bold text-xs transition-all active:scale-95">
                                    <CheckSquare size={16} /> FINALIZAR VISITA
                                </button>
                                <button onClick={handleGuardar} className="border-2 border-black text-black px-4 py-2 rounded flex items-center gap-2 shadow hover:bg-gray-100 font-bold text-xs transition-all active:scale-95">
                                    <Save size={20} /> GUARDAR
                                </button>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActaHechos;