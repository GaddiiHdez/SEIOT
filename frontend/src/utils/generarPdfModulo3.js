import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { LOGO_HEADER, LOGO_FOOTER } from './imagenesMembretes';

export const generarPdfModulo3 = async (datos) => {
    const pdfDoc = await PDFDocument.create();
    const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const headerBase64 = LOGO_HEADER.split(',')[1];
    const footerBase64 = LOGO_FOOTER.split(',')[1];
    const headerBytes = Uint8Array.from(atob(headerBase64), c => c.charCodeAt(0));
    const footerBytes = Uint8Array.from(atob(footerBase64), c => c.charCodeAt(0));
    const headerImg = await pdfDoc.embedJpg(headerBytes);
    const footerImg = await pdfDoc.embedJpg(footerBytes);

    const black = rgb(0, 0, 0);
    const gray = rgb(0.38, 0.38, 0.38);
    const darkGray = rgb(0.2, 0.2, 0.2);

    const agregarMembrete = (page) => {
        page.drawImage(headerImg, { x: 0, y: 662, width: 612, height: 130 });
        page.drawImage(footerImg, { x: 0, y: 0, width: 612, height: 130 });
        page.drawText('SECRETARÍA DE DESARROLLO RURAL', { x: 220, y: 62, size: 7.5, font: fontBold, color: gray });
        page.drawText('Av. Jacarandas No. 371 Sur Colonia El Tecolote C.P. 63135 Tepic, Nayarit.', { x: 155, y: 51, size: 7.5, font: fontNormal, color: gray });
        page.drawText('311 216 22 63 | 311 216 22 74', { x: 228, y: 40, size: 7.5, font: fontNormal, color: gray });
    };

    // Todas las preguntas del checklist
    const preguntas = [
        { id: 13, texto: 'Autorizacion vigente como Prestador de Servicios Ganaderos', pagina: 1 },
        { id: 14, texto: 'Correspondencia entre la autorizacion y la actividad efectivamente realizada', pagina: 1 },
        { id: 15, texto: 'Identificacion oficial del titular o representante legal', pagina: 1 },
        { id: 16, texto: 'Registro y expediente actualizado del PSG', pagina: 1 },
        { id: 17, texto: 'Certificados de Inspeccion Legal o CFDI que amparan el ingreso de animales', pagina: 1 },
        { id: 18, texto: 'Guias de Transito REEMO de ingreso', pagina: 1 },
        { id: 19, texto: 'Identificadores oficiales SINIIGA correspondientes a los animales ingresados', pagina: 1 },
        { id: 20, texto: 'Dictamenes sanitarios exigibles conforme al estatus sanitario (TB, Brucelosis u otros)', pagina: 1 },
        { id: 21, texto: 'Bitacora de ingreso y clasificacion de animales', pagina: 1 },
        { id: 22, texto: 'Registros de estancia y manejo operativo de los animales', pagina: 1 },
        { id: 23, texto: 'Registros de aplicacion de medidas o protocolos sanitarios', pagina: 1 },
        { id: 24, texto: 'Registros de marcado a fuego CN, cuando aplique', pagina: 1 },
        { id: 25, texto: 'Registros y solicitudes de reposicion de identificadores SINIIGA, cuando aplique', pagina: 1 },
        { id: 26, texto: 'Registros internos de mortalidad en corral', pagina: 2 },
        { id: 27, texto: 'Destino de Identificadores oficiales SINIIGA de animales muertos en corral', pagina: 2 },
        { id: 28, texto: 'Evidencia documental del destino de animales dados de baja por muerte en corral', pagina: 2 },
        { id: 29, texto: 'Certificados de Inspeccion Legal o CFDI que corresponda a los animales dados de baja', pagina: 2 },
        { id: 30, texto: 'Documentacion de compraventa (engorda a introductor)', pagina: 2 },
        { id: 31, texto: 'Guias de Transito REEMO de origen del animal fallecido', pagina: 2 },
        { id: 32, texto: 'Registro interno del destino final del animal', pagina: 2 },
        { id: 33, texto: 'Comprobante de baja del identificador SINIIGA', pagina: 2 },
        { id: 34, texto: 'Expediente de animales dados de baja', pagina: 2 },
        { id: 35, texto: 'Permisos de movilizacion fuera del Estado, cuando aplique', pagina: 2 },
        { id: 36, texto: 'Pruebas de tuberculosis cuando la PSG destino se encuentre fuera del Estado', pagina: 2 },
        { id: 37, texto: 'Registros documentales de correspondencia fisico-documental', pagina: 2 },
        { id: 38, texto: 'Archivo ordenado y resguardo de la documentacion conforme a plazos establecidos', pagina: 2 },
        { id: 39, texto: 'Registro o bitacora interna de nacimiento en corral', pagina: 2 },
        { id: 40, texto: 'Numero de control interno o identificacion provisional', pagina: 2 },
        { id: 41, texto: 'Solicitud de asignacion de identificador SINIIGA', pagina: 2 },
        { id: 42, texto: 'Constancia o comprobante de aplicacion del identificador SINIIGA', pagina: 2 },
        { id: 43, texto: 'Relacion actualizada de animales nacidos en corral', pagina: 2 },
        { id: 44, texto: 'Expediente interno del animal', pagina: 2 },
        { id: 45, texto: 'Identificadores SINIIGA visibles en ambas orejas de los animales', pagina: 2, categoria: 'Aspecto Fisicos' },
        { id: 46, texto: 'Figura(s) y Marca a fuego del ganado', pagina: 2 },
        { id: 47, texto: 'Numero de animales en correspondencia entre animales presentes y documentacion', pagina: 2 },
        { id: 48, texto: 'Instalaciones acordes al tipo de PSG autorizado', pagina: 2 },
        { id: 49, texto: 'Accesos y areas definidas para manejo de animales', pagina: 2 },
        { id: 50, texto: 'Buenas condiciones operativas generales de las instalaciones', pagina: 2 },
        { id: 51, texto: 'Corrales identificados con Numero y/o Nombre', pagina: 2 },
        { id: 52, texto: 'Clasificacion fisica de animales por sexo y/o peso', pagina: 2 },
        { id: 53, texto: 'Separacion fisica de animales conforme a condiciones de salud', pagina: 2 },
        { id: 54, texto: 'Marcado a fuego con CN o SR', pagina: 2 },
        { id: 55, texto: 'Manejo fisico de eventos extraordinarios, cuando existan', pagina: 2, categoria: 'Aspectos Sanitarios' },
        { id: 56, texto: 'Limpieza general de areas de manejo y estancia', pagina: 3 },
        { id: 57, texto: 'Existen areas definidas para ingreso, estancia y egreso', pagina: 3 },
        { id: 58, texto: 'Se realiza separacion de animales por manejo, estancia o evento extraordinario', pagina: 3 },
        { id: 59, texto: 'Se realizan acciones sanitarias como banos o tratamientos preventivos', pagina: 3 },
        { id: 60, texto: 'Existe registro de la realizacion de las medidas preventivas', pagina: 3 },
        { id: 61, texto: 'El ingreso y egreso de animales reduce posibles riesgos sanitarios', pagina: 3 },
        { id: 62, texto: 'El manejo fisico de animales muertos no representa riesgo sanitario', pagina: 3 },
    ];

    // Columnas de la tabla
    const tX = 46;       // inicio tabla
    const tW = 520;      // ancho total
    const colNo = 47;    // col No.
    const colTexto = 78; // col Aspecto
    const colSi = 410;   // col SI
    const colNo2 = 436;
    const colNA = 462;
    const colRec = 488;
    const rowH = 16;

    // Función para dibujar tabla de preguntas
    const dibujarTabla = (page, preguntasPagina, yInicial) => {
        let y = yInicial;

        // Encabezado tabla
        page.drawRectangle({ x: tX, y: y - rowH + 3, width: tW, height: rowH, color: rgb(0.85, 0.85, 0.85), borderColor: black, borderWidth: 0.5 });
        page.drawText('No.', { x: colNo, y: y - 10, size: 8, font: fontBold, color: black });
        page.drawText('Aspecto documental', { x: colTexto + 80, y: y - 10, size: 8, font: fontBold, color: black });
        page.drawText('SI', { x: colSi + 6, y: y - 10, size: 8, font: fontBold, color: black });
        page.drawText('NO', { x: colNo2 + 4, y: y - 10, size: 8, font: fontBold, color: black });
        page.drawText('NA', { x: colNA + 4, y: y - 10, size: 8, font: fontBold, color: black });
        page.drawText('Recomend.', { x: colRec + 4, y: y - 10, size: 7, font: fontBold, color: black });
        
        // Líneas verticales encabezado
        [tX, colTexto, colSi, colNo2, colNA, colRec, tX + tW].forEach(x => {
            page.drawLine({ start: { x, y: y + 3 }, end: { x, y: y - rowH + 3 }, thickness: 0.5, color: black });
        });

        y -= rowH;

        preguntasPagina.forEach(p => {
            if (p.categoria) {
                page.drawRectangle({ x: tX, y: y - rowH + 4, width: tW, height: rowH, color: rgb(0.75, 0.75, 0.75), borderColor: black, borderWidth: 0.5 });
                page.drawText(p.categoria, { x: tX + tW / 2 - 30, y: y - 10, size: 8, font: fontBold, color: black });
                y -= rowH;
            }

            const respuesta = datos.respuestas ? datos.respuestas[`p${p.id}`] : '';
            const rec = datos.recomendaciones ? (datos.recomendaciones[`p${p.id}`] || '') : '';
            const si = respuesta === 'SI' ? '[X]' : '[ ]';
            const no = respuesta === 'NO' ? '[X]' : '[ ]';
            const na = respuesta === 'NA' ? '[X]' : '[ ]';

            // Borde fila
            page.drawRectangle({ x: tX, y: y - rowH + 4, width: tW, height: rowH, borderColor: rgb(0.6, 0.6, 0.6), borderWidth: 0.3 });

            // Líneas verticales
            [tX, colTexto, colSi, colNo2, colNA, colRec, tX + tW].forEach(x => {
                page.drawLine({ start: { x, y: y + 3 }, end: { x, y: y - rowH + 4 }, thickness: 0.4, color: rgb(0.5, 0.5, 0.5) });
            });

            page.drawText(`(${p.id})`, { x: colNo, y: y - 10, size: 8, font: fontNormal, color: black });

            const textoCorto = p.texto.length > 58 ? p.texto.substring(0, 56) + '...' : p.texto;
            page.drawText(textoCorto, { x: colTexto + 2, y: y - 10, size: 7.5, font: fontNormal, color: black });

            page.drawText(si, { x: colSi + 5, y: y - 10, size: 8, font: fontNormal, color: black });
            page.drawText(no, { x: colNo2 + 5, y: y - 10, size: 8, font: fontNormal, color: black });
            page.drawText(na, { x: colNA + 5, y: y - 10, size: 8, font: fontNormal, color: black });

            if (rec) {
                const recCorto = rec.length > 12 ? rec.substring(0, 10) + '...' : rec;
                page.drawText(recCorto, { x: colRec + 3, y: y - 10, size: 6.5, font: fontNormal, color: darkGray });
            }

            y -= rowH;
        });

        return y;
    };

    // =====================
    // PÁGINA 1 - Datos generales + preguntas 13-25
    // =====================
    const page1 = pdfDoc.addPage([612, 792]);
    agregarMembrete(page1);

    page1.drawText('LISTA DE VERIFICACION', { x: 210, y: 645, size: 13, font: fontBold, color: black });
    page1.drawText('SUPERVISION A PRESTADORES DE SERVICIOS GANADEROS (PSG)', { x: 110, y: 630, size: 11, font: fontBold, color: black });

    page1.drawText('I. DATOS GENERALES DEL SUJETO SUPERVISADO', { x: 56, y: 612, size: 10, font: fontBold, color: black });

    let y1 = 595;
    const lineaH = 16;

    page1.drawText(`Nombre del Prestador de Servicios Ganaderos (PSG): ${datos.nombre_psg || ''}`, { x: 56, y: y1, size: 9, font: fontNormal, color: black });
    y1 -= lineaH;
    page1.drawText(`Tipo de PSG: ${datos.tipo_psg || ''}`, { x: 56, y: y1, size: 9, font: fontNormal, color: black });
    y1 -= lineaH;
    page1.drawText(`Nombre del Titular o Representante: ${datos.nombre_titular || ''}`, { x: 56, y: y1, size: 9, font: fontNormal, color: black });
    y1 -= lineaH;
    page1.drawText(`Municipio: ${datos.municipio || ''}`, { x: 56, y: y1, size: 9, font: fontNormal, color: black });
    page1.drawText(`Localidad: ${datos.localidad || ''}`, { x: 320, y: y1, size: 9, font: fontNormal, color: black });
    y1 -= lineaH;
    page1.drawText(`Georreferencia:  Latitud: ${datos.latitud || ''}   Longitud: ${datos.longitud || ''}`, { x: 56, y: y1, size: 9, font: fontNormal, color: black });
    y1 -= lineaH;
    page1.drawText(`Capacidad Instalada (Cabezas): ${datos.cabezas || ''}`, { x: 56, y: y1, size: 9, font: fontNormal, color: black });
    page1.drawText(`Telefono: ${datos.telefono || ''}`, { x: 320, y: y1, size: 9, font: fontNormal, color: black });
    y1 -= lineaH;
    page1.drawText(`Fecha de la supervision: ${datos.fecha || ''}`, { x: 56, y: y1, size: 9, font: fontNormal, color: black });
    page1.drawText(`Hora inicio: ${datos.hora_inicio || ''}`, { x: 280, y: y1, size: 9, font: fontNormal, color: black });
    page1.drawText(`Hora termino: ${datos.hora_termino || ''}`, { x: 400, y: y1, size: 9, font: fontNormal, color: black });
    y1 -= lineaH;
    page1.drawText(`Nombre del personal supervisor: ${datos.nombre_supervisor || ''}`, { x: 56, y: y1, size: 9, font: fontNormal, color: black });

    y1 -= 14;
    page1.drawText('II. LISTA DE VERIFICACION', { x: 56, y: y1, size: 10, font: fontBold, color: black });
    y1 -= 16;

    dibujarTabla(page1, preguntas.filter(p => p.pagina === 1), y1);

    // =====================
    // PÁGINA 2 - Preguntas 26-55
    // =====================
    const page2 = pdfDoc.addPage([612, 792]);
    agregarMembrete(page2);
    dibujarTabla(page2, preguntas.filter(p => p.pagina === 2), 638);

    // =====================
    // PÁGINA 3 - Preguntas 56-62 + Observaciones + Conclusión
    // =====================
    const page3 = pdfDoc.addPage([612, 792]);
    agregarMembrete(page3);

    let y3 = dibujarTabla(page3, preguntas.filter(p => p.pagina === 3), 638);

    y3 -= 10;
    page3.drawText('III. OBSERVACIONES DEL SUPERVISOR', { x: 56, y: y3, size: 10, font: fontBold, color: black });
    y3 -= 14;

    // Líneas para observaciones
    for (let i = 0; i < 3; i++) {
        page3.drawLine({ start: { x: 56, y: y3 }, end: { x: 556, y: y3 }, thickness: 0.5, color: gray });
        y3 -= 16;
    }
    if (datos.observaciones) {
        page3.drawText(datos.observaciones.substring(0, 100), { x: 58, y: y3 + 32, size: 9, font: fontNormal, color: black });
    }

    y3 -= 10;
    page3.drawText('IV. CONCLUSION DE LA SUPERVISION', { x: 56, y: y3, size: 10, font: fontBold, color: black });
    y3 -= 16;

    const cumple = datos.cumple ? '[X]' : '[ ]';
    const observ = datos.presenta_observaciones ? '[X]' : '[ ]';
    const seguim = datos.requiere_seguimiento ? '[X]' : '[ ]';

    page3.drawText(`${cumple} Cumple`, { x: 56, y: y3, size: 10, font: fontNormal, color: black });
    y3 -= 14;
    page3.drawText(`${observ} Presenta observaciones`, { x: 56, y: y3, size: 10, font: fontNormal, color: black });
    y3 -= 14;
    page3.drawText(`${seguim} Requiere seguimiento`, { x: 56, y: y3, size: 10, font: fontNormal, color: black });

    y3 -= 20;
    // Tabla de firmas - 3 celdas
    const fw = 163;
    const fh = 60; // altura celda
    const fGap = 3;
    const fx1 = 56;
    const fx2 = fx1 + fw + fGap;
    const fx3 = fx2 + fw + fGap;

    // Dibujar 3 celdas con borde
    [fx1, fx2, fx3].forEach(fx => {
        page3.drawRectangle({ x: fx, y: y3 - fh, width: fw, height: fh, borderColor: black, borderWidth: 0.5 });
    });

    // Nombres dentro de las celdas (parte superior de cada celda)
    if (datos.responsable_psg) {
        page3.drawText(datos.responsable_psg.substring(0, 25), { x: fx1 + 4, y: y3 - 15, size: 7.5, font: fontNormal, color: black });
    }
    if (datos.responsable_supervisor) {
        page3.drawText(datos.responsable_supervisor.substring(0, 25), { x: fx2 + 4, y: y3 - 15, size: 7.5, font: fontNormal, color: black });
    }
    if (datos.nombre_testigo) {
        page3.drawText(datos.nombre_testigo.substring(0, 25), { x: fx3 + 4, y: y3 - 15, size: 7.5, font: fontNormal, color: black });
    }

    // Línea divisoria dentro de cada celda (separa nombre de etiqueta)
    [fx1, fx2, fx3].forEach(fx => {
        page3.drawLine({ start: { x: fx, y: y3 - fh + 18 }, end: { x: fx + fw, y: y3 - fh + 18 }, thickness: 0.5, color: black });
    });

    // Etiquetas en la parte inferior de cada celda
    page3.drawText('Nombre y firma del', { x: fx1 + 4, y: y3 - fh + 12, size: 7.5, font: fontBold, color: black });
    page3.drawText('responsable del PSG', { x: fx1 + 4, y: y3 - fh + 3, size: 7.5, font: fontBold, color: black });

    page3.drawText('Nombre y firma del', { x: fx2 + 4, y: y3 - fh + 12, size: 7.5, font: fontBold, color: black });
    page3.drawText('responsable del supervisor', { x: fx2 + 4, y: y3 - fh + 3, size: 7.5, font: fontBold, color: black });

    page3.drawText('Nombre y firma', { x: fx3 + 4, y: y3 - fh + 12, size: 7.5, font: fontBold, color: black });
    page3.drawText('del testigo', { x: fx3 + 4, y: y3 - fh + 3, size: 7.5, font: fontBold, color: black });

    // Descargar
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lista_Verificacion_${(datos.nombre_psg || 'SEIOT').replace(/\s/g, '_')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
};
