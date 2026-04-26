import Link from "next/link";
import { listChampionships, getStandings, getDriver, getTeam } from "@/lib/data";
import { Backdrop } from "@/components/ui/backdrop";
import { TopNav } from "@/components/ui/top-nav";
import { Glass } from "@/components/ui/glass";
import { LiveChip, Chip } from "@/components/ui/chip";
import { SectionHeading } from "@/components/ui/section-heading";
import { PodiumGroup } from "@/components/ui/podium";
import { CNSRCFooter } from "@/components/ui/footer";
import { CompoundSilhouettes } from "@/components/ui/track-silhouette";
import type { StandingsRow } from "@/lib/types";


type DiscordMember = {
  id: string;
  username: string;
  status: "online" | "idle" | "dnd";
  avatar_url: string;
  game?: { name: string };
  channel_id?: string;
  mute?: boolean;
  deaf?: boolean;
  self_mute?: boolean;
  self_deaf?: boolean;
  suppress?: boolean;
};
type DiscordWidget = {
  name: string;
  instant_invite: string;
  channels: { id: string; name: string }[];
  members: DiscordMember[];
  presence_count: number;
};

const STATUS_COLOR: Record<string, string> = {
  online: "var(--status-success)",
  idle:   "var(--status-warning)",
  dnd:    "var(--status-danger)",
};

const SIM_TITLES = ["assetto corsa", "iracing", "forza", "raceroom", "trackmania"];
const isSimRacer = (m: DiscordMember) =>
  !!m.game && SIM_TITLES.some((t) => m.game!.name.toLowerCase().includes(t));

