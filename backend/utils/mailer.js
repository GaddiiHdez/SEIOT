import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { registrarAuditLog } from './auditoria.js';

export const INSTANCIAS_SEGUIMIENTO = {
    seder_juridico: {
        id: 'seder_juridico',
        etiqueta: 'Dirección Jurídica de la SEDER',
        titular: 'Lic. Carlos Esteban Henson Reyes',
        cargo: 'Director Jurídico',
        correo: 'rural.direccionjuridica@nayarit.gob.mx',
        telefono: '311 141 8084',
        usuario: 'juridico.seder',
        passInicial: 'SederJuridico2026!'
    },
    cefppenay: {
        id: 'cefppenay',
        etiqueta: 'CEFPPENAY',
        titular: 'M.V.Z. Ricardo Álvarez Hernández',
        cargo: 'Gerente',
        correo: 'gerencia.comitenay@gmail.com',
        telefono: '449 137 1260',
        usuario: 'cefp.penay',
        passInicial: 'CefpPenay2026!'
    },
    senasica: {
        id: 'senasica',
        etiqueta: 'SENASICA',
        titular: 'M.V.Z. Zaida Elizabeth García Alonso',
        cargo: 'Responsable de Campañas Zoosanitarias en Nayarit',
        correo: 'zaida.garcia@senasica.gob.mx',
        telefono: '311 150 2194',
        usuario: 'senasica.nayarit',
        passInicial: 'Senasica2026!'
    }
};

/**
 * Genera un token único y criptográfico para el enlace de seguimiento
 */
export const generarTokenSeguimiento = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Crea el transportador de correo con nodemailer o retorna null si faltan credenciales
 */
const crearTransportador = () => {
    const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT, SMTP_SECURE } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        return null;
    }
    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT || '587', 10),
        secure: SMTP_SECURE === 'true',
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        }
    });
};

/**
 * Genera el cuerpo del correo en Texto Plano oficial y en HTML institucional
 */
