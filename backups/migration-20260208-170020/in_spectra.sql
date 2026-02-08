--
-- PostgreSQL database dump
--

\restrict qUDYoLxYGAsK5ZXfv88vJ2oYcNSGy1svOFWcFb3ecxvitnuTRxyhTBu3zClcW9B

-- Dumped from database version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: asset_controls; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.asset_controls (
    id text NOT NULL,
    asset_id text NOT NULL,
    control_type_id text NOT NULL,
    start_date timestamp with time zone NOT NULL,
    last_done_at timestamp with time zone,
    next_due_at timestamp with time zone
);


ALTER TABLE public.asset_controls OWNER TO api_user;

--
-- Name: assets; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.assets (
    id text NOT NULL,
    code_interne text NOT NULL,
    designation text NOT NULL,
    categorie text NOT NULL,
    marque text,
    modele text,
    numero_serie text,
    annee integer,
    statut text DEFAULT 'EN_SERVICE'::text NOT NULL,
    criticite integer DEFAULT 3 NOT NULL,
    site_id text NOT NULL,
    zone_id text NOT NULL,
    mise_en_service timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    force_nominale text,
    compteur_type text,
    compteur_valeur integer,
    caracteristiques jsonb,
    dispositifs_protection jsonb,
    vgp_enabled boolean DEFAULT false NOT NULL,
    vgp_validity_months integer
);


ALTER TABLE public.assets OWNER TO api_user;

--
-- Name: attachments; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.attachments (
    id text NOT NULL,
    owner_type text NOT NULL,
    owner_id text NOT NULL,
    file_type text NOT NULL,
    category text NOT NULL,
    title text NOT NULL,
    original_file_name text,
    mime_type text NOT NULL,
    size_bytes integer DEFAULT 0 NOT NULL,
    storage_key text NOT NULL,
    is_private boolean DEFAULT false NOT NULL,
    checksum text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    version_number integer DEFAULT 1 NOT NULL,
    parent_id text,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone NOT NULL,
    updated_by text,
    archived_at timestamp with time zone,
    CONSTRAINT attachments_owner_type_check CHECK ((owner_type = ANY (ARRAY['EQUIPMENT'::text, 'REPORT'::text, 'VGP_REPORT'::text, 'VGP_RUN'::text, 'NONCONFORMITY'::text, 'MISSION'::text])))
);


ALTER TABLE public.attachments OWNER TO api_user;

--
-- Name: checklist_items; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.checklist_items (
    id text NOT NULL,
    template_id text NOT NULL,
    label text NOT NULL,
    field_type text DEFAULT 'BOOL'::text NOT NULL,
    required boolean DEFAULT true NOT NULL,
    help_text text,
    sort_order integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.checklist_items OWNER TO api_user;

--
-- Name: checklist_templates; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.checklist_templates (
    id text NOT NULL,
    control_type_id text NOT NULL,
    asset_category text,
    name text NOT NULL
);


ALTER TABLE public.checklist_templates OWNER TO api_user;

--
-- Name: clients; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.clients (
    id text NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    siret text,
    tva_number text,
    contact_name text,
    contact_email text,
    contact_phone text,
    address text,
    access_instructions text,
    billing_address text,
    billing_email text,
    internal_notes text,
    status text DEFAULT 'ACTIVE'::text NOT NULL
);


ALTER TABLE public.clients OWNER TO api_user;

--
-- Name: company_settings; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.company_settings (
    id integer NOT NULL,
    company_name text DEFAULT ''::text NOT NULL,
    company_logo_url text,
    website_url text,
    address_line1 text,
    address_line2 text,
    postal_code text,
    city text,
    country text,
    phone text,
    email text,
    legal_name text,
    siret text,
    primary_color text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT company_settings_id_check CHECK ((id = 1))
);


ALTER TABLE public.company_settings OWNER TO api_user;

--
-- Name: control_types; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.control_types (
    id text NOT NULL,
    code text NOT NULL,
    label text NOT NULL,
    description text,
    periodicity_days integer NOT NULL,
    active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.control_types OWNER TO api_user;

--
-- Name: corrective_actions; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.corrective_actions (
    id text NOT NULL,
    nonconformity_id text NOT NULL,
    owner text NOT NULL,
    description text,
    due_at timestamp with time zone NOT NULL,
    status text DEFAULT 'OUVERTE'::text NOT NULL,
    closed_at timestamp with time zone,
    validated_by text,
    work_notes text
);


ALTER TABLE public.corrective_actions OWNER TO api_user;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.documents (
    id text NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    local_uri text NOT NULL,
    mime text NOT NULL,
    sha256 text,
    uploaded_at timestamp with time zone NOT NULL,
    synced boolean DEFAULT false NOT NULL,
    server_url text
);


ALTER TABLE public.documents OWNER TO api_user;

--
-- Name: maintenance_logs; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.maintenance_logs (
    id text NOT NULL,
    asset_id text NOT NULL,
    date timestamp with time zone NOT NULL,
    actor text NOT NULL,
    operation_type text NOT NULL,
    description text NOT NULL,
    parts_ref text,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.maintenance_logs OWNER TO api_user;

--
-- Name: mission_assets; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.mission_assets (
    id text NOT NULL,
    mission_id text NOT NULL,
    asset_id text NOT NULL
);


ALTER TABLE public.mission_assets OWNER TO api_user;

--
-- Name: mission_operation_assets; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.mission_operation_assets (
    id integer NOT NULL,
    mission_id character varying(255) NOT NULL,
    operation_type character varying(50) NOT NULL,
    asset_id character varying(255) NOT NULL,
    work_description text,
    checklist_template_id integer,
    checklist_data jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.mission_operation_assets OWNER TO api_user;

--
-- Name: mission_operation_assets_id_seq; Type: SEQUENCE; Schema: public; Owner: api_user
--

CREATE SEQUENCE public.mission_operation_assets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mission_operation_assets_id_seq OWNER TO api_user;

--
-- Name: mission_operation_assets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: api_user
--

ALTER SEQUENCE public.mission_operation_assets_id_seq OWNED BY public.mission_operation_assets.id;


--
-- Name: mission_operations; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.mission_operations (
    id text NOT NULL,
    mission_id text NOT NULL,
    operation_type text NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.mission_operations OWNER TO api_user;

--
-- Name: mission_technicians; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.mission_technicians (
    id text NOT NULL,
    mission_id text NOT NULL,
    technician_id text NOT NULL,
    assigned_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.mission_technicians OWNER TO api_user;

--
-- Name: missions; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.missions (
    id text NOT NULL,
    control_type_id text,
    scheduled_at timestamp with time zone NOT NULL,
    assigned_to text NOT NULL,
    status text DEFAULT 'A_PLANIFIER'::text NOT NULL,
    site_id text NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.missions OWNER TO api_user;

--
-- Name: nonconformities; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.nonconformities (
    id text NOT NULL,
    report_id text,
    asset_id text NOT NULL,
    checklist_item_id text,
    title text NOT NULL,
    description text,
    severity integer DEFAULT 3 NOT NULL,
    status text DEFAULT 'OUVERTE'::text NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.nonconformities OWNER TO api_user;

--
-- Name: operation_checklists; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.operation_checklists (
    id integer NOT NULL,
    operation_type character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    steps jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.operation_checklists OWNER TO api_user;

--
-- Name: operation_checklists_id_seq; Type: SEQUENCE; Schema: public; Owner: api_user
--

CREATE SEQUENCE public.operation_checklists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.operation_checklists_id_seq OWNER TO api_user;

--
-- Name: operation_checklists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: api_user
--

ALTER SEQUENCE public.operation_checklists_id_seq OWNED BY public.operation_checklists.id;


--
-- Name: outbox; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.outbox (
    id text NOT NULL,
    type text NOT NULL,
    payload_json text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    last_error text
);


ALTER TABLE public.outbox OWNER TO api_user;

--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.password_reset_tokens (
    user_id text NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.password_reset_tokens OWNER TO api_user;

--
-- Name: report_item_results; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.report_item_results (
    id text NOT NULL,
    report_id text NOT NULL,
    checklist_item_id text NOT NULL,
    status text NOT NULL,
    value_num double precision,
    value_text text,
    comment text
);


ALTER TABLE public.report_item_results OWNER TO api_user;

--
-- Name: reports; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.reports (
    id text NOT NULL,
    mission_id text NOT NULL,
    asset_id text NOT NULL,
    performed_at timestamp with time zone NOT NULL,
    performer text NOT NULL,
    conclusion text NOT NULL,
    summary text,
    signed_by_name text,
    signed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.reports OWNER TO api_user;

--
-- Name: sites; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.sites (
    id text NOT NULL,
    client_id text NOT NULL,
    name text NOT NULL,
    address text,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.sites OWNER TO api_user;

--
-- Name: user_business_card; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.user_business_card (
    user_id text NOT NULL,
    first_name text,
    last_name text,
    job_title text,
    photo_url text,
    email text,
    phone text,
    is_email_public boolean DEFAULT false NOT NULL,
    is_phone_public boolean DEFAULT false NOT NULL,
    public_token text,
    public_enabled boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_business_card OWNER TO api_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    token_mock text,
    created_at timestamp with time zone NOT NULL,
    password_hash text,
    must_change_password boolean DEFAULT false NOT NULL,
    password_updated_at timestamp with time zone,
    can_be_responsible boolean DEFAULT false NOT NULL
);


ALTER TABLE public.users OWNER TO api_user;

--
-- Name: vgp_inspection_runs; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.vgp_inspection_runs (
    id text NOT NULL,
    report_id text NOT NULL,
    template_id text NOT NULL,
    asset_id text NOT NULL,
    date_inspection timestamp with time zone NOT NULL,
    verificateur text NOT NULL,
    compteur_type text,
    compteur_valeur integer,
    conditions_intervention text,
    modes_fonctionnement text,
    moyens_disposition boolean DEFAULT true,
    conclusion text DEFAULT 'EN_COURS'::text NOT NULL,
    particularites text,
    statut text DEFAULT 'BROUILLON'::text NOT NULL,
    signed_by text,
    signed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.vgp_inspection_runs OWNER TO api_user;

--
-- Name: vgp_item_results; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.vgp_item_results (
    id text NOT NULL,
    run_id text NOT NULL,
    item_id text NOT NULL,
    result text DEFAULT 'NA'::text NOT NULL,
    comment text,
    photos jsonb,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.vgp_item_results OWNER TO api_user;

--
-- Name: vgp_observations; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.vgp_observations (
    id text NOT NULL,
    run_id text NOT NULL,
    asset_id text NOT NULL,
    item_id text,
    item_numero integer,
    description text NOT NULL,
    recommandation text,
    gravite integer DEFAULT 3,
    statut text DEFAULT 'OUVERTE'::text NOT NULL,
    is_auto boolean DEFAULT false NOT NULL,
    pieces_jointes jsonb,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.vgp_observations OWNER TO api_user;

--
-- Name: vgp_reports; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.vgp_reports (
    id text NOT NULL,
    client_id text NOT NULL,
    site_id text NOT NULL,
    numero_rapport text NOT NULL,
    date_rapport timestamp with time zone NOT NULL,
    signataire text NOT NULL,
    synthese text,
    has_observations boolean DEFAULT false NOT NULL,
    pdf_path text,
    pdf_url text,
    metadata jsonb,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.vgp_reports OWNER TO api_user;

--
-- Name: vgp_template_items; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.vgp_template_items (
    id text NOT NULL,
    section_id text NOT NULL,
    numero integer NOT NULL,
    label text NOT NULL,
    help_text text,
    sort_order integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.vgp_template_items OWNER TO api_user;

--
-- Name: vgp_template_sections; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.vgp_template_sections (
    id text NOT NULL,
    template_id text NOT NULL,
    code text NOT NULL,
    title text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.vgp_template_sections OWNER TO api_user;

--
-- Name: vgp_templates; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.vgp_templates (
    id text NOT NULL,
    name text NOT NULL,
    machine_type text DEFAULT 'PRESS'::text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    referentiel text,
    metadata jsonb,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.vgp_templates OWNER TO api_user;

--
-- Name: zones; Type: TABLE; Schema: public; Owner: api_user
--

CREATE TABLE public.zones (
    id text NOT NULL,
    site_id text NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.zones OWNER TO api_user;

--
-- Name: mission_operation_assets id; Type: DEFAULT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.mission_operation_assets ALTER COLUMN id SET DEFAULT nextval('public.mission_operation_assets_id_seq'::regclass);


--
-- Name: operation_checklists id; Type: DEFAULT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.operation_checklists ALTER COLUMN id SET DEFAULT nextval('public.operation_checklists_id_seq'::regclass);


--
-- Data for Name: asset_controls; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.asset_controls (id, asset_id, control_type_id, start_date, last_done_at, next_due_at) FROM stdin;
ac_plieuse_vgp	asset_plieuse	ctl_vgp_press	2024-01-10 00:00:00+00	2025-01-12 00:00:00+00	2026-01-12 00:00:00+00
ac_injection_vgp	asset_injection	ctl_vgp_press	2024-02-05 00:00:00+00	2025-02-08 00:00:00+00	2026-02-08 00:00:00+00
ac_chariot_vgp	asset_chariot	ctl_vgp_chariot	2024-03-01 00:00:00+00	2025-03-04 00:00:00+00	2026-03-04 00:00:00+00
ac_plieuse_prev	asset_plieuse	ctl_prev_maint	2024-07-01 00:00:00+00	2025-01-05 00:00:00+00	2025-07-05 00:00:00+00
ac_injection_prev	asset_injection	ctl_prev_maint	2024-07-15 00:00:00+00	2025-01-18 00:00:00+00	2025-07-18 00:00:00+00
ac_asset_auto_  1_vgp_press	asset_auto_  1	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 46_vgp_press	asset_auto_ 46	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 62_vgp_press	asset_auto_ 62	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 77_vgp_press	asset_auto_ 77	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 32_vgp_press	asset_auto_ 32	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 27_vgp_press	asset_auto_ 27	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 82_vgp_press	asset_auto_ 82	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 87_vgp_press	asset_auto_ 87	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 57_vgp_press	asset_auto_ 57	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 67_vgp_press	asset_auto_ 67	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 66_vgp_press	asset_auto_ 66	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 36_vgp_press	asset_auto_ 36	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 22_vgp_press	asset_auto_ 22	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_  2_vgp_press	asset_auto_  2	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_  7_vgp_press	asset_auto_  7	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 26_vgp_press	asset_auto_ 26	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 81_vgp_press	asset_auto_ 81	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 37_vgp_press	asset_auto_ 37	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 71_vgp_press	asset_auto_ 71	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 61_vgp_press	asset_auto_ 61	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 12_vgp_press	asset_auto_ 12	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 92_vgp_press	asset_auto_ 92	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 31_vgp_press	asset_auto_ 31	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 41_vgp_press	asset_auto_ 41	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 51_vgp_press	asset_auto_ 51	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_  6_vgp_press	asset_auto_  6	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 86_vgp_press	asset_auto_ 86	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 72_vgp_press	asset_auto_ 72	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 21_vgp_press	asset_auto_ 21	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 91_vgp_press	asset_auto_ 91	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 11_vgp_press	asset_auto_ 11	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 16_vgp_press	asset_auto_ 16	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 56_vgp_press	asset_auto_ 56	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 42_vgp_press	asset_auto_ 42	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 47_vgp_press	asset_auto_ 47	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 52_vgp_press	asset_auto_ 52	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 97_vgp_press	asset_auto_ 97	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 96_vgp_press	asset_auto_ 96	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 17_vgp_press	asset_auto_ 17	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 76_vgp_press	asset_auto_ 76	ctl_vgp_press	2026-01-25 18:19:06.557975+00	\N	2027-01-25 18:19:06.557975+00
ac_asset_auto_ 78_vgp_chariot	asset_auto_ 78	ctl_vgp_chariot	2026-01-25 18:19:06.560846+00	\N	2027-01-25 18:19:06.560846+00
ac_asset_auto_ 93_vgp_chariot	asset_auto_ 93	ctl_vgp_chariot	2026-01-25 18:19:06.560846+00	\N	2027-01-25 18:19:06.560846+00
ac_asset_auto_ 88_vgp_chariot	asset_auto_ 88	ctl_vgp_chariot	2026-01-25 18:19:06.560846+00	\N	2027-01-25 18:19:06.560846+00
ac_asset_auto_ 63_vgp_chariot	asset_auto_ 63	ctl_vgp_chariot	2026-01-25 18:19:06.560846+00	\N	2027-01-25 18:19:06.560846+00
ac_asset_auto_ 13_vgp_chariot	asset_auto_ 13	ctl_vgp_chariot	2026-01-25 18:19:06.560846+00	\N	2027-01-25 18:19:06.560846+00
ac_asset_auto_ 48_vgp_chariot	asset_auto_ 48	ctl_vgp_chariot	2026-01-25 18:19:06.560846+00	\N	2027-01-25 18:19:06.560846+00
ac_asset_auto_ 58_vgp_chariot	asset_auto_ 58	ctl_vgp_chariot	2026-01-25 18:19:06.560846+00	\N	2027-01-25 18:19:06.560846+00
ac_asset_auto_ 53_vgp_chariot	asset_auto_ 53	ctl_vgp_chariot	2026-01-25 18:19:06.560846+00	\N	2027-01-25 18:19:06.560846+00
ac_asset_auto_ 68_vgp_chariot	asset_auto_ 68	ctl_vgp_chariot	2026-01-25 18:19:06.560846+00	\N	2027-01-25 18:19:06.560846+00
ac_asset_auto_ 23_vgp_chariot	asset_auto_ 23	ctl_vgp_chariot	2026-01-25 18:19:06.560846+00	\N	2027-01-25 18:19:06.560846+00
ac_asset_auto_ 28_vgp_chariot	asset_auto_ 28	ctl_vgp_chariot	2026-01-25 18:19:06.560846+00	\N	2027-01-25 18:19:06.560846+00
ac_asset_auto_ 73_vgp_chariot	asset_auto_ 73	ctl_vgp_chariot	2026-01-25 18:19:06.560846+00	\N	2027-01-25 18:19:06.560846+00
ac_asset_auto_ 33_vgp_chariot	asset_auto_ 33	ctl_vgp_chariot	2026-01-25 18:19:06.560846+00	\N	2027-01-25 18:19:06.560846+00
ac_asset_auto_ 83_vgp_chariot	asset_auto_ 83	ctl_vgp_chariot	2026-01-25 18:19:06.560846+00	\N	2027-01-25 18:19:06.560846+00
ac_asset_auto_ 43_vgp_chariot	asset_auto_ 43	ctl_vgp_chariot	2026-01-25 18:19:06.560846+00	\N	2027-01-25 18:19:06.560846+00
ac_asset_auto_ 18_vgp_chariot	asset_auto_ 18	ctl_vgp_chariot	2026-01-25 18:19:06.560846+00	\N	2027-01-25 18:19:06.560846+00
ac_asset_auto_  3_vgp_chariot	asset_auto_  3	ctl_vgp_chariot	2026-01-25 18:19:06.560846+00	\N	2027-01-25 18:19:06.560846+00
ac_asset_auto_ 98_vgp_chariot	asset_auto_ 98	ctl_vgp_chariot	2026-01-25 18:19:06.560846+00	\N	2027-01-25 18:19:06.560846+00
ac_asset_auto_  8_vgp_chariot	asset_auto_  8	ctl_vgp_chariot	2026-01-25 18:19:06.560846+00	\N	2027-01-25 18:19:06.560846+00
ac_asset_auto_ 38_vgp_chariot	asset_auto_ 38	ctl_vgp_chariot	2026-01-25 18:19:06.560846+00	\N	2027-01-25 18:19:06.560846+00
ac_asset_auto_ 44_prev	asset_auto_ 44	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_  4_prev	asset_auto_  4	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_  1_prev	asset_auto_  1	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 74_prev	asset_auto_ 74	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 78_prev	asset_auto_ 78	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 55_prev	asset_auto_ 55	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 25_prev	asset_auto_ 25	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 46_prev	asset_auto_ 46	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 93_prev	asset_auto_ 93	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 10_prev	asset_auto_ 10	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 62_prev	asset_auto_ 62	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 89_prev	asset_auto_ 89	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 77_prev	asset_auto_ 77	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 79_prev	asset_auto_ 79	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 32_prev	asset_auto_ 32	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_  5_prev	asset_auto_  5	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 84_prev	asset_auto_ 84	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 34_prev	asset_auto_ 34	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 69_prev	asset_auto_ 69	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 90_prev	asset_auto_ 90	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 27_prev	asset_auto_ 27	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 82_prev	asset_auto_ 82	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 30_prev	asset_auto_ 30	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 88_prev	asset_auto_ 88	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 63_prev	asset_auto_ 63	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 39_prev	asset_auto_ 39	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 87_prev	asset_auto_ 87	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 59_prev	asset_auto_ 59	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 57_prev	asset_auto_ 57	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 20_prev	asset_auto_ 20	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 13_prev	asset_auto_ 13	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 48_prev	asset_auto_ 48	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 80_prev	asset_auto_ 80	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_chariot_prev	asset_chariot	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 67_prev	asset_auto_ 67	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 66_prev	asset_auto_ 66	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 14_prev	asset_auto_ 14	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 75_prev	asset_auto_ 75	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 36_prev	asset_auto_ 36	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 22_prev	asset_auto_ 22	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_  2_prev	asset_auto_  2	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 99_prev	asset_auto_ 99	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 49_prev	asset_auto_ 49	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_  7_prev	asset_auto_  7	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_100_prev	asset_auto_100	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 26_prev	asset_auto_ 26	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 70_prev	asset_auto_ 70	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 24_prev	asset_auto_ 24	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 81_prev	asset_auto_ 81	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 37_prev	asset_auto_ 37	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 58_prev	asset_auto_ 58	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 71_prev	asset_auto_ 71	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 60_prev	asset_auto_ 60	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 61_prev	asset_auto_ 61	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 12_prev	asset_auto_ 12	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 92_prev	asset_auto_ 92	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 31_prev	asset_auto_ 31	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 54_prev	asset_auto_ 54	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 53_prev	asset_auto_ 53	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 41_prev	asset_auto_ 41	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 51_prev	asset_auto_ 51	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_  6_prev	asset_auto_  6	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 86_prev	asset_auto_ 86	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 72_prev	asset_auto_ 72	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 15_prev	asset_auto_ 15	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 68_prev	asset_auto_ 68	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 21_prev	asset_auto_ 21	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 95_prev	asset_auto_ 95	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 23_prev	asset_auto_ 23	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 64_prev	asset_auto_ 64	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 91_prev	asset_auto_ 91	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 50_prev	asset_auto_ 50	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 45_prev	asset_auto_ 45	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 29_prev	asset_auto_ 29	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 28_prev	asset_auto_ 28	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 11_prev	asset_auto_ 11	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 94_prev	asset_auto_ 94	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 73_prev	asset_auto_ 73	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 33_prev	asset_auto_ 33	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 83_prev	asset_auto_ 83	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 43_prev	asset_auto_ 43	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 18_prev	asset_auto_ 18	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 16_prev	asset_auto_ 16	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_  3_prev	asset_auto_  3	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 56_prev	asset_auto_ 56	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 19_prev	asset_auto_ 19	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_  9_prev	asset_auto_  9	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 42_prev	asset_auto_ 42	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 98_prev	asset_auto_ 98	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 47_prev	asset_auto_ 47	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 85_prev	asset_auto_ 85	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 52_prev	asset_auto_ 52	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 97_prev	asset_auto_ 97	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_  8_prev	asset_auto_  8	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 96_prev	asset_auto_ 96	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 65_prev	asset_auto_ 65	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 17_prev	asset_auto_ 17	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 35_prev	asset_auto_ 35	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 38_prev	asset_auto_ 38	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 40_prev	asset_auto_ 40	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
ac_asset_auto_ 76_prev	asset_auto_ 76	ctl_prev_maint	2026-01-25 18:19:06.561759+00	\N	2026-07-24 18:19:06.561759+00
\.


--
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.assets (id, code_interne, designation, categorie, marque, modele, numero_serie, annee, statut, criticite, site_id, zone_id, mise_en_service, created_at, force_nominale, compteur_type, compteur_valeur, caracteristiques, dispositifs_protection, vgp_enabled, vgp_validity_months) FROM stdin;
asset_auto_  5	AUTO-  5	Pont roulant KONECRANES CXT 10 - 10T portée 15m	PONT_ROULANT	KONECRANES	CXT 10	KON-CXT10-2019-005	2019	EN_SERVICE	3	site_auto_ 5	zone_auto_ 1	2025-08-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 10	AUTO- 10	Pont roulant Demag EKDR 5 - 5T portée 12m	PONT_ROULANT	Demag	EKDR 5	DEM-EKDR5-2024-010	2024	EN_SERVICE	2	site_po_sigmaringen	zone_press	2025-03-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_  3	AUTO-  3	Chariot élévateur électrique Toyota 8FBEKT16 - 1.6T	CHARIOT_ELEVATEUR	Toyota	8FBEKT16	TYT-8FB-2017-003	2017	EN_SERVICE	4	site_valeo_angers	zone_auto_ 1	2025-10-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	t	6
asset_auto_  2	AUTO-  2	Presse injection Engel e-victory 310/110 - 110T	PRESSE_INJECTION	Engel	e-victory 310/110	ENG-EV310-2016-002	2016	EN_SERVICE	3	site_arkema_lacq	zone_press	2025-11-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	t	6
asset_auto_ 11	AUTO- 11	Equip PRESSE_PLIEUSE #11	PRESSE_PLIEUSE	GenBrand	Model-11	SN-11	2015	EN_SERVICE	3	site_psa_sochaux	zone_auto_ 1	2025-02-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 13	AUTO- 13	Equip CHARIOT_ELEVATEUR #13	CHARIOT_ELEVATEUR	GenBrand	Model-13	SN-13	2017	EN_SERVICE	2	site_auto_ 1	zone_auto_ 1	2024-12-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 14	AUTO- 14	Equip COMPRESSEUR #14	COMPRESSEUR	GenBrand	Model-14	SN-14	2018	EN_SERVICE	3	site_auto_ 7	zone_press	2024-11-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 15	AUTO- 15	Equip PONT_ROULANT #15	PONT_ROULANT	GenBrand	Model-15	SN-15	2019	EN_SERVICE	4	site_se_carros	zone_auto_ 1	2024-10-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 16	AUTO- 16	Equip PRESSE_PLIEUSE #16	PRESSE_PLIEUSE	GenBrand	Model-16	SN-16	2020	EN_SERVICE	2	site_safran_colomiers	zone_press	2024-09-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 17	AUTO- 17	Equip PRESSE_INJECTION #17	PRESSE_INJECTION	GenBrand	Model-17	SN-17	2021	EN_SERVICE	3	site_po_compiegne	zone_auto_ 1	2024-08-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 18	AUTO- 18	Equip CHARIOT_ELEVATEUR #18	CHARIOT_ELEVATEUR	GenBrand	Model-18	SN-18	2022	EN_SERVICE	4	site_michelin_troyes	zone_press	2024-07-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 19	AUTO- 19	Equip COMPRESSEUR #19	COMPRESSEUR	GenBrand	Model-19	SN-19	2023	EN_SERVICE	2	site_rt_venissieux	zone_auto_ 1	2024-06-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 20	AUTO- 20	Equip PONT_ROULANT #20	PONT_ROULANT	GenBrand	Model-20	SN-20	2024	EN_SERVICE	3	site_angers	zone_press	2024-05-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 21	AUTO- 21	Equip PRESSE_PLIEUSE #21	PRESSE_PLIEUSE	GenBrand	Model-21	SN-21	2015	EN_SERVICE	4	site_michelin_ladoux	zone_auto_ 1	2024-04-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 22	AUTO- 22	Equip PRESSE_INJECTION #22	PRESSE_INJECTION	GenBrand	Model-22	SN-22	2016	EN_SERVICE	2	site_arkema_lacq	zone_press	2024-03-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 23	AUTO- 23	Equip CHARIOT_ELEVATEUR #23	CHARIOT_ELEVATEUR	GenBrand	Model-23	SN-23	2017	EN_SERVICE	3	site_valeo_angers	zone_auto_ 1	2024-02-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 24	AUTO- 24	Equip COMPRESSEUR #24	COMPRESSEUR	GenBrand	Model-24	SN-24	2018	EN_SERVICE	4	site_auto_ 6	zone_press	2024-01-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 25	AUTO- 25	Equip PONT_ROULANT #25	PONT_ROULANT	GenBrand	Model-25	SN-25	2019	EN_SERVICE	2	site_auto_ 5	zone_auto_ 1	2023-12-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 26	AUTO- 26	Equip PRESSE_PLIEUSE #26	PRESSE_PLIEUSE	GenBrand	Model-26	SN-26	2020	EN_SERVICE	3	site_psa_rennes	zone_press	2023-11-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 27	AUTO- 27	Equip PRESSE_INJECTION #27	PRESSE_INJECTION	GenBrand	Model-27	SN-27	2021	EN_SERVICE	4	site_auto_ 2	zone_auto_ 1	2023-10-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 28	AUTO- 28	Equip CHARIOT_ELEVATEUR #28	CHARIOT_ELEVATEUR	GenBrand	Model-28	SN-28	2022	EN_SERVICE	2	site_auto_ 4	zone_press	2023-09-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 29	AUTO- 29	Equip COMPRESSEUR #29	COMPRESSEUR	GenBrand	Model-29	SN-29	2023	EN_SERVICE	3	site_auto_ 8	zone_auto_ 1	2023-08-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 30	AUTO- 30	Equip PONT_ROULANT #30	PONT_ROULANT	GenBrand	Model-30	SN-30	2024	EN_SERVICE	4	site_po_sigmaringen	zone_press	2023-07-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 31	AUTO- 31	Equip PRESSE_PLIEUSE #31	PRESSE_PLIEUSE	GenBrand	Model-31	SN-31	2015	EN_SERVICE	2	site_psa_sochaux	zone_auto_ 1	2023-06-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 32	AUTO- 32	Equip PRESSE_INJECTION #32	PRESSE_INJECTION	GenBrand	Model-32	SN-32	2016	EN_SERVICE	3	site_auto_ 3	zone_press	2023-05-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 33	AUTO- 33	Equip CHARIOT_ELEVATEUR #33	CHARIOT_ELEVATEUR	GenBrand	Model-33	SN-33	2017	EN_SERVICE	4	site_auto_ 1	zone_auto_ 1	2023-04-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 34	AUTO- 34	Equip COMPRESSEUR #34	COMPRESSEUR	GenBrand	Model-34	SN-34	2018	EN_SERVICE	2	site_auto_ 7	zone_press	2023-03-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 35	AUTO- 35	Equip PONT_ROULANT #35	PONT_ROULANT	GenBrand	Model-35	SN-35	2019	EN_SERVICE	3	site_se_carros	zone_auto_ 1	2023-02-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 36	AUTO- 36	Equip PRESSE_PLIEUSE #36	PRESSE_PLIEUSE	GenBrand	Model-36	SN-36	2020	EN_SERVICE	4	site_safran_colomiers	zone_press	2026-01-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 37	AUTO- 37	Equip PRESSE_INJECTION #37	PRESSE_INJECTION	GenBrand	Model-37	SN-37	2021	EN_SERVICE	2	site_po_compiegne	zone_auto_ 1	2025-12-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 38	AUTO- 38	Equip CHARIOT_ELEVATEUR #38	CHARIOT_ELEVATEUR	GenBrand	Model-38	SN-38	2022	EN_SERVICE	3	site_michelin_troyes	zone_press	2025-11-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 39	AUTO- 39	Equip COMPRESSEUR #39	COMPRESSEUR	GenBrand	Model-39	SN-39	2023	EN_SERVICE	4	site_rt_venissieux	zone_auto_ 1	2025-10-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 40	AUTO- 40	Equip PONT_ROULANT #40	PONT_ROULANT	GenBrand	Model-40	SN-40	2024	EN_SERVICE	2	site_angers	zone_press	2025-09-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 41	AUTO- 41	Equip PRESSE_PLIEUSE #41	PRESSE_PLIEUSE	GenBrand	Model-41	SN-41	2015	EN_SERVICE	3	site_michelin_ladoux	zone_auto_ 1	2025-08-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 42	AUTO- 42	Equip PRESSE_INJECTION #42	PRESSE_INJECTION	GenBrand	Model-42	SN-42	2016	EN_SERVICE	4	site_arkema_lacq	zone_press	2025-07-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 43	AUTO- 43	Equip CHARIOT_ELEVATEUR #43	CHARIOT_ELEVATEUR	GenBrand	Model-43	SN-43	2017	EN_SERVICE	2	site_valeo_angers	zone_auto_ 1	2025-06-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 44	AUTO- 44	Equip COMPRESSEUR #44	COMPRESSEUR	GenBrand	Model-44	SN-44	2018	EN_SERVICE	3	site_auto_ 6	zone_press	2025-05-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 45	AUTO- 45	Equip PONT_ROULANT #45	PONT_ROULANT	GenBrand	Model-45	SN-45	2019	EN_SERVICE	4	site_auto_ 5	zone_auto_ 1	2025-04-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 46	AUTO- 46	Equip PRESSE_PLIEUSE #46	PRESSE_PLIEUSE	GenBrand	Model-46	SN-46	2020	EN_SERVICE	2	site_psa_rennes	zone_press	2025-03-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 47	AUTO- 47	Equip PRESSE_INJECTION #47	PRESSE_INJECTION	GenBrand	Model-47	SN-47	2021	EN_SERVICE	3	site_auto_ 2	zone_auto_ 1	2025-02-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 48	AUTO- 48	Equip CHARIOT_ELEVATEUR #48	CHARIOT_ELEVATEUR	GenBrand	Model-48	SN-48	2022	EN_SERVICE	4	site_auto_ 4	zone_press	2025-01-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 49	AUTO- 49	Equip COMPRESSEUR #49	COMPRESSEUR	GenBrand	Model-49	SN-49	2023	EN_SERVICE	2	site_auto_ 8	zone_auto_ 1	2024-12-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 50	AUTO- 50	Equip PONT_ROULANT #50	PONT_ROULANT	GenBrand	Model-50	SN-50	2024	EN_SERVICE	3	site_po_sigmaringen	zone_press	2024-11-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 51	AUTO- 51	Equip PRESSE_PLIEUSE #51	PRESSE_PLIEUSE	GenBrand	Model-51	SN-51	2015	EN_SERVICE	4	site_psa_sochaux	zone_auto_ 1	2024-10-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 52	AUTO- 52	Equip PRESSE_INJECTION #52	PRESSE_INJECTION	GenBrand	Model-52	SN-52	2016	EN_SERVICE	2	site_auto_ 3	zone_press	2024-09-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 53	AUTO- 53	Equip CHARIOT_ELEVATEUR #53	CHARIOT_ELEVATEUR	GenBrand	Model-53	SN-53	2017	EN_SERVICE	3	site_auto_ 1	zone_auto_ 1	2024-08-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 54	AUTO- 54	Equip COMPRESSEUR #54	COMPRESSEUR	GenBrand	Model-54	SN-54	2018	EN_SERVICE	4	site_auto_ 7	zone_press	2024-07-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 55	AUTO- 55	Equip PONT_ROULANT #55	PONT_ROULANT	GenBrand	Model-55	SN-55	2019	EN_SERVICE	2	site_se_carros	zone_auto_ 1	2024-06-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 56	AUTO- 56	Equip PRESSE_PLIEUSE #56	PRESSE_PLIEUSE	GenBrand	Model-56	SN-56	2020	EN_SERVICE	3	site_safran_colomiers	zone_press	2024-05-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 57	AUTO- 57	Equip PRESSE_INJECTION #57	PRESSE_INJECTION	GenBrand	Model-57	SN-57	2021	EN_SERVICE	4	site_po_compiegne	zone_auto_ 1	2024-04-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 58	AUTO- 58	Equip CHARIOT_ELEVATEUR #58	CHARIOT_ELEVATEUR	GenBrand	Model-58	SN-58	2022	EN_SERVICE	2	site_michelin_troyes	zone_press	2024-03-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 59	AUTO- 59	Equip COMPRESSEUR #59	COMPRESSEUR	GenBrand	Model-59	SN-59	2023	EN_SERVICE	3	site_rt_venissieux	zone_auto_ 1	2024-02-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 60	AUTO- 60	Equip PONT_ROULANT #60	PONT_ROULANT	GenBrand	Model-60	SN-60	2024	EN_SERVICE	4	site_angers	zone_press	2024-01-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 61	AUTO- 61	Equip PRESSE_PLIEUSE #61	PRESSE_PLIEUSE	GenBrand	Model-61	SN-61	2015	EN_SERVICE	2	site_michelin_ladoux	zone_auto_ 1	2023-12-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 62	AUTO- 62	Equip PRESSE_INJECTION #62	PRESSE_INJECTION	GenBrand	Model-62	SN-62	2016	EN_SERVICE	3	site_arkema_lacq	zone_press	2023-11-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 63	AUTO- 63	Equip CHARIOT_ELEVATEUR #63	CHARIOT_ELEVATEUR	GenBrand	Model-63	SN-63	2017	EN_SERVICE	4	site_valeo_angers	zone_auto_ 1	2023-10-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 64	AUTO- 64	Equip COMPRESSEUR #64	COMPRESSEUR	GenBrand	Model-64	SN-64	2018	EN_SERVICE	2	site_auto_ 6	zone_press	2023-09-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 65	AUTO- 65	Equip PONT_ROULANT #65	PONT_ROULANT	GenBrand	Model-65	SN-65	2019	EN_SERVICE	3	site_auto_ 5	zone_auto_ 1	2023-08-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 66	AUTO- 66	Equip PRESSE_PLIEUSE #66	PRESSE_PLIEUSE	GenBrand	Model-66	SN-66	2020	EN_SERVICE	4	site_psa_rennes	zone_press	2023-07-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 67	AUTO- 67	Equip PRESSE_INJECTION #67	PRESSE_INJECTION	GenBrand	Model-67	SN-67	2021	EN_SERVICE	2	site_auto_ 2	zone_auto_ 1	2023-06-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 68	AUTO- 68	Equip CHARIOT_ELEVATEUR #68	CHARIOT_ELEVATEUR	GenBrand	Model-68	SN-68	2022	EN_SERVICE	3	site_auto_ 4	zone_press	2023-05-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 69	AUTO- 69	Equip COMPRESSEUR #69	COMPRESSEUR	GenBrand	Model-69	SN-69	2023	EN_SERVICE	4	site_auto_ 8	zone_auto_ 1	2023-04-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 70	AUTO- 70	Equip PONT_ROULANT #70	PONT_ROULANT	GenBrand	Model-70	SN-70	2024	EN_SERVICE	2	site_po_sigmaringen	zone_press	2023-03-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 71	AUTO- 71	Equip PRESSE_PLIEUSE #71	PRESSE_PLIEUSE	GenBrand	Model-71	SN-71	2015	EN_SERVICE	3	site_psa_sochaux	zone_auto_ 1	2023-02-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 72	AUTO- 72	Equip PRESSE_INJECTION #72	PRESSE_INJECTION	GenBrand	Model-72	SN-72	2016	EN_SERVICE	4	site_auto_ 3	zone_press	2026-01-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 73	AUTO- 73	Equip CHARIOT_ELEVATEUR #73	CHARIOT_ELEVATEUR	GenBrand	Model-73	SN-73	2017	EN_SERVICE	2	site_auto_ 1	zone_auto_ 1	2025-12-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 74	AUTO- 74	Equip COMPRESSEUR #74	COMPRESSEUR	GenBrand	Model-74	SN-74	2018	EN_SERVICE	3	site_auto_ 7	zone_press	2025-11-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 75	AUTO- 75	Equip PONT_ROULANT #75	PONT_ROULANT	GenBrand	Model-75	SN-75	2019	EN_SERVICE	4	site_se_carros	zone_auto_ 1	2025-10-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 91	AUTO- 91	Equip PRESSE_PLIEUSE #91	PRESSE_PLIEUSE	GenBrand	Model-91	SN-91	2015	EN_SERVICE	2	site_psa_sochaux	zone_auto_ 1	2024-06-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 92	AUTO- 92	Equip PRESSE_INJECTION #92	PRESSE_INJECTION	GenBrand	Model-92	SN-92	2016	EN_SERVICE	3	site_auto_ 3	zone_press	2024-05-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 93	AUTO- 93	Equip CHARIOT_ELEVATEUR #93	CHARIOT_ELEVATEUR	GenBrand	Model-93	SN-93	2017	EN_SERVICE	4	site_auto_ 1	zone_auto_ 1	2024-04-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 94	AUTO- 94	Equip COMPRESSEUR #94	COMPRESSEUR	GenBrand	Model-94	SN-94	2018	EN_SERVICE	2	site_auto_ 7	zone_press	2024-03-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 95	AUTO- 95	Equip PONT_ROULANT #95	PONT_ROULANT	GenBrand	Model-95	SN-95	2019	EN_SERVICE	3	site_se_carros	zone_auto_ 1	2024-02-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 96	AUTO- 96	Equip PRESSE_PLIEUSE #96	PRESSE_PLIEUSE	GenBrand	Model-96	SN-96	2020	EN_SERVICE	4	site_safran_colomiers	zone_press	2024-01-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 97	AUTO- 97	Equip PRESSE_INJECTION #97	PRESSE_INJECTION	GenBrand	Model-97	SN-97	2021	EN_SERVICE	2	site_po_compiegne	zone_auto_ 1	2023-12-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 98	AUTO- 98	Equip CHARIOT_ELEVATEUR #98	CHARIOT_ELEVATEUR	GenBrand	Model-98	SN-98	2022	EN_SERVICE	3	site_michelin_troyes	zone_press	2023-11-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 99	AUTO- 99	Equip COMPRESSEUR #99	COMPRESSEUR	GenBrand	Model-99	SN-99	2023	EN_SERVICE	4	site_rt_venissieux	zone_auto_ 1	2023-10-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_100	AUTO-100	Equip PONT_ROULANT #100	PONT_ROULANT	GenBrand	Model-100	SN-100	2024	EN_SERVICE	2	site_angers	zone_press	2023-09-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_chariot	CH-EL-003	Chariot élévateur 3T	CHARIOT_ELEVATEUR	Toyota	8FBEKT18	CHE-3T-003	2019	EN_SERVICE	3	site_michelin_ladoux	zone_auto_ 1	2019-09-01 00:00:00+00	2026-01-25 18:14:37.535885+00	\N	\N	\N	\N	\N	f	\N
asset_injection	PR-INJ-002	Presse à injecter 320T	PRESSE_INJECTION	Arburg	320H	INJ320-ACME-002	2020	EN_SERVICE	4	site_arkema_lacq	zone_press	2020-06-10 00:00:00+00	2026-01-25 18:14:37.535885+00	\N	\N	\N	\N	\N	f	\N
asset_plieuse	PR-PL-001	Presse plieuse 200T	PRESSE_PLIEUSE	Trumpf	V200	PL200-ACME-001	2018	EN_SERVICE	4	site_valeo_angers	zone_auto_ 1	2018-03-15 00:00:00+00	2026-01-25 18:14:37.535885+00	\N	\N	\N	\N	\N	f	\N
asset_auto_  1	AUTO-  1	Presse plieuse AMADA HFE 100-3 - 100T x 3m	PRESSE_PLIEUSE	AMADA	HFE 100-3	AMD-HFE100-2015-001	2015	EN_SERVICE	2	site_michelin_ladoux	zone_auto_ 1	2025-12-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	t	3
asset_auto_  8	AUTO-  8	Chariot élévateur électrique Linde E20P - 2T	CHARIOT_ELEVATEUR	Linde	E20P	LIN-E20P-2022-008	2022	EN_SERVICE	3	site_auto_ 4	zone_press	2025-05-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_  6	AUTO-  6	Presse plieuse TRUMPF TrumaBend V85 - 85T x 2.5m	PRESSE_PLIEUSE	TRUMPF	TrumaBend V85	TRU-V85-2020-006	2020	EN_SERVICE	4	site_psa_rennes	zone_press	2025-07-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_  7	AUTO-  7	Presse injection Arburg Allrounder 520S - 200T	PRESSE_INJECTION	Arburg	Allrounder 520S	ARB-520S-2021-007	2021	EN_SERVICE	2	site_auto_ 2	zone_auto_ 1	2025-06-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_  4	AUTO-  4	Compresseur Atlas Copco GA 30 VSD+ - 30kW 4.7m³/min	COMPRESSEUR	Atlas Copco	GA 30 VSD+	ATC-GA30-2018-004	2018	EN_SERVICE	2	site_auto_ 6	zone_press	2025-09-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_  9	AUTO-  9	Compresseur Kaeser CSD 102 - 75kW 10.2m³/min	COMPRESSEUR	Kaeser	CSD 102	KAE-CSD102-2023-009	2023	EN_SERVICE	4	site_auto_ 8	zone_auto_ 1	2025-04-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 12	AUTO- 12	Equip PRESSE_INJECTION #12	PRESSE_INJECTION	GenBrand	Model-12	SN-12	2016	EN_SERVICE	4	site_auto_ 3	zone_press	2025-01-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 76	AUTO- 76	Equip PRESSE_PLIEUSE #76	PRESSE_PLIEUSE	GenBrand	Model-76	SN-76	2020	EN_SERVICE	2	site_safran_colomiers	zone_press	2025-09-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 77	AUTO- 77	Equip PRESSE_INJECTION #77	PRESSE_INJECTION	GenBrand	Model-77	SN-77	2021	EN_SERVICE	3	site_po_compiegne	zone_auto_ 1	2025-08-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 78	AUTO- 78	Equip CHARIOT_ELEVATEUR #78	CHARIOT_ELEVATEUR	GenBrand	Model-78	SN-78	2022	EN_SERVICE	4	site_michelin_troyes	zone_press	2025-07-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 79	AUTO- 79	Equip COMPRESSEUR #79	COMPRESSEUR	GenBrand	Model-79	SN-79	2023	EN_SERVICE	2	site_rt_venissieux	zone_auto_ 1	2025-06-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 80	AUTO- 80	Equip PONT_ROULANT #80	PONT_ROULANT	GenBrand	Model-80	SN-80	2024	EN_SERVICE	3	site_angers	zone_press	2025-05-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 81	AUTO- 81	Equip PRESSE_PLIEUSE #81	PRESSE_PLIEUSE	GenBrand	Model-81	SN-81	2015	EN_SERVICE	4	site_michelin_ladoux	zone_auto_ 1	2025-04-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 82	AUTO- 82	Equip PRESSE_INJECTION #82	PRESSE_INJECTION	GenBrand	Model-82	SN-82	2016	EN_SERVICE	2	site_arkema_lacq	zone_press	2025-03-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 83	AUTO- 83	Equip CHARIOT_ELEVATEUR #83	CHARIOT_ELEVATEUR	GenBrand	Model-83	SN-83	2017	EN_SERVICE	3	site_valeo_angers	zone_auto_ 1	2025-02-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 84	AUTO- 84	Equip COMPRESSEUR #84	COMPRESSEUR	GenBrand	Model-84	SN-84	2018	EN_SERVICE	4	site_auto_ 6	zone_press	2025-01-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 85	AUTO- 85	Equip PONT_ROULANT #85	PONT_ROULANT	GenBrand	Model-85	SN-85	2019	EN_SERVICE	2	site_auto_ 5	zone_auto_ 1	2024-12-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 86	AUTO- 86	Equip PRESSE_PLIEUSE #86	PRESSE_PLIEUSE	GenBrand	Model-86	SN-86	2020	EN_SERVICE	3	site_psa_rennes	zone_press	2024-11-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 87	AUTO- 87	Equip PRESSE_INJECTION #87	PRESSE_INJECTION	GenBrand	Model-87	SN-87	2021	EN_SERVICE	4	site_auto_ 2	zone_auto_ 1	2024-10-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 88	AUTO- 88	Equip CHARIOT_ELEVATEUR #88	CHARIOT_ELEVATEUR	GenBrand	Model-88	SN-88	2022	EN_SERVICE	2	site_auto_ 4	zone_press	2024-09-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 89	AUTO- 89	Equip COMPRESSEUR #89	COMPRESSEUR	GenBrand	Model-89	SN-89	2023	EN_SERVICE	3	site_auto_ 8	zone_auto_ 1	2024-08-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
asset_auto_ 90	AUTO- 90	Equip PONT_ROULANT #90	PONT_ROULANT	GenBrand	Model-90	SN-90	2024	EN_SERVICE	4	site_po_sigmaringen	zone_press	2024-07-25 18:15:48.05791+00	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	f	\N
\.


--
-- Data for Name: attachments; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.attachments (id, owner_type, owner_id, file_type, category, title, original_file_name, mime_type, size_bytes, storage_key, is_private, checksum, status, version_number, parent_id, created_at, created_by, updated_at, updated_by, archived_at) FROM stdin;
att_pbr5sj6vml2g9423	EQUIPMENT	asset_auto_  1	IMAGE	PLAQUE_IDENTIFICATION	Plaque d'identification	plaque_asset_auto_  1_1769872267323.jpg	image/jpeg	180913	equipment/asset_auto_  1/plaque_identification/f357f08b-c239-4d60-a3e5-c32427d29566.jpg	f	7e25303de1916f16db2780fe43067bd85dbaa2800071c41c8255b34457543ed3	ACTIVE	1	\N	2026-01-31 15:11:10.539+00	usr_admin_lolo	2026-01-31 15:11:10.539+00	\N	\N
att_j6mp7s6eml2ieytu	EQUIPMENT	asset_auto_  1	IMAGE	PLAQUE_IDENTIFICATION	Plaque d'identification	plaque_asset_auto_  1_1769875899082.jpg	image/jpeg	180913	equipment/asset_auto_  1/plaque_identification/48233d98-4494-4d1e-b386-658381d98445.jpg	f	7e25303de1916f16db2780fe43067bd85dbaa2800071c41c8255b34457543ed3	ACTIVE	1	\N	2026-01-31 16:11:42.93+00	usr_admin_lolo	2026-01-31 16:11:42.93+00	\N	\N
att_dujv8ol1ml2jw28f	EQUIPMENT	asset_auto_  1	IMAGE	PLAQUE_IDENTIFICATION	Plaque d'identification	plaque_asset_auto_  1_1769878375254.jpg	image/jpeg	180913	equipment/asset_auto_  1/plaque_identification/0a893408-a93e-45de-9fd5-b9b2d55ba249.jpg	f	7e25303de1916f16db2780fe43067bd85dbaa2800071c41c8255b34457543ed3	ACTIVE	1	\N	2026-01-31 16:53:00.111+00	usr_admin_lolo	2026-01-31 16:53:00.111+00	\N	\N
att_c2546879-129a-453f-8f13-329608c78f8c	NONCONFORMITY	test-nc-001	PDF	PHOTO	Test Upload	test.txt	text/plain	5	915ba042-f812-4158-8e97-4f9ee99d51ea.txt	f	\N	ACTIVE	1	\N	2026-02-01 01:20:15.524053+00	\N	2026-02-01 01:20:15.524053+00	\N	\N
att_ce268d00-a197-4e94-9ea8-35b4e9d261cb	NONCONFORMITY	nc_d4d25a77-dfc3-4590-9597-134750162c78	IMAGE	PHOTO	Photo NC 01/02/2026	image_1769908936900.jpg	image/jpeg	241010	acf04922-a5e8-426c-8f90-cac19be04bad.jpg	f	\N	ACTIVE	1	\N	2026-02-01 01:22:27.711735+00	\N	2026-02-01 01:22:27.711735+00	\N	\N
att_105e1e5a-93f0-403c-8b3d-af6aae198544	NONCONFORMITY	nc_d4d25a77-dfc3-4590-9597-134750162c78	IMAGE	PHOTO	Photo NC 01/02/2026	photo_1769908942437.jpg	image/jpeg	265698	0ed9926a-338b-40cb-8ec7-51f5a669171f.jpg	f	\N	ACTIVE	1	\N	2026-02-01 01:22:29.998251+00	\N	2026-02-01 01:22:29.998251+00	\N	\N
att_0f5144bf-cb54-425f-af95-6f836f574ca7	NONCONFORMITY	nc_a1bc2bc5-02dd-45e7-978a-2e5391156a8c	IMAGE	PHOTO	Photo NC 01/02/2026	photo_1769909500910.jpg	image/jpeg	376819	63412673-a8c5-4fa2-a286-fb335c6ae5ff.jpg	f	\N	ACTIVE	1	\N	2026-02-01 01:31:44.953515+00	\N	2026-02-01 01:31:44.953515+00	\N	\N
\.


--
-- Data for Name: checklist_items; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.checklist_items (id, template_id, label, field_type, required, help_text, sort_order) FROM stdin;
item_press_arret	tpl_vgp_press	Arrêt d'urgence fonctionnel	BOOL	t	\N	1
item_press_fuites	tpl_vgp_press	Absence de fuites hydrauliques	BOOL	t	\N	2
item_press_protect	tpl_vgp_press	Protecteurs interverrouillés OK	BOOL	t	\N	3
item_inj_verin	tpl_vgp_injection	Vérin injection sans fuite	BOOL	t	\N	1
item_inj_serr	tpl_vgp_injection	Serrage moule conforme	BOOL	t	\N	2
item_chario_freins	tpl_vgp_chariot	Frein de service et de parking	BOOL	t	\N	1
item_chario_mats	tpl_vgp_chariot	Mâts et chaines OK	BOOL	t	\N	2
item_prev_nettoyage	tpl_prev_generic	Nettoyage complet machine	BOOL	f	\N	1
item_prev_lubr	tpl_prev_generic	Lubrification points critiques	BOOL	t	\N	2
item_prev_securite	tpl_prev_generic	Contrôle dispositifs de sécurité	BOOL	t	\N	3
\.


--
-- Data for Name: checklist_templates; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.checklist_templates (id, control_type_id, asset_category, name) FROM stdin;
tpl_vgp_press	ctl_vgp_press	PRESSE_PLIEUSE	VGP Presse plieuse
tpl_vgp_injection	ctl_vgp_press	PRESSE_INJECTION	VGP Presse injection
tpl_vgp_chariot	ctl_vgp_chariot	CHARIOT_ELEVATEUR	VGP Chariot
tpl_prev_generic	ctl_prev_maint	\N	Préventif semestriel
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.clients (id, name, created_at, siret, tva_number, contact_name, contact_email, contact_phone, address, access_instructions, billing_address, billing_email, internal_notes, status) FROM stdin;
cli_acme	ACME Industrie	2026-01-25 18:14:37.531497+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACTIVE
cli_auto_ 1	Renault Trucks	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACTIVE
cli_auto_ 2	Plastic Omnium	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACTIVE
cli_auto_ 3	Safran Aircraft Engines	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACTIVE
cli_auto_ 4	Groupe PSA Peugeot Citroën	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACTIVE
cli_auto_ 5	Schneider Electric	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACTIVE
cli_auto_ 6	Michelin	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACTIVE
cli_auto_ 7	Valeo	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACTIVE
cli_auto_ 8	Arkema	2026-01-25 18:15:48.05791+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACTIVE
\.


--
-- Data for Name: company_settings; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.company_settings (id, company_name, company_logo_url, website_url, address_line1, address_line2, postal_code, city, country, phone, email, legal_name, siret, primary_color, created_at, updated_at) FROM stdin;
1	GroupeADF	https://www.abenex.com/wp-content/uploads/2023/06/adf.png	https://www.groupeadf.com/fr	Groupe ADF Z.I La Bastide Blanche – Bât G	\N	13127	Vitrolles	France	+33 (0) 4 42 77 48 50	contact@groupeadf.com	\N	\N	\N	2026-02-08 12:22:18.710629+00	2026-02-08 16:34:55.43351+00
\.


--
-- Data for Name: control_types; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.control_types (id, code, label, description, periodicity_days, active) FROM stdin;
ctl_vgp_press	VGP_PRESS	VGP - Presses	VGP annuelle des presses plieuses et à injecter	365	t
ctl_vgp_chariot	VGP_CHARIOT	VGP - Chariots élévateurs	VGP annuelle des chariots élévateurs	365	t
ctl_prev_maint	PREVENTIVE	Maintenance préventive semestrielle	Préventif semestriel machines critiques	180	t
\.


--
-- Data for Name: corrective_actions; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.corrective_actions (id, nonconformity_id, owner, description, due_at, status, closed_at, validated_by, work_notes) FROM stdin;
action_7f2c68d6-8994-4427-8003-ac6f2df7c1a6	nc_a1bc2bc5-02dd-45e7-978a-2e5391156a8c	usr_admin_lolo	Action corrective à définir	2026-03-03 00:00:00+00	OUVERTE	\N	\N	\N
action_9006ce44-e576-454c-a670-0d9472767041	nc_d4d25a77-dfc3-4590-9597-134750162c78	usr_admin_lolo	Action corrective à définir	2026-03-03 00:00:00+00	OUVERTE	\N	\N	\N
action_8ae20549-8e6f-48aa-99c9-cf5333f18da4	nc_d4d25a77-dfc3-4590-9597-134750162c78	Aimad Hadiqa	changement embrayage	2026-02-16 00:00:00+00	OUVERTE	\N	\N	\N
action_8bece7c6-9aea-494e-b28f-5efb91a0d6b1	nc_a1bc2bc5-02dd-45e7-978a-2e5391156a8c	Adrien Feydel	dzaDZAD	2026-03-17 00:00:00+00	OUVERTE	\N	\N	\N
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.documents (id, entity_type, entity_id, local_uri, mime, sha256, uploaded_at, synced, server_url) FROM stdin;
\.


--
-- Data for Name: maintenance_logs; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.maintenance_logs (id, asset_id, date, actor, operation_type, description, parts_ref, created_at) FROM stdin;
\.


--
-- Data for Name: mission_assets; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.mission_assets (id, mission_id, asset_id) FROM stdin;
ma_vgp_plieuse	ms_vgp_plieuse_2026	asset_plieuse
ma_vgp_chariot	ms_vgp_chariot_2026	asset_chariot
ma_asset_plieuse_vgp_press	ms_asset_plieuse_vgp_press	asset_plieuse
ma_asset_injection_vgp_press	ms_asset_injection_vgp_press	asset_injection
ma_asset_auto_  1_vgp_press	ms_asset_auto_  1_vgp_press	asset_auto_  1
ma_asset_auto_  2_vgp_press	ms_asset_auto_  2_vgp_press	asset_auto_  2
ma_asset_auto_  6_vgp_press	ms_asset_auto_  6_vgp_press	asset_auto_  6
ma_asset_auto_  7_vgp_press	ms_asset_auto_  7_vgp_press	asset_auto_  7
ma_asset_auto_ 11_vgp_press	ms_asset_auto_ 11_vgp_press	asset_auto_ 11
ma_asset_auto_ 12_vgp_press	ms_asset_auto_ 12_vgp_press	asset_auto_ 12
ma_asset_auto_ 16_vgp_press	ms_asset_auto_ 16_vgp_press	asset_auto_ 16
ma_asset_auto_ 17_vgp_press	ms_asset_auto_ 17_vgp_press	asset_auto_ 17
ma_asset_auto_ 21_vgp_press	ms_asset_auto_ 21_vgp_press	asset_auto_ 21
ma_asset_auto_ 22_vgp_press	ms_asset_auto_ 22_vgp_press	asset_auto_ 22
ma_asset_auto_ 26_vgp_press	ms_asset_auto_ 26_vgp_press	asset_auto_ 26
ma_asset_auto_ 27_vgp_press	ms_asset_auto_ 27_vgp_press	asset_auto_ 27
ma_asset_auto_ 31_vgp_press	ms_asset_auto_ 31_vgp_press	asset_auto_ 31
ma_asset_auto_ 32_vgp_press	ms_asset_auto_ 32_vgp_press	asset_auto_ 32
ma_asset_auto_ 36_vgp_press	ms_asset_auto_ 36_vgp_press	asset_auto_ 36
ma_asset_auto_ 37_vgp_press	ms_asset_auto_ 37_vgp_press	asset_auto_ 37
ma_asset_auto_ 41_vgp_press	ms_asset_auto_ 41_vgp_press	asset_auto_ 41
ma_asset_auto_ 42_vgp_press	ms_asset_auto_ 42_vgp_press	asset_auto_ 42
ma_asset_auto_ 46_vgp_press	ms_asset_auto_ 46_vgp_press	asset_auto_ 46
ma_asset_auto_ 47_vgp_press	ms_asset_auto_ 47_vgp_press	asset_auto_ 47
ma_asset_auto_ 51_vgp_press	ms_asset_auto_ 51_vgp_press	asset_auto_ 51
ma_asset_auto_ 52_vgp_press	ms_asset_auto_ 52_vgp_press	asset_auto_ 52
ma_asset_auto_ 56_vgp_press	ms_asset_auto_ 56_vgp_press	asset_auto_ 56
ma_asset_auto_ 57_vgp_press	ms_asset_auto_ 57_vgp_press	asset_auto_ 57
ma_asset_auto_ 61_vgp_press	ms_asset_auto_ 61_vgp_press	asset_auto_ 61
ma_asset_auto_ 62_vgp_press	ms_asset_auto_ 62_vgp_press	asset_auto_ 62
ma_asset_auto_ 66_vgp_press	ms_asset_auto_ 66_vgp_press	asset_auto_ 66
ma_asset_auto_ 67_vgp_press	ms_asset_auto_ 67_vgp_press	asset_auto_ 67
ma_asset_auto_ 71_vgp_press	ms_asset_auto_ 71_vgp_press	asset_auto_ 71
ma_asset_auto_ 72_vgp_press	ms_asset_auto_ 72_vgp_press	asset_auto_ 72
ma_asset_auto_ 76_vgp_press	ms_asset_auto_ 76_vgp_press	asset_auto_ 76
ma_asset_auto_ 77_vgp_press	ms_asset_auto_ 77_vgp_press	asset_auto_ 77
ma_asset_auto_ 81_vgp_press	ms_asset_auto_ 81_vgp_press	asset_auto_ 81
ma_asset_auto_ 82_vgp_press	ms_asset_auto_ 82_vgp_press	asset_auto_ 82
ma_asset_auto_ 86_vgp_press	ms_asset_auto_ 86_vgp_press	asset_auto_ 86
ma_asset_auto_ 87_vgp_press	ms_asset_auto_ 87_vgp_press	asset_auto_ 87
ma_asset_auto_ 91_vgp_press	ms_asset_auto_ 91_vgp_press	asset_auto_ 91
ma_asset_auto_ 92_vgp_press	ms_asset_auto_ 92_vgp_press	asset_auto_ 92
ma_asset_auto_ 96_vgp_press	ms_asset_auto_ 96_vgp_press	asset_auto_ 96
ma_asset_auto_ 97_vgp_press	ms_asset_auto_ 97_vgp_press	asset_auto_ 97
ma_asset_chariot_vgp_chariot	ms_asset_chariot_vgp_chariot	asset_chariot
ma_asset_auto_  3_vgp_chariot	ms_asset_auto_  3_vgp_chariot	asset_auto_  3
ma_asset_auto_  8_vgp_chariot	ms_asset_auto_  8_vgp_chariot	asset_auto_  8
ma_asset_auto_ 13_vgp_chariot	ms_asset_auto_ 13_vgp_chariot	asset_auto_ 13
ma_asset_auto_ 18_vgp_chariot	ms_asset_auto_ 18_vgp_chariot	asset_auto_ 18
ma_asset_auto_ 23_vgp_chariot	ms_asset_auto_ 23_vgp_chariot	asset_auto_ 23
ma_asset_auto_ 28_vgp_chariot	ms_asset_auto_ 28_vgp_chariot	asset_auto_ 28
ma_asset_auto_ 33_vgp_chariot	ms_asset_auto_ 33_vgp_chariot	asset_auto_ 33
ma_asset_auto_ 38_vgp_chariot	ms_asset_auto_ 38_vgp_chariot	asset_auto_ 38
ma_asset_auto_ 43_vgp_chariot	ms_asset_auto_ 43_vgp_chariot	asset_auto_ 43
ma_asset_auto_ 48_vgp_chariot	ms_asset_auto_ 48_vgp_chariot	asset_auto_ 48
ma_asset_auto_ 53_vgp_chariot	ms_asset_auto_ 53_vgp_chariot	asset_auto_ 53
ma_asset_auto_ 58_vgp_chariot	ms_asset_auto_ 58_vgp_chariot	asset_auto_ 58
ma_asset_auto_ 63_vgp_chariot	ms_asset_auto_ 63_vgp_chariot	asset_auto_ 63
ma_asset_auto_ 68_vgp_chariot	ms_asset_auto_ 68_vgp_chariot	asset_auto_ 68
ma_asset_auto_ 73_vgp_chariot	ms_asset_auto_ 73_vgp_chariot	asset_auto_ 73
ma_asset_auto_ 78_vgp_chariot	ms_asset_auto_ 78_vgp_chariot	asset_auto_ 78
ma_asset_auto_ 83_vgp_chariot	ms_asset_auto_ 83_vgp_chariot	asset_auto_ 83
ma_asset_auto_ 88_vgp_chariot	ms_asset_auto_ 88_vgp_chariot	asset_auto_ 88
ma_asset_auto_ 93_vgp_chariot	ms_asset_auto_ 93_vgp_chariot	asset_auto_ 93
ma_asset_auto_ 98_vgp_chariot	ms_asset_auto_ 98_vgp_chariot	asset_auto_ 98
ma_asset_plieuse_prev	ms_asset_plieuse_prev	asset_plieuse
ma_asset_injection_prev	ms_asset_injection_prev	asset_injection
ma_asset_chariot_prev	ms_asset_chariot_prev	asset_chariot
ma_asset_auto_  1_prev	ms_asset_auto_  1_prev	asset_auto_  1
ma_asset_auto_  2_prev	ms_asset_auto_  2_prev	asset_auto_  2
ma_asset_auto_  3_prev	ms_asset_auto_  3_prev	asset_auto_  3
ma_asset_auto_  4_prev	ms_asset_auto_  4_prev	asset_auto_  4
ma_asset_auto_  5_prev	ms_asset_auto_  5_prev	asset_auto_  5
ma_asset_auto_  6_prev	ms_asset_auto_  6_prev	asset_auto_  6
ma_asset_auto_  7_prev	ms_asset_auto_  7_prev	asset_auto_  7
ma_asset_auto_  8_prev	ms_asset_auto_  8_prev	asset_auto_  8
ma_asset_auto_  9_prev	ms_asset_auto_  9_prev	asset_auto_  9
ma_asset_auto_ 10_prev	ms_asset_auto_ 10_prev	asset_auto_ 10
ma_asset_auto_ 11_prev	ms_asset_auto_ 11_prev	asset_auto_ 11
ma_asset_auto_ 12_prev	ms_asset_auto_ 12_prev	asset_auto_ 12
ma_asset_auto_ 13_prev	ms_asset_auto_ 13_prev	asset_auto_ 13
ma_asset_auto_ 14_prev	ms_asset_auto_ 14_prev	asset_auto_ 14
ma_asset_auto_ 15_prev	ms_asset_auto_ 15_prev	asset_auto_ 15
ma_asset_auto_ 16_prev	ms_asset_auto_ 16_prev	asset_auto_ 16
ma_asset_auto_ 17_prev	ms_asset_auto_ 17_prev	asset_auto_ 17
ma_asset_auto_ 18_prev	ms_asset_auto_ 18_prev	asset_auto_ 18
ma_asset_auto_ 19_prev	ms_asset_auto_ 19_prev	asset_auto_ 19
ma_asset_auto_ 20_prev	ms_asset_auto_ 20_prev	asset_auto_ 20
ma_asset_auto_ 21_prev	ms_asset_auto_ 21_prev	asset_auto_ 21
ma_asset_auto_ 22_prev	ms_asset_auto_ 22_prev	asset_auto_ 22
ma_asset_auto_ 23_prev	ms_asset_auto_ 23_prev	asset_auto_ 23
ma_asset_auto_ 24_prev	ms_asset_auto_ 24_prev	asset_auto_ 24
ma_asset_auto_ 25_prev	ms_asset_auto_ 25_prev	asset_auto_ 25
ma_asset_auto_ 26_prev	ms_asset_auto_ 26_prev	asset_auto_ 26
ma_asset_auto_ 27_prev	ms_asset_auto_ 27_prev	asset_auto_ 27
ma_asset_auto_ 28_prev	ms_asset_auto_ 28_prev	asset_auto_ 28
ma_asset_auto_ 29_prev	ms_asset_auto_ 29_prev	asset_auto_ 29
ma_asset_auto_ 30_prev	ms_asset_auto_ 30_prev	asset_auto_ 30
ma_asset_auto_ 31_prev	ms_asset_auto_ 31_prev	asset_auto_ 31
ma_asset_auto_ 32_prev	ms_asset_auto_ 32_prev	asset_auto_ 32
ma_asset_auto_ 33_prev	ms_asset_auto_ 33_prev	asset_auto_ 33
ma_asset_auto_ 34_prev	ms_asset_auto_ 34_prev	asset_auto_ 34
ma_asset_auto_ 35_prev	ms_asset_auto_ 35_prev	asset_auto_ 35
ma_asset_auto_ 36_prev	ms_asset_auto_ 36_prev	asset_auto_ 36
ma_asset_auto_ 37_prev	ms_asset_auto_ 37_prev	asset_auto_ 37
ma_asset_auto_ 38_prev	ms_asset_auto_ 38_prev	asset_auto_ 38
ma_asset_auto_ 39_prev	ms_asset_auto_ 39_prev	asset_auto_ 39
ma_asset_auto_ 40_prev	ms_asset_auto_ 40_prev	asset_auto_ 40
ma_asset_auto_ 41_prev	ms_asset_auto_ 41_prev	asset_auto_ 41
ma_asset_auto_ 42_prev	ms_asset_auto_ 42_prev	asset_auto_ 42
ma_asset_auto_ 43_prev	ms_asset_auto_ 43_prev	asset_auto_ 43
ma_asset_auto_ 44_prev	ms_asset_auto_ 44_prev	asset_auto_ 44
ma_asset_auto_ 45_prev	ms_asset_auto_ 45_prev	asset_auto_ 45
ma_asset_auto_ 46_prev	ms_asset_auto_ 46_prev	asset_auto_ 46
ma_asset_auto_ 47_prev	ms_asset_auto_ 47_prev	asset_auto_ 47
ma_asset_auto_ 48_prev	ms_asset_auto_ 48_prev	asset_auto_ 48
ma_asset_auto_ 49_prev	ms_asset_auto_ 49_prev	asset_auto_ 49
ma_asset_auto_ 50_prev	ms_asset_auto_ 50_prev	asset_auto_ 50
ma_asset_auto_ 51_prev	ms_asset_auto_ 51_prev	asset_auto_ 51
ma_asset_auto_ 52_prev	ms_asset_auto_ 52_prev	asset_auto_ 52
ma_asset_auto_ 53_prev	ms_asset_auto_ 53_prev	asset_auto_ 53
ma_asset_auto_ 54_prev	ms_asset_auto_ 54_prev	asset_auto_ 54
ma_asset_auto_ 55_prev	ms_asset_auto_ 55_prev	asset_auto_ 55
ma_asset_auto_ 56_prev	ms_asset_auto_ 56_prev	asset_auto_ 56
ma_asset_auto_ 57_prev	ms_asset_auto_ 57_prev	asset_auto_ 57
ma_asset_auto_ 58_prev	ms_asset_auto_ 58_prev	asset_auto_ 58
ma_asset_auto_ 59_prev	ms_asset_auto_ 59_prev	asset_auto_ 59
ma_asset_auto_ 60_prev	ms_asset_auto_ 60_prev	asset_auto_ 60
ma_asset_auto_ 61_prev	ms_asset_auto_ 61_prev	asset_auto_ 61
ma_asset_auto_ 62_prev	ms_asset_auto_ 62_prev	asset_auto_ 62
ma_asset_auto_ 63_prev	ms_asset_auto_ 63_prev	asset_auto_ 63
ma_asset_auto_ 64_prev	ms_asset_auto_ 64_prev	asset_auto_ 64
ma_asset_auto_ 65_prev	ms_asset_auto_ 65_prev	asset_auto_ 65
ma_asset_auto_ 66_prev	ms_asset_auto_ 66_prev	asset_auto_ 66
ma_asset_auto_ 67_prev	ms_asset_auto_ 67_prev	asset_auto_ 67
ma_asset_auto_ 68_prev	ms_asset_auto_ 68_prev	asset_auto_ 68
ma_asset_auto_ 69_prev	ms_asset_auto_ 69_prev	asset_auto_ 69
ma_asset_auto_ 70_prev	ms_asset_auto_ 70_prev	asset_auto_ 70
ma_asset_auto_ 71_prev	ms_asset_auto_ 71_prev	asset_auto_ 71
ma_asset_auto_ 72_prev	ms_asset_auto_ 72_prev	asset_auto_ 72
ma_asset_auto_ 73_prev	ms_asset_auto_ 73_prev	asset_auto_ 73
ma_asset_auto_ 74_prev	ms_asset_auto_ 74_prev	asset_auto_ 74
ma_asset_auto_ 75_prev	ms_asset_auto_ 75_prev	asset_auto_ 75
ma_asset_auto_ 76_prev	ms_asset_auto_ 76_prev	asset_auto_ 76
ma_asset_auto_ 77_prev	ms_asset_auto_ 77_prev	asset_auto_ 77
ma_asset_auto_ 78_prev	ms_asset_auto_ 78_prev	asset_auto_ 78
ma_asset_auto_ 79_prev	ms_asset_auto_ 79_prev	asset_auto_ 79
ma_asset_auto_ 80_prev	ms_asset_auto_ 80_prev	asset_auto_ 80
ma_asset_auto_ 81_prev	ms_asset_auto_ 81_prev	asset_auto_ 81
ma_asset_auto_ 82_prev	ms_asset_auto_ 82_prev	asset_auto_ 82
ma_asset_auto_ 83_prev	ms_asset_auto_ 83_prev	asset_auto_ 83
ma_asset_auto_ 84_prev	ms_asset_auto_ 84_prev	asset_auto_ 84
ma_asset_auto_ 85_prev	ms_asset_auto_ 85_prev	asset_auto_ 85
ma_asset_auto_ 86_prev	ms_asset_auto_ 86_prev	asset_auto_ 86
ma_asset_auto_ 87_prev	ms_asset_auto_ 87_prev	asset_auto_ 87
ma_asset_auto_ 88_prev	ms_asset_auto_ 88_prev	asset_auto_ 88
ma_asset_auto_ 89_prev	ms_asset_auto_ 89_prev	asset_auto_ 89
ma_asset_auto_ 90_prev	ms_asset_auto_ 90_prev	asset_auto_ 90
ma_asset_auto_ 91_prev	ms_asset_auto_ 91_prev	asset_auto_ 91
ma_asset_auto_ 92_prev	ms_asset_auto_ 92_prev	asset_auto_ 92
ma_asset_auto_ 93_prev	ms_asset_auto_ 93_prev	asset_auto_ 93
ma_asset_auto_ 94_prev	ms_asset_auto_ 94_prev	asset_auto_ 94
ma_asset_auto_ 95_prev	ms_asset_auto_ 95_prev	asset_auto_ 95
ma_asset_auto_ 96_prev	ms_asset_auto_ 96_prev	asset_auto_ 96
ma_asset_auto_ 97_prev	ms_asset_auto_ 97_prev	asset_auto_ 97
ma_asset_auto_ 98_prev	ms_asset_auto_ 98_prev	asset_auto_ 98
ma_asset_auto_ 99_prev	ms_asset_auto_ 99_prev	asset_auto_ 99
ma_asset_auto_100_prev	ms_asset_auto_100_prev	asset_auto_100
ma_1769959447723_xgj99zp9f	mission_1769959447720_3ukbvw38z	asset_auto_  2
ma_1769959451877_adthjj5so	mission_1769959451876_8m51hncvx	asset_auto_  2
ma_1769959475786_ujvv9jkla	mission_1769959475784_wu87afztm	asset_auto_  2
ma_1769960596844_h9m1n6vi3	mission_1769960596842_ltheqbl9q	asset_auto_  6
ma_1769960596845_18mfnutzp	mission_1769960596842_ltheqbl9q	asset_auto_ 26
ma_1769960596845_h2e9ksxep	mission_1769960596842_ltheqbl9q	asset_auto_ 46
ma_1769960596846_bl365k88i	mission_1769960596842_ltheqbl9q	asset_auto_ 66
ma_1769962379557_2c05xuo6l	mission_1769962379554_nqncv8gb4	asset_auto_ 20
ma_1769962379558_eg63d05uc	mission_1769962379554_nqncv8gb4	asset_auto_ 40
ma_1769962526762_31zqju8po	mission_1769962526760_a5rn7cx34	asset_auto_ 20
ma_1769962526762_ka8kw07zp	mission_1769962526760_a5rn7cx34	asset_auto_ 40
ma_1769962526763_hjnxtzz02	mission_1769962526760_a5rn7cx34	asset_auto_ 80
ma_1769963293857_szp7lpd5i	mission_1769963293854_4yaljh501	asset_auto_ 20
ma_1769963293858_aumf26way	mission_1769963293854_4yaljh501	asset_auto_ 40
ma_1769963293858_hhk1076gm	mission_1769963293854_4yaljh501	asset_auto_ 60
ma_1769963293859_t5fe38gsj	mission_1769963293854_4yaljh501	asset_auto_ 80
ma_1769968453376_yjv2im84q	mission_1769968453373_b89r7da2f	asset_auto_ 20
ma_1769968453378_dbrc0ttg2	mission_1769968453373_b89r7da2f	asset_auto_ 40
ma_1769968453378_0uigeie9v	mission_1769968453373_b89r7da2f	asset_auto_ 60
ma_1769969628291_qei9tsvv3	mission_1769969628290_owi3tosb5	asset_auto_  2
ma_1769969628292_n7397pp4o	mission_1769969628290_owi3tosb5	asset_auto_ 22
ma_1769969628293_vnjv1zbio	mission_1769969628290_owi3tosb5	asset_auto_ 42
ma_1769969628293_so7wg0yr3	mission_1769969628290_owi3tosb5	asset_auto_ 62
ma_1769969658327_6fex9dny2	mission_1769969658326_0p7r6za8g	asset_auto_ 20
ma_1769969858677_eeu7mkffi	mission_1769969858676_rw6w5cysz	asset_auto_  9
ma_1769969858678_35689nx16	mission_1769969858676_rw6w5cysz	asset_auto_ 29
ma_1770013985058_v23b1ww4m	mission_1770013985055_qacyq9m3y	asset_auto_  2
ma_1770013985061_c8e4t5zww	mission_1770013985055_qacyq9m3y	asset_auto_ 22
ma_1770013985061_qt88cprrk	mission_1770013985055_qacyq9m3y	asset_auto_ 42
ma_1770013985062_j1vsoqivt	mission_1770013985055_qacyq9m3y	asset_auto_ 62
ma_1770014067548_arw1q1eix	mission_1770014067547_14youk10j	asset_auto_ 20
ma_1770015788988_rpjuof524	mission_1770015788987_01gfmqubo	asset_auto_ 20
ma_1770015788989_9xt7s5czh	mission_1770015788987_01gfmqubo	asset_auto_ 80
ma_1770033915701_y9ylfgzrn	mission_1770033915699_l1iprjn6y	asset_auto_  2
ma_1770033915701_raxdmtxo2	mission_1770033915699_l1iprjn6y	asset_auto_ 82
ma_1770131846989_b7kvtdys2	mission_1770131846986_ul5lheh57	asset_auto_ 20
ma_1770131846990_w8ccni5cp	mission_1770131846986_ul5lheh57	asset_auto_ 40
\.


--
-- Data for Name: mission_operation_assets; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.mission_operation_assets (id, mission_id, operation_type, asset_id, work_description, checklist_template_id, checklist_data, created_at, updated_at) FROM stdin;
1	mission_1769962379554_nqncv8gb4	MAINTENANCE	asset_auto_ 20	\N	1	[{"step": "Vérification visuelle générale", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Nettoyage et lubrification", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Contrôle des fixations", "order": 3, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test de fonctionnement", "order": 4, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-01 16:12:59.56375+00	2026-02-01 16:12:59.56375+00
2	mission_1769962379554_nqncv8gb4	MAINTENANCE	asset_auto_ 40	\N	1	[{"step": "Vérification visuelle générale", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Nettoyage et lubrification", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Contrôle des fixations", "order": 3, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test de fonctionnement", "order": 4, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-01 16:12:59.568994+00	2026-02-01 16:12:59.568994+00
3	mission_1769962379554_nqncv8gb4	MODIFICATION	asset_auto_ 20	\N	\N	[]	2026-02-01 16:12:59.569599+00	2026-02-01 16:12:59.569599+00
4	mission_1769962379554_nqncv8gb4	MODIFICATION	asset_auto_ 40	\N	\N	[]	2026-02-01 16:12:59.570115+00	2026-02-01 16:12:59.570115+00
5	mission_1769962526760_a5rn7cx34	MAINTENANCE	asset_auto_ 20	\N	1	[{"step": "Vérification visuelle générale", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Nettoyage et lubrification", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Contrôle des fixations", "order": 3, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test de fonctionnement", "order": 4, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-01 16:15:26.766191+00	2026-02-01 16:15:26.766191+00
6	mission_1769962526760_a5rn7cx34	MAINTENANCE	asset_auto_ 40	\N	1	[{"step": "Vérification visuelle générale", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Nettoyage et lubrification", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Contrôle des fixations", "order": 3, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test de fonctionnement", "order": 4, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-01 16:15:26.76697+00	2026-02-01 16:15:26.76697+00
7	mission_1769962526760_a5rn7cx34	REPARATION	asset_auto_ 80	\N	3	[{"step": "Diagnostic du défaut", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Remplacement pièce", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test après réparation", "order": 3, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-01 16:15:26.767706+00	2026-02-01 16:15:26.767706+00
9	mission_1769963293854_4yaljh501	MAINTENANCE	asset_auto_ 40	\N	1	[{"step": "Vérification visuelle générale", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Nettoyage et lubrification", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Contrôle des fixations", "order": 3, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test de fonctionnement", "order": 4, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-01 16:28:13.864142+00	2026-02-01 16:28:13.864142+00
10	mission_1769963293854_4yaljh501	REPARATION	asset_auto_ 60	\N	3	[{"step": "Diagnostic du défaut", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Remplacement pièce", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test après réparation", "order": 3, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-01 16:28:13.864895+00	2026-02-01 16:28:13.864895+00
11	mission_1769963293854_4yaljh501	REPARATION	asset_auto_ 80	\N	3	[{"step": "Diagnostic du défaut", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Remplacement pièce", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test après réparation", "order": 3, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-01 16:28:13.86564+00	2026-02-01 16:28:13.86564+00
12	mission_1769968453373_b89r7da2f	MAINTENANCE	asset_auto_ 20	Chaque composant a sa propre variable d'état locale, donc la saisie dans l'input ne cause plus de re-render de la page entière. Faites Ctrl+Shift+R pour vider le cache.	1	[{"step": "Nettoyage et lubrification", "order": 1, "checked": false}, {"step": "Contrôle des fixations", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test de fonctionnement", "order": 3, "checked": false, "checked_at": null, "checked_by": null}, {"step": "hbhljlkjlm", "order": 4, "checked": false, "checked_at": null, "checked_by": null}, {"step": "test nouvelle étape", "order": 5, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-01 17:54:13.387759+00	2026-02-01 18:07:53.853303+00
8	mission_1769963293854_4yaljh501	MAINTENANCE	asset_auto_ 20	\N	1	[{"step": "Vérification visuelle générale", "order": 1, "checked": false}, {"step": "Nettoyage et lubrification", "order": 2, "checked": true, "checked_at": "2026-02-01T16:31:33.970Z", "checked_by": "usr_admin_lolo"}, {"step": "Contrôle des fixations", "order": 3, "checked": false}, {"step": "Test de fonctionnement", "order": 4, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-01 16:28:13.86269+00	2026-02-01 16:44:02.810257+00
14	mission_1769968453373_b89r7da2f	REPARATION	asset_auto_ 20	Je vais créer des composants isolés pour les inputs qui gèrent leur propre state local, évitant ainsi les re-renders du parent :	3	[{"step": "Diagnostic du défaut", "order": 1, "checked": false}, {"step": "Remplacement pièce", "order": 2, "checked": false}, {"step": "Test après réparation", "order": 3, "checked": false}]	2026-02-01 17:54:13.393758+00	2026-02-01 18:10:00.558065+00
13	mission_1769968453373_b89r7da2f	MAINTENANCE	asset_auto_ 40	J'ai créé deux composants isolés avec memo :\n\nDescriptionInput - gère son propre state local pour la description, évite les re-renders du parent\nChecklistStepInput - gère son propre state local pour les nouvelles étapes, avec refocus automatique après ajout	1	[{"step": "Vérification visuelle générale", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Nettoyage et lubrification", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Contrôle des fixations", "order": 3, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test de fonctionnement", "order": 4, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-01 17:54:13.39285+00	2026-02-01 18:08:09.757+00
16	mission_1769968453373_b89r7da2f	REPARATION	asset_auto_ 60	Je vais créer des composants isolés pour les inputs qui gèrent leur propre state local, évitant ainsi les re-renders du parent :	3	[{"step": "Diagnostic du défaut", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Remplacement pièce", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test après réparation", "order": 3, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-01 17:54:13.39631+00	2026-02-01 18:09:13.979568+00
15	mission_1769968453373_b89r7da2f	REPARATION	asset_auto_ 40	Je vois le problème. Il y a aussi une référence à openChecklistEditor qui n'existe plus (ligne 421). Mais surtout, le problème de re-render vient probablement du fait que le composant est rendu dans une boucle .map() et les items changent à chaque render.	3	[{"step": "Diagnostic du défaut", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Remplacement pièce", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test après réparation", "order": 3, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-01 17:54:13.394738+00	2026-02-01 18:09:39.480225+00
17	mission_1769969628290_owi3tosb5	MAINTENANCE	asset_auto_  2	\N	1	[{"step": "Vérification visuelle générale", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Nettoyage et lubrification", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Contrôle des fixations", "order": 3, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test de fonctionnement", "order": 4, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-01 18:13:48.296493+00	2026-02-01 18:13:48.296493+00
18	mission_1769969628290_owi3tosb5	MAINTENANCE	asset_auto_ 22	\N	1	[{"step": "Vérification visuelle générale", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Nettoyage et lubrification", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Contrôle des fixations", "order": 3, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test de fonctionnement", "order": 4, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-01 18:13:48.297603+00	2026-02-01 18:13:48.297603+00
19	mission_1769969628290_owi3tosb5	INSPECTION	asset_auto_ 42	\N	2	[{"step": "Vérification de la structure", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Contrôle des dispositifs de sécurité", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test des systèmes de levage", "order": 3, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Validation finale", "order": 4, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-01 18:13:48.29827+00	2026-02-01 18:13:48.29827+00
20	mission_1769969628290_owi3tosb5	INSPECTION	asset_auto_ 62	\N	2	[{"step": "Vérification de la structure", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Contrôle des dispositifs de sécurité", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test des systèmes de levage", "order": 3, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Validation finale", "order": 4, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-01 18:13:48.298946+00	2026-02-01 18:13:48.298946+00
21	mission_1769969658326_0p7r6za8g	MAINTENANCE	asset_auto_ 20	\N	1	[{"step": "Vérification visuelle générale", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Nettoyage et lubrification", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Contrôle des fixations", "order": 3, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test de fonctionnement", "order": 4, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-01 18:14:18.330641+00	2026-02-01 18:14:18.330641+00
22	mission_1769969658326_0p7r6za8g	REPARATION	asset_auto_ 20	\N	3	[{"step": "Diagnostic du défaut", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Remplacement pièce", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test après réparation", "order": 3, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-01 18:14:18.33143+00	2026-02-01 18:14:18.33143+00
23	mission_1769969858676_rw6w5cysz	MAINTENANCE	asset_auto_  9	entry-7f564c25a24e060f9cfcd4594376ac71.js:13390 [TRPC] Using API base URL: https://api.in-spectra.com\nentry-7f564c25a24e060f9cfcd4594376ac71.js:14069 [expo-notifications] Listening to push token changes is not yet fully supported on web. Adding a listener will have no effect.\naddListener @ entry-7f564c25a24e060f9cfcd4594376ac71.js:14069\n_e.addPushTokenListener @ entry-7f564c25a24e060f9cfcd4594376ac71.js:14082\njc @ entry-7f564c25a24e060f9cfcd4594376ac71.js:539\nHc @ entry-7f564c25a24e060f9cfcd4594376ac71.js:539\n(anonymous) @ entry-7f564c25a24e060f9cfcd4594376ac71.js:539\n	1	[{"step": "Vérification visuelle générale", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Nettoyage et lubrification", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Contrôle des fixations", "order": 3, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test de fonctionnement", "order": 4, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-01 18:17:38.681624+00	2026-02-01 18:18:07.844464+00
24	mission_1769969858676_rw6w5cysz	REPARATION	asset_auto_ 29	enregientry-7f564c25a24e060f9cfcd4594376ac71.js:13390 [TRPC] Using API base URL: https://api.in-spectra.com\nentry-7f564c25a24e060f9cfcd4594376ac71.js:14069 [expo-notifications] Listening to push token changes is not yet fully supported on web. Adding a listener will have no effect.\naddListener @ entry-7f564c25a24e060f9cfcd4594376ac71.js:14069\n_e.addPushTokenListener @ entry-7f564c25a24e060f9cfcd4594376ac71.js:14082\n	3	[{"step": "Diagnostic du défaut", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Remplacement pièce", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test après réparation", "order": 3, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-01 18:17:38.682737+00	2026-02-01 18:18:29.109177+00
25	mission_1770013985055_qacyq9m3y	MAINTENANCE	asset_auto_  2	\N	1	[{"step": "Vérification visuelle générale", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Nettoyage et lubrification", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Contrôle des fixations", "order": 3, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test de fonctionnement", "order": 4, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-02 06:33:05.071683+00	2026-02-02 06:33:05.071683+00
26	mission_1770013985055_qacyq9m3y	MAINTENANCE	asset_auto_ 22	\N	1	[{"step": "Vérification visuelle générale", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Nettoyage et lubrification", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Contrôle des fixations", "order": 3, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test de fonctionnement", "order": 4, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-02 06:33:05.076277+00	2026-02-02 06:33:05.076277+00
27	mission_1770013985055_qacyq9m3y	MAINTENANCE	asset_auto_ 42	\N	1	[{"step": "Vérification visuelle générale", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Nettoyage et lubrification", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Contrôle des fixations", "order": 3, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test de fonctionnement", "order": 4, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-02 06:33:05.077128+00	2026-02-02 06:33:05.077128+00
28	mission_1770013985055_qacyq9m3y	INSPECTION	asset_auto_ 22	\N	2	[{"step": "Vérification de la structure", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Contrôle des dispositifs de sécurité", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test des systèmes de levage", "order": 3, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Validation finale", "order": 4, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-02 06:33:05.077913+00	2026-02-02 06:33:05.077913+00
29	mission_1770013985055_qacyq9m3y	INSPECTION	asset_auto_ 42	\N	2	[{"step": "Vérification de la structure", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Contrôle des dispositifs de sécurité", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test des systèmes de levage", "order": 3, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Validation finale", "order": 4, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-02 06:33:05.078602+00	2026-02-02 06:33:05.078602+00
30	mission_1770013985055_qacyq9m3y	INSPECTION	asset_auto_ 62	\N	2	[{"step": "Vérification de la structure", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Contrôle des dispositifs de sécurité", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test des systèmes de levage", "order": 3, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Validation finale", "order": 4, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-02 06:33:05.079342+00	2026-02-02 06:33:05.079342+00
31	mission_1770013985055_qacyq9m3y	MODIFICATION	asset_auto_  2	\N	\N	[]	2026-02-02 06:33:05.080093+00	2026-02-02 06:33:05.080093+00
32	mission_1770013985055_qacyq9m3y	MODIFICATION	asset_auto_ 22	\N	\N	[]	2026-02-02 06:33:05.080541+00	2026-02-02 06:33:05.080541+00
33	mission_1770014067547_14youk10j	MAINTENANCE	asset_auto_ 20	Vidange	1	[{"step": "Vérification visuelle générale", "order": 1, "checked": true, "checked_at": "2026-02-02T06:35:17.893Z", "checked_by": "ask73lu4x9goczo7"}, {"step": "Nettoyage et lubrification", "order": 2, "checked": true, "checked_at": "2026-02-02T06:35:18.794Z", "checked_by": "ask73lu4x9goczo7"}, {"step": "Contrôle des fixations", "order": 3, "checked": true, "checked_at": "2026-02-02T06:35:19.679Z", "checked_by": "ask73lu4x9goczo7"}, {"step": "Test de fonctionnement", "order": 4, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-02 06:34:27.551394+00	2026-02-02 06:35:19.67569+00
35	mission_1770015788987_01gfmqubo	MODIFICATION	asset_auto_ 80	\N	\N	[]	2026-02-02 07:03:08.992894+00	2026-02-02 07:03:08.992894+00
34	mission_1770015788987_01gfmqubo	MAINTENANCE	asset_auto_ 20	\N	1	[{"step": "Vérification visuelle générale", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Nettoyage et lubrification", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Contrôle des fixations", "order": 3, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test de fonctionnement", "order": 4, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-02 07:03:08.992338+00	2026-02-02 07:03:29.559572+00
37	mission_1770033915699_l1iprjn6y	INSPECTION	asset_auto_ 82	\N	2	[{"step": "Vérification de la structure", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Contrôle des dispositifs de sécurité", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test des systèmes de levage", "order": 3, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Validation finale", "order": 4, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-02 12:05:15.706198+00	2026-02-02 12:05:15.706198+00
36	mission_1770033915699_l1iprjn6y	MAINTENANCE	asset_auto_  2	\N	1	[{"step": "Vérification visuelle générale", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Nettoyage et lubrification", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test de fonctionnement", "order": 3, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-02 12:05:15.70532+00	2026-02-02 12:05:32.828976+00
38	mission_1770131846986_ul5lheh57	MAINTENANCE	asset_auto_ 20	\N	1	[{"step": "Vérification visuelle générale", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Nettoyage et lubrification", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Contrôle des fixations", "order": 3, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test de fonctionnement", "order": 4, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-03 15:17:26.995417+00	2026-02-03 15:17:26.995417+00
39	mission_1770131846986_ul5lheh57	MAINTENANCE	asset_auto_ 40	\N	1	[{"step": "Vérification visuelle générale", "order": 1, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Nettoyage et lubrification", "order": 2, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Contrôle des fixations", "order": 3, "checked": false, "checked_at": null, "checked_by": null}, {"step": "Test de fonctionnement", "order": 4, "checked": false, "checked_at": null, "checked_by": null}]	2026-02-03 15:17:26.997996+00	2026-02-03 15:17:26.997996+00
40	mission_1770131846986_ul5lheh57	MODIFICATION	asset_auto_ 20	\N	\N	[]	2026-02-03 15:17:26.998635+00	2026-02-03 15:17:26.998635+00
\.


--
-- Data for Name: mission_operations; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.mission_operations (id, mission_id, operation_type, sort_order, created_at) FROM stdin;
mo_1769959475788_uswhcyxfk	mission_1769959475784_wu87afztm	MAINTENANCE	0	2026-02-01 15:24:35.784+00
mo_1769960596847_i2pjvptl4	mission_1769960596842_ltheqbl9q	MAINTENANCE	0	2026-02-01 15:43:16.842+00
mo_1769960596848_s37kg6oai	mission_1769960596842_ltheqbl9q	MODIFICATION	1	2026-02-01 15:43:16.842+00
mo_1769962379559_byj2fe9vp	mission_1769962379554_nqncv8gb4	MAINTENANCE	0	2026-02-01 16:12:59.554+00
mo_1769962379560_2p8ahv67s	mission_1769962379554_nqncv8gb4	MODIFICATION	1	2026-02-01 16:12:59.554+00
mo_1769962526764_e245ce56x	mission_1769962526760_a5rn7cx34	MAINTENANCE	0	2026-02-01 16:15:26.76+00
mo_1769962526765_slnbkpf3g	mission_1769962526760_a5rn7cx34	REPARATION	1	2026-02-01 16:15:26.76+00
mo_1769963293860_qa27e4qea	mission_1769963293854_4yaljh501	MAINTENANCE	0	2026-02-01 16:28:13.854+00
mo_1769963293860_klj546x13	mission_1769963293854_4yaljh501	REPARATION	1	2026-02-01 16:28:13.854+00
mo_1769968453382_ayvbih6rw	mission_1769968453373_b89r7da2f	MAINTENANCE	0	2026-02-01 17:54:13.373+00
mo_1769968453383_eivjewezi	mission_1769968453373_b89r7da2f	REPARATION	1	2026-02-01 17:54:13.373+00
mo_1769969628294_chtj81y7a	mission_1769969628290_owi3tosb5	MAINTENANCE	0	2026-02-01 18:13:48.29+00
mo_1769969628295_y9k6gc5yb	mission_1769969628290_owi3tosb5	INSPECTION	1	2026-02-01 18:13:48.29+00
mo_1769969658328_l46xgminf	mission_1769969658326_0p7r6za8g	MAINTENANCE	0	2026-02-01 18:14:18.326+00
mo_1769969658329_kw46z0zjt	mission_1769969658326_0p7r6za8g	REPARATION	1	2026-02-01 18:14:18.326+00
mo_1769969858679_e6tnn9lnh	mission_1769969858676_rw6w5cysz	MAINTENANCE	0	2026-02-01 18:17:38.676+00
mo_1769969858680_onr558nfs	mission_1769969858676_rw6w5cysz	REPARATION	1	2026-02-01 18:17:38.676+00
mo_1770013985065_1ycbkim59	mission_1770013985055_qacyq9m3y	MAINTENANCE	0	2026-02-02 06:33:05.055+00
mo_1770013985067_ug4dzxn0e	mission_1770013985055_qacyq9m3y	MODIFICATION	1	2026-02-02 06:33:05.055+00
mo_1770013985067_js90zapnz	mission_1770013985055_qacyq9m3y	INSPECTION	2	2026-02-02 06:33:05.055+00
mo_1770014067549_wkpfn2j4n	mission_1770014067547_14youk10j	MAINTENANCE	0	2026-02-02 06:34:27.547+00
mo_1770015788990_4sxm72fdy	mission_1770015788987_01gfmqubo	MAINTENANCE	0	2026-02-02 07:03:08.987+00
mo_1770015788991_9qzjboys8	mission_1770015788987_01gfmqubo	MODIFICATION	1	2026-02-02 07:03:08.987+00
mo_1770033915703_4szyinb6u	mission_1770033915699_l1iprjn6y	MAINTENANCE	0	2026-02-02 12:05:15.699+00
mo_1770033915703_t74apibxp	mission_1770033915699_l1iprjn6y	INSPECTION	1	2026-02-02 12:05:15.699+00
mo_1770131846992_gzbdoak3n	mission_1770131846986_ul5lheh57	MAINTENANCE	0	2026-02-03 15:17:26.987+00
mo_1770131846993_k2bllwgdv	mission_1770131846986_ul5lheh57	MODIFICATION	1	2026-02-03 15:17:26.987+00
\.


--
-- Data for Name: mission_technicians; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.mission_technicians (id, mission_id, technician_id, assigned_at) FROM stdin;
mt_1769959475787_vpwdo50s8	mission_1769959475784_wu87afztm	usr_1f6ea3de788b	2026-02-01 15:24:35.784+00
mt_1769960596846_c13ekvagr	mission_1769960596842_ltheqbl9q	usr_1f6ea3de788b	2026-02-01 15:43:16.842+00
mt_1769960596847_e8q2btb74	mission_1769960596842_ltheqbl9q	usr_8b9807a0dfcf	2026-02-01 15:43:16.842+00
mt_1769962379558_kau1c1bjp	mission_1769962379554_nqncv8gb4	usr_1f6ea3de788b	2026-02-01 16:12:59.554+00
mt_1769962526763_imdpeej68	mission_1769962526760_a5rn7cx34	usr_1f6ea3de788b	2026-02-01 16:15:26.76+00
mt_1769962526764_lcvyweojj	mission_1769962526760_a5rn7cx34	usr_8b9807a0dfcf	2026-02-01 16:15:26.76+00
mt_1769963293859_dhf6hf5by	mission_1769963293854_4yaljh501	usr_1f6ea3de788b	2026-02-01 16:28:13.854+00
mt_1769963293860_92x6ni7mf	mission_1769963293854_4yaljh501	usr_8b9807a0dfcf	2026-02-01 16:28:13.854+00
mt_1769968453379_vgrxkx883	mission_1769968453373_b89r7da2f	usr_1f6ea3de788b	2026-02-01 17:54:13.373+00
mt_1769968453381_2ta54yh6a	mission_1769968453373_b89r7da2f	usr_admin_lolo	2026-02-01 17:54:13.373+00
mt_1769969628294_mf5gqhn0h	mission_1769969628290_owi3tosb5	usr_1f6ea3de788b	2026-02-01 18:13:48.29+00
mt_1769969628294_grrhylsum	mission_1769969628290_owi3tosb5	usr_8b9807a0dfcf	2026-02-01 18:13:48.29+00
mt_1769969658328_u2ring1mv	mission_1769969658326_0p7r6za8g	usr_1f6ea3de788b	2026-02-01 18:14:18.326+00
mt_1769969658328_mwhs9cxuo	mission_1769969658326_0p7r6za8g	usr_8b9807a0dfcf	2026-02-01 18:14:18.326+00
mt_1769969858678_t6mq81tt1	mission_1769969858676_rw6w5cysz	usr_1f6ea3de788b	2026-02-01 18:17:38.676+00
mt_1769969858679_w7tdzxkyx	mission_1769969858676_rw6w5cysz	usr_8b9807a0dfcf	2026-02-01 18:17:38.676+00
mt_1770013985062_1kv0x324x	mission_1770013985055_qacyq9m3y	usr_1f6ea3de788b	2026-02-02 06:33:05.055+00
mt_1770013985064_37vytl8gv	mission_1770013985055_qacyq9m3y	usr_8b9807a0dfcf	2026-02-02 06:33:05.055+00
mt_1770014067549_dhesfilwj	mission_1770014067547_14youk10j	ask73lu4x9goczo7	2026-02-02 06:34:27.547+00
mt_1770015788989_lso4m4wl2	mission_1770015788987_01gfmqubo	usr_8d916d6dbf30	2026-02-02 07:03:08.987+00
mt_1770015788990_2890m4xhn	mission_1770015788987_01gfmqubo	usr_admin_lolo	2026-02-02 07:03:08.987+00
mt_1770033915702_qqzyz81lr	mission_1770033915699_l1iprjn6y	usr_1f6ea3de788b	2026-02-02 12:05:15.699+00
mt_1770033915702_ojo2nkw1p	mission_1770033915699_l1iprjn6y	usr_8b9807a0dfcf	2026-02-02 12:05:15.699+00
mt_1770131846991_3mdng3qsw	mission_1770131846986_ul5lheh57	usr_1f6ea3de788b	2026-02-03 15:17:26.987+00
mt_1770131846992_z04j5clhk	mission_1770131846986_ul5lheh57	usr_8b9807a0dfcf	2026-02-03 15:17:26.987+00
\.


--
-- Data for Name: missions; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.missions (id, control_type_id, scheduled_at, assigned_to, status, site_id, created_at) FROM stdin;
ms_vgp_plieuse_2026	ctl_vgp_press	2026-01-15 08:00:00+00	usr_tech	A_PLANIFIER	site_angers	2026-01-25 18:14:37.541077+00
ms_vgp_chariot_2026	ctl_vgp_chariot	2026-03-10 09:00:00+00	usr_tech	A_PLANIFIER	site_angers	2026-01-25 18:14:37.541077+00
ms_asset_plieuse_vgp_press	ctl_vgp_press	2026-02-08 18:19:06.565506+00	usr_tech	A_PLANIFIER	site_angers	2026-01-25 18:19:06.565506+00
ms_asset_injection_vgp_press	ctl_vgp_press	2026-02-08 18:20:06.565506+00	usr_tech	A_PLANIFIER	site_angers	2026-01-25 18:19:06.565506+00
ms_asset_auto_  1_vgp_press	ctl_vgp_press	2026-02-08 18:21:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 1	2026-01-25 18:19:06.565506+00
ms_asset_auto_  2_vgp_press	ctl_vgp_press	2026-02-08 18:22:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 2	2026-01-25 18:19:06.565506+00
ms_asset_auto_  6_vgp_press	ctl_vgp_press	2026-02-08 18:23:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 6	2026-01-25 18:19:06.565506+00
ms_asset_auto_  7_vgp_press	ctl_vgp_press	2026-02-08 18:24:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 7	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 11_vgp_press	ctl_vgp_press	2026-02-08 18:25:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 3	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 12_vgp_press	ctl_vgp_press	2026-02-08 18:26:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 4	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 16_vgp_press	ctl_vgp_press	2026-02-08 18:27:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 8	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 17_vgp_press	ctl_vgp_press	2026-02-08 18:28:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 1	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 21_vgp_press	ctl_vgp_press	2026-02-08 18:29:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 5	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 22_vgp_press	ctl_vgp_press	2026-02-08 18:30:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 6	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 26_vgp_press	ctl_vgp_press	2026-02-08 18:31:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 2	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 27_vgp_press	ctl_vgp_press	2026-02-08 18:32:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 3	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 31_vgp_press	ctl_vgp_press	2026-02-08 18:33:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 7	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 32_vgp_press	ctl_vgp_press	2026-02-08 18:34:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 8	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 36_vgp_press	ctl_vgp_press	2026-02-08 18:35:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 4	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 37_vgp_press	ctl_vgp_press	2026-02-08 18:36:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 5	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 41_vgp_press	ctl_vgp_press	2026-02-08 18:37:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 1	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 42_vgp_press	ctl_vgp_press	2026-02-08 18:38:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 2	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 46_vgp_press	ctl_vgp_press	2026-02-08 18:39:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 6	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 47_vgp_press	ctl_vgp_press	2026-02-08 18:40:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 7	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 51_vgp_press	ctl_vgp_press	2026-02-08 18:41:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 3	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 52_vgp_press	ctl_vgp_press	2026-02-08 18:42:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 4	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 56_vgp_press	ctl_vgp_press	2026-02-08 18:43:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 8	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 57_vgp_press	ctl_vgp_press	2026-02-08 18:44:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 1	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 61_vgp_press	ctl_vgp_press	2026-02-08 18:45:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 5	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 62_vgp_press	ctl_vgp_press	2026-02-08 18:46:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 6	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 66_vgp_press	ctl_vgp_press	2026-02-08 18:47:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 2	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 67_vgp_press	ctl_vgp_press	2026-02-08 18:48:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 3	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 71_vgp_press	ctl_vgp_press	2026-02-08 18:49:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 7	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 72_vgp_press	ctl_vgp_press	2026-02-08 18:50:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 8	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 76_vgp_press	ctl_vgp_press	2026-02-08 18:51:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 4	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 77_vgp_press	ctl_vgp_press	2026-02-08 18:52:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 5	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 81_vgp_press	ctl_vgp_press	2026-02-08 18:53:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 1	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 82_vgp_press	ctl_vgp_press	2026-02-08 18:54:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 2	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 86_vgp_press	ctl_vgp_press	2026-02-08 18:55:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 6	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 87_vgp_press	ctl_vgp_press	2026-02-08 18:56:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 7	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 91_vgp_press	ctl_vgp_press	2026-02-08 18:57:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 3	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 92_vgp_press	ctl_vgp_press	2026-02-08 18:58:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 4	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 96_vgp_press	ctl_vgp_press	2026-02-08 18:59:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 8	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 97_vgp_press	ctl_vgp_press	2026-02-08 19:00:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 1	2026-01-25 18:19:06.565506+00
ms_asset_chariot_vgp_chariot	ctl_vgp_chariot	2026-02-08 19:01:06.565506+00	usr_tech	A_PLANIFIER	site_angers	2026-01-25 18:19:06.565506+00
ms_asset_auto_  3_vgp_chariot	ctl_vgp_chariot	2026-02-08 19:02:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 3	2026-01-25 18:19:06.565506+00
ms_asset_auto_  8_vgp_chariot	ctl_vgp_chariot	2026-02-08 19:03:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 8	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 13_vgp_chariot	ctl_vgp_chariot	2026-02-08 19:04:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 5	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 18_vgp_chariot	ctl_vgp_chariot	2026-02-08 19:05:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 2	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 23_vgp_chariot	ctl_vgp_chariot	2026-02-08 19:06:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 7	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 28_vgp_chariot	ctl_vgp_chariot	2026-02-08 19:07:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 4	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 33_vgp_chariot	ctl_vgp_chariot	2026-02-08 19:08:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 1	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 38_vgp_chariot	ctl_vgp_chariot	2026-02-08 19:09:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 6	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 43_vgp_chariot	ctl_vgp_chariot	2026-02-08 19:10:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 3	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 48_vgp_chariot	ctl_vgp_chariot	2026-02-08 19:11:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 8	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 53_vgp_chariot	ctl_vgp_chariot	2026-02-08 19:12:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 5	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 58_vgp_chariot	ctl_vgp_chariot	2026-02-08 19:13:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 2	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 63_vgp_chariot	ctl_vgp_chariot	2026-02-08 19:14:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 7	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 68_vgp_chariot	ctl_vgp_chariot	2026-02-08 19:15:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 4	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 73_vgp_chariot	ctl_vgp_chariot	2026-02-08 19:16:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 1	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 78_vgp_chariot	ctl_vgp_chariot	2026-02-08 19:17:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 6	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 83_vgp_chariot	ctl_vgp_chariot	2026-02-08 19:18:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 3	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 88_vgp_chariot	ctl_vgp_chariot	2026-02-08 19:19:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 8	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 93_vgp_chariot	ctl_vgp_chariot	2026-02-08 19:20:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 5	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 98_vgp_chariot	ctl_vgp_chariot	2026-02-08 19:21:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 2	2026-01-25 18:19:06.565506+00
ms_asset_plieuse_prev	ctl_prev_maint	2026-02-08 19:22:06.565506+00	usr_tech	A_PLANIFIER	site_angers	2026-01-25 18:19:06.565506+00
ms_asset_injection_prev	ctl_prev_maint	2026-02-08 19:23:06.565506+00	usr_tech	A_PLANIFIER	site_angers	2026-01-25 18:19:06.565506+00
ms_asset_chariot_prev	ctl_prev_maint	2026-02-08 19:24:06.565506+00	usr_tech	A_PLANIFIER	site_angers	2026-01-25 18:19:06.565506+00
ms_asset_auto_  1_prev	ctl_prev_maint	2026-02-08 19:25:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 1	2026-01-25 18:19:06.565506+00
ms_asset_auto_  2_prev	ctl_prev_maint	2026-02-08 19:26:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 2	2026-01-25 18:19:06.565506+00
ms_asset_auto_  3_prev	ctl_prev_maint	2026-02-08 19:27:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 3	2026-01-25 18:19:06.565506+00
ms_asset_auto_  4_prev	ctl_prev_maint	2026-02-08 19:28:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 4	2026-01-25 18:19:06.565506+00
ms_asset_auto_  5_prev	ctl_prev_maint	2026-02-08 19:29:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 5	2026-01-25 18:19:06.565506+00
ms_asset_auto_  6_prev	ctl_prev_maint	2026-02-08 19:30:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 6	2026-01-25 18:19:06.565506+00
ms_asset_auto_  7_prev	ctl_prev_maint	2026-02-08 19:31:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 7	2026-01-25 18:19:06.565506+00
ms_asset_auto_  8_prev	ctl_prev_maint	2026-02-08 19:32:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 8	2026-01-25 18:19:06.565506+00
ms_asset_auto_  9_prev	ctl_prev_maint	2026-02-08 19:33:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 1	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 10_prev	ctl_prev_maint	2026-02-08 19:34:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 2	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 11_prev	ctl_prev_maint	2026-02-08 19:35:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 3	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 12_prev	ctl_prev_maint	2026-02-08 19:36:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 4	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 13_prev	ctl_prev_maint	2026-02-08 19:37:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 5	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 14_prev	ctl_prev_maint	2026-02-08 19:38:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 6	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 15_prev	ctl_prev_maint	2026-02-08 19:39:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 7	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 16_prev	ctl_prev_maint	2026-02-08 19:40:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 8	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 17_prev	ctl_prev_maint	2026-02-08 19:41:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 1	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 18_prev	ctl_prev_maint	2026-02-08 19:42:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 2	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 19_prev	ctl_prev_maint	2026-02-08 19:43:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 3	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 20_prev	ctl_prev_maint	2026-02-08 19:44:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 4	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 21_prev	ctl_prev_maint	2026-02-08 19:45:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 5	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 22_prev	ctl_prev_maint	2026-02-08 19:46:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 6	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 23_prev	ctl_prev_maint	2026-02-08 19:47:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 7	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 24_prev	ctl_prev_maint	2026-02-08 19:48:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 8	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 25_prev	ctl_prev_maint	2026-02-08 19:49:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 1	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 26_prev	ctl_prev_maint	2026-02-08 19:50:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 2	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 27_prev	ctl_prev_maint	2026-02-08 19:51:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 3	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 28_prev	ctl_prev_maint	2026-02-08 19:52:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 4	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 29_prev	ctl_prev_maint	2026-02-08 19:53:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 5	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 30_prev	ctl_prev_maint	2026-02-08 19:54:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 6	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 31_prev	ctl_prev_maint	2026-02-08 19:55:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 7	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 32_prev	ctl_prev_maint	2026-02-08 19:56:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 8	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 33_prev	ctl_prev_maint	2026-02-08 19:57:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 1	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 34_prev	ctl_prev_maint	2026-02-08 19:58:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 2	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 35_prev	ctl_prev_maint	2026-02-08 19:59:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 3	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 36_prev	ctl_prev_maint	2026-02-08 20:00:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 4	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 37_prev	ctl_prev_maint	2026-02-08 20:01:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 5	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 38_prev	ctl_prev_maint	2026-02-08 20:02:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 6	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 39_prev	ctl_prev_maint	2026-02-08 20:03:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 7	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 40_prev	ctl_prev_maint	2026-02-08 20:04:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 8	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 41_prev	ctl_prev_maint	2026-02-08 20:05:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 1	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 42_prev	ctl_prev_maint	2026-02-08 20:06:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 2	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 43_prev	ctl_prev_maint	2026-02-08 20:07:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 3	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 44_prev	ctl_prev_maint	2026-02-08 20:08:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 4	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 45_prev	ctl_prev_maint	2026-02-08 20:09:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 5	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 46_prev	ctl_prev_maint	2026-02-08 20:10:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 6	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 47_prev	ctl_prev_maint	2026-02-08 20:11:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 7	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 48_prev	ctl_prev_maint	2026-02-08 20:12:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 8	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 49_prev	ctl_prev_maint	2026-02-08 20:13:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 1	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 50_prev	ctl_prev_maint	2026-02-08 20:14:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 2	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 51_prev	ctl_prev_maint	2026-02-08 20:15:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 3	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 52_prev	ctl_prev_maint	2026-02-08 20:16:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 4	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 53_prev	ctl_prev_maint	2026-02-08 20:17:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 5	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 54_prev	ctl_prev_maint	2026-02-08 20:18:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 6	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 55_prev	ctl_prev_maint	2026-02-08 20:19:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 7	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 56_prev	ctl_prev_maint	2026-02-08 20:20:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 8	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 57_prev	ctl_prev_maint	2026-02-08 20:21:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 1	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 58_prev	ctl_prev_maint	2026-02-08 20:22:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 2	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 59_prev	ctl_prev_maint	2026-02-08 20:23:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 3	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 60_prev	ctl_prev_maint	2026-02-08 20:24:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 4	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 61_prev	ctl_prev_maint	2026-02-08 20:25:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 5	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 62_prev	ctl_prev_maint	2026-02-08 20:26:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 6	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 63_prev	ctl_prev_maint	2026-02-08 20:27:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 7	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 64_prev	ctl_prev_maint	2026-02-08 20:28:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 8	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 65_prev	ctl_prev_maint	2026-02-08 20:29:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 1	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 66_prev	ctl_prev_maint	2026-02-08 20:30:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 2	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 67_prev	ctl_prev_maint	2026-02-08 20:31:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 3	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 68_prev	ctl_prev_maint	2026-02-08 20:32:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 4	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 69_prev	ctl_prev_maint	2026-02-08 20:33:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 5	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 70_prev	ctl_prev_maint	2026-02-08 20:34:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 6	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 71_prev	ctl_prev_maint	2026-02-08 20:35:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 7	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 72_prev	ctl_prev_maint	2026-02-08 20:36:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 8	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 73_prev	ctl_prev_maint	2026-02-08 20:37:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 1	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 74_prev	ctl_prev_maint	2026-02-08 20:38:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 2	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 75_prev	ctl_prev_maint	2026-02-08 20:39:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 3	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 76_prev	ctl_prev_maint	2026-02-08 20:40:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 4	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 77_prev	ctl_prev_maint	2026-02-08 20:41:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 5	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 78_prev	ctl_prev_maint	2026-02-08 20:42:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 6	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 79_prev	ctl_prev_maint	2026-02-08 20:43:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 7	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 80_prev	ctl_prev_maint	2026-02-08 20:44:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 8	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 81_prev	ctl_prev_maint	2026-02-08 20:45:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 1	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 82_prev	ctl_prev_maint	2026-02-08 20:46:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 2	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 83_prev	ctl_prev_maint	2026-02-08 20:47:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 3	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 84_prev	ctl_prev_maint	2026-02-08 20:48:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 4	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 85_prev	ctl_prev_maint	2026-02-08 20:49:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 5	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 86_prev	ctl_prev_maint	2026-02-08 20:50:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 6	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 87_prev	ctl_prev_maint	2026-02-08 20:51:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 7	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 88_prev	ctl_prev_maint	2026-02-08 20:52:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 8	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 89_prev	ctl_prev_maint	2026-02-08 20:53:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 1	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 90_prev	ctl_prev_maint	2026-02-08 20:54:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 2	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 91_prev	ctl_prev_maint	2026-02-08 20:55:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 3	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 92_prev	ctl_prev_maint	2026-02-08 20:56:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 4	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 93_prev	ctl_prev_maint	2026-02-08 20:57:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 5	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 94_prev	ctl_prev_maint	2026-02-08 20:58:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 6	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 95_prev	ctl_prev_maint	2026-02-08 20:59:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 7	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 96_prev	ctl_prev_maint	2026-02-08 21:00:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 8	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 97_prev	ctl_prev_maint	2026-02-08 21:01:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 1	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 98_prev	ctl_prev_maint	2026-02-08 21:02:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 2	2026-01-25 18:19:06.565506+00
ms_asset_auto_ 99_prev	ctl_prev_maint	2026-02-08 21:03:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 3	2026-01-25 18:19:06.565506+00
ms_asset_auto_100_prev	ctl_prev_maint	2026-02-08 21:04:06.565506+00	usr_tech	A_PLANIFIER	site_auto_ 4	2026-01-25 18:19:06.565506+00
mission_1769959447720_3ukbvw38z	\N	2026-02-03 00:00:00+00	usr_1f6ea3de788b	PLANIFIEE	site_angers	2026-02-01 15:24:07.72+00
mission_1769959451876_8m51hncvx	\N	2026-02-03 00:00:00+00	usr_1f6ea3de788b	PLANIFIEE	site_angers	2026-02-01 15:24:11.876+00
mission_1769959475784_wu87afztm	\N	2026-02-03 00:00:00+00	usr_1f6ea3de788b	PLANIFIEE	site_angers	2026-02-01 15:24:35.784+00
mission_1769960596842_ltheqbl9q	\N	2026-02-01 00:00:00+00	usr_1f6ea3de788b	PLANIFIEE	site_psa_rennes	2026-02-01 15:43:16.842+00
mission_1769962379554_nqncv8gb4	\N	2026-02-01 00:00:00+00	usr_1f6ea3de788b	PLANIFIEE	site_angers	2026-02-01 16:12:59.554+00
mission_1769962526760_a5rn7cx34	\N	2026-02-01 00:00:00+00	usr_1f6ea3de788b	PLANIFIEE	site_angers	2026-02-01 16:15:26.76+00
mission_1769963293854_4yaljh501	\N	2026-02-01 00:00:00+00	usr_1f6ea3de788b	PLANIFIEE	site_angers	2026-02-01 16:28:13.854+00
mission_1769968453373_b89r7da2f	\N	2026-02-01 00:00:00+00	usr_1f6ea3de788b	PLANIFIEE	site_angers	2026-02-01 17:54:13.373+00
mission_1769969628290_owi3tosb5	\N	2026-02-01 00:00:00+00	usr_1f6ea3de788b	PLANIFIEE	site_arkema_lacq	2026-02-01 18:13:48.29+00
mission_1769969658326_0p7r6za8g	\N	2026-02-01 00:00:00+00	usr_1f6ea3de788b	PLANIFIEE	site_angers	2026-02-01 18:14:18.326+00
mission_1769969858676_rw6w5cysz	\N	2026-02-01 00:00:00+00	usr_1f6ea3de788b	PLANIFIEE	site_auto_ 8	2026-02-01 18:17:38.676+00
mission_1770013985055_qacyq9m3y	\N	2026-02-02 00:00:00+00	usr_1f6ea3de788b	PLANIFIEE	site_arkema_lacq	2026-02-02 06:33:05.055+00
mission_1770014067547_14youk10j	\N	2026-02-02 00:00:00+00	ask73lu4x9goczo7	PLANIFIEE	site_angers	2026-02-02 06:34:27.547+00
mission_1770015788987_01gfmqubo	\N	2026-02-02 00:00:00+00	usr_8d916d6dbf30	PLANIFIEE	site_angers	2026-02-02 07:03:08.987+00
mission_1770033915699_l1iprjn6y	\N	2026-02-02 00:00:00+00	usr_1f6ea3de788b	PLANIFIEE	site_arkema_lacq	2026-02-02 12:05:15.699+00
mission_1770131846986_ul5lheh57	\N	2026-02-03 00:00:00+00	usr_1f6ea3de788b	PLANIFIEE	site_angers	2026-02-03 15:17:26.987+00
\.


--
-- Data for Name: nonconformities; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.nonconformities (id, report_id, asset_id, checklist_item_id, title, description, severity, status, created_at) FROM stdin;
test-nc-002	\N	asset_auto_  8	\N	Test NC	Test description	3	OUVERTE	2025-02-01 00:45:00+00
nc_824c9eae-4592-4e70-b8bd-ba8773f436f5	\N	asset_auto_  8	\N	Test NC auto-gen	Test création simplifiée	2	OUVERTE	2026-02-01 00:45:25.289+00
nc_47813270-f6e1-45c1-ae07-b5940c6c08fe	\N	asset_auto_  8	\N	Test NC depuis frontend fix	Devrait maintenant apparaître	3	OUVERTE	2026-02-01 01:13:50.039+00
nc_d4d25a77-dfc3-4590-9597-134750162c78	\N	asset_auto_  3	\N	Test modification admin	qyery yeq(yr(y yq(y(qy(y	2	EN_COURS	2026-02-01 01:22:25.548+00
nc_a1bc2bc5-02dd-45e7-978a-2e5391156a8c	\N	asset_auto_  1	\N	test laurent	ici la description du probleme	4	EN_COURS	2026-02-01 01:14:57.311+00
\.


--
-- Data for Name: operation_checklists; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.operation_checklists (id, operation_type, name, description, steps, created_at, updated_at) FROM stdin;
1	MAINTENANCE	Maintenance Préventive Standard	Checklist standard pour maintenance préventive	[{"step": "Vérification visuelle générale", "order": 1}, {"step": "Nettoyage et lubrification", "order": 2}, {"step": "Contrôle des fixations", "order": 3}, {"step": "Test de fonctionnement", "order": 4}]	2026-02-01 16:05:23.171806+00	2026-02-01 16:05:23.171806+00
2	INSPECTION	Inspection Réglementaire	Checklist pour inspection VGP	[{"step": "Vérification de la structure", "order": 1}, {"step": "Contrôle des dispositifs de sécurité", "order": 2}, {"step": "Test des systèmes de levage", "order": 3}, {"step": "Validation finale", "order": 4}]	2026-02-01 16:05:23.171806+00	2026-02-01 16:05:23.171806+00
3	REPARATION	Intervention Corrective	Checklist pour réparation	[{"step": "Diagnostic du défaut", "order": 1}, {"step": "Remplacement pièce", "order": 2}, {"step": "Test après réparation", "order": 3}]	2026-02-01 16:05:23.171806+00	2026-02-01 16:05:23.171806+00
\.


--
-- Data for Name: outbox; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.outbox (id, type, payload_json, created_at, status, last_error) FROM stdin;
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.password_reset_tokens (user_id, token, expires_at, created_at) FROM stdin;
usr_admin_lolo	1605338743389b0b3e0e23f717954eae9c7ea6d57f4d736102422483ce3c7497	2026-01-31 16:22:48.559+00	2026-01-31 15:22:48.572199+00
ask73lu4x9goczo7	1fee78fa400a3a327292112b63e617d1479401a200e74cf332cf00fccf1fe56b	2026-02-02 07:37:12.543+00	2026-02-02 06:37:12.543791+00
\.


--
-- Data for Name: report_item_results; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.report_item_results (id, report_id, checklist_item_id, status, value_num, value_text, comment) FROM stdin;
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.reports (id, mission_id, asset_id, performed_at, performer, conclusion, summary, signed_by_name, signed_at, created_at) FROM stdin;
\.


--
-- Data for Name: sites; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.sites (id, client_id, name, address, created_at) FROM stdin;
site_angers	cli_acme	Usine d'Angers	ZAC Industrielle, 49000 Angers	2026-01-25 18:14:37.532938+00
site_auto_ 1	cli_auto_ 1	Site de Production Lyon	99 Route de Genas, 69740 Genas	2026-01-25 18:15:48.05791+00
site_rt_venissieux	cli_auto_ 1	Usine Vénissieux	10 Boulevard Louis Seguin, 69200 Vénissieux	2026-01-28 21:03:12.127461+00
site_auto_ 2	cli_auto_ 2	Site Levallois-Perret	19 Avenue Jules Guesde, 92300 Levallois-Perret	2026-01-25 18:15:48.05791+00
site_po_compiegne	cli_auto_ 2	Usine Compiègne	ZI de Royallieu, 60200 Compiègne	2026-01-28 21:03:12.129148+00
site_po_sigmaringen	cli_auto_ 2	Site Sigmaringen Europe	Rue de la Zone Industrielle, 67116 Reichstett	2026-01-28 21:03:12.129148+00
site_auto_ 3	cli_auto_ 3	Site Villaroche	Rond-Point René Ravaud, 77550 Moissy-Cramayel	2026-01-25 18:15:48.05791+00
site_safran_colomiers	cli_auto_ 3	Usine Colomiers	Avenue Didier Daurat, 31770 Colomiers	2026-01-28 21:03:12.129983+00
site_auto_ 4	cli_auto_ 4	Site Mulhouse	68 Route de Strasbourg, 68100 Mulhouse	2026-01-25 18:15:48.05791+00
site_psa_sochaux	cli_auto_ 4	Site Sochaux-Montbéliard	1 Avenue de Manchester, 25600 Sochaux	2026-01-28 21:03:12.130838+00
site_psa_rennes	cli_auto_ 4	Site La Janais Rennes	ZI La Janais, 35000 Rennes	2026-01-28 21:03:12.130838+00
site_auto_ 5	cli_auto_ 5	Site Grenoble - Échirolles	38 Rue Joseph Fourier, 38130 Échirolles	2026-01-25 18:15:48.05791+00
site_se_carros	cli_auto_ 5	Usine Carros	ZI de Carros, 06510 Carros	2026-01-28 21:03:12.131614+00
site_auto_ 6	cli_auto_ 6	Site Cataroux	23 Place des Carmes Déchaux, 63000 Clermont-Ferrand	2026-01-25 18:15:48.05791+00
site_michelin_ladoux	cli_auto_ 6	Centre Technologique Ladoux	Route de Ladoux, 63118 Cébazat	2026-01-28 21:03:12.132237+00
site_michelin_troyes	cli_auto_ 6	Usine Troyes	Rue Gustave Eiffel, 10430 Rosières-près-Troyes	2026-01-28 21:03:12.132237+00
site_auto_ 7	cli_auto_ 7	Siège Paris	43 Rue Bayen, 75017 Paris	2026-01-25 18:15:48.05791+00
site_valeo_angers	cli_auto_ 7	Site Angers	1 Rue Gutenberg, 49070 Beaucouzé	2026-01-28 21:03:12.132811+00
site_auto_ 8	cli_auto_ 8	Site Pierre-Bénite	Route Nationale 86, 69310 Pierre-Bénite	2026-01-25 18:15:48.05791+00
site_arkema_lacq	cli_auto_ 8	Plateforme Lacq	Plateforme Chimique de Lacq, 64170 Lacq	2026-01-28 21:03:12.133369+00
\.


--
-- Data for Name: user_business_card; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.user_business_card (user_id, first_name, last_name, job_title, photo_url, email, phone, is_email_public, is_phone_public, public_token, public_enabled, created_at, updated_at) FROM stdin;
usr_8d916d6dbf30	Christian	Ceccato	\N	\N	christian.ceccato@groupeadf.com	\N	f	f	88df6416-f600-4f10-afd1-44f5f8e25483	t	2026-02-08 12:27:05.931642+00	2026-02-08 12:27:25.019873+00
usr_admin_lolo	Laurent	Stefanini	Technicien VGP	\N	laurentstefanini@gmail.com	+33615536691	t	t	99ce4206-d844-4730-bf84-19c7d0af1c15	t	2026-02-08 16:28:01.032365+00	2026-02-08 16:41:36.458535+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.users (id, email, name, role, token_mock, created_at, password_hash, must_change_password, password_updated_at, can_be_responsible) FROM stdin;
usr_tech	tech@acme.test	Technicien Maintenance	TECHNICIEN	\N	2026-01-25 18:14:37.535311+00	\N	f	\N	f
ask73lu4x9goczo7	sebastien.savasta@groupeadf.com	seb	TECHNICIAN	token_u5689f0vv2xctopu	2026-01-30 18:52:07.147+00	$2a$10$g3WHo4sBlrOUu9GgxW6pe.XP32UxEd8YdRH7JtAkF662UKZEbWcBq	t	\N	t
usr_8d916d6dbf30	christian.ceccato@groupeadf.com	Christian Ceccato	ADMIN	\N	2026-01-29 22:28:33.299138+00	$2a$10$NhjBuxqfKGDTnSrbOZZ5reeFUnSGPLegMLBB63nsXVBIt.CcyGCyy	t	2026-01-30 22:11:13.353123+00	t
usr_8b9807a0dfcf	aimad.hadiqa@groupeadf.com	Aimad Hadiqa	TECHNICIAN	\N	2026-01-29 22:28:33.299138+00	$2a$10$S/v7KAvvC6qxpvkTVIHCuOf4FKvopcgosDh87C.THbiI1dcsvAkUO	t	2026-01-30 22:48:04.257583+00	t
usr_1f6ea3de788b	adrien.feydel@groupeadf.com	Adrien Feydel	ADMIN	\N	2026-01-29 22:28:33.299138+00	$2a$10$l33weYINzSvqCbxpd2vnUOR1w7EAeNWhg0OV5tY9iU/N6h0dz.LhC	t	2026-01-30 22:49:27.448078+00	t
usr_admin_lolo	laurentstefanini@gmail.com	Laurent Stefanini	ADMIN	Loloadmin16	2026-01-25 18:19:06.556719+00	$2a$10$.3aU01.8Bu1OX1EzPLRlhuSz4Mhm.GiBUUWa00Gf7ZitskVfD1pVq	t	2026-01-30 22:56:34.407724+00	t
\.


--
-- Data for Name: vgp_inspection_runs; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.vgp_inspection_runs (id, report_id, template_id, asset_id, date_inspection, verificateur, compteur_type, compteur_valeur, conditions_intervention, modes_fonctionnement, moyens_disposition, conclusion, particularites, statut, signed_by, signed_at, created_at, updated_at) FROM stdin;
vgp_run_bogpmozitw4u6dul	vgp_rpt_tqu403act8cya035	vgp_tpl_presses_v1	asset_auto_  8	2026-01-29 16:58:07.403+00	Admin	\N	\N	\N	\N	t	EN_COURS	\N	BROUILLON	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_run_xygv7x3yt296jqas	vgp_rpt_uen7yd0g8rtwwj6y	vgp_tpl_presses_v1	asset_auto_  8	2026-01-29 17:00:07.621+00	Admin	\N	\N	\N	\N	t	EN_COURS	\N	BROUILLON	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_run_pmriy6cuv854azny	vgp_rpt_ntw3kb8nohkmk0xr	vgp_tpl_presses_v1	asset_auto_  1	2026-01-29 17:03:38.408+00	Technicien Maintenance	\N	\N	\N	\N	t	EN_COURS	\N	BROUILLON	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_run_yvfzwue1nvsanhfj	vgp_rpt_w2p1wz43bhqz35aw	vgp_tpl_presses_v1	asset_auto_  1	2026-01-29 17:04:08.284+00	Laurent Stefanini	\N	\N	\N	\N	t	EN_COURS	\N	BROUILLON	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_run_nkd35ypeqkd1zufp	vgp_rpt_iauzl5tthqxkaimr	vgp_tpl_presses_v1	asset_auto_  1	2026-01-29 23:25:10.086+00	Aimad Hadiqa	\N	\N	\N	\N	t	EN_COURS	\N	BROUILLON	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_run_omc68lntmc6lx2uv	vgp_rpt_88e049v2vbxebdjc	vgp_tpl_presses_v1	asset_auto_  1	2026-01-31 08:07:07.083+00	Laurent Stefanini	\N	\N	\N	\N	t	EN_COURS	\N	BROUILLON	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_run_khgxjgssap3gjl3m	vgp_rpt_39tyl3a9ov8jgfgv	vgp_tpl_presses_v1	asset_auto_ 20	2026-02-01 18:48:30.879+00	Laurent Stefanini	\N	\N	\N	\N	t	EN_COURS	\N	BROUILLON	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_run_l267gmyruwybe2ib	vgp_rpt_39tyl3a9ov8jgfgv	vgp_tpl_presses_v1	asset_auto_ 40	2026-02-01 18:48:30.879+00	Laurent Stefanini	\N	\N	\N	\N	t	EN_COURS	\N	BROUILLON	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_run_lkss8ujt6vh99gmi	vgp_rpt_39tyl3a9ov8jgfgv	vgp_tpl_presses_v1	asset_auto_ 60	2026-02-01 18:48:30.879+00	Laurent Stefanini	\N	\N	\N	\N	t	EN_COURS	\N	BROUILLON	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_run_g4y0sqyvfkkikkvl	vgp_rpt_r76qkv77nhan47r6	vgp_tpl_presses_v1	asset_auto_ 20	2026-02-01 19:12:39.901+00	Laurent Stefanini	\N	\N	\N	\N	t	EN_COURS	\N	BROUILLON	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_run_j6hantone7koffr2	vgp_rpt_r76qkv77nhan47r6	vgp_tpl_presses_v1	asset_auto_ 40	2026-02-01 19:12:39.901+00	Laurent Stefanini	\N	\N	\N	\N	t	EN_COURS	\N	BROUILLON	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_run_h7fq4o66hgl0rvuc	vgp_rpt_r76qkv77nhan47r6	vgp_tpl_presses_v1	asset_auto_ 60	2026-02-01 19:12:39.901+00	Laurent Stefanini	\N	\N	\N	\N	t	EN_COURS	\N	BROUILLON	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_run_6un5h43dds90ayge	vgp_rpt_7e1xzfze82qp8kfu	vgp_tpl_presses_v1	asset_auto_ 20	2026-02-01 19:19:20.494+00	Laurent Stefanini	\N	\N	\N	\N	t	EN_COURS	\N	BROUILLON	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_run_p004qbrz8xz6s33o	vgp_rpt_7e1xzfze82qp8kfu	vgp_tpl_presses_v1	asset_auto_ 40	2026-02-01 19:19:20.494+00	Laurent Stefanini	\N	\N	\N	\N	t	EN_COURS	\N	BROUILLON	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_run_by5cgg90cn1mj3in	vgp_rpt_7e1xzfze82qp8kfu	vgp_tpl_presses_v1	asset_auto_ 60	2026-02-01 19:19:20.494+00	Laurent Stefanini	\N	\N	\N	\N	t	EN_COURS	\N	BROUILLON	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_run_mihdyahbrzvupw6x	vgp_rpt_3ik1olpfonbnt5ko	vgp_tpl_presses_v1	asset_auto_ 20	2026-02-01 19:24:10.093+00	Laurent Stefanini	\N	\N	\N	\N	t	EN_COURS	\N	BROUILLON	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_run_4zhqic7zdr2mq7ai	vgp_rpt_3ik1olpfonbnt5ko	vgp_tpl_presses_v1	asset_auto_ 40	2026-02-01 19:24:10.093+00	Laurent Stefanini	\N	\N	\N	\N	t	EN_COURS	\N	BROUILLON	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_run_yyf0ywqb1jfwl8nn	vgp_rpt_8x8vszohvzt9fm0a	vgp_tpl_presses_v1	asset_auto_ 22	2026-02-01 19:30:45.389+00	Laurent Stefanini	\N	\N	\N	\N	t	EN_COURS	\N	BROUILLON	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_run_un7e4941e1rpbucz	vgp_rpt_8x8vszohvzt9fm0a	vgp_tpl_presses_v1	asset_auto_  2	2026-02-01 19:30:45.389+00	Laurent Stefanini	heures	1556	Machine a l'arret	\N	t	EN_COURS	barriere	BROUILLON	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:31:12.44+00
vgp_run_t4tb50slsg07va6e	vgp_rpt_klkbflhit5zs7ybp	vgp_tpl_presses_v1	asset_auto_ 40	2026-02-01 19:35:15.976+00	Laurent Stefanini	\N	\N	\N	\N	t	EN_COURS	\N	BROUILLON	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_run_uwe1oedwtzxi0tqo	vgp_rpt_klkbflhit5zs7ybp	vgp_tpl_presses_v1	asset_auto_ 20	2026-02-01 19:35:15.976+00	Laurent Stefanini	fEZSFE	56416	A LA RAIE	\N	t	EN_COURS	 BARRIERE	BROUILLON	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:45.767+00
vgp_run_zpesf12h2etottu2	vgp_rpt_e1odcfdaz43spi9j	vgp_tpl_presses_v1	asset_auto_ 20	2026-02-01 19:43:32.082+00	Laurent Stefanini	GHGH	1515	FGFF? DD L M LM LML	\N	t	EN_COURS	DFFDIJP    FDDF	BROUILLON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:49.746+00
vgp_run_p9qx02selwzw45ri	vgp_rpt_we4yg4ofg3tetdr9	vgp_tpl_presses_v1	asset_auto_ 20	2026-02-02 07:07:48.853+00	Christian Ceccato	\N	\N	\N	\N	t	EN_COURS	\N	BROUILLON	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
\.


--
-- Data for Name: vgp_item_results; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.vgp_item_results (id, run_id, item_id, result, comment, photos, created_at, updated_at) FROM stdin;
vgp_res_4uwivgc2016k4b6g	vgp_run_bogpmozitw4u6dul	vgp_item_1_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_tc0rp0qmud7zwweh	vgp_run_bogpmozitw4u6dul	vgp_item_2_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_g5nzfvx70q83vwo4	vgp_run_bogpmozitw4u6dul	vgp_item_3_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_l6u9o6a2txrwf6rc	vgp_run_bogpmozitw4u6dul	vgp_item_4_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_c5ovg4t8jsnbxmcx	vgp_run_bogpmozitw4u6dul	vgp_item_5_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_0uokbhg0eon5vz0z	vgp_run_bogpmozitw4u6dul	vgp_item_6_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_7utrbc0wh4mpb7m5	vgp_run_bogpmozitw4u6dul	vgp_item_7_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_rdk7ynqlydaazjyl	vgp_run_bogpmozitw4u6dul	vgp_item_8_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_mwzxh9wallejdp49	vgp_run_bogpmozitw4u6dul	vgp_item_9_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_o9taq8r4xpr3q4oa	vgp_run_bogpmozitw4u6dul	vgp_item_10_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_02t26mwkbp8xvjs6	vgp_run_bogpmozitw4u6dul	vgp_item_11_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_fastmqxsq7bb1x9x	vgp_run_bogpmozitw4u6dul	vgp_item_12_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_r618b2rr3yzey9nx	vgp_run_bogpmozitw4u6dul	vgp_item_13_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_ssudnjjkfrs5snao	vgp_run_bogpmozitw4u6dul	vgp_item_14_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_ab2n50tz5816ctew	vgp_run_bogpmozitw4u6dul	vgp_item_15_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_g4d37m08tgvxl8yy	vgp_run_bogpmozitw4u6dul	vgp_item_16_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_0mp6os3fvi4gtefk	vgp_run_bogpmozitw4u6dul	vgp_item_17_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_krlbc479dum74g0l	vgp_run_bogpmozitw4u6dul	vgp_item_18_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_90fa3pukgjyapezy	vgp_run_bogpmozitw4u6dul	vgp_item_19_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_o1tzxq7t8x4cxgxd	vgp_run_bogpmozitw4u6dul	vgp_item_20_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_gxz204jyjh72qf3q	vgp_run_bogpmozitw4u6dul	vgp_item_21_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_064bwjtalerqwij7	vgp_run_bogpmozitw4u6dul	vgp_item_22_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_lsq1rrt0t7br3ttj	vgp_run_bogpmozitw4u6dul	vgp_item_23_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_v1c3ctxtt1i9p9z7	vgp_run_bogpmozitw4u6dul	vgp_item_24_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_mj2tpj70jtpilsl3	vgp_run_bogpmozitw4u6dul	vgp_item_25_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_7dmtt1ojiajb6ob3	vgp_run_bogpmozitw4u6dul	vgp_item_26_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_opw09sm54u0eure7	vgp_run_bogpmozitw4u6dul	vgp_item_27_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_xrvz82g9bd4no62i	vgp_run_bogpmozitw4u6dul	vgp_item_28_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_04ns274kijmjdxcl	vgp_run_bogpmozitw4u6dul	vgp_item_29_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_8ocditu18tkkw886	vgp_run_bogpmozitw4u6dul	vgp_item_30_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_pejni5bqj2lutq92	vgp_run_bogpmozitw4u6dul	vgp_item_31_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_7p0wf4we8kx7chce	vgp_run_bogpmozitw4u6dul	vgp_item_32_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_4scit2ioycdy4fec	vgp_run_bogpmozitw4u6dul	vgp_item_33_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_8t0xpdt8hiujm7s4	vgp_run_bogpmozitw4u6dul	vgp_item_34_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_qhw4fxmgt7ak2ygy	vgp_run_bogpmozitw4u6dul	vgp_item_35_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_nypj6r8w8c98r5on	vgp_run_bogpmozitw4u6dul	vgp_item_36_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_t2b0ov8s96rph71q	vgp_run_bogpmozitw4u6dul	vgp_item_37_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_2pxb3ebur41g3ck1	vgp_run_bogpmozitw4u6dul	vgp_item_38_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_edhbxp0wygzk8jkp	vgp_run_bogpmozitw4u6dul	vgp_item_39_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_yy1n8p87rlxosvx8	vgp_run_bogpmozitw4u6dul	vgp_item_40_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_9j2bj1sgsz8fu0ea	vgp_run_bogpmozitw4u6dul	vgp_item_41_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_cnxffgjwyqx55x3x	vgp_run_bogpmozitw4u6dul	vgp_item_42_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_o6ut6b5gxmcl1qf1	vgp_run_bogpmozitw4u6dul	vgp_item_43_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_0zsgkep1sjuf9atz	vgp_run_bogpmozitw4u6dul	vgp_item_44_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_0cg2jdhazf9hwcsy	vgp_run_bogpmozitw4u6dul	vgp_item_45_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_7aj44rp34rl5964n	vgp_run_bogpmozitw4u6dul	vgp_item_46_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_uam7zd8fidnogn9u	vgp_run_bogpmozitw4u6dul	vgp_item_47_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_oejr78mxldq7342o	vgp_run_bogpmozitw4u6dul	vgp_item_48_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_x8ijzomhl86i2k4l	vgp_run_bogpmozitw4u6dul	vgp_item_49_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_maoica4faerp6kbx	vgp_run_bogpmozitw4u6dul	vgp_item_50_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_v2ktuo29gynxf7mq	vgp_run_bogpmozitw4u6dul	vgp_item_51_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_p3xawuwl4byn8r88	vgp_run_bogpmozitw4u6dul	vgp_item_52_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_kuh6l9c2x9o3kl2f	vgp_run_bogpmozitw4u6dul	vgp_item_53_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_cufn69bgy87up8ph	vgp_run_bogpmozitw4u6dul	vgp_item_54_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_rigahj1vo3d7yzx1	vgp_run_bogpmozitw4u6dul	vgp_item_55_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_lwypex0o9lqrqvhs	vgp_run_bogpmozitw4u6dul	vgp_item_56_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_ch6l03mnkf9khmtl	vgp_run_bogpmozitw4u6dul	vgp_item_57_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_3vffjtzvy9flijex	vgp_run_bogpmozitw4u6dul	vgp_item_58_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_4ko91c6v2bwpi1io	vgp_run_bogpmozitw4u6dul	vgp_item_59_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_j1fzfaaqq0e9eeuw	vgp_run_bogpmozitw4u6dul	vgp_item_60_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_okbkqjqgonofdjet	vgp_run_bogpmozitw4u6dul	vgp_item_61_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_i4yj0eipo4zmlhcx	vgp_run_bogpmozitw4u6dul	vgp_item_62_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_zc6upfd6gxq38mmu	vgp_run_bogpmozitw4u6dul	vgp_item_63_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_05eboaidldpzipty	vgp_run_bogpmozitw4u6dul	vgp_item_64_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_o5nxlcfj20pgq2i9	vgp_run_bogpmozitw4u6dul	vgp_item_65_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_ho042sa37g5yw45x	vgp_run_bogpmozitw4u6dul	vgp_item_66_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_n4aido5uyts7lt3z	vgp_run_bogpmozitw4u6dul	vgp_item_67_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_adyea77tvixp40m6	vgp_run_bogpmozitw4u6dul	vgp_item_68_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_rz7sc02oma0igoah	vgp_run_bogpmozitw4u6dul	vgp_item_69_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_bf2ruoz3dwgdleym	vgp_run_bogpmozitw4u6dul	vgp_item_70_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_zaiunqmobtn4c2at	vgp_run_bogpmozitw4u6dul	vgp_item_71_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_uebn3j7rbywjeqxm	vgp_run_bogpmozitw4u6dul	vgp_item_72_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_055bisywxmmf4f6p	vgp_run_bogpmozitw4u6dul	vgp_item_73_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_wz5qk4zsbts8xf78	vgp_run_bogpmozitw4u6dul	vgp_item_74_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_6hwhv38bi5x1opok	vgp_run_bogpmozitw4u6dul	vgp_item_75_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_ibij00p3tkce8pc5	vgp_run_bogpmozitw4u6dul	vgp_item_76_v1	NA	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_res_gxvsplgwqf2izng2	vgp_run_xygv7x3yt296jqas	vgp_item_1_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_eraypurhr9k46zjm	vgp_run_xygv7x3yt296jqas	vgp_item_2_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_v9w0bh5z87s33wnl	vgp_run_xygv7x3yt296jqas	vgp_item_3_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_ho5vqm67hxxum1kc	vgp_run_xygv7x3yt296jqas	vgp_item_4_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_tckeb5nupmz0vagw	vgp_run_xygv7x3yt296jqas	vgp_item_5_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_dftk1l1ihr4i6xxs	vgp_run_xygv7x3yt296jqas	vgp_item_6_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_z4b6dzd9oe26taqq	vgp_run_xygv7x3yt296jqas	vgp_item_7_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_96s30xxyeavs1zle	vgp_run_xygv7x3yt296jqas	vgp_item_8_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_qrl8gy77neny8en7	vgp_run_xygv7x3yt296jqas	vgp_item_9_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_tmpwpobxloia48pp	vgp_run_xygv7x3yt296jqas	vgp_item_10_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_6vyd73w4z8lym2j1	vgp_run_xygv7x3yt296jqas	vgp_item_11_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_05oz5fwdrm6a2l4e	vgp_run_xygv7x3yt296jqas	vgp_item_12_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_3lmqrkl85xh401qq	vgp_run_xygv7x3yt296jqas	vgp_item_13_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_ytv7jye5kkzjaywr	vgp_run_xygv7x3yt296jqas	vgp_item_14_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_24t5itbspbpt32qg	vgp_run_xygv7x3yt296jqas	vgp_item_15_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_dojfrxisnoblou2n	vgp_run_xygv7x3yt296jqas	vgp_item_16_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_dwfnauafuyb64o0l	vgp_run_xygv7x3yt296jqas	vgp_item_17_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_gsxne3pe6jiuhpqg	vgp_run_xygv7x3yt296jqas	vgp_item_18_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_0io1tvyeotdd2iak	vgp_run_xygv7x3yt296jqas	vgp_item_19_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_kj9se6kow848b9su	vgp_run_xygv7x3yt296jqas	vgp_item_20_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_6dkuurimuvw7uxd3	vgp_run_xygv7x3yt296jqas	vgp_item_21_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_3go4f2vjodgvhioh	vgp_run_xygv7x3yt296jqas	vgp_item_22_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_wrx3iui8kbz5x4y0	vgp_run_xygv7x3yt296jqas	vgp_item_23_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_mpiigfb6ys5qwhol	vgp_run_xygv7x3yt296jqas	vgp_item_24_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_z31k6obb28el7hlo	vgp_run_xygv7x3yt296jqas	vgp_item_25_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_wsptq7i84ql1pxhx	vgp_run_xygv7x3yt296jqas	vgp_item_26_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_hwarv76yi450wssn	vgp_run_xygv7x3yt296jqas	vgp_item_27_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_morwkb2fl5hxogze	vgp_run_xygv7x3yt296jqas	vgp_item_28_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_hxv81sj21rodi9p0	vgp_run_xygv7x3yt296jqas	vgp_item_29_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_dklf5o94xl3x2oer	vgp_run_xygv7x3yt296jqas	vgp_item_30_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_cqit9dgozbjwulbh	vgp_run_xygv7x3yt296jqas	vgp_item_31_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_hxupkan2lal70wtk	vgp_run_xygv7x3yt296jqas	vgp_item_32_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_n2u90w90e83aabwo	vgp_run_xygv7x3yt296jqas	vgp_item_33_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_y5rj0j9msl08u7si	vgp_run_xygv7x3yt296jqas	vgp_item_34_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_356etk94ur41y145	vgp_run_xygv7x3yt296jqas	vgp_item_35_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_p26wxuin3h5e1h1w	vgp_run_xygv7x3yt296jqas	vgp_item_36_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_al5xps73nrlo7wu1	vgp_run_xygv7x3yt296jqas	vgp_item_37_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_kyvbl8zx6ch43jje	vgp_run_xygv7x3yt296jqas	vgp_item_38_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_pfoxr67n6croo70n	vgp_run_xygv7x3yt296jqas	vgp_item_39_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_j749rmawptfdzzkr	vgp_run_xygv7x3yt296jqas	vgp_item_40_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_h439iddzm5y3hizn	vgp_run_xygv7x3yt296jqas	vgp_item_41_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_u7500d15qg3w47tw	vgp_run_xygv7x3yt296jqas	vgp_item_42_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_dg8zg5m4f8c81msh	vgp_run_xygv7x3yt296jqas	vgp_item_43_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_3iu4vz9eb9344clh	vgp_run_xygv7x3yt296jqas	vgp_item_44_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_njm60ke8anehpgqg	vgp_run_xygv7x3yt296jqas	vgp_item_45_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_vi51p4oqxtx08ed0	vgp_run_xygv7x3yt296jqas	vgp_item_46_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_gyduu6rsof6wd7l8	vgp_run_xygv7x3yt296jqas	vgp_item_47_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_kl5pl442i8g12fo3	vgp_run_xygv7x3yt296jqas	vgp_item_48_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_v1ijbm2kz336kjbq	vgp_run_xygv7x3yt296jqas	vgp_item_49_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_yb6yzlb9mgry9c66	vgp_run_xygv7x3yt296jqas	vgp_item_50_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_2ydjurei6u7lot4o	vgp_run_xygv7x3yt296jqas	vgp_item_51_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_fb47ppzi5yjgj1g1	vgp_run_xygv7x3yt296jqas	vgp_item_52_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_e9z314j5tgvgunvv	vgp_run_xygv7x3yt296jqas	vgp_item_53_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_3iakflpjvk41mmu6	vgp_run_xygv7x3yt296jqas	vgp_item_54_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_wcavybroupkhr1qz	vgp_run_xygv7x3yt296jqas	vgp_item_55_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_7wmdzgr0vzmt3bzf	vgp_run_xygv7x3yt296jqas	vgp_item_56_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_0rxgwro2l0d5txe0	vgp_run_xygv7x3yt296jqas	vgp_item_57_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_zjr0xbad98hafd4o	vgp_run_xygv7x3yt296jqas	vgp_item_58_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_dr908w9v8156vi04	vgp_run_xygv7x3yt296jqas	vgp_item_59_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_7rmfex0lv0o692lx	vgp_run_xygv7x3yt296jqas	vgp_item_60_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_hzw524j5q7w8jp3v	vgp_run_xygv7x3yt296jqas	vgp_item_61_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_7ftnllstkftgenxk	vgp_run_xygv7x3yt296jqas	vgp_item_62_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_wjc9pgqfkjzgvl0z	vgp_run_xygv7x3yt296jqas	vgp_item_63_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_1yfgjkz4c3rieih0	vgp_run_xygv7x3yt296jqas	vgp_item_64_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_bzki894l8prwh57z	vgp_run_xygv7x3yt296jqas	vgp_item_65_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_uukdqs3yq48hsej4	vgp_run_xygv7x3yt296jqas	vgp_item_66_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_vexjhh0ca5mv7b7p	vgp_run_xygv7x3yt296jqas	vgp_item_67_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_jtm4itz3hkenqwog	vgp_run_xygv7x3yt296jqas	vgp_item_68_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_vq02a3u7p2ncfgmj	vgp_run_xygv7x3yt296jqas	vgp_item_69_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_rn7ake8016up4ga1	vgp_run_xygv7x3yt296jqas	vgp_item_70_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_0ehh59ycnm03stdg	vgp_run_xygv7x3yt296jqas	vgp_item_71_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_ijamgfqw6pvduz42	vgp_run_xygv7x3yt296jqas	vgp_item_72_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_1ab6zxjtadk0kbrg	vgp_run_xygv7x3yt296jqas	vgp_item_73_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_s2p33zevwmy8psoa	vgp_run_xygv7x3yt296jqas	vgp_item_74_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_e2z7ok35ye3ronbj	vgp_run_xygv7x3yt296jqas	vgp_item_75_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_7qed5jqbu0ix0evq	vgp_run_xygv7x3yt296jqas	vgp_item_76_v1	NA	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_res_t31n1b11qjnjn3tw	vgp_run_pmriy6cuv854azny	vgp_item_1_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_qtu7wuypcdv30045	vgp_run_pmriy6cuv854azny	vgp_item_2_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_0v9lzexo0v9tq1ji	vgp_run_pmriy6cuv854azny	vgp_item_3_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_esfzxko3707m2w9m	vgp_run_pmriy6cuv854azny	vgp_item_4_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_y0x2p5fcksg9tf26	vgp_run_pmriy6cuv854azny	vgp_item_5_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_mbal310qd2wp7tmr	vgp_run_pmriy6cuv854azny	vgp_item_6_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_1z2khtmhjnxjaeac	vgp_run_pmriy6cuv854azny	vgp_item_7_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_l878pfsbfln12k8a	vgp_run_pmriy6cuv854azny	vgp_item_8_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_lkynv8r7owodmepi	vgp_run_pmriy6cuv854azny	vgp_item_9_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_svlul1r1ny68ng6e	vgp_run_pmriy6cuv854azny	vgp_item_10_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_4odqhmqdjd2wjl3c	vgp_run_pmriy6cuv854azny	vgp_item_11_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_ln2vlu961gx15l89	vgp_run_pmriy6cuv854azny	vgp_item_12_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_j8qrzplfkxz8uas2	vgp_run_pmriy6cuv854azny	vgp_item_13_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_7lzc8d75a4bhwoka	vgp_run_pmriy6cuv854azny	vgp_item_14_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_u38c5407epg3l7qq	vgp_run_pmriy6cuv854azny	vgp_item_15_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_te7hm8vj74g3a441	vgp_run_pmriy6cuv854azny	vgp_item_16_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_afi9861s7emq3yv7	vgp_run_pmriy6cuv854azny	vgp_item_17_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_lwd1g7qp8z55fwcb	vgp_run_pmriy6cuv854azny	vgp_item_18_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_qdh9lndb1be1pkxw	vgp_run_pmriy6cuv854azny	vgp_item_19_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_mjafvrxk58cgfbvv	vgp_run_pmriy6cuv854azny	vgp_item_20_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_rcplnqgu1qp8kxzs	vgp_run_pmriy6cuv854azny	vgp_item_21_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_t9ipcmzrhbqk3yd0	vgp_run_pmriy6cuv854azny	vgp_item_22_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_pd93cgj43on1la32	vgp_run_pmriy6cuv854azny	vgp_item_23_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_hs2yimbgxs1x5zas	vgp_run_pmriy6cuv854azny	vgp_item_24_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_zbbf0ipzxskfce8z	vgp_run_pmriy6cuv854azny	vgp_item_25_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_ltm6u48ixioyrgr9	vgp_run_pmriy6cuv854azny	vgp_item_26_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_of1zc4nh8hauj2ki	vgp_run_pmriy6cuv854azny	vgp_item_27_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_j7kpf2ry3w06oq9m	vgp_run_pmriy6cuv854azny	vgp_item_28_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_7a6uo7l2s6c9t35h	vgp_run_pmriy6cuv854azny	vgp_item_29_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_16ipqjlvpp209ojd	vgp_run_pmriy6cuv854azny	vgp_item_30_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_n798x4sjhjzm62wf	vgp_run_pmriy6cuv854azny	vgp_item_31_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_uf7bkprmqyuisbz2	vgp_run_pmriy6cuv854azny	vgp_item_32_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_gs86dzm21xkncj5z	vgp_run_pmriy6cuv854azny	vgp_item_33_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_rd2sxsc8y9i3jg5k	vgp_run_pmriy6cuv854azny	vgp_item_34_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_2022wxrkn1j9eceb	vgp_run_pmriy6cuv854azny	vgp_item_35_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_dg98v2vuabdmpv6m	vgp_run_pmriy6cuv854azny	vgp_item_36_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_xkcajrxs7pmv1n4t	vgp_run_pmriy6cuv854azny	vgp_item_37_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_ovy5249ovuil4r9b	vgp_run_pmriy6cuv854azny	vgp_item_38_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_bya4smyoszf6tqkg	vgp_run_pmriy6cuv854azny	vgp_item_39_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_x2a0qjn097ktcs7y	vgp_run_pmriy6cuv854azny	vgp_item_40_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_ywj39xbxdwt9x7bw	vgp_run_pmriy6cuv854azny	vgp_item_41_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_bfz04hcsljqdphdx	vgp_run_pmriy6cuv854azny	vgp_item_42_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_ova238vk3rump3vq	vgp_run_pmriy6cuv854azny	vgp_item_43_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_892p1rsyzjxonfgz	vgp_run_pmriy6cuv854azny	vgp_item_44_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_puxtrv074lfwak51	vgp_run_pmriy6cuv854azny	vgp_item_45_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_fci81ihclmm6a7x8	vgp_run_pmriy6cuv854azny	vgp_item_46_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_ayvomw3z1pk3d26g	vgp_run_pmriy6cuv854azny	vgp_item_47_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_iasqischjwjcpetl	vgp_run_pmriy6cuv854azny	vgp_item_48_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_qnbc2k7rkhkg0p41	vgp_run_pmriy6cuv854azny	vgp_item_49_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_mlm2zn0mkxjojcks	vgp_run_pmriy6cuv854azny	vgp_item_50_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_htmhrfkvmpdj7er0	vgp_run_pmriy6cuv854azny	vgp_item_51_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_gi8on2enpk66ti1i	vgp_run_pmriy6cuv854azny	vgp_item_52_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_mtqth6lkqo0iozcu	vgp_run_pmriy6cuv854azny	vgp_item_53_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_1u7pvovy80dj1nwg	vgp_run_pmriy6cuv854azny	vgp_item_54_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_mnty1df929eg8yqx	vgp_run_pmriy6cuv854azny	vgp_item_55_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_zfmnm2i5ls3og0do	vgp_run_pmriy6cuv854azny	vgp_item_56_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_mzxd8jymj5t0afa8	vgp_run_pmriy6cuv854azny	vgp_item_57_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_swlhwndswt0qqp0p	vgp_run_pmriy6cuv854azny	vgp_item_58_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_72ndrhaycvmeia0r	vgp_run_pmriy6cuv854azny	vgp_item_59_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_pij6z7b0p92c6axs	vgp_run_pmriy6cuv854azny	vgp_item_60_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_sfuw5i9doiutihd8	vgp_run_pmriy6cuv854azny	vgp_item_61_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_n2i3yudx44xba3o8	vgp_run_pmriy6cuv854azny	vgp_item_62_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_hj3hhpv8f9f5eroz	vgp_run_pmriy6cuv854azny	vgp_item_63_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_x9l59i0v15gdqoi3	vgp_run_pmriy6cuv854azny	vgp_item_64_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_lo7u58ofs56w64b9	vgp_run_pmriy6cuv854azny	vgp_item_65_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_avponi0svqazvy8f	vgp_run_pmriy6cuv854azny	vgp_item_66_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_y44e5mvbb75orm05	vgp_run_pmriy6cuv854azny	vgp_item_67_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_zu09ykwbf5eqy24n	vgp_run_pmriy6cuv854azny	vgp_item_68_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_12bqddul2cweauri	vgp_run_pmriy6cuv854azny	vgp_item_69_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_aei778y88ry2g363	vgp_run_pmriy6cuv854azny	vgp_item_70_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_2850di0xg7ebjhho	vgp_run_pmriy6cuv854azny	vgp_item_71_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_1ui8gtofhwr3kz4h	vgp_run_pmriy6cuv854azny	vgp_item_72_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_669r9d31t9pbdu3z	vgp_run_pmriy6cuv854azny	vgp_item_73_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_h2v43urexk5tjoup	vgp_run_pmriy6cuv854azny	vgp_item_74_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_rjfghgvklf46v437	vgp_run_pmriy6cuv854azny	vgp_item_75_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_9wytkq6l86arszek	vgp_run_pmriy6cuv854azny	vgp_item_76_v1	NA	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_res_nir1w5w0el47khnr	vgp_run_yvfzwue1nvsanhfj	vgp_item_1_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_vjw6wf6m9k9w4a38	vgp_run_yvfzwue1nvsanhfj	vgp_item_2_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_89lme4v5mm1e9xqa	vgp_run_yvfzwue1nvsanhfj	vgp_item_3_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_8wrq3rdrr80ljya6	vgp_run_yvfzwue1nvsanhfj	vgp_item_4_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_vj06h9yd7a2d8rp6	vgp_run_yvfzwue1nvsanhfj	vgp_item_5_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_dfry074ejc9f9omk	vgp_run_yvfzwue1nvsanhfj	vgp_item_6_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_tsxpo2psyka06d53	vgp_run_yvfzwue1nvsanhfj	vgp_item_7_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_ictgd6i9njngs79s	vgp_run_yvfzwue1nvsanhfj	vgp_item_8_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_tiutxyr0xcl818sf	vgp_run_yvfzwue1nvsanhfj	vgp_item_9_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_fii4zqjizzysiseg	vgp_run_yvfzwue1nvsanhfj	vgp_item_10_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_iihbvvw7vu3ktvs0	vgp_run_yvfzwue1nvsanhfj	vgp_item_11_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_i3tm1gtawpfghset	vgp_run_yvfzwue1nvsanhfj	vgp_item_12_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_78dzvj6c3ishexi6	vgp_run_yvfzwue1nvsanhfj	vgp_item_13_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_739fey1ekez3e2xe	vgp_run_yvfzwue1nvsanhfj	vgp_item_14_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_whqq0xoehras7thy	vgp_run_yvfzwue1nvsanhfj	vgp_item_15_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_opqdop6i4hebn99j	vgp_run_yvfzwue1nvsanhfj	vgp_item_16_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_hkjfrh8rra6zna13	vgp_run_yvfzwue1nvsanhfj	vgp_item_17_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_gkhty9kwhnhlr4r9	vgp_run_yvfzwue1nvsanhfj	vgp_item_18_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_83cg5fxjyjba75ag	vgp_run_yvfzwue1nvsanhfj	vgp_item_19_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_5ztst1gcea217ymq	vgp_run_yvfzwue1nvsanhfj	vgp_item_20_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_urra157di8ll1vze	vgp_run_yvfzwue1nvsanhfj	vgp_item_21_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_qjcx977wmwl2mm6p	vgp_run_yvfzwue1nvsanhfj	vgp_item_22_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_081xje14tqb65rnz	vgp_run_yvfzwue1nvsanhfj	vgp_item_23_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_ctbt0h2ybtnd88qa	vgp_run_yvfzwue1nvsanhfj	vgp_item_24_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_cskle075rdhbp69x	vgp_run_yvfzwue1nvsanhfj	vgp_item_25_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_4t2raie1eduqr3ht	vgp_run_yvfzwue1nvsanhfj	vgp_item_26_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_rfy5vhr3fqw9l3jh	vgp_run_yvfzwue1nvsanhfj	vgp_item_27_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_zjd78hmsuw0gmg5h	vgp_run_yvfzwue1nvsanhfj	vgp_item_28_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_46ibygg26u8q0faa	vgp_run_yvfzwue1nvsanhfj	vgp_item_29_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_u4kgb1t9yvuw5pni	vgp_run_yvfzwue1nvsanhfj	vgp_item_30_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_xyg6fnat5u93f30v	vgp_run_yvfzwue1nvsanhfj	vgp_item_31_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_x6h7kfn57fkq3kav	vgp_run_yvfzwue1nvsanhfj	vgp_item_32_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_m38cer5xry1inalo	vgp_run_yvfzwue1nvsanhfj	vgp_item_33_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_47v4d7gb5cnqwf0o	vgp_run_yvfzwue1nvsanhfj	vgp_item_34_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_aulcdqm4lkoac463	vgp_run_yvfzwue1nvsanhfj	vgp_item_35_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_2wz6ckp580wkmh3i	vgp_run_yvfzwue1nvsanhfj	vgp_item_36_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_mvy926om0v3uc6i7	vgp_run_yvfzwue1nvsanhfj	vgp_item_37_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_qv6jqm6avezqobhj	vgp_run_yvfzwue1nvsanhfj	vgp_item_38_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_yqoo98wut4dpd6vl	vgp_run_yvfzwue1nvsanhfj	vgp_item_39_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_8wob5r6uuindklwu	vgp_run_yvfzwue1nvsanhfj	vgp_item_40_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_tnmut6ht4l86i3or	vgp_run_yvfzwue1nvsanhfj	vgp_item_41_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_yiitge2bwaauoj3x	vgp_run_yvfzwue1nvsanhfj	vgp_item_42_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_2cpkidaaqbc5gn9j	vgp_run_yvfzwue1nvsanhfj	vgp_item_43_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_3p9pkuuny0f2fwk8	vgp_run_yvfzwue1nvsanhfj	vgp_item_44_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_826h9mmpepphe3w4	vgp_run_yvfzwue1nvsanhfj	vgp_item_45_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_nxz24haos3nlr07x	vgp_run_yvfzwue1nvsanhfj	vgp_item_46_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_upypfvr07fpumfxr	vgp_run_yvfzwue1nvsanhfj	vgp_item_47_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_gz39921qp0nzslxh	vgp_run_yvfzwue1nvsanhfj	vgp_item_48_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_7hsopkva7onfodt4	vgp_run_yvfzwue1nvsanhfj	vgp_item_49_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_t7ncqy5j149ryrkt	vgp_run_yvfzwue1nvsanhfj	vgp_item_50_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_lqiytuag2oa27wa1	vgp_run_yvfzwue1nvsanhfj	vgp_item_51_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_eb832fvprvcxmpp1	vgp_run_yvfzwue1nvsanhfj	vgp_item_52_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_m7zijapvmewz9yjf	vgp_run_yvfzwue1nvsanhfj	vgp_item_53_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_vgihhl2pbm4vpyt0	vgp_run_yvfzwue1nvsanhfj	vgp_item_54_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_hxw6rf8ykjvg5r1t	vgp_run_yvfzwue1nvsanhfj	vgp_item_55_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_byucok1349j58fu8	vgp_run_yvfzwue1nvsanhfj	vgp_item_56_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_91a34xys2hu0kvbg	vgp_run_yvfzwue1nvsanhfj	vgp_item_57_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_md3sw4gh9uutapsu	vgp_run_yvfzwue1nvsanhfj	vgp_item_58_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_yjdvko7zucri7dji	vgp_run_yvfzwue1nvsanhfj	vgp_item_59_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_ags7mfxy1k50p382	vgp_run_yvfzwue1nvsanhfj	vgp_item_60_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_itk4vvzqd3pviunu	vgp_run_yvfzwue1nvsanhfj	vgp_item_61_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_ouh4o5bkbjzkxs6x	vgp_run_yvfzwue1nvsanhfj	vgp_item_62_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_kkodoc914t0t7zd8	vgp_run_yvfzwue1nvsanhfj	vgp_item_63_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_haxli6ykr8fov3f9	vgp_run_yvfzwue1nvsanhfj	vgp_item_64_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_zr0lmrgbl1dxbenq	vgp_run_yvfzwue1nvsanhfj	vgp_item_65_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_njhu73cf8i2ru29u	vgp_run_yvfzwue1nvsanhfj	vgp_item_66_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_9pgkwupjvashlkdh	vgp_run_yvfzwue1nvsanhfj	vgp_item_67_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_41oizzji14et66f4	vgp_run_yvfzwue1nvsanhfj	vgp_item_68_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_gs9xic2rusm9yqnh	vgp_run_yvfzwue1nvsanhfj	vgp_item_69_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_i0oysah8b6sjms5o	vgp_run_yvfzwue1nvsanhfj	vgp_item_70_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_owb8v0huzazunn25	vgp_run_yvfzwue1nvsanhfj	vgp_item_71_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_r9gxtc12qh88498g	vgp_run_yvfzwue1nvsanhfj	vgp_item_72_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_5cr748sgbdohva8m	vgp_run_yvfzwue1nvsanhfj	vgp_item_73_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_8byo6tyrarhnhluz	vgp_run_yvfzwue1nvsanhfj	vgp_item_74_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_ol0sbon0u5enm1a8	vgp_run_yvfzwue1nvsanhfj	vgp_item_75_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_0ni91cfgyjext6ih	vgp_run_yvfzwue1nvsanhfj	vgp_item_76_v1	NA	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_res_n51ki79q67ljgix2	vgp_run_nkd35ypeqkd1zufp	vgp_item_1_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_dz5q12ftbfa3hica	vgp_run_nkd35ypeqkd1zufp	vgp_item_2_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_oy4rjmsluqxy9564	vgp_run_nkd35ypeqkd1zufp	vgp_item_3_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_tc950pdbzf3be2md	vgp_run_nkd35ypeqkd1zufp	vgp_item_4_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_udj0zyqe3bc74q5d	vgp_run_nkd35ypeqkd1zufp	vgp_item_5_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_154ohr4phwomg8ce	vgp_run_nkd35ypeqkd1zufp	vgp_item_6_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_m8k1jwcemb6ds0s2	vgp_run_nkd35ypeqkd1zufp	vgp_item_7_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_q2tqwv0rusaqjrun	vgp_run_nkd35ypeqkd1zufp	vgp_item_8_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_10clkh5orn5mcha9	vgp_run_nkd35ypeqkd1zufp	vgp_item_9_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_woqv910zlk1dsi5z	vgp_run_nkd35ypeqkd1zufp	vgp_item_10_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_cxg2o40ud7bz3t6j	vgp_run_nkd35ypeqkd1zufp	vgp_item_11_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_6dgjwn38b5zb7v0n	vgp_run_nkd35ypeqkd1zufp	vgp_item_12_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_mp00xnqu5nfex5js	vgp_run_nkd35ypeqkd1zufp	vgp_item_13_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_1bc8a6iy2m1glo56	vgp_run_nkd35ypeqkd1zufp	vgp_item_14_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_hhkqw7fqqvap64fc	vgp_run_nkd35ypeqkd1zufp	vgp_item_15_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_58718fwamcka5iz2	vgp_run_nkd35ypeqkd1zufp	vgp_item_16_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_8xrp0nyh4o4hnfhb	vgp_run_nkd35ypeqkd1zufp	vgp_item_17_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_7mblpjawl1ifqhod	vgp_run_nkd35ypeqkd1zufp	vgp_item_18_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_00ror9qb4bc8xytg	vgp_run_nkd35ypeqkd1zufp	vgp_item_19_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_pm1wan738m6dajcp	vgp_run_nkd35ypeqkd1zufp	vgp_item_20_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_zqnwlhdl9oifb6i3	vgp_run_nkd35ypeqkd1zufp	vgp_item_21_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_ga6rqlkspb703u7h	vgp_run_nkd35ypeqkd1zufp	vgp_item_22_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_psj40p12kskrgqqo	vgp_run_nkd35ypeqkd1zufp	vgp_item_23_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_nrvg5wjabvytkv8f	vgp_run_nkd35ypeqkd1zufp	vgp_item_24_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_7ka54miqwbiwa9xo	vgp_run_nkd35ypeqkd1zufp	vgp_item_25_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_arem114x1bbjz3bt	vgp_run_nkd35ypeqkd1zufp	vgp_item_26_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_xhugxx4svcpifo5d	vgp_run_nkd35ypeqkd1zufp	vgp_item_27_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_l1vk21elv2wolv5y	vgp_run_nkd35ypeqkd1zufp	vgp_item_28_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_io5aydlgb5havzhs	vgp_run_nkd35ypeqkd1zufp	vgp_item_29_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_4hwyxhwbwktg4tlj	vgp_run_nkd35ypeqkd1zufp	vgp_item_30_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_zn22rlcc20upazhz	vgp_run_nkd35ypeqkd1zufp	vgp_item_31_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_iwwv8vv1kp69ocor	vgp_run_nkd35ypeqkd1zufp	vgp_item_32_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_qflcrxaybvb1wvtw	vgp_run_nkd35ypeqkd1zufp	vgp_item_33_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_oi0pf8to74c65x3o	vgp_run_nkd35ypeqkd1zufp	vgp_item_34_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_9k0x23u69zp2xzaz	vgp_run_nkd35ypeqkd1zufp	vgp_item_35_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_2p8u1fvkoo2is89b	vgp_run_nkd35ypeqkd1zufp	vgp_item_36_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_56ysq2s8nmlk8k0e	vgp_run_nkd35ypeqkd1zufp	vgp_item_37_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_m1p9yp6ui0m7h4cw	vgp_run_nkd35ypeqkd1zufp	vgp_item_38_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_1w72w4dbsy5temwq	vgp_run_nkd35ypeqkd1zufp	vgp_item_39_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_pqtgq74x5rp0qp3w	vgp_run_nkd35ypeqkd1zufp	vgp_item_40_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_ilbj6krsl9v3liuu	vgp_run_nkd35ypeqkd1zufp	vgp_item_41_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_00lt3jzwukwfeq4c	vgp_run_nkd35ypeqkd1zufp	vgp_item_42_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_wju865k8uoiihv3r	vgp_run_nkd35ypeqkd1zufp	vgp_item_43_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_osmjdvyjuu32hqhm	vgp_run_nkd35ypeqkd1zufp	vgp_item_44_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_72ab980yna0wujdu	vgp_run_nkd35ypeqkd1zufp	vgp_item_45_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_5noccwlgsbbd6hdu	vgp_run_nkd35ypeqkd1zufp	vgp_item_46_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_bomrq162hg6t8cgy	vgp_run_nkd35ypeqkd1zufp	vgp_item_47_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_rdme24he80omds1n	vgp_run_nkd35ypeqkd1zufp	vgp_item_48_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_7bo0oojyznwbjauh	vgp_run_nkd35ypeqkd1zufp	vgp_item_49_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_en58nybtjvd4mgj4	vgp_run_nkd35ypeqkd1zufp	vgp_item_50_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_ibd4vyxs64s207ye	vgp_run_nkd35ypeqkd1zufp	vgp_item_51_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_1pfgo6dqkbc5g2c3	vgp_run_nkd35ypeqkd1zufp	vgp_item_52_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_89ln7zmjbkc7lo04	vgp_run_nkd35ypeqkd1zufp	vgp_item_53_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_75g7371l0arvl1b5	vgp_run_nkd35ypeqkd1zufp	vgp_item_54_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_z5fvyu7jsncdm4lu	vgp_run_nkd35ypeqkd1zufp	vgp_item_55_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_04rxtfy1v58r2du1	vgp_run_nkd35ypeqkd1zufp	vgp_item_56_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_nwarmtk0fwmy1rwq	vgp_run_nkd35ypeqkd1zufp	vgp_item_57_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_c1u8kma0wigw2tpu	vgp_run_nkd35ypeqkd1zufp	vgp_item_58_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_qltv1r5s0bolhc5h	vgp_run_nkd35ypeqkd1zufp	vgp_item_59_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_grkmf5eoep2iodsl	vgp_run_nkd35ypeqkd1zufp	vgp_item_60_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_0jyg28y0q0l1wo34	vgp_run_nkd35ypeqkd1zufp	vgp_item_61_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_8rtnrmg05aog258q	vgp_run_nkd35ypeqkd1zufp	vgp_item_62_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_zs36bs175b0nepf0	vgp_run_nkd35ypeqkd1zufp	vgp_item_63_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_vqc9bh5chnqftxkt	vgp_run_nkd35ypeqkd1zufp	vgp_item_64_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_yf3ac5z2n4sg0rxr	vgp_run_nkd35ypeqkd1zufp	vgp_item_65_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_t08h8i18qe6gnw14	vgp_run_nkd35ypeqkd1zufp	vgp_item_66_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_5bdsd7lldh39ivoq	vgp_run_nkd35ypeqkd1zufp	vgp_item_67_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_vshfz02q7wfb5k27	vgp_run_nkd35ypeqkd1zufp	vgp_item_68_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_m3w0xeobe5u5jnrx	vgp_run_nkd35ypeqkd1zufp	vgp_item_69_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_jjymg7uno80uuk1t	vgp_run_nkd35ypeqkd1zufp	vgp_item_70_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_dsi3521urzu8i4hg	vgp_run_nkd35ypeqkd1zufp	vgp_item_71_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_gvotudww8x9lz76v	vgp_run_nkd35ypeqkd1zufp	vgp_item_72_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_yns3cdvhy2s9dxr1	vgp_run_nkd35ypeqkd1zufp	vgp_item_73_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_37fc2o70eraz59q8	vgp_run_nkd35ypeqkd1zufp	vgp_item_74_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_ke53c9gyrgo1gxza	vgp_run_nkd35ypeqkd1zufp	vgp_item_75_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_t4m8m98jiinlzpso	vgp_run_nkd35ypeqkd1zufp	vgp_item_76_v1	NA	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_res_575j6a5sm8evp42e	vgp_run_omc68lntmc6lx2uv	vgp_item_1_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_fsul71wde2fklb9e	vgp_run_omc68lntmc6lx2uv	vgp_item_2_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_gtx1tq4sovqrkkqo	vgp_run_omc68lntmc6lx2uv	vgp_item_3_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_x0bovvapefh3kdjp	vgp_run_omc68lntmc6lx2uv	vgp_item_4_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_ug4bkztyr9pjsp84	vgp_run_omc68lntmc6lx2uv	vgp_item_5_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_mbsdbfbpubigaom4	vgp_run_omc68lntmc6lx2uv	vgp_item_6_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_8eba5qmme1hqxr7y	vgp_run_omc68lntmc6lx2uv	vgp_item_7_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_e4mp81dt0uzw26u3	vgp_run_omc68lntmc6lx2uv	vgp_item_8_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_d1jdlb2d3r8dm2li	vgp_run_omc68lntmc6lx2uv	vgp_item_9_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_h5awzp3n2n2urd4e	vgp_run_omc68lntmc6lx2uv	vgp_item_10_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_ey1k37le9ck30tgb	vgp_run_omc68lntmc6lx2uv	vgp_item_11_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_a06m79e7nrgbbwat	vgp_run_omc68lntmc6lx2uv	vgp_item_12_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_h2qhazcrauwcm7rs	vgp_run_omc68lntmc6lx2uv	vgp_item_13_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_hbeiqg6hys0uxayb	vgp_run_omc68lntmc6lx2uv	vgp_item_14_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_1d04zb9v1cr0gvul	vgp_run_omc68lntmc6lx2uv	vgp_item_15_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_pawnik60kn3pa9gw	vgp_run_omc68lntmc6lx2uv	vgp_item_16_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_fy69ogifh32d9jnx	vgp_run_omc68lntmc6lx2uv	vgp_item_17_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_23fchhasjgq48nix	vgp_run_omc68lntmc6lx2uv	vgp_item_18_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_55phg9y6qrmyvo4r	vgp_run_omc68lntmc6lx2uv	vgp_item_19_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_lbglfnvkc1a6abtl	vgp_run_omc68lntmc6lx2uv	vgp_item_20_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_tocosvx19522iqsn	vgp_run_omc68lntmc6lx2uv	vgp_item_21_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_moqw9qazhra6dzyf	vgp_run_omc68lntmc6lx2uv	vgp_item_22_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_vyyk1veizzrm0tkq	vgp_run_omc68lntmc6lx2uv	vgp_item_23_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_so2yh1iolwrq3pcg	vgp_run_omc68lntmc6lx2uv	vgp_item_24_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_kdi9l92g4uwml34h	vgp_run_omc68lntmc6lx2uv	vgp_item_25_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_ipz9bo800m3rkaau	vgp_run_omc68lntmc6lx2uv	vgp_item_26_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_8udq38jhgapv1xqj	vgp_run_omc68lntmc6lx2uv	vgp_item_27_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_pmwus692exzh716r	vgp_run_omc68lntmc6lx2uv	vgp_item_28_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_i9xqan9k2uzi4ggy	vgp_run_omc68lntmc6lx2uv	vgp_item_29_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_qpgstqgzl3q2yjjj	vgp_run_omc68lntmc6lx2uv	vgp_item_30_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_rt5wwvegfmsp5sh4	vgp_run_omc68lntmc6lx2uv	vgp_item_31_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_ddsdm0a6epxybzyw	vgp_run_omc68lntmc6lx2uv	vgp_item_32_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_vtkbxavlz69k4wsi	vgp_run_omc68lntmc6lx2uv	vgp_item_33_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_1y6pl1dw2yxzfui7	vgp_run_omc68lntmc6lx2uv	vgp_item_34_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_z5d0e661b1dkfmir	vgp_run_omc68lntmc6lx2uv	vgp_item_35_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_fud8pg8c0bkotsa5	vgp_run_omc68lntmc6lx2uv	vgp_item_36_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_nbkjre1ubfzvgvpr	vgp_run_omc68lntmc6lx2uv	vgp_item_37_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_cxww8zz9bikkidjk	vgp_run_omc68lntmc6lx2uv	vgp_item_38_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_5ppdfuwdem1idupy	vgp_run_omc68lntmc6lx2uv	vgp_item_39_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_0xbx5yhuf3ji3c60	vgp_run_omc68lntmc6lx2uv	vgp_item_40_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_3xxlxdufppuo71ze	vgp_run_omc68lntmc6lx2uv	vgp_item_41_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_ssjopvzpbig2x8k3	vgp_run_omc68lntmc6lx2uv	vgp_item_42_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_aminx2kvjhue6ksh	vgp_run_omc68lntmc6lx2uv	vgp_item_43_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_e8zaqbxn8fsw6kbt	vgp_run_omc68lntmc6lx2uv	vgp_item_44_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_f05x36ado1vzgicz	vgp_run_omc68lntmc6lx2uv	vgp_item_45_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_p63urd5put9oujx8	vgp_run_omc68lntmc6lx2uv	vgp_item_46_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_jahiz2jcp7frw5wn	vgp_run_omc68lntmc6lx2uv	vgp_item_47_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_a9bem108op2g74lg	vgp_run_omc68lntmc6lx2uv	vgp_item_48_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_1atqiub2gpez527a	vgp_run_omc68lntmc6lx2uv	vgp_item_49_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_ytqdyrj2bvihdfus	vgp_run_omc68lntmc6lx2uv	vgp_item_50_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_lo4tg209kz6t2dbi	vgp_run_omc68lntmc6lx2uv	vgp_item_51_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_h49vciqjxwpyblji	vgp_run_omc68lntmc6lx2uv	vgp_item_52_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_thyjo5hnao6w1qua	vgp_run_omc68lntmc6lx2uv	vgp_item_53_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_3dklmj7mlfx7nm74	vgp_run_omc68lntmc6lx2uv	vgp_item_54_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_2x70xhiu201ttt7a	vgp_run_omc68lntmc6lx2uv	vgp_item_55_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_arykylrqsjsr82d7	vgp_run_omc68lntmc6lx2uv	vgp_item_56_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_358y6hg7qe7pqgy0	vgp_run_omc68lntmc6lx2uv	vgp_item_57_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_xjjz3fmfjqnf9yiy	vgp_run_omc68lntmc6lx2uv	vgp_item_58_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_qxfvhtcppo08lf9c	vgp_run_omc68lntmc6lx2uv	vgp_item_59_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_f2qvhisvfi1tmf5q	vgp_run_omc68lntmc6lx2uv	vgp_item_60_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_ovmexxrsrnoic39i	vgp_run_omc68lntmc6lx2uv	vgp_item_61_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_gt8gsmc10jty5y4f	vgp_run_omc68lntmc6lx2uv	vgp_item_62_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_traarip56ogw53fi	vgp_run_omc68lntmc6lx2uv	vgp_item_63_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_6i294klf6etanf5q	vgp_run_omc68lntmc6lx2uv	vgp_item_64_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_y9ck1az0c3lq3603	vgp_run_omc68lntmc6lx2uv	vgp_item_65_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_g3h2j92sdwlcf4an	vgp_run_omc68lntmc6lx2uv	vgp_item_66_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_g453de97hppoflgj	vgp_run_omc68lntmc6lx2uv	vgp_item_67_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_8gcdtmdrevcapq6f	vgp_run_omc68lntmc6lx2uv	vgp_item_68_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_wyxme1fvfi7d4bat	vgp_run_omc68lntmc6lx2uv	vgp_item_69_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_lddy6hjvak0o4heo	vgp_run_omc68lntmc6lx2uv	vgp_item_70_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_jy2vbeyf337jfeqs	vgp_run_omc68lntmc6lx2uv	vgp_item_71_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_6e5vv6nsxvcbl2rg	vgp_run_omc68lntmc6lx2uv	vgp_item_72_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_uwnf9y9e91k7sbz2	vgp_run_omc68lntmc6lx2uv	vgp_item_73_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_z96znhfw7ike4gpw	vgp_run_omc68lntmc6lx2uv	vgp_item_74_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_et6sme02v85myifd	vgp_run_omc68lntmc6lx2uv	vgp_item_75_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_6wo0fb823d2rwrdg	vgp_run_omc68lntmc6lx2uv	vgp_item_76_v1	NA	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_res_z9uwma9d5g36qoes	vgp_run_khgxjgssap3gjl3m	vgp_item_1_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_cn44k3kdss9gh3ur	vgp_run_khgxjgssap3gjl3m	vgp_item_2_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_6om0gd3rp63hj4pu	vgp_run_khgxjgssap3gjl3m	vgp_item_3_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_bxlhieu8b74bzgfd	vgp_run_khgxjgssap3gjl3m	vgp_item_4_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_iuyw6wdg5q1jjyo7	vgp_run_khgxjgssap3gjl3m	vgp_item_5_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_15mps78ljcuvqyri	vgp_run_khgxjgssap3gjl3m	vgp_item_6_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_5ym3n3jjqtxqrdve	vgp_run_khgxjgssap3gjl3m	vgp_item_7_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_7fyhena6o16zay44	vgp_run_khgxjgssap3gjl3m	vgp_item_8_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_yut0o26gvwjb74vt	vgp_run_khgxjgssap3gjl3m	vgp_item_9_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_u0qlwb2c3g6m5r1o	vgp_run_khgxjgssap3gjl3m	vgp_item_10_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_345ux8ijerx3ehp7	vgp_run_khgxjgssap3gjl3m	vgp_item_11_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_tj8rwpxv5g7hixs4	vgp_run_khgxjgssap3gjl3m	vgp_item_12_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_xkn34jaczeix90zp	vgp_run_khgxjgssap3gjl3m	vgp_item_13_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_uqz222ezk5pv50n5	vgp_run_khgxjgssap3gjl3m	vgp_item_14_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_6f2lgighzabhj38w	vgp_run_khgxjgssap3gjl3m	vgp_item_15_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_scv01nh6tcyv6fhi	vgp_run_khgxjgssap3gjl3m	vgp_item_16_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_vez7jci9caa9kj2l	vgp_run_khgxjgssap3gjl3m	vgp_item_17_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_nyy0f1ayfr68rhu2	vgp_run_khgxjgssap3gjl3m	vgp_item_18_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_4i111ck13y5fn8nc	vgp_run_khgxjgssap3gjl3m	vgp_item_19_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_7lsrtt0x1e7bm0wb	vgp_run_khgxjgssap3gjl3m	vgp_item_20_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_m0i9k3gxwef3h7ok	vgp_run_khgxjgssap3gjl3m	vgp_item_21_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_4zrku7ermf0uipw2	vgp_run_khgxjgssap3gjl3m	vgp_item_22_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_sdj4hqld6mej6crx	vgp_run_khgxjgssap3gjl3m	vgp_item_23_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_ei6fzh3nmbgjenj8	vgp_run_khgxjgssap3gjl3m	vgp_item_24_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_zk17gra97i6csjiw	vgp_run_khgxjgssap3gjl3m	vgp_item_25_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_o95qsv5siv30gkcc	vgp_run_khgxjgssap3gjl3m	vgp_item_26_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_q73691olrqout49n	vgp_run_khgxjgssap3gjl3m	vgp_item_27_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_ndeovo7pfliie3uz	vgp_run_khgxjgssap3gjl3m	vgp_item_28_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_lqw6n54ut40od592	vgp_run_khgxjgssap3gjl3m	vgp_item_29_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_fxk77wdix3ij5gfs	vgp_run_khgxjgssap3gjl3m	vgp_item_30_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_dtueizfs16a3ax6l	vgp_run_khgxjgssap3gjl3m	vgp_item_31_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_w7y5fwh35l2xonrx	vgp_run_khgxjgssap3gjl3m	vgp_item_32_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_mnsscsnmfs2l5qq6	vgp_run_khgxjgssap3gjl3m	vgp_item_33_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_ogm3wzgf5i10gja0	vgp_run_khgxjgssap3gjl3m	vgp_item_34_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_lecwvbbbv2gwz6g9	vgp_run_khgxjgssap3gjl3m	vgp_item_35_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_brsrp41v6o06chvc	vgp_run_khgxjgssap3gjl3m	vgp_item_36_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_9gt57y0mhuvcx16g	vgp_run_khgxjgssap3gjl3m	vgp_item_37_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_abzafbb4i7dliz71	vgp_run_khgxjgssap3gjl3m	vgp_item_38_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_cwewd1k9tjl5oljx	vgp_run_khgxjgssap3gjl3m	vgp_item_39_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_60c55jayckucuyyo	vgp_run_khgxjgssap3gjl3m	vgp_item_40_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_9show0g1mp0p7iig	vgp_run_khgxjgssap3gjl3m	vgp_item_41_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_4brd2o9dgvou8ewo	vgp_run_khgxjgssap3gjl3m	vgp_item_42_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_39gnscxzjolg5ip3	vgp_run_khgxjgssap3gjl3m	vgp_item_43_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_tmr4d51rq4njct46	vgp_run_khgxjgssap3gjl3m	vgp_item_44_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_4jjfb4qt190qpz2z	vgp_run_khgxjgssap3gjl3m	vgp_item_45_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_hyp4d4ik767c2s0l	vgp_run_khgxjgssap3gjl3m	vgp_item_46_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_0swlpj79q3k83gej	vgp_run_khgxjgssap3gjl3m	vgp_item_47_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_x1d4snseofe211nt	vgp_run_khgxjgssap3gjl3m	vgp_item_48_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_9gfott9s8lo70s9q	vgp_run_khgxjgssap3gjl3m	vgp_item_49_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_vz5bl6onf5gpgnev	vgp_run_khgxjgssap3gjl3m	vgp_item_50_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_32xuhjh9uswf1gj3	vgp_run_khgxjgssap3gjl3m	vgp_item_51_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_d2r20whwpnm0pho7	vgp_run_khgxjgssap3gjl3m	vgp_item_52_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_6j3ztloehbvzxlw4	vgp_run_khgxjgssap3gjl3m	vgp_item_53_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_vsdxxctndmtgfrr3	vgp_run_khgxjgssap3gjl3m	vgp_item_54_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_d18h2gm23v5ffj05	vgp_run_khgxjgssap3gjl3m	vgp_item_55_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_8pjtf5ow9vtw03or	vgp_run_khgxjgssap3gjl3m	vgp_item_56_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_xilk1brrts77ynrr	vgp_run_khgxjgssap3gjl3m	vgp_item_57_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_fzho9r73nwp8imwh	vgp_run_khgxjgssap3gjl3m	vgp_item_58_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_8k4tseryvqr3ac39	vgp_run_khgxjgssap3gjl3m	vgp_item_59_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_k6t8o0b774u3aoem	vgp_run_khgxjgssap3gjl3m	vgp_item_60_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_c8p6d5xwd1ho41zc	vgp_run_khgxjgssap3gjl3m	vgp_item_61_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_ytwhgmb3jdwu5j2j	vgp_run_khgxjgssap3gjl3m	vgp_item_62_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_yu27pmgy4h2gwxq6	vgp_run_khgxjgssap3gjl3m	vgp_item_63_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_e3ti04o5z7ry8v8e	vgp_run_khgxjgssap3gjl3m	vgp_item_64_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_b0xr6ecwo0tik0db	vgp_run_khgxjgssap3gjl3m	vgp_item_65_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_6p0u2hm8diusmnyx	vgp_run_khgxjgssap3gjl3m	vgp_item_66_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_4zjdbjt5pykrakv1	vgp_run_khgxjgssap3gjl3m	vgp_item_67_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_19624zp8ktgqjjaq	vgp_run_khgxjgssap3gjl3m	vgp_item_68_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_alx110bfv04loetm	vgp_run_khgxjgssap3gjl3m	vgp_item_69_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_ctl4h2b0nry1lgqp	vgp_run_khgxjgssap3gjl3m	vgp_item_70_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_9zl5ym2m2rqhduey	vgp_run_khgxjgssap3gjl3m	vgp_item_71_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_d5rxc6rwleff4gy5	vgp_run_khgxjgssap3gjl3m	vgp_item_72_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_1r5292otllzg0gxv	vgp_run_khgxjgssap3gjl3m	vgp_item_73_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_0amrnrtcm8c1ocfd	vgp_run_khgxjgssap3gjl3m	vgp_item_74_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_8w418srat94you6f	vgp_run_khgxjgssap3gjl3m	vgp_item_75_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_0qvanpumja0yjtmp	vgp_run_khgxjgssap3gjl3m	vgp_item_76_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_ethfu8vu255p4rrf	vgp_run_l267gmyruwybe2ib	vgp_item_1_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_aisvqo4w9ikj5dzi	vgp_run_l267gmyruwybe2ib	vgp_item_2_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_m4h2cefg7wekaw3h	vgp_run_l267gmyruwybe2ib	vgp_item_3_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_ia91m5jwtmola6cg	vgp_run_l267gmyruwybe2ib	vgp_item_4_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_x7b45wr462kfpbkv	vgp_run_l267gmyruwybe2ib	vgp_item_5_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_6owlpxmbsqvc211h	vgp_run_l267gmyruwybe2ib	vgp_item_6_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_i6mod98kzz9u2see	vgp_run_l267gmyruwybe2ib	vgp_item_7_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_ojbjxsc6paiip9g2	vgp_run_l267gmyruwybe2ib	vgp_item_8_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_wlvsakfi82tuzyt0	vgp_run_l267gmyruwybe2ib	vgp_item_9_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_8z4rphha4dxc2c2w	vgp_run_l267gmyruwybe2ib	vgp_item_10_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_dbe2frdq982ie911	vgp_run_l267gmyruwybe2ib	vgp_item_11_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_6ziv3gk87pdowrku	vgp_run_l267gmyruwybe2ib	vgp_item_12_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_3ms1zk79m46t5giy	vgp_run_l267gmyruwybe2ib	vgp_item_13_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_kccr49zfczmoetoy	vgp_run_l267gmyruwybe2ib	vgp_item_14_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_aey56ewuxx09yn8c	vgp_run_l267gmyruwybe2ib	vgp_item_15_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_zhmosy7s2x60y2cn	vgp_run_l267gmyruwybe2ib	vgp_item_16_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_lh8zroeohd66qh0c	vgp_run_l267gmyruwybe2ib	vgp_item_17_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_7jzexay81j53usxa	vgp_run_l267gmyruwybe2ib	vgp_item_18_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_rkxh6upbaefff2cl	vgp_run_l267gmyruwybe2ib	vgp_item_19_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_oxx5d39oj51naact	vgp_run_l267gmyruwybe2ib	vgp_item_20_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_clxhec3kbd9dq8oq	vgp_run_l267gmyruwybe2ib	vgp_item_21_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_4kb9m2g3uit2hnw5	vgp_run_l267gmyruwybe2ib	vgp_item_22_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_u5s1r16ax26wprmt	vgp_run_l267gmyruwybe2ib	vgp_item_23_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_dzglea2x1uczazs4	vgp_run_l267gmyruwybe2ib	vgp_item_24_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_i3uk0fz2lyeqdlgn	vgp_run_l267gmyruwybe2ib	vgp_item_25_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_2evoelq6geqlht8k	vgp_run_l267gmyruwybe2ib	vgp_item_26_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_2qsuwvssc2g4a8jt	vgp_run_l267gmyruwybe2ib	vgp_item_27_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_0k4kvhy4odzy6wkm	vgp_run_l267gmyruwybe2ib	vgp_item_28_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_5i7atqsnv36t0o77	vgp_run_l267gmyruwybe2ib	vgp_item_29_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_4wonfn4g891yyty4	vgp_run_l267gmyruwybe2ib	vgp_item_30_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_rggifga0rnyx32su	vgp_run_l267gmyruwybe2ib	vgp_item_31_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_53lv7muxymw4fol0	vgp_run_l267gmyruwybe2ib	vgp_item_32_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_qyga0u3qxg7r5wnh	vgp_run_l267gmyruwybe2ib	vgp_item_33_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_r9z6p6lwg5bz839p	vgp_run_l267gmyruwybe2ib	vgp_item_34_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_h9sqnowsuihy9pv3	vgp_run_l267gmyruwybe2ib	vgp_item_35_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_iwcwxeqxemtmbbh8	vgp_run_l267gmyruwybe2ib	vgp_item_36_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_52k40c4btxt76pu2	vgp_run_l267gmyruwybe2ib	vgp_item_37_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_fewcmtsz7e8eo6x5	vgp_run_l267gmyruwybe2ib	vgp_item_38_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_w9l8vk2ngpo40ax4	vgp_run_l267gmyruwybe2ib	vgp_item_39_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_dmh1j1jbsigrdwx7	vgp_run_l267gmyruwybe2ib	vgp_item_40_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_ymp305hilq874tw7	vgp_run_l267gmyruwybe2ib	vgp_item_41_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_r0o13zlg0vu7eurr	vgp_run_l267gmyruwybe2ib	vgp_item_42_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_8q4ar1prymm8dldx	vgp_run_l267gmyruwybe2ib	vgp_item_43_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_9k7ygt2zpzq4l4xi	vgp_run_l267gmyruwybe2ib	vgp_item_44_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_z80ui94o8yihq3rl	vgp_run_l267gmyruwybe2ib	vgp_item_45_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_1u28x75fjp6l6jr8	vgp_run_l267gmyruwybe2ib	vgp_item_46_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_yx40nf1evf3lp0hc	vgp_run_l267gmyruwybe2ib	vgp_item_47_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_22l8nuz94f0bl7v9	vgp_run_l267gmyruwybe2ib	vgp_item_48_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_fbcx18y4zkj6dg9c	vgp_run_l267gmyruwybe2ib	vgp_item_49_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_ke8g6pn112p08sep	vgp_run_l267gmyruwybe2ib	vgp_item_50_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_29okpb197ojso039	vgp_run_l267gmyruwybe2ib	vgp_item_51_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_chw6pz9x63lruu62	vgp_run_l267gmyruwybe2ib	vgp_item_52_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_hy3k13fdzgbd5pvn	vgp_run_l267gmyruwybe2ib	vgp_item_53_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_i6zuferzfgtuquw9	vgp_run_l267gmyruwybe2ib	vgp_item_54_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_ayf49e8idwlplj34	vgp_run_l267gmyruwybe2ib	vgp_item_55_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_2jff39z70fyb0c3a	vgp_run_l267gmyruwybe2ib	vgp_item_56_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_aiqgvoas86fvoln5	vgp_run_l267gmyruwybe2ib	vgp_item_57_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_xbvwfik9l4nwc27q	vgp_run_l267gmyruwybe2ib	vgp_item_58_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_wb72efkmgvnl8ht1	vgp_run_l267gmyruwybe2ib	vgp_item_59_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_r7wu1chz0um2p4fo	vgp_run_l267gmyruwybe2ib	vgp_item_60_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_bk3lqpzua0qd3vv6	vgp_run_l267gmyruwybe2ib	vgp_item_61_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_9rstp6oufpd43em3	vgp_run_l267gmyruwybe2ib	vgp_item_62_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_3sdaklzrgity2zb4	vgp_run_l267gmyruwybe2ib	vgp_item_63_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_t81kizeji4tvwm2v	vgp_run_l267gmyruwybe2ib	vgp_item_64_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_e5wndnqpylouvijz	vgp_run_l267gmyruwybe2ib	vgp_item_65_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_ly80paeymj79bbfw	vgp_run_l267gmyruwybe2ib	vgp_item_66_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_jn7paqffedb5fddn	vgp_run_l267gmyruwybe2ib	vgp_item_67_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_yabn9p4u20wpaktr	vgp_run_l267gmyruwybe2ib	vgp_item_68_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_hztb12ulve5uiyzs	vgp_run_l267gmyruwybe2ib	vgp_item_69_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_gp4afuw5edtgveop	vgp_run_l267gmyruwybe2ib	vgp_item_70_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_sryd20xqn5c54gsu	vgp_run_l267gmyruwybe2ib	vgp_item_71_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_9owcfh2nfy6t0sa6	vgp_run_l267gmyruwybe2ib	vgp_item_72_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_rwbpfvrib6wnj98r	vgp_run_l267gmyruwybe2ib	vgp_item_73_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_w9ggf3wrer4epi3a	vgp_run_l267gmyruwybe2ib	vgp_item_74_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_xcclnsyg3qgo2mmk	vgp_run_l267gmyruwybe2ib	vgp_item_75_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_9d18le2s8a5lhzjt	vgp_run_l267gmyruwybe2ib	vgp_item_76_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_ecozff89qx2aw2hc	vgp_run_lkss8ujt6vh99gmi	vgp_item_1_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_t9fln2iitbzxj5wk	vgp_run_lkss8ujt6vh99gmi	vgp_item_2_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_rt5zzk8eh7z5bnor	vgp_run_lkss8ujt6vh99gmi	vgp_item_3_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_iu4c9umydhvcorzb	vgp_run_lkss8ujt6vh99gmi	vgp_item_4_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_kloedjyjzgi04uzb	vgp_run_lkss8ujt6vh99gmi	vgp_item_5_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_c18b416d2ve4ohdm	vgp_run_lkss8ujt6vh99gmi	vgp_item_6_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_hret3fqe1e40xeh1	vgp_run_lkss8ujt6vh99gmi	vgp_item_7_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_9ma7m2llvexz8wsd	vgp_run_lkss8ujt6vh99gmi	vgp_item_8_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_2miintuv22qzez1c	vgp_run_lkss8ujt6vh99gmi	vgp_item_9_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_lfxxh1l5ng7emy15	vgp_run_lkss8ujt6vh99gmi	vgp_item_10_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_s2stb61iud8jyj17	vgp_run_lkss8ujt6vh99gmi	vgp_item_11_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_z19ytrb8wxiyvef0	vgp_run_lkss8ujt6vh99gmi	vgp_item_12_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_f0upobkxrrmwg8cg	vgp_run_lkss8ujt6vh99gmi	vgp_item_13_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_2yyghkhm6mkjiwfq	vgp_run_lkss8ujt6vh99gmi	vgp_item_14_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_nn6z4m8w1ctkh3m0	vgp_run_lkss8ujt6vh99gmi	vgp_item_15_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_42ojr99z3irep7l1	vgp_run_lkss8ujt6vh99gmi	vgp_item_16_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_7dad7u548ov1j6da	vgp_run_lkss8ujt6vh99gmi	vgp_item_17_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_grdkvep3lmwgwovv	vgp_run_lkss8ujt6vh99gmi	vgp_item_18_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_ryupdkcn7z8jxzqo	vgp_run_lkss8ujt6vh99gmi	vgp_item_19_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_m6n32ogwy765i6d0	vgp_run_lkss8ujt6vh99gmi	vgp_item_20_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_47g82iak532okamw	vgp_run_lkss8ujt6vh99gmi	vgp_item_21_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_87x5k4f561vvbwp0	vgp_run_lkss8ujt6vh99gmi	vgp_item_22_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_ugwmc43rfd0wanso	vgp_run_lkss8ujt6vh99gmi	vgp_item_23_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_w52ysxg6ipcd1zer	vgp_run_lkss8ujt6vh99gmi	vgp_item_24_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_8030rqbla8c6loit	vgp_run_lkss8ujt6vh99gmi	vgp_item_25_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_vl1lrhdmojy5wcm5	vgp_run_lkss8ujt6vh99gmi	vgp_item_26_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_z0ofb9179kpoaiui	vgp_run_lkss8ujt6vh99gmi	vgp_item_27_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_by5tynqyg1q2cpe9	vgp_run_lkss8ujt6vh99gmi	vgp_item_28_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_63hh8looz713dqm7	vgp_run_lkss8ujt6vh99gmi	vgp_item_29_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_8qz0lae9zaxkt389	vgp_run_lkss8ujt6vh99gmi	vgp_item_30_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_5k3ph1h4bcy0oc78	vgp_run_lkss8ujt6vh99gmi	vgp_item_31_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_52o5oi0cekhi2kik	vgp_run_lkss8ujt6vh99gmi	vgp_item_32_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_lqznw0k3owvsgiqj	vgp_run_lkss8ujt6vh99gmi	vgp_item_33_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_zl4ru2u2jrmtysk4	vgp_run_lkss8ujt6vh99gmi	vgp_item_34_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_iw6wg645twuynfdu	vgp_run_lkss8ujt6vh99gmi	vgp_item_35_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_r7tcjeexf1xi4g50	vgp_run_lkss8ujt6vh99gmi	vgp_item_36_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_nfo6g2xcbhajn6iw	vgp_run_lkss8ujt6vh99gmi	vgp_item_37_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_7qxe9li4ontgpghd	vgp_run_lkss8ujt6vh99gmi	vgp_item_38_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_py7ysx8r6l2sl5jv	vgp_run_lkss8ujt6vh99gmi	vgp_item_39_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_kyi1offdymjkrp1y	vgp_run_lkss8ujt6vh99gmi	vgp_item_40_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_hazognoir9dbr8rj	vgp_run_lkss8ujt6vh99gmi	vgp_item_41_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_ibw0tn6mzjfn4v64	vgp_run_lkss8ujt6vh99gmi	vgp_item_42_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_k2u1kpqobnxbuccp	vgp_run_lkss8ujt6vh99gmi	vgp_item_43_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_exfrbw19sfszbbr6	vgp_run_lkss8ujt6vh99gmi	vgp_item_44_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_84ivwtmggsak7sig	vgp_run_lkss8ujt6vh99gmi	vgp_item_45_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_09r9xaz1s1t101wq	vgp_run_lkss8ujt6vh99gmi	vgp_item_46_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_14axgpdpti2293nd	vgp_run_lkss8ujt6vh99gmi	vgp_item_47_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_70ozr1xdo5g1jvzl	vgp_run_lkss8ujt6vh99gmi	vgp_item_48_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_0ujhd54armtoug2w	vgp_run_lkss8ujt6vh99gmi	vgp_item_49_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_4959tx15jko3p6im	vgp_run_lkss8ujt6vh99gmi	vgp_item_50_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_37t56nmxxosq9qpf	vgp_run_lkss8ujt6vh99gmi	vgp_item_51_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_pftgc637niveal6k	vgp_run_lkss8ujt6vh99gmi	vgp_item_52_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_qyur9d2xi8jilt9h	vgp_run_lkss8ujt6vh99gmi	vgp_item_53_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_1vk0l6qmcr0vjb4z	vgp_run_lkss8ujt6vh99gmi	vgp_item_54_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_e0wra5k0ucqk2lpk	vgp_run_lkss8ujt6vh99gmi	vgp_item_55_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_hiuxi2bhpplee2ft	vgp_run_lkss8ujt6vh99gmi	vgp_item_56_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_vk0wzrqic9tdtemm	vgp_run_lkss8ujt6vh99gmi	vgp_item_57_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_c9glo63ivt3mei4b	vgp_run_lkss8ujt6vh99gmi	vgp_item_58_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_0c8sn2y62ae784sb	vgp_run_lkss8ujt6vh99gmi	vgp_item_59_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_8n9c7ozbrv8u980c	vgp_run_lkss8ujt6vh99gmi	vgp_item_60_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_fil1ey05e1jqbzpk	vgp_run_lkss8ujt6vh99gmi	vgp_item_61_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_0w92jwiay2woq3e8	vgp_run_lkss8ujt6vh99gmi	vgp_item_62_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_7908vklyaq2j1gfk	vgp_run_lkss8ujt6vh99gmi	vgp_item_63_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_7saed2alsxc4p037	vgp_run_lkss8ujt6vh99gmi	vgp_item_64_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_ebg3yve41h7a3efc	vgp_run_lkss8ujt6vh99gmi	vgp_item_65_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_zbwzwuorm20hbfau	vgp_run_lkss8ujt6vh99gmi	vgp_item_66_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_g1xb6q45sd30s0ec	vgp_run_lkss8ujt6vh99gmi	vgp_item_67_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_yf80gvktg3ypobiq	vgp_run_lkss8ujt6vh99gmi	vgp_item_68_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_bjzfwp2i3vgihw3b	vgp_run_lkss8ujt6vh99gmi	vgp_item_69_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_zdxi2v7cqjfyo5r5	vgp_run_lkss8ujt6vh99gmi	vgp_item_70_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_ig28fjfgonupb9n3	vgp_run_lkss8ujt6vh99gmi	vgp_item_71_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_azws6v7xyajvztcq	vgp_run_lkss8ujt6vh99gmi	vgp_item_72_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_olqgioh745ui3478	vgp_run_lkss8ujt6vh99gmi	vgp_item_73_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_i04003ciwc9yclpx	vgp_run_lkss8ujt6vh99gmi	vgp_item_74_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_r4by271kuqou2vff	vgp_run_lkss8ujt6vh99gmi	vgp_item_75_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_wjem2p9zld9gdw49	vgp_run_lkss8ujt6vh99gmi	vgp_item_76_v1	NA	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_res_8cnpif6pmj386nmv	vgp_run_g4y0sqyvfkkikkvl	vgp_item_1_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_dldkj6uf2egur8o2	vgp_run_g4y0sqyvfkkikkvl	vgp_item_2_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_vujwv4odnm7y230r	vgp_run_g4y0sqyvfkkikkvl	vgp_item_3_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_munnvr5gahn32kie	vgp_run_g4y0sqyvfkkikkvl	vgp_item_4_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_5me507b7aojycdvv	vgp_run_g4y0sqyvfkkikkvl	vgp_item_5_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_fu9csciahaewg8zt	vgp_run_g4y0sqyvfkkikkvl	vgp_item_6_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_r9vyt95okxcsu6t1	vgp_run_g4y0sqyvfkkikkvl	vgp_item_7_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_dd9c2tjyrymdtfvx	vgp_run_g4y0sqyvfkkikkvl	vgp_item_8_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_0bj5s0x4faofo9w0	vgp_run_g4y0sqyvfkkikkvl	vgp_item_9_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_4tepxpxrdhc91ruv	vgp_run_g4y0sqyvfkkikkvl	vgp_item_10_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_y7i0tx255g6zhnpe	vgp_run_g4y0sqyvfkkikkvl	vgp_item_11_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_xu5z991qhsy0f39a	vgp_run_g4y0sqyvfkkikkvl	vgp_item_12_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_s1lyfkuqf6lfjd9f	vgp_run_g4y0sqyvfkkikkvl	vgp_item_13_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_0pzuxjmml14sbhjx	vgp_run_g4y0sqyvfkkikkvl	vgp_item_14_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_yww0wvgya6r6xcbq	vgp_run_g4y0sqyvfkkikkvl	vgp_item_15_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_paqq9eflleeheab8	vgp_run_g4y0sqyvfkkikkvl	vgp_item_16_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_8yc2ze224azdhjb7	vgp_run_g4y0sqyvfkkikkvl	vgp_item_17_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_x8g21fahvxucz0kd	vgp_run_g4y0sqyvfkkikkvl	vgp_item_18_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_4q5vywj9qv02e4ew	vgp_run_g4y0sqyvfkkikkvl	vgp_item_19_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_gzyghtudepw33dws	vgp_run_g4y0sqyvfkkikkvl	vgp_item_20_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_zkhk3ys0smmo6bn0	vgp_run_g4y0sqyvfkkikkvl	vgp_item_21_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_bylfafwksi3wyhnu	vgp_run_g4y0sqyvfkkikkvl	vgp_item_22_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_0uggfufnti2d9w3y	vgp_run_g4y0sqyvfkkikkvl	vgp_item_23_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_97pj6pdjanwvcja4	vgp_run_g4y0sqyvfkkikkvl	vgp_item_24_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_m2n89u56g4nehcpm	vgp_run_g4y0sqyvfkkikkvl	vgp_item_25_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_4mtlt6f6kdfwn7po	vgp_run_g4y0sqyvfkkikkvl	vgp_item_26_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_mcointo85kdfx9ey	vgp_run_g4y0sqyvfkkikkvl	vgp_item_27_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_gtw4etbxj8abpcyj	vgp_run_g4y0sqyvfkkikkvl	vgp_item_28_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_i8y4z8urnd50951f	vgp_run_g4y0sqyvfkkikkvl	vgp_item_29_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_nxfn3duorg2rdz75	vgp_run_g4y0sqyvfkkikkvl	vgp_item_30_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_kerxvbu285gfmyyo	vgp_run_g4y0sqyvfkkikkvl	vgp_item_31_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_havo8vmrxho93ou4	vgp_run_g4y0sqyvfkkikkvl	vgp_item_32_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_67cqml5fjv2uihi4	vgp_run_g4y0sqyvfkkikkvl	vgp_item_33_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_jtobfo9w7c8qhqps	vgp_run_g4y0sqyvfkkikkvl	vgp_item_34_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_3ny9ls39t1csefcy	vgp_run_g4y0sqyvfkkikkvl	vgp_item_35_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_bbp5ncrs3r0t2i46	vgp_run_g4y0sqyvfkkikkvl	vgp_item_36_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_91tbns3847xtqxtv	vgp_run_g4y0sqyvfkkikkvl	vgp_item_37_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_wy761hxf6br3vrh0	vgp_run_g4y0sqyvfkkikkvl	vgp_item_38_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_xnr434enbijauq6q	vgp_run_g4y0sqyvfkkikkvl	vgp_item_39_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_pr53mxcks65d8w12	vgp_run_g4y0sqyvfkkikkvl	vgp_item_40_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_bip77qvy2bne6hzn	vgp_run_g4y0sqyvfkkikkvl	vgp_item_41_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_ytfab4uy2tc3bcu9	vgp_run_g4y0sqyvfkkikkvl	vgp_item_42_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_jc0bnqvz7nb8yrlv	vgp_run_g4y0sqyvfkkikkvl	vgp_item_43_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_xwfp7ge1dibz7tej	vgp_run_g4y0sqyvfkkikkvl	vgp_item_44_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_p3p6e2fxiiel6095	vgp_run_g4y0sqyvfkkikkvl	vgp_item_45_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_5vc6jdy8tbxizaqo	vgp_run_g4y0sqyvfkkikkvl	vgp_item_46_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_ayhed9tdd79p9jxq	vgp_run_g4y0sqyvfkkikkvl	vgp_item_47_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_iyjttkyuyl2bze3r	vgp_run_g4y0sqyvfkkikkvl	vgp_item_48_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_sibfjj31o50cz0ws	vgp_run_g4y0sqyvfkkikkvl	vgp_item_49_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_3watz70kq3qpgdnf	vgp_run_g4y0sqyvfkkikkvl	vgp_item_50_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_oks5bjscnvnhizdu	vgp_run_g4y0sqyvfkkikkvl	vgp_item_51_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_jkfvesdkr6uv01q2	vgp_run_g4y0sqyvfkkikkvl	vgp_item_52_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_26h3ri53dl1mzk97	vgp_run_g4y0sqyvfkkikkvl	vgp_item_53_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_0lvonzytfjbh6hzr	vgp_run_g4y0sqyvfkkikkvl	vgp_item_54_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_x569eb370prkd2n3	vgp_run_g4y0sqyvfkkikkvl	vgp_item_55_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_vr1a7ws85lv0mafs	vgp_run_g4y0sqyvfkkikkvl	vgp_item_56_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_ebzhk4oc2o26oeel	vgp_run_g4y0sqyvfkkikkvl	vgp_item_57_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_g8t0mpzq2kw89zsi	vgp_run_g4y0sqyvfkkikkvl	vgp_item_58_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_sck2b4m5d2xq34qg	vgp_run_g4y0sqyvfkkikkvl	vgp_item_59_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_a0wsx3w3cna9k0o3	vgp_run_g4y0sqyvfkkikkvl	vgp_item_60_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_xqho1l75ehgbzj4f	vgp_run_g4y0sqyvfkkikkvl	vgp_item_61_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_yzhyxlm72n494kx5	vgp_run_g4y0sqyvfkkikkvl	vgp_item_62_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_91zjy3oqdid3yzoc	vgp_run_g4y0sqyvfkkikkvl	vgp_item_63_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_26chyiyraxta2pfp	vgp_run_g4y0sqyvfkkikkvl	vgp_item_64_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_1tr46a6r994pqx47	vgp_run_g4y0sqyvfkkikkvl	vgp_item_65_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_x58xqghlo6i1mycr	vgp_run_g4y0sqyvfkkikkvl	vgp_item_66_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_9g0x0zqvejcgi2pl	vgp_run_g4y0sqyvfkkikkvl	vgp_item_67_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_7jtqy7n7dlsoseqz	vgp_run_g4y0sqyvfkkikkvl	vgp_item_68_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_cetur4cyyiogmck3	vgp_run_g4y0sqyvfkkikkvl	vgp_item_69_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_cbqvtzm8jlsrbh7d	vgp_run_g4y0sqyvfkkikkvl	vgp_item_70_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_xqzkmeykrv6chxz4	vgp_run_g4y0sqyvfkkikkvl	vgp_item_71_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_xib01p15qmbdppxi	vgp_run_g4y0sqyvfkkikkvl	vgp_item_72_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_ji6jkhkr1bi737cy	vgp_run_g4y0sqyvfkkikkvl	vgp_item_73_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_slgtghnjfk2ae8sw	vgp_run_g4y0sqyvfkkikkvl	vgp_item_74_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_18gwjcvbjbvarbin	vgp_run_g4y0sqyvfkkikkvl	vgp_item_75_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_jgz61oyfuc00z372	vgp_run_g4y0sqyvfkkikkvl	vgp_item_76_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_ff3mi96ocye608p0	vgp_run_j6hantone7koffr2	vgp_item_1_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_a86shiivzxcqx01a	vgp_run_j6hantone7koffr2	vgp_item_2_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_lt8a87qw2x4l5lv7	vgp_run_j6hantone7koffr2	vgp_item_3_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_oipe3np98vxzrxrh	vgp_run_j6hantone7koffr2	vgp_item_4_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_10y2itnkv0p8w54w	vgp_run_j6hantone7koffr2	vgp_item_5_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_uj2gcabf9yjly444	vgp_run_j6hantone7koffr2	vgp_item_6_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_6g5oagiapqnjos96	vgp_run_j6hantone7koffr2	vgp_item_7_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_mtbhsg35p2ywts95	vgp_run_j6hantone7koffr2	vgp_item_8_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_loe1tre041osec8n	vgp_run_j6hantone7koffr2	vgp_item_9_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_fprzsms06c3xi99d	vgp_run_j6hantone7koffr2	vgp_item_10_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_ljoxtnvl2brukzhn	vgp_run_j6hantone7koffr2	vgp_item_11_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_fcu8vpfiglxam28e	vgp_run_j6hantone7koffr2	vgp_item_12_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_yua90b9omkwl9tio	vgp_run_j6hantone7koffr2	vgp_item_13_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_zuxr4qlymo6q1iui	vgp_run_j6hantone7koffr2	vgp_item_14_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_3ytvmoremwxhukm1	vgp_run_j6hantone7koffr2	vgp_item_15_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_4dshrw5treetrk0d	vgp_run_j6hantone7koffr2	vgp_item_16_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_fuob3vfc334ieoe3	vgp_run_j6hantone7koffr2	vgp_item_17_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_feucyw52u9akzljq	vgp_run_j6hantone7koffr2	vgp_item_18_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_acjiqu7gq8f4baok	vgp_run_j6hantone7koffr2	vgp_item_19_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_qnnpmdq3jmr4zpnk	vgp_run_j6hantone7koffr2	vgp_item_20_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_h08z7cbejcq4px64	vgp_run_j6hantone7koffr2	vgp_item_21_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_5ky0p0j0af4037a8	vgp_run_j6hantone7koffr2	vgp_item_22_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_h94dxgmxqs3vz4fs	vgp_run_j6hantone7koffr2	vgp_item_23_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_bprd7tkrjpavolaj	vgp_run_j6hantone7koffr2	vgp_item_24_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_qw7ciycfcjpajsag	vgp_run_j6hantone7koffr2	vgp_item_25_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_5ahazfbzi009eopl	vgp_run_j6hantone7koffr2	vgp_item_26_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_rthol0626k4j8htd	vgp_run_j6hantone7koffr2	vgp_item_27_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_150eq3srjljjuja9	vgp_run_j6hantone7koffr2	vgp_item_28_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_d9l4h3fzp26s198z	vgp_run_j6hantone7koffr2	vgp_item_29_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_6tf5idu6l1xy4ioo	vgp_run_j6hantone7koffr2	vgp_item_30_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_p99dpjghe2demp9o	vgp_run_j6hantone7koffr2	vgp_item_31_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_xhsf6jmusfex050k	vgp_run_j6hantone7koffr2	vgp_item_32_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_eg33h5oguoo1f0ch	vgp_run_j6hantone7koffr2	vgp_item_33_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_9f58c4xbx2flkwng	vgp_run_j6hantone7koffr2	vgp_item_34_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_oqavl1olsw9e33tj	vgp_run_j6hantone7koffr2	vgp_item_35_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_e9xlu4hc6pkitcx7	vgp_run_j6hantone7koffr2	vgp_item_36_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_10qf5ljoman1dtwo	vgp_run_j6hantone7koffr2	vgp_item_37_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_iywx9cwj3tyd965f	vgp_run_j6hantone7koffr2	vgp_item_38_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_17rmainftf0v5oex	vgp_run_j6hantone7koffr2	vgp_item_39_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_eea2xn9q1s57wqlq	vgp_run_j6hantone7koffr2	vgp_item_40_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_cm7gkfv88mz3uce8	vgp_run_j6hantone7koffr2	vgp_item_41_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_kf6etmeg4j2320n3	vgp_run_j6hantone7koffr2	vgp_item_42_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_9e42mbj9zutoygi1	vgp_run_j6hantone7koffr2	vgp_item_43_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_pmymxesgerax1o2t	vgp_run_j6hantone7koffr2	vgp_item_44_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_1p8qa8rchcq0edi7	vgp_run_j6hantone7koffr2	vgp_item_45_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_3ctnvy0cd4u4sqkh	vgp_run_j6hantone7koffr2	vgp_item_46_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_o0jxinb80pamyr08	vgp_run_j6hantone7koffr2	vgp_item_47_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_pfj0vhx10wl2ruhf	vgp_run_j6hantone7koffr2	vgp_item_48_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_ehhyuupgfysenebb	vgp_run_j6hantone7koffr2	vgp_item_49_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_6r3rvbidv86l6ala	vgp_run_j6hantone7koffr2	vgp_item_50_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_357svwfblou6mz1a	vgp_run_j6hantone7koffr2	vgp_item_51_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_y6n4rj4uq9zo5avy	vgp_run_j6hantone7koffr2	vgp_item_52_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_wdl4piwvgowhsf65	vgp_run_j6hantone7koffr2	vgp_item_53_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_50vqxuin804o94ed	vgp_run_j6hantone7koffr2	vgp_item_54_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_6b7urw4mo0z4ib73	vgp_run_j6hantone7koffr2	vgp_item_55_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_k5fmlf52394w26aj	vgp_run_j6hantone7koffr2	vgp_item_56_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_kvtvzc9r457o16pq	vgp_run_j6hantone7koffr2	vgp_item_57_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_y311h9ja58uo0ama	vgp_run_j6hantone7koffr2	vgp_item_58_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_7izt3ilxb6zmxpep	vgp_run_j6hantone7koffr2	vgp_item_59_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_w06jp36obsji5xe0	vgp_run_j6hantone7koffr2	vgp_item_60_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_0lw9y3zx09q7hje8	vgp_run_j6hantone7koffr2	vgp_item_61_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_ff23mj5ogs2i7g41	vgp_run_j6hantone7koffr2	vgp_item_62_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_l3yfrd9webnt2685	vgp_run_j6hantone7koffr2	vgp_item_63_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_u5ju0d0p9odc0kxz	vgp_run_j6hantone7koffr2	vgp_item_64_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_d1lzekad8baox24y	vgp_run_j6hantone7koffr2	vgp_item_65_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_ntta92a9uj14jla3	vgp_run_j6hantone7koffr2	vgp_item_66_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_m7n1fwyk8diou6xa	vgp_run_j6hantone7koffr2	vgp_item_67_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_xkup2k4aovpzkxp1	vgp_run_j6hantone7koffr2	vgp_item_68_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_dler8e8u0k2x49lz	vgp_run_j6hantone7koffr2	vgp_item_69_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_yxrdmim887lcmm91	vgp_run_j6hantone7koffr2	vgp_item_70_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_xh436leqada1r7sg	vgp_run_j6hantone7koffr2	vgp_item_71_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_5ebocmozpjrx8drq	vgp_run_j6hantone7koffr2	vgp_item_72_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_on1o2gq5gg8q6m91	vgp_run_j6hantone7koffr2	vgp_item_73_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_r8f1xbpgc35h8zrg	vgp_run_j6hantone7koffr2	vgp_item_74_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_etr2zycnyze3ubjw	vgp_run_j6hantone7koffr2	vgp_item_75_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_tp0enmd9r6rsoke2	vgp_run_j6hantone7koffr2	vgp_item_76_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_gptb6d5pkyq84sc4	vgp_run_h7fq4o66hgl0rvuc	vgp_item_1_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_ije681jhf4ngmpil	vgp_run_h7fq4o66hgl0rvuc	vgp_item_2_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_yncbhysa07e1ivt4	vgp_run_h7fq4o66hgl0rvuc	vgp_item_3_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_scdydmio4ee43qv4	vgp_run_h7fq4o66hgl0rvuc	vgp_item_4_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_ggtlsqltp6k4po3y	vgp_run_h7fq4o66hgl0rvuc	vgp_item_5_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_lg4sq10f5xay6zja	vgp_run_h7fq4o66hgl0rvuc	vgp_item_6_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_1qumtit5uqgx5mcz	vgp_run_h7fq4o66hgl0rvuc	vgp_item_7_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_h84wt0enh22we091	vgp_run_h7fq4o66hgl0rvuc	vgp_item_8_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_uhpmj0qie6nedvvm	vgp_run_h7fq4o66hgl0rvuc	vgp_item_9_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_miyx1fmywpk0p9oo	vgp_run_h7fq4o66hgl0rvuc	vgp_item_10_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_tgtdjlomiy7fclsx	vgp_run_h7fq4o66hgl0rvuc	vgp_item_11_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_k3idjncj6x38qvnr	vgp_run_h7fq4o66hgl0rvuc	vgp_item_12_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_jfnf5315o2uaarr1	vgp_run_h7fq4o66hgl0rvuc	vgp_item_13_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_jy5roukgue186h57	vgp_run_h7fq4o66hgl0rvuc	vgp_item_14_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_0g2u65d0f3rxsgrs	vgp_run_h7fq4o66hgl0rvuc	vgp_item_15_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_9crop4zoxuqfferf	vgp_run_h7fq4o66hgl0rvuc	vgp_item_16_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_yvoqbxc6qekg0fxq	vgp_run_h7fq4o66hgl0rvuc	vgp_item_17_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_o5x8z1gh9o8jw7z6	vgp_run_h7fq4o66hgl0rvuc	vgp_item_18_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_tyiljkp9rtasoznl	vgp_run_h7fq4o66hgl0rvuc	vgp_item_19_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_y6efafakz3qw7t8w	vgp_run_h7fq4o66hgl0rvuc	vgp_item_20_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_4w6qywv0gpk08vxa	vgp_run_h7fq4o66hgl0rvuc	vgp_item_21_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_aogut9qd61us28j3	vgp_run_h7fq4o66hgl0rvuc	vgp_item_22_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_3c3surzlx2z51vst	vgp_run_h7fq4o66hgl0rvuc	vgp_item_23_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_stiy7w991ifm7azs	vgp_run_h7fq4o66hgl0rvuc	vgp_item_24_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_dkc3jlszzcw8jho1	vgp_run_h7fq4o66hgl0rvuc	vgp_item_25_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_5z8yrvn6k1ucev3e	vgp_run_h7fq4o66hgl0rvuc	vgp_item_26_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_nmvy6bstfxfg2dnz	vgp_run_h7fq4o66hgl0rvuc	vgp_item_27_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_4ihwpzmwyxz6cpib	vgp_run_h7fq4o66hgl0rvuc	vgp_item_28_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_k0hef250gy4uv2g1	vgp_run_h7fq4o66hgl0rvuc	vgp_item_29_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_8ie8tpnrjjhnh1n2	vgp_run_h7fq4o66hgl0rvuc	vgp_item_30_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_56p2tb9yi9j260ct	vgp_run_h7fq4o66hgl0rvuc	vgp_item_31_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_rm9gf1t5nlcmhvu4	vgp_run_h7fq4o66hgl0rvuc	vgp_item_32_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_omh8jud9plqnhe36	vgp_run_h7fq4o66hgl0rvuc	vgp_item_33_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_37v3dgc9ivbk7ojq	vgp_run_h7fq4o66hgl0rvuc	vgp_item_34_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_7c7divz5yqx4k539	vgp_run_h7fq4o66hgl0rvuc	vgp_item_35_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_txqnkyqn7ejla129	vgp_run_h7fq4o66hgl0rvuc	vgp_item_36_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_0aydp48bw5v41p9a	vgp_run_h7fq4o66hgl0rvuc	vgp_item_37_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_yes8kwddthice1e9	vgp_run_h7fq4o66hgl0rvuc	vgp_item_38_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_ywdfg5trm0sfl1z4	vgp_run_h7fq4o66hgl0rvuc	vgp_item_39_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_gia237c6zl9xhrqz	vgp_run_h7fq4o66hgl0rvuc	vgp_item_40_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_1ehihydx0mkjs3db	vgp_run_h7fq4o66hgl0rvuc	vgp_item_41_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_rm4iar6olelfvbvl	vgp_run_h7fq4o66hgl0rvuc	vgp_item_42_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_67ta1ihl2msratcd	vgp_run_h7fq4o66hgl0rvuc	vgp_item_43_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_p69rtzzhzo359blk	vgp_run_h7fq4o66hgl0rvuc	vgp_item_44_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_wettx2cqf0y67j21	vgp_run_h7fq4o66hgl0rvuc	vgp_item_45_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_6uyi4sulhdfbff97	vgp_run_h7fq4o66hgl0rvuc	vgp_item_46_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_w2bk8oa2yhbsd7kn	vgp_run_h7fq4o66hgl0rvuc	vgp_item_47_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_j313ki8qev0i2dwk	vgp_run_h7fq4o66hgl0rvuc	vgp_item_48_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_oil8ygv9i8ky76ef	vgp_run_h7fq4o66hgl0rvuc	vgp_item_49_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_082h8b3y5yx8aiqz	vgp_run_h7fq4o66hgl0rvuc	vgp_item_50_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_ktnyk2ebrm0nha2f	vgp_run_h7fq4o66hgl0rvuc	vgp_item_51_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_niftuwd8ykq4yw15	vgp_run_h7fq4o66hgl0rvuc	vgp_item_52_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_jzjlju2yjik7cbf1	vgp_run_h7fq4o66hgl0rvuc	vgp_item_53_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_pddw25p8akag688q	vgp_run_h7fq4o66hgl0rvuc	vgp_item_54_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_amqwtbbabwfeie4z	vgp_run_h7fq4o66hgl0rvuc	vgp_item_55_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_8rny8qyjlk20kn80	vgp_run_h7fq4o66hgl0rvuc	vgp_item_56_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_ocs9fgnpoykjrqf8	vgp_run_h7fq4o66hgl0rvuc	vgp_item_57_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_4zy22yd39ukj92mr	vgp_run_h7fq4o66hgl0rvuc	vgp_item_58_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_ajhcc3vaavetl799	vgp_run_h7fq4o66hgl0rvuc	vgp_item_59_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_sddoqp85iyh7zzv9	vgp_run_h7fq4o66hgl0rvuc	vgp_item_60_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_g55l50jymw8uhonu	vgp_run_h7fq4o66hgl0rvuc	vgp_item_61_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_jbpom3puqwfip6p0	vgp_run_h7fq4o66hgl0rvuc	vgp_item_62_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_qm6vq2fmnrwyne81	vgp_run_h7fq4o66hgl0rvuc	vgp_item_63_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_epuveliyqgpep0xq	vgp_run_h7fq4o66hgl0rvuc	vgp_item_64_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_47qacfzxtjkm57q9	vgp_run_h7fq4o66hgl0rvuc	vgp_item_65_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_68fimv5gonvybasg	vgp_run_h7fq4o66hgl0rvuc	vgp_item_66_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_fmnfmkzdu0molr4d	vgp_run_h7fq4o66hgl0rvuc	vgp_item_67_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_5uagi41eoa1j9f2z	vgp_run_h7fq4o66hgl0rvuc	vgp_item_68_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_j43gr7mhcnsycmbc	vgp_run_h7fq4o66hgl0rvuc	vgp_item_69_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_2pxy4lbvri4dzx20	vgp_run_h7fq4o66hgl0rvuc	vgp_item_70_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_bxcxb50nyenwo2h9	vgp_run_h7fq4o66hgl0rvuc	vgp_item_71_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_8i3skc1tvhphlabr	vgp_run_h7fq4o66hgl0rvuc	vgp_item_72_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_mp69qlq98o1cyt8l	vgp_run_h7fq4o66hgl0rvuc	vgp_item_73_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_ppqrth1u75v32kgl	vgp_run_h7fq4o66hgl0rvuc	vgp_item_74_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_j9ctwppyvtnhi250	vgp_run_h7fq4o66hgl0rvuc	vgp_item_75_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_3clyspbhb2ia2103	vgp_run_h7fq4o66hgl0rvuc	vgp_item_76_v1	NA	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_res_eahk31cf3lj8d87x	vgp_run_6un5h43dds90ayge	vgp_item_1_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_aar2kvvkch3ensbk	vgp_run_6un5h43dds90ayge	vgp_item_2_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_5q7gv3pvf57y6plw	vgp_run_6un5h43dds90ayge	vgp_item_3_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_axy623fzibyq7trx	vgp_run_6un5h43dds90ayge	vgp_item_4_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_b1ccibpquqn10vm9	vgp_run_6un5h43dds90ayge	vgp_item_5_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_mjhk7rvf8ltdx8ry	vgp_run_6un5h43dds90ayge	vgp_item_6_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_h8wozaebsxjtdduh	vgp_run_6un5h43dds90ayge	vgp_item_7_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_zggfah9plddxyr0e	vgp_run_6un5h43dds90ayge	vgp_item_8_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_529doeful5fgmrqb	vgp_run_6un5h43dds90ayge	vgp_item_9_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_7q71r0cppag61lhw	vgp_run_6un5h43dds90ayge	vgp_item_10_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_kc33q7pg5tn0n6ba	vgp_run_6un5h43dds90ayge	vgp_item_11_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_c99v0bzfab5dyo31	vgp_run_6un5h43dds90ayge	vgp_item_12_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_6qs8iugjy4egi6ou	vgp_run_6un5h43dds90ayge	vgp_item_13_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_lu6580r3z0jnaecg	vgp_run_6un5h43dds90ayge	vgp_item_14_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_y4mitw1n7ytdoqee	vgp_run_6un5h43dds90ayge	vgp_item_15_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_ph4ehe3bcagibpl8	vgp_run_6un5h43dds90ayge	vgp_item_16_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_hhnc3j8lhi14lpbz	vgp_run_6un5h43dds90ayge	vgp_item_17_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_171l4iokvosn90iq	vgp_run_6un5h43dds90ayge	vgp_item_18_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_9dp2r5wxvthhu9j5	vgp_run_6un5h43dds90ayge	vgp_item_19_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_6txilhwvwzvwesmi	vgp_run_6un5h43dds90ayge	vgp_item_20_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_8vtev4jrcqkrtrmh	vgp_run_6un5h43dds90ayge	vgp_item_21_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_l06ws20qsoxujabq	vgp_run_6un5h43dds90ayge	vgp_item_22_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_6al8i65ckbxlrxca	vgp_run_6un5h43dds90ayge	vgp_item_23_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_edi17sjhtnix26ts	vgp_run_6un5h43dds90ayge	vgp_item_24_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_k2rxjpi3vlm2ffh2	vgp_run_6un5h43dds90ayge	vgp_item_25_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_ld06vdy4yt366axv	vgp_run_6un5h43dds90ayge	vgp_item_26_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_ks35w3kmc3ra75um	vgp_run_6un5h43dds90ayge	vgp_item_27_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_vdyai654iyut5u1v	vgp_run_6un5h43dds90ayge	vgp_item_28_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_z2h64gmob67x6aeg	vgp_run_6un5h43dds90ayge	vgp_item_29_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_j5ygku4d2hciyxag	vgp_run_6un5h43dds90ayge	vgp_item_30_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_ccn1wkayc77o0tyw	vgp_run_6un5h43dds90ayge	vgp_item_31_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_fik2cgj0v6kp2txf	vgp_run_6un5h43dds90ayge	vgp_item_32_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_b89lxbe9laii1eoo	vgp_run_6un5h43dds90ayge	vgp_item_33_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_s788sv2ksbiorzt1	vgp_run_6un5h43dds90ayge	vgp_item_34_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_5w7wu79qjr323jaj	vgp_run_6un5h43dds90ayge	vgp_item_35_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_0av6m4diyvf66hkl	vgp_run_6un5h43dds90ayge	vgp_item_36_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_7ky8bvxou6t115cd	vgp_run_6un5h43dds90ayge	vgp_item_37_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_0vmzfc7mjrskx600	vgp_run_6un5h43dds90ayge	vgp_item_38_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_foumfqqhlnzs17rj	vgp_run_6un5h43dds90ayge	vgp_item_39_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_d0619loyj9ftvqyn	vgp_run_6un5h43dds90ayge	vgp_item_40_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_97nn3wjzqa3o18fu	vgp_run_6un5h43dds90ayge	vgp_item_41_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_503lfcufxig7zv6g	vgp_run_6un5h43dds90ayge	vgp_item_42_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_z95ilmfcq0okpm60	vgp_run_6un5h43dds90ayge	vgp_item_43_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_085crgr1slb2ux2e	vgp_run_6un5h43dds90ayge	vgp_item_44_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_v173nmrpyujhknp8	vgp_run_6un5h43dds90ayge	vgp_item_45_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_m54lbqthq0fos1n7	vgp_run_6un5h43dds90ayge	vgp_item_46_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_x3xl1kvb3j800tem	vgp_run_6un5h43dds90ayge	vgp_item_47_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_jb50efk214qvogrx	vgp_run_6un5h43dds90ayge	vgp_item_48_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_st9dnjdtkhytrvpx	vgp_run_6un5h43dds90ayge	vgp_item_49_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_kfoeir5lx0hy8twk	vgp_run_6un5h43dds90ayge	vgp_item_50_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_jlvkseh5tovnr176	vgp_run_6un5h43dds90ayge	vgp_item_51_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_zcdu09w23ewah9mi	vgp_run_6un5h43dds90ayge	vgp_item_52_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_0gvmnao7kh8pyfcs	vgp_run_6un5h43dds90ayge	vgp_item_53_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_td6jktptzzq138q8	vgp_run_6un5h43dds90ayge	vgp_item_54_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_l2ot562ig0zj7x96	vgp_run_6un5h43dds90ayge	vgp_item_55_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_nhu6fs3u4a1x52he	vgp_run_6un5h43dds90ayge	vgp_item_56_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_frtjk1o8nzv9alto	vgp_run_6un5h43dds90ayge	vgp_item_57_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_txpzcin0pfdjl88t	vgp_run_6un5h43dds90ayge	vgp_item_58_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_ajlx49ma1g3nck92	vgp_run_6un5h43dds90ayge	vgp_item_59_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_8rjkxsi1c2n0lmz7	vgp_run_6un5h43dds90ayge	vgp_item_60_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_pysxldxgixn9v6q7	vgp_run_6un5h43dds90ayge	vgp_item_61_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_dn2nagacd0tvujs6	vgp_run_6un5h43dds90ayge	vgp_item_62_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_vkdtuwebqu9o0uze	vgp_run_6un5h43dds90ayge	vgp_item_63_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_icd0ubblro1dxjco	vgp_run_6un5h43dds90ayge	vgp_item_64_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_nqaapxpuztkpbmts	vgp_run_6un5h43dds90ayge	vgp_item_65_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_ghtjmr9hh8ay3rqb	vgp_run_6un5h43dds90ayge	vgp_item_66_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_59gydzejtaf26oeh	vgp_run_6un5h43dds90ayge	vgp_item_67_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_bcnvhf6gcc3sxhbq	vgp_run_6un5h43dds90ayge	vgp_item_68_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_y01r0p6uhbrvrf9m	vgp_run_6un5h43dds90ayge	vgp_item_69_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_kk35850yor9l2450	vgp_run_6un5h43dds90ayge	vgp_item_70_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_xtu1wp6qvjhpwn8r	vgp_run_6un5h43dds90ayge	vgp_item_71_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_ur0g3y43pcmzxw99	vgp_run_6un5h43dds90ayge	vgp_item_72_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_mk8t8qimdx4xmab2	vgp_run_6un5h43dds90ayge	vgp_item_73_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_7yb8b04cbbogxbkf	vgp_run_6un5h43dds90ayge	vgp_item_74_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_dmb1av9rt624at4l	vgp_run_6un5h43dds90ayge	vgp_item_75_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_alw8embo4kqr4z9b	vgp_run_6un5h43dds90ayge	vgp_item_76_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_5i3ahktcmqh7qjoh	vgp_run_p004qbrz8xz6s33o	vgp_item_1_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_ncq752u0l4mjqqoa	vgp_run_p004qbrz8xz6s33o	vgp_item_2_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_i38uokkqog65478b	vgp_run_p004qbrz8xz6s33o	vgp_item_3_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_c76g222ie137f7h3	vgp_run_p004qbrz8xz6s33o	vgp_item_4_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_2d357cjif0gc0lmt	vgp_run_p004qbrz8xz6s33o	vgp_item_5_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_9h9qw1f8quuxsy3o	vgp_run_p004qbrz8xz6s33o	vgp_item_6_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_impohusrmhsyfyi0	vgp_run_p004qbrz8xz6s33o	vgp_item_7_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_oaxj974f2blbm7qr	vgp_run_p004qbrz8xz6s33o	vgp_item_8_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_claf5l82cu2h63ih	vgp_run_p004qbrz8xz6s33o	vgp_item_9_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_76qjfxgpatp79ih2	vgp_run_p004qbrz8xz6s33o	vgp_item_10_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_x3j7m4r0spm1ce5b	vgp_run_p004qbrz8xz6s33o	vgp_item_11_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_206uydwf183zfph4	vgp_run_p004qbrz8xz6s33o	vgp_item_12_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_zysmflqsyuu6u0j7	vgp_run_p004qbrz8xz6s33o	vgp_item_13_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_deo2ljwuodmdukmj	vgp_run_p004qbrz8xz6s33o	vgp_item_14_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_4a0x4m5kv1f28z65	vgp_run_p004qbrz8xz6s33o	vgp_item_15_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_sdnb6h3mdmaiysao	vgp_run_p004qbrz8xz6s33o	vgp_item_16_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_tucmi8nmdl60zujt	vgp_run_p004qbrz8xz6s33o	vgp_item_17_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_3ohl75on2ij57t04	vgp_run_p004qbrz8xz6s33o	vgp_item_18_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_sx0x92b1on477p5r	vgp_run_p004qbrz8xz6s33o	vgp_item_19_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_xd2symmfpc5mbekl	vgp_run_p004qbrz8xz6s33o	vgp_item_20_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_khuaa3a091p5rgmo	vgp_run_p004qbrz8xz6s33o	vgp_item_21_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_ql41x95qxe9ilh44	vgp_run_p004qbrz8xz6s33o	vgp_item_22_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_2b0msrsup9680wl9	vgp_run_p004qbrz8xz6s33o	vgp_item_23_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_h47lpcahpxxt969a	vgp_run_p004qbrz8xz6s33o	vgp_item_24_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_5114lfddsxsqw6nl	vgp_run_p004qbrz8xz6s33o	vgp_item_25_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_0i65y3es12ydp6fq	vgp_run_p004qbrz8xz6s33o	vgp_item_26_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_nc2agytc22fnqljz	vgp_run_p004qbrz8xz6s33o	vgp_item_27_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_krd7owxrochkfaul	vgp_run_p004qbrz8xz6s33o	vgp_item_28_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_donfzwbc3vypcvyn	vgp_run_p004qbrz8xz6s33o	vgp_item_29_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_hj27n8f61lewlwgp	vgp_run_p004qbrz8xz6s33o	vgp_item_30_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_kxhodk76u2zohw58	vgp_run_p004qbrz8xz6s33o	vgp_item_31_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_s00jy6ldl4y1ll3j	vgp_run_p004qbrz8xz6s33o	vgp_item_32_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_drouehi3a1pgutnc	vgp_run_p004qbrz8xz6s33o	vgp_item_33_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_ncp1da3jjvkz9ssb	vgp_run_p004qbrz8xz6s33o	vgp_item_34_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_66jmp8y5iekt4y6w	vgp_run_p004qbrz8xz6s33o	vgp_item_35_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_kszag9hp6xwb3v9g	vgp_run_p004qbrz8xz6s33o	vgp_item_36_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_da3qnlnq3yhkkh47	vgp_run_p004qbrz8xz6s33o	vgp_item_37_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_3jg4rkqlixmvo2wj	vgp_run_p004qbrz8xz6s33o	vgp_item_38_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_jm6vh4khi7drwg46	vgp_run_p004qbrz8xz6s33o	vgp_item_39_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_tn7njlg9c504zh9u	vgp_run_p004qbrz8xz6s33o	vgp_item_40_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_9tl7wu1nexmm3cqg	vgp_run_p004qbrz8xz6s33o	vgp_item_41_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_r28z9wqqmucy9tv3	vgp_run_p004qbrz8xz6s33o	vgp_item_42_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_zfef0c3vhchknqdl	vgp_run_p004qbrz8xz6s33o	vgp_item_43_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_m75rs0prwprldvze	vgp_run_p004qbrz8xz6s33o	vgp_item_44_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_px54czmnhrmk739y	vgp_run_p004qbrz8xz6s33o	vgp_item_45_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_3ugar45wmnl2x1ho	vgp_run_p004qbrz8xz6s33o	vgp_item_46_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_pc3sv11i1u3o1icz	vgp_run_p004qbrz8xz6s33o	vgp_item_47_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_h4tad4k1i3nxqxh5	vgp_run_p004qbrz8xz6s33o	vgp_item_48_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_xpeboc0ma302ubpa	vgp_run_p004qbrz8xz6s33o	vgp_item_49_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_suy753linkuwfokn	vgp_run_p004qbrz8xz6s33o	vgp_item_50_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_ouun7792kbgob0n9	vgp_run_p004qbrz8xz6s33o	vgp_item_51_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_48n8dhxk7o415834	vgp_run_p004qbrz8xz6s33o	vgp_item_52_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_taa59nk2ys03i226	vgp_run_p004qbrz8xz6s33o	vgp_item_53_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_rqky15qbmjlc1ive	vgp_run_p004qbrz8xz6s33o	vgp_item_54_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_ydryt24qvtgghmrf	vgp_run_p004qbrz8xz6s33o	vgp_item_55_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_hq8p7tpyxyjfwn7o	vgp_run_p004qbrz8xz6s33o	vgp_item_56_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_is3tox39vl3w24ly	vgp_run_p004qbrz8xz6s33o	vgp_item_57_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_ng79qw2j08x4ht80	vgp_run_p004qbrz8xz6s33o	vgp_item_58_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_f92aqok0qyo27u1h	vgp_run_p004qbrz8xz6s33o	vgp_item_59_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_88gkxdjcuz2u7n5x	vgp_run_p004qbrz8xz6s33o	vgp_item_60_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_rokycx6n7ukna6cq	vgp_run_p004qbrz8xz6s33o	vgp_item_61_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_9b6qhobk3i07o6el	vgp_run_p004qbrz8xz6s33o	vgp_item_62_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_sijnfz5jujhccom7	vgp_run_p004qbrz8xz6s33o	vgp_item_63_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_pz5qvsnzc5dxl1tu	vgp_run_p004qbrz8xz6s33o	vgp_item_64_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_aim85wk0kp4p399u	vgp_run_p004qbrz8xz6s33o	vgp_item_65_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_sxus4hsmgmkylh73	vgp_run_p004qbrz8xz6s33o	vgp_item_66_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_ew5u35f0t1pp42ms	vgp_run_p004qbrz8xz6s33o	vgp_item_67_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_mqbara7siwx2wfri	vgp_run_p004qbrz8xz6s33o	vgp_item_68_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_nye1w2qglnazvhc5	vgp_run_p004qbrz8xz6s33o	vgp_item_69_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_hyw91ndulxx6y376	vgp_run_p004qbrz8xz6s33o	vgp_item_70_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_x6rdmlguve0cwkao	vgp_run_p004qbrz8xz6s33o	vgp_item_71_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_9i20oipbrd0rwo6e	vgp_run_p004qbrz8xz6s33o	vgp_item_72_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_fmvpzvjpfl4okusc	vgp_run_p004qbrz8xz6s33o	vgp_item_73_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_bq0gj68ru2ih4dwi	vgp_run_p004qbrz8xz6s33o	vgp_item_74_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_aaac7z5oq3z9tod6	vgp_run_p004qbrz8xz6s33o	vgp_item_75_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_r8xjp017xlvb0nur	vgp_run_p004qbrz8xz6s33o	vgp_item_76_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_3kxsw11lku9s9cmk	vgp_run_by5cgg90cn1mj3in	vgp_item_1_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_df7avipctrt6wz10	vgp_run_by5cgg90cn1mj3in	vgp_item_2_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_5n8xf762hykglzbk	vgp_run_by5cgg90cn1mj3in	vgp_item_3_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_cria33g2tm89xk4l	vgp_run_by5cgg90cn1mj3in	vgp_item_4_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_5681jjk689e5v9kh	vgp_run_by5cgg90cn1mj3in	vgp_item_5_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_x9s7tofgfwtruj1j	vgp_run_by5cgg90cn1mj3in	vgp_item_6_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_715ayx35rbsej7c3	vgp_run_by5cgg90cn1mj3in	vgp_item_7_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_np0sr7aw33e6boh6	vgp_run_by5cgg90cn1mj3in	vgp_item_8_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_64gkyy16xzxj0j6w	vgp_run_by5cgg90cn1mj3in	vgp_item_9_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_9ydul02jid9gmmkg	vgp_run_by5cgg90cn1mj3in	vgp_item_10_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_cj32hj6a92gfig5g	vgp_run_by5cgg90cn1mj3in	vgp_item_11_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_47z8ra24pjb9yxwf	vgp_run_by5cgg90cn1mj3in	vgp_item_12_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_gu0cldb43fzymfvp	vgp_run_by5cgg90cn1mj3in	vgp_item_13_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_3xe8km1csd8w5696	vgp_run_by5cgg90cn1mj3in	vgp_item_14_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_ghfgrhr4vsb55636	vgp_run_by5cgg90cn1mj3in	vgp_item_15_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_0a7tunv6hg04hq4e	vgp_run_by5cgg90cn1mj3in	vgp_item_16_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_5mnqasmpcmb6aeqe	vgp_run_by5cgg90cn1mj3in	vgp_item_17_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_9lmknkw51sowz4lj	vgp_run_by5cgg90cn1mj3in	vgp_item_18_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_vl77lxptuoz70p90	vgp_run_by5cgg90cn1mj3in	vgp_item_19_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_b8sgsa34h2t59pgk	vgp_run_by5cgg90cn1mj3in	vgp_item_20_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_fcymcnipuy1cryve	vgp_run_by5cgg90cn1mj3in	vgp_item_21_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_ko6s87mmul7aryxm	vgp_run_by5cgg90cn1mj3in	vgp_item_22_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_is2dl4cl12ik65et	vgp_run_by5cgg90cn1mj3in	vgp_item_23_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_8r96d3zmi68po2i9	vgp_run_by5cgg90cn1mj3in	vgp_item_24_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_edg24vh2exd3zo1m	vgp_run_by5cgg90cn1mj3in	vgp_item_25_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_1suk6x1vybposj0t	vgp_run_by5cgg90cn1mj3in	vgp_item_26_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_0r7aredv1xggbp4c	vgp_run_by5cgg90cn1mj3in	vgp_item_27_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_jqk5cqm6mp6y63rj	vgp_run_by5cgg90cn1mj3in	vgp_item_28_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_kcahk4n8lw1on5yq	vgp_run_by5cgg90cn1mj3in	vgp_item_29_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_zdgy98ciwc0ol0zo	vgp_run_by5cgg90cn1mj3in	vgp_item_30_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_j91v65sohevcqdty	vgp_run_by5cgg90cn1mj3in	vgp_item_31_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_u4k1k11c6kjd98yi	vgp_run_by5cgg90cn1mj3in	vgp_item_32_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_po64qw3yctac11es	vgp_run_by5cgg90cn1mj3in	vgp_item_33_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_euri6l88ipndfoq8	vgp_run_by5cgg90cn1mj3in	vgp_item_34_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_ej7gw9wv4z8wk847	vgp_run_by5cgg90cn1mj3in	vgp_item_35_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_s4qag286mtbk076d	vgp_run_by5cgg90cn1mj3in	vgp_item_36_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_mvbrfq1j53ficro4	vgp_run_by5cgg90cn1mj3in	vgp_item_37_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_4wagm81so9bxb0vo	vgp_run_by5cgg90cn1mj3in	vgp_item_38_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_vmbs7memdzgqysby	vgp_run_by5cgg90cn1mj3in	vgp_item_39_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_5smypdz4t9lb6ow4	vgp_run_by5cgg90cn1mj3in	vgp_item_40_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_vwm16hy3083qoox2	vgp_run_by5cgg90cn1mj3in	vgp_item_41_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_62z91lq7bfyn2ncm	vgp_run_by5cgg90cn1mj3in	vgp_item_42_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_7guz29c7hl5mx7yb	vgp_run_by5cgg90cn1mj3in	vgp_item_43_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_wqztp2idglroyct0	vgp_run_by5cgg90cn1mj3in	vgp_item_44_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_6nji30ib2vzlnx00	vgp_run_by5cgg90cn1mj3in	vgp_item_45_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_7pu74vae5wbpdchf	vgp_run_by5cgg90cn1mj3in	vgp_item_46_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_lopqp3slqlwf02ke	vgp_run_by5cgg90cn1mj3in	vgp_item_47_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_0v88o9n1nnugs6sa	vgp_run_by5cgg90cn1mj3in	vgp_item_48_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_zsfazo5apajz5v6f	vgp_run_by5cgg90cn1mj3in	vgp_item_49_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_vw3v5p6uwmy1zvec	vgp_run_by5cgg90cn1mj3in	vgp_item_50_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_jmd9f40qfy0zhj20	vgp_run_by5cgg90cn1mj3in	vgp_item_51_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_tu1u09gt38j8hb5o	vgp_run_by5cgg90cn1mj3in	vgp_item_52_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_bxbev35fbs782tz8	vgp_run_by5cgg90cn1mj3in	vgp_item_53_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_c2i870n0rowpd0s1	vgp_run_by5cgg90cn1mj3in	vgp_item_54_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_k8wpov0lsldjrogl	vgp_run_by5cgg90cn1mj3in	vgp_item_55_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_tb7kjp086ras2klr	vgp_run_by5cgg90cn1mj3in	vgp_item_56_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_mxlk1xvlcrlk5zox	vgp_run_by5cgg90cn1mj3in	vgp_item_57_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_3y25fkaapa54ded7	vgp_run_by5cgg90cn1mj3in	vgp_item_58_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_pqz305pdsxwyr6ax	vgp_run_by5cgg90cn1mj3in	vgp_item_59_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_cn6mkk0fd8fdrhjm	vgp_run_by5cgg90cn1mj3in	vgp_item_60_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_9vrgvostojhg5o5d	vgp_run_by5cgg90cn1mj3in	vgp_item_61_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_yjgwu62or9kr4alb	vgp_run_by5cgg90cn1mj3in	vgp_item_62_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_yyoo7s59n5q97j4o	vgp_run_by5cgg90cn1mj3in	vgp_item_63_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_9l9635foy5w26hr9	vgp_run_by5cgg90cn1mj3in	vgp_item_64_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_2ouavw52ol6r5yob	vgp_run_by5cgg90cn1mj3in	vgp_item_65_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_ifkeeisj89rta3s9	vgp_run_by5cgg90cn1mj3in	vgp_item_66_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_3giw5b5rf29qwr6h	vgp_run_by5cgg90cn1mj3in	vgp_item_67_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_28qkiil4qpq059sq	vgp_run_by5cgg90cn1mj3in	vgp_item_68_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_au8w18iipecusmks	vgp_run_by5cgg90cn1mj3in	vgp_item_69_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_przxxycqzf3h8lez	vgp_run_by5cgg90cn1mj3in	vgp_item_70_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_dk180ank0e1zv59d	vgp_run_by5cgg90cn1mj3in	vgp_item_71_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_2tfqrleiob5l6n9r	vgp_run_by5cgg90cn1mj3in	vgp_item_72_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_uo1e2y03ikxezbkq	vgp_run_by5cgg90cn1mj3in	vgp_item_73_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_n0g3k9i6cq7ioa8c	vgp_run_by5cgg90cn1mj3in	vgp_item_74_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_bl4m2852sgg87yc8	vgp_run_by5cgg90cn1mj3in	vgp_item_75_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_5t9k87mcc2f1qs50	vgp_run_by5cgg90cn1mj3in	vgp_item_76_v1	NA	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_res_idgnuwjrwi1of0z2	vgp_run_mihdyahbrzvupw6x	vgp_item_1_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_4ik4gz47ceovgqyo	vgp_run_mihdyahbrzvupw6x	vgp_item_2_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_m74avifnxpehp4lm	vgp_run_mihdyahbrzvupw6x	vgp_item_3_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_9k5qb0jarx6v76br	vgp_run_mihdyahbrzvupw6x	vgp_item_4_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_2iigtkmh5puqi2s0	vgp_run_mihdyahbrzvupw6x	vgp_item_5_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_6yjl17oijb5h8imp	vgp_run_mihdyahbrzvupw6x	vgp_item_6_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_lofgswcc4m61qdry	vgp_run_mihdyahbrzvupw6x	vgp_item_7_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_gfn2kusr4g8dh4hi	vgp_run_mihdyahbrzvupw6x	vgp_item_8_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_y9js8f0ww2qqiyby	vgp_run_mihdyahbrzvupw6x	vgp_item_9_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_xpdktky3irbdfuae	vgp_run_mihdyahbrzvupw6x	vgp_item_10_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_a6vub949ksgxc11a	vgp_run_mihdyahbrzvupw6x	vgp_item_11_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_lju1pmhbv0tkgfu2	vgp_run_mihdyahbrzvupw6x	vgp_item_12_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_kn22x043f5w1rtb2	vgp_run_mihdyahbrzvupw6x	vgp_item_13_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_fr2o0jxhzavp9aah	vgp_run_mihdyahbrzvupw6x	vgp_item_14_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_k2zdepmdrahbnwyd	vgp_run_mihdyahbrzvupw6x	vgp_item_15_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_5usqepzh255jyghl	vgp_run_mihdyahbrzvupw6x	vgp_item_16_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_qx0vyymhzlbq7l0y	vgp_run_mihdyahbrzvupw6x	vgp_item_17_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_2sebtgneomn6a7uq	vgp_run_mihdyahbrzvupw6x	vgp_item_18_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_45ishir0v0w62x6i	vgp_run_mihdyahbrzvupw6x	vgp_item_19_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_sqz5ny1189xvqpnu	vgp_run_mihdyahbrzvupw6x	vgp_item_20_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_0wjtrnwvb0pszco1	vgp_run_mihdyahbrzvupw6x	vgp_item_21_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_u9pnl6og1ha97bj0	vgp_run_mihdyahbrzvupw6x	vgp_item_22_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_k4a3d67x0q5442oc	vgp_run_mihdyahbrzvupw6x	vgp_item_23_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_r3z5gygglhas0ya4	vgp_run_mihdyahbrzvupw6x	vgp_item_24_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_3bpsgdtjc060hbs9	vgp_run_mihdyahbrzvupw6x	vgp_item_25_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_27vr85arjhkh2cug	vgp_run_mihdyahbrzvupw6x	vgp_item_26_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_avyw3x8lv6nwumhn	vgp_run_mihdyahbrzvupw6x	vgp_item_27_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_e0sngpuz9znawggi	vgp_run_mihdyahbrzvupw6x	vgp_item_28_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_a5ewmcq3ej8p49wd	vgp_run_mihdyahbrzvupw6x	vgp_item_29_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_hd2jck8b8wqf4tzn	vgp_run_mihdyahbrzvupw6x	vgp_item_30_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_43brx2m1j8y61bjd	vgp_run_mihdyahbrzvupw6x	vgp_item_31_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_7uzjdkn1ak6xxgi3	vgp_run_mihdyahbrzvupw6x	vgp_item_32_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_erz0m79s0vlx8cp1	vgp_run_mihdyahbrzvupw6x	vgp_item_33_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_5lsx8lhcil6bhd6s	vgp_run_mihdyahbrzvupw6x	vgp_item_34_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_86is13yup5de0n66	vgp_run_mihdyahbrzvupw6x	vgp_item_35_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_bl2j0idbbv3g8mdm	vgp_run_mihdyahbrzvupw6x	vgp_item_36_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_gqq640iq8mo44zev	vgp_run_mihdyahbrzvupw6x	vgp_item_37_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_zo158zc6tq8km25f	vgp_run_mihdyahbrzvupw6x	vgp_item_38_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_0tofm675w6r07tox	vgp_run_mihdyahbrzvupw6x	vgp_item_39_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_np0b4gu0cfmfx4kz	vgp_run_mihdyahbrzvupw6x	vgp_item_40_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_1ui5lxdo4rqzqqiw	vgp_run_mihdyahbrzvupw6x	vgp_item_41_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_1bizaujoa0ytq1rg	vgp_run_mihdyahbrzvupw6x	vgp_item_42_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_k2z95eg06pnaeh0m	vgp_run_mihdyahbrzvupw6x	vgp_item_43_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_d5azu9swnzkzhqji	vgp_run_mihdyahbrzvupw6x	vgp_item_44_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_092ruz69gqjp4ro4	vgp_run_mihdyahbrzvupw6x	vgp_item_45_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_k84y4teglstko9cp	vgp_run_mihdyahbrzvupw6x	vgp_item_46_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_j9sk26kdkr42ksp2	vgp_run_mihdyahbrzvupw6x	vgp_item_47_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_ekys203eu20ctws4	vgp_run_mihdyahbrzvupw6x	vgp_item_48_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_ya1ghej0ze8rrrqo	vgp_run_mihdyahbrzvupw6x	vgp_item_49_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_uj530ccmv80x0mhb	vgp_run_mihdyahbrzvupw6x	vgp_item_50_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_exv0oy0at9uoiv1b	vgp_run_mihdyahbrzvupw6x	vgp_item_51_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_cwhwjmt12nreantd	vgp_run_mihdyahbrzvupw6x	vgp_item_52_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_3z5x4u1foo50573r	vgp_run_mihdyahbrzvupw6x	vgp_item_53_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_tudoj5wlrz5yjtml	vgp_run_mihdyahbrzvupw6x	vgp_item_54_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_9ukxkg4k67ikgcxg	vgp_run_mihdyahbrzvupw6x	vgp_item_55_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_gqn24axahuz4a7v9	vgp_run_mihdyahbrzvupw6x	vgp_item_56_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_rfws0k6pm916iop9	vgp_run_mihdyahbrzvupw6x	vgp_item_57_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_ce4qiz4tbe5d1lli	vgp_run_mihdyahbrzvupw6x	vgp_item_58_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_31qn1649xgwozcf3	vgp_run_mihdyahbrzvupw6x	vgp_item_59_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_loah1sbcct063mam	vgp_run_mihdyahbrzvupw6x	vgp_item_60_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_uib91yyn6trhdnus	vgp_run_mihdyahbrzvupw6x	vgp_item_61_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_d3h4plvnyzcw8h71	vgp_run_mihdyahbrzvupw6x	vgp_item_62_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_civspdqiqbn60nxj	vgp_run_mihdyahbrzvupw6x	vgp_item_63_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_hytqenpmkp54v4or	vgp_run_mihdyahbrzvupw6x	vgp_item_64_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_b6e1pnzqa8kd9bse	vgp_run_mihdyahbrzvupw6x	vgp_item_65_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_weibhua2cyqdtqt9	vgp_run_mihdyahbrzvupw6x	vgp_item_66_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_limzje89sn8plup2	vgp_run_mihdyahbrzvupw6x	vgp_item_67_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_5taf0r8a8nlyv3u1	vgp_run_mihdyahbrzvupw6x	vgp_item_68_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_iaqqmcjlmdn9v112	vgp_run_mihdyahbrzvupw6x	vgp_item_69_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_ekkxhorkb06yvbzp	vgp_run_mihdyahbrzvupw6x	vgp_item_70_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_p9ato5rxsrjbife3	vgp_run_mihdyahbrzvupw6x	vgp_item_71_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_90evgbant428fnmw	vgp_run_mihdyahbrzvupw6x	vgp_item_72_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_qiayrvoafw0sxzfi	vgp_run_mihdyahbrzvupw6x	vgp_item_73_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_1p8fnp2bs1p0n9my	vgp_run_mihdyahbrzvupw6x	vgp_item_74_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_r4h7ydvrv48a8r4o	vgp_run_mihdyahbrzvupw6x	vgp_item_75_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_i54xtxqx2ggpdcg1	vgp_run_mihdyahbrzvupw6x	vgp_item_76_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_e5f62cskgu1rd9q1	vgp_run_4zhqic7zdr2mq7ai	vgp_item_1_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_pr5cyuq6j9cqy9qs	vgp_run_4zhqic7zdr2mq7ai	vgp_item_2_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_y7sei0we4l589od8	vgp_run_4zhqic7zdr2mq7ai	vgp_item_3_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_iwn9dx8rv96gefhl	vgp_run_4zhqic7zdr2mq7ai	vgp_item_4_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_9ff6d2zwdjpppbsx	vgp_run_4zhqic7zdr2mq7ai	vgp_item_5_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_cna0l7bemdkzvgrd	vgp_run_4zhqic7zdr2mq7ai	vgp_item_6_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_u0o2gjasi02yvmol	vgp_run_4zhqic7zdr2mq7ai	vgp_item_7_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_ogw68205hqdweqz7	vgp_run_4zhqic7zdr2mq7ai	vgp_item_8_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_uy4zz79susgy6ef8	vgp_run_4zhqic7zdr2mq7ai	vgp_item_9_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_x70wsakvbia8ngxp	vgp_run_4zhqic7zdr2mq7ai	vgp_item_10_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_q1qapll3vej8kssw	vgp_run_4zhqic7zdr2mq7ai	vgp_item_11_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_st6e06n3yrza179i	vgp_run_4zhqic7zdr2mq7ai	vgp_item_12_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_xpnjsqv7u5ohj41t	vgp_run_4zhqic7zdr2mq7ai	vgp_item_13_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_0gfxa39548gz13u5	vgp_run_4zhqic7zdr2mq7ai	vgp_item_14_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_l4l12qota765nknd	vgp_run_4zhqic7zdr2mq7ai	vgp_item_15_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_k2ui9p849dzykdpj	vgp_run_4zhqic7zdr2mq7ai	vgp_item_16_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_ys73m9poln8rerh5	vgp_run_4zhqic7zdr2mq7ai	vgp_item_17_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_v2ascg5jroi5bigq	vgp_run_4zhqic7zdr2mq7ai	vgp_item_18_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_yqsewfpx6tvi06la	vgp_run_4zhqic7zdr2mq7ai	vgp_item_19_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_z8nma0qmgwvdjl7s	vgp_run_4zhqic7zdr2mq7ai	vgp_item_20_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_yqxvtthzr4dh20pw	vgp_run_4zhqic7zdr2mq7ai	vgp_item_21_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_42gdplp71wg60n30	vgp_run_4zhqic7zdr2mq7ai	vgp_item_22_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_j8s6kw90naevyi6u	vgp_run_4zhqic7zdr2mq7ai	vgp_item_23_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_ynar6lfvnyq1gn0z	vgp_run_4zhqic7zdr2mq7ai	vgp_item_24_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_cs4jdumcmnu4zv2n	vgp_run_4zhqic7zdr2mq7ai	vgp_item_25_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_n2489wq7kpau53lq	vgp_run_4zhqic7zdr2mq7ai	vgp_item_26_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_0wjasuyup4tpu91o	vgp_run_4zhqic7zdr2mq7ai	vgp_item_27_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_6a70cr8x3gioin9w	vgp_run_4zhqic7zdr2mq7ai	vgp_item_28_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_plfr6yipmvc5i73b	vgp_run_4zhqic7zdr2mq7ai	vgp_item_29_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_b29mffyb641xtc1b	vgp_run_4zhqic7zdr2mq7ai	vgp_item_30_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_nj0anbrt7hdv41qk	vgp_run_4zhqic7zdr2mq7ai	vgp_item_31_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_y5jk4tiehhllg82n	vgp_run_4zhqic7zdr2mq7ai	vgp_item_32_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_9llvjjokx4ihanip	vgp_run_4zhqic7zdr2mq7ai	vgp_item_33_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_pyh1yqpbghkua4bz	vgp_run_4zhqic7zdr2mq7ai	vgp_item_34_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_h8q9a44l982uo5bm	vgp_run_4zhqic7zdr2mq7ai	vgp_item_35_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_2gfmp73gnm4rgebf	vgp_run_4zhqic7zdr2mq7ai	vgp_item_36_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_undoxgj7wix0hda7	vgp_run_4zhqic7zdr2mq7ai	vgp_item_37_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_u8yh55666jzfd9tx	vgp_run_4zhqic7zdr2mq7ai	vgp_item_38_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_zbimm5dh99adhqkt	vgp_run_4zhqic7zdr2mq7ai	vgp_item_39_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_hzoiacelavif69gi	vgp_run_4zhqic7zdr2mq7ai	vgp_item_40_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_zmbe5si6wh8hru61	vgp_run_4zhqic7zdr2mq7ai	vgp_item_41_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_co6o9qh6plalw104	vgp_run_4zhqic7zdr2mq7ai	vgp_item_42_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_p853q8myft64gqpa	vgp_run_4zhqic7zdr2mq7ai	vgp_item_43_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_ff40rbn8z2p93sdk	vgp_run_4zhqic7zdr2mq7ai	vgp_item_44_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_izb00rpeszksd5uc	vgp_run_4zhqic7zdr2mq7ai	vgp_item_45_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_ewpmr5pzq60as7y3	vgp_run_4zhqic7zdr2mq7ai	vgp_item_46_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_eg5d24qvzcyqykxm	vgp_run_4zhqic7zdr2mq7ai	vgp_item_47_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_wt54eepijymrdbi5	vgp_run_4zhqic7zdr2mq7ai	vgp_item_48_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_k712i4qvvnwtqysh	vgp_run_4zhqic7zdr2mq7ai	vgp_item_49_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_jcbj6c9xgxh43mc9	vgp_run_4zhqic7zdr2mq7ai	vgp_item_50_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_c4rbycugiskaoppv	vgp_run_4zhqic7zdr2mq7ai	vgp_item_51_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_hzqpk25sxvp5vkm1	vgp_run_4zhqic7zdr2mq7ai	vgp_item_52_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_2gcpgzi719h8252l	vgp_run_4zhqic7zdr2mq7ai	vgp_item_53_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_1fhr3192u2l1m1y0	vgp_run_4zhqic7zdr2mq7ai	vgp_item_54_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_n2bbzp29pwo9vgyr	vgp_run_4zhqic7zdr2mq7ai	vgp_item_55_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_7r75qvm4y4ovwsta	vgp_run_4zhqic7zdr2mq7ai	vgp_item_56_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_amabpks95g9qf2yu	vgp_run_4zhqic7zdr2mq7ai	vgp_item_57_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_5aoaddj7dztz54cc	vgp_run_4zhqic7zdr2mq7ai	vgp_item_58_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_9dasuelohussh1p9	vgp_run_4zhqic7zdr2mq7ai	vgp_item_59_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_macf4xrl31sla404	vgp_run_4zhqic7zdr2mq7ai	vgp_item_60_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_nxbn1pamgdixhhrr	vgp_run_4zhqic7zdr2mq7ai	vgp_item_61_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_qjdvshwgujc5jovy	vgp_run_4zhqic7zdr2mq7ai	vgp_item_62_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_rb01t8hceeztxf21	vgp_run_4zhqic7zdr2mq7ai	vgp_item_63_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_v7t7svht3lo82no0	vgp_run_4zhqic7zdr2mq7ai	vgp_item_64_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_a6h6ssobrmd17chx	vgp_run_4zhqic7zdr2mq7ai	vgp_item_65_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_1vkcgnzxpbne2yeq	vgp_run_4zhqic7zdr2mq7ai	vgp_item_66_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_pw3vhm176b7n5cbl	vgp_run_4zhqic7zdr2mq7ai	vgp_item_67_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_wewrlfdkm17gpz3b	vgp_run_4zhqic7zdr2mq7ai	vgp_item_68_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_994msgfsgst475zm	vgp_run_4zhqic7zdr2mq7ai	vgp_item_69_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_vtwecznim31x5pbr	vgp_run_4zhqic7zdr2mq7ai	vgp_item_70_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_rqft6xk74062zm2a	vgp_run_4zhqic7zdr2mq7ai	vgp_item_71_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_cfpzjr4psb8wkmxg	vgp_run_4zhqic7zdr2mq7ai	vgp_item_72_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_kn4s9ezf8zzi9awe	vgp_run_4zhqic7zdr2mq7ai	vgp_item_73_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_f30fovvsma2nz0ue	vgp_run_4zhqic7zdr2mq7ai	vgp_item_74_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_80f65kc3gby8zmu3	vgp_run_4zhqic7zdr2mq7ai	vgp_item_75_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_8tcbk2nb5md6oual	vgp_run_4zhqic7zdr2mq7ai	vgp_item_76_v1	NA	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_res_62pynhb73r4x7e8g	vgp_run_un7e4941e1rpbucz	vgp_item_4_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_2b1cek9hg4d10x5g	vgp_run_un7e4941e1rpbucz	vgp_item_5_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_sm5bj1enqxzx2ta0	vgp_run_un7e4941e1rpbucz	vgp_item_6_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_et851z8h1jekrbnl	vgp_run_un7e4941e1rpbucz	vgp_item_7_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_lpqphmd6l7cgeqni	vgp_run_un7e4941e1rpbucz	vgp_item_8_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_idaw5ltaqocmi5xs	vgp_run_un7e4941e1rpbucz	vgp_item_9_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_4mrz09uy0ujwdpzp	vgp_run_un7e4941e1rpbucz	vgp_item_10_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_tcr32s8ttpm63buv	vgp_run_un7e4941e1rpbucz	vgp_item_11_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_j643gujmqzfz5yz5	vgp_run_un7e4941e1rpbucz	vgp_item_12_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_fun36evv71zbulb2	vgp_run_un7e4941e1rpbucz	vgp_item_13_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_x4gf6g6gxiicfl8d	vgp_run_un7e4941e1rpbucz	vgp_item_14_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_yamrhme5b0v8ktii	vgp_run_un7e4941e1rpbucz	vgp_item_15_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_ktik7y0gdtha4hgf	vgp_run_un7e4941e1rpbucz	vgp_item_16_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_vw1f4yr6azyxd1m9	vgp_run_un7e4941e1rpbucz	vgp_item_17_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_soui0n6e15md5a9y	vgp_run_un7e4941e1rpbucz	vgp_item_18_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_2jwtptqhq00lxh2n	vgp_run_un7e4941e1rpbucz	vgp_item_19_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_e3kc2zzsg0yahed2	vgp_run_un7e4941e1rpbucz	vgp_item_20_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_oz2epwy5k7zxeb9q	vgp_run_un7e4941e1rpbucz	vgp_item_21_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_r4xfeigxfk4iksfc	vgp_run_un7e4941e1rpbucz	vgp_item_22_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_p5mot320hcfjha7y	vgp_run_un7e4941e1rpbucz	vgp_item_23_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_esao750rt7bbwr9p	vgp_run_un7e4941e1rpbucz	vgp_item_24_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_zx9lvia0vmn6y8vu	vgp_run_un7e4941e1rpbucz	vgp_item_25_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_kawu3vbhcuv3tdb1	vgp_run_un7e4941e1rpbucz	vgp_item_26_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_5xk7y0sx1sdu7ldy	vgp_run_un7e4941e1rpbucz	vgp_item_27_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_5adshnzjz71afdxe	vgp_run_un7e4941e1rpbucz	vgp_item_28_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_a5m2587qwubzx6uo	vgp_run_un7e4941e1rpbucz	vgp_item_29_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_z4226djm4hecbzln	vgp_run_un7e4941e1rpbucz	vgp_item_30_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_igyh9lhp3bnwfajx	vgp_run_un7e4941e1rpbucz	vgp_item_31_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_upo0uhdbq7afiyrx	vgp_run_un7e4941e1rpbucz	vgp_item_32_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_arktywqvheopjzx4	vgp_run_un7e4941e1rpbucz	vgp_item_33_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_q2e0zcf5tidhbg54	vgp_run_un7e4941e1rpbucz	vgp_item_34_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_wfasl189z9vxpuhh	vgp_run_un7e4941e1rpbucz	vgp_item_35_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_vkkk5luag3qlpatw	vgp_run_un7e4941e1rpbucz	vgp_item_36_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_yugjyj04pb68xikk	vgp_run_un7e4941e1rpbucz	vgp_item_37_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_2wzbilrjke64edwx	vgp_run_un7e4941e1rpbucz	vgp_item_38_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_y1jzi11tfgodui12	vgp_run_un7e4941e1rpbucz	vgp_item_3_v1	OUI	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:31:23.382+00
vgp_res_fs97nkbp8vldm1cy	vgp_run_un7e4941e1rpbucz	vgp_item_2_v1	OUI	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:31:24.062+00
vgp_res_mnu35pylqtwq7i4a	vgp_run_un7e4941e1rpbucz	vgp_item_39_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_p6gcxb39n9diqwom	vgp_run_un7e4941e1rpbucz	vgp_item_40_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_s0anm9gusyi5zun3	vgp_run_un7e4941e1rpbucz	vgp_item_41_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_88n08rn1tiiej6pk	vgp_run_un7e4941e1rpbucz	vgp_item_42_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_f6a9mcuv05qz5env	vgp_run_un7e4941e1rpbucz	vgp_item_43_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_uy0oqi0rybhs6sms	vgp_run_un7e4941e1rpbucz	vgp_item_44_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_ridtgfbgeegipk3e	vgp_run_un7e4941e1rpbucz	vgp_item_45_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_9e3cs41cuc0xfnsi	vgp_run_un7e4941e1rpbucz	vgp_item_46_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_v503uw7spxd025qa	vgp_run_un7e4941e1rpbucz	vgp_item_47_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_rwi7uc28g5nynaqa	vgp_run_un7e4941e1rpbucz	vgp_item_48_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_wpwq1za6upczzk6w	vgp_run_un7e4941e1rpbucz	vgp_item_49_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_0l5lke5pphil8ro2	vgp_run_un7e4941e1rpbucz	vgp_item_50_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_e8df45s2iioudvba	vgp_run_un7e4941e1rpbucz	vgp_item_51_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_ppwao83c4i0k8mdu	vgp_run_un7e4941e1rpbucz	vgp_item_52_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_xt4bs1y4srig26b8	vgp_run_un7e4941e1rpbucz	vgp_item_53_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_elubico91ch2zey4	vgp_run_un7e4941e1rpbucz	vgp_item_54_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_rj409reemb7z5ozu	vgp_run_un7e4941e1rpbucz	vgp_item_55_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_1bqz28hi2x5ttjch	vgp_run_un7e4941e1rpbucz	vgp_item_56_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_yp3ate2we96rg32h	vgp_run_un7e4941e1rpbucz	vgp_item_57_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_2cvdd0ere7dfauha	vgp_run_un7e4941e1rpbucz	vgp_item_58_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_usn9od32pbn46ki1	vgp_run_un7e4941e1rpbucz	vgp_item_59_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_9ephqev6m02t33lk	vgp_run_un7e4941e1rpbucz	vgp_item_60_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_4ehtttnxx6owzwg7	vgp_run_un7e4941e1rpbucz	vgp_item_61_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_cz3838qpgz421j3f	vgp_run_un7e4941e1rpbucz	vgp_item_62_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_7xg9obg55l5jww5d	vgp_run_un7e4941e1rpbucz	vgp_item_63_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_4wxw3663v4g05k6r	vgp_run_un7e4941e1rpbucz	vgp_item_64_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_9k1814n8e1bk8ngn	vgp_run_un7e4941e1rpbucz	vgp_item_65_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_mg2eq2ho6zbwxsa2	vgp_run_un7e4941e1rpbucz	vgp_item_66_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_hvxpqje1aiye0r5m	vgp_run_un7e4941e1rpbucz	vgp_item_67_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_j8umph112zc127ps	vgp_run_un7e4941e1rpbucz	vgp_item_68_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_l0jk2fhgcoykx7nz	vgp_run_un7e4941e1rpbucz	vgp_item_69_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_3qryknokpnud00z8	vgp_run_un7e4941e1rpbucz	vgp_item_70_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_zy55r1eypqegjotc	vgp_run_un7e4941e1rpbucz	vgp_item_71_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_cjljxe0ax778gn1b	vgp_run_un7e4941e1rpbucz	vgp_item_72_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_cl5ps2s8ch3182y6	vgp_run_un7e4941e1rpbucz	vgp_item_73_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_qw6d5rdoxliizm1z	vgp_run_un7e4941e1rpbucz	vgp_item_74_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_u37zvo8642qliugx	vgp_run_un7e4941e1rpbucz	vgp_item_75_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_74fy1oa9areicsfy	vgp_run_un7e4941e1rpbucz	vgp_item_76_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_zqnm5fx5funpg8sp	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_1_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_dt7c5tr009p8zuqq	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_2_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_23ic9chx9j8idmef	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_3_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_dcsblfaeyxcxp3eo	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_4_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_84egc3knducms553	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_5_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_1shabjenjpkx6x3i	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_6_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_5lhl93353xxcsv2q	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_7_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_ntpeg3kb0s9vo1fy	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_8_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_ab7slhw59r7lkz9u	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_9_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_ag5horjiuboc3phn	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_10_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_a4nr788uyrz2bszo	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_11_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_wse4vpqx0gah1af0	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_12_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_btj7d281cmufvej6	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_13_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_5ii770bwm9gtpbbq	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_14_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_y4pgamjtfh6murah	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_15_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_dp5q9gvzzfulc3h2	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_16_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_metay09hl2cvwm6e	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_17_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_hgcts1fdnmvb6wmg	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_18_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_10l38rnroln2yuxa	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_19_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_k8w0v9g71af9ovbu	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_20_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_05yvfidufanddmaf	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_21_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_p5ub7mdn3xz1styp	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_22_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_ekj4a22l0li3qbi8	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_23_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_jz96jhf5h201hr0n	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_24_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_9z5pbwtm6uzqujut	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_25_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_k5b6egt67bz5yz3x	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_26_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_awpj0z07h42uqnt2	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_27_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_oe94acqbcm45i4z6	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_28_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_d2xc3jqor2mrefld	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_29_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_12urwyrrs6plfz60	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_30_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_esei5punm4woicnu	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_31_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_d1n40qtm4ohduo5i	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_32_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_f6mj1ao9odj0hlqs	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_33_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_vyvr3u5yeggt0gvm	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_34_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_kit75nkvd0re4v9c	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_35_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_lfeau8fuyxpqvvj5	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_36_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_dbd85jevephcpxab	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_37_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_v5ofrv1tsw7qlt8y	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_38_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_yn9jqr952cqoi3ci	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_39_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_mv5i2uvlg9d0e270	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_40_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_m9kh4ypnt78ig5we	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_41_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_71mpf0t3d4ogus28	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_42_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_gknxdrncdu64nbyi	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_43_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_1ij6c25acgu1pmly	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_44_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_99toz5m4so28rc00	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_45_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_i4cwkuyxuhef0lvi	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_46_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_t9rufqfr610in54m	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_47_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_wkr8oaete84hio4j	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_48_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_u4g2tz2rhwiqvgjo	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_49_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_m17laty8phor2sq7	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_50_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_slcisy40lpc8hgkq	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_51_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_du11mftzp0pp98v3	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_52_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_czr68qut960hq40f	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_53_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_09b62ao7qsd1oiv6	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_54_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_lfux2uksk9f4r8oq	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_55_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_sdoz6uhp94nkf8v2	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_56_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_txaw73mj05w4bura	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_57_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_ccxq2ti6i1ghhybw	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_58_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_6oc5wifimg34ub1f	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_59_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_2e4zmyi3ocba5r9e	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_60_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_dlv2ti7yv9uj3kyg	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_61_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_d1fvddpww9elqnvl	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_62_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_48x11za1t7z2qper	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_63_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_9shlyj9x3e46exqy	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_64_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_7d508s9l9fy5llc2	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_65_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_xpv2ggqj58v167lu	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_66_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_873mjml7j0b4sjwu	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_67_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_r5v8o9ttl40cafwq	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_68_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_mwkpwbaaqf6uoz4g	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_69_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_9ndruodtvc4x203c	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_70_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_dbxhoiybgl7oyffn	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_71_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_tcb619mlup7pmeec	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_72_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_bx8qwrqim3ziqc8l	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_73_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_o421xv16x5n5cs0x	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_74_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_m414jyra18emep8b	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_75_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_jf56dsq2az8dol55	vgp_run_yyf0ywqb1jfwl8nn	vgp_item_76_v1	NA	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_res_exs2ytfmifb10r4d	vgp_run_uwe1oedwtzxi0tqo	vgp_item_1_v1	NA	FGDF	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:37:41.965+00
vgp_res_e5imclb41ro42s22	vgp_run_un7e4941e1rpbucz	vgp_item_1_v1	NON	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:31:28.825+00
vgp_res_5m0d8ueici3gijlc	vgp_run_uwe1oedwtzxi0tqo	vgp_item_2_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_e58nsjp2jr6ratus	vgp_run_uwe1oedwtzxi0tqo	vgp_item_3_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_vc5maszn3khgvb54	vgp_run_uwe1oedwtzxi0tqo	vgp_item_4_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_2pw1gdmth4f24k92	vgp_run_uwe1oedwtzxi0tqo	vgp_item_5_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_o5w4hwjwuc4s07kl	vgp_run_uwe1oedwtzxi0tqo	vgp_item_6_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_xrnfv0cv93irdeby	vgp_run_uwe1oedwtzxi0tqo	vgp_item_7_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_fipag5geiyn96a1r	vgp_run_uwe1oedwtzxi0tqo	vgp_item_8_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_d0x4dhcm1hmbqoqn	vgp_run_uwe1oedwtzxi0tqo	vgp_item_9_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_e9h8lucrbc63hcyv	vgp_run_uwe1oedwtzxi0tqo	vgp_item_10_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_nzlyvz0ffgaya8gx	vgp_run_uwe1oedwtzxi0tqo	vgp_item_11_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_hvv6i1upvbruuwhp	vgp_run_uwe1oedwtzxi0tqo	vgp_item_12_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_nrbxvb6v8twdqmoq	vgp_run_uwe1oedwtzxi0tqo	vgp_item_13_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_196lrpyrr7kngp6n	vgp_run_uwe1oedwtzxi0tqo	vgp_item_14_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_teficvdkvu52c2sd	vgp_run_uwe1oedwtzxi0tqo	vgp_item_15_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_2pmh4iko8pns1ob8	vgp_run_uwe1oedwtzxi0tqo	vgp_item_16_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_90rqt9kzzgf5a5f9	vgp_run_uwe1oedwtzxi0tqo	vgp_item_17_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_s1fr0pr74i4u7u9a	vgp_run_uwe1oedwtzxi0tqo	vgp_item_18_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_1lqk6j1l8o887lo3	vgp_run_uwe1oedwtzxi0tqo	vgp_item_19_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_3z5wp7l9d0opsghx	vgp_run_uwe1oedwtzxi0tqo	vgp_item_20_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_qw5pl21f1j5qerj6	vgp_run_uwe1oedwtzxi0tqo	vgp_item_21_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_8maf2cx6c3z3cple	vgp_run_uwe1oedwtzxi0tqo	vgp_item_22_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_mizdzukoryy1x3r6	vgp_run_uwe1oedwtzxi0tqo	vgp_item_23_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_7wqsaj86gilsuzv4	vgp_run_uwe1oedwtzxi0tqo	vgp_item_24_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_vmkhm4femx0jzpaz	vgp_run_uwe1oedwtzxi0tqo	vgp_item_25_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_dmgdc78cdesq8q8b	vgp_run_uwe1oedwtzxi0tqo	vgp_item_26_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_zuse4sz44g32jsle	vgp_run_uwe1oedwtzxi0tqo	vgp_item_27_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_aqzf00k7o71y1lgm	vgp_run_uwe1oedwtzxi0tqo	vgp_item_28_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_y0jrrsngex4wshh3	vgp_run_uwe1oedwtzxi0tqo	vgp_item_29_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_02z79vds2ik7o7tt	vgp_run_uwe1oedwtzxi0tqo	vgp_item_30_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_9qtgv7z4ah3oufsj	vgp_run_uwe1oedwtzxi0tqo	vgp_item_31_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_0udh09hoaqezu7dv	vgp_run_uwe1oedwtzxi0tqo	vgp_item_32_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_oafpd7y34407cbq4	vgp_run_uwe1oedwtzxi0tqo	vgp_item_33_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_ke4bpjq9pjkjenxo	vgp_run_uwe1oedwtzxi0tqo	vgp_item_34_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_6ovupt4mlr80uxyh	vgp_run_uwe1oedwtzxi0tqo	vgp_item_35_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_95s0u4wwtfrh3eav	vgp_run_uwe1oedwtzxi0tqo	vgp_item_36_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_rbvufpdd9nwj7j74	vgp_run_uwe1oedwtzxi0tqo	vgp_item_37_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_4vkecxe6r80oup4v	vgp_run_uwe1oedwtzxi0tqo	vgp_item_38_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_iw2nrg9yt4peg74o	vgp_run_uwe1oedwtzxi0tqo	vgp_item_39_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_lxkxtbb9h99mylct	vgp_run_uwe1oedwtzxi0tqo	vgp_item_40_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_p5zm6bronw8pbdms	vgp_run_uwe1oedwtzxi0tqo	vgp_item_41_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_8gcpb7zbtau3jdla	vgp_run_uwe1oedwtzxi0tqo	vgp_item_42_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_pr96nzwo4n6q1bix	vgp_run_uwe1oedwtzxi0tqo	vgp_item_43_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_lcknnbfhudoijuax	vgp_run_uwe1oedwtzxi0tqo	vgp_item_44_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_7u6kkghy85bmbq0v	vgp_run_uwe1oedwtzxi0tqo	vgp_item_45_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_0r0cw19vlkmn5eln	vgp_run_uwe1oedwtzxi0tqo	vgp_item_46_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_3pnmh2eco2xf1mey	vgp_run_uwe1oedwtzxi0tqo	vgp_item_47_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_04j9rnnsz9ttt2vy	vgp_run_uwe1oedwtzxi0tqo	vgp_item_48_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_03ugf1jyaq170nhx	vgp_run_uwe1oedwtzxi0tqo	vgp_item_49_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_fhsiyunn43gplo9y	vgp_run_uwe1oedwtzxi0tqo	vgp_item_50_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_wqdg6mal1ot12smh	vgp_run_uwe1oedwtzxi0tqo	vgp_item_51_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_nrksvslafnwbf8pv	vgp_run_uwe1oedwtzxi0tqo	vgp_item_52_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_ov1zf4k9ffe6dgrf	vgp_run_uwe1oedwtzxi0tqo	vgp_item_53_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_jptzg2kxvwlbj65e	vgp_run_uwe1oedwtzxi0tqo	vgp_item_54_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_b45bqfcol1bv95oq	vgp_run_uwe1oedwtzxi0tqo	vgp_item_55_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_0hb8h4qcffm4ycvg	vgp_run_uwe1oedwtzxi0tqo	vgp_item_56_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_5tskbf2ss0bbs9bu	vgp_run_uwe1oedwtzxi0tqo	vgp_item_57_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_5gc7cmwdshik9c0p	vgp_run_uwe1oedwtzxi0tqo	vgp_item_58_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_bye6v411zcm6apxa	vgp_run_uwe1oedwtzxi0tqo	vgp_item_59_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_3vt5b0fzp5aqriyf	vgp_run_uwe1oedwtzxi0tqo	vgp_item_60_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_gydldbtl7pfeirvd	vgp_run_uwe1oedwtzxi0tqo	vgp_item_61_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_aawg5uqu69vn1dvc	vgp_run_uwe1oedwtzxi0tqo	vgp_item_62_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_jov4clm6bz8tyeca	vgp_run_uwe1oedwtzxi0tqo	vgp_item_63_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_l5e3eqsozpphekip	vgp_run_uwe1oedwtzxi0tqo	vgp_item_64_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_rxn4wto76ppapx7m	vgp_run_uwe1oedwtzxi0tqo	vgp_item_65_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_n4ig617mrxpc4jn0	vgp_run_uwe1oedwtzxi0tqo	vgp_item_66_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_c91uc7eti81ayjdg	vgp_run_uwe1oedwtzxi0tqo	vgp_item_67_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_74w3a7s3qwilpupe	vgp_run_uwe1oedwtzxi0tqo	vgp_item_68_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_gylk4ddg279y8jfo	vgp_run_uwe1oedwtzxi0tqo	vgp_item_69_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_8u5fphpwobhy9ij9	vgp_run_uwe1oedwtzxi0tqo	vgp_item_70_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_sp4pmoymsgf94ht9	vgp_run_uwe1oedwtzxi0tqo	vgp_item_71_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_47dyv0gkymv201ei	vgp_run_uwe1oedwtzxi0tqo	vgp_item_72_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_7bgoab3p91uae5lh	vgp_run_uwe1oedwtzxi0tqo	vgp_item_73_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_sil7jkarfgtvij7m	vgp_run_uwe1oedwtzxi0tqo	vgp_item_74_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_kdk73zczwuik4ru9	vgp_run_uwe1oedwtzxi0tqo	vgp_item_75_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_r1pnnbzd9q6l5o5p	vgp_run_uwe1oedwtzxi0tqo	vgp_item_76_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_cyynuc1zlc50m1sl	vgp_run_t4tb50slsg07va6e	vgp_item_1_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_59kbh7z7krbyf7pn	vgp_run_t4tb50slsg07va6e	vgp_item_2_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_7jsd6kscrqsatxz6	vgp_run_t4tb50slsg07va6e	vgp_item_3_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_mxuou5dzjpr9utac	vgp_run_t4tb50slsg07va6e	vgp_item_4_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_jg2rnga6rnn6b9l4	vgp_run_t4tb50slsg07va6e	vgp_item_5_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_frzj3aw88x5uymu1	vgp_run_t4tb50slsg07va6e	vgp_item_6_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_cwoj95gvwhwt71ik	vgp_run_t4tb50slsg07va6e	vgp_item_7_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_62udt4n3vx7fv4wt	vgp_run_t4tb50slsg07va6e	vgp_item_8_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_hm19q8j8avq9yuct	vgp_run_t4tb50slsg07va6e	vgp_item_9_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_wxl7do7mx2igv6vv	vgp_run_t4tb50slsg07va6e	vgp_item_10_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_a086lxrgx480d0ct	vgp_run_t4tb50slsg07va6e	vgp_item_11_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_30yvml8d3dvpxq5s	vgp_run_t4tb50slsg07va6e	vgp_item_12_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_4xmxajulcyne71wp	vgp_run_t4tb50slsg07va6e	vgp_item_13_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_q3bd6gvq9m95uty2	vgp_run_t4tb50slsg07va6e	vgp_item_14_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_39wnxjo1zphkyyz9	vgp_run_t4tb50slsg07va6e	vgp_item_15_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_f9ngy2yty4qnd1r9	vgp_run_t4tb50slsg07va6e	vgp_item_16_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_57xugp1bdsu1s1vn	vgp_run_t4tb50slsg07va6e	vgp_item_17_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_jtrdoli3bsb1d9v5	vgp_run_t4tb50slsg07va6e	vgp_item_18_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_9zafwkfg0yavr80r	vgp_run_t4tb50slsg07va6e	vgp_item_19_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_a075pv3lu1sw0me1	vgp_run_t4tb50slsg07va6e	vgp_item_20_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_f1d9bsi46thuk5rp	vgp_run_t4tb50slsg07va6e	vgp_item_21_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_h6kvtksqn9kshx4m	vgp_run_t4tb50slsg07va6e	vgp_item_22_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_ixy3owu5c1syzwit	vgp_run_t4tb50slsg07va6e	vgp_item_23_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_rd0cfhknwxacv6sl	vgp_run_t4tb50slsg07va6e	vgp_item_24_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_2zx575zhgd5fhjcp	vgp_run_t4tb50slsg07va6e	vgp_item_25_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_3lk8h8lji9j3els4	vgp_run_t4tb50slsg07va6e	vgp_item_26_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_kw116jh3k78w5pic	vgp_run_t4tb50slsg07va6e	vgp_item_27_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_lk8vypfezso99thr	vgp_run_t4tb50slsg07va6e	vgp_item_28_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_dr4ucume98ivmud1	vgp_run_t4tb50slsg07va6e	vgp_item_29_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_ed8ybycky7y3jduh	vgp_run_t4tb50slsg07va6e	vgp_item_30_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_ncdu957m9tggvdrd	vgp_run_t4tb50slsg07va6e	vgp_item_31_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_06z76czs47oi6opk	vgp_run_t4tb50slsg07va6e	vgp_item_32_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_jvfrw1owpq9tl7np	vgp_run_t4tb50slsg07va6e	vgp_item_33_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_ei4rvzc4q51x8uqn	vgp_run_t4tb50slsg07va6e	vgp_item_34_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_clh6d6hz9azvlmrb	vgp_run_t4tb50slsg07va6e	vgp_item_35_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_0yim2sgv684n3ia6	vgp_run_t4tb50slsg07va6e	vgp_item_36_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_8w4f5dsermjkiqrc	vgp_run_t4tb50slsg07va6e	vgp_item_37_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_ysien2hae3697v3v	vgp_run_t4tb50slsg07va6e	vgp_item_38_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_nvbxjzlne30p2227	vgp_run_t4tb50slsg07va6e	vgp_item_39_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_8b1awhdl273norov	vgp_run_t4tb50slsg07va6e	vgp_item_40_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_ma8hl16xwvltek20	vgp_run_t4tb50slsg07va6e	vgp_item_41_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_cc6mp9cbd8d7al62	vgp_run_t4tb50slsg07va6e	vgp_item_42_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_wta02zpd9v4m3802	vgp_run_t4tb50slsg07va6e	vgp_item_43_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_2ft6axe61bjqkqqx	vgp_run_t4tb50slsg07va6e	vgp_item_44_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_feuxy1t00i3ojhnp	vgp_run_t4tb50slsg07va6e	vgp_item_45_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_fdrsv81yldodngy4	vgp_run_t4tb50slsg07va6e	vgp_item_46_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_q8z4ykzj8xdekyty	vgp_run_t4tb50slsg07va6e	vgp_item_47_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_2sfyc5tkq2l5h6c3	vgp_run_t4tb50slsg07va6e	vgp_item_48_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_s5wyqvp9s2fibgb1	vgp_run_t4tb50slsg07va6e	vgp_item_49_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_1lkprh4doy3fo40v	vgp_run_t4tb50slsg07va6e	vgp_item_50_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_1el2a5m560jzgj1s	vgp_run_t4tb50slsg07va6e	vgp_item_51_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_prmlnlmfeloae07x	vgp_run_t4tb50slsg07va6e	vgp_item_52_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_a5c5cd4y9ujrqjna	vgp_run_t4tb50slsg07va6e	vgp_item_53_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_ze3c63hcq11436k1	vgp_run_t4tb50slsg07va6e	vgp_item_54_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_d49ky6yuniw96mv7	vgp_run_t4tb50slsg07va6e	vgp_item_55_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_5vrppr9obss93cjf	vgp_run_t4tb50slsg07va6e	vgp_item_56_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_dn7mn10pq7e3aeca	vgp_run_t4tb50slsg07va6e	vgp_item_57_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_1gqig6ys7tjpk2va	vgp_run_t4tb50slsg07va6e	vgp_item_58_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_k9fs1pniw4nys8ch	vgp_run_t4tb50slsg07va6e	vgp_item_59_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_tombd29nv6tx99u2	vgp_run_t4tb50slsg07va6e	vgp_item_60_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_r9qmzys6mrvfzaup	vgp_run_t4tb50slsg07va6e	vgp_item_61_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_lhkzyo53uosdh6zp	vgp_run_t4tb50slsg07va6e	vgp_item_62_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_x98ul1lv0n9mnf07	vgp_run_t4tb50slsg07va6e	vgp_item_63_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_l8rodu05hbn7kx0s	vgp_run_t4tb50slsg07va6e	vgp_item_64_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_jdp0x4wvs6a21oo5	vgp_run_t4tb50slsg07va6e	vgp_item_65_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_6376w6jdpd0i1odb	vgp_run_t4tb50slsg07va6e	vgp_item_66_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_9dfymgevneiolhj9	vgp_run_t4tb50slsg07va6e	vgp_item_67_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_hnsovrh38rgg3aut	vgp_run_t4tb50slsg07va6e	vgp_item_68_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_ndcasj89wvmrmyt1	vgp_run_t4tb50slsg07va6e	vgp_item_69_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_awzin3f6o9pwjptp	vgp_run_t4tb50slsg07va6e	vgp_item_70_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_op7ln9ydm472ch10	vgp_run_t4tb50slsg07va6e	vgp_item_71_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_2mgdhqd2g10on638	vgp_run_t4tb50slsg07va6e	vgp_item_72_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_jvefi9yqdaspzyvl	vgp_run_t4tb50slsg07va6e	vgp_item_73_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_356slst79jgiuopq	vgp_run_t4tb50slsg07va6e	vgp_item_74_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_cipa7pk5nxsa8gah	vgp_run_t4tb50slsg07va6e	vgp_item_75_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_pmrf2x728y7q0nhe	vgp_run_t4tb50slsg07va6e	vgp_item_76_v1	NA	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_res_hn3sqvlxswgcusfr	vgp_run_zpesf12h2etottu2	vgp_item_4_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:48:48.532+00
vgp_res_llj3o5ysbgmgcipl	vgp_run_zpesf12h2etottu2	vgp_item_2_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:48:46.172+00
vgp_res_rg04sv7ca0n9xmop	vgp_run_zpesf12h2etottu2	vgp_item_3_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:48:47.733+00
vgp_res_6dem939cqw1yworu	vgp_run_zpesf12h2etottu2	vgp_item_5_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:48:49.991+00
vgp_res_e8xejyir4xs69j5y	vgp_run_zpesf12h2etottu2	vgp_item_6_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:48:55.408+00
vgp_res_wlm4fqfskgokqf39	vgp_run_zpesf12h2etottu2	vgp_item_34_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_epzdpqpr2l2nmro2	vgp_run_zpesf12h2etottu2	vgp_item_35_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_u15pp3tv2vjx4rao	vgp_run_zpesf12h2etottu2	vgp_item_36_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_xaff7mzqeaw15h1k	vgp_run_zpesf12h2etottu2	vgp_item_37_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_jrtxpikkgs5pu8j6	vgp_run_zpesf12h2etottu2	vgp_item_38_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_0i3ynz7sn6lubwwe	vgp_run_zpesf12h2etottu2	vgp_item_39_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_dnziazsmslcb89w6	vgp_run_zpesf12h2etottu2	vgp_item_40_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_q6xv4w3ix7ahbaj7	vgp_run_zpesf12h2etottu2	vgp_item_41_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_qw1b6siyysf8mpvx	vgp_run_zpesf12h2etottu2	vgp_item_42_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_lc90qxv2onatye30	vgp_run_zpesf12h2etottu2	vgp_item_43_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_r8whdh3ja8b2jt2p	vgp_run_zpesf12h2etottu2	vgp_item_44_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_uszh3l1wbrwpsfo1	vgp_run_zpesf12h2etottu2	vgp_item_45_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_hqbafm83kauz2fuq	vgp_run_zpesf12h2etottu2	vgp_item_46_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_f9p2lxgtoayt85sv	vgp_run_zpesf12h2etottu2	vgp_item_47_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_5pezg0976epxdsb2	vgp_run_zpesf12h2etottu2	vgp_item_48_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_ilyflfpeij0q19ee	vgp_run_zpesf12h2etottu2	vgp_item_49_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_wou6lssv7tiyscz2	vgp_run_zpesf12h2etottu2	vgp_item_50_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_am9vbhqlbez63fdc	vgp_run_zpesf12h2etottu2	vgp_item_52_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_ueidffvxyxexhjrq	vgp_run_zpesf12h2etottu2	vgp_item_53_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_jqvq1sjdd8570yc0	vgp_run_zpesf12h2etottu2	vgp_item_54_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_t6wgyftopjxqxdbw	vgp_run_zpesf12h2etottu2	vgp_item_55_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_l398fqzcgiqoink1	vgp_run_zpesf12h2etottu2	vgp_item_57_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_h0bjrkhrr0we9xsi	vgp_run_zpesf12h2etottu2	vgp_item_58_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_sy0mmysmsmsmwbrh	vgp_run_zpesf12h2etottu2	vgp_item_59_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_ont7vdjzemtuagwo	vgp_run_zpesf12h2etottu2	vgp_item_60_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_lv8uetsv8m7iloz1	vgp_run_zpesf12h2etottu2	vgp_item_61_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_dkfm422r9xm25k01	vgp_run_zpesf12h2etottu2	vgp_item_62_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_mtcqp7ggquk7pyi3	vgp_run_zpesf12h2etottu2	vgp_item_63_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_9n5tboxqrni87iu9	vgp_run_zpesf12h2etottu2	vgp_item_64_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_n5n3dwbutaoa6odu	vgp_run_zpesf12h2etottu2	vgp_item_65_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_qfqmy3b49n1sq9k1	vgp_run_zpesf12h2etottu2	vgp_item_66_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_h4wfuhtl9aydwvds	vgp_run_zpesf12h2etottu2	vgp_item_67_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_x2ofetmfuxmdpa1c	vgp_run_zpesf12h2etottu2	vgp_item_68_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_4nkhcr1z83idv1d4	vgp_run_zpesf12h2etottu2	vgp_item_69_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_m4xqlz0d44arx29d	vgp_run_zpesf12h2etottu2	vgp_item_70_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_4gmdpk4kbsaya42q	vgp_run_zpesf12h2etottu2	vgp_item_71_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_ob9zlczp897ultv7	vgp_run_zpesf12h2etottu2	vgp_item_72_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_689ajsntdg4xc0ob	vgp_run_zpesf12h2etottu2	vgp_item_73_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_k5stbjc9zzyv6v55	vgp_run_zpesf12h2etottu2	vgp_item_74_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_b81eg0d2v4um9ipq	vgp_run_zpesf12h2etottu2	vgp_item_75_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_r2v9mw86p7d8wvkd	vgp_run_zpesf12h2etottu2	vgp_item_76_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_res_bmv3tmrzbq7gzups	vgp_run_zpesf12h2etottu2	vgp_item_8_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:48:56.493+00
vgp_res_f51hsaecov8ew7r2	vgp_run_zpesf12h2etottu2	vgp_item_9_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:48:57.068+00
vgp_res_djzuv3jbnaraj0d5	vgp_run_zpesf12h2etottu2	vgp_item_10_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:48:57.626+00
vgp_res_bnjfrruljtmf7w7i	vgp_run_zpesf12h2etottu2	vgp_item_11_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:49:00.276+00
vgp_res_uetn6y773usz49ud	vgp_run_zpesf12h2etottu2	vgp_item_12_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:49:00.867+00
vgp_res_ttv3prf8lt3fgmp8	vgp_run_zpesf12h2etottu2	vgp_item_13_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:49:01.795+00
vgp_res_kev5qwlqnt8zldnr	vgp_run_zpesf12h2etottu2	vgp_item_14_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:49:03.186+00
vgp_res_efre81m6fdip7zyi	vgp_run_zpesf12h2etottu2	vgp_item_15_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:49:03.988+00
vgp_res_vmf5uv58w5d46on0	vgp_run_zpesf12h2etottu2	vgp_item_17_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:49:08.13+00
vgp_res_7sv06ugd6lmlfs5d	vgp_run_zpesf12h2etottu2	vgp_item_16_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:49:07.088+00
vgp_res_1m8iql4fp7vi501g	vgp_run_zpesf12h2etottu2	vgp_item_18_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:49:09.075+00
vgp_res_x0rapeoy4a5ozrpj	vgp_run_zpesf12h2etottu2	vgp_item_19_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:49:10.543+00
vgp_res_xgar8s8itwh80pmu	vgp_run_zpesf12h2etottu2	vgp_item_21_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:49:15.994+00
vgp_res_55igsjm2o5bldu56	vgp_run_zpesf12h2etottu2	vgp_item_22_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:49:16.686+00
vgp_res_p5a0hfosw4vy0z64	vgp_run_zpesf12h2etottu2	vgp_item_24_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:49:18.87+00
vgp_res_5w1cve2bjgo7lkqn	vgp_run_zpesf12h2etottu2	vgp_item_23_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:49:17.873+00
vgp_res_g61im6kufk5j6qba	vgp_run_zpesf12h2etottu2	vgp_item_25_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:49:22.064+00
vgp_res_603uxl3g1hekxavo	vgp_run_zpesf12h2etottu2	vgp_item_26_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:49:22.567+00
vgp_res_xmw7czicmtyaizpy	vgp_run_zpesf12h2etottu2	vgp_item_27_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:49:23.275+00
vgp_res_rpayp1u1ybzr78al	vgp_run_zpesf12h2etottu2	vgp_item_28_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:49:24.274+00
vgp_res_7m747hjmr4cu64td	vgp_run_zpesf12h2etottu2	vgp_item_29_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:49:26.643+00
vgp_res_rsf36iu26a8jxi6d	vgp_run_zpesf12h2etottu2	vgp_item_30_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:49:27.299+00
vgp_res_tviwzr8yrknq1lp6	vgp_run_zpesf12h2etottu2	vgp_item_32_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:49:32.115+00
vgp_res_nxbq2r9764wjmxko	vgp_run_zpesf12h2etottu2	vgp_item_31_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:49:31.058+00
vgp_res_qmfki4a4y4ino3ha	vgp_run_zpesf12h2etottu2	vgp_item_33_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:49:32.726+00
vgp_res_62ljblxrtavjwi9n	vgp_run_zpesf12h2etottu2	vgp_item_51_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:51:06.499+00
vgp_res_oqjaw0787u7wkb7f	vgp_run_zpesf12h2etottu2	vgp_item_56_v1	NA	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:51:38.714+00
vgp_res_zmaqzht3styng19c	vgp_run_zpesf12h2etottu2	vgp_item_1_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:48:44.66+00
vgp_res_oevx2sth7ptrg8v7	vgp_run_zpesf12h2etottu2	vgp_item_7_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:48:55.911+00
vgp_res_86dlntneq3zvqrbo	vgp_run_zpesf12h2etottu2	vgp_item_20_v1	NON	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:49:13.084+00
vgp_res_g79mulwev5ricts0	vgp_run_p9qx02selwzw45ri	vgp_item_1_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_zhr6zuu5dm2m7ck2	vgp_run_p9qx02selwzw45ri	vgp_item_2_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_8q6sdviecqo6gfyw	vgp_run_p9qx02selwzw45ri	vgp_item_3_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_4glk8xs1oal16qt8	vgp_run_p9qx02selwzw45ri	vgp_item_4_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_n7yudil3i6yv3c0h	vgp_run_p9qx02selwzw45ri	vgp_item_5_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_c9pj5cscwrzl2ldo	vgp_run_p9qx02selwzw45ri	vgp_item_6_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_ewwjz2ip83aj4wp2	vgp_run_p9qx02selwzw45ri	vgp_item_7_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_qbqxqd3501tg5qzq	vgp_run_p9qx02selwzw45ri	vgp_item_8_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_im1720j39xjjdrm9	vgp_run_p9qx02selwzw45ri	vgp_item_9_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_edy588d9nnmc57la	vgp_run_p9qx02selwzw45ri	vgp_item_10_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_vrgrvgk4oo8s5gdr	vgp_run_p9qx02selwzw45ri	vgp_item_11_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_41bao8sgbxkj3fy7	vgp_run_p9qx02selwzw45ri	vgp_item_12_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_301meld4ylkuubcn	vgp_run_p9qx02selwzw45ri	vgp_item_13_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_s2xlc6popcf07k0j	vgp_run_p9qx02selwzw45ri	vgp_item_14_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_2ul28desm49c5uxs	vgp_run_p9qx02selwzw45ri	vgp_item_15_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_6khmtc5p59ab03lk	vgp_run_p9qx02selwzw45ri	vgp_item_16_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_bcadoet4i2kljuox	vgp_run_p9qx02selwzw45ri	vgp_item_17_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_f6kmors4982pc4xz	vgp_run_p9qx02selwzw45ri	vgp_item_18_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_bo1fh7qwpo5cdt7m	vgp_run_p9qx02selwzw45ri	vgp_item_19_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_8ztz4kg39z7008w4	vgp_run_p9qx02selwzw45ri	vgp_item_20_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_xej7w6kkshk3yq6z	vgp_run_p9qx02selwzw45ri	vgp_item_21_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_dr6n2wcxaqvkhmil	vgp_run_p9qx02selwzw45ri	vgp_item_22_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_vsnoc9pqskgptbw6	vgp_run_p9qx02selwzw45ri	vgp_item_23_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_mtqs2pkzbr718qn3	vgp_run_p9qx02selwzw45ri	vgp_item_24_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_2jtge364zhqx2gr8	vgp_run_p9qx02selwzw45ri	vgp_item_25_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_9afidqn2x6904wf1	vgp_run_p9qx02selwzw45ri	vgp_item_26_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_mmakhe9mqnwmpqu5	vgp_run_p9qx02selwzw45ri	vgp_item_27_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_4wscgqiq2w8rhgdn	vgp_run_p9qx02selwzw45ri	vgp_item_28_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_jqkbeb6noeepu4ge	vgp_run_p9qx02selwzw45ri	vgp_item_29_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_wcqrp0jp1e1xiadm	vgp_run_p9qx02selwzw45ri	vgp_item_30_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_kt88q1kc9kv9vlpp	vgp_run_p9qx02selwzw45ri	vgp_item_31_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_fw3pl88wr8creiig	vgp_run_p9qx02selwzw45ri	vgp_item_32_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_zg2pqhbqu509dbqk	vgp_run_p9qx02selwzw45ri	vgp_item_33_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_uxsdg4ti0fiia8wp	vgp_run_p9qx02selwzw45ri	vgp_item_34_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_6cf9hdvsw1dqahcg	vgp_run_p9qx02selwzw45ri	vgp_item_35_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_d6v8uca54n6hhv7i	vgp_run_p9qx02selwzw45ri	vgp_item_36_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_pvnlkx4ixfsawe07	vgp_run_p9qx02selwzw45ri	vgp_item_37_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_lyq66oxsi6nmpudy	vgp_run_p9qx02selwzw45ri	vgp_item_38_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_itmb0jm9zc973axq	vgp_run_p9qx02selwzw45ri	vgp_item_39_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_48hh61etw51tp141	vgp_run_p9qx02selwzw45ri	vgp_item_40_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_38095lm1e7vtcpyw	vgp_run_p9qx02selwzw45ri	vgp_item_41_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_lnm5d9p5kvepfq5l	vgp_run_p9qx02selwzw45ri	vgp_item_42_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_vv2i39p79asdes4p	vgp_run_p9qx02selwzw45ri	vgp_item_43_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_ejx46nbxvyakz06h	vgp_run_p9qx02selwzw45ri	vgp_item_44_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_7mu9a4gixf0gisx7	vgp_run_p9qx02selwzw45ri	vgp_item_45_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_813pkff01r0xw9ug	vgp_run_p9qx02selwzw45ri	vgp_item_46_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_0haqxeo2evc0sjrg	vgp_run_p9qx02selwzw45ri	vgp_item_47_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_ucxz4uo8jqc6k6xn	vgp_run_p9qx02selwzw45ri	vgp_item_48_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_nmiu0vfiivxdzuqq	vgp_run_p9qx02selwzw45ri	vgp_item_49_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_nthepoygb4853hrc	vgp_run_p9qx02selwzw45ri	vgp_item_50_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_l5p12umzbo69w11w	vgp_run_p9qx02selwzw45ri	vgp_item_51_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_9c55nll6m3nkxx72	vgp_run_p9qx02selwzw45ri	vgp_item_52_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_ong5anwdml26l6wb	vgp_run_p9qx02selwzw45ri	vgp_item_53_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_u9z57v4b99quacym	vgp_run_p9qx02selwzw45ri	vgp_item_54_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_52e3y3d3m7de23sh	vgp_run_p9qx02selwzw45ri	vgp_item_55_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_rfqchpcp880mrxgz	vgp_run_p9qx02selwzw45ri	vgp_item_56_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_2lywxxs7y76l862v	vgp_run_p9qx02selwzw45ri	vgp_item_57_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_c82w0r96p7l1uyo0	vgp_run_p9qx02selwzw45ri	vgp_item_58_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_2b0cj2e78bdlq7cs	vgp_run_p9qx02selwzw45ri	vgp_item_59_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_9zd9zgzn98seal1y	vgp_run_p9qx02selwzw45ri	vgp_item_60_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_hhshha2gaywgxh5o	vgp_run_p9qx02selwzw45ri	vgp_item_61_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_y6xpg1eo22kzelzf	vgp_run_p9qx02selwzw45ri	vgp_item_62_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_vb9tzn1j38pj5hye	vgp_run_p9qx02selwzw45ri	vgp_item_63_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_wdpd6iilrt5jnmne	vgp_run_p9qx02selwzw45ri	vgp_item_64_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_1d3rlzcmi8w8gojl	vgp_run_p9qx02selwzw45ri	vgp_item_65_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_jkrzlg56nh3xgd0p	vgp_run_p9qx02selwzw45ri	vgp_item_66_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_yghdtgpbnhst4dm0	vgp_run_p9qx02selwzw45ri	vgp_item_67_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_hvkvz3djbljzgkgs	vgp_run_p9qx02selwzw45ri	vgp_item_68_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_spyk57mf3jrdnnjc	vgp_run_p9qx02selwzw45ri	vgp_item_69_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_jx3ooewhm1blttfm	vgp_run_p9qx02selwzw45ri	vgp_item_70_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_0btkw83utfx1z3cr	vgp_run_p9qx02selwzw45ri	vgp_item_71_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_yh6y47f9qtbn5tia	vgp_run_p9qx02selwzw45ri	vgp_item_72_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_nkyn4xbhyfvhcfz6	vgp_run_p9qx02selwzw45ri	vgp_item_73_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_0eaa58eqf6neks58	vgp_run_p9qx02selwzw45ri	vgp_item_74_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_4ph7dxsvhr6nk0dw	vgp_run_p9qx02selwzw45ri	vgp_item_75_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
vgp_res_yt9b1zs56xqw089r	vgp_run_p9qx02selwzw45ri	vgp_item_76_v1	NA	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
\.


--
-- Data for Name: vgp_observations; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.vgp_observations (id, run_id, asset_id, item_id, item_numero, description, recommandation, gravite, statut, is_auto, pieces_jointes, created_at, updated_at) FROM stdin;
vgp_obs_643267f1b0e8	vgp_run_un7e4941e1rpbucz	asset_auto_  2	vgp_item_1_v1	1	Non conformité au point 1 : Bâti stable au sol	\N	3	OUVERTE	t	\N	2026-02-01 19:31:28.825+00	2026-02-01 19:31:28.825+00
vgp_obs_12f2ce5f8626	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_26_v1	26	Non conformité au point 26 : Arrêt immédiat à l'ouverture du protecteur	\N	3	OUVERTE	t	\N	2026-02-01 19:49:22.567+00	2026-02-01 19:49:22.567+00
vgp_obs_0e758ff13ed6	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_27_v1	27	Non conformité au point 27 : Verrouillage interdit le démarrage porte ouverte	\N	3	OUVERTE	t	\N	2026-02-01 19:49:23.275+00	2026-02-01 19:49:23.275+00
vgp_obs_100d92641979	vgp_run_uwe1oedwtzxi0tqo	asset_auto_ 20	vgp_item_1_v1	1	Non conformité au point 1 : Bâti stable au sol	\N	3	RESOLUE	t	\N	2026-02-01 19:36:30.514+00	2026-02-01 19:37:41.965+00
vgp_obs_bdb259e06f15	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_28_v1	28	Non conformité au point 28 : Indicateur d'état visible	\N	3	OUVERTE	t	\N	2026-02-01 19:49:24.274+00	2026-02-01 19:49:24.274+00
vgp_obs_1a67cc55797b	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_1_v1	1	Non conformité au point 1 : Bâti stable au sol	\N	3	OUVERTE	t	\N	2026-02-01 19:44:02.283+00	2026-02-01 19:48:44.66+00
vgp_obs_62954e52e447	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_2_v1	2	Non conformité au point 2 : Absence de fissures ou déformations	\N	3	OUVERTE	t	\N	2026-02-01 19:48:46.172+00	2026-02-01 19:48:46.172+00
vgp_obs_a5f6e40f6f01	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_3_v1	3	Non conformité au point 3 : État des soudures	\N	3	OUVERTE	t	\N	2026-02-01 19:48:47.733+00	2026-02-01 19:48:47.733+00
vgp_obs_a846995035a9	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_4_v1	4	Non conformité au point 4 : Tenue mécanique des assemblages boulonnés	\N	3	OUVERTE	t	\N	2026-02-01 19:48:48.532+00	2026-02-01 19:48:48.532+00
vgp_obs_8d665c2d967f	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_5_v1	5	Non conformité au point 5 : État de la table et du tablier	\N	3	OUVERTE	t	\N	2026-02-01 19:48:49.991+00	2026-02-01 19:48:49.991+00
vgp_obs_a5bd5e97067c	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_6_v1	6	Non conformité au point 6 : Niveau d'huile correct	\N	3	OUVERTE	t	\N	2026-02-01 19:48:55.408+00	2026-02-01 19:48:55.408+00
vgp_obs_b5fa452d924f	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_7_v1	7	Non conformité au point 7 : Absence de fuites	\N	3	OUVERTE	t	\N	2026-02-01 19:48:55.911+00	2026-02-01 19:48:55.911+00
vgp_obs_fcee0c50fd45	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_8_v1	8	Non conformité au point 8 : État des flexibles	\N	3	OUVERTE	t	\N	2026-02-01 19:48:56.493+00	2026-02-01 19:48:56.493+00
vgp_obs_b03051eb903e	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_9_v1	9	Non conformité au point 9 : Filtres en bon état	\N	3	OUVERTE	t	\N	2026-02-01 19:48:57.068+00	2026-02-01 19:48:57.068+00
vgp_obs_f15c8d5074f4	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_10_v1	10	Non conformité au point 10 : Pression conforme	\N	3	OUVERTE	t	\N	2026-02-01 19:48:57.626+00	2026-02-01 19:48:57.626+00
vgp_obs_7ae3c5b76acc	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_11_v1	11	Non conformité au point 11 : Boutons et pédales fonctionnels	\N	3	OUVERTE	t	\N	2026-02-01 19:49:00.276+00	2026-02-01 19:49:00.276+00
vgp_obs_83d076108eaa	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_12_v1	12	Non conformité au point 12 : Sélecteur de mode opérationnel	\N	3	OUVERTE	t	\N	2026-02-01 19:49:00.867+00	2026-02-01 19:49:00.867+00
vgp_obs_0575305a227f	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_13_v1	13	Non conformité au point 13 : Commande bi-manuelle fonctionnelle	\N	3	OUVERTE	t	\N	2026-02-01 19:49:01.795+00	2026-02-01 19:49:01.795+00
vgp_obs_165b643a7742	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_14_v1	14	Non conformité au point 14 : Pédale protégée contre actionnement accidentel	\N	3	OUVERTE	t	\N	2026-02-01 19:49:03.186+00	2026-02-01 19:49:03.186+00
vgp_obs_6655354fbe0d	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_15_v1	15	Non conformité au point 15 : Retour automatique à l'état neutre	\N	3	OUVERTE	t	\N	2026-02-01 19:49:03.988+00	2026-02-01 19:49:03.988+00
vgp_obs_be9f8e3fe7b5	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_16_v1	16	Non conformité au point 16 : Arrêt d'urgence accessible	\N	3	OUVERTE	t	\N	2026-02-01 19:49:06.668+00	2026-02-01 19:49:07.088+00
vgp_obs_982b54a802f9	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_17_v1	17	Non conformité au point 17 : Arrêt d'urgence fonctionne correctement	\N	3	OUVERTE	t	\N	2026-02-01 19:49:08.13+00	2026-02-01 19:49:08.13+00
vgp_obs_28d8e5ba959c	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_18_v1	18	Non conformité au point 18 : Verrouillage après actionnement	\N	3	OUVERTE	t	\N	2026-02-01 19:49:09.075+00	2026-02-01 19:49:09.075+00
vgp_obs_dd2c87e5b32f	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_19_v1	19	Non conformité au point 19 : Signalisation correcte (rouge/jaune)	\N	3	OUVERTE	t	\N	2026-02-01 19:49:10.543+00	2026-02-01 19:49:10.543+00
vgp_obs_f8bb6bf1e7e9	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_20_v1	20	Non conformité au point 20 : Tous les AU sont raccordés	\N	3	OUVERTE	t	\N	2026-02-01 19:49:13.084+00	2026-02-01 19:49:13.084+00
vgp_obs_3c8b987d2b19	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_21_v1	21	Non conformité au point 21 : Carter latéraux en place	\N	3	OUVERTE	t	\N	2026-02-01 19:49:15.994+00	2026-02-01 19:49:15.994+00
vgp_obs_e8bb1c2b942e	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_22_v1	22	Non conformité au point 22 : Protection arrière installée	\N	3	OUVERTE	t	\N	2026-02-01 19:49:16.686+00	2026-02-01 19:49:16.686+00
vgp_obs_d8febd67c848	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_23_v1	23	Non conformité au point 23 : Fixations solides	\N	3	OUVERTE	t	\N	2026-02-01 19:49:17.214+00	2026-02-01 19:49:17.873+00
vgp_obs_b291c2837793	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_24_v1	24	Non conformité au point 24 : Absence de zones de coincement accessibles	\N	3	OUVERTE	t	\N	2026-02-01 19:49:18.87+00	2026-02-01 19:49:18.87+00
vgp_obs_d3049950e3ed	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_25_v1	25	Non conformité au point 25 : Détecteur d'ouverture fonctionnel	\N	3	OUVERTE	t	\N	2026-02-01 19:49:22.064+00	2026-02-01 19:49:22.064+00
vgp_obs_2909fd8f41d8	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_29_v1	29	Non conformité au point 29 : Barrière immatérielle présente et fonctionnelle	\N	3	OUVERTE	t	\N	2026-02-01 19:49:26.643+00	2026-02-01 19:49:26.643+00
vgp_obs_6df1178f32c1	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_30_v1	30	Non conformité au point 30 : Résolution adaptée	\N	3	OUVERTE	t	\N	2026-02-01 19:49:27.299+00	2026-02-01 19:49:27.299+00
vgp_obs_a35cc9677804	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_31_v1	31	Non conformité au point 31 : Test muting si applicable	\N	3	OUVERTE	t	\N	2026-02-01 19:49:28.558+00	2026-02-01 19:49:31.058+00
vgp_obs_9243b89dd51b	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_32_v1	32	Non conformité au point 32 : Indicateurs lumineux fonctionnels	\N	3	OUVERTE	t	\N	2026-02-01 19:49:32.115+00	2026-02-01 19:49:32.115+00
vgp_obs_30ebedd2aa2c	vgp_run_zpesf12h2etottu2	asset_auto_ 20	vgp_item_33_v1	33	Non conformité au point 33 : Distance de sécurité respectée	\N	3	OUVERTE	t	\N	2026-02-01 19:49:32.726+00	2026-02-01 19:49:32.726+00
\.


--
-- Data for Name: vgp_reports; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.vgp_reports (id, client_id, site_id, numero_rapport, date_rapport, signataire, synthese, has_observations, pdf_path, pdf_url, metadata, created_at, updated_at) FROM stdin;
vgp_rpt_tqu403act8cya035	cli_acme	site_angers	VGP-2026-33KL	2026-01-29 16:58:07.403+00	Admin	\N	f	\N	\N	\N	2026-01-29 16:58:07.403+00	2026-01-29 16:58:07.403+00
vgp_rpt_uen7yd0g8rtwwj6y	cli_acme	site_angers	VGP-2026-ZEHH	2026-01-29 17:00:07.621+00	Admin	\N	f	\N	\N	\N	2026-01-29 17:00:07.621+00	2026-01-29 17:00:07.621+00
vgp_rpt_ntw3kb8nohkmk0xr	cli_acme	site_angers	VGP-2026-TZUU	2026-01-29 17:03:38.408+00	Technicien Maintenance	\N	f	\N	\N	\N	2026-01-29 17:03:38.408+00	2026-01-29 17:03:38.408+00
vgp_rpt_w2p1wz43bhqz35aw	cli_acme	site_angers	VGP-2026-8AMZ	2026-01-29 17:04:08.284+00	Laurent Stefanini	\N	f	\N	\N	\N	2026-01-29 17:04:08.284+00	2026-01-29 17:04:08.284+00
vgp_rpt_iauzl5tthqxkaimr	cli_acme	site_angers	VGP-2026-EZCK	2026-01-29 23:25:10.086+00	Aimad Hadiqa	\N	f	\N	\N	\N	2026-01-29 23:25:10.086+00	2026-01-29 23:25:10.086+00
vgp_rpt_88e049v2vbxebdjc	cli_acme	site_angers	VGP-2026-I9KT	2026-01-31 08:07:07.083+00	Laurent Stefanini	\N	f	\N	\N	\N	2026-01-31 08:07:07.083+00	2026-01-31 08:07:07.083+00
vgp_rpt_39tyl3a9ov8jgfgv	cli_acme	site_angers	VGP-2026-XDXB	2026-02-01 18:48:30.879+00	Laurent Stefanini	\N	f	\N	\N	\N	2026-02-01 18:48:30.879+00	2026-02-01 18:48:30.879+00
vgp_rpt_r76qkv77nhan47r6	cli_acme	site_angers	VGP-2026-RZ8T	2026-02-01 19:12:39.901+00	Laurent Stefanini	\N	f	\N	\N	\N	2026-02-01 19:12:39.901+00	2026-02-01 19:12:39.901+00
vgp_rpt_7e1xzfze82qp8kfu	cli_acme	site_angers	VGP-2026-SEJ3	2026-02-01 19:19:20.494+00	Laurent Stefanini	\N	f	\N	\N	\N	2026-02-01 19:19:20.494+00	2026-02-01 19:19:20.494+00
vgp_rpt_3ik1olpfonbnt5ko	cli_acme	site_angers	VGP-2026-7FBZ	2026-02-01 19:24:10.093+00	Laurent Stefanini	\N	f	\N	\N	\N	2026-02-01 19:24:10.093+00	2026-02-01 19:24:10.093+00
vgp_rpt_8x8vszohvzt9fm0a	cli_auto_ 8	site_arkema_lacq	VGP-2026-KJ7F	2026-02-01 19:30:45.389+00	Laurent Stefanini	\N	f	\N	\N	\N	2026-02-01 19:30:45.389+00	2026-02-01 19:30:45.389+00
vgp_rpt_klkbflhit5zs7ybp	cli_acme	site_angers	VGP-2026-9ZYX	2026-02-01 19:35:15.976+00	Laurent Stefanini	\N	f	\N	\N	\N	2026-02-01 19:35:15.976+00	2026-02-01 19:35:15.976+00
vgp_rpt_e1odcfdaz43spi9j	cli_acme	site_angers	VGP-2026-HTJW	2026-02-01 19:43:32.082+00	Laurent Stefanini	\N	f	\N	\N	\N	2026-02-01 19:43:32.082+00	2026-02-01 19:43:32.082+00
vgp_rpt_we4yg4ofg3tetdr9	cli_acme	site_angers	VGP-2026-8J13	2026-02-02 07:07:48.853+00	Christian Ceccato	\N	f	\N	\N	\N	2026-02-02 07:07:48.853+00	2026-02-02 07:07:48.853+00
\.


--
-- Data for Name: vgp_template_items; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.vgp_template_items (id, section_id, numero, label, help_text, sort_order, active) FROM stdin;
vgp_item_1_v1	vgp_sec_a_v1	1	Bâti stable au sol	Vérifier fixation et absence de jeu	0	t
vgp_item_2_v1	vgp_sec_a_v1	2	Absence de fissures ou déformations	\N	1	t
vgp_item_3_v1	vgp_sec_a_v1	3	État des soudures	Contrôle visuel	2	t
vgp_item_4_v1	vgp_sec_a_v1	4	Tenue mécanique des assemblages boulonnés	\N	3	t
vgp_item_5_v1	vgp_sec_a_v1	5	État de la table et du tablier	\N	4	t
vgp_item_6_v1	vgp_sec_b_v1	6	Niveau d'huile correct	Vérifier jauge	0	t
vgp_item_7_v1	vgp_sec_b_v1	7	Absence de fuites	Tuyaux, raccords, vérins	1	t
vgp_item_8_v1	vgp_sec_b_v1	8	État des flexibles	Fissures, usure, pincement	2	t
vgp_item_9_v1	vgp_sec_b_v1	9	Filtres en bon état	\N	3	t
vgp_item_10_v1	vgp_sec_b_v1	10	Pression conforme	Vérifier manomètre	4	t
vgp_item_11_v1	vgp_sec_c_v1	11	Boutons et pédales fonctionnels	\N	0	t
vgp_item_12_v1	vgp_sec_c_v1	12	Sélecteur de mode opérationnel	Réglage/Auto/Manuel	1	t
vgp_item_13_v1	vgp_sec_c_v1	13	Commande bi-manuelle fonctionnelle	Si équipée	2	t
vgp_item_14_v1	vgp_sec_c_v1	14	Pédale protégée contre actionnement accidentel	\N	3	t
vgp_item_15_v1	vgp_sec_c_v1	15	Retour automatique à l'état neutre	\N	4	t
vgp_item_16_v1	vgp_sec_d_v1	16	Arrêt d'urgence accessible	Vérifier positionnement	0	t
vgp_item_17_v1	vgp_sec_d_v1	17	Arrêt d'urgence fonctionne correctement	Essai à vide	1	t
vgp_item_18_v1	vgp_sec_d_v1	18	Verrouillage après actionnement	Nécessite action volontaire pour réarmer	2	t
vgp_item_19_v1	vgp_sec_d_v1	19	Signalisation correcte (rouge/jaune)	\N	3	t
vgp_item_20_v1	vgp_sec_d_v1	20	Tous les AU sont raccordés	\N	4	t
vgp_item_21_v1	vgp_sec_e_v1	21	Carter latéraux en place	\N	0	t
vgp_item_22_v1	vgp_sec_e_v1	22	Protection arrière installée	\N	1	t
vgp_item_23_v1	vgp_sec_e_v1	23	Fixations solides	Vis, boulons non desserrés	2	t
vgp_item_24_v1	vgp_sec_e_v1	24	Absence de zones de coincement accessibles	\N	3	t
vgp_item_25_v1	vgp_sec_f_v1	25	Détecteur d'ouverture fonctionnel	Essai ouverture porte	0	t
vgp_item_26_v1	vgp_sec_f_v1	26	Arrêt immédiat à l'ouverture du protecteur	\N	1	t
vgp_item_27_v1	vgp_sec_f_v1	27	Verrouillage interdit le démarrage porte ouverte	\N	2	t
vgp_item_28_v1	vgp_sec_f_v1	28	Indicateur d'état visible	\N	3	t
vgp_item_29_v1	vgp_sec_g_v1	29	Barrière immatérielle présente et fonctionnelle	\N	0	t
vgp_item_30_v1	vgp_sec_g_v1	30	Résolution adaptée	Doigt, main, corps selon distance	1	t
vgp_item_31_v1	vgp_sec_g_v1	31	Test muting si applicable	\N	2	t
vgp_item_32_v1	vgp_sec_g_v1	32	Indicateurs lumineux fonctionnels	\N	3	t
vgp_item_33_v1	vgp_sec_g_v1	33	Distance de sécurité respectée	Calcul selon vitesse d'approche	4	t
vgp_item_34_v1	vgp_sec_h_v1	34	Cale/Bloc de sécurité présent	\N	0	t
vgp_item_35_v1	vgp_sec_h_v1	35	État du bloc	Usure, déformation	1	t
vgp_item_36_v1	vgp_sec_h_v1	36	Mise en place effective lors interventions	\N	2	t
vgp_item_37_v1	vgp_sec_i_v1	37	Éclairage zone de travail suffisant	\N	0	t
vgp_item_38_v1	vgp_sec_i_v1	38	Voyants de signalisation fonctionnels	\N	1	t
vgp_item_39_v1	vgp_sec_i_v1	39	Avertisseur sonore fonctionnel	Si équipé	2	t
vgp_item_40_v1	vgp_sec_i_v1	40	Signalétique de danger visible	\N	3	t
vgp_item_41_v1	vgp_sec_j_v1	41	Coffret électrique fermé	\N	0	t
vgp_item_42_v1	vgp_sec_j_v1	42	Sectionneur accessible et verrouillable	\N	1	t
vgp_item_43_v1	vgp_sec_j_v1	43	Câblage en bon état	Pas de fils dénudés ou écrasés	2	t
vgp_item_44_v1	vgp_sec_j_v1	44	Mise à la terre effective	\N	3	t
vgp_item_45_v1	vgp_sec_j_v1	45	Protection IP adaptée	\N	4	t
vgp_item_46_v1	vgp_sec_k_v1	46	Hauteur de travail adaptée	\N	0	t
vgp_item_47_v1	vgp_sec_k_v1	47	Accès aux commandes aisé	\N	1	t
vgp_item_48_v1	vgp_sec_k_v1	48	Efforts de manœuvre acceptables	\N	2	t
vgp_item_49_v1	vgp_sec_k_v1	49	Visibilité de la zone de travail	\N	3	t
vgp_item_50_v1	vgp_sec_k_v1	50	Sol antidérapant	Zone de l'opérateur	4	t
vgp_item_51_v1	vgp_sec_l_v1	51	Plaque signalétique lisible	Constructeur, modèle, n° série	0	t
vgp_item_52_v1	vgp_sec_l_v1	52	Marquage CE présent	\N	1	t
vgp_item_53_v1	vgp_sec_l_v1	53	Notice d'instructions disponible	\N	2	t
vgp_item_54_v1	vgp_sec_l_v1	54	Schémas électriques et hydrauliques	\N	3	t
vgp_item_55_v1	vgp_sec_l_v1	55	Registre de maintenance à jour	\N	4	t
vgp_item_56_v1	vgp_sec_m_v1	56	Carnet de maintenance existant	\N	0	t
vgp_item_57_v1	vgp_sec_m_v1	57	Dernière maintenance préventive datée	\N	1	t
vgp_item_58_v1	vgp_sec_m_v1	58	Actions correctives précédentes réalisées	\N	2	t
vgp_item_59_v1	vgp_sec_m_v1	59	Pièces de rechange conformes	\N	3	t
vgp_item_60_v1	vgp_sec_n_v1	60	Descente coulisseau normale	Vitesse régulière	0	t
vgp_item_61_v1	vgp_sec_n_v1	61	Remontée coulisseau normale	\N	1	t
vgp_item_62_v1	vgp_sec_n_v1	62	Point mort haut atteint	\N	2	t
vgp_item_63_v1	vgp_sec_n_v1	63	Point mort bas configurable	\N	3	t
vgp_item_64_v1	vgp_sec_n_v1	64	Arrêt instantané à la commande	\N	4	t
vgp_item_65_v1	vgp_sec_n_v1	65	Pas de dérive en position maintenue	\N	5	t
vgp_item_66_v1	vgp_sec_n_v1	66	Fonctionnement en mode coup par coup	\N	6	t
vgp_item_67_v1	vgp_sec_n_v1	67	Temps de cycle cohérent	\N	7	t
vgp_item_68_v1	vgp_sec_n_v1	68	Bruit de fonctionnement normal	Pas de cognements anormaux	8	t
vgp_item_69_v1	vgp_sec_n_v1	69	Température de fonctionnement normale	Après quelques cycles	9	t
vgp_item_70_v1	vgp_sec_o_v1	70	Formation opérateurs attestée	\N	0	t
vgp_item_71_v1	vgp_sec_o_v1	71	Habilitation maintenance électrique	\N	1	t
vgp_item_72_v1	vgp_sec_o_v1	72	EPI adaptés disponibles	Gants, lunettes...	2	t
vgp_item_73_v1	vgp_sec_o_v1	73	Consignes de sécurité affichées	\N	3	t
vgp_item_74_v1	vgp_sec_o_v1	74	Procédure de consignation définie	\N	4	t
vgp_item_75_v1	vgp_sec_o_v1	75	Zone de travail dégagée	\N	5	t
vgp_item_76_v1	vgp_sec_o_v1	76	Extincteur à proximité	\N	6	t
\.


--
-- Data for Name: vgp_template_sections; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.vgp_template_sections (id, template_id, code, title, sort_order) FROM stdin;
vgp_sec_a_v1	vgp_tpl_presses_v1	A	Bâti et structure	0
vgp_sec_b_v1	vgp_tpl_presses_v1	B	Circuit hydraulique	1
vgp_sec_c_v1	vgp_tpl_presses_v1	C	Commandes et organes de service	2
vgp_sec_d_v1	vgp_tpl_presses_v1	D	Arrêts d'urgence	3
vgp_sec_e_v1	vgp_tpl_presses_v1	E	Protections mécaniques fixes	4
vgp_sec_f_v1	vgp_tpl_presses_v1	F	Protections mobiles avec inter-verrouillage	5
vgp_sec_g_v1	vgp_tpl_presses_v1	G	Dispositifs optoélectroniques (barrières immatérielles)	6
vgp_sec_h_v1	vgp_tpl_presses_v1	H	Systèmes de retenue mécanique (bloc de sécurité)	7
vgp_sec_i_v1	vgp_tpl_presses_v1	I	Éclairage et signalisation	8
vgp_sec_j_v1	vgp_tpl_presses_v1	J	Installation électrique	9
vgp_sec_k_v1	vgp_tpl_presses_v1	K	Ergonomie et accessibilité	10
vgp_sec_l_v1	vgp_tpl_presses_v1	L	Documentation et marquage	11
vgp_sec_m_v1	vgp_tpl_presses_v1	M	Maintenance et historique	12
vgp_sec_n_v1	vgp_tpl_presses_v1	N	Essais à vide	13
vgp_sec_o_v1	vgp_tpl_presses_v1	O	Points complémentaires	14
\.


--
-- Data for Name: vgp_templates; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.vgp_templates (id, name, machine_type, version, active, referentiel, metadata, created_at, updated_at) FROM stdin;
vgp_tpl_presses_v1	VGP Presses Plieuses Hydrauliques	PRESS	1	t	Code du travail Art. R.4323-23 à R.4323-27	{"type": "presses_plieuses_hydrauliques", "source": "seed"}	2026-01-26 18:58:58.907+00	2026-01-26 18:58:58.907+00
\.


--
-- Data for Name: zones; Type: TABLE DATA; Schema: public; Owner: api_user
--

COPY public.zones (id, site_id, name) FROM stdin;
zone_press	site_angers	Atelier Presses
zone_injection	site_angers	Atelier Injection
zone_maintenance	site_angers	Maintenance
zone_auto_ 1	site_auto_ 1	Zone Principale
zone_auto_ 2	site_auto_ 2	Zone Principale
zone_auto_ 3	site_auto_ 3	Zone Principale
zone_auto_ 4	site_auto_ 4	Zone Principale
zone_auto_ 5	site_auto_ 5	Zone Principale
zone_auto_ 6	site_auto_ 6	Zone Principale
zone_auto_ 7	site_auto_ 7	Zone Principale
zone_auto_ 8	site_auto_ 8	Zone Principale
zone_rt_v_prod	site_rt_venissieux	Atelier Production
zone_rt_v_log	site_rt_venissieux	Logistique
zone_po_c_moule	site_po_compiegne	Atelier Moulage
zone_po_c_mont	site_po_compiegne	Montage
zone_po_s_prod	site_po_sigmaringen	Production
zone_saf_col_usinage	site_safran_colomiers	Atelier Usinage
zone_saf_col_ass	site_safran_colomiers	Assemblage
zone_psa_s_prod	site_psa_sochaux	Chaîne de Production
zone_psa_s_log	site_psa_sochaux	Logistique
zone_psa_r_prod	site_psa_rennes	Production
zone_se_c_elect	site_se_carros	Électronique
zone_mich_l_rnd	site_michelin_ladoux	R&D
zone_mich_l_test	site_michelin_ladoux	Tests
zone_mich_t_prod	site_michelin_troyes	Production
zone_val_a_prod	site_valeo_angers	Production
zone_ark_l_chimie	site_arkema_lacq	Production Chimique
\.


--
-- Name: mission_operation_assets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: api_user
--

SELECT pg_catalog.setval('public.mission_operation_assets_id_seq', 40, true);


--
-- Name: operation_checklists_id_seq; Type: SEQUENCE SET; Schema: public; Owner: api_user
--

SELECT pg_catalog.setval('public.operation_checklists_id_seq', 3, true);


--
-- Name: asset_controls asset_controls_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.asset_controls
    ADD CONSTRAINT asset_controls_pkey PRIMARY KEY (id);


--
-- Name: assets assets_code_interne_key; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_code_interne_key UNIQUE (code_interne);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: attachments attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_pkey PRIMARY KEY (id);


--
-- Name: checklist_items checklist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.checklist_items
    ADD CONSTRAINT checklist_items_pkey PRIMARY KEY (id);


--
-- Name: checklist_templates checklist_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.checklist_templates
    ADD CONSTRAINT checklist_templates_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: company_settings company_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_pkey PRIMARY KEY (id);


--
-- Name: control_types control_types_code_key; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.control_types
    ADD CONSTRAINT control_types_code_key UNIQUE (code);


--
-- Name: control_types control_types_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.control_types
    ADD CONSTRAINT control_types_pkey PRIMARY KEY (id);


--
-- Name: corrective_actions corrective_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.corrective_actions
    ADD CONSTRAINT corrective_actions_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: maintenance_logs maintenance_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.maintenance_logs
    ADD CONSTRAINT maintenance_logs_pkey PRIMARY KEY (id);


--
-- Name: mission_assets mission_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.mission_assets
    ADD CONSTRAINT mission_assets_pkey PRIMARY KEY (id);


--
-- Name: mission_operation_assets mission_operation_assets_mission_id_operation_type_asset_id_key; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.mission_operation_assets
    ADD CONSTRAINT mission_operation_assets_mission_id_operation_type_asset_id_key UNIQUE (mission_id, operation_type, asset_id);


--
-- Name: mission_operation_assets mission_operation_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.mission_operation_assets
    ADD CONSTRAINT mission_operation_assets_pkey PRIMARY KEY (id);


--
-- Name: mission_operations mission_operations_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.mission_operations
    ADD CONSTRAINT mission_operations_pkey PRIMARY KEY (id);


--
-- Name: mission_technicians mission_technicians_mission_id_technician_id_key; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.mission_technicians
    ADD CONSTRAINT mission_technicians_mission_id_technician_id_key UNIQUE (mission_id, technician_id);


--
-- Name: mission_technicians mission_technicians_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.mission_technicians
    ADD CONSTRAINT mission_technicians_pkey PRIMARY KEY (id);


--
-- Name: missions missions_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.missions
    ADD CONSTRAINT missions_pkey PRIMARY KEY (id);


--
-- Name: nonconformities nonconformities_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.nonconformities
    ADD CONSTRAINT nonconformities_pkey PRIMARY KEY (id);


--
-- Name: operation_checklists operation_checklists_operation_type_name_key; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.operation_checklists
    ADD CONSTRAINT operation_checklists_operation_type_name_key UNIQUE (operation_type, name);


--
-- Name: operation_checklists operation_checklists_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.operation_checklists
    ADD CONSTRAINT operation_checklists_pkey PRIMARY KEY (id);


--
-- Name: outbox outbox_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.outbox
    ADD CONSTRAINT outbox_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (user_id);


--
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- Name: report_item_results report_item_results_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.report_item_results
    ADD CONSTRAINT report_item_results_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: sites sites_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_pkey PRIMARY KEY (id);


--
-- Name: user_business_card user_business_card_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.user_business_card
    ADD CONSTRAINT user_business_card_pkey PRIMARY KEY (user_id);


--
-- Name: user_business_card user_business_card_public_token_key; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.user_business_card
    ADD CONSTRAINT user_business_card_public_token_key UNIQUE (public_token);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vgp_inspection_runs vgp_inspection_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.vgp_inspection_runs
    ADD CONSTRAINT vgp_inspection_runs_pkey PRIMARY KEY (id);


--
-- Name: vgp_item_results vgp_item_results_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.vgp_item_results
    ADD CONSTRAINT vgp_item_results_pkey PRIMARY KEY (id);


--
-- Name: vgp_item_results vgp_item_results_run_id_item_id_key; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.vgp_item_results
    ADD CONSTRAINT vgp_item_results_run_id_item_id_key UNIQUE (run_id, item_id);


--
-- Name: vgp_observations vgp_observations_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.vgp_observations
    ADD CONSTRAINT vgp_observations_pkey PRIMARY KEY (id);


--
-- Name: vgp_reports vgp_reports_numero_rapport_key; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.vgp_reports
    ADD CONSTRAINT vgp_reports_numero_rapport_key UNIQUE (numero_rapport);


--
-- Name: vgp_reports vgp_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.vgp_reports
    ADD CONSTRAINT vgp_reports_pkey PRIMARY KEY (id);


--
-- Name: vgp_template_items vgp_template_items_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.vgp_template_items
    ADD CONSTRAINT vgp_template_items_pkey PRIMARY KEY (id);


--
-- Name: vgp_template_sections vgp_template_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.vgp_template_sections
    ADD CONSTRAINT vgp_template_sections_pkey PRIMARY KEY (id);


--
-- Name: vgp_templates vgp_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.vgp_templates
    ADD CONSTRAINT vgp_templates_pkey PRIMARY KEY (id);


--
-- Name: zones zones_pkey; Type: CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.zones
    ADD CONSTRAINT zones_pkey PRIMARY KEY (id);


--
-- Name: idx_actions_due; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_actions_due ON public.corrective_actions USING btree (due_at, status);


--
-- Name: idx_asset_controls_due; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_asset_controls_due ON public.asset_controls USING btree (next_due_at);


--
-- Name: idx_assets_categorie; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_assets_categorie ON public.assets USING btree (categorie);


--
-- Name: idx_assets_site; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_assets_site ON public.assets USING btree (site_id);


--
-- Name: idx_attachments_category; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_attachments_category ON public.attachments USING btree (category);


--
-- Name: idx_attachments_owner; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_attachments_owner ON public.attachments USING btree (owner_type, owner_id);


--
-- Name: idx_attachments_parent; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_attachments_parent ON public.attachments USING btree (parent_id);


--
-- Name: idx_attachments_status; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_attachments_status ON public.attachments USING btree (status);


--
-- Name: idx_documents_entity; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_documents_entity ON public.documents USING btree (entity_type, entity_id);


--
-- Name: idx_documents_synced; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_documents_synced ON public.documents USING btree (synced);


--
-- Name: idx_mission_operation_assets_asset; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_mission_operation_assets_asset ON public.mission_operation_assets USING btree (asset_id);


--
-- Name: idx_mission_operation_assets_mission; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_mission_operation_assets_mission ON public.mission_operation_assets USING btree (mission_id);


--
-- Name: idx_mission_operations_mission; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_mission_operations_mission ON public.mission_operations USING btree (mission_id);


--
-- Name: idx_mission_technicians_mission; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_mission_technicians_mission ON public.mission_technicians USING btree (mission_id);


--
-- Name: idx_mission_technicians_tech; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_mission_technicians_tech ON public.mission_technicians USING btree (technician_id);


--
-- Name: idx_operation_checklists_type; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_operation_checklists_type ON public.operation_checklists USING btree (operation_type);


--
-- Name: idx_outbox_status; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_outbox_status ON public.outbox USING btree (status);


--
-- Name: idx_password_reset_tokens_expires; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_password_reset_tokens_expires ON public.password_reset_tokens USING btree (expires_at);


--
-- Name: idx_password_reset_tokens_token; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens USING btree (token);


--
-- Name: idx_reports_performed; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_reports_performed ON public.reports USING btree (performed_at);


--
-- Name: idx_vgp_observations_asset; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_vgp_observations_asset ON public.vgp_observations USING btree (asset_id);


--
-- Name: idx_vgp_observations_run; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_vgp_observations_run ON public.vgp_observations USING btree (run_id);


--
-- Name: idx_vgp_observations_statut; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_vgp_observations_statut ON public.vgp_observations USING btree (statut);


--
-- Name: idx_vgp_reports_client; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_vgp_reports_client ON public.vgp_reports USING btree (client_id);


--
-- Name: idx_vgp_reports_date; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_vgp_reports_date ON public.vgp_reports USING btree (date_rapport);


--
-- Name: idx_vgp_results_item; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_vgp_results_item ON public.vgp_item_results USING btree (item_id);


--
-- Name: idx_vgp_results_run; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_vgp_results_run ON public.vgp_item_results USING btree (run_id);


--
-- Name: idx_vgp_runs_asset; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_vgp_runs_asset ON public.vgp_inspection_runs USING btree (asset_id);


--
-- Name: idx_vgp_runs_report; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_vgp_runs_report ON public.vgp_inspection_runs USING btree (report_id);


--
-- Name: idx_vgp_runs_statut; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_vgp_runs_statut ON public.vgp_inspection_runs USING btree (statut);


--
-- Name: idx_vgp_template_items_section; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX idx_vgp_template_items_section ON public.vgp_template_items USING btree (section_id);


--
-- Name: user_business_card_public_token_idx; Type: INDEX; Schema: public; Owner: api_user
--

CREATE INDEX user_business_card_public_token_idx ON public.user_business_card USING btree (public_token);


--
-- Name: asset_controls asset_controls_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.asset_controls
    ADD CONSTRAINT asset_controls_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;


--
-- Name: asset_controls asset_controls_control_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.asset_controls
    ADD CONSTRAINT asset_controls_control_type_id_fkey FOREIGN KEY (control_type_id) REFERENCES public.control_types(id) ON DELETE RESTRICT;


--
-- Name: assets assets_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE RESTRICT;


--
-- Name: assets assets_zone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.zones(id) ON DELETE RESTRICT;


--
-- Name: attachments attachments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: attachments attachments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.attachments(id) ON DELETE SET NULL;


--
-- Name: attachments attachments_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: checklist_items checklist_items_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.checklist_items
    ADD CONSTRAINT checklist_items_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.checklist_templates(id) ON DELETE CASCADE;


--
-- Name: checklist_templates checklist_templates_control_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.checklist_templates
    ADD CONSTRAINT checklist_templates_control_type_id_fkey FOREIGN KEY (control_type_id) REFERENCES public.control_types(id) ON DELETE CASCADE;


--
-- Name: corrective_actions corrective_actions_nonconformity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.corrective_actions
    ADD CONSTRAINT corrective_actions_nonconformity_id_fkey FOREIGN KEY (nonconformity_id) REFERENCES public.nonconformities(id) ON DELETE CASCADE;


--
-- Name: maintenance_logs maintenance_logs_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.maintenance_logs
    ADD CONSTRAINT maintenance_logs_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;


--
-- Name: mission_assets mission_assets_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.mission_assets
    ADD CONSTRAINT mission_assets_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE RESTRICT;


--
-- Name: mission_assets mission_assets_mission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.mission_assets
    ADD CONSTRAINT mission_assets_mission_id_fkey FOREIGN KEY (mission_id) REFERENCES public.missions(id) ON DELETE CASCADE;


--
-- Name: mission_operation_assets mission_operation_assets_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.mission_operation_assets
    ADD CONSTRAINT mission_operation_assets_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;


--
-- Name: mission_operation_assets mission_operation_assets_checklist_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.mission_operation_assets
    ADD CONSTRAINT mission_operation_assets_checklist_template_id_fkey FOREIGN KEY (checklist_template_id) REFERENCES public.operation_checklists(id);


--
-- Name: mission_operation_assets mission_operation_assets_mission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.mission_operation_assets
    ADD CONSTRAINT mission_operation_assets_mission_id_fkey FOREIGN KEY (mission_id) REFERENCES public.missions(id) ON DELETE CASCADE;


--
-- Name: mission_operations mission_operations_mission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.mission_operations
    ADD CONSTRAINT mission_operations_mission_id_fkey FOREIGN KEY (mission_id) REFERENCES public.missions(id) ON DELETE CASCADE;


--
-- Name: mission_technicians mission_technicians_mission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.mission_technicians
    ADD CONSTRAINT mission_technicians_mission_id_fkey FOREIGN KEY (mission_id) REFERENCES public.missions(id) ON DELETE CASCADE;


--
-- Name: mission_technicians mission_technicians_technician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.mission_technicians
    ADD CONSTRAINT mission_technicians_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: missions missions_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.missions
    ADD CONSTRAINT missions_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: missions missions_control_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.missions
    ADD CONSTRAINT missions_control_type_id_fkey FOREIGN KEY (control_type_id) REFERENCES public.control_types(id) ON DELETE RESTRICT;


--
-- Name: missions missions_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.missions
    ADD CONSTRAINT missions_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE RESTRICT;


--
-- Name: nonconformities nonconformities_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.nonconformities
    ADD CONSTRAINT nonconformities_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE RESTRICT;


--
-- Name: nonconformities nonconformities_checklist_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.nonconformities
    ADD CONSTRAINT nonconformities_checklist_item_id_fkey FOREIGN KEY (checklist_item_id) REFERENCES public.checklist_items(id) ON DELETE SET NULL;


--
-- Name: nonconformities nonconformities_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.nonconformities
    ADD CONSTRAINT nonconformities_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.reports(id) ON DELETE SET NULL;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: report_item_results report_item_results_checklist_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.report_item_results
    ADD CONSTRAINT report_item_results_checklist_item_id_fkey FOREIGN KEY (checklist_item_id) REFERENCES public.checklist_items(id) ON DELETE RESTRICT;


--
-- Name: report_item_results report_item_results_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.report_item_results
    ADD CONSTRAINT report_item_results_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.reports(id) ON DELETE CASCADE;


--
-- Name: reports reports_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE RESTRICT;


--
-- Name: reports reports_mission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_mission_id_fkey FOREIGN KEY (mission_id) REFERENCES public.missions(id) ON DELETE CASCADE;


--
-- Name: sites sites_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE RESTRICT;


--
-- Name: user_business_card user_business_card_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.user_business_card
    ADD CONSTRAINT user_business_card_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: vgp_inspection_runs vgp_inspection_runs_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.vgp_inspection_runs
    ADD CONSTRAINT vgp_inspection_runs_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE RESTRICT;


--
-- Name: vgp_inspection_runs vgp_inspection_runs_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.vgp_inspection_runs
    ADD CONSTRAINT vgp_inspection_runs_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.vgp_reports(id) ON DELETE CASCADE;


--
-- Name: vgp_inspection_runs vgp_inspection_runs_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.vgp_inspection_runs
    ADD CONSTRAINT vgp_inspection_runs_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.vgp_templates(id) ON DELETE RESTRICT;


--
-- Name: vgp_item_results vgp_item_results_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.vgp_item_results
    ADD CONSTRAINT vgp_item_results_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.vgp_template_items(id) ON DELETE RESTRICT;


--
-- Name: vgp_item_results vgp_item_results_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.vgp_item_results
    ADD CONSTRAINT vgp_item_results_run_id_fkey FOREIGN KEY (run_id) REFERENCES public.vgp_inspection_runs(id) ON DELETE CASCADE;


--
-- Name: vgp_observations vgp_observations_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.vgp_observations
    ADD CONSTRAINT vgp_observations_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE RESTRICT;


--
-- Name: vgp_observations vgp_observations_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.vgp_observations
    ADD CONSTRAINT vgp_observations_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.vgp_template_items(id) ON DELETE SET NULL;


--
-- Name: vgp_observations vgp_observations_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.vgp_observations
    ADD CONSTRAINT vgp_observations_run_id_fkey FOREIGN KEY (run_id) REFERENCES public.vgp_inspection_runs(id) ON DELETE CASCADE;


--
-- Name: vgp_reports vgp_reports_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.vgp_reports
    ADD CONSTRAINT vgp_reports_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE RESTRICT;


--
-- Name: vgp_reports vgp_reports_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.vgp_reports
    ADD CONSTRAINT vgp_reports_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE RESTRICT;


--
-- Name: vgp_template_items vgp_template_items_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.vgp_template_items
    ADD CONSTRAINT vgp_template_items_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.vgp_template_sections(id) ON DELETE CASCADE;


--
-- Name: vgp_template_sections vgp_template_sections_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.vgp_template_sections
    ADD CONSTRAINT vgp_template_sections_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.vgp_templates(id) ON DELETE CASCADE;


--
-- Name: zones zones_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: api_user
--

ALTER TABLE ONLY public.zones
    ADD CONSTRAINT zones_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict qUDYoLxYGAsK5ZXfv88vJ2oYcNSGy1svOFWcFb3ecxvitnuTRxyhTBu3zClcW9B

