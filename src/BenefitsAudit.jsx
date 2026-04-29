import React, { useState, useMemo } from "react";
import { ChevronRight, ChevronLeft, Check, AlertCircle, Sparkles, ArrowRight, Shield, Clock, Star, Quote, Calendar, Phone, Mail, User, CheckCircle2, Plus, Minus, ExternalLink, DollarSign, FileText, Download, Printer, Package, Lock, RotateCcw } from "lucide-react";

// ── 2026 Federal Poverty Level (48 states + DC) ─────────────────────────
const FPL_2026 = { 1: 15650, 2: 21150 };

const THRESHOLDS = {
  QMB:   { incomeSingle: 1325, incomeCouple: 1783, assetSingle: 9660,  assetCouple: 14470 },
  SLMB:  { incomeSingle: 1585, incomeCouple: 2135, assetSingle: 9660,  assetCouple: 14470 },
  QI:    { incomeSingle: 1781, incomeCouple: 2400, assetSingle: 9660,  assetCouple: 14470 },
  LIS:   { incomeSingle: 1955, incomeCouple: 2649, assetSingle: 17600, assetCouple: 35130 },
  SNAP:  { fplMultiple: 1.65 },
};

// ── STATE DATA ──────────────────────────────────────────────────────────
// Per-state config: Medigap carriers, state-specific programs, agency URLs.
// Eight states are seeded with detail; others fall back to NATIONAL_CARRIERS
// and federal-only programs with a "state-specific data coming soon" note.
//
// Maintenance note: re-verify thresholds and URLs each January when CMS and
// state agencies publish annual updates.

// Carrier data structure (Plan G 2026):
//   rangeMonthly: typical premium range for 65-yr-old non-smoker
//   rating: pricing methodology — drives long-term cost (attained-age, issue-age, community)
//   amBest: AM Best financial strength rating
//   householdDiscount: spousal discount % (0 if none)
//   strength: one-line distinguishing feature
const NATIONAL_CARRIERS = [
  {
    name: "Cigna Healthcare", rangeMonthly: "$140 – $180",
    rating: "attained-age", amBest: "A", householdDiscount: 7,
    strength: "Often the lowest-priced new-enrollee Plan G nationally. Strong household discount.",
    url: "https://www.cigna.com/individuals-families/shop-plans/supplemental/medicare-supplement",
  },
  {
    name: "Mutual of Omaha", rangeMonthly: "$155 – $195",
    rating: "attained-age", amBest: "A+", householdDiscount: 7,
    strength: "Stable rate increases, A+ financial strength, reliable claims handling.",
    url: "https://www.mutualofomaha.com/medicare-supplement-insurance",
  },
  {
    name: "Aetna", rangeMonthly: "$150 – $200",
    rating: "attained-age", amBest: "A", householdDiscount: 5,
    strength: "Manageable rate increases over time. Backed by CVS Health.",
    url: "https://www.aetnamedicare.com/en/understanding-medicare/supplement-plans.html",
  },
  {
    name: "United American (Globe Life)", rangeMonthly: "$130 – $170",
    rating: "attained-age", amBest: "A", householdDiscount: 0,
    strength: "Frequently among the lowest premiums but no household discount.",
    url: "https://www.unitedamerican.com/medicare-supplement-insurance",
  },
  {
    name: "United Healthcare (AARP)", rangeMonthly: "$170 – $220",
    rating: "community-rated", amBest: "A", householdDiscount: 5,
    strength: "Largest Medigap insurer; AARP membership ($16/yr) required. AM Best downgraded from A+ to A in Aug 2025.",
    url: "https://www.aarpmedicaresupplement.com/",
  },
];

// State name lookup
const STATE_NAMES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

const STATE_DATA = {
  MD: {
    name: "Maryland",
    seeded: true,
    mspApplyUrl: "https://health.maryland.gov/mmcp/Pages/Medicare-Savings-Programs.aspx",
    snapApplyUrl: "https://mymdthink.maryland.gov/",
    shipUrl: "https://aging.maryland.gov/Pages/state-health-insurance-program.aspx",
    medigapCarriers: [
      { name: "Cigna Healthcare", rangeMonthly: "$140 – $175", rating: "attained-age", amBest: "A", householdDiscount: 7, strength: "Typically the lowest-priced new-enrollee Plan G in MD. 7% household discount.", url: "https://www.cigna.com/individuals-families/shop-plans/supplemental/medicare-supplement" },
      { name: "Aetna", rangeMonthly: "$150 – $190", rating: "attained-age", amBest: "A", householdDiscount: 5, strength: "Reliable rate stability backed by CVS Health.", url: "https://www.aetnamedicare.com/en/understanding-medicare/supplement-plans.html" },
      { name: "Mutual of Omaha", rangeMonthly: "$160 – $195", rating: "attained-age", amBest: "A+", householdDiscount: 7, strength: "A+ financial strength, manageable annual rate increases.", url: "https://www.mutualofomaha.com/medicare-supplement-insurance" },
      { name: "United Healthcare (AARP)", rangeMonthly: "$175 – $220", rating: "attained-age", amBest: "A", householdDiscount: 5, strength: "AARP-branded, largest Medigap insurer in MD. Membership required.", url: "https://www.aarpmedicaresupplement.com/" },
      { name: "CareFirst BlueCross BlueShield", rangeMonthly: "$185 – $230", rating: "attained-age", amBest: "A", householdDiscount: 0, strength: "Local Maryland insurer, premium pricing reflects brand strength.", url: "https://individual.carefirst.com/individuals-families/medicare/medicare-supplement-plans/medicare-supplement-plans.page" },
    ],
    medigapRateUrl: "https://insurance.maryland.gov/Consumer/Pages/Medigap-Rates.aspx",
    programs: [
      {
        id: "spdap", tier: 2,
        name: "Maryland SPDAP (Senior Prescription Drug Assistance)",
        value: "Up to $900/year", valueAmount: 900,
        eligible: ({ annualIncome, fplAnnual }) => annualIncome <= fplAnnual * 3.0,
        inPlainEnglish: "A Maryland-only program that contributes up to $75/month directly to your Part D plan. No asset test — just income.",
        why: "Pays up to $75/month toward your Part D premium. Most Maryland seniors don't know it exists.",
        action: "Apply at marylandspdap.com or call 1-800-551-5995. Requires 6 months MD residency and a Part D plan.",
        applyUrl: "https://marylandspdap.com/",
        stack: "Stacks on top of Extra Help.",
      },
      {
        id: "md_property_tax", tier: 2,
        name: "Maryland Homeowners' Property Tax Credit + Senior Supplement",
        value: "$500 – $2,000/year", valueAmount: 1000,
        eligible: ({ annualIncome, ageNum, homeowner }) => homeowner === "yes" && annualIncome <= 60000 && ageNum >= 65,
        inPlainEnglish: "Caps your property tax based on income, with an extra credit if you're 65+. Several MD counties layer additional senior supplements.",
        why: "Anne Arundel, Howard, Montgomery, and Baltimore Counties all add a senior supplement on top of the state credit.",
        action: "Apply through Maryland SDAT. Deadline October 1 each year.",
        applyUrl: "https://dat.maryland.gov/realproperty/Pages/Homeowners'-Property-Tax-Credit-Program.aspx",
      },
      {
        id: "md_call_check", tier: 3,
        name: "Maryland Senior Call Check",
        value: "Free — peace of mind",
        eligible: ({ ageNum }) => ageNum >= 65,
        inPlainEnglish: "Free daily automated check-in call from the Maryland Department of Aging. If you don't pick up, they alert someone you've designated.",
        why: "Free service from MD Department of Aging.",
        action: "Enroll at aging.maryland.gov or call 1-866-502-0560.",
        applyUrl: "https://aging.maryland.gov/Pages/SeniorCallCheck.aspx",
      },
    ],
  },
  CA: {
    name: "California",
    seeded: true,
    mspApplyUrl: "https://www.dhcs.ca.gov/services/medi-cal/Pages/Medicare-Savings-Programs.aspx",
    snapApplyUrl: "https://benefitscal.com/",
    shipUrl: "https://cahealthadvocates.org/hicap/",
    medigapCarriers: [
      { name: "Cigna Healthcare", rangeMonthly: "$145 – $190", rating: "attained-age", amBest: "A", householdDiscount: 7, strength: "Typically lowest-priced new-enrollee Plan G in CA. 7% household discount.", url: "https://www.cigna.com/individuals-families/shop-plans/supplemental/medicare-supplement" },
      { name: "Mutual of Omaha", rangeMonthly: "$155 – $200", rating: "attained-age", amBest: "A+", householdDiscount: 7, strength: "A+ rated. Reliable claims handling. CA birthday rule applies (switch carriers without underwriting).", url: "https://www.mutualofomaha.com/medicare-supplement-insurance" },
      { name: "Aetna", rangeMonthly: "$160 – $205", rating: "attained-age", amBest: "A", householdDiscount: 5, strength: "Manageable rate increases over time. Backed by CVS Health.", url: "https://www.aetnamedicare.com/en/understanding-medicare/supplement-plans.html" },
      { name: "United Healthcare (AARP)", rangeMonthly: "$170 – $225", rating: "attained-age", amBest: "A", householdDiscount: 5, strength: "Large network. AARP membership required.", url: "https://www.aarpmedicaresupplement.com/" },
      { name: "Anthem Blue Cross", rangeMonthly: "$190 – $245", rating: "attained-age", amBest: "A", householdDiscount: 0, strength: "Strong local CA brand recognition; premium pricing reflects that.", url: "https://www.anthem.com/medicare/medicare-supplement/" },
    ],
    medigapNote: "California has a 'birthday rule' — every year, in the 60 days following your birthday, you can switch to any equal-or-lesser Medigap plan with the same or different carrier without medical underwriting. Use it.",
    medigapRateUrl: "https://www.insurance.ca.gov/01-consumers/105-type/95-guides/05-health/medsupp.cfm",
    programs: [
      {
        id: "ca_property_tax", tier: 2,
        name: "California Property Tax Postponement",
        value: "Defers tax bill",
        eligible: ({ annualIncome, ageNum, homeowner }) => homeowner === "yes" && annualIncome <= 49017 && ageNum >= 62,
        inPlainEnglish: "California lets seniors defer property tax payments until the home is sold. The state pays your tax bill directly to the county.",
        why: "Reduces immediate cash burden. Requires 40% home equity and income at or below the limit.",
        action: "Apply through the California State Controller's Office.",
        applyUrl: "https://www.sco.ca.gov/ardtax_prop_tax_postponement.html",
      },
      {
        id: "ca_lifeline", tier: 3,
        name: "California LifeLine Phone Discount",
        value: "Up to $360/year",
        eligible: ({ income }) => income <= 2700,
        inPlainEnglish: "Discount on home or wireless phone service for income-eligible Californians. Roughly $19–30 off your monthly bill.",
        why: "Available to anyone meeting the income limit, regardless of age.",
        action: "Apply at californialifeline.com.",
        applyUrl: "https://www.californialifeline.com/en",
      },
    ],
  },
  NY: {
    name: "New York",
    seeded: true,
    mspApplyUrl: "https://www.health.ny.gov/health_care/medicaid/program/medicare_savings/",
    snapApplyUrl: "https://www.mybenefits.ny.gov/",
    shipUrl: "https://aging.ny.gov/health-insurance-information-counseling-and-assistance-program-hiicap",
    medigapCarriers: [
      // NY has community-rated Medigap by law — same rate regardless of age
      { name: "Empire BlueCross BlueShield", rangeMonthly: "$285 – $315", rating: "community-rated", amBest: "A", householdDiscount: 0, strength: "Local NY plan, often most competitive. Community rating means rate stays flat with age.", url: "https://www.empireblue.com/medicare/" },
      { name: "Mutual of Omaha", rangeMonthly: "$295 – $330", rating: "community-rated", amBest: "A+", householdDiscount: 0, strength: "Strong A+ financial rating, year-round guaranteed-issue access in NY.", url: "https://www.mutualofomaha.com/medicare-supplement-insurance" },
      { name: "United Healthcare (AARP)", rangeMonthly: "$305 – $340", rating: "community-rated", amBest: "A", householdDiscount: 0, strength: "Largest national insurer; recognized brand for NY members.", url: "https://www.aarpmedicaresupplement.com/" },
      { name: "Aetna", rangeMonthly: "$310 – $355", rating: "community-rated", amBest: "A", householdDiscount: 0, strength: "Higher-priced in NY but stable rate history.", url: "https://www.aetnamedicare.com/en/understanding-medicare/supplement-plans.html" },
    ],
    medigapRateUrl: "https://www.dfs.ny.gov/consumers/health_insurance/medicare_supplement_insurance",
    medigapNote: "New York requires community rating — your premium can't be raised because of your age. That's why NY rates look higher than other states for younger enrollees but stay flat over time.",
    programs: [
      {
        id: "epic", tier: 1,
        name: "EPIC (Elderly Pharmaceutical Insurance Coverage)",
        value: "$2,000 – $5,000/year",
        valueAmount: 3000,
        eligible: ({ annualIncome, ageNum, marital }) => ageNum >= 65 && (marital === "couple" ? annualIncome <= 92000 : annualIncome <= 75000),
        inPlainEnglish: "New York-only program that helps cover Part D copays and the coverage gap. Two plans based on income; both stack with Medicare.",
        why: "Available to NY residents 65+ with income up to $75,000 single / $92,000 married.",
        action: "Apply through NY State Department of Health.",
        applyUrl: "https://www.health.ny.gov/health_care/epic/",
        stack: "Stacks with Extra Help and Part D.",
      },
      {
        id: "ny_star", tier: 2,
        name: "Enhanced STAR Property Tax Exemption",
        value: "$1,000 – $1,400/year", valueAmount: 1200,
        eligible: ({ annualIncome, ageNum, homeowner }) => homeowner === "yes" && annualIncome <= 107300 && ageNum >= 65,
        inPlainEnglish: "Higher-tier STAR property tax exemption for homeowners 65+. Reduces school tax portion of your property tax bill.",
        why: "NY has both Basic and Enhanced STAR — Enhanced gives bigger savings to seniors.",
        action: "Apply through your local assessor or NY Tax & Finance.",
        applyUrl: "https://www.tax.ny.gov/pit/property/star/",
      },
      {
        id: "ny_heap", tier: 3,
        name: "HEAP (Home Energy Assistance Program)",
        value: "Up to $1,000/year",
        eligible: ({ annualIncome, marital }) => marital === "couple" ? annualIncome <= 67950 : annualIncome <= 51990,
        inPlainEnglish: "Helps NY seniors pay heating bills. Regular and emergency benefits available each winter.",
        why: "Higher income limits than federal LIHEAP — many seniors qualify.",
        action: "Apply through your local Department of Social Services.",
        applyUrl: "https://otda.ny.gov/programs/heap/",
      },
    ],
  },
  FL: {
    name: "Florida",
    seeded: true,
    mspApplyUrl: "https://www.myflfamilies.com/services/public-assistance/medicaid",
    snapApplyUrl: "https://www.myflfamilies.com/services/public-assistance/food-assistance",
    shipUrl: "https://www.floridashine.org/",
    medigapCarriers: [
      { name: "Cigna Healthcare", rangeMonthly: "$280 – $340", rating: "attained-age", amBest: "A", householdDiscount: 7, strength: "Often lowest-priced new-enrollee Plan G in FL — but FL is the second most expensive state nationally.", url: "https://www.cigna.com/individuals-families/shop-plans/supplemental/medicare-supplement" },
      { name: "Mutual of Omaha", rangeMonthly: "$310 – $370", rating: "attained-age", amBest: "A+", householdDiscount: 7, strength: "A+ financial strength matters more in FL given high claims environment.", url: "https://www.mutualofomaha.com/medicare-supplement-insurance" },
      { name: "Florida Blue", rangeMonthly: "$320 – $390", rating: "attained-age", amBest: "A", householdDiscount: 0, strength: "Local FL plan with strong provider network. Premium pricing but reliable.", url: "https://www.floridablue.com/medicare/medicare-supplement-plans" },
      { name: "United Healthcare (AARP)", rangeMonthly: "$340 – $420", rating: "attained-age", amBest: "A", householdDiscount: 5, strength: "Largest national insurer; AARP membership required.", url: "https://www.aarpmedicaresupplement.com/" },
      { name: "Aetna", rangeMonthly: "$350 – $450", rating: "attained-age", amBest: "A", householdDiscount: 5, strength: "Aetna runs higher in FL; rate stability over time is a tradeoff.", url: "https://www.aetnamedicare.com/en/understanding-medicare/supplement-plans.html" },
    ],
    medigapNote: "Florida has the second-highest Medigap rates in the country due to demographics, claims volume, and limited carrier competition. Shopping aggressively across 5+ carriers can save $1,500–$2,400 per year.",
    programs: [
      {
        id: "fl_homestead", tier: 2,
        name: "Florida Senior Homestead Exemption",
        value: "$25,000 – $50,000 assessed value reduction",
        valueAmount: 750,
        eligible: ({ annualIncome, ageNum, homeowner }) => homeowner === "yes" && annualIncome <= 35167 && ageNum >= 65,
        inPlainEnglish: "Reduces the taxable assessed value of your Florida home if you're 65+ and meet income limits. Many counties add their own additional exemption.",
        why: "Florida has no state income tax — property taxes are the main local levy. This is the most valuable senior tax break in FL.",
        action: "Apply through your county Property Appraiser's office.",
        applyUrl: "https://floridarevenue.com/property/Pages/Taxpayers_Exemptions.aspx",
      },
    ],
  },
  TX: {
    name: "Texas",
    seeded: true,
    mspApplyUrl: "https://www.hhs.texas.gov/services/financial/medicaid",
    snapApplyUrl: "https://yourtexasbenefits.com/",
    shipUrl: "https://www.tdi.texas.gov/consumer/hicap/",
    medigapCarriers: [
      { name: "Cigna Healthcare", rangeMonthly: "$155 – $185", rating: "attained-age", amBest: "A", householdDiscount: 7, strength: "Cigna runs particularly low in Texas — often $50+/mo cheaper than Aetna for identical coverage.", url: "https://www.cigna.com/individuals-families/shop-plans/supplemental/medicare-supplement" },
      { name: "BlueCross BlueShield of Texas", rangeMonthly: "$160 – $200", rating: "attained-age", amBest: "A", householdDiscount: 0, strength: "Highly competitive in TX, often goes toe-to-toe with Cigna. Strong local provider network.", url: "https://www.bcbstx.com/medicare/" },
      { name: "Mutual of Omaha", rangeMonthly: "$165 – $205", rating: "attained-age", amBest: "A+", householdDiscount: 7, strength: "A+ financial strength, manageable rate increases.", url: "https://www.mutualofomaha.com/medicare-supplement-insurance" },
      { name: "United Healthcare (AARP)", rangeMonthly: "$180 – $225", rating: "attained-age", amBest: "A", householdDiscount: 5, strength: "Largest national insurer; AARP membership required.", url: "https://www.aarpmedicaresupplement.com/" },
      { name: "Aetna", rangeMonthly: "$210 – $245", rating: "attained-age", amBest: "A", householdDiscount: 5, strength: "Aetna runs noticeably higher in Texas. Compare against Cigna or BCBSTX first.", url: "https://www.aetnamedicare.com/en/understanding-medicare/supplement-plans.html" },
    ],
    programs: [
      {
        id: "tx_property_tax", tier: 2,
        name: "Texas Senior Property Tax Freeze",
        value: "Caps school district tax",
        valueAmount: 1500,
        eligible: ({ ageNum, homeowner }) => homeowner === "yes" && ageNum >= 65,
        inPlainEnglish: "Texas freezes the school-district portion of your property tax in the year you turn 65 — it can never increase, even if your home appreciates.",
        why: "Available to all Texas homeowners 65+, no income limit. One of the most generous senior tax benefits in any state.",
        action: "Apply through your county Appraisal District.",
        applyUrl: "https://comptroller.texas.gov/taxes/property-tax/exemptions/",
      },
    ],
  },
  PA: {
    name: "Pennsylvania",
    seeded: true,
    mspApplyUrl: "https://www.dhs.pa.gov/Services/Assistance/Pages/Medical-Assistance.aspx",
    snapApplyUrl: "https://www.dhs.pa.gov/Services/Assistance/Pages/SNAP.aspx",
    shipUrl: "https://www.aging.pa.gov/aging-services/pages/apprise.aspx",
    medigapCarriers: [
      { name: "Cigna Healthcare", rangeMonthly: "$145 – $180", rating: "attained-age", amBest: "A", householdDiscount: 7, strength: "Often the lowest-priced Plan G in PA. Strong household discount.", url: "https://www.cigna.com/individuals-families/shop-plans/supplemental/medicare-supplement" },
      { name: "Aetna", rangeMonthly: "$155 – $195", rating: "attained-age", amBest: "A", householdDiscount: 5, strength: "Manageable rate stability. Backed by CVS Health.", url: "https://www.aetnamedicare.com/en/understanding-medicare/supplement-plans.html" },
      { name: "Mutual of Omaha", rangeMonthly: "$160 – $200", rating: "attained-age", amBest: "A+", householdDiscount: 7, strength: "A+ financial strength, predictable rate increases over time.", url: "https://www.mutualofomaha.com/medicare-supplement-insurance" },
      { name: "Highmark BlueShield", rangeMonthly: "$170 – $215", rating: "attained-age", amBest: "A", householdDiscount: 0, strength: "Dominant PA Blue plan, strong provider network across the state.", url: "https://www.highmark.com/health-insurance/medicare/medicare-supplement.html" },
      { name: "United Healthcare (AARP)", rangeMonthly: "$180 – $230", rating: "attained-age", amBest: "A", householdDiscount: 5, strength: "Largest national insurer; AARP membership required.", url: "https://www.aarpmedicaresupplement.com/" },
    ],
    programs: [
      {
        id: "pace_pa", tier: 1,
        name: "PACE / PACENET (PA Pharmaceutical Assistance)",
        value: "$2,000 – $4,000/year",
        valueAmount: 2500,
        eligible: ({ annualIncome, ageNum, marital }) => ageNum >= 65 && (marital === "couple" ? annualIncome <= 41500 : annualIncome <= 33500),
        inPlainEnglish: "Pennsylvania's prescription drug program for seniors. Caps copays at $6 generic / $9 brand. Funded by lottery revenue.",
        why: "PA seniors 65+ with limited income. PACENET covers slightly higher incomes than PACE.",
        action: "Apply through PA Department of Aging.",
        applyUrl: "https://www.aging.pa.gov/aging-services/prescriptions/Pages/default.aspx",
      },
      {
        id: "pa_property_rebate", tier: 2,
        name: "PA Property Tax/Rent Rebate",
        value: "Up to $1,000/year",
        valueAmount: 800,
        eligible: ({ annualIncome, ageNum }) => ageNum >= 65 && annualIncome <= 45000,
        inPlainEnglish: "Cash rebate of property taxes or rent paid, for PA seniors and people with disabilities.",
        why: "Income limits raised significantly in 2024 — many more seniors now qualify than before.",
        action: "File Form PA-1000 with PA Department of Revenue.",
        applyUrl: "https://www.revenue.pa.gov/IncentivesCreditsPrograms/PTRR/",
      },
    ],
  },
  VA: {
    name: "Virginia",
    seeded: true,
    mspApplyUrl: "https://www.dmas.virginia.gov/for-members/medicaid-programs/medicare-savings-programs/",
    snapApplyUrl: "https://www.commonhelp.virginia.gov/",
    shipUrl: "https://www.vda.virginia.gov/vicap.htm",
    medigapCarriers: [
      { name: "Cigna Healthcare", rangeMonthly: "$140 – $175", rating: "attained-age", amBest: "A", householdDiscount: 7, strength: "Typically lowest-priced new-enrollee Plan G in VA.", url: "https://www.cigna.com/individuals-families/shop-plans/supplemental/medicare-supplement" },
      { name: "Aetna", rangeMonthly: "$150 – $190", rating: "attained-age", amBest: "A", householdDiscount: 5, strength: "Reliable rate stability backed by CVS Health.", url: "https://www.aetnamedicare.com/en/understanding-medicare/supplement-plans.html" },
      { name: "Mutual of Omaha", rangeMonthly: "$160 – $200", rating: "attained-age", amBest: "A+", householdDiscount: 7, strength: "A+ financial strength, manageable rate increases.", url: "https://www.mutualofomaha.com/medicare-supplement-insurance" },
      { name: "Anthem BlueCross BlueShield", rangeMonthly: "$170 – $215", rating: "attained-age", amBest: "A", householdDiscount: 0, strength: "Strong VA brand recognition and provider network.", url: "https://www.anthem.com/medicare/medicare-supplement/" },
      { name: "United Healthcare (AARP)", rangeMonthly: "$175 – $220", rating: "attained-age", amBest: "A", householdDiscount: 5, strength: "Largest national insurer; AARP membership required.", url: "https://www.aarpmedicaresupplement.com/" },
    ],
    programs: [
      {
        id: "va_real_estate", tier: 2,
        name: "Virginia Real Estate Tax Relief for Seniors",
        value: "Varies by county", valueAmount: 1000,
        eligible: ({ ageNum, homeowner }) => homeowner === "yes" && ageNum >= 65,
        inPlainEnglish: "Most Virginia counties offer real-estate tax relief or freezes for homeowners 65+. Income and asset limits vary by county.",
        why: "VA delegates this to counties — Fairfax, Loudoun, Arlington, and other NOVA counties have generous programs.",
        action: "Contact your county Commissioner of the Revenue or Treasurer's office.",
        applyUrl: "https://www.tax.virginia.gov/local-tax-rates",
      },
    ],
  },
  DC: {
    name: "District of Columbia",
    seeded: true,
    mspApplyUrl: "https://dhcf.dc.gov/service/medicaid",
    snapApplyUrl: "https://dhs.dc.gov/service/snap-benefits-food-stamps",
    shipUrl: "https://dacl.dc.gov/service/health-insurance-counseling-project",
    medigapCarriers: [
      { name: "Cigna Healthcare", rangeMonthly: "$145 – $180", rating: "attained-age", amBest: "A", householdDiscount: 7, strength: "Typically lowest-priced new-enrollee Plan G in DC.", url: "https://www.cigna.com/individuals-families/shop-plans/supplemental/medicare-supplement" },
      { name: "Aetna", rangeMonthly: "$155 – $195", rating: "attained-age", amBest: "A", householdDiscount: 5, strength: "Reliable rate stability backed by CVS Health.", url: "https://www.aetnamedicare.com/en/understanding-medicare/supplement-plans.html" },
      { name: "Mutual of Omaha", rangeMonthly: "$165 – $200", rating: "attained-age", amBest: "A+", householdDiscount: 7, strength: "A+ financial strength, manageable rate increases.", url: "https://www.mutualofomaha.com/medicare-supplement-insurance" },
      { name: "CareFirst BlueCross BlueShield", rangeMonthly: "$180 – $225", rating: "attained-age", amBest: "A", householdDiscount: 0, strength: "Local DC/MD/VA Blue plan, strong provider network.", url: "https://individual.carefirst.com/individuals-families/medicare/medicare-supplement-plans/medicare-supplement-plans.page" },
      { name: "United Healthcare (AARP)", rangeMonthly: "$185 – $230", rating: "attained-age", amBest: "A", householdDiscount: 5, strength: "Largest national insurer; AARP membership required.", url: "https://www.aarpmedicaresupplement.com/" },
    ],
    programs: [
      {
        id: "dc_property_tax", tier: 2,
        name: "DC Senior Property Tax Reduction",
        value: "50% reduction in property tax",
        valueAmount: 1500,
        eligible: ({ annualIncome, ageNum, homeowner }) => homeowner === "yes" && ageNum >= 65 && annualIncome <= 156200,
        inPlainEnglish: "Cuts your DC property tax bill in half if you're 65+ and meet the (generous) household income limit.",
        why: "DC has one of the highest income limits in the country for senior property tax relief.",
        action: "File Form FP-100 with DC Office of Tax & Revenue.",
        applyUrl: "https://otr.cfo.dc.gov/page/real-property-tax-relief-and-tax-credits",
      },
    ],
  },
};

// State ZIP prefix ranges — the first 3 digits of a ZIP map to a state.
// Used to validate that a user's ZIP actually belongs to the state they selected.
// Source: USPS publishes these as Sectional Center Facility (SCF) prefixes.
const STATE_ZIP_PREFIXES = {
  AL: [/^3[5-6]/], AK: [/^99[5-9]/], AZ: [/^85/, /^86/], AR: [/^71[6-9]/, /^72/],
  CA: [/^9[0-6]/], CO: [/^80/, /^81/], CT: [/^06/], DE: [/^19[7-9]/],
  DC: [/^20[02]/, /^200/, /^202/, /^203/, /^204/, /^205/], FL: [/^32/, /^33/, /^34/],
  GA: [/^30/, /^31/, /^398/, /^399/], HI: [/^96[7-9]/], ID: [/^83[2-9]/],
  IL: [/^60/, /^61/, /^62/], IN: [/^46/, /^47/], IA: [/^50/, /^51/, /^52/],
  KS: [/^66/, /^67/], KY: [/^4[0-2]/], LA: [/^70/, /^71[0-5]/],
  ME: [/^03[9]/, /^04/], MD: [/^20[6-9]/, /^21/, /^206/, /^207/, /^208/, /^209/],
  MA: [/^01/, /^02[0-7]/, /^055/], MI: [/^48/, /^49/], MN: [/^55/, /^56/],
  MS: [/^38[6-9]/, /^39/], MO: [/^63/, /^64/, /^65/], MT: [/^59/], NE: [/^68/, /^69[0-3]/],
  NV: [/^889/, /^89/], NH: [/^03[0-8]/], NJ: [/^07/, /^08/], NM: [/^87/, /^88[0-4]/],
  NY: [/^00[5]/, /^1[0-4]/], NC: [/^27/, /^28/], ND: [/^58/], OH: [/^4[3-5]/],
  OK: [/^73/, /^74/], OR: [/^97/], PA: [/^15/, /^16/, /^17/, /^18/, /^19[0-6]/],
  RI: [/^02[89]/], SC: [/^29/], SD: [/^57/], TN: [/^37/, /^38[0-5]/],
  TX: [/^7[3-9]/, /^885/], UT: [/^84/], VT: [/^05/], VA: [/^2[0-4]/],
  WA: [/^98/, /^99[0-4]/], WV: [/^24[7-9]/, /^25/, /^26[0-8]/], WI: [/^53/, /^54/],
  WY: [/^82/, /^83[01]/],
};

function zipBelongsToState(zip, stateCode) {
  if (!zip || !stateCode || !STATE_ZIP_PREFIXES[stateCode]) return null;
  const zipStr = String(zip).trim();
  if (!/^\d{5}$/.test(zipStr)) return null;
  return STATE_ZIP_PREFIXES[stateCode].some(rx => rx.test(zipStr));
}

// ── COUNTY DATA ─────────────────────────────────────────────────────────
// Maps ZIP code prefixes to counties for the seeded states. Production
// implementations should use a full ZIP → county database (the HUD USPS
// crosswalk is the standard — ~41,000 rows, free, updated quarterly).
// This prototype covers the most populous counties in seeded states where
// county-level programs materially differ from state defaults.
//
// Note: these prefix lists are simplified for the prototype. A real
// implementation needs the full crosswalk because some 3-digit prefixes
// span multiple counties.

