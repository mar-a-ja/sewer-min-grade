import {
  MATERIALS,
  combine,
  exampleJob,
  flowAtGrade,
  fmt,
  grades,
  smallestDiameter,
} from "./engine.js";

const STORE = "icon-sewer-job";
const $ = (id) => document.getElementById(id);

let state = exampleJob();
let housesTouched = false;

function setStatus(text) {
  $("job_status").textContent = text || "";
}

function num(id) {
  const v = Number($(id).value);
  return Number.isFinite(v) ? v : 0;
}

function readParams() {
  const base = exampleJob().params;
  return {
    ...base,
    n: Number($("material").value),
    iHour: num("i_hour"),
    portionWet: num("portion_wet"),
    tpf: num("tpf"),
  };
}

function readPrecincts() {
  return [...document.querySelectorAll("#precinct_body tr")].map((tr) => ({
    dwellings: Number(tr.querySelector("[data-f=dwellings]").value) || 0,
    nsa: Number(tr.querySelector("[data-f=nsa]").value) || 0,
    on: tr.querySelector("[data-f=on]").checked,
  }));
}

function readJob() {
  return {
    version: 1,
    job: $("job").value,
    designer: $("designer").value,
    date: $("date").value,
    params: readParams(),
    precincts: readPrecincts(),
    solve: $("solve").value,
    dn: Number($("dn").value),
    grade: num("grade_in"),
    houses: housesTouched ? num("houses") : null,
  };
}

function precinctTable(rows) {
  const body = $("precinct_body");
  body.innerHTML = rows
    .map(
      (row, i) => `<tr>
        <td><input data-f="on" data-i="${i}" type="checkbox" ${row.on ? "checked" : ""} aria-label="Include precinct ${i + 1}" /></td>
        <td>${i + 1}</td>
        <td><input data-f="dwellings" data-i="${i}" type="number" min="0" step="1" value="${row.dwellings}" /></td>
        <td><input data-f="nsa" data-i="${i}" type="number" min="0" step="0.01" value="${row.nsa}" /></td>
        <td class="num" data-out="density"></td>
        <td class="num" data-out="epu"></td>
        <td class="num" data-out="ep"></td>
        <td class="num" data-out="pdwf"></td>
        <td class="num" data-out="pwwf"></td>
        <td><button type="button" data-remove="${i}" class="ghost">Remove</button></td>
      </tr>`
    )
    .join("");
}

function writeJob(job) {
  state = job;
  $("job").value = job.job || "";
  $("designer").value = job.designer || "";
  $("date").value = job.date || "";
  $("material").value = String(job.params.n);
  $("i_hour").value = job.params.iHour;
  $("portion_wet").value = job.params.portionWet;
  $("tpf").value = job.params.tpf;
  $("solve").value = job.solve || "grade";
  $("dn").value = String(job.dn || 225);
  $("grade_in").value = job.grade ?? 1;
  housesTouched = job.houses != null;
  if (housesTouched) $("houses").value = job.houses;
  precinctTable(job.precincts);
  bindPrecincts();
}

function bindPrecincts() {
  $("precinct_body").querySelectorAll("input").forEach((el) => {
    el.addEventListener("input", recalc);
    el.addEventListener("change", recalc);
  });
  $("precinct_body").querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const job = readJob();
      job.precincts.splice(Number(btn.dataset.remove), 1);
      if (!job.precincts.length) job.precincts.push({ dwellings: 0, nsa: 0, on: true });
      writeJob(job);
      recalc();
    });
  });
}

function oneIn(percent) {
  if (!(percent > 0)) return "—";
  return `1 in ${fmt(100 / percent, 0)}`;
}

function drawSection(row) {
  const svg = $("svg-pipe");
  const cx = 180;
  const cy = 150;
  const r = 110;
  const yd = row && row.yOverD > 0 ? Math.min(row.yOverD, 0.98) : 0.25;
  const ySurf = cy + r - 2 * r * yd;
  const half = Math.sqrt(Math.max(0, r * r - (ySurf - cy) ** 2));
  const large = yd > 0.5 ? 1 : 0;
  const water = yd
    ? `<path d="M ${cx - half} ${ySurf} A ${r} ${r} 0 ${large} 1 ${cx + half} ${ySurf} Z" fill="#8fc4dd" stroke="#2e6f8f" />`
    : "";
  svg.innerHTML = `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#fffdf8" stroke="#1a3a52" stroke-width="3" />
    ${water}
    <line x1="${cx - r - 16}" y1="${ySurf}" x2="${cx + r + 16}" y2="${ySurf}" stroke="#b03a2e" stroke-dasharray="4 3" />
    <text x="${cx}" y="36" text-anchor="middle" font-family="Georgia, serif" font-size="16" fill="#1a1916">DN ${row ? row.dn : ""}</text>
    <text x="${cx}" y="292" text-anchor="middle" font-size="13" fill="#6a6560">water at the slime-control depth${row && row.yOverD ? `, y/D ${fmt(row.yOverD, 2)}` : ""}</text>
  `;
}

