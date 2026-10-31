CREATE TABLE public.industry_objective_templates (industry text PRIMARY KEY, objectives jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.industry_objective_templates TO authenticated;
GRANT ALL ON public.industry_objective_templates TO service_role;
ALTER TABLE public.industry_objective_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in users read objective suggestions" ON public.industry_objective_templates FOR SELECT TO authenticated USING (true);
INSERT INTO public.industry_objective_templates(industry, objectives) VALUES
('*','[{"id":"traffic","title":"زيادة زيارات الموقع","hint":"جذب زوار أكثر","unit":"زيارة شهريًا","source":"ga4"},{"id":"leads","title":"زيادة العملاء المحتملين","hint":"طلبات وتواصل أكثر","unit":"عميل محتمل شهريًا","source":"manual"},{"id":"sales","title":"زيادة المبيعات","hint":"إيراد أعلى","unit":"% نمو","source":"manual"},{"id":"awareness","title":"زيادة الوعي بالعلامة","hint":"حضور أوسع","unit":"متابع جديد","source":"social"},{"id":"time","title":"توفير وقت الفريق","hint":"مهام أقل يدويًا","unit":"ساعة موفرة شهريًا","source":"manual"}]'),
('التجارة الإلكترونية','[{"id":"orders","title":"زيادة الطلبات الشهرية","hint":"طلبات أكثر من المتجر","unit":"طلب شهريًا","source":"manual"},{"id":"cart","title":"خفض السلال المتروكة","hint":"إكمال الشراء","unit":"% خفض","source":"manual"},{"id":"repeat","title":"زيادة الشراء المتكرر","hint":"عملاء يعودون","unit":"% عملاء عائدين","source":"manual"}]'),
('الأزياء والمنتجات','[{"id":"orders","title":"زيادة الطلبات الشهرية","hint":"طلبات أكثر","unit":"طلب شهريًا","source":"manual"},{"id":"launch","title":"إطلاق مجموعات جديدة","hint":"حملة لكل مجموعة","unit":"إطلاق كل 3 أشهر","source":"manual"}]'),
('المطاعم والمقاهي','[{"id":"bookings","title":"زيادة الحجوزات والطلبات","hint":"طاولات وتوصيل","unit":"طلب أسبوعيًا","source":"manual"},{"id":"reviews","title":"تقييمات أكثر على الخرائط","hint":"سمعة محلية","unit":"تقييم جديد شهريًا","source":"manual"}]'),
('العيادات والرعاية الصحية','[{"id":"appointments","title":"زيادة المواعيد","hint":"حجوزات جديدة","unit":"موعد شهريًا","source":"manual"},{"id":"reviews","title":"تقييمات المرضى","hint":"ثقة أعلى","unit":"تقييم جديد شهريًا","source":"manual"}]'),
('العقارات','[{"id":"inquiries","title":"زيادة استفسارات العقارات","hint":"مشترون جادّون","unit":"استفسار شهريًا","source":"manual"},{"id":"listings","title":"عرض الوحدات بانتظام","hint":"محتوى لكل وحدة","unit":"وحدة أسبوعيًا","source":"manual"}]'),
('التعليم والتدريب','[{"id":"enrollments","title":"زيادة التسجيلات","hint":"طلاب جدد","unit":"تسجيل شهريًا","source":"manual"}]'),
('التقنية والتطبيقات','[{"id":"signups","title":"زيادة التسجيلات التجريبية","hint":"مستخدمون جدد","unit":"تسجيل شهريًا","source":"ga4"},{"id":"blogs","title":"نشر مقالات منتظمة","hint":"محتوى يجلب زوارًا","unit":"مقال شهريًا","source":"manual"}]'),
('الخدمات المهنية','[{"id":"consults","title":"زيادة طلبات الاستشارة","hint":"عملاء جدد","unit":"طلب شهريًا","source":"manual"}]'),
('السياحة والضيافة','[{"id":"bookings","title":"زيادة الحجوزات المباشرة","hint":"بلا وسطاء","unit":"حجز شهريًا","source":"manual"}]'),
('التجميل والعناية','[{"id":"appointments","title":"زيادة الحجوزات","hint":"مواعيد جديدة","unit":"حجز شهريًا","source":"manual"}]');
CREATE FUNCTION public.save_workplace_setup(p_workspace uuid, p_setup jsonb, p_expected_revision integer) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE w public.workspaces; next_setup jsonb; existing_revision integer; goal jsonb; kpi jsonb; emp text; provider_ready boolean; legacy jsonb;
BEGIN
 SELECT * INTO w FROM public.workspaces WHERE id=p_workspace AND owner_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Workspace not available'; END IF;
 existing_revision=COALESCE((w.profile->'workplaceSetup'->>'revision')::integer,0);
 IF existing_revision<>p_expected_revision THEN RAISE EXCEPTION 'Setup changed in another session. Refresh and try again.'; END IF;
 IF p_setup->>'version'<>'2' OR jsonb_typeof(p_setup->'goals')<>'array' OR jsonb_typeof(p_setup->'employees')<>'array' OR p_setup->>'stage' NOT IN ('objectives','employees','tools','ready','complete') THEN RAISE EXCEPTION 'Invalid setup'; END IF;
 IF jsonb_array_length(p_setup->'goals')>40 OR jsonb_array_length(p_setup->'employees')>7 THEN RAISE EXCEPTION 'Invalid setup size'; END IF;
 FOR emp IN SELECT jsonb_array_elements_text(p_setup->'employees') LOOP IF emp NOT IN ('sonny','sam','eva','nour','dana','adam','abdullah') THEN RAISE EXCEPTION 'Invalid employee'; END IF; END LOOP;
 IF p_setup->>'stage' IN ('tools','ready','complete') THEN
   IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(p_setup->'goals') g WHERE g->>'owner'='general') OR jsonb_array_length(p_setup->'employees')=0 THEN RAISE EXCEPTION 'Objectives and employees required'; END IF;
   FOR emp IN SELECT jsonb_array_elements_text(p_setup->'employees') LOOP IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(p_setup->'goals') g WHERE g->>'owner'=emp) THEN RAISE EXCEPTION 'Employee objectives required'; END IF; END LOOP;
 END IF;
 IF p_setup->>'stage' IN ('ready','complete') THEN
 FOR goal IN SELECT * FROM jsonb_array_elements(p_setup->'goals') LOOP
   IF length(trim(goal->>'title'))=0 OR jsonb_array_length(goal->'kpis')=0 THEN RAISE EXCEPTION 'KPI required'; END IF;
   FOR kpi IN SELECT * FROM jsonb_array_elements(goal->'kpis') LOOP
     IF length(trim(kpi->>'measure'))=0 OR length(trim(kpi->>'unit'))=0 THEN RAISE EXCEPTION 'KPI required'; END IF;
     IF COALESCE(kpi->>'target','')<>'' AND (kpi->>'target')::numeric<=0 THEN RAISE EXCEPTION 'Positive target required'; END IF;
     IF kpi->>'source'='ads' THEN RAISE EXCEPTION 'Verified advertising connectivity unavailable'; END IF;
     IF kpi->>'source' IN ('ga4','gsc','social') THEN
       SELECT EXISTS (SELECT 1 FROM public.integrations i WHERE i.workspace_id=w.id AND i.status='connected' AND CASE kpi->>'source' WHEN 'ga4' THEN i.provider='analytics' AND i.account LIKE 'GA4 · %' WHEN 'gsc' THEN i.provider='search-console' WHEN 'social' THEN i.provider IN ('instagram','facebook','linkedin','x') ELSE false END) INTO provider_ready;
       IF NOT provider_ready THEN RAISE EXCEPTION 'Essential connection required'; END IF;
     END IF;
   END LOOP;
   IF goal->>'owner'='eva' AND goal->>'id'='inbox' AND NOT EXISTS (SELECT 1 FROM public.integrations i WHERE i.workspace_id=w.id AND i.status='connected' AND i.provider IN ('gmail','outlook')) THEN RAISE EXCEPTION 'Email connection required'; END IF;
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
