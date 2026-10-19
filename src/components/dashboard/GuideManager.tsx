"use client";

import { useEffect, useRef, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { formatDate, formatTime, fullName, imageSrc } from "@/lib/format";
import { GUIDE_AUDIENCE_LABEL, GUIDE_ICONS } from "@/lib/guides";
import { CROP } from "@/lib/imageTools";
import type { GuideAudience, GuideIcon, GuideSection, GuideSectionInput, GuideStep, GuideStepInput } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { GuideContact } from "../GuideContact";
import { IconChevronDown, IconPencil, IconPlus, IconTrash } from "../Icons";
import { ConfirmDialog, Modal } from "../Modal";
import { RichText } from "../RichText";
import { useToast } from "../Toast";
import { EmptyState, ImagePicker, Loading, Thumb } from "../ui";
import { ROLE_LABEL } from "./UserAccounts";
import styles from "./dashboard.module.css";
import local from "./GuideManager.module.css";
import { Button, buttonVariants } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import { Badge } from "@/components/shadcn/badge";
import { Alert } from "@/components/shadcn/alert";

const TOKENS = { "kontak-admin": <GuideContact /> };
const AUDIENCES = Object.keys(GUIDE_AUDIENCE_LABEL) as GuideAudience[];
const COLORS = ["#ea7b25", "#0e3c69", "#13a10e", "#1aa5d9", "#e53030", "#4a4a4a"];

/**
 * Snippets the template bar inserts. `pick`: the part selected afterwards, so typing replaces the example value.
 * Buttons are drawn by RichTextButton ({email: …}, {whatsapp: …} …).
 */
const SNIPPETS: { label: string; title: string; text: string; pick?: string; wrap?: [string, string]; ownLine?: boolean }[] = [
  { label: "Tebal", title: "Teks tebal: **teks**", text: "**teks tebal**", pick: "teks tebal", wrap: ["**", "**"] },
  { label: "Tautan", title: "Tautan teks: [teks](/alamat)", text: "[teks tautan](/register)", pick: "teks tautan" },
  { label: "Daftar", title: "Baris daftar berpoin", text: "- poin", pick: "poin", ownLine: true },
  { label: "Email", title: "Tombol email: {email: alamat}", text: "{email: nama@contoh.com}", pick: "nama@contoh.com" },
  { label: "WhatsApp", title: "Tombol WhatsApp: {whatsapp: nomor | teks tombol | pesan awal}", text: "{whatsapp: 08xxxxxxxxxx | Chat Admin | Halo, saya mau bertanya}", pick: "08xxxxxxxxxx" },
  { label: "Telepon", title: "Tombol telepon: {telepon: nomor}", text: "{telepon: 08xxxxxxxxxx}", pick: "08xxxxxxxxxx" },
  { label: "Instagram", title: "Tombol Instagram: {instagram: @akun}", text: "{instagram: @namaakun}", pick: "@namaakun" },
  { label: "Facebook", title: "Tombol Facebook: {facebook: nama halaman atau tautan}", text: "{facebook: namahalaman}", pick: "namahalaman" },
  { label: "Lokasi", title: "Tombol lokasi: {lokasi: tautan Google Maps | teks tombol}", text: "{lokasi: https://maps.app.goo.gl/... | Lihat Lokasi}", pick: "https://maps.app.goo.gl/..." },
  { label: "Tombol", title: "Tombol ke halaman / tautan: {tombol: /alamat | teks tombol}", text: "{tombol: /register | Daftar Sekarang}", pick: "/register" },
  { label: "Kontak Admin", title: "WhatsApp & email administrator dari pengaturan situs", text: "{{kontak-admin}}", ownLine: true },
];

/**
 * A text box of Kelola Panduan with a template bar (bold, link, list and the button templates) that inserts at the
 * cursor, the writing rules, and a preview of the result.
 */
function GuideTextField({
  label,
  value,
  onChange,
  rows,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
  maxLength: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const insert = (snip: (typeof SNIPPETS)[number]) => {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const selected = value.slice(start, end);
    let text = snip.wrap && selected ? `${snip.wrap[0]}${selected}${snip.wrap[1]}` : snip.text;
    // A list line or the contact block needs a line of its own
    if (snip.ownLine) {
      const before = value.slice(0, start);
      if (before && !before.endsWith("\n")) text = `${snip.label === "Daftar" ? "\n" : "\n\n"}${text}`;
      if (snip.label !== "Daftar") text += "\n\n";
    }
    const next = value.slice(0, start) + text + value.slice(end);
    if (next.length > maxLength) return;
    onChange(next);
    // Select the example value, so typing replaces it
    const offset = snip.pick && !(snip.wrap && selected) ? text.indexOf(snip.pick) : -1;
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      if (offset >= 0) el.setSelectionRange(start + offset, start + offset + snip.pick!.length);
      else el.setSelectionRange(start + text.length, start + text.length);
    });
  };

  return (
    <div className="field">
      <span className="label">{label}</span>
      <div className={local.templateBar} role="toolbar" aria-label={`Sisipkan ke ${label.toLowerCase()}`}>
        {SNIPPETS.map((snip) => (
          <button key={snip.label} type="button" className={local.templateButton} title={snip.title} onClick={() => insert(snip)}>
            {snip.label}
          </button>
        ))}
      </div>
      <Textarea ref={ref} rows={rows} value={value} maxLength={maxLength} aria-label={label} onChange={(e) => onChange(e.target.value)} />
      <p className={local.help}>
        Baris kosong = paragraf baru · <code>- </code> di awal baris = daftar · tombol: <code>{"{jenis: nilai | teks tombol}"}</code> dengan jenis{" "}
        <code>email</code>, <code>whatsapp</code>, <code>telepon</code>, <code>instagram</code>, <code>facebook</code>, <code>lokasi</code>, <code>tombol</code>.
        Template yang salah (mis. email tidak valid) tampil sebagai teks biasa.
      </p>
      {value.trim() && (
        <div className={local.textBox}>
          <span className={local.boxLabel}>Pratinjau</span>
          <RichText text={value} tokens={TOKENS} className={local.rich} />
        </div>
      )}
    </div>
  );
}

