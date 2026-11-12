CREATE TABLE public.donation_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL DEFAULT '', email text NOT NULL, phone text NOT NULL DEFAULT '', message text NOT NULL DEFAULT '', anonymous boolean NOT NULL DEFAULT false, amount_cents integer NOT NULL CHECK(amount_cents BETWEEN 100 AND 10000000), frequency text NOT NULL CHECK(frequency IN ('once','monthly')), stripe_session_id text UNIQUE, subscription_id text UNIQUE, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.donation_orders TO authenticated;
GRANT ALL ON public.donation_orders TO service_role;
ALTER TABLE public.donation_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read donation orders" ON public.donation_orders FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE TABLE public.donations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES public.donation_orders(id), payment_id text NOT NULL UNIQUE, amount_cents integer NOT NULL CHECK(amount_cents > 0), currency text NOT NULL, paid_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.donations TO authenticated;
GRANT ALL ON public.donations TO service_role;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read donations" ON public.donations FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE OR REPLACE FUNCTION public.manage_donation(p_secret text, p_action text, p_data jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE o public.donation_orders;
BEGIN
 IF encode(extensions.digest(p_secret,'sha256'),'hex') <> 'f99f47499a7c56683389f1855da21a1d7a22b9f7887cd434b7a1656127ce3f87' THEN RAISE EXCEPTION 'forbidden'; END IF;
 IF p_action = 'create' THEN
  IF length(p_data->>'email') > 255 OR length(p_data->>'name') > 100 OR length(p_data->>'message') > 1000 OR length(p_data->>'phone') > 30 THEN RAISE EXCEPTION 'invalid input'; END IF;
  INSERT INTO public.donation_orders(name,email,phone,message,anonymous,amount_cents,frequency) VALUES(p_data->>'name',p_data->>'email',p_data->>'phone',p_data->>'message',(p_data->>'anonymous')::boolean,(p_data->>'amount_cents')::integer,p_data->>'frequency') RETURNING * INTO o;
 ELSE
  SELECT * INTO o FROM public.donation_orders WHERE id=(p_data->>'order_id')::uuid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'donation not found'; END IF;
  IF p_action = 'attach' OR p_action = 'paid' THEN
   UPDATE public.donation_orders SET stripe_session_id=COALESCE(p_data->>'session_id',stripe_session_id),subscription_id=COALESCE(p_data->>'subscription_id',subscription_id) WHERE id=o.id RETURNING * INTO o;
  END IF;
  IF p_action = 'paid' THEN
   IF (p_data->>'amount_cents')::integer <> o.amount_cents OR p_data->>'currency' <> 'usd' THEN RAISE EXCEPTION 'payment mismatch'; END IF;
   INSERT INTO public.donations(order_id,payment_id,amount_cents,currency,paid_at) VALUES(o.id,p_data->>'payment_id',(p_data->>'amount_cents')::integer,p_data->>'currency',to_timestamp((p_data->>'paid_at')::bigint)) ON CONFLICT(payment_id) DO NOTHING;
  ELSIF p_action <> 'attach' THEN RAISE EXCEPTION 'invalid action'; END IF;
 END IF;
 RETURN jsonb_build_object('id',o.id,'amount_cents',o.amount_cents,'frequency',o.frequency);
END; $$;
REVOKE ALL ON FUNCTION public.manage_donation(text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.manage_donation(text,text,jsonb) TO anon,authenticated,service_role;