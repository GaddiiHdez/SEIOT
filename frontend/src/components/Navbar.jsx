import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, BarChart2, Users, ArrowLeft, X, Clock, ShieldAlert, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoGobierno from '../assets/logo-gobierno.jpg';

const Navbar = ({ folioActivo, setFolioActivo, setPsgInput, setDatosPsg, setSupervisorSeleccionado, setAvance, visitasRecientes, agregarVisitaReciente }) => {
  const [menuRecientesAbierto, setMenuRecientesAbierto] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, logout, permisosListos } = useAuth();
  
  const path = location.pathname;
  const esVista = usuario?.rol === 'vista';
  const puedeConsultas = usuario?.es_admin || usuario?.permisos?.consultas;
  const puedeUsuarios = usuario?.es_admin || usuario?.permisos?.panel_admin;

  const handleLimpiar = () => {
    if (setFolioActivo) setFolioActivo('');
    if (setPsgInput) setPsgInput('');
    if (setDatosPsg) setDatosPsg(null);
    if (setSupervisorSeleccionado) setSupervisorSeleccionado(null);
    if (setAvance) setAvance({ modulo1: false, modulo2: false, modulo3: false, modulo4: false, modulo5: false, modulo6: false });
    localStorage.removeItem('visitaActiva');
    localStorage.removeItem('desdeConsultas');
  };

  const handleLogout = () => {
    localStorage.removeItem('seiot_token');
    localStorage.removeItem('visitaActiva');
    localStorage.removeItem('desdeConsultas');
    window.history.go(-(window.history.length - 1));
    window.location.replace('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-red-950 via-red-900 to-red-950 text-white px-6 py-3 shadow-lg border-b-2 border-amber-500 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md bg-opacity-95">
      {/* Lado Izquierdo: Logo y Título */}
      <div className="flex items-center gap-4">
        <div className="bg-white p-1 rounded-xl shadow-inner flex items-center justify-center">
          <img src={logoGobierno} alt="Logo" className="h-10 object-contain rounded-lg" />
        </div>
        <div>
          {path === '/dashboard' ? (
            <>
              <h1 className="font-extrabold text-xl tracking-tight leading-none text-white">SEIOT</h1>
              <p className="text-[10px] text-amber-400 font-bold tracking-widest uppercase mt-0.5">MÓDULO DE SUPERVISIÓN</p>
            </>
          ) : (
            <>
              <p className="text-[10px] text-amber-400 font-bold tracking-widest uppercase leading-none">Panel de Administración</p>
              <h1 className="font-extrabold text-lg text-white mt-1 flex items-center gap-1.5">
                {path === '/admin/consultas' ? (
                  <>
                    <BarChart2 size={16} /> Consultas
                  </>
                ) : path === '/admin/super' ? (
                  <>
                    <ShieldAlert size={16} className="text-red-400" /> Mantenimiento
                  </>
                ) : (
                  <>
                    <Users size={16} /> Gestión de Usuarios
                  </>
                )}
              </h1>
            </>
          )}
        </div>
      </div>

      {/* Lado Derecho: Acciones */}
      <div className="flex items-center gap-6">
        {/* Enlace de Navegación del Panel (Solo en Dashboard) */}
        {path === '/dashboard' && (
          <div className="flex items-center gap-2">
            {puedeConsultas && (
              <button 
                onClick={() => navigate('/admin/consultas')} 
                className="flex items-center gap-2 text-xs bg-white/10 hover:bg-white/20 border border-white/25 text-white px-4 py-2.5 rounded-lg font-bold transition-all duration-200 active:scale-95 shadow-sm"
              >
                <BarChart2 size={14} /> Consultas
              </button>
            )}
            {puedeUsuarios && (
              <button 
                onClick={() => navigate('/admin/usuarios')} 
                className="flex items-center gap-2 text-xs bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 px-4 py-2.5 rounded-lg font-bold transition-all duration-200 active:scale-95 shadow-sm"
              >
                <Users size={14} /> Usuarios
              </button>
            )}
            {usuario?.superadmin && (
              <button 
                onClick={() => navigate('/admin/super')} 
                className="flex items-center justify-center text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 p-2.5 rounded-lg font-bold transition-all duration-200 active:scale-95 shadow-sm"
                title="Mantenimiento de SuperAdmin"
              >
                <Wrench size={14} />
              </button>
            )}
          </div>
        )}

        {/* Sección de Usuario / Sesión */}
        <div className="flex items-center gap-4 border-l border-white/15 pl-6">
          {/* Indicador de red */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-[9px] font-extrabold tracking-wider uppercase shadow-inner">
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse shadow shadow-emerald-400/40' : 'bg-rose-500 animate-pulse shadow shadow-rose-500/40'}`} />
            <span className={isOnline ? 'text-emerald-300' : 'text-rose-300'}>
              {isOnline ? 'En línea' : 'Sin red'}
            </span>
          </div>

          {/* Botón de Manual de Usuario */}
          <button 
            onClick={() => navigate('/manual')}
            className="flex items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all active:scale-95 shadow-sm outline-none"
            title="Manual de Usuario"
          >
            <BookOpen size={14} />
          </button>

          {/* Historial de Visitas Recientes (Dropdown discreto) */}
          {path === '/dashboard' && visitasRecientes && visitasRecientes.length > 0 && (
            <div className="relative">
              <button 
                onClick={() => setMenuRecientesAbierto(!menuRecientesAbierto)}
                className="flex items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all active:scale-95 shadow-sm outline-none"
                title="Historial de Visitas Recientes"
              >
                <Clock size={14} />
              </button>
              {menuRecientesAbierto && (
                <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 py-3 w-80 text-slate-800 text-xs z-50 animate-scale-up">
                  <div className="px-4 pb-2 border-b border-gray-100 flex items-center justify-between text-slate-500 font-bold uppercase tracking-wide text-[9px]">
                    <span>Visitas Recientes</span>
                    <Clock size={11} />
                  </div>
                  <div className="max-h-64 overflow-y-auto mt-1.5">
                    {visitasRecientes.map((vis, idx) => {
                      const count = vis.estado_visita === 'finalizado' ? 6 : Object.values(vis.avance || {}).filter(Boolean).length;
                      const isFin = vis.estado_visita === 'finalizado';
                      
                      let labelAvance = `${count} / 6 etapas`;
                      if (isFin) {
                        const keys = ['modulo1', 'modulo2', 'modulo3', 'modulo4', 'modulo5', 'modulo6'];
                        let last = 0;
                        keys.forEach((key, kIdx) => {
                          if (vis.avance?.[key]) last = kIdx + 1;
                        });
                        labelAvance = `Etapa ${last} (Concluido)`;
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            if (setFolioActivo) setFolioActivo(vis.folio);
                            if (setDatosPsg) setDatosPsg(vis.datosPsg);
                            if (setPsgInput) setPsgInput(vis.psg);
                            if (setSupervisorSeleccionado) setSupervisorSeleccionado(vis.datosSupervisor);
                            if (setAvance) setAvance(vis.avance || { modulo1: false, modulo2: false, modulo3: false, modulo4: false, modulo5: false, modulo6: false });
                            localStorage.setItem('visitaActiva', JSON.stringify(vis));
                            if (agregarVisitaReciente) agregarVisitaReciente(vis);
                            setMenuRecientesAbierto(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            alert(`Folio cargado: ${vis.folio}`);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex flex-col gap-1 transition-colors border-b border-slate-50 last:border-b-0"
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-mono font-bold text-slate-900 truncate max-w-[160px]">{vis.folio}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold ${isFin ? 'bg-green-50 text-green-700 border border-green-200/50' : 'bg-slate-100 text-slate-600'}`}>
                              {labelAvance}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                            <span>PSG: {vis.psg}</span>
                            <span className="truncate max-w-[120px] font-normal">{vis.datosPsg?.nombre_titular || '...'}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <span className="text-white/80 text-xs hidden md:block">
            Hola, <span className="font-bold text-amber-300">{usuario?.nombre || 'Usuario'}</span>
          </span>

          {/* Botones contextuales según página */}
          {path === '/dashboard' ? (
            <>
              {folioActivo && !esVista && permisosListos && (
                <button 
                  onClick={handleLimpiar} 
                  className="flex items-center gap-1.5 text-xs bg-orange-600/90 hover:bg-orange-700 text-white px-3.5 py-2.5 rounded-lg font-bold transition-all active:scale-95 shadow-sm"
                >
                  <X size={14} /> Limpiar
                </button>
              )}
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-1.5 text-xs bg-red-700/80 hover:bg-red-800 text-white px-3.5 py-2.5 rounded-lg font-bold transition-all active:scale-95 shadow-sm border border-red-600/20"
              >
                <LogOut size={14} /> Salir
              </button>
            </>
          ) : (
            // En páginas de administración
            esVista ? (
              <button 
                onClick={logout} 
                className="flex items-center gap-1.5 text-xs bg-red-700/80 hover:bg-red-800 text-white px-3.5 py-2.5 rounded-lg font-bold transition-all active:scale-95 shadow-sm border border-red-600/20"
              >
                <LogOut size={14} /> Cerrar Sesión
              </button>
            ) : (
              <button 
                onClick={() => { localStorage.removeItem('visitaActiva'); localStorage.removeItem('desdeConsultas'); navigate('/dashboard'); }} 
                className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 border border-white/25 px-4 py-2.5 rounded-lg font-bold transition-all active:scale-95 shadow-sm"
              >
                <ArrowLeft size={14} /> Volver al Dashboard
              </button>
            )
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