function render(job) {
  const p = job.params;
  const flow = combine(job.precincts, p);
  const houses = housesTouched ? Number(job.houses) || 0 : flow.dwellings;
  if (!housesTouched) $("houses").value = houses ? String(houses) : "";
  const rows = grades(flow, houses, p);
  $("precinct_body").querySelectorAll("tr").forEach((tr, i) => {
    const row = flow.rows[i];
    tr.querySelector("[data-out=density]").textContent = fmt(row.density, 1);
    tr.querySelector("[data-out=epu]").textContent = fmt(row.epu, 1);
    tr.querySelector("[data-out=ep]").textContent = fmt(row.ep, 0);
    tr.querySelector("[data-out=pdwf]").textContent = fmt(row.pdwf, 2);
    tr.querySelector("[data-out=pwwf]").textContent = fmt(row.pwwf, 2);
  });

  const picked = rows.find((row) => row.dn === Number(job.dn)) || rows[1];
  $("job_line").textContent = [job.job, job.designer, job.date].filter(Boolean).join(" · ") || "Untitled job";
  $("issued_grade").textContent = picked && picked.smin ? `${fmt(picked.smin, 2)}%` : "—";
  $("issued_sub").textContent = picked ? `${picked.criterion} · DN ${picked.dn} · ${oneIn(picked.smin)}` : "";
  $("chip_pdwf").textContent = `PDWF ${fmt(flow.pdwf, 2)} L/s`;
  $("chip_pwwf").textContent = `PWWF ${fmt(flow.pwwf, 2)} L/s`;
  $("chip_ep").textContent = `${fmt(flow.ep, 0)} EP · ${flow.count} precinct${flow.count === 1 ? "" : "s"}`;
  const chip = $("chip_status");
  chip.textContent = picked ? picked.status : "";
  chip.className = `chip ${picked && picked.status === "OK" ? "ok" : picked && picked.status.startsWith("tick") ? "" : "warn"}`;

  $("catchment").innerHTML = [
    ["Precincts ticked", String(flow.count)],
    ["Dwellings / houses", fmt(flow.dwellings, 0)],
    ["Net site area", `${fmt(flow.nsa, 2)} ha`],
    ["Equivalent population", fmt(flow.ep, 0)],
    ["ADWF", `${fmt(flow.adwf, 3)} L/s`],
    ["PDWF", `${fmt(flow.pdwf, 3)} L/s`],
    ["Groundwater", `${fmt(flow.gwi, 3)} L/s`],
    ["Rainfall inflow", `${fmt(flow.rdi, 3)} L/s`],
    ["Design flow PWWF", `${fmt(flow.pwwf, 3)} L/s`],
    ["Qdmp for minimum grade", `${fmt(flow.qDmp, 3)} L/s`],
  ]
    .map(([k, v]) => `<div class="kv"><dt>${k}</dt><dd>${v}</dd></div>`)
    .join("");

  $("results").innerHTML = rows
    .map(
      (row) => `<tr class="${row.dn === picked.dn ? "picked" : ""}">
        <td>${row.dn}</td>
        <td class="num">${row.smin ? fmt(row.smin, 3) : "—"}</td>
        <td class="num">${oneIn(row.smin)}</td>
        <td>${row.criterion}</td>
        <td class="num">${row.sss ? fmt(row.sss, 3) : "—"}</td>
        <td class="num">${row.ssc ? fmt(row.ssc, 3) : "—"}</td>
        <td class="num">${row.abs ? fmt(row.abs, 3) : "—"}</td>
        <td class="num">${row.smax ? fmt(row.smax, 2) : "—"}</td>
        <td class="num">${row.qFull ? fmt(row.qFull, 1) : "—"}</td>
        <td>${row.status}</td>
      </tr>`
    )
    .join("");

  const answer = $("answer");
  const answerNote = $("answer_note");
  if (job.solve === "flow") {
    const slime = flowAtGrade(job.dn, job.grade, p.kSss, p);
    const clean = flowAtGrade(job.dn, job.grade, p.kSc, p);
    if (!slime.ok) {
      answer.textContent = slime.reason;
      answerNote.textContent = `DN ${job.dn} at ${fmt(job.grade, 3)}%`;
    } else {
      answer.textContent = `${fmt(slime.qDmp, 2)} L/s`;
      answerNote.textContent = `Qdmp at which ${fmt(job.grade, 3)}% is the slime-control grade. PDWF ${fmt(slime.pdwf, 2)} L/s. Self-cleansing Qdmp at the same grade: ${clean.ok ? `${fmt(clean.qDmp, 2)} L/s` : clean.reason}.`;
    }
  } else if (job.solve === "diameter") {
    const hit = smallestDiameter(rows, job.grade, flow.pwwf);
    if (!hit) {
      answer.textContent = "none";
      answerNote.textContent = `No diameter has a minimum grade at or flatter than ${fmt(job.grade, 3)}% and still carries the design flow.`;
    } else {
      answer.textContent = `DN ${hit.dn}`;
      answerNote.textContent = `Minimum grade ${fmt(hit.smin, 3)}% (${hit.criterion}). Full-pipe capacity at that grade ${fmt(hit.qFull, 1)} L/s.`;
    }
  } else {
    answer.textContent = picked && picked.smin ? `${fmt(picked.smin, 2)}%` : "—";
    answerNote.textContent = picked
      ? `DN ${picked.dn}: ${picked.criterion}. Maximum grade ${picked.smax ? `${fmt(picked.smax, 2)}%` : "—"}. ${picked.status}`
      : "";
  }
  drawSection(picked);
  try {
    localStorage.setItem(STORE, JSON.stringify(job));
  } catch {
    /* private mode */
  }
}

