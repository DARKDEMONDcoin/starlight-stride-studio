CREATE OR REPLACE FUNCTION public.apply_discovered_workspace_name() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE personal_name text; discovered text;
BEGIN
 IF NEW.kind <> 'personal' OR NEW.created_at < '2026-10-31T00:00:00Z'::timestamptz THEN RETURN NEW; END IF;
 SELECT full_name INTO personal_name FROM public.profiles WHERE id=NEW.owner_id;
 discovered=coalesce(nullif(trim(NEW.profile->'brandBrain'->'business'->'data'->>'name'),''),nullif(trim(NEW.profile->'welcome'->>'businessName'),''));
 IF NEW.website IS NOT NULL AND length(trim(NEW.website))>0 AND length(discovered)>=2 AND trim(NEW.name)=trim(personal_name) THEN
 NEW.name=left(discovered,80); NEW.initials=left(discovered,2);
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER apply_discovered_workspace_name BEFORE UPDATE OF profile ON public.workspaces FOR EACH ROW EXECUTE FUNCTION public.apply_discovered_workspace_name();
CREATE OR REPLACE FUNCTION public.save_new_workspace_context(p_workspace uuid,p_context jsonb) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
BEGIN
 UPDATE public.workspaces SET website=CASE WHEN COALESCE(website,'')='' THEN nullif(left(p_context->>'website',600),'') ELSE website END,
 industry=CASE WHEN COALESCE(industry,'') IN ('','أخرى','عام') THEN COALESCE(nullif(left(p_context->>'industry',120),''),industry) ELSE industry END,
 profile=COALESCE(profile,'{}'::jsonb)||jsonb_build_object('welcome',p_context-'website')
 WHERE id=p_workspace AND owner_id=auth.uid() AND created_at>now()-interval '10 minutes' AND NOT COALESCE(profile,'{}'::jsonb) ? 'welcome';
END $$;
UPDATE public.workspaces w SET profile=w.profile WHERE w.kind='personal' AND w.created_at>='2026-10-31T00:00:00Z'::timestamptz AND w.website IS NOT NULL AND w.name=(SELECT p.full_name FROM public.profiles p WHERE p.id=w.owner_id) AND coalesce(nullif(trim(w.profile->'brandBrain'->'business'->'data'->>'name'),''),nullif(trim(w.profile->'welcome'->>'businessName'),'')) IS NOT NULL;