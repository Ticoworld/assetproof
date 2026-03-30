"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronRight, ArrowLeft, Check, AlertCircle } from "lucide-react";
import { ASSET_CATEGORIES } from "@/lib/proof/model";
import {
  buildDraftProof,
  saveDraft,
  type IssuerFormData,
  type ProofInput,
} from "@/lib/draft/state";
import type { LinkCredibility } from "@/lib/proof/model";

// ── Types ─────────────────────────────────────────────────────────────────────

type FormErrors = {
  assetName?: string;
  symbol?: string;
  category?: string;
  jurisdiction?: string;
  issuerName?: string;
  issuerAddress?: string;
  custodyProvider?: string;
  custodyUrl?: string;
  custodyIssuedDate?: string;
  valuationUrl?: string;
  valuationIssuedDate?: string;
  legalUrl?: string;
  legalIssuedDate?: string;
};

type SectionKey = "custody" | "valuation" | "legal" | "regulatory";
type CardState = "empty" | "incomplete" | "ready";

const EMPTY_PROOF: ProofInput = { url: "", issuedDate: "", expiryDate: "" };

const EMPTY_FORM: IssuerFormData = {
  assetName: "",
  symbol: "",
  category: "",
  jurisdiction: "",
  totalValueUsd: "",
  tokenSupply: "",
  issuerName: "",
  issuerAddress: "",
  custodyProvider: "",
  custody: { ...EMPTY_PROOF },
  valuation: { ...EMPTY_PROOF },
  legal: { ...EMPTY_PROOF },
  regulatory: { ...EMPTY_PROOF },
};

const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

const STEP1_KEYS: (keyof FormErrors)[] = [
  "assetName", "symbol", "category", "jurisdiction", "issuerName", "issuerAddress",
];
const STEP2_KEYS: (keyof FormErrors)[] = [
  "custodyProvider", "custodyUrl", "custodyIssuedDate",
  "valuationUrl", "valuationIssuedDate",
  "legalUrl", "legalIssuedDate",
];

// ── Validation ────────────────────────────────────────────────────────────────

function validate(form: IssuerFormData): FormErrors {
  const errors: FormErrors = {};
  if (!form.assetName.trim()) errors.assetName = "Required.";
  if (!form.symbol.trim()) errors.symbol = "Required.";
  else if (form.symbol.length > 10) errors.symbol = "Max 10 characters.";
  if (!form.category) errors.category = "Required.";
  if (!form.jurisdiction.trim()) errors.jurisdiction = "Required.";
  if (!form.issuerName.trim()) errors.issuerName = "Required.";
  if (form.issuerAddress && !EVM_ADDRESS.test(form.issuerAddress.trim()))
    errors.issuerAddress = "Must be a valid BNB Chain address (0x + 40 hex chars).";
  if (!form.custodyProvider.trim()) errors.custodyProvider = "Required.";
  if (!form.custody.url.trim()) errors.custodyUrl = "Required.";
  if (!form.custody.issuedDate.trim()) errors.custodyIssuedDate = "Required.";
  if (!form.valuation.url.trim()) errors.valuationUrl = "Required.";
  if (!form.valuation.issuedDate.trim()) errors.valuationIssuedDate = "Required.";
  if (!form.legal.url.trim()) errors.legalUrl = "Required.";
  if (!form.legal.issuedDate.trim()) errors.legalIssuedDate = "Required.";
  return errors;
}

// ── Card completion ───────────────────────────────────────────────────────────

function custodyCardState(form: IssuerFormData): CardState {
  const hasAny = form.custodyProvider || form.custody.url || form.custody.issuedDate;
  const complete = form.custodyProvider.trim() && form.custody.url.trim() && form.custody.issuedDate.trim();
  if (!hasAny) return "empty";
  return complete ? "ready" : "incomplete";
}

function valuationCardState(form: IssuerFormData): CardState {
  const hasAny = form.valuation.url || form.valuation.issuedDate;
  const complete = form.valuation.url.trim() && form.valuation.issuedDate.trim();
  if (!hasAny) return "empty";
  return complete ? "ready" : "incomplete";
}

function legalCardState(form: IssuerFormData): CardState {
  const hasAny = form.legal.url || form.legal.issuedDate;
  const complete = form.legal.url.trim() && form.legal.issuedDate.trim();
  if (!hasAny) return "empty";
  return complete ? "ready" : "incomplete";
}