export const generarCuerpoCorreo = ({
    datosPsg = {},
    fechaSupervision = '',
    supervisor = '',
    instanciasSeleccionadas = [],
    observaciones = '',
    instanciaDestinataria = null,
    enlaceSeguimiento = '',
    urlLogin = ''
}) => {
    const psgClave = datosPsg.psg || datosPsg.clave_psg || 'N/D';
    const nombreTitular = datosPsg.nombre_titular || datosPsg.titular || datosPsg.representante || 'N/D';
    const municipio = datosPsg.municipio || 'N/D';
    const motivo = observaciones?.trim() || 'Sin observaciones adicionales registradas.';

    const nombresInstancias = instanciasSeleccionadas
        .map(id => INSTANCIAS_SEGUIMIENTO[id]?.etiqueta || id)
        .join(' / ');

    const textoPlano = `A quien corresponda:
Por medio del presente, el Sistema Estatal de Información de Origen y Trazabilidad (SEIOT) informa que, como resultado de la supervisión realizada a la PSG que se detalla a continuación, se determinó que requiere seguimiento:

PSG: ${psgClave}
Nombre o razón social: ${nombreTitular}
Municipio: ${municipio}
Fecha de supervisión: ${fechaSupervision}
Supervisor: ${supervisor}
Instancias seleccionadas para seguimiento: ${nombresInstancias}
Motivo u observaciones: ${motivo}

Se solicita a las instancias señaladas revisar la información, realizar las acciones que correspondan conforme a sus atribuciones y registrar en el SEIOT el seguimiento y, en su caso, la atención brindada.

Para consultar el expediente y las observaciones de la supervisión, ingrese al siguiente enlace:
${enlaceSeguimiento}

--------------------------------------------------
ACCESO PERMANENTE AL PORTAL SEIOT:
Portal web: ${urlLogin}
Usuario asignado: ${instanciaDestinataria?.usuario || 'Consulte con el administrador'}
Contraseña inicial: ${instanciaDestinataria?.passInicial || '********'}
--------------------------------------------------

Este correo fue generado automáticamente por el SEIOT. Favor de no responder a esta dirección.`;

    const textoHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alerta de Seguimiento SEIOT</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #2d3748;">
    <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07); border: 1px solid #e2e8f0;">
        <!-- Encabezado Institucional -->
        <div style="background: linear-gradient(135deg, #691C32 0%, #4A1222 100%); padding: 24px; text-align: center; border-bottom: 4px solid #BC955B;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 0.5px; text-transform: uppercase;">
                Secretaría de Desarrollo Rural
            </h1>
            <p style="color: #BC955B; margin: 6px 0 0 0; font-size: 13px; font-weight: bold; letter-spacing: 1px;">
                SEIOT — Sistema Estatal de Información de Origen y Trazabilidad
            </p>
        </div>

        <!-- Alerta Badge -->
        <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px 20px; margin: 20px 24px 0 24px;">
            <p style="margin: 0; color: #92400E; font-size: 14px; font-weight: bold;">
                ⚠️ AVISO OFICIAL: SUPERVISIÓN PECUARIA REQUIERE SEGUIMIENTO
            </p>
        </div>

        <!-- Contenido Principal -->
        <div style="padding: 24px;">
            <p style="font-size: 15px; line-height: 1.6; margin-top: 0;">
                <strong>A quien corresponda:</strong>
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #4a5568;">
                Por medio del presente, el Sistema Estatal de Información de Origen y Trazabilidad (SEIOT) informa que, como resultado de la supervisión realizada a la PSG que se detalla a continuación, se determinó que <strong>requiere seguimiento</strong>:
            </p>

            <!-- Ficha Técnica -->
            <table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 13px;">
                <tbody>
                    <tr style="background-color: #f8fafc;">
                        <td style="padding: 8px 12px; font-weight: bold; color: #4a5568; width: 35%; border: 1px solid #e2e8f0;">Clave PSG:</td>
                        <td style="padding: 8px 12px; color: #1a202c; font-weight: bold; border: 1px solid #e2e8f0;">${psgClave}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 12px; font-weight: bold; color: #4a5568; border: 1px solid #e2e8f0;">Nombre o razón social:</td>
                        <td style="padding: 8px 12px; color: #1a202c; border: 1px solid #e2e8f0;">${nombreTitular}</td>
                    </tr>
                    <tr style="background-color: #f8fafc;">
                        <td style="padding: 8px 12px; font-weight: bold; color: #4a5568; border: 1px solid #e2e8f0;">Municipio:</td>
                        <td style="padding: 8px 12px; color: #1a202c; border: 1px solid #e2e8f0;">${municipio}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 12px; font-weight: bold; color: #4a5568; border: 1px solid #e2e8f0;">Fecha de supervisión:</td>
                        <td style="padding: 8px 12px; color: #1a202c; border: 1px solid #e2e8f0;">${fechaSupervision}</td>
                    </tr>
                    <tr style="background-color: #f8fafc;">
                        <td style="padding: 8px 12px; font-weight: bold; color: #4a5568; border: 1px solid #e2e8f0;">Supervisor oficial:</td>
                        <td style="padding: 8px 12px; color: #1a202c; border: 1px solid #e2e8f0;">${supervisor}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 12px; font-weight: bold; color: #4a5568; border: 1px solid #e2e8f0;">Instancias seleccionadas:</td>
                        <td style="padding: 8px 12px; color: #691C32; font-weight: bold; border: 1px solid #e2e8f0;">${nombresInstancias}</td>
                    </tr>
                </tbody>
            </table>

            <!-- Motivo u Observaciones -->
            <div style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 6px; padding: 14px; margin: 18px 0;">
                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: bold; color: #B45309; text-transform: uppercase;">
                    Motivo u Observaciones Registradas:
                </p>
                <p style="margin: 0; font-size: 13px; color: #78350F; line-height: 1.5; white-space: pre-wrap;">${motivo}</p>
            </div>

            <p style="font-size: 13px; line-height: 1.6; color: #4a5568;">
                Se solicita a las instancias señaladas revisar la información, realizar las acciones que correspondan conforme a sus atribuciones y registrar en el SEIOT el seguimiento y, en su caso, la atención brindada.
            </p>

            <!-- Botón Acceso Directo -->
            <div style="text-align: center; margin: 28px 0;">
                <a href="${enlaceSeguimiento}" style="display: inline-block; background-color: #691C32; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; font-size: 14px; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(105, 28, 50, 0.3);">
                    Consultar Expediente y Registrar Seguimiento &rarr;
                </a>
                <p style="margin: 8px 0 0 0; font-size: 11px; color: #718096;">
                    Acceso directo sin contraseña asignado a ${instanciaDestinataria?.titular || 'la dependencia'}.
                </p>
            </div>

            <!-- Credenciales fijas a largo plazo -->
            <div style="border-top: 1px dashed #cbd5e0; padding-top: 16px; margin-top: 24px; background-color: #f8fafc; border-radius: 6px; padding: 14px;">
                <h4 style="margin: 0 0 8px 0; font-size: 12px; color: #4a5568; text-transform: uppercase;">
                    Acceso Permanente al Portal SEIOT (Historial y Consultas):
                </h4>
                <p style="margin: 4px 0; font-size: 12px; color: #2d3748;">
                    <strong>Portal:</strong> <a href="${urlLogin}" style="color: #3182ce;">${urlLogin}</a><br>
                    <strong>Usuario:</strong> <code>${instanciaDestinataria?.usuario || 'N/A'}</code><br>
                    <strong>Contraseña inicial:</strong> <code>${instanciaDestinataria?.passInicial || '********'}</code>
                </p>
            </div>
        </div>

        <!-- Pie de Página -->
        <div style="background-color: #edf2f7; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #718096;">
            <p style="margin: 0;">Este correo fue generado automáticamente por el SEIOT. Favor de no responder a esta dirección.</p>
            <p style="margin: 4px 0 0 0;">Gobierno del Estado de Nayarit — Secretaría de Desarrollo Rural</p>
        </div>
    </div>
