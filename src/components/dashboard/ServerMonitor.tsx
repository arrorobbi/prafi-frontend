"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { api, errorMessage } from "@/lib/api";
import { useRealtime, useRealtimeEmit, useRealtimeStatus } from "@/lib/realtime";
import type { ServerMetrics, ServiceState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Alert } from "../shadcn/alert";
import { Badge } from "../shadcn/badge";
import { Card } from "../shadcn/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "../shadcn/chart";
import { Loading } from "../ui";
import { LiveBadge } from "./LiveBadge";

/** Readings kept for the chart: about 5 minutes at one every 3 seconds. Nothing is stored anywhere else. */
const HISTORY = 100;

const number1 = (n: number) => n.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
/** 1536 → "1,5 KB", 8.5e9 → "7,9 GB" */
function bytes(n: number | null | undefined) {
  if (n == null) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = n;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${unit === 0 ? value : number1(value)} ${units[unit]}`;
}
/** 1041816 → "12 hari 1 jam" */
function duration(seconds: number) {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days) return `${days} hari ${hours} jam`;
  if (hours) return `${hours} jam ${minutes} menit`;
  return `${minutes} menit`;
}
const clock = (iso: string) => new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Green while there is room, amber when it gets tight, red when action is needed */
const level = (percent: number, danger = 90) => (percent >= danger ? "danger" : percent >= Math.min(75, danger - 10) ? "warn" : "ok");
const BAR = { ok: "bg-[#16a34a]", warn: "bg-[#f5b700]", danger: "bg-destructive" };
const TEXT = { ok: "text-brand-navy", warn: "text-[#a16207]", danger: "text-destructive" };

function Gauge({ title, percent, main, lines, danger }: { title: string; percent: number; main: string; lines: string[]; danger?: number }) {
  const tone = level(percent, danger);
  return (
    <Card className="flex min-w-0 flex-col gap-3 p-5 max-[480px]:p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[0.82rem] font-bold tracking-wide text-muted-foreground uppercase">{title}</h2>
        <strong className={cn("text-3xl leading-none font-bold tabular-nums", TEXT[tone])}>{number1(percent)}%</strong>
      </div>
      <div
        className="h-3 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={title}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
      >
        <div className={cn("h-full rounded-full transition-[width] duration-500", BAR[tone])} style={{ width: `${Math.max(1, percent)}%` }} />
      </div>
      <p className="font-semibold [overflow-wrap:anywhere]">{main}</p>
      <ul className="m-0 grid list-none gap-0.5 p-0 text-[0.82rem] text-muted-foreground">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </Card>
  );
}

const SERVICE_BADGE: Record<ServiceState, { label: string; variant: "active" | "pending" | "rejected" | "inactive" }> = {
  active: { label: "Berjalan", variant: "active" },
  activating: { label: "Memulai…", variant: "pending" },
  inactive: { label: "Berhenti", variant: "inactive" },
  failed: { label: "Gagal", variant: "rejected" },
  unknown: { label: "Tidak diketahui", variant: "inactive" },
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2.5 last:border-b-0">
      <dt className="text-[0.9rem] text-muted-foreground">{label}</dt>
      <dd className="text-right text-[0.92rem] font-semibold [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

function Panel({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn("min-w-0 p-5 max-[480px]:p-4", className)}>
      <h2 className="mb-2 text-base font-bold text-brand-navy">{title}</h2>
      {children}
    </Card>
  );
}

const chartConfig = {
  cpu: { label: "CPU", color: "var(--chart-2)" },
  memory: { label: "RAM", color: "var(--chart-1)" },
} satisfies ChartConfig;

/**
 * Superadmin → Monitor Server: CPU, memory and disk of the server, the services the site needs, and what takes
 * space. The first reading comes from GET /api/server/metrics; after that the backend pushes one every few seconds
 * over Socket.IO while this page is open (it collects nothing when nobody watches).
 */
export function ServerMonitor() {
  const live = useRealtimeStatus();
  const emit = useRealtimeEmit();
  const [metrics, setMetrics] = useState<ServerMetrics | null>(null);
  const [history, setHistory] = useState<{ at: string; cpu: number; memory: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const add = (m: ServerMetrics) => {
    setMetrics(m);
    setError(null);
    setHistory((h) => [...h, { at: m.at, cpu: m.cpu.percent, memory: m.memory.percent }].slice(-HISTORY));
  };

  // The first reading right away (and again whenever the live connection comes back)
  useEffect(() => {
    let cancelled = false;
    api.server
      .metrics()
      .then(({ data }) => !cancelled && add(data))
      .catch((err) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [live]);

  // Tell the backend this page is open; it stops collecting when the last watcher leaves
  useEffect(() => {
    if (!live) return;
    emit("monitor:watch");
    return () => emit("monitor:unwatch");
  }, [live, emit]);
  useRealtime<ServerMetrics>("server:metrics", add);

  if (!metrics) return error ? <Alert variant="destructive">{error}</Alert> : <Loading label="Membaca keadaan server..." />;

  const { cpu, memory, disk, host, app, services, storage } = metrics;
  const maintenance = services.find((s) => s.name === "prafi-maintenance")?.state === "active";
  const diskFull = disk.alertPercent > 0 && disk.percent >= disk.alertPercent;
  // While the maintenance page holds port 80 the website is stopped on purpose
  const shown = (s: ServerMetrics["services"][number]) =>
    maintenance && s.name === "prafi-frontend" && s.state !== "active"
      ? { label: "Berhenti (pemeliharaan)", variant: "pending" as const }
      : s.name === "prafi-maintenance" && s.state !== "active"
        ? { label: "Tidak aktif", variant: "inactive" as const }
        : SERVICE_BADGE[s.state];
  const down = services.filter((s) => s.name !== "prafi-maintenance" && s.state !== "active" && !(maintenance && s.name === "prafi-frontend"));

  return (
    <div className="grid gap-5">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.88rem] text-muted-foreground">
        <LiveBadge />
        <span>
          {live ? "Diperbarui setiap 3 detik" : "Pembaruan langsung terputus"} · terakhir {clock(metrics.at)}
        </span>
      </p>

      {error && <Alert variant="destructive">{error}</Alert>}
      {diskFull && (
        <Alert variant="destructive">
          Disk terisi {number1(disk.percent)}%, melewati batas peringatan {disk.alertPercent}%. Kosongkan ruang: disk yang penuh menghentikan
          unggah foto, cadangan, dan database.
        </Alert>
      )}
      {down.length > 0 && (
        <Alert variant="destructive">Layanan tidak berjalan: {down.map((s) => s.label).join(", ")}. Periksa di server (Panduan Server, bagian 4).</Alert>
      )}
      {maintenance && <Alert variant="warning">Halaman pemeliharaan sedang aktif: pengunjung melihat pemberitahuan, bukan website.</Alert>}

      <div className="grid gap-4 min-[900px]:grid-cols-3">
        <Gauge
          title="CPU"
          percent={cpu.percent}
          main={`${host.cores} core`}
          lines={[`Beban rata-rata 1 / 5 / 15 menit: ${host.loadAverage.map((n) => n.toLocaleString("id-ID")).join(" / ")}`]}
        />
        <Gauge
          title="RAM"
          percent={memory.percent}
          main={`${bytes(memory.usedBytes)} dari ${bytes(memory.totalBytes)}`}
          lines={[
            `Tersedia ${bytes(memory.totalBytes - memory.usedBytes)}`,
            memory.swapTotalBytes ? `Swap ${bytes(memory.swapUsedBytes)} dari ${bytes(memory.swapTotalBytes)}` : "Tanpa swap",
          ]}
        />
        <Gauge
          title="Penyimpanan (disk)"
          percent={disk.percent}
          danger={disk.alertPercent || 90}
          main={`${bytes(disk.usedBytes)} dari ${bytes(disk.totalBytes)}`}
          lines={[
            `Sisa ${bytes(disk.freeBytes)}`,
            disk.alertPercent ? `Email peringatan dikirim pada ${disk.alertPercent}%` : "Email peringatan dimatikan",
          ]}
        />
      </div>

      <Panel title="CPU & RAM (5 menit terakhir)">
        {history.length > 1 ? (
          <ChartContainer config={chartConfig} className="aspect-auto h-[200px] w-full sm:h-[240px]">
            <AreaChart data={history} margin={{ left: 0, right: 8, top: 8 }}>
              <defs>
                {(["cpu", "memory"] as const).map((key) => (
                  <linearGradient key={key} id={`mon-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={`var(--color-${key})`} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={`var(--color-${key})`} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="4 4" />
              <XAxis dataKey="at" tickLine={false} axisLine={false} tickMargin={8} minTickGap={48} tickFormatter={clock} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => `${v}%`} />
              <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => clock(String(v))} />} />
              <ChartLegend content={<ChartLegendContent />} />
              {(["cpu", "memory"] as const).map((key) => (
                <Area
                  key={key}
                  dataKey={key}
                  type="monotone"
                  stroke={`var(--color-${key})`}
                  fill={`url(#mon-${key})`}
                  strokeWidth={2.2}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </AreaChart>
          </ChartContainer>
        ) : (
          <p className="grid h-[240px] place-items-center text-center text-sm text-muted-foreground">
            Grafik terisi selama halaman ini terbuka. Riwayat tidak disimpan.
          </p>
        )}
      </Panel>

      <div className="grid gap-4 min-[900px]:grid-cols-3">
        <Panel title="Layanan">
          <dl>
            {services.map((s) => {
              const badge = shown(s);
              return (
                <Row key={s.name} label={s.label}>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </Row>
              );
            })}
          </dl>
        </Panel>

        <Panel title="Pemakaian ruang">
          <dl>
            <Row label="Database">{bytes(storage.databaseBytes)}</Row>
            <Row label="Foto unggahan">
              {bytes(storage.imagesBytes)} <span className="font-normal text-muted-foreground">({storage.imagesCount} berkas)</span>
            </Row>
            <Row label="Cadangan di server">{bytes(storage.backupsBytes)}</Row>
            <Row label="Cadangan mingguan terakhir">{storage.lastBackup ? dateTime(storage.lastBackup.at) : "Belum ada"}</Row>
          </dl>
        </Panel>

        <Panel title="Server">
          <dl>
            <Row label="Nama">{host.hostname}</Row>
            <Row label="Sistem">{host.os}</Row>
            <Row label="Menyala sejak">{duration(host.uptimeSeconds)} lalu</Row>
            <Row label="Backend berjalan">{duration(app.backendUptimeSeconds)}</Row>
            <Row label="Memori backend">{bytes(app.backendMemoryBytes)}</Row>
            <Row label="Node.js">{app.nodeVersion}</Row>
          </dl>
        </Panel>
      </div>
    </div>
  );
}