function regulatoryCardState(form: IssuerFormData): CardState {
  const hasAny = form.regulatory.url || form.regulatory.issuedDate;
  if (!hasAny) return "empty";
  return "ready"; // regulatory is optional — any input is treated as "ready"
}

// ── Progress summary ──────────────────────────────────────────────────────────

function disclosureProgress(form: IssuerFormData): { ready: number; total: number; requiredComplete: boolean } {
  const states = [
    custodyCardState(form),
    valuationCardState(form),
    legalCardState(form),
    regulatoryCardState(form),
  ];
  const ready = states.filter(s => s === "ready").length;
  const requiredComplete =
    custodyCardState(form) === "ready" &&
    valuationCardState(form) === "ready" &&
    legalCardState(form) === "ready";
  return { ready, total: 4, requiredComplete };
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function IssuerNewPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<IssuerFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Which disclosure cards are open. Default: custody open, rest closed.
  const [openCards, setOpenCards] = useState<Set<SectionKey>>(new Set(["custody"]));
  const [checkingUrls, setCheckingUrls] = useState<Set<SectionKey>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const hasErr = (k: string): boolean =>
    touched.has(k) && !!(errors as Record<string, string | undefined>)[k];

  const errMsg = (k: string): string | undefined =>
    hasErr(k) ? (errors as Record<string, string | undefined>)[k] : undefined;

  const scrollToFirst = (keys: (keyof FormErrors)[]) => {
    if (!containerRef.current) return;
    for (const key of keys) {
      const el = containerRef.current.querySelector<HTMLElement>(`[data-field="${key}"]`);
      if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.focus(); break; }
    }
  };

  const toggleCard = (key: SectionKey) =>
    setOpenCards(s => {
      const next = new Set(s);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // ── Field updaters ───────────────────────────────────────────────────────

  const setScalar = (
    key: keyof Omit<IssuerFormData, "custody" | "valuation" | "legal" | "regulatory">,
    value: string
  ) => {
    const next = { ...form, [key]: value };
    setForm(next);
    setTouched(s => new Set([...s, key]));
    const errs = validate(next);
    setErrors(e => ({ ...e, [key]: errs[key as keyof FormErrors] }));
  };

  const blurScalar = (key: string) => {
    setTouched(s => new Set([...s, key]));
    const errs = validate(form);
    setErrors(e => ({ ...e, [key]: errs[key as keyof FormErrors] }));
  };

  const setProof = (
    section: SectionKey,
    field: keyof ProofInput,
    value: string
  ) => {
    const next = { ...form, [section]: { ...form[section], [field]: value } };
    setForm(next);
    const touchKey = `${section}${field.charAt(0).toUpperCase()}${field.slice(1)}`;
    setTouched(s => new Set([...s, touchKey]));
    const errs = validate(next);
    setErrors(e => ({ ...e, [touchKey]: errs[touchKey as keyof FormErrors] }));
  };

  const blurProof = (section: SectionKey, field: keyof ProofInput) => {
    const key = `${section}${field.charAt(0).toUpperCase()}${field.slice(1)}`;
    setTouched(s => new Set([...s, key]));
    const errs = validate(form);
    setErrors(e => ({ ...e, [key]: errs[key as keyof FormErrors] }));
  };

  const checkUrl = async (section: SectionKey, value: string) => {
    blurProof(section, "url");
    const trimmed = value.trim();
    if (!trimmed || !trimmed.startsWith("http")) return;

    setCheckingUrls(s => new Set([...s, section]));
    try {
      const res = await fetch(`/api/check-url?url=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const cred = (await res.json()) as LinkCredibility;
        setForm(prev => ({
          ...prev,
          [section]: { ...prev[section], credibility: cred },
        }));
      }
    } catch {
      // ignore silently to not block the user
    } finally {
      setCheckingUrls(s => {
        const next = new Set(s);
        next.delete(section);
        return next;
      });
    }
  };

  // ── Navigation ───────────────────────────────────────────────────────────

  const handleContinue = () => {
    const allErrs = validate(form);
    const s1Errs = Object.fromEntries(
      STEP1_KEYS.filter(k => k in allErrs).map(k => [k, allErrs[k]])
    ) as FormErrors;
    setTouched(s => new Set([...s, ...STEP1_KEYS]));
    setErrors(e => ({ ...e, ...s1Errs }));
    if (Object.keys(s1Errs).length > 0) {
      setTimeout(() => scrollToFirst(STEP1_KEYS), 0);
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allErrs = validate(form);
    const s2Errs = Object.fromEntries(
      STEP2_KEYS.filter(k => k in allErrs).map(k => [k, allErrs[k]])
    ) as FormErrors;
    setTouched(s => new Set([...s, ...STEP2_KEYS]));
    setErrors(e2 => ({ ...e2, ...s2Errs }));

    if (Object.keys(s2Errs).length > 0) {
      // Find the first failing card and open + scroll to it
      const custodyErrs = ["custodyProvider", "custodyUrl", "custodyIssuedDate"];
      const valuationErrs = ["valuationUrl", "valuationIssuedDate"];
      const legalErrs = ["legalUrl", "legalIssuedDate"];
      const failingSection: SectionKey | null =
        custodyErrs.some(k => k in s2Errs) ? "custody"
        : valuationErrs.some(k => k in s2Errs) ? "valuation"
        : legalErrs.some(k => k in s2Errs) ? "legal"
        : null;
      if (failingSection) {
        setOpenCards(s => new Set([...s, failingSection]));
      }
      setTimeout(() => scrollToFirst(STEP2_KEYS), 50);
      return;
    }
    setSubmitting(true);
    saveDraft(buildDraftProof(form));
    router.push("/proof/preview");
  };

  // ── Derived ──────────────────────────────────────────────────────────────

  const progress = disclosureProgress(form);
  const custodyState = custodyCardState(form);
  const valuationState = valuationCardState(form);
  const legalState = legalCardState(form);
  const regulatoryState = regulatoryCardState(form);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#09090b]">
      <header className="border-b border-zinc-900 px-8 py-4 flex items-center justify-between">
        <Link href="/" className="font-mono font-bold text-zinc-200 tracking-tight text-sm">
          ASSETPROOF
        </Link>
        <span className="text-zinc-600 text-xs font-mono">Register asset</span>
      </header>

      <div ref={containerRef} className="max-w-2xl mx-auto px-6 py-12">

        {/* Progress */}
        <div className="flex items-center gap-3 mb-10">
          <StepDot n={1} label="Asset & issuer" active={step === 1} done={step === 2} />
          <div className="h-px flex-1 bg-zinc-800" />
          <StepDot n={2} label="Disclosure" active={step === 2} done={false} />
        </div>

        {/* ── STEP 1 ────────────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-8">
            <SH label="Asset identity" hint="Basic information used to identify this issuance on-chain." />

            <div className="grid grid-cols-5 gap-4">
              <div className="col-span-3">
                <F label="Asset name" required error={errMsg("assetName")}>
                  <input
                    data-field="assetName"
                    type="text"
                    placeholder="APAC Infrastructure Income Fund"
                    value={form.assetName}
                    onChange={e => setScalar("assetName", e.target.value)}
                    onBlur={() => blurScalar("assetName")}
                    className={ic(hasErr("assetName"))}
                  />
                </F>
              </div>
              <div className="col-span-2">
                <F label="Symbol" required error={errMsg("symbol")}>
                  <input
                    data-field="symbol"
                    type="text"
                    placeholder="AIIF"
                    maxLength={10}
                    value={form.symbol}
                    onChange={e => setScalar("symbol", e.target.value.toUpperCase())}
                    onBlur={() => blurScalar("symbol")}
                    className={ic(hasErr("symbol")) + " font-mono tracking-widest uppercase"}
                  />
                </F>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <F label="Asset category" required error={errMsg("category")}>
                <select
                  data-field="category"
                  value={form.category}
                  onChange={e => setScalar("category", e.target.value)}
                  onBlur={() => blurScalar("category")}
                  className={ic(hasErr("category")) + " appearance-none"}
                >
                  <option value="">Select…</option>
                  {ASSET_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </F>
              <F label="Jurisdiction" required error={errMsg("jurisdiction")}>
                <input
                  data-field="jurisdiction"
                  type="text"
                  placeholder="Singapore"
                  value={form.jurisdiction}
                  onChange={e => setScalar("jurisdiction", e.target.value)}
                  onBlur={() => blurScalar("jurisdiction")}
                  className={ic(hasErr("jurisdiction"))}
                />
              </F>
            </div>

            {/* Advanced details toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(v => !v)}
                className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-400 text-xs font-mono transition-colors"
              >
                {showAdvanced
                  ? <ChevronDown className="w-3.5 h-3.5" />
                  : <ChevronRight className="w-3.5 h-3.5" />
                }
                Advanced details
              </button>
              {showAdvanced && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <F label="Total asset value (USD)">
                    <input
                      type="text"
                      placeholder="120,000,000"
                      value={form.totalValueUsd}
                      onChange={e => setScalar("totalValueUsd", e.target.value)}
                      className={ic(false)}
                    />
                  </F>
                  <F label="Token supply">
                    <input
                      type="text"
                      placeholder="120,000,000"
                      value={form.tokenSupply}
                      onChange={e => setScalar("tokenSupply", e.target.value)}
                      className={ic(false)}
                    />
                  </F>
                </div>
              )}
            </div>

            <div className="border-t border-zinc-900" />

            <SH label="Issuer" hint="The legal entity responsible for this token issuance." />

            <F label="Legal entity name" required error={errMsg("issuerName")}>
              <input
                data-field="issuerName"
                type="text"
                placeholder="Pacific Capital Management Ltd."
                value={form.issuerName}
                onChange={e => setScalar("issuerName", e.target.value)}
                onBlur={() => blurScalar("issuerName")}
                className={ic(hasErr("issuerName"))}
              />
            </F>

            <F
              label="BNB Chain wallet address"
              hint="Optional — the issuer's on-chain signing address."
              error={errMsg("issuerAddress")}
            >
              <input
                data-field="issuerAddress"
                type="text"
                placeholder="0x…"
                value={form.issuerAddress}
                onChange={e => setScalar("issuerAddress", e.target.value)}
                onBlur={() => blurScalar("issuerAddress")}
                className={ic(hasErr("issuerAddress")) + " font-mono"}
              />
            </F>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleContinue}
                className="px-6 py-2.5 bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg font-semibold text-sm transition-colors"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2 ────────────────────────────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleSubmit} noValidate className="space-y-6">

            {/* Progress summary row */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-zinc-100 font-semibold text-base">Disclosure documents</h2>
                <p className="text-zinc-500 text-sm mt-0.5">
                  Link each document that attests to this asset&rsquo;s disclosure state.
                </p>
              </div>
              <ProgressBadge ready={progress.ready} total={progress.total} complete={progress.requiredComplete} />
            </div>

            {/* Disclosure cards */}
            <div className="space-y-2">

              {/* CUSTODY */}
              <DisclosureCard
                sectionKey="custody"
                title="Custody"
                hint="Custody statement from the asset custodian."
                required
                state={custodyState}
                open={openCards.has("custody")}
                onToggle={() => toggleCard("custody")}
                hasError={["custodyProvider", "custodyUrl", "custodyIssuedDate"].some(k => hasErr(k))}
                collapsedSummary={
                  custodyState !== "empty"
                    ? [
                        form.custodyProvider || "—",
                        form.custody.url ? "URL set" : "No URL",
                        form.custody.issuedDate || "No date",
                        form.custody.expiryDate ? `Expires ${form.custody.expiryDate}` : "",
                      ].filter(Boolean)
                    : []
                }
              >
                <F label="Custody provider" required error={errMsg("custodyProvider")}>
                  <input
                    data-field="custodyProvider"
                    type="text"
                    placeholder="Standard Chartered Custody Services"
                    value={form.custodyProvider}
                    onChange={e => setScalar("custodyProvider", e.target.value)}
                    onBlur={() => blurScalar("custodyProvider")}
                    className={ic(hasErr("custodyProvider"))}
                  />
                </F>
                <F label="Custody statement URL" required error={errMsg("custodyUrl")}>
                  <input
                    data-field="custodyUrl"
                    type="url"
                    placeholder="https://…"
                    value={form.custody.url}
                    onChange={e => setProof("custody", "url", e.target.value)}
                    onBlur={() => checkUrl("custody", form.custody.url)}
                    className={ic(hasErr("custodyUrl")) + " font-mono text-xs"}
                  />
                  <CredibilityFeedback cred={form.custody.credibility} checking={checkingUrls.has("custody")} />
                </F>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Statement date" required error={errMsg("custodyIssuedDate")}>
                    <input
                      data-field="custodyIssuedDate"
                      type="date"
                      value={form.custody.issuedDate}
                      onChange={e => setProof("custody", "issuedDate", e.target.value)}
                      onBlur={() => blurProof("custody", "issuedDate")}
                      className={ic(hasErr("custodyIssuedDate"))}
                    />
                  </F>
                  <F label="Expiry date">
                    <input
                      type="date"
                      value={form.custody.expiryDate}
                      onChange={e => setProof("custody", "expiryDate", e.target.value)}
                      className={ic(false)}
                    />
                  </F>
                </div>
              </DisclosureCard>

              {/* VALUATION */}
              <DisclosureCard
                sectionKey="valuation"
                title="Valuation"
                hint="Independent report confirming the asset's current market value."
                required
                state={valuationState}
                open={openCards.has("valuation")}
                onToggle={() => toggleCard("valuation")}
                hasError={["valuationUrl", "valuationIssuedDate"].some(k => hasErr(k))}
                collapsedSummary={
                  valuationState !== "empty"
                    ? [
                        form.valuation.url ? "URL set" : "No URL",
                        form.valuation.issuedDate || "No date",
                        form.valuation.expiryDate ? `Review ${form.valuation.expiryDate}` : "",
                      ].filter(Boolean)
                    : []
                }
              >
                <F label="Valuation report URL" required error={errMsg("valuationUrl")}>
                  <input
                    data-field="valuationUrl"
                    type="url"
                    placeholder="https://…"
                    value={form.valuation.url}
                    onChange={e => setProof("valuation", "url", e.target.value)}
                    onBlur={() => checkUrl("valuation", form.valuation.url)}
                    className={ic(hasErr("valuationUrl")) + " font-mono text-xs"}
                  />
                  <CredibilityFeedback cred={form.valuation.credibility} checking={checkingUrls.has("valuation")} />
                </F>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Report date" required error={errMsg("valuationIssuedDate")}>
                    <input
                      data-field="valuationIssuedDate"
                      type="date"
                      value={form.valuation.issuedDate}
                      onChange={e => setProof("valuation", "issuedDate", e.target.value)}
                      onBlur={() => blurProof("valuation", "issuedDate")}
                      className={ic(hasErr("valuationIssuedDate"))}
                    />
                  </F>
                  <F label="Next review date">
                    <input
                      type="date"
                      value={form.valuation.expiryDate}
                      onChange={e => setProof("valuation", "expiryDate", e.target.value)}
                      className={ic(false)}
                    />
                  </F>
                </div>
              </DisclosureCard>

              {/* LEGAL */}
              <DisclosureCard
                sectionKey="legal"
                title="Legal"
                hint="Regulatory filing or legal opinion letter for this issuance."
                required
                state={legalState}
                open={openCards.has("legal")}
                onToggle={() => toggleCard("legal")}
                hasError={["legalUrl", "legalIssuedDate"].some(k => hasErr(k))}
                collapsedSummary={
                  legalState !== "empty"
                    ? [
                        form.legal.url ? "URL set" : "No URL",
                        form.legal.issuedDate || "No date",
                        form.legal.expiryDate ? `Renews ${form.legal.expiryDate}` : "",
                      ].filter(Boolean)
                    : []
                }
              >
                <F label="Legal filing URL" required error={errMsg("legalUrl")}>
                  <input
                    data-field="legalUrl"
                    type="url"
                    placeholder="https://…"
                    value={form.legal.url}
                    onChange={e => setProof("legal", "url", e.target.value)}
                    onBlur={() => checkUrl("legal", form.legal.url)}
                    className={ic(hasErr("legalUrl")) + " font-mono text-xs"}
                  />
                  <CredibilityFeedback cred={form.legal.credibility} checking={checkingUrls.has("legal")} />
                </F>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Filing date" required error={errMsg("legalIssuedDate")}>
                    <input
                      data-field="legalIssuedDate"
                      type="date"
                      value={form.legal.issuedDate}
                      onChange={e => setProof("legal", "issuedDate", e.target.value)}
                      onBlur={() => blurProof("legal", "issuedDate")}
                      className={ic(hasErr("legalIssuedDate"))}
                    />
                  </F>
                  <F label="Renewal date">
                    <input
                      type="date"
                      value={form.legal.expiryDate}
                      onChange={e => setProof("legal", "expiryDate", e.target.value)}
                      className={ic(false)}
                    />
                  </F>
                </div>
              </DisclosureCard>

              {/* REGULATORY — optional, visually secondary */}
              <DisclosureCard
                sectionKey="regulatory"
                title="Regulatory filing"
                hint="Any applicable regulatory registration or approval. Optional."
                required={false}
                state={regulatoryState}
                open={openCards.has("regulatory")}
                onToggle={() => toggleCard("regulatory")}
                hasError={false}
                collapsedSummary={
                  regulatoryState !== "empty"
                    ? [
                        form.regulatory.url ? "URL set" : "No URL",
                        form.regulatory.issuedDate || "",
                        form.regulatory.expiryDate ? `Renews ${form.regulatory.expiryDate}` : "",
                      ].filter(Boolean)
                    : []
                }
              >
                <F label="Regulatory filing URL">
                  <input
                    type="url"
                    placeholder="https://…"
                    value={form.regulatory.url}
                    onChange={e => setProof("regulatory", "url", e.target.value)}
                    onBlur={() => checkUrl("regulatory", form.regulatory.url)}
                    className={ic(false) + " font-mono text-xs"}
                  />
                  <CredibilityFeedback cred={form.regulatory.credibility} checking={checkingUrls.has("regulatory")} />
                </F>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Filing date">
                    <input
                      type="date"
                      value={form.regulatory.issuedDate}
                      onChange={e => setProof("regulatory", "issuedDate", e.target.value)}
                      className={ic(false)}
                    />
                  </F>
                  <F label="Renewal date">
                    <input
                      type="date"
                      value={form.regulatory.expiryDate}
                      onChange={e => setProof("regulatory", "expiryDate", e.target.value)}
                      className={ic(false)}
                    />
                  </F>
                </div>
              </DisclosureCard>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={[
                  "px-6 py-2.5 rounded-lg font-semibold text-sm transition-all",
                  progress.requiredComplete
                    ? "bg-zinc-100 hover:bg-white text-zinc-900"
                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400",
                  submitting ? "opacity-50 cursor-not-allowed" : "",
                ].join(" ")}
              >
                {submitting ? "Generating…" : "Generate proof"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

/** Input class — normal or error border. */
function ic(error: boolean): string {
  return [
    "w-full bg-zinc-950 border rounded-lg px-3 py-2.5 text-zinc-200 text-sm",
    "placeholder-zinc-700 focus:outline-none transition-colors",
    error
      ? "border-rose-800 focus:border-rose-600"
      : "border-zinc-800 focus:border-zinc-600",
  ].join(" ");
}

/** Section heading + helper sentence. */
function SH({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-zinc-100 font-semibold text-base">{label}</h2>
      <p className="text-zinc-500 text-sm leading-relaxed">{hint}</p>
    </div>
  );
}

/** Labeled field with optional error message. */
function F({
  label,
  required = false,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-zinc-400 text-xs">
        {label}
        {required && <span className="text-zinc-600 ml-1">*</span>}
      </label>
      {hint && <p className="text-zinc-600 text-xs -mt-0.5">{hint}</p>}
      {children}
      {error && <p className="text-rose-500 text-xs">{error}</p>}
    </div>
  );
}

/** Step progress dot. */
function StepDot({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-colors ${
          active
            ? "bg-zinc-100 text-zinc-900"
            : done
            ? "bg-emerald-950 text-emerald-400 border border-emerald-900"
            : "bg-zinc-900 text-zinc-600"
        }`}
      >
        {done ? "✓" : n}
      </div>
      <span className={`text-xs font-mono transition-colors ${active ? "text-zinc-200" : "text-zinc-600"}`}>
        {label}
      </span>
    </div>
  );
}

/** Compact disclosure progress badge shown next to section heading. */
function ProgressBadge({ ready, total, complete }: { ready: number; total: number; complete: boolean }) {
  if (complete) {
    return (
      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono">
        <Check className="w-3.5 h-3.5" />
        All required complete
      </div>
    );
  }
  return (
    <div className="text-zinc-500 text-xs font-mono">
      {ready} of {total} ready
    </div>
  );
}

/** Card state badge — shown inside the card header. */
function CardBadge({ state, hasError }: { state: CardState; hasError: boolean }) {
  if (hasError) {
    return (
      <span className="flex items-center gap-1 text-rose-400 text-xs font-mono">
        <AlertCircle className="w-3 h-3" />
        Incomplete
      </span>
    );
  }
  if (state === "ready") {
    return (
      <span className="flex items-center gap-1 text-emerald-400 text-xs font-mono">
        <Check className="w-3 h-3" />
        Ready
      </span>
    );
  }
  if (state === "incomplete") {
    return <span className="text-amber-500 text-xs font-mono">Incomplete</span>;
  }
  return <span className="text-zinc-700 text-xs font-mono">Not started</span>;
}

/** Collapsible disclosure card. */
function DisclosureCard({
  sectionKey,
  title,
  hint,
  required,
  state,
  open,
  onToggle,
  hasError,
  collapsedSummary,
  children,
}: {
  sectionKey: SectionKey;
  title: string;
  hint: string;
  required: boolean;
  state: CardState;
  open: boolean;
  onToggle: () => void;
  hasError: boolean;
  collapsedSummary: string[];
  children: React.ReactNode;
}) {
  const isReady = state === "ready" && !hasError;
  const borderClass = hasError
    ? "border-rose-900/50"
    : isReady
    ? "border-emerald-900/40"
    : "border-zinc-800/60";

  return (
    <div className={`rounded-xl border ${borderClass} bg-zinc-900/30 transition-colors`}>
      {/* Card header — always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left group"
        data-field={sectionKey === "custody" ? "custodyProvider" : undefined}
      >
        {/* Status dot */}
        <span
          className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
            hasError ? "bg-rose-600"
            : isReady ? "bg-emerald-500"
            : state === "incomplete" ? "bg-amber-500"
            : "bg-zinc-700"
          }`}
        />

        {/* Title + optional tag */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className={`text-sm font-medium transition-colors ${
            open ? "text-zinc-100" : "text-zinc-300"
          }`}>
            {title}
          </span>
          {!required && (
            <span className="text-zinc-700 text-xs font-mono">optional</span>
          )}
        </div>

        {/* Badge + collapsed summary + chevron */}
        <div className="flex items-center gap-3 shrink-0">
          {!open && collapsedSummary.length > 0 && (
            <div className="hidden sm:flex items-center gap-2">
              {collapsedSummary.slice(0, 3).map((s, i) => (
                <span key={i} className="text-zinc-600 text-xs font-mono truncate max-w-[120px]">
                  {s}
                </span>
              ))}
            </div>
          )}
          <CardBadge state={state} hasError={hasError} />
          <ChevronDown
            className={`w-3.5 h-3.5 text-zinc-600 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-zinc-800/50">
          <p className="text-zinc-600 text-xs pt-3 pb-1">{hint}</p>
          {children}
        </div>
      )}
    </div>
  );
}