function recalc() {
  const job = readJob();
  state = job;
  render(job);
}

function saveJobFile() {
  const job = readJob();
  const blob = new Blob([JSON.stringify(job, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  const name = (job.job || "sewer-job").replace(/[^\w.-]+/g, "-");
  a.href = URL.createObjectURL(blob);
  a.download = `${name}.sewer.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  setStatus("Saved a .sewer.json job file.");
}

async function loadJobFromFile(file) {
  const job = JSON.parse(await file.text());
  if (!job || !Array.isArray(job.precincts)) throw new Error("not a sewer job file");
  job.params = { ...exampleJob().params, ...(job.params || {}) };
  writeJob(job);
  recalc();
  setStatus(`Loaded ${file.name}.`);
}

function boot() {
  $("material").innerHTML = MATERIALS.map((m) => `<option value="${m.n}">${m.label}</option>`).join("");
  $("dn").innerHTML = [150, 225, 300, 375, 450, 525, 600, 675, 750, 900]
    .map((dn) => `<option value="${dn}">DN ${dn}</option>`)
    .join("");
  let start = exampleJob();
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || "null");
    if (saved && Array.isArray(saved.precincts)) {
      saved.params = { ...exampleJob().params, ...(saved.params || {}) };
      start = saved;
    }
  } catch {
    /* ignore */
  }
  writeJob(start);
  document.querySelector("#inputs").addEventListener("input", (ev) => {
    if (ev.target.id === "houses") housesTouched = true;
    recalc();
  });
  document.querySelector("#inputs").addEventListener("change", recalc);
  $("add_precinct").addEventListener("click", () => {
    const job = readJob();
    job.precincts.push({ dwellings: 0, nsa: 0, on: true });
    writeJob(job);
    recalc();
  });
  $("reset").addEventListener("click", () => {
    housesTouched = false;
    try { localStorage.removeItem(STORE); } catch { /* ignore */ }
    writeJob(exampleJob());
    recalc();
    setStatus("Reset to the example subdivision. Precinct 2 is ticked, matching the original sheet.");
  });
  $("print").addEventListener("click", () => window.print());
  $("save_job").addEventListener("click", saveJobFile);
  $("load_job").addEventListener("click", () => $("load_job_file").click());
  $("load_job_file").addEventListener("change", async (ev) => {
    const file = ev.target.files && ev.target.files[0];
    ev.target.value = "";
    if (!file) return;
    try {
      await loadJobFromFile(file);
    } catch (err) {
      setStatus(`Could not load that file: ${err.message || err}`);
    }
  });
  window.addEventListener("dragover", (ev) => {
    if (ev.dataTransfer && [...ev.dataTransfer.types].includes("Files")) ev.preventDefault();
  });
  window.addEventListener("drop", async (ev) => {
    const file = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
    if (!file) return;
    ev.preventDefault();
    try {
      await loadJobFromFile(file);
    } catch (err) {
      setStatus(`Could not load that file: ${err.message || err}`);
    }
  });
  document.querySelectorAll("nav button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("nav button").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll("main > section").forEach((s) => s.classList.remove("active"));
      btn.classList.add("active");
      $(btn.dataset.tab).classList.add("active");
    });
  });
  recalc();
}

boot();
