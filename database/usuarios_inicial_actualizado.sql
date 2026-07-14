--
-- SEIOT - Usuario inicial superadmin
-- Contraseña: admin123 (cambiar inmediatamente en producción)
--

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

COPY public.usuarios (id, nombre, usuario, password_hash, activo, es_admin, modulo1, modulo2, modulo3, modulo4, modulo5, modulo6, ver_visitas_otros, editar_campos, eliminar_documentos, descargar_pdfs, panel_admin, rol, creado_en, modificado_en, superadmin, modulo6_pagina4, consultas) FROM stdin;
1	Administrador	admin	$2b$10$R0eFxGpH3IvoizYaR1SYKuTIMYbPbqlpWFALT43143Zwg6uXriIPm	t	t	t	t	t	t	t	t	t	t	t	t	t	admin	2026-06-14 04:24:21.2127	2026-06-14 04:24:21.2127	t	t	t
\.

SELECT pg_catalog.setval('public.usuarios_id_seq', 1, true);
