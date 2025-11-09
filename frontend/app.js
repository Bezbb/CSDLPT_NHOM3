const API_BASE = "http://localhost:3000/api";

/* =============== KHAI BÁO ENTITY =============== */
const ENTITIES = {
  headquarter: {
    title: "Trụ sở",
    idKey: "ID",
    fields: [
      { key: "ID", label: "ID", type: "text" },
      { key: "name_headquarter", label: "Tên trụ sở", type: "text" },
      { key: "address", label: "Địa chỉ", type: "text" }
    ]
  },
  department: {
    title: "Khoa",
    idKey: "ID",
    fields: [
      { key: "ID", label: "ID", type: "text" },
      { key: "name_department", label: "Tên khoa", type: "text" },
      { key: "ID_headquarter", label: "Trụ sở", type: "select", optionsFrom: "headquarter:ID:name_headquarter" }
    ]
  },
  teacher: {
    title: "Giảng viên",
    idKey: "ID",
    fields: [
      { key: "ID", label: "ID", type: "text" },
      { key: "name_teacher", label: "Họ tên", type: "text" },
      { key: "address_teacher", label: "Địa chỉ", type: "text" },
      { key: "degree", label: "Học vị", type: "text" },
      { key: "phone_teacher", label: "SĐT", type: "text" },
      { key: "ID_department", label: "Khoa", type: "select", optionsFrom: "department:ID:name_department" }
    ]
  },
  subject: {
    title: "Môn học",
    idKey: "ID",
    fields: [
      { key: "ID", label: "ID", type: "text" },
      { key: "name_subject", label: "Tên môn", type: "text" },
      { key: "number_of_credit", label: "Số tín chỉ", type: "number" }
    ]
  },
  class: {
    title: "Lớp học",
    idKey: "ID",
    fields: [
      { key: "ID", label: "ID", type: "text" },
      { key: "semester", label: "Kỳ học", type: "number" },
      { key: "school_year", label: "Năm học", type: "number" },
      { key: "number_of_student", label: "Sĩ số", type: "number" },
      { key: "shift", label: "Ca học", type: "number" },
      { key: "ID_subject", label: "Môn học", type: "select", optionsFrom: "subject:ID:name_subject" },
      { key: "ID_teacher", label: "Giảng viên", type: "select", optionsFrom: "teacher:ID:name_teacher" }
    ]
  },
  student: {
    title: "Sinh viên",
    idKey: "ID",
    fields: [
      { key: "ID", label: "ID", type: "text" },
      { key: "name_student", label: "Họ tên", type: "text" },
      { key: "date_of_birth", label: "Ngày sinh", type: "date" },
      { key: "address_student", label: "Địa chỉ", type: "text" },
      { key: "formal_class", label: "Lớp hành chính", type: "text" },
      { key: "year_of_admission", label: "Năm nhập học", type: "number" },
      { key: "phone_student", label: "SĐT", type: "text" },
      { key: "ID_department", label: "Khoa", type: "select", optionsFrom: "department:ID:name_department" }
    ]
  },
  point: {
    title: "Điểm",
    idKey: "ID",
    fields: [
      { key: "ID", label: "ID", type: "text" },
      { key: "mark_diligence", label: "Chuyên cần", type: "number" },
      { key: "mark_test", label: "Kiểm tra", type: "number" },
      { key: "mark_practice", label: "Thực hành", type: "number" },
      { key: "mark_exam", label: "Thi", type: "number" },
      { key: "ID_class", label: "Lớp", type: "select", optionsFrom: "class:ID:ID" },
      { key: "ID_student", label: "Sinh viên", type: "select", optionsFrom: "student:ID:name_student" }
    ]
  }
};

/* =============== HELPER =============== */
const $ = (s) => document.querySelector(s);
const toast = (msg, ok = true) => {
  const t = $("#toast");
  if (!t) return alert(msg);
  t.textContent = msg;
  t.classList.remove("hidden");
  t.style.color = ok ? "green" : "crimson";
  setTimeout(() => t.classList.add("hidden"), 2200);
};

let currentEntity = "headquarter";
let editingId = null;
let cacheOptions = {}; // cache dropdowns

/* =============== LOAD OPTIONS FOR SELECT =============== */
async function loadOptionsForField(field) {
  if (!field.optionsFrom) return [];
  const [entity, valueKey, labelKey] = field.optionsFrom.split(":");
  if (!cacheOptions[entity]) {
    const res = await fetch(`${API_BASE}/${entity}`);
    if (!res.ok) throw new Error(await res.text());
    cacheOptions[entity] = await res.json();
  }
  return cacheOptions[entity].map(x => ({
    value: x[valueKey],
    label: x[labelKey] ?? x[valueKey]
  }));
}

/* =============== RENDER FORM =============== */
async function renderForm() {
  const cfg = ENTITIES[currentEntity];
  const form = $("#crudForm");
  form.innerHTML = "";

  for (const f of cfg.fields) {
    const wrap = document.createElement("label");
    wrap.className = "field";

    const title = document.createElement("span");
    title.textContent = f.label;
    wrap.appendChild(title);

    let input;
    if (f.type === "select") {
      input = document.createElement("select");
      input.name = f.key;

      const opt0 = document.createElement("option");
      opt0.value = "";
      opt0.textContent = "-- chọn --";
      input.appendChild(opt0);

      const opts = await loadOptionsForField(f);
      for (const o of opts) {
        const opt = document.createElement("option");
        opt.value = o.value;
        opt.textContent = o.label;
        input.appendChild(opt);
      }
    } else {
      input = document.createElement("input");
      input.type = f.type || "text";
      input.name = f.key;
    }

    if (editingId == null && f.key === cfg.idKey) input.required = true;

    wrap.appendChild(input);
    form.appendChild(wrap);
  }
}

