
CREATE TABLE IF NOT EXISTS public.customer_check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    check_out_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    store_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Optional: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_check_ins_customer_id ON public.customer_check_ins(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_check_ins_check_in_time ON public.customer_check_ins(check_in_time);
CREATE INDEX IF NOT EXISTS idx_customer_check_ins_check_out_time ON public.customer_check_ins(check_out_time);
CREATE INDEX IF NOT EXISTS idx_customer_check_ins_store_id ON public.customer_check_ins(store_id);

-- Optional: Add a function to calculate duration of stay
CREATE OR REPLACE FUNCTION calculate_stay_duration(check_in TIMESTAMP WITH TIME ZONE, check_out TIMESTAMP WITH TIME ZONE) 
RETURNS INTERVAL AS $$
BEGIN
    IF check_out IS NULL THEN
        RETURN now() - check_in;
    ELSE
        RETURN check_out - check_in;
    END IF;
END;
$$ LANGUAGE plpgsql;
