export interface Match {
  id: number;
  u: string;       // UTC ISO string: "2026-06-11T19:00Z"
  t1: string;      // Equipo 1
  f1: string;      // Bandera emoji equipo 1
  t2: string;      // Equipo 2
  f2: string;      // Bandera emoji equipo 2
  g: string;       // Grupo ("A"-"L") o "" para eliminatorias
  v: string;       // Estadio + ciudad
  s: number;       // Stage: 0=Grupos,1=R32,2=Octavos,3=Cuartos,4=Semi,5=3er,6=Final
  done: boolean;
  r?: string;      // Resultado "2-1" (solo si done=true)
}

export interface WatchlistEntry {
  id: string;
  user_id: string;
  match_id: number;
  google_event_id: string | null;
  starred_at: string;
}

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  timezone: string;
  created_at: string;
}
