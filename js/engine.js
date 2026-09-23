/** Icon Water STD-SPE-G-011 Version 5 grade and flow engine. No iteration library:
 *  depth is a short fixed Newton loop, the same one the workbook uses. */

export const DNS = [150, 225, 300, 375, 450, 525, 600, 675, 750, 900];

export const MATERIALS = [
  { id: "vc", label: "VC, DICL, SCL — n = 0.012", n: 0.012 },
  { id: "plastic", label: "PVC, PE, GRP — n = 0.011", n: 0.011 },
];

export function defaultParams() {
  return {
    n: 0.012,
    kSss: 0.0338,
    kSc: 0.0135,
    fQ: 0.75,
    vMax: 3,
    pcc: 180,
    pfA: 5.83,
    pfB: 0.1,
    gwiRate: 0.01875,
    portionWet: 0.75,
    rdiCoef: 0.028,
    rdiC: 1.2,
    iHour: 21.4,
    iAreaRef: 40,
    iAreaExp: 0.12,
    fCont: 1.5,
    densRef: 150,
    densLow: 25,
    densHigh: 80,
    epLow: 3.5,
    epMed: 2.5,
    epHigh: 2,
    tpf: 0,
  };
}

export function examplePrecincts() {
  return [
    { dwellings: 78, nsa: 1.54, on: false },
    { dwellings: 207, nsa: 2.25, on: true },
    { dwellings: 156, nsa: 0.8, on: false },
    { dwellings: 124, nsa: 0.44, on: false },
    { dwellings: 159, nsa: 0.84, on: false },
    { dwellings: 175, nsa: 1.38, on: false },
    { dwellings: 121, nsa: 1.04, on: false },
    { dwellings: 42, nsa: 0.358, on: false },
    { dwellings: 30, nsa: 0.71, on: false },
    { dwellings: 0, nsa: 3.19, on: false },
  ];
}

export function exampleJob() {
  return {
    version: 1,
    job: "Example subdivision",
    designer: "",
    date: "",
    params: defaultParams(),
    precincts: examplePrecincts(),
    solve: "grade",
    dn: 225,
    grade: 1,
    houses: null,
  };
}

function clampTheta(th) {
  return Math.min(2 * Math.PI - 1e-6, Math.max(1e-6, th));
}

function geom(D, th) {
  const A = (D * D * (th - Math.sin(th))) / 8;
  const R = (D / 4) * (1 - Math.sin(th) / th);
  const y = (D / 2) * (1 - Math.cos(th / 2));
  return { A, R, y };
}

/** Solve A * R^m = T for the central angle. m = 1/6 tractive, 0 area, 2/3 Manning. */
export function solvePower(D, T, m, nIt = 14) {
  if (!(T > 0) || !(D > 0)) return 0;
  const k = 48 * 24 ** m;
  let th = clampTheta((T * k / D ** (2 + m)) ** (1 / (3 + 2 * m)));
  for (let i = 0; i < nIt; i += 1) {
    const { A, R } = geom(D, th);
    const f = m === 0 ? A : A * R ** m;
    const p = (th * (1 - Math.cos(th)) + m * (Math.sin(th) - th * Math.cos(th))) / (th - Math.sin(th));
    th = clampTheta(th * (T / f) ** (1 / Math.max(p, 0.25)));
  }
  return th;
}

/** Solve hydraulic radius = Rtarget. Returns 0 if the pipe cannot be that flat. */
export function solveRadius(D, Rtarget, nIt = 14) {
  if (!(Rtarget > 0) || !(D > 0) || Rtarget > D / 4 + 1e-12) return 0;
  let th = clampTheta(Math.sqrt((24 * Rtarget) / D));
  for (let i = 0; i < nIt; i += 1) {
    const R = (D / 4) * (1 - Math.sin(th) / th);
    const dR = ((D / 4) * (Math.sin(th) - th * Math.cos(th))) / th ** 2;
    const p = (th / R) * dR;
    th = clampTheta(th * (Rtarget / R) ** (1 / Math.max(p, 0.25)));
  }
  return th;
}

