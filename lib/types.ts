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
  is_published: boolean;
  forms?: { slug: string; is_open: boolean } | null;
};

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
