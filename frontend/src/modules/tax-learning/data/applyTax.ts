export type TaxBand = { width: string | null; rate: string };

export type TaxRule = {
  id: string;
  mode: "verified" | "hypothetical";
  title: string;
  year_of_assessment: string | null;
  personal_relief: string;
  bands: TaxBand[];
  interest_ait_rate: string | null;
  expired: boolean;
  is_current: boolean;
  sources: Array<{ title: string; url: string }>;
  notes: string[];
  valid_from: string;
  valid_to: string;
  verification_date: string | null;
};

function money(raw: number): number {
  return Math.round(raw * 100) / 100;
}

export function applyTaxRule(rule: TaxRule, gross: number, incomeKind = "employment") {
  if (!Number.isFinite(gross) || gross < 0) {
    throw new Error("Income cannot be negative.");
  }
  const income = money(gross);
  const cap = Number(rule.personal_relief);
  const reliefUsed = money(Math.min(income, cap));
  let taxable = money(income - reliefUsed);
  let remaining = taxable;
  let tax = 0;
  const slices = rule.bands.map((band, index) => {
    if (remaining <= 0) {
      return { index, rate: band.rate, amount_in_band: 0, tax: 0 };
    }
    const width = band.width == null ? remaining : Number(band.width);
    const chunk = money(Math.min(remaining, width));
    const sliceTax = money(chunk * Number(band.rate));
    tax = money(tax + sliceTax);
    remaining = money(remaining - chunk);
    return { index, rate: band.rate, amount_in_band: chunk, tax: sliceTax };
  });
  return {
    ruleId: rule.id,
    mode: rule.mode,
    incomeKind,
    gross: income,
    reliefUsed,
    taxable,
    tax: money(tax),
    net: money(income - tax),
    slices,
    crossedRelief: taxable > 0,
    crossedFirstBand: Boolean(rule.bands[0]?.width && taxable > Number(rule.bands[0].width)),
  };
}

export function rupees(value: number) {
  return `Rs ${value.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
