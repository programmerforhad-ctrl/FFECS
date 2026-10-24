// Photos uploaded in forms are sent to a Google Apps Script web app owned by the community,
// which saves them in the community's Google Drive. Nothing is stored in Supabase Storage.

const MAX_SIDE = 1600;
const MAX_INPUT_BYTES = 15 * 1024 * 1024;

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read the file."));
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("This image could not be opened. Try a JPG or PNG."));
    img.src = src;
  });
}

// Shrinks big phone photos (usually 3-8 MB) to ~200-500 KB so uploads are fast on mobile data.
async function toJpegBase64(file: File): Promise<string> {
  const img = await loadImage(await readAsDataUrl(file));
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser cannot process images.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
}

export function checkImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) return "Please choose a photo (JPG, PNG or WebP).";
  if (file.size > MAX_INPUT_BYTES) return "The photo is too large. Please choose one under 15 MB.";
  return null;
}

export async function uploadToDrive(scriptUrl: string, file: File, formTitle: string): Promise<string> {
  const data = await toJpegBase64(file);
  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";

  let res: Response;
  try {
    // text/plain avoids a CORS preflight, which Apps Script does not support.
    res = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ data, mime: "image/jpeg", name: `${baseName}.jpg`, folder: formTitle }),
    });
  } catch {
    throw new Error("Photo upload failed. Check your internet connection and try again.");
  }

  let json: { ok?: boolean; url?: string; error?: string } = {};
  try {
    json = await res.json();
  } catch {
    throw new Error("Photo upload failed (unexpected reply from the upload service).");
  }
  if (!json.ok || !json.url) throw new Error(json.error || "Photo upload failed.");
  return json.url;
}