/** Inline document credibility feedback */
function CredibilityFeedback({ cred, checking }: { cred?: LinkCredibility; checking: boolean }) {
  if (checking) {
    return (
      <div className="text-zinc-500 text-xs flex items-center gap-1.5 pt-1 font-mono">
        <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-pulse" />
        Checking link…
      </div>
    );
  }
  if (!cred) return null;

  if (cred.reachable) {
    const hint = cred.fileHint ? ` (${cred.fileHint.toUpperCase()})` : "";
    return (
      <div className="text-emerald-400 text-xs flex items-center gap-1.5 pt-1 font-mono">
        <Check className="w-3.5 h-3.5 text-emerald-500" />
        Reachable{hint}
      </div>
    );
  } else {
    if (cred.protocol !== "https" && cred.protocol !== "http") {
      return (
        <div className="text-rose-400 text-xs flex items-center gap-1.5 pt-1 font-mono">
          <AlertCircle className="w-3.5 h-3.5" />
          Invalid protocol ({cred.protocol})
        </div>
      );
    }
    if (cred.protocol === "http") {
      return (
        <div className="text-amber-500 text-xs flex items-center gap-1.5 pt-1 font-mono">
          <AlertCircle className="w-3.5 h-3.5" />
          Non-HTTPS link
        </div>
      );
    }
    const statusTxt = cred.status ? ` (${cred.status})` : "";
    return (
      <div className="text-amber-500 text-xs flex items-center gap-1.5 pt-1 font-mono">
        <AlertCircle className="w-3.5 h-3.5" />
        Could not reach link{statusTxt}
      </div>
    );
  }
}