import { useMemo, useState } from "react";
import { validateMnemonic } from "../lib/wallet";
import {
  CANONICAL_RENGA_MNEMONIC,
  haibunForMnemonic,
  lineText,
  mnemonicFromRenga,
  packRenga,
  renderCamouflageHtml,
  RENGA_PATTERN,
} from "../lib/renga";
import { PipeInButton, PipeOutButton } from "../pipe/PipeButtons";
import { usePipeReceiver } from "../pipe/PipeProvider";
import Collapsible from "../shell/Collapsible";

const TOOL_ID = "renga";
const TOOL_NAME = "Renga Camouflage";

function download(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RengaCamouflage() {
  const [text, setText] = useState(CANONICAL_RENGA_MNEMONIC);
  const [reveal, setReveal] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  usePipeReceiver(TOOL_ID, (d) => {
    setText(d.content.replace(/\n+/g, " ").replace(/\s+/g, " ").trim());
    setFlash(`Received ${d.contentType} from ${d.sourceName}`);
    window.setTimeout(() => setFlash(null), 2600);
  });

  const phrase = text.toLowerCase().trim().replace(/\s+/g, " ");
  const packed = useMemo(() => haibunForMnemonic(phrase), [phrase]);
  const checksum = phrase.length > 0 && validateMnemonic(phrase);
  const { haibun, renga, canonical } = packed;

  const loadCanonical = () => setText(CANONICAL_RENGA_MNEMONIC);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">連 {TOOL_NAME}</h2>
            <p className="text-[11px] text-zinc-500">
              Hide a BIP-39 phrase inside a complete tan-renga haibun. The verses
              are the seed; the story is the camouflage.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <PipeInButton
              accepts={["mnemonic", "haiku", "text"]}
              onReceive={(content) =>
                setText(content.replace(/\n+/g, " ").replace(/\s+/g, " ").trim())
              }
            />
            {phrase && (
              <PipeOutButton
                draft={{
                  content: phrase,
                  contentType: "mnemonic",
                  sourceId: TOOL_ID,
                  sourceName: TOOL_NAME,
                  label: `${renga.words.length}-word renga spine`,
                }}
              />
            )}
            <a
              href="/apps/renga-camouflage/"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-cyan-500 px-3 py-1.5 text-[10px] font-bold text-zinc-950 transition hover:bg-cyan-400"
            >
              ↗ HTML5 app
            </a>
          </div>
        </div>

        {flash && (
          <p className="mb-2 rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-300">
            {flash}
          </p>
        )}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          spellCheck={false}
          aria-label="Mnemonic phrase to camouflage"
          className="w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-sm text-emerald-300 outline-none focus:border-cyan-600"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadCanonical}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-[11px] text-zinc-300 hover:bg-zinc-800"
          >
            Load harvest renga
          </button>
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-pressed={reveal}
            className={`rounded-lg border px-3 py-1.5 text-[11px] font-semibold ${
              reveal
                ? "border-rose-400/50 bg-rose-500/15 text-rose-200"
                : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            {reveal ? "Hide the spine" : "Reveal the spine"}
          </button>
          <button
            type="button"
            onClick={() => {
              const html = renderCamouflageHtml(haibun, renga, false);
              download("two-voices-at-harvest.html", html, "text/html;charset=utf-8");
            }}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-[11px] text-zinc-300 hover:bg-zinc-800"
          >
            ↓ Camouflage chapbook
          </button>
          <span
            className={`rounded px-2 py-1 text-[10px] font-semibold ${
              checksum ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
            }`}
          >
            {checksum ? "✓ BIP-39 checksum" : "✕ checksum"}
          </span>
          <span
            className={`rounded px-2 py-1 text-[10px] font-semibold ${
              renga.valid ? "bg-amber-500/15 text-amber-200" : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {renga.valid ? `✓ renga ${RENGA_PATTERN.join("-")}` : "not 5-7-5 / 7-7"}
          </span>
          {canonical && (
            <span className="rounded bg-cyan-500/15 px-2 py-1 text-[10px] font-semibold text-cyan-200">
              featured harvest phrase
            </span>
          )}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)]">
        <article className="rounded-xl border border-amber-900/30 bg-[#f4efe4] px-6 py-8 text-[#1a1714] shadow-inner">
          <header className="mb-6 text-center">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#9c2b1a]">連歌</p>
            <h3 className="mt-2 font-serif text-2xl font-medium tracking-wide">{haibun.title}</h3>
            <p className="mt-1 font-serif text-sm italic text-[#6b6458]">
              {haibun.form} · {haibun.season} · {haibun.epigraph}
            </p>
          </header>
          <div className="space-y-4 font-serif text-[17px] leading-relaxed">
            {haibun.beats.map((beat, i) => {
              if (beat.kind === "prose") {
                return (
                  <p key={i} className={i === 0 ? "" : "indent-8"}>
                    {beat.text}
                  </p>
                );
              }
              const stanza = renga.stanzas.find((s) => s.type === beat.kind);
              if (!stanza) return null;
              return (
                <blockquote
                  key={i}
                  className="my-6 ml-6 border-l-0 font-serif italic text-[#1a1714]"
                >
                  {stanza.lines.map((line, li) => (
                    <span key={li} className="block">
                      {line.words.map((w, wi) =>
                        reveal ? (
                          <mark
                            key={wi}
                            className="mr-1 bg-transparent font-medium text-[#9c2b1a] underline decoration-[#9c2b1a]/40 underline-offset-4"
                          >
                            {w}
                          </mark>
                        ) : (
                          <span key={wi} className="mr-1">
                            {w}
                          </span>
                        ),
                      )}
                    </span>
                  ))}
                </blockquote>
              );
            })}
          </div>
          <footer className="mt-8 border-t border-[#d7d0c3] pt-3 font-serif text-xs italic text-[#6b6458]">
            {haibun.colophon}
          </footer>
        </article>

        <div className="space-y-4">
          <Collapsible storageKey="bhw.renga.stanzas" title="Renga stanzas" icon="🤝" defaultOpen>
            {renga.stanzas.length === 0 ? (
              <p className="text-xs text-zinc-500">
                The words do not land on 5-7-5 then 7-7. Camouflage still wraps them in
                prose, but they will not scan as tan-renga.
              </p>
            ) : (
              <div className="space-y-3">
                {renga.stanzas.map((stanza, i) => (
                  <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-amber-200/80">
                      {stanza.label}
                    </p>
                    {stanza.lines.map((line, li) => (
                      <p key={li} className="flex items-baseline justify-between gap-3 font-serif text-sm">
                        <span className="text-zinc-100">{lineText(line)}</span>
                        <span className="font-mono text-[10px] text-emerald-400">{line.syllables}</span>
                      </p>
                    ))}
                  </div>
                ))}
                {renga.remainder.length > 0 && (
                  <p className="text-[11px] text-amber-300">
                    Unscanned remainder: {renga.remainder.join(" ")}
                  </p>
                )}
              </div>
            )}
          </Collapsible>

          <Collapsible storageKey="bhw.renga.spine" title="Extracted spine" icon="🔑" defaultOpen>
            <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-emerald-300">
              {mnemonicFromRenga(renga) || phrase || "—"}
            </pre>
            <p className="mt-2 text-[10px] text-zinc-500">
              {renga.words.length} words · {renga.counts.join("-") || "no scan"} syllables
              {canonical ? " · the harvest phrase" : ""}
            </p>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}
