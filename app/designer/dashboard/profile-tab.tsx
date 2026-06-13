"use client";

import { useEffect, useState } from "react";

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
};

type FieldKey = keyof Pick<
  Me,
  "name" | "handle" | "country" | "instagram" | "behance" | "dribbble" | "website" | "image"
>;

export default function ProfileTab() {
  const [me, setMe] = useState<Me | null>(null);
  const [editing, setEditing] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [draft, setDraft] = useState<Partial<Record<FieldKey, string>>>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setMe(j.me))
      .catch(() => setErr("Could not load profile."));
  }, []);

  const startEdit = (key: FieldKey) => {
    setEditing((e) => ({ ...e, [key]: true }));
    setDraft((d) => ({ ...d, [key]: (me as any)?.[key] ?? "" }));
  };
  const cancelEdit = (key: FieldKey) => setEditing((e) => ({ ...e, [key]: false }));

  const saveField = async (key: FieldKey) => {
    setSaving(true);
    setErr("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: draft[key] ?? null }),
        credentials: "same-origin",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(json?.error || `Save failed (${res.status})`);
      } else {
        setMe((m) => (m ? { ...m, [key]: draft[key] ?? null } : m));
        setEditing((e) => ({ ...e, [key]: false }));
      }
    } catch {
      setErr("Network error.");
    } finally {
      setSaving(false);
    }
  };

  if (!me) {
    return (
      <div className="flex items-center gap-3 text-white/40 text-sm py-8">
        <Spinner />
        {err || "Loading profile…"}
      </div>
    );
  }

  const initials = (me.name || me.handle || me.email || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-7">
      {/* Avatar row */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-gradient-to-br from-violet-600/40 to-fuchsia-600/40 border border-white/10 grid place-items-center">
          {me.image ? (
            <img src={me.image} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg font-bold text-white/70 select-none">{initials}</span>
          )}
        </div>
        <div>
          <div className="font-semibold text-white text-lg leading-tight">{me.handle || me.name || "—"}</div>
          <div className="text-sm text-white/40 mt-0.5">{me.email}</div>
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/8 text-red-300 text-sm px-4 py-3">
          {err}
        </div>
      )}

      {/* Basic info */}
      <section className="space-y-3">
        <SectionLabel>Identity</SectionLabel>
        <ProfileField label="Full name"    fieldKey="name"    me={me} editing={editing} draft={draft} saving={saving}
          placeholder="e.g. Anna Kowalska" onEdit={startEdit} onCancel={cancelEdit} onSave={saveField} setDraft={setDraft} />
        <ProfileField label="Handle"       fieldKey="handle"  me={me} editing={editing} draft={draft} saving={saving}
          placeholder="e.g. anna.design" hint="Letters, numbers, . _ · 2–30 chars."
          onEdit={startEdit} onCancel={cancelEdit} onSave={saveField} setDraft={setDraft} />
        <ProfileField label="Country"      fieldKey="country" me={me} editing={editing} draft={draft} saving={saving}
          placeholder="e.g. Poland" onEdit={startEdit} onCancel={cancelEdit} onSave={saveField} setDraft={setDraft} />
      </section>

      {/* Social links */}
      <section className="space-y-3">
        <SectionLabel>Social & Portfolio</SectionLabel>
        <ProfileField label="Instagram" fieldKey="instagram" me={me} editing={editing} draft={draft} saving={saving}
          placeholder="https://instagram.com/your_handle" onEdit={startEdit} onCancel={cancelEdit} onSave={saveField} setDraft={setDraft} />
        <ProfileField label="Behance"   fieldKey="behance"   me={me} editing={editing} draft={draft} saving={saving}
          placeholder="https://www.behance.net/…" onEdit={startEdit} onCancel={cancelEdit} onSave={saveField} setDraft={setDraft} />
        <ProfileField label="Dribbble"  fieldKey="dribbble"  me={me} editing={editing} draft={draft} saving={saving}
          placeholder="https://dribbble.com/…" onEdit={startEdit} onCancel={cancelEdit} onSave={saveField} setDraft={setDraft} />
        <ProfileField label="Website"   fieldKey="website"   me={me} editing={editing} draft={draft} saving={saving}
          placeholder="https://your-site.com" onEdit={startEdit} onCancel={cancelEdit} onSave={saveField} setDraft={setDraft} />
      </section>
    </div>
  );
}

/* ── sub-components ── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <p className="text-[11px] tracking-[0.18em] uppercase text-white/30 font-medium">{children}</p>
      <div className="flex-1 h-px bg-white/8" />
    </div>
  );
}

function ProfileField({
  label, fieldKey, me, editing, draft, saving, placeholder, hint,
  onEdit, onCancel, onSave, setDraft,
}: {
  label: string;
  fieldKey: FieldKey;
  me: Me;
  editing: Partial<Record<FieldKey, boolean>>;
  draft: Partial<Record<FieldKey, string>>;
  saving: boolean;
  placeholder?: string;
  hint?: string;
  onEdit: (k: FieldKey) => void;
  onCancel: (k: FieldKey) => void;
  onSave: (k: FieldKey) => void;
  setDraft: React.Dispatch<React.SetStateAction<Partial<Record<FieldKey, string>>>>;
}) {
  const isEditing = !!editing[fieldKey];
  const value = (me as any)[fieldKey] as string | null | undefined;

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-white/40 uppercase tracking-wider font-medium">{label}</span>
        {!isEditing && (
          <button
            onClick={() => onEdit(fieldKey)}
            className="text-xs text-white/30 hover:text-white/70 transition-colors px-2 py-1 rounded-lg hover:bg-white/8"
          >
            {value ? "Edit" : "Add"}
          </button>
        )}
      </div>

      {!isEditing ? (
        <div className="mt-1.5 text-sm text-white/70">
          {value || <span className="text-white/20 italic">not set</span>}
        </div>
      ) : (
        <div className="mt-2.5 space-y-2">
          <input
            className="w-full bg-white/[0.05] border border-white/12 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors"
            value={draft[fieldKey] ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, [fieldKey]: e.target.value }))}
            placeholder={placeholder}
            autoFocus
          />
          {hint && <p className="text-xs text-white/30">{hint}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => onSave(fieldKey)}
              disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-white text-black text-xs font-medium hover:bg-white/90 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => onCancel(fieldKey)}
              className="px-4 py-1.5 rounded-lg border border-white/15 text-white/60 text-xs hover:text-white hover:border-white/30 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-block w-4 h-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
  );
}
