// Node-only utils for Cloudinary Admin API
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  // Optional: throw early in dev
  console.warn("Cloudinary env missing: CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET");
}

/** Basic auth header for Cloudinary Admin API */
function adminAuthHeader() {
  const token = Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64");
  return { Authorization: `Basic ${token}` };
}

/** Check if a Cloudinary folder exists. Returns true if found, false if 404. */
export async function cloudinaryFolderExists(folderPath: string): Promise<boolean> {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/folders/${encodeURIComponent(folderPath)}`;
  const r = await fetch(url, { headers: adminAuthHeader() });
  if (r.status === 200) return true;
  if (r.status === 404) return false;
  const text = await r.text();
  throw new Error(`Cloudinary check failed (${r.status}): ${text}`);
}

/** Create a Cloudinary folder (idempotent-ish). Returns true if created, false if it already existed. */
export async function createCloudinaryFolder(folderPath: string): Promise<boolean> {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/folders/${encodeURIComponent(folderPath)}`;
  const r = await fetch(url, { method: "POST", headers: { ...adminAuthHeader(), "Content-Type": "application/json" } });
  if (r.status === 200) return true;       // created
  if (r.status === 409) return false;      // already exists (conflict)
  const text = await r.text();
  throw new Error(`Cloudinary create failed (${r.status}): ${text}`);
}

/** Ensure a folder exists: checks and creates if needed. */
export async function ensureCloudinaryFolder(folderPath: string): Promise<"exists" | "created"> {
  const exists = await cloudinaryFolderExists(folderPath);
  if (exists) return "exists";
  await createCloudinaryFolder(folderPath);
  return "created";
}