const COUNTY_DATA = {
  // Maryland — county senior tax supplements layered on state credit
  MD: [
    // Major MD counties
    { prefixes: ["214"], county: "Anne Arundel", propertyTaxBoost: { value: "Up to $400/year", note: "Anne Arundel adds a 50% match on the state Homeowners' Tax Credit for residents 65+." } },
    { prefixes: ["212"], county: "Baltimore City", propertyTaxBoost: { value: "Up to $1,500/year", note: "Baltimore City offers a 'Senior Tax Credit' for homeowners 65+ with income under $80,000 — separate from the state credit." } },
    { prefixes: ["210", "211"], county: "Baltimore County", propertyTaxBoost: { value: "Up to $750/year", note: "Baltimore County offers a 25% match on the state Homeowners' Tax Credit." } },
    { prefixes: ["208", "209"], county: "Montgomery", propertyTaxBoost: { value: "Up to $700/year", note: "Montgomery County matches 25% of the state Homeowners' Tax Credit for residents 65+." } },
    { prefixes: ["206", "207"], county: "Prince George's", propertyTaxBoost: { value: "Up to $500/year", note: "Prince George's matches a portion of the state credit; lower-income seniors get an additional county supplement." } },
    { prefixes: ["210"], county: "Howard", propertyTaxBoost: { value: "Up to $1,000/year", note: "Howard County's senior credit is among the most generous in MD — up to a 50% reduction in real property tax." } },
    // Smaller MD counties
    { prefixes: ["217"], county: "Carroll", propertyTaxBoost: { value: "Up to $400/year", note: "Carroll County offers a senior tax credit on top of the state Homeowners' Tax Credit." } },
    { prefixes: ["217"], county: "Frederick", propertyTaxBoost: { value: "Up to $500/year", note: "Frederick County provides a senior supplement to the state Homeowners' Tax Credit." } },
    { prefixes: ["206"], county: "Charles", propertyTaxBoost: { value: "Up to $400/year", note: "Charles County offers a senior real estate tax deferral and matches a portion of the state credit." } },
    { prefixes: ["206"], county: "Calvert", propertyTaxBoost: { value: "Up to $450/year", note: "Calvert County provides a senior real estate tax credit with income limits." } },
    { prefixes: ["210"], county: "Harford", propertyTaxBoost: { value: "Up to $500/year", note: "Harford County offers a senior tax credit alongside the state Homeowners' program." } },
    { prefixes: ["219"], county: "Cecil", propertyTaxBoost: { value: "Up to $300/year", note: "Cecil County matches a portion of the state Homeowners' Tax Credit for seniors." } },
    { prefixes: ["218", "216"], county: "Eastern Shore counties", propertyTaxBoost: { value: "Varies by county", note: "Talbot, Dorchester, Wicomico, Worcester, Somerset and Queen Anne's counties offer varying senior tax credits — check with your local Treasurer's office." } },
  ],
  // Virginia — most counties offer real estate tax relief, NOVA counties especially generous
  VA: [
    // Northern Virginia — most generous senior tax programs
    { prefixes: ["220", "221", "222"], county: "Fairfax", propertyTaxBoost: { value: "Up to $4,000/year", note: "Fairfax County offers full real estate tax exemption for seniors with income ≤$60K and net worth ≤$400K, with sliding-scale relief up to $100K income." } },
    { prefixes: ["201"], county: "Loudoun", propertyTaxBoost: { value: "Up to $3,500/year", note: "Loudoun's senior tax relief offers full to partial exemption on income up to $90K. Asset cap excludes primary residence." } },
    { prefixes: ["222"], county: "Arlington", propertyTaxBoost: { value: "Up to $3,000/year", note: "Arlington offers up to 100% tax relief for seniors with income ≤$60K, sliding scale up to $100K." } },
    { prefixes: ["221"], county: "Prince William", propertyTaxBoost: { value: "Up to $2,500/year", note: "Prince William County offers tiered tax relief for seniors with income up to $97,000 and net worth limits." } },
    { prefixes: ["220"], county: "Stafford", propertyTaxBoost: { value: "Up to $2,000/year", note: "Stafford County's senior real estate tax relief program tiers benefits by income up to $80,000." } },
    { prefixes: ["224"], county: "Spotsylvania", propertyTaxBoost: { value: "Up to $1,800/year", note: "Spotsylvania offers real estate tax exemption for seniors meeting income and net worth limits." } },
    // Richmond metro
    { prefixes: ["232", "233"], county: "Henrico", propertyTaxBoost: { value: "Up to $1,500/year", note: "Henrico County offers tax freezes and full exemptions based on income tiers." } },
    { prefixes: ["234"], county: "Chesterfield", propertyTaxBoost: { value: "Up to $1,800/year", note: "Chesterfield County provides graduated tax relief for seniors with income up to $75,000." } },
    { prefixes: ["230"], county: "Hanover", propertyTaxBoost: { value: "Up to $1,400/year", note: "Hanover County offers senior real estate tax relief on a sliding scale up to $75,000 income." } },
    // Hampton Roads / Tidewater
    { prefixes: ["234"], county: "Virginia Beach", propertyTaxBoost: { value: "Up to $1,200/year", note: "Virginia Beach senior tax relief; income limit $76,000, asset limit $350,000 excluding home." } },
    { prefixes: ["233"], county: "Norfolk", propertyTaxBoost: { value: "Up to $1,400/year", note: "Norfolk's senior tax program offers freezes and partial exemptions tiered by income." } },
    { prefixes: ["236"], county: "Newport News", propertyTaxBoost: { value: "Up to $1,200/year", note: "Newport News real estate tax relief for seniors on income up to $50,000." } },
    { prefixes: ["236"], county: "Hampton", propertyTaxBoost: { value: "Up to $1,300/year", note: "Hampton offers tax freeze and partial relief programs to seniors meeting income limits." } },
    { prefixes: ["233"], county: "Chesapeake", propertyTaxBoost: { value: "Up to $1,500/year", note: "Chesapeake's tax relief program for seniors; income up to $67,000 with asset limits." } },
    { prefixes: ["234"], county: "Suffolk", propertyTaxBoost: { value: "Up to $1,200/year", note: "Suffolk offers senior real estate tax relief based on income and net worth." } },
    { prefixes: ["231"], county: "James City (Williamsburg)", propertyTaxBoost: { value: "Up to $2,000/year", note: "James City County offers senior real estate tax relief — popular retirement area with significant benefits for residents 65+ meeting income limits." } },
    { prefixes: ["231"], county: "York", propertyTaxBoost: { value: "Up to $1,600/year", note: "York County provides graduated senior tax relief, tied to a $50,000 income ceiling." } },
    // Roanoke / Western VA
    { prefixes: ["240"], county: "Roanoke", propertyTaxBoost: { value: "Up to $1,000/year", note: "Roanoke County offers senior real estate tax relief on income up to $54,000." } },
    { prefixes: ["241"], county: "Roanoke City", propertyTaxBoost: { value: "Up to $900/year", note: "Roanoke City senior tax program tiers benefit by income, with full relief for the lowest tier." } },
    // Charlottesville / central VA
    { prefixes: ["229"], county: "Albemarle (Charlottesville)", propertyTaxBoost: { value: "Up to $1,800/year", note: "Albemarle County's senior tax relief is generous — sliding scale up to $80,000 income, popular retirement destination." } },
  ],
  // Florida — counties layer additional homestead exemption on top of state's
  FL: [
    // South Florida
    { prefixes: ["330", "331", "332", "333"], county: "Miami-Dade", propertyTaxBoost: { value: "Additional $50,000 exemption", note: "Miami-Dade adds a senior exemption on top of the state Homestead. Combined with state benefits, can save $1,500–$2,500/year." } },
    { prefixes: ["334", "338", "339", "342"], county: "Broward", propertyTaxBoost: { value: "Additional $25,000–$50,000", note: "Broward offers an extra senior homestead exemption with income limits around $36,000." } },
    { prefixes: ["334"], county: "Palm Beach", propertyTaxBoost: { value: "Additional $50,000", note: "Palm Beach County adds a generous senior exemption — most retiree-heavy county in FL." } },
    // Tampa Bay area
    { prefixes: ["336", "337"], county: "Hillsborough (Tampa)", propertyTaxBoost: { value: "Additional $50,000", note: "Hillsborough's 'Long-Term Resident Senior Exemption' applies if you've owned 25+ years and meet income limits." } },
    { prefixes: ["337"], county: "Pinellas (St. Petersburg)", propertyTaxBoost: { value: "Additional $50,000", note: "Pinellas County offers the long-term residency senior exemption for 25+ year homeowners." } },
    { prefixes: ["346"], county: "Pasco", propertyTaxBoost: { value: "Additional $25,000–$50,000", note: "Pasco County offers a senior exemption with income limits — popular retirement area." } },
    { prefixes: ["345", "346"], county: "Hernando", propertyTaxBoost: { value: "Additional $25,000", note: "Hernando County offers a senior homestead exemption for residents 65+ with income limits." } },
    // Orlando area
    { prefixes: ["320", "321", "322", "327", "328"], county: "Orange (Orlando)", propertyTaxBoost: { value: "Additional $50,000", note: "Orange County adds a senior exemption for residents 65+ with income at or below the state-set limit." } },
    { prefixes: ["327"], county: "Seminole", propertyTaxBoost: { value: "Additional $25,000", note: "Seminole County offers a senior homestead exemption with state-tied income limits." } },
    { prefixes: ["327"], county: "Lake", propertyTaxBoost: { value: "Additional $50,000", note: "Lake County's senior exemption is among the most generous — popular retiree area in central FL." } },
    { prefixes: ["329"], county: "Volusia (Daytona)", propertyTaxBoost: { value: "Additional $25,000–$50,000", note: "Volusia offers a senior exemption with both state-tied and county-additional tiers." } },
    // Southwest Florida — heavy retiree zones
    { prefixes: ["339"], county: "Lee (Fort Myers)", propertyTaxBoost: { value: "Additional $25,000", note: "Lee County offers a senior homestead exemption for residents 65+ — major retiree destination." } },
    { prefixes: ["341"], county: "Collier (Naples)", propertyTaxBoost: { value: "Additional $50,000", note: "Collier County adds a senior exemption on top of the state Homestead — heavy retiree population." } },
    { prefixes: ["341", "342"], county: "Sarasota", propertyTaxBoost: { value: "Additional $25,000–$50,000", note: "Sarasota offers tiered senior exemptions; popular retirement coast." } },
    { prefixes: ["339"], county: "Charlotte (Port Charlotte)", propertyTaxBoost: { value: "Additional $25,000", note: "Charlotte County offers senior tax exemptions tied to state income limits." } },
    // North Florida
    { prefixes: ["322"], county: "Duval (Jacksonville)", propertyTaxBoost: { value: "Additional $25,000", note: "Duval County (Jacksonville) offers a senior homestead exemption based on state income limits." } },
    { prefixes: ["326"], county: "Alachua (Gainesville)", propertyTaxBoost: { value: "Additional $25,000", note: "Alachua County offers senior tax benefits with state-tied income limits." } },
    { prefixes: ["323"], county: "Leon (Tallahassee)", propertyTaxBoost: { value: "Additional $25,000", note: "Leon County provides senior homestead exemptions for residents 65+ meeting income limits." } },
    // Polk, Brevard, Marion (Villages-adjacent)
    { prefixes: ["338"], county: "Polk", propertyTaxBoost: { value: "Additional $25,000", note: "Polk County offers a senior exemption — covers Lakeland and Winter Haven retirement areas." } },
    { prefixes: ["329"], county: "Brevard (Space Coast)", propertyTaxBoost: { value: "Additional $25,000", note: "Brevard County offers senior homestead exemptions tied to state income limits." } },
    { prefixes: ["344"], county: "Marion (The Villages-adjacent)", propertyTaxBoost: { value: "Additional $50,000", note: "Marion County (Ocala area) offers a generous senior exemption — heavy retiree population." } },
  ],
  // Texas — counties stack local exemptions on top of state freeze
  TX: [
    { prefixes: ["770", "771", "772", "773", "774", "775"], county: "Harris (Houston)", propertyTaxBoost: { value: "$25,000 senior exemption + freeze", note: "Harris County adds an additional $25,000 senior homestead exemption on top of the state's $40,000 standard exemption and tax freeze." } },
    { prefixes: ["750", "751", "752", "753"], county: "Dallas", propertyTaxBoost: { value: "$60,000 senior exemption + freeze", note: "Dallas County adds a $60,000 senior homestead exemption — more generous than most TX counties." } },
    { prefixes: ["786", "787"], county: "Travis (Austin)", propertyTaxBoost: { value: "$70,000 senior exemption + freeze", note: "Travis County's senior homestead exemption is among the largest in Texas, plus the school-tax freeze applies countywide." } },
    { prefixes: ["760", "761", "762"], county: "Tarrant (Fort Worth)", propertyTaxBoost: { value: "$60,000 senior exemption + freeze", note: "Tarrant County matches Dallas's senior exemption amount." } },
    { prefixes: ["782"], county: "Bexar (San Antonio)", propertyTaxBoost: { value: "$85,000 senior exemption + freeze", note: "Bexar County's $85K senior exemption is the largest in Texas. Combined with state freeze, very valuable." } },
    // Suburbs and other major counties
    { prefixes: ["775"], county: "Fort Bend (Sugar Land)", propertyTaxBoost: { value: "$25,000 senior exemption + freeze", note: "Fort Bend County matches the state senior exemption amount with school-tax freeze." } },
    { prefixes: ["770"], county: "Montgomery (The Woodlands)", propertyTaxBoost: { value: "$35,000 senior exemption + freeze", note: "Montgomery County offers an above-average senior homestead exemption with school-tax freeze." } },
    { prefixes: ["750"], county: "Collin (Plano/Frisco)", propertyTaxBoost: { value: "$30,000 senior exemption + freeze", note: "Collin County's senior exemption + school freeze make it tax-friendly for retirees." } },
    { prefixes: ["750"], county: "Denton", propertyTaxBoost: { value: "$30,000 senior exemption + freeze", note: "Denton County offers a senior homestead exemption with school-tax freeze." } },
    { prefixes: ["780"], county: "Hidalgo (Rio Grande Valley)", propertyTaxBoost: { value: "$30,000 senior exemption + freeze", note: "Hidalgo County offers a senior homestead exemption — popular with snowbirds." } },
    { prefixes: ["787"], county: "Williamson (Round Rock)", propertyTaxBoost: { value: "$25,000 senior exemption + freeze", note: "Williamson County offers a senior exemption with the standard Texas school-tax freeze." } },
    { prefixes: ["767", "768"], county: "Lubbock", propertyTaxBoost: { value: "$25,000 senior exemption + freeze", note: "Lubbock County offers the standard Texas senior exemption and school-tax freeze." } },
    { prefixes: ["790", "791", "792"], county: "El Paso", propertyTaxBoost: { value: "$25,000 senior exemption + freeze", note: "El Paso County offers a senior homestead exemption with school-tax freeze." } },
    { prefixes: ["795", "796"], county: "Cameron / Brownsville", propertyTaxBoost: { value: "$25,000 senior exemption + freeze", note: "South Texas counties offer the state senior exemption with school-tax freeze." } },
    { prefixes: ["784"], county: "Nueces (Corpus Christi)", propertyTaxBoost: { value: "$25,000 senior exemption + freeze", note: "Nueces County offers the standard Texas senior homestead exemption with school-tax freeze." } },
  ],
};

function lookupCounty(stateCode, zip) {
  if (!zip || !stateCode || !COUNTY_DATA[stateCode]) return null;
  const zipStr = String(zip).trim();
  if (zipStr.length < 3) return null;
  const prefix = zipStr.substring(0, 3);
  // Find a county whose prefixes include this ZIP prefix
  const match = COUNTY_DATA[stateCode].find(c => c.prefixes.includes(prefix));
  return match || null;
}

function getStateData(stateCode) {
  if (stateCode && STATE_DATA[stateCode]) return STATE_DATA[stateCode];
  return {
    name: STATE_NAMES[stateCode] || "your state",
    seeded: false,
    mspApplyUrl: "https://www.medicare.gov/basics/get-started-with-medicare/medicare-basics/help-paying-for-medicare/medicare-savings-programs",
    snapApplyUrl: "https://www.fns.usda.gov/snap/state-directory",
    shipUrl: "https://www.shiphelp.org/",
    medigapCarriers: NATIONAL_CARRIERS,
    programs: [],
  };
}

// ── Date / age helpers ────────────────────────────────────────────────
// We collect birth month + year (not full DOB) so we can render hard
// IEP boundary dates without storing a more sensitive full date of birth.

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getAge(a) {
  // Prefer derived age from birth_year/birth_month; fall back to legacy age field.
  const by = Number(a && a.birth_year);
  const bm = Number(a && a.birth_month); // 1–12
  if (!by || by < 1900 || by > 2100) return Number((a && a.age) || 0) || 0;
  const now = new Date();
  let age = now.getFullYear() - by;
  if (bm && (now.getMonth() + 1 < bm)) age -= 1;
  return age;
}

// IEP = 3 months before birth month through 3 months after = 7-month window.
// Coverage starts the first day of the birth month for most enrollees.
function getIEPWindow(a) {
  const by = Number(a && a.birth_year);
  const bm = Number(a && a.birth_month);
  if (!by || !bm) return null;
  const sixtyFifth = new Date(by + 65, bm - 1, 1);
  const start = new Date(sixtyFifth); start.setMonth(start.getMonth() - 3);
  const end = new Date(sixtyFifth);   end.setMonth(end.getMonth() + 3);
  // End on the last day of that month
  end.setMonth(end.getMonth() + 1); end.setDate(0);
  const fmt = (d) => `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  const fmtFull = (d) => `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  return {
    start, end, sixtyFifth,
    startLabel: fmt(start),
    endLabel: fmtFull(end),
    partBStartLabel: fmt(sixtyFifth),
  };
}

