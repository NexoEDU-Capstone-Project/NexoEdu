--
-- schema.sql
-- Sistema de Seguimiento de Estudiantes y Egresados
-- Generado a partir de un pg_dump real (2026-07-15), limpiado de metadata
-- (OIDs, owners, TOC) y con las siguientes correcciones aplicadas:
--
--   1. Se eliminó el UNIQUE accidental en campaigns.title (una campaña no
--      debe tener nombre único a nivel global; distintas instituciones
--      pueden querer usar el mismo título de campaña).
--   2. vw_institutions_complete: JOIN -> LEFT JOIN en credentials/user_roles,
--      porque una institución puede no tener administrador asignado todavía
--      (institutions.credential_id es nullable).
--   3. vw_students_complete: JOIN -> LEFT JOIN en credentials/user_roles y en
--      grades, porque un estudiante puede no tener credencial creada aún, y
--      un egresado no tiene grade_id (grade_id es nullable en student_profiles).
--      Sin este fix, esos estudiantes/egresados desaparecían de la vista.
--   4. vw_campaign_enrollments: JOIN -> LEFT JOIN en grades, mismo motivo:
--      un egresado inscrito en una campaña no tiene grade_id.
--   5. vw_campaigns_complete: JOIN -> LEFT JOIN en credentials/user_roles,
--      porque campaigns.created_by_credentials_id tiene ON DELETE SET NULL
--      (si se elimina el admin creador, la campaña no debe desaparecer del
--      reporte).
--   6. vw_credential_info: se agregó la columna credential_id (c.id). El
--      backend la necesita para incluir credential_id en el JWT y poder
--      validar quién creó cada campaña (campaigns.created_by_credentials_id)
--      sin hacer una consulta extra en cada petición.
--

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- ============================================================
-- TABLAS
-- ============================================================
CREATE TABLE public.campaign_criteria (
    id integer NOT NULL,
    campaign_id integer NOT NULL,
    gender_id integer,
    min_age smallint,
    max_age smallint,
    grade_id integer,
    status_id integer,
    CONSTRAINT chk_campaign_age_range CHECK (((min_age IS NULL) OR (max_age IS NULL) OR (min_age <= max_age)))
);

CREATE TABLE public.campaign_enrollments (
    id integer NOT NULL,
    campaign_id integer NOT NULL,
    student_profile_id integer NOT NULL,
    enrolled_at timestamp with time zone NOT NULL
);

CREATE TABLE public.campaign_scope (
    id integer NOT NULL,
    scope_type character varying(50) NOT NULL,
    campaign_id integer NOT NULL,
    institution_id integer,
    neighborhood_id integer,
    localities_id integer,
    CONSTRAINT chk_campaign_scope_type CHECK (((scope_type)::text = ANY (ARRAY[('LOCALITY'::character varying)::text, ('NEIGHBORHOOD'::character varying)::text, ('INSTITUTION'::character varying)::text, ('GLOBAL'::character varying)::text]))),
    CONSTRAINT chk_campaign_scope_values CHECK (((((scope_type)::text = 'LOCALITY'::text) AND (localities_id IS NOT NULL) AND (neighborhood_id IS NULL) AND (institution_id IS NULL)) OR (((scope_type)::text = 'NEIGHBORHOOD'::text) AND (neighborhood_id IS NOT NULL) AND (localities_id IS NULL) AND (institution_id IS NULL)) OR (((scope_type)::text = 'INSTITUTION'::text) AND (institution_id IS NOT NULL) AND (localities_id IS NULL) AND (neighborhood_id IS NULL)) OR ((scope_type)::text = 'GLOBAL'::text)))
);

CREATE TABLE public.campaigns (
    id integer NOT NULL,
    title character varying(150) NOT NULL,
    type character varying(100),
    description text,
    sponsor character varying(150),
    created_by_credentials_id integer,
    start_date date NOT NULL,
    end_date date,
    url_multimedia text,
    CONSTRAINT chk_campaign_dates CHECK (((end_date IS NULL) OR (end_date >= start_date)))
);

