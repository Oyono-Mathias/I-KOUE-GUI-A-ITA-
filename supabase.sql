
-- SCHÉMA BASE DE DONNÉES TEMPS RÉEL (Compatible Supabase / PostgreSQL)

CREATE TABLE public.stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.activites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    icon VARCHAR(10),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    liste_points JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.temoignages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote TEXT NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    author_role VARCHAR(255),
    author_avatar_emoji VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.domaines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Configuration
ALTER TABLE public.stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temoignages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domaines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture publique stats" ON public.stats FOR SELECT USING (true);
CREATE POLICY "Lecture publique activites" ON public.activites FOR SELECT USING (true);
CREATE POLICY "Lecture publique temoignages" ON public.temoignages FOR SELECT USING (true);
CREATE POLICY "Lecture publique domaines" ON public.domaines FOR SELECT USING (true);
