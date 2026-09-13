"use client";

import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { formatMonth, parseMonth } from "@/lib/dates";
import type { IncomeSource, LinkResolution, MortgageSource } from "@/lib/links";
import type { RetirementProfile } from "@/lib/types";
import { Panel } from "../ui/Panel";
import { MonthField, NumericField, TextSelectField } from "../ui/Field";

interface ProfilePanelProps {
  profile: RetirementProfile;
  /** The age the active outlook solves to, or null while the inputs don't project. */
  retirementAge: number | null;
  presenting: boolean;
  /** The mortgage tool's scenarios, or null until its stored state has been read. */
  mortgage: MortgageSource | null;
  /** How the mortgage link is faring, or null when the figures were typed in. */
  resolution: LinkResolution | null;
  /** The income tool's sources, or null until its stored state has been read. */
  income: IncomeSource | null;
  /** How the salary link is faring, or null when the salary was typed in. */
  salaryResolution: LinkResolution | null;
  onChange: <K extends keyof RetirementProfile>(field: K, value: RetirementProfile[K]) => void;
  onLink: (scenarioId: string | null) => void;
  onLinkSalary: (itemId: string | null) => void;
}

/** The option value standing for "every repeating source", against one named. */
const EVERY_SOURCE = "__all__";

/** The option value standing for "not linked to anything". */
const TYPED = "";

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-label uppercase tracking-[0.14em] text-ash">{label}</span>
      <span className="font-mono text-title font-medium tabular-nums">{value}</span>
    </div>
  );
}

/** The facts every outlook shares: edit them here, read them in presentation. */
export function ProfilePanel({
  profile,
  retirementAge,
  presenting,
  mortgage,
  resolution,
  income,
  salaryResolution,
  onChange,
  onLink,
  onLinkSalary,
}: ProfilePanelProps) {
  const mortgageEnds = profile.mortgagePayoff
    ? formatMonth(parseMonth(profile.mortgagePayoff))
    : "no end set";

  if (presenting) {
    return (
      <Panel bare className="mt-5">
        <div className="flex flex-wrap gap-x-7 gap-y-2.5">
          <Chip label="Age today" value={String(profile.currentAge)} />
          <Chip label="Money lasts to" value={String(profile.endAge)} />
          <Chip label="Salary" value={formatMoney(profile.salary)} />
          <Chip label="Mortgage ends" value={mortgageEnds} />
          {retirementAge !== null ? <Chip label="Retire at" value={String(retirementAge)} /> : null}
        </div>
      </Panel>
    );
  }

  const linkedId = profile.mortgageLink?.scenarioId ?? TYPED;
  const linked = Boolean(profile.mortgageLink);

  /*
   * "Typed in here" plus every scenario. A link whose scenario has since been
   * deleted keeps an option of its own: without one the select would fall back
   * to showing "typed in here", which is the opposite of what is going on.
   */
  const sourceOptions = [
    { value: TYPED, label: "Typed in here" },
    ...(mortgage?.scenarios ?? []).map((scenario) => ({
      value: scenario.id,
      label: scenario.name || "Untitled scenario",
    })),
    ...(linked && !(mortgage?.scenarios ?? []).some((scenario) => scenario.id === linkedId)
      ? [{ value: linkedId, label: "Deleted scenario" }]
      : []),
  ];

  const salaryLinkedId = profile.salaryLink?.itemId ?? "";
  const salaryOptions = [
    { value: TYPED, label: "Typed in here" },
    { value: EVERY_SOURCE, label: "Every repeating source" },
    ...(income?.items ?? []).map((item) => ({
      value: item.id,
      label: item.name || "Untitled source",
    })),
    ...(profile.salaryLink &&
    salaryLinkedId &&
    !(income?.items ?? []).some((item) => item.id === salaryLinkedId)
      ? [{ value: salaryLinkedId, label: "Deleted source" }]
      : []),
  ];

  return (
    <Panel className="mt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div className="eyebrow">You &mdash; applies to every outlook</div>
        <div className="eyebrow">
          {retirementAge !== null
            ? `${Math.max(0, retirementAge - profile.currentAge)} years to go on this outlook`
            : " "}
        </div>
      </div>

      <div className="mt-3.5 grid gap-x-7 gap-y-3.5 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
        <NumericField
          id="profile-age"
          label="Your age today"
          step={1}
          value={profile.currentAge}
          onChange={(value) => onChange("currentAge", value)}
        />
        <NumericField
          id="profile-end-age"
          label="Money has to last to"
          step={1}
          value={profile.endAge}
          onChange={(value) => onChange("endAge", value)}
        />
        {/* Only offered once the income tool's own figures have been read. */}
        {income ? (
          <TextSelectField
            id="profile-salary-source"
            label="Salary from"
            value={
              profile.salaryLink ? profile.salaryLink.itemId || EVERY_SOURCE : TYPED
            }
            options={salaryOptions}
            onChange={(value) =>
              onLinkSalary(value === TYPED ? null : value === EVERY_SOURCE ? "" : value)
            }
          />
        ) : null}

        <NumericField
          id="profile-salary"
          label="Gross salary"
          prefix="$"
          step={1000}
          value={profile.salary}
          disabled={Boolean(profile.salaryLink)}
          onChange={(value) => onChange("salary", value)}
        />
        <MonthField
          id="profile-start"
          label="Balances as of"
          value={profile.start}
          onChange={(value) => onChange("start", value)}
        />

        {/* Only offered once the mortgage tool's own figures have been read:
            until then there are no scenarios to list. */}
        {mortgage ? (
          <TextSelectField
            id="profile-mortgage-source"
            label="Mortgage figures from"
            value={linkedId}
            options={sourceOptions}
            onChange={(value) => onLink(value === TYPED ? null : value)}
          />
        ) : null}

        <NumericField
          id="profile-mortgage"
          label="Mortgage payment"
          prefix="$"
          step={25}
          value={profile.mortgagePayment}
          disabled={linked}
          onChange={(value) => onChange("mortgagePayment", value)}
        />
        <MonthField
          id="profile-mortgage-payoff"
          label="Mortgage paid off"
          value={profile.mortgagePayoff}
          disabled={linked}
          onChange={(value) => onChange("mortgagePayoff", value)}
        />
      </div>

      {salaryResolution && salaryResolution.status !== "pending" ? (
        <p
          className={cn(
            "mx-0 mb-0 mt-3 text-sm leading-[1.5]",
            salaryResolution.status === "live" ? "text-ash" : "text-brass",
          )}
        >
          {salaryResolution.status === "live"
            ? `Salary from the income tool · ${salaryResolution.note}`
            : salaryResolution.note}
        </p>
      ) : null}

      {resolution && resolution.status !== "pending" ? (
        <p
          className={cn(
            "mx-0 mb-0 mt-3 text-sm leading-[1.5]",
            resolution.status === "live" ? "text-ash" : "text-brass",
          )}
        >
          {resolution.status === "live"
            ? `From the mortgage tool · ${resolution.sourceName} · ${resolution.note} The payment includes that scenario's extra principal, because the payoff date assumes you are paying it.`
            : resolution.note}
        </p>
      ) : null}
    </Panel>
  );
}