const QUESTIONS = [
  { id: "birth_month", section: "About you", question: "What month were you born?", helper: "We use this to figure out your Medicare enrollment window — and to flag any deadlines coming up.", type: "choice", options: MONTHS.map((m, i) => ({ value: String(i + 1), label: m })) },
  { id: "birth_year", section: "About you", question: "What year were you born?", helper: "Combined with your birth month, this lets us calculate your Initial Enrollment Period dates.", type: "number", min: 1915, max: 1975, placeholder: "e.g., 1958" },
  { id: "marital", section: "About you", question: "What's your household situation?", type: "choice", options: [{ value: "single", label: "Just me" }, { value: "couple", label: "Me and a spouse" }] },
  { id: "state", section: "About you", question: "Which state do you live in?", helper: "Eligibility thresholds and state-specific programs vary. We'll customize your results.", type: "choice", options: [
    { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" }, { value: "AZ", label: "Arizona" }, { value: "AR", label: "Arkansas" },
    { value: "CA", label: "California" }, { value: "CO", label: "Colorado" }, { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" },
    { value: "DC", label: "District of Columbia" }, { value: "FL", label: "Florida" }, { value: "GA", label: "Georgia" }, { value: "HI", label: "Hawaii" },
    { value: "ID", label: "Idaho" }, { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" }, { value: "IA", label: "Iowa" },
    { value: "KS", label: "Kansas" }, { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" }, { value: "ME", label: "Maine" },
    { value: "MD", label: "Maryland" }, { value: "MA", label: "Massachusetts" }, { value: "MI", label: "Michigan" }, { value: "MN", label: "Minnesota" },
    { value: "MS", label: "Mississippi" }, { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" }, { value: "NE", label: "Nebraska" },
    { value: "NV", label: "Nevada" }, { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" }, { value: "NM", label: "New Mexico" },
    { value: "NY", label: "New York" }, { value: "NC", label: "North Carolina" }, { value: "ND", label: "North Dakota" }, { value: "OH", label: "Ohio" },
    { value: "OK", label: "Oklahoma" }, { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" }, { value: "RI", label: "Rhode Island" },
    { value: "SC", label: "South Carolina" }, { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" }, { value: "TX", label: "Texas" },
    { value: "UT", label: "Utah" }, { value: "VT", label: "Vermont" }, { value: "VA", label: "Virginia" }, { value: "WA", label: "Washington" },
    { value: "WV", label: "West Virginia" }, { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" },
  ] },
  { id: "zip", section: "About you", question: "What's your ZIP code?", helper: "Some senior tax credits and waiver programs are county-specific. We'll surface what applies where you live.", type: "zip", placeholder: "e.g., 21403" },
  { id: "medicare_status", section: "Medicare", question: "Where are you with Medicare today?", type: "choice", options: [{ value: "not_yet", label: "Not enrolled yet" }, { value: "ab_only", label: "I have Original Medicare (Parts A and B)" }, { value: "advantage", label: "I'm on a Medicare Advantage plan" }, { value: "medigap", label: "I have Original Medicare plus a Medigap policy" }] },
  // Pre-enrollment questions: only shown to users not yet enrolled. These drive
  // the auto-enroll vs. active-enroll messaging, the Special Enrollment Period
  // logic, and the Part D late-penalty risk calculation.
  { id: "drawing_ss", section: "Medicare", question: "Are you already drawing Social Security retirement benefits?", helper: "If yes, you'll be auto-enrolled in Medicare Parts A and B. If no, you'll need to actively sign up at ssa.gov.", type: "choice", showIf: (a) => a.medicare_status === "not_yet", options: [{ value: "yes", label: "Yes, already collecting" }, { value: "no", label: "No, not yet" }] },
  { id: "employer_coverage", section: "Medicare", question: "Are you (or your spouse) still working with employer health coverage?", helper: "Active employer coverage from a 20+-employee company can let you delay Part B without a late penalty — and gives you a Special Enrollment Period later.", type: "choice", showIf: (a) => a.medicare_status === "not_yet", options: [{ value: "yes_large", label: "Yes — employer has 20+ employees" }, { value: "yes_small", label: "Yes — but employer has fewer than 20 employees" }, { value: "no", label: "No employer coverage" }] },
  { id: "creditable_rx", section: "Medicare", question: "Do you have prescription drug coverage today?", helper: "If your current drug coverage is 'creditable' (at least as good as Medicare Part D), you can delay Part D without a late penalty.", type: "choice", showIf: (a) => a.medicare_status === "not_yet", options: [{ value: "yes_creditable", label: "Yes — and I've confirmed it's 'creditable'" }, { value: "yes_unknown", label: "Yes — but I'm not sure if it's creditable" }, { value: "no", label: "No drug coverage" }] },
  { id: "income", section: "Finances", question: "What's your gross monthly household income?", helper: "Include Social Security, pensions, wages, IRA distributions, rental income — before taxes.", type: "number", min: 0, max: 100000, placeholder: "e.g., 3200", prefix: "$" },
  { id: "assets", section: "Finances", question: "Roughly, what are your liquid assets?", helper: "Checking, savings, brokerage, IRAs, 401(k)s. Don't include your home or one car.", type: "choice", options: [{ value: "low", label: "Under $10,000" }, { value: "mid_low", label: "$10,000 – $35,000" }, { value: "mid", label: "$35,000 – $150,000" }, { value: "high", label: "Over $150,000" }] },
  { id: "homeowner", section: "Finances", question: "Do you own your primary residence?", type: "choice", options: [{ value: "yes", label: "Yes, I own" }, { value: "no", label: "No, I rent" }] },
  { id: "veteran", section: "Background", question: "Are you a veteran or surviving spouse of a veteran?", type: "choice", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
  { id: "rx", section: "Health", question: "Do you take prescription medications regularly?", helper: "Helps us recommend a Part D plan and check Extra Help eligibility.", type: "choice", options: [{ value: "none", label: "None or rarely" }, { value: "few", label: "1–3 medications" }, { value: "many", label: "4 or more medications" }] },
  { id: "priority", section: "Goals", question: "What matters most to you?", helper: "Based on your answers, we've suggested the goal most likely to fit. Choose any other if you'd prefer.", type: "choice", options: [{ value: "min_premium", label: "Lowest monthly premium" }, { value: "min_total", label: "Lowest total annual cost" }, { value: "max_choice", label: "Maximum doctor and hospital choice" }, { value: "ltc", label: "Planning for long-term care" }] },
];

function evaluate(answers) {
  const findings = [];
  const isCouple = answers.marital === "couple";
  const hh = isCouple ? 2 : 1;
  const income = Number(answers.income) || 0;
  const ageNum = getAge(answers);
  const annualIncome = income * 12;
  const fplAnnual = FPL_2026[hh];
  const assetTier = answers.assets;
  const assetsLow = assetTier === "low" || assetTier === "mid_low";
  const t = THRESHOLDS;
  const incomeLimit = (k) => isCouple ? t[k].incomeCouple : t[k].incomeSingle;

  // State and county lookup
  const stateData = getStateData(answers.state);
  const countyData = lookupCounty(answers.state, answers.zip);
  const homeowner = answers.homeowner;

  // ── Federal: Medicare Savings Programs (QMB / SLMB / QI) ────────────
  if (income <= incomeLimit("QMB") && assetsLow) {
    findings.push({
      tier: 1,
      program: "QMB (Qualified Medicare Beneficiary)",
      value: "Up to $2,200/year",
      inPlainEnglish: "A state-administered Medicaid program that pays your Medicare premiums and most of what Medicare doesn't cover.",
      why: "Pays your Part A and Part B premiums, deductibles, and the 20% Medicare coinsurance. The most valuable Medicare Savings Program.",
      action: `Apply through ${stateData.name}'s Medicaid agency.`,
      applyUrl: stateData.mspApplyUrl,
      stack: "Auto-qualifies you for Extra Help (LIS) too.",
    });
  } else if (income <= incomeLimit("SLMB") && assetsLow) {
    findings.push({
      tier: 1,
      program: "SLMB (Specified Low-Income Medicare Beneficiary)",
      value: "About $2,100/year",
      inPlainEnglish: "A state-administered program that pays your Part B premium each month — the part of Medicare that covers doctor visits.",
      why: "Pays your Part B premium ($174.70/month in 2026).",
      action: `Apply through ${stateData.name}'s Medicaid agency.`,
      applyUrl: stateData.mspApplyUrl,
      stack: "Auto-qualifies you for Extra Help (LIS).",
    });
  } else if (income <= incomeLimit("QI") && assetsLow) {
    findings.push({
      tier: 1,
      program: "QI (Qualifying Individual)",
      value: "About $2,100/year",
      inPlainEnglish: "Pays your Part B premium each month, like SLMB but for slightly higher incomes. Funded year by year, so applying early matters.",
      why: "Pays your Part B premium. Same benefit as SLMB but for slightly higher incomes.",
      action: `Apply through ${stateData.name}'s Medicaid agency. Funded annually — apply early in the year.`,
      applyUrl: stateData.mspApplyUrl,
      stack: "Auto-qualifies you for Extra Help (LIS).",
    });
  }

  // ── Federal: Extra Help / LIS ───────────────────────────────────────
  const lisAssetOK = assetTier === "low" || assetTier === "mid_low" || assetTier === "mid";
  if (income <= incomeLimit("LIS") && lisAssetOK) {
    findings.push({
      tier: 1,
      program: "Extra Help (Low-Income Subsidy)",
      value: "About $5,900/year in drug savings",
      inPlainEnglish: "A federal program that nearly eliminates what you pay for prescription drugs under Medicare Part D. Generic drugs typically cost $0 to $4 per fill.",
      why: "Pays most of your Part D premium, deductible, and prescription copays.",
      action: "Apply free through Social Security at ssa.gov/extrahelp or call 1-800-772-1213.",
      applyUrl: "https://www.ssa.gov/medicare/part-d-extra-help",
    });
  }

  // ── Federal: SNAP for seniors ───────────────────────────────────────
  if (annualIncome <= fplAnnual * t.SNAP.fplMultiple) {
    findings.push({
      tier: 2,
      program: "SNAP (Supplemental Nutrition Assistance)",
      value: "Up to $3,000/year",
      inPlainEnglish: "Monthly food benefits loaded onto an EBT card you can use at most grocery stores. Many states waive the asset test for seniors.",
      why: "Average senior benefit is $200–250/month. Eligibility based on income.",
      action: `Apply through ${stateData.name}'s benefits portal.`,
      applyUrl: stateData.snapApplyUrl,
    });
  }

  // ── Federal: VA Aid & Attendance ────────────────────────────────────
  if (answers.veteran === "yes") {
    findings.push({
      tier: 2,
      program: "VA Aid & Attendance Pension",
      value: "Up to $32,000/year for couples",
      inPlainEnglish: "A tax-free monthly check from the VA for wartime veterans (or their surviving spouses) who need help with everyday activities like dressing, bathing, or cooking.",
      why: "Tax-free monthly pension for wartime veterans (or surviving spouses) who need help with daily activities. Massively under-claimed.",
      action: "Apply at va.gov/pension or work with an accredited VA claims agent.",
      applyUrl: "https://www.va.gov/pension/aid-attendance-housebound/",
    });
  }

  // ── State-specific programs ─────────────────────────────────────────
  if (stateData.programs) {
    for (const p of stateData.programs) {
      if (p.eligible({ income, annualIncome, fplAnnual, ageNum, homeowner, marital: answers.marital, assetTier })) {
        const finding = {
          tier: p.tier,
          program: p.name,
          value: p.value,
          inPlainEnglish: p.inPlainEnglish,
          why: p.why,
          action: p.action,
          applyUrl: p.applyUrl,
          stack: p.stack,
        };
        // Attach county-specific property tax supplement when applicable
        const isPropertyTax = p.id && (p.id.includes("property") || p.id.includes("homestead") || p.id === "ny_star");
        if (isPropertyTax && countyData && countyData.propertyTaxBoost) {
          finding.countySupplement = {
            county: countyData.county,
            value: countyData.propertyTaxBoost.value,
            note: countyData.propertyTaxBoost.note,
          };
        }
        findings.push(finding);
      }
    }
  }

  const path = recommendMedicarePath(answers, stateData);
  const watchouts = generateWatchouts(answers);
  const totalValue = findings.filter(f => f.tier <= 2).reduce((sum, f) => {
    const match = f.value.match(/\$([0-9,]+)/);
    return sum + (match ? parseInt(match[1].replace(/,/g, "")) : 0);
  }, 0);

  return { findings, path, watchouts, totalValue, stateData, countyData };
}


// ── Suggest a priority for the "What matters most" question ────────────
// Returns the priority option value most likely to fit based on the user's
// answers so far. The user is free to override, but the suggestion saves
// most users a tap and ensures the recommendation engine has good defaults.
function suggestPriority(a) {
  const ageNum = getAge(a);
  const income = Number(a.income) || 0;
  const annualIncome = income * 12;
  const assets = a.assets;
  const rx = a.rx;
  const status = a.medicare_status;

  // Long-term care planning: high assets and 70+, OR already on Medigap with high assets (asset-protection mindset)
  if (assets === "high" && (ageNum >= 70 || status === "medigap")) return "ltc";

  // Lowest premium: cash-flow constrained — low income or low assets, especially pre-Medicare
  if ((annualIncome < 36000 && (assets === "low" || assets === "mid_low")) || (status === "not_yet" && assets === "low")) return "min_premium";

  // Lowest total cost: many medications drive total cost more than premium does
  if (rx === "many" && (assets === "low" || assets === "mid_low" || assets === "mid")) return "min_total";

  // Max choice: mid-to-high assets and either pre-Medicare or on MA wanting flexibility
  if ((assets === "mid" || assets === "high") && (status === "not_yet" || status === "advantage" || status === "ab_only")) return "max_choice";

  // Default: lowest total cost is the most universally useful framing
  return "min_total";
}

function recommendMedicarePath(a, stateData) {
  const status = a.medicare_status, priority = a.priority, rx = a.rx, assets = a.assets, age = getAge(a);
  const carriers = stateData ? stateData.medigapCarriers : NATIONAL_CARRIERS;
  const stateName = stateData ? stateData.name : "your state";
  const shipUrl = stateData && stateData.shipUrl ? stateData.shipUrl : "https://www.shiphelp.org/";

  // Helper: which steps to show based on what the user already has
  const hasMedicare = status === "ab_only" || status === "advantage" || status === "medigap";
  const hasMedigap = status === "medigap";
  const onAdvantage = status === "advantage";

  if (status === "not_yet") {
    const drawingSS = a.drawing_ss === "yes";
    const employerLarge = a.employer_coverage === "yes_large";
    const employerSmall = a.employer_coverage === "yes_small";
    const creditableRx = a.creditable_rx === "yes_creditable";
    const noRx = a.creditable_rx === "no";
    const iep = getIEPWindow(a);

    // Late enrollment: past 65, never signed up. Penalty math and SEP rules dominate.
    if (age >= 66) {
      const monthsLate = Math.max(0, (age - 65) * 12);
      const penaltyPct = Math.floor(monthsLate / 12) * 10; // 10% per full 12-month delay, lifetime
      const hasSEP = employerLarge; // 8-month SEP after employer coverage ends
      const points = [
        hasSEP
          ? "Active employer coverage from a 20+-employee company gives you a Special Enrollment Period — you can enroll without a Part B late penalty for up to 8 months after that coverage ends."
          : `You're past 65 without Medicare and without qualifying employer coverage. Each full 12 months you've delayed adds a permanent 10% to your Part B premium — currently roughly ${penaltyPct}% extra for life.`,
        noRx
          ? "You've also gone without creditable drug coverage. Part D adds a separate 1%-per-month lifetime late-enrollment penalty."
          : creditableRx
            ? "Your existing creditable drug coverage protects you from the Part D late-enrollment penalty as long as you don't go more than 63 days without it after enrolling."
            : "Confirm whether your current drug coverage is 'creditable' — your insurer must send you a notice each fall. Non-creditable coverage triggers the Part D late penalty.",
        "General Enrollment runs January 1 – March 31 each year, with coverage starting the month after enrollment.",
      ];
      return {
        title: hasSEP ? "You qualify for a Special Enrollment Period" : "Late Medicare enrollment — act this General Enrollment",
        summary: hasSEP
          ? "Active large-employer coverage protects you from the Part B late penalty. Use your 8-month SEP when that coverage ends."
          : `You're approximately ${monthsLate} months past your Initial Enrollment Period. Enrolling at the next General Enrollment locks in the penalty at its current level — every additional year delays it 10% higher.`,
        points,
        enrollmentSteps: [
          {
            n: 1,
            title: hasSEP ? "Complete CMS-L564 with your employer" : "File at ssa.gov during General Enrollment (Jan 1 – Mar 31)",
            why: hasSEP
              ? "Form CMS-L564 documents your continuous active-employer coverage and unlocks the SEP. Your HR department fills out Section B; you mail it to SSA with your enrollment application."
              : "Coverage starts the month after you enroll. SSA processes General Enrollment applications in the order received — earlier in the window means earlier coverage.",
            link: hasSEP
              ? { label: "Form CMS-L564 (Employment Coverage)", url: "https://www.cms.gov/medicare/forms-notices/cms-forms/cms-forms-list" }
              : { label: "Sign up for Medicare at SSA", url: "https://www.ssa.gov/medicare/sign-up" },
          },
          {
            n: 2,
            title: "Choose Part D or Medicare Advantage",
            why: noRx
              ? "Without creditable coverage you've also accumulated a Part D late penalty. Enroll during the same window — there's no advantage to waiting longer."
              : "You can pick a standalone Part D plan (with Original Medicare + Medigap) or a Medicare Advantage plan that includes drug coverage.",
            link: { label: "Compare plans on Plan Finder", url: "https://www.medicare.gov/plan-compare/" },
          },
          {
            n: 3,
            title: hasSEP ? "Apply for Medigap during your guaranteed-issue window" : "Apply for Medigap during your one-time guaranteed-issue window",
            why: "Your Medigap guaranteed-issue rights last 6 months from the date Part B starts. Outside that window, most carriers can deny coverage or raise rates based on health.",
            showCarriers: true,
          },
          {
            n: 4,
            title: `Get free help from ${stateName} SHIP`,
            why: `Late-enrollment cases benefit most from one-on-one counseling — SHIP counselors can help you appeal a penalty if you have an Equitable Relief case (e.g., wrong information from a federal employee).`,
            link: { label: `${stateName} SHIP counseling`, url: shipUrl },
          },
        ],
        carriers: carriers,
        stateName: stateName,
        medigapNote: stateData ? stateData.medigapNote : null,
      };
    }

    // In the IEP (age 64–65, with hard dates we can render).
    if (age >= 64 && iep) {
      const points = [
        `Your 7-month Initial Enrollment Period runs ${iep.startLabel} through ${iep.endLabel}. Coverage starts ${iep.partBStartLabel} if you enroll during the 4 months before your birth month.`,
        drawingSS
          ? "Because you're already drawing Social Security, you'll be auto-enrolled in Parts A and B. Your card arrives ~3 months before your birth month — no action required unless you want to opt out of Part B."
          : "You're not yet drawing Social Security, so Medicare won't auto-enroll you. You need to actively sign up at ssa.gov.",
        employerLarge
          ? "If you have active 20+-employee employer coverage and want to delay Part B, you can — your Special Enrollment Period gives you 8 months after that coverage ends to enroll without penalty. Most people in your situation should still enroll in Part A (it's premium-free)."
          : employerSmall
            ? "Your employer coverage is from a small-group plan (<20 employees). Medicare becomes the primary payer at 65, so delaying Part B is risky — your employer plan may pay only what Medicare would have paid."
            : "Without employer coverage, plan to enroll in both Part A and Part B during this IEP. Missing it triggers a permanent 10% Part B penalty for every 12 months delayed.",
        creditableRx
          ? "Your existing drug coverage is creditable, so you can delay Part D without penalty as long as you don't go more than 63 days without coverage after enrolling."
          : noRx
            ? "Without drug coverage, enroll in a Part D plan during your IEP to avoid the 1%-per-month lifetime late penalty."
            : "Verify whether your current drug coverage is 'creditable' — your insurer is required to send you a notice each fall. If not, plan on Part D.",
      ];
      const steps = [];
      if (!drawingSS) {
        steps.push({
          n: steps.length + 1,
          title: "Create your my Social Security account at ssa.gov",
          why: "You'll need this account to apply for Medicare online. Allow 10 minutes — identity verification uses your prior addresses and employers from credit history.",
          link: { label: "Create account at SSA", url: "https://www.ssa.gov/myaccount/" },
        });
        steps.push({
          n: steps.length + 1,
          title: `Apply for Medicare A and B by ${iep.endLabel}`,
          why: `Your IEP ends ${iep.endLabel}. Apply at least 1 month before your birth month for coverage starting ${iep.partBStartLabel}.`,
          link: { label: "Sign up for Medicare", url: "https://www.ssa.gov/medicare/sign-up" },
        });
      } else {
        steps.push({
          n: steps.length + 1,
          title: "Watch for your Medicare card in the mail",
          why: `Because you're drawing Social Security, A and B auto-enroll. Your card arrives roughly 3 months before ${iep.partBStartLabel}. If you want to decline Part B (almost no one should), follow the instructions on the card.`,
          link: { label: "What your Medicare card looks like", url: "https://www.medicare.gov/basics/get-started-with-medicare/medicare-basics/medicare-cards" },
        });
      }
      if (!creditableRx) {
        steps.push({
          n: steps.length + 1,
          title: "Choose a Part D drug plan before your IEP closes",
          why: rx === "many"
            ? "With your medication load, run your specific drugs through Plan Finder — total annual cost matters more than premium."
            : "Pick the lowest-premium plan that covers what you take. Re-shop every fall during Open Enrollment.",
          link: { label: "Compare Part D plans", url: "https://www.medicare.gov/plan-compare/" },
        });
      }
      steps.push({
        n: steps.length + 1,
        title: "Apply for Medigap within 6 months of Part B starting",
        why: `Your guaranteed-issue window runs from ${iep.partBStartLabel} for 6 months. Inside it, no carrier can deny you for health reasons. Outside it, most can.`,
        showCarriers: true,
      });
      steps.push({
        n: steps.length + 1,
        title: `Talk to ${stateName} SHIP for free`,
        why: `${stateName}'s SHIP counselors are unbiased and free — no sales pitch. They'll review your specific options before you enroll.`,
        link: { label: `${stateName} SHIP counseling`, url: shipUrl },
      });
      return {
        title: `Your Initial Enrollment Period: ${iep.startLabel} – ${iep.endLabel}`,
        summary: `Coverage starts ${iep.partBStartLabel}. ${drawingSS ? "You'll be auto-enrolled — confirm your card arrives." : "You need to actively sign up at ssa.gov."}`,
        points,
        carriers,
        stateName,
        medigapNote: stateData ? stateData.medigapNote : null,
        enrollmentSteps: steps,
      };
    }

    // Pre-65 planning runway (still under 64).
    const yearsOut = Math.max(1, 65 - age);

    // Long planning runway (5+ years out): only the IRMAA/Roth point matters now.
    // Everything else is premature and would just create noise.
    if (yearsOut >= 5) {
      return {
        title: "Long planning runway",
        summary: `You have ${yearsOut} years before Medicare eligibility. The single most valuable thing to act on now is income planning — Medicare uses your tax return from two years before enrollment.`,
        points: [
          "Roth conversions in your 50s and early 60s can keep your retirement income below the IRMAA surcharge thresholds at 65.",
          "Most other Medicare decisions are years away — there's no benefit to acting on them now.",
          `When you're within 2 years of 65, come back and we'll generate a fresh enrollment plan.`,
        ],
        enrollmentSteps: [
          {
            n: 1,
            title: "Talk to a CPA or fee-only financial planner about Roth strategy",
            why: "The IRMAA two-year lookback means moves you make in your 50s and early 60s directly affect your Medicare premiums in retirement. A fee-only planner (no commissions) can model the breakeven for your specific situation.",
            link: { label: "How IRMAA brackets work", url: "https://www.ssa.gov/forms/ssa-44.pdf" },
          },
          {
            n: 2,
            title: `Save ${stateName}'s SHIP contact for later`,
            why: `${stateName}'s SHIP program offers free, unbiased Medicare counseling. Bookmark this — when you're 63 or 64 it'll be the most valuable resource you'll use.`,
            link: { label: `${stateName} SHIP counseling`, url: shipUrl },
          },
        ],
      };
    }

    // Approaching Medicare (2-4 years out): all the planning windows are now relevant.
    return {
      title: "Pre-Medicare planning window",
      summary: `You have ${yearsOut} years before Medicare eligibility. This is the most important window for the decisions ahead.`,
      points: [
        "Consider Roth conversions before age 63 to avoid the IRMAA cliff at 65.",
        "Plan to enroll in Part B during your Initial Enrollment Period — the 7-month window around your 65th birthday.",
        "Your Medigap guaranteed-issue rights last only 6 months after Part B starts.",
      ],
      enrollmentSteps: [
        {
          n: 1,
          title: "Read the Medicare basics",
          why: "Learn what Parts A, B, C, and D cover so you understand the choices ahead.",
          link: { label: "Medicare enrollment guide", url: "https://www.medicare.gov/basics/get-started-with-medicare" },
        },
        {
          n: 2,
          title: "Plan around IRMAA two years out",
          why: "Medicare looks at your tax return from two years prior. Roth conversions and other moves can keep you below the surcharge thresholds.",
          link: { label: "IRMAA appeal form (SSA-44)", url: "https://www.ssa.gov/forms/ssa-44.pdf" },
        },
        {
          n: 3,
          title: `Get free ${stateName}-specific guidance`,
          why: `${stateName}'s SHIP program offers free, unbiased Medicare counseling — no sales pitch.`,
          link: { label: `${stateName} SHIP counseling`, url: shipUrl },
        },
      ],
    };
  }

  if (priority === "max_choice" || (priority === "min_total" && (assets === "mid" || assets === "high"))) {
    const steps = [];
    if (!hasMedicare) {
      steps.push({
        n: steps.length + 1,
        title: "Enroll in Original Medicare (Parts A & B)",
        why: "This is the foundation — your Medicare number is what every other plan attaches to. Done through Social Security, not a private insurer.",
        link: { label: "Sign up for Medicare", url: "https://www.medicare.gov/sign-up-change-plans/how-do-i-get-parts-a-b" },
      });
    }
    if (onAdvantage) {
      steps.push({
        n: steps.length + 1,
        title: "Switch from Medicare Advantage to Original Medicare",
        why: "You can change during the Annual Enrollment Period (Oct 15 – Dec 7) or the MA Open Enrollment Period (Jan 1 – Mar 31). Important: switching back may make Medigap underwriting tougher in most states outside your initial guaranteed-issue window.",
        link: { label: "How to disenroll from MA", url: "https://www.medicare.gov/basics/get-started-with-medicare/medicare-basics/joining-changing-medicare-plans" },
      });
    }
    if (!hasMedigap) {
      steps.push({
        n: steps.length + 1,
        title: "Apply for a Medigap Plan G policy",
        why: "Plan G is the same coverage from any carrier by federal law — but premiums vary 30–50% in your zip code. Apply during your 6-month guaranteed-issue window after Part B starts.",
        showCarriers: true,
      });
    }
    steps.push({
      n: steps.length + 1,
      title: "Enroll in a standalone Part D drug plan",
      why: rx === "many"
        ? "With your medication load, choose by total annual drug cost — not premium. Use Plan Finder with your specific drugs entered."
        : "With minimal medications, pick the lowest-premium plan that covers what you take. The Plan Finder shows total annual cost.",
      link: { label: "Compare Part D plans for your drugs", url: "https://www.medicare.gov/plan-compare/" },
    });
    return {
      title: "Original Medicare + Medigap Plan G + standalone Part D",
      summary: "Wins on total cost over the long run and gives you any-doctor, any-hospital access nationwide.",
      points: [
        "Predictable monthly cost: Part B + Medigap premium covers nearly all gaps.",
        "No prior authorizations, no narrow networks, no annual plan disruption.",
        "Add a standalone Part D plan matched to your medications via Medicare Plan Finder.",
        rx === "many" ? "With your medication load, formulary fit matters more than premium." : "With minimal medications, pick the lowest-premium plan that covers your drugs.",
      ],
      carriers: carriers,
      stateName: stateName,
      medigapNote: stateData ? stateData.medigapNote : null,
      enrollmentSteps: steps,
    };
  }

  if (priority === "min_premium") {
    const steps = [];
    if (!hasMedicare) {
      steps.push({
        n: steps.length + 1,
        title: "Enroll in Original Medicare (Parts A & B)",
        why: "Required first — Medicare Advantage replaces Original Medicare's coverage but you must be enrolled in A and B to choose an MA plan.",
        link: { label: "Sign up for Medicare", url: "https://www.medicare.gov/sign-up-change-plans/how-do-i-get-parts-a-b" },
      });
    }
    steps.push({
      n: steps.length + 1,
      title: "Compare Medicare Advantage plans in your zip code",
      why: "Filter by your doctors, hospitals, and prescriptions. Aim for plans with a 4+ star CMS rating.",
      link: { label: "Browse MA plans on Plan Finder", url: "https://www.medicare.gov/plan-compare/" },
    });
    steps.push({
      n: steps.length + 1,
      title: "Verify your doctors are in-network",
      why: "MA plans have networks. Call your doctors' offices directly to confirm — provider directories are sometimes outdated.",
      link: { label: "Check Medicare's care directory", url: "https://www.medicare.gov/care-compare/" },
    });
    steps.push({
      n: steps.length + 1,
      title: "Know who to call if a claim is denied",
      why: "Most state insurance departments and attorneys general have free consumer assistance for insurance disputes.",
      link: { label: `${stateName} SHIP — free help`, url: shipUrl },
    });
    return {
      title: "Medicare Advantage (with caveats)",
      summary: "MA can offer $0 premiums and extras like dental and vision, but the tradeoff is networks and prior authorization.",
      points: [
        "Verify your doctors and preferred hospitals are in-network before enrolling.",
        "Check the plan's CMS Star Rating — aim for 4+ stars.",
        "Switching back to Original Medicare + Medigap can be hard once you're locked in.",
      ],
      enrollmentSteps: steps,
    };
  }

  if (priority === "ltc") {
    return {
      title: "Long-term care planning track",
      summary: "Medicare doesn't cover long-term custodial care. This requires a separate strategy.",
      points: [
        "If assets are at risk, explore your state's Medicaid LTSS — but the 5-year look-back means planning years ahead matters.",
        "Most states offer home-based care alternatives to nursing homes (e.g., Community First Choice, HCBS waivers).",
        "PACE bundles all care for nursing-home-eligible seniors who want to stay home.",
      ],
      enrollmentSteps: [
        {
          n: 1,
          title: "Talk to a Medicaid planning specialist",
          why: "The 5-year asset look-back means timing matters. Don't make moves without expert guidance — many states have free Legal Aid help for seniors 60+.",
          link: { label: `${stateName} SHIP counseling`, url: shipUrl },
        },
        {
          n: 2,
          title: "Explore home-based care alternatives",
          why: "Most states pay for help at home through Medicaid waivers — often better quality of life and lower cost than a nursing home.",
          link: { label: "Find your state Medicaid agency", url: "https://www.medicaid.gov/about-us/contact-us/contact-your-state-questions" },
        },
        {
          n: 3,
          title: "Check PACE eligibility",
          why: "PACE bundles all medical and long-term care for nursing-home-eligible seniors who want to stay at home. Few people know about it.",
          link: { label: "Find a PACE site near you", url: "https://www.npaonline.org/" },
        },
      ],
    };
  }

  return {
    title: "Original Medicare + Medigap recommended",
    summary: "Original Medicare with a Medigap supplement gives you the most flexibility and predictability.",
    points: [
      "Verify by running specific plans through Medicare.gov's Plan Finder.",
      "Lock in Medigap during your guaranteed-issue window if you haven't already.",
    ],
    carriers: carriers,
    stateName: stateName,
    medigapNote: stateData ? stateData.medigapNote : null,
    enrollmentSteps: [
      ...(!hasMedicare ? [{
        n: 1,
        title: "Enroll in Original Medicare (Parts A & B)",
        why: "Through Social Security. Your Medicare number is the foundation for everything else.",
        link: { label: "Sign up for Medicare", url: "https://www.medicare.gov/sign-up-change-plans/how-do-i-get-parts-a-b" },
      }] : []),
      ...(!hasMedigap ? [{
        n: hasMedicare ? 1 : 2,
        title: "Apply for a Medigap policy",
        why: "Same coverage by federal law — premiums vary 30–50% by carrier. Lock it in within your 6-month guaranteed-issue window.",
        showCarriers: true,
      }] : []),
      {
        n: (!hasMedicare ? 1 : 0) + (!hasMedigap ? 1 : 0) + 1,
        title: "Enroll in a Part D drug plan",
        why: "Run your specific medications through Medicare Plan Finder to compare total annual cost.",
        link: { label: "Compare Part D plans", url: "https://www.medicare.gov/plan-compare/" },
      },
    ],
  };
}

function generateWatchouts(a) {
  const out = [];
  const age = getAge(a);
  const iep = getIEPWindow(a);
  if (age >= 64 && age <= 65 && a.medicare_status === "not_yet") {
    out.push({
      level: "high",
      title: iep ? `IEP closes ${iep.endLabel}` : "Initial Enrollment Period is closing",
      body: iep
        ? `Your 7-month Initial Enrollment Period runs ${iep.startLabel} through ${iep.endLabel}. ${a.drawing_ss === "yes" ? "Because you're drawing Social Security, you'll auto-enroll — but confirm your card arrives." : "You need to actively sign up at ssa.gov."} Missing Part B triggers a permanent 10% penalty for every 12 months delayed.`
        : "Your 7-month IEP window starts 3 months before your 65th birthday and ends 3 months after. Missing Part B enrollment triggers a 10% permanent penalty for every 12 months you delay.",
      link: { label: "Sign up for Medicare", url: "https://www.ssa.gov/medicare/sign-up" },
    });
  }
  if (age >= 66 && a.medicare_status === "not_yet") {
    const monthsLate = Math.max(0, (age - 65) * 12);
    const penaltyPct = Math.floor(monthsLate / 12) * 10;
    const hasSEP = a.employer_coverage === "yes_large";
    out.push({
      level: "high",
      title: hasSEP ? "You qualify for a Special Enrollment Period" : `Late enrollment — Part B penalty is ~${penaltyPct}%`,
      body: hasSEP
        ? "Your active 20+-employee employer coverage shields you from the Part B late penalty. When that coverage ends, you have 8 months to enroll without penalty using Form CMS-L564."
        : `You're roughly ${monthsLate} months past your IEP. The next chance to enroll is the General Enrollment Period (Jan 1 – Mar 31). The penalty locks in at ~${penaltyPct}% — every additional 12-month delay adds another 10% for life.`,
      link: hasSEP
        ? { label: "Form CMS-L564", url: "https://www.cms.gov/medicare/forms-notices/cms-forms/cms-forms-list" }
        : { label: "General Enrollment overview", url: "https://www.medicare.gov/basics/get-started-with-medicare/sign-up-for-medicare/when-does-medicare-coverage-start" },
    });
  }
  if (a.medicare_status === "not_yet" && a.creditable_rx === "no" && age >= 64) {
    out.push({
      level: "high",
      title: "Part D late penalty is accruing",
      body: "Without creditable drug coverage, every month past your IEP without Part D adds 1% to your Part D premium for life. Even if you take no medications now, enrolling in the cheapest plan you can find avoids the penalty.",
      link: { label: "Compare Part D plans", url: "https://www.medicare.gov/plan-compare/" },
    });
  }
  if (a.medicare_status === "advantage") {
    out.push({
      level: "med",
      title: "Medigap guaranteed-issue may have expired",
      body: "If you're on Medicare Advantage and decide to switch back to Original Medicare, most state Medigap insurers can use medical underwriting to deny coverage or raise rates outside your initial guaranteed-issue window.",
      link: { label: "Medigap rights and protections", url: "https://www.medicare.gov/health-drug-plans/medigap/basics/your-rights-when-buying" },
    });
  }
  if (Number(a.income) > 8000) {
    out.push({
      level: "med",
      title: "IRMAA may apply",
      body: "Higher-income retirees pay an Income-Related Monthly Adjustment Amount on top of standard Part B and Part D premiums. Life-changing events can be appealed via SSA Form SSA-44.",
      link: { label: "Download IRMAA appeal form (SSA-44)", url: "https://www.ssa.gov/forms/ssa-44.pdf" },
    });
  }
  out.push({
    level: "low",
    title: "Annual Open Enrollment is October 15 – December 7",
    body: "Plans change every year. Reviewing your Part D and Medicare Advantage plan each fall typically saves $300–800/year.",
    link: { label: "Open the Medicare Plan Finder", url: "https://www.medicare.gov/plan-compare/" },
  });
  return out;
}

// ── PALETTE ─────────────────────────────────────────────────────────────
const C = {
  bg: "#f5f1ea",       // warm sand background
  paper: "#ffffff",
  ink: "#0f3a3d",      // deep teal
  inkSoft: "#1f4e52",
  muted: "#4a5d5f",
  faint: "#7a8a8c",
  line: "#dcd4c5",
  lineDark: "#2a5559",
  accent: "#e85a4f",   // coral
  accentDark: "#cf4439",
  accentSoft: "#fce7e3",
  gold: "#c8a560",
};

// ── Hero illustration: warm, abstract scene of a couple ────────────────
const HeroIllustration = () => (
  <svg viewBox="0 0 600 700" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#e8d4b8"/>
        <stop offset="50%" stopColor="#f0c9a8"/>
        <stop offset="100%" stopColor="#e85a4f" stopOpacity="0.4"/>
      </linearGradient>
      <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1f4e52"/>
        <stop offset="100%" stopColor="#0f3a3d"/>
      </linearGradient>
      <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0f3a3d"/>
        <stop offset="100%" stopColor="#0a2528"/>
      </linearGradient>
      <radialGradient id="sun" cx="0.5" cy="0.5">
        <stop offset="0%" stopColor="#fff5e6"/>
        <stop offset="50%" stopColor="#ffd49a"/>
        <stop offset="100%" stopColor="#e85a4f" stopOpacity="0"/>
      </radialGradient>
    </defs>

    {/* Sky */}
    <rect width="600" height="700" fill="url(#sky)"/>

    {/* Sun */}
    <circle cx="420" cy="220" r="180" fill="url(#sun)" opacity="0.8"/>
    <circle cx="420" cy="220" r="55" fill="#fff5e6" opacity="0.95"/>

    {/* Distant mountains */}
    <path d="M 0 380 L 80 320 L 160 360 L 240 300 L 340 350 L 440 290 L 540 340 L 600 310 L 600 420 L 0 420 Z" fill="#1f4e52" opacity="0.4"/>
    <path d="M 0 410 L 100 360 L 200 395 L 300 340 L 400 380 L 500 350 L 600 380 L 600 440 L 0 440 Z" fill="#0f3a3d" opacity="0.55"/>

    {/* Water */}
    <rect y="430" width="600" height="120" fill="url(#water)"/>
    {/* Sun reflection on water */}
    <ellipse cx="420" cy="445" rx="80" ry="4" fill="#ffd49a" opacity="0.5"/>
    <ellipse cx="420" cy="465" rx="50" ry="2.5" fill="#ffd49a" opacity="0.35"/>
    <ellipse cx="420" cy="485" rx="35" ry="2" fill="#ffd49a" opacity="0.25"/>
    {/* Water ripples */}
    <line x1="60" y1="470" x2="180" y2="470" stroke="#2a5559" strokeWidth="1" opacity="0.6"/>
    <line x1="200" y1="500" x2="320" y2="500" stroke="#2a5559" strokeWidth="1" opacity="0.5"/>
    <line x1="80" y1="525" x2="240" y2="525" stroke="#2a5559" strokeWidth="1" opacity="0.4"/>

    {/* Foreground ground */}
    <path d="M 0 540 L 600 530 L 600 700 L 0 700 Z" fill="url(#ground)"/>

    {/* Dock */}
    <rect x="180" y="525" width="240" height="14" fill="#3a2a1f" opacity="0.85"/>
    <rect x="190" y="539" width="6" height="40" fill="#2a1f15"/>
    <rect x="404" y="539" width="6" height="40" fill="#2a1f15"/>

    {/* Two figures sitting on the dock — backs to viewer, looking at sunset */}
    {/* Figure 1 (left) — gentleman */}
    <g transform="translate(265, 440)">
      {/* Body/shoulders */}
      <path d="M 0 60 Q -8 20 8 5 Q 25 -8 42 5 Q 58 20 50 60 Z" fill="#c8a560"/>
      {/* Head */}
      <circle cx="25" cy="-5" r="18" fill="#e8c5a0"/>
      {/* Hair */}
      <path d="M 8 -8 Q 12 -22 25 -22 Q 38 -22 42 -8 Q 38 -14 25 -14 Q 12 -14 8 -8 Z" fill="#8a8a8a"/>
      {/* Arm around partner */}
      <path d="M 50 25 Q 70 30 80 45" stroke="#c8a560" strokeWidth="10" fill="none" strokeLinecap="round"/>
    </g>

    {/* Figure 2 (right) — lady, leaning slightly into figure 1 */}
    <g transform="translate(320, 445)">
      {/* Body/shoulders */}
      <path d="M 0 55 Q -6 18 10 4 Q 25 -6 40 4 Q 54 18 48 55 Z" fill="#e85a4f"/>
      {/* Head, slightly tilted toward partner */}
      <circle cx="22" cy="-7" r="17" fill="#e8c5a0"/>
      {/* Hair — softer */}
      <path d="M 6 -10 Q 8 -24 22 -24 Q 36 -24 40 -10 Q 38 -2 36 5 Q 30 -14 22 -14 Q 14 -14 8 -2 Q 4 -8 6 -10 Z" fill="#d4a574"/>
    </g>

    {/* Birds in sky */}
    <path d="M 100 180 Q 108 175 116 180 Q 124 175 132 180" stroke="#0f3a3d" strokeWidth="2" fill="none" opacity="0.6"/>
    <path d="M 140 200 Q 146 196 152 200 Q 158 196 164 200" stroke="#0f3a3d" strokeWidth="1.5" fill="none" opacity="0.5"/>
    <path d="M 80 240 Q 86 236 92 240 Q 98 236 104 240" stroke="#0f3a3d" strokeWidth="1.5" fill="none" opacity="0.5"/>
  </svg>
);

const SecondaryIllustration = () => (
  <svg viewBox="0 0 600 500" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
    <defs>
      <linearGradient id="room" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1f4e52"/>
        <stop offset="100%" stopColor="#0f3a3d"/>
      </linearGradient>
      <linearGradient id="window" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f0c9a8"/>
        <stop offset="100%" stopColor="#e8a878"/>
      </linearGradient>
    </defs>

    <rect width="600" height="500" fill="url(#room)"/>

    {/* Window with morning light */}
    <rect x="40" y="60" width="160" height="200" fill="url(#window)" rx="2"/>
    <line x1="120" y1="60" x2="120" y2="260" stroke="#0f3a3d" strokeWidth="3"/>
    <line x1="40" y1="160" x2="200" y2="160" stroke="#0f3a3d" strokeWidth="3"/>
    <rect x="35" y="55" width="170" height="210" fill="none" stroke="#3a2a1f" strokeWidth="6" rx="2"/>

    {/* Light beam from window */}
    <path d="M 200 260 L 360 320 L 360 500 L 200 500 Z" fill="#ffd49a" opacity="0.08"/>

    {/* Table */}
    <rect x="240" y="340" width="320" height="14" fill="#3a2a1f"/>
    <rect x="260" y="354" width="8" height="80" fill="#2a1f15"/>
    <rect x="532" y="354" width="8" height="80" fill="#2a1f15"/>

    {/* Coffee cups */}
    <ellipse cx="320" cy="338" rx="22" ry="6" fill="#1a2a2c"/>
    <rect x="298" y="320" width="44" height="20" rx="2" fill="#f5f1ea"/>
    <ellipse cx="320" cy="322" rx="20" ry="5" fill="#3a2418"/>

    <ellipse cx="480" cy="338" rx="22" ry="6" fill="#1a2a2c"/>
    <rect x="458" y="320" width="44" height="20" rx="2" fill="#e8c5a0"/>
    <ellipse cx="480" cy="322" rx="20" ry="5" fill="#3a2418"/>

    {/* Papers/documents on table */}
    <rect x="360" y="328" width="80" height="14" fill="#f5f1ea" opacity="0.85" transform="rotate(-3 400 335)"/>
    <rect x="370" y="332" width="50" height="2" fill="#7a8a8c" opacity="0.6"/>
    <rect x="370" y="336" width="40" height="2" fill="#7a8a8c" opacity="0.6"/>

    {/* Two figures across the table */}
    {/* Left figure */}
    <g transform="translate(290, 220)">
      <path d="M -10 120 Q -15 60 5 40 Q 25 25 45 40 Q 65 60 60 120 Z" fill="#c8a560"/>
      <circle cx="25" cy="20" r="22" fill="#e8c5a0"/>
      <path d="M 5 16 Q 10 -2 25 -2 Q 40 -2 45 16 Q 40 8 25 8 Q 10 8 5 16 Z" fill="#8a8a8a"/>
    </g>

    {/* Right figure */}
    <g transform="translate(450, 215)">
      <path d="M -8 125 Q -12 62 8 42 Q 25 27 42 42 Q 62 62 58 125 Z" fill="#e85a4f"/>
      <circle cx="25" cy="22" r="21" fill="#e8c5a0"/>
      <path d="M 6 18 Q 8 -2 25 -2 Q 42 -2 44 18 Q 40 12 36 16 Q 32 4 25 4 Q 18 4 14 16 Q 10 12 6 18 Z" fill="#d4a574"/>
    </g>

    {/* Plant */}
    <rect x="500" y="220" width="40" height="40" fill="#3a2a1f"/>
    <ellipse cx="510" cy="200" rx="8" ry="20" fill="#4a7560" transform="rotate(-15 510 200)"/>
    <ellipse cx="520" cy="195" rx="9" ry="22" fill="#5a8570"/>
    <ellipse cx="530" cy="200" rx="8" ry="20" fill="#4a7560" transform="rotate(15 530 200)"/>
  </svg>
);

const Wordmark = ({ light = false }) => {
  const stoneColor = light ? C.bg : C.ink;
  const accentStone = C.accent;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
      {/* Cairn icon: stacked stones */}
      <svg width="26" height="32" viewBox="0 0 26 32" fill="none" style={{ flexShrink: 0 }}>
        {/* Bottom stone — widest, flattest */}
        <ellipse cx="13" cy="27" rx="12" ry="3.5" fill={stoneColor}/>
        {/* Middle stone */}
        <ellipse cx="13" cy="19" rx="9.5" ry="3.2" fill={stoneColor} opacity="0.85"/>
        {/* Upper stone — accent color, the "marker" */}
        <ellipse cx="13" cy="11.5" rx="7" ry="2.8" fill={accentStone}/>
        {/* Top stone — small, capping */}
        <ellipse cx="13" cy="5" rx="4.2" ry="2.2" fill={stoneColor}/>
      </svg>
      <span style={{
        fontFamily: "'Cormorant Garamond', 'Newsreader', serif",
        fontSize: "1.85rem",
        fontWeight: 500,
        letterSpacing: "-0.01em",
        color: light ? C.bg : C.ink,
        lineHeight: 1,
      }}>
        Cairn
      </span>
    </div>
  );
};

const SectionLabel = ({ children, dark = false }) => (
  <p style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: dark ? C.line : C.faint, fontSize: "0.85rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>
    {children}
  </p>
);

const PrimaryButton = ({ onClick, children, large = false, disabled = false }) => (
  <button onClick={onClick} disabled={disabled} className="primary-btn" style={{
    background: C.accent, color: "#fff", border: "none",
    padding: large ? "1.15rem 2.5rem" : "0.9rem 1.85rem",
    fontSize: large ? "1.05rem" : "0.95rem",
    fontFamily: "inherit", fontWeight: 500, cursor: "pointer",
    borderRadius: "2px", display: "inline-flex", alignItems: "center", gap: "0.55rem",
    letterSpacing: "0.01em", transition: "all 0.2s", whiteSpace: "nowrap",
    boxShadow: "0 1px 0 rgba(0,0,0,0.1)",
  }}>
    {children} <ArrowRight size={large ? 18 : 16} />
  </button>
);

export default function BenefitsAudit() {
  const [view, setView] = useState("landing");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const startAudit = () => { setView("audit"); setStep(0); setAnswers({}); window.scrollTo(0, 0); };
  const restart = () => { setView("landing"); setStep(0); setAnswers({}); window.scrollTo(0, 0); };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter Tight', -apple-system, sans-serif", color: C.ink }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,500&family=Inter+Tight:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.6s ease-out forwards; }
        .stagger-1 { animation-delay: 0.05s; opacity: 0; }
        .stagger-2 { animation-delay: 0.18s; opacity: 0; }
        .stagger-3 { animation-delay: 0.32s; opacity: 0; }
        h1, h2, h3, h4 { font-feature-settings: "liga" 1, "dlig" 0, "calt" 1; }
        @media (hover: hover) {
          .choice-btn:hover { background: ${C.ink} !important; color: ${C.bg} !important; border-color: ${C.ink} !important; }
          .choice-btn:hover .choice-arrow { transform: translateX(4px); }
        }
        .choice-btn:active { background: ${C.ink} !important; color: ${C.bg} !important; border-color: ${C.ink} !important; }
        .primary-btn:hover:not(:disabled) { background: ${C.accentDark} !important; transform: translateY(-1px); }
        .primary-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .secondary-btn:hover { color: ${C.ink} !important; }
        .step-card:hover { border-color: ${C.accent} !important; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(15, 58, 61, 0.06); }
        .step-card { transition: all 0.25s ease; }
        @media (min-width: 900px) {
          .hero-grid { grid-template-columns: 1.05fr 1fr !important; padding: 4rem 1.5rem 2rem !important; }
          .nav-link { display: inline !important; }
          .programs-grid { grid-template-columns: 0.9fr 1.1fr !important; gap: 4rem !important; }
          .testimonial-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .why-grid { grid-template-columns: 1fr 1.05fr !important; gap: 5rem !important; }
        }
        @media (min-width: 700px) {
          .footer-grid { grid-template-columns: 1fr 1.5fr !important; gap: 4rem !important; }
        }
      `}</style>

      {view === "landing" && <Landing onStart={startAudit} />}
      {view === "audit" && <Audit step={step} setStep={setStep} answers={answers} setAnswers={setAnswers} onComplete={() => { setView("results"); window.scrollTo(0, 0); }} onExit={restart} />}
      {view === "results" && <Results answers={answers} onRestart={restart} onBookConsultation={() => { setView("consultation"); window.scrollTo(0, 0); }} onViewGuides={() => { setView("guides"); window.scrollTo(0, 0); }} />}
      {view === "consultation" && <Consultation onBack={() => { setView("results"); window.scrollTo(0, 0); }} onRestart={restart} />}
      {view === "guides" && <GuideStore answers={answers} onBack={() => { setView("results"); window.scrollTo(0, 0); }} onRestart={restart} />}
    </div>
  );
}

function Landing({ onStart }) {
  return (
    <div>
      {/* Top nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(245, 241, 234, 0.92)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Wordmark />
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
            <a href="#how" className="nav-link" style={{ color: C.muted, textDecoration: "none", fontSize: "0.92rem", display: "none" }}>How it works</a>
            <a href="#programs" className="nav-link" style={{ color: C.muted, textDecoration: "none", fontSize: "0.92rem", display: "none" }}>Programs</a>
            <PrimaryButton onClick={onStart}>Begin review</PrimaryButton>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: "relative", overflow: "hidden", borderBottom: `1px solid ${C.line}` }}>
        <div className="hero-grid" style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 1.5rem 0", display: "grid", gridTemplateColumns: "1fr", gap: "3rem", alignItems: "center" }}>
          <div className="fade-up stagger-1" style={{ padding: "1rem 0 4rem" }}>
            <SectionLabel>Independent · Nationwide · No commissions</SectionLabel>
            <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(2.5rem, 6vw, 4.5rem)", lineHeight: 1.02, fontWeight: 500, letterSpacing: "-0.025em", marginBottom: "1.5rem", color: C.ink }}>
              The retirement<br/>
              <span style={{ fontStyle: "italic", color: C.accent }}>you earned,</span><br/>
              fully claimed.
            </h1>
            <p style={{ fontSize: "1.2rem", lineHeight: 1.55, color: C.muted, marginBottom: "2rem", maxWidth: "520px" }}>
              A free 4-minute review reveals the Medicare savings, prescription help, and benefits you're entitled to — without the sales pitch.
            </p>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap", marginBottom: "2.5rem" }}>
              <PrimaryButton onClick={onStart} large>Begin your review</PrimaryButton>
              <span style={{ fontSize: "0.9rem", color: C.faint }}>
                <Clock size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "0.35rem" }} />
                4 minutes · Nothing saved
              </span>
            </div>

            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", paddingTop: "1.5rem", borderTop: `1px solid ${C.line}` }}>
              {[
                { v: "$3,400", l: "Average annual\nmissed benefits" },
                { v: "14+", l: "Programs we\ncheck for you" },
                { v: "0", l: "Insurance\ncommissions" },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontFamily: "'Newsreader', serif", fontSize: "1.85rem", fontWeight: 600, color: C.ink, lineHeight: 1, fontStyle: "italic" }}>{s.v}</div>
                  <div style={{ fontSize: "0.8rem", color: C.faint, marginTop: "0.35rem", whiteSpace: "pre-line" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="fade-up stagger-2" style={{ position: "relative", height: "clamp(360px, 60vh, 620px)", overflow: "hidden", borderRadius: "2px" }}>
            <HeroIllustration />
            {/* Floating callout card */}
            <div style={{ position: "absolute", bottom: "1.5rem", left: "1.5rem", right: "1.5rem", maxWidth: "320px", background: "rgba(255, 255, 255, 0.97)", backdropFilter: "blur(8px)", padding: "1.1rem 1.25rem", borderRadius: "2px", borderLeft: `3px solid ${C.accent}`, boxShadow: "0 4px 20px rgba(15, 58, 61, 0.15)" }}>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.4rem" }}>
                {[1,2,3,4,5].map(i => <Star key={i} size={13} fill={C.accent} stroke={C.accent} />)}
              </div>
              <p style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: "0.95rem", lineHeight: 1.45, color: C.ink, margin: 0 }}>
                "Found $4,800/year in benefits I had no idea existed."
              </p>
              <p style={{ fontSize: "0.78rem", color: C.faint, marginTop: "0.5rem" }}>— Margaret K., Annapolis</p>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM STRIP */}
      <section style={{ background: C.ink, color: C.bg, padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", textAlign: "center" }}>
          <SectionLabel dark>The problem</SectionLabel>
          <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(1.75rem, 4vw, 2.75rem)", lineHeight: 1.2, fontWeight: 500, letterSpacing: "-0.02em", maxWidth: "820px", margin: "0 auto 3rem", color: C.bg }}>
            Every year, American retirees leave <span style={{ fontStyle: "italic", color: C.accent }}>billions</span> in benefits unclaimed —<br/>not because they don't qualify, but because no one tells them.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "2rem", textAlign: "left" }}>
            {[
              { stat: "5 of 10", label: "Eligible seniors miss the Medicare Savings Programs that pay their Part B premium" },
              { stat: "1 in 3", label: "Eligible Medicare beneficiaries don't claim Extra Help for prescription drugs" },
              { stat: "$10B+", label: "Estimated unclaimed VA Aid & Attendance benefits across veteran widows" },
              { stat: "78%", label: "Are unaware their state offers a Pharmaceutical Assistance Program for Part D" },
            ].map((s, i) => (
              <div key={i} style={{ paddingTop: "1.25rem", borderTop: `1px solid ${C.lineDark}` }}>
                <div style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: C.accent, fontSize: "2rem", fontWeight: 500, lineHeight: 1, marginBottom: "0.75rem" }}>{s.stat}</div>
                <p style={{ color: C.line, fontSize: "0.95rem", lineHeight: 1.5, margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ padding: "5rem 1.5rem", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <SectionLabel>How it works</SectionLabel>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(2rem, 4.5vw, 3rem)", lineHeight: 1.1, fontWeight: 500, letterSpacing: "-0.02em", maxWidth: "640px", margin: "0 auto", color: C.ink }}>
              Honest answers to{" "}
              <span style={{ fontStyle: "italic", color: C.accent }}>a dozen plain questions</span>{" "}
              are all we need.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
            {[
              { num: "01", title: "Tell us about you", body: "A dozen plain-English questions about your birth date, household, income, and Medicare status. No name, address, or SSN." },
              { num: "02", title: "We run the math", body: "Our engine checks your inputs against 14+ federal, state, and county programs — including thresholds most brokers don't track." },
              { num: "03", title: "Get a personal report", body: "A ranked list of programs with dollar values, application links, and a Medicare path tailored to your priorities." },
            ].map((s, i) => (
              <div key={i} className="step-card" style={{ background: C.paper, border: `1px solid ${C.line}`, padding: "2rem 1.75rem", borderRadius: "2px" }}>
                <div style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: C.accent, fontSize: "1rem", fontWeight: 500, marginBottom: "1rem", letterSpacing: "0.05em" }}>{s.num}</div>
                <h3 style={{ fontFamily: "'Newsreader', serif", fontSize: "1.4rem", fontWeight: 600, marginBottom: "0.75rem", letterSpacing: "-0.01em", color: C.ink }}>{s.title}</h3>
                <p style={{ color: C.muted, lineHeight: 1.6, fontSize: "0.95rem", margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT WE COVER */}
      <section id="programs" style={{ padding: "5rem 1.5rem", background: `linear-gradient(180deg, ${C.bg} 0%, ${C.accentSoft} 100%)`, borderBottom: `1px solid ${C.line}` }}>
        <div className="programs-grid" style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr", gap: "3rem", alignItems: "start" }}>
          <div>
            <SectionLabel>What we cover</SectionLabel>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(2rem, 4.5vw, 3rem)", lineHeight: 1.1, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: "1.25rem", color: C.ink }}>
              Every program a retiree should know about.
            </h2>
            <p style={{ color: C.muted, fontSize: "1.05rem", lineHeight: 1.55, marginBottom: "2rem" }}>
              Most tools focus on Medicare plans. We map the entire benefits landscape — federal, state, and county — and show you which ones stack.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", paddingTop: "1.25rem", borderTop: `1px solid ${C.line}` }}>
              <Shield size={20} style={{ color: C.accent }} />
              <span style={{ fontSize: "0.9rem", color: C.muted }}>
                Updated for <strong>2026</strong> federal poverty guidelines and state-specific thresholds.
              </span>
            </div>
          </div>
          <ProgramFlipCards />
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: "5rem 1.5rem", background: C.paper, borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <SectionLabel>What neighbors say</SectionLabel>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(1.85rem, 4vw, 2.6rem)", lineHeight: 1.15, fontWeight: 500, letterSpacing: "-0.02em", maxWidth: "640px", margin: "0 auto", color: C.ink }}>
              Real retirees.<br/><span style={{ fontStyle: "italic", color: C.accent }}>Real recovered benefits.</span>
            </h2>
          </div>
          <div className="testimonial-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
            {[
              { quote: "I'd been on Medicare for three years and had no idea I qualified for SLMB. The review found it in two minutes.", name: "Robert and Diane M.", location: "Eastport, Annapolis", saved: "$2,100 / yr" },
              { quote: "Our advisor never mentioned SPDAP. Cairn's report had it on the first page with the application link.", name: "Frances W.", location: "Severna Park", saved: "$900 / yr" },
              { quote: "Got my husband's VA Aid & Attendance approved after the review flagged it. We had no clue surviving spouses qualified.", name: "Linda H.", location: "Edgewater", saved: "$1,400 / mo" },
            ].map((t, i) => (
              <figure key={i} style={{ margin: 0, padding: "2rem", background: C.bg, border: `1px solid ${C.line}`, borderRadius: "2px", position: "relative" }}>
                <Quote size={32} style={{ color: C.accent, opacity: 0.25, position: "absolute", top: "1rem", right: "1.25rem" }} />
                <blockquote style={{ margin: 0, fontFamily: "'Newsreader', serif", fontSize: "1.15rem", lineHeight: 1.45, fontStyle: "italic", color: C.ink, marginBottom: "1.25rem" }}>
                  "{t.quote}"
                </blockquote>
                <figcaption style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: "1rem", borderTop: `1px solid ${C.line}` }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", color: C.ink }}>{t.name}</div>
                    <div style={{ fontSize: "0.8rem", color: C.faint, marginTop: "0.15rem" }}>{t.location}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: C.accent, fontWeight: 600, fontSize: "1.05rem", lineHeight: 1 }}>{t.saved}</div>
                    <div style={{ fontSize: "0.7rem", color: C.faint, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "0.25rem" }}>recovered</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* WHY DIFFERENT */}
      <section style={{ padding: "5rem 1.5rem", background: C.ink, color: C.bg }}>
        <div className="why-grid" style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr", gap: "3rem", alignItems: "center" }}>
          <div style={{ position: "relative", height: "clamp(280px, 50vh, 460px)", overflow: "hidden", borderRadius: "2px" }}>
            <SecondaryIllustration />
          </div>
          <div>
            <SectionLabel dark>Why we're different</SectionLabel>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(1.85rem, 4vw, 2.6rem)", lineHeight: 1.15, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: "1.75rem", color: C.bg }}>
              Most "free" Medicare tools are <span style={{ fontStyle: "italic", color: C.accent }}>lead funnels</span> for insurance brokers.
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {[
                { title: "We earn nothing from carriers.", body: "No commissions, no referral kickbacks, no preferred plans. The review's free." },
                { title: "We screen across all programs.", body: "Federal, state, and local. Most tools only show Medicare plans." },
                { title: "We update for 2026 thresholds.", body: "Income limits and FPL change every January. Outdated tools cost real money." },
              ].map((p, i) => (
                <div key={i} style={{ display: "flex", gap: "1rem", paddingBottom: "1.25rem", borderBottom: i < 2 ? `1px solid ${C.lineDark}` : "none" }}>
                  <div style={{ flexShrink: 0, width: "32px", height: "32px", border: `1px solid ${C.accent}`, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "100%" }}>
                    <Check size={16} />
                  </div>
                  <div>
                    <h4 style={{ fontFamily: "'Newsreader', serif", fontSize: "1.15rem", fontWeight: 600, marginBottom: "0.35rem", color: C.bg }}>{p.title}</h4>
                    <p style={{ color: C.line, fontSize: "0.95rem", lineHeight: 1.5, margin: 0 }}>{p.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: "6rem 1.5rem", textAlign: "center" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <SectionLabel>Ready when you are</SectionLabel>
          <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(2.25rem, 5vw, 3.5rem)", lineHeight: 1.05, fontWeight: 500, letterSpacing: "-0.025em", marginBottom: "1.5rem", color: C.ink }}>
            Four minutes that<br/>
            <span style={{ fontStyle: "italic", color: C.accent }}>could save you thousands.</span>
          </h2>
          <p style={{ fontSize: "1.1rem", color: C.muted, marginBottom: "2.5rem", lineHeight: 1.55 }}>
            No account, no email required. Your answers are processed in your browser and never stored.
          </p>
          <PrimaryButton onClick={onStart} large>Begin your free review</PrimaryButton>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "3rem 1.5rem 2.5rem", borderTop: `1px solid ${C.line}`, background: C.bg }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem", marginBottom: "2rem" }}>
            <div>
              <Wordmark />
              <p style={{ color: C.muted, fontSize: "0.9rem", marginTop: "1rem", lineHeight: 1.55, maxWidth: "320px" }}>
                A trail of markers through the Medicare maze. Independent benefits guidance for retirees nationwide, headquartered in Annapolis, Maryland.
              </p>
            </div>
            <div style={{ fontSize: "0.85rem", color: C.faint, lineHeight: 1.6 }}>
              <p style={{ margin: 0 }}>
                <strong style={{ color: C.muted }}>Disclaimer:</strong> This review provides preliminary eligibility estimates only and is not a guarantee of benefits. Income and asset thresholds change annually. Confirm details with the listed agencies before making decisions. Not affiliated with or endorsed by Medicare or any government agency.
              </p>
            </div>
          </div>
          <div style={{ paddingTop: "1.5rem", borderTop: `1px solid ${C.line}`, fontSize: "0.8rem", color: C.faint, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <span>© 2026 Cairn</span>
            <span>Made in Annapolis, Maryland</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Collapsible result components ──────────────────────────────────────

function FindingCard({ f, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: C.paper, border: `1px solid ${open ? C.accent : C.line}`, borderLeft: `4px solid ${f.tier === 1 ? C.accent : C.gold}`, borderRadius: "2px", overflow: "hidden", transition: "border-color 0.2s" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", background: "none", border: "none", padding: "1.1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.3rem" }}>
            <h3 style={{ fontFamily: "'Newsreader', serif", fontSize: "1.15rem", fontWeight: 600, margin: 0, lineHeight: 1.25, color: C.ink }}>{f.program}</h3>
            <span style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: C.accent, fontSize: "1rem", fontWeight: 500, whiteSpace: "nowrap" }}>{f.value}</span>
          </div>
          {f.inPlainEnglish && (
            <p style={{ color: C.muted, fontSize: "0.88rem", lineHeight: 1.5, margin: 0 }}>
              {f.inPlainEnglish}
            </p>
          )}
          {f.countySupplement && (
            <div style={{ marginTop: "0.5rem", display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.2rem 0.55rem", background: C.accentSoft, border: `1px solid ${C.accent}`, borderRadius: "100px", fontSize: "0.72rem", color: C.accent, fontWeight: 600 }}>
              <Sparkles size={10} /> + {f.countySupplement.county} County supplement
            </div>
          )}
        </div>
        <div style={{ width: "26px", height: "26px", borderRadius: "100%", border: `1px solid ${open ? C.accent : C.line}`, display: "flex", alignItems: "center", justifyContent: "center", color: open ? C.accent : C.muted, transition: "all 0.2s", flexShrink: 0 }}>
          {open ? <Minus size={13} /> : <Plus size={13} />}
        </div>
      </button>
      {open && (
        <div style={{ padding: "0 1.25rem 1.25rem", borderTop: `1px solid ${C.line}` }}>
          <div style={{ paddingTop: "1rem" }}>
            <p style={{ color: C.muted, fontSize: "0.9rem", lineHeight: 1.55, margin: "0 0 0.85rem 0" }}>
              <strong style={{ color: C.ink, fontWeight: 600 }}>Why it applies to you:</strong> {f.why}
            </p>
            {f.countySupplement && (
              <div style={{ background: C.accentSoft, border: `1px solid ${C.accent}`, padding: "0.85rem 1rem", borderRadius: "2px", marginBottom: "0.85rem" }}>
                <div style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: C.accent, fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Sparkles size={11} /> {f.countySupplement.county} County adds on top
                </div>
                <p style={{ color: C.ink, fontSize: "0.88rem", lineHeight: 1.5, margin: "0 0 0.35rem 0" }}>
                  <strong>Additional value: {f.countySupplement.value}</strong>
                </p>
                <p style={{ color: C.muted, fontSize: "0.85rem", lineHeight: 1.5, margin: 0 }}>
                  {f.countySupplement.note}
                </p>
              </div>
            )}
            <div style={{ background: C.bg, padding: "0.75rem 1rem", fontSize: "0.88rem", borderRadius: "2px", lineHeight: 1.5 }}>
              <strong style={{ color: C.ink }}>How to claim it:</strong> <span style={{ color: C.muted }}>{f.action}</span>
            </div>
            {f.applyUrl && (
              <a href={f.applyUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", marginTop: "0.85rem", padding: "0.55rem 1rem", background: C.ink, color: C.bg, borderRadius: "2px", textDecoration: "none", fontSize: "0.85rem", fontWeight: 500, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = C.accent} onMouseLeave={e => e.currentTarget.style.background = C.ink}>
                Apply now <ExternalLink size={12} />
              </a>
            )}
            {f.stack && <p style={{ marginTop: "0.7rem", fontSize: "0.82rem", color: C.faint, fontStyle: "italic" }}><Sparkles size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "0.3rem" }} />{f.stack}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function CarrierCard({ carrier, isLowest, stateName }) {
  const [showFactors, setShowFactors] = useState(false);
  const ratingLabel = {
    "attained-age": "Rate climbs with age",
    "issue-age": "Rate locks at enrollment",
    "community-rated": "Same rate for all ages",
  }[carrier.rating] || "—";

  return (
    <div style={{ padding: "0.85rem 1rem", border: `1px solid ${C.line}`, borderLeft: isLowest ? `4px solid ${C.accent}` : `1px solid ${C.line}`, borderRadius: "2px", background: C.paper }}>
      {isLowest && (
        <div style={{ fontSize: "0.6rem", color: C.accent, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <Sparkles size={10} /> Lowest rates in {stateName || "your state"}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.85rem", marginBottom: "0.4rem" }}>
        <h6 style={{ fontFamily: "'Newsreader', serif", fontSize: "1rem", fontWeight: 600, color: C.ink, margin: 0, flex: 1, minWidth: 0 }}>{carrier.name}</h6>
        <span style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: C.accent, fontSize: "0.95rem", fontWeight: 500, whiteSpace: "nowrap" }}>{carrier.rangeMonthly}/mo</span>
      </div>

      {/* Factor chips — always visible */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.55rem" }}>
        <FactorChip label={ratingLabel} />
        {carrier.amBest && <FactorChip label={`AM Best ${carrier.amBest}`} />}
        {carrier.householdDiscount > 0 && <FactorChip label={`${carrier.householdDiscount}% household discount`} />}
      </div>

      {/* Strength one-liner */}
      {carrier.strength && (
        <p style={{ fontSize: "0.83rem", color: C.muted, lineHeight: 1.5, margin: "0 0 0.55rem 0" }}>
          {carrier.strength}
        </p>
      )}

      <a href={carrier.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.82rem", color: C.accent, textDecoration: "none", fontWeight: 500 }}>
        Get a quote <ExternalLink size={11} />
      </a>
    </div>
  );
}

function FactorChip({ label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "0.18rem 0.55rem", background: C.bg, border: `1px solid ${C.line}`, borderRadius: "100px", fontSize: "0.72rem", color: C.muted, fontWeight: 500, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function MedicarePathBlock({ path }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showAllCarriers, setShowAllCarriers] = useState(false);
  const [showCompareTips, setShowCompareTips] = useState(false);
  const [showMedigapDetails, setShowMedigapDetails] = useState(false);
  const visibleCarriers = path.carriers ? (showAllCarriers ? path.carriers : path.carriers.slice(0, 3)) : null;
  const hasSteps = path.enrollmentSteps && path.enrollmentSteps.length > 0;

  return (
    <>
      {/* Top: dark recommendation card */}
      <div style={{ background: C.ink, color: C.bg, padding: "1.75rem", borderRadius: "2px", marginBottom: hasSteps ? "1.25rem" : 0 }}>
        <h3 style={{ fontFamily: "'Newsreader', serif", fontSize: "1.35rem", fontWeight: 500, marginBottom: "0.6rem", lineHeight: 1.2, color: C.bg }}>{path.title}</h3>
        <p style={{ color: C.line, lineHeight: 1.55, margin: 0, fontSize: "0.98rem" }}>{path.summary}</p>
        {showDetails && (
          <ul style={{ listStyle: "none", padding: 0, margin: "1.1rem 0 0", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {path.points.map((p, i) => (
              <li key={i} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", fontSize: "0.92rem", lineHeight: 1.5, color: C.line }}>
                <span style={{ color: C.accent, fontFamily: "'Newsreader', serif", fontStyle: "italic", flexShrink: 0 }}>—</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        )}
        <button onClick={() => setShowDetails(!showDetails)} style={{ marginTop: "1.1rem", background: "none", border: `1px solid ${C.lineDark}`, color: C.line, padding: "0.55rem 1rem", borderRadius: "2px", fontSize: "0.85rem", fontFamily: "inherit", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.4rem", transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.bg; }} onMouseLeave={e => { e.currentTarget.style.borderColor = C.lineDark; e.currentTarget.style.color = C.line; }}>
          {showDetails ? <>Hide details <Minus size={13} /></> : <>Show {path.points.length} key points <Plus size={13} /></>}
        </button>
      </div>

      {/* Ordered enrollment steps */}
      {hasSteps && (
        <div>
          <h4 style={{ fontFamily: "'Newsreader', serif", fontSize: "1.1rem", fontWeight: 600, color: C.ink, margin: "0 0 0.4rem 0" }}>
            Your enrollment plan
          </h4>
          <p style={{ fontSize: "0.85rem", color: C.muted, marginBottom: "1.1rem", lineHeight: 1.5 }}>
            Complete these in order. Each step builds on the one before it.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {path.enrollmentSteps.map((step, i) => (
              <div key={i} style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ padding: "1.1rem 1.25rem", display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                  <div style={{ flexShrink: 0, width: "30px", height: "30px", borderRadius: "100%", background: C.ink, color: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Newsreader', serif", fontStyle: "italic", fontWeight: 500, fontSize: "0.95rem" }}>
                    {step.n}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h5 style={{ fontFamily: "'Newsreader', serif", fontSize: "1.05rem", fontWeight: 600, color: C.ink, margin: "0 0 0.35rem 0", lineHeight: 1.3 }}>
                      {step.title}
                    </h5>
                    <p style={{ fontSize: "0.88rem", color: C.muted, lineHeight: 1.5, margin: 0 }}>{step.why}</p>
                    {step.link && (
                      <a href={step.link.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", marginTop: "0.85rem", padding: "0.55rem 1rem", background: C.ink, color: C.bg, borderRadius: "2px", textDecoration: "none", fontSize: "0.85rem", fontWeight: 500, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = C.accent} onMouseLeave={e => e.currentTarget.style.background = C.ink}>
                        {step.link.label} <ExternalLink size={12} />
                      </a>
                    )}
                    {/* Trigger button for Medigap step's embedded carrier comparison */}
                    {step.showCarriers && path.carriers && (
                      <button
                        onClick={() => setShowMedigapDetails(!showMedigapDetails)}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "0.4rem",
                          marginTop: "0.85rem",
                          padding: "0.55rem 1rem",
                          background: showMedigapDetails ? C.ink : C.paper,
                          color: showMedigapDetails ? C.bg : C.ink,
                          border: `1px solid ${C.ink}`,
                          borderRadius: "2px",
                          fontSize: "0.85rem",
                          fontWeight: 500,
                          fontFamily: "inherit",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        {showMedigapDetails ? <>Hide carrier comparison <Minus size={12} /></> : <>Compare {path.carriers.length} carriers in {path.stateName} <Plus size={12} /></>}
                      </button>
                    )}
                  </div>
                </div>

                {/* Embed carriers list inside the Medigap step — collapsed by default */}
                {step.showCarriers && path.carriers && showMedigapDetails && (
                  <div style={{ borderTop: `1px solid ${C.line}`, padding: "1.1rem 1.25rem", background: C.bg }}>
                    <p style={{ fontSize: "0.83rem", color: C.muted, lineHeight: 1.45, margin: "0 0 0.85rem 0" }}>
                      <strong style={{ color: C.ink }}>Same coverage by federal law</strong> — but premiums and rate-increase patterns vary 30–50% by carrier. Get quotes from at least three.
                    </p>

                    {/* Beyond-price tip — collapsible */}
                    <div style={{ background: C.paper, border: `1px solid ${showCompareTips ? C.accent : C.line}`, borderRadius: "2px", marginBottom: "0.85rem", transition: "border-color 0.2s" }}>
                      <button
                        onClick={() => setShowCompareTips(!showCompareTips)}
                        style={{
                          width: "100%", background: "none", border: "none",
                          padding: "0.7rem 0.95rem", display: "flex",
                          justifyContent: "space-between", alignItems: "center",
                          gap: "0.85rem", cursor: "pointer", fontFamily: "inherit",
                          textAlign: "left",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Sparkles size={13} style={{ color: C.accent, flexShrink: 0 }} />
                          <span style={{ fontSize: "0.85rem", color: C.ink, fontWeight: 500 }}>
                            How to compare beyond price
                          </span>
                        </span>
                        <div style={{ width: "22px", height: "22px", borderRadius: "100%", border: `1px solid ${showCompareTips ? C.accent : C.line}`, display: "flex", alignItems: "center", justifyContent: "center", color: showCompareTips ? C.accent : C.faint, transition: "all 0.2s", flexShrink: 0 }}>
                          {showCompareTips ? <Minus size={11} /> : <Plus size={11} />}
                        </div>
                      </button>
                      {showCompareTips && (
                        <div style={{ padding: "0 0.95rem 0.95rem", borderTop: `1px solid ${C.line}` }}>
                          <ul style={{ listStyle: "none", padding: 0, margin: "0.85rem 0 0", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {[
                              { k: "Rating method", v: "Attained-age starts low but climbs each birthday. Issue-age locks at enrollment. Community-rated stays flat for life." },
                              { k: "AM Best rating", v: "A or higher means the carrier can pay claims long-term. Cheap from a shaky insurer is no bargain." },
                              { k: "Household discount", v: "If your spouse also enrolls with the same carrier, 5–15% off can flip the rankings." },
                              { k: "Rate increase history", v: "Some carriers hike 3% annually, others 8–15%. Past increases predict future ones." },
                            ].map((f, fi) => (
                              <li key={fi} style={{ fontSize: "0.82rem", color: C.muted, lineHeight: 1.5 }}>
                                <strong style={{ color: C.ink }}>{f.k}.</strong> {f.v}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* State-specific note — sits with the carrier list it relates to */}
                    {path.medigapNote && (
                      <div style={{ background: C.accentSoft, border: `1px solid ${C.accent}`, borderRadius: "2px", padding: "0.7rem 0.9rem", marginBottom: "0.85rem" }}>
                        <p style={{ fontSize: "0.82rem", color: C.ink, lineHeight: 1.45, margin: 0 }}>
                          <strong>Note for {path.stateName}:</strong> {path.medigapNote}
                        </p>
                      </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                      {visibleCarriers.map((carrier, ci) => (
                        <CarrierCard key={ci} carrier={carrier} isLowest={ci === 0} stateName={path.stateName} />
                      ))}
                    </div>
                    {path.carriers.length > 3 && (
                      <button onClick={() => setShowAllCarriers(!showAllCarriers)} style={{ marginTop: "0.75rem", background: "none", border: "none", color: C.muted, fontSize: "0.83rem", fontFamily: "inherit", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: 0 }} onMouseEnter={e => e.currentTarget.style.color = C.ink} onMouseLeave={e => e.currentTarget.style.color = C.muted}>
                        {showAllCarriers ? <Minus size={12} /> : <Plus size={12} />}
                        {showAllCarriers ? "Show fewer" : `Show ${path.carriers.length - 3} more carriers`}
                      </button>
                    )}
                    <p style={{ fontSize: "0.74rem", color: C.faint, lineHeight: 1.5, margin: "0.85rem 0 0", fontStyle: "italic" }}>
                      Premium ranges are 2026 estimates for a 65-year-old non-smoker. Your actual quote depends on age, ZIP code, gender (in some states), and tobacco use. Rankings shift over time — always get fresh quotes from at least three carriers.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function WatchoutCard({ w, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: w.level === "high" ? C.accentSoft : C.paper, border: `1px solid ${open ? (w.level === "high" ? C.accent : C.line) : C.line}`, borderRadius: "2px", overflow: "hidden", transition: "border-color 0.2s" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", background: "none", border: "none", padding: "0.95rem 1.1rem", display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
        <AlertCircle size={18} style={{ color: w.level === "high" ? C.accent : C.faint, flexShrink: 0, marginTop: "0.15rem" }} />
        <h4 style={{ flex: 1, fontFamily: "'Newsreader', serif", fontSize: "1rem", fontWeight: 600, margin: 0, color: C.ink, lineHeight: 1.3 }}>{w.title}</h4>
        <div style={{ width: "22px", height: "22px", borderRadius: "100%", border: `1px solid ${open ? C.accent : C.line}`, display: "flex", alignItems: "center", justifyContent: "center", color: open ? C.accent : C.faint, transition: "all 0.2s", flexShrink: 0, marginTop: "0.05rem" }}>
          {open ? <Minus size={11} /> : <Plus size={11} />}
        </div>
      </button>
      {open && (
        <div style={{ padding: "0 1.1rem 1.1rem 2.85rem" }}>
          <p style={{ fontSize: "0.88rem", color: C.muted, lineHeight: 1.5, margin: 0 }}>{w.body}</p>
          {w.link && (
            <a href={w.link.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", marginTop: "0.6rem", fontSize: "0.83rem", color: C.accent, textDecoration: "none", fontWeight: 500 }}>
              {w.link.label} <ExternalLink size={11} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function Audit({ step, setStep, answers, setAnswers, onComplete, onExit }) {
  // Filter to questions whose showIf predicate (if any) passes against current answers.
  // This lets pre-enrollment questions appear only for users who say they're not yet on Medicare.
  const activeQuestions = useMemo(
    () => QUESTIONS.filter(q => !q.showIf || q.showIf(answers)),
    [answers]
  );
  const totalSteps = activeQuestions.length;
  const safeStep = Math.min(step, totalSteps - 1);
  const progress = ((safeStep + 1) / totalSteps) * 100;
  const currentQ = activeQuestions[safeStep];
  const setAnswer = (val) => setAnswers(prev => ({ ...prev, [currentQ.id]: val }));
  const canAdvance = () => {
    const v = answers[currentQ.id];
    if (currentQ.type === "number") return v !== undefined && v !== "" && Number(v) >= (currentQ.min || 0);
    if (currentQ.type === "zip") {
      if (v === undefined || !/^\d{5}$/.test(String(v).trim())) return false;
      // If we have a state, the ZIP must belong to it
      const belongs = zipBelongsToState(v, answers.state);
      if (belongs === false) return false; // explicit mismatch — block
      return true; // match, or unknown state (no validation possible)
    }
    return v !== undefined && v !== "";
  };
  const next = () => safeStep === totalSteps - 1 ? onComplete() : setStep(safeStep + 1);
  const back = () => safeStep === 0 ? onExit() : setStep(safeStep - 1);

  return (
    <div style={{ minHeight: "100vh", padding: "2rem 1.5rem" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", paddingBottom: "1rem", borderBottom: `1px solid ${C.line}` }}>
          <Wordmark />
          <span style={{ fontSize: "0.85rem", color: C.faint, fontVariantNumeric: "tabular-nums" }}>{safeStep + 1} / {totalSteps}</span>
        </header>
        <div style={{ height: "2px", background: C.line, marginBottom: "3rem", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: C.accent, transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }} />
        </div>

        <div key={safeStep} className="fade-up">
          {currentQ.section && <SectionLabel>{currentQ.section}</SectionLabel>}
          <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", lineHeight: 1.15, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: "0.75rem", color: C.ink }}>
            {currentQ.question}
          </h2>
          {currentQ.helper && <p style={{ color: C.muted, fontSize: "1rem", marginBottom: "2rem", lineHeight: 1.5 }}>{currentQ.helper}</p>}

          {currentQ.type === "number" && (
            <div style={{ position: "relative", marginBottom: "2rem", maxWidth: "320px" }}>
              {currentQ.prefix && <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: C.faint, fontSize: "1.5rem", fontFamily: "'Newsreader', serif" }}>{currentQ.prefix}</span>}
              <input type="number" value={answers[currentQ.id] || ""} onChange={e => setAnswer(e.target.value)} placeholder={currentQ.placeholder} autoFocus style={{ width: "100%", padding: currentQ.prefix ? "1rem 1rem 1rem 2.5rem" : "1rem", fontSize: "1.5rem", fontFamily: "'Newsreader', serif", border: `1px solid ${C.line}`, borderRadius: "2px", background: C.paper, outline: "none", color: C.ink }} onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.line} />
            </div>
          )}

          {currentQ.type === "zip" && (() => {
            const zipVal = answers[currentQ.id] || "";
            const isValidLength = /^\d{5}$/.test(String(zipVal).trim());
            const userState = answers.state;
            const userStateName = STATE_NAMES[userState] || "your state";
            const belongs = isValidLength ? zipBelongsToState(zipVal, userState) : null;
            const detectedCounty = isValidLength && belongs !== false ? lookupCounty(userState, zipVal) : null;
            const stateIsSeeded = userState && STATE_DATA[userState] && STATE_DATA[userState].seeded;
            const isMismatch = isValidLength && belongs === false;

            return (
              <div style={{ marginBottom: "2rem", maxWidth: "360px" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={5}
                  value={zipVal}
                  onChange={e => setAnswer(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  placeholder={currentQ.placeholder}
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "1rem",
                    fontSize: "1.5rem",
                    fontFamily: "'Newsreader', serif",
                    border: `1px solid ${isMismatch ? "#c2453a" : C.line}`,
                    borderRadius: "2px",
                    background: C.paper,
                    outline: "none",
                    color: C.ink,
                    letterSpacing: "0.05em",
                  }}
                  onFocus={e => { if (!isMismatch) e.target.style.borderColor = C.accent; }}
                  onBlur={e => { e.target.style.borderColor = isMismatch ? "#c2453a" : C.line; }}
                />

                {/* Mismatch — ZIP doesn't belong to selected state */}
                {isMismatch && (
                  <div style={{ marginTop: "0.75rem", padding: "0.7rem 0.9rem", background: "#fdebe9", border: "1px solid #c2453a", borderRadius: "2px", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                    <AlertCircle size={16} style={{ color: "#c2453a", flexShrink: 0, marginTop: "0.1rem" }} />
                    <div style={{ fontSize: "0.85rem", color: "#7a2620", lineHeight: 1.45 }}>
                      <strong>That ZIP isn't in {userStateName}.</strong> Please double-check it, or go back and update your state.
                    </div>
                  </div>
                )}

                {/* County detected — happy path */}
                {isValidLength && !isMismatch && detectedCounty && (
                  <div style={{ marginTop: "0.75rem", padding: "0.6rem 0.85rem", background: C.accentSoft, border: `1px solid ${C.accent}`, borderRadius: "2px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Check size={14} style={{ color: C.accent, flexShrink: 0 }} />
                    <span style={{ fontSize: "0.88rem", color: C.ink }}>
                      Detected: <strong>{detectedCounty.county} County</strong>
                    </span>
                  </div>
                )}

                {/* Valid ZIP, seeded state, no county match — partial coverage */}
                {isValidLength && !isMismatch && !detectedCounty && stateIsSeeded && (
                  <p style={{ marginTop: "0.65rem", fontSize: "0.82rem", color: C.faint, lineHeight: 1.5 }}>
                    Your ZIP is valid for {userStateName}, but we haven't yet mapped county-level senior tax data for your specific area. Your state-level results will still apply.
                  </p>
                )}

                {/* Valid ZIP, unseeded state — federal-only mode */}
                {isValidLength && !isMismatch && !stateIsSeeded && userState && (
                  <p style={{ marginTop: "0.65rem", fontSize: "0.82rem", color: C.faint, lineHeight: 1.5 }}>
                    State-specific data for {userStateName} is coming soon. Federal programs in your results will still apply nationwide.
                  </p>
                )}
              </div>
            );
          })()}

          {currentQ.type === "choice" && (() => {
            // Three states for each option:
            //   isSelected — user has previously answered this question with this value
            //   isSuggested — only on the priority question with no answer yet (coral accent)
            //   neither — render as fresh/unselected
            const isPriorityQ = currentQ.id === "priority";
            const userAnswer = answers[currentQ.id];
            const suggested = isPriorityQ && !userAnswer ? suggestPriority(answers) : null;
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "2rem" }}>
                {currentQ.options.map(opt => {
                  const isSelected = userAnswer === opt.value;
                  const isSuggested = suggested === opt.value;
                  return (
                    <button
                      key={opt.value}
                      className="choice-btn"
                      onClick={() => { setAnswer(opt.value); setTimeout(next, 600); }}
                      style={{
                        background: isSelected ? C.ink : C.paper,
                        color: isSelected ? C.bg : C.ink,
                        border: `1px solid ${isSelected ? C.ink : isSuggested ? C.accent : C.line}`,
                        borderLeft: isSuggested && !isSelected ? `4px solid ${C.accent}` : `1px solid ${isSelected ? C.ink : C.line}`,
                        padding: isSuggested && !isSelected ? "1.1rem 1.25rem 1.1rem 1.05rem" : "1.1rem 1.25rem",
                        fontSize: "1.05rem",
                        fontFamily: "inherit",
                        textAlign: "left",
                        cursor: "pointer",
                        borderRadius: "2px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "1rem",
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.2rem", minWidth: 0 }}>
                        <span>{opt.label}</span>
                        {isSuggested && !isSelected && (
                          <span style={{ fontSize: "0.7rem", color: C.accent, fontFamily: "'Newsreader', serif", fontStyle: "italic", letterSpacing: "0.05em", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                            <Sparkles size={10} /> Suggested based on your answers
                          </span>
                        )}
                      </span>
                      <ChevronRight size={18} className="choice-arrow" style={{ transition: "transform 0.2s", opacity: isSelected ? 0.85 : 0.5, flexShrink: 0, color: isSelected ? C.bg : isSuggested ? C.accent : C.muted }} />
                    </button>
                  );
                })}
              </div>
            );
          })()}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
            <button onClick={back} className="secondary-btn" style={{ background: "none", border: "none", cursor: "pointer", color: C.faint, fontSize: "0.95rem", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <ChevronLeft size={16} /> {step === 0 ? "Back to home" : "Back"}
            </button>
            {currentQ.type !== "choice" && (
              <PrimaryButton onClick={next} disabled={!canAdvance()}>Continue</PrimaryButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Results({ answers, onRestart, onBookConsultation, onViewGuides }) {
  const result = useMemo(() => evaluate(answers), [answers]);
  return (
    <div style={{ minHeight: "100vh", padding: "2rem 1.5rem" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem", paddingBottom: "1rem", borderBottom: `1px solid ${C.line}` }}>
          <Wordmark />
          <button onClick={onRestart} className="secondary-btn" style={{ background: "none", border: "none", cursor: "pointer", color: C.faint, fontSize: "0.85rem", fontFamily: "inherit" }}>Start over</button>
        </header>
        <div className="fade-up">
          {result.stateData && !result.stateData.seeded && (
            <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderLeft: `3px solid ${C.gold}`, padding: "0.85rem 1rem", borderRadius: "2px", marginBottom: "1.5rem", fontSize: "0.85rem", color: C.muted, lineHeight: 1.5 }}>
              <strong style={{ color: C.ink }}>{result.stateData.name}:</strong> federal programs below apply nationwide. Detailed {result.stateData.name}-specific programs are coming soon — for now, your state's <a href={result.stateData.shipUrl} target="_blank" rel="noopener noreferrer" style={{ color: C.accent, fontWeight: 500 }}>SHIP counselors</a> are the best resource for state-specific benefits.
            </div>
          )}
          <p className="fade-up stagger-1" style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: C.faint, fontSize: "0.9rem", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "1rem" }}>Your review results</p>

          {result.totalValue > 0 ? (
            <>
              <h1 className="fade-up stagger-2" style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(2.25rem, 5vw, 3.25rem)", lineHeight: 1.1, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: "1rem", color: C.ink }}>
                You may be eligible for<br/>
                <span style={{ fontStyle: "italic", color: C.accent }}>${result.totalValue.toLocaleString()}</span> in annual benefits.
              </h1>
              <p className="fade-up stagger-3" style={{ fontSize: "1.1rem", color: C.muted, marginBottom: "3rem", lineHeight: 1.5 }}>
                {result.countyData
                  ? <>Customized for <strong style={{ color: C.ink }}>{result.countyData.county} County, {result.stateData.name}</strong>. Ranked by potential value and ease of application.</>
                  : <>Based on your responses in {result.stateData.name}, here's where to focus — ranked by potential value and ease of application.</>
                }
              </p>
            </>
          ) : (
            <>
              <h1 className="fade-up stagger-2" style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(2.25rem, 5vw, 3.25rem)", lineHeight: 1.1, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: "1rem", color: C.ink }}>
                Your situation calls for{" "}
                <span style={{ fontStyle: "italic", color: C.accent }}>strategy</span>,<br/>not subsidies.
              </h1>
              <p className="fade-up stagger-3" style={{ fontSize: "1.1rem", color: C.muted, marginBottom: "3rem", lineHeight: 1.5 }}>
                Based on your responses, you're above the income and asset thresholds for the major federal benefits programs. The bigger opportunity for you is choosing the right Medicare path and avoiding costly mistakes — covered below.
              </p>
            </>
          )}

          <section style={{ marginBottom: "3.5rem" }}>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: "1.5rem", fontWeight: 600, marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: `1px solid ${C.line}`, color: C.ink }}>
              <span style={{ color: C.faint, fontSize: "0.85rem", display: "block", letterSpacing: "0.1em", marginBottom: "0.25rem", fontStyle: "italic", fontWeight: 400 }}>01.</span>
              {result.totalValue > 0 ? "Money on the table" : "Programs we checked"}
            </h2>
            {result.totalValue > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {result.findings.filter(f => f.tier <= 2).sort((a,b) => a.tier - b.tier).map((f, i) => (
                  <FindingCard key={i} f={f} defaultOpen={i === 0} />
                ))}
              </div>
            ) : (
              <div style={{ background: C.paper, border: `1px solid ${C.line}`, padding: "1.5rem", borderRadius: "2px" }}>
                <p style={{ color: C.muted, fontSize: "0.95rem", lineHeight: 1.55, marginBottom: "1rem" }}>
                  Your income and assets are above the major program thresholds. The bigger opportunity is in <strong style={{ color: C.ink }}>structural decisions</strong> — Medicare path, Medigap timing, IRMAA, long-term care — covered below.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.5rem", marginTop: "0.75rem" }}>
                  {[
                    { p: "Medicare Savings Programs (QMB / SLMB / QI)", reason: "Income above threshold" },
                    { p: "Extra Help (Low-Income Subsidy)", reason: "Income above threshold" },
                    { p: "SNAP for Seniors", reason: "Income above threshold" },
                    ...(result.stateData && result.stateData.programs ? result.stateData.programs.filter(prog => prog.tier <= 2).map(prog => ({ p: prog.name, reason: "Eligibility criteria not met" })) : []),
                    answers.veteran === "yes" ? null : { p: "VA Aid & Attendance", reason: "Not a veteran or surviving spouse" },
                  ].filter(Boolean).map((x, i, arr) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.line}` : "none", fontSize: "0.88rem", gap: "1rem" }}>
                      <span style={{ color: C.muted }}>{x.p}</span>
                      <span style={{ color: C.faint, fontSize: "0.8rem", fontStyle: "italic", textAlign: "right", flexShrink: 0 }}>{x.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section style={{ marginBottom: "3.5rem" }}>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: "1.5rem", fontWeight: 600, marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: `1px solid ${C.line}`, color: C.ink }}>
              <span style={{ color: C.faint, fontSize: "0.85rem", display: "block", letterSpacing: "0.1em", marginBottom: "0.25rem", fontStyle: "italic", fontWeight: 400 }}>02.</span>
              Your Medicare path
            </h2>
            <MedicarePathBlock path={result.path} />
          </section>

          <section style={{ marginBottom: "3.5rem" }}>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: "1.5rem", fontWeight: 600, marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: `1px solid ${C.line}`, color: C.ink }}>
              <span style={{ color: C.faint, fontSize: "0.85rem", display: "block", letterSpacing: "0.1em", marginBottom: "0.25rem", fontStyle: "italic", fontWeight: 400 }}>03.</span>
              Watch-outs
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {result.watchouts.map((w, i) => (
                <WatchoutCard key={i} w={w} defaultOpen={w.level === "high"} />
              ))}
            </div>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: "1.5rem", fontWeight: 600, marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: `1px solid ${C.line}`, color: C.ink }}>
              <span style={{ color: C.faint, fontSize: "0.85rem", display: "block", letterSpacing: "0.1em", marginBottom: "0.25rem", fontStyle: "italic", fontWeight: 400 }}>04.</span>
              Get help applying
            </h2>
            <p style={{ color: C.muted, fontSize: "0.95rem", lineHeight: 1.55, marginBottom: "1.5rem" }}>
              Knowing what you qualify for is half the battle. Two ways to get the rest of the way:
            </p>

            {/* Guide Store — primary option */}
            <div style={{ background: C.paper, border: `2px solid ${C.accent}`, borderRadius: "2px", padding: "1.75rem", marginBottom: "1rem", position: "relative" }}>
              <div style={{ position: "absolute", top: "-0.7rem", left: "1.25rem", background: C.accent, color: "#fff", padding: "0.2rem 0.7rem", borderRadius: "2px", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Most popular
              </div>
              <SectionLabel>Step-by-step printable guides</SectionLabel>
              <h3 style={{ fontFamily: "'Newsreader', serif", fontSize: "1.4rem", fontWeight: 500, lineHeight: 1.2, marginBottom: "0.85rem", letterSpacing: "-0.01em", color: C.ink }}>
                Apply yourself with a guide that <span style={{ fontStyle: "italic", color: C.accent }}>tells you exactly what to click.</span>
              </h3>
              <p style={{ color: C.muted, marginBottom: "1.25rem", lineHeight: 1.55, fontSize: "0.95rem" }}>
                Print-ready PDFs that walk you through each application — every screen, every form field, every confirmation page. Designed for kitchen-table use, not for screens.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.5rem", marginBottom: "1.5rem" }}>
                {[
                  { icon: <FileText size={14} />, t: "Annotated screenshots — red circles show every click" },
                  { icon: <FileText size={14} />, t: "Large 14pt type, high contrast, printer-friendly" },
                  { icon: <FileText size={14} />, t: "Lists of what to have ready before you start" },
                  { icon: <FileText size={14} />, t: "Updated annually when forms and thresholds change" },
                ].map((x, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.55rem", alignItems: "center", fontSize: "0.88rem", color: C.muted }}>
                    <span style={{ color: C.accent, flexShrink: 0 }}>{x.icon}</span>
                    <span>{x.t}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.85rem", paddingTop: "1.25rem", borderTop: `1px solid ${C.line}` }}>
                <div>
                  <div style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: C.ink, fontSize: "1rem", fontWeight: 600 }}>From $19</div>
                  <div style={{ fontSize: "0.78rem", color: C.faint, marginTop: "0.15rem" }}>Single guide · Bundles available</div>
                </div>
                <PrimaryButton onClick={onViewGuides}>Browse guides</PrimaryButton>
              </div>
            </div>

            {/* Consultation — premium option */}
            <div style={{ background: C.paper, border: `1px solid ${C.line}`, padding: "1.75rem", borderRadius: "2px" }}>
              <SectionLabel>Want a human to walk through it with you?</SectionLabel>
              <h3 style={{ fontFamily: "'Newsreader', serif", fontSize: "1.3rem", fontWeight: 500, lineHeight: 1.2, marginBottom: "0.85rem", letterSpacing: "-0.01em", color: C.ink }}>
                Book a 45-minute review with an independent advisor.
              </h3>
              <p style={{ color: C.muted, marginBottom: "1.25rem", lineHeight: 1.5, fontSize: "0.92rem" }}>
                Fee-only. No commissions, no insurance pitches. We'll file the applications with you on the call and pick your Medicare plan together.
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.85rem", paddingTop: "1.25rem", borderTop: `1px solid ${C.line}` }}>
                <div>
                  <div style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: C.ink, fontSize: "1rem", fontWeight: 600 }}>$295</div>
                  <div style={{ fontSize: "0.78rem", color: C.faint, marginTop: "0.15rem" }}>One flat fee · 45-minute video call</div>
                </div>
                <PrimaryButton onClick={onBookConsultation}>Schedule consultation</PrimaryButton>
              </div>
            </div>
          </section>

          <footer style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: `1px solid ${C.line}`, fontSize: "0.8rem", color: C.faint, lineHeight: 1.6 }}>
            <p style={{ margin: 0 }}>
              <strong>Disclaimer:</strong> This review provides preliminary eligibility estimates only and is not a guarantee of benefits. Income and asset thresholds change annually. Confirm details with the listed agencies before making decisions. Not affiliated with or endorsed by Medicare or any government agency.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

// ── Programs Explained accordion (landing page) ─────────────────────────
const PROGRAM_EXPLANATIONS = [
  {
    name: "Medicare Savings Programs",
    short: "QMB, SLMB, and QI — three state-run programs",
    long: "These three programs (Qualified Medicare Beneficiary, Specified Low-Income Medicare Beneficiary, and Qualifying Individual) help with Medicare premiums and out-of-pocket costs. QMB is the most generous — it pays your Part A and Part B premiums plus deductibles and the 20% coinsurance Medicare doesn't cover. SLMB and QI pay just your Part B premium. All three put money back in your Social Security check each month.",
    value: "Up to $2,200/year",
  },
  {
    name: "Extra Help (Low-Income Subsidy)",
    short: "Federal program that nearly eliminates prescription drug costs",
    long: "Extra Help is a federal program that pays most of what you'd otherwise spend on Medicare Part D — your monthly premium, your deductible, and your prescription copays. Generic drugs typically cost $0 to $4.50 per fill instead of full price. As of 2024, anyone who qualifies receives the full subsidy (no more partial benefits).",
    value: "About $5,900/year",
  },
  {
    name: "State Pharmaceutical Assistance Programs",
    short: "State subsidies that lower Part D drug costs",
    long: "Many states run their own programs that supplement Medicare Part D — paying part of your premium, copays, or coverage-gap costs. Examples include Maryland's SPDAP, New York's EPIC, Pennsylvania's PACE/PACENET, and New Jersey's PAAD. Eligibility and benefits vary by state but most are income-based with no asset test. We'll show you what's available where you live.",
    value: "Up to $5,000/year (varies by state)",
  },
  {
    name: "Original Medicare vs. Medicare Advantage",
    short: "Two very different ways to get Medicare coverage",
    long: "Original Medicare (Parts A and B) is the federal program that lets you see any doctor or hospital that accepts Medicare. You typically add a Medigap policy to cover the gaps and a Part D plan for prescriptions. Medicare Advantage (Part C) is a private insurance plan that bundles A, B, and usually D into one — often with $0 premiums and extras like dental — but with a network of doctors and prior-authorization requirements. Once you're on Medicare Advantage past your initial enrollment window, switching back to Original Medicare with a Medigap policy can be difficult or expensive.",
    value: "Affects every Medicare decision",
  },
  {
    name: "State Senior Property Tax Relief",
    short: "Income-based caps, freezes, or exemptions for senior homeowners",
    long: "Most states offer property tax relief for homeowners 65 and older — typically as an income-based credit, an assessed-value exemption, or (in Texas and a few others) a tax freeze that locks your bill at the level it was when you turned 65. Income limits and benefit amounts vary widely by state. Many counties layer additional senior supplements on top. Once approved, the credit applies automatically each year.",
    value: "$500 – $2,000/year (varies by state)",
  },
  {
    name: "VA Aid & Attendance Pension",
    short: "Tax-free monthly pension for wartime veterans and surviving spouses",
    long: "Aid & Attendance is a benefit on top of the basic VA pension for wartime veterans (or their surviving spouses) who need help with everyday activities like bathing, dressing, eating, or managing medications. It's tax-free and paid monthly. It can be used at home, in assisted living, or in a nursing home. Surviving spouses are eligible — many don't realize this and never apply.",
    value: "Up to $32,000/year for couples",
  },
  {
    name: "SNAP for Seniors",
    short: "Monthly food benefits — many states skip the asset test for older adults",
    long: "SNAP (Supplemental Nutrition Assistance Program, formerly food stamps) provides a monthly benefit loaded onto an EBT card you can use at most grocery stores. For households with someone 60 or older, many states waive the savings-and-investments test — eligibility is based on income only. The average senior benefit is around $200–$250 per month.",
    value: "Up to $3,000/year",
  },
  {
    name: "IRMAA (Income-Related Monthly Adjustment Amount)",
    short: "A surcharge on Part B and D premiums for higher-income retirees",
    long: "If your income exceeds certain thresholds (roughly $103,000 single, $206,000 married in 2026), Medicare adds a surcharge to your Part B and Part D premiums. Medicare looks at your tax return from two years ago, so a recent retirement, divorce, or spouse's death can push you over the line based on stale income. You can appeal IRMAA after a life-changing event using SSA Form SSA-44 — most people don't know this.",
    value: "Avoid up to $4,000/year in surcharges",
  },
];

// ── Program flip cards (landing page "What we cover") ───────────────────
const PROGRAM_FLIP_DATA = [
  { name: "Medicare Savings (QMB / SLMB / QI)", brief: "State-run programs that pay your Medicare premiums and gaps. The most valuable benefit most seniors don't know about." },
  { name: "Extra Help (Low-Income Subsidy)", brief: "Federal program that nearly eliminates Part D drug costs. Generic drugs typically $0–$4 per fill." },
  { name: "State Pharmaceutical Assistance", brief: "State-specific Part D supplements (NY EPIC, PA PACE, MD SPDAP, NJ PAAD). Worth up to $5,000/year depending on state." },
  { name: "Medigap plan guidance", brief: "Same coverage by federal law, but premiums vary 30–50% between carriers in the same ZIP code." },
  { name: "Medicare Advantage analysis", brief: "$0 premium plans with networks and prior authorization. We help you weigh the tradeoff." },
  { name: "Part D plan strategy", brief: "Picking by total annual drug cost — not premium. Right plan saves $300–800/year." },
  { name: "State Property Tax Relief", brief: "Income-based caps, freezes, or exemptions for senior homeowners. Texas freezes school tax forever at age 65." },
  { name: "County Senior Supplements", brief: "Many counties layer extra senior tax credits on top of state programs. Fairfax VA goes up to $4,000/year." },
  { name: "SNAP for seniors", brief: "Monthly food benefits on an EBT card. Many states waive the asset test for seniors 60+." },
  { name: "VA Aid & Attendance", brief: "Tax-free monthly pension for wartime veterans and surviving spouses needing daily-living help. Up to $32,000/year for couples." },
  { name: "Medicaid LTSS", brief: "Long-term care that Medicare doesn't cover. The 5-year asset look-back means planning years ahead matters." },
  { name: "PACE eligibility", brief: "Bundles all medical and long-term care for nursing-home-eligible seniors who want to stay home. Few people know about it." },
  { name: "Senior Assisted Living", brief: "State subsidies that help with assisted-living costs for moderate-income seniors. Underused and varies by state." },
  { name: "Energy Assistance (LIHEAP)", brief: "Federal-state program that pays heating and cooling bills. Income limits often higher than people realize." },
  { name: "Senior Call Check programs", brief: "Free daily check-in calls from your state Department of Aging. Peace of mind, no cost." },
  { name: "IRMAA appeals", brief: "Higher-income retirees pay a Medicare surcharge based on a 2-year-old tax return. Recent retirement or spouse's death? Appeal it." },
];

function ProgramFlipCards() {
  const [flipped, setFlipped] = useState(new Set());
  const toggle = (i) => {
    setFlipped(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  return (
    <div>
      <p style={{ fontSize: "0.82rem", color: C.faint, fontStyle: "italic", marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
        <Sparkles size={11} /> Tap any program to flip it and learn what it actually does
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.5rem" }}>
        {PROGRAM_FLIP_DATA.map((p, i) => {
          const isFlipped = flipped.has(i);
          return (
            <div
              key={i}
              onClick={() => toggle(i)}
              style={{
                position: "relative",
                minHeight: "110px",
                cursor: "pointer",
                perspective: "1000px",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  minHeight: "110px",
                  transformStyle: "preserve-3d",
                  transition: "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* Front face */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: C.paper,
                    border: `1px solid ${C.line}`,
                    padding: "0.75rem 0.95rem",
                    borderRadius: "2px",
                    fontSize: "0.85rem",
                    color: C.muted,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  <Check size={13} style={{ color: C.accent, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{p.name}</span>
                  <ChevronRight size={11} style={{ color: C.faint, opacity: 0.6, flexShrink: 0 }} />
                </div>
                {/* Back face */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: C.ink,
                    border: `1px solid ${C.ink}`,
                    padding: "0.7rem 0.85rem",
                    paddingRight: "1.85rem",
                    borderRadius: "2px",
                    fontSize: "0.78rem",
                    color: C.bg,
                    lineHeight: 1.4,
                    display: "flex",
                    alignItems: "center",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <span>{p.brief}</span>
                  <RotateCcw size={11} style={{ position: "absolute", top: "0.6rem", right: "0.6rem", color: C.line, opacity: 0.7 }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


function ProgramsExplained() {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <section style={{ padding: "5rem 1.5rem", background: C.bg, borderBottom: `1px solid ${C.line}` }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <SectionLabel>Programs explained</SectionLabel>
          <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(1.85rem, 4vw, 2.6rem)", lineHeight: 1.15, fontWeight: 500, letterSpacing: "-0.02em", maxWidth: "640px", margin: "0 auto 1rem", color: C.ink }}>
            What you might be missing,<br/><span style={{ fontStyle: "italic", color: C.accent }}>in plain English.</span>
          </h2>
          <p style={{ color: C.muted, fontSize: "1.05rem", lineHeight: 1.55, maxWidth: "560px", margin: "0 auto" }}>
            Tap any program to learn what it actually is, who qualifies, and what it's worth. No jargon.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {PROGRAM_EXPLANATIONS.map((p, i) => {
            const open = openIdx === i;
            return (
              <div key={i} style={{ background: C.paper, border: `1px solid ${open ? C.accent : C.line}`, borderRadius: "2px", overflow: "hidden", transition: "border-color 0.2s" }}>
                <button onClick={() => setOpenIdx(open ? null : i)} style={{ width: "100%", background: "none", border: "none", padding: "1.25rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontFamily: "'Newsreader', serif", fontSize: "1.15rem", fontWeight: 600, color: C.ink, margin: "0 0 0.2rem 0", lineHeight: 1.3 }}>{p.name}</h3>
                    <p style={{ fontSize: "0.88rem", color: C.muted, margin: 0, lineHeight: 1.4 }}>{p.short}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
                    <span className="program-value" style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: C.accent, fontSize: "0.9rem", fontWeight: 500, whiteSpace: "nowrap", display: "none" }}>{p.value}</span>
                    <div style={{ width: "28px", height: "28px", borderRadius: "100%", border: `1px solid ${open ? C.accent : C.line}`, display: "flex", alignItems: "center", justifyContent: "center", color: open ? C.accent : C.muted, transition: "all 0.2s" }}>
                      {open ? <Minus size={14} /> : <Plus size={14} />}
                    </div>
                  </div>
                </button>
                {open && (
                  <div style={{ padding: "0 1.5rem 1.5rem", borderTop: `1px solid ${C.line}` }}>
                    <div style={{ paddingTop: "1.25rem" }}>
                      <p style={{ color: C.muted, fontSize: "0.95rem", lineHeight: 1.65, margin: "0 0 1rem 0" }}>{p.long}</p>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.85rem", background: C.accentSoft, borderRadius: "2px" }}>
                        <Sparkles size={14} style={{ color: C.accent }} />
                        <span style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: C.ink, fontSize: "0.88rem", fontWeight: 500 }}>Potential value: {p.value}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <style>{`
          @media (min-width: 700px) { .program-value { display: inline !important; } }
        `}</style>
      </div>
    </section>
  );
}

// ── Consultation booking flow ───────────────────────────────────────────
const TIME_SLOTS = [
  { day: "Tomorrow", date: "Tuesday, Apr 28", times: ["10:00 AM", "1:30 PM", "3:00 PM"] },
  { day: "Wednesday", date: "Apr 29", times: ["9:30 AM", "11:00 AM", "2:00 PM"] },
  { day: "Thursday", date: "Apr 30", times: ["10:00 AM", "1:00 PM", "4:30 PM"] },
  { day: "Friday", date: "May 1", times: ["9:00 AM", "11:30 AM", "2:30 PM"] },
];

const inputStyle = {
  width: "100%",
  padding: "0.85rem 1rem",
  fontSize: "1rem",
  fontFamily: "inherit",
  border: `1px solid ${C.line}`,
  borderRadius: "2px",
  background: C.paper,
  outline: "none",
  color: C.ink,
  boxSizing: "border-box",
};

function Field({ label, icon, children }) {
  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", color: C.muted, marginBottom: "0.4rem", fontWeight: 500 }}>
        {icon && <span style={{ color: C.faint }}>{icon}</span>}
        {label}
      </label>
      {children}
    </div>
  );
}

function Consultation({ onBack, onRestart }) {
  const [stage, setStage] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [contact, setContact] = useState({ name: "", email: "", phone: "", topics: [], notes: "" });

  const toggleTopic = (t) => {
    setContact(c => ({ ...c, topics: c.topics.includes(t) ? c.topics.filter(x => x !== t) : [...c.topics, t] }));
  };

  const canSubmit = contact.name.trim() && contact.email.trim() && contact.phone.trim();

  return (
    <div style={{ minHeight: "100vh", padding: "2rem 1.5rem" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", paddingBottom: "1rem", borderBottom: `1px solid ${C.line}` }}>
          <Wordmark />
          {stage < 2 && (
            <button onClick={onBack} className="secondary-btn" style={{ background: "none", border: "none", cursor: "pointer", color: C.faint, fontSize: "0.85rem", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <ChevronLeft size={16} /> Back to results
            </button>
          )}
        </header>

        {stage < 2 && (
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2.5rem" }}>
            {[0, 1].map(i => (
              <div key={i} style={{ flex: 1, height: "2px", background: i <= stage ? C.accent : C.line, borderRadius: "2px", transition: "background 0.3s" }} />
            ))}
          </div>
        )}

        {/* STAGE 0: TIME SELECTION */}
        {stage === 0 && (
          <div className="fade-up">
            <SectionLabel>Step 1 of 2 · Pick a time</SectionLabel>
            <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(2rem, 4.5vw, 2.75rem)", lineHeight: 1.1, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: "0.75rem", color: C.ink }}>
              When works for you?
            </h1>
            <p style={{ fontSize: "1.05rem", color: C.muted, lineHeight: 1.55, marginBottom: "2rem" }}>
              45-minute video call with a licensed advisor in your state. We'll review your results, answer your questions, and help you file applications. <strong style={{ color: C.ink }}>No insurance pitch — ever.</strong>
            </p>

            <div style={{ background: C.paper, border: `1px solid ${C.line}`, padding: "1.5rem", borderRadius: "2px", marginBottom: "2.5rem" }}>
              <p style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: C.faint, fontSize: "0.78rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>What's included</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {[
                  "Personalized walkthrough of your Cairn results",
                  "Help filing the highest-value applications (we'll do them with you on the call)",
                  "Specific Medicare plan recommendations for your zip code and medications",
                  "Written summary emailed within 24 hours",
                  "One free 15-minute follow-up within 60 days",
                ].map((x, i) => (
                  <li key={i} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", fontSize: "0.92rem", color: C.muted, lineHeight: 1.5 }}>
                    <Check size={16} style={{ color: C.accent, flexShrink: 0, marginTop: "0.2rem" }} />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.88rem", color: C.faint }}>Flat fee · No commissions · No markups</span>
                <span style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: C.accent, fontSize: "1.4rem", fontWeight: 500 }}>$295</span>
              </div>
            </div>

            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem", color: C.ink }}>
              Available this week
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "2rem" }}>
              {TIME_SLOTS.map((day, di) => (
                <div key={di}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem", marginBottom: "0.6rem" }}>
                    <span style={{ fontFamily: "'Newsreader', serif", fontSize: "1.05rem", fontWeight: 600, color: C.ink }}>{day.day}</span>
                    <span style={{ fontSize: "0.82rem", color: C.faint }}>{day.date}</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {day.times.map(time => {
                      const slotKey = `${day.date} · ${time}`;
                      const selected = selectedSlot === slotKey;
                      return (
                        <button key={time} onClick={() => setSelectedSlot(slotKey)} style={{
                          background: selected ? C.ink : C.paper,
                          color: selected ? C.bg : C.ink,
                          border: `1px solid ${selected ? C.ink : C.line}`,
                          padding: "0.7rem 1.1rem", fontSize: "0.95rem", fontFamily: "inherit",
                          cursor: "pointer", borderRadius: "2px", transition: "all 0.15s",
                          minWidth: "100px",
                        }}>
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <PrimaryButton onClick={() => setStage(1)} disabled={!selectedSlot} large>Continue</PrimaryButton>
            </div>
          </div>
        )}

        {/* STAGE 1: CONTACT INFO */}
        {stage === 1 && (
          <div className="fade-up">
            <SectionLabel>Step 2 of 2 · Your details</SectionLabel>
            <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(2rem, 4.5vw, 2.75rem)", lineHeight: 1.1, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: "0.75rem", color: C.ink }}>
              Just a few details.
            </h1>
            <p style={{ fontSize: "1.05rem", color: C.muted, lineHeight: 1.55, marginBottom: "2rem" }}>
              We'll send your video-call link and a calendar invite to your email.
            </p>

            <div style={{ background: C.paper, border: `1px solid ${C.line}`, padding: "1rem 1.25rem", borderRadius: "2px", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Calendar size={20} style={{ color: C.accent, flexShrink: 0 }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Newsreader', serif", fontSize: "1rem", fontWeight: 600, color: C.ink }}>{selectedSlot}</div>
                <div style={{ fontSize: "0.82rem", color: C.faint, marginTop: "0.1rem" }}>45 minutes · Video call</div>
              </div>
              <button onClick={() => setStage(0)} className="secondary-btn" style={{ background: "none", border: "none", cursor: "pointer", color: C.faint, fontSize: "0.85rem", fontFamily: "inherit", textDecoration: "underline" }}>Change</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "1.5rem" }}>
              <Field label="Your name" icon={<User size={16}/>}>
                <input type="text" autoFocus value={contact.name} onChange={e => setContact({ ...contact, name: e.target.value })} placeholder="First and last" style={inputStyle} />
              </Field>
              <Field label="Email" icon={<Mail size={16}/>}>
                <input type="email" value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} placeholder="you@example.com" style={inputStyle} />
              </Field>
              <Field label="Phone (in case the video call drops)" icon={<Phone size={16}/>}>
                <input type="tel" value={contact.phone} onChange={e => setContact({ ...contact, phone: e.target.value })} placeholder="(410) 555-0100" style={inputStyle} />
              </Field>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", color: C.muted, marginBottom: "0.5rem", fontWeight: 500 }}>What would you like to focus on? (optional)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {["Medicare plan choice", "Filing benefits applications", "Long-term care planning", "Drug coverage", "IRMAA appeal", "Spouse's coverage"].map(t => {
                  const on = contact.topics.includes(t);
                  return (
                    <button key={t} onClick={() => toggleTopic(t)} style={{
                      background: on ? C.ink : C.paper, color: on ? C.bg : C.muted,
                      border: `1px solid ${on ? C.ink : C.line}`,
                      padding: "0.5rem 0.85rem", fontSize: "0.85rem", fontFamily: "inherit",
                      cursor: "pointer", borderRadius: "100px", transition: "all 0.15s",
                    }}>
                      {on && <Check size={12} style={{ display: "inline", marginRight: "0.3rem", verticalAlign: "middle" }}/>}
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label="Anything else we should know? (optional)">
              <textarea value={contact.notes} onChange={e => setContact({ ...contact, notes: e.target.value })} placeholder="e.g., 'I'm caring for my mother and want to plan ahead'" rows={3} style={{ ...inputStyle, fontFamily: "inherit", fontSize: "0.95rem", resize: "vertical" }} />
            </Field>

            <div style={{ background: C.bg, border: `1px solid ${C.line}`, padding: "1.25rem", borderRadius: "2px", margin: "1.75rem 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.95rem", color: C.muted }}>Consultation fee</span>
                <span style={{ fontSize: "0.95rem", color: C.ink, fontWeight: 500 }}>$295.00</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.5rem", borderTop: `1px solid ${C.line}` }}>
                <span style={{ fontSize: "1rem", color: C.ink, fontWeight: 600 }}>Total today</span>
                <span style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: C.accent, fontSize: "1.3rem", fontWeight: 500 }}>$295.00</span>
              </div>
              <p style={{ fontSize: "0.78rem", color: C.faint, lineHeight: 1.5, margin: "0.75rem 0 0" }}>
                Payment processed securely. Full refund if you cancel 24+ hours before the call.
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={() => setStage(0)} className="secondary-btn" style={{ background: "none", border: "none", cursor: "pointer", color: C.faint, fontSize: "0.95rem", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <ChevronLeft size={16} /> Back
              </button>
              <PrimaryButton onClick={() => setStage(2)} disabled={!canSubmit} large>Confirm & pay $295</PrimaryButton>
            </div>
          </div>
        )}

        {/* STAGE 2: CONFIRMATION */}
        {stage === 2 && (
          <div className="fade-up" style={{ textAlign: "center", paddingTop: "2rem" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "100%", background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
              <CheckCircle2 size={40} style={{ color: C.accent }} strokeWidth={1.5}/>
            </div>
            <SectionLabel>You're booked</SectionLabel>
            <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(2rem, 4.5vw, 2.75rem)", lineHeight: 1.1, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: "1.25rem", color: C.ink }}>
              See you{" "}
              <span style={{ fontStyle: "italic", color: C.accent }}>{selectedSlot?.split(" · ")[0]}</span>{" "}
              at{" "}
              <span style={{ fontStyle: "italic", color: C.accent }}>{selectedSlot?.split(" · ")[1]}</span>.
            </h1>
            <p style={{ fontSize: "1.1rem", color: C.muted, lineHeight: 1.55, marginBottom: "2.5rem", maxWidth: "520px", margin: "0 auto 2.5rem" }}>
              A confirmation email is on its way to <strong style={{ color: C.ink }}>{contact.email}</strong> with the video-call link, calendar invite, and a few things to have ready.
            </p>

            <div style={{ background: C.paper, border: `1px solid ${C.line}`, padding: "1.75rem", borderRadius: "2px", textAlign: "left", marginBottom: "2.5rem" }}>
              <p style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: C.faint, fontSize: "0.78rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>Before our call</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {[
                  { n: "1", t: "Have your Medicare card handy.", body: "We'll need your Medicare number to look up specific plan information." },
                  { n: "2", t: "List your current medications.", body: "Drug name, dose, and how often. This drives Part D plan recommendations." },
                  { n: "3", t: "Know your preferred doctors and hospitals.", body: "We'll verify which plans keep them in-network." },
                  { n: "4", t: "Most recent tax return (Form 1040).", body: "Helps us confirm income for benefits eligibility and IRMAA planning." },
                ].map((s, i) => (
                  <li key={i} style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                    <span style={{ flexShrink: 0, width: "26px", height: "26px", borderRadius: "100%", background: C.accentSoft, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Newsreader', serif", fontStyle: "italic", fontWeight: 500, fontSize: "0.85rem" }}>{s.n}</span>
                    <div>
                      <div style={{ fontFamily: "'Newsreader', serif", fontSize: "0.98rem", fontWeight: 600, color: C.ink, marginBottom: "0.2rem" }}>{s.t}</div>
                      <p style={{ fontSize: "0.88rem", color: C.muted, margin: 0, lineHeight: 1.5 }}>{s.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={onRestart} className="secondary-btn" style={{ background: "none", border: `1px solid ${C.line}`, cursor: "pointer", color: C.muted, fontSize: "0.95rem", fontFamily: "inherit", padding: "0.85rem 1.5rem", borderRadius: "2px" }}>
                Done
              </button>
              <PrimaryButton onClick={() => alert("Calendar invite sent!")}>Add to calendar</PrimaryButton>
            </div>

            <p style={{ fontSize: "0.85rem", color: C.faint, marginTop: "2.5rem", lineHeight: 1.5 }}>
              Need to reschedule? Reply to your confirmation email or call <strong style={{ color: C.muted }}>(410) 555-CAIRN</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Guide catalog ───────────────────────────────────────────────────────
// Each guide is a printable PDF walking through one specific application.
// Production version: PDFs are pre-built, watermarked per-purchase, and
// delivered via email + temporary download URL. Updated annually.

const GUIDE_CATALOG = [
  {
    id: "extra_help",
    name: "Extra Help (Low-Income Subsidy)",
    blurb: "How to apply for federal prescription drug help through Social Security.",
    pages: 8,
    timeToApply: "About 25 minutes",
    relatedTo: ["lis", "qmb", "slmb", "qi"],
    verified: "January 2026",
    sections: [
      "Before you start: documents you'll need",
      "Step 1 — Open ssa.gov/extrahelp (annotated screenshot)",
      "Step 2 — Identity verification (every field explained)",
      "Step 3 — Income and resources (what counts, what doesn't)",
      "Step 4 — Submit and save your confirmation number",
      "What happens next: timeline and what to expect by mail",
      "If denied: how to appeal and what evidence to gather",
      "Annual renewal: how to keep your benefit",
    ],
    steps: [
      {
        title: "Before you start: documents to gather",
        body: [
          "Allow 25 minutes. The application is one online form, but you'll be asked for specific dollar amounts that are easier to look up before you start.",
          "Have ready: most recent Social Security award letter, prior-year tax return (for AGI), most recent bank/brokerage statements, mortgage or rent statement, current Part D plan name and member ID.",
        ],
      },
      {
        title: "Step 1 — Open ssa.gov/extrahelp",
        body: [
          "From a desktop browser, go to ssa.gov/extrahelp and click 'Apply for Extra Help with Medicare Prescription Drug Plan Costs'.",
          "You can complete the form without a my Social Security account, but signing in with one auto-fills several fields.",
        ],
        fields: [
          { label: "Are you applying for yourself or someone else?", value: "Myself", note: "Pick 'Someone else' only if you have power of attorney or are a legal representative." },
          { label: "Are you currently enrolled in a Medicare Part D plan?", note: "Yes if you have prescription drug coverage. The form asks for your plan name next." },
        ],
      },
      {
        title: "Step 2 — Identity and household",
        body: [
          "Use the legal name on your Social Security card.",
        ],
        fields: [
          { label: "Full legal name, SSN, date of birth", value: "{{birthDate}}", note: "Must match SSA records exactly." },
          { label: "Marital status and household size", value: "{{maritalLabel}}", note: "Household = you + your spouse if you live together. Adult children don't count even if they live with you." },
          { label: "Address", note: "Where SSA will mail your decision letter." },
        ],
      },
      {
        title: "Step 3 — Income (the page where most mistakes happen)",
        body: [
          "Enter your *gross* monthly income — before taxes and Medicare premiums. Include Social Security, pensions, wages, IRA withdrawals, and rental income.",
          "Do NOT include: SSI, VA benefits, housing assistance, food stamps, or in-kind support from family. SSA explicitly excludes these.",
        ],
        fields: [
          { label: "Gross monthly Social Security", note: "From your most recent SSA-1099 or award letter, before the Medicare Part B deduction." },
          { label: "Gross monthly pensions / annuities", note: "Sum of all pensions before tax withholding." },
          { label: "Gross monthly wages", note: "If still working — gross pay, not take-home." },
          { label: "Other income (interest, dividends, rental)", note: "Monthly average. Use last year's totals divided by 12." },
        ],
      },
      {
        title: "Step 4 — Resources (what counts, what doesn't)",
        body: [
          "Resources = liquid assets. The 2026 limit is $17,600 for an individual or $35,130 for a couple.",
          "Do NOT count: your primary home, one car, household goods, burial plot, life insurance with face value under $1,500.",
          "DO count: checking, savings, CDs, brokerage accounts, IRAs, 401(k)s (yes — IRAs count for Extra Help even though they don't for some other programs).",
        ],
        fields: [
          { label: "Total in checking/savings", note: "Combined balance across all accounts." },
          { label: "Stocks, bonds, mutual funds", note: "Current market value, not what you paid." },
          { label: "Retirement accounts", note: "IRAs and 401(k)s count even if untouched." },
          { label: "Real estate other than your home", note: "Rental properties, vacant land — current market value." },
        ],
      },
      {
        title: "Step 5 — Submit and save confirmation",
        body: [
          "After review, type your name as electronic signature. SSA shows a confirmation number on screen and emails one within 24 hours.",
          "Decision timeline: 1–3 weeks for online applications.",
          "If approved, the subsidy is automatic — your Part D plan applies it; no further action needed.",
        ],
      },
    ],
    sample: "p. 4 — Resource verification screen, annotated with arrows showing which fields exclude your home and one car.",
  },
  {
    id: "msp",
    name: "Medicare Savings Programs (QMB/SLMB/QI)",
    blurb: "Apply for state-administered Medicaid programs that pay your Part B premium.",
    pages: 10,
    timeToApply: "About 30 minutes (varies by state)",
    relatedTo: ["qmb", "slmb", "qi"],
    verified: "January 2026",
    sections: [
      "Choosing the right program: QMB vs. SLMB vs. QI side-by-side",
      "Before you start: state-specific income and asset documentation",
      "Step 1 — Find your state's Medicaid agency portal",
      "Step 2 — Application form, every field with example values",
      "Step 3 — Document upload requirements and acceptable formats",
      "Step 4 — Phone confirmation and what to expect",
      "Approval timeline: 30–45 day standard, what to do if delayed",
      "How your Social Security check changes after approval",
      "Annual recertification reminders",
    ],
    steps: [
      {
        title: "Which program fits your income (2026 limits)",
        body: [
          "QMB pays your Part B premium AND your Medicare deductibles and 20% coinsurance. Income limit (single): $1,325/mo.",
          "SLMB pays only your Part B premium. Income limit (single): $1,585/mo.",
          "QI also pays only Part B premium, but is funded annually and works first-come, first-served. Income limit (single): $1,781/mo.",
          "Asset limit (all three): $9,660 single / $14,470 couple — does not count your home, one car, or burial funds up to $1,500.",
          "Application form is the same for all three — your state agency picks the program based on your numbers.",
        ],
      },
      {
        title: "Before you start: documents to gather",
        body: [
          "Most state Medicaid portals require documents to be uploaded as PDFs or photos. Have ready:",
          "Last 3 months of pay stubs or Social Security award letter, last 3 months of every bank/brokerage statement, mortgage or rent statement, photo ID, Medicare card, current Part D card.",
        ],
      },
      {
        title: "Step 1 — Find {{stateName}}'s Medicaid agency portal",
        body: [
          "Each state has its own portal. {{stateMspGuidance}}",
          "Some states require you to first create an account; others let you start the application without one. Either way, set the account up — it's where you'll upload documents and check status.",
        ],
        fields: [
          { label: "Application portal", value: "{{mspApplyUrl}}" },
        ],
      },
      {
        title: "Step 2 — Personal and Medicare information",
        body: [
          "Most state forms reuse the same blocks of fields, in roughly this order.",
        ],
        fields: [
          { label: "Full legal name, SSN, date of birth", value: "{{birthDate}}", note: "Must match Social Security records." },
          { label: "Medicare claim number (HICN/MBI)", note: "From the front of your red-white-blue Medicare card." },
          { label: "Medicare effective date", note: "Also on your Medicare card — the date Part A or Part B started." },
          { label: "Address (must be in {{stateName}})", note: "Most MSP programs require state residency." },
          { label: "Marital status and spouse details", value: "{{maritalLabel}}", note: "If married, your spouse's income and assets are counted with yours unless you live separately." },
        ],
      },
      {
        title: "Step 3 — Income and resources",
        body: [
          "States verify income against payroll and SSA databases — round numbers raise flags. Use exact gross amounts from your most recent statements.",
        ],
        fields: [
          { label: "Gross monthly income (all sources)", note: "Same definition as Extra Help: gross before taxes and Medicare deductions." },
          { label: "Total liquid assets", note: "Checking + savings + brokerage + CDs + IRAs and 401(k)s. Do not include your home or one car." },
          { label: "Burial fund / life insurance face value", note: "Excluded up to $1,500 each." },
        ],
      },
      {
        title: "Step 4 — Document upload",
        body: [
          "Upload counts as 'received' once the portal confirms successful upload — keep that confirmation page or email.",
          "Acceptable formats: PDF, JPG, PNG. Photos taken with a phone work as long as the entire page is in frame and text is readable.",
          "Common rejection reason: bank statements that don't show all pages. Always upload the complete statement, even pages with no transactions.",
        ],
      },
      {
        title: "Step 5 — Submit and follow up",
        body: [
          "After submission you'll get a case number. Save it.",
          "Standard processing: 30–45 days. {{stateName}} should send a written decision; if you don't hear back in 45 days, call the state agency with your case number.",
          "If approved, your Part B premium stops being deducted from your Social Security check the month after approval — you'll see the increase on your next deposit.",
        ],
      },
      {
        title: "After approval: what changes",
        body: [
          "QMB: Medicare providers cannot bill you for Medicare deductibles or coinsurance — by federal law. If you get a bill, call the provider and remind them of your QMB status.",
          "QMB and SLMB also auto-qualify you for full Extra Help (the Part D subsidy). You don't need to apply separately.",
          "Annual recertification: most states require yearly re-verification. {{stateName}} will mail you a renewal packet ~60 days before your recert date.",
        ],
      },
    ],
    sample: "p. 6 — Maryland Medicaid online application, with our example showing the QMB income field filled in correctly.",
  },
  {
    id: "spdap",
    name: "Maryland SPDAP (Senior Prescription Drug Assistance)",
    blurb: "The Maryland-specific subsidy that pays up to $75/month toward your Part D plan.",
    pages: 6,
    timeToApply: "About 15 minutes",
    relatedTo: ["spdap"],
    stateSpecific: "MD",
    verified: "January 2026",
    sections: [
      "Eligibility quickcheck before you apply",
      "Step 1 — marylandspdap.com walkthrough",
      "Step 2 — Filling the printable PDF application",
      "Step 3 — Mailing vs. faxing your application",
      "What confirmation looks like and when to expect it",
      "How SPDAP coordinates with your Part D plan automatically",
    ],
    steps: [
      {
        title: "Eligibility quickcheck",
        body: [
          "SPDAP pays up to $75/month directly to your Part D insurer, lowering or zeroing out your monthly premium.",
          "Four requirements: (1) Maryland resident for at least 6 months, (2) enrolled in a Medicare Part D plan, (3) annual income under 300% of the Federal Poverty Level (~$45,180 single / $61,320 couple in 2026), (4) not enrolled in full Medicaid.",
          "There is NO asset test. SPDAP cares only about income, residency, and Part D enrollment.",
          "If you're already on Extra Help (LIS), SPDAP is still worth applying for — it can layer on top to reduce any remaining premium.",
        ],
      },
      {
        title: "Documents to gather",
        body: [
          "Allow 15 minutes. The application is short but you'll be asked for specific dollar amounts.",
          "Have ready: Maryland driver's license or state ID, Medicare card, current Part D plan card (member ID and monthly premium), most recent SSA-1099 or pension statement, prior-year federal tax return (if filed).",
          "If you have no Maryland-issued ID, a recent utility bill in your name with a Maryland address works as residency proof.",
        ],
      },
      {
        title: "Step 1 — Choose how to apply: online or paper",
        body: [
          "Online: marylandspdap.com → 'Apply Now'. Faster (1–2 weeks for decision) and lets you upload documents directly.",
          "Paper: download the application PDF from marylandspdap.com or call 1-800-551-5995 to have one mailed. Takes 3–4 weeks total.",
          "Phone: 1-800-551-5995, Monday–Friday 9am–5pm. The call center can complete the application with you over the phone.",
          "If you have all your documents in PDF form, online is fastest. If you prefer paper or don't have email, the paper or phone path is straightforward.",
        ],
      },
      {
        title: "Step 2 — Personal information",
        body: [
          "First section of the application. Use the legal name on your Medicare card.",
        ],
        fields: [
          { label: "Full legal name", note: "Must match Medicare records." },
          { label: "Date of birth", value: "{{birthDate}}" },
          { label: "Social Security number", note: "Nine digits, no dashes. SPDAP uses this to verify Part D enrollment with CMS." },
          { label: "Medicare number (MBI)", note: "From the front of your red-white-blue Medicare card. 11 characters, alphanumeric." },
          { label: "Maryland address", note: "Street address — no P.O. boxes. SPDAP confirms residency by matching against state databases." },
          { label: "Phone number", note: "SPDAP may call to clarify income or coverage details." },
          { label: "Date you became a Maryland resident", note: "Approximate — month and year. Required to confirm the 6-month residency rule." },
        ],
      },
      {
        title: "Step 3 — Current Part D coverage",
        body: [
          "SPDAP needs to know which Part D plan you're enrolled in so they can send the subsidy directly to the correct insurer.",
        ],
        fields: [
          { label: "Part D plan name", note: "Exact name as printed on your Part D member card (e.g., 'WellCare Value Script', 'SilverScript Choice')." },
          { label: "Plan member ID", note: "From your Part D card — separate from your Medicare MBI." },
          { label: "Effective date of Part D coverage", note: "Month and year your current plan started." },
          { label: "Monthly premium", note: "Pre-subsidy amount. SPDAP pays up to $75 of this directly to the insurer." },
        ],
      },
      {
        title: "Step 4 — Income and household",
        body: [
          "Household = you + your spouse if you live together. Adult children don't count.",
          "Use gross monthly income before taxes and Medicare deductions. Round to whole dollars.",
        ],
        fields: [
          { label: "Marital status / household size", value: "{{maritalLabel}}", note: "Single = 1, married living together = 2." },
          { label: "Gross monthly Social Security", note: "From your most recent SSA-1099 or award letter — pre-Medicare-deduction." },
          { label: "Gross monthly pension / annuity", note: "Sum of all pensions before taxes." },
          { label: "Gross monthly wages", note: "If still working." },
          { label: "Other monthly income", note: "Interest, dividends, rental income, IRA distributions. Use last year's totals divided by 12." },
          { label: "Annual gross household income (auto-totaled)", value: "{{annualIncome}} (your stated annual income from the audit)", note: "This is the figure SPDAP compares against the 300% FPL limit. Verify it matches what you entered above × 12." },
          { label: "Are you currently enrolled in full Medicaid?", note: "If yes, SPDAP doesn't apply — full Medicaid already covers Part D. Most Cairn users in this guide will answer no." },
        ],
      },
      {
        title: "Step 5 — Sign and submit",
        body: [
          "Online: type your name as electronic signature, click submit. You'll see a confirmation page with a tracking number — save it.",
          "Paper: sign and date in ink, mail to the address on the form (Maryland Department of Aging, 301 W. Preston Street, Suite 1007, Baltimore, MD 21201) OR fax to 410-333-7943.",
          "Always keep a copy of the application and all attachments for your records. If you fax, save the confirmation page.",
        ],
        fields: [
          { label: "Signature", note: "Wet ink (paper) or typed name (online). Both are legally accepted." },
          { label: "Date signed", note: "MM/DD/YYYY." },
        ],
      },
      {
        title: "What happens next",
        body: [
          "Online applications: decision letter mailed in 1–2 weeks.",
          "Paper / fax applications: 3–4 weeks.",
          "Decision letter tells you (a) approved or denied, (b) your subsidy amount, (c) the date the subsidy starts. Subsidy typically begins the month after approval.",
          "If approved, you do NOTHING further — SPDAP pays your Part D insurer directly, and your monthly premium drops by the subsidy amount on your next bill or auto-debit.",
          "Annual recertification: you'll get a renewal packet in January each year. Mail it back within 30 days to avoid a coverage gap.",
          "If denied, the letter explains why. Most denials are for income-over-limit or not-yet-enrolled-in-Part-D — both can be re-applied for once the underlying issue resolves.",
        ],
      },
    ],
    sample: "p. 3 — The SPDAP paper application with our example filled in, showing exactly which boxes to check for income tier 2.",
  },
  {
    id: "va_aid",
    name: "VA Aid & Attendance Pension",
    blurb: "Apply for the wartime-veteran or surviving-spouse benefit. Notoriously paperwork-heavy.",
    pages: 14,
    timeToApply: "About 45 minutes for first-time filing",
    relatedTo: ["va"],
    verified: "January 2026",
    sections: [
      "Determining if you qualify: wartime-service quickcheck",
      "Documents the VA will require (full checklist)",
      "Step 1 — VA Form 21P-527EZ walkthrough",
      "Step 2 — Form 21-2680 (Examination for Housebound Status)",
      "Step 3 — Where to mail and how to track",
      "What an accredited VA agent does (and when to use one)",
      "Decision timeline: the VA's actual averages, by state",
      "Appealing a denial: forms and deadlines",
      "Annual eligibility reviews and what triggers them",
    ],
    steps: [
      {
        title: "Quickcheck — three eligibility tests",
        body: [
          "Aid & Attendance is the highest tier of VA Pension. To qualify, you must pass all three:",
          "1. Wartime service: served at least 90 days active duty, with at least 1 day during a recognized wartime period — WWII (12/7/41–12/31/46), Korea (6/27/50–1/31/55), Vietnam (8/5/64–5/7/75; or in-country 2/28/61–5/7/75), Persian Gulf War (8/2/90–present). Discharge under conditions other than dishonorable.",
          "2. Income/asset test: net worth (assets + annual income, minus unreimbursed medical expenses) under the VA's threshold ($155,356 in 2026 for most filers, indexed annually). Your home and one car don't count.",
          "3. Aid & Attendance need: you require help with daily activities (bathing, dressing, eating, medication management) OR are bedridden OR are blind (corrected vision 5/200 or worse) OR live in a nursing home for mental/physical incapacity.",
          "Surviving spouses qualify if the deceased veteran met requirements 1 and the spouse meets 2 and 3.",
        ],
      },
      {
        title: "Documents to gather (start here — collecting takes longer than filling)",
        body: [
          "DD-214 (military discharge): your wartime service proof. Request a free copy at archives.gov/veterans if you don't have one. Allow 4–6 weeks to receive.",
          "Marriage certificate (and divorce decrees from any prior marriages, if applicable).",
          "Death certificate (surviving-spouse applicants only).",
          "Most recent federal tax return.",
          "Bank, brokerage, and retirement account statements (last 3 months).",
          "Mortgage statement or rent payment proof.",
          "Itemized list of unreimbursed medical expenses for the past 12 months (caregiver costs, prescriptions, insurance premiums, in-home care, assisted-living facility fees). This deduction is the biggest swing factor in the net-worth calculation.",
          "Doctor's statement on VA Form 21-2680, completed by your physician.",
        ],
      },
      {
        title: "Step 1 — VA Form 21P-527EZ — Section I: Veteran Information",
        body: [
          "Form 21P-527EZ is the main pension application. Download from va.gov/find-forms or get a paper copy from your nearest VA Regional Office.",
          "Section I asks for veteran identifying information. Surviving-spouse applicants fill out Form 21P-534EZ instead — same fields plus a section about the deceased veteran.",
        ],
        fields: [
          { label: "Veteran's full name (last, first, middle)", note: "Use the name as it appears on the DD-214." },
          { label: "Social Security number", note: "Nine digits." },
          { label: "VA file number (if known)", note: "Skip if you don't have one. The VA will assign one when they receive your application." },
          { label: "Date of birth", value: "{{birthDate}}" },
          { label: "Service number (if applicable)", note: "Found on the DD-214. Pre-1969 servicemembers had separate service numbers; later, SSN replaced it." },
          { label: "Branch of service and dates of active duty", note: "From DD-214: from-date and to-date. Also branch (Army, Navy, etc.)." },
          { label: "Discharge status", note: "Honorable, General Under Honorable Conditions, or Other Than Honorable. Anything below 'General' makes pension eligibility doubtful — talk to a VSO before filing." },
        ],
      },
      {
        title: "Step 2 — Section IV: Net Worth and Income",
        body: [
          "This is the section where applications most often fail. The VA looks at total net worth (assets + annualized income), then subtracts unreimbursed medical expenses (UMEs) to get the comparison figure.",
          "Tip: be aggressive about UMEs. The VA accepts many medical expenses retirees overlook — Medicare premiums, supplemental insurance premiums, prescription co-pays, transportation to medical appointments, in-home caregiver costs, and assisted-living facility fees (the medical-care portion).",
        ],
        fields: [
          { label: "Cash and bank accounts (combined)", note: "All checking, savings, money-market accounts." },
          { label: "Stocks, bonds, mutual funds, IRAs", note: "Current market value." },
          { label: "Real estate (excluding primary residence)", note: "Vacation homes, rental properties — current market value minus mortgage." },
          { label: "Other significant assets", note: "Whole-life insurance cash value, business ownership interest." },
          { label: "Annual income from Social Security", note: "Gross — pre-Medicare-deduction. From your most recent SSA-1099." },
          { label: "Annual pension income", note: "Sum of all pensions before tax." },
          { label: "Other annual income (interest, dividends, rental, wages)", note: "Use your most recent tax return as the source." },
          { label: "Annual unreimbursed medical expenses", note: "Critical — list every medical expense paid out-of-pocket in the past 12 months. Include Medicare Part B and D premiums, Medigap premiums, deductibles, copays, transportation to appointments, prescription costs, hearing aids, dentures, eyeglasses, in-home care, assisted-living medical-care portion." },
        ],
      },
      {
        title: "Step 3 — Section V: Direct Deposit",
        body: [
          "VA pensions are paid only by direct deposit (no paper checks, by federal law since 2013).",
        ],
        fields: [
          { label: "Bank routing number", note: "Nine digits, bottom-left of your check." },
          { label: "Account number", note: "Bottom of your check." },
          { label: "Account type", note: "Checking or savings." },
        ],
      },
      {
        title: "Step 4 — Form 21-2680: Doctor's Examination",
        body: [
          "Form 21-2680 (Examination for Housebound Status or Permanent Need for Regular Aid and Attendance) is filled out by your doctor — not you.",
          "This is the medical evidence proving you need help with daily activities. Without it, the application is denied.",
          "Take the form to your next regular doctor's appointment. Most physicians' offices know this form and can complete it during the visit. The doctor's office may charge a fee ($25–75) for completion.",
          "Critical fields the doctor must address: ability to bathe, dress, eat, manage medications, manage finances, and ambulate independently. The form has yes/no checkboxes for each.",
          "If your doctor's answers don't clearly establish A&A need, ask them to add narrative comments — VA examiners weigh narrative more heavily than checkboxes.",
        ],
      },
      {
        title: "Step 5 — Where to send the application",
        body: [
          "Mail or fax (NOT email) to the VA Pension Management Center for your state:",
          "If you live in: CT, DE, IN, ME, MD, MA, NH, NJ, NY, NC, OH, PA, RI, VT, VA, DC, WV → mail to: Department of Veterans Affairs, Pension Management Center, P.O. Box 5365, Janesville, WI 53547-5365.",
          "If you live in: AL, AR, FL, GA, KY, LA, MS, OK, PR, SC, TN, TX → mail to: Department of Veterans Affairs, Pension Management Center, P.O. Box 5365 (the same Janesville address — VA consolidated PMCs in 2017).",
          "If you live in: AK, AZ, CA, CO, HI, ID, IL, IA, KS, MI, MN, MO, MT, NE, NV, NM, ND, OR, SD, UT, WA, WI, WY → same Janesville address.",
          "Verify the current mailing address at va.gov/find-locations before mailing — this can change.",
          "Fax (faster than mail): 844-655-1604.",
          "Or apply online at va.gov/pension/application/527EZ — fastest, but the system has had reliability issues. Paper is more reliable for first-time filers.",
        ],
      },
      {
        title: "Working with an accredited VA agent or VSO",
        body: [
          "A&A applications are notoriously easy to get wrong. About 30% of first-time filings are denied for incomplete documentation.",
          "Accredited Veterans Service Officers (VSOs) — from organizations like the American Legion, VFW, DAV, AMVETS — help you file at no charge. They're VA-trained and know the common pitfalls.",
          "Find a VSO at va.gov/ogc/apps/accreditation/index.asp.",
          "AVOID: anyone who charges a fee to file (illegal under federal law) or who promises 'guaranteed approval' or 'asset-shielding strategies' (can disqualify you).",
        ],
      },
      {
        title: "Decision timeline and follow-up",
        body: [
          "Average processing time: 4–8 months for first-time A&A claims. Some Pension Management Centers run faster (Wisconsin lately) than others.",
          "You can check status at va.gov/claim-or-appeal-status using your VA file number once you have one.",
          "If approved, payments are retroactive to the application date — submit promptly because every month of delay is a month of benefit lost.",
          "If denied, you have 1 year from the decision letter to file a Notice of Disagreement (Form 21-0958) or Higher-Level Review.",
        ],
      },
      {
        title: "After approval — annual eligibility reviews",
        body: [
          "Once approved, you receive Form 21P-0518 (Improved Pension Eligibility Verification Report) every year. Complete and return within 60 days.",
          "Failure to return = automatic suspension of benefits.",
          "Notify the VA within 30 days of any change to: marital status, household composition, income, assets, or unreimbursed medical expenses.",
          "If your situation improves (income up, medical needs decrease), benefits may be reduced or terminated. Conversely, if costs rise, you can request a re-evaluation for a higher benefit tier mid-year.",
        ],
      },
    ],
    sample: "p. 5 — Form 21P-527EZ, page 2, with our example showing how to report unreimbursed medical expenses (the deduction most applicants miss).",
  },
  {
    id: "medicare_enrollment",
    name: "Enrolling in Medicare (Parts A & B)",
    blurb: "Step-by-step Social Security signup for new Medicare beneficiaries.",
    pages: 9,
    timeToApply: "About 20 minutes",
    relatedTo: ["medicare_enrollment"],
    universal: true,
    verified: "January 2026",
    sections: [
      "Your enrollment window: how to know when to apply",
      "Step 1 — Creating your my Social Security account",
      "Step 2 — The Medicare-only application",
      "Step 3 — Choosing whether to enroll in Part B (most should)",
      "What your Medicare card looks like and when it arrives",
      "Setting up Medicare Easy Pay for your Part B premium",
      "Late-enrollment penalties: how to avoid them",
      "Coordinating with employer coverage (if applicable)",
    ],
    // Field-by-field body content. Personalization tokens like {{stateName}}
    // and {{iepEnd}} are filled from the user's audit answers at PDF time.
    steps: [
      {
        title: "Before you start: what you'll need on hand",
        body: [
          "Block 20 minutes. The application itself takes 10–15 minutes, but you'll need a few documents nearby.",
          "Gather: Social Security number, current address and phone, your bank account and routing number (for Easy Pay), and — if you're delaying Part B because of employer coverage — your employer's name, address, and the date your coverage started.",
          "If you've worked outside the U.S. or held a railroad job, also note those dates: SSA asks separately about each.",
        ],
      },
      {
        title: "Step 1 — Create your my Social Security account at ssa.gov/myaccount",
        body: [
          "If you already have a my Social Security account, skip ahead. Otherwise, go to ssa.gov/myaccount and click 'Create an Account'.",
          "SSA verifies your identity using credit-history questions (prior addresses, mortgage lender, car loan). Have a credit report or recent statements nearby in case you're asked.",
          "The account uses Login.gov or ID.me as the federal sign-in. Both are free; pick whichever you've used before.",
        ],
        fields: [
          { label: "Email address", note: "Use one you check daily — SSA emails enrollment confirmations here." },
          { label: "Mobile phone for two-factor", note: "Required for the federal sign-in. A landline works too if you accept voice codes." },
          { label: "Identity verification", note: "Multi-choice questions about your credit history. If you fail twice, you'll need to verify by mail (adds 7–10 days)." },
        ],
      },
      {
        title: "Step 2 — Open the Medicare-only application at ssa.gov/medicare/sign-up",
        body: [
          "From your my Social Security account, choose 'Apply for Medicare Only' (not 'Apply for Retirement' — that starts Social Security benefits, which is a separate decision).",
          "The form is split into ~6 short pages. SSA saves your progress, so you can pause and return.",
        ],
        fields: [
          { label: "Are you applying for Medicare only?", value: "Yes", note: "Selecting 'Yes' keeps your Social Security retirement benefit decision separate." },
          { label: "Do you want Part B?", value: "Yes", note: "Almost everyone should answer yes. The exceptions are people with active 20+-employee employer coverage who want to delay. See the employer-coverage step." },
          { label: "Date you want coverage to start", value: "{{partBStartLabel}}", note: "If you're in your IEP, the earliest start date is the first day of your birth month. Pick that unless you have employer coverage you're keeping." },
          { label: "Have you ever filed for Medicare before?", value: "No (typical)", note: "Yes only if you previously applied and were denied or withdrew." },
        ],
      },
      {
        title: "Step 3 — Personal information",
        body: [
          "This page collects identifying details. Use the legal name on your Social Security card — not a nickname or married name unless you've updated it with SSA.",
        ],
        fields: [
          { label: "Full legal name", note: "Must match your Social Security card exactly. If your card is wrong, fix it at SSA before applying." },
          { label: "Social Security number", note: "Nine digits, no dashes." },
          { label: "Date of birth", value: "{{birthDate}}", note: "Month, day, year." },
          { label: "Place of birth (city, state, country)", note: "Country is required even if it's the U.S." },
          { label: "U.S. citizen?", note: "If no, SSA asks for your immigration status and the date you entered the U.S." },
          { label: "Mailing address", note: "Where your Medicare card and welcome packet will be sent. Use the address that appears on your IRS records to avoid identity-verification flags." },
          { label: "Phone number", note: "SSA may call to clarify answers. Use a number you actually answer." },
        ],
      },
      {
        title: "Step 4 — Work history and Medicare-qualifying coverage",
        body: [
          "SSA confirms you have enough work credits for premium-free Part A (typically 40 quarters / 10 years of Medicare-taxed work). If you don't, you can still buy Part A — but most people qualify automatically.",
          "If your spouse has 40 quarters and you don't, you can qualify on their record. SSA asks about this here.",
        ],
        fields: [
          { label: "Have you worked in U.S. employment for at least 10 years?", note: "Yes if you have ~40 quarters of Medicare-taxed work. Self-employment counts." },
          { label: "Are you currently working?", note: "Drives the next page about employer coverage." },
          { label: "Have you ever worked outside the U.S.?", note: "Affects totalization with foreign social-security systems. Most U.S.-only workers answer no." },
          { label: "Have you ever worked for a railroad?", note: "Railroad workers enroll through the Railroad Retirement Board, not SSA. If yes, SSA will redirect you." },
          { label: "Spouse's work history (if applying on spouse's record)", note: "Provide spouse's name, SSN, and birth date." },
        ],
      },
      {
        title: "Step 5 — Employer health coverage (if applicable)",
        body: [
          "{{employerCoverageGuidance}}",
          "If you're delaying Part B because of employer coverage, you'll later need to file Form CMS-L564 with your employer's HR department to document continuous coverage when you do enroll.",
        ],
        fields: [
          { label: "Do you (or your spouse) currently have employer or union health coverage?", value: "{{employerCoverageAnswer}}", note: "Be specific — retiree coverage and COBRA do NOT count as 'active' employment for the Special Enrollment Period." },
          { label: "Employer name and address", note: "Only if you answered yes. SSA may contact them to verify." },
          { label: "Date the coverage started", note: "Month and year." },
          { label: "Is the employer's group size 20 or more employees?", note: "20+ unlocks the Special Enrollment Period and lets you delay Part B without penalty. Under 20, Medicare becomes primary at 65 and delaying Part B is risky." },
        ],
      },
      {
        title: "Step 6 — Review, sign, and submit",
        body: [
          "SSA shows a summary of every answer. Check it carefully — corrections after submission require a phone call to 1-800-772-1213.",
          "The 'signature' is just typing your full name in the signature box. SSA treats this as a legal signature for the application.",
          "After submitting, you'll get a confirmation number on screen. Save or print it. SSA also emails confirmation within 24 hours.",
        ],
        fields: [
          { label: "Electronic signature", note: "Type your full legal name exactly as entered earlier." },
          { label: "Date", note: "Auto-filled to today." },
          { label: "Confirmation number", note: "Format: a long alphanumeric string. Keep it — you'll need it if anything goes wrong." },
        ],
      },
      {
        title: "What happens next",
        body: [
          "{{nextStepsGuidance}}",
          "Standard timeline: SSA processes the application within 1–3 weeks. Your red-white-blue Medicare card mails ~3 weeks before your coverage start date.",
          "If you don't see the card 2 weeks before your start date, call 1-800-MEDICARE (1-800-633-4227) with your confirmation number.",
          "You'll also receive a 'Welcome to Medicare' packet — keep it. It explains preventive services that are free in your first 12 months.",
        ],
      },
      {
        title: "Set up Medicare Easy Pay (recommended)",
        body: [
          "Part B premiums are deducted automatically from your Social Security check if you're drawing benefits. If you're not, SSA bills you quarterly — late payment can cause coverage to lapse.",
          "Medicare Easy Pay is the auto-debit alternative. Sign up at medicare.gov/medicareeasypay or by mailing Form SF-5510.",
          "Premium for 2026: roughly $190/month for most people; higher for IRMAA-tier incomes.",
        ],
        fields: [
          { label: "Bank routing number", note: "Nine digits, bottom-left of your check." },
          { label: "Bank account number", note: "Bottom of your check, after the routing number." },
          { label: "Account type", note: "Checking or savings." },
          { label: "Authorization signature", note: "Required on Form SF-5510 (paper) or e-signature on the website." },
        ],
      },
      {
        title: "Avoiding Part B and Part D late penalties",
        body: [
          "Part B late penalty: 10% added to your monthly premium for every full 12 months you delayed enrolling, for life.",
          "Part D late penalty: 1% of the national base premium added per month without creditable drug coverage, for life.",
          "Both penalties are waived if you had qualifying employer coverage during the gap and use the Special Enrollment Period (8 months from the date employer coverage ends).",
          "If you missed your IEP and don't qualify for an SEP, the General Enrollment Period (Jan 1 – Mar 31) is your next chance. Coverage starts the month after enrollment.",
        ],
      },
    ],
    sample: "p. 4 — The Medicare application screen showing where most people accidentally decline Part B (and how to fix it if you did).",
  },
  {
    id: "medigap_shop",
    name: "Shopping for Medigap (Plan G)",
    blurb: "How to compare quotes from 5+ carriers and avoid paying $50–100/mo extra.",
    pages: 11,
    timeToApply: "About 1 hour for thorough comparison",
    relatedTo: ["medigap"],
    universal: true,
    verified: "January 2026",
    sections: [
      "Why Plan G is identical from every carrier (and what isn't)",
      "Building your shopping list: 5 carriers minimum",
      "Step 1 — Getting your first quote (Mutual of Omaha walkthrough)",
      "Step 2 — Repeating with Cigna, Aetna, regional Blue plan",
      "What to ask each carrier: rating method, household discount, recent rate increase history",
      "Reading the rate-stability disclosures (most agents don't show you these)",
      "Step 3 — Choosing and applying within your guaranteed-issue window",
      "Annual review: how to switch if your carrier raises rates",
    ],
    steps: [
      {
        title: "Why Plan G is identical from every carrier",
        body: [
          "Federal law (CMS regulations) defines exactly what Medigap Plan G covers. Every carrier's Plan G has the same benefits — same coinsurance coverage, same Part B excess charges, same skilled-nursing-facility coinsurance, same foreign-travel emergency benefit.",
          "What differs across carriers: monthly premium (can vary 30–50% in your zip code), rating method (attained-age vs. issue-age vs. community), household discount (5–15% for spousal pairs), recent rate-increase history, and customer service quality.",
          "Plan G covers everything Plan F did EXCEPT the Part B deductible ($240/year in 2026). It's the most popular plan for new enrollees because Plan F is no longer available to people who turned 65 after 2020.",
          "If premium is your top concern and you don't mind paying the Part B deductible yourself, Plan G's slightly cheaper sibling Plan N is also worth a quote — but it has copays at the doctor's office that Plan G doesn't.",
        ],
      },
      {
        title: "Build your shopping list: 5 carriers minimum",
        body: [
          "The single biggest mistake Medigap shoppers make: getting one quote and stopping. Plan G premiums for the same coverage in your zip code routinely vary by $50–100/month, which is $600–1,200/year forever.",
          "{{stateName}} carriers worth quoting first (from the audit's Medigap section): the carriers shown in your Cairn results. Aim for 5+ quotes minimum.",
          "Useful shortcut: also quote a regional Blue Cross Blue Shield plan in your state (e.g., CareFirst in MD/DC/VA, Anthem in CA/CO/CT, Highmark in PA, Florida Blue in FL). Local Blues sometimes price aggressively for state residents.",
          "Avoid: any quote site that asks for your phone number before showing prices. They're lead-generators that sell your number to 5–10 agents who will call all day. Get quotes directly from carrier websites or via 1-800-MEDICARE's free Medigap quote tool.",
        ],
        fields: [
          { label: "Your ZIP code", note: "All Medigap quotes are zip-code specific. The same plan can vary $30/mo across zip codes 20 miles apart." },
          { label: "Tobacco use", note: "Smokers pay 20–35% more across most carriers. Honest disclosure matters — carriers can deny claims if you misrepresent and they later find out." },
          { label: "Spouse coverage?", note: "If your spouse is also Medicare-eligible, ask about household discount on each quote. 5–15% off, often enough to flip the rankings." },
        ],
      },
      {
        title: "Step 1 — Get your first quote (Mutual of Omaha walkthrough)",
        body: [
          "Why start with Mutual of Omaha: A+ AM Best rating, available in all 50 states, transparent pricing on their public site, and they offer a 7% household discount.",
          "Go to mutualofomaha.com → 'Medicare Supplement' → 'Get a Quote'. You'll be on the quote page within 2 clicks.",
        ],
        fields: [
          { label: "ZIP code, gender, date of birth", value: "{{birthDate}}", note: "Birth date determines your premium tier. Quotes auto-update on each birthday for attained-age carriers." },
          { label: "Tobacco use", note: "Honest answer required." },
          { label: "Effective date you want coverage to start", note: "Pick the first of the month after your Part B starts. For Cairn IEP users: this is {{partBStartLabel}}." },
          { label: "Household discount eligibility", note: "If your spouse is on Medicare or applying with you, check yes for the 7% discount. Mutual of Omaha's spousal discount applies even if your spouse picks a different Medigap carrier." },
          { label: "Plan letter", value: "Plan G", note: "Pick Plan G. The site will show Plan G, Plan G HD (high-deductible variant — different beast), Plan N, and others. Stick with regular Plan G unless you've researched the others." },
        ],
      },
      {
        title: "Step 2 — Repeat with Cigna, Aetna, and a regional Blue",
        body: [
          "Cigna: cigna.com → 'Medicare Supplement' → 'Get a Quote'. Cigna often has the lowest new-enrollee Plan G price in {{stateName}}.",
          "Aetna: aetnamedicare.com → 'Medicare Supplement Plans'. Aetna's pricing is mid-pack but rate stability is good.",
          "Regional Blue (varies by state): for example, Florida Blue in FL, Highmark in PA, CareFirst BCBS in MD/DC. Blues often have strong local provider relationships and reasonable rate stability.",
          "United Healthcare (AARP-branded): aarpmedicaresupplement.com. Requires an AARP membership ($16/year) to enroll. UHC is the largest Medigap carrier; pricing is rarely cheapest but rate increases tend to be moderate.",
          "Use the same exact answers (zip, DOB, tobacco, plan G, effective date) on each site to make quotes comparable.",
        ],
      },
      {
        title: "Build a side-by-side comparison sheet",
        body: [
          "Open a spreadsheet (or use Cairn's comparison worksheet on page 7 of this guide). Columns: carrier, monthly premium, AM Best rating, rating method, household discount %, last 3-year rate-increase history, customer-service rating from JD Power.",
          "Fill in each carrier as you get the quote. Don't try to remember — small differences matter and you'll forget by carrier #4.",
        ],
        fields: [
          { label: "Carrier name", note: "From your shopping list." },
          { label: "Monthly premium with discounts applied", note: "Use the household-discount-applied price if applicable. That's what you'll actually pay." },
          { label: "AM Best financial strength rating", note: "A or better is fine. A- or below = research before committing." },
          { label: "Rating method", note: "Attained-age (rises each birthday), issue-age (locks at enrollment), or community-rated (same for all ages). Long-term cost depends on this more than starting premium." },
          { label: "Household discount %", note: "0–15%. Apply only if your spouse will also be on Medicare and enrolling with the same or different carrier (varies by carrier)." },
          { label: "3-year average annual rate increase", note: "Ask the agent or look up state filings. <5% is good; 8%+ is concerning." },
        ],
      },
      {
        title: "What to ask each carrier (the questions agents skip)",
        body: [
          "Most Medigap agents are paid commission and will steer you toward the carrier paying them best. To level the field, ask each one the same questions — the answers tell you whether to trust them.",
          "1. 'What's your average annual rate increase over the last 3 years for Plan G in my zip code?' (Honest answer: 4–8%. If they say 'rates rarely go up,' they're lying.)",
          "2. 'Is this attained-age, issue-age, or community-rated?' (Drives long-term cost. Most carriers nationally are attained-age.)",
          "3. 'Do you offer a household discount, and what are the eligibility requirements?' (Some carriers require both spouses on Medicare; others count co-habitation only.)",
          "4. 'How are you rated by AM Best, and has your rating changed in the last 5 years?' (UHC was downgraded from A+ to A in Aug 2025 — most agents don't volunteer this.)",
          "5. 'Will you give me a copy of the most recent rate-increase filing for my state?' (Good agents will. State insurance departments publish these publicly anyway.)",
        ],
      },
      {
        title: "Reading the rate-stability disclosures",
        body: [
          "Every state insurance department publishes Medigap rate-increase filings. Search '[your state] insurance department medigap rate' to find yours.",
          "{{stateName}} rate-comparison resource: " + "Look for the most recent 3 years of filings per carrier. Patterns matter more than any single year — a carrier with one big jump and otherwise flat rates is different from one with steady 7%/year hikes.",
          "Issue-age and community-rated carriers will show smaller annual increases than attained-age, because attained-age has age-creep baked into the structure.",
          "If you're choosing between two carriers within $10/mo, pick the one with the better 3-year history.",
        ],
      },
      {
        title: "Step 3 — Apply within your 6-month guaranteed-issue window",
        body: [
          "The Medigap guaranteed-issue window starts the month your Part B begins and lasts 6 months. During this window, no carrier can deny you for health reasons or charge more for pre-existing conditions.",
          "Outside this window, most states let carriers medically underwrite — they can deny coverage, charge more, or impose waiting periods.",
          "For Cairn pre-65 users: your guaranteed-issue window is {{partBStartLabel}} through ~6 months later. Apply during this window.",
          "Submit the application directly through the carrier's website. Approval is automatic during guaranteed-issue (paperwork only, no health questions).",
        ],
        fields: [
          { label: "Effective date", value: "{{partBStartLabel}}", note: "Pick the first of the month your Part B starts. Earlier is risky (no Medicare to coordinate with); later means a coverage gap." },
          { label: "Health questions", note: "During the 6-month guaranteed-issue window, the application skips health questions. If you see them, you may be applying outside your window — pause and verify." },
          { label: "Payment method", note: "Most carriers accept auto-draft from bank account or credit card. Some also support deduction from Social Security." },
          { label: "Effective date confirmation", note: "Carrier emails or mails an effective-date confirmation within 7–10 days. Save it." },
        ],
      },
      {
        title: "Annual review: how to switch if your carrier raises rates",
        body: [
          "If your carrier raises rates >7% in a year, shop again. You can switch carriers at any time — Medigap doesn't have an Annual Enrollment Period like Part D.",
          "Catch: outside your initial 6-month guaranteed-issue window, you'll likely face medical underwriting on the new carrier. If you have health conditions, you may be denied or charged more.",
          "Exception: California's birthday rule. Every year in the 60 days following your birthday, you can switch to any equal-or-lesser Plan G with any carrier without medical underwriting.",
          "Other states with similar rules: New York, Connecticut (community-rated by law), Massachusetts (annual open enrollment), Maine, Vermont. Check your state's specific rules at shiphelp.org.",
        ],
      },
    ],
    sample: "p. 7 — A side-by-side worksheet: same Plan G, five carriers, with our example showing $73/mo difference on identical coverage.",
  },
  {
    id: "part_d_pick",
    name: "Picking the Right Part D Drug Plan",
    blurb: "Use Medicare Plan Finder to optimize for your specific medications.",
    pages: 8,
    timeToApply: "About 30 minutes (need your medication list)",
    relatedTo: ["medicare_enrollment", "medigap"],
    universal: true,
    verified: "January 2026",
    sections: [
      "Before you start: gathering your medication list",
      "Why total annual cost beats monthly premium",
      "Step 1 — Medicare.gov Plan Finder, entering your drugs",
      "Step 2 — Reading the cost summary correctly",
      "Step 3 — Checking your pharmacy's preferred status",
      "Step 4 — Enrolling directly through Plan Finder",
      "Annual review reminder: re-shop every fall",
      "What to do if a drug is dropped from your formulary mid-year",
    ],
    steps: [
      {
        title: "Before you start: build your medication list",
        body: [
          "Allow 30 minutes. Plan Finder is fast once you have your drug list ready — most of the time you'll spend is gathering names, dosages, and quantities.",
          "For each prescription you take, write down: drug name (brand or generic — Plan Finder accepts either), dose (e.g., 20 mg), frequency (e.g., once daily), and quantity per fill (e.g., 30 tablets per 30 days).",
          "Easiest source: ask your pharmacy for a printout of your last 12 months of prescriptions. Most pharmacies print this on request, no charge.",
          "If you take seasonal or as-needed drugs (inhalers, allergy meds), include them — they affect total annual cost.",
        ],
      },
      {
        title: "Why total annual cost beats monthly premium",
        body: [
          "The cheapest-premium plan is rarely the cheapest plan overall. Drug deductibles, copays, and tier placement matter more than the headline premium.",
          "Example: a $5/mo plan with a $545 deductible and 25% coinsurance on tier-3 drugs can easily cost $1,200/year more than a $35/mo plan with $0 copays for your specific drugs.",
          "Plan Finder shows 'estimated annual drug cost' in the results — that's the column to sort by.",
          "The 2026 Part D donut-hole reform caps total annual out-of-pocket at $2,100 — so for high-utilizers, every plan converges above that ceiling. The differences live in the first $2,100.",
        ],
      },
      {
        title: "Step 1 — Open Plan Finder at medicare.gov/plan-compare",
        body: [
          "From the Medicare.gov homepage, click 'Find a plan' or go directly to medicare.gov/plan-compare.",
          "You can use Plan Finder logged-in (with your my Medicare account) or as a guest. Logged-in is better — it remembers your drug list across sessions and pre-fills your name when you enroll.",
        ],
        fields: [
          { label: "What type of coverage are you looking for?", value: "Drug plan (Part D)", note: "Select 'Drug plan (Part D)' to see standalone Part D plans. Selecting 'Medicare Advantage Plan' switches to MA + Part D bundles — different shopping flow." },
          { label: "ZIP code", note: "Plans and prices are zip-code specific." },
          { label: "Are you getting any kind of help paying for your prescriptions?", note: "Answer yes if you have Extra Help / LIS, full Medicaid, or are in an MSP — Plan Finder will show your subsidized cost instead of full cost." },
        ],
      },
      {
        title: "Step 2 — Enter your drugs",
        body: [
          "Plan Finder asks for your drugs one at a time. Type the first few letters and pick from the dropdown — generic and brand are usually both listed.",
          "After picking each drug, set the dose and quantity. Plan Finder defaults to common values; verify they match your prescription label.",
          "If a drug isn't in the dropdown, it's either misspelled, an over-the-counter med (Part D doesn't cover OTC), or extremely new — call 1-800-MEDICARE to confirm.",
          "Save your drug list before continuing. The 'Save' button stores it to your my Medicare account; without an account, Plan Finder remembers it for the current browser session only.",
        ],
        fields: [
          { label: "Drug name", note: "Type 3+ letters, pick from the dropdown. Brand and generic are interchangeable for matching purposes." },
          { label: "Dose", note: "From your prescription label. If your prescription says '10 mg twice daily,' enter 10 mg here and 'twice daily' as frequency." },
          { label: "Quantity per fill", note: "How many pills/tablets per refill. 30 for monthly, 90 for 3-month mail-order." },
          { label: "Frequency", note: "Once daily, twice daily, etc. Affects whether you fill 30 or 60 tablets per month." },
        ],
      },
      {
        title: "Step 3 — Pick your pharmacy",
        body: [
          "Plan Finder asks for up to 5 pharmacies. Most plans have 'preferred' pharmacies where copays are lower — this can swing total annual cost by hundreds of dollars.",
          "Tip: include your usual pharmacy AND a major chain (CVS, Walgreens, Walmart). If your usual pharmacy isn't preferred under the cheapest plan, switching might save more than the plan's premium savings.",
          "Mail-order pharmacy (Express Scripts, OptumRx, etc.) is almost always the lowest-copay option for 3-month fills of maintenance drugs.",
        ],
        fields: [
          { label: "Pharmacy ZIP code", note: "Defaults to your home ZIP." },
          { label: "Pharmacy search", note: "Type pharmacy name or browse by chain. Pick up to 5." },
          { label: "Include mail-order pharmacy?", note: "Yes — mail-order is often the lowest-copay option for maintenance medications." },
        ],
      },
      {
        title: "Step 4 — Read the results",
        body: [
          "Plans are listed with: monthly premium, annual deductible, estimated annual drug cost, and CMS Star Rating (1–5).",
          "Sort by 'Lowest drug + premium cost' — this is total annual cost. Don't sort by premium alone.",
          "Star Rating reflects the plan's customer-service and accuracy track record. Aim for 3.5 stars or higher when total cost is close.",
          "Click into the top 2–3 plans to see drug-by-drug copays — sometimes a $5/mo difference in premium hides a $40/mo difference on a tier-3 drug you take.",
        ],
        fields: [
          { label: "Sort by", value: "Lowest drug + premium cost", note: "This shows total annual cost — the metric that matters." },
          { label: "Filter: Star Rating", note: "Optional — filter to 4+ stars if quality matters more than $50/year of savings." },
          { label: "Filter: Plan type", note: "Stand-alone PDP only (not MA-PD), unless you want a Medicare Advantage bundle." },
          { label: "Compare", note: "Check up to 3 plans to see drug-by-drug copays side-by-side. Look for tier-3 drugs (most expensive) — that's where plan differences show." },
        ],
      },
      {
        title: "Step 5 — Enroll directly through Plan Finder",
        body: [
          "Once you've picked a plan, click 'Enroll' next to it on the comparison page. Plan Finder hands you off to the insurer's enrollment form, but pre-fills most fields from your Medicare account.",
          "You'll need: Medicare card (MBI), Part A and Part B effective dates, payment method (premium can be auto-deducted from Social Security or paid by bank transfer).",
          "Confirmation: the insurer emails or mails a welcome packet within 7–10 days. Coverage starts the 1st of the month after enrollment (during AEP, coverage starts Jan 1).",
        ],
        fields: [
          { label: "Medicare number (MBI)", note: "From the front of your red-white-blue Medicare card." },
          { label: "Part A and Part B effective dates", note: "Also on your Medicare card." },
          { label: "Premium payment method", note: "Three options: deduction from Social Security check (most common), bank auto-draft, or mailed bill." },
          { label: "Pharmacy preference", note: "Pre-filled from earlier in Plan Finder." },
        ],
      },
      {
        title: "Annual review every fall (Open Enrollment, Oct 15 – Dec 7)",
        body: [
          "Re-run Plan Finder every fall. Drug formularies change yearly — a plan that was best for you in 2026 may not be in 2027.",
          "Most people who don't re-shop end up paying $200–700/year more than they need to.",
          "If you switch plans during AEP, the new plan starts Jan 1 automatically. No need to cancel the old one.",
        ],
      },
      {
        title: "If a drug is dropped from your formulary mid-year",
        body: [
          "Insurers can drop drugs mid-year, but they must give you 30 days' notice and offer a transition supply (typically 30 days at the previous tier).",
          "Three options: (1) ask your doctor for an alternative on the formulary, (2) request a formulary exception (your doctor submits a Medical Necessity form to the plan), (3) wait until next AEP and switch plans.",
          "Formulary exception success rate is ~70% when your doctor submits the request with documented medical necessity.",
        ],
      },
    ],
    sample: "p. 5 — Plan Finder results, annotated to show which 'cheapest premium' is actually $400/year more expensive than option three.",
  },
  {
    id: "irmaa_appeal",
    name: "Appealing IRMAA Surcharges (Form SSA-44)",
    blurb: "How to fight the income-related premium surcharge after a life-changing event.",
    pages: 7,
    timeToApply: "About 25 minutes",
    relatedTo: ["irmaa"],
    universal: true,
    verified: "January 2026",
    sections: [
      "Quickcheck: do you have a life-changing event the SSA recognizes?",
      "Documents you'll need: tax returns, marriage/death certificates, retirement letter",
      "Step 1 — Form SSA-44 page-by-page walkthrough",
      "Step 2 — Choosing the correct event category",
      "Step 3 — Submitting and what to expect",
      "Decision timeline and how to follow up",
      "If denied: requesting reconsideration",
    ],
    steps: [
      {
        title: "Quickcheck — does SSA recognize your event?",
        body: [
          "IRMAA = the Income-Related Monthly Adjustment Amount added to your Part B and Part D premiums when MAGI exceeds the threshold. SSA bases the surcharge on your tax return from 2 years ago.",
          "Form SSA-44 is the appeal form — but only 8 specific 'life-changing events' (LCEs) qualify. If your income just dropped because you retired or sold a one-time asset, that's NOT an LCE on its own — only the events listed below.",
          "The 8 qualifying LCEs: marriage, divorce or annulment, death of a spouse, work stoppage (you fully stopped working), work reduction (hours/income cut), loss of income-producing property (not by sale), loss of pension income, employer settlement payment.",
          "If your event isn't on this list, SSA-44 won't help — wait for the 2-year lookback to catch up to your reduced income, or appeal through the standard Reconsideration process instead.",
        ],
      },
      {
        title: "Documents to gather",
        body: [
          "You will mail or fax the form (no online submission). Have ready before you start:",
          "Most recent IRMAA determination letter from SSA (the one telling you about the surcharge).",
          "Documentation proving the LCE: marriage certificate, divorce decree, death certificate, employer letter confirming work stoppage / reduction with last day worked, statement showing pension cessation, etc.",
          "Most recent federal tax return (Form 1040), or — if you're using estimated current-year income — a signed statement explaining your estimate.",
          "Your full Medicare claim number (MBI) from the front of your red-white-blue card.",
        ],
      },
      {
        title: "Download Form SSA-44 from ssa.gov",
        body: [
          "Go to ssa.gov/forms and search 'SSA-44' or download directly from ssa.gov/forms/ssa-44.pdf.",
          "The form is 8 pages — pages 1–4 are instructions, pages 5–8 are the fillable form.",
          "You can fill it on screen in Adobe Reader or print and complete by hand. Either is accepted.",
        ],
        fields: [
          { label: "Form version date", note: "Verify the form footer date is current. SSA reissues SSA-44 most years — using an outdated version can trigger rejection." },
        ],
      },
      {
        title: "Step 1 — Type of Life-Changing Event",
        body: [
          "Check exactly one box. If two events apply (e.g., death of spouse + work stoppage), file two separate SSA-44s.",
          "Enter the date the event happened in MM/DD/YYYY format.",
        ],
        fields: [
          { label: "Marriage", note: "Check if you married. Documentation: marriage certificate." },
          { label: "Divorce or Annulment", note: "Documentation: divorce decree or annulment order." },
          { label: "Death of Your Spouse", note: "Documentation: death certificate." },
          { label: "Work Stoppage", note: "You fully stopped working (retirement, layoff, business closed). Documentation: signed employer statement with last day worked OR severance/termination letter." },
          { label: "Work Reduction", note: "Hours or income reduced. Documentation: signed employer statement detailing the reduction and effective date." },
          { label: "Loss of Income-Producing Property", note: "Not from a sale — must be from disaster, theft, or seizure. Documentation: insurance/disaster report, court order." },
          { label: "Loss of Pension Income", note: "Pension stopped or was cut due to plan termination/reorganization. Documentation: letter from the pension administrator." },
          { label: "Employer Settlement Payment", note: "Court-ordered payment from a former employer over a closed/bankrupt pension. Documentation: court order or settlement agreement." },
          { label: "Date of life-changing event", note: "MM/DD/YYYY. Must be on or before the date you're filing." },
        ],
      },
      {
        title: "Step 2 — Reduction in Income (the section most people fill wrong)",
        body: [
          "This is where you tell SSA which year's income to use INSTEAD of the 2-years-ago return.",
          "Two choices: (a) the most recent tax year you've already filed, or (b) the year you're currently in (estimated). For most LCE appeals, the current-year estimate is what produces the IRMAA reduction — the prior tax year usually still shows the high income.",
          "If you choose the current-year estimate, you must explain how you got the number. SSA will reconcile against your actual tax return when you file it.",
        ],
        fields: [
          { label: "Tax year you want SSA to use", value: "{{currentYear}} (estimated)", note: "Pick the year that, post-LCE, has lower income. For most people that's the current year." },
          { label: "Estimated Modified AGI (line A)", value: "{{annualIncome}} (your stated annual income)", note: "MAGI = AGI from Form 1040 Line 11 + tax-exempt interest from Line 2a. If using current-year estimate, this is your projection.", verifyOnLiveForm: true },
          { label: "Estimated tax-exempt interest (line B)", note: "From Form 1040 Line 2a. Most retirees: $0. Add municipal bond interest if any." },
          { label: "Sum (line A + line B)", note: "This is the figure SSA uses. Put it in the 'Modified AGI' box." },
        ],
      },
      {
        title: "Step 3 — Tax Filing Status",
        body: [
          "Check the filing status that matches the year you used in Step 2 — NOT necessarily your status today.",
          "If you got married this year, you're likely Married Filing Jointly for the current year even if you were Single on the 2-years-ago return.",
        ],
        fields: [
          { label: "Single", value: "{{filingStatusSingle}}" },
          { label: "Married Filing Jointly", value: "{{filingStatusJoint}}" },
          { label: "Married Filing Separately", note: "MFS has its own (lower) IRMAA thresholds. Check this only if you actually file separately." },
          { label: "Head of Household" },
          { label: "Qualifying Widow(er)", note: "Available for 2 years after spouse's death if you have a qualifying dependent." },
        ],
      },
      {
        title: "Step 4 — Documentation checklist",
        body: [
          "On page 4 of the form, attach copies (NOT originals) of the LCE documentation matching the box you checked in Step 1.",
          "Also attach: a copy of your most recent tax return, OR a signed and dated statement explaining your current-year estimate.",
          "Common rejection reason: incomplete documentation. If you checked 'Work Stoppage' but only attach a personal letter — not from your employer — SSA will deny the appeal as unsubstantiated.",
        ],
        fields: [
          { label: "LCE documentation", note: "Match exactly to the box you checked in Step 1." },
          { label: "Tax return OR signed estimate statement", note: "If estimating, include: the year you're estimating, the dollar amount, and the basis (e.g., 'projected wages of $X plus pension of $Y for the remainder of the year')." },
          { label: "Copy of IRMAA determination letter", note: "Optional but speeds processing — SSA can match your appeal to the right tax year faster." },
        ],
      },
      {
        title: "Step 5 — Sign, date, and submit",
        body: [
          "Sign on page 4. The form is invalid without a wet or e-signature.",
          "Mail or fax to your local Social Security field office (find at ssa.gov/locator). You can also drop off in person.",
          "Do NOT mail to the SSA national headquarters — local offices process IRMAA appeals.",
          "Keep a complete copy of everything you send, including the postmark receipt or fax confirmation page.",
        ],
        fields: [
          { label: "Signature", note: "Wet ink or e-signature. SSA does not accept '/s/ name' typed signatures on this form.", verifyOnLiveForm: true },
          { label: "Date signed", note: "MM/DD/YYYY." },
          { label: "Daytime phone number", note: "SSA may call to clarify your estimate or request additional documentation." },
        ],
      },
      {
        title: "What happens next — timeline and follow-up",
        body: [
          "SSA targets 30 days for processing, but 60–90 days is common, especially in Q1 (lots of newly Medicare-eligible filers).",
          "If approved, SSA recalculates your premium and refunds any over-deduction. The refund appears as a credit in your next Social Security check or as a one-time deposit.",
          "If denied, you have 60 days to request Reconsideration (Form SSA-561). The reconsidered decision can be further appealed to an Administrative Law Judge.",
          "If you used a current-year estimate, you must file SSA-44 again next year if your actual MAGI ends up different — SSA does NOT automatically reconcile.",
        ],
      },
      {
        title: "Common reasons SSA-44 appeals are denied (and how to avoid each)",
        body: [
          "1. Event isn't a recognized LCE. Solution: confirm against the 8-event list before filing.",
          "2. Incomplete documentation. Solution: include the specific document type SSA requires for the LCE you claimed (the form's instructions list this on page 2).",
          "3. Estimated income is unsubstantiated. Solution: write a detailed statement showing the math — e.g., '$2,200/mo Social Security + $850/mo pension * 12 = $36,600 expected MAGI'.",
          "4. Filing status doesn't match the tax year. Solution: use the status for the year in Step 2, not today's status.",
          "5. Form version is outdated. Solution: download fresh from ssa.gov each year.",
        ],
      },
    ],
    sample: "p. 4 — Form SSA-44 with our example for 'work stoppage' showing exactly which figures go in the modified AGI box.",
  },
];

// Recommend guides based on the user's audit findings
function recommendedGuides(answers) {
  const isCouple = answers.marital === "couple";
  const hh = isCouple ? 2 : 1;
  const income = Number(answers.income) || 0;
  const annualIncome = income * 12;
  const fplAnnual = FPL_2026[hh];
  const assetTier = answers.assets;
  const assetsLow = assetTier === "low" || assetTier === "mid_low";
  const t = THRESHOLDS;
  const incomeLimit = (k) => isCouple ? t[k].incomeCouple : t[k].incomeSingle;

  const tags = new Set();
  // Always include the universal Medicare basics
  tags.add("medicare_enrollment");
  tags.add("medigap");
  tags.add("irmaa");
  // Conditional tags
  if (income <= incomeLimit("QMB") && assetsLow) tags.add("qmb");
  else if (income <= incomeLimit("SLMB") && assetsLow) tags.add("slmb");
  else if (income <= incomeLimit("QI") && assetsLow) tags.add("qi");
  if (income <= incomeLimit("LIS") && (assetTier !== "high")) tags.add("lis");
  if (annualIncome <= fplAnnual * 3.0 && answers.state === "MD") tags.add("spdap");
  if (answers.veteran === "yes") tags.add("va");

  return GUIDE_CATALOG.filter(g => g.relatedTo.some(r => tags.has(r))).map(g => g.id);
}

// ── PDF generator (client-side, no dependencies) ────────────────────────
// Builds a real, openable PDF 1.4 document from a guide structure.
// Supports multi-page output and renders rich step content (body + fields)
// with personalization tokens filled from the user's audit answers.
// Production should swap in pdf-lib/jsPDF for screenshots, fonts, layouts.

// Resolve personalization tokens like {{stateName}} from the user's answers.
function buildPersonalizationContext(answers) {
  const a = answers || {};
  const stateData = getStateData(a.state);
  const stateName = stateData ? stateData.name : "your state";
  const iep = getIEPWindow(a);
  const by = Number(a.birth_year);
  const bm = Number(a.birth_month);
  const birthDate = (by && bm) ? `${MONTHS[bm - 1]} ${by}` : "your birth date";
  const maritalLabel = a.marital === "couple" ? "married couple" : "single";

  let employerCoverageGuidance = "Your employer-coverage situation determines whether you need Part B now.";
  let employerCoverageAnswer = "";
  if (a.employer_coverage === "yes_large") {
    employerCoverageGuidance = "You have active 20+-employee employer coverage. You can delay Part B without penalty and use a Special Enrollment Period (8 months) when that coverage ends. Form CMS-L564 documents this for SSA.";
    employerCoverageAnswer = "Yes — 20+ employees";
  } else if (a.employer_coverage === "yes_small") {
    employerCoverageGuidance = "You have small-employer coverage (<20 employees). Medicare becomes the primary payer at 65 — your employer plan may pay only what Medicare would have paid. Most people in this situation should enroll in Part B during their IEP.";
    employerCoverageAnswer = "Yes — under 20 employees";
  } else if (a.employer_coverage === "no") {
    employerCoverageGuidance = "You don't have employer coverage. Plan to enroll in both Part A and Part B during your IEP — there's no SEP fallback if you delay.";
    employerCoverageAnswer = "No";
  }

  let nextStepsGuidance = "Your Medicare card will arrive in about 3 weeks.";
  if (iep) {
    nextStepsGuidance = `Coverage starts ${iep.partBStartLabel}. Your red-white-blue Medicare card arrives ~3 weeks before that date.`;
  }

  // State-specific MSP guidance for the 8 seeded states. Falls back to generic
  // language for the other 42. Inlined here per CLAUDE.md decision #7 (avoid
  // splitting MSP into 7+ separate SKUs — easier to maintain in one place).
  const STATE_MSP_NOTES = {
    MD: "Maryland: apply via MD THINK at mymdthink.maryland.gov (the universal benefits portal — also handles SNAP). MD has streamlined enrollment: if you qualify for QMB, you're auto-enrolled in Extra Help. Decision typically arrives in 30 days. Phone help: 1-800-332-6347.",
    CA: "California: apply through your county's Medi-Cal office (Medi-Cal is California's Medicaid program). Online at benefitscal.com or in person at any county social services office. CA's MSP is called the 'Medicare Savings Program' and is processed through Medi-Cal. Decision: 30–45 days. CA Medicare Advocacy: 1-800-434-0222.",
    NY: "New York: apply through your county's Department of Social Services or online at nystateofhealth.ny.gov. NY's MSP processing is generally faster than other states (often 2–3 weeks). EPIC (separate NY-only Rx benefit) auto-coordinates if you also qualify for that. Phone: 1-800-541-2831.",
    FL: "Florida: apply through ACCESS Florida at myaccessflorida.com. FL's MSP review is typically 30 days but backlogs in Q1 can extend it to 60. The state also runs a separate prescription assistance program — ask the caseworker about Florida Discount Drug Card during your application. Phone: 1-866-762-2237.",
    TX: "Texas: apply via YourTexasBenefits.com (the unified portal for SNAP, MSP, Medicaid, and TANF). TX requires interview by phone or in-person — schedule it when you submit. Decision: 30–45 days. 2-1-1 Texas connects you to a local benefits counselor.",
    PA: "Pennsylvania: apply via COMPASS at compass.state.pa.us (the universal benefits portal). PA also runs PACE/PACENET — separate state Rx programs that auto-coordinate with MSP approval. PA's processing time is among the fastest in the country (2–4 weeks). Phone: 1-800-692-7462.",
    VA: "Virginia: apply via CommonHelp at commonhelp.virginia.gov. VA processes MSP through local Department of Social Services offices — your case is assigned to your county's office. Decision: 30–45 days. Phone: 1-855-242-8282.",
    DC: "DC: apply via the DC Medicaid portal at dchealthlink.com or in person at the Economic Security Administration. DC has the most generous MSP income limits in the region — verify against the current DC-specific thresholds, which exceed federal levels. Phone: 202-727-5355.",
  };
  let stateMspGuidance = `${stateName}'s Medicaid agency is your starting point.`;
  if (a.state && STATE_MSP_NOTES[a.state]) {
    stateMspGuidance = STATE_MSP_NOTES[a.state];
  } else if (stateData && stateData.mspApplyUrl) {
    stateMspGuidance = `Apply at ${stateData.mspApplyUrl}. ${stateName}'s Medicaid agency processes the application. Detailed state-specific guidance for ${stateName} is coming soon — for now, your local SHIP counselor (free at shiphelp.org) is the best resource.`;
  }

  const monthlyIncome = Number(a.income) || 0;
  const annualIncome = monthlyIncome > 0 ? `$${(monthlyIncome * 12).toLocaleString()}` : "your annual income";
  const isCouple = a.marital === "couple";

  return {
    stateName,
    birthDate,
    maritalLabel,
    partBStartLabel: iep ? iep.partBStartLabel : "the first day of your birth month",
    iepStart: iep ? iep.startLabel : "3 months before your 65th birthday",
    iepEnd: iep ? iep.endLabel : "3 months after your 65th birthday",
    mspApplyUrl: stateData && stateData.mspApplyUrl ? stateData.mspApplyUrl : "your state Medicaid portal",
    stateMspGuidance,
    employerCoverageGuidance,
    employerCoverageAnswer,
    nextStepsGuidance,
    currentYear: String(new Date().getFullYear()),
    annualIncome,
    filingStatusSingle: isCouple ? "" : "(check this — you're filing single)",
    filingStatusJoint: isCouple ? "(check this — you're married filing jointly)" : "",
  };
}

function fillTokens(text, ctx) {
  if (!text) return text;
  return String(text).replace(/\{\{(\w+)\}\}/g, (_, key) => (ctx[key] !== undefined ? ctx[key] : `{{${key}}}`));
}

function buildPdfBytes(guide, buyerName, buyerEmail, answers) {
  const ctx = buildPersonalizationContext(answers);
  const lines = [];

  // Title page
  lines.push({ size: 22, bold: true, text: guide.name });
  lines.push({ size: 11, italic: true, text: "A Cairn Step-by-Step Guide", spaceAfter: 18 });
  lines.push({ size: 12, text: guide.blurb, spaceAfter: 24 });
  lines.push({ size: 10, text: `${guide.pages} pages | ${guide.timeToApply}`, spaceAfter: 8 });
  lines.push({ size: 10, italic: true, text: `Personalized for ${buyerName || "You"} | ${buyerEmail || ""}`, spaceAfter: 8 });
  if (guide.verified) lines.push({ size: 9, italic: true, text: `Last verified: ${guide.verified}`, spaceAfter: 22 });

  // What's inside
  lines.push({ size: 14, bold: true, text: "What's inside", spaceAfter: 10 });
  guide.sections.forEach((s, i) => {
    lines.push({ size: 11, text: `${i + 1}. ${s}`, spaceAfter: 4 });
  });
  lines.push({ size: 0, text: "", spaceAfter: 18 });

  // Detailed steps (if the guide has them — body + field-by-field)
  if (Array.isArray(guide.steps) && guide.steps.length > 0) {
    lines.push({ pageBreak: true });
    lines.push({ size: 16, bold: true, text: "Step-by-step walkthrough", spaceAfter: 12 });
    guide.steps.forEach((s, i) => {
      lines.push({ size: 13, bold: true, text: `${i + 1}. ${fillTokens(s.title, ctx)}`, spaceAfter: 6 });
      if (Array.isArray(s.body)) {
        s.body.forEach(b => {
          lines.push({ size: 11, text: fillTokens(b, ctx), spaceAfter: 6 });
        });
      }
      if (Array.isArray(s.fields) && s.fields.length > 0) {
        lines.push({ size: 11, italic: true, text: "Fields on this screen:", spaceAfter: 4 });
        s.fields.forEach(f => {
          const label = fillTokens(f.label, ctx);
          const value = f.value ? ` — ${fillTokens(f.value, ctx)}` : "";
          lines.push({ size: 11, bold: true, text: `  • ${label}${value}`, spaceAfter: 2 });
          if (f.note) lines.push({ size: 10, italic: true, text: `    ${fillTokens(f.note, ctx)}`, spaceAfter: 4 });
        });
      }
      lines.push({ size: 0, text: "", spaceAfter: 12 });
    });
  }

  // Sample preview (kept for parity with the storefront preview text)
  lines.push({ size: 12, bold: true, text: "Sample preview", spaceAfter: 6 });
  lines.push({ size: 10, italic: true, text: guide.sample, spaceAfter: 18 });

  // Footer note
  lines.push({ size: 9, italic: true, text: "(This Cairn guide is a starting point. Government portals change frequently — verify each screen against what you actually see and trust the live form over this PDF if they disagree.)", spaceAfter: 12 });
  lines.push({ size: 9, text: "Updated annually | Free updates for 12 months from purchase", spaceAfter: 4 });
  lines.push({ size: 9, text: "(c) 2026 Cairn | Not affiliated with or endorsed by Medicare or any government agency." });

  // Render lines into one or more page streams.
  const PAGE_TOP = 760;
  const PAGE_BOTTOM = 60;
  const pageStreams = [];
  let stream = "BT\n";
  let y = PAGE_TOP;
  const startNewPage = () => {
    stream += "ET\n";
    pageStreams.push(stream);
    stream = "BT\n";
    y = PAGE_TOP;
  };

  for (const line of lines) {
    if (line.pageBreak) { startNewPage(); continue; }
    if (line.text === "" || line.text == null) { y -= (line.spaceAfter || 12); continue; }
    const fontKey = line.bold ? "/F2" : line.italic ? "/F3" : "/F1";
    const fontSize = line.size || 11;
    const charsPerLine = Math.max(20, Math.floor(540 / (fontSize * 0.55)));
    const paragraphs = String(line.text).split("\n");
    const wrapped = [];
    for (const p of paragraphs) {
      const words = p.split(" ");
      let curLine = "";
      for (const w of words) {
        if ((curLine + " " + w).length > charsPerLine) {
          wrapped.push(curLine);
          curLine = w;
        } else {
          curLine = curLine ? curLine + " " + w : w;
        }
      }
      if (curLine) wrapped.push(curLine);
    }

    for (const wl of wrapped) {
      if (y < PAGE_BOTTOM) startNewPage();
      const escaped = wl.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
      stream += `${fontKey} ${fontSize} Tf\n`;
      stream += `1 0 0 1 60 ${y} Tm\n`;
      stream += `(${escaped}) Tj\n`;
      y -= fontSize * 1.4;
    }
    y -= (line.spaceAfter || 4);
  }
  stream += "ET\n";
  pageStreams.push(stream);

  // Assemble PDF (PDF 1.4) — multi-page.
  // Object layout: 1=Catalog, 2=Pages, then for each page: PageObj + ContentObj.
  // Then 3 font objects at the end.
  let pdf = "%PDF-1.4\n";
  const offsets = [];
  function addObj(s) { offsets.push(pdf.length); pdf += s; }
  const numPages = pageStreams.length;
  const pageObjStartId = 3; // page objects start at object id 3
  const contentObjStartId = pageObjStartId + numPages;
  const fontF1Id = contentObjStartId + numPages;
  const fontF2Id = fontF1Id + 1;
  const fontF3Id = fontF2Id + 1;

  addObj("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  const kidsList = Array.from({ length: numPages }, (_, i) => `${pageObjStartId + i} 0 R`).join(" ");
  addObj(`2 0 obj\n<< /Type /Pages /Kids [${kidsList}] /Count ${numPages} >>\nendobj\n`);
  for (let i = 0; i < numPages; i++) {
    const pageId = pageObjStartId + i;
    const contentId = contentObjStartId + i;
    addObj(`${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontF1Id} 0 R /F2 ${fontF2Id} 0 R /F3 ${fontF3Id} 0 R >> >> >>\nendobj\n`);
  }
  for (let i = 0; i < numPages; i++) {
    const contentId = contentObjStartId + i;
    const s = pageStreams[i];
    const sBytes = new TextEncoder().encode(s);
    addObj(`${contentId} 0 obj\n<< /Length ${sBytes.length} >>\nstream\n${s}endstream\nendobj\n`);
  }
  addObj(`${fontF1Id} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);
  addObj(`${fontF2Id} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`);
  addObj(`${fontF3Id} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>\nendobj\n`);

  const xrefOffset = pdf.length;
  const totalObjs = offsets.length + 1; // +1 for the free entry
  pdf += `xref\n0 ${totalObjs}\n0000000000 65535 f \n`;
  for (const o of offsets) pdf += String(o).padStart(10, "0") + " 00000 n \n";
  pdf += `trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

function downloadPdf(guide, buyerName, buyerEmail, answers) {
  try {
    const bytes = buildPdfBytes(guide, buyerName, buyerEmail, answers);
    // Convert bytes to base64 for a data URL (iOS-safe inside sandboxed iframes)
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);
    const dataUrl = `data:application/pdf;base64,${base64}`;
    const filename = `Cairn-Guide-${guide.id}.pdf`;

    const ua = navigator.userAgent || "";
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;

    if (isIOS) {
      // iOS: open data URL in new window — Safari renders PDF inline,
      // user can then use the share sheet to save to Files
      const w = window.open();
      if (w) {
        w.document.write(
          `<html><head><title>${guide.name}</title></head>` +
          `<body style="margin:0;background:#333"><embed src="${dataUrl}" type="application/pdf" width="100%" height="100%" style="height:100vh"/></body></html>`
        );
        w.document.close();
      } else {
        // Popup blocked — navigate same window as last resort
        window.location.href = dataUrl;
      }
      return;
    }

    // Desktop / Android: anchor download
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (e) {
    console.error("PDF generation error:", e);
    alert("Couldn't generate PDF in this preview. Try opening on desktop, or contact support if this persists.\n\nError: " + e.message);
  }
}

function GuideStore({ answers, onBack, onRestart }) {
  const recommended = useMemo(() => new Set(recommendedGuides(answers)), [answers]);
  const [cart, setCart] = useState([]);
  const [previewing, setPreviewing] = useState(null);
  const [stage, setStage] = useState("browse"); // browse | checkout | payment | done
  const [contact, setContact] = useState({ email: "", name: "" });
  const [payment, setPayment] = useState({ card: "", expiry: "", cvc: "", zip: "" });
  const [processing, setProcessing] = useState(false);

  const toggleCart = (id) => {
    setCart(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id]);
  };

  const basePrice = 19;
  const bundlePrice = 49;
  const completePrice = 79;
  const recommendedCount = recommended.size;
  const cartTotal = cart.length === 0 ? 0
    : cart.length === 1 ? basePrice
    : cart.length >= recommendedCount ? completePrice
    : cart.length >= 3 ? bundlePrice
    : cart.length * basePrice;

  // Tappable pricing-tier handlers
  const recommendedIds = useMemo(() => GUIDE_CATALOG.filter(g => recommended.has(g.id)).map(g => g.id), [recommended]);
  const applySingleTier = () => setCart(cart.length === 1 ? cart : (recommendedIds[0] ? [recommendedIds[0]] : [GUIDE_CATALOG[0].id]));
  const applyBundleTier = () => setCart(recommendedIds.slice(0, 3).length >= 3 ? recommendedIds.slice(0, 3) : GUIDE_CATALOG.slice(0, 3).map(g => g.id));
  const applyCompleteTier = () => setCart(recommendedIds);
  const activeTier = cart.length === 0 ? null : cart.length === 1 ? "single" : cart.length >= recommendedCount ? "complete" : cart.length >= 3 ? "bundle" : null;

  // Suggested tier based on the user's recommended-guide count.
  // Mirrors the "Suggested based on your answers" pattern from the priority
  // question — only applies when the user hasn't actively picked a tier yet.
  // Default is the bundle ($49) — the right call for the typical user with
  // 3-4 universal + conditional guides recommended.
  const suggestedTier = recommendedCount >= 5 ? "complete"
    : recommendedCount <= 1 ? "single"
    : "bundle";

  // Group guides into three categories for clearer hierarchy
  const recommendedGuidesList = GUIDE_CATALOG.filter(g => recommended.has(g.id));
  const universalGuidesList = GUIDE_CATALOG.filter(g => !recommended.has(g.id) && g.universal);
  const otherGuidesList = GUIDE_CATALOG.filter(g => !recommended.has(g.id) && !g.universal);
  const [showOtherGuides, setShowOtherGuides] = useState(false);

  // ─── DONE STAGE ─────────────────────────────────────────────────
  if (stage === "done") {
    return (
      <div style={{ minHeight: "100vh", padding: "2rem 1.5rem" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem", paddingBottom: "1rem", borderBottom: `1px solid ${C.line}` }}>
            <Wordmark />
          </header>
          <div className="fade-up" style={{ textAlign: "center", paddingTop: "1.5rem" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "100%", background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
              <CheckCircle2 size={40} style={{ color: C.accent }} strokeWidth={1.5} />
            </div>
            <SectionLabel>Payment received · Guides ready</SectionLabel>
            <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(1.85rem, 4.5vw, 2.5rem)", lineHeight: 1.15, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: "1rem", color: C.ink }}>
              Thank you, {contact.name.split(" ")[0] || "friend"}.
            </h1>
            <p style={{ fontSize: "1rem", color: C.muted, lineHeight: 1.55, marginBottom: "2rem", maxWidth: "520px", margin: "0 auto 2rem" }}>
              Your {cart.length} {cart.length === 1 ? "guide is" : "guides are"} ready to download below. We'll also send a copy to <strong style={{ color: C.ink }}>{contact.email}</strong> — keep that email for your records and to access updates.
            </p>

            {/* Email simulation banner */}
            <div style={{ background: C.bg, border: `1px solid ${C.line}`, padding: "1rem 1.1rem", borderRadius: "2px", marginBottom: "1.5rem", display: "flex", gap: "0.65rem", alignItems: "flex-start", textAlign: "left" }}>
              <Mail size={16} style={{ color: C.faint, flexShrink: 0, marginTop: "0.15rem" }} />
              <p style={{ fontSize: "0.8rem", color: C.muted, lineHeight: 1.5, margin: 0 }}>
                <strong style={{ color: C.ink }}>Prototype note:</strong> in production, emailing your PDFs requires server-side delivery (e.g., SendGrid). For this demo, your guides download below directly.
              </p>
            </div>

            <div style={{ background: C.paper, border: `1px solid ${C.line}`, padding: "1.5rem", borderRadius: "2px", textAlign: "left", marginBottom: "2rem" }}>
              <p style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: C.faint, fontSize: "0.78rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>Your guides</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {cart.map((id, i) => {
                  const g = GUIDE_CATALOG.find(g => g.id === id);
                  return (
                    <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.85rem", padding: "0.85rem 0", borderBottom: i < cart.length - 1 ? `1px solid ${C.line}` : "none", fontSize: "0.92rem" }}>
                      <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flex: 1, minWidth: 0 }}>
                        <FileText size={16} style={{ color: C.accent, flexShrink: 0 }} />
                        <span style={{ color: C.ink, fontWeight: 500 }}>{g.name}</span>
                      </div>
                      <button
                        onClick={() => downloadPdf(g, contact.name, contact.email, answers)}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "0.4rem",
                          background: C.accent, color: "#fff",
                          border: "none", padding: "0.5rem 0.85rem",
                          fontSize: "0.83rem", fontWeight: 500, fontFamily: "inherit",
                          cursor: "pointer", borderRadius: "2px",
                          transition: "background 0.2s", flexShrink: 0,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = C.accentDark}
                        onMouseLeave={e => e.currentTarget.style.background = C.accent}
                      >
                        <Download size={13} /> Download PDF
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <p style={{ fontSize: "0.82rem", color: C.faint, marginBottom: "1.5rem", lineHeight: 1.5 }}>
              You'll get an email when these guides are updated. Free updates for 12 months.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={onRestart} className="secondary-btn" style={{ background: "none", border: `1px solid ${C.line}`, cursor: "pointer", color: C.muted, fontSize: "0.95rem", fontFamily: "inherit", padding: "0.85rem 1.5rem", borderRadius: "2px" }}>
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── PAYMENT STAGE ──────────────────────────────────────────────
  if (stage === "payment") {
    const cardValid = /^\d{13,19}$/.test(payment.card.replace(/\s/g, ""));
    const expiryValid = /^\d{2}\/\d{2}$/.test(payment.expiry);
    const cvcValid = /^\d{3,4}$/.test(payment.cvc);
    const zipValid = /^\d{5}$/.test(payment.zip);
    const canPay = cardValid && expiryValid && cvcValid && zipValid && !processing;

    const handlePay = () => {
      setProcessing(true);
      setTimeout(() => {
        setProcessing(false);
        setStage("done");
        window.scrollTo(0, 0);
      }, 1500);
    };

    return (
      <div style={{ minHeight: "100vh", padding: "2rem 1.5rem" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", paddingBottom: "1rem", borderBottom: `1px solid ${C.line}` }}>
            <Wordmark />
            <button onClick={() => setStage("checkout")} className="secondary-btn" disabled={processing} style={{ background: "none", border: "none", cursor: processing ? "not-allowed" : "pointer", color: C.faint, fontSize: "0.85rem", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.4rem", opacity: processing ? 0.5 : 1 }}>
              <ChevronLeft size={16} /> Back
            </button>
          </header>
          <div className="fade-up">
            <SectionLabel>Step 2 of 2 · Payment</SectionLabel>
            <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(1.85rem, 4.5vw, 2.5rem)", lineHeight: 1.15, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: "1.5rem", color: C.ink }}>
              Secure checkout
            </h1>

            <div style={{ background: "#fff8e8", border: "1px solid #d4a560", padding: "0.85rem 1rem", borderRadius: "2px", marginBottom: "1.25rem", display: "flex", gap: "0.55rem", alignItems: "flex-start" }}>
              <AlertCircle size={16} style={{ color: "#a07a30", flexShrink: 0, marginTop: "0.15rem" }} />
              <p style={{ fontSize: "0.82rem", color: "#5e4716", lineHeight: 1.45, margin: 0 }}>
                <strong>Demo mode:</strong> No real charge will be made. Use any test card number (e.g., <code style={{ background: "#fff", padding: "0 0.3rem", borderRadius: "2px" }}>4242 4242 4242 4242</code>). Production would integrate Stripe Checkout for PCI-compliant payments.
              </p>
            </div>

            <div style={{ background: C.paper, border: `1px solid ${C.line}`, padding: "1.25rem", borderRadius: "2px", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.95rem", color: C.muted }}>{cart.length} {cart.length === 1 ? "guide" : "guides"}</span>
                <span style={{ fontSize: "0.95rem", color: C.ink, fontWeight: 500 }}>${cartTotal}.00</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.5rem", borderTop: `1px solid ${C.line}` }}>
                <span style={{ fontSize: "1rem", color: C.ink, fontWeight: 600 }}>Total</span>
                <span style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: C.accent, fontSize: "1.3rem", fontWeight: 500 }}>${cartTotal}.00</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
              <Field label="Card number">
                <input
                  type="text"
                  inputMode="numeric"
                  value={payment.card}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 19);
                    const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
                    setPayment({ ...payment, card: formatted });
                  }}
                  placeholder="4242 4242 4242 4242"
                  style={inputStyle}
                  autoFocus
                />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <Field label="Expiry (MM/YY)">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={payment.expiry}
                    onChange={e => {
                      let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                      if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
                      setPayment({ ...payment, expiry: v });
                    }}
                    placeholder="12/28"
                    style={inputStyle}
                  />
                </Field>
                <Field label="CVC">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={payment.cvc}
                    onChange={e => setPayment({ ...payment, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    placeholder="123"
                    style={inputStyle}
                  />
                </Field>
              </div>
              <Field label="Billing ZIP">
                <input
                  type="text"
                  inputMode="numeric"
                  value={payment.zip}
                  onChange={e => setPayment({ ...payment, zip: e.target.value.replace(/\D/g, "").slice(0, 5) })}
                  placeholder="21403"
                  style={inputStyle}
                />
              </Field>
            </div>

            <div style={{ background: C.bg, border: `1px solid ${C.line}`, padding: "0.85rem 1rem", borderRadius: "2px", marginBottom: "1.5rem", display: "flex", gap: "0.55rem", alignItems: "center" }}>
              <Lock size={14} style={{ color: C.faint, flexShrink: 0 }} />
              <p style={{ fontSize: "0.78rem", color: C.muted, lineHeight: 1.45, margin: 0 }}>
                30-day money-back guarantee · Free guide updates for 12 months
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={() => setStage("checkout")} disabled={processing} className="secondary-btn" style={{ background: "none", border: "none", cursor: processing ? "not-allowed" : "pointer", color: C.faint, fontSize: "0.95rem", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.4rem", opacity: processing ? 0.5 : 1 }}>
                <ChevronLeft size={16} /> Back
              </button>
              <PrimaryButton onClick={handlePay} disabled={!canPay} large>
                {processing ? "Processing..." : `Pay $${cartTotal}`}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── CHECKOUT (CONTACT) STAGE ───────────────────────────────────
  if (stage === "checkout") {
    return (
      <div style={{ minHeight: "100vh", padding: "2rem 1.5rem" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", paddingBottom: "1rem", borderBottom: `1px solid ${C.line}` }}>
            <Wordmark />
            <button onClick={() => setStage("browse")} className="secondary-btn" style={{ background: "none", border: "none", cursor: "pointer", color: C.faint, fontSize: "0.85rem", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <ChevronLeft size={16} /> Back to guides
            </button>
          </header>
          <div className="fade-up">
            <SectionLabel>Step 1 of 2 · Your details</SectionLabel>
            <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(1.85rem, 4.5vw, 2.5rem)", lineHeight: 1.15, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: "1.5rem", color: C.ink }}>
              Where should we send them?
            </h1>

            <div style={{ background: C.paper, border: `1px solid ${C.line}`, padding: "1.25rem", borderRadius: "2px", marginBottom: "1.5rem" }}>
              <p style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: C.faint, fontSize: "0.78rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.85rem" }}>Order summary</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0", marginBottom: "0.5rem" }}>
                {cart.map((id, i) => {
                  const g = GUIDE_CATALOG.find(g => g.id === id);
                  return (
                    <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", fontSize: "0.9rem", borderBottom: i < cart.length - 1 ? `1px solid ${C.line}` : "none" }}>
                      <span style={{ color: C.muted }}>{g.name}</span>
                      <span style={{ color: C.faint, fontSize: "0.78rem", whiteSpace: "nowrap", flexShrink: 0 }}>{g.pages} pp</span>
                    </div>
                  );
                })}
              </div>
              {cart.length >= 3 && (
                <div style={{ background: C.accentSoft, padding: "0.5rem 0.75rem", borderRadius: "2px", fontSize: "0.82rem", color: C.accent, fontWeight: 500, marginTop: "0.75rem", marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Sparkles size={12} /> {cart.length >= recommendedCount ? "Complete-kit pricing applied" : "Bundle pricing applied"} — you saved ${cart.length * basePrice - cartTotal}
                </div>
              )}
              <div style={{ paddingTop: "0.85rem", borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: 600, color: C.ink }}>Total</span>
                <span style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: C.accent, fontSize: "1.4rem", fontWeight: 500 }}>${cartTotal}.00</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "1.5rem" }}>
              <Field label="Email" icon={<Mail size={16} />}>
                <input type="email" autoFocus value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} placeholder="you@example.com" style={inputStyle} />
              </Field>
              <Field label="Your name" icon={<User size={16} />}>
                <input type="text" value={contact.name} onChange={e => setContact({ ...contact, name: e.target.value })} placeholder="First and last" style={inputStyle} />
              </Field>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={() => setStage("browse")} className="secondary-btn" style={{ background: "none", border: "none", cursor: "pointer", color: C.faint, fontSize: "0.95rem", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <ChevronLeft size={16} /> Back
              </button>
              <PrimaryButton onClick={() => { setStage("payment"); window.scrollTo(0, 0); }} disabled={!contact.email.trim() || !contact.name.trim()} large>
                Continue to payment
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── BROWSE STAGE ───────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", padding: "2rem 1.5rem" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", paddingBottom: "1rem", borderBottom: `1px solid ${C.line}` }}>
          <Wordmark />
          <button onClick={onBack} className="secondary-btn" style={{ background: "none", border: "none", cursor: "pointer", color: C.faint, fontSize: "0.85rem", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <ChevronLeft size={16} /> Back to results
          </button>
        </header>

        <div className="fade-up">
          <SectionLabel>Step-by-step printable guides</SectionLabel>
          <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(2rem, 4.5vw, 2.75rem)", lineHeight: 1.1, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: "1rem", color: C.ink }}>
            Apply yourself, with help that <span style={{ fontStyle: "italic", color: C.accent }}>tells you exactly what to do.</span>
          </h1>
          <p style={{ fontSize: "1.05rem", color: C.muted, lineHeight: 1.55, marginBottom: "2rem" }}>
            Print-ready PDFs with annotated screenshots, large type, and every form field explained. Built for quiet kitchen-table reading.
          </p>

          {/* Tappable pricing tiers */}
          <div style={{ marginBottom: "2rem" }}>
            <p style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: C.faint, fontSize: "0.78rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.85rem" }}>
              Pricing — tap to apply
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.6rem" }}>
              {[
                { id: "single", price: "$19", qty: "1 guide", note: "Single program", apply: applySingleTier },
                { id: "bundle", price: "$49", qty: "3+ guides", note: "Bundle pricing", apply: applyBundleTier },
                { id: "complete", price: "$79", qty: `All ${recommendedCount} for you`, note: "Complete kit", apply: applyCompleteTier },
              ].map((p) => {
                const active = activeTier === p.id;
                const suggested = !active && !activeTier && suggestedTier === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={p.apply}
                    style={{
                      background: active ? C.accentSoft : C.paper,
                      border: `1px solid ${active ? C.accent : suggested ? C.accent : C.line}`,
                      borderLeft: active || suggested ? `4px solid ${C.accent}` : `1px solid ${C.line}`,
                      padding: active || suggested ? "0.95rem 0.95rem 0.95rem 0.8rem" : "0.95rem",
                      borderRadius: "2px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textAlign: "left",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                      <span style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: C.accent, fontWeight: 600, fontSize: "1.1rem", lineHeight: 1 }}>{p.price}</span>
                      {active && <Check size={14} style={{ color: C.accent }} />}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: C.ink, fontWeight: 500 }}>{p.qty}</div>
                    <div style={{ fontSize: "0.76rem", color: C.faint, marginTop: "0.15rem" }}>{p.note}</div>
                    {suggested && (
                      <div style={{ marginTop: "0.45rem", display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.7rem", color: C.accent, fontFamily: "'Newsreader', serif", fontStyle: "italic", letterSpacing: "0.05em" }}>
                        <Sparkles size={10} /> Suggested for you
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Render helper — shared markup for each guide card */}
          {(() => {
            const renderCard = (g) => {
              const inCart = cart.includes(g.id);
              const isRecommended = recommended.has(g.id);
              const expanded = previewing === g.id;
              return (
                <div key={g.id} style={{ background: C.paper, border: `1px solid ${C.line}`, borderLeft: inCart ? `4px solid ${C.accent}` : `1px solid ${C.line}`, borderRadius: "2px", overflow: "hidden", transition: "border-color 0.2s" }}>
                  <div style={{ padding: "1.1rem 1.25rem" }}>
                    {isRecommended && (
                      <div style={{ fontSize: "0.65rem", color: C.accent, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Sparkles size={10} /> Recommended for you
                      </div>
                    )}
                    <h3 style={{ fontFamily: "'Newsreader', serif", fontSize: "1.1rem", fontWeight: 600, color: C.ink, margin: "0 0 0.45rem 0", lineHeight: 1.3 }}>{g.name}</h3>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center", color: C.faint, fontSize: "0.78rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><FileText size={11} /> {g.pages} pages</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><Clock size={11} /> {g.timeToApply}</span>
                    </div>
                    <p style={{ fontSize: "0.88rem", color: C.muted, lineHeight: 1.5, margin: "0 0 0.85rem 0" }}>{g.blurb}</p>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                      <button onClick={() => toggleCart(g.id)} style={{
                        background: inCart ? C.ink : C.paper,
                        color: inCart ? C.bg : C.ink,
                        border: `1px solid ${inCart ? C.ink : C.line}`,
                        padding: "0.5rem 0.95rem", fontSize: "0.85rem",
                        fontFamily: "inherit", fontWeight: 500, cursor: "pointer",
                        borderRadius: "2px", display: "inline-flex",
                        alignItems: "center", gap: "0.4rem", transition: "all 0.15s",
                      }}>
                        {inCart ? <><Check size={13} /> Added</> : <><Plus size={13} /> Add to cart</>}
                      </button>
                      <button onClick={() => setPreviewing(expanded ? null : g.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: "0.82rem", fontFamily: "inherit", padding: "0.5rem 0.5rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                        {expanded ? "Hide" : "Preview contents"} {expanded ? <Minus size={11} /> : <Plus size={11} />}
                      </button>
                    </div>
                  </div>
                  {expanded && (
                    <div style={{ padding: "0 1.25rem 1.25rem", borderTop: `1px solid ${C.line}`, background: C.bg }}>
                      <div style={{ paddingTop: "1rem" }}>
                        <p style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: C.faint, fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.65rem" }}>What's inside</p>
                        <ol style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                          {g.sections.map((s, si) => (
                            <li key={si} style={{ fontSize: "0.85rem", color: C.muted, lineHeight: 1.5 }}>{s}</li>
                          ))}
                        </ol>
                        <div style={{ marginTop: "1rem", padding: "0.75rem 0.95rem", background: C.accentSoft, borderLeft: `3px solid ${C.accent}`, borderRadius: "2px" }}>
                          <div style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: C.accent, fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.35rem" }}>Sample preview</div>
                          <p style={{ fontSize: "0.83rem", color: C.ink, lineHeight: 1.5, margin: 0 }}>{g.sample}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            };

            return (
              <div style={{ marginBottom: "1.5rem" }}>
                {/* SECTION 1 — Recommended for you */}
                {recommendedGuidesList.length > 0 && (
                  <div style={{ marginBottom: "2rem" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem", marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: `1px solid ${C.line}` }}>
                      <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: "1rem", fontWeight: 600, color: C.ink, margin: 0 }}>
                        Recommended based on your audit
                      </h2>
                      <span style={{ fontSize: "0.78rem", color: C.faint, fontFamily: "'Newsreader', serif", fontStyle: "italic" }}>
                        {recommendedGuidesList.length} {recommendedGuidesList.length === 1 ? "guide" : "guides"}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {recommendedGuidesList.map(renderCard)}
                    </div>
                  </div>
                )}

                {/* SECTION 2 — Useful for everyone on Medicare */}
                {universalGuidesList.length > 0 && (
                  <div style={{ marginBottom: "2rem" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem", marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: `1px solid ${C.line}` }}>
                      <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: "1rem", fontWeight: 600, color: C.ink, margin: 0 }}>
                        Useful for everyone on Medicare
                      </h2>
                      <span style={{ fontSize: "0.78rem", color: C.faint, fontFamily: "'Newsreader', serif", fontStyle: "italic" }}>
                        {universalGuidesList.length} {universalGuidesList.length === 1 ? "guide" : "guides"}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.82rem", color: C.muted, lineHeight: 1.5, marginBottom: "0.85rem", margin: "0 0 0.85rem 0" }}>
                      These cover decisions almost every Medicare beneficiary makes — regardless of what your audit recommended.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {universalGuidesList.map(renderCard)}
                    </div>
                  </div>
                )}

                {/* SECTION 3 — Other guides (collapsed) */}
                {otherGuidesList.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowOtherGuides(!showOtherGuides)}
                      style={{
                        width: "100%",
                        background: "none",
                        border: `1px dashed ${C.line}`,
                        padding: "0.85rem 1rem",
                        borderRadius: "2px",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        color: C.muted,
                        fontSize: "0.88rem",
                        marginBottom: showOtherGuides ? "0.75rem" : 0,
                      }}
                    >
                      <span>
                        {showOtherGuides ? "Hide" : "Show"} other guides ({otherGuidesList.length})
                        <span style={{ display: "block", fontSize: "0.76rem", color: C.faint, marginTop: "0.2rem", fontStyle: "italic" }}>
                          For programs your audit didn't flag for you, but available if you want them.
                        </span>
                      </span>
                      {showOtherGuides ? <Minus size={14} /> : <Plus size={14} />}
                    </button>
                    {showOtherGuides && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {otherGuidesList.map(renderCard)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Sticky cart bar */}
      {cart.length > 0 && (
        <div style={{ position: "sticky", bottom: 0, background: C.paper, borderTop: `1px solid ${C.line}`, padding: "1rem 1.5rem", marginTop: "1.5rem", boxShadow: "0 -4px 20px rgba(15, 58, 61, 0.08)" }}>
          <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.85rem", color: C.muted }}>{cart.length} {cart.length === 1 ? "guide" : "guides"} in cart</div>
              <div style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: C.accent, fontSize: "1.2rem", fontWeight: 600, lineHeight: 1.2 }}>${cartTotal}.00</div>
            </div>
            <PrimaryButton onClick={() => { setStage("checkout"); window.scrollTo(0, 0); }}>Checkout</PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
