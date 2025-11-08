const API_BASE = "http://localhost:3000/api";

// ======= Định nghĩa entity & field (để FE render form) =======
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

// ======= Tiện ích nho nhỏ =======
const $ = (s) => document.querySelector(s);
const toast = (msg, ok = true) => {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  t.style.color = ok ? "green" : "crimson";
  setTimeout(() => t.classList.add("hidden"), 2500);
};

let currentEntity = "headquarter";
let editingId = null;
let cacheOptions = {}; // cache dropdown

// Build options cho <select> từ entity khác
async function loadOptionsForField(field) {
  if (!field.optionsFrom) return [];
  const [entity, valueKey, labelKey] = field.optionsFrom.split(":");
  if (!cacheOptions[entity]) {
    const res = await fetch(`${API_BASE}/${entity}`);
    cacheOptions[entity] = await res.json();
  }
  return cacheOptions[entity].map(x => ({ value: x[valueKey], label: x[labelKey] ?? x[valueKey] }));
}

// Render form theo entity
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
      const opts = await loadOptionsForField(f);
      const opt0 = document.createElement("option");
      opt0.value = ""; opt0.textContent = "-- chọn --";
      input.appendChild(opt0);
      for (const o of opts) {
        const opt = document.createElement("option");
        opt.value = o.value; opt.textContent = o.label;
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

// Tải danh sách và render bảng
async function loadTable() {
  const cfg = ENTITIES[currentEntity];
  const table = $("#dataTable");
  table.innerHTML = "";
  const res = await fetch(`${API_BASE}/${currentEntity}`);
  const rows = await res.json();

  const thead = document.createElement("thead");
  const trh = document.createElement("tr");
  for (const f of cfg.fields) {
    const th = document.createElement("th");
    th.textContent = f.label;
    trh.appendChild(th);
  }
  const thAct = document.createElement("th"); thAct.textContent = "";
  trh.appendChild(thAct);
  thead.appendChild(trh);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  const keyword = $("#searchInput").value.toLowerCase().trim();

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
      const bEdit = document.createElement("button");
      bEdit.className = "btn"; bEdit.textContent = "Sửa";
      bEdit.onclick = () => startEdit(r);
      const bDel = document.createElement("button");
      bDel.className = "btn danger"; bDel.textContent = "Xóa";
      bDel.onclick = () => doDelete(r[cfg.idKey]);
      tdA.append(bEdit, " ", bDel);
      tr.appendChild(tdA);
      tbody.appendChild(tr);
    });
  table.appendChild(tbody);
}

function formDataToObj() {
  const obj = {};
  for (const el of $("#crudForm").elements) {
    if (!el.name) continue;
    obj[el.name] = el.value || null;
  }
  return obj;
}

async function doSubmit(e) {
  e.preventDefault();
  const cfg = ENTITIES[currentEntity];
  const data = formDataToObj();
  try {
    if (editingId) {
      await fetch(`${API_BASE}/${currentEntity}/${encodeURIComponent(editingId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      toast("Đã cập nhật");
    } else {
      if (!data[cfg.idKey]) return toast(`Thiếu ${cfg.idKey}`, false);
      await fetch(`${API_BASE}/${currentEntity}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      toast("Đã thêm mới");
    }
    editingId = null;
    $("#submitBtn").textContent = "Thêm mới";
    $("#crudForm").reset();
    await loadTable();
  } catch (err) {
    toast(err.message || "Lỗi", false);
  }
}

function startEdit(row) {
  const cfg = ENTITIES[currentEntity];
  editingId = row[cfg.idKey];
  $("#submitBtn").textContent = "Lưu thay đổi";
  for (const el of $("#crudForm").elements) {
    if (!el.name) continue;
    el.value = row[el.name] ?? "";
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function doDelete(id) {
  if (!confirm("Xóa bản ghi này?")) return;
  await fetch(`${API_BASE}/${currentEntity}/${encodeURIComponent(id)}`, { method: "DELETE" });
  toast("Đã xóa");
  await loadTable();
}

// ======= Khởi tạo =======
async function init() {
  // fill select entity
  const sel = $("#entitySelect");
  sel.innerHTML = "";
  for (const key of Object.keys(ENTITIES)) {
    const opt = document.createElement("option");
    opt.value = key; opt.textContent = ENTITIES[key].title + ` (${key})`;
    sel.appendChild(opt);
  }
  sel.value = currentEntity;
  sel.onchange = async () => {
    currentEntity = sel.value;
    editingId = null;
    $("#submitBtn").textContent = "Thêm mới";
    cacheOptions = {}; // refresh options
    await renderForm();
    await loadTable();
  };

  $("#searchInput").oninput = () => loadTable();
  $("#reloadBtn").onclick = () => loadTable();
  $("#crudForm").addEventListener("submit", doSubmit);
  $("#cancelBtn").onclick = () => {
    editingId = null;
    $("#submitBtn").textContent = "Thêm mới";
    $("#crudForm").reset();
  };

  await renderForm();
  await loadTable();
}

init();
