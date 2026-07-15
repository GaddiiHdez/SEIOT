SET search_path TO public;

ALTER TABLE public.excel_psg ADD CONSTRAINT excel_psg_psg_key UNIQUE (psg);

CREATE SEQUENCE public.documentos_firmados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.modulo1_oficio_notificacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.modulo2_orden_supervision_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.modulo3_checklist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.modulo3_lista_verificacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.modulo4_acta_hechos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.modulo5_acta_supervision_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.modulo6_acta_circunstanciada_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.visitas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE public.visitas (
    id integer NOT NULL,
    folio character varying(60) NOT NULL,
    psg character varying(50),
    supervisor character varying(200),
    fecha_inicio timestamp without time zone DEFAULT now(),
    modulo1_completado boolean DEFAULT false,
    modulo2_completado boolean DEFAULT false,
    modulo3_completado boolean DEFAULT false,
    modulo4_completado boolean DEFAULT false,
    modulo5_completado boolean DEFAULT false,
    modulo6_completado boolean DEFAULT false,
    estado_visita character varying(50) DEFAULT 'en_proceso'::character varying,
    capturista_id integer,
    supervisor_id integer
);

CREATE TABLE public.documentos_firmados (
    id integer NOT NULL,
    visita_id integer,
    modulo integer NOT NULL,
    nombre_archivo character varying(255) NOT NULL,
    ruta_archivo text NOT NULL,
    fecha_subida timestamp without time zone DEFAULT now(),
    CONSTRAINT documentos_firmados_modulo_check CHECK (((modulo >= 1) AND (modulo <= 6)))
);

CREATE TABLE public.modulo1_oficio_notificacion (
    id integer NOT NULL,
    visita_id integer,
    fecha_emision date,
    localidad character varying(100),
    municipio character varying(100),
    estado character varying(100),
    nombre_psg character varying(200),
    domicilio character varying(300),
    nombre_servidor character varying(200),
    cargo_servidor character varying(200)
);

CREATE TABLE public.modulo2_orden_supervision (
    id integer NOT NULL,
    visita_id integer,
    fecha date,
    nombre_psg character varying(200),
    domicilio character varying(300),
    calidad_sujeto character varying(100),
    nombre_pc character varying(200),
    cargo_pc character varying(200),
    adscripcion character varying(200),
    tipo_identificacion character varying(100),
    folio_identificacion character varying(100),
    nombre_ordena character varying(200)
);

CREATE TABLE public.modulo3_checklist (
    id integer NOT NULL,
    visita_id integer,
    pregunta_id integer,
    respuesta character varying(2),
    observacion text,
    creado_en timestamp without time zone DEFAULT now(),
    modificado_en timestamp without time zone DEFAULT now()
);

CREATE TABLE public.modulo3_lista_verificacion (
    id integer NOT NULL,
    visita_id integer,
    nombre_psg character varying(200),
    tipo_psg character varying(100),
    nombre_titular character varying(200),
    telefono character varying(20),
    municipio character varying(100),
    localidad character varying(100),
    latitud numeric(10,7),
    longitud numeric(10,7),
    capacidad_instalada integer,
    nombre_supervisor character varying(200),
    fecha date,
    hora_inicio time without time zone,
    hora_termino time without time zone,
    p13 character varying(2),
    p14 character varying(2),
    p15 character varying(2),
    p16 character varying(2),
    p17 character varying(2),
    p18 character varying(2),
    p19 character varying(2),
    p20 character varying(2),
    p21 character varying(2),
    p22 character varying(2),
    p23 character varying(2),
    p24 character varying(2),
    p25 character varying(2),
    p26 character varying(2),
    p27 character varying(2),
    p28 character varying(2),
    p29 character varying(2),
    p30 character varying(2),
    p31 character varying(2),
    p32 character varying(2),
    p33 character varying(2),
    p34 character varying(2),
    p35 character varying(2),
    p36 character varying(2),
    p37 character varying(2),
    p38 character varying(2),
    p39 character varying(2),
    p40 character varying(2),
    p41 character varying(2),
    p42 character varying(2),
    p43 character varying(2),
    p44 character varying(2),
    p45 character varying(2),
    p46 character varying(2),
    p47 character varying(2),
    p48 character varying(2),
    p49 character varying(2),
    p50 character varying(2),
    p51 character varying(2),
    p52 character varying(2),
    p53 character varying(2),
    p54 character varying(2),
    p55 character varying(2),
    p56 character varying(2),
    p57 character varying(2),
    p58 character varying(2),
    p59 character varying(2),
    p60 character varying(2),
    p61 character varying(2),
    p62 character varying(2),
    observaciones text,
    cumple boolean,
    presenta_observaciones boolean,
    requiere_seguimiento boolean,
    responsable_psg character varying(200),
    responsable_supervisor character varying(200),
    nombre_testigo character varying(200),
    domicilio_testigo character varying(300),
    tipo_id_testigo character varying(100),
    numero_id_testigo character varying(100)
);

