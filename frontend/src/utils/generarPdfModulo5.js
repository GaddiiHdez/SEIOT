import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { LOGO_HEADER, LOGO_FOOTER } from './imagenesMembretes';

export const generarPdfModulo5 = async (datos) => {
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

    const lineaFirma = (page, x, yPos, w = 400) => {
        page.drawLine({ start: { x, y: yPos }, end: { x: x + w, y: yPos }, thickness: 0.5, color: black });
    };

    const lineaObservacion = (page, yPos) => {
        page.drawLine({ start: { x: 56, y: yPos }, end: { x: 556, y: yPos }, thickness: 0.4, color: gray });
    };

    // Parsear fecha
    const fecha = datos.fecha ? new Date(datos.fecha) : new Date();
    const dia = fecha.getDate().toString();
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const mes = meses[fecha.getMonth()];
    const anio = fecha.getFullYear().toString();

    // =====================
    // PÁGINA 1
    // =====================
    const page1 = pdfDoc.addPage([612, 792]);
    agregarMembrete(page1);

    page1.drawText('FORMATO DE ACTA DE SUPERVISION', { x: 175, y: 645, size: 13, font: fontBold, color: black });
    page1.drawText('A PRESTADORES DE SERVICIOS GANADEROS (PSG)', { x: 150, y: 630, size: 11, font: fontBold, color: black });

    page1.drawText(`ACTA No.: ${datos.acta_no || ''}`, { x: 320, y: 610, size: 10, font: fontBold, color: black });
    page1.drawText(`EXPEDIENTE No.: ${datos.folio || ''}`, { x: 320, y: 595, size: 10, font: fontBold, color: black });

    let y = 575;
    page1.drawText(`En la localidad de ${datos.localidad || ''} (3), municipio de`, { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 13;
    page1.drawText(`${datos.municipio || ''} (4), Estado de Nayarit, siendo las ${datos.hora || ''} horas del dia`, { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 13;
    page1.drawText(`${dia} de ${mes} de ${anio} (5), el que suscribe`, { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 13;
    page1.drawText(`${datos.nombre_supervisor || ''} (6), servidor publico adscrito a la Secretaria de`, { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 13;

    const textoLegal = [
        'Desarrollo Rural del Gobierno del Estado de Nayarit, debidamente facultado, se constituyo en el',
        'establecimiento identificado como Prestador de Servicios Ganaderos (PSG), a efecto de concluir la',
        'accion de supervision con fundamento en lo dispuesto por los articulos 38, fracciones IX y XXI, de la',
        'Ley Organica del Poder Ejecutivo del Estado de Nayarit; 159, fracciones IV, V, VI y IX, de la Ley',
        'Ganadera y de Desarrollo Pecuario para el Estado de Nayarit; 1, 20 y 21 del Reglamento de la Ley',
        'Ganadera y de Desarrollo Pecuario para el Estado de Nayarit; articulos Primero, Vigesimo, Vigesimo',
        'Primero, Vigesimo Tercero y Transitorio Segundo del Acuerdo Administrativo que Establece los',
        'Requisitos para la Movilizacion de Ganado Bovino dentro y hacia el Estado de Nayarit, Derivado de las',
        'Campanas contra la Tuberculosis y Brucelosis Bovina; asi como en el Convenio de Coordinacion para',
        'realizar acciones de verificacion e inspeccion vinculadas al control de la movilizacion agropecuaria,',
        'acuicola y pesquera, celebrado entre la Secretaria de Agricultura y Desarrollo Rural y el Gobierno del',
        'Estado de Nayarit, particularmente en su apartado II, numeral II.3, y demas disposiciones aplicables',
        'en materia de sanidad animal, movilizacion pecuaria y trazabilidad, se le notifica que esta Secretaria',
        'llevara a cabo una accion de supervision en el establecimiento de su responsabilidad.',
    ];

    textoLegal.forEach(l => { page1.drawText(l, { x: 56, y, size: 9.5, font: fontNormal, color: black }); y -= 13; });

    y -= 6;
    page1.drawText('I. DATOS DEL SUJETO SUPERVISADO', { x: 180, y, size: 10, font: fontBold, color: black });
    y -= 14;
    page1.drawText(`Nombre del PSG: ${datos.nombre_psg || ''}`, { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 14;
    page1.drawText(`Tipo de PSG: ${datos.tipo_psg || ''}`, { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 14;
    page1.drawText(`Nombre del titular o representante: ${datos.nombre_titular || ''}`, { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 14;
    page1.drawText(`Domicilio del establecimiento: ${datos.domicilio || ''}`, { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 14;
    page1.drawText(`Telefono: ${datos.telefono || ''}`, { x: 56, y, size: 9.5, font: fontNormal, color: black });

    y -= 16;
    page1.drawText('II. DATOS DE LA ACCION DE SUPERVISION', { x: 170, y, size: 10, font: fontBold, color: black });
    y -= 14;
    page1.drawText(`Fecha de la supervision: ${datos.fecha || ''}`, { x: 56, y, size: 9.5, font: fontNormal, color: black });
    y -= 14;
    page1.drawText(`Hora de inicio: ${datos.hora_inicio || ''}`, { x: 56, y, size: 9.5, font: fontNormal, color: black });
    page1.drawText(`Hora de termino: ${datos.hora_termino || ''}`, { x: 280, y, size: 9.5, font: fontNormal, color: black });
    y -= 14;
    page1.drawText(`Personal supervisor: ${datos.nombre_supervisor || ''}`, { x: 56, y, size: 9.5, font: fontNormal, color: black });

    // =====================
    // PÁGINA 2
    // =====================
    const page2 = pdfDoc.addPage([612, 792]);
    agregarMembrete(page2);

    let y2 = 638;

    page2.drawText('III. DOCUMENTOS E INSTRUMENTOS APLICADOS', { x: 160, y: y2, size: 10, font: fontBold, color: black });
    y2 -= 14;
    page2.drawText('Durante la supervision se aplicaron los siguientes instrumentos:', { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 14;
    page2.drawText('- Lista de Verificacion para PSG.', { x: 70, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 14;
    const actaH = datos.acta_hechos ? '[X] si' : '[ ] si';
    const actaHNo = datos.acta_hechos ? '[ ] no' : '[X] no';
    page2.drawText(`- Acta de Hechos, ${actaH} ${actaHNo}.`, { x: 70, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 14;
    page2.drawText(`- Otros documentos (especificar): ${datos.otros_documentos || ''}`, { x: 70, y: y2, size: 9.5, font: fontNormal, color: black });

    y2 -= 18;
    page2.drawText('IV. RESULTADO DE LA SUPERVISION', { x: 195, y: y2, size: 10, font: fontBold, color: black });
    y2 -= 13;
    page2.drawText('Derivado de la aplicacion de la Lista de Verificacion, se obtuvo el siguiente resultado general:', { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 14;
    page2.drawText(`${datos.cumple ? '[X]' : '[ ]'} Cumple`, { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 14;
    page2.drawText(`${datos.presenta_observaciones ? '[X]' : '[ ]'} Presenta observaciones`, { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 14;
    page2.drawText(`${datos.requiere_seguimiento ? '[X]' : '[ ]'} Requiere seguimiento`, { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });

    y2 -= 18;
    page2.drawText('V. DESCRIPCION DE OBSERVACIONES (CUANDO APLIQUE)', { x: 130, y: y2, size: 10, font: fontBold, color: black });
    y2 -= 13;
    page2.drawText('Se describen de manera clara y objetiva las observaciones detectadas durante la supervision:', { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 14;

    if (datos.observaciones_detectadas) {
        page2.drawText(datos.observaciones_detectadas.substring(0, 90), { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
        y2 -= 13;
    }
    for (let i = 0; i < 3; i++) { lineaObservacion(page2, y2); y2 -= 16; }

    y2 -= 8;
    page2.drawText('VI. MEDIDAS PREVENTIVAS O RECOMENDACIONES (CUANDO APLIQUE)', { x: 100, y: y2, size: 10, font: fontBold, color: black });
    y2 -= 13;
    page2.drawText('Con el objeto de fortalecer el cumplimiento de las disposiciones aplicables, se formulan las siguientes', { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 13;
    page2.drawText('medidas preventivas o recomendaciones:', { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 14;

    if (datos.medidas_preventivas) {
        page2.drawText(datos.medidas_preventivas.substring(0, 90), { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
        y2 -= 13;
    }
    for (let i = 0; i < 3; i++) { lineaObservacion(page2, y2); y2 -= 16; }

    y2 -= 8;
    page2.drawText('VII. MANIFESTACIONES DEL SUPERVISADO', { x: 185, y: y2, size: 10, font: fontBold, color: black });
    y2 -= 13;
    page2.drawText('El titular o representante del PSG manifesto lo siguiente:', { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 14;

    if (datos.manifestaciones) {
        page2.drawText(datos.manifestaciones.substring(0, 90), { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
        y2 -= 13;
    }
    for (let i = 0; i < 3; i++) { lineaObservacion(page2, y2); y2 -= 16; }

    y2 -= 5;
    page2.drawText(`${datos.no_realizo_manifestaciones ? '[X]' : '[ ]'} No realizo manifestaciones.`, { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });

    y2 -= 18;
    page2.drawText('VIII. CIERRE DEL ACTA', { x: 240, y: y2, size: 10, font: fontBold, color: black });
    y2 -= 13;
    page2.drawText('Leida la presente Acta de Supervision y enteradas las personas que en ella intervinieron de su', { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
    y2 -= 13;
    page2.drawText('contenido y alcance, se firma para constancia, dejando asentado que la presente tiene un caracter', { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });

    // =====================
    // PÁGINA 3
    // =====================
    const page3 = pdfDoc.addPage([612, 792]);
    agregarMembrete(page3);

    let y3 = 638;
    page3.drawText('preventivo y de control, y no implica por si misma la determinacion de infracciones ni la imposicion de', { x: 56, y: y3, size: 9.5, font: fontNormal, color: black });
    y3 -= 13;
    page3.drawText('sanciones.', { x: 56, y: y3, size: 9.5, font: fontNormal, color: black });

    y3 -= 22;
    page3.drawText('FIRMAS', { x: 270, y: y3, size: 10, font: fontBold, color: black });
    y3 -= 18;

    page3.drawText('Nombre y firma del Supervisor:', { x: 200, y: y3, size: 9.5, font: fontNormal, color: black });
    y3 -= 14;
    page3.drawText(datos.nombre_supervisor || '', { x: 56, y: y3, size: 9.5, font: fontNormal, color: black });
    lineaFirma(page3, 56, y3 - 2, 460);

    y3 -= 22;
    page3.drawText('Nombre y firma del Responsable del PSG:', { x: 185, y: y3, size: 9.5, font: fontNormal, color: black });
    y3 -= 14;
    page3.drawText(datos.nombre_psg || '', { x: 56, y: y3, size: 9.5, font: fontNormal, color: black });
    lineaFirma(page3, 56, y3 - 2, 460);

    y3 -= 22;
    page3.drawText('Nombre y firma del Testigo:', { x: 220, y: y3, size: 9.5, font: fontNormal, color: black });
    y3 -= 14;
    page3.drawText(datos.nombre_testigo || '', { x: 56, y: y3, size: 9.5, font: fontNormal, color: black });
    lineaFirma(page3, 56, y3 - 2, 460);

    // Descargar
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Acta_Supervision_${(datos.acta_no || 'SEIOT').replace(/\//g, '_')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
};