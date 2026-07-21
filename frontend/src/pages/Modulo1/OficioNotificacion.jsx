import { apiFetch } from '../../utils/api.js';
import React, { useState, useEffect } from 'react';
import { Save, FileText, Home, ChevronRight, HelpCircle, Download, Upload, FolderOpen } from 'lucide-react';
import BotonSubirFirmado from '../../components/BotonSubirFirmado';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoGobierno from '../../assets/logo-gobierno.jpg';
import { generarPdfModulo1 } from '../../utils/generarPdfModulo1';
import InputBloque from '../../components/InputBloque';
import { guardarBorradorLocal, cargarBorradorLocal } from '../../utils/borradorHelpers.js';

const Notificacion = () => {
    const navigate = useNavigate();
    const { usuario } = useAuth();
    const puedeDescargar = usuario?.es_admin || usuario?.permisos?.descargar_pdfs;
    const puedeEditar = usuario?.es_admin || usuario?.permisos?.editar_campos;
    const soloVista = usuario?.rol === 'vista';
    const puedeAcceder = usuario?.es_admin || usuario?.permisos?.modulo1 || usuario?.rol === 'vista';
    
    const [contexto] = useState(() => {
        const guardado = localStorage.getItem('visitaActiva');
        return guardado ? JSON.parse(guardado) : null;
    });

    const [nombreServidor, setNombreServidor] = useState("");
    const [cargoServidor, setCargoServidor] = useState("");
    const [domicilio, setDomicilio] = useState(contexto?.datosPsg?.domicilio || "");
    const [cargando, setCargando] = useState(true);

    // ── CARGAR DATOS GUARDADOS EN BD ─────────────────────────────────────────
    useEffect(() => {
        if (!contexto?.visita_id) { setCargando(false); return; }

        const cargarDatos = async () => {
            try {
                const response = await apiFetch(`/api/modulos/modulo1/${contexto.visita_id}`);
                if (!response) return; 
                if (response.ok) {
                    const data = await response.json();
                    if (data.existe && data.datos) {
                        const d = data.datos;
                        if (d.nombre_servidor) setNombreServidor(d.nombre_servidor);
                        if (d.cargo_servidor) setCargoServidor(d.cargo_servidor);
                        if (d.domicilio) setDomicilio(d.domicilio);
                    }
                }
            } catch (error) {
                console.error('Error cargando datos módulo 1:', error);
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
    }, [contexto?.visita_id]);

    // ── BORRADOR .smpbk ──────────────────────────────────────────────────────
    const guardarBorrador = () => {
        guardarBorradorLocal(1, contexto, { nombreServidor, cargoServidor, domicilio });
    };

    const cargarBorrador = (e) => {
        cargarBorradorLocal(e, 1, contexto, {
            nombreServidor: setNombreServidor,
            cargoServidor: setCargoServidor,
            domicilio: setDomicilio
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
        }
    }, [contexto, navigate]);

    if (!contexto) return null;
    if (cargando) return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <p className="text-gray-500 font-bold animate-pulse">Cargando datos...</p>
        </div>
    );

    const { folio, datosPsg } = contexto;

    const oficioNoAutomatico = folio;
    const fechaTextoAutomatica = new Date().toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const handleGuardar = async () => {
        try {
            const response = await apiFetch('/api/modulos/modulo1', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visita_id: contexto.visita_id,
                    fecha_emision: new Date().toISOString().split('T')[0],
                    localidad: datosPsg.localidad,
                    municipio: datosPsg.municipio,
                    estado: 'NAYARIT',
                    nombre_psg: datosPsg.nombre_titular,
                    domicilio: domicilio,
                    nombre_servidor: nombreServidor,
                    cargo_servidor: cargoServidor
                })
            });

            if (!response) return; // null-check: si el token expiró, apiFetch ya redirigió
            if (response.ok) {
                const contextoActualizado = {
                    ...contexto,
                    avance: { ...contexto.avance, modulo1: true }
                };
                localStorage.setItem('visitaActiva', JSON.stringify(contextoActualizado));
                alert("¡Oficio de Notificación Guardado!");
                navigate('/dashboard');
            } else {
                alert("Error al guardar, intenta de nuevo.");
            }
        } catch (error) {
            console.error('Error guardando módulo 1:', error);
            alert("Error de conexión al guardar.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-6 font-sans text-gray-800">
            {/* ENCABEZADO SUPERIOR */}
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

            {/* BARRA DE FOLIOS */}
            <div className="max-w-4xl mx-auto bg-gray-50 p-4 border-x border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center shadow-inner">
                <div className="bg-white text-blue-600 px-6 py-2 rounded-full font-bold shadow flex items-center gap-2 border-4 border-blue-200">
                    <FileText size={20} /> OFICIO DE NOTIFICACIÓN
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

            {/* CUERPO DEL OFICIO */}
            <div className="max-w-4xl mx-auto bg-white shadow-xl p-6 md:p-10 border border-gray-200">
                <h3 className="text-blue-700 font-bold text-center text-lg mb-8 uppercase underline decoration-2 underline-offset-8">
                    OFICIO DE NOTIFICACIÓN DEL SUPERVISOR
                </h3>
                
                <div className="space-y-8">
                    <div>
                        <h4 className="text-blue-800 font-bold mb-2 uppercase text-xs">1. Oficio (Automático)</h4>
                        <InputBloque labelSide="Oficio No." valor={oficioNoAutomatico} disabled={true} />
                    </div>

                    <div>
                        <h4 className="text-blue-800 font-bold mb-2 uppercase text-xs">2. Lugar y Fecha (Automático)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                            <InputBloque labelSide="Localidad" valor={datosPsg.localidad} disabled={true} />
                            <InputBloque labelSide="Municipio" valor={datosPsg.municipio} disabled={true} />
                            <InputBloque labelSide="Estado" valor="NAYARIT" disabled={true} />
                            <InputBloque labelSide="Fecha Emisión" valor={fechaTextoAutomatica} disabled={true} />
                        </div>
                    </div>

                    <div>
                        <h4 className="text-blue-800 font-bold mb-2 uppercase text-xs">3. Prestador de Servicios Ganaderos</h4>
                        <InputBloque labelSide="PSG" valor={datosPsg.nombre_titular} disabled={true} />
                    </div>

                    <div>
                        <h4 className="text-blue-800 font-bold mb-2 uppercase text-xs">4. Domicilio</h4>
                        <InputBloque labelSide="Domicilio" valor={domicilio} onChange={(e) => setDomicilio(e.target.value)} disabled={true} puedeEditar={puedeEditar && !soloVista} />
                    </div>

                    <div>
                        <h4 className="text-blue-800 font-bold mb-2 uppercase text-xs">5. Servidor Público Autorizado (A mano)</h4>
                        <InputBloque 
                            labelSide="Nombre" 
                            valor={nombreServidor} 
                            onChange={(e) => setNombreServidor(e.target.value)}
                            disabled={false}
                            placeholder="Escribe el nombre del servidor público..."
                        />
                    </div>

                    <div>
                        <h4 className="text-blue-800 font-bold mb-2 uppercase text-xs">6. Cargo del Servidor Público (A mano)</h4>
                        <InputBloque 
                            labelSide="Cargo" 
                            valor={cargoServidor} 
                            onChange={(e) => setCargoServidor(e.target.value)}
                            disabled={false}
                            placeholder="Escribe el cargo del servidor público..."
                        />
                    </div>
                </div>
            </div>

            {/* BARRA DE NAVEGACIÓN INFERIOR */}
            <div className="max-w-4xl mx-auto mt-6 flex flex-wrap justify-between items-center bg-white p-4 rounded-b-xl shadow-md border border-gray-200 gap-4">
                <div className="flex gap-2">
                    <button className="bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600 flex items-center gap-2 text-xs font-bold transition-all active:scale-95">
                        <HelpCircle size={16} /> GUÍA
                    </button>
                    {puedeDescargar && !soloVista && <button 
                        onClick={() => generarPdfModulo1({
                            oficio_no: folio,
                            fecha_emision: new Date().toISOString(),
                            nombre_psg: datosPsg.nombre_titular,
                            domicilio: domicilio,
                            nombre_servidor: nombreServidor,
                            cargo_servidor: cargoServidor
                        })}
                        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2 text-xs font-bold"
                    >
                        <Download size={16} /> DESCARGAR OFICIO PRELLENADO
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
                    <BotonSubirFirmado visita_id={contexto.visita_id} modulo={1} />
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

export default Notificacion;