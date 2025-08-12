--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

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

--
-- Name: connection_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.connection_status AS ENUM (
    'connected',
    'disconnected',
    'error',
    'testing'
);


ALTER TYPE public.connection_status OWNER TO neondb_owner;

--
-- Name: invoice_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.invoice_status AS ENUM (
    'DRAFT',
    'SENT',
    'PAID',
    'OVERDUE',
    'CANCELLED'
);


ALTER TYPE public.invoice_status OWNER TO neondb_owner;

--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.payment_status AS ENUM (
    'PENDING',
    'PAID',
    'UNPAID'
);


ALTER TYPE public.payment_status OWNER TO neondb_owner;

--
-- Name: pricing_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.pricing_type AS ENUM (
    'per_school',
    'per_student',
    'per_staff',
    'per_term',
    'per_year',
    'per_branch',
    'per_semester',
    'per_month',
    'free'
);


ALTER TYPE public.pricing_type OWNER TO neondb_owner;

--
-- Name: school_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.school_status AS ENUM (
    'ACTIVE',
    'DISABLED'
);


ALTER TYPE public.school_status OWNER TO neondb_owner;

--
-- Name: school_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.school_type AS ENUM (
    'K12',
    'NIGERIAN'
);


ALTER TYPE public.school_type OWNER TO neondb_owner;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.user_role AS ENUM (
    'superadmin',
    'school_admin',
    'branch_admin',
    'teacher',
    'student',
    'parent'
);


ALTER TYPE public.user_role OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: app_config; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.app_config (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    app_name character varying DEFAULT 'Elite Scholar'::character varying,
    app_logo character varying,
    domain character varying,
    sendgrid_api_key character varying,
    sendgrid_from_email character varying,
    sendgrid_from_name character varying DEFAULT 'Elite Scholar'::character varying,
    sendgrid_status public.connection_status DEFAULT 'disconnected'::public.connection_status,
    sendgrid_last_checked timestamp without time zone,
    sendgrid_error_message text,
    smtp_host character varying,
    smtp_port character varying DEFAULT '587'::character varying,
    smtp_user character varying,
    smtp_password character varying,
    smtp_secure boolean DEFAULT false,
    smtp_status public.connection_status DEFAULT 'disconnected'::public.connection_status,
    smtp_last_checked timestamp without time zone,
    smtp_error_message text,
    cloudinary_cloud_name character varying,
    cloudinary_api_key character varying,
    cloudinary_api_secret character varying,
    cloudinary_upload_preset character varying,
    cloudinary_status public.connection_status DEFAULT 'disconnected'::public.connection_status,
    cloudinary_last_checked timestamp without time zone,
    cloudinary_error_message text,
    twilio_account_sid character varying,
    twilio_auth_token character varying,
    twilio_phone_number character varying,
    twilio_whatsapp_number character varying,
    twilio_sms_status public.connection_status DEFAULT 'disconnected'::public.connection_status,
    twilio_whatsapp_status public.connection_status DEFAULT 'disconnected'::public.connection_status,
    twilio_last_checked timestamp without time zone,
    twilio_error_message text,
    invoice_template text,
    invoice_background_image character varying,
    invoice_logo character varying,
    maintenance_mode boolean DEFAULT false,
    allow_registration boolean DEFAULT true,
    max_file_upload_size integer DEFAULT 10485760,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.app_config OWNER TO neondb_owner;

--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.app_settings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    app_name character varying DEFAULT 'Elite Scholar'::character varying,
    app_logo character varying,
    domain character varying,
    smtp_host character varying,
    smtp_port character varying DEFAULT '587'::character varying,
    smtp_user character varying,
    smtp_password character varying,
    smtp_secure boolean DEFAULT false,
    email_from_address character varying,
    email_from_name character varying DEFAULT 'Elite Scholar'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    email_template text,
    twilio_account_sid character varying,
    twilio_auth_token character varying,
    twilio_phone_number character varying,
    twilio_whatsapp_number character varying,
    invoice_template text,
    invoice_background_image character varying,
    invoice_logo character varying,
    cloudinary_cloud_name character varying,
    cloudinary_api_key character varying,
    cloudinary_api_secret character varying,
    cloudinary_upload_preset character varying
);


ALTER TABLE public.app_settings OWNER TO neondb_owner;

