CREATE OR REPLACE FUNCTION public.save_workplace_setup(p_workspace uuid, p_setup jsonb, p_expected_revision integer) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE w public.workspaces; next_setup jsonb; existing_revision integer; goal jsonb; kpi jsonb; emp text; legacy jsonb;
BEGIN
 SELECT * INTO w FROM public.workspaces WHERE id=p_workspace AND owner_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Workspace not available'; END IF;
 existing_revision=COALESCE((w.profile->'workplaceSetup'->>'revision')::integer,0);
 IF existing_revision<>p_expected_revision THEN RAISE EXCEPTION 'Setup changed in another session. Refresh and try again.'; END IF;
 IF p_setup->>'version'<>'2' OR jsonb_typeof(p_setup->'goals') IS DISTINCT FROM 'array' OR jsonb_typeof(p_setup->'employees') IS DISTINCT FROM 'array' OR p_setup->>'stage' NOT IN ('objectives','employees','tools','ready','complete') OR p_setup->>'stage' IS NULL THEN RAISE EXCEPTION 'Invalid setup'; END IF;
 IF jsonb_array_length(p_setup->'goals')>40 OR jsonb_array_length(p_setup->'employees')>7 THEN RAISE EXCEPTION 'Invalid setup size'; END IF;
 FOR emp IN SELECT jsonb_array_elements_text(p_setup->'employees') LOOP IF emp NOT IN ('sonny','sam','eva','nour','dana','adam','abdullah') THEN RAISE EXCEPTION 'Invalid employee'; END IF; END LOOP;
 IF p_setup->>'stage' IN ('tools','ready','complete') THEN
   IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(p_setup->'goals') g WHERE g->>'owner'='general') OR jsonb_array_length(p_setup->'employees')=0 THEN RAISE EXCEPTION 'Objectives and employees required'; END IF;
   FOR emp IN SELECT jsonb_array_elements_text(p_setup->'employees') LOOP IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(p_setup->'goals') g WHERE g->>'owner'=emp) THEN RAISE EXCEPTION 'Employee objectives required'; END IF; END LOOP;
 END IF;
 IF p_setup->>'stage' IN ('ready','complete') THEN
 FOR goal IN SELECT * FROM jsonb_array_elements(p_setup->'goals') LOOP
   IF coalesce(length(trim(goal->>'title')),0)=0 OR jsonb_array_length(goal->'kpis')=0 THEN RAISE EXCEPTION 'KPI required'; END IF;
   FOR kpi IN SELECT * FROM jsonb_array_elements(goal->'kpis') LOOP
     IF coalesce(length(trim(kpi->>'measure')),0)=0 OR coalesce(length(trim(kpi->>'unit')),0)=0 THEN RAISE EXCEPTION 'KPI required'; END IF;
     IF COALESCE(kpi->>'target','')<>'' AND (kpi->>'target')::numeric<=0 THEN RAISE EXCEPTION 'Positive target required'; END IF;
   END LOOP;
 END LOOP;
 END IF;
 next_setup=jsonb_set(p_setup,'{revision}',to_jsonb(existing_revision+1));
 IF p_setup->>'stage'='complete' THEN next_setup=jsonb_set(next_setup,'{completedAt}',to_jsonb(now()::text)); END IF;
 SELECT jsonb_build_object('version',1,'completedAt',COALESCE(next_setup->>'completedAt',''),'employees',next_setup->'employees','answers',COALESCE(w.profile->'onboarding'->'answers','{}'::jsonb),'objectives',COALESCE(jsonb_agg(jsonb_build_object('id',(g->>'id')||'-'||(k->>'id'),'owner',g->>'owner','title',(g->>'title')||' · '||(k->>'measure'),'unit',k->>'unit','target',k->>'target','horizon','3m','source',k->>'source')),'[]'::jsonb)) INTO legacy FROM jsonb_array_elements(next_setup->'goals') g CROSS JOIN LATERAL jsonb_array_elements(g->'kpis') k;
 UPDATE public.workspaces SET profile=COALESCE(profile,'{}'::jsonb)||jsonb_build_object('workplaceSetup',next_setup,'onboarding',legacy),industry=p_setup->>'industry' WHERE id=w.id AND owner_id=auth.uid();
 RETURN next_setup;
END $$;
REVOKE ALL ON FUNCTION public.save_workplace_setup(uuid,jsonb,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_workplace_setup(uuid,jsonb,integer) TO authenticated;