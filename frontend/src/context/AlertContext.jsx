import React, { createContext, useContext, useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
    const [alertState, setAlertState] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info', // 'success' | 'error' | 'warning' | 'info'
    });

    const triggerAlert = (message, customTitle = '') => {
        // Detectar automáticamente el tipo de alerta basado en el contenido del mensaje
        const msgLower = message.toLowerCase();
        let type = 'info';
        let defaultTitle = 'Información';

        if (msgLower.includes('sin conexión') || msgLower.includes('sin conexion')) {
            type = 'info';
            defaultTitle = 'Guardado Local';
        } else if (
            msgLower.includes('exito') || 
            msgLower.includes('éxito') || 
            msgLower.includes('correctamente') || 
            msgLower.includes('guardad') || 
            msgLower.includes('desbloquead') || 
            msgLower.includes('iniciada') || 
            msgLower.includes('recuperado')
        ) {
            type = 'success';
            defaultTitle = '¡Todo Listo!';
        } else if (
            msgLower.includes('error') || 
            msgLower.includes('fallo') || 
            msgLower.includes('falló') || 
            msgLower.includes('inválido') || 
            msgLower.includes('conexion') || 
            msgLower.includes('conexión') ||
            msgLower.includes('no se pudo')
        ) {
            type = 'error';
            defaultTitle = 'Ha ocurrido un problema';
        } else if (
            msgLower.includes('permiso') || 
            msgLower.includes('debes') || 
            msgLower.includes('cuidado') ||
            msgLower.includes('atención') ||
            msgLower.includes('atencion')
        ) {
            type = 'warning';
            defaultTitle = 'Atención';
        }

        setAlertState({
            isOpen: true,
            title: customTitle || defaultTitle,
            message: message,
            type: type
        });
    };

    // Sobrescribir el alert nativo del navegador
    useEffect(() => {
        const originalAlert = window.alert;
        window.alert = (message) => {
            console.log('Intercepted alert:', message);
            triggerAlert(String(message));
        };

        return () => {
            window.alert = originalAlert;
        };
    }, []);

    // Auto-cerrar alertas de éxito después de 3.5 segundos
    useEffect(() => {
        if (alertState.isOpen && alertState.type === 'success') {
            const timer = setTimeout(() => {
                closeAlert();
            }, 3500);
            return () => clearTimeout(timer);
        }
    }, [alertState.isOpen, alertState.type]);

    const closeAlert = () => {
        setAlertState(prev => ({ ...prev, isOpen: false }));
    };

    // Estilos premium según el tipo
    const getStyles = () => {
        switch (alertState.type) {
            case 'success':
                return {
                    icon: <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />,
                    bgCircle: 'bg-emerald-50 border-emerald-100',
                    gradientBtn: 'from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-200',
                    textColor: 'text-emerald-800',
                };
            case 'error':
                return {
                    icon: <XCircle className="w-12 h-12 text-rose-500 animate-shake" />,
                    bgCircle: 'bg-rose-50 border-rose-100',
                    gradientBtn: 'from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-200',
                    textColor: 'text-rose-800',
                };
            case 'warning':
                return {
                    icon: <AlertTriangle className="w-12 h-12 text-amber-500" />,
                    bgCircle: 'bg-amber-50 border-amber-100',
                    gradientBtn: 'from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-200',
                    textColor: 'text-amber-800',
                };
            default:
                return {
                    icon: <Info className="w-12 h-12 text-blue-500" />,
                    bgCircle: 'bg-blue-50 border-blue-100',
                    gradientBtn: 'from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-blue-200',
                    textColor: 'text-blue-800',
                };
        }
    };

    const styles = getStyles();

    return (
        <AlertContext.Provider value={{ triggerAlert }}>
            {children}
            
            {/* Modal de Alerta Premium */}
            {alertState.isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop con desenfoque de cristal */}
                    <div 
                        className="fixed inset-0 bg-black/30 transition-opacity duration-300 ease-out" 
                        onClick={closeAlert}
                    />

                    {/* Contenedor del Popup */}
                    <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 text-center transform transition-all duration-300 scale-100 opacity-100 animate-[fadeInUp_0.3s_ease-out] flex flex-col items-center">
                        {/* Círculo del Icono con Sombra Suave */}
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 mb-4 ${styles.bgCircle} shadow-md`}>
                            {styles.icon}
                        </div>

                        {/* Título de la Alerta */}
                        <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight tracking-tight">
                            {alertState.title}
                        </h3>

                        {/* Mensaje de la Alerta */}
                        <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6 whitespace-pre-line max-w-[90%]">
                            {alertState.message}
                        </p>

                        {/* Botón Aceptar con Animación */}
                        <button
                            onClick={closeAlert}
                            className={`w-full bg-gradient-to-r ${styles.gradientBtn} text-white font-bold py-3 px-6 rounded-2xl shadow-lg active:scale-95 transition-all duration-200 uppercase text-xs tracking-wider outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400`}
                        >
                            Aceptar
                        </button>
                    </div>
                </div>
            )}
        </AlertContext.Provider>
    );
};
