import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Cloud, HardDrive, FileText, Download, Upload, Trash2, Eye, 
  RefreshCw, Search, Filter, CheckCircle2, AlertTriangle, X, 
  ArrowLeft, ExternalLink, ShieldAlert, FileCheck, Layers, 
  Calendar, Hash, Building2, Server, FolderArchive, ArrowUpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import Navbar from '../../components/Navbar';

export default function NubeDisco() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  // Estados de datos
  const [cargando, setCargando] = useState(true);
  const [metricas, setMetricas] = useState(null);
  const [archivos, setArchivos] = useState([]);
  const [pendientesBD, setPendientesBD] = useState([]);
  const [mensajeAlerta, setMensajeAlerta] = useState(null);

  // Estados de filtros y búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroModulo, setFiltroModulo] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [vistaCuadricula, setVistaCuadricula] = useState(false);
  const [mostrarPendientes, setMostrarPendientes] = useState(false);

  // Estados de modales y acciones
  const [archivoPrevisualizar, setArchivoPrevisualizar] = useState(null);
  const [urlPrevisualizacion, setUrlPrevisualizacion] = useState(null);
  const [cargandoPrevisualizacion, setCargandoPrevisualizacion] = useState(false);
  const [archivoEliminar, setArchivoEliminar] = useState(null);
  const [eliminarDeBD, setEliminarDeBD] = useState(false);
  const [procesandoAccion, setProcesandoAccion] = useState(false);

  // Estado de subida de archivos (Drag & Drop)
  const [arrastrando, setArrastrando] = useState(false);
  const [subiendoArchivos, setSubiendoArchivos] = useState(false);
  const [progresoSubida, setProgresoSubida] = useState('');
  const fileInputRef = useRef(null);

  // Si no es SuperAdmin, denegar acceso inmediatamente
  const esSuperAdmin = Boolean(usuario?.superadmin);

  // Cargar métricas y lista de archivos
  const cargarDatosDisco = async () => {
    setCargando(true);
    setMensajeAlerta(null);
    try {
      // 1. Obtener estado del disco
      const resEstado = await apiFetch('/api/superadmin/disco/estado');
      if (resEstado && resEstado.ok) {
        const datosEstado = await resEstado.json();
        setMetricas(datosEstado);
      }

      // 2. Obtener lista de archivos y pendientes
      const resArchivos = await apiFetch('/api/superadmin/disco/archivos');
      if (resArchivos && resArchivos.ok) {
        const datosArchivos = await resArchivos.json();
        setArchivos(datosArchivos.archivos || []);
        setPendientesBD(datosArchivos.registrosSinArchivo || []);
      }
    } catch (err) {
      console.error('Error cargando datos del disco:', err);
      setMensajeAlerta({
        tipo: 'error',
        texto: 'Error de comunicación con el servidor al consultar el disco persistente.'
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (esSuperAdmin) {
      cargarDatosDisco();
    }
  }, [esSuperAdmin]);

  // Manejo de Previsualización de PDF
  const handlePrevisualizar = async (archivo) => {
    setArchivoPrevisualizar(archivo);
    setCargandoPrevisualizacion(true);
    setUrlPrevisualizacion(null);
    try {
      const res = await apiFetch(`/api/superadmin/disco/descargar/${encodeURIComponent(archivo.nombre)}?inline=true`);
      if (!res || !res.ok) {
        throw new Error('No se pudo cargar el archivo desde el disco.');
      }
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      setUrlPrevisualizacion(objUrl);
    } catch (err) {
      setMensajeAlerta({ tipo: 'error', texto: err.message });
      setArchivoPrevisualizar(null);
    } finally {
      setCargandoPrevisualizacion(false);
    }
  };

  const cerrarPrevisualizador = () => {
    if (urlPrevisualizacion) {
      URL.revokeObjectURL(urlPrevisualizacion);
    }
    setUrlPrevisualizacion(null);
    setArchivoPrevisualizar(null);
  };

  // Manejo de Descarga Individual
  const handleDescargar = async (archivo) => {
    try {
      const res = await apiFetch(`/api/superadmin/disco/descargar/${encodeURIComponent(archivo.nombre)}`);
      if (!res || !res.ok) throw new Error('Error al descargar archivo.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = archivo.nombre;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMensajeAlerta({ tipo: 'error', texto: err.message });
    }
  };

  // Manejo de Descarga Total en ZIP
  const handleDescargarTodo = async () => {
    if (archivos.length === 0) {
      setMensajeAlerta({ tipo: 'warning', texto: 'No hay archivos en el disco para descargar.' });
      return;
    }
    setProcesandoAccion(true);
    try {
      const res = await apiFetch('/api/superadmin/disco/descargar-todo');
      if (!res || !res.ok) throw new Error('Error al generar el archivo ZIP de respaldo.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const fechaHoy = new Date().toISOString().split('T')[0];
      const a = document.createElement('a');
      a.href = url;
      a.download = `seiot-respaldo-disco-${fechaHoy}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMensajeAlerta({ tipo: 'exito', texto: '✅ Respaldo completo descargado exitosamente.' });
    } catch (err) {
      setMensajeAlerta({ tipo: 'error', texto: err.message });
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Manejo de Eliminación
  const confirmarEliminar = async () => {
    if (!archivoEliminar) return;
    setProcesandoAccion(true);
    try {
      const queryParam = eliminarDeBD ? '?eliminarDeBD=true' : '';
      const res = await apiFetch(`/api/superadmin/disco/archivo/${encodeURIComponent(archivoEliminar.nombre)}${queryParam}`, {
        method: 'DELETE'
      });
      if (!res || !res.ok) throw new Error('Error al eliminar archivo.');
      const data = await res.json();
      setMensajeAlerta({ tipo: 'exito', texto: `✅ ${data.mensaje}` });
      setArchivoEliminar(null);
      cargarDatosDisco();
    } catch (err) {
      setMensajeAlerta({ tipo: 'error', texto: err.message });
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Manejo de Subida de Archivos
  const procesarSubidaArchivos = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setSubiendoArchivos(true);
    setProgresoSubida(`Subiendo ${fileList.length} archivo(s)...`);
    setMensajeAlerta(null);

    const formData = new FormData();
    for (let i = 0; i < fileList.length; i++) {
      formData.append('archivos', fileList[i]);
    }

    try {
      const res = await apiFetch('/api/superadmin/disco/subir', {
        method: 'POST',
        body: formData
      });

      if (!res || !res.ok) {
        const errorData = await res?.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al subir archivos al servidor.');
      }

      const resultado = await res.json();
      setMensajeAlerta({
        tipo: 'exito',
        texto: resultado.mensaje || '✅ Archivos subidos y vinculados con éxito.'
      });
      await cargarDatosDisco();
    } catch (err) {
      console.error('Error en subida:', err);
      setMensajeAlerta({ tipo: 'error', texto: err.message });
    } finally {
      setSubiendoArchivos(false);
      setProgresoSubida('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handlers para Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setArrastrando(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setArrastrando(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setArrastrando(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      procesarSubidaArchivos(e.dataTransfer.files);
    }
  };

  // Filtrar archivos en vivo
  const archivosFiltrados = archivos.filter((arc) => {
    // Filtro por texto
    const matchBusqueda =
      arc.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (arc.folio && arc.folio.toLowerCase().includes(busqueda.toLowerCase())) ||
      (arc.empresa && arc.empresa.toLowerCase().includes(busqueda.toLowerCase())) ||
      (arc.visitaId && arc.visitaId.toString().includes(busqueda));

    // Filtro por módulo
    const matchModulo =
      filtroModulo === 'todos' ||
      (arc.modulo && arc.modulo.toString() === filtroModulo);

    // Filtro por estado
    const matchEstado =
      filtroEstado === 'todos' ||
      (filtroEstado === 'vinculado' && arc.enBaseDatos) ||
      (filtroEstado === 'huerfano' && !arc.enBaseDatos);

    return matchBusqueda && matchModulo && matchEstado;
  });

  // Mapeo de colores y nombres de módulos
  const modulosInfo = {
    1: { nombre: 'M1 Oficio Notificación', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    2: { nombre: 'M2 Orden Supervisión', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    3: { nombre: 'M3 Lista Verificación', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    4: { nombre: 'M4 Acta Hechos', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    5: { nombre: 'M5 Acta Supervisión', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    6: { nombre: 'M6 Acta Circunstanciada', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  };

  // PANTALLA DE ACCESO RESTRINGIDO (SI NO ES SUPERADMIN)
  if (!esSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-6">
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl border border-red-200 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={36} />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Acceso Exclusivo de SuperAdmin</h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            La <strong>Nube SEIOT</strong> y el explorador del disco virtual persistente de Render están restringidos únicamente para el usuario con privilegios de <strong>SuperAdministrador</strong>.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 bg-red-900 hover:bg-red-950 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ENCABEZADO Y TÍTULO */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate('/admin/super')}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Regresar a Mantenimiento"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <ShieldAlert size={12} /> SuperAdmin
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Disco NVMe Render Conectado
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
                <Cloud className="text-red-900" size={28} />
                Nube SEIOT — Explorador de Disco Persistente
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Gestión, visualización y respaldo de los documentos oficiales PDF guardados permanentemente en Render.
              </p>
            </div>
          </div>

          {/* BOTONES GLOBALES DE ACCIÓN */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={subiendoArchivos}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-900 hover:bg-red-950 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Upload size={16} />
              {subiendoArchivos ? 'Subiendo...' : 'Subir Archivos / ZIP'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.zip"
              onChange={(e) => procesarSubidaArchivos(e.target.files)}
              className="hidden"
            />

            <button
              onClick={handleDescargarTodo}
              disabled={procesandoAccion || archivos.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 disabled:opacity-50"
              title="Descargar todo el contenido del disco como archivo ZIP"
            >
              <FolderArchive size={16} className="text-amber-600" />
              Descargar Todo (.ZIP)
            </button>

            <button
              onClick={cargarDatosDisco}
              disabled={cargando}
              className="flex items-center justify-center p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all active:scale-95"
              title="Refrescar contenido"
            >
              <RefreshCw size={16} className={cargando ? 'animate-spin text-red-900' : ''} />
            </button>
          </div>
        </div>

        {/* ALERTA O MENSAJE DE ESTADO */}
        {mensajeAlerta && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between shadow-sm border ${
              mensajeAlerta.tipo === 'exito'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : mensajeAlerta.tipo === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <div className="flex items-center gap-3 text-sm font-medium">
              {mensajeAlerta.tipo === 'exito' ? (
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle size={18} className="text-red-600 shrink-0" />
              )}
              <span>{mensajeAlerta.texto}</span>
            </div>
            <button
              onClick={() => setMensajeAlerta(null)}
              className="p-1 hover:bg-black/5 rounded-lg text-slate-500"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* TARJETAS DE MÉTRICAS Y ESTADO DEL DISCO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tarjeta 1: Espacio en Disco */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <HardDrive size={16} className="text-red-900" />
                Espacio en Disco Persistente
              </span>
              <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                {metricas?.porcentajeUso || 0}% en uso
              </span>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>{metricas?.espacioUsado || '0 MB'} ocupados</span>
                <span className="font-semibold text-slate-800">{metricas?.espacioTotal || '0 GB'} total</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-amber-500 to-red-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(2, Math.min(100, metricas?.porcentajeUso || 0))}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-2">
                <span>Libre: {metricas?.espacioLibre || '0 GB'}</span>
                <span className="text-emerald-600 font-medium">● Volumen Saludable</span>
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Documentos Físicos Almacenados */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={16} className="text-blue-600" />
                  Archivos PDF en Disco
                </span>
                <span className="text-xs font-extrabold text-blue-900 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
                  {metricas?.tamanoArchivosDisco || '0 KB'}
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {metricas?.totalArchivosDisco ?? archivos.length}
                </span>
                <span className="text-xs font-medium text-slate-500">PDFs físicos en el disco</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Registros en BD: <strong className="text-slate-700">{metricas?.totalRegistrosBD || 0}</strong></span>
              {pendientesBD.length > 0 && (
                <button
                  onClick={() => setMostrarPendientes(!mostrarPendientes)}
                  className="text-amber-600 font-bold hover:underline flex items-center gap-1"
                >
                  <AlertTriangle size={12} />
                  {pendientesBD.length} sin archivo
                </button>
              )}
            </div>
          </div>

          {/* Tarjeta 3: Punto de Montaje Render */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Server size={16} className="text-purple-600" />
                Ruta Física Montada
              </span>
              <div className="mt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <code className="text-xs font-mono font-bold text-slate-800 break-all select-all">
                  {metricas?.rutaUploads || '/opt/render/project/src/uploads/documentos_firmados'}
                </code>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Persistencia: <strong>Garantizada</strong></span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Inmune a Deploys
              </span>
            </div>
          </div>
        </div>

        {/* SECCIÓN EXPANDIBLE: REGISTROS EN BD QUE FALTAN EN EL DISCO */}
        {pendientesBD.length > 0 && mostrarPendientes && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-amber-600" size={18} />
                <h3 className="text-sm font-black text-amber-900">
                  Documentos registrados en Base de Datos pendientes de archivo físico ({pendientesBD.length})
                </h3>
              </div>
              <button
                onClick={() => setMostrarPendientes(false)}
                className="text-xs font-bold text-amber-800 hover:underline"
              >
                Ocultar
              </button>
            </div>
            <p className="text-xs text-amber-800/80 mb-3">
              Estos folios tienen registro en el sistema pero su PDF físico no está actualmente en el disco. Puedes arrastrar o subir los archivos correspondientes a la zona de carga para restaurarlos.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {pendientesBD.map((p) => (
                <div key={p.id} className="bg-white p-2.5 rounded-xl border border-amber-200 text-xs flex flex-col justify-between">
                  <div className="font-bold text-slate-800 flex items-center justify-between">
                    <span>Visita #{p.visitaId} {p.folio ? `(${p.folio})` : ''}</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">M{p.modulo}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate font-mono mt-1" title={p.nombreArchivo}>
                    {p.nombreArchivo}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ZONA DE ARRASTRE (DRAG & DROP) */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
            arrastrando
              ? 'border-red-600 bg-red-50/70 scale-[1.01]'
              : 'border-slate-300 hover:border-red-900/60 bg-white/60 hover:bg-white'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
              arrastrando ? 'bg-red-600 text-white' : 'bg-red-50 text-red-900'
            }`}>
              <ArrowUpCircle size={24} />
            </div>
            <div className="font-bold text-slate-800 text-sm">
              Arrastra y suelta aquí archivos PDF o un archivo ZIP
            </div>
            <p className="text-xs text-slate-500 max-w-lg">
              Los archivos que tengan el formato <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono">visita_X_moduloY_firmado.pdf</code> se vincularán automáticamente a sus visitas en la base de datos.
            </p>
            {subiendoArchivos && (
              <div className="mt-2 flex items-center gap-2 text-xs font-bold text-red-900 bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
                <RefreshCw size={14} className="animate-spin" />
                <span>{progresoSubida}</span>
              </div>
            )}
          </div>
        </div>

        {/* BARRA DE HERRAMIENTAS, BÚSQUEDA Y FILTROS */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Buscador */}
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, visita, folio..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-900 focus:bg-white"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
            {/* Filtro Módulo */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter size={14} />
              <select
                value={filtroModulo}
                onChange={(e) => setFiltroModulo(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-900"
              >
                <option value="todos">Todos los Módulos</option>
                <option value="1">Módulo 1: Notificación</option>
                <option value="2">Módulo 2: Orden</option>
                <option value="3">Módulo 3: Lista Verificación</option>
                <option value="4">Módulo 4: Acta de Hechos</option>
                <option value="5">Módulo 5: Acta Supervisión</option>
                <option value="6">Módulo 6: Circunstanciada</option>
              </select>
            </div>

            {/* Filtro Estado */}
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-900"
            >
              <option value="todos">Todos los Estados</option>
              <option value="vinculado">✅ Vinculados en BD</option>
              <option value="huerfano">⚠️ Solo en Disco</option>
            </select>

            {/* Conmutador de vista */}
            <div className="border-l border-slate-200 pl-2 flex items-center gap-1">
              <button
                onClick={() => setVistaCuadricula(false)}
                className={`p-2 rounded-lg text-xs transition-colors ${
                  !vistaCuadricula ? 'bg-red-900 text-white font-bold' : 'text-slate-500 hover:bg-slate-100'
                }`}
                title="Vista en Lista / Tabla"
              >
                Lista
              </button>
              <button
                onClick={() => setVistaCuadricula(true)}
                className={`p-2 rounded-lg text-xs transition-colors ${
                  vistaCuadricula ? 'bg-red-900 text-white font-bold' : 'text-slate-500 hover:bg-slate-100'
                }`}
                title="Vista en Tarjetas"
              >
                Cuadrícula
              </button>
            </div>
          </div>
        </div>

        {/* LISTADO DE ARCHIVOS */}
        {cargando ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
            <RefreshCw size={32} className="animate-spin text-red-900 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Explorando el disco persistente de Render...</p>
            <p className="text-xs text-slate-400 mt-1">Cotejando archivos físicos con la base de datos de visitas</p>
          </div>
        ) : archivosFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FileText size={32} />
            </div>
            <h3 className="text-base font-bold text-slate-800">No se encontraron archivos</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {busqueda || filtroModulo !== 'todos' || filtroEstado !== 'todos'
                ? 'Ningún archivo coincide con los filtros aplicados.'
                : 'El disco virtual está limpio. Puedes subir archivos PDF o un archivo ZIP usando la zona superior.'}
            </p>
          </div>
        ) : !vistaCuadricula ? (
          /* VISTA EN TABLA / LISTA */
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Archivo</th>
                    <th className="py-3 px-4">Visita / Folio</th>
                    <th className="py-3 px-4">Módulo</th>
                    <th className="py-3 px-4">Tamaño</th>
                    <th className="py-3 px-4">Fecha de Archivo</th>
                    <th className="py-3 px-4">Estado BD</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {archivosFiltrados.map((arc) => {
                    const mod = arc.modulo ? modulosInfo[arc.modulo] : null;
                    return (
                      <tr key={arc.nombre} className="hover:bg-slate-50/80 transition-colors group">
                        {/* Nombre */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-800 flex items-center justify-center shrink-0">
                              <FileText size={16} />
                            </div>
                            <div className="truncate max-w-xs">
                              <p className="font-bold text-slate-800 truncate" title={arc.nombre}>
                                {arc.nombre}
                              </p>
                              {arc.empresa && (
                                <p className="text-[11px] text-slate-500 truncate" title={arc.empresa}>
                                  {arc.empresa}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Visita / Folio */}
                        <td className="py-3 px-4">
                          {arc.visitaId ? (
                            <div>
                              <span className="font-bold text-slate-800">Visita #{arc.visitaId}</span>
                              {arc.folio && (
                                <span className="block text-[11px] text-slate-500 font-mono">
                                  {arc.folio}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No asignada</span>
                          )}
                        </td>

                        {/* Módulo */}
                        <td className="py-3 px-4">
                          {mod ? (
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${mod.color}`}>
                              {mod.nombre}
                            </span>
                          ) : arc.modulo ? (
                            <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-700">
                              Módulo {arc.modulo}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">General</span>
                          )}
                        </td>

                        {/* Tamaño */}
                        <td className="py-3 px-4 font-mono text-slate-600 font-semibold">
                          {arc.tamano}
                        </td>

                        {/* Fecha */}
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(arc.fechaModificacion).toLocaleString('es-MX', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                        </td>

                        {/* Estado BD */}
                        <td className="py-3 px-4">
                          {arc.enBaseDatos ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <CheckCircle2 size={12} /> Vinculado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              <AlertTriangle size={12} /> Solo en Disco
                            </span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handlePrevisualizar(arc)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Previsualizar PDF"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleDescargar(arc)}
                              className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Descargar archivo"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setArchivoEliminar(arc);
                                setEliminarDeBD(false);
                              }}
                              className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar del disco"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* VISTA EN CUADRÍCULA (CARDS) */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {archivosFiltrados.map((arc) => {
              const mod = arc.modulo ? modulosInfo[arc.modulo] : null;
              return (
                <div
                  key={arc.nombre}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-red-100 text-red-800 flex items-center justify-center shrink-0">
                        <FileText size={20} />
                      </div>
                      {arc.enBaseDatos ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Vinculado
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          Solo Disco
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-800 text-xs truncate mt-1" title={arc.nombre}>
                      {arc.nombre}
                    </h4>

                    {arc.empresa && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5" title={arc.empresa}>
                        {arc.empresa}
                      </p>
                    )}

                    <div className="mt-3 space-y-1 text-[11px] text-slate-500">
                      {arc.visitaId && (
                        <div className="flex justify-between">
                          <span>Visita:</span>
                          <span className="font-bold text-slate-700">#{arc.visitaId}</span>
                        </div>
                      )}
                      {arc.folio && (
                        <div className="flex justify-between">
                          <span>Folio:</span>
                          <span className="font-mono text-slate-700 font-semibold truncate max-w-[120px]" title={arc.folio}>
                            {arc.folio}
                          </span>
                        </div>
                      )}
                      {mod && (
                        <div className="flex justify-between items-center pt-1">
                          <span>Módulo:</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${mod.color}`}>
                            M{arc.modulo}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 border-t border-slate-100">
                        <span>Tamaño:</span>
                        <span className="font-mono font-bold text-slate-700">{arc.tamano}</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones de la tarjeta */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handlePrevisualizar(arc)}
                      className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-red-900"
                    >
                      <Eye size={14} /> Ver PDF
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDescargar(arc)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Descargar"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setArchivoEliminar(arc);
                          setEliminarDeBD(false);
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL DE PREVISUALIZACIÓN DE PDF */}
      {archivoPrevisualizar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            {/* Header del modal */}
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-800 text-white flex items-center justify-center">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm truncate max-w-md" title={archivoPrevisualizar.nombre}>
                    {archivoPrevisualizar.nombre}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {archivoPrevisalizarInfoExtra(archivoPrevisualizar)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {urlPrevisualizacion && (
                  <>
                    <a
                      href={urlPrevisualizacion}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg text-xs flex items-center gap-1.5 font-bold transition-colors"
                      title="Abrir en pestaña completa"
                    >
                      <ExternalLink size={14} /> Nueva Pestaña
                    </a>
                    <button
                      onClick={() => handleDescargar(archivoPrevisualizar)}
                      className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg text-xs flex items-center gap-1.5 font-bold transition-colors"
                      title="Descargar PDF"
                    >
                      <Download size={14} /> Descargar
                    </button>
                  </>
                )}
                <button
                  onClick={cerrarPrevisualizador}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-2"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Contenido visor */}
            <div className="flex-1 bg-slate-100 relative">
              {cargandoPrevisualizacion ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <RefreshCw size={36} className="animate-spin text-red-900 mb-3" />
                  <p className="text-sm font-bold text-slate-700">Cargando documento desde el disco...</p>
                </div>
              ) : urlPrevisualizacion ? (
                <iframe
                  src={urlPrevisualizacion}
                  title="Visor PDF SEIOT"
                  className="w-full h-full border-none"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                  No se pudo renderizar la vista previa del documento.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {archivoEliminar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-red-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">¿Eliminar archivo del disco?</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Estás a punto de borrar físicamente el archivo{' '}
              <strong className="text-slate-800 font-mono">{archivoEliminar.nombre}</strong> ({archivoEliminar.tamano}) del disco persistente de Render.
            </p>

            {archivoEliminar.enBaseDatos && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eliminarDeBD}
                    onChange={(e) => setEliminarDeBD(e.target.checked)}
                    className="mt-0.5 rounded border-amber-400 text-red-900 focus:ring-red-900"
                  />
                  <div className="text-xs text-amber-900">
                    <span className="font-bold block">Eliminar también el registro en la Base de Datos</span>
                    <span className="text-[11px] text-amber-700 block mt-0.5">
                      Si lo desmarcas, solo se borra el archivo físico del disco y la visita mantendrá el registro.
                    </span>
                  </div>
                </label>
              </div>
            )}

            <div className="flex items-center gap-2.5 justify-end">
              <button
                onClick={() => setArchivoEliminar(null)}
                disabled={procesandoAccion}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                disabled={procesandoAccion}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {procesandoAccion ? 'Eliminando...' : 'Sí, Eliminar Archivo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper para info del modal
function archivoPrevisalizarInfoExtra(arc) {
  if (!arc) return '';
  const partes = [];
  if (arc.visitaId) partes.push(`Visita #${arc.visitaId}`);
  if (arc.modulo) partes.push(`Módulo ${arc.modulo}`);
  if (arc.tamano) partes.push(arc.tamano);
  return partes.join(' • ');
}
