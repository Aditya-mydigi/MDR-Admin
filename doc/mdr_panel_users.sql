-- Enable UUID support
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enum
CREATE TYPE user_role AS ENUM ('admin', 'employee');

-- Table
CREATE TABLE public.mdr_panel_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    mdr_id VARCHAR(15) UNIQUE,

    email VARCHAR(200) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),

    phone1 VARCHAR(15) NOT NULL,
    phone2 VARCHAR(15),

    role user_role NOT NULL DEFAULT 'employee',

    date_of_joining TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_update_mdr_panel_users_updated_at
BEFORE UPDATE ON public.mdr_panel_users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

alter table public.mdr_panel_users
    add isActive BOOLEAN default true not null;