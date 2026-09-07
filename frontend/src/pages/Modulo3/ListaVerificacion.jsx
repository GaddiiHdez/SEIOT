import { apiFetch } from '../../utils/api.js';
import React, { useState, useEffect } from 'react';
import { Save, ChevronRight, ChevronLeft, ChevronsRight, CheckSquare, Home, Download, ArrowLeft, FolderOpen, Mail, Eye, X } from 'lucide-react';
import BotonSubirFirmado from '../../components/BotonSubirFirmado';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoGobierno from '../../assets/logo-gobierno.jpg';
import { generarPdfModulo3 } from '../../utils/generarPdfModulo3';
import InputBloque from '../../components/InputBloque';
import { guardarBorradorLocal, cargarBorradorLocal } from '../../utils/borradorHelpers.js';

const ListaVerificacion = () => {
    const navigate = useNavigate();
    const { usuario } = useAuth();
    const puedeDescargar = usuario?.es_admin || usuario?.permisos?.descargar_pdfs;
    const puedeEditar = usuario?.es_admin || usuario?.permisos?.editar_campos;
    const soloVista = usuario?.rol === 'vista';
    const puedeAcceder = usuario?.es_admin || usuario?.permisos?.modulo3 || usuario?.rol === 'vista';
    const [pagina, setPagina] = useState(1);
    const [cargando, setCargando] = useState(true);

    const [contexto] = useState(() => {
        const guardado = localStorage.getItem('visitaActiva');
        return guardado ? JSON.parse(guardado) : null;
    });

    const [tipoPsg, setTipoPsg] = useState(contexto?.datosPsg?.tipo_psg || "");
    const [telefono, setTelefono] = useState(contexto?.datosPsg?.telefono || "");
    const [latitud, setLatitud] = useState("");
    const [longitud, setLongitud] = useState("");
    const [cabezas, setCabezas] = useState("");
    const [horaInicio, setHoraInicio] = useState("");
    const [horaTermino, setHoraTermino] = useState("");
    const [observaciones, setObservaciones] = useState("");
    const [conclusion, setConclusion] = useState(""); // CUMPLE / NO CUMPLE
    const [instanciasSeguimiento, setInstanciasSeguimiento] = useState([]);
    const [mostrarModalPreview, setMostrarModalPreview] = useState(false);
    const [responsablePsg, setResponsablePsg] = useState(contexto?.datosPsg?.representante || "");
    const [responsableSupervisor, setResponsableSupervisor] = useState("");
    const [nombreTestigo, setNombreTestigo] = useState("");
    const [domicilioTestigo, setDomicilioTestigo] = useState("");
    const [tipoIdTestigo, setTipoIdTestigo] = useState("");
    const [numeroIdTestigo, setNumeroIdTestigo] = useState("");

    // Catálogo de instancias responsables oficiales
    const INSTANCIAS_DISPONIBLES = [
        {
            id: 'seder_juridico',
            nombre: 'Dirección Jurídica de la SEDER',
            titular: 'Lic. Carlos Esteban Henson Reyes',
            cargo: 'Director Jurídico',
            correo: 'rural.direccionjuridica@nayarit.gob.mx',
            telefono: '311 141 8084',
            colorBadge: 'bg-amber-100 text-amber-800 border-amber-300'
        },
        {
            id: 'cefppenay',
            nombre: 'CEFPPENAY',
            titular: 'M.V.Z. Ricardo Álvarez Hernández',
            cargo: 'Gerente',
            correo: 'gerencia.comitenay@gmail.com',
            telefono: '449 137 1260',
            colorBadge: 'bg-emerald-100 text-emerald-800 border-emerald-300'
        },
        {
            id: 'senasica',
            nombre: 'SENASICA',
            titular: 'M.V.Z. Zaida Elizabeth García Alonso',
            cargo: 'Resp. Campañas Zoosanitarias en Nayarit',
            correo: 'zaida.garcia@senasica.gob.mx',
            telefono: '311 150 2194',
            colorBadge: 'bg-blue-100 text-blue-800 border-blue-300'
        },
        {
            id: 'test_henry',
            nombre: 'Supervisión Técnica (Pruebas)',
            titular: 'Henry Hernández',
            cargo: 'Soporte Técnico y Pruebas SEIOT',
            correo: 'gaddiel3002@gmail.com',
            telefono: '311 250 5725',
            colorBadge: 'bg-purple-100 text-purple-800 border-purple-300'
        }
    ];

    const toggleInstancia = (id) => {
        setInstanciasSeguimiento(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // Respuestas y observaciones del checklist
    const [respuestas, setRespuestas] = useState({});
    const [recomendaciones, setRecomendaciones] = useState({});

    // ── CARGAR DATOS GUARDADOS EN BD ─────────────────────────────────────────
    useEffect(() => {
        if (!contexto?.visita_id) { setCargando(false); return; }

        const cargarDatos = async () => {
            try {
                const response = await apiFetch(`/api/modulos/modulo3/${contexto.visita_id}`);
                if (!response) return; // null-check: si el token expiró, apiFetch ya redirigió
                if (response.ok) {
                    const data = await response.json();
                    if (data.existe && data.datos) {
                        const d = data.datos;
                        if (d.tipo_psg) setTipoPsg(d.tipo_psg);
                        if (d.telefono) setTelefono(d.telefono);
                        if (d.latitud) setLatitud(String(d.latitud));
                        if (d.longitud) setLongitud(String(d.longitud));
                        if (d.capacidad_instalada) setCabezas(String(d.capacidad_instalada));
                        if (d.hora_inicio) setHoraInicio(d.hora_inicio.substring(0, 5));
                        if (d.hora_termino) setHoraTermino(d.hora_termino.substring(0, 5));
                        if (d.observaciones) setObservaciones(d.observaciones);
                        
                        if (d.cumple === true || d.cumple === 'cumple') setConclusion('cumple');
                        else if (d.presenta_observaciones === true || d.cumple === 'observaciones') setConclusion('observaciones');
                        else if (d.requiere_seguimiento === true || d.cumple === 'seguimiento') setConclusion('seguimiento');

                        if (d.instancias_notificadas && Array.isArray(d.instancias_notificadas)) {
                            setInstanciasSeguimiento(d.instancias_notificadas);
                        }
                        
                        if (d.responsable_psg) setResponsablePsg(d.responsable_psg);
                        if (d.responsable_supervisor) setResponsableSupervisor(d.responsable_supervisor);
                        if (d.nombre_testigo) setNombreTestigo(d.nombre_testigo);
                        if (d.domicilio_testigo) setDomicilioTestigo(d.domicilio_testigo);
                        if (d.tipo_id_testigo) setTipoIdTestigo(d.tipo_id_testigo);
                        if (d.numero_id_testigo) setNumeroIdTestigo(d.numero_id_testigo);
                    }

                    // Cargar respuestas del checklist directamente de data.checklist
                    const resp = {};
                    const recom = {};

                    if (data.checklist && Array.isArray(data.checklist)) {
                        data.checklist.forEach(item => {
                            if (item.pregunta_id) {
                                resp[`p${item.pregunta_id}`] = item.respuesta;
                                if (item.observacion) recom[`p${item.pregunta_id}`] = item.observacion;
                            }
                        });
                    }

                    // Fallback a columnas p13..p62 si vinieran en data.datos
                    if (data.datos) {
                        for (let i = 13; i <= 62; i++) {
                            const val = data.datos[`p${i}`];
                            if (val && !resp[`p${i}`]) {
                                resp[`p${i}`] = val;
                            }
                        }
                    }

                    setRespuestas(resp);
                    setRecomendaciones(recom);
                }
            } catch (error) {
                console.error('Error cargando datos módulo 3:', error);
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
    }, [contexto?.visita_id]);

    // ── BORRADOR .smpbk ──────────────────────────────────────────────────────
    const guardarBorrador = () => {
        guardarBorradorLocal(3, contexto, { tipoPsg, telefono, latitud, longitud, cabezas, horaInicio, horaTermino, respuestas, recomendaciones, observaciones, conclusion, instanciasSeguimiento, responsablePsg, responsableSupervisor, nombreTestigo, domicilioTestigo, tipoIdTestigo, numeroIdTestigo });
    };

    const cargarBorrador = (e) => {
        cargarBorradorLocal(e, 3, contexto, {
            tipoPsg: setTipoPsg,
            telefono: setTelefono,
            latitud: setLatitud,
            longitud: setLongitud,
            cabezas: setCabezas,
            horaInicio: setHoraInicio,
            horaTermino: setHoraTermino,
            respuestas: setRespuestas,
            recomendaciones: setRecomendaciones,
            observaciones: setObservaciones,
            conclusion: setConclusion,
            instanciasSeguimiento: setInstanciasSeguimiento,
            responsablePsg: setResponsablePsg,
            responsableSupervisor: setResponsableSupervisor,
            nombreTestigo: setNombreTestigo,
            domicilioTestigo: setDomicilioTestigo,
            tipoIdTestigo: setTipoIdTestigo,
            numeroIdTestigo: setNumeroIdTestigo
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
        if (!contexto.avance?.modulo2) {
            alert("⚠️ Debes completar el Módulo 2 (Orden de Supervisión) antes de acceder a la Lista de Verificación.");
            navigate('/dashboard');
        }
    }, [contexto, navigate]);

    const { folio, datosPsg, supervisor, fecha } = contexto || {};

    const handleRespuesta = (preguntaId, valor) => {
        setRespuestas(prev => ({ ...prev, [`p${preguntaId}`]: valor }));
    };

    const handleRecomendacion = (preguntaId, valor) => {
        setRecomendaciones(prev => ({ ...prev, [`p${preguntaId}`]: valor }));
    };

    const handleGuardar = async () => {
        if (conclusion === 'seguimiento' && instanciasSeguimiento.length === 0) {
            alert("⚠️ Ha seleccionado 'Requiere Seguimiento'. Por favor seleccione al menos una de las instancias responsables para remitir el expediente.");
            return;
        }
        try {
            const response = await apiFetch('/api/modulos/modulo3', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visita_id: contexto.visita_id,
                    nombre_psg: datosPsg.nombre_titular,
                    tipo_psg: tipoPsg,
                    nombre_titular: datosPsg.representante || "",
                    telefono,
                    municipio: datosPsg.municipio,
                    localidad: datosPsg.localidad,
                    latitud,
                    longitud,
                    capacidad_instalada: cabezas,
                    nombre_supervisor: contexto?.datosSupervisor?.nombre || supervisor,
                    fecha,
                    hora_inicio: horaInicio,
                    hora_termino: horaTermino,
                    observaciones,
                    cumple: conclusion === 'cumple',
                    presenta_observaciones: conclusion === 'observaciones',
                    requiere_seguimiento: conclusion === 'seguimiento',
                    instancias_seguimiento: conclusion === 'seguimiento' ? instanciasSeguimiento : [],
                    responsable_psg: datosPsg.nombre_titular,
                    responsable_supervisor: contexto?.datosSupervisor?.nombre || supervisor,
                    nombre_testigo: nombreTestigo,
                    domicilio_testigo: domicilioTestigo,
                    tipo_id_testigo: tipoIdTestigo,
                    numero_id_testigo: numeroIdTestigo,
                    respuestas,
                    recomendaciones
                })
            });
            if (!response) return; // null-check: si el token expiró, apiFetch ya redirigió
            if (!response.ok) { alert("Error al guardar."); return; }
            const contextoActualizado = { ...contexto, avance: { ...contexto.avance, modulo3: true } };
            localStorage.setItem('visitaActiva', JSON.stringify(contextoActualizado));
            
            let mensajeExito = "¡Lista de Verificación Guardada!\nEl Módulo 4 ha sido desbloqueado.";
            if (conclusion === 'seguimiento' && instanciasSeguimiento.length > 0) {
                mensajeExito += `\n\n📧 Se han remitido las notificaciones automáticas por correo a ${instanciasSeguimiento.length} instancia(s) responsable(s).`;
            }
            alert(mensajeExito);
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

    const preguntasData = [
        { id: 13, categoria: "Aspecto documental", texto: "¿La autorización de PSG se encuentra vigente por un año a partir de la fecha de expedición?", pagina: 2 },
        { id: 14, categoria: "Del ingreso del ganado", texto: "¿Se presenta identificación del titular de PSG o de su representante legal?", pagina: 2 },
        { id: 15, categoria: "Del ingreso del ganado", texto: "¿Cuenta con Certificado de Inspección Legal (CIL) o factura fiscal que ampare la procedencia de los animales?", pagina: 2 },
        { id: 16, categoria: "Del ingreso del ganado", texto: "¿Tiene guías de tránsito REEMO en formato oficial, que corresponda al origen, destino y número de animales movilizados?", pagina: 2 },
        { id: 17, categoria: "Del ingreso del ganado", texto: "¿Los animales ingresados cuentan con la (s) figura (s) de herrar registradas y autorizadas?", pagina: 2 },
        { id: 18, categoria: "Del ingreso del ganado", texto: "¿Los identificadores SINIIGA que traen los animales en ambas orejas se corresponden con los registros?", pagina: 2 },
        { id: 19, categoria: "Del ingreso del ganado", texto: "En caso de que los animales provengan de zona con mayor estatus sanitario o de ferias o exposiciones ¿Cuentan con dictamen vigente de prueba de tuberculosis con resultado negativo?", pagina: 2 },
        { id: 20, categoria: "De la estancia del ganado", texto: "¿La bitácora evidencia la clasificación al ingreso de los semovientes por sexo y peso?", pagina: 2 },
        { id: 21, categoria: "De la estancia del ganado", texto: "¿Se lleva un registro de la aplicación de baños por inmersión o aspersión, o del suministro de medicamentos?", pagina: 2 },
        { id: 22, categoria: "De la estancia del ganado", texto: "En el caso de los centros de acopio o engorda ¿Se cuenta con registro de la marca a fuego CN?", pagina: 2 },
        { id: 23, categoria: "De la estancia del ganado", texto: "En caso de extravíos o nacimientos en corral ¿Se lleva un registro de las solicitudes de reposición de identificadores SINIIGA?", pagina: 2 },
        { id: 24, categoria: "Del egreso del ganado", texto: "Los semovientes que se trasladan a otro PSG ¿cuentan con nuevo Certificado de Inspección Legal (CIL)?", pagina: 3 },
        { id: 25, categoria: "Del egreso del ganado", texto: "Los semovientes que se trasladan a otro PSG ¿cuentan con nueva Guía de tránsito REEMO?", pagina: 3 },
        { id: 26, categoria: "Del egreso del ganado", texto: "Los semovientes que salen a las Unidades de Sacrificio Animal ¿Cuentan con guía REEMO?", pagina: 3 },
        { id: 27, categoria: "Del egreso del ganado", texto: "En caso de que los semovientes se trasladen fuera del estado ¿Cuentan con el debido Permiso de Movilización?", pagina: 3 },
        { id: 28, categoria: "Del egreso del ganado", texto: "¿Se cuenta con expediente de reubicación del ganado que no se movilizó con la guía REEMO?", pagina: 3 },
        { id: 29, categoria: "Del egreso del ganado", texto: "Cuando el destino del ganado se encuentra fuera del estado ¿Cuentan con prueba de tuberculosis?", pagina: 3 },
        { id: 30, categoria: "De las muertes en corral", texto: "¿Se lleva un registro interno o bitácora de mortalidad en corral?", pagina: 3 },
        { id: 31, categoria: "De las muertes en corral", texto: "¿Los identificadores oficiales SINIIGA de animales muertos en corral corresponden con el registro?", pagina: 3 },
        { id: 32, categoria: "De las muertes en corral", texto: "¿Existe evidencia documental y fotográfica de la cabeza del animal que muestre los identificadores SINIIGA?", pagina: 3 },
        { id: 33, categoria: "De las muertes en corral", texto: "¿El Certificado de Inspección Legal o CFDI corresponde con los animales dados de baja?", pagina: 3 },
        { id: 34, categoria: "De las muertes en corral", texto: "¿La guía de tránsito REEMO de origen corresponde al ingreso del animal a las PSG?", pagina: 3 },
        { id: 35, categoria: "De las muertes en corral", texto: "¿Se tiene documentado el lugar de disposición final del animal?", pagina: 3 },
        { id: 36, categoria: "De las muertes en corral", texto: "¿Se solicito la baja del identificador SINIIGA en un periodo no mayor a 30 días?", pagina: 3 },
        { id: 37, categoria: "De las muertes en corral", texto: "¿Existe un expediente individual o concentrado de los animales dados de baja por muerte en corral?", pagina: 3 },
        { id: 38, categoria: "De las muertes en corral", texto: "¿En el cotejo de la información documental se corresponde con las evidencias fotográficas?", pagina: 3 },
        { id: 39, categoria: "De los nacimientos en corral", texto: "¿Se lleva un registro o bitácora de los nacimientos en corral?", pagina: 4 },
        { id: 40, categoria: "De los nacimientos en corral", texto: "¿Se le asigna número de control interno al animal nacido en corral?", pagina: 4 },
        { id: 41, categoria: "De los nacimientos en corral", texto: "¿Se solicito la asignación del identificador SINIIGA conforme al Protocolo establecido?", pagina: 4 },
        { id: 42, categoria: "De los nacimientos en corral", texto: "¿Existe el comprobante de aplicación del identificador SINIIGA?", pagina: 4 },
        { id: 43, categoria: "De los nacimientos en corral", texto: "¿Existe una relación actualizada de los animales nacidos en corral?", pagina: 4 },
        { id: 44, categoria: "De los nacimientos en corral", texto: "¿Se cuenta con expediente interno de los animales nacidos en corral?", pagina: 4 },
        { id: 45, categoria: "Aspecto Físicos para supervisar", texto: "¿Los semovientes en corral portan los Identificadores SINIIGA visibles en ambas orejas?", pagina: 4 },
        { id: 46, categoria: "Aspecto Físicos para supervisar", texto: "¿Los semovientes portan la(s) figura(s) y Marca a fuego del ganado?", pagina: 4 },
        { id: 47, categoria: "Aspecto Físicos para supervisar", texto: "¿El número de animales presentes en corral corresponde con los señalados en la documentación?", pagina: 4 },
        { id: 48, categoria: "Aspecto Físicos para supervisar", texto: "Después de verificar una muestra representativa de los identificadores SINIIGA, ¿estos corresponden con los documentos previamente exhibidos?", pagina: 4 },
        { id: 49, categoria: "Aspecto Físicos para supervisar", texto: "¿Las instalaciones corresponden con el tipo de servicio que tiene autorizado el PSG?", pagina: 4 },
        { id: 50, categoria: "Aspecto Físicos para supervisar", texto: "¿Las instalaciones se encuentran en condiciones operativas para la actividad autorizada del PSG?", pagina: 4 },
        { id: 51, categoria: "Aspecto Físicos para supervisar", texto: "¿Todos los corrales se encuentran identificados de manera visible con Número y/o Nombre?", pagina: 4 },
        { id: 52, categoria: "Aspecto Físicos para supervisar", texto: "¿Se clasifica a los semovientes por sexo y/o peso conforme a la Normativa Vigente?", pagina: 4 },
        { id: 53, categoria: "Aspecto Físicos para supervisar", texto: "¿Existe separación física de animales conforme a las condiciones de salud?", pagina: 4 },
        { id: 54, categoria: "Aspecto Físicos para supervisar", texto: "¿Existe el Marcado a fuego con CN en centros de acopio y engorda?", pagina: 4 },
        { id: 55, categoria: "Aspectos Sanitarios", texto: "¿Las instalaciones (corrales, mangas, embarcaderos) se observan aparentemente limpias?", pagina: 5 },
        { id: 56, categoria: "Aspectos Sanitarios", texto: "¿Existen áreas definidas para ingreso, estancia y egreso?", pagina: 5 },
        { id: 57, categoria: "Aspectos Sanitarios", texto: "¿Las actividades propias de la PSG se realizan sin prácticas que representen riesgos sanitarios evidentes?", pagina: 5 },
        { id: 58, categoria: "Aspectos Sanitarios", texto: "¿Se realiza verificación física de animales por manejo, estancia o eventos extraordinarios?", pagina: 5 },
        { id: 59, categoria: "Aspectos Sanitarios", texto: "¿Se realizan acciones sanitarias como baños o tratamientos como parte de medidas preventivas?", pagina: 5 },
        { id: 60, categoria: "Aspectos Sanitarios", texto: "¿Existe registro de la realización de las medidas preventivas?", pagina: 5 },
        { id: 61, categoria: "Aspectos Sanitarios", texto: "¿El ingreso y egreso de animales se realiza en condiciones que reducen los posibles riesgos sanitarios?", pagina: 5 },
        { id: 62, categoria: "Aspectos Sanitarios", texto: "¿El manejo físico de los animales muertos en corral se realiza en condiciones que no representan riesgo sanitario?", pagina: 5 }
    ];

    const renderTablaChecklist = (pag) => {
        const preguntasActuales = preguntasData.filter(p => p.pagina === pag);
        let categoriaAnterior = "";
        return (
            <div className="overflow-x-auto border border-gray-300 rounded shadow-sm bg-white animate-fade-in">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-200 text-gray-700 font-bold uppercase text-[10px]">
                        <tr>
                            <th className="p-2 w-8 text-center border-r border-gray-300">No.</th>
                            <th className="p-2 border-r border-gray-300">Aspecto a Evaluar</th>
                            <th className="p-2 w-8 text-center border-r border-gray-300 bg-green-100">SI</th>
                            <th className="p-2 w-8 text-center border-r border-gray-300 bg-red-100">NO</th>
                            <th className="p-2 w-8 text-center border-r border-gray-300 bg-gray-100">NA</th>
                            <th className="p-2 w-48 text-center">RECOMENDACIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {preguntasActuales.map((pregunta) => {
                            const mostrarCategoria = pregunta.categoria !== categoriaAnterior;
                            categoriaAnterior = pregunta.categoria;
                            return (
                                <React.Fragment key={pregunta.id}>
                                    {mostrarCategoria && (
                                        <tr className="bg-gray-400 text-white font-bold text-center">
                                            <td colSpan="6" className="p-1 border border-gray-300 uppercase text-xs tracking-wider">{pregunta.categoria}</td>
                                        </tr>
                                    )}
                                    <tr className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                                        <td className="p-2 text-center border-r border-gray-300 font-bold text-gray-600">{pregunta.id}</td>
                                        <td className="p-2 border-r border-gray-300 text-[11px] font-medium text-gray-800">{pregunta.texto}</td>
                                        <td className="p-2 text-center border-r border-gray-300 bg-green-50/50">
                                            <input type="radio" name={`p_${pregunta.id}`} value="SI" checked={respuestas[`p${pregunta.id}`] === 'SI'} onChange={() => handleRespuesta(pregunta.id, 'SI')} className="w-4 h-4 cursor-pointer" />
                                        </td>
                                        <td className="p-2 text-center border-r border-gray-300 bg-red-50/50">
                                            <input type="radio" name={`p_${pregunta.id}`} value="NO" checked={respuestas[`p${pregunta.id}`] === 'NO'} onChange={() => handleRespuesta(pregunta.id, 'NO')} className="w-4 h-4 cursor-pointer" />
                                        </td>
                                        <td className="p-2 text-center border-r border-gray-300 bg-gray-50/50">
                                            <input type="radio" name={`p_${pregunta.id}`} value="NA" checked={respuestas[`p${pregunta.id}`] === 'NA'} onChange={() => handleRespuesta(pregunta.id, 'NA')} className="w-4 h-4 cursor-pointer" />
                                        </td>
                                        <td className="p-1">
                                            <textarea value={recomendaciones[`p${pregunta.id}`] || ''} onChange={(e) => handleRecomendacion(pregunta.id, e.target.value)} className="w-full text-[10px] p-1 border border-gray-300 rounded resize-none outline-none focus:ring-1 focus:ring-blue-500" rows="2" placeholder="Observaciones..."></textarea>
                                        </td>
                                    </tr>
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-6 font-sans text-gray-800">
            <div className="max-w-6xl mx-auto bg-white rounded-t-xl shadow-sm p-4 md:p-6 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <img src={logoGobierno} alt="Logo Gobierno" className="h-12 md:h-16 object-contain" />
                    <div className="border-l-2 border-gray-300 pl-4 hidden md:block">
                        <h2 className="text-gray-500 font-bold text-xs tracking-widest uppercase">Secretaría de</h2>
                        <h1 className="text-red-900 font-bold text-lg uppercase">Desarrollo Rural</h1>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="font-bold text-gray-800 text-xs md:text-sm">SISTEMA ESTATAL DE INFORMACIÓN (SEIOT)</h2>
                </div>
            </div>

            <div className="max-w-6xl mx-auto bg-gray-50 p-4 border-x border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center shadow-inner">
                <div className="bg-white text-blue-600 px-6 py-2 rounded-full font-bold shadow flex items-center gap-2 border-4 border-blue-200">
                    <CheckSquare size={20} /> LISTA DE VERIFICACIÓN
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="flex-1 md:flex-none border-2 border-gray-500 rounded-full px-4 py-1 bg-white text-center flex items-center gap-2">
                        <span className="font-bold text-red-900 uppercase text-xs">PSG:</span>
                        <span className="font-bold text-gray-800 text-xs">{datosPsg.psg}</span>
                    </div>
                    <div className="flex-1 md:flex-none border-2 border-gray-500 rounded-full px-4 py-1 bg-white text-center flex items-center gap-2">
                        <span className="font-bold text-red-900 uppercase text-xs">VISITA:</span>
                        <span className="font-bold text-gray-800 text-xs">{folio}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto bg-white shadow-xl p-6 md:p-8 border border-gray-200 min-h-[500px]">

                {pagina === 1 && (
                    <div className="animate-fade-in">
                        <h3 className="text-blue-700 font-bold text-center text-lg mb-6 uppercase">I. DATOS GENERALES DEL SUJETO SUPERVISADO:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                            <div>
                                <InputBloque labelTop="(1) Nombre del Prestador de Servicios Ganaderos :" labelSide="Nombre PSG:" valor={datosPsg.nombre_titular} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloque labelTop="(2) Tipo de PSG :" labelSide="Tipo de PSG :" valor={tipoPsg} onChange={(e) => setTipoPsg(e.target.value)} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloque labelTop="(3) Nombre del Titular o Representante :" labelSide="Titular:" valor={datosPsg.representante || ""} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloque labelTop="(4) Teléfono :" labelSide="Teléfono :" valor={telefono} onChange={(e) => setTelefono(e.target.value)} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloque labelTop="(5) Municipio :" labelSide="Municipio :" valor={datosPsg.municipio} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloque labelTop="(6) Localidad :" labelSide="Localidad :" valor={datosPsg.localidad} disabled={true} puedeEditar={puedeEditar} />
                            </div>
                            <div>
                                <InputBloque labelTop="(7) Georreferencia:" labelSide="Latitud :" valor={latitud} onChange={(e) => setLatitud(e.target.value)} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloque labelTop="" labelSide="Longitud :" valor={longitud} onChange={(e) => setLongitud(e.target.value)} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloque labelTop="(8) Capacidad Instalada (Cabezas) :" labelSide="Cabezas :" valor={cabezas} onChange={(e) => setCabezas(e.target.value)} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloque labelTop="(9) Fecha de la supervisión :" labelSide="Fecha :" valor={fecha} disabled={true} puedeEditar={puedeEditar} />
                                <InputBloque labelTop="(10) Hora Inicio :" labelSide="Inicio :" tipo="time" valor={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
                                <InputBloque labelTop="(11) Hora Termino :" labelSide="Termino :" tipo="time" valor={horaTermino} onChange={(e) => setHoraTermino(e.target.value)} />
                                <InputBloque labelTop="(12) Nombre del Personal Supervisor:" labelSide="Nombre :" valor={contexto?.datosSupervisor?.nombre || supervisor} disabled={true} puedeEditar={puedeEditar} />
                            </div>
                        </div>
                    </div>
                )}

                {pagina >= 2 && pagina <= 5 && (
                    <div className="animate-fade-in space-y-4">
                        <h3 className="text-blue-700 font-bold text-center text-lg uppercase mb-2">II. LISTA DE VERIFICACIÓN (Página {pagina - 1} de 4)</h3>
                        {renderTablaChecklist(pagina)}
                    </div>
                )}

                {pagina === 6 && (
                    <div className="animate-fade-in space-y-6">
                        <div>
                            <h3 className="text-blue-700 font-bold text-center text-lg mb-2 uppercase">III. Observaciones del Supervisor</h3>
                            <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="w-full border-2 border-gray-300 rounded p-3 h-32 focus:border-blue-500 outline-none" placeholder="Escriba aquí las observaciones finales..."></textarea>
                        </div>

                        <div>
                            <h3 className="text-blue-700 font-bold text-center text-lg mb-4 uppercase">IV. Conclusión de la Supervisión</h3>
                            <div className="flex flex-wrap gap-4 justify-between bg-blue-50 p-4 rounded border border-blue-200 mb-4 font-bold text-sm">
                                <label htmlFor="conclusion-cumple" className="flex items-center gap-2 cursor-pointer">
                                    <input id="conclusion-cumple" type="radio" name="conclusion" value="cumple" checked={conclusion === 'cumple'} onChange={(e) => setConclusion(e.target.value)} className="w-4 h-4 text-blue-600" /> Cumple
                                </label>
                                <label htmlFor="conclusion-observaciones" className="flex items-center gap-2 cursor-pointer">
                                    <input id="conclusion-observaciones" type="radio" name="conclusion" value="observaciones" checked={conclusion === 'observaciones'} onChange={(e) => setConclusion(e.target.value)} className="w-4 h-4 text-blue-600" /> Presenta Observaciones
                                </label>
                                <label htmlFor="conclusion-seguimiento" className="flex items-center gap-2 cursor-pointer">
                                    <input id="conclusion-seguimiento" type="radio" name="conclusion" value="seguimiento" checked={conclusion === 'seguimiento'} onChange={(e) => setConclusion(e.target.value)} className="w-4 h-4 text-blue-600" /> Requiere Seguimiento
                                </label>
                            </div>

                            {/* Panel interactivo de instancias responsables cuando requiere seguimiento */}
                            {conclusion === 'seguimiento' && (
                                <div className="mb-6 p-4 sm:p-5 bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-xl border-2 border-amber-300 shadow-xs animate-fade-in">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/80">
                                        <div className="flex items-center gap-2.5">
                                            <span className="p-2 bg-amber-600 text-white rounded-lg shadow-xs">
                                                <Mail size={18} />
                                            </span>
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-sm">
                                                    Instancias Responsables para Notificación Automática
                                                </h4>
                                                <p className="text-xs text-gray-600">
                                                    Seleccione una, varias o las tres dependencias para remitir el expediente y observaciones:
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                            <button
                                                type="button"
                                                onClick={() => setInstanciasSeguimiento(['seder_juridico', 'cefppenay', 'senasica'])}
                                                className="text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors border border-amber-300"
                                            >
                                                Seleccionar Todas
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setInstanciasSeguimiento([])}
                                                className="text-xs font-semibold text-gray-600 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg transition-colors"
                                            >
                                                Limpiar
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                                        {INSTANCIAS_DISPONIBLES.map(inst => {
                                            const seleccionada = instanciasSeguimiento.includes(inst.id);
                                            return (
                                                <div
                                                    key={inst.id}
                                                    onClick={() => toggleInstancia(inst.id)}
                                                    className={`cursor-pointer rounded-xl p-3.5 border-2 transition-all flex flex-col justify-between select-none ${
                                                        seleccionada
                                                            ? 'bg-white border-amber-500 shadow-md ring-2 ring-amber-400/20'
                                                            : 'bg-white/70 border-gray-200 hover:border-amber-300 hover:bg-white'
                                                    }`}
                                                >
                                                    <div>
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded border ${inst.colorBadge}`}>
                                                                {inst.nombre}
                                                            </span>
                                                            <input
                                                                type="checkbox"
                                                                checked={seleccionada}
                                                                onChange={() => {}} // click en tarjeta
                                                                className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500 mt-0.5 pointer-events-none"
                                                            />
                                                        </div>
                                                        <p className="text-xs font-bold text-gray-900 line-clamp-1">{inst.titular}</p>
                                                        <p className="text-[11px] text-gray-500 mb-2">{inst.cargo}</p>
                                                    </div>
                                                    <div className="pt-2 border-t border-gray-100 space-y-1 text-[11px]">
                                                        <p className="text-gray-700 flex items-center gap-1.5 truncate" title={inst.correo}>
                                                            <span className="text-gray-400">✉</span> {inst.correo}
                                                        </p>
                                                        <p className="text-gray-700 flex items-center gap-1.5">
                                                            <span className="text-gray-400">📞</span> {inst.telefono}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-amber-200/80">
                                        <p className="text-xs">
                                            {instanciasSeguimiento.length === 0 ? (
                                                <span className="text-red-600 font-bold">⚠️ Debe seleccionar al menos una instancia responsable.</span>
                                            ) : (
                                                <span className="text-emerald-700 font-bold">✓ {instanciasSeguimiento.length} de {INSTANCIAS_DISPONIBLES.length} instancia(s) seleccionada(s) para recibir el correo oficial.</span>
                                            )}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setMostrarModalPreview(true)}
                                            className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1.5 hover:underline"
                                        >
                                            <Eye size={15} /> Ver vista previa del correo oficial
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 border border-gray-200 rounded">
                                <div className="space-y-3">
                                    <div><label className="block text-xs font-bold text-blue-800 mb-1">Responsable del Supervisor:</label><input type="text" value={responsableSupervisor} onChange={(e) => setResponsableSupervisor(e.target.value)} className="w-full border p-2 bg-white rounded outline-none" /></div>
                                    <div><label className="block text-xs font-bold text-blue-800 mb-1">Domicilio del Testigo:</label><input type="text" value={domicilioTestigo} onChange={(e) => setDomicilioTestigo(e.target.value)} className="w-full border p-2 bg-white rounded outline-none" /></div>
                                    <div><label className="block text-xs font-bold text-blue-800 mb-1">Número de Identificación del Testigo:</label><input type="text" value={numeroIdTestigo} onChange={(e) => setNumeroIdTestigo(e.target.value)} className="w-full border p-2 bg-white rounded outline-none" /></div>
                                </div>
                                <div className="space-y-3">
                                    <div><label className="block text-xs font-bold text-blue-800 mb-1">Responsable del PSG:</label><input type="text" value={responsablePsg} onChange={(e) => setResponsablePsg(e.target.value)} className="w-full border p-2 bg-white rounded outline-none" /></div>
                                    <div><label className="block text-xs font-bold text-blue-800 mb-1">Nombre del Testigo:</label><input type="text" value={nombreTestigo} onChange={(e) => setNombreTestigo(e.target.value)} className="w-full border p-2 bg-white rounded outline-none" /></div>
                                    <div><label className="block text-xs font-bold text-blue-800 mb-1">Tipo de Identificación del Testigo:</label><input type="text" value={tipoIdTestigo} onChange={(e) => setTipoIdTestigo(e.target.value)} className="w-full border p-2 bg-white rounded outline-none" /></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="max-w-6xl mx-auto mt-6 flex justify-between items-center bg-white p-4 rounded-b-xl shadow-md border border-gray-200">
                <div className="flex gap-2">
                    <button onClick={() => navigate('/dashboard')} className="bg-red-700 text-white p-2 rounded-full shadow hover:bg-red-800 transition-colors">
                        <Home size={22} />
                    </button>
                    {pagina > 1 && (
                        <button onClick={() => setPagina(pagina - 1)} className="bg-blue-800 text-white px-4 py-2 rounded-full shadow hover:bg-blue-900 flex items-center gap-2 text-sm font-bold">
                            <ChevronLeft size={20} /> ANTERIOR
                        </button>
                    )}
                </div>

                <div className="hidden md:flex items-center gap-2">
                    {[1, 2, 3, 4, 5, 6].map(num => (
                        <button
                            key={num}
                            type="button"
                            onClick={() => setPagina(num)}
                            title={`Ir a Página ${num}${num === 1 ? ' (Datos Generales)' : num === 6 ? ' (Conclusión y Cierre)' : ` (Checklist parte ${num - 1})`}`}
                            className={`transition-all rounded-full ${
                                pagina === num
                                    ? 'w-6 h-3 bg-blue-600 rounded-full'
                                    : 'w-3 h-3 bg-gray-300 hover:bg-blue-400 hover:scale-125'
                            }`}
                        />
                    ))}
                </div>

                <div className="flex gap-2 items-center">
                    {pagina < 6 && (
                        <button
                            type="button"
                            onClick={() => setPagina(6)}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-full shadow hover:shadow-md flex items-center gap-1.5 text-xs font-bold transition-all animate-pulse"
                            title="Saltar directamente a la Conclusión, Observaciones y Cierre (Página 6)"
                        >
                            SALTAR AL FINAL <ChevronsRight size={18} />
                        </button>
                    )}
                    {pagina < 6 ? (
                        <button onClick={() => setPagina(pagina + 1)} className="bg-blue-800 text-white px-4 py-2 rounded-full shadow hover:bg-blue-900 flex items-center gap-2 text-sm font-bold">
                            SIGUIENTE <ChevronRight size={20} />
                        </button>
                    ) : (
                        <div className="flex gap-2 items-center flex-wrap">
                            {!soloVista && <>
                            <button onClick={guardarBorrador} className="bg-yellow-500 text-white px-4 py-2 rounded shadow hover:bg-yellow-600 flex items-center gap-2 text-xs font-bold">
                                <Save size={16} /> BORRADOR
                            </button>
                            <label className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 flex items-center gap-2 text-xs font-bold cursor-pointer">
                                <FolderOpen size={16} /> CARGAR
                                <input type="file" accept=".smpbk" className="hidden" onChange={cargarBorrador} />
                            </label>
                            </>}
                            {puedeDescargar && <button 
                                onClick={() => generarPdfModulo3({
                                    nombre_psg: datosPsg.nombre_titular,
                                    tipo_psg: tipoPsg,
                                    nombre_titular: datosPsg.representante || '',
                                    municipio: datosPsg.municipio,
                                    localidad: datosPsg.localidad,
                                    latitud, longitud, cabezas, telefono,
                                    fecha, hora_inicio: horaInicio, hora_termino: horaTermino,
                                    nombre_supervisor: contexto?.datosSupervisor?.nombre || supervisor,
                                    respuestas, recomendaciones,
                                    observaciones,
                                    cumple: conclusion === 'cumple',
                                    presenta_observaciones: conclusion === 'observaciones',
                                    requiere_seguimiento: conclusion === 'seguimiento',
                                    responsable_psg: responsablePsg,
                                    responsable_supervisor: responsableSupervisor,
                                    nombre_testigo: nombreTestigo
                                })}
                                className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2 text-sm font-bold"
                            >
                                <Download size={18} /> DESCARGAR
                            </button>}
                            <BotonSubirFirmado visita_id={contexto.visita_id} modulo={3} />
                            {!soloVista && <button onClick={handleGuardar} className="bg-green-600 text-white px-6 py-2 rounded shadow-lg hover:bg-green-700 flex items-center gap-2 text-sm font-bold animate-pulse">
                                <Save size={20} /> GUARDAR CHECKLIST
                            </button>}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Vista Previa del Correo Oficial */}
            {mostrarModalPreview && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-200">
                        <div className="bg-gradient-to-r from-red-900 to-red-800 p-4 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Mail size={20} className="text-amber-400" />
                                <h3 className="font-bold text-sm md:text-base">Vista Previa: Correo Oficial de Seguimiento</h3>
                            </div>
                            <button
                                onClick={() => setMostrarModalPreview(false)}
                                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4 bg-gray-50 border-b border-gray-200">
                            <div className="bg-white p-4 rounded-xl border border-gray-300 shadow-xs text-xs font-mono whitespace-pre-wrap leading-relaxed text-gray-800">
{`A quien corresponda:
Por medio del presente, el Sistema Estatal de Información de Origen y Trazabilidad (SEIOT) informa que, como resultado de la supervisión realizada a la PSG que se detalla a continuación, se determinó que requiere seguimiento:

PSG: ${contexto?.datosPsg?.psg || contexto?.folio || 'N/D'}
Nombre o razón social: ${datosPsg?.nombre_titular || datosPsg?.representante || 'N/D'}
Municipio: ${datosPsg?.municipio || 'N/D'}
Fecha de supervisión: ${fecha || new Date().toLocaleDateString('es-MX')}
Supervisor: ${contexto?.datosSupervisor?.nombre || supervisor || 'N/D'}
Instancias seleccionadas para seguimiento: ${
    instanciasSeguimiento.length > 0
        ? instanciasSeguimiento.map(id => INSTANCIAS_DISPONIBLES.find(i => i.id === id)?.nombre).join(' / ')
        : '[NINGUNA INSTANCIA SELECCIONADA AÚN]'
}
Motivo u observaciones: ${observaciones.trim() || '[Sin observaciones registradas]'}

Se solicita a las instancias señaladas revisar la información, realizar las acciones que correspondan conforme a sus atribuciones y registrar en el SEIOT el seguimiento y, en su caso, la atención brindada.

Para consultar el expediente y las observaciones de la supervisión, ingrese al siguiente enlace:
[ENLACE DIRECTO AL EXPEDIENTE EN EL SEIOT]

--------------------------------------------------
ACCESO PERMANENTE AL PORTAL SEIOT:
Portal web: ${window.location.origin}/login
Usuario asignado: [USUARIO_INSTANCIA]
Contraseña inicial: [CONTRASEÑA_TEMPORAL]
--------------------------------------------------

Este correo fue generado automáticamente por el SEIOT. Favor de no responder a esta dirección.`}
                            </div>
                            
                            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-900 text-xs">
                                💡 <strong>Nota del Sistema:</strong> Cada una de las {instanciasSeguimiento.length || 0} instancia(s) seleccionada(s) recibirá este correo con su enlace directo exclusivo para acceder al expediente y registrar su dictamen.
                            </div>
                        </div>
                        
                        <div className="p-4 bg-white flex justify-end">
                            <button
                                onClick={() => setMostrarModalPreview(false)}
                                className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-bold text-xs shadow"
                            >
                                Cerrar Vista Previa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListaVerificacion;