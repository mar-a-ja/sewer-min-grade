# Minimum sewer grade calculator — background research notes

Status: **reconciled against the Word note and the original spreadsheet** (2026-09-23).
The job is **Icon Water (ACT)**, not a generic NSW sheet. The Word note
(`230508 - Icon Sewer Min Grade Mannings Equation - DC.docx`) asks how to solve
**STD-SPE-G-011 Equation IW.5.5.3.2** together with Manning. That equation is the
"relationship between one variable and the others".

Working calculator (original file left untouched):
`Sewer Grade Calculator - Icon Water ACT (explicit, no Wolfram).xlsx`

Confirmed from the published supplement, saved at
`sources/icon-water/STD-SPE-G-011 WSA 02 Gravity Sewerage Code Supplement.pdf`
(Version 5, 8 October 2025):

- DN150 straight sewers use Table IW.4 (by number of houses), not the shear equations.
- Larger than DN150: Ssc (%) = 0.0135 / Rp and Sss (%) = 0.0338 / Rp, both at the same Rp.
- That Rp is at Qdmp = 0.75 × (PDWF + 2/3 × TPF). Eq IW.5.5.3.3.
- Absolute minimum for those sizes is Smin (%) = 80 / ID, with ID in millimetres. Eq IW.5.5.3.4. No flow and no depth in that one.
- Maximum grade is 3.0 m/s at PDWF. Roughness from Table IW.3: n = 0.012 (VC, DICL, SCL) or 0.011 (PVC, PE, GRP) below DN600; Colebrook k = 1.1 mm or 0.6 mm.
- Flows: PDWF = 5.83 × ADWF / TEP^0.1, ADWF from 180 L/EP/d, GWI = 0.01875 × NSA × 0.75, design flow = PDWF + GWI + RDI. Icon does not use WSA 02 Appendix B for EP.

---

## 1. What the calculation actually is

Every Australian utility frames "minimum grade" the same way: the flattest grade at which a
given pipe, carrying its **design low flow (PDWF)**, still self-cleanses. Two self-cleansing
criteria are in use, and a calculator should support both:

| Criterion | Rule | Who uses it |
|---|---|---|
| Velocity | wetted-section average velocity ≥ 0.70 m/s at PDWF | Sydney Water (WSA 02 SW edition), most WSA 02 adopters, EN 752 |
| Velocity (low) | ≥ 0.35 m/s at PDWF + GWI | MRWA / Coliban (WSA 02-2002 MRWA addendum) |
| Tractive force (boundary shear) | τ = ρ·g·R·S ≥ τ_min | Sydney Water 1.6 Pa (grit) / 3.35 Pa (slime); Toowoomba 0.15 kg/m² ≈ 1.47 Pa; Brazil NBR 9649 / Mara 1.0 Pa; CIRIA R141 ~1–2 Pa |

On top of the hydraulic check every utility publishes an **absolute minimum grade table** that
overrides the calculation at low EP (flow estimates are unreliable there; self-cleansing relies
on intermittent "impulse" flushing).

### Hydraulics (part-full circular pipe)

With θ the full central angle subtended by the water surface, D internal diameter, y depth:

- θ = 2·acos(1 − 2y/D)
- A = D²(θ − sin θ)/8
- P = Dθ/2
- R = A/P = (D/4)(1 − sin θ/θ)

Friction laws (both as printed in **AS 2200-2006 (+A1 2009) cl. 2.1**):

- Manning: V = (1/n)·R^(2/3)·S^(1/2)   (full pipe: V = 0.3950·D^(2/3)·S^(1/2)/n)
- Colebrook-White (part-full form): V = −√(32·g·R·S) · log10[ k/(14.8R) + 1.255ν/(R·√(32gRS)) ]

Roughness adopted in NSW: **k = 1.5 mm** (slimed sewer). Sydney Water's stated Manning
equivalents: n = 0.0128 (DN150, DN300), 0.0130 (DN600). ν = 1.01×10⁻⁶ m²/s at 20 °C
(AS 2200 Table 1 — charts are drawn for 20 °C).

### What the original spreadsheet actually does

One sheet, three blocks. Flows are the WSA 02 Appendix B model (confirmed against the
Sydney Water edition in the RAG corpus, `WSA02_2002_Part1_22_SW3.pdf`, Appendix B):

- ADWF = EP × 180 / 86400
- PDWF = 5.83 × ADWF / EP^0.1  (this coefficient is **not** the Appendix B `d(area)` polynomial; it is a fitted peaking factor carried in the sheet)
- GWI = 0.01875 × area × 0.75  (Appendix B is 0.025 × A × PortionWet; 0.01875 = 0.025 × 0.75, so PortionWet is applied twice)
- IIF ("RDI") = 0.028 × A × density factor × C × I, with C = 1.2 and I = I(1,2) × (40/A)^0.12 × 1.5
- EP/dwelling from density: 3.5 / 2.5 / 2.0 at <25 / 25–80 / >80 dw/ha (WSA 02 Table A1 is 3.5 for single lots)

Min grade (the Wolfram step): Eq IW.5.5.3.2, **Sss (%) = 0.0338 / Rp**, with Rp at
**0.75 × PDWF** (Eq IW.5.5.3.3). 0.0338 %·m is boundary shear **τ = ρgK = 3.32 Pa**, i.e.
the WSA 02 / Sydney Water slime-stripping criterion of ~3.35 Pa. Substituting S = K/Rp
into Manning removes S:

Q = (1/n) √(K/100) · A · Rp^(1/6), n = 0.012 (Table IW.3; 0.011 or 0.012)

Only the part-full angle θ is unknown. The original sheet pasted a Wolfram root for y
(DN150 and DN300 only; other sizes are `#DIV/0!`) and was limited to y < radius.
Checked: DN300 at Q75 = 4.1015 L/s gives y = 37.05 mm and Sss = 1.453 %; the sheet's
1.455 % is that root rounded to 37 mm.

Max grade (IW.5.5.4): grade at which velocity hits ~3 m/s. The sheet used 2.9 m/s on
PWWF and a note saying to change it to 3.0 m/s on PDWF. Same geometry solve (area =
Q/V), again with a pasted Wolfram y.

### The relationship, and why Wolfram is unnecessary

Sss = 0.0338 / Rp **is** the relationship (an Icon Water amendment to WSA 02, not a
paper). Depth is then a one-variable solve. v2 does it with an asymptotic start plus
Newton steps in log-space on θ (no Goal Seek, no circular refs). It also adds the
self-cleansing grade (placeholder K_sc = 0.0163 = 1.6 Pa — **confirm Eq IW.5.5.3.1**),
the absolute minimum (only DN225 0.38 % and DN300 0.27 % prefilled, from Icon's
Molonglo 2 report), a PWWF capacity check, and a Sydney Water block (0.7 m/s at PDWF,
Table 4.6 absolute minimums, 3 m/s half/full maximum) so the same engine covers NSW.

`Design Table` is the reverse direction: pick DN and y/D, read the PDWF that satisfies
Sss or Ssc and the grade. No iteration. Dimensionless q* = Q n / (√K · D^(13/6)) is the
same curve for every diameter.

### Papers now in Downloads — related, but not the Icon equation

- **Akgiray 2005** (*Can. J. Civ. Eng.* 32:490–499) and **Akgiray 2004**: explicit θ for
  the four classical Manning problems (known Q, D, S → depth; known V → slope; etc.).
  Best constant-n depth fit is eq. [50], about ±0.7 % on θ. Useful if S is already
  known. They do **not** cover S = K/Rp coupled to Manning, which is this sheet's
  problem, and they are less accurate than the in-sheet Newton solve.
- **Barr 1975** (Proc. ICE Part 2, 59, Dec, 827–835; the file is dated 1976 in the
  filename): explicit Colebrook-White approximations. Eq. (7) is explicit in slope,
  eq. (9) in diameter. This is the right shortcut **if** a future sheet is switched
  from Manning to Colebrook-White (k = 1.5 mm). The Icon note uses Manning.
- **AS 2200-2006 Amd 1 and Amd 2** are in Downloads. The base standard is not; it is
  open in the Standards Australia reader. Moody's approximation (AS 2200 cl. 1) is the
  explicit Colebrook route the code itself names. Not required for the Icon Manning path.
- **WSA 02 Sydney Water Edition** (2002 v3 in the RAG corpus; Version 4 extract in
  Downloads): cl. 4.5.7 self-cleansing 0.7 m/s, Table 4.5 n, Table 4.6 absolute
  minimums, cl. 4.5.8 slime control by reference to the H2S Control Manual, cl. 4.5.9
  maximum 3.0 m/s. Appendix B is the flow model above. No 0.0338 coefficient — that
  number is Icon-specific (numerically equal to 3.35 Pa).

### Ways to remove the implicit solve (candidate "key source" list)

Any of these gives a direct relationship and is the kind of thing the user remembers
("relationship formula between one variable and the others", from a paper / code clause /
amendment):

1. **AS 2200-2006 (+A1 2009) *Design charts for water supply and sewerage*** — cl. 1 states the
   hydraulic gradient "can be determined either by successive approximation using the
   Colebrook-White formula or by use of **Moody's approximation** to the Colebrook-White
   transition formula". Moody (1947): f = 0.0055·[1 + (2×10⁴·k/D + 10⁶/Re)^(1/3)], then
   S = f·V²/(2·g·4R). Explicit. Chart 13 gives the proportional depth / velocity / discharge
   relationship for part-full pipes. Amendment 1 (April 2009) only corrects Chart 3. This is
   the Australian Standard that WSA 02 and council specs (e.g. CMDG D12, CPAA manual) point to
   for sewer hydraulics.
2. **Swamee & Jain (1976)** "Explicit equations for pipe-flow problems", ASCE J. Hydraulics
   Div. 102(5): f = 0.25 / [log10( k/(3.7·D_h) + 5.74/Re^0.9 )]². Explicit friction factor,
   ±1 % of Colebrook-White for 5000 < Re < 10⁸, 10⁻⁶ < k/D < 10⁻². Widely used in
   spreadsheets to avoid iteration.
3. **Barr (1975/1981)** explicit Colebrook-White approximation — the basis of the HR Wallingford
   *Tables for the hydraulic design of pipes, sewers and channels* and of the CivilWeb "minimum
   fall" spreadsheet.
4. **Manning n ↔ Colebrook-White k equivalence** — Sydney Water D0002356 Table 3 (n = 0.0128 for
   k = 1.5 mm); CPAA *Hydraulics of Precast Concrete Conduits* Fig 1.6. Once n is fixed,
   S = (V·n / R^(2/3))² is explicit. Sydney Water's absolute minimum grades (below) reproduce
   almost exactly as "grade at which the pipe flowing full reaches 0.70 m/s with n ≈ 0.0128".
5. **Akgiray (2004, 2005)** — "Simple formulae for velocity, depth of flow and slope
   calculations in partially filled circular pipes" (Env. Eng. Sci. 21(3)) and "Explicit
   solutions of the Manning equation for partially filled circular pipes" (Can. J. Civ. Eng.
   32(3)). Explicit depth from (Q, D, S, n), including Camp's variable-n case. Related:
   Saatçi (1990) J. Env. Eng. 116(6); Barr & Das (1986) Proc. ICE 81(3); Jin & Walski (2011)
   polynomial normal-depth fit used inside Bentley SewerGEMS.
6. **Tractive-tension minimum grade as a power law of flow** — Mara & Broome (2008) *Sewerage:
   a return to basics to benefit the poor*, Proc. ICE Municipal Engineer 161(ME4) 231–237,
   derived from Brazilian code **ABNT NBR 9649 (1986)**:
   i_min = k_a^(−6/13) · k_r^(−16/13) · [ (1/n)·(τ_min/ρg) ]^(−6/13) · q^(−6/13)
   which for τ = 1 Pa, y/D = 0.2, n = 0.013 collapses to **i_min = 2.33×10⁻⁴ · q^(−6/13)**
   (q in m³/s) — the NBR 9649 form is i_min = 0.0055·Q^(−0.47) with Q in L/s. Check:
   q = 1.5 L/s → 1 in 214, matching the paper's Table 2. Direct grade-from-flow relationship
   with no iteration.
7. **Camp (1946)** variation of n with depth (used by ASCE/WEF MOP FD-5 and by Akgiray's
   variable-n equations).

**Confirmed match:** item is none of the seven below. It is **Icon Water STD-SPE-G-011
Eq. IW.5.5.3.2**, Sss (%) = 0.0338 / Rp. The list is still the right set of explicit
alternatives if the calculator is extended to Colebrook-White or to another utility.

---

## 2. Australian design criteria collected

### Sydney Water (primary NSW reference)

Source: *Design guideline – minimising odour-causing turbulence in wastewater networks*
D0002356 v1, 21 Feb 2025 (consolidates WSA 02 Sydney Water edition, WSA 04 SW edition and the
Hydrogen Sulphide Control Manual). Also *Pipe sizing and grading tables* (Tables SW 4.1–4.2).

- Self-cleansing: **0.70 m/s at PDWF**. Bespoke hydraulic design required ≥ DN375.
- Roughness: Colebrook-White k = 1.5 mm or equivalent Manning n (0.0128 DN150/300, 0.0130 DN600).
- Capacity: no air space check at DF; PDWF / pipe-full capacity ≤ 0.6.
- Tractive stress (from H₂S Control Manual Monograph 5.1): ≥ 1.60 Pa to prevent deposition,
  ≥ 3.35 Pa to prevent visible wall slime; ≥ 2.0 Pa where n ≥ 0.015.
- Max velocity 3.0 m/s (reticulation and branch/trunk).

Absolute minimum grades (Table 4):

| DN | grade % | ≈ 1 in |
|---|---|---|
| 150 | 0.59 | 170 |
| 225 | 0.37 | 270 |
| 300 | 0.27 | 370 |
| 375 | 0.19 | 525 |
| 450 | 0.15 | 670 |
| 525 | 0.13 | 770 |
| 600 | 0.11 | 910 |
| 750 | 0.09 | 1110 |

Property connections and ends (Table 5): DN100 connection 1.65 %; DN150 connection 1.20 %;
permanent upstream ends of DN150/225/300 in residential areas with EP ≤ 20: 1.00 %.

Maximum EP by size and grade (Table 2) — useful for the "reverse" direction (grade → EP):

| DN150 | 1/170 (0.59 %) 500 · 1/150 550 · 1/125 625 · 1/100 725 · 1/80 850 · 1/60 1 050 |
|---|---|
| DN225 | 1/270 1 600 · 1/250 1 700 · 1/200 1 950 · 1/150 2 350 · 1/125 2 650 · 1/100 3 025 · 1/80 3 450 · 1/60 4 100 |
| DN300 | 1/370 3 225 · 1/250 5 000 · 1/200 4 650 · 1/150 5 500 · 1/100 6 950 · 1/80 7 900 · 1/60 9 300 |

(Note the source prints "1 in 70 0.59 %" for DN150 — a typo for 1 in 170 — and the DN300
1/250 and 1/200 values look transposed.)

Pipe sizing and grading tables (min PDWF for 0.7 m/s / DF at pipe-full), DN225 excerpt:
0.40 % → 5.8 / 29.0 L/s; 0.50 % → 3.8 / 32.4; 0.60 % → 2.5 / 35.5; 0.70 % → 1.6 / 38.3;
0.80 % → 1.2 / 41.0; 1.00 % → 0.5 / 45.8; DN150 at 0.65 % → 2.4 L/s min PDWF.
The pipe-full DF values reproduce with Manning n = 0.0128 (DN225 @ 0.40 % → 28.9 L/s), so
these tables are a ready-made validation set for a calculator. The "min PDWF" column does
**not** reproduce with a plain 0.7 m/s part-full check — Sydney Water appears to use an
empirical EP-based relationship there; worth reconciling against the spreadsheet.

### Other WSA 02 adopters (for Australia-wide option)

- **SA Water** supplement to WSA 02-2002 (Table 4.6/4.7): absolute minimums DN150 0.5 %,
  DN225 0.3 % res / 0.5 % ind, DN300 0.2 %, DN375 0.15 %, DN450 0.14 %, DN525 0.12 %,
  DN600 0.10 %, DN750 0.08 %; DN100 connection 2.0 %, DN150 connection 0.8 %, permanent
  ends EP < 20 1.0 %; internal drain 1.65 % per AS 3500.
- **MRWA / Coliban** addendum to WSA 02-2002 cl. 4.5.7: self-cleansing at 0.35 m/s at
  PDWF + GWI.
- **Wannon Water** supplement (2023): DN150 1/50 – 1/150, DN225 1/50 – 1/250, DN300 1/80 –
  1/400 with min/max occupancies per grade.
- **TasWater** supplement to WSA 02-2014-3.1 MRWA: Colebrook-White part-full; ADWF (L/s) =
  ET × loading (450 or 540 L/ET/d) × 0.000012; PDWF = d × ADWF.
- **Hunter Water** adopts WSA 02 v3.1 (own edition); PDWF via NSW Public Works (1984)
  *Manual of Practice – Sewer Design* peaking-factor method on ET.
- **Queensland (FNQROC D7, Toowoomba addendum, CMDG D12)**: PDWF = C2·ADWF,
  C2 = 4.7·EP^(−0.105); PWWF = max(5, 15·EP^(−0.1587))·ADWF; n = 0.013; FNQROC grades
  DN150 1/150 (1/100 first length, 1/80 head), DN225 1/290, DN300 1/420, DN375 1/570,
  DN450 1/730, DN525 1/900, DN600 1/1000, DN675 1/1200, ≥DN750 1/1500. CMDG D12: hydraulics
  per AS 2200, k = 1.6 mm, proportional V/Q 1.13/0.9.
- **WSA 02-2014 v3.3 (Aug 2024, Amd 1:2024)** replaced the code's spreadsheet "sewer pipe
  sizing calculator" with an online calculator (WSAA members). Not retrieved — paywalled.

### Flow estimation (needed to turn EP/ET into PDWF)

- Sydney Water: EP-based tables above; DF = PDWF + GWI + IIF per WSA 02 SW edition.
- QLD: ADWF 150–275 L/EP/d; PDWF = 4.7·EP^(−0.105)·ADWF.
- TasWater: 450/540 L/ET/d; EP/ET = 3.0.
- Brazil/Mara: minimum design peak flow 1.5 L/s (one WC); EN 752-4 Annex C uses 1.6 L/s.

---

## 3. Calculators and spreadsheets found

- Sydney Water *Pipe sizing and grading tables* (PDF) — lookup, not a calculator.
- WSAA online sewer pipe sizing calculator (WSA 02 v3.3) — members only.
- CivilWeb *Pipe Flow Calculator / Minimum Fall for Sewer Pipe* (UK, paid) — Colebrook-White
  via Barr's approximation, tractive-force option (Macke 1.07 N/m², CIRIA 2 N/m²).
- codingace.net sewer pipe size calculator — generic Manning, not code-specific.
- NZMRM / ABCB calculators in the RAG corpus are roof-drainage, not sewer.

No public Australian tool was found that returns *minimum grade for a given DN and PDWF/EP*
with a selectable utility criterion — which is the gap this spreadsheet fills.

---

## 4. Relevant material in `rag_demo_complete`

`docs/CORPUS.md` lists 26 utility documents under `pdfs/sydney_water/`, `pdfs/shoalhaven_water/`,
`pdfs/water_nsw/` plus AS/NZS standards under `pdfs/australian_standards/`. Extracted text is
in `pipeline/work/<sha256_...>/s3_clean.txt` (keyed by hash, so the registry
`pipeline/state/registry.json` is needed to map filename → folder). Candidates to pull once
the shell is back: WSA 02 Sydney Water edition, Shoalhaven Water sewer design spec, AS 2200,
AS/NZS 3500.2 (drain minimum grades: DN100 1.65 %, DN150 1.0 %/0.65 %).

The `Valley Gutter Spreadsheet` repo is roof/valley-gutter drainage (AS/NZS 3500.3); its
`references/` folder was the source of the RAG imports and contains nothing sewer-specific per
`data/corpus_imports.json`.

---

## 5. Still to confirm (STD-SPE-G-011 PDF was not downloadable; the page links are script-driven)

- Coefficient of the self-cleansing equation IW.5.5.3.1 → `Parameters!K_sc` (placeholder 0.0163 = 1.6 Pa). Icon's published DN300 SC 0.22–0.26 % against SSC 0.54–0.64 % is consistent with this placeholder at the implied PDWF.
- Absolute minimum grade table → `Grade Calculator` column Q (only DN225 0.38 % and DN300 0.27 % filled in).
- Whether Icon checks self-cleansing at PDWF or at PDWF+GWI, and whether 3 m/s is applied at PDWF or at pipe-full.
- Peaking factor 5.83·EP^(−0.1): reproduced from the sheet; not found in WSA 02 Appendix B (which uses d vs area). Likely an Icon / ACT figure — confirm in STD-SPE-G-011.
- AS 2200-2006 base PDF: not scraped. Cursor's browser did not come up; the reader at `it-prd-readerroom-webreader2-spa.azurewebsites.net/as-2200-2006` needs a logged-in session. Amendments 1 and 2 are already in Downloads.

## 6. AS 2200-2006, read in the licensed viewer (interpretation only)

Second edition, 16 January 2006, reconfirmed 19 May 2017, reissued with Amendment 1 (April 2009). Amendment 2 exists (committee PL-021). Title: design charts for water supply and sewerage. It is a chart book with a few pages of method, not a sewerage code and not a minimum-grade table.

What it contains:

