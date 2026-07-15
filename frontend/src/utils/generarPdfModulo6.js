import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { LOGO_HEADER, LOGO_FOOTER } from './imagenesMembretes';

// Función auxiliar para dividir texto largo en líneas para el PDF
const wrapText = (text, maxChars = 85) => {
    if (!text) return [];
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    for (const word of words) {
        if ((currentLine + ' ' + word).trim().length <= maxChars) {
            currentLine = (currentLine + ' ' + word).trim();
        } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines.slice(0, 4); // máximo 4 líneas para no desbordar el espacio del PDF
};

export const generarPdfModulo6 = async (datos) => {
    // Mapear valores de dropdowns a texto legible
    const tipoIdMap = { 'INE': 'INE', 'CREDENCIAL': 'Credencial', 'PASAPORTE': 'Pasaporte', 'CEDULA_PROFESIONAL': 'Cedula Profesional', 'LICENCIA': 'Licencia de Conducir', 'OTRO': 'Otro' };
    const expedidaPorMap = { 'GOBIERNO_FEDERAL': 'Gobierno Federal', 'SEDER': 'SEDER', 'GOBIERNO_ESTATAL': 'Gobierno Estatal', 'SENASICA': 'SENASICA', 'INE': 'INE', 'SEP': 'SEP', 'OTRO': 'Otro' };
    const tipoIdTexto = tipoIdMap[datos.tipo_id_responsable] || datos.tipo_id_responsable || '';
    const expedidaPorTexto = expedidaPorMap[datos.id_expedida_por] || datos.id_expedida_por || '';
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

    const agregarMembrete = (page) => {
        page.drawImage(headerImg, { x: 0, y: 662, width: 612, height: 130 });
        page.drawImage(footerImg, { x: 0, y: 0, width: 612, height: 130 });
        page.drawText('SECRETARIA DE DESARROLLO RURAL', { x: 220, y: 62, size: 7.5, font: fontBold, color: gray });
        page.drawText('Av. Jacarandas No. 371 Sur Colonia El Tecolote C.P. 63135 Tepic, Nayarit.', { x: 155, y: 51, size: 7.5, font: fontNormal, color: gray });
        page.drawText('311 216 22 63 | 311 216 22 74', { x: 228, y: 40, size: 7.5, font: fontNormal, color: gray });
    };

    const lineaFirma = (page, x, yPos, w = 280) => {
        page.drawLine({ start: { x, y: yPos }, end: { x: x + w, y: yPos }, thickness: 0.5, color: black });
    };

    const lineaObs = (page, yPos) => {
        page.drawLine({ start: { x: 56, y: yPos }, end: { x: 556, y: yPos }, thickness: 0.4, color: gray });
    };

    // Parsear fecha de forma robusta (soporta YYYY-MM-DD e ISO)
    let fecha;
    const rawFecha = datos.fecha || datos.fecha_inicio;
    if (rawFecha) {
        const partes = rawFecha.split(/[-\/T]/);
        if (partes[0].length === 4) {
            fecha = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
        } else {
            fecha = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
        }
    } else {
        fecha = new Date();
    }
    const dia = fecha.getDate().toString();
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const mes = meses[fecha.getMonth()];
    const anio = fecha.getFullYear().toString();

    // Fecha cierre (adaptable a fecha_cierre o fecha_acta)
    let fechaCierre;
    const rawCierre = datos.fecha_cierre || datos.fecha_acta;
    if (rawCierre) {
        const partes = rawCierre.split(/[-\/T]/);
        if (partes[0].length === 4) {
            fechaCierre = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
        } else {
            fechaCierre = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
        }
    } else {
        fechaCierre = new Date();
    }
    const diaCierre = fechaCierre.getDate().toString();
    const mesCierre = meses[fechaCierre.getMonth()];
    const anioCierre = fechaCierre.getFullYear().toString();

    // =====================
    // PÁGINA 1
    // =====================
    const page1 = pdfDoc.addPage([612, 792]);
    agregarMembrete(page1);

    page1.drawText('ACTA CIRCUNSTANCIADA', { x: 200, y: 648, size: 14, font: fontBold, color: black });
    page1.drawText('DE SUPERVISION ZOOSANITARIA Y DE TRAZABILIDAD**', { x: 130, y: 633, size: 11, font: fontBold, color: black });
    page1.drawText('SECRETARIA DE DESARROLLO RURAL', { x: 195, y: 615, size: 10, font: fontBold, color: black });
    page1.drawText('GOBIERNO DEL ESTADO DE NAYARIT', { x: 198, y: 601, size: 10, font: fontBold, color: black });
    page1.drawText(`ACTA CIRCUNSTANCIADA No. ${datos.acta_no || ''}`, { x: 320, y: 585, size: 10, font: fontBold, color: black });
    page1.drawText(`FOLIO: ${datos.folio || ''}`, { x: 390, y: 571, size: 10, font: fontBold, color: black });

    let y = 553;
    page1.drawText('I. LUGAR, FECHA Y HORA DE LA DILIGENCIA', { x: 56, y, size: 10, font: fontBold, color: black });
    y -= 14;
    page1.drawText(`En el establecimiento denominado ${datos.establecimiento || ''}, con clave`, { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 13;
    page1.drawText(`de PSG / UPP ${datos.clave_psg || ''}, ubicado en`, { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 13;
    page1.drawText(`${datos.ubicacion || ''}, localidad de ${datos.localidad || ''}, municipio`, { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 13;
    page1.drawText(`de ${datos.municipio || ''}, Estado de Nayarit, siendo las ${datos.hora || ''} horas del dia ${dia} de`, { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 13;
    page1.drawText(`${mes} de ${anio}, el/la C. ${datos.nombre_oficial || ''}, en su`, { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 13;

    const textoLegal = [
        'caracter de personal oficial estatal adscrito a la Secretaria de Desarrollo Rural, debidamente',
        'facultado, se constituyo en el lugar senalado para practicar supervision zoosanitaria y de trazabilidad,',
        'con fundamento en lo dispuesto por los articulos 38, fracciones IX y XXI, de la Ley Organica del Poder',
        'Ejecutivo del Estado de Nayarit; 159, fracciones IV, V, VI y IX, de la Ley Ganadera y de Desarrollo',
        'Pecuario para el Estado de Nayarit; 1, 20 y 21 del Reglamento de la Ley Ganadera y de Desarrollo',
        'Pecuario para el Estado de Nayarit; articulos Primero, Vigesimo, Vigesimo Primero, Vigesimo Tercero y',
        'Transitorio Segundo del Acuerdo Administrativo que Establece los Requisitos para la Movilizacion de',
        'Ganado Bovino dentro y hacia el Estado de Nayarit, Derivado de las Campanas contra la Tuberculosis',
        'y Brucelosis Bovina; asi como en el Convenio de Coordinacion para realizar acciones de verificacion e',
        'inspeccion vinculadas al control de la movilizacion agropecuaria, acuicola y pesquera, celebrado entre',
        'la Secretaria de Agricultura y Desarrollo Rural y el Gobierno del Estado de Nayarit, particularmente en',
        'su apartado II, numeral II.3, y demas disposiciones aplicables en materia de sanidad animal,',
        'movilizacion pecuaria y trazabilidad, se le notifica que esta Secretaria llevara a cabo una accion de',
        'supervision en el establecimiento de su responsabilidad.',
    ];
    textoLegal.forEach(l => { page1.drawText(l, { x: 56, y, size: 9.5, font: fontNormal, color: black }); y -= 13; });

    y -= 4;
    page1.drawText('II. IDENTIFICACION DEL RESPONSABLE DEL ESTABLECIMIENTO', { x: 56, y, size: 10, font: fontBold, color: black });
    y -= 13;
    page1.drawText('En el lugar de la diligencia se encontro presente el/la C.', { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 13;
    page1.drawText(`${datos.establecimiento || ''}, quien manifesto ser responsable o encargado del`, { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 13;
    page1.drawText(`establecimiento, identificandose con ${tipoIdTexto}, numero`, { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 13;
    page1.drawText(`${datos.numero_id_responsable || ''}, expedida por ${expedidaPorTexto}, con fecha ${datos.fecha_expedicion_id || ''},`, { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 13;
    page1.drawText('documento que contiene nombre, fotografia y firma, mismo que fue examinado y devuelto en el acto.', { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 13;
    page1.drawText('El compareciente senalo como domicilio para oir y recibir notificaciones el ubicado en', { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 13;
    page1.drawText(`${datos.ubicacion_compareciente || ''}, municipio de`, { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 13;
    page1.drawText(`${datos.municipio || ''}, Estado de ${datos.estado || 'Nayarit'}.`, { x: 56, y, size: 9.5, font: fontNormal, color: black });

    // =====================
    // PÁGINA 2
    // =====================
    const page2 = pdfDoc.addPage([612, 792]);
    agregarMembrete(page2);

    let y2 = 638;
    page2.drawText('III. IDENTIFICACION DEL PERSONAL ACTUANTE', { x: 56, y: y2, size: 10, font: fontBold, color: black });
    y2 -= 13;
    page2.drawText(`El personal actuante se identifico plenamente ante el responsable del establecimiento con credencial`, { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 13;
    page2.drawText(`oficial numero ${datos.credencial_oficial_no || ''}, expedida por la Secretaria de Desarrollo Rural del Estado`, { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 13;
    page2.drawText('de Nayarit, acreditando su caracter y facultades para la practica de la presente diligencia,', { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 13;
    page2.drawText('identificacion que fue revisada y devuelta sin objecion alguna.', { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });

    y2 -= 16;
    page2.drawText('IV. DESIGNACION DE TESTIGOS DE ASISTENCIA', { x: 56, y: y2, size: 10, font: fontBold, color: black });
    y2 -= 13;
    page2.drawText('De conformidad con lo dispuesto por el articulo 66 de la Ley Federal de Procedimiento Administrativo,', { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 13;
    page2.drawText('se solicito al responsable del establecimiento designar a dos testigos de asistencia, designandose a los CC.:', { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 16;
    page2.drawText(`1. ${datos.nombre_testigo1 || ''},`, { x: 70, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 13;
    page2.drawText(`con domicilio en ${datos.domicilio_testigo1 || ''}.`, { x: 70, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 16;
    page2.drawText(`2. ${datos.nombre_testigo2 || ''},`, { x: 70, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 13;
    page2.drawText(`con domicilio en ${datos.domicilio_testigo2 || ''}.`, { x: 70, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 13;
    page2.drawText('Ambos aceptaron el cargo, manifestaron conducirse con verdad y se identificaron con documentos', { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 13;
    page2.drawText('oficiales vigentes, mismos que fueron examinados y devueltos.', { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });

    y2 -= 16;
    page2.drawText('V. EXHIBICION DE LA ORDEN DE COMISION', { x: 56, y: y2, size: 10, font: fontBold, color: black });
    y2 -= 13;
    page2.drawText(`Acto seguido, el personal actuante exhibio la orden de comision contenida en el oficio numero`, { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 13;
    page2.drawText(`${datos.oficio_comision || ''}, de fecha ${datos.fecha_comision || ''}, emitido por`, { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 13;
    page2.drawText(`${datos.emite_comision || ''}, mediante la cual se autoriza la practica de la presente`, { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 13;
    page2.drawText('supervision, cuyo contenido fue leido y explicado al responsable del establecimiento.', { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });

    y2 -= 16;
    page2.drawText('VI. DESARROLLO DE LA SUPERVISION', { x: 56, y: y2, size: 10, font: fontBold, color: black });
    y2 -= 13;
    page2.drawText('A continuacion, el personal actuante procedio a realizar la supervision, la cual comprendio, segun', { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 13;
    page2.drawText('correspondio: a) Revision documental; b) Verificacion fisica de instalaciones, animales y/o procesos;', { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 13;
    page2.drawText('c) Verificacion de medidas zoosanitarias y de trazabilidad; d) Revision de registros, bitacoras y', { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 13;
    page2.drawText('documentacion aplicable.', { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });

    y2 -= 16;
    page2.drawText('VII. HECHOS U OBSERVACIONES DETECTADAS', { x: 56, y: y2, size: 10, font: fontBold, color: black });
    y2 -= 13;
    page2.drawText('Derivado de la diligencia, se hicieron constar los siguientes hechos y observaciones:', { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 14;

    if (datos.hechos_observaciones) {
        const lineas = wrapText(datos.hechos_observaciones);
        lineas.forEach(linea => {
            page2.drawText(linea, { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
            y2 -= 13;
        });
    }
    for (let i = 0; i < 3; i++) { lineaObs(page2, y2); y2 -= 16; }

    y2 -= 5;
    page2.drawText('Los hechos descritos podrian constituir incumplimiento a lo dispuesto en:', { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 14;

    const arts = [
        [datos.articulo1, datos.de1],
        [datos.articulo2, datos.de2],
        [datos.articulo3, datos.de3],
        [datos.articulo4, datos.de4],
    ];
    arts.forEach(([art, de]) => {
        page2.drawText(`Articulo(s) ${art || ''}`, { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
        y2 -= 13;
        page2.drawText(`de ${de || ''};`, { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
        y2 -= 13;
    });

    // =====================
    // PÁGINA 3
    // =====================
    const page3 = pdfDoc.addPage([612, 792]);
    agregarMembrete(page3);

    let y3 = 638;
    page3.drawText('VIII. MANIFESTACIONES DEL RESPONSABLE', { x: 56, y: y3, size: 10, font: fontBold, color: black });
    y3 -= 13;
    page3.drawText('En uso del derecho que le confiere el articulo 68 de la Ley Federal de Procedimiento Administrativo, el', { x: 56, y: y3, size: 9.5, font: fontNormal, color: black });
    y3 -= 13;
    page3.drawText('responsable del establecimiento manifesto lo siguiente:', { x: 56, y: y3, size: 9.5, font: fontNormal, color: black });
    y3 -= 14;

    if (datos.manifestaciones) {
        const lineas = wrapText(datos.manifestaciones);
        lineas.forEach(linea => {
            page3.drawText(linea, { x: 56, y: y3, size: 9.5, font: fontNormal, color: black });
            y3 -= 13;
        });
    }
    for (let i = 0; i < 5; i++) { lineaObs(page3, y3); y3 -= 16; }

    y3 -= 8;
    page3.drawText('IX. CIERRE DEL ACTA', { x: 56, y: y3, size: 10, font: fontBold, color: black });
    y3 -= 13;
    page3.drawText('Leida la presente acta y explicados su contenido y alcance legal, se firma por quienes en ella', { x: 56, y: y3, size: 9.5, font: fontNormal, color: black });
    y3 -= 13;
    page3.drawText('intervinieron, haciendose constar que la presente acta no implica por si misma la imposicion de', { x: 56, y: y3, size: 9.5, font: fontNormal, color: black });
    y3 -= 13;
    page3.drawText('sanciones, y que sera turnada a la autoridad competente para los efectos administrativos conducentes.', { x: 56, y: y3, size: 9.5, font: fontNormal, color: black });
    y3 -= 13;
    page3.drawText(`Siendo las ${datos.hora_cierre || datos.hora_acta || ''} horas del dia ${diaCierre} de ${mesCierre} de ${anioCierre}, se dio por concluida la`, { x: 56, y: y3, size: 9.5, font: fontNormal, color: black });
    y3 -= 13;
    page3.drawText('diligencia, levantandose la presente acta en tres tantos, entregandose un ejemplar debidamente', { x: 56, y: y3, size: 9.5, font: fontNormal, color: black });
    y3 -= 13;
    page3.drawText('firmado al responsable del establecimiento.', { x: 56, y: y3, size: 9.5, font: fontNormal, color: black });

    y3 -= 25;
    page3.drawText('FIRMAS', { x: 270, y: y3, size: 10, font: fontBold, color: black });
    y3 -= 20;

    // Firma responsable PSG
    page3.drawText('C.', { x: 200, y: y3, size: 9.5, font: fontNormal, color: black });
    lineaFirma(page3, 215, y3, 180);
    y3 -= 13;
    page3.drawText(datos.establecimiento || '', { x: 215, y: y3, size: 8, font: fontNormal, color: black });
    y3 -= 11;
    page3.drawText('Responsable o Encargado del PSG / UPP', { x: 195, y: y3, size: 8, font: fontBold, color: black });

    y3 -= 22;
    page3.drawText('C.', { x: 200, y: y3, size: 9.5, font: fontNormal, color: black });
    lineaFirma(page3, 215, y3, 180);
    y3 -= 13;
    page3.drawText(datos.nombre_oficial || '', { x: 215, y: y3, size: 8, font: fontNormal, color: black });
    y3 -= 11;
    page3.drawText('Personal Oficial Estatal', { x: 220, y: y3, size: 8, font: fontBold, color: black });

    y3 -= 22;
    page3.drawText('C.', { x: 220, y: y3, size: 9.5, font: fontNormal, color: black });
    lineaFirma(page3, 235, y3, 150);
    y3 -= 13;
    page3.drawText(datos.nombre_testigo1 || '', { x: 235, y: y3, size: 8, font: fontNormal, color: black });
    y3 -= 11;
    page3.drawText('Testigo de asistencia', { x: 225, y: y3, size: 8, font: fontBold, color: black });

    y3 -= 22;
    page3.drawText('C.', { x: 220, y: y3, size: 9.5, font: fontNormal, color: black });
    lineaFirma(page3, 235, y3, 150);
    y3 -= 13;
    page3.drawText(datos.nombre_testigo2 || '', { x: 235, y: y3, size: 8, font: fontNormal, color: black });
    y3 -= 11;
    page3.drawText('Testigo de asistencia', { x: 225, y: y3, size: 8, font: fontBold, color: black });

    // Descargar
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Acta_Circunstanciada_${(datos.acta_no || 'SEIOT').replace(/\//g, '_')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
};