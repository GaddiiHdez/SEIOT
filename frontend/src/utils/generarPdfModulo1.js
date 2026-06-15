import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { LOGO_HEADER, LOGO_FOOTER } from './imagenesMembretes';

export const generarPdfModulo1 = async (datos) => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);

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
    const fecha = datos.fecha_emision ? new Date(datos.fecha_emision) : new Date();
    const dia = fecha.getDate().toString();
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const mes = meses[fecha.getMonth()];
    const anio = fecha.getFullYear().toString();

    // ENCABEZADO
    page.drawImage(headerImg, { x: 0, y: 662, width: 612, height: 130 });

    // PIE DE PÁGINA
    page.drawImage(footerImg, { x: 0, y: 0, width: 612, height: 130 });

    // Texto pie de página
    page.drawText('SECRETARÍA DE DESARROLLO RURAL', {
        x: 220, y: 62, size: 7.5, font: fontBold, color: gray
    });
    page.drawText('Av. Jacarandas No. 371 Sur Colonia El Tecolote C.P. 63135 Tepic, Nayarit.', {
        x: 155, y: 51, size: 7.5, font: fontNormal, color: gray
    });
    page.drawText('311 216 22 63 | 311 216 22 74', {
        x: 228, y: 40, size: 7.5, font: fontNormal, color: gray
    });

    // TÍTULO
    page.drawText('OFICIO DE NOTIFICACIÓN DE SUPERVISIÓN', {
        x: 148, y: 638, size: 11, font: fontBold, color: black
    });

    // Oficio No.
    page.drawText(`OFICIO No.: ${datos.oficio_no || ''}`, {
        x: 348, y: 623, size: 10, font: fontBold, color: black
    });

    // Asunto
    page.drawText('ASUNTO: Notificación de supervisión.', {
        x: 348, y: 608, size: 10, font: fontNormal, color: black
    });

    // Fecha
    page.drawText(`Tepic, Nayarit, a ${dia} de ${mes} de ${anio}.`, {
        x: 300, y: 593, size: 10, font: fontNormal, color: black
    });

    // DATOS DEL PSG
    page.drawText(`PRESTADOR DE SERVICIOS GANADEROS (PSG): ${datos.nombre_psg || ''}`, {
        x: 56, y: 566, size: 10, font: fontBold, color: black
    });

    page.drawText(`DOMICILIO: ${datos.domicilio || ''}`, {
        x: 56, y: 551, size: 10, font: fontBold, color: black
    });

    page.drawText('PRESENTE.', {
        x: 56, y: 533, size: 10, font: fontBold, color: black
    });

    // TEXTO LEGAL
    const parrafos = [
        [
            'Por medio del presente, y con fundamento en lo dispuesto en el Artículo 38, fracciones IX y XXI, de la Ley Orgánica del',
            'Poder Ejecutivo del Estado de Nayarit; 159, fracciones IV, V, VI y IX, de la Ley Ganadera y de Desarrollo Pecuario para',
            'el Estado de Nayarit; 1, 20 y 21 del Reglamento de la Ley Ganadera y de Desarrollo Pecuario para el Estado de Nayarit;',
            'Artículos Primero, Vigésimo, Vigésimo Primero, Vigésimo Tercero y Transitorio Segundo del Acuerdo Administrativo que',
            'Establece los Requisitos para la Movilización de Ganado Bovino dentro y hacia el Estado de Nayarit, Derivado de las',
            'Campañas contra la Tuberculosis y Brucelosis Bovina; así como en el Convenio de Coordinación para realizar acciones de',
            'verificación e inspección vinculadas al control de la movilización agropecuaria, acuícola y pesquera, celebrado entre la',
            'Secretaría de Agricultura y Desarrollo Rural y el Gobierno del Estado de Nayarit, particularmente en su apartado II,',
            'numeral II.3, y demás disposiciones aplicables en materia de sanidad animal, movilización pecuaria y trazabilidad, se le',
            'notifica que esta Secretaría llevará a cabo la supervisión en el establecimiento de su responsabilidad.',
        ],
        [
            'La supervisión tiene por objeto verificar el cumplimiento de las disposiciones aplicables en materia de movilización',
            'pecuaria, sanidad animal y trazabilidad, conforme a los procedimientos establecidos por esta Secretaría.',
        ],
        [
            'Se solicita atentamente brindar las facilidades necesarias para el desarrollo ordenado de la supervisión. La presente',
            'notificación no implica por sí misma la determinación de infracciones ni la imposición de sanciones.',
        ],
        [
            'Sin otro particular, se emite la presente para los efectos administrativos conducentes.',
        ],
    ];

    let y = 516;
    parrafos.forEach(parrafo => {
        parrafo.forEach(linea => {
            page.drawText(linea, { x: 56, y, size: 9.5, font: fontNormal, color: black });
            y -= 13;
        });
        y -= 6;
    });

    // FIRMA
    y -= 15;
    page.drawText('ATENTAMENTE', { x: 56, y, size: 10, font: fontBold, color: black });

    y -= 35;
    page.drawText(datos.nombre_servidor || '', { x: 56, y, size: 10, font: fontBold, color: black });

    y -= 14;
    page.drawText(`Cargo: ${datos.cargo_servidor || ''}`, { x: 56, y, size: 10, font: fontNormal, color: black });

    y -= 14;
    page.drawText('Secretaría de Desarrollo Rural', { x: 56, y, size: 10, font: fontBold, color: black });

    y -= 14;
    page.drawText('Gobierno del Estado de Nayarit', { x: 56, y, size: 10, font: fontBold, color: black });

    // Descargar
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Oficio_Notificacion_${(datos.oficio_no || 'SEIOT').replace(/\//g, '_')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
};
