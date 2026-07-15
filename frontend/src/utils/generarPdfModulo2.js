import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { LOGO_HEADER, LOGO_FOOTER } from './imagenesMembretes';

export const generarPdfModulo2 = async (datos) => {
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

    // Parsear fecha
    const fecha = datos.fecha ? new Date(datos.fecha) : new Date();
    const dia = fecha.getDate().toString();
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const mes = meses[fecha.getMonth()];
    const anio = fecha.getFullYear().toString();

    // Función membrete reutilizable
    const agregarMembrete = (page) => {
        page.drawImage(headerImg, { x: 0, y: 662, width: 612, height: 130 });
        page.drawImage(footerImg, { x: 0, y: 0, width: 612, height: 130 });
        page.drawText('SECRETARÍA DE DESARROLLO RURAL', { x: 220, y: 62, size: 7.5, font: fontBold, color: gray });
        page.drawText('Av. Jacarandas No. 371 Sur Colonia El Tecolote C.P. 63135 Tepic, Nayarit.', { x: 155, y: 51, size: 7.5, font: fontNormal, color: gray });
        page.drawText('311 216 22 63 | 311 216 22 74', { x: 228, y: 40, size: 7.5, font: fontNormal, color: gray });
    };

    // =====================
    // PÁGINA 1
    // =====================
    const page1 = pdfDoc.addPage([612, 792]);
    agregarMembrete(page1);

    // Título
    page1.drawText('OFICIO DE ORDEN DE SUPERVISIÓN', { x: 178, y: 638, size: 12, font: fontBold, color: black });

    // Oficio No.
    page1.drawText(`OFICIO No.: ${datos.oficio_no || ''}`, { x: 320, y: 618, size: 10, font: fontBold, color: black });

    // Asunto
    page1.drawText('ASUNTO: Orden de Supervisión en materia de sanidad y trazabilidad ganadera.', { x: 130, y: 603, size: 10, font: fontNormal, color: black });

    // Fecha
    page1.drawText(`Tepic, Nayarit, a ${dia} de ${mes} de ${anio}`, { x: 250, y: 588, size: 10, font: fontNormal, color: black });

    // Nombre sujeto
    page1.drawText('NOMBRE DEL SUJETO A SUPERVISAR:', { x: 56, y: 570, size: 10, font: fontBold, color: black });
    page1.drawText(datos.nombre_psg || '', { x: 270, y: 570, size: 10, font: fontNormal, color: black });

    // Calidad del sujeto
    page1.drawText('CALIDAD DEL SUJETO:', { x: 56, y: 554, size: 10, font: fontBold, color: black });

    const opciones = [
        'Prestador de Servicios Ganaderos (PSG)',
        'Instalación para ferias, exposiciones o espectáculos',
        'Unidad de Sacrificio Animal',
        'Punto de Verificación e Inspección Interna (PVI) o Punto Itinerante (ITI)',
        'Centro Expendedor de Guías de Movilización',
        'Inspector Auxiliar',
    ];

    let yOpc = 540;
    opciones.forEach(opc => {
        const marcado = datos.calidad_sujeto === opc ? '[X]' : '[ ]';
        page1.drawText(`${marcado} ${opc}`, { x: 56, y: yOpc, size: 9.5, font: fontNormal, color: black });
        yOpc -= 14;
    });

    // Otro
    page1.drawText(`[ ] Otro: ${datos.calidad_sujeto && !opciones.includes(datos.calidad_sujeto) ? datos.calidad_sujeto : ''}`, {
        x: 56, y: yOpc, size: 9.5, font: fontNormal, color: black
    });

    yOpc -= 16;
    // Domicilio
    page1.drawText(`DOMICILIO / UBICACIÓN: ${datos.domicilio || ''}`, { x: 56, y: yOpc, size: 10, font: fontBold, color: black });

    yOpc -= 16;
    // Línea separadora
    page1.drawLine({ start: { x: 56, y: yOpc }, end: { x: 556, y: yOpc }, thickness: 0.8, color: black });

    yOpc -= 14;
    // Título ORDEN
    page1.drawText('ORDEN DE SUPERVISIÓN', { x: 56, y: yOpc, size: 10, font: fontBold, color: black });

    yOpc -= 14;
    // Texto legal párrafo 1
    const textoLegal1 = [
        'Con fundamento en lo dispuesto en el Artículo 38, fracciones IX y XXI, de la Ley Orgánica del Poder',
        'Ejecutivo del Estado de Nayarit; 159, fracciones IV, V, VI y IX, de la Ley Ganadera y de Desarrollo',
        'Pecuario para el Estado de Nayarit; 1, 20 y 21 del Reglamento de la Ley Ganadera y de Desarrollo',
        'Pecuario para el Estado de Nayarit; Artículos Primero, Vigésimo, Vigésimo Primero, Vigésimo Tercero',
        'y Transitorio Segundo del Acuerdo Administrativo que Establece los Requisitos para la Movilización de',
        'Ganado Bovino dentro y hacia el Estado de Nayarit, Derivado de las Campañas contra la Tuberculosis',
        'y Brucelosis Bovina; así como en el Convenio de Coordinación para realizar acciones de verificación e',
        'inspección vinculadas al control de la movilización agropecuaria, acuícola y pesquera, celebrado entre',
        'la Secretaría de Agricultura y Desarrollo Rural y el Gobierno del Estado de Nayarit, particularmente en',
        'su apartado II, numeral II.3, y demás disposiciones aplicables en materia de sanidad animal,',
        'movilización pecuaria y trazabilidad, se ordena la práctica de una supervisión al sujeto antes señalado,',
        'conforme a lo siguiente:',
    ];

    textoLegal1.forEach(linea => {
        page1.drawText(linea, { x: 56, y: yOpc, size: 9.5, font: fontNormal, color: black });
        yOpc -= 13;
    });

    yOpc -= 4;
    page1.drawText('I. OBJETO DE LA SUPERVISIÓN', { x: 56, y: yOpc, size: 10, font: fontBold, color: black });
    yOpc -= 13;

    const textoObjeto = [
        'Verificar el cumplimiento de las disposiciones aplicables en materia de sanidad, origen y trazabilidad',
        'ganadera, así como la correcta ejecución de las actividades que correspondan al sujeto supervisado,',
        'de conformidad con lo establecido en el Manual de Procedimientos para Supervisiones y Control',
        'Zoosanitario de la Secretaría de Desarrollo Rural y sus Organismos Auxiliares.',
    ];
    textoObjeto.forEach(linea => {
        page1.drawText(linea, { x: 56, y: yOpc, size: 9.5, font: fontNormal, color: black });
        yOpc -= 13;
    });

    yOpc -= 4;
    page1.drawText('II. ALCANCE DE LA SUPERVISIÓN', { x: 56, y: yOpc, size: 10, font: fontBold, color: black });
    yOpc -= 13;

    const textoAlcance = [
        'La supervisión comprenderá, de manera enunciativa mas no limitativa, la revisión de la',
        'documentación administrativa y sanitaria aplicable, los registros de operación y control que',
    ];
    textoAlcance.forEach(linea => {
        page1.drawText(linea, { x: 56, y: yOpc, size: 9.5, font: fontNormal, color: black });
        yOpc -= 13;
    });

    // =====================
    // PÁGINA 2
    // =====================
    const page2 = pdfDoc.addPage([612, 792]);
    agregarMembrete(page2);

    let y2 = 638;

    const textoAlcance2 = [
        'correspondan, así como la verificación de las condiciones observables relacionadas con la sanidad y la',
        'trazabilidad pecuaria, y el cumplimiento de los procedimientos establecidos en el presente Manual.',
    ];
    textoAlcance2.forEach(linea => {
        page2.drawText(linea, { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
        y2 -= 13;
    });

    y2 -= 4;
    page2.drawText('III. PERSONAL COMISIONADO', { x: 56, y: y2, size: 10, font: fontBold, color: black });
    y2 -= 13;

    page2.drawText(
        `Para la ejecución de la presente Orden de Supervisión, se designa al siguiente personal: ${datos.nombre_pc || ''}`,
        { x: 56, y: y2, size: 9.5, font: fontNormal, color: black }
    );
    y2 -= 13;
    page2.drawText(
        `Cargo: ${datos.cargo_pc || ''}, Adscripción: ${datos.adscripcion || ''} El personal`,
        { x: 56, y: y2, size: 9.5, font: fontNormal, color: black }
    );
    y2 -= 13;
    page2.drawText(
        'comisionado deberá identificarse debidamente al inicio de la diligencia y actuar conforme a la normativa aplicable.',
        { x: 56, y: y2, size: 9.5, font: fontNormal, color: black }
    );

    y2 -= 17;
    page2.drawText('IV. DISPOSICIONES GENERALES', { x: 56, y: y2, size: 10, font: fontBold, color: black });
    y2 -= 13;

    const textoDisp = [
        'La presente Orden de Supervisión no tiene carácter sancionador, y su finalidad es verificar,',
        'documentar y, en su caso, formular observaciones o recomendaciones, sin perjuicio de las acciones',
        'administrativas que, en su momento, pudieran derivarse conforme a la normativa aplicable. El sujeto',
        'supervisado deberá permitir el acceso y proporcionar la información necesaria para el desarrollo de la',
        'supervisión, en términos de la legislación vigente.',
        'Sin otro particular, se expide la presente Orden de Supervisión para los efectos legales y',
        'administrativos conducentes.',
    ];
    textoDisp.forEach(linea => {
        page2.drawText(linea, { x: 56, y: y2, size: 9.5, font: fontNormal, color: black });
        y2 -= 13;
    });

    y2 -= 20;
    page2.drawText('ATENTAMENTE', { x: 56, y: y2, size: 10, font: fontBold, color: black });

    y2 -= 35;
    page2.drawText(datos.nombre_ordena || '', { x: 56, y: y2, size: 10, font: fontBold, color: black });
    y2 -= 14;
    page2.drawText('SECRETARÍA DE DESARROLLO RURAL', { x: 56, y: y2, size: 10, font: fontBold, color: black });
    y2 -= 14;
    page2.drawText('GOBIERNO DEL ESTADO DE NAYARIT', { x: 56, y: y2, size: 10, font: fontBold, color: black });

    // Descargar
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Orden_Supervision_${(datos.oficio_no || 'SEIOT').replace(/\//g, '_')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
};
