export type ArtworkStatus = 'pending' | 'approved' | 'rejected';

export interface Artwork {
  id: string;
  title: string;
  description: string;
  artist_name: string;
  artist_bio: string;
  token_name: string;
  token_symbol: string;
  total_supply: number;
  contract_address: string | null;
  image_url: string;
  certificate_url: string | null;
  metadata_ipfs_hash: string | null;
  status: ArtworkStatus;
  submitted_by: string;
  reviewed_by: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
}

export interface User {
  id: string;
  wallet_address: string;
  email: string | null;
  role: 'artist' | 'admin' | 'user';
  is_verified: boolean;
  verification_docs: string[];
  total_submissions: number;
  approved_submissions: number;
  created_at: string;
  last_login: string | null;
}

export interface PriceSnapshot {
  id: string;
  contract_address: string;
  price_usd: number;
  price_bnb: number;
  volume_24h: number;
  liquidity_usd: number;
  snapshot_time: string;
}