export default async function HomePage() {
  const discordRes = await fetch(
    "https://discord.com/api/guilds/1274546982060556390/widget.json",
    { next: { revalidate: 60 } }
  ).catch(() => null);
  const discord: DiscordWidget | null = discordRes?.ok ? await discordRes.json() : null;

  const championships = listChampionships();
  const active = championships.find((c) => c.status === "live") ?? championships[0];

  if (!active) {
    return (
      <Backdrop orbs={[]}>
        <TopNav />
        <div style={{ padding: 48, textAlign: "center", color: "var(--text-secondary)", fontSize: 16 }}>
          No se encontraron datos del campeonato.
        </div>
      </Backdrop>
    );
  }

  const classStandings = active.classes.map((cls) => ({
    classId: cls.id,
    label: cls.label,
    rows: getStandings(active.id, cls.id).slice(0, 5),
  }));

  const doneRounds  = active.rounds.filter((r) => r.status === "done");
  const latestRound = doneRounds[doneRounds.length - 1];
  const latestSession = latestRound?.sessions
    .filter((s) => s.type === "race" && s.results.length > 0)
    .at(-1);

  const completedRounds = doneRounds.length;
  const totalRaces = active.rounds.reduce(
    (acc, r) => acc + r.sessions.filter((s) => s.type === "race").length, 0
  );

  const rawPodium = latestSession?.results.slice(0, 3) ?? [];
  const hasPodium = rawPodium.length === 3;

  return (
    <Backdrop
      orbs={[
        { color: "red",    x: -140, y: -80, w: 540, h: 540, opacity: 0.9 },
        { color: "purple", x: 900,  y: 60,  w: 460, h: 460, opacity: 0.7 },
        { color: "amber",  x: 520,  y: 680, w: 320, h: 320, opacity: 0.4 },
      ]}
      silhouette={
        <CompoundSilhouettes
          tracks={["bahrain", "interlagos", "cota", "laguna", "sonoma", "indy", "jeddah"]}
          opacity={0.06}
        />
      }
      bracketCorners
    >
      <TopNav />

      {/* ticker */}
      <div className="home-ticker">
        <span className="label">CAMPEONATO ACTIVO · {active.season}</span>
        <span className="label" style={{ marginLeft: "auto", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
          ÚLT. ACTUALIZACIÓN · <span className="mono">{latestRound?.date ?? "—"}</span>
        </span>
      </div>

      {/* hero grid */}
      <div className="home-hero-grid">
        <Glass cut={22} heavy stripe pad={0} data-primary-red>
          <div className="home-hero-inner">
            {/* title + stats */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {active.status === "live" && <LiveChip round={String(completedRounds)} />}
                <Chip>{active.season}</Chip>
                <Chip>{active.classes.map((c) => c.label).join(" · ")}</Chip>
              </div>
              <h1 className="home-h1" style={{ fontFamily: "var(--font-display)", fontWeight: 800, lineHeight: 0.95, letterSpacing: "0.01em", textTransform: "uppercase", margin: 0, color: "var(--text-primary)" }}>
                Campeonato<br />Nacional<br />
                <span style={{ color: "var(--accent-red)" }}>Simracing Cuba</span>
              </h1>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { label: "RONDAS DISPUTADAS", value: String(completedRounds).padStart(2,"0"), sub: `/ ${active.rounds.length}` },
                  { label: "CARRERAS",          value: String(totalRaces).padStart(2,"0"),       sub: "sesiones totales" },
                  { label: "CLASES",            value: String(active.classes.length).padStart(2,"0"), sub: active.classes.map(c=>c.label).join(" · ") },
                  { label: "ESTADO",            value: active.status.toUpperCase(), sub: `Ronda ${completedRounds}`, accent: true },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column" }}>
                    <span className="label">{s.label}</span>
                    <span className="home-stat-value" style={{ fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: "0.01em", lineHeight: 1, color: s.accent ? "var(--accent-red)" : "var(--text-primary)", fontVariantNumeric: "tabular-nums", marginTop: 4 }}>{s.value}</span>
                    <span style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4 }}>{s.sub}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-secondary)", flexWrap: "wrap" }}>
                <span className="mono" style={{ color: "var(--text-primary)" }}>{active.season}</span>
                <span style={{ color: "var(--text-tertiary)" }}>/</span>
                <span className="mono">{active.rounds[0]?.date} → {active.rounds.at(-1)?.date}</span>
                <span style={{ color: "var(--text-tertiary)" }}>/</span>
                <span className="mono">{active.rounds.length} RDS</span>
              </div>
            </div>

            <div className="home-hero-divider" />

            {/* Discord community panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="label" style={{ color: "var(--text-secondary)" }}>COMUNIDAD · DISCORD</span>
                {discord && (
                  <a href={discord.instant_invite} target="_blank" rel="noopener noreferrer"
                     style={{ fontFamily: "var(--font-display)", fontSize: 11, letterSpacing: "0.18em", color: "var(--accent-red)", textDecoration: "none" }}>
                    UNIRSE →
                  </a>
                )}
              </div>

              {discord ? (
                <>
                  {/* online count + avatar strip */}
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span className="home-stat-value" style={{ fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: "0.01em", lineHeight: 1, color: "var(--status-success)", fontVariantNumeric: "tabular-nums" }}>
                        {String(discord.presence_count).padStart(2, "0")}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>en línea</span>
                    </div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", paddingBottom: 2 }}>
                      {discord.members.slice(0, 12).map((m) => (
                        <div key={m.id} style={{ position: "relative", flexShrink: 0 }}>
                          <img src={m.avatar_url} alt={m.username} className="avatar-circle"
                               style={{ width: 24, height: 24, display: "block", opacity: m.status === "dnd" ? 0.6 : 1 }} />
                          <span className="avatar-circle" style={{ position: "absolute", bottom: 0, right: 0, width: 7, height: 7,
                                         background: STATUS_COLOR[m.status] ?? "var(--text-tertiary)",
                                         border: "1.5px solid var(--bg-page)" }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* sim racers */}
                  {discord.members.some(isSimRacer) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <span className="label" style={{ color: "var(--text-tertiary)", marginBottom: 6 }}>EN PISTA</span>
                      {discord.members.filter(isSimRacer).map((m) => (
                        <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "0.5px dashed rgba(255,255,255,0.05)" }}>
                          <div style={{ position: "relative", flexShrink: 0 }}>
                            <img src={m.avatar_url} alt={m.username} className="avatar-circle"
                                 style={{ width: 32, height: 32, display: "block" }} />
                            <span className="avatar-circle" style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8,
                                           background: STATUS_COLOR[m.status] ?? "var(--text-tertiary)",
                                           border: "1.5px solid var(--bg-page)" }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.username}</div>
                            <div className="mono" style={{ fontSize: 11, color: "var(--accent-red)", letterSpacing: "0.05em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.game!.name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* voice channel members */}
                  {discord.members.some((m) => m.channel_id) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <span className="label" style={{ color: "var(--text-tertiary)" }}>EN VOZ</span>
                      {discord.members.filter((m) => m.channel_id).slice(0, 4).map((m) => {
                        const ch = discord.channels.find((c) => c.id === m.channel_id);
                        const muted   = m.self_mute || m.mute;
                        const deafened = m.self_deaf || m.deaf;
                        return (
                          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <img src={m.avatar_url} alt={m.username} className="avatar-circle"
                                 style={{ width: 20, height: 20, flexShrink: 0, opacity: muted ? 0.55 : 1 }} />
                            <span style={{ fontSize: 12, color: "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.username}</span>
                            <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
                              {muted && (
                                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ display: "block", color: "var(--status-danger)", flexShrink: 0 }}>
                                  <rect x="3.5" y="0.5" width="4" height="6" stroke="currentColor" strokeWidth="1"/>
                                  <path d="M1.5 5.5c0 2.2 1.8 4 4 4s4-1.8 4-4" stroke="currentColor" strokeWidth="1"/>
                                  <line x1="5.5" y1="9.5" x2="5.5" y2="10.5" stroke="currentColor" strokeWidth="1"/>
                                  <line x1="0.5" y1="0.5" x2="10.5" y2="10.5" stroke="currentColor" strokeWidth="1.3"/>
                                </svg>
                              )}
                              {deafened && (
                                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ display: "block", color: "var(--status-warning)", flexShrink: 0 }}>
                                  <path d="M2 7V5.5A3.5 3.5 0 019 5.5V7" stroke="currentColor" strokeWidth="1"/>
                                  <rect x="1" y="6.5" width="2" height="3" fill="currentColor"/>
                                  <rect x="8" y="6.5" width="2" height="3" fill="currentColor"/>
                                  <line x1="0.5" y1="0.5" x2="10.5" y2="10.5" stroke="currentColor" strokeWidth="1.3"/>
                                </svg>
                              )}
                              <span className="mono" style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{ch?.name ?? "—"}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <span className="label" style={{ color: "var(--text-tertiary)" }}>NO DISPONIBLE</span>
              )}
            </div>
          </div>

          {/* bottom ticker */}
          <div className="home-hero-ruler">
            <div style={{ display: "flex", gap: 12, flex: 1, alignItems: "flex-end" }}>
              {Array.from({ length: 40 }).map((_, i) => (
                <span key={i} style={{ display: "inline-block", width: 1, height: i%5===0 ? 10 : 5, background: i%5===0 ? "var(--text-secondary)" : "var(--text-tertiary)" }} />
              ))}
            </div>
          </div>
        </Glass>

        {/* side standings */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {classStandings.map((cs) => (
            <StandingsSide key={cs.classId} heading={cs.label} rows={cs.rows} total={active.rounds.length} done={completedRounds} champId={active.id} />
          ))}
        </div>
      </div>

      {/* latest result */}
      {latestSession && hasPodium && (
        <div className="home-section-pad" style={{ paddingTop: 20 }}>
          <SectionHeading
            eyebrow={`ÚLTIMO RESULTADO · ${latestRound!.date}`}
            title={`Ronda ${String(latestRound!.index).padStart(2,"0")} · ${latestRound!.track.name} · ${latestSession.subLabel ?? "Carrera"}`}
            right={
              <Link href={`/sessions/${latestSession.id}`} style={{ fontFamily: "var(--font-display)", fontSize: 12, letterSpacing: "0.2em", color: "var(--accent-red)", textDecoration: "none" }}>
                VER SESIÓN →
              </Link>
            }
          />
          <Glass cut={18} pad={20}>
            <div className="home-result-grid">
              <PodiumGroup
                podium={rawPodium.map((r) => {
                  const driver = getDriver(r.driverId);
                  return {
                    pos: r.pos,
                    grid: r.gridPos,
                    delta: r.gridPos - r.pos,
                    name: driver?.name ?? r.driverId,
                    team: getTeam(r.teamId)?.name ?? r.teamId,
                    best: r.bestLap,
                    gap: r.gap,
                    picture: driver?.picture,
                  };
                }) as [Parameters<typeof PodiumGroup>[0]["podium"][0], Parameters<typeof PodiumGroup>[0]["podium"][0], Parameters<typeof PodiumGroup>[0]["podium"][0]]}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="label">DATOS DE SESIÓN</div>
                {[
                  ["CIRCUITO",   `${latestRound!.track.name} · ${latestRound!.track.lengthKm} km`],
                  ["CLIMA",      `${latestSession.conditions.weather} · ${latestSession.conditions.airTemp}°C / ${latestSession.conditions.trackTemp}°C`],
                  ["PILOTOS",    String(latestSession.results.length)],
                  ["INCIDENTES", String(latestSession.incidents.length)],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "6px 0", borderBottom: "0.5px dashed rgba(255,255,255,0.05)" }}>
                    <span className="label" style={{ color: "var(--text-secondary)" }}>{k}</span>
                    <span className="mono" style={{ fontSize: 13, color: "var(--text-primary)" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </Glass>
        </div>
      )}

      {/* round strip */}
      <div className="home-section-pad" style={{ paddingTop: 20 }}>
        <SectionHeading
          eyebrow="CALENDARIO"
          title={`Rondas de ${active.season}`}
          right={<span className="label" style={{ color: "var(--text-tertiary)" }}>{active.rounds.length} rondas · {Math.round((completedRounds/active.rounds.length)*100)}% completado</span>}
        />
        <div className="home-rounds-grid">
          {active.rounds.map((r) => {
            const isLive = r.status === "live";
            const isDone = r.status === "done";
            const sessionHref = r.sessions.find((s) => s.type === "race")?.id;
            return (
              <Link key={r.id} href={sessionHref ? `/sessions/${sessionHref}` : "#"} style={{ textDecoration: "none" }}>
                <div className="clip-cut-sm" style={{ position: "relative", padding: "12px 10px", display: "flex", flexDirection: "column", gap: 5, minHeight: 88, opacity: r.status==="upcoming" ? 0.45 : 1, border: isLive ? "1px solid var(--border-accent)" : "1px solid var(--border-hairline)", background: isLive ? "var(--bg-surface-p1)" : "var(--bg-surface)", backdropFilter: "var(--blur-light)", WebkitBackdropFilter: "var(--blur-light)" }}>
                  {isLive && <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "var(--accent-red)" }} />}
                  <span className="label" style={{ fontSize: 11, color: isLive ? "var(--accent-red)" : "var(--text-tertiary)" }}>R{String(r.index).padStart(2,"0")}</span>
                  <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{r.track.name}</span>
                  <span className="mono" style={{ fontSize: 11, color: "var(--text-secondary)" }}>{r.date}</span>
                  <span className="mono" style={{ fontSize: 10, letterSpacing: "0.15em", color: isLive ? "var(--accent-red)" : "var(--text-tertiary)", marginTop: "auto" }}>{isLive ? "EN VIVO" : isDone ? "HECHA" : "—"}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <CNSRCFooter />
    </Backdrop>
  );
}

function StandingsSide({ heading, rows, total, done, champId }: { heading: string; rows: StandingsRow[]; total: number; done: number; champId: string }) {
  return (
    <Glass cut={14} pad={14}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span className="label" style={{ color: "var(--text-secondary)" }}>CLASIFICACIÓN · {heading}</span>
        <span className="mono" style={{ fontSize: 11, color: "var(--text-tertiary)" }}>R{String(done).padStart(2,"0")}/{total}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {rows.length === 0 && <div className="label" style={{ color: "var(--text-tertiary)", padding: "6px 0" }}>Sin datos</div>}
        {rows.map((r) => (
          <div key={r.pos} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 6px", background: r.pos===1 ? "var(--bg-surface-p1)" : "transparent", borderTop: r.pos===1 ? "0.5px solid var(--border-accent)" : "0.5px solid transparent" }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: r.pos===1 ? "var(--accent-red)" : "var(--text-primary)", width: 26, fontVariantNumeric: "tabular-nums" }}>{String(r.pos).padStart(2,"0")}</span>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 14, color: "var(--text-primary)" }}>{r.name}</span>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.teamName}</span>
            </div>
            <span className="mono" style={{ fontSize: 14, color: "var(--text-primary)" }}>{r.pts}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "0.5px dashed rgba(255,255,255,0.08)", textAlign: "right" }}>
        <Link href={`/championships/${champId}`} style={{ fontFamily: "var(--font-display)", fontSize: 12, letterSpacing: "0.18em", color: "var(--text-secondary)", textDecoration: "none" }}>VER TABLA →</Link>
      </div>
    </Glass>
  );
}
