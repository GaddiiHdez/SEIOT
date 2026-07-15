import { apiFetch } from '../../utils/api.js';
import React, { useState, useEffect } from 'react';
import { Save, ChevronRight, ChevronLeft, FileText, Home, Download, FolderOpen } from 'lucide-react';
import BotonSubirFirmado from '../../components/BotonSubirFirmado';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoGobierno from '../../assets/logo-gobierno.jpg';
import { generarPdfModulo6 } from '../../utils/generarPdfModulo6';
import InputBloque from '../../components/InputBloque';
import { guardarBorradorLocal, cargarBorradorLocal } from '../../utils/borradorHelpers.js';

// ── CONTROL DE PÁGINAS HABILITADAS ──────────────────────────────────────────
// Cambiar a true cuando se necesite habilitar la página 4 (Hechos y Artículos)
const ActaCircunstanciada = () => {
    const navigate = useNavigate();
    const { usuario } = useAuth();
    const puedeDescargar = usuario?.es_admin || usuario?.permisos?.descargar_pdfs;
    const puedeEditar = usuario?.es_admin || usuario?.permisos?.editar_campos;
    const soloVista = usuario?.rol === 'vista';
    const puedeAcceder = usuario?.es_admin || usuario?.permisos?.modulo6 || usuario?.rol === 'vista';
    const PAGINA4_HABILITADA = usuario?.es_admin || usuario?.permisos?.modulo6_pagina4;
    const [pagina, setPagina] = useState(1);
    const [cargando, setCargando] = useState(true);

    const [contexto] = useState(() => {
        const guardado = localStorage.getItem('visitaActiva');
        return guardado ? JSON.parse(guardado) : null;
    });

    const [actaNo, setActaNo] = useState("");
    const [fecha, setFecha] = useState("");
    const [hora, setHora] = useState("");
    const [ubicacion, setUbicacion] = useState(contexto?.datosPsg?.domicilio || "");
    const [tipoId, setTipoId] = useState("");
    const [numeroId, setNumeroId] = useState("");
    const [expide, setExpide] = useState("INE");
    const [fechaExpId, setFechaExpId] = useState("");
    const [ubicacionCompareciente, setUbicacionCompareciente] = useState(contexto?.datosPsg?.domicilio || "");
    const [credencialNo, setCredencialNo] = useState("");

    // Testigos de asistencia
    const [nombreTestigo1, setNombreTestigo1] = useState("");
    const [domicilioTestigo1, setDomicilioTestigo1] = useState("");
    const [tipoIdTestigo1, setTipoIdTestigo1] = useState("");
    const [numeroIdTestigo1, setNumeroIdTestigo1] = useState("");

    const [nombreTestigo2, setNombreTestigo2] = useState("");
    const [domicilioTestigo2, setDomicilioTestigo2] = useState("");
    const [tipoIdTestigo2, setTipoIdTestigo2] = useState("");
    const [numeroIdTestigo2, setNumeroIdTestigo2] = useState("");

    // Datos de la comisión
    const [oficioComision, setOficioComision] = useState(contexto?.folio || "");
    const [fechaComision, setFechaComision] = useState("");
    const [emiteComision, setEmiteComision] = useState("SECRETARIO DE DESARROLLO RURAL");

    // Hechos y artículos
    const [hechosObservaciones, setHechosObservaciones] = useState("");
    const [articulo1, setArticulo1] = useState("");
    const [de1, setDe1] = useState("");
    const [articulo2, setArticulo2] = useState("");
    const [de2, setDe2] = useState("");
    const [articulo3, setArticulo3] = useState("");
    const [de3, setDe3] = useState("");
    const [articulo4, setArticulo4] = useState("");
    const [de4, setDe4] = useState("");

    // Cierre
    const [manifestaciones, setManifestaciones] = useState("");
    const [horaActa, setHoraActa] = useState("");
    const [fechaActa, setFechaActa] = useState("");

    // Testigos de cierre (por default iguales a los de asistencia si no se editan)
    const [nombreTestigoCierre1, setNombreTestigoCierre1] = useState("");
    const [tipoIdCierre1, setTipoIdCierre1] = useState("");
    const [numeroIdCierre1, setNumeroIdCierre1] = useState("");

    const [nombreTestigoCierre2, setNombreTestigoCierre2] = useState("");
    const [tipoIdCierre2, setTipoIdCierre2] = useState("");
    const [numeroIdCierre2, setNumeroIdCierre2] = useState("");

    // ── CARGAR DATOS GUARDADOS EN BD ─────────────────────────────────────────
    useEffect(() => {
        if (!contexto?.visita_id) { setCargando(false); return; }

        const cargarDatos = async () => {
            try {
                const response = await apiFetch(`/api/modulos/modulo6/${contexto.visita_id}`);
                if (!response) return; // null-check: si el token expiró, apiFetch ya redirigió
                if (response.ok) {
                    const data = await response.json();
                    if (data.existe && data.datos) {
                        const d = data.datos;
                        if (d.acta_no) setActaNo(d.acta_no);
                        if (d.fecha) setFecha(d.fecha.split('T')[0]);
                        if (d.hora) setHora(d.hora);
                        if (d.ubicacion) setUbicacion(d.ubicacion);
                        if (d.tipo_id) setTipoId(d.tipo_id);
                        if (d.numero_id) setNumeroId(d.numero_id);
                        if (d.expide) setExpide(d.expide);
                        if (d.fecha_exp_id) setFechaExpId(d.fecha_exp_id.split('T')[0]);
                        if (d.ubicacion_compareciente) setUbicacionCompareciente(d.ubicacion_compareciente);
                        if (d.credencial_no) setCredencialNo(d.credencial_no);
                        if (d.nombre_testigo1) setNombreTestigo1(d.nombre_testigo1);
                        if (d.domicilio_testigo1) setDomicilioTestigo1(d.domicilio_testigo1);
                        if (d.tipo_id_testigo1) setTipoIdTestigo1(d.tipo_id_testigo1);
                        if (d.numero_id_testigo1) setNumeroIdTestigo1(d.numero_id_testigo1);
                        if (d.nombre_testigo2) setNombreTestigo2(d.nombre_testigo2);
                        if (d.domicilio_testigo2) setDomicilioTestigo2(d.domicilio_testigo2);
                        if (d.tipo_id_testigo2) setTipoIdTestigo2(d.tipo_id_testigo2);
                        if (d.numero_id_testigo2) setNumeroIdTestigo2(d.numero_id_testigo2);
                        if (d.oficio_comision) setOficioComision(d.oficio_comision);
                        if (d.fecha_comision) setFechaComision(d.fecha_comision.split('T')[0]);
                        if (d.emite_comision) setEmiteComision(d.emite_comision);
                        if (d.hechos_observaciones) setHechosObservaciones(d.hechos_observaciones);
                        if (d.articulo1) setArticulo1(d.articulo1);
                        if (d.de1) setDe1(d.de1);
                        if (d.articulo2) setArticulo2(d.articulo2);
                        if (d.de2) setDe2(d.de2);
                        if (d.articulo3) setArticulo3(d.articulo3);
                        if (d.de3) setDe3(d.de3);
                        if (d.articulo4) setArticulo4(d.articulo4);
                        if (d.de4) setDe4(d.de4);
                        if (d.manifestaciones) setManifestaciones(d.manifestaciones);
                        if (d.hora_acta) setHoraActa(d.hora_acta);
                        if (d.fecha_acta) setFechaActa(d.fecha_acta.split('T')[0]);
                        if (d.nombre_testigo_cierre1) setNombreTestigoCierre1(d.nombre_testigo_cierre1);
                        if (d.tipo_id_cierre1) setTipoIdCierre1(d.tipo_id_cierre1);
                        if (d.numero_id_cierre1) setNumeroIdCierre1(d.numero_id_cierre1);
                        if (d.nombre_testigo_cierre2) setNombreTestigoCierre2(d.nombre_testigo_cierre2);
                        if (d.tipo_id_cierre2) setTipoIdCierre2(d.tipo_id_cierre2);
                        if (d.numero_id_cierre2) setNumeroIdCierre2(d.numero_id_cierre2);
                    } else {
                        // Pre-cargar datos de M3
                        const responseM3 = await apiFetch(`/api/modulos/modulo3/${contexto.visita_id}`);
                        if (responseM3 && responseM3.ok) {
                            const dataM3 = await responseM3.json();
                            if (dataM3.existe && dataM3.datos) {
                                const d3 = dataM3.datos;
                                if (d3.fecha) setFecha(d3.fecha.split('T')[0]);
                                if (d3.hora_inicio) setHora(d3.hora_inicio);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error cargando datos módulo 6:', error);
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
    }, [contexto?.visita_id]);

    // ── BORRADOR .smpbk ──────────────────────────────────────────────────────
    const guardarBorrador = () => {
        guardarBorradorLocal(6, contexto, {
            actaNo, fecha, hora, ubicacion, tipoId, numeroId, expide, fechaExpId,
            ubicacionCompareciente, credencialNo, nombreTestigo1, domicilioTestigo1,
            tipoIdTestigo1, numeroIdTestigo1, nombreTestigo2, domicilioTestigo2,
            tipoIdTestigo2, numeroIdTestigo2, oficioComision, fechaComision,
            emiteComision, hechosObservaciones, articulo1, de1, articulo2, de2,
            articulo3, de3, articulo4, de4, manifestaciones, horaActa, fechaActa,
            nombreTestigoCierre1, tipoIdCierre1, numeroIdCierre1,
            nombreTestigoCierre2, tipoIdCierre2, numeroIdCierre2
        });
    };

    const cargarBorrador = (e) => {
        cargarBorradorLocal(e, 6, contexto, {
            actaNo: setActaNo,
            fecha: setFecha,
            hora: setHora,
            ubicacion: setUbicacion,
            tipoId: setTipoId,
            numeroId: setNumeroId,
            expide: setExpide,
            fechaExpId: setFechaExpId,
            ubicacionCompareciente: setUbicacionCompareciente,
            credencialNo: setCredencialNo,
            nombreTestigo1: setNombreTestigo1,
            domicilioTestigo1: setDomicilioTestigo1,
            tipoIdTestigo1: setTipoIdTestigo1,
            numeroIdTestigo1: setNumeroIdTestigo1,
            nombreTestigo2: setNombreTestigo2,
            domicilioTestigo2: setDomicilioTestigo2,
            tipoIdTestigo2: setTipoIdTestigo2,
            numeroIdTestigo2: setNumeroIdTestigo2,
            oficioComision: setOficioComision,
            fechaComision: setFechaComision,
            emiteComision: setEmiteComision,
            hechosObservaciones: setHechosObservaciones,
            articulo1: setArticulo1,
            de1: setDe1,
            articulo2: setArticulo2,
            de2: setDe2,
            articulo3: setArticulo3,
            de3: setDe3,
            articulo4: setArticulo4,
            de4: setDe4,
            manifestaciones: setManifestaciones,
            horaActa: setHoraActa,
            fechaActa: setFechaActa,
            nombreTestigoCierre1: setNombreTestigoCierre1,
            tipoIdCierre1: setTipoIdCierre1,
            numeroIdCierre1: setNumeroIdCierre1,
            nombreTestigoCierre2: setNombreTestigoCierre2,
            tipoIdCierre2: setTipoIdCierre2,
            numeroIdCierre2: setNumeroIdCierre2
        });
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
            return;
        }
        if (!contexto.avance?.modulo5) {
            alert("⚠️ Debes completar el Módulo 5 (Acta de Supervisión) antes de acceder al Acta Circunstanciada.");
            navigate('/dashboard');
        }
    }, [contexto, navigate]);

    const { folio, datosPsg, supervisor } = contexto || {};

    const handleGuardar = async () => {
        try {
            const response = await apiFetch('/api/modulos/modulo6', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visita_id: contexto.visita_id,
                    acta_no: actaNo,
                    fecha: fecha,
                    hora,
                    establecimiento: datosPsg.nombre_titular,
                    clave_psg: datosPsg.psg,
                    ubicacion,
                    localidad: datosPsg.localidad,
                    municipio: datosPsg.municipio,
                    estado: datosPsg.estado || 'NAYARIT',
                    nombre_oficial: contexto?.datosSupervisor?.nombre || supervisor,
                    tipo_id_responsable: tipoId,
                    numero_id_responsable: numeroId,
                    id_expedida_por: expide,
                    fecha_expedicion_id: fechaExpId,
                    ubicacion_compareciente: ubicacionCompareciente,
                    credencial_oficial_no: credencialNo,
                    nombre_testigo1: nombreTestigo1,
                    domicilio_testigo1: domicilioTestigo1,
                    tipo_id_testigo1: tipoIdTestigo1,
                    numero_id_testigo1: numeroIdTestigo1,
                    nombre_testigo2: nombreTestigo2,
                    domicilio_testigo2: domicilioTestigo2,
                    tipo_id_testigo2: tipoIdTestigo2,
                    numero_id_testigo2: numeroIdTestigo2,
                    oficio_comision: oficioComision,
                    fecha_comision: fechaComision,
                    emite_comision: emiteComision,
                    hechos_observaciones: hechosObservaciones,
                    articulo1, de1,
                    articulo2, de2,
                    articulo3, de3,
                    articulo4, de4,
                    manifestaciones,
                    hora_acta: horaActa,
                    fecha_acta: fechaActa,
                    nombre_testigo_cierre1: nombreTestigoCierre1,
                    tipo_id_cierre1: tipoIdCierre1,
                    numero_id_cierre1: numeroIdCierre1,
                    nombre_testigo_cierre2: nombreTestigoCierre2,
                    tipo_id_cierre2: tipoIdCierre2,
                    numero_id_cierre2: numeroIdCierre2,
                    folio: folio
                })
            });
            if (!response) return; 
            if (!response.ok) { alert("Error al guardar."); return; }
            const contextoActualizado = { ...contexto, avance: { ...contexto.avance, modulo6: true } };
            localStorage.setItem('visitaActiva', JSON.stringify(contextoActualizado));
            alert("¡Acta Circunstanciada Guardada!\nHas completado todas las etapas de la visita.");
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
                <div className="bg-white text-red-600 px-6 py-2 rounded-full font-bold shadow flex items-center gap-2 border-4 border-red-200">
                    <FileText size={20} /> FORMATO DE ACTA CIRCUNSTANCIADA
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
                        <h3 className="text-red-600 font-bold text-center text-lg mb-6 uppercase">I. LUGAR, FECHA Y HORA DE LA DILIGENCIA</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                            <div>
                                <InputBloque labelTop="(1) No. de Acta :" labelSide="Acta No.:" valor={actaNo} onChange={(e) => setActaNo(e.target.value)} />
                                <InputBloque labelTop="(2) Folio :" labelSide="Folio No.:" valor={folio} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloque labelTop="(3) Establecimiento :" labelSide="Establecimiento :" valor={datosPsg.nombre_titular} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloque labelTop="(4) Clave de PSG:" labelSide="Clave PSG :" valor={datosPsg.psg} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloque labelTop="(5) Ubicación :" labelSide="Ubicación :" valor={ubicacion} onChange={(e) => setUbicacion(e.target.value)} disabled={true} puedeEditar={puedeEditar} />
                            </div>
                            <div>
                                <InputBloque labelTop="(6) Localidad :" labelSide="Localidad :" valor={datosPsg.localidad} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloque labelTop="(7) Municipio :" labelSide="Municipio :" valor={datosPsg.municipio} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloque labelTop="(8) Fecha:" labelSide="Fecha:" valor={fecha} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloque labelTop="(9) Hora:" labelSide="Hora:" tipo="time" valor={hora} onChange={(e) => setHora(e.target.value)} />
                                <InputBloque labelTop="(10) Nombre del Oficial Estatal:" labelSide="Nombre:" valor={contexto?.datosSupervisor?.nombre || supervisor} disabled={true} puedeEditar={puedeEditar} />
                            </div>
                        </div>
                    </div>
                )}

                {/* PÁGINA 2 */}
                {pagina === 2 && (
                    <div className="animate-fade-in space-y-6">
                        <h3 className="text-red-600 font-bold text-center text-lg uppercase">II. IDENTIFICACIÓN DEL RESPONSABLE DEL ESTABLECIMIENTO</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                            <div>
                                <InputBloque labelTop="(11) Responsable o Encargado :" labelSide="Nombre:" valor={datosPsg.nombre_titular} disabled={true} puedeEditar={puedeEditar} />
                                <div className="mb-3">
                                    <label className="block text-xs font-bold text-red-700 mb-1 uppercase">(12) Tipo de Identificación :</label>
                                    <div className="flex border border-gray-300 rounded overflow-hidden shadow-sm w-full">
                                        <span className="bg-red-700 text-white text-[11px] font-bold p-2 min-w-[128px] flex items-center whitespace-nowrap">Identificación :</span>
                                        <select value={tipoId} onChange={(e) => setTipoId(e.target.value)} disabled={soloVista} className={`w-full p-2 text-sm outline-none ${soloVista ? 'bg-gray-100' : 'bg-white'}`}>
                                            <option value="">-- Selecciona --</option>
                                            <option value="INE">INE</option>
                                            <option value="CREDENCIAL">Credencial</option>
                                            <option value="PASAPORTE">Pasaporte</option>
                                            <option value="CEDULA_PROFESIONAL">Cédula Profesional</option>
                                            <option value="LICENCIA">Licencia de Conducir</option>
                                            <option value="OTRO">Otro</option>
                                        </select>
                                    </div>
                                </div>
                                <InputBloque labelTop="(13) Número de Identificación :" labelSide="Identificación No.:" valor={numeroId} onChange={(e) => setNumeroId(e.target.value)} disabled={true} puedeEditar={puedeEditar} />
                                <div className="mb-3">
                                    <label className="block text-xs font-bold text-red-700 mb-1 uppercase">(14) Identificación Expedida por :</label>
                                    <div className="flex border border-gray-300 rounded overflow-hidden shadow-sm w-full">
                                        <span className="bg-red-700 text-white text-[11px] font-bold p-2 min-w-[128px] flex items-center whitespace-nowrap">Expide :</span>
                                        <select value={expide} onChange={(e) => setExpide(e.target.value)} disabled={soloVista} className={`w-full p-2 text-sm outline-none ${soloVista ? 'bg-gray-100' : 'bg-white'}`}>
                                            <option value="">-- Selecciona --</option>
                                            <option value="GOBIERNO_FEDERAL">Gobierno Federal</option>
                                            <option value="SEDER">SEDER</option>
                                            <option value="GOBIERNO_ESTATAL">Gobierno Estatal</option>
                                            <option value="SENASICA">SENASICA</option>
                                            <option value="INE">INE</option>
                                            <option value="SEP">SEP</option>
                                            <option value="OTRO">Otro</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <InputBloque labelTop="(15) Fecha de Expedición de Identificación :" labelSide="Fecha Exp.:" tipo="date" valor={fechaExpId} onChange={(e) => setFechaExpId(e.target.value)} />
                                <InputBloque labelTop="(16) Ubicación del Domicilio del Compareciente :" labelSide="Ubicación :" valor={ubicacionCompareciente} onChange={(e) => setUbicacionCompareciente(e.target.value)} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloque labelTop="(17) Municipio :" labelSide="Municipio :" valor={datosPsg.municipio} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloque labelTop="(18) Estado :" labelSide="Estado :" valor={datosPsg.estado || 'NAYARIT'} disabled={true} puedeEditar={puedeEditar} />
                            </div>
                        </div>
                        <h3 className="text-red-600 font-bold text-center text-lg uppercase mt-6">III. IDENTIFICACIÓN DEL PERSONAL ACTUANTE</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                            <InputBloque labelTop="(19) Credencial Oficial Número :" labelSide="No. Credencial:" valor={credencialNo} onChange={(e) => setCredencialNo(e.target.value)} disabled={true} puedeEditar={puedeEditar} />
                        </div>
                    </div>
                )}

                {/* PÁGINA 3 */}
                {pagina === 3 && (
                    <div className="animate-fade-in space-y-6">
                        <h3 className="text-red-600 font-bold text-center text-lg uppercase">IV. DESIGNACIÓN DE TESTIGOS DE ASISTENCIA</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                            <div>
                                <InputBloque labelTop="(20) Testigo 1:" labelSide="Nombre Testigo 1:" valor={nombreTestigo1} onChange={(e) => setNombreTestigo1(e.target.value)} />
                                <InputBloque labelTop="(21) Domicilio Testigo 1 :" labelSide="Domicilio 1 :" valor={domicilioTestigo1} onChange={(e) => setDomicilioTestigo1(e.target.value)} />
                                <InputBloque labelTop="(22) Tipo Identificación Testigo 1 :" labelSide="Tipo Identificación 1 :" valor={tipoIdTestigo1} onChange={(e) => setTipoIdTestigo1(e.target.value)} />
                                <InputBloque labelTop="(23) Número Identificación Testigo 1 :" labelSide="Número Identificación 1 :" valor={numeroIdTestigo1} onChange={(e) => setNumeroIdTestigo1(e.target.value)} />
                            </div>
                            <div>
                                <InputBloque labelTop="(24) Testigo 2:" labelSide="Nombre Testigo 2:" valor={nombreTestigo2} onChange={(e) => setNombreTestigo2(e.target.value)} />
                                <InputBloque labelTop="(25) Domicilio Testigo 2 :" labelSide="Domicilio 2 :" valor={domicilioTestigo2} onChange={(e) => setDomicilioTestigo2(e.target.value)} />
                                <InputBloque labelTop="(26) Tipo Identificación Testigo 2 :" labelSide="Tipo Identificación 2 :" valor={tipoIdTestigo2} onChange={(e) => setTipoIdTestigo2(e.target.value)} />
                                <InputBloque labelTop="(27) Número Identificación Testigo 2 :" labelSide="Número Identificación 2 :" valor={numeroIdTestigo2} onChange={(e) => setNumeroIdTestigo2(e.target.value)} />
                            </div>
                        </div>
                        <h3 className="text-red-600 font-bold text-center text-lg uppercase mt-6">V. EXHIBICIÓN DE LA ORDEN DE COMISIÓN</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                            <div>
                                <InputBloque labelTop="(28) Orden de Comisión :" labelSide="Oficio Número:" valor={oficioComision} onChange={(e) => setOficioComision(e.target.value)} />
                                <InputBloque labelTop="(29) Fecha de la Orden de Comisión :" labelSide="Fecha :" tipo="date" valor={fechaComision} onChange={(e) => setFechaComision(e.target.value)} />
                            </div>
                            <div>
                                <InputBloque labelTop="(30) Orden de Comisión Emitida por :" labelSide="Emite :" valor={emiteComision} onChange={(e) => setEmiteComision(e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}

                {/* PÁGINA 4 */}
                {pagina === 4 && PAGINA4_HABILITADA && (
                    <div className="animate-fade-in space-y-6">
                        <h3 className="text-red-600 font-bold text-center text-lg uppercase">VII. HECHOS U OBSERVACIONES DETECTADAS</h3>
                        <div>
                            <label className="block text-xs font-bold text-red-600 mb-1">(31) Hechos y Observaciones:</label>
                            <div className="flex border border-gray-300 rounded overflow-hidden h-32">
                                <span className="bg-red-600 text-white text-xs font-bold p-2 w-32 flex flex-col justify-center text-center">Hechos y<br/>Observaciones :</span>
                                <textarea value={hechosObservaciones} onChange={(e) => setHechosObservaciones(e.target.value)} className="w-full p-2 text-sm outline-none resize-none" placeholder="..."></textarea>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-red-600 mt-4 mb-2">Los hechos descritos podrían constituir incumplimiento a lo dispuesto en:</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                                <div className="space-y-1">
                                    <InputBloque labelTop="Artículo(s) :" labelSide="Artículo(s) :" valor={articulo1} onChange={(e) => setArticulo1(e.target.value)} />
                                    <InputBloque labelTop="Artículo(s) :" labelSide="Artículo(s) :" valor={articulo2} onChange={(e) => setArticulo2(e.target.value)} />
                                    <InputBloque labelTop="Artículo(s) :" labelSide="Artículo(s) :" valor={articulo3} onChange={(e) => setArticulo3(e.target.value)} />
                                    <InputBloque labelTop="Artículo(s) :" labelSide="Artículo(s) :" valor={articulo4} onChange={(e) => setArticulo4(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <InputBloque labelTop="de :" labelSide="de :" valor={de1} onChange={(e) => setDe1(e.target.value)} />
                                    <InputBloque labelTop="de :" labelSide="de :" valor={de2} onChange={(e) => setDe2(e.target.value)} />
                                    <InputBloque labelTop="de :" labelSide="de :" valor={de3} onChange={(e) => setDe3(e.target.value)} />
                                    <InputBloque labelTop="de :" labelSide="de :" valor={de4} onChange={(e) => setDe4(e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <h3 className="text-red-600 font-bold text-center text-lg uppercase mt-6">VIII. MANIFESTACIONES DEL RESPONSABLE</h3>
                        <div>
                            <label className="block text-xs font-bold text-red-600 mb-1">(32) El Responsable Manifestó lo Siguiente:</label>
                            <div className="flex border border-gray-300 rounded overflow-hidden h-24">
                                <span className="bg-red-600 text-white text-xs font-bold p-2 w-32 flex flex-col justify-center text-center">Manifestó lo<br/>Siguiente :</span>
                                <textarea value={manifestaciones} onChange={(e) => setManifestaciones(e.target.value)} className="w-full p-2 text-sm outline-none resize-none" placeholder="..."></textarea>
                            </div>
                        </div>
                    </div>
                )}

                {/* PÁGINA 5 */}
                {pagina === 5 && (
                    <div className="animate-fade-in space-y-6">
                        <h3 className="text-red-600 font-bold text-center text-lg uppercase">VI. CIERRE DEL ACTA</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                            <div>
                                <InputBloque labelTop="(33) Hora del Acta:" labelSide="Hora del Acta:" tipo="time" valor={horaActa} onChange={(e) => setHoraActa(e.target.value)} />
                                <InputBloque labelTop="(34) Fecha del Acta :" labelSide="Fecha del Acta:" tipo="date" valor={fechaActa} onChange={(e) => setFechaActa(e.target.value)} />
                                <InputBloque labelTop="(35) Responsable o Encargado del PSG :" labelSide="Nombre PSG:" valor={datosPsg.nombre_titular} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloque labelTop="(36) Testigo de Asistencia 1 :" labelSide="Nombre Testigo 1:" valor={nombreTestigoCierre1} onChange={(e) => setNombreTestigoCierre1(e.target.value)} />
                                <InputBloque labelTop="(37) Tipo Identificación Testigo 1 :" labelSide="Tipo Identificación 1:" valor={tipoIdCierre1} onChange={(e) => setTipoIdCierre1(e.target.value)} />
                            </div>
                            <div>
                                <InputBloque labelTop="(38) Número Identificación Testigo 1 :" labelSide="Identificación No. 1:" valor={numeroIdCierre1} onChange={(e) => setNumeroIdCierre1(e.target.value)} />
                                <InputBloque labelTop="(39) Personal Oficial Estatal:" labelSide="Nombre del Oficial:" valor={contexto?.datosSupervisor?.nombre || supervisor} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloque labelTop="(40) Testigo de Asistencia 2 :" labelSide="Nombre Testigo 2:" valor={nombreTestigoCierre2} onChange={(e) => setNombreTestigoCierre2(e.target.value)} />
                                <InputBloque labelTop="(41) Tipo Identificación Testigo 2 :" labelSide="Tipo Identificación 2:" valor={tipoIdCierre2} onChange={(e) => setTipoIdCierre2(e.target.value)} />
                                <InputBloque labelTop="(42) Número Identificación Testigo 2 :" labelSide="Identificación No. 2:" valor={numeroIdCierre2} onChange={(e) => setNumeroIdCierre2(e.target.value)} />
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
                    {pagina === 5 && (
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
                                onClick={(e) => { e.stopPropagation(); generarPdfModulo6({
                                    acta_no: actaNo,
                                    folio,
                                    establecimiento: datosPsg.nombre_titular,
                                    clave_psg: datosPsg.psg,
                                    ubicacion,
                                    localidad: datosPsg.localidad,
                                    municipio: datosPsg.municipio,
                                    estado: datosPsg.estado || 'Nayarit',
                                    hora, fecha,
                                    nombre_oficial: contexto?.datosSupervisor?.nombre || supervisor,
                                    tipo_id_responsable: tipoId,
                                    numero_id_responsable: numeroId,
                                    id_expedida_por: expide,
                                    fecha_expedicion_id: fechaExpId,
                                    ubicacion_compareciente: ubicacionCompareciente,
                                    credencial_oficial_no: credencialNo,
                                    nombre_testigo1: nombreTestigo1,
                                    domicilio_testigo1: domicilioTestigo1,
                                    nombre_testigo2: nombreTestigo2,
                                    domicilio_testigo2: domicilioTestigo2,
                                    oficio_comision: oficioComision,
                                    fecha_comision: fechaComision,
                                    emite_comision: emiteComision,
                                    hechos_observaciones: hechosObservaciones,
                                    articulo1, de1, articulo2, de2,
                                    articulo3, de3, articulo4, de4,
                                    manifestaciones,
                                    hora_cierre: horaActa,
                                    fecha_cierre: fechaActa
                                }); }}
                                className="bg-blue-600 text-white px-4 py-2 rounded-full shadow hover:bg-blue-700 flex items-center gap-2 text-xs font-bold"
                            >
                                <Download size={16} /> DESCARGAR ACTA PRELLENADA
                            </button>}
                            <BotonSubirFirmado visita_id={contexto.visita_id} modulo={6} />
                        </>
                    )}
                </div>
                <div className="flex gap-4 items-center">
                    {pagina > 1 && (
                        <button onClick={() => {
                            const anterior = pagina - 1;
                            setPagina(!PAGINA4_HABILITADA && anterior === 4 ? 3 : anterior);
                        }} className="border-2 border-red-600 text-red-600 px-4 py-2 rounded-full hover:bg-red-50 flex items-center gap-2 text-sm font-bold transition-colors">
                            <ChevronLeft size={20} /> PÁGINA ANTERIOR
                        </button>
                    )}
                    {pagina < 5 ? (
                        <button onClick={() => {
                            const siguiente = pagina + 1;
                            setPagina(!PAGINA4_HABILITADA && siguiente === 4 ? 5 : siguiente);
                        }} className="bg-red-600 text-white px-4 py-2 rounded-full shadow hover:bg-red-700 flex items-center gap-2 text-sm font-bold transition-transform active:scale-95">
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

export default ActaCircunstanciada;