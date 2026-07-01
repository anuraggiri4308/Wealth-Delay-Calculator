export type Frequency = "monthly" | "yearly";
export type DelayUnit = "months" | "years";

export interface CalcInputs {
  currentAge: number;
  frequency: Frequency;
  amount: number;
  investUntilAge: number;
  annualReturn: number;
  delayValue: number;
  delayUnit: DelayUnit;
}

export interface CalcResult {
  todayFV: number;
  todayInvested: number;
  todayReturns: number;
  todayPeriods: number; // in chosen frequency units
  laterFV: number;
  laterInvested: number;
  laterReturns: number;
  laterPeriods: number;
  wealthLost: number;
  wealthLostPct: number;
  wealthLostPerMonth: number;
  wealthLostPerYear: number;
  durationYears: number;
}

// Future value of a SIP / yearly investment with compounding, annuity-due style
function futureValue(amount: number, ratePerPeriod: number, periods: number): number {
  if (periods <= 0 || amount <= 0) return 0;
  if (ratePerPeriod === 0) return amount * periods;
  const fv =
    amount *
    ((Math.pow(1 + ratePerPeriod, periods) - 1) / ratePerPeriod) *
    (1 + ratePerPeriod);
  return fv;
}

export function calculate(inputs: CalcInputs): CalcResult {
  const { currentAge, frequency, amount, investUntilAge, annualReturn, delayValue, delayUnit } = inputs;

  const totalYears = Math.max(investUntilAge - currentAge, 0);
  const periodsPerYear = frequency === "monthly" ? 12 : 1;
  // Convert the annual return into a true effective per-period rate so that
  // compounding it back up over a year/periodsPerYear reproduces annualReturn exactly.
  const ratePerPeriod =
    frequency === "monthly"
      ? Math.pow(1 + annualReturn / 100, 1 / 12) - 1
      : annualReturn / 100;

  const todayPeriods = Math.round(totalYears * periodsPerYear);

  // Convert delay into the same period unit as frequency
  let delayInPeriods: number;
  if (frequency === "monthly") {
    delayInPeriods = delayUnit === "months" ? delayValue : delayValue * 12;
  } else {
    delayInPeriods = delayUnit === "years" ? delayValue : delayValue / 12;
  }
  delayInPeriods = Math.round(delayInPeriods);

  const laterPeriods = Math.max(todayPeriods - delayInPeriods, 0);

  const todayFV = futureValue(amount, ratePerPeriod, todayPeriods);
  const laterFV = futureValue(amount, ratePerPeriod, laterPeriods);

  const todayInvested = amount * todayPeriods;
  const laterInvested = amount * laterPeriods;

  const todayReturns = todayFV - todayInvested;
  const laterReturns = laterFV - laterInvested;

  const wealthLost = Math.max(todayFV - laterFV, 0);
  const wealthLostPct = todayFV > 0 ? (wealthLost / todayFV) * 100 : 0;

  const wealthLostPerMonth = totalYears > 0 ? wealthLost / (totalYears * 12) : 0;
  const wealthLostPerYear = totalYears > 0 ? wealthLost / totalYears : 0;

  return {
    todayFV,
    todayInvested,
    todayReturns,
    todayPeriods,
    laterFV,
    laterInvested,
    laterReturns,
    laterPeriods,
    wealthLost,
    wealthLostPct,
    wealthLostPerMonth,
    wealthLostPerYear,
    durationYears: totalYears,
  };
}

export function formatINR(value: number, compact = false): string {
  if (!isFinite(value)) return "₹0";
  const rounded = Math.round(value);
  if (compact) {
    const abs = Math.abs(rounded);
    if (abs >= 1_00_00_000) {
      return `₹${(rounded / 1_00_00_000).toFixed(2)} Cr`;
    }
    if (abs >= 1_00_000) {
      return `₹${(rounded / 1_00_000).toFixed(2)} L`;
    }
  }
  return `₹${rounded.toLocaleString("en-IN")}`;
}

export function buildInsight(inputs: CalcInputs, result: CalcResult): string {
  const delayLabel = `${inputs.delayValue} ${inputs.delayUnit === "months" ? (inputs.delayValue === 1 ? "month" : "months") : inputs.delayValue === 1 ? "year" : "years"}`;
  const lostCompact = formatINR(result.wealthLost, true);
  if (result.wealthLost <= 0) {
    return "Start investing today — every period you wait is a period your money doesn't get to compound.";
  }
  return `Waiting just ${delayLabel} could reduce your future wealth by ${lostCompact} because your money gets ${delayLabel} less to compound.`;
}