--
-- Name: branches; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.branches (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    school_id character varying NOT NULL,
    name character varying NOT NULL,
    is_main boolean DEFAULT false,
    credentials jsonb,
    created_at timestamp without time zone DEFAULT now(),
    status character varying DEFAULT 'active'::character varying,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.branches OWNER TO neondb_owner;

--
-- Name: features; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.features (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    key character varying NOT NULL,
    name character varying NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now(),
    category character varying DEFAULT 'CORE'::character varying,
    is_active boolean DEFAULT true,
    price integer DEFAULT 0,
    type jsonb DEFAULT '{"both": false, "module": false, "standalone": false}'::jsonb,
    updated_at timestamp without time zone DEFAULT now(),
    pricing_type public.pricing_type,
    is_core boolean DEFAULT false,
    deleted_at timestamp without time zone,
    requires_date_range boolean DEFAULT false
);


ALTER TABLE public.features OWNER TO neondb_owner;

--
-- Name: grade_sections; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.grade_sections (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    school_id character varying NOT NULL,
    name character varying NOT NULL,
    code character varying NOT NULL,
    "order" integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    section_id character varying,
    type character varying,
    is_active boolean DEFAULT true,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.grade_sections OWNER TO neondb_owner;

--
-- Name: invoice_assets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.invoice_assets (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    school_id character varying,
    name character varying NOT NULL,
    type character varying NOT NULL,
    url character varying NOT NULL,
    size integer,
    mime_type character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.invoice_assets OWNER TO neondb_owner;

--
-- Name: invoice_lines; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.invoice_lines (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    invoice_id character varying NOT NULL,
    description character varying NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    total numeric(12,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    feature_id character varying DEFAULT 'temp-feature-id'::character varying NOT NULL,
    unit_measurement character varying,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    negotiated_price numeric(12,2)
);


ALTER TABLE public.invoice_lines OWNER TO neondb_owner;

--
-- Name: invoice_templates; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.invoice_templates (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    school_id character varying,
    name character varying NOT NULL,
    features jsonb,
    total_amount integer NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    template_type character varying DEFAULT 'modern'::character varying NOT NULL,
    primary_color character varying DEFAULT '#2563eb'::character varying,
    accent_color character varying DEFAULT '#64748b'::character varying,
    logo_url character varying,
    watermark_url character varying,
    background_image_url character varying,
    customization jsonb DEFAULT '{"footerText": "", "headerStyle": "default", "showWatermark": false, "showBackgroundImage": false}'::jsonb
);


ALTER TABLE public.invoice_templates OWNER TO neondb_owner;

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.invoices (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    invoice_number character varying NOT NULL,
    school_id character varying NOT NULL,
    template_id character varying,
    features jsonb,
    total_amount numeric(12,2) NOT NULL,
    custom_amount integer,
    status public.invoice_status DEFAULT 'DRAFT'::public.invoice_status NOT NULL,
    due_date timestamp without time zone NOT NULL,
    paid_at timestamp without time zone,
    email_sent boolean DEFAULT false,
    email_sent_at timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.invoices OWNER TO neondb_owner;

--
-- Name: school_features; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.school_features (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    school_id character varying NOT NULL,
    feature_id character varying NOT NULL,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.school_features OWNER TO neondb_owner;

--
-- Name: schools; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.schools (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    short_name character varying NOT NULL,
    abbreviation character varying,
    motto text,
    state character varying,
    lga character varying,
    address text,
    phones jsonb DEFAULT '[]'::jsonb NOT NULL,
    email character varying,
    logo_url character varying,
    type public.school_type DEFAULT 'K12'::public.school_type NOT NULL,
    status public.school_status DEFAULT 'ACTIVE'::public.school_status NOT NULL,
    main_branch_id character varying,
    payment_status public.payment_status DEFAULT 'PENDING'::public.payment_status NOT NULL,
    next_payment_due timestamp without time zone,
    access_blocked_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.schools OWNER TO neondb_owner;

--
-- Name: sections; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sections (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    school_id character varying NOT NULL,
    name character varying NOT NULL,
    code character varying NOT NULL,
    capacity integer DEFAULT 30,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.sections OWNER TO neondb_owner;

--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.subscriptions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    school_id character varying NOT NULL,
    plan character varying NOT NULL,
    starts_at timestamp without time zone NOT NULL,
    ends_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.subscriptions OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    name character varying NOT NULL,
    role public.user_role DEFAULT 'student'::public.user_role NOT NULL,
    school_id character varying,
    branch_id character varying,
    force_password_change boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Data for Name: app_config; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.app_config (id, app_name, app_logo, domain, sendgrid_api_key, sendgrid_from_email, sendgrid_from_name, sendgrid_status, sendgrid_last_checked, sendgrid_error_message, smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure, smtp_status, smtp_last_checked, smtp_error_message, cloudinary_cloud_name, cloudinary_api_key, cloudinary_api_secret, cloudinary_upload_preset, cloudinary_status, cloudinary_last_checked, cloudinary_error_message, twilio_account_sid, twilio_auth_token, twilio_phone_number, twilio_whatsapp_number, twilio_sms_status, twilio_whatsapp_status, twilio_last_checked, twilio_error_message, invoice_template, invoice_background_image, invoice_logo, maintenance_mode, allow_registration, max_file_upload_size, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: app_settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.app_settings (id, app_name, app_logo, domain, smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure, email_from_address, email_from_name, created_at, updated_at, email_template, twilio_account_sid, twilio_auth_token, twilio_phone_number, twilio_whatsapp_number, invoice_template, invoice_background_image, invoice_logo, cloudinary_cloud_name, cloudinary_api_key, cloudinary_api_secret, cloudinary_upload_preset) FROM stdin;
7794e9c9-eb33-46d5-a722-ee8f9bf054af	Elite Scholar	\N	\N	\N	587	\N	\N	f	\N	Elite Scholar	2025-08-11 14:45:48.08823	2025-08-11 14:45:48.08823	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
default-settings	Elite Scholar	\N	\N	\N	587	\N	\N	f	\N	Elite Scholar	2025-08-11 21:18:02.699548	2025-08-11 21:18:02.699548	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.branches (id, school_id, name, is_main, credentials, created_at, status, updated_at) FROM stdin;
877c644d-7d18-4075-88aa-bb598fc89360	00233c69-2170-4c0b-bbeb-342e8f44399e	Main Branchs	t	\N	2025-08-10 16:35:32.088582	active	2025-08-11 11:45:30.18
27af634e-de2c-428b-9e15-f2636980ac3d	2ff08f99-7fb1-4d95-b0e6-f49346b3a462	Main Branch	t	\N	2025-08-11 12:42:30.789567	active	2025-08-11 12:42:30.789567
d3381b0e-ce00-4232-b857-b74584753afa	00233c69-2170-4c0b-bbeb-342e8f44399e	Badawa branch	f	\N	2025-08-11 11:45:40.403876	deleted	2025-08-11 12:50:53.853
8d1b4f55-9653-43a8-adef-4062b91d450f	8239732f-f976-4721-901d-57bb553fc6d6	Main Branch	t	\N	2025-08-11 12:53:28.810651	active	2025-08-11 12:53:28.810651
90a7e804-0d42-4b44-94e4-535151488b95	8239732f-f976-4721-901d-57bb553fc6d6	Badawa branch	f	\N	2025-08-11 12:54:40.190969	active	2025-08-11 12:54:40.190969
26c59883-e3e4-4d95-afe4-b33da2349f14	19b8794a-88a8-4026-b070-4aef40a813a9	Main Branch	t	\N	2025-08-12 09:22:06.747259	active	2025-08-12 09:22:06.747259
c7e99c13-c3c9-4013-a9dd-f7c05a38301d	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Main Branch	t	\N	2025-08-12 10:24:37.966064	active	2025-08-12 10:24:37.966064
da082329-71d8-42fd-8967-a7d4a9c265e3	687c1127-a477-484d-8bda-c1d99aad91a2	Main Branch	t	\N	2025-08-12 10:25:12.096933	active	2025-08-12 10:25:12.096933
97c061a7-d8e3-42bf-806a-4e3666cd767e	3de11e62-2e5a-4783-9add-e353ee5008d8	Main Branch	t	\N	2025-08-12 10:25:28.865923	active	2025-08-12 10:25:28.865923
c360a8ef-9334-4da9-b286-53546bef71cb	271180e5-8f75-469d-b1b3-511161754787	Main Branch	t	\N	2025-08-12 11:42:30.284001	active	2025-08-12 11:42:30.284001
ee401f21-708e-4405-928a-2a8ca02e0eae	271180e5-8f75-469d-b1b3-511161754787	kawo Bustop branch	f	\N	2025-08-12 11:48:52.326601	active	2025-08-12 11:48:52.326601
\.


--
-- Data for Name: features; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.features (id, key, name, description, created_at, category, is_active, price, type, updated_at, pricing_type, is_core, deleted_at, requires_date_range) FROM stdin;
f77dd9f1-2bf3-4c06-901d-2f2af5b2e458	fee_management	Fee Management	Manage school fees, payments, and financial records	2025-08-11 13:04:00.902433	finance	t	0	{"both": false, "module": false, "standalone": false}	2025-08-11 13:04:00.902433	per_semester	f	\N	f
f44af874-d6b5-4467-b5b4-a866e0162a9b	communication	Communication Tools	Parent-teacher communication and notifications	2025-08-11 13:04:00.902433	communication	t	0	{"both": false, "module": false, "standalone": false}	2025-08-11 13:04:00.902433	free	f	\N	f
f8fbddb7-d515-423f-a4cc-2b7540a8b42f	report_generation	Report Generation	Generate academic and administrative reports	2025-08-11 13:04:00.902433	reporting	t	0	{"both": false, "module": false, "standalone": false}	2025-08-11 13:04:00.902433	per_school	f	\N	f
6eb8c3ba-d347-44eb-935e-7a0b70125492	timetable_management	Timetable Management	Create and manage class schedules and timetables	2025-08-11 13:04:00.902433	academics	t	0	{"both": false, "module": false, "standalone": false}	2025-08-11 13:04:00.902433	per_month	f	\N	f
95fb6524-4f36-4a86-ab5c-81ff12be588c	student_management	Student Management	Manage student enrollment, profiles, and academic records	2025-08-11 13:04:00.902433	academics	t	0	{"both": false, "module": false, "standalone": false}	2025-08-11 13:04:00.902433	per_school	t	\N	f
3d5f659f-8638-4a4d-a801-605b503d2160	teacher_management	Teacher Management	Manage teacher profiles, assignments, and schedules	2025-08-11 13:04:00.902433	administration	t	0	{"both": false, "module": false, "standalone": false}	2025-08-11 13:04:00.902433	per_staff	t	\N	f
c825fc76-5e06-420c-9a9c-3af36d894d34	attendance_tracking	Attendance Tracking	Track student and staff attendance	2025-08-11 13:04:00.902433	academics	t	0	{"both": false, "module": false, "standalone": false}	2025-08-11 13:04:00.902433	per_student	f	\N	f
2521ee96-814d-47cb-8993-02302d9407c1	grade_management	Grade Management	Manage student grades and academic performance	2025-08-11 13:04:00.902433	academics	t	0	{"both": false, "module": false, "standalone": false}	2025-08-11 13:04:00.902433	per_term	f	\N	f
356362e9-66c4-4736-8a72-44a756edd822	school_setup	School Setup	For managing school setup like classes and more 	2025-08-12 10:37:57.64907	ADMINISTRATION	t	\N	{"both": false, "module": true, "standalone": false}	2025-08-12 10:37:57.64907	\N	f	\N	f
\.


--
-- Data for Name: grade_sections; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.grade_sections (id, school_id, name, code, "order", created_at, section_id, type, is_active, updated_at) FROM stdin;
a5c8308b-c198-4c73-b6ac-67ff11abcfa7	8239732f-f976-4721-901d-57bb553fc6d6	Pre-K	cis_PRE-K	1	2025-08-11 12:53:28.862437	\N	\N	t	2025-08-11 14:16:15.721051
9ca16845-9b34-49e1-9ded-7b741f9116c2	8239732f-f976-4721-901d-57bb553fc6d6	Kindergarten	cis_KINDERGARTEN	2	2025-08-11 12:53:28.862437	\N	\N	t	2025-08-11 14:16:15.721051
891a565b-4531-46d4-b603-fcc2a2a0659c	8239732f-f976-4721-901d-57bb553fc6d6	Grade 1	cis_GRADE_1	3	2025-08-11 12:53:28.862437	\N	\N	t	2025-08-11 14:16:15.721051
62fae96a-9319-4765-a647-a823cf5826f7	8239732f-f976-4721-901d-57bb553fc6d6	Grade 2	cis_GRADE_2	4	2025-08-11 12:53:28.862437	\N	\N	t	2025-08-11 14:16:15.721051
a4a3648d-fa1e-48ac-90f4-4fc273565c48	8239732f-f976-4721-901d-57bb553fc6d6	Grade 3	cis_GRADE_3	5	2025-08-11 12:53:28.862437	\N	\N	t	2025-08-11 14:16:15.721051
77a32c4a-4016-432a-aa2d-bac13c2cc125	8239732f-f976-4721-901d-57bb553fc6d6	Grade 4	cis_GRADE_4	6	2025-08-11 12:53:28.862437	\N	\N	t	2025-08-11 14:16:15.721051
69e74ab8-238b-4569-9a9d-44f2a21aa714	8239732f-f976-4721-901d-57bb553fc6d6	Grade 5	cis_GRADE_5	7	2025-08-11 12:53:28.862437	\N	\N	t	2025-08-11 14:16:15.721051
c3a5d9d7-e892-4563-98d5-34b33f6893e0	8239732f-f976-4721-901d-57bb553fc6d6	Grade 6	cis_GRADE_6	8	2025-08-11 12:53:28.862437	\N	\N	t	2025-08-11 14:16:15.721051
fd8f0a11-620f-4d56-8eca-22561963532c	8239732f-f976-4721-901d-57bb553fc6d6	Grade 7	cis_GRADE_7	9	2025-08-11 12:53:28.862437	\N	\N	t	2025-08-11 14:16:15.721051
a3064fe6-5633-495d-abda-f2edfaa1dc00	8239732f-f976-4721-901d-57bb553fc6d6	Grade 8	cis_GRADE_8	10	2025-08-11 12:53:28.862437	\N	\N	t	2025-08-11 14:16:15.721051
27561934-e5c6-4ac8-a7f6-0dce407ab818	8239732f-f976-4721-901d-57bb553fc6d6	Grade 9	cis_GRADE_9	11	2025-08-11 12:53:28.862437	\N	\N	t	2025-08-11 14:16:15.721051
b9ff26a6-e361-4d8b-9e4b-3f40fc0fa9fc	8239732f-f976-4721-901d-57bb553fc6d6	Grade 10	cis_GRADE_10	12	2025-08-11 12:53:28.862437	\N	\N	t	2025-08-11 14:16:15.721051
bb559485-5652-4fa9-bb8a-2b0586e91dad	8239732f-f976-4721-901d-57bb553fc6d6	Grade 11	cis_GRADE_11	13	2025-08-11 12:53:28.862437	\N	\N	t	2025-08-11 14:16:15.721051
dda49a55-5434-492b-955e-757b408c28c8	8239732f-f976-4721-901d-57bb553fc6d6	Grade 12	cis_GRADE_12	14	2025-08-11 12:53:28.862437	\N	\N	t	2025-08-11 14:16:15.721051
f5fea4fb-63b2-47bb-a050-a9f47f1be5f9	19b8794a-88a8-4026-b070-4aef40a813a9	Nursery 1	saghggh_NURSERY_1	1	2025-08-12 09:22:06.812165	\N	\N	t	2025-08-12 09:22:06.812165
c32feb50-2067-4c9b-b0fc-337c6b99fe1b	19b8794a-88a8-4026-b070-4aef40a813a9	Nursery 2	saghggh_NURSERY_2	2	2025-08-12 09:22:06.812165	\N	\N	t	2025-08-12 09:22:06.812165
7ac1259e-dbe5-4c31-b1a7-e1029eddf328	19b8794a-88a8-4026-b070-4aef40a813a9	JSS 1	saghggh_JSS_1	3	2025-08-12 09:22:06.812165	\N	\N	t	2025-08-12 09:22:06.812165
6a590b31-ac22-4055-a3c8-820869479b75	19b8794a-88a8-4026-b070-4aef40a813a9	JSS 2	saghggh_JSS_2	4	2025-08-12 09:22:06.812165	\N	\N	t	2025-08-12 09:22:06.812165
348423ec-0a31-4767-8a2a-8e6661e9dc9d	19b8794a-88a8-4026-b070-4aef40a813a9	JSS 3	saghggh_JSS_3	5	2025-08-12 09:22:06.812165	\N	\N	t	2025-08-12 09:22:06.812165
81dacda2-d562-42b3-8c2d-6c1b93986f54	19b8794a-88a8-4026-b070-4aef40a813a9	SSS 1	saghggh_SSS_1	6	2025-08-12 09:22:06.812165	\N	\N	t	2025-08-12 09:22:06.812165
a9765640-9163-466f-9b23-9833362c453b	19b8794a-88a8-4026-b070-4aef40a813a9	SSS 2	saghggh_SSS_2	7	2025-08-12 09:22:06.812165	\N	\N	t	2025-08-12 09:22:06.812165
77b15c86-1c2e-4dba-ba2c-e9333bc5260a	19b8794a-88a8-4026-b070-4aef40a813a9	SSS 3	saghggh_SSS_3	8	2025-08-12 09:22:06.812165	\N	\N	t	2025-08-12 09:22:06.812165
a45209d4-b831-4b8a-9717-369bbf6f2df8	19b8794a-88a8-4026-b070-4aef40a813a9	Primary 1	saghggh_PRIMARY_1	9	2025-08-12 09:22:06.812165	\N	\N	t	2025-08-12 09:22:06.812165
d8525825-333d-4af2-92da-21081d6d7803	19b8794a-88a8-4026-b070-4aef40a813a9	Primary 2	saghggh_PRIMARY_2	10	2025-08-12 09:22:06.812165	\N	\N	t	2025-08-12 09:22:06.812165
71624574-cac9-43c9-8083-3811b70e636f	19b8794a-88a8-4026-b070-4aef40a813a9	Primary 3	saghggh_PRIMARY_3	11	2025-08-12 09:22:06.812165	\N	\N	t	2025-08-12 09:22:06.812165
d5d8f15b-c10a-4b31-bfe0-eee5ca1df7d1	19b8794a-88a8-4026-b070-4aef40a813a9	Primary 4	saghggh_PRIMARY_4	12	2025-08-12 09:22:06.812165	\N	\N	t	2025-08-12 09:22:06.812165
62c89661-7f93-4300-9b50-5e2434399b8d	19b8794a-88a8-4026-b070-4aef40a813a9	Primary 5	saghggh_PRIMARY_5	13	2025-08-12 09:22:06.812165	\N	\N	t	2025-08-12 09:22:06.812165
e8cea266-3b36-43fe-8dc3-36d6e6f6f873	19b8794a-88a8-4026-b070-4aef40a813a9	Primary 6	saghggh_PRIMARY_6	14	2025-08-12 09:22:06.812165	\N	\N	t	2025-08-12 09:22:06.812165
f14d74da-6582-4982-88e6-9d2a90fb11ff	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Nursery 1 A	N1A	10	2025-08-12 10:24:37.93367	bf32587f-3638-4161-87a9-d312e7e37674	nursery	t	2025-08-12 10:24:37.93367
a066fbc0-320f-48b1-bf83-92b4b4369225	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Nursery 1 B	N1B	11	2025-08-12 10:24:37.93367	b63f8c81-3a20-4716-9097-89f9830126d3	nursery	t	2025-08-12 10:24:37.93367
e32b50c1-c28d-426c-b059-a0c0ff279b8e	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Nursery 1 C	N1C	12	2025-08-12 10:24:37.93367	0ad6b898-70aa-42ca-9f4f-29ec31eed9f1	nursery	t	2025-08-12 10:24:37.93367
9ae84d54-cd67-4b48-9900-b6d51087e5ec	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Nursery 2 A	N2A	20	2025-08-12 10:24:37.93367	bf32587f-3638-4161-87a9-d312e7e37674	nursery	t	2025-08-12 10:24:37.93367
c56427e3-45f1-4a0b-b88a-126906d7aa8a	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Nursery 2 B	N2B	21	2025-08-12 10:24:37.93367	b63f8c81-3a20-4716-9097-89f9830126d3	nursery	t	2025-08-12 10:24:37.93367
4ef48ae3-ca9d-4640-9ce0-aecd50734d02	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Nursery 2 C	N2C	22	2025-08-12 10:24:37.93367	0ad6b898-70aa-42ca-9f4f-29ec31eed9f1	nursery	t	2025-08-12 10:24:37.93367
2115d4d8-9c8c-41e1-9ba1-f3768f54da35	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Pre-K A	PKA	30	2025-08-12 10:24:37.93367	bf32587f-3638-4161-87a9-d312e7e37674	nursery	t	2025-08-12 10:24:37.93367
0e31d682-d95b-4bc4-9aef-0bf76f4c27bb	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Pre-K B	PKB	31	2025-08-12 10:24:37.93367	b63f8c81-3a20-4716-9097-89f9830126d3	nursery	t	2025-08-12 10:24:37.93367
22947401-ae00-4d36-86c8-85808f59bb53	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Pre-K C	PKC	32	2025-08-12 10:24:37.93367	0ad6b898-70aa-42ca-9f4f-29ec31eed9f1	nursery	t	2025-08-12 10:24:37.93367
735c6019-630e-4266-8aac-ec7912fd1f71	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 1 A	G1A	40	2025-08-12 10:24:37.93367	bf32587f-3638-4161-87a9-d312e7e37674	primary	t	2025-08-12 10:24:37.93367
ee49dca1-a9b3-4f10-9de3-41ac02c9ad8b	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 1 B	G1B	41	2025-08-12 10:24:37.93367	b63f8c81-3a20-4716-9097-89f9830126d3	primary	t	2025-08-12 10:24:37.93367
279edcc6-b87c-4493-9781-71191f988c78	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 1 C	G1C	42	2025-08-12 10:24:37.93367	0ad6b898-70aa-42ca-9f4f-29ec31eed9f1	primary	t	2025-08-12 10:24:37.93367
fc2ad64c-416d-4876-b5b2-73f75c5a127d	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 2 A	G2A	50	2025-08-12 10:24:37.93367	bf32587f-3638-4161-87a9-d312e7e37674	primary	t	2025-08-12 10:24:37.93367
e0d8c2fe-88df-4e63-b8ec-0c897aa8e2f4	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 2 B	G2B	51	2025-08-12 10:24:37.93367	b63f8c81-3a20-4716-9097-89f9830126d3	primary	t	2025-08-12 10:24:37.93367
90274aaa-30b0-4431-9626-c5d8a587ce1c	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 2 C	G2C	52	2025-08-12 10:24:37.93367	0ad6b898-70aa-42ca-9f4f-29ec31eed9f1	primary	t	2025-08-12 10:24:37.93367
5555a965-2ecd-4d5a-b7dc-a35959520cd4	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 3 A	G3A	60	2025-08-12 10:24:37.93367	bf32587f-3638-4161-87a9-d312e7e37674	primary	t	2025-08-12 10:24:37.93367
96fbc0fc-5b65-48f8-8892-f06d019dd5ad	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 3 B	G3B	61	2025-08-12 10:24:37.93367	b63f8c81-3a20-4716-9097-89f9830126d3	primary	t	2025-08-12 10:24:37.93367
8fd9fbcf-b7c0-41ea-9fb2-2b37612edf6c	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 3 C	G3C	62	2025-08-12 10:24:37.93367	0ad6b898-70aa-42ca-9f4f-29ec31eed9f1	primary	t	2025-08-12 10:24:37.93367
ceeb9054-d0ea-4087-8d79-6482ccf4532d	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 4 A	G4A	70	2025-08-12 10:24:37.93367	bf32587f-3638-4161-87a9-d312e7e37674	primary	t	2025-08-12 10:24:37.93367
8de79421-eec9-4b41-80b6-a2f472a76319	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 4 B	G4B	71	2025-08-12 10:24:37.93367	b63f8c81-3a20-4716-9097-89f9830126d3	primary	t	2025-08-12 10:24:37.93367
c9dd2761-9052-4845-bc4f-18da0013aef7	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 4 C	G4C	72	2025-08-12 10:24:37.93367	0ad6b898-70aa-42ca-9f4f-29ec31eed9f1	primary	t	2025-08-12 10:24:37.93367
d5e994a4-eab4-4ad1-81f0-510e84f34aa4	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 5 A	G5A	80	2025-08-12 10:24:37.93367	bf32587f-3638-4161-87a9-d312e7e37674	primary	t	2025-08-12 10:24:37.93367
1f777d68-5cec-4ce5-9352-51437a1fa108	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 5 B	G5B	81	2025-08-12 10:24:37.93367	b63f8c81-3a20-4716-9097-89f9830126d3	primary	t	2025-08-12 10:24:37.93367
f10e954b-5856-4520-88f0-d7c2e7a28ac1	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 5 C	G5C	82	2025-08-12 10:24:37.93367	0ad6b898-70aa-42ca-9f4f-29ec31eed9f1	primary	t	2025-08-12 10:24:37.93367
67d40356-2652-46a1-8888-4ce8a5660425	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 6 A	G6A	90	2025-08-12 10:24:37.93367	bf32587f-3638-4161-87a9-d312e7e37674	primary	t	2025-08-12 10:24:37.93367
ff8983cc-468d-467d-9668-f8a2fed4774d	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 6 B	G6B	91	2025-08-12 10:24:37.93367	b63f8c81-3a20-4716-9097-89f9830126d3	primary	t	2025-08-12 10:24:37.93367
8fae0b29-601b-4ade-8dfc-d90bbc69a1d2	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 6 C	G6C	92	2025-08-12 10:24:37.93367	0ad6b898-70aa-42ca-9f4f-29ec31eed9f1	primary	t	2025-08-12 10:24:37.93367
fcb612ec-b41c-4c55-a51d-a937db835b4a	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 7 A	G7A	100	2025-08-12 10:24:37.93367	bf32587f-3638-4161-87a9-d312e7e37674	junior	t	2025-08-12 10:24:37.93367
6274962c-62bc-4e2e-b6e4-c5936784278e	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 7 B	G7B	101	2025-08-12 10:24:37.93367	b63f8c81-3a20-4716-9097-89f9830126d3	junior	t	2025-08-12 10:24:37.93367
3bf97329-7d08-4f08-ab4e-565cd396db93	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 7 C	G7C	102	2025-08-12 10:24:37.93367	0ad6b898-70aa-42ca-9f4f-29ec31eed9f1	junior	t	2025-08-12 10:24:37.93367
a2cfb40f-95d3-482b-a0b2-38f966c79aa8	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 8 A	G8A	110	2025-08-12 10:24:37.93367	bf32587f-3638-4161-87a9-d312e7e37674	junior	t	2025-08-12 10:24:37.93367
2d79455a-ed43-4ed7-b294-1988dca4eeda	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 8 B	G8B	111	2025-08-12 10:24:37.93367	b63f8c81-3a20-4716-9097-89f9830126d3	junior	t	2025-08-12 10:24:37.93367
924e72d2-60eb-4d71-95e5-80984b5d9856	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 8 C	G8C	112	2025-08-12 10:24:37.93367	0ad6b898-70aa-42ca-9f4f-29ec31eed9f1	junior	t	2025-08-12 10:24:37.93367
37427500-374f-4dd2-a6b2-1b6619cec633	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 9 A	G9A	120	2025-08-12 10:24:37.93367	bf32587f-3638-4161-87a9-d312e7e37674	junior	t	2025-08-12 10:24:37.93367
4af1420a-e2ab-48e3-bccc-b2d833f2a9fa	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 9 B	G9B	121	2025-08-12 10:24:37.93367	b63f8c81-3a20-4716-9097-89f9830126d3	junior	t	2025-08-12 10:24:37.93367
d1983994-a57a-4035-b3da-5c0a4a463673	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 9 C	G9C	122	2025-08-12 10:24:37.93367	0ad6b898-70aa-42ca-9f4f-29ec31eed9f1	junior	t	2025-08-12 10:24:37.93367
b17f2495-66dc-40ea-acab-91f38bb2feab	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 10 A	G10A	130	2025-08-12 10:24:37.93367	bf32587f-3638-4161-87a9-d312e7e37674	senior	t	2025-08-12 10:24:37.93367
2aa6f8ea-c8e4-4948-92ce-cc1cf9031a47	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 10 B	G10B	131	2025-08-12 10:24:37.93367	b63f8c81-3a20-4716-9097-89f9830126d3	senior	t	2025-08-12 10:24:37.93367
bc81f4be-1533-4274-ba35-830f327f11d8	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 10 C	G10C	132	2025-08-12 10:24:37.93367	0ad6b898-70aa-42ca-9f4f-29ec31eed9f1	senior	t	2025-08-12 10:24:37.93367
45693c10-5435-4a43-87ed-f5acc159618d	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 11 A	G11A	140	2025-08-12 10:24:37.93367	bf32587f-3638-4161-87a9-d312e7e37674	senior	t	2025-08-12 10:24:37.93367
b439240e-bf15-4d0e-a4ab-c0697248c42e	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 11 B	G11B	141	2025-08-12 10:24:37.93367	b63f8c81-3a20-4716-9097-89f9830126d3	senior	t	2025-08-12 10:24:37.93367
26783983-ef08-4336-b53c-b18a13b5d88e	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 11 C	G11C	142	2025-08-12 10:24:37.93367	0ad6b898-70aa-42ca-9f4f-29ec31eed9f1	senior	t	2025-08-12 10:24:37.93367
c2fbeefd-46d8-4dec-9e3e-df2fbd2ab7ad	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 12 A	G12A	150	2025-08-12 10:24:37.93367	bf32587f-3638-4161-87a9-d312e7e37674	senior	t	2025-08-12 10:24:37.93367
9ef18e93-6542-4379-87a1-f2b81c2de0d8	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 12 B	G12B	151	2025-08-12 10:24:37.93367	b63f8c81-3a20-4716-9097-89f9830126d3	senior	t	2025-08-12 10:24:37.93367
eb8a0580-41b8-4472-989b-dde4d6515b35	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 12 C	G12C	152	2025-08-12 10:24:37.93367	0ad6b898-70aa-42ca-9f4f-29ec31eed9f1	senior	t	2025-08-12 10:24:37.93367
22ddaa91-fa4f-41ed-922f-fd8381d0ba4e	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Pre-K	enhanced-sections-test_PRE-K	1	2025-08-12 10:24:38.021302	\N	\N	t	2025-08-12 10:24:38.021302
a3824c01-4f3e-493a-9931-79830fb5555a	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Kindergarten	enhanced-sections-test_KINDERGARTEN	2	2025-08-12 10:24:38.021302	\N	\N	t	2025-08-12 10:24:38.021302
95ab022e-88c2-4559-87fa-62145a0695ed	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 1	enhanced-sections-test_GRADE_1	3	2025-08-12 10:24:38.021302	\N	\N	t	2025-08-12 10:24:38.021302
95f35a2e-a9f1-4d96-8f6f-3aa5e0c64335	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 2	enhanced-sections-test_GRADE_2	4	2025-08-12 10:24:38.021302	\N	\N	t	2025-08-12 10:24:38.021302
7db7fd8f-da4c-4642-a20b-6d09b0d4e97e	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 3	enhanced-sections-test_GRADE_3	5	2025-08-12 10:24:38.021302	\N	\N	t	2025-08-12 10:24:38.021302
13f66461-c6b8-4a79-8c1d-907fb669d52c	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 4	enhanced-sections-test_GRADE_4	6	2025-08-12 10:24:38.021302	\N	\N	t	2025-08-12 10:24:38.021302
f63505a4-4162-4633-ac8b-6baf3b345f85	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 5	enhanced-sections-test_GRADE_5	7	2025-08-12 10:24:38.021302	\N	\N	t	2025-08-12 10:24:38.021302
63b3dd5b-6bf4-422f-9a93-43f385609361	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 6	enhanced-sections-test_GRADE_6	8	2025-08-12 10:24:38.021302	\N	\N	t	2025-08-12 10:24:38.021302
03655e5d-df0a-4aa9-9761-6602d059ad7a	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 7	enhanced-sections-test_GRADE_7	9	2025-08-12 10:24:38.021302	\N	\N	t	2025-08-12 10:24:38.021302
3577834f-764b-46ed-a5fc-4058ccc2e9c0	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 8	enhanced-sections-test_GRADE_8	10	2025-08-12 10:24:38.021302	\N	\N	t	2025-08-12 10:24:38.021302
adfb84d3-448e-4bf6-b231-ecec50c35712	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 9	enhanced-sections-test_GRADE_9	11	2025-08-12 10:24:38.021302	\N	\N	t	2025-08-12 10:24:38.021302
47356194-9c25-4d95-83f1-4d64a34452ab	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 10	enhanced-sections-test_GRADE_10	12	2025-08-12 10:24:38.021302	\N	\N	t	2025-08-12 10:24:38.021302
b524a294-cbd0-43da-a9e3-72fdee322b7f	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 11	enhanced-sections-test_GRADE_11	13	2025-08-12 10:24:38.021302	\N	\N	t	2025-08-12 10:24:38.021302
2b9bbfaa-1742-47c3-9baf-fcfd07de27c8	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Grade 12	enhanced-sections-test_GRADE_12	14	2025-08-12 10:24:38.021302	\N	\N	t	2025-08-12 10:24:38.021302
bf642295-6a21-411e-a061-bf27357c7913	687c1127-a477-484d-8bda-c1d99aad91a2	Nursery 1 A	NUR1A	10	2025-08-12 10:25:12.070832	eb9c4daf-8680-4818-90a1-29ec8db228a4	nursery	t	2025-08-12 10:25:12.070832
f0847e23-ea44-46c1-abb6-7cc4c1aa8dbd	687c1127-a477-484d-8bda-c1d99aad91a2	Nursery 1 B	NUR1B	11	2025-08-12 10:25:12.070832	cfe314c9-f169-4828-9aab-c8d23e421331	nursery	t	2025-08-12 10:25:12.070832
f22d5e9e-3f15-44fc-9dc8-af920de6aae4	687c1127-a477-484d-8bda-c1d99aad91a2	Nursery 1 C	NUR1C	12	2025-08-12 10:25:12.070832	434100c4-2a71-45f8-8936-d35ded8cbde6	nursery	t	2025-08-12 10:25:12.070832
e61c0683-bb22-4d76-a9df-86441dc80fec	687c1127-a477-484d-8bda-c1d99aad91a2	Nursery 2 A	NUR2A	20	2025-08-12 10:25:12.070832	eb9c4daf-8680-4818-90a1-29ec8db228a4	nursery	t	2025-08-12 10:25:12.070832
e017ad12-3f22-4779-a471-be789dd77969	687c1127-a477-484d-8bda-c1d99aad91a2	Nursery 2 B	NUR2B	21	2025-08-12 10:25:12.070832	cfe314c9-f169-4828-9aab-c8d23e421331	nursery	t	2025-08-12 10:25:12.070832
055ec643-0ae6-493d-8b3d-9e563574e98d	687c1127-a477-484d-8bda-c1d99aad91a2	Nursery 2 C	NUR2C	22	2025-08-12 10:25:12.070832	434100c4-2a71-45f8-8936-d35ded8cbde6	nursery	t	2025-08-12 10:25:12.070832
c6da78f1-8f6b-4f5b-ac9e-aaa1bf867928	687c1127-a477-484d-8bda-c1d99aad91a2	Primary 1 A	PRI1A	30	2025-08-12 10:25:12.070832	eb9c4daf-8680-4818-90a1-29ec8db228a4	primary	t	2025-08-12 10:25:12.070832
b124ecaa-dd48-4a74-ac3d-fb24337735c1	687c1127-a477-484d-8bda-c1d99aad91a2	Primary 1 B	PRI1B	31	2025-08-12 10:25:12.070832	cfe314c9-f169-4828-9aab-c8d23e421331	primary	t	2025-08-12 10:25:12.070832
1628477a-9687-490f-bec6-71f5306e3954	687c1127-a477-484d-8bda-c1d99aad91a2	Primary 1 C	PRI1C	32	2025-08-12 10:25:12.070832	434100c4-2a71-45f8-8936-d35ded8cbde6	primary	t	2025-08-12 10:25:12.070832
b9f782fe-b682-4517-8caa-636cefde096a	687c1127-a477-484d-8bda-c1d99aad91a2	Primary 2 A	PRI2A	40	2025-08-12 10:25:12.070832	eb9c4daf-8680-4818-90a1-29ec8db228a4	primary	t	2025-08-12 10:25:12.070832
6af3e9c9-b0c2-470a-98be-c116a68d7da5	687c1127-a477-484d-8bda-c1d99aad91a2	Primary 2 B	PRI2B	41	2025-08-12 10:25:12.070832	cfe314c9-f169-4828-9aab-c8d23e421331	primary	t	2025-08-12 10:25:12.070832
de67f3db-17b7-4c21-95d6-305bf0130bd9	687c1127-a477-484d-8bda-c1d99aad91a2	Primary 2 C	PRI2C	42	2025-08-12 10:25:12.070832	434100c4-2a71-45f8-8936-d35ded8cbde6	primary	t	2025-08-12 10:25:12.070832
63cb2a2c-5572-478a-aad3-3cc5931e62fb	687c1127-a477-484d-8bda-c1d99aad91a2	Primary 3 A	PRI3A	50	2025-08-12 10:25:12.070832	eb9c4daf-8680-4818-90a1-29ec8db228a4	primary	t	2025-08-12 10:25:12.070832
09064395-b404-49e2-8581-575de15491cf	687c1127-a477-484d-8bda-c1d99aad91a2	Primary 3 B	PRI3B	51	2025-08-12 10:25:12.070832	cfe314c9-f169-4828-9aab-c8d23e421331	primary	t	2025-08-12 10:25:12.070832
d1a68fbc-ec1a-4f57-a50c-446e09084513	687c1127-a477-484d-8bda-c1d99aad91a2	Primary 3 C	PRI3C	52	2025-08-12 10:25:12.070832	434100c4-2a71-45f8-8936-d35ded8cbde6	primary	t	2025-08-12 10:25:12.070832
3381a59e-7c80-4d83-b3ef-5e58a44486ca	687c1127-a477-484d-8bda-c1d99aad91a2	Primary 4 A	PRI4A	60	2025-08-12 10:25:12.070832	eb9c4daf-8680-4818-90a1-29ec8db228a4	primary	t	2025-08-12 10:25:12.070832
469a69b0-b18d-43f7-b0ad-53d0cb3d9a11	687c1127-a477-484d-8bda-c1d99aad91a2	Primary 4 B	PRI4B	61	2025-08-12 10:25:12.070832	cfe314c9-f169-4828-9aab-c8d23e421331	primary	t	2025-08-12 10:25:12.070832
964561ea-8fcc-4c31-b6a2-f0869a39acfb	687c1127-a477-484d-8bda-c1d99aad91a2	Primary 4 C	PRI4C	62	2025-08-12 10:25:12.070832	434100c4-2a71-45f8-8936-d35ded8cbde6	primary	t	2025-08-12 10:25:12.070832
b57cd63a-8824-4ebe-971b-6b98eab0686b	687c1127-a477-484d-8bda-c1d99aad91a2	Primary 5 A	PRI5A	70	2025-08-12 10:25:12.070832	eb9c4daf-8680-4818-90a1-29ec8db228a4	primary	t	2025-08-12 10:25:12.070832
4cfa780e-05ef-4593-9070-167c14cc7964	687c1127-a477-484d-8bda-c1d99aad91a2	Primary 5 B	PRI5B	71	2025-08-12 10:25:12.070832	cfe314c9-f169-4828-9aab-c8d23e421331	primary	t	2025-08-12 10:25:12.070832
f5fc119d-51fa-4926-aac9-69526408154d	687c1127-a477-484d-8bda-c1d99aad91a2	Primary 5 C	PRI5C	72	2025-08-12 10:25:12.070832	434100c4-2a71-45f8-8936-d35ded8cbde6	primary	t	2025-08-12 10:25:12.070832
df8c53b2-4fcb-41d5-b38a-0a4cb5acad31	687c1127-a477-484d-8bda-c1d99aad91a2	Primary 6 A	PRI6A	80	2025-08-12 10:25:12.070832	eb9c4daf-8680-4818-90a1-29ec8db228a4	primary	t	2025-08-12 10:25:12.070832
a0c5cea9-6739-44b5-b314-3b55888bcd36	687c1127-a477-484d-8bda-c1d99aad91a2	Primary 6 B	PRI6B	81	2025-08-12 10:25:12.070832	cfe314c9-f169-4828-9aab-c8d23e421331	primary	t	2025-08-12 10:25:12.070832
f5e748f0-80f1-4e98-96cc-539529b7d14d	687c1127-a477-484d-8bda-c1d99aad91a2	Primary 6 C	PRI6C	82	2025-08-12 10:25:12.070832	434100c4-2a71-45f8-8936-d35ded8cbde6	primary	t	2025-08-12 10:25:12.070832
43dca4cb-a072-48f4-ba70-d7c77bd854cf	687c1127-a477-484d-8bda-c1d99aad91a2	JSS 1 A	JSS1A	90	2025-08-12 10:25:12.070832	eb9c4daf-8680-4818-90a1-29ec8db228a4	junior	t	2025-08-12 10:25:12.070832
f6e24e9b-878d-4c0c-929a-f6395d593d0d	687c1127-a477-484d-8bda-c1d99aad91a2	JSS 1 B	JSS1B	91	2025-08-12 10:25:12.070832	cfe314c9-f169-4828-9aab-c8d23e421331	junior	t	2025-08-12 10:25:12.070832
dcb48419-95c8-4611-a9a8-f04319c41a53	687c1127-a477-484d-8bda-c1d99aad91a2	JSS 1 C	JSS1C	92	2025-08-12 10:25:12.070832	434100c4-2a71-45f8-8936-d35ded8cbde6	junior	t	2025-08-12 10:25:12.070832
044137cb-1801-406d-afe8-b8bbc05247b2	687c1127-a477-484d-8bda-c1d99aad91a2	JSS 2 A	JSS2A	100	2025-08-12 10:25:12.070832	eb9c4daf-8680-4818-90a1-29ec8db228a4	junior	t	2025-08-12 10:25:12.070832
a421e2e0-1bbc-4ec2-9b01-05bb9615cd3c	687c1127-a477-484d-8bda-c1d99aad91a2	JSS 2 B	JSS2B	101	2025-08-12 10:25:12.070832	cfe314c9-f169-4828-9aab-c8d23e421331	junior	t	2025-08-12 10:25:12.070832
4d5ca863-f8fc-4d2e-a0db-abb6f2827fc4	687c1127-a477-484d-8bda-c1d99aad91a2	JSS 2 C	JSS2C	102	2025-08-12 10:25:12.070832	434100c4-2a71-45f8-8936-d35ded8cbde6	junior	t	2025-08-12 10:25:12.070832
71a5bc4b-15fc-4c1e-be35-73b2d4ccefea	687c1127-a477-484d-8bda-c1d99aad91a2	JSS 3 A	JSS3A	110	2025-08-12 10:25:12.070832	eb9c4daf-8680-4818-90a1-29ec8db228a4	junior	t	2025-08-12 10:25:12.070832
e20ba25b-6e7e-4a7a-9ef2-e086e855532b	687c1127-a477-484d-8bda-c1d99aad91a2	JSS 3 B	JSS3B	111	2025-08-12 10:25:12.070832	cfe314c9-f169-4828-9aab-c8d23e421331	junior	t	2025-08-12 10:25:12.070832
05408b73-24e7-4a28-b26f-78aef6b2543c	687c1127-a477-484d-8bda-c1d99aad91a2	JSS 3 C	JSS3C	112	2025-08-12 10:25:12.070832	434100c4-2a71-45f8-8936-d35ded8cbde6	junior	t	2025-08-12 10:25:12.070832
553a051e-e777-4aab-9257-0d882175c1c8	687c1127-a477-484d-8bda-c1d99aad91a2	SSS 1 A	SSS1A	120	2025-08-12 10:25:12.070832	eb9c4daf-8680-4818-90a1-29ec8db228a4	senior	t	2025-08-12 10:25:12.070832
3bd344b3-b63a-440f-bcfc-d8b65a3e6cc1	687c1127-a477-484d-8bda-c1d99aad91a2	SSS 1 B	SSS1B	121	2025-08-12 10:25:12.070832	cfe314c9-f169-4828-9aab-c8d23e421331	senior	t	2025-08-12 10:25:12.070832
3d5285db-d037-45b7-9419-154910f3786c	687c1127-a477-484d-8bda-c1d99aad91a2	SSS 1 C	SSS1C	122	2025-08-12 10:25:12.070832	434100c4-2a71-45f8-8936-d35ded8cbde6	senior	t	2025-08-12 10:25:12.070832
9bc82df9-eea5-4063-87ea-5a76f2e82e57	687c1127-a477-484d-8bda-c1d99aad91a2	SSS 2 A	SSS2A	130	2025-08-12 10:25:12.070832	eb9c4daf-8680-4818-90a1-29ec8db228a4	senior	t	2025-08-12 10:25:12.070832
2b43aac1-f724-441d-a4df-2e7eead16700	687c1127-a477-484d-8bda-c1d99aad91a2	SSS 2 B	SSS2B	131	2025-08-12 10:25:12.070832	cfe314c9-f169-4828-9aab-c8d23e421331	senior	t	2025-08-12 10:25:12.070832
987bfbf9-3239-4acc-aaf7-2181cd8a7309	687c1127-a477-484d-8bda-c1d99aad91a2	SSS 2 C	SSS2C	132	2025-08-12 10:25:12.070832	434100c4-2a71-45f8-8936-d35ded8cbde6	senior	t	2025-08-12 10:25:12.070832
fb8640d2-b086-47e8-bc18-5a2a5a02bc1d	687c1127-a477-484d-8bda-c1d99aad91a2	SSS 3 A	SSS3A	140	2025-08-12 10:25:12.070832	eb9c4daf-8680-4818-90a1-29ec8db228a4	senior	t	2025-08-12 10:25:12.070832
ac902cc9-84dc-4f59-8160-0b1e4722918b	687c1127-a477-484d-8bda-c1d99aad91a2	SSS 3 B	SSS3B	141	2025-08-12 10:25:12.070832	cfe314c9-f169-4828-9aab-c8d23e421331	senior	t	2025-08-12 10:25:12.070832
3674b65f-0235-42fa-a92f-b80ade149017	687c1127-a477-484d-8bda-c1d99aad91a2	SSS 3 C	SSS3C	142	2025-08-12 10:25:12.070832	434100c4-2a71-45f8-8936-d35ded8cbde6	senior	t	2025-08-12 10:25:12.070832
4d2ca6f4-8e6a-4106-bee9-ee800b260e6f	687c1127-a477-484d-8bda-c1d99aad91a2	Nursery 1	final-enhanced-sections_NURSERY_1	1	2025-08-12 10:25:12.148248	\N	\N	t	2025-08-12 10:25:12.148248
ea509c33-2ad5-4828-82ab-dbe90b48de1e	687c1127-a477-484d-8bda-c1d99aad91a2	Nursery 2	final-enhanced-sections_NURSERY_2	2	2025-08-12 10:25:12.148248	\N	\N	t	2025-08-12 10:25:12.148248
8b5bbade-4f76-4d0c-86d4-6f8e8342c243	687c1127-a477-484d-8bda-c1d99aad91a2	Primary 1	final-enhanced-sections_PRIMARY_1	3	2025-08-12 10:25:12.148248	\N	\N	t	2025-08-12 10:25:12.148248
46871032-8813-42d8-b4d8-9723b50cc290	687c1127-a477-484d-8bda-c1d99aad91a2	Primary 2	final-enhanced-sections_PRIMARY_2	4	2025-08-12 10:25:12.148248	\N	\N	t	2025-08-12 10:25:12.148248
14aba52c-d26c-4742-b7a5-9e1dcb9a39f5	687c1127-a477-484d-8bda-c1d99aad91a2	Primary 3	final-enhanced-sections_PRIMARY_3	5	2025-08-12 10:25:12.148248	\N	\N	t	2025-08-12 10:25:12.148248
e3b05189-9b9e-4fc5-ad32-36532a515b92	687c1127-a477-484d-8bda-c1d99aad91a2	Primary 4	final-enhanced-sections_PRIMARY_4	6	2025-08-12 10:25:12.148248	\N	\N	t	2025-08-12 10:25:12.148248
997e9830-431b-490f-acf1-787e74082618	687c1127-a477-484d-8bda-c1d99aad91a2	Primary 5	final-enhanced-sections_PRIMARY_5	7	2025-08-12 10:25:12.148248	\N	\N	t	2025-08-12 10:25:12.148248
13a624c6-bfad-4d0f-8733-9d0e7f123191	687c1127-a477-484d-8bda-c1d99aad91a2	Primary 6	final-enhanced-sections_PRIMARY_6	8	2025-08-12 10:25:12.148248	\N	\N	t	2025-08-12 10:25:12.148248
cd32d38f-b14e-4adf-840f-2394c089a94c	687c1127-a477-484d-8bda-c1d99aad91a2	JSS 1	final-enhanced-sections_JSS_1	9	2025-08-12 10:25:12.148248	\N	\N	t	2025-08-12 10:25:12.148248
10d39cf5-80b4-4ff3-bb4f-961f92e0db9b	687c1127-a477-484d-8bda-c1d99aad91a2	JSS 2	final-enhanced-sections_JSS_2	10	2025-08-12 10:25:12.148248	\N	\N	t	2025-08-12 10:25:12.148248
305eb802-d527-4368-95f0-5282e26a4f5a	687c1127-a477-484d-8bda-c1d99aad91a2	JSS 3	final-enhanced-sections_JSS_3	11	2025-08-12 10:25:12.148248	\N	\N	t	2025-08-12 10:25:12.148248
73a0fd7b-ec3a-40ca-9f5b-689faae6f0f4	687c1127-a477-484d-8bda-c1d99aad91a2	SSS 1	final-enhanced-sections_SSS_1	12	2025-08-12 10:25:12.148248	\N	\N	t	2025-08-12 10:25:12.148248
cd83ab7c-a9e6-4720-8339-671c681e2f90	687c1127-a477-484d-8bda-c1d99aad91a2	SSS 2	final-enhanced-sections_SSS_2	13	2025-08-12 10:25:12.148248	\N	\N	t	2025-08-12 10:25:12.148248
4b10ee58-2098-4f7f-b0e9-02d02101e8ea	687c1127-a477-484d-8bda-c1d99aad91a2	SSS 3	final-enhanced-sections_SSS_3	14	2025-08-12 10:25:12.148248	\N	\N	t	2025-08-12 10:25:12.148248
6e6e9167-da80-4624-8626-c296eff2a217	3de11e62-2e5a-4783-9add-e353ee5008d8	Nursery 1 A	N1A	10	2025-08-12 10:25:28.836058	ae4b44a5-2e09-4701-8c3d-6a68a956bf08	nursery	t	2025-08-12 10:25:28.836058
c21dc30e-7ef9-4207-ab25-a9d64b072551	3de11e62-2e5a-4783-9add-e353ee5008d8	Nursery 1 B	N1B	11	2025-08-12 10:25:28.836058	45fde40e-3b3e-492f-8624-3e5cda937707	nursery	t	2025-08-12 10:25:28.836058
49524080-297c-4352-88e5-60f5fa3a01c0	3de11e62-2e5a-4783-9add-e353ee5008d8	Nursery 1 C	N1C	12	2025-08-12 10:25:28.836058	601188d7-6d40-48f7-987c-9316d831c15d	nursery	t	2025-08-12 10:25:28.836058
aee98f8a-85d3-45ca-90f1-9dc02b9efe03	3de11e62-2e5a-4783-9add-e353ee5008d8	Nursery 2 A	N2A	20	2025-08-12 10:25:28.836058	ae4b44a5-2e09-4701-8c3d-6a68a956bf08	nursery	t	2025-08-12 10:25:28.836058
2006373c-af37-4bf8-a4cd-6cf68bbee5eb	3de11e62-2e5a-4783-9add-e353ee5008d8	Nursery 2 B	N2B	21	2025-08-12 10:25:28.836058	45fde40e-3b3e-492f-8624-3e5cda937707	nursery	t	2025-08-12 10:25:28.836058
17baf8e6-e4ba-440a-9440-e548e90ebd9d	3de11e62-2e5a-4783-9add-e353ee5008d8	Nursery 2 C	N2C	22	2025-08-12 10:25:28.836058	601188d7-6d40-48f7-987c-9316d831c15d	nursery	t	2025-08-12 10:25:28.836058
d151c95b-5d90-4d5e-a461-1f5121b3625a	3de11e62-2e5a-4783-9add-e353ee5008d8	Pre-K A	PKA	30	2025-08-12 10:25:28.836058	ae4b44a5-2e09-4701-8c3d-6a68a956bf08	nursery	t	2025-08-12 10:25:28.836058
c48d88bc-67a7-4729-8c07-584184d928c6	3de11e62-2e5a-4783-9add-e353ee5008d8	Pre-K B	PKB	31	2025-08-12 10:25:28.836058	45fde40e-3b3e-492f-8624-3e5cda937707	nursery	t	2025-08-12 10:25:28.836058
204d5cbb-7cd2-42ac-b1e9-7e74e8b5afa8	3de11e62-2e5a-4783-9add-e353ee5008d8	Pre-K C	PKC	32	2025-08-12 10:25:28.836058	601188d7-6d40-48f7-987c-9316d831c15d	nursery	t	2025-08-12 10:25:28.836058
b16ab870-9d5d-4084-b122-835c734c9208	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 1 A	G1A	40	2025-08-12 10:25:28.836058	ae4b44a5-2e09-4701-8c3d-6a68a956bf08	primary	t	2025-08-12 10:25:28.836058
495e5cac-ad9d-4a0a-8ded-f96599cdce6b	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 1 B	G1B	41	2025-08-12 10:25:28.836058	45fde40e-3b3e-492f-8624-3e5cda937707	primary	t	2025-08-12 10:25:28.836058
67cf5bc6-1e0c-4dea-aa6a-7e8eac1e307a	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 1 C	G1C	42	2025-08-12 10:25:28.836058	601188d7-6d40-48f7-987c-9316d831c15d	primary	t	2025-08-12 10:25:28.836058
55f77447-e4d8-442a-a287-ca6a0eb191aa	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 2 A	G2A	50	2025-08-12 10:25:28.836058	ae4b44a5-2e09-4701-8c3d-6a68a956bf08	primary	t	2025-08-12 10:25:28.836058
dc8f3188-8a19-476c-a1ed-c28c488d3fde	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 2 B	G2B	51	2025-08-12 10:25:28.836058	45fde40e-3b3e-492f-8624-3e5cda937707	primary	t	2025-08-12 10:25:28.836058
7a4bd3c2-28d2-4b6c-9147-3524ff24c562	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 2 C	G2C	52	2025-08-12 10:25:28.836058	601188d7-6d40-48f7-987c-9316d831c15d	primary	t	2025-08-12 10:25:28.836058
64fc047f-40bd-4205-a301-135673926490	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 3 A	G3A	60	2025-08-12 10:25:28.836058	ae4b44a5-2e09-4701-8c3d-6a68a956bf08	primary	t	2025-08-12 10:25:28.836058
62425a0c-be76-4517-8568-be5a9e1299aa	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 3 B	G3B	61	2025-08-12 10:25:28.836058	45fde40e-3b3e-492f-8624-3e5cda937707	primary	t	2025-08-12 10:25:28.836058
078c8fe7-e777-4b65-b942-47b04dde5c35	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 3 C	G3C	62	2025-08-12 10:25:28.836058	601188d7-6d40-48f7-987c-9316d831c15d	primary	t	2025-08-12 10:25:28.836058
a800d678-ccfd-4f5a-9b51-7dcd4f866fca	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 4 A	G4A	70	2025-08-12 10:25:28.836058	ae4b44a5-2e09-4701-8c3d-6a68a956bf08	primary	t	2025-08-12 10:25:28.836058
fb18094c-31dc-471b-8319-0f98ec7c5353	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 4 B	G4B	71	2025-08-12 10:25:28.836058	45fde40e-3b3e-492f-8624-3e5cda937707	primary	t	2025-08-12 10:25:28.836058
8ecca3bd-986f-4aee-a2cb-22129f1cd849	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 4 C	G4C	72	2025-08-12 10:25:28.836058	601188d7-6d40-48f7-987c-9316d831c15d	primary	t	2025-08-12 10:25:28.836058
99e97b70-c430-4c8e-a9be-096b6a7fd45d	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 5 A	G5A	80	2025-08-12 10:25:28.836058	ae4b44a5-2e09-4701-8c3d-6a68a956bf08	primary	t	2025-08-12 10:25:28.836058
e9922f87-75d4-4fd1-aa93-162cb81a95b2	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 5 B	G5B	81	2025-08-12 10:25:28.836058	45fde40e-3b3e-492f-8624-3e5cda937707	primary	t	2025-08-12 10:25:28.836058
4bb0b966-517e-4663-ab0a-053bfd70df7e	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 5 C	G5C	82	2025-08-12 10:25:28.836058	601188d7-6d40-48f7-987c-9316d831c15d	primary	t	2025-08-12 10:25:28.836058
9fd0247e-935d-4697-b560-5fab93b9a206	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 6 A	G6A	90	2025-08-12 10:25:28.836058	ae4b44a5-2e09-4701-8c3d-6a68a956bf08	primary	t	2025-08-12 10:25:28.836058
ee96569e-35e0-4457-8c38-476917095a92	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 6 B	G6B	91	2025-08-12 10:25:28.836058	45fde40e-3b3e-492f-8624-3e5cda937707	primary	t	2025-08-12 10:25:28.836058
67c53268-400d-4f47-b806-c29e32a1dfe8	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 6 C	G6C	92	2025-08-12 10:25:28.836058	601188d7-6d40-48f7-987c-9316d831c15d	primary	t	2025-08-12 10:25:28.836058
53a5388a-8856-4371-86d5-77a31f20095e	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 7 A	G7A	100	2025-08-12 10:25:28.836058	ae4b44a5-2e09-4701-8c3d-6a68a956bf08	junior	t	2025-08-12 10:25:28.836058
d0eb9a28-990d-4c57-a45c-5c7f0abc29cc	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 7 B	G7B	101	2025-08-12 10:25:28.836058	45fde40e-3b3e-492f-8624-3e5cda937707	junior	t	2025-08-12 10:25:28.836058
021cadf8-8cec-4d9d-9720-551bfb3db814	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 7 C	G7C	102	2025-08-12 10:25:28.836058	601188d7-6d40-48f7-987c-9316d831c15d	junior	t	2025-08-12 10:25:28.836058
a805c2c2-9b9e-4173-9392-315713a22128	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 8 A	G8A	110	2025-08-12 10:25:28.836058	ae4b44a5-2e09-4701-8c3d-6a68a956bf08	junior	t	2025-08-12 10:25:28.836058
e3fefb36-5a0a-4a69-9ecc-d101bda94439	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 8 B	G8B	111	2025-08-12 10:25:28.836058	45fde40e-3b3e-492f-8624-3e5cda937707	junior	t	2025-08-12 10:25:28.836058
82b224c6-0fd9-48c3-b72d-f2dc3ad392e9	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 8 C	G8C	112	2025-08-12 10:25:28.836058	601188d7-6d40-48f7-987c-9316d831c15d	junior	t	2025-08-12 10:25:28.836058
bd8514ed-191a-4e02-8a2d-07380c76d8fe	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 9 A	G9A	120	2025-08-12 10:25:28.836058	ae4b44a5-2e09-4701-8c3d-6a68a956bf08	junior	t	2025-08-12 10:25:28.836058
235ff4fc-53f3-44b0-b469-6011e136b58d	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 9 B	G9B	121	2025-08-12 10:25:28.836058	45fde40e-3b3e-492f-8624-3e5cda937707	junior	t	2025-08-12 10:25:28.836058
1900aec1-642b-4cd6-b2dd-333994408aca	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 9 C	G9C	122	2025-08-12 10:25:28.836058	601188d7-6d40-48f7-987c-9316d831c15d	junior	t	2025-08-12 10:25:28.836058
2a072a78-6392-4bb3-a859-eb447681bfc3	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 10 A	G10A	130	2025-08-12 10:25:28.836058	ae4b44a5-2e09-4701-8c3d-6a68a956bf08	senior	t	2025-08-12 10:25:28.836058
cdcb0ce7-3306-4774-a3d3-6c8905a2fd12	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 10 B	G10B	131	2025-08-12 10:25:28.836058	45fde40e-3b3e-492f-8624-3e5cda937707	senior	t	2025-08-12 10:25:28.836058
716d9a0c-911f-4ec4-b135-b75937fcb9d2	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 10 C	G10C	132	2025-08-12 10:25:28.836058	601188d7-6d40-48f7-987c-9316d831c15d	senior	t	2025-08-12 10:25:28.836058
ac947575-77bb-4345-b703-c728ffde65f1	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 11 A	G11A	140	2025-08-12 10:25:28.836058	ae4b44a5-2e09-4701-8c3d-6a68a956bf08	senior	t	2025-08-12 10:25:28.836058
273e51de-e1fc-4ec4-aaec-885099a56339	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 11 B	G11B	141	2025-08-12 10:25:28.836058	45fde40e-3b3e-492f-8624-3e5cda937707	senior	t	2025-08-12 10:25:28.836058
622c1ad0-bfa6-4e78-a878-d961d4714f46	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 11 C	G11C	142	2025-08-12 10:25:28.836058	601188d7-6d40-48f7-987c-9316d831c15d	senior	t	2025-08-12 10:25:28.836058
e427b9c5-d6ed-42d0-b416-64cbff9cadd6	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 12 A	G12A	150	2025-08-12 10:25:28.836058	ae4b44a5-2e09-4701-8c3d-6a68a956bf08	senior	t	2025-08-12 10:25:28.836058
e335d2f2-1381-401c-bda0-cf154831b950	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 12 B	G12B	151	2025-08-12 10:25:28.836058	45fde40e-3b3e-492f-8624-3e5cda937707	senior	t	2025-08-12 10:25:28.836058
394921a5-76d1-4f8a-9be4-25b3515faaf6	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 12 C	G12C	152	2025-08-12 10:25:28.836058	601188d7-6d40-48f7-987c-9316d831c15d	senior	t	2025-08-12 10:25:28.836058
81844a58-34ad-44a3-ad7c-a516f83581e6	3de11e62-2e5a-4783-9add-e353ee5008d8	Pre-K	complete-test_PRE-K	1	2025-08-12 10:25:28.917341	\N	\N	t	2025-08-12 10:25:28.917341
43798bcb-e6a3-4708-bdaa-36d7636c7a17	3de11e62-2e5a-4783-9add-e353ee5008d8	Kindergarten	complete-test_KINDERGARTEN	2	2025-08-12 10:25:28.917341	\N	\N	t	2025-08-12 10:25:28.917341
8c451a99-14ff-43c3-a5ec-0a5173d4d38c	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 1	complete-test_GRADE_1	3	2025-08-12 10:25:28.917341	\N	\N	t	2025-08-12 10:25:28.917341
d5994c84-8c1b-4d88-9102-b8590caefead	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 2	complete-test_GRADE_2	4	2025-08-12 10:25:28.917341	\N	\N	t	2025-08-12 10:25:28.917341
02f30882-1186-4f86-ab65-a40ea9f7ea19	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 3	complete-test_GRADE_3	5	2025-08-12 10:25:28.917341	\N	\N	t	2025-08-12 10:25:28.917341
26b29530-5db6-483a-819b-4d722e081ec3	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 4	complete-test_GRADE_4	6	2025-08-12 10:25:28.917341	\N	\N	t	2025-08-12 10:25:28.917341
9772864a-22d9-44ef-b698-7b88681dab81	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 5	complete-test_GRADE_5	7	2025-08-12 10:25:28.917341	\N	\N	t	2025-08-12 10:25:28.917341
12eda6d4-ac33-4919-95a0-a8993b316544	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 6	complete-test_GRADE_6	8	2025-08-12 10:25:28.917341	\N	\N	t	2025-08-12 10:25:28.917341
698f88bf-6d99-4b37-8c68-a48a1191d17f	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 7	complete-test_GRADE_7	9	2025-08-12 10:25:28.917341	\N	\N	t	2025-08-12 10:25:28.917341
b876ffd3-7c74-422a-8cd4-b73c8b478a6e	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 8	complete-test_GRADE_8	10	2025-08-12 10:25:28.917341	\N	\N	t	2025-08-12 10:25:28.917341
596ae4e0-84f8-4332-8128-a46e66d6413e	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 9	complete-test_GRADE_9	11	2025-08-12 10:25:28.917341	\N	\N	t	2025-08-12 10:25:28.917341
d3af5a94-0ec0-42f0-a6e0-5508f4b87c1a	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 10	complete-test_GRADE_10	12	2025-08-12 10:25:28.917341	\N	\N	t	2025-08-12 10:25:28.917341
8f4f1630-c434-4f64-9570-40df405f46a7	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 11	complete-test_GRADE_11	13	2025-08-12 10:25:28.917341	\N	\N	t	2025-08-12 10:25:28.917341
d181d0e6-0d38-40e8-ade2-87811d3ce13a	3de11e62-2e5a-4783-9add-e353ee5008d8	Grade 12	complete-test_GRADE_12	14	2025-08-12 10:25:28.917341	\N	\N	t	2025-08-12 10:25:28.917341
770a3db9-ff0a-4d3d-9531-5680a4db3c02	271180e5-8f75-469d-b1b3-511161754787	Nursery 1 A	N1A	10	2025-08-12 11:42:30.244034	657a86b0-aab4-4513-91ce-14b565e4114e	nursery	t	2025-08-12 11:42:30.244034
a352ceb9-2b2b-4aa7-b5e8-16babe4f62bd	271180e5-8f75-469d-b1b3-511161754787	Nursery 1 B	N1B	11	2025-08-12 11:42:30.244034	fff60acf-c6eb-4eaf-aa8a-39db8eb89a08	nursery	t	2025-08-12 11:42:30.244034
05f20a0f-6be7-4778-9ca7-ef4c28805497	271180e5-8f75-469d-b1b3-511161754787	Nursery 1 C	N1C	12	2025-08-12 11:42:30.244034	ed8d4d7f-db20-465f-9891-cfdddabc6121	nursery	t	2025-08-12 11:42:30.244034
1eb34112-2918-4c41-83b8-817fc8d35317	271180e5-8f75-469d-b1b3-511161754787	Nursery 2 A	N2A	20	2025-08-12 11:42:30.244034	657a86b0-aab4-4513-91ce-14b565e4114e	nursery	t	2025-08-12 11:42:30.244034
edb6fe98-81f9-45f0-add6-b31ce7242ce7	271180e5-8f75-469d-b1b3-511161754787	Nursery 2 B	N2B	21	2025-08-12 11:42:30.244034	fff60acf-c6eb-4eaf-aa8a-39db8eb89a08	nursery	t	2025-08-12 11:42:30.244034
0cfc2a86-dc7e-467f-9578-6355a1574f7c	271180e5-8f75-469d-b1b3-511161754787	Nursery 2 C	N2C	22	2025-08-12 11:42:30.244034	ed8d4d7f-db20-465f-9891-cfdddabc6121	nursery	t	2025-08-12 11:42:30.244034
710063c3-4cc4-4499-ac21-ea917b84d666	271180e5-8f75-469d-b1b3-511161754787	Pre-K A	PKA	30	2025-08-12 11:42:30.244034	657a86b0-aab4-4513-91ce-14b565e4114e	nursery	t	2025-08-12 11:42:30.244034
1a5b3566-93da-4f53-9796-5a082ae485ab	271180e5-8f75-469d-b1b3-511161754787	Pre-K B	PKB	31	2025-08-12 11:42:30.244034	fff60acf-c6eb-4eaf-aa8a-39db8eb89a08	nursery	t	2025-08-12 11:42:30.244034
5babb673-e09a-4367-afcb-f99256f909cd	271180e5-8f75-469d-b1b3-511161754787	Pre-K C	PKC	32	2025-08-12 11:42:30.244034	ed8d4d7f-db20-465f-9891-cfdddabc6121	nursery	t	2025-08-12 11:42:30.244034
cbd5f297-a2d8-4586-ab5a-4f7dbfad1e18	271180e5-8f75-469d-b1b3-511161754787	Grade 1 A	G1A	40	2025-08-12 11:42:30.244034	657a86b0-aab4-4513-91ce-14b565e4114e	primary	t	2025-08-12 11:42:30.244034
94b90afa-da82-4a0a-afe9-42655e4a443c	271180e5-8f75-469d-b1b3-511161754787	Grade 1 B	G1B	41	2025-08-12 11:42:30.244034	fff60acf-c6eb-4eaf-aa8a-39db8eb89a08	primary	t	2025-08-12 11:42:30.244034
4aa59a63-56db-4837-937e-ed243cdcda59	271180e5-8f75-469d-b1b3-511161754787	Grade 1 C	G1C	42	2025-08-12 11:42:30.244034	ed8d4d7f-db20-465f-9891-cfdddabc6121	primary	t	2025-08-12 11:42:30.244034
0862b4ce-e01d-42fa-8d6a-2c9622859b86	271180e5-8f75-469d-b1b3-511161754787	Grade 2 A	G2A	50	2025-08-12 11:42:30.244034	657a86b0-aab4-4513-91ce-14b565e4114e	primary	t	2025-08-12 11:42:30.244034
e3622f10-7c4f-4e67-90ce-0cb27f3cdd75	271180e5-8f75-469d-b1b3-511161754787	Grade 2 B	G2B	51	2025-08-12 11:42:30.244034	fff60acf-c6eb-4eaf-aa8a-39db8eb89a08	primary	t	2025-08-12 11:42:30.244034
0d934ed7-ce88-4aa4-8edc-fbb0144c72ef	271180e5-8f75-469d-b1b3-511161754787	Grade 2 C	G2C	52	2025-08-12 11:42:30.244034	ed8d4d7f-db20-465f-9891-cfdddabc6121	primary	t	2025-08-12 11:42:30.244034
a84f3dfd-39ff-408e-85b3-2287d58d9b39	271180e5-8f75-469d-b1b3-511161754787	Grade 3 A	G3A	60	2025-08-12 11:42:30.244034	657a86b0-aab4-4513-91ce-14b565e4114e	primary	t	2025-08-12 11:42:30.244034
392920fa-db8b-4439-b18b-ca56ec249cd4	271180e5-8f75-469d-b1b3-511161754787	Grade 3 B	G3B	61	2025-08-12 11:42:30.244034	fff60acf-c6eb-4eaf-aa8a-39db8eb89a08	primary	t	2025-08-12 11:42:30.244034
5c3ab8c3-afef-4d6f-ad4a-14df47631e51	271180e5-8f75-469d-b1b3-511161754787	Grade 3 C	G3C	62	2025-08-12 11:42:30.244034	ed8d4d7f-db20-465f-9891-cfdddabc6121	primary	t	2025-08-12 11:42:30.244034
62d10ccb-1f04-4fa8-a947-546ae0d90f41	271180e5-8f75-469d-b1b3-511161754787	Grade 4 A	G4A	70	2025-08-12 11:42:30.244034	657a86b0-aab4-4513-91ce-14b565e4114e	primary	t	2025-08-12 11:42:30.244034
bae520e5-4dc2-4234-86b9-a4322b54b06f	271180e5-8f75-469d-b1b3-511161754787	Grade 4 B	G4B	71	2025-08-12 11:42:30.244034	fff60acf-c6eb-4eaf-aa8a-39db8eb89a08	primary	t	2025-08-12 11:42:30.244034
e578b7e2-e10a-4b2a-9f4b-e3b3c8914db9	271180e5-8f75-469d-b1b3-511161754787	Grade 4 C	G4C	72	2025-08-12 11:42:30.244034	ed8d4d7f-db20-465f-9891-cfdddabc6121	primary	t	2025-08-12 11:42:30.244034
af4ad933-31c0-4f78-ac98-30fd73894e84	271180e5-8f75-469d-b1b3-511161754787	Grade 5 A	G5A	80	2025-08-12 11:42:30.244034	657a86b0-aab4-4513-91ce-14b565e4114e	primary	t	2025-08-12 11:42:30.244034
2a3f3d35-f362-4b70-b7a3-e30c43119a34	271180e5-8f75-469d-b1b3-511161754787	Grade 5 B	G5B	81	2025-08-12 11:42:30.244034	fff60acf-c6eb-4eaf-aa8a-39db8eb89a08	primary	t	2025-08-12 11:42:30.244034
bc6b0cd7-877b-4c29-bafb-4d4cc7183204	271180e5-8f75-469d-b1b3-511161754787	Grade 5 C	G5C	82	2025-08-12 11:42:30.244034	ed8d4d7f-db20-465f-9891-cfdddabc6121	primary	t	2025-08-12 11:42:30.244034
6061b51a-37e0-4d2d-a5a8-8d8de44b5757	271180e5-8f75-469d-b1b3-511161754787	Grade 6 A	G6A	90	2025-08-12 11:42:30.244034	657a86b0-aab4-4513-91ce-14b565e4114e	primary	t	2025-08-12 11:42:30.244034
c53ecf34-5832-45b7-973f-99b288b72a79	271180e5-8f75-469d-b1b3-511161754787	Grade 6 B	G6B	91	2025-08-12 11:42:30.244034	fff60acf-c6eb-4eaf-aa8a-39db8eb89a08	primary	t	2025-08-12 11:42:30.244034
f146f125-c1f8-4696-a530-bb905c40edbf	271180e5-8f75-469d-b1b3-511161754787	Grade 6 C	G6C	92	2025-08-12 11:42:30.244034	ed8d4d7f-db20-465f-9891-cfdddabc6121	primary	t	2025-08-12 11:42:30.244034
08a91f4f-dec7-4428-a0f0-d38d1820a912	271180e5-8f75-469d-b1b3-511161754787	Grade 7 A	G7A	100	2025-08-12 11:42:30.244034	657a86b0-aab4-4513-91ce-14b565e4114e	junior	t	2025-08-12 11:42:30.244034
b3e55120-cbf2-4c64-8e8a-0c3880dbab3c	271180e5-8f75-469d-b1b3-511161754787	Grade 7 B	G7B	101	2025-08-12 11:42:30.244034	fff60acf-c6eb-4eaf-aa8a-39db8eb89a08	junior	t	2025-08-12 11:42:30.244034
84cccf80-3c3b-476a-8100-f409a0a3e0d9	271180e5-8f75-469d-b1b3-511161754787	Grade 7 C	G7C	102	2025-08-12 11:42:30.244034	ed8d4d7f-db20-465f-9891-cfdddabc6121	junior	t	2025-08-12 11:42:30.244034
3f3a8221-8b2b-4f3f-88c9-345c91e669c1	271180e5-8f75-469d-b1b3-511161754787	Grade 8 A	G8A	110	2025-08-12 11:42:30.244034	657a86b0-aab4-4513-91ce-14b565e4114e	junior	t	2025-08-12 11:42:30.244034
1c719729-c478-404f-b6d9-f32c8d9bc2da	271180e5-8f75-469d-b1b3-511161754787	Grade 8 B	G8B	111	2025-08-12 11:42:30.244034	fff60acf-c6eb-4eaf-aa8a-39db8eb89a08	junior	t	2025-08-12 11:42:30.244034
4172923a-c0cd-4217-92a3-f02e48084d23	271180e5-8f75-469d-b1b3-511161754787	Grade 8 C	G8C	112	2025-08-12 11:42:30.244034	ed8d4d7f-db20-465f-9891-cfdddabc6121	junior	t	2025-08-12 11:42:30.244034
7925904d-6749-463e-8c04-9cf93dc7b93c	271180e5-8f75-469d-b1b3-511161754787	Grade 9 A	G9A	120	2025-08-12 11:42:30.244034	657a86b0-aab4-4513-91ce-14b565e4114e	junior	t	2025-08-12 11:42:30.244034
fa56bf1d-a685-4eb3-b04d-8b4befea59ec	271180e5-8f75-469d-b1b3-511161754787	Grade 9 B	G9B	121	2025-08-12 11:42:30.244034	fff60acf-c6eb-4eaf-aa8a-39db8eb89a08	junior	t	2025-08-12 11:42:30.244034
da48e698-c5e2-4ded-8112-5a8f436e9150	271180e5-8f75-469d-b1b3-511161754787	Grade 9 C	G9C	122	2025-08-12 11:42:30.244034	ed8d4d7f-db20-465f-9891-cfdddabc6121	junior	t	2025-08-12 11:42:30.244034
4440de95-522f-4bba-a874-2ded22ec0c82	271180e5-8f75-469d-b1b3-511161754787	Grade 10 A	G10A	130	2025-08-12 11:42:30.244034	657a86b0-aab4-4513-91ce-14b565e4114e	senior	t	2025-08-12 11:42:30.244034
402d06a2-881c-4e51-b553-6daf83d1aabb	271180e5-8f75-469d-b1b3-511161754787	Grade 10 B	G10B	131	2025-08-12 11:42:30.244034	fff60acf-c6eb-4eaf-aa8a-39db8eb89a08	senior	t	2025-08-12 11:42:30.244034
50a4901c-f13d-47ea-9265-91414130fbdf	271180e5-8f75-469d-b1b3-511161754787	Grade 10 C	G10C	132	2025-08-12 11:42:30.244034	ed8d4d7f-db20-465f-9891-cfdddabc6121	senior	t	2025-08-12 11:42:30.244034
8934f070-bb6a-4bf8-9d95-d754dc814820	271180e5-8f75-469d-b1b3-511161754787	Grade 11 A	G11A	140	2025-08-12 11:42:30.244034	657a86b0-aab4-4513-91ce-14b565e4114e	senior	t	2025-08-12 11:42:30.244034
aa80724d-3912-428d-9248-ff89138ae1c3	271180e5-8f75-469d-b1b3-511161754787	Grade 11 B	G11B	141	2025-08-12 11:42:30.244034	fff60acf-c6eb-4eaf-aa8a-39db8eb89a08	senior	t	2025-08-12 11:42:30.244034
b984ce8b-d35d-45ae-979c-3b304fd2f42a	271180e5-8f75-469d-b1b3-511161754787	Grade 11 C	G11C	142	2025-08-12 11:42:30.244034	ed8d4d7f-db20-465f-9891-cfdddabc6121	senior	t	2025-08-12 11:42:30.244034
137ccfe3-f8d7-4959-8c6c-add98b6aa7a1	271180e5-8f75-469d-b1b3-511161754787	Grade 12 A	G12A	150	2025-08-12 11:42:30.244034	657a86b0-aab4-4513-91ce-14b565e4114e	senior	t	2025-08-12 11:42:30.244034
cfecd6eb-9b00-4158-adb7-d7751508949e	271180e5-8f75-469d-b1b3-511161754787	Grade 12 B	G12B	151	2025-08-12 11:42:30.244034	fff60acf-c6eb-4eaf-aa8a-39db8eb89a08	senior	t	2025-08-12 11:42:30.244034
d99ae239-000c-4e54-aae2-7e26429fb668	271180e5-8f75-469d-b1b3-511161754787	Grade 12 C	G12C	152	2025-08-12 11:42:30.244034	ed8d4d7f-db20-465f-9891-cfdddabc6121	senior	t	2025-08-12 11:42:30.244034
29ec6b39-2593-4ebd-8f8a-819bf85c6e36	271180e5-8f75-469d-b1b3-511161754787	Pre-K	ish_PRE-K	1	2025-08-12 11:42:30.342239	\N	\N	t	2025-08-12 11:42:30.342239
2c108855-549f-4c34-a1fb-33a51df9f9d4	271180e5-8f75-469d-b1b3-511161754787	Kindergarten	ish_KINDERGARTEN	2	2025-08-12 11:42:30.342239	\N	\N	t	2025-08-12 11:42:30.342239
091c414e-2906-4cc7-b198-12fdd2d13376	271180e5-8f75-469d-b1b3-511161754787	Grade 7	ish_GRADE_7	3	2025-08-12 11:42:30.342239	\N	\N	t	2025-08-12 11:42:30.342239
7b3352ae-0ba7-468c-b18c-4dd2a96f6490	271180e5-8f75-469d-b1b3-511161754787	Grade 8	ish_GRADE_8	4	2025-08-12 11:42:30.342239	\N	\N	t	2025-08-12 11:42:30.342239
5544fbb2-26ce-48f0-8a1d-2731b0fdbfd7	271180e5-8f75-469d-b1b3-511161754787	Grade 9	ish_GRADE_9	5	2025-08-12 11:42:30.342239	\N	\N	t	2025-08-12 11:42:30.342239
a69003a2-6d6d-4ca9-90f6-3bbdaa73b461	271180e5-8f75-469d-b1b3-511161754787	Grade 10	ish_GRADE_10	6	2025-08-12 11:42:30.342239	\N	\N	t	2025-08-12 11:42:30.342239
171bf245-2925-4dea-8de5-0888bc829df4	271180e5-8f75-469d-b1b3-511161754787	Grade 11	ish_GRADE_11	7	2025-08-12 11:42:30.342239	\N	\N	t	2025-08-12 11:42:30.342239
f02eec1f-3cce-4b10-85b3-de5d8ed92e70	271180e5-8f75-469d-b1b3-511161754787	Grade 12	ish_GRADE_12	8	2025-08-12 11:42:30.342239	\N	\N	t	2025-08-12 11:42:30.342239
6586ff36-8117-4409-988d-aecd0da28f0a	271180e5-8f75-469d-b1b3-511161754787	Grade 1	ish_GRADE_1	9	2025-08-12 11:42:30.342239	\N	\N	t	2025-08-12 11:42:30.342239
dafa42ea-018b-4a49-9e9d-08d1a14704e9	271180e5-8f75-469d-b1b3-511161754787	Grade 2	ish_GRADE_2	10	2025-08-12 11:42:30.342239	\N	\N	t	2025-08-12 11:42:30.342239
752f1750-32d9-4800-9ee2-6c9cc7f71112	271180e5-8f75-469d-b1b3-511161754787	Grade 3	ish_GRADE_3	11	2025-08-12 11:42:30.342239	\N	\N	t	2025-08-12 11:42:30.342239
64c21dd7-b76b-4d69-b573-c0ba2464429a	271180e5-8f75-469d-b1b3-511161754787	Grade 4	ish_GRADE_4	12	2025-08-12 11:42:30.342239	\N	\N	t	2025-08-12 11:42:30.342239
bcaabb50-7480-4664-bd8f-cb1f08454ec2	271180e5-8f75-469d-b1b3-511161754787	Grade 5	ish_GRADE_5	13	2025-08-12 11:42:30.342239	\N	\N	t	2025-08-12 11:42:30.342239
510837f1-768a-477d-84e2-e5a138272b07	271180e5-8f75-469d-b1b3-511161754787	Grade 6	ish_GRADE_6	14	2025-08-12 11:42:30.342239	\N	\N	t	2025-08-12 11:42:30.342239
\.


--
-- Data for Name: invoice_assets; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.invoice_assets (id, school_id, name, type, url, size, mime_type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: invoice_lines; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.invoice_lines (id, invoice_id, description, quantity, unit_price, total, created_at, feature_id, unit_measurement, start_date, end_date, negotiated_price) FROM stdin;
9dcf0d6f-4af4-491e-9d0d-7c08127848d1	5a4f2c71-f96c-4738-bd0a-7318554c34cd	Feature: c825fc76-5e06-420c-9a9c-3af36d894d34	1	50000.00	50000.00	2025-08-11 15:09:58.633122	c825fc76-5e06-420c-9a9c-3af36d894d34	per_school	\N	\N	\N
61b8d75d-7bc8-4848-8570-0d8629cc7733	09434038-3a30-42d6-8134-03a7444c1e63	Feature: f8fbddb7-d515-423f-a4cc-2b7540a8b42f	11234	1000.00	11234000.00	2025-08-12 11:02:54.729103	f8fbddb7-d515-423f-a4cc-2b7540a8b42f	per_school	\N	\N	\N
0bc4800f-286c-45f1-ad26-4616d1a5a0e8	09434038-3a30-42d6-8134-03a7444c1e63	Feature: 3d5f659f-8638-4a4d-a801-605b503d2160	1123	10000.00	11230000.00	2025-08-12 11:02:54.729103	3d5f659f-8638-4a4d-a801-605b503d2160	per_staff	\N	\N	\N
f4306b35-126f-4036-b052-045f40e21740	4fcb64b4-f0d4-429c-afca-85a11ba7ad84	Feature: c825fc76-5e06-420c-9a9c-3af36d894d34	1099	350.00	384650.00	2025-08-12 11:50:24.064087	c825fc76-5e06-420c-9a9c-3af36d894d34	per_student	\N	\N	\N
\.


--
-- Data for Name: invoice_templates; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.invoice_templates (id, school_id, name, features, total_amount, is_default, created_at, updated_at, template_type, primary_color, accent_color, logo_url, watermark_url, background_image_url, customization) FROM stdin;
f19c2ba6-af56-4907-9d6e-4461f68c8c7b	\N	Default Modern	[]	0	t	2025-08-11 21:16:30.03375	2025-08-11 21:16:30.03375	modern	#2563eb	#64748b	\N	\N	\N	{"footerText": "Thank you for your business!", "headerStyle": "default", "showWatermark": false, "showBackgroundImage": false}
0f726109-5e47-4938-9c1b-0d342f9d384a	\N	Classic Blue	[]	0	f	2025-08-11 21:16:30.03375	2025-08-11 21:16:30.03375	classic	#1e40af	#475569	\N	\N	\N	{"footerText": "Thank you for choosing our services!", "headerStyle": "classic", "showWatermark": false, "showBackgroundImage": false}
dc690a92-30a4-4e14-99af-be3ea847e4b6	\N	Minimal Green	[]	0	f	2025-08-11 21:16:30.03375	2025-08-11 21:16:30.03375	minimal	#16a34a	#6b7280	\N	\N	\N	{"footerText": "We appreciate your business.", "headerStyle": "minimal", "showWatermark": false, "showBackgroundImage": false}
3b0bf5a0-e3c4-49c1-ac72-b0180ce7fd04	\N	Corporate Purple	[]	0	f	2025-08-11 21:16:30.03375	2025-08-11 21:16:30.03375	corporate	#7c3aed	#64748b	\N	\N	\N	{"footerText": "Professional invoicing solution.", "headerStyle": "corporate", "showWatermark": true, "showBackgroundImage": false}
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.invoices (id, invoice_number, school_id, template_id, features, total_amount, custom_amount, status, due_date, paid_at, email_sent, email_sent_at, notes, created_at, updated_at) FROM stdin;
09434038-3a30-42d6-8134-03a7444c1e63	INV-2025-001	8239732f-f976-4721-901d-57bb553fc6d6	\N	[]	22464000.00	\N	SENT	2025-08-13 00:00:00	\N	f	\N		2025-08-12 11:02:54.682347	2025-08-12 11:02:54.682347
4fcb64b4-f0d4-429c-afca-85a11ba7ad84	INV-2025-002	271180e5-8f75-469d-b1b3-511161754787	\N	[]	384650.00	\N	SENT	2025-08-20 00:00:00	\N	f	\N		2025-08-12 11:50:24.034945	2025-08-12 11:50:24.034945
\.


--
-- Data for Name: school_features; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.school_features (id, school_id, feature_id, enabled, created_at) FROM stdin;
926df53d-6629-4a2d-a01d-d923f815970a	8239732f-f976-4721-901d-57bb553fc6d6	f8fbddb7-d515-423f-a4cc-2b7540a8b42f	t	2025-08-11 13:46:38.517049
e68ee0c7-214e-446e-af65-f77548ff6c04	8239732f-f976-4721-901d-57bb553fc6d6	3d5f659f-8638-4a4d-a801-605b503d2160	t	2025-08-11 13:46:39.248625
f1528532-65aa-4ffd-99df-694eb546b7b4	8239732f-f976-4721-901d-57bb553fc6d6	f77dd9f1-2bf3-4c06-901d-2f2af5b2e458	f	2025-08-11 13:46:35.856283
cf55e53e-a939-46e3-90d9-27a5320003fe	3b65d9a3-7268-4bdd-b648-920d0525c744	2521ee96-814d-47cb-8993-02302d9407c1	t	2025-08-11 14:54:12.842648
9678511e-476f-46dd-b6ea-a8443af88011	3b65d9a3-7268-4bdd-b648-920d0525c744	95fb6524-4f36-4a86-ab5c-81ff12be588c	t	2025-08-11 14:54:13.81314
fe5687a0-9c8a-41d7-8f20-edd7e3f01e3e	3b65d9a3-7268-4bdd-b648-920d0525c744	6eb8c3ba-d347-44eb-935e-7a0b70125492	t	2025-08-11 14:54:14.466888
ae6dc8c1-8528-4c55-8ff1-f17cee4239ef	3b65d9a3-7268-4bdd-b648-920d0525c744	f44af874-d6b5-4467-b5b4-a866e0162a9b	t	2025-08-11 14:54:15.294249
b3b6200b-2720-4b4b-bd8f-24c5f5c163c1	3b65d9a3-7268-4bdd-b648-920d0525c744	f77dd9f1-2bf3-4c06-901d-2f2af5b2e458	t	2025-08-11 14:55:25.790224
a174835e-b0c3-4154-a8a8-ec0064846bbf	19b8794a-88a8-4026-b070-4aef40a813a9	356362e9-66c4-4736-8a72-44a756edd822	t	2025-08-12 10:59:59.617062
2a1228b0-d65d-4bce-a017-95c3c3a6084f	19b8794a-88a8-4026-b070-4aef40a813a9	f8fbddb7-d515-423f-a4cc-2b7540a8b42f	t	2025-08-12 11:00:00.659982
55ba61af-b3e9-446b-a6bf-1d2211504e32	19b8794a-88a8-4026-b070-4aef40a813a9	f77dd9f1-2bf3-4c06-901d-2f2af5b2e458	t	2025-08-12 11:00:01.882751
bef057b7-53b2-43c8-8617-b351146d6a31	19b8794a-88a8-4026-b070-4aef40a813a9	c825fc76-5e06-420c-9a9c-3af36d894d34	t	2025-08-12 11:00:03.820386
22178855-d27a-4078-b11b-82c6750145ca	19b8794a-88a8-4026-b070-4aef40a813a9	f44af874-d6b5-4467-b5b4-a866e0162a9b	t	2025-08-12 11:00:04.641848
8139f9c0-724b-4ca5-bd4a-0c3502fdb474	3de11e62-2e5a-4783-9add-e353ee5008d8	f77dd9f1-2bf3-4c06-901d-2f2af5b2e458	t	2025-08-12 11:00:18.564855
0d6333dc-64b9-4e88-babf-1a5fccdefb21	3de11e62-2e5a-4783-9add-e353ee5008d8	f8fbddb7-d515-423f-a4cc-2b7540a8b42f	t	2025-08-12 11:00:21.20421
0f77b716-1a71-4c41-ad3a-94785901de8c	3de11e62-2e5a-4783-9add-e353ee5008d8	95fb6524-4f36-4a86-ab5c-81ff12be588c	t	2025-08-12 11:00:22.390482
783bee9b-b1cf-490b-a7a3-f4c706e18add	687c1127-a477-484d-8bda-c1d99aad91a2	2521ee96-814d-47cb-8993-02302d9407c1	t	2025-08-12 11:00:27.088199
d11ca89e-4da4-4262-be60-ab48d5586e57	687c1127-a477-484d-8bda-c1d99aad91a2	356362e9-66c4-4736-8a72-44a756edd822	t	2025-08-12 11:00:27.661595
cc1fd412-47ac-4516-95fc-89fb960307f7	687c1127-a477-484d-8bda-c1d99aad91a2	f8fbddb7-d515-423f-a4cc-2b7540a8b42f	t	2025-08-12 11:00:28.607766
d7cacbc2-87ff-4d76-83f1-af0ec1513b0a	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	3d5f659f-8638-4a4d-a801-605b503d2160	t	2025-08-12 11:00:33.031915
d3dd9b49-c9ba-4f2d-b7e1-3dbb7652c8b4	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	95fb6524-4f36-4a86-ab5c-81ff12be588c	t	2025-08-12 11:00:33.7227
7e0212ba-4bad-47be-b083-d921a5e968e4	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	6eb8c3ba-d347-44eb-935e-7a0b70125492	t	2025-08-12 11:00:34.366086
29bc59c2-25de-4817-b8d0-a63d619f6305	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	f8fbddb7-d515-423f-a4cc-2b7540a8b42f	t	2025-08-12 11:00:35.185641
9a05a1f1-1882-45a6-bf28-0fd850e92ac1	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	356362e9-66c4-4736-8a72-44a756edd822	t	2025-08-12 11:00:35.992093
761d55a2-2f63-4ad2-9533-901d0cdfcd72	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	2521ee96-814d-47cb-8993-02302d9407c1	t	2025-08-12 11:00:36.678533
4217dbfe-8f9f-40a4-9115-f02df5df64d5	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	f77dd9f1-2bf3-4c06-901d-2f2af5b2e458	t	2025-08-12 11:00:37.740716
dfedd923-0baa-4fe4-8009-e830ebc0c804	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	c825fc76-5e06-420c-9a9c-3af36d894d34	t	2025-08-12 11:00:38.598937
c64f6e85-9885-4219-a4e9-7eac2965d256	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	f44af874-d6b5-4467-b5b4-a866e0162a9b	t	2025-08-12 11:00:40.761081
a2ab9edf-bb91-4b93-a370-95101245cc87	271180e5-8f75-469d-b1b3-511161754787	c825fc76-5e06-420c-9a9c-3af36d894d34	t	2025-08-12 11:48:26.683946
dddfb7c1-c8be-4283-9734-afe7a1451383	271180e5-8f75-469d-b1b3-511161754787	f77dd9f1-2bf3-4c06-901d-2f2af5b2e458	t	2025-08-12 11:48:27.862442
11ce8c90-8e02-4ede-a643-a490e4d45949	271180e5-8f75-469d-b1b3-511161754787	f8fbddb7-d515-423f-a4cc-2b7540a8b42f	t	2025-08-12 11:48:29.396118
e2121346-cd1b-47c5-ad6e-77220fe65371	271180e5-8f75-469d-b1b3-511161754787	95fb6524-4f36-4a86-ab5c-81ff12be588c	t	2025-08-12 11:48:30.344998
\.


--
-- Data for Name: schools; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.schools (id, name, short_name, abbreviation, motto, state, lga, address, phones, email, logo_url, type, status, main_branch_id, payment_status, next_payment_due, access_blocked_at, created_at, updated_at) FROM stdin;
8239732f-f976-4721-901d-57bb553fc6d6	Crescent International School	cis	CIS	Education with Purpose	Kano	Nassarawa	Kano, Nigeria\nKano, Nigeria	[]	ssirdeeq@gmail.com		K12	ACTIVE	8d1b4f55-9653-43a8-adef-4062b91d450f	PENDING	\N	\N	2025-08-11 12:53:28.777516	2025-08-11 12:55:13.659
3b65d9a3-7268-4bdd-b648-920d0525c744	Test Nigerian School	test-nigerian	TNS	\N	\N	\N	\N	[]	\N	\N	NIGERIAN	ACTIVE	\N	PENDING	\N	\N	2025-08-11 14:19:12.547174	2025-08-11 14:25:54.857
19b8794a-88a8-4026-b070-4aef40a813a9	shalom academic	saghggh	yyy	Education with Purpose	Kano	Nassarawa	Kano, Nigeria\nKano, Nigeria	[]	ssirdeeq@gmail.com		NIGERIAN	ACTIVE	26c59883-e3e4-4d95-afe4-b33da2349f14	PENDING	\N	\N	2025-08-12 09:22:06.70416	2025-08-12 09:22:06.766
f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	Enhanced Sections Test School	enhanced-sections-test			Lagos	Victoria Island	123 Enhanced St	[]	enhanced@test.com		K12	ACTIVE	c7e99c13-c3c9-4013-a9dd-f7c05a38301d	PENDING	\N	\N	2025-08-12 10:24:37.869804	2025-08-12 10:24:37.978
687c1127-a477-484d-8bda-c1d99aad91a2	Final Enhanced Sections School	final-enhanced-sections			Lagos	Victoria Island	123 Final St	[]	final@test.com		NIGERIAN	ACTIVE	da082329-71d8-42fd-8967-a7d4a9c265e3	PENDING	\N	\N	2025-08-12 10:25:12.010083	2025-08-12 10:25:12.107
3de11e62-2e5a-4783-9add-e353ee5008d8	Complete Test School	complete-test			Lagos	Victoria Island	123 Complete St	[]	complete@test.com		K12	ACTIVE	97c061a7-d8e3-42bf-806a-4e3666cd767e	PENDING	\N	\N	2025-08-12 10:25:28.772922	2025-08-12 10:25:28.876
271180e5-8f75-469d-b1b3-511161754787	Ishaq Academy	ish	ish	Education with Purpose	Kano	Nassarawa	Kano, Nigeria\nKano, Nigeria	[]	ibagwai9@gmail.com		K12	ACTIVE	c360a8ef-9334-4da9-b286-53546bef71cb	PENDING	\N	\N	2025-08-12 11:42:30.173028	2025-08-12 11:51:47.74
\.


--
-- Data for Name: sections; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sections (id, school_id, name, code, capacity, is_active, created_at, updated_at) FROM stdin;
c83184b8-d6e5-4e9e-baa5-98ffc790053d	8239732f-f976-4721-901d-57bb553fc6d6	Section A	A	30	t	2025-08-11 14:44:20.75098	2025-08-11 14:44:20.75098
53a6609d-9a80-40a3-aee3-e0840ba7dfaa	8239732f-f976-4721-901d-57bb553fc6d6	Section B	B	30	t	2025-08-11 14:44:20.75098	2025-08-11 14:44:20.75098
5f1795a6-e75e-400b-9ee5-f153f3e46ff6	8239732f-f976-4721-901d-57bb553fc6d6	Section C	C	30	t	2025-08-11 14:44:20.75098	2025-08-11 14:44:20.75098
957cf2f5-86db-4dc3-a4e2-2e2402ceb24c	3b65d9a3-7268-4bdd-b648-920d0525c744	Section A	A	30	t	2025-08-11 14:44:20.75098	2025-08-11 14:44:20.75098
4fcb8013-2129-4d38-8c04-32943c8d4ba6	3b65d9a3-7268-4bdd-b648-920d0525c744	Section B	B	30	t	2025-08-11 14:44:20.75098	2025-08-11 14:44:20.75098
ec876059-d1a5-463d-a41c-4a3514e4892b	3b65d9a3-7268-4bdd-b648-920d0525c744	Section C	C	30	t	2025-08-11 14:44:20.75098	2025-08-11 14:44:20.75098
bf32587f-3638-4161-87a9-d312e7e37674	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	A	A	30	t	2025-08-12 10:24:37.902999	2025-08-12 10:24:37.902999
b63f8c81-3a20-4716-9097-89f9830126d3	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	B	B	30	t	2025-08-12 10:24:37.902999	2025-08-12 10:24:37.902999
0ad6b898-70aa-42ca-9f4f-29ec31eed9f1	f5c6d895-a3c0-4f2f-9eec-d5e9913a331b	C	C	30	t	2025-08-12 10:24:37.902999	2025-08-12 10:24:37.902999
eb9c4daf-8680-4818-90a1-29ec8db228a4	687c1127-a477-484d-8bda-c1d99aad91a2	A	A	30	t	2025-08-12 10:25:12.041417	2025-08-12 10:25:12.041417
cfe314c9-f169-4828-9aab-c8d23e421331	687c1127-a477-484d-8bda-c1d99aad91a2	B	B	30	t	2025-08-12 10:25:12.041417	2025-08-12 10:25:12.041417
434100c4-2a71-45f8-8936-d35ded8cbde6	687c1127-a477-484d-8bda-c1d99aad91a2	C	C	30	t	2025-08-12 10:25:12.041417	2025-08-12 10:25:12.041417
ae4b44a5-2e09-4701-8c3d-6a68a956bf08	3de11e62-2e5a-4783-9add-e353ee5008d8	A	A	30	t	2025-08-12 10:25:28.804043	2025-08-12 10:25:28.804043
45fde40e-3b3e-492f-8624-3e5cda937707	3de11e62-2e5a-4783-9add-e353ee5008d8	B	B	30	t	2025-08-12 10:25:28.804043	2025-08-12 10:25:28.804043
601188d7-6d40-48f7-987c-9316d831c15d	3de11e62-2e5a-4783-9add-e353ee5008d8	C	C	30	t	2025-08-12 10:25:28.804043	2025-08-12 10:25:28.804043
657a86b0-aab4-4513-91ce-14b565e4114e	271180e5-8f75-469d-b1b3-511161754787	A	A	30	t	2025-08-12 11:42:30.21112	2025-08-12 11:42:30.21112
fff60acf-c6eb-4eaf-aa8a-39db8eb89a08	271180e5-8f75-469d-b1b3-511161754787	B	B	30	t	2025-08-12 11:42:30.21112	2025-08-12 11:42:30.21112
ed8d4d7f-db20-465f-9891-cfdddabc6121	271180e5-8f75-469d-b1b3-511161754787	C	C	30	t	2025-08-12 11:42:30.21112	2025-08-12 11:42:30.21112
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.subscriptions (id, school_id, plan, starts_at, ends_at, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, password, name, role, school_id, branch_id, force_password_change, created_at, updated_at) FROM stdin;
7dd8330e-528c-4dff-ab85-25053970be8c	admin@elitescholar.com	$2b$10$OfzcndtxZztblq.rsclcBe3K0ZlCUqUS/KpKWRNLYdkPa9/b4c3oO	Elite Administrator	superadmin	\N	\N	f	2025-08-09 16:08:44.118649	2025-08-09 16:08:44.118649
7d9f6bd2-4071-471a-9308-ccdea6448077	cis@gmail.com	$2b$10$vU9wiR3xV8pW1GGz6DjnUu4lvW.bOAw7kvTlrSYy5Iynx0axjOq42	Cresent Admin	school_admin	8239732f-f976-4721-901d-57bb553fc6d6	8d1b4f55-9653-43a8-adef-4062b91d450f	t	2025-08-11 12:53:28.949574	2025-08-11 12:53:28.949574
87706503-3a5f-4525-a7b0-c798c03a29fb	shalon@gmail.com	$2b$10$hZ4Ybwy2FQ/3Y3frA5W/OuSwbRcumNtG/iSK0nWcKn/vkLwDKDr0i	Shalom Academic	school_admin	19b8794a-88a8-4026-b070-4aef40a813a9	26c59883-e3e4-4d95-afe4-b33da2349f14	t	2025-08-12 09:22:06.903717	2025-08-12 09:22:06.903717
d0987148-c15e-4a3b-97e9-afee212958cb	ishaq-admin@gmail.com	$2b$10$WqFIgI90Hs91kBcJWdOp7Og/ZCo7rl5EgM.S8Qc9uYd5Bk.pH7v4K	Ishaq Academy 	school_admin	271180e5-8f75-469d-b1b3-511161754787	c360a8ef-9334-4da9-b286-53546bef71cb	t	2025-08-12 11:42:30.433784	2025-08-12 11:42:30.433784
\.


--
-- Name: app_config app_config_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.app_config
    ADD CONSTRAINT app_config_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (id);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: features features_key_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.features
    ADD CONSTRAINT features_key_unique UNIQUE (key);


--
-- Name: features features_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.features
    ADD CONSTRAINT features_pkey PRIMARY KEY (id);


--
-- Name: grade_sections grade_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.grade_sections
    ADD CONSTRAINT grade_sections_pkey PRIMARY KEY (id);


--
-- Name: invoice_assets invoice_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoice_assets
    ADD CONSTRAINT invoice_assets_pkey PRIMARY KEY (id);


--
-- Name: invoice_lines invoice_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoice_lines
    ADD CONSTRAINT invoice_lines_pkey PRIMARY KEY (id);


--
-- Name: invoice_templates invoice_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoice_templates
    ADD CONSTRAINT invoice_templates_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_number_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_unique UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: school_features school_features_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_features
    ADD CONSTRAINT school_features_pkey PRIMARY KEY (id);


--
-- Name: school_features school_features_school_id_feature_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.school_features
    ADD CONSTRAINT school_features_school_id_feature_id_unique UNIQUE (school_id, feature_id);


--
-- Name: schools schools_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_pkey PRIMARY KEY (id);


--
-- Name: schools schools_short_name_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_short_name_unique UNIQUE (short_name);


--
-- Name: sections sections_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

