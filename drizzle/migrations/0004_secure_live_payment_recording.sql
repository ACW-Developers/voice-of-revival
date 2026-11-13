CREATE TABLE public.payment_recording_config (id boolean PRIMARY KEY DEFAULT true CHECK (id), secret_digest bytea NOT NULL);
GRANT ALL ON public.payment_recording_config TO service_role;
ALTER TABLE public.payment_recording_config ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.configure_payment_recording(p_secret text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Administrator access required'; END IF;
 IF p_secret IS NULL OR length(p_secret) < 64 THEN RAISE EXCEPTION 'Invalid configuration'; END IF;
 INSERT INTO public.payment_recording_config(id,secret_digest) VALUES(true,extensions.digest(p_secret,'sha256')) ON CONFLICT(id) DO UPDATE SET secret_digest=EXCLUDED.secret_digest;
END; $$;
REVOKE ALL ON FUNCTION public.configure_payment_recording(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.configure_payment_recording(text) TO authenticated;
CREATE OR REPLACE FUNCTION public.payment_recording_authorized(p_secret text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public,extensions AS $$
 SELECT p_secret IS NOT NULL AND EXISTS(SELECT 1 FROM public.payment_recording_config WHERE secret_digest=extensions.digest(p_secret,'sha256'));
$$;
REVOKE ALL ON FUNCTION public.payment_recording_authorized(text) FROM PUBLIC,anon,authenticated;
DO $$
DECLARE f regprocedure; definition text;
BEGIN
 FOR f IN SELECT unnest(ARRAY['public.record_ticket(text,text,uuid,integer,integer,text,text,text)'::regprocedure,'public.manage_donation(text,text,jsonb)'::regprocedure]) LOOP
  definition := pg_get_functiondef(f);
  definition := regexp_replace(definition, 'IF encode\(extensions.digest\(p_secret,\s*''sha256''\),\s*''hex''\) <> ''[0-9a-f]+'' THEN', 'IF NOT public.payment_recording_authorized(p_secret) THEN');
  IF definition = pg_get_functiondef(f) THEN RAISE EXCEPTION 'Payment verifier upgrade failed'; END IF;
  EXECUTE definition;
 END LOOP;
END; $$;