CREATE TABLE public.modulo4_acta_hechos (
    id integer NOT NULL,
    visita_id integer,
    acta_no character varying(100),
    fecha date,
    hora time without time zone,
    hora_inicio time without time zone,
    hora_termino time without time zone,
    hechos_observados text,
    no_realizo_manifestaciones boolean,
    manifestaciones text,
    localidad character varying(100),
    municipio character varying(100),
    nombre_psg character varying(200),
    tipo_psg character varying(100),
    nombre_titular character varying(200),
    domicilio character varying(300),
    telefono character varying(20),
    nombre_supervisor character varying(200),
    nombre_testigo character varying(200),
    domicilio_testigo character varying(300),
    tipo_id_testigo character varying(100),
    numero_id_testigo character varying(100),
    nombre_testigo_cierre character varying(200)
);

CREATE TABLE public.modulo5_acta_supervision (
    id integer NOT NULL,
    visita_id integer,
    acta_no character varying(100),
    fecha date,
    hora time without time zone,
    hora_inicio time without time zone,
    hora_termino time without time zone,
    acta_hechos boolean,
    otros_documentos text,
    cumple boolean,
    presenta_observaciones boolean,
    requiere_seguimiento boolean,
    observaciones_detectadas text,
    medidas_preventivas text,
    no_realizo_manifestaciones boolean,
    manifestaciones text,
    localidad character varying(100),
    municipio character varying(100),
    nombre_psg character varying(200),
    tipo_psg character varying(100),
    nombre_titular character varying(200),
    domicilio character varying(300),
    telefono character varying(20),
    nombre_supervisor character varying(200),
    nombre_testigo character varying(200),
    domicilio_testigo character varying(300),
    tipo_id_testigo character varying(100),
    numero_id_testigo character varying(100)
);

CREATE TABLE public.modulo6_acta_circunstanciada (
    id integer NOT NULL,
    visita_id integer,
    acta_no character varying(100),
    fecha date,
    hora time without time zone,
    establecimiento character varying(200),
    clave_psg character varying(50),
    ubicacion character varying(300),
    localidad character varying(100),
    municipio character varying(100),
    estado character varying(100),
    nombre_oficial character varying(200),
    nombre_responsable character varying(200),
    tipo_id_responsable character varying(100),
    numero_id_responsable character varying(100),
    id_expedida_por character varying(200),
    fecha_expedicion_id date,
    ubicacion_compareciente character varying(300),
    credencial_oficial_no character varying(100),
    nombre_testigo1 character varying(200),
    domicilio_testigo1 character varying(300),
    tipo_id_testigo1 character varying(100),
    numero_id_testigo1 character varying(100),
    nombre_testigo2 character varying(200),
    domicilio_testigo2 character varying(300),
    tipo_id_testigo2 character varying(100),
    numero_id_testigo2 character varying(100),
    oficio_comision character varying(100),
    fecha_comision date,
    emite_comision character varying(200),
    hechos_observaciones text,
    articulo1 character varying(100),
    de1 character varying(200),
    articulo2 character varying(100),
    de2 character varying(200),
    articulo3 character varying(100),
    de3 character varying(200),
    articulo4 character varying(100),
    de4 character varying(200),
    manifestaciones text,
    fecha_cierre date,
    hora_cierre time without time zone,
    nombre_testigo_cierre1 character varying(200),
    tipo_id_cierre1 character varying(100),
    numero_id_cierre1 character varying(100),
    nombre_testigo_cierre2 character varying(200),
    tipo_id_cierre2 character varying(100),
    numero_id_cierre2 character varying(100)
);

ALTER TABLE ONLY public.documentos_firmados ALTER COLUMN id SET DEFAULT nextval('public.documentos_firmados_id_seq'::regclass);
ALTER TABLE ONLY public.modulo1_oficio_notificacion ALTER COLUMN id SET DEFAULT nextval('public.modulo1_oficio_notificacion_id_seq'::regclass);
ALTER TABLE ONLY public.modulo2_orden_supervision ALTER COLUMN id SET DEFAULT nextval('public.modulo2_orden_supervision_id_seq'::regclass);
ALTER TABLE ONLY public.modulo3_checklist ALTER COLUMN id SET DEFAULT nextval('public.modulo3_checklist_id_seq'::regclass);
ALTER TABLE ONLY public.modulo3_lista_verificacion ALTER COLUMN id SET DEFAULT nextval('public.modulo3_lista_verificacion_id_seq'::regclass);
ALTER TABLE ONLY public.modulo4_acta_hechos ALTER COLUMN id SET DEFAULT nextval('public.modulo4_acta_hechos_id_seq'::regclass);
ALTER TABLE ONLY public.modulo5_acta_supervision ALTER COLUMN id SET DEFAULT nextval('public.modulo5_acta_supervision_id_seq'::regclass);
ALTER TABLE ONLY public.modulo6_acta_circunstanciada ALTER COLUMN id SET DEFAULT nextval('public.modulo6_acta_circunstanciada_id_seq'::regclass);
ALTER TABLE ONLY public.visitas ALTER COLUMN id SET DEFAULT nextval('public.visitas_id_seq'::regclass);

