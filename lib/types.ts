export type Member = {
  id: string;
  name: string;
  position: string;
  bio: string | null;
  photo_url: string | null;
  facebook_url: string | null;
  sort_order: number;
};

export type EventItem = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  image_url: string | null;
  is_published: boolean;
};

export type Tournament = {
  id: string;
  title: string;
  description: string | null;
  status: "upcoming" | "live" | "completed";
  start_date: string | null;
  entry_fee: string | null;
  prize_pool: string | null;
  rules: string | null;
  banner_url: string | null;
  champion: string | null;
  result_summary: string | null;
  form_id: string | null;
  registration_end: string | null;
  portal_info: string | null;
  is_published: boolean;
  forms?: { slug: string; is_open: boolean } | null;
};

export type TeamStatus = "registered" | "selected" | "qualified" | "eliminated" | "disqualified";

export type Group = {
  id: string;
  tournament_id: string;
  name: string;
  max_teams: number;
  qualify_top: number | null;
  info: string | null;
};

export type Team = {
  id: string;
  tournament_id: string;
  response_id: string | null;
  team_name: string;
  captain_name: string | null;
  captain_uid: string;
  email: string;
  status: TeamStatus;
  group_id: string | null;
  disqualify_reason: string | null;
  evidence_url: string | null;
  admin_notes: string | null;
  created_at: string;
};

export type Match = {
  id: string;
  tournament_id: string;
  group_id: string | null;
  title: string;
  start_time: string;
  room_id: string | null;
  room_password: string | null;
  reveal_minutes_before: number;
  note: string | null;
};

// What the team portal receives from the team_login() database function
export type PortalMatch = {
  id: string;
  title: string;
  start_time: string;
  reveal_at: string;
  note: string | null;
  state: "waiting" | "open" | "finished";
  room_id: string | null;
  room_password: string | null;
};

export type PortalTeam = {
  team_id: string;
  team_name: string;
  status: TeamStatus;
  disqualify_reason: string | null;
  evidence_url: string | null;
  tournament: { id: string; title: string; status: string; start_date: string | null; portal_info: string | null };
  group: { name: string; info: string | null; qualify_top: number | null; max_teams: number; teams: string[] } | null;
  matches: PortalMatch[];
};

export type RoleKey = "team_name" | "captain_name" | "captain_uid";

export type Form = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  is_open: boolean;
  collect_email: boolean;
  deadline: string | null;
  max_responses: number | null;
  success_message: string;
  created_at: string;
};

export type QuestionType =
  | "short_text"
  | "long_text"
  | "number"
  | "phone"
  | "email"
  | "date"
  | "radio"
  | "checkbox"
  | "dropdown"
  | "file";

export type Question = {
  id: string;
  form_id: string;
  label: string;
  help_text: string | null;
  type: QuestionType;
  options: string[];
  required: boolean;
  role: RoleKey | null;
  sort_order: number;
};

export type Answer = {
  question_id: string;
  label: string;
  type?: string;
  value: string | string[];
};

export type FormResponse = {
  id: string;
  form_id: string;
  respondent_email: string | null;
  answers: Answer[];
  created_at: string;
};
