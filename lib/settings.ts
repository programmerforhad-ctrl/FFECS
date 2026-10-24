export const DEFAULT_NAME = "FREE FIRE E-SPORTS COMMUNITY SYLHET";

export type SettingField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "image";
  group: string;
  placeholder?: string;
};

export const SETTINGS_FIELDS: SettingField[] = [
  { group: "Basic", key: "community_name", label: "Community name", type: "text" },
  { group: "Basic", key: "tagline", label: "Tagline (shown on home hero)", type: "text" },
  { group: "Basic", key: "logo_url", label: "Logo", type: "image" },
  { group: "Basic", key: "hero_image_url", label: "Home hero background image", type: "image" },

  { group: "About", key: "about_text", label: "About us (full text)", type: "textarea" },
  { group: "About", key: "mission", label: "Mission", type: "textarea" },
  { group: "About", key: "founded", label: "Founded (year)", type: "text", placeholder: "2024" },

  { group: "Contact", key: "email", label: "Email", type: "text" },
  { group: "Contact", key: "phone", label: "Phone", type: "text", placeholder: "+8801XXXXXXXXX" },
  { group: "Contact", key: "whatsapp", label: "WhatsApp number", type: "text", placeholder: "8801XXXXXXXXX" },
  { group: "Contact", key: "address", label: "Address / Location", type: "text", placeholder: "Sylhet, Bangladesh" },

  {
    group: "Photo uploads (Google Drive)",
    key: "drive_upload_url",
    label: "Google Apps Script web app URL (photos uploaded in forms go to your Drive)",
    type: "text",
    placeholder: "https://script.google.com/macros/s/.../exec",
  },

  { group: "Social links", key: "facebook_page", label: "Facebook page URL", type: "text" },
  { group: "Social links", key: "facebook_group", label: "Facebook group URL", type: "text" },
  { group: "Social links", key: "discord", label: "Discord invite URL", type: "text" },
  { group: "Social links", key: "youtube", label: "YouTube channel URL", type: "text" },
  { group: "Social links", key: "instagram", label: "Instagram URL", type: "text" },
];