export function epPerDwelling(dwellingsPerHa, p) {
  if (!(dwellingsPerHa >= 0)) return 0;
  if (dwellingsPerHa < p.densLow) return p.epLow;
  if (dwellingsPerHa <= p.densHigh) return p.epMed;
  return p.epHigh;
}

export function dn150Grade(houses) {
  if (!(houses >= 1)) return null;
  if (houses >= 35) return 0.7;
  if (houses >= 28) return 0.8;
  if (houses >= 18) return 0.9;
  if (houses >= 12) return 1;
  if (houses >= 7) return 1.1;
  if (houses >= 2) return 1.2;
  return 1.25;
}

function rainfallIntensity(areaHa, p) {
  if (!(areaHa > 0)) return 0;
  return p.iHour * (p.iAreaRef / areaHa) ** p.iAreaExp * p.fCont;
}

/** One precinct, for the table. Not added into the pipe — the pipe uses combine(). */
export function precinctRow(row, p) {
  const dwellings = Number(row.dwellings) || 0;
  const nsa = Number(row.nsa) || 0;
  const density = nsa > 0 ? dwellings / nsa : 0;
  const epu = dwellings > 0 ? epPerDwelling(density, p) : 0;
  const ep = epu * dwellings;
  const adwf = (ep * p.pcc) / 86400;
  const pdwf = ep > 0 ? (p.pfA * adwf) / ep ** p.pfB : 0;
  const gwi = p.gwiRate * nsa * p.portionWet;
  const epDensity = nsa > 0 ? ep / nsa : 0;
  const aeff = nsa > 0 ? nsa * Math.min(1, Math.sqrt(epDensity / p.densRef)) : 0;
  const intensity = rainfallIntensity(nsa, p);
  const rdi = p.rdiCoef * p.rdiC * intensity * aeff;
  return { ...row, dwellings, nsa, density, epu, ep, adwf, pdwf, gwi, rdi, pwwf: pdwf + gwi + rdi };
}

/** Selected precincts as one catchment. Peaking is on the total EP, not the sum of peaks. */
export function combine(precincts, p) {
  const rows = precincts.map((row) => precinctRow(row, p));
  const on = rows.filter((row) => row.on);
  const dwellings = on.reduce((s, r) => s + r.dwellings, 0);
  const nsa = on.reduce((s, r) => s + r.nsa, 0);
  const ep = on.reduce((s, r) => s + r.ep, 0);
  const adwf = (ep * p.pcc) / 86400;
  const pdwf = ep > 0 ? (p.pfA * adwf) / ep ** p.pfB : 0;
  const gwi = p.gwiRate * nsa * p.portionWet;
  const epDensity = nsa > 0 ? ep / nsa : 0;
  const aeff = nsa > 0 ? nsa * Math.min(1, Math.sqrt(epDensity / p.densRef)) : 0;
  const intensity = rainfallIntensity(nsa, p);
  const rdi = p.rdiCoef * p.rdiC * intensity * aeff;
  const pwwf = pdwf + gwi + rdi;
  const qDmp = p.fQ * (pdwf + (2 / 3) * (Number(p.tpf) || 0));
  return { rows, dwellings, nsa, ep, adwf, pdwf, gwi, rdi, pwwf, intensity, qDmp, count: on.length };
}

function qFull(D, sPercent, n) {
  if (!(sPercent > 0)) return 0;
  const area = (Math.PI * D * D) / 4;
  const R = D / 4;
  return (1 / n) * area * R ** (2 / 3) * Math.sqrt(sPercent / 100) * 1000;
}