/* =============== RENDER TABLE =============== */
async function loadTable() {
  const cfg = ENTITIES[currentEntity];
  const table = $("#dataTable");
  table.innerHTML = "";
  try {
    const res = await fetch(`${API_BASE}/${currentEntity}`);
    if (!res.ok) throw new Error(await res.text());
    const rows = await res.json();

    const thead = document.createElement("thead");
    const trh = document.createElement("tr");
    for (const f of cfg.fields) {
      const th = document.createElement("th");
      th.textContent = f.label;
      trh.appendChild(th);
    }
    const thAct = document.createElement("th");
    thAct.textContent = "";
    trh.appendChild(thAct);
    thead.appendChild(trh);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    const keyword = ($("#searchInput")?.value || "").toLowerCase().trim();

    rows
      .filter(r => !keyword || Object.values(r).some(v => String(v ?? "").toLowerCase().includes(keyword)))
      .forEach(r => {
        const tr = document.createElement("tr");
        for (const f of cfg.fields) {
          const td = document.createElement("td");
          td.textContent = r[f.key] ?? "";
          tr.appendChild(td);
        }
        const tdA = document.createElement("td");
        const btnEdit = document.createElement("button");
        btnEdit.className = "btn";
        btnEdit.textContent = "Sửa";
        btnEdit.onclick = () => startEdit(r);

        const btnDel = document.createElement("button");
        btnDel.className = "btn danger";
        btnDel.textContent = "Xóa";
        btnDel.onclick = () => doDelete(r[cfg.idKey]);

        tdA.append(btnEdit, " ", btnDel);
        tr.appendChild(tdA);
        tbody.appendChild(tr);
      });

    table.appendChild(tbody);
  } catch (e) {
    console.error(e);
    toast(`Lỗi tải danh sách: ${e.message}`, false);
  }
}

/* =============== FORM DATA & TYPE CAST =============== */
function collectFormData() {
  const form = $("#crudForm");
  const cfg = ENTITIES[currentEntity];
  const obj = {};

  for (const el of form.elements) {
    if (!el.name) continue;
    obj[el.name] = el.value === "" ? null : el.value;
  }

  // ép kiểu number & date
  for (const f of cfg.fields) {
    if (f.type === "number") {
      obj[f.key] = obj[f.key] == null ? null : Number(obj[f.key]);
    }
    if (f.type === "date") {
      obj[f.key] = obj[f.key] || null;
    }
  }
  return obj;
}

/* =============== CREATE / UPDATE / DELETE =============== */
async function doSave() {
  const cfg = ENTITIES[currentEntity];
  const data = collectFormData();

  const url = editingId
    ? `${API_BASE}/${currentEntity}/${encodeURIComponent(editingId)}`
    : `${API_BASE}/${currentEntity}`;
  const method = editingId ? "PUT" : "POST";

  // với POST yêu cầu ID bắt buộc
  if (!editingId && !data[cfg.idKey]) {
    toast(`Thiếu ${cfg.idKey}`, false);
    return;
  }

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const txt = await res.text();
      try { throw new Error(JSON.parse(txt).error || txt); }
      catch { throw new Error(txt || `HTTP ${res.status}`); }
    }

    toast(editingId ? "Đã cập nhật" : "Đã thêm mới");
    editingId = null;
    $("#submitBtn").textContent = "Thêm mới";
    $("#crudForm").reset();
    await loadTable();
  } catch (e) {
    console.error(e);
    toast(e.message || "Lỗi lưu dữ liệu", false);
  }
}

function startEdit(row) {
  const cfg = ENTITIES[currentEntity];
  editingId = row[cfg.idKey];
  $("#submitBtn").textContent = "Lưu thay đổi";

  const form = $("#crudForm");
  for (const el of form.elements) {
    if (!el.name) continue;
    el.value = row[el.name] ?? "";
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function doDelete(id) {
  if (!confirm("Xóa bản ghi này?")) return;
  try {
    const res = await fetch(`${API_BASE}/${currentEntity}/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) {
      const txt = await res.text();
      try { throw new Error(JSON.parse(txt).error || txt); }
      catch { throw new Error(txt || `HTTP ${res.status}`); }
    }
    toast("Đã xóa");
    await loadTable();
  } catch (e) {
    console.error(e);
    toast(e.message || "Lỗi xóa", false);
  }
}

/* =============== INIT =============== */
async function init() {
  // dropdown entity
  const sel = $("#entitySelect");
  sel.innerHTML = "";
  for (const key of Object.keys(ENTITIES)) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = `${ENTITIES[key].title} (${key})`;
    sel.appendChild(opt);
  }
  sel.value = currentEntity;
  sel.onchange = async () => {
    currentEntity = sel.value;
    editingId = null;
    $("#submitBtn").textContent = "Thêm mới";
    cacheOptions = {};
    await renderForm();
    await loadTable();
  };

  // các nút thao tác — giống “Xóa”, dùng onclick
  $("#submitBtn").onclick = (e) => { e.preventDefault(); doSave(); };
  $("#cancelBtn").onclick  = (e) => {
    e.preventDefault();
    editingId = null;
    $("#submitBtn").textContent = "Thêm mới";
    $("#crudForm").reset();
  };

  $("#searchInput").oninput = () => loadTable();
  $("#reloadBtn").onclick = () => loadTable();

  await renderForm();
  await loadTable();
}

document.addEventListener("DOMContentLoaded", init);
