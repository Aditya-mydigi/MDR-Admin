-- MDR Admin Panel database schema

-- Create database (run manually)
CREATE DATABASE mdr_admin_panel;

-- enum for user roles 
CREATE TYPE user_role AS ENUM ('admin', 'employee');

-- create table
CREATE TABLE public.mdr_panel_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mdr_id VARCHAR(15) UNIQUE,
  
  email VARCHAR(200) NOT NULL UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  
  phone1 VARCHAR(15),
  phone2 VARCHAR(15),
  
  role user_role NOT NULL DEFAULT 'employee',
  

  -- created_at symbolizes date of joining
  date_of_joining TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_mdr_id UNIQUE (mdr_id)
);

-- trigger func to auto update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- attach trigger to table 
CREATE TRIGGER trigger_update_mdr_panel_users_updated_at
BEFORE UPDATE ON public.mdr_panel_users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