export function gradeRow(dn, flow, houses, p) {
  const D = dn / 1000;
  const q = flow.qDmp / 1000;
  const pdwf = flow.pdwf;
  const pwwf = flow.pwwf;
  const th1 = solvePower(D, q > 0 ? (q * p.n) / Math.sqrt(p.kSss / 100) : 0, 1 / 6);
  const th2 = solvePower(D, q > 0 ? (q * p.n) / Math.sqrt(p.kSc / 100) : 0, 1 / 6);
  const g1 = th1 ? geom(D, th1) : null;
  const g2 = th2 ? geom(D, th2) : null;
  const sss = g1 ? p.kSss / g1.R : null;
  const ssc = g2 ? p.kSc / g2.R : null;
  const abs = dn <= 150 ? dn150Grade(houses) : 80 / dn;
  const smin = dn <= 150 ? abs : Math.max(sss || 0, ssc || 0, abs || 0);
  let criterion = "no flow";
  if (dn <= 150 && abs) criterion = "DN150 Table IW.4";
  else if (smin > 0 && abs != null && Math.abs(smin - abs) < 1e-9) criterion = "Absolute minimum (80/ID)";
  else if (sss != null && Math.abs(smin - sss) < 1e-6) criterion = "Slime control";
  else if (ssc != null) criterion = "Self-cleansing";

  const At = pdwf > 0 ? pdwf / 1000 / p.vMax : 0;
  const fullA = (Math.PI * D * D) / 4;
  const th3 = At > 0 && At < fullA ? solvePower(D, At, 0) : 0;
  const g3 = th3 ? geom(D, th3) : null;
  let smax = null;
  let smaxWhy = "Needs a dry-weather flow";
  if (pdwf > 0 && At >= fullA) {
    smaxWhy = "Dry-weather peak is already faster than 3.0 m/s when this pipe is full";
  } else if (g3) {
    smax = ((p.vMax * p.n) / g3.R ** (2 / 3)) ** 2 * 100;
    smaxWhy = "3.0 m/s at peak dry-weather flow";
  }
  const full = smin > 0 ? qFull(D, smin, p.n) : 0;
  const yOverD = g1 ? g1.y / D : 0;
  let status = "enter a catchment";
  if (flow.count === 0 || !(pdwf > 0)) status = "tick the precincts upstream";
  else if (yOverD > 0.95) status = "pipe too small for this dry-weather flow";
  else if (smax != null && smax < smin) status = "maximum grade is flatter than the minimum";
  else if (!(pwwf > 0)) status = "no wet-weather flow";
  else if (pwwf > full) status = "surcharged at the minimum grade";
  else status = "OK";
  return {
    dn, D, sss, ssc, abs, smin, criterion, smax, smaxWhy, qFull: full,
    yMm: g1 ? g1.y * 1000 : null, yOverD, v: g1 && g1.A ? (flow.qDmp / 1000) / g1.A : null,
    pwwfRatio: full > 0 ? pwwf / full : null, status,
  };
}

export function grades(flow, houses, p) {
  return DNS.map((dn) => gradeRow(dn, flow, houses, p));
}

/** Flow at which the entered grade is exactly S = K/Rp. */
export function flowAtGrade(dn, gradePct, k, p) {
  const D = dn / 1000;
  if (!(gradePct > 0)) return { ok: false, reason: "enter a grade" };
  const R = k / gradePct;
  if (R > D / 4) return { ok: false, reason: "flatter than a full pipe can satisfy" };
  const th = solveRadius(D, R);
  if (!th) return { ok: false, reason: "could not resolve the depth" };
  const { A } = geom(D, th);
  const qDmp = (1 / p.n) * A * R ** (2 / 3) * Math.sqrt(gradePct / 100) * 1000;
  const pdwf = qDmp / p.fQ - (2 / 3) * (Number(p.tpf) || 0);
  return { ok: true, qDmp, pdwf, yOverD: geom(D, th).y / D };
}

export function diametersForGrade(rows, availableGrade, pwwf) {
  return rows.filter((row) => {
    if (!(availableGrade > 0) || !(row.smin > 0) || row.smin > availableGrade + 1e-9) return false;
    if (row.smax != null && row.smax < row.smin) return false;
    if (pwwf > 0 && row.qFull < pwwf) return false;
    return true;
  });
}

export function fmt(n, digits = 2) {
  if (n == null || Number.isNaN(n)) return "—";
  return Number(n).toLocaleString("en-AU", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}