1. **Scope.** Charts relating roughness, diameter, velocity and hydraulic gradient, plus fitting losses. It says spreadsheets and programmable calculators already make the charts unnecessary, and that the charts are for approximate checks. Critical work must use the formulae. When the unknown is the slope, Colebrook-White is solved by successive approximation, or by Moody's approximation to the transition formula. The approximation itself is named, not set out as a worked equation in the clauses read.
2. **Derivation.** Manning (part-full and the full-pipe form) and Colebrook-White (part-full and full-pipe). Symbols match the calculator: R = D/4 when full, S in m/m, k in metres inside the formula.
3. **Viscosity.** A temperature table from 0 °C to 50 °C. The Colebrook-White charts are drawn at 20 °C (about 1.01×10⁻⁶ m²/s). A 10 °C shift changes discharge by only about 3 %, so no temperature correction chart is provided.
4. **Charts 1–11.** One full-pipe Colebrook-White chart per roughness: k = 0.003, 0.006, 0.015, 0.03, 0.06, 0.15, 0.30, 0.60, 1.50, 3.00 and 6.00 mm. Water at 20 °C, pipe flowing full. Read Q, diameter, velocity and hydraulic gradient off the same intersection.
5. **Chart 12.** Full-pipe Manning, internal diameter about 60 mm to 2000 mm. The right-hand slope scale is for n = 0.012; other n values are read with a straightedge through an n scale.
6. **Chart 13.** Part-full circular pipes: proportional depth d/D against proportional discharge Q/Q₀ and proportional velocity V/V₀. You still need a full-pipe chart first.
7. **Chart 14.** Minor-loss coefficients for valves and fittings (pressure pipelines).
8. **Table 2.** Guide ranges of k and n for concentrically jointed **clean** pipes (asbestos cement, concrete, thermoplastics, vitrified clay, ductile iron, lined steel, and so on). Lower end is new, straight, clean pipe; the upper end is a typical maximum, not an absolute one. The notes say slime, biological growth, debris, joint deflections and corrosion can push roughness higher still, for any material, and that the value for a particular fluid should come from the supplier or the utility. k in the table is in millimetres; the formula wants metres.
9. **Appendix A.** Three worked chart readings: size a spun-concrete drain for a given flow and grade; head loss in a PVC pressure main; total dynamic head of a pump including fitting losses. Figure A1 is a pump sketch. None of them is a minimum sewer grade.

Internal diameters are what the charts use. Nominal DN is larger than the true bore.

### Are the graphs useful here?

Only as a rough check, and the standard says so. The calculator already evaluates the same Manning formula, and for the Icon problem it also applies S = 0.0338 / Rp, which no chart contains.

- **Chart 13** is the only part-full graph. It converts a known full-pipe flow into a depth and a velocity. It does not find the slime-control grade. The sheet's geometry (area, hydraulic radius, depth from the central angle) is the exact version of that chart.
- **Chart 9** (k = 1.5 mm) is the full-pipe Colebrook chart that matches a slimed sewer. It can spot-check a full-pipe capacity or a "3 m/s flowing full" maximum grade. It cannot see a partly full pipe.
- **Chart 12** is Manning at n = 0.012, which the sheet already computes. Reading a slope off it is less accurate than the formula.
- **Charts 1–8, 10 and 11** are the wrong roughness for sewage that grows a wall slime.
- **Chart 14 and Appendix A** are pressure mains, fittings and pumps. They do not set a gravity-sewer grade.
- **Table 2 must not be used as the sewer roughness.** Clean thermoplastics sit near n = 0.008–0.009 and k = 0.003–0.015 mm. Icon's n = 0.012 and Sydney Water's k = 1.5 mm (n about 0.0128) are slime allowances, which the table's own note says sit above the clean-pipe ranges.

So the standard confirms the method already in the workbook: use the formula, take roughness from the sewerage authority, and treat the charts as a picture of the full-pipe answer. It does not replace Equation IW.5.5.3.2.

## 7. Material actually read

- Workspace: the Icon Manning note and `230508 - Sewer Calcs - Peak Flows, Max Grade, Min Grade - DC.xlsx` (every formula and cached value).
- RAG: `pdfs\sydney_water\WSA02_2002_Part1_22_SW3.pdf` extracted text (Part 1 cl. 3, cl. 4.5, Appendices A and B). No Icon Water document in the corpus. Valley Gutter repo is roof drainage only.
- Downloads: Akgiray 2005, Barr 1975 (OCR text), WSA 02 Sydney Water extracts (2002 and Version 4). AS 2200 amendments not yet read page by page; they do not replace the base standard.
