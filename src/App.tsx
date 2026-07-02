import { useMemo, useState, useRef } from "react";
import { motion, type Variants, type Easing } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  calculate,
  formatINR,
  buildInsight,
  type Frequency,
  type DelayUnit,
  futureValue,
} from "./lib/calc";
import AnimatedNumber from "./components/AnimatedNumber";

const easeOut: Easing = [0.22, 1, 0.36, 1];
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
};

export default function App() {
  const [currentAge, setCurrentAge] = useState(22);
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [amount, setAmount] = useState(20000);
  const [amountInput, setAmountInput] = useState("20000");
  const [investUntilAge, setInvestUntilAge] = useState(60);
  const [annualReturn, setAnnualReturn] = useState(12);
  const [stepUp, setStepUp] = useState(0);
  const [delayValue, setDelayValue] = useState(1);
  const [delayUnit, setDelayUnit] = useState<DelayUnit>("years");
  const [lossView, setLossView] = useState<"monthly" | "yearly">("yearly");
  const topRef = useRef<HTMLDivElement>(null);

  const inputs = {
    currentAge,
    frequency,
    amount,
    investUntilAge,
    annualReturn,
    stepUp,
    delayValue,
    delayUnit,
  };
  const result = useMemo(
    () => calculate(inputs),
    [
      currentAge,
      frequency,
      amount,
      investUntilAge,
      annualReturn,
      stepUp,
      delayValue,
      delayUnit,
    ]
  );
  const insight = useMemo(() => buildInsight(inputs, result), [inputs, result]);

  // Effective monthly rate for chart (matches calc.ts)
  const ratePerPeriod =
    frequency === "monthly"
      ? Math.pow(1 + annualReturn / 100, 1 / 12) - 1
      : annualReturn / 100;

  const chartData = useMemo(() => {
    const periodsPerYear = frequency === "monthly" ? 12 : 1;
    const points = 12;
    const totalPeriods = Math.max(result.todayPeriods, 1);
    const data = [];
    for (let i = 0; i <= points; i++) {
      const periods = Math.round((totalPeriods * i) / points);
      // const laterPeriods = Math.max(
      //   periods - (result.todayPeriods - result.laterPeriods),
      //   0
      // );
      const delayPeriods = result.todayPeriods - result.laterPeriods;

      const laterPeriods = Math.max(periods - delayPeriods, 0);
      // const fvAt = (p: number) => {
      //   return futureValue(
      //     amount,
      //     ratePerPeriod,
      //     p,
      //     frequency === "monthly" ? 12 : 1,
      //     stepUp
      //   );
      // };
      data.push({
        year: Math.round((result.durationYears * i) / points),
        today: Math.round(
          futureValue(amount, ratePerPeriod, periods, periodsPerYear, stepUp)
        ),

        later: Math.round(
          futureValue(
            amount,
            ratePerPeriod,
            laterPeriods,
            periodsPerYear,
            stepUp
          )
        ),
      });
    }
    return data;
  }, [result, ratePerPeriod, amount, stepUp]);

  const handleCalculateAgain = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const delayLabel = `${delayValue} ${
    delayUnit === "months"
      ? delayValue === 1
        ? "Month"
        : "Months"
      : delayValue === 1
      ? "Year"
      : "Years"
  }`;
  return (
    <div className="min-h-screen bg-paper text-ink" ref={topRef}>
      <header className="relative overflow-hidden border-b border-line">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_#ece8f7,_transparent_55%)]" />
        <div className="mx-auto max-w-5xl px-6 pt-10 pb-8 sm:pt-14 sm:pb-10">
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="flex items-center gap-2 text-sm font-medium text-ink-soft"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-mint-500" />
            @anuraggirispeaks
          </motion.div>
          <motion.h1
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ delay: 0.05 }}
            className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-6xl"
          >
            Wealth Projection Calculator
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ delay: 0.1 }}
            className="mt-4 max-w-xl text-lg text-ink-soft"
          >
            Plan your investments, visualize your future wealth, and see how
            small changes today can make a big difference tomorrow.
          </motion.p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 space-y-16">
        {/* Investment Details */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
        >
          <SectionLabel>Investment Details</SectionLabel>
          <div className="mt-6 rounded-[20px] card-grad-neutral p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-8">
            <div className="grid gap-8 sm:grid-cols-2">
              <SliderField
                label="Current Age"
                value={currentAge}
                min={18}
                max={70}
                step={1}
                suffix=" yrs"
                onChange={setCurrentAge}
              />
              <SliderField
                label="Invest Until Age"
                value={investUntilAge}
                min={currentAge + 1}
                max={75}
                step={1}
                suffix=" yrs"
                onChange={setInvestUntilAge}
              />

              <SliderField
                label="Expected Annual Return"
                value={annualReturn}
                min={1}
                max={30}
                step={0.5}
                suffix="%"
                onChange={setAnnualReturn}
              />
              <SliderField
                label="Yearly Step-Up"
                value={stepUp}
                min={0}
                max={30}
                step={1}
                suffix="%"
                onChange={setStepUp}
              />
              <div>
                <FieldLabel>Investment Frequency</FieldLabel>
                <Toggle
                  options={[
                    { value: "monthly", label: "Monthly" },
                    { value: "yearly", label: "Yearly" },
                  ]}
                  value={frequency}
                  onChange={(v) => setFrequency(v as Frequency)}
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>
                  Investment Amount (
                  {frequency === "monthly" ? "per month" : "per year"})
                </FieldLabel>
                <AmountInput
                  value={amount}
                  inputValue={amountInput}
                  setInputValue={setAmountInput}
                  onChange={(newAmount) => {
                    setAmount(newAmount);
                  }}
                />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Start Today Result */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
        >
          <div className="rounded-[20px] card-grad-today p-8 text-white shadow-[0_20px_50px_rgba(15,174,107,0.25)] sm:p-10">
            <p className="text-sm font-medium uppercase tracking-wide text-white/70">
              If you start today
            </p>
            <div className="mt-3 font-mono-num font-bold text-[clamp(1.8rem,6vw,4rem)] leading-none">
              <AnimatedNumber value={result.todayFV} />
            </div>
            <div className="mt-8 grid grid-cols-1 gap-6 border-t border-white/20 pt-6 sm:grid-cols-3">
              <Stat
                label="Total Invested"
                value={formatINR(result.todayInvested, true)}
              />
              <Stat
                label="Wealth Created"
                value={formatINR(result.todayReturns, true)}
              />
              <Stat label="Duration" value={`${result.durationYears} Years`} />
            </div>
          </div>
        </motion.section>

        {/* Delay Input */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
        >
          <SectionLabel>What if you invest later?</SectionLabel>
          <div className="mt-6 rounded-[20px] card-grad-neutral p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-8">
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <FieldLabel>Delay</FieldLabel>
                <Stepper
                  value={delayValue}
                  onChange={setDelayValue}
                  min={0}
                  max={delayUnit === "months" ? 60 : 30}
                />
              </div>
              <div>
                <FieldLabel>Unit</FieldLabel>
                <Toggle
                  options={[
                    { value: "months", label: "Months" },
                    { value: "years", label: "Years" },
                  ]}
                  value={delayUnit}
                  onChange={(v) => setDelayUnit(v as DelayUnit)}
                />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Start Later Result */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
        >
          <div className="rounded-[20px] card-grad-later p-8 text-white shadow-[0_20px_50px_rgba(229,72,77,0.25)] sm:p-10">
            <p className="text-sm font-medium uppercase tracking-wide text-white/70">
              If you delay by {delayLabel}
            </p>
            <div className="mt-3 font-mono-num font-bold text-[clamp(1.8rem,6vw,4rem)] leading-none">
              <AnimatedNumber value={result.laterFV} />
            </div>
            <div className="mt-8 grid grid-cols-1 gap-6 border-t border-white/20 pt-6 sm:grid-cols-3">
              <Stat
                label="Total Invested"
                value={formatINR(result.laterInvested, true)}
              />
              <Stat
                label="Wealth Created"
                value={formatINR(result.laterReturns, true)}
              />
              <Stat
                label="Duration"
                value={`${(
                  result.laterPeriods / (frequency === "monthly" ? 12 : 1)
                ).toFixed(1)} Years`}
              />
            </div>
          </div>
        </motion.section>

        {/* Cost of Waiting */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
        >
          <div className="rounded-[20px] card-grad-loss p-10 text-center text-white shadow-[0_25px_60px_rgba(194,41,58,0.3)] sm:p-14">
            <p className="text-sm font-medium uppercase tracking-wide text-white/60">
              Cost of Waiting
            </p>
            <div className="mt-3 font-mono-num font-bold text-[clamp(1.8rem,6vw,4rem)] leading-none">
              <AnimatedNumber value={result.wealthLost} />
            </div>
            <p className="mx-auto mt-5 max-w-md text-white/70">
              By delaying your investment, this is the estimated wealth you
              could miss.
            </p>
          </div>
        </motion.section>

        {/* Wealth Lost per period */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
        >
          <div className="rounded-[20px] card-grad-insight p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-ember-500">
                  Estimated Wealth Lost
                </p>
                <div className="mt-2 font-mono-num text-3xl font-semibold text-ink sm:text-4xl">
                  <AnimatedNumber
                    value={
                      lossView === "monthly"
                        ? result.wealthLostPerMonth
                        : result.wealthLostPerYear
                    }
                  />
                  <span className="ml-1 text-base font-medium text-ink-soft font-sans">
                    / {lossView === "monthly" ? "month" : "year"}
                  </span>
                </div>
              </div>
              <Toggle
                options={[
                  { value: "monthly", label: "Monthly" },
                  { value: "yearly", label: "Yearly" },
                ]}
                value={lossView}
                onChange={(v) => setLossView(v as "monthly" | "yearly")}
              />
            </div>
          </div>
        </motion.section>

        {/* Visual Comparison */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
        >
          <SectionLabel>Visual Comparison</SectionLabel>
          <div className="mt-6 grid items-center gap-6 sm:grid-cols-[1fr_auto_1fr]">
            <div className="rounded-[18px] border border-mint-500/20 bg-mint-500/10 p-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-mint-600">
                Start Today
              </p>
              <div className="mt-2 font-mono-num text-2xl font-bold text-mint-600 sm:text-3xl">
                <AnimatedNumber value={result.todayFV} compact />
              </div>
            </div>
            <div className="mx-auto font-display text-lg font-semibold text-ink-soft">
              VS
            </div>
            <div className="rounded-[18px] border border-coral-500/20 bg-coral-500/10 p-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-coral-600">
                Start {delayLabel} Later
              </p>
              <div className="mt-2 font-mono-num text-2xl font-bold text-coral-600 sm:text-3xl">
                <AnimatedNumber value={result.laterFV} compact />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Progress Bar */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
        >
          <div className="rounded-[20px] card-grad-neutral p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-8">
            <div className="flex items-center justify-between">
              <FieldLabel>Wealth Lost %</FieldLabel>
              <span className="font-mono-num text-lg font-semibold text-coral-600">
                {result.wealthLostPct.toFixed(1)}%
              </span>
            </div>
            <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-line">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-coral-600 to-ember-500"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(result.wealthLostPct, 100)}%` }}
                transition={{ duration: 0.8, ease: easeOut }}
              />
            </div>
          </div>
        </motion.section>

        {/* Chart */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
        >
          <SectionLabel>Growth Comparison</SectionLabel>
          <div className="mt-6 rounded-[20px] card-grad-neutral p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-8">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="todayGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0fae6b" stopOpacity={0.5} />
                    <stop
                      offset="100%"
                      stopColor="#0fae6b"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                  <linearGradient id="laterGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e5484d" stopOpacity={0.5} />
                    <stop
                      offset="100%"
                      stopColor="#e5484d"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e7e5e0"
                  vertical={false}
                />
                <XAxis
                  dataKey="year"
                  tickFormatter={(v) => `Y${v}`}
                  stroke="#4a4f5a"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(v) => formatINR(v, true)}
                  stroke="#4a4f5a"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={70}
                />
                <Tooltip
                  formatter={(v) => formatINR(Number(v), true)}
                  labelFormatter={(l) => `Year ${l}`}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e7e5e0",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="today"
                  name="Start Today"
                  stroke="#0a8f57"
                  fill="url(#todayGrad)"
                  strokeWidth={2.5}
                />
                <Area
                  type="monotone"
                  dataKey="later"
                  name="Start Later"
                  stroke="#c2293a"
                  fill="url(#laterGrad)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        {/* Smart Insight */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
        >
          <div className="rounded-[20px] card-grad-hero p-8 text-white shadow-[0_20px_50px_rgba(109,91,208,0.25)] sm:p-10">
            <p className="text-sm font-medium uppercase tracking-wide text-white/60">
              Smart Insight
            </p>
            <p className="mt-3 font-display text-xl leading-snug sm:text-2xl">
              {insight}
            </p>
          </div>
        </motion.section>

        {/* Action */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
        >
          <div className="flex justify-center px-10 py-4">
            <ActionButton onClick={handleCalculateAgain}>
              Calculate Again
            </ActionButton>
          </div>
        </motion.section>

        {/* Bottom CTA */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
        >
          <div className="rounded-[20px] border border-line bg-white p-10 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-14">
            <p className="font-display text-2xl font-medium leading-snug text-ink sm:text-3xl">
              The best time to invest was yesterday.
              <br />
              The second best time is today.
            </p>
          </div>
        </motion.section>
      </main>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="text-sm text-ink-soft">
              <p>
                Copyright © 2026 Anurag Giri |{" "}
                <a
                  href="https://www.instagram.com/anuraggirispeaks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-ink underline decoration-mint-500 decoration-2 underline-offset-2 hover:text-mint-600"
                >
                  @anuraggirispeaks
                </a>{" "}
                | All rights reserved.
              </p>
              <p className="mt-1">For educational purposes only.</p>
            </div>
            <a
              href="https://topmate.io/anuraggiri"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-violet-500"
            >
              Talk with Anurag
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Shared UI components ───────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
      {children}
    </h2>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-3 block text-sm font-medium text-ink-soft">
      {children}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-white/60">
        {label}
      </p>
      <p className="mt-1 font-mono-num text-lg font-semibold">{value}</p>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink-soft">{label}</span>
        <span className="font-mono-num text-base font-semibold text-ink">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-line accent-violet-500"
      />
    </div>
  );
}

function AmountInput({
  value,
  inputValue,
  setInputValue,
  onChange,
}: {
  value: number;
  inputValue: string;
  setInputValue: (v: string) => void;
  onChange: (v: number) => void;
}) {
  const step = 500;
  return (
    <div className="space-y-3">
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono-num text-lg font-semibold text-ink-soft">
          ₹
        </span>
        <input
          type="number"
          min={1000}
          step={step}
          value={inputValue}
          onChange={(e) => {
            const text = e.target.value;
            setInputValue(text);
            if (text === "") return;
            const num = Number(text);
            if (!isNaN(num)) {
              onChange(num);
            }
          }}
          onBlur={() => {
            if (inputValue.trim() === "") {
              onChange(0);
              return;
            }

            const num = Number(inputValue);

            if (!isNaN(num)) {
              onChange(num);
              setInputValue(String(num));
            }
          }}
          className="w-full rounded-2xl border border-line bg-white py-3 pl-9 pr-4 font-mono-num text-lg font-semibold text-ink outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
        />
      </div>
      {/* Unlimited slider: drag to scale, type any value directly */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            const newValue = Math.max(500, value - step);
            setInputValue(String(newValue));
            onChange(newValue);
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink-soft transition hover:bg-line"
        >
          −
        </button>
        <input
          type="range"
          min={1000}
          max={500000}
          step={step}
          value={value}
          onChange={(e) => {
            const newValue = Number(e.target.value);
            setInputValue(String(newValue));
            onChange(newValue);
          }}
          className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-line accent-violet-500"
        />
        <button
          onClick={() => {
            const newValue = value + step;
            setInputValue(String(newValue));
            onChange(newValue);
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink-soft transition hover:bg-line"
        >
          +
        </button>
      </div>
    </div>
  );
}

function Toggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-line bg-white p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`relative rounded-full px-5 py-4 text-sm font-semibold transition-colors ${
            value === opt.value ? "text-white" : "text-ink-soft hover:text-ink"
          }`}
        >
          {value === opt.value && (
            <motion.span
              animate={`toggle-bg-${options.map((o) => o.value).join("-")}`}
              className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
            />
          )}
          <span className="relative z-10">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

function Stepper({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="inline-flex items-center gap-6 rounded-full border border-line bg-white px-2 py-4">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-paper text-lg font-bold text-ink-soft transition hover:bg-line"
      >
        −
      </button>
      <span className="font-mono-num w-10 text-center text-xl font-bold text-ink">
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-paper text-lg font-bold text-ink-soft transition hover:bg-line"
      >
        +
      </button>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  variant = "solid",
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "solid" | "ghost";
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-5 py-4 text-sm font-semibold transition-transform hover:-translate-y-0.5 ${
        variant === "solid"
          ? "bg-ink text-white hover:bg-violet-500"
          : "border border-line bg-white text-ink-soft hover:border-ink hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