CREATE TABLE public.credentials (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    role_id integer NOT NULL
);

CREATE TABLE public.document_types (
    id integer NOT NULL,
    abbreviation character varying(5) NOT NULL,
    name character varying(50) NOT NULL
);

CREATE TABLE public.genders (
    id integer NOT NULL,
    name character varying(50) NOT NULL
);

CREATE TABLE public.grades (
    id integer NOT NULL,
    grade character varying(50) NOT NULL
);

CREATE TABLE public.institutions (
    id integer NOT NULL,
    institution_name character varying(150) NOT NULL,
    director character varying(150) NOT NULL,
    address character varying(150),
    neighborhood_id integer NOT NULL,
    credential_id integer,
    dane_code character varying(50) NOT NULL,
    logo_url character varying(500),
    banner_url character varying(500)
);

CREATE TABLE public.localities (
    id integer NOT NULL,
    name character varying(100) NOT NULL
);

CREATE TABLE public.neighborhoods (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    locality_id integer NOT NULL
);

CREATE TABLE public.people (
    id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    gender_id integer NOT NULL,
    birth_date date NOT NULL,
    email character varying(150) NOT NULL,
    phone character varying(20),
    document_type_id integer NOT NULL,
    document_number character varying(30) NOT NULL,
    address character varying(150),
    neighborhood_id integer NOT NULL,
    credential_id integer
);

CREATE TABLE public.personal_contacts (
    id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    phone character varying(20) NOT NULL,
    people_id integer NOT NULL,
    relationship character varying(50) NOT NULL
);

CREATE TABLE public.statuses (
    id integer NOT NULL,
    status character varying(50) NOT NULL
);

CREATE TABLE public.student_profiles (
    id integer NOT NULL,
    people_id integer NOT NULL,
    institution_id integer NOT NULL,
    status_id integer NOT NULL,
    grade_id integer,
    start_date date NOT NULL,
    end_date date,
    CONSTRAINT chk_student_dates CHECK (((end_date IS NULL) OR (end_date >= start_date)))
);

CREATE TABLE public.updates (
    id integer NOT NULL,
    people_id integer NOT NULL,
    campaign_id integer NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE public.user_roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL
);

-- ============================================================
-- SEQUENCES
-- ============================================================
CREATE SEQUENCE public.campaign_criteria_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.campaign_enrollments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.campaign_scope_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.campaigns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.credentials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.document_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.genders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.grades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.institutions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.localities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.neighborhoods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.people_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.personal_contacts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.statuses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.student_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.updates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.user_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- ============================================================
-- DEFAULTS (nextval)
-- ============================================================
ALTER TABLE ONLY public.campaign_criteria ALTER COLUMN id SET DEFAULT nextval('public.campaign_criteria_id_seq'::regclass);
ALTER TABLE ONLY public.campaign_enrollments ALTER COLUMN id SET DEFAULT nextval('public.campaign_enrollments_id_seq'::regclass);
ALTER TABLE ONLY public.campaign_scope ALTER COLUMN id SET DEFAULT nextval('public.campaign_scope_id_seq'::regclass);
ALTER TABLE ONLY public.campaigns ALTER COLUMN id SET DEFAULT nextval('public.campaigns_id_seq'::regclass);
ALTER TABLE ONLY public.credentials ALTER COLUMN id SET DEFAULT nextval('public.credentials_id_seq'::regclass);
ALTER TABLE ONLY public.document_types ALTER COLUMN id SET DEFAULT nextval('public.document_types_id_seq'::regclass);
ALTER TABLE ONLY public.genders ALTER COLUMN id SET DEFAULT nextval('public.genders_id_seq'::regclass);
ALTER TABLE ONLY public.grades ALTER COLUMN id SET DEFAULT nextval('public.grades_id_seq'::regclass);
ALTER TABLE ONLY public.institutions ALTER COLUMN id SET DEFAULT nextval('public.institutions_id_seq'::regclass);
ALTER TABLE ONLY public.localities ALTER COLUMN id SET DEFAULT nextval('public.localities_id_seq'::regclass);
ALTER TABLE ONLY public.neighborhoods ALTER COLUMN id SET DEFAULT nextval('public.neighborhoods_id_seq'::regclass);
ALTER TABLE ONLY public.people ALTER COLUMN id SET DEFAULT nextval('public.people_id_seq'::regclass);
ALTER TABLE ONLY public.personal_contacts ALTER COLUMN id SET DEFAULT nextval('public.personal_contacts_id_seq'::regclass);
ALTER TABLE ONLY public.statuses ALTER COLUMN id SET DEFAULT nextval('public.statuses_id_seq'::regclass);
ALTER TABLE ONLY public.student_profiles ALTER COLUMN id SET DEFAULT nextval('public.student_profiles_id_seq'::regclass);
ALTER TABLE ONLY public.updates ALTER COLUMN id SET DEFAULT nextval('public.updates_id_seq'::regclass);
ALTER TABLE ONLY public.user_roles ALTER COLUMN id SET DEFAULT nextval('public.user_roles_id_seq'::regclass);

