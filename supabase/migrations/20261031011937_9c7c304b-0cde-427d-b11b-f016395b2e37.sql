CREATE TRIGGER industry_objective_templates_updated BEFORE UPDATE ON public.industry_objective_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE FUNCTION public.save_new_workspace_context(p_workspace uuid,p_context jsonb) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id=auth.uid() AND created_at>now()-interval '10 minutes') THEN RETURN; END IF;
 UPDATE public.workspaces SET website=CASE WHEN COALESCE(website,'')='' THEN nullif(left(p_context->>'website',600),'') ELSE website END,industry=CASE WHEN COALESCE(industry,'') IN ('','أخرى','عام') THEN COALESCE(nullif(left(p_context->>'industry',120),''),industry) ELSE industry END,profile=COALESCE(profile,'{}'::jsonb)||jsonb_build_object('welcome',p_context-'website') WHERE id=p_workspace AND owner_id=auth.uid() AND NOT COALESCE(profile,'{}'::jsonb) ? 'welcome';
END $$;
REVOKE ALL ON FUNCTION public.save_new_workspace_context(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_new_workspace_context(uuid,jsonb) TO authenticated;