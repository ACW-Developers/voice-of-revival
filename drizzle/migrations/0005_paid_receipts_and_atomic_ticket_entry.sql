ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'paid';
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'paid';
CREATE TABLE public.payment_receipts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), access_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
 kind text NOT NULL CHECK(kind IN ('ticket','donation')), source_id uuid NOT NULL,
 status text NOT NULL DEFAULT 'paid', details jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(kind,source_id)
);
GRANT SELECT ON public.payment_receipts TO authenticated;
GRANT ALL ON public.payment_receipts TO service_role;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read payment receipts" ON public.payment_receipts FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE TABLE public.ticket_admissions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
 ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE RESTRICT,
 seat_number integer NOT NULL, redeemed_at timestamptz, redeemed_by uuid, UNIQUE(ticket_id,seat_number)
);
GRANT SELECT ON public.ticket_admissions TO authenticated;
GRANT ALL ON public.ticket_admissions TO service_role;
ALTER TABLE public.ticket_admissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read admissions" ON public.ticket_admissions FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE OR REPLACE FUNCTION public.generate_paid_receipt() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE snapshot jsonb;
BEGIN
 IF TG_TABLE_NAME='tickets' THEN
  SELECT to_jsonb(NEW) || jsonb_build_object('event',jsonb_build_object('id',e.id,'title',e.title,'starts_at',e.starts_at,'venue',e.venue)) INTO snapshot FROM public.events e WHERE e.id=NEW.event_id;
  INSERT INTO public.payment_receipts(kind,source_id,details) VALUES('ticket',NEW.id,snapshot) ON CONFLICT(kind,source_id) DO NOTHING;
  INSERT INTO public.ticket_admissions(ticket_id,seat_number) SELECT NEW.id,n FROM generate_series(1,NEW.quantity) n ON CONFLICT(ticket_id,seat_number) DO NOTHING;
 ELSE
  SELECT to_jsonb(NEW) || jsonb_build_object('donor',jsonb_build_object('name',CASE WHEN o.anonymous THEN 'Anonymous' ELSE o.name END,'email',o.email,'frequency',o.frequency)) INTO snapshot FROM public.donation_orders o WHERE o.id=NEW.order_id;
  INSERT INTO public.payment_receipts(kind,source_id,details) VALUES('donation',NEW.id,snapshot) ON CONFLICT(kind,source_id) DO NOTHING;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER ticket_paid_receipt AFTER INSERT ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.generate_paid_receipt();
CREATE TRIGGER donation_paid_receipt AFTER INSERT ON public.donations FOR EACH ROW EXECUTE FUNCTION public.generate_paid_receipt();
INSERT INTO public.payment_receipts(kind,source_id,details) SELECT 'ticket',t.id,to_jsonb(t)||jsonb_build_object('event',jsonb_build_object('id',e.id,'title',e.title,'starts_at',e.starts_at,'venue',e.venue)) FROM public.tickets t JOIN public.events e ON e.id=t.event_id ON CONFLICT(kind,source_id) DO NOTHING;
INSERT INTO public.ticket_admissions(ticket_id,seat_number) SELECT t.id,n FROM public.tickets t CROSS JOIN LATERAL generate_series(1,t.quantity) n ON CONFLICT(ticket_id,seat_number) DO NOTHING;
INSERT INTO public.payment_receipts(kind,source_id,details) SELECT 'donation',d.id,to_jsonb(d)||jsonb_build_object('donor',jsonb_build_object('name',CASE WHEN o.anonymous THEN 'Anonymous' ELSE o.name END,'email',o.email,'frequency',o.frequency)) FROM public.donations d JOIN public.donation_orders o ON o.id=d.order_id ON CONFLICT(kind,source_id) DO NOTHING;
CREATE OR REPLACE FUNCTION public.get_payment_receipt(p_token uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.payment_receipts; admissions jsonb;
BEGIN
 SELECT * INTO r FROM public.payment_receipts WHERE access_token=p_token;
 IF NOT FOUND THEN RETURN NULL; END IF;
 SELECT COALESCE(jsonb_agg(jsonb_build_object('token',a.token,'seat',a.seat_number,'redeemed_at',a.redeemed_at) ORDER BY a.seat_number),'[]'::jsonb) INTO admissions FROM public.ticket_admissions a WHERE r.kind='ticket' AND a.ticket_id=r.source_id;
 RETURN to_jsonb(r)||jsonb_build_object('admissions',admissions);
END $$;
REVOKE ALL ON FUNCTION public.get_payment_receipt(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_payment_receipt(uuid) TO anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.receipt_for_payment(p_secret text,p_kind text,p_payment_id text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE token uuid;
BEGIN
 IF NOT public.payment_recording_authorized(p_secret) THEN RAISE EXCEPTION 'forbidden'; END IF;
 SELECT r.access_token INTO token FROM public.payment_receipts r WHERE r.kind=p_kind AND r.source_id=CASE WHEN p_kind='ticket' THEN (SELECT id FROM public.tickets WHERE stripe_session_id=p_payment_id) ELSE (SELECT id FROM public.donations WHERE payment_id=p_payment_id) END;
 RETURN token;
END $$;
REVOKE ALL ON FUNCTION public.receipt_for_payment(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.receipt_for_payment(text,text,text) TO anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.validate_ticket_entry(p_token uuid,p_event_id uuid,p_redeem boolean DEFAULT false) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a public.ticket_admissions; t public.tickets; e public.events; state text;
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Administrator access required'; END IF;
 SELECT * INTO a FROM public.ticket_admissions WHERE token=p_token FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('status','invalid'); END IF;
 SELECT * INTO t FROM public.tickets WHERE id=a.ticket_id;
 IF t.event_id<>p_event_id THEN RETURN jsonb_build_object('status','wrong_event'); END IF;
 SELECT * INTO e FROM public.events WHERE id=t.event_id;
 IF t.payment_status<>'paid' THEN state:='void';
 ELSIF a.redeemed_at IS NOT NULL THEN state:='already_redeemed';
 ELSIF p_redeem THEN
  UPDATE public.ticket_admissions SET redeemed_at=now(),redeemed_by=auth.uid() WHERE id=a.id RETURNING * INTO a; state:='redeemed';
 ELSE state:='valid'; END IF;
 RETURN jsonb_build_object('status',state,'name',t.buyer_name,'email',t.buyer_email,'event',e.title,'seat',a.seat_number,'quantity',t.quantity,'code',t.ticket_code,'redeemed_at',a.redeemed_at);
END $$;
REVOKE ALL ON FUNCTION public.validate_ticket_entry(uuid,uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_ticket_entry(uuid,uuid,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.update_payment_status(p_secret text,p_payment_id text,p_status text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.payment_recording_authorized(p_secret) OR p_status NOT IN ('refunded','disputed','partially_refunded','paid') THEN RAISE EXCEPTION 'forbidden'; END IF;
 UPDATE public.tickets SET payment_status=p_status WHERE stripe_session_id=p_payment_id;
 UPDATE public.donations SET payment_status=p_status WHERE payment_id=p_payment_id;
 UPDATE public.payment_receipts SET status=p_status WHERE source_id IN (SELECT id FROM public.tickets WHERE stripe_session_id=p_payment_id UNION ALL SELECT id FROM public.donations WHERE payment_id=p_payment_id);
END $$;
REVOKE ALL ON FUNCTION public.update_payment_status(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_payment_status(text,text,text) TO anon,authenticated,service_role;
COMMENT ON TABLE public.payment_receipts IS 'Durable payment snapshots. Access tokens are private bearer links, not public IDs.';