-- ============================================================
-- SEQUENCES OWNED BY
-- ============================================================
ALTER SEQUENCE public.campaign_criteria_id_seq OWNED BY public.campaign_criteria.id;
ALTER SEQUENCE public.campaign_enrollments_id_seq OWNED BY public.campaign_enrollments.id;
ALTER SEQUENCE public.campaign_scope_id_seq OWNED BY public.campaign_scope.id;
ALTER SEQUENCE public.campaigns_id_seq OWNED BY public.campaigns.id;
ALTER SEQUENCE public.credentials_id_seq OWNED BY public.credentials.id;
ALTER SEQUENCE public.document_types_id_seq OWNED BY public.document_types.id;
ALTER SEQUENCE public.genders_id_seq OWNED BY public.genders.id;
ALTER SEQUENCE public.grades_id_seq OWNED BY public.grades.id;
ALTER SEQUENCE public.institutions_id_seq OWNED BY public.institutions.id;
ALTER SEQUENCE public.localities_id_seq OWNED BY public.localities.id;
ALTER SEQUENCE public.neighborhoods_id_seq OWNED BY public.neighborhoods.id;
ALTER SEQUENCE public.people_id_seq OWNED BY public.people.id;
ALTER SEQUENCE public.personal_contacts_id_seq OWNED BY public.personal_contacts.id;
ALTER SEQUENCE public.statuses_id_seq OWNED BY public.statuses.id;
ALTER SEQUENCE public.student_profiles_id_seq OWNED BY public.student_profiles.id;
ALTER SEQUENCE public.updates_id_seq OWNED BY public.updates.id;
ALTER SEQUENCE public.user_roles_id_seq OWNED BY public.user_roles.id;

-- ============================================================
-- PRIMARY KEYS Y UNIQUE CONSTRAINTS
-- ============================================================
ALTER TABLE ONLY public.credentials
    ADD CONSTRAINT credentials_username_key UNIQUE (username);

ALTER TABLE ONLY public.document_types
    ADD CONSTRAINT document_types_abbreviation_key UNIQUE (abbreviation);

ALTER TABLE ONLY public.document_types
    ADD CONSTRAINT document_types_name_key UNIQUE (name);

ALTER TABLE ONLY public.genders
    ADD CONSTRAINT genders_name_key UNIQUE (name);

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_grade_key UNIQUE (grade);

ALTER TABLE ONLY public.institutions
    ADD CONSTRAINT institutions_dane_code_key UNIQUE (dane_code);

ALTER TABLE ONLY public.institutions
    ADD CONSTRAINT institutions_institution_name_key UNIQUE (institution_name);

ALTER TABLE ONLY public.localities
    ADD CONSTRAINT localities_name_key UNIQUE (name);

