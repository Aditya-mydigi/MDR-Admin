export type mdrPanelUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: "admin" | "employee";
  phone1: string | null;
  phone2?: string | null;
  mdr_id?: string | null;
  isactive: boolean;
  date_of_joining?: string | null;
  updated_at?: string | null;
};
