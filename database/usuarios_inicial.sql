--
-- PostgreSQL database dump
--

-- Dumped from database version 17.0
-- Dumped by pg_dump version 17.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, nombre, usuario, password_hash, activo, es_admin, modulo1, modulo2, modulo3, modulo4, modulo5, modulo6, ver_visitas_otros, editar_campos, eliminar_documentos, descargar_pdfs, panel_admin, rol, creado_en, modificado_en, superadmin) FROM stdin;
1	Administrador	admin	$2b$10$R0eFxGpH3IvoizYaR1SYKuTIMYbPbqlpWFALT43143Zwg6uXriIPm	t	t	t	t	t	t	t	t	t	t	t	t	t	admin	2026-06-14 04:24:21.2127	2026-06-14 04:24:21.2127	t
4	vista	vista	$2b$10$J./FLcaKyDIRcjeY7nIpMOJZ5iPUysN7CyImz/SU5OAVSa1CmNnaW	t	f	f	f	f	f	f	f	t	f	f	t	f	vista	2026-06-14 07:28:19.161771	2026-06-14 07:28:19.161771	f
5	prueba2	prueba2	$2b$10$G/OE77bNkH2eN8LkOE1Ye.pnQ1tK3n/IVPqpzIZmnMQf6BtViwXQS	t	f	t	t	t	t	t	f	f	f	f	t	f	capturista	2026-06-14 18:58:12.454579	2026-06-14 21:08:15.43203	f
2	prueba	prueba	$2b$10$CconCUDa.fDoy1nLWIqjmOXJtMWLphUL6atFZyqJD7VqVMEsirl7y	t	f	t	t	t	t	t	f	f	f	f	t	f	capturista	2026-06-14 05:08:10.683461	2026-06-14 21:08:21.280219	f
3	supervisor	supervisor	$2b$10$WbtyZlHgABEQqEjr9yF0C.Wa31.eHVu0VgS.9zqno7LtzsBol3qEe	t	f	t	t	t	t	t	t	t	f	f	t	f	supervisor	2026-06-14 07:26:55.324622	2026-06-14 21:09:16.441762	f
\.


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 5, true);


--
-- PostgreSQL database dump complete
--