ALTER TABLE ONLY public.people
    ADD CONSTRAINT people_document_number_key UNIQUE (document_number);

ALTER TABLE ONLY public.people
    ADD CONSTRAINT people_email_key UNIQUE (email);

ALTER TABLE ONLY public.campaign_criteria
    ADD CONSTRAINT pk_campaign_criteria_id PRIMARY KEY (id);

ALTER TABLE ONLY public.campaign_enrollments
    ADD CONSTRAINT pk_campaign_enrollments_id PRIMARY KEY (id);

ALTER TABLE ONLY public.campaign_scope
    ADD CONSTRAINT pk_campaign_scope_id PRIMARY KEY (id);

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT pk_campaigns_id PRIMARY KEY (id);

ALTER TABLE ONLY public.credentials
    ADD CONSTRAINT pk_credentials_id PRIMARY KEY (id);

ALTER TABLE ONLY public.document_types
    ADD CONSTRAINT pk_document_types_id PRIMARY KEY (id);

ALTER TABLE ONLY public.genders
    ADD CONSTRAINT pk_genders_id PRIMARY KEY (id);

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT pk_grades_id PRIMARY KEY (id);

ALTER TABLE ONLY public.institutions
    ADD CONSTRAINT pk_institutions_id PRIMARY KEY (id);

ALTER TABLE ONLY public.localities
    ADD CONSTRAINT pk_localities_id PRIMARY KEY (id);

ALTER TABLE ONLY public.neighborhoods
    ADD CONSTRAINT pk_neighborhoods_id PRIMARY KEY (id);

ALTER TABLE ONLY public.people
    ADD CONSTRAINT pk_people_id PRIMARY KEY (id);

ALTER TABLE ONLY public.personal_contacts
    ADD CONSTRAINT pk_personal_contacts_id PRIMARY KEY (id);

ALTER TABLE ONLY public.statuses
    ADD CONSTRAINT pk_statuses_id PRIMARY KEY (id);

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT pk_student_profiles_id PRIMARY KEY (id);

ALTER TABLE ONLY public.updates
    ADD CONSTRAINT pk_updates_id PRIMARY KEY (id);

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT pk_user_roles_id PRIMARY KEY (id);

ALTER TABLE ONLY public.statuses
    ADD CONSTRAINT statuses_status_key UNIQUE (status);

ALTER TABLE ONLY public.campaign_scope
    ADD CONSTRAINT uq_campaign_scope_institution UNIQUE (campaign_id, institution_id);

ALTER TABLE ONLY public.campaign_scope
    ADD CONSTRAINT uq_campaign_scope_locality UNIQUE (campaign_id, localities_id);

ALTER TABLE ONLY public.campaign_scope
    ADD CONSTRAINT uq_campaign_scope_neighborhood UNIQUE (campaign_id, neighborhood_id);

ALTER TABLE ONLY public.campaign_enrollments
    ADD CONSTRAINT uq_campaign_student_enrollment UNIQUE (campaign_id, student_profile_id);

ALTER TABLE ONLY public.institutions
    ADD CONSTRAINT uq_institutions_credential UNIQUE (credential_id);

ALTER TABLE ONLY public.neighborhoods
    ADD CONSTRAINT uq_neighborhood_name_locality UNIQUE (name, locality_id);

ALTER TABLE ONLY public.people
    ADD CONSTRAINT uq_people_credential UNIQUE (credential_id);

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT uq_student_profile_people UNIQUE (people_id);

ALTER TABLE ONLY public.updates
    ADD CONSTRAINT uq_updates_people_campaign UNIQUE (people_id, campaign_id);

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_name_key UNIQUE (name);

