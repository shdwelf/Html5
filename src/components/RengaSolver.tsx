import { useMemo, useState } from "react";
import {
  CANONICAL_HOKKU,
  CANONICAL_RENGA_MNEMONIC,
  CANONICAL_WAKIKU,
  extractTanRenga,
  mergeTanRenga,
  solveTanRengaChecksum,
  splitVoices,
  type TanRengaMerge,
} from "../lib/renga";
import { PipeInButton, PipeOutButton } from "../pipe/PipeButtons";
import { usePipeReceiver } from "../pipe/PipeProvider";
import Collapsible from "../shell/Collapsible";

const TOOL_ID = "solver";
const TOOL_NAME = "Solver";

function applyPhrase(phrase: string, setHokku: (v: string) => void, setWakiku: (v: string) => void) {
  const voices = splitVoices(phrase);
  if (voices) {
    setHokku(voices.hokku);
    setWakiku(voices.wakiku);
    return;
  }
  const extracted = extractTanRenga(phrase);
  if (extracted) {
    setHokku(extracted.hokkuWords.join(" "));
    setWakiku(extracted.wakikuWords.join(" "));
    return;
  }
  setWakiku(phrase);
}

function ResultCard({ merged, label }: { merged: TanRengaMerge; label?: string }) {
  return (
    <article className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
              merged.meterValid ? "bg-amber-500/15 text-amber-200" : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {merged.meterValid ? "✓ tan-renga 5-7-5-7-7" : "✕ meter"}
          </span>
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
              merged.checksumValid ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
            }`}
          >
            {merged.checksumValid ? "✓ BIP-39 checksum" : "✕ checksum"}
          </span>
          {label && <span className="text-[10px] text-zinc-500">{label}</span>}
        </div>
        {merged.mnemonic && (
          <PipeOutButton
            compact
            draft={{
              content: merged.mnemonic,
              contentType: "mnemonic",
              sourceId: TOOL_ID,
              sourceName: TOOL_NAME,
              label: "merged tan-renga",
            }}
          />
        )}
      </div>
      <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-emerald-300">
        {merged.mnemonic || "—"}
      </pre>
      {merged.renga.stanzas.length > 0 && (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {merged.renga.stanzas.map((stanza) => (
            <div key={stanza.label} className="rounded border border-zinc-800 bg-zinc-950/80 p-2">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-amber-200/80">
                {stanza.label}
              </p>
              {stanza.lines.map((line, i) => (
                <p key={i} className="flex justify-between gap-3 font-serif text-sm italic text-zinc-100">
                  <span>{line.words.join(" ")}</span>
                  <span className="font-mono text-[10px] not-italic text-emerald-400">{line.syllables}</span>
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

export default function RengaSolver() {
  const [hokku, setHokku] = useState(CANONICAL_HOKKU);
  const [wakiku, setWakiku] = useState(CANONICAL_WAKIKU);
  const [paste, setPaste] = useState("");
  const [solved, setSolved] = useState<TanRengaMerge[] | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  usePipeReceiver(TOOL_ID, (d) => {
    applyPhrase(d.content, setHokku, setWakiku);
    setFlash(`Received ${d.contentType} from ${d.sourceName}`);
    window.setTimeout(() => setFlash(null), 2600);
  });

  const merged = useMemo(() => mergeTanRenga(hokku, wakiku), [hokku, wakiku]);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">⚙ {TOOL_NAME}</h2>
            <p className="text-[11px] text-zinc-500">
              Tan-renga merge: join the captain's hokku with the rookie's wakiku
              and recover the camouflaged spine. The two voices are the whole phrase.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <PipeInButton
              accepts={["mnemonic", "haiku", "text"]}
              onReceive={(content) => applyPhrase(content, setHokku, setWakiku)}
            />
            <a
              href="/apps/renga-camouflage/#solver"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-cyan-500 px-3 py-1.5 text-[10px] font-bold text-zinc-950 transition hover:bg-cyan-400"
            >
              ↗ HTML5 solver
            </a>
          </div>
        </div>

        {flash && (
          <p className="mb-2 rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-300">
            {flash}
          </p>
        )}

        <div className="grid gap-3 lg:grid-cols-2">
          <label className="block text-[11px] text-zinc-500">
            Hokku — captain (5-7-5)
            <textarea
              value={hokku}
              onChange={(e) => setHokku(e.target.value)}
              rows={4}
              spellCheck={false}
              aria-label="Hokku stanza"
              className="mt-1 w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-serif text-sm italic text-zinc-100 outline-none focus:border-cyan-600"
            />
          </label>
          <label className="block text-[11px] text-zinc-500">
            Wakiku — rookie (7-7)
            <textarea
              value={wakiku}
              onChange={(e) => setWakiku(e.target.value)}
              rows={4}
              spellCheck={false}
              aria-label="Wakiku stanza"
              className="mt-1 w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-serif text-sm italic text-zinc-100 outline-none focus:border-cyan-600"
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setHokku(CANONICAL_HOKKU);
              setWakiku(CANONICAL_WAKIKU);
              setSolved(null);
            }}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-[11px] text-zinc-300 hover:bg-zinc-800"
          >
            Load harvest voices
          </button>
          <button
            type="button"
            onClick={() => setSolved(solveTanRengaChecksum(hokku, wakiku))}
            className="rounded-lg bg-cyan-500/15 px-3 py-1.5 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/25"
          >
            Merge tan-renga
          </button>
        </div>
      </section>

      <ResultCard
        merged={merged}
        label={
          merged.mnemonic === CANONICAL_RENGA_MNEMONIC ? "harvest merge" : `${merged.hokkuWords.length + merged.wakikuWords.length} words`
        }
      />

      {solved && (
        <section className="space-y-2">
          <p className="text-[11px] text-zinc-500">
            {solved.length} checksum-valid merge{solved.length === 1 ? "" : "s"}
            {wakiku.includes("?") ? " for the unread wakiku word" : ""}.
          </p>
          {solved.length === 0 ? (
            <p className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] text-red-300">
              No merge lands on both 5-7-5 / 7-7 and a BIP-39 checksum.
            </p>
          ) : (
            solved.map((hit) => <ResultCard key={hit.mnemonic} merged={hit} />)
          )}
        </section>
      )}

      <Collapsible storageKey="bhw.solver.extract" title="Extract from camouflage" icon="📜" defaultOpen>
        <p className="mb-2 text-xs text-zinc-500">
          Paste the chapbook, a five-line verse, or any haibun. The solver keeps
          consecutive BIP-39 lines that scan as tan-renga and merges those two voices.
        </p>
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          rows={6}
          spellCheck={false}
          aria-label="Camouflage text to extract"
          placeholder={"morning brief captain\nsuspect great weather again\nchronic leaf harvest\nother night rookie erase\nrival web design domain"}
          className="w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-200 outline-none focus:border-cyan-600"
        />
        <button
          type="button"
          onClick={() => {
            const found = extractTanRenga(paste);
            if (!found) {
              setSolved([]);
              return;
            }
            setHokku(found.renga.stanzas[0]?.lines.map((l) => l.words.join(" ")).join("\n") ?? "");
            setWakiku(found.renga.stanzas[1]?.lines.map((l) => l.words.join(" ")).join("\n") ?? "");
            setSolved([found]);
          }}
          className="mt-2 rounded-lg bg-violet-500/15 px-3 py-1.5 text-[11px] font-semibold text-violet-300 hover:bg-violet-500/25"
        >
          Extract and merge
        </button>
      </Collapsible>
    </div>
  );
}