/** Swaps item i with its neighbour (dir -1 = up, 1 = down) */
function moved<T>(list: T[], i: number, dir: -1 | 1) {
  const next = [...list];
  [next[i], next[i + dir]] = [next[i + dir], next[i]];
  return next;
}

type Confirm = { title: string; message: React.ReactNode; action: () => Promise<void> };

/**
 * "Kelola Panduan" (superadmin, disnakertrans, admin): the help pages' topics and their numbered steps, each step with
 * a picture for wide screens and one for phones. Every change shows on /panduan and in the sellers' Bantuan at once;
 * replaced or removed pictures are deleted from the server.
 */
export function GuideManager() {
  const toast = useToast();
  const { data, loading, error } = useAsync(() => api.guides.list(), []);
  const [sections, setSections] = useState<GuideSection[]>([]);
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [sectionForm, setSectionForm] = useState<GuideSection | "new" | null>(null);
  const [stepForm, setStepForm] = useState<{ section: GuideSection; step: GuideStep | null } | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) setSections(data.data);
  }, [data]);

  const replace = (s: GuideSection) => setSections((list) => list.map((x) => (x.id === s.id ? s : x)));
  const toggle = (id: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const attempt = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      toast.error("Gagal", errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const moveSection = (i: number, dir: -1 | 1) =>
    attempt(async () => {
      const next = moved(sections, i, dir);
      setSections(next);
      setSections((await api.guides.reorder(next.map((s) => s.id))).data);
    });

  const moveStep = (section: GuideSection, i: number, dir: -1 | 1) =>
    attempt(async () => {
      const steps = moved(section.steps, i, dir);
      replace({ ...section, steps });
      replace((await api.guides.reorderSteps(section.id, steps.map((s) => s.id))).data);
    });

  const pictureCount = (steps: GuideStep[]) => steps.reduce((n, s) => n + (s.desktopImage ? 1 : 0) + (s.mobileImage ? 1 : 0), 0);

  if (loading && !data) return <Loading />;
  if (error) return <Alert variant="destructive">{error}</Alert>;

  return (
    <>
      <div className={`${styles.toolbar} ${local.toolbar}`}>
        <p className="muted">
          {sections.length} topik · urutan di sini sama dengan urutan di halaman Panduan. Perubahan langsung tampil di situs.
        </p>
        <span className={styles.toolbarSpacer} />
        <a href="/panduan" target="_blank" rel="noreferrer" className={buttonVariants({ variant: "light", size: "sm" })}>
          Lihat Halaman Panduan
        </a>
        <Button type="button" size="sm" onClick={() => setSectionForm("new")}>
          <IconPlus /> Tambah Topik
        </Button>
      </div>

      {sections.length === 0 ? (
        <div className={styles.panel}>
          <EmptyState title="Belum ada topik panduan">Klik Tambah Topik untuk membuat yang pertama.</EmptyState>
        </div>
      ) : (
        <div className={local.list}>
          {sections.map((s, i) => {
            const { Icon } = GUIDE_ICONS[s.icon] ?? GUIDE_ICONS.docs;
            const isOpen = open.has(s.id);
            return (
              <article key={s.id} className={local.section}>
                <header className={local.head}>
                  <span className={local.icon} style={{ color: s.color }}>
                    <Icon />
                  </span>
                  <button type="button" className={local.title} onClick={() => toggle(s.id)} aria-expanded={isOpen}>
                    <strong>
                      {i + 1}. {s.title}
                    </strong>
                    {s.summary && <span>{s.summary}</span>}
                    <span className={local.badges}>
                      {s.audience.map((a) => (
                        <Badge key={a} variant="outline">
                          {a === "public" ? "Panduan publik" : "Bantuan penjual"}
                        </Badge>
                      ))}
                      <Badge variant="outline">{s.steps.length} langkah</Badge>
                    </span>
                  </button>
                  <span className={local.actions}>
                    <Button type="button" variant="light" size="icon" aria-label="Pindah ke atas" disabled={busy || i === 0} onClick={() => moveSection(i, -1)}>
                      <IconChevronDown className={local.up} />
                    </Button>
                    <Button type="button" variant="light" size="icon" aria-label="Pindah ke bawah" disabled={busy || i === sections.length - 1} onClick={() => moveSection(i, 1)}>
                      <IconChevronDown />
                    </Button>
                    <Button type="button" variant="blue" size="sm" onClick={() => setSectionForm(s)}>
                      <IconPencil /> Ubah
                    </Button>
                    <Button
                      type="button"
                      variant="red"
                      size="sm"
                      onClick={() =>
                        setConfirm({
                          title: "Hapus Topik",
                          message: (
                            <>
                              Topik <strong>{s.title}</strong> beserta {s.steps.length} langkah dan {pictureCount(s.steps)} gambarnya akan dihapus
                              permanen (gambar juga dihapus dari server).
                            </>
                          ),
                          action: async () => {
                            await api.guides.remove(s.id);
                            setSections((list) => list.filter((x) => x.id !== s.id));
                            toast.success("Topik dihapus");
                          },
                        })
                      }
                    >
                      <IconTrash /> Hapus
                    </Button>
                  </span>
                </header>

                {isOpen && (
                  <div className={local.body}>
                    {s.intro && (
                      <div className={local.textBox}>
                        <span className={local.boxLabel}>Teks pembuka</span>
                        <RichText text={s.intro} tokens={TOKENS} className={local.rich} />
                      </div>
                    )}
                    {s.steps.length > 0 && (
                      <ol className={local.steps}>
                        {s.steps.map((st, j) => (
                          <li key={st.id} className={local.step}>
                            <span className={local.num}>{j + 1}</span>
                            <RichText text={st.body} className={`${local.rich} ${local.clamp}`} />
                            <span className={local.thumbs}>
                              <figure>
                                {st.desktopImage ? (
                                  <Thumb zoom src={imageSrc(st.desktopImage)} alt={st.imageAlt ?? "Gambar desktop"} className={local.thumbDesktop} />
                                ) : (
                                  <span className={`${local.thumbDesktop} ${local.none}`}>—</span>
                                )}
                                <figcaption>Desktop</figcaption>
                              </figure>
                              <figure>
                                {st.mobileImage ? (
                                  <Thumb zoom src={imageSrc(st.mobileImage)} alt={st.imageAlt ?? "Gambar HP"} className={local.thumbMobile} />
                                ) : (
                                  <span className={`${local.thumbMobile} ${local.none}`}>—</span>
                                )}
                                <figcaption>HP</figcaption>
                              </figure>
                            </span>
                            <span className={local.stepActions}>
                              <Button type="button" variant="light" size="icon" aria-label="Langkah ke atas" disabled={busy || j === 0} onClick={() => moveStep(s, j, -1)}>
                                <IconChevronDown className={local.up} />
                              </Button>
                              <Button type="button" variant="light" size="icon" aria-label="Langkah ke bawah" disabled={busy || j === s.steps.length - 1} onClick={() => moveStep(s, j, 1)}>
                                <IconChevronDown />
                              </Button>
                              <Button type="button" variant="blue" size="icon" aria-label="Ubah langkah" onClick={() => setStepForm({ section: s, step: st })}>
                                <IconPencil />
                              </Button>
                              <Button
                                type="button"
                                variant="red"
                                size="icon"
                                aria-label="Hapus langkah"
                                onClick={() =>
                                  setConfirm({
                                    title: "Hapus Langkah",
                                    message: `Langkah ${j + 1} dari topik "${s.title}" ${pictureCount([st]) ? `dan ${pictureCount([st])} gambarnya ` : ""}akan dihapus permanen${pictureCount([st]) ? " (gambar juga dihapus dari server)" : ""}.`,
                                    action: async () => {
                                      replace((await api.guides.removeStep(s.id, st.id)).data);
                                      toast.success("Langkah dihapus");
                                    },
                                  })
                                }
                              >
                                <IconTrash />
                              </Button>
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}
                    <div>
                      <Button type="button" variant="green" size="sm" onClick={() => setStepForm({ section: s, step: null })}>
                        <IconPlus /> Tambah Langkah
                      </Button>
                    </div>
                    {s.outro && (
                      <div className={local.textBox}>
                        <span className={local.boxLabel}>Teks penutup</span>
                        <RichText text={s.outro} tokens={TOKENS} className={local.rich} />
                      </div>
                    )}
                    <small className="muted">
                      Alamat: /panduan#{s.slug} · Terakhir diubah {formatDate(s.updatedAt)} {formatTime(s.updatedAt)}
                      {s.editor ? ` oleh ${fullName(s.editor)} (${ROLE_LABEL[s.editor.role]})` : ""}
                    </small>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {sectionForm && (
        <SectionForm
          section={sectionForm === "new" ? null : sectionForm}
          onClose={() => setSectionForm(null)}
          onSaved={(s, created) => {
            if (created) {
              setSections((list) => [...list, s]);
              setOpen((prev) => new Set(prev).add(s.id));
            } else replace(s);
            setSectionForm(null);
            toast.success(created ? "Topik ditambahkan" : "Topik disimpan");
          }}
        />
      )}
      {stepForm && (
        <StepForm
          section={stepForm.section}
          step={stepForm.step}
          onClose={() => setStepForm(null)}
          onSaved={(s) => {
            replace(s);
            setStepForm(null);
            toast.success(stepForm.step ? "Langkah disimpan" : "Langkah ditambahkan");
          }}
        />
      )}
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title ?? ""}
        message={confirm?.message ?? ""}
        danger
        busy={busy}
        confirmLabel="Hapus"
        onConfirm={() =>
          confirm &&
          attempt(async () => {
            await confirm.action();
            setConfirm(null);
          })
        }
        onClose={() => setConfirm(null)}
      />
    </>
  );
}

/** Add or edit a topic: title, summary, icon, colour, where it is shown, and the texts before / after the steps. */
function SectionForm({
  section,
  onClose,
  onSaved,
}: {
  section: GuideSection | null;
  onClose: () => void;
  onSaved: (s: GuideSection, created: boolean) => void;
}) {
  const [form, setForm] = useState({
    title: section?.title ?? "",
    summary: section?.summary ?? "",
    icon: (section?.icon ?? "docs") as GuideIcon,
    color: section?.color ?? COLORS[0],
    audience: section?.audience ?? (["public"] as GuideAudience[]),
    intro: section?.intro ?? "",
    outro: section?.outro ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const { Icon } = GUIDE_ICONS[form.icon];

  const save = async () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Judul wajib diisi";
    if (!form.audience.length) e.audience = "Pilih minimal satu tempat tampil";
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    const input: GuideSectionInput = { ...form, title: form.title.trim(), summary: form.summary.trim() };
    try {
      const { data } = section ? await api.guides.update(section.id, input) : await api.guides.create(input);
      onSaved(data, !section);
    } catch (err) {
      setErrors({ form: errorMessage(err) });
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      wide
      title={section ? "Ubah Topik" : "Tambah Topik"}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="light" onClick={onClose} disabled={busy}>
            Batal
          </Button>
          <Button type="button" onClick={save} disabled={busy}>
            {busy ? "Menyimpan..." : "Simpan Topik"}
          </Button>
        </>
      }
    >
      <div className={local.form}>
        <label className="field">
          <span className="label">Judul</span>
          <Input value={form.title} maxLength={120} onChange={(e) => set("title", e.target.value)} placeholder="Contoh: Cara Mendaftar sebagai Penjual" />
          {errors.title && <span className="field-error">{errors.title}</span>}
        </label>
        <label className="field">
          <span className="label">Ringkasan (di bawah judul)</span>
          <Input value={form.summary} maxLength={255} onChange={(e) => set("summary", e.target.value)} />
        </label>
        <div className={local.row}>
          <label className="field">
            <span className="label">Ikon</span>
            <span className={local.iconPick}>
              <span className={local.iconPreview} style={{ color: form.color }}>
                <Icon />
              </span>
              <select className={local.select} value={form.icon} onChange={(e) => set("icon", e.target.value as GuideIcon)}>
                {(Object.keys(GUIDE_ICONS) as GuideIcon[]).map((k) => (
                  <option key={k} value={k}>
                    {GUIDE_ICONS[k].label}
                  </option>
                ))}
              </select>
            </span>
          </label>
          <div className="field">
            <span className="label">Warna ikon</span>
            <span className={local.colors}>
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`${local.swatch} ${form.color === c ? local.swatchOn : ""}`}
                  style={{ background: c }}
                  aria-label={`Warna ${c}`}
                  aria-pressed={form.color === c}
                  onClick={() => set("color", c)}
                />
              ))}
              <input type="color" className={local.colorInput} value={form.color} onChange={(e) => set("color", e.target.value)} aria-label="Warna lain" />
            </span>
          </div>
        </div>
        <fieldset className="field">
          <span className="label">Tampil di</span>
          {AUDIENCES.map((a) => (
            <label key={a} className={local.check}>
              <input
                type="checkbox"
                checked={form.audience.includes(a)}
                onChange={(e) => set("audience", e.target.checked ? [...form.audience, a] : form.audience.filter((x) => x !== a))}
              />
              {GUIDE_AUDIENCE_LABEL[a]}
            </label>
          ))}
          {errors.audience && <span className="field-error">{errors.audience}</span>}
        </fieldset>
        <GuideTextField label="Teks pembuka (opsional, sebelum langkah-langkah)" rows={4} maxLength={5000} value={form.intro} onChange={(v) => set("intro", v)} />
        <GuideTextField label="Teks penutup (opsional, setelah langkah-langkah)" rows={4} maxLength={5000} value={form.outro} onChange={(v) => set("outro", v)} />
        {errors.form && <Alert variant="destructive">{errors.form}</Alert>}
      </div>
    </Modal>
  );
}

type Picture = { file?: File; preview?: string; remove?: boolean };

/** Add or edit a step: its text, and a desktop and an HP picture (each optional). */
function StepForm({
  section,
  step,
  onClose,
  onSaved,
}: {
  section: GuideSection;
  step: GuideStep | null;
  onClose: () => void;
  onSaved: (s: GuideSection) => void;
}) {
  const [body, setBody] = useState(step?.body ?? "");
  const [alt, setAlt] = useState(step?.imageAlt ?? "");
  const [desktop, setDesktop] = useState<Picture>({});
  const [mobile, setMobile] = useState<Picture>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const shown = (p: Picture, current: GuideStep["desktopImage"]) => p.preview ?? (p.remove || !current ? null : imageSrc(current));

  /** Uploads a newly picked picture (its id), null to remove the current one, undefined = unchanged */
  const resolve = async (p: Picture, label: string, uploaded: number[]) => {
    if (p.file) {
      setBusy(`Mengunggah gambar ${label}...`);
      const { data } = await api.images.upload(p.file, alt.trim() || undefined);
      uploaded.push(data.id);
      return data.id;
    }
    return p.remove ? null : undefined;
  };

  const save = async () => {
    if (!body.trim()) return setError("Teks langkah wajib diisi");
    setError(null);
    const uploaded: number[] = [];
    try {
      const desktopImageId = await resolve(desktop, "desktop", uploaded);
      const mobileImageId = await resolve(mobile, "HP", uploaded);
      setBusy("Menyimpan...");
      const input: GuideStepInput = {
        body: body.trim(),
        imageAlt: alt.trim() || null,
        ...(desktopImageId !== undefined && { desktopImageId }),
        ...(mobileImageId !== undefined && { mobileImageId }),
      };
      const { data } = step ? await api.guides.updateStep(section.id, step.id, input) : await api.guides.addStep(section.id, input);
      onSaved(data);
    } catch (err) {
      // Pictures uploaded for a save that failed are thrown away again
      for (const id of uploaded) api.images.remove(id).catch(() => {});
      setError(errorMessage(err));
      setBusy(null);
    }
  };

  const picker = (label: string, hint: string, p: Picture, setP: (p: Picture) => void, current: GuideStep["desktopImage"], crop: (typeof CROP)["guideDesktop"]) => {
    const preview = shown(p, current);
    // "desktop" in a sentence, but "HP" stays capitals
    const name = label === "HP" ? "HP" : label.toLowerCase();
    return (
      <div className={local.picker}>
        <ImagePicker
          title={`UNGGAH GAMBAR ${label}`}
          previewUrl={preview}
          crop={crop}
          pending={!!p.file}
          onFile={(file, url) => setP({ file, preview: url })}
        />
        <small className="muted">{hint}</small>
        {preview && (
          <Button type="button" variant="light" size="sm" onClick={() => setP({ remove: !!current })} disabled={!!busy}>
            <IconTrash /> Hapus gambar {name}
          </Button>
        )}
        {p.remove && current && <small className={local.removeNote}>Gambar {name} akan dihapus dari server saat disimpan.</small>}
      </div>
    );
  };

  return (
    <Modal
      open
      wide
      title={`${step ? "Ubah" : "Tambah"} Langkah · ${section.title}`}
      onClose={() => !busy && onClose()}
      footer={
        <>
          <Button type="button" variant="light" onClick={onClose} disabled={!!busy}>
            Batal
          </Button>
          <Button type="button" onClick={save} disabled={!!busy}>
            {busy ?? "Simpan Langkah"}
          </Button>
        </>
      }
    >
      <div className={local.form}>
        <GuideTextField label="Teks langkah" rows={5} maxLength={3000} value={body} onChange={setBody} />
        <div className={local.pickers}>
          {picker("DESKTOP", "Tampil di layar lebar (laptop / komputer). Bila kosong, gambar HP dipakai.", desktop, setDesktop, step?.desktopImage ?? null, CROP.guideDesktop)}
          {picker("HP", "Tampil di layar HP. Bila kosong, gambar desktop dipakai.", mobile, setMobile, step?.mobileImage ?? null, CROP.guideMobile)}
        </div>
        <label className="field">
          <span className="label">Keterangan gambar (opsional)</span>
          <Input value={alt} maxLength={255} onChange={(e) => setAlt(e.target.value)} placeholder="Contoh: Tombol DAFTAR di halaman login" />
          <span className="hint">Dibacakan pembaca layar dan tampil bila gambar gagal dimuat.</span>
        </label>
        {error && <Alert variant="destructive">{error}</Alert>}
      </div>
    </Modal>
  );
}