ALTER TABLE ONLY public.documentos_firmados
    ADD CONSTRAINT documentos_firmados_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.documentos_firmados
    ADD CONSTRAINT documentos_firmados_visita_id_modulo_key UNIQUE (visita_id, modulo);

ALTER TABLE ONLY public.modulo1_oficio_notificacion
    ADD CONSTRAINT modulo1_oficio_notificacion_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.modulo1_oficio_notificacion
    ADD CONSTRAINT modulo1_visita_id_key UNIQUE (visita_id);

ALTER TABLE ONLY public.modulo2_orden_supervision
    ADD CONSTRAINT modulo2_orden_supervision_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.modulo2_orden_supervision
    ADD CONSTRAINT modulo2_visita_id_key UNIQUE (visita_id);

ALTER TABLE ONLY public.modulo3_checklist
    ADD CONSTRAINT modulo3_checklist_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.modulo3_checklist
    ADD CONSTRAINT modulo3_checklist_visita_id_pregunta_id_key UNIQUE (visita_id, pregunta_id);

ALTER TABLE ONLY public.modulo3_lista_verificacion
    ADD CONSTRAINT modulo3_lista_verificacion_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.modulo3_lista_verificacion
    ADD CONSTRAINT modulo3_lista_visita_id_key UNIQUE (visita_id);

ALTER TABLE ONLY public.modulo4_acta_hechos
    ADD CONSTRAINT modulo4_acta_hechos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.modulo4_acta_hechos
    ADD CONSTRAINT modulo4_visita_id_key UNIQUE (visita_id);

ALTER TABLE ONLY public.modulo5_acta_supervision
    ADD CONSTRAINT modulo5_acta_supervision_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.modulo5_acta_supervision
    ADD CONSTRAINT modulo5_visita_id_key UNIQUE (visita_id);

ALTER TABLE ONLY public.modulo6_acta_circunstanciada
    ADD CONSTRAINT modulo6_acta_circunstanciada_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.modulo6_acta_circunstanciada
    ADD CONSTRAINT modulo6_visita_id_key UNIQUE (visita_id);

ALTER TABLE ONLY public.visitas
    ADD CONSTRAINT visitas_folio_key UNIQUE (folio);

ALTER TABLE ONLY public.visitas
    ADD CONSTRAINT visitas_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.documentos_firmados
    ADD CONSTRAINT documentos_firmados_visita_id_fkey FOREIGN KEY (visita_id) REFERENCES public.visitas(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.modulo1_oficio_notificacion
    ADD CONSTRAINT modulo1_oficio_notificacion_visita_id_fkey FOREIGN KEY (visita_id) REFERENCES public.visitas(id);

ALTER TABLE ONLY public.modulo2_orden_supervision
    ADD CONSTRAINT modulo2_orden_supervision_visita_id_fkey FOREIGN KEY (visita_id) REFERENCES public.visitas(id);

ALTER TABLE ONLY public.modulo3_checklist
    ADD CONSTRAINT modulo3_checklist_visita_id_fkey FOREIGN KEY (visita_id) REFERENCES public.visitas(id);

ALTER TABLE ONLY public.modulo3_lista_verificacion
    ADD CONSTRAINT modulo3_lista_verificacion_visita_id_fkey FOREIGN KEY (visita_id) REFERENCES public.visitas(id);

ALTER TABLE ONLY public.modulo4_acta_hechos
    ADD CONSTRAINT modulo4_acta_hechos_visita_id_fkey FOREIGN KEY (visita_id) REFERENCES public.visitas(id);

ALTER TABLE ONLY public.modulo5_acta_supervision
    ADD CONSTRAINT modulo5_acta_supervision_visita_id_fkey FOREIGN KEY (visita_id) REFERENCES public.visitas(id);

ALTER TABLE ONLY public.modulo6_acta_circunstanciada
    ADD CONSTRAINT modulo6_acta_circunstanciada_visita_id_fkey FOREIGN KEY (visita_id) REFERENCES public.visitas(id);

ALTER TABLE ONLY public.visitas
    ADD CONSTRAINT visitas_capturista_id_fkey FOREIGN KEY (capturista_id) REFERENCES public.usuarios(id);

ALTER TABLE ONLY public.visitas
    ADD CONSTRAINT visitas_psg_fkey FOREIGN KEY (psg) REFERENCES public.excel_psg(psg);

ALTER TABLE ONLY public.visitas
    ADD CONSTRAINT visitas_supervisor_id_fkey FOREIGN KEY (supervisor_id) REFERENCES public.usuarios(id);

