import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { LOGO_HEADER, LOGO_FOOTER } from './imagenesMembretes';

export const generarPdfModulo4 = async (datos) => {
    const pdfDoc = await PDFDocument.create();
    const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

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

    // Parsear fecha — evitar problema de zona horaria con strings tipo "2026-06-14"
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    let dia, mes, anio;
    if (datos.fecha && typeof datos.fecha === 'string' && datos.fecha.includes('-')) {
        const partes = datos.fecha.split('T')[0].split('-');
        anio = partes[0];
        mes = meses[parseInt(partes[1]) - 1];
        dia = parseInt(partes[2]).toString();
    } else if (datos.fecha) {
        const fecha = new Date(datos.fecha);
        dia = fecha.getDate().toString();
        mes = meses[fecha.getMonth()];
        anio = fecha.getFullYear().toString();
    } else {
        const hoy = new Date();
        dia = hoy.getDate().toString();
        mes = meses[hoy.getMonth()];
        anio = hoy.getFullYear().toString();
    }

    // Función para dibujar línea de firma
    const lineaFirma = (page, x, yPos, w = 400) => {
        page.drawLine({ start: { x, y: yPos }, end: { x: x + w, y: yPos }, thickness: 0.5, color: black });
    };

    // =====================
    // PÁGINA 1
    // =====================
    const page1 = pdfDoc.addPage([612, 792]);
    agregarMembrete(page1);

    // Títulos
    page1.drawText('FORMATO DE ACTA DE HECHOS', { x: 175, y: 645, size: 13, font: fontBold, color: black });
    page1.drawText('SUPERVISION A PRESTADORES DE SERVICIOS GANADEROS (PSG)', { x: 110, y: 630, size: 11, font: fontBold, color: black });

    // Acta No y Expediente
    page1.drawText(`ACTA No.: ${datos.acta_no || ''}`, { x: 320, y: 610, size: 10, font: fontBold, color: black });
    page1.drawText(`EXPEDIENTE No.: ${datos.folio || ''}`, { x: 320, y: 595, size: 10, font: fontBold, color: black });

    // Texto introductorio
    let y = 575;
    page1.drawText(`En la localidad de ${datos.localidad || ''} (3), municipio de`, { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 13;
    page1.drawText(`${datos.municipio || ''} (4), Estado de Nayarit, siendo las ${datos.hora || ''} horas del dia`, { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 13;
    page1.drawText(`${dia} de ${mes} de ${anio} (5), el que suscribe,`, { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 13;
    page1.drawText(`${datos.nombre_supervisor || ''} (6), servidor publico adscrito a la Secretaria de`, { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 13;
    page1.drawText('Desarrollo Rural del Gobierno del Estado de Nayarit, debidamente facultado, se constituyo en el', { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 13;
    page1.drawText('establecimiento identificado como Prestador de Servicios Ganaderos (PSG), con el objeto de asentar', { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 13;
    page1.drawText('los hechos observados durante la accion de supervision practicada.', { x: 56, y, size: 9.5, font: fontNormal, color: black });

    // I. DATOS DEL SUJETO
    y -= 16;
    page1.drawText('I. DATOS DEL SUJETO SUPERVISADO', { x: 56, y, size: 10, font: fontBold, color: black });
    y -= 14;
    page1.drawText(`Nombre del PSG: ${datos.nombre_psg || ''}`, { x: 56, y, size: 10, font: fontBold, color: black });
    y -= 14;
    page1.drawText(`Tipo de PSG: ${datos.tipo_psg || ''}`, { x: 56, y, size: 10, font: fontBold, color: black });
    y -= 14;
    page1.drawText(`Nombre del titular o representante: ${datos.nombre_titular || ''}`, { x: 56, y, size: 10, font: fontBold, color: black });
    y -= 14;
    page1.drawText(`Domicilio del establecimiento: ${datos.domicilio || ''}`, { x: 56, y, size: 10, font: fontBold, color: black });
    y -= 14;
    page1.drawText(`Telefono: ${datos.telefono || ''}`, { x: 56, y, size: 10, font: fontBold, color: black });

    // Línea divisoria
    y -= 10;
    page1.drawLine({ start: { x: 56, y }, end: { x: 556, y }, thickness: 0.8, color: black });

    // II. DATOS DE LA SUPERVISIÓN
    y -= 14;
    page1.drawText('II. DATOS DE LA SUPERVISION', { x: 56, y, size: 10, font: fontBold, color: black });
    y -= 14;
    page1.drawText(`Fecha de la supervision: ${datos.fecha || ''}`, { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 14;
    page1.drawText(`Hora de inicio: ${datos.hora_inicio || ''}`, { x: 56, y, size: 9.5, font: fontNormal, color: black });
    page1.drawText(`Hora de termino: ${datos.hora_termino || ''}`, { x: 280, y, size: 9.5, font: fontNormal, color: black });
    y -= 14;
    page1.drawText(`Personal supervisor: ${datos.nombre_supervisor || ''}`, { x: 56, y, size: 9.5, font: fontNormal, color: black });

    // III. DESCRIPCIÓN
    y -= 16;
    page1.drawText('III. DESCRIPCION DE LOS HECHOS', { x: 56, y, size: 10, font: fontBold, color: black });
    y -= 13;
    page1.drawText('Durante el desarrollo de la supervision, y como resultado de la revision documental, revision fisica y', { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 13;
    page1.drawText('verificacion de aspectos sanitarios, se hicieron constar los siguientes hechos:', { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 14;
    page1.drawText('Hecho(s) observado(s):', { x: 56, y, size: 9.5, font: fontBold, color: black });
    y -= 14;

    // Texto de hechos observados con líneas
    if (datos.hechos_observados) {
        const palabras = datos.hechos_observados.split(' ');
        let linea = '';
        palabras.forEach(p => {
            if ((linea + p).length > 90) {
                page1.drawText(linea, { x: 56, y, size: 9.5, font: fontNormal, color: black });
                y -= 13;
                linea = p + ' ';
            } else {
                linea += p + ' ';
            }
        });
        if (linea) { page1.drawText(linea, { x: 56, y, size: 9.5, font: fontNormal, color: black }); y -= 13; }
    }

    // Líneas para hechos
    for (let i = 0; i < 4; i++) {
        page1.drawLine({ start: { x: 56, y }, end: { x: 556, y }, thickness: 0.5, color: gray });
        y -= 16;
    }

    // Ejemplo en cursiva
    y -= 5;
    page1.drawText('(Ejemplo de redaccion: "En relacion con el item (17) de la Lista de Verificacion, se constato la ausencia', { x: 56, y, size: 8.5, font: fontItalic, color: gray });
    y -= 12;
    page1.drawText('de los Certificados de Inspeccion Legal que amparan el ingreso de los animales presentes en el', { x: 56, y, size: 8.5, font: fontItalic, color: gray });
    y -= 12;
    page1.drawText('establecimiento.")', { x: 56, y, size: 8.5, font: fontItalic, color: gray });

    // =====================
    // PÁGINA 2
    // =====================
    const page2 = pdfDoc.addPage([612, 792]);
    agregarMembrete(page2);

    let y2 = 638;

    // IV. MANIFESTACIONES
    page2.drawText('IV. MANIFESTACIONES DEL SUPERVISADO (SI LAS HUBIERE)', { x: 56, y: y2, size: 10, font: fontBold, color: black });
    y2 -= 14;
    page2.drawText('El titular o representante del PSG manifesto lo siguiente:', { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 14;

    if (datos.manifestaciones) {
        page2.drawText(datos.manifestaciones.substring(0, 90), { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
        y2 -= 13;
    }

    // Líneas para manifestaciones
    for (let i = 0; i < 2; i++) {
        page2.drawLine({ start: { x: 56, y: y2 }, end: { x: 556, y: y2 }, thickness: 0.5, color: gray });
        y2 -= 16;
    }

    y2 -= 5;
    page2.drawText('(Se deben anular las lineas que no se utilicen, rayndolas de manera transversal).', { x: 56, y: y2, size: 8.5, font: fontItalic, color: gray });
    y2 -= 14;
    const noRealizo = datos.no_realizo_manifestaciones ? '[X]' : '[ ]';
    page2.drawText(`${noRealizo} No realizo manifestaciones.`, { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });

    // V. TESTIGOS
    y2 -= 18;
    page2.drawText('V. TESTIGOS (CUANDO APLIQUE)', { x: 56, y: y2, size: 10, font: fontBold, color: black });
    y2 -= 14;
    page2.drawText(`Nombre del testigo: ${datos.nombre_testigo || ''}`, { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 14;
    page2.drawText(`Domicilio: ${datos.domicilio_testigo || ''}`, { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 14;
    page2.drawText('Firma:', { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    lineaFirma(page2, 90, y2, 460);

    // VI. CIERRE
    y2 -= 18;
    page2.drawText('VI. CIERRE DEL ACTA', { x: 56, y: y2, size: 10, font: fontBold, color: black });
    y2 -= 13;
    const textoCierre = [
        'Leida la presente Acta de Hechos y enteradas las personas que en ella intervinieron de su contenido y',
        'alcance, se firma para constancia, sin que la misma implique calificacion de infracciones ni imposicion',
        'de sanciones, sirviendo unicamente para dejar constancia de los hechos observados durante la supervision.',
    ];
    textoCierre.forEach(l => { page2.drawText(l, { x: 56, y: y2, size: 9.5, font: fontNormal, color: black }); y2 -= 13; });

    y2 -= 5;
    page2.drawText('FIRMAS', { x: 56, y: y2, size: 10, font: fontBold, color: black });
    y2 -= 18;

    page2.drawText('Nombre y firma del Supervisor:', { x: 56, y: y2, size: 9.5, font: fontBold, color: black });
    y2 -= 14;
    page2.drawText(datos.nombre_supervisor || '', { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    lineaFirma(page2, 56, y2 - 2, 460);

    y2 -= 22;
    page2.drawText('Nombre y firma del Responsable del PSG:', { x: 56, y: y2, size: 9.5, font: fontBold, color: black });
    y2 -= 14;
    page2.drawText(datos.nombre_psg || '', { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    lineaFirma(page2, 56, y2 - 2, 460);

    y2 -= 22;
    page2.drawText('Nombre y firma del Testigo:', { x: 56, y: y2, size: 9.5, font: fontBold, color: black });
    y2 -= 14;
    page2.drawText(datos.nombre_testigo_cierre || datos.nombre_testigo || '', { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    lineaFirma(page2, 56, y2 - 2, 460);

    // Descargar
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Acta_Hechos_${(datos.acta_no || 'SEIOT').replace(/\//g, '_')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
};