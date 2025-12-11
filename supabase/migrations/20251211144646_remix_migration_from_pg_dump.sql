CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: ait_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ait_status AS ENUM (
    'pendente',
    'aprovado',
    'recusado'
);


--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderador'
);


--
-- Name: patente; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.patente AS ENUM (
    'Coronel',
    'Tenente-Coronel',
    'Major',
    'Capitão',
    '1° Tenente',
    '2° Tenente',
    'Aspirante a Oficial',
    'Subtenente',
    '1° Sargento',
    '2° Sargento',
    '3° Sargento',
    'Cabo',
    'Soldado de 1° Classe',
    'Soldado de 2° Classe'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.email), NEW.email);
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: reset_ait_sequence(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reset_ait_sequence() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Check if table is empty after delete
  IF NOT EXISTS (SELECT 1 FROM public.aits) THEN
    -- Reset the sequence to 1
    ALTER SEQUENCE aits_numero_ait_seq RESTART WITH 1;
  END IF;
  RETURN OLD;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: aits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero_ait integer NOT NULL,
    agente_id uuid,
    graduacao public.patente NOT NULL,
    nome_agente text NOT NULL,
    primeiro_homem text NOT NULL,
    primeiro_homem_patente public.patente,
    segundo_homem text,
    segundo_homem_patente public.patente,
    terceiro_homem text,
    terceiro_homem_patente public.patente,
    quarto_homem text,
    quarto_homem_patente public.patente,
    viatura text NOT NULL,
    relatorio text NOT NULL,
    nome_condutor text NOT NULL,
    passaporte_condutor text NOT NULL,
    nome_proprietario text,
    passaporte_proprietario text,
    emplacamento text NOT NULL,
    marca_modelo text NOT NULL,
    artigos_infringidos text[] DEFAULT '{}'::text[] NOT NULL,
    providencias_tomadas text[] DEFAULT '{}'::text[] NOT NULL,
    status public.ait_status DEFAULT 'pendente'::public.ait_status NOT NULL,
    aprovado_por uuid,
    data_aprovacao timestamp with time zone,
    motivo_recusa text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    data_inicio timestamp with time zone,
    data_termino timestamp with time zone,
    imagens text[] DEFAULT '{}'::text[]
);


--
-- Name: aits_numero_ait_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.aits_numero_ait_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: aits_numero_ait_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.aits_numero_ait_seq OWNED BY public.aits.numero_ait;


--
-- Name: hierarquia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hierarquia (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    rg text NOT NULL,
    patente public.patente NOT NULL,
    funcao text NOT NULL,
    observacao text,
    data_entrada date NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    nome text NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: viaturas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.viaturas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    prefixo text NOT NULL,
    tipo text NOT NULL,
    ativa boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: aits numero_ait; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aits ALTER COLUMN numero_ait SET DEFAULT nextval('public.aits_numero_ait_seq'::regclass);


--
-- Name: aits aits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aits
    ADD CONSTRAINT aits_pkey PRIMARY KEY (id);


--
-- Name: hierarquia hierarquia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hierarquia
    ADD CONSTRAINT hierarquia_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: viaturas viaturas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viaturas
    ADD CONSTRAINT viaturas_pkey PRIMARY KEY (id);


--
-- Name: viaturas viaturas_prefixo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viaturas
    ADD CONSTRAINT viaturas_prefixo_key UNIQUE (prefixo);


--
-- Name: aits reset_ait_sequence_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER reset_ait_sequence_trigger AFTER DELETE ON public.aits FOR EACH STATEMENT EXECUTE FUNCTION public.reset_ait_sequence();


--
-- Name: aits update_aits_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_aits_updated_at BEFORE UPDATE ON public.aits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: hierarquia update_hierarquia_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_hierarquia_updated_at BEFORE UPDATE ON public.hierarquia FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: aits aits_agente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aits
    ADD CONSTRAINT aits_agente_id_fkey FOREIGN KEY (agente_id) REFERENCES auth.users(id);


--
-- Name: aits aits_aprovado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aits
    ADD CONSTRAINT aits_aprovado_por_fkey FOREIGN KEY (aprovado_por) REFERENCES auth.users(id);


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: aits Admins and moderators can update AITs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and moderators can update AITs" ON public.aits FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderador'::public.app_role)));


--
-- Name: aits Admins can delete AITs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete AITs" ON public.aits FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can delete roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can insert roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: viaturas Admins can manage viaturas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage viaturas" ON public.viaturas TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: aits Anyone can create AITs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create AITs" ON public.aits FOR INSERT WITH CHECK (true);


--
-- Name: viaturas Anyone can view viaturas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view viaturas" ON public.viaturas FOR SELECT USING (true);


--
-- Name: hierarquia Authenticated users can delete hierarquia; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can delete hierarquia" ON public.hierarquia FOR DELETE TO authenticated USING (true);


--
-- Name: hierarquia Authenticated users can insert hierarquia; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert hierarquia" ON public.hierarquia FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: hierarquia Authenticated users can update hierarquia; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update hierarquia" ON public.hierarquia FOR UPDATE TO authenticated USING (true);


--
-- Name: hierarquia Authenticated users can view hierarquia; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view hierarquia" ON public.hierarquia FOR SELECT TO authenticated USING (true);


--
-- Name: profiles Authenticated users can view profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);


--
-- Name: aits Public can view approved AITs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view approved AITs" ON public.aits FOR SELECT USING (((status = 'aprovado'::public.ait_status) OR ((auth.uid() IS NOT NULL) AND ((agente_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderador'::public.app_role)))));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: aits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.aits ENABLE ROW LEVEL SECURITY;

--
-- Name: hierarquia; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hierarquia ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: viaturas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.viaturas ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


