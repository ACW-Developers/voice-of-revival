CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE OR REPLACE FUNCTION public.record_ticket(p_secret text, p_session_id text, p_event_id uuid, p_quantity int, p_amount int, p_currency text, p_name text, p_email text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE t public.tickets; e record;
BEGIN
  IF encode(extensions.digest(p_secret, 'sha256'), 'hex') <> 'f99f47499a7c56683389f1855da21a1d7a22b9f7887cd434b7a1656127ce3f87' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT * INTO t FROM public.tickets WHERE stripe_session_id = p_session_id;
  IF NOT FOUND THEN
    INSERT INTO public.tickets(event_id, stripe_session_id, buyer_name, buyer_email, quantity, amount_cents, currency)
    VALUES (p_event_id, p_session_id, p_name, p_email, p_quantity, p_amount, p_currency)
    ON CONFLICT (stripe_session_id) DO NOTHING RETURNING * INTO t;
    IF t.id IS NOT NULL THEN
      UPDATE public.events SET tickets_sold = tickets_sold + p_quantity WHERE id = p_event_id;
    ELSE
      SELECT * INTO t FROM public.tickets WHERE stripe_session_id = p_session_id;
    END IF;
  END IF;
  SELECT title, starts_at, venue INTO e FROM public.events WHERE id = t.event_id;
  RETURN jsonb_build_object('ticket', to_jsonb(t), 'event', jsonb_build_object('title', e.title, 'starts_at', e.starts_at, 'venue', e.venue));
END $$;
REVOKE ALL ON FUNCTION public.record_ticket(text,text,uuid,int,int,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_ticket(text,text,uuid,int,int,text,text,text) TO anon, authenticated;