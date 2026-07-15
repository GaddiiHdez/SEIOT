export const guardarBorradorLocal = (modulo, contexto, campos) => {
    if (!contexto) return;
    const borrador = {
        modulo,
        visita_id: contexto.visita_id,
        folio: contexto.folio,
        campos
    };
    const blob = new Blob([JSON.stringify(borrador)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `modulo${modulo}_${contexto.folio.replace(/\//g, '-')}.smpbk`;
    a.click();
    URL.revokeObjectURL(url);
};

export const cargarBorradorLocal = (e, modulo, contexto, setCampos) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const borrador = JSON.parse(ev.target.result);
            if (borrador.modulo !== modulo) {
                alert(`Este borrador no es del Módulo ${modulo}.`);
                return;
            }
            if (borrador.visita_id !== contexto.visita_id) {
                alert('Este borrador es de otra visita.');
                return;
            }
            
            // Aplicar los campos mapeando a sus respectivos setters
            Object.entries(borrador.campos).forEach(([key, val]) => {
                if (setCampos[key] && val !== undefined) {
                    setCampos[key](val);
                }
            });
            
            alert('✅ Borrador cargado correctamente.');
        } catch {
            alert('Archivo inválido.');
        }
    };
    reader.readAsText(archivo);
    e.target.value = '';
};
