import { apiFetch } from '../../utils/api.js';
import React, { useState, useEffect } from 'react';
import { Save, FileText, Home, ChevronRight, HelpCircle, Download, FolderOpen } from 'lucide-react';
import BotonSubirFirmado from '../../components/BotonSubirFirmado';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoGobierno from '../../assets/logo-gobierno.jpg';
import { generarPdfModulo2 } from '../../utils/generarPdfModulo2';
import InputBloque from '../../components/InputBloque';
import { guardarBorradorLocal, cargarBorradorLocal } from '../../utils/borradorHelpers.js';

const OrdenSupervision = () => {
    const navigate = useNavigate();
    const { usuario } = useAuth();
    const puedeDescargar = usuario?.es_admin || usuario?.permisos?.descargar_pdfs;
    const puedeEditar = usuario?.es_admin || usuario?.permisos?.editar_campos;
    const soloVista = usuario?.rol === 'vista';
    const puedeAcceder = usuario?.es_admin || usuario?.permisos?.modulo2 || usuario?.rol === 'vista';
    
    const [contexto] = useState(() => {
        const guardado = localStorage.getItem('visitaActiva');
        return guardado ? JSON.parse(guardado) : null;
    });

    const [oficioNo] = useState(contexto?.folio || "");
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [calidadSujeto, setCalidadSujeto] = useState("Responsable del Establecimiento");
    const [nombrePC, setNombrePC] = useState(contexto?.datosSupervisor?.nombre || "");
    const [cargoPC, setCargoPC] = useState(contexto?.datosSupervisor?.cargo || "");
    const [adscripcion, setAdscripcion] = useState(contexto?.datosSupervisor?.adscripcion || "SECRETARIA DE DESARROLLO RURAL");
    const [tipoIdentificacion, setTipoIdentificacion] = useState(contexto?.datosSupervisor?.tipo_identificacion || "");
    const [folioIdentificacion, setFolioIdentificacion] = useState(contexto?.datosSupervisor?.folio_identificacion || "");
    const [domicilio, setDomicilio] = useState(contexto?.datosPsg?.domicilio || "");
    const [nombreOrdena, setNombreOrdena] = useState("");
    const [cargando, setCargando] = useState(true);

    const { folio, datosPsg } = contexto || {};

    // ── CARGAR DATOS GUARDADOS EN BD ─────────────────────────────────────────
    useEffect(() => {
        if (!contexto?.visita_id) { setCargando(false); return; }

        const cargarDatos = async () => {
            try {
                const response = await apiFetch(`/api/modulos/modulo2/${contexto.visita_id}`);
                if (!response) return; 
                if (response.ok) {
                    const data = await response.json();
                    if (data.existe && data.datos) {
                        const d = data.datos;
                        if (d.fecha) setFecha(d.fecha.split('T')[0]);
                        if (d.calidad_sujeto) setCalidadSujeto(d.calidad_sujeto);
                        if (d.nombre_pc) setNombrePC(d.nombre_pc);
                        if (d.cargo_pc) setCargoPC(d.cargo_pc);
                        if (d.adscripcion) setAdscripcion(d.adscripcion);
                        if (d.tipo_identificacion) setTipoIdentificacion(d.tipo_identificacion);
                        if (d.folio_identificacion) setFolioIdentificacion(d.folio_identificacion);
                        if (d.domicilio) setDomicilio(d.domicilio);
                        if (d.nombre_ordena) setNombreOrdena(d.nombre_ordena);
                    }
                }
            } catch (error) {
                console.error('Error cargando datos módulo 2:', error);
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
    }, [contexto?.visita_id]);

    // ── BORRADOR .smpbk ──────────────────────────────────────────────────────
    const guardarBorrador = () => {
        guardarBorradorLocal(2, contexto, { fecha, calidadSujeto, domicilio, nombreOrdena, tipoIdentificacion, folioIdentificacion, nombrePC, cargoPC, adscripcion });
    };

    const cargarBorrador = (e) => {
        cargarBorradorLocal(e, 2, contexto, {
            fecha: setFecha,
            calidadSujeto: setCalidadSujeto,
            domicilio: setDomicilio,
            nombreOrdena: setNombreOrdena,
            tipoIdentificacion: setTipoIdentificacion,
            folioIdentificacion: setFolioIdentificacion,
            nombrePC: setNombrePC,
            cargoPC: setCargoPC,
            adscripcion: setAdscripcion
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
        if (!contexto.avance?.modulo1) {
            alert("⚠️ Debes completar el Módulo 1 (Oficio de Notificación) antes de acceder a la Orden de Supervisión.");
            navigate('/dashboard');
        }
    }, [contexto, navigate]);

    const handleGuardar = async () => {
        try {
            const response = await apiFetch('/api/modulos/modulo2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visita_id: contexto.visita_id,
                    fecha,
                    nombre_psg: datosPsg.nombre_titular,
                    domicilio: domicilio,
                    calidad_sujeto: calidadSujeto,
                    nombre_pc: nombrePC,
                    cargo_pc: cargoPC,
                    adscripcion,
                    tipo_identificacion: tipoIdentificacion,
                    folio_identificacion: folioIdentificacion,
                    nombre_ordena: nombreOrdena
                })
            });

            if (!response) return; // null-check: si el token expiró, apiFetch ya redirigió
            if (!response.ok) { alert("Error al guardar."); return; }

            const contextoActualizado = {
                ...contexto,
                avance: { ...contexto.avance, modulo2: true }
            };
            localStorage.setItem('visitaActiva', JSON.stringify(contextoActualizado));
            alert("¡Orden de Supervisión Guardada!");
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
        <div className="min-h-screen bg-gray-100 p-4 md:p-6 font-sans text-gray-800">
            
            <div className="max-w-4xl mx-auto bg-white rounded-t-xl shadow-sm p-4 md:p-6 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <img src={logoGobierno} alt="Logo Gobierno" className="h-12 md:h-16 object-contain" />
                    <div className="border-l-2 border-gray-300 pl-4 hidden md:block">
                        <h2 className="text-gray-500 font-bold text-xs tracking-widest uppercase">Secretaría de</h2>
                        <h1 className="text-red-900 font-bold text-lg uppercase">Desarrollo Rural</h1>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="font-bold text-gray-800 text-xs md:text-sm tracking-tighter">SISTEMA ESTATAL DE INFORMACIÓN (SEIOT)</h2>
                </div>
            </div>

            <div className="max-w-4xl mx-auto bg-gray-50 p-4 border-x border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center shadow-inner">
                <div className="bg-white text-blue-600 px-6 py-2 rounded-full font-bold shadow flex items-center gap-2 border-4 border-blue-200">
                    <FileText size={20} /> ORDEN DE SUPERVISIÓN
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="flex-1 border-2 border-gray-500 rounded-full px-4 py-1 bg-white text-center flex items-center gap-2">
                        <span className="font-bold text-red-900 uppercase text-xs">PSG:</span>
                        <span className="font-bold text-gray-800 text-sm">{datosPsg.psg}</span>
                    </div>
                    <div className="flex-1 border-2 border-gray-500 rounded-full px-4 py-1 bg-white text-center flex items-center gap-2">
                        <span className="font-bold text-red-900 uppercase text-xs">VISITA:</span>
                        <span className="font-bold text-gray-800 text-sm">{folio}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto bg-white shadow-xl p-6 md:p-10 border border-gray-200">
                <div className="space-y-6">
                    
                    <div>
                        <h4 className="text-blue-800 font-bold mb-1 uppercase text-xs">1. Oficio:</h4>
                        <InputBloque labelSide="Oficio No." valor={oficioNo} disabled={true} puedeEditar={puedeEditar} />
                    </div>

                    <div>
                        <h4 className="text-blue-800 font-bold mb-1 uppercase text-xs">2. Fecha:</h4>
                        <InputBloque labelSide="Fecha" valor={fecha} onChange={(e) => setFecha(e.target.value)} tipo="date" />
                    </div>

                    <div>
                        <h4 className="text-blue-800 font-bold mb-1 uppercase text-xs">3. Nombre del sujeto a supervisar:</h4>
                        <InputBloque labelSide="Nombre" valor={datosPsg.nombre_titular} disabled={true} puedeEditar={puedeEditar} />
                    </div>

                    <div>
                        <h4 className="text-blue-800 font-bold mb-1 uppercase text-xs">4. Domicilio / Ubicación:</h4>
                        <InputBloque labelSide="Dom / Ubi" valor={domicilio} onChange={(e) => setDomicilio(e.target.value)} disabled={true} puedeEditar={puedeEditar} />
                    </div>

                    <div>
                        <h4 className="text-blue-800 font-bold mb-1 uppercase text-xs">5. Calidad de sujeto:</h4>
                        <InputBloque labelSide="Calidad S." valor={calidadSujeto} onChange={(e) => setCalidadSujeto(e.target.value)} disabled={true} puedeEditar={puedeEditar} />
                    </div>

                    <div>
                        <h4 className="text-blue-800 font-bold mb-1 uppercase text-xs">6. Nombre del personal comisionado:</h4>
                        <InputBloque labelSide="Nombre P.C." valor={nombrePC} onChange={(e) => setNombrePC(e.target.value)} disabled={true} puedeEditar={puedeEditar} />
                    </div>

                    <div>
                        <h4 className="text-blue-800 font-bold mb-1 uppercase text-xs">7. Cargo del personal comisionado:</h4>
                        <InputBloque labelSide="Cargo P.C." valor={cargoPC} onChange={(e) => setCargoPC(e.target.value)} disabled={true} puedeEditar={puedeEditar} />
                    </div>

                    <div>
                        <h4 className="text-blue-800 font-bold mb-1 uppercase text-xs">8. Adscripción del personal comisionado:</h4>
                        <InputBloque labelSide="Adscripción" valor={adscripcion} onChange={(e) => setAdscripcion(e.target.value)} disabled={true} puedeEditar={puedeEditar} />
                    </div>

                    <div className="border-l-4 border-blue-600 pl-4 py-2 bg-blue-50/30 rounded-r">
                        <h4 className="text-blue-800 font-bold mb-3 uppercase text-xs">9. Identificación oficial vigente:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputBloque labelSide="Tipo de Identificación" valor={tipoIdentificacion} onChange={(e) => setTipoIdentificacion(e.target.value)} disabled={true} puedeEditar={puedeEditar} />
                            <InputBloque labelSide="Folio Identificación" valor={folioIdentificacion} onChange={(e) => setFolioIdentificacion(e.target.value)} disabled={true} puedeEditar={puedeEditar} />
                        </div>
                    </div>

                    <div>
                        <h4 className="text-blue-800 font-bold mb-1 uppercase text-xs">10. Nombre de quien ordena:</h4>
                        <InputBloque 
                            labelSide="Nombre u Ordena" 
                            valor={nombreOrdena} 
                            onChange={(e) => setNombreOrdena(e.target.value)}
                            disabled={false}
                            placeholder="Escribe el nombre o dependencia de quien ordena..."
                        />
                    </div>

                </div>
            </div>

            <div className="max-w-4xl mx-auto mt-6 flex flex-wrap justify-between items-center bg-white p-4 rounded-b-xl shadow-md border border-gray-200 gap-4 mb-10">
                <div className="flex gap-2">
                    {puedeDescargar && !soloVista && <button 
                        onClick={() => generarPdfModulo2({ 
                            oficio_no: folio, 
                            fecha, 
                            nombre_psg: datosPsg.nombre_titular, 
                            calidad_sujeto: calidadSujeto, 
                            domicilio, 
                            nombre_pc: nombrePC, 
                            cargo_pc: cargoPC, 
                            adscripcion, 
                            nombre_ordena: nombreOrdena 
                        })} 
                        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2 text-xs font-bold transition-all active:scale-95"
                    >
                        <Download size={16} /> DESCARGAR
                    </button>}
                    {!soloVista && <>
                    <button onClick={guardarBorrador} className="bg-yellow-500 text-white px-4 py-2 rounded shadow hover:bg-yellow-600 flex items-center gap-2 text-xs font-bold transition-all active:scale-95">
                        <Save size={16} /> BORRADOR
                    </button>
                    <label className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 flex items-center gap-2 text-xs font-bold cursor-pointer transition-all active:scale-95">
                        <FolderOpen size={16} /> CARGAR
                        <input type="file" accept=".smpbk" className="hidden" onChange={cargarBorrador} />
                    </label>
                    </>}
                    <BotonSubirFirmado visita_id={contexto.visita_id} modulo={2} />
                </div>

                <div className="flex gap-3">
                    <button onClick={() => navigate('/dashboard')} className="bg-red-700 text-white p-2 rounded-full shadow hover:bg-red-800 transition-colors">
                        <Home size={22} />
                    </button>
                    {!soloVista && <button onClick={handleGuardar} className="bg-gray-800 text-white px-6 py-2 rounded shadow hover:bg-gray-900 flex items-center gap-2 text-sm font-bold transition-transform active:scale-95">
                        PÁGINA SIGUIENTE <ChevronRight size={18} />
                    </button>}
                </div>
            </div>
        </div>
    );
};

export default OrdenSupervision;