-- ============================================================
-- FOREIGN KEYS
-- ============================================================
ALTER TABLE ONLY public.campaign_criteria
    ADD CONSTRAINT fk_campaign_criteria_campaign FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.campaign_criteria
    ADD CONSTRAINT fk_campaign_criteria_gender FOREIGN KEY (gender_id) REFERENCES public.genders(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY public.campaign_criteria
    ADD CONSTRAINT fk_campaign_criteria_grade FOREIGN KEY (grade_id) REFERENCES public.grades(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY public.campaign_criteria
    ADD CONSTRAINT fk_campaign_criteria_status FOREIGN KEY (status_id) REFERENCES public.statuses(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY public.campaign_enrollments
    ADD CONSTRAINT fk_campaign_enrollments_campaign FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.campaign_enrollments
    ADD CONSTRAINT fk_campaign_enrollments_student_profile FOREIGN KEY (student_profile_id) REFERENCES public.student_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.campaign_scope
    ADD CONSTRAINT fk_campaign_scope_campaign FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.campaign_scope
    ADD CONSTRAINT fk_campaign_scope_institution FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY public.campaign_scope
    ADD CONSTRAINT fk_campaign_scope_locality FOREIGN KEY (localities_id) REFERENCES public.localities(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY public.campaign_scope
    ADD CONSTRAINT fk_campaign_scope_neighborhood FOREIGN KEY (neighborhood_id) REFERENCES public.neighborhoods(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT fk_campaigns_credentials FOREIGN KEY (created_by_credentials_id) REFERENCES public.credentials(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.credentials
    ADD CONSTRAINT fk_credentials_user_role FOREIGN KEY (role_id) REFERENCES public.user_roles(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY public.institutions
    ADD CONSTRAINT fk_institutions_credential FOREIGN KEY (credential_id) REFERENCES public.credentials(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.institutions
    ADD CONSTRAINT fk_institutions_neighborhood FOREIGN KEY (neighborhood_id) REFERENCES public.neighborhoods(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY public.neighborhoods
    ADD CONSTRAINT fk_neighborhood_locality FOREIGN KEY (locality_id) REFERENCES public.localities(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY public.people
    ADD CONSTRAINT fk_people_credential FOREIGN KEY (credential_id) REFERENCES public.credentials(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY public.people
    ADD CONSTRAINT fk_people_document_type FOREIGN KEY (document_type_id) REFERENCES public.document_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY public.people
    ADD CONSTRAINT fk_people_gender FOREIGN KEY (gender_id) REFERENCES public.genders(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY public.people
    ADD CONSTRAINT fk_people_neighborhood FOREIGN KEY (neighborhood_id) REFERENCES public.neighborhoods(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY public.personal_contacts
    ADD CONSTRAINT fk_personal_contacts_people FOREIGN KEY (people_id) REFERENCES public.people(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT fk_student_profiles_grade FOREIGN KEY (grade_id) REFERENCES public.grades(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT fk_student_profiles_institution FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT fk_student_profiles_people FOREIGN KEY (people_id) REFERENCES public.people(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT fk_student_profiles_status FOREIGN KEY (status_id) REFERENCES public.statuses(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY public.updates
    ADD CONSTRAINT fk_updates_campaign FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.updates
    ADD CONSTRAINT fk_updates_people FOREIGN KEY (people_id) REFERENCES public.people(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- ============================================================
-- VISTAS
-- ============================================================
CREATE VIEW public.vw_campaign_enrollments AS
 SELECT c.title AS campaign,
    p.first_name,
    p.last_name,
    p.document_number,
    p.phone,
    i.institution_name,
    g.grade,
    ce.enrolled_at
   FROM (((((public.campaign_enrollments ce
     JOIN public.campaigns c ON ((c.id = ce.campaign_id)))
     JOIN public.student_profiles sp ON ((sp.id = ce.student_profile_id)))
     JOIN public.people p ON ((p.id = sp.people_id)))
     JOIN public.institutions i ON ((i.id = sp.institution_id)))
     LEFT JOIN public.grades g ON ((g.id = sp.grade_id)));

CREATE VIEW public.vw_campaigns_complete AS
 SELECT c.id AS campaign_id,
    c.title AS "nombre_campaña",
    c.type AS "tipo_campaña",
    c.description AS "descripcion_campaña",
    c.sponsor,
    c.start_date,
    c.end_date,
    cr.username AS usuario_creador,
    ur.name AS rol_creador,
    i.institution_name AS institucion_creadora
   FROM (((public.campaigns c
     LEFT JOIN public.credentials cr ON ((cr.id = c.created_by_credentials_id)))
     LEFT JOIN public.user_roles ur ON ((ur.id = cr.role_id)))
     LEFT JOIN public.institutions i ON ((i.credential_id = cr.id)));

CREATE VIEW public.vw_campaigns_criteria AS
 SELECT c.title AS campaign,
    g.name AS gender,
    cc.min_age,
    cc.max_age,
    gr.grade,
    s.status
   FROM ((((public.campaign_criteria cc
     JOIN public.campaigns c ON ((c.id = cc.campaign_id)))
     LEFT JOIN public.genders g ON ((g.id = cc.gender_id)))
     LEFT JOIN public.grades gr ON ((gr.id = cc.grade_id)))
     LEFT JOIN public.statuses s ON ((s.id = cc.status_id)));

CREATE VIEW public.vw_campaigns_scope AS
 SELECT c.title AS campaign,
    cs.scope_type,
    i.institution_name,
    n.name AS neighborhood,
    l.name AS locality
   FROM ((((public.campaign_scope cs
     JOIN public.campaigns c ON ((c.id = cs.campaign_id)))
     LEFT JOIN public.institutions i ON ((i.id = cs.institution_id)))
     LEFT JOIN public.neighborhoods n ON ((n.id = cs.neighborhood_id)))
     LEFT JOIN public.localities l ON ((l.id = cs.localities_id)));

CREATE VIEW public.vw_credential_info AS
 SELECT c.id AS credential_id,
    c.username,
    c.password,
    u.name AS rol
   FROM (public.credentials c
     JOIN public.user_roles u ON ((c.role_id = u.id)));

CREATE VIEW public.vw_institutions_complete AS
 SELECT i.id AS institution_id,
    i.institution_name,
    i.director,
    i.dane_code,
    c.username,
    ur.name AS role,
    n.name AS neighborhood,
    l.name AS locality
   FROM ((((public.institutions i
     LEFT JOIN public.credentials c ON ((c.id = i.credential_id)))
     LEFT JOIN public.user_roles ur ON ((ur.id = c.role_id)))
     JOIN public.neighborhoods n ON ((n.id = i.neighborhood_id)))
     JOIN public.localities l ON ((l.id = n.locality_id)));

CREATE VIEW public.vw_students_complete AS
 SELECT p.id AS people_id,
    p.first_name,
    p.last_name,
    p.email,
    p.phone,
    p.document_number,
    c.username,
    ur.name AS role,
    i.institution_name,
    g.grade,
    s.status,
    n.name AS neighborhood,
    l.name AS locality
   FROM ((((((((public.student_profiles sp
     JOIN public.people p ON ((p.id = sp.people_id)))
     LEFT JOIN public.credentials c ON ((c.id = p.credential_id)))
     LEFT JOIN public.user_roles ur ON ((ur.id = c.role_id)))
     JOIN public.institutions i ON ((i.id = sp.institution_id)))
     LEFT JOIN public.grades g ON ((g.id = sp.grade_id)))
     JOIN public.statuses s ON ((s.id = sp.status_id)))
     JOIN public.neighborhoods n ON ((n.id = p.neighborhood_id)))
     JOIN public.localities l ON ((l.id = n.locality_id)));

CREATE VIEW public.vw_updates_history AS
 SELECT p.first_name,
    p.last_name,
    c.title AS campaign,
    u.updated_at
   FROM ((public.updates u
     JOIN public.people p ON ((p.id = u.people_id)))
     JOIN public.campaigns c ON ((c.id = u.campaign_id)));
