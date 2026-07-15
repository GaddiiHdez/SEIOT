import React from 'react';
import { Pencil, Lock } from 'lucide-react';

const InputBloque = ({ labelSide, labelTop, valor, onChange, disabled = false, tipo = "text", placeholder, puedeEditar = false, tema = "blue" }) => {
    const [desbloqueado, setDesbloqueado] = React.useState(false);
    const bloqueado = disabled && !desbloqueado;
    const esVacio = bloqueado && (!valor || valor === 'null' || valor === 'NULL' || String(valor).trim() === '');
    
    const colorBg = tema === 'pink' ? 'bg-pink-600' : (tema === 'indigo' ? 'bg-indigo-600' : (tema === 'red' ? 'bg-red-600' : 'bg-blue-600'));
    const colorText = tema === 'pink' ? 'text-pink-700' : (tema === 'indigo' ? 'text-indigo-700' : (tema === 'red' ? 'text-red-700' : 'text-blue-700'));

    const inputContent = (
        <div className="flex border border-gray-300 rounded overflow-hidden shadow-sm w-full">
            <span className={`${colorBg} text-white text-[11px] font-bold p-2 min-w-[130px] md:min-w-[170px] flex items-center whitespace-nowrap`}>
                {labelSide}
            </span>
            <input 
                type={tipo} 
                className={`w-full p-2 text-sm outline-none ${bloqueado ? (esVacio ? 'bg-red-50 text-red-400 italic' : 'bg-gray-100 text-gray-700 font-bold italic') : 'bg-white'}`} 
                value={esVacio ? '' : valor} 
                onChange={onChange}
                disabled={bloqueado}
                placeholder={esVacio ? 'NO HAY DATOS' : (placeholder || (bloqueado ? 'SE PRECARGA' : 'SE CAPTURA'))}
            />
            {disabled && puedeEditar && (
                <button
                    onClick={() => setDesbloqueado(!desbloqueado)}
                    title={desbloqueado ? 'Bloquear campo' : 'Editar campo'}
                    type="button"
                    className={`px-2 flex items-center transition-colors ${desbloqueado ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'}`}
                >
                    {desbloqueado ? <Lock size={14} /> : <Pencil size={14} />}
                </button>
            )}
        </div>
    );

    if (labelTop) {
        return (
            <div className="mb-3 w-full">
                <label className={`block text-xs font-bold ${colorText} mb-1 uppercase`}>{labelTop}</label>
                {inputContent}
            </div>
        );
    }

    return <div className="mb-2 w-full">{inputContent}</div>;
};

export default InputBloque;