</body>
</html>`;

    return { textoPlano, textoHtml };
};

/**
 * Envía las notificaciones por correo a las instancias seleccionadas
 */
export const enviarNotificacionesSeguimiento = async ({
    visitaId,
    folio = '',
    datosPsg = {},
    supervisor = '',
    fecha = '',
    observaciones = '',
    instanciasSeleccionadas = [],
    tokenSeguimiento = '',
    usuarioEmisor = {}
}) => {
    const frontendUrl = process.env.FRONTEND_URL || 'https://seiot.vercel.app';
    const enlaceSeguimiento = `${frontendUrl}/seguimiento?token=${tokenSeguimiento}`;
    const urlLogin = `${frontendUrl}/login`;

    const transporter = crearTransportador();
    const remitente = process.env.SMTP_FROM || 'SEIOT - Notificaciones <no-reply@nayarit.gob.mx>';

    const resultados = [];

    for (const instanciaId of instanciasSeleccionadas) {
        const infoInstancia = INSTANCIAS_SEGUIMIENTO[instanciaId];
        if (!infoInstancia) continue;

        const { textoPlano, textoHtml } = generarCuerpoCorreo({
            datosPsg,
            fechaSupervision: fecha,
            supervisor,
            instanciasSeleccionadas,
            observaciones,
            instanciaDestinataria: infoInstancia,
            enlaceSeguimiento,
            urlLogin
        });

        const asunto = `[SEIOT - ALERTA DE SEGUIMIENTO] Supervisión PSG: ${datosPsg.psg || folio}`;

        if (!transporter) {
            // Modo simulación (desarrollo o sin SMTP aún)
            console.log(`\n======================================================`);
            console.log(`📧 [MODO SIMULACIÓN / LOG] Notificación de Seguimiento para: ${infoInstancia.etiqueta} (${infoInstancia.correo})`);
            console.log(`Asunto: ${asunto}`);
            console.log(`Enlace: ${enlaceSeguimiento}`);
            console.log(`------------------------------------------------------`);
            console.log(textoPlano);
            console.log(`======================================================\n`);

            resultados.push({
                instancia: infoInstancia.etiqueta,
                correo: infoInstancia.correo,
                estado: 'simulado'
            });
        } else {
            try {
                await transporter.sendMail({
                    from: remitente,
                    to: infoInstancia.correo,
                    subject: asunto,
                    text: textoPlano,
                    html: textoHtml
                });
                resultados.push({
                    instancia: infoInstancia.etiqueta,
                    correo: infoInstancia.correo,
                    estado: 'enviado'
                });
            } catch (mailError) {
                console.error(`❌ Error enviando correo a ${infoInstancia.correo}:`, mailError);
                resultados.push({
                    instancia: infoInstancia.etiqueta,
                    correo: infoInstancia.correo,
                    estado: 'error',
                    detalle: mailError.message
                });
            }
        }

        // Registrar en bitácora de auditoría
        await registrarAuditLog({
            usuarioId: usuarioEmisor?.id || null,
            usuarioNombre: usuarioEmisor?.nombre || 'Sistema SEIOT',
            usuarioUsername: usuarioEmisor?.usuario || 'sistema',
            accion: 'NOTIFICACION_SEGUIMIENTO',
            tablaAfectada: 'modulo3_lista_verificacion',
            registroId: String(visitaId),
            detalles: {
                folio,
                psg: datosPsg.psg,
                destinatario_instancia: infoInstancia.etiqueta,
                destinatario_correo: infoInstancia.correo,
                token_seguimiento: tokenSeguimiento
            }
        });
    }

    return resultados;
};
