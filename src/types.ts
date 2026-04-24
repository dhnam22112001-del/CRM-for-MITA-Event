export interface Customer {
  id: number;
  full_name: string;
  phone: string;
  email: string | null;
  company: string | null;
  position: string | null;
  status: 'new' | 'contacted' | 'converted' | 'lost';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerStats {
  total: number;
  new: number;
  contacted: number;
  converted: number;
}
