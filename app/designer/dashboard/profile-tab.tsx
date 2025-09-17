"use client";
import { useEffect, useState } from "react";

export const runtime = "edge"; //issue with cloudflare pages

type Me = {
  id: string;
  email?: string | null;
  name?: string | null;
  handle?: string | null;
  country?: string | null;
  image?: string | null;
  instagram?: string | null;
  behance?: string | null;
  dribbble?: string | null;
  website?: string | null;
  cloudinaryPublicId?: string | null;
};

type FieldKey = keyof Pick<Me, "name" | "handle" | "country" | "instagram" | "behance" | "dribbble" | "website" | "image">;

export default function ProfileTab() {
  const [me, setMe] = useState<Me | null>(null);
  const [editing, setEditing] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [draft, setDraft] = useState<Partial<Record<FieldKey, string>>>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  // load from DB
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (!res.ok) {
        setErr("Nie udało się pobrać profilu.");
        return;
      }
      const json = await res.json();
      setMe(json.me);
    })();
  }, []);

  const startEdit = (key: FieldKey) => {
    setEditing((e) => ({ ...e, [key]: true }));
    setDraft((d) => ({ ...d, [key]: (me as any)?.[key] ?? "" }));
  };

  const cancelEdit = (key: FieldKey) => {
    setEditing((e) => ({ ...e, [key]: false }));
  };

  const saveField = async (key: FieldKey) => {
    setLoading(true);
    setErr("");
    try {
      const payload: Record<string, any> = { [key]: draft[key] ?? null };
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "same-origin",
      });
      const text = await res.text();
      let json: any = {};
      try { json = JSON.parse(text); } catch { }
      if (!res.ok) {
        setErr(json?.error || `Błąd zapisu (HTTP ${res.status})`);
      } else {
        setMe((m) => (m ? { ...m, [key]: draft[key] ?? null } : m));
        setEditing((e) => ({ ...e, [key]: false }));
      }
    } catch {
      setErr("Błąd sieci.");
    } finally {
      setLoading(false);
    }
  };

  if (!me) {
    return <div className="text-sm text-gray-600">Loading Profile… {err && <span className="text-red-600">{err}</span>}</div>;
  }

  return (
    <div className="space-y-5 text-black border border-black/20 rounded-2xl bg-white/5 p-6 backdrop-blur">
      <Header image={me.image} handle={me.handle} email={me.email} />
      {err && <p className="text-sm text-red-600">{err}</p>}

      <Field
        label="Imię i nazwisko"
        value={me.name}
        editing={!!editing.name}
        onEdit={() => startEdit("name")}
        onCancel={() => cancelEdit("name")}
        onSave={() => saveField("name")}
        loading={loading}
        input={<Input value={draft.name ?? ""} onChange={(v) => setDraft(d => ({ ...d, name: v }))} placeholder="np. Anna Kowalska" />}
      />

      <Field
        label="Nick (handle)"
        value={me.handle}
        hint="Dozwolone: litery/cyfry/._ (2–30)."
        editing={!!editing.handle}
        onEdit={() => startEdit("handle")}
        onCancel={() => cancelEdit("handle")}
        onSave={() => saveField("handle")}
        loading={loading}
        input={<Input value={draft.handle ?? ""} onChange={(v) => setDraft(d => ({ ...d, handle: v }))} placeholder="np. janek.design" />}
      />

      <Field
        label="Kraj"
        value={me.country}
        editing={!!editing.country}
        onEdit={() => startEdit("country")}
        onCancel={() => cancelEdit("country")}
        onSave={() => saveField("country")}
        loading={loading}
        input={<Input value={draft.country ?? ""} onChange={(v) => setDraft(d => ({ ...d, country: v }))} placeholder="np. Polska" />}
      />

      <Divider title="Linki społecznościowe" />

      <Field
        label="Instagram"
        value={me.instagram}
        editing={!!editing.instagram}
        onEdit={() => startEdit("instagram")}
        onCancel={() => cancelEdit("instagram")}
        onSave={() => saveField("instagram")}
        loading={loading}
        input={<Input value={draft.instagram ?? ""} onChange={(v) => setDraft(d => ({ ...d, instagram: v }))} placeholder="https://instagram.com/twoj_profil" />}
      />

      <Field
        label="Behance"
        value={me.behance}
        editing={!!editing.behance}
        onEdit={() => startEdit("behance")}
        onCancel={() => cancelEdit("behance")}
        onSave={() => saveField("behance")}
        loading={loading}
        input={<Input value={draft.behance ?? ""} onChange={(v) => setDraft(d => ({ ...d, behance: v }))} placeholder="https://www.behance.net/..." />}
      />

      <Field
        label="Dribbble"
        value={me.dribbble}
        editing={!!editing.dribbble}
        onEdit={() => startEdit("dribbble")}
        onCancel={() => cancelEdit("dribbble")}
        onSave={() => saveField("dribbble")}
        loading={loading}
        input={<Input value={draft.dribbble ?? ""} onChange={(v) => setDraft(d => ({ ...d, dribbble: v }))} placeholder="https://dribbble.com/..." />}
      />

      <Field
        label="Strona WWW"
        value={me.website}
        editing={!!editing.website}
        onEdit={() => startEdit("website")}
        onCancel={() => cancelEdit("website")}
        onSave={() => saveField("website")}
        loading={loading}
        input={<Input value={draft.website ?? ""} onChange={(v) => setDraft(d => ({ ...d, website: v }))} placeholder="https://twoja-strona.com" />}
      />
    </div>
  );
}

/* ——— UI bits ——— */

function Header({ image, handle, email }: { image?: string | null; handle?: string | null; email?: string | null; }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
        {image ? <img src={image} alt="avatar" className="w-full h-full object-cover" /> : null}
      </div>
      <div>
        <div className="font-semibold text-lg">{handle || email}</div>
        <div className="text-sm text-gray-600">{email}</div>
      </div>
    </div>
  );
}

function Divider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs text-gray-500">{title}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      className="w-full border rounded px-3 py-2"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function Field(props: {
  label: string;
  value?: string | null;
  hint?: string;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  loading: boolean;
  input: React.ReactNode;
}) {
  const { label, value, hint, editing, onEdit, onCancel, onSave, loading, input } = props;

  return (
    <div className="border rounded-xl p-3">
      <div className="flex items-center justify-between text-black">
        <div className="font-medium">{label}</div>
        {!editing && (
          <button onClick={onEdit} className="text-sm underline underline-offset-2 text-black hover:text-gray-700">
            {value ? "Edit" : "Add"}
          </button>
        )}
      </div>

      {!editing ? (
        <div className="text-sm text-gray-700 mt-1">{value || <span className="text-gray-400">brak</span>}</div>
      ) : (
        <div className="mt-2 space-y-2">
          {input}
          {hint && <p className="text-xs text-gray-500">{hint}</p>}
          <div className="flex gap-2">
            <button onClick={onSave} disabled={loading} className="px-3 py-2 rounded bg-black text-white text-sm disabled:opacity-60">
              Save
            </button>
            <button onClick={onCancel} className="px-3 py-2 rounded border  bg-black text-white text-sm disabled:opacity-60">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
