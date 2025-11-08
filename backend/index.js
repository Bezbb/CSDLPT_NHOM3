const express = require("express");
const cors = require("cors");
const { sql, getPool } = require("./db");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ====== Bản đồ entity -> bảng, khóa, cột & kiểu dữ liệu ======
const ENTITIES = {
  headquarter: {
    table: "dbo.headquarter",
    idKey: "ID",
    cols: {
      ID: sql.NVarChar(255),
      name_headquarter: sql.NVarChar(255),
      address: sql.NVarChar(255),
    }
  },
  department: {
    table: "dbo.department",
    idKey: "ID",
    cols: {
      ID: sql.NVarChar(255),
      name_department: sql.NVarChar(255),
      ID_headquarter: sql.NVarChar(255),
    }
  },
  teacher: {
    table: "dbo.teacher",
    idKey: "ID",
    cols: {
      ID: sql.NVarChar(255),
      name_teacher: sql.NVarChar(255),
      address_teacher: sql.NVarChar(255),
      degree: sql.NVarChar(255),
      phone_teacher: sql.NVarChar(255),
      ID_department: sql.NVarChar(255),
    }
  },
  subject: {
    table: "dbo.subject",
    idKey: "ID",
    cols: {
      ID: sql.NVarChar(255),
      name_subject: sql.NVarChar(255),
      number_of_credit: sql.Int,
    }
  },
  class: {
    table: "dbo.class",
    idKey: "ID",
    cols: {
      ID: sql.NVarChar(255),
      semester: sql.Int,
      school_year: sql.Int,
      number_of_student: sql.Int,
      shift: sql.Int,
      ID_subject: sql.NVarChar(255),
      ID_teacher: sql.NVarChar(255),
    }
  },
  student: {
    table: "dbo.student",
    idKey: "ID",
    cols: {
      ID: sql.NVarChar(255),
      name_student: sql.NVarChar(255),
      date_of_birth: sql.Date,
      address_student: sql.NVarChar(255),
      formal_class: sql.NVarChar(255),
      year_of_admission: sql.Int,
      phone_student: sql.VarChar(255),
      ID_department: sql.NVarChar(255),
    }
  },
  point: {
    table: "dbo.point",
    idKey: "ID",
    cols: {
      ID: sql.NVarChar(255),
      mark_diligence: sql.Real,
      mark_test: sql.Real,
      mark_practice: sql.Real,
      mark_exam: sql.Real,
      ID_class: sql.NVarChar(255),
      ID_student: sql.NVarChar(255),
    }
  }
};

function ensureEntity(name) {
  const ent = ENTITIES[name];
  if (!ent) {
    const allowed = Object.keys(ENTITIES).join(", ");
    const err = new Error(`Invalid entity "${name}". Allowed: ${allowed}`);
    err.status = 400;
    throw err;
  }
  return ent;
}

// ====== CRUD generic: /api/:entity ======

// List all
app.get("/api/:entity", async (req, res, next) => {
  try {
    const ent = ensureEntity(req.params.entity);
    const pool = await getPool();
    const cols = Object.keys(ent.cols).join(", ");
    const r = await pool.request().query(`SELECT ${cols} FROM ${ent.table}`);
    res.json(r.recordset);
  } catch (e) { next(e); }
});

// Create
app.post("/api/:entity", async (req, res, next) => {
  try {
    const ent = ensureEntity(req.params.entity);
    const payload = req.body || {};
    if (!payload[ent.idKey]) return res.status(400).json({ error: `${ent.idKey} is required` });

    const cols = Object.keys(ent.cols);
    const colList = cols.join(", ");
    const valList = cols.map(c => "@" + c).join(", ");

    const pool = await getPool();
    const reqst = pool.request();
    for (const c of cols) reqst.input(c, ent.cols[c], payload[c] ?? null);
    await reqst.query(`INSERT INTO ${ent.table} (${colList}) VALUES (${valList})`);
    res.sendStatus(201);
  } catch (e) { next(e); }
});

// Update
app.put("/api/:entity/:id", async (req, res, next) => {
  try {
    const ent = ensureEntity(req.params.entity);
    const id = req.params.id;
    const cols = Object.keys(ent.cols).filter(c => c !== ent.idKey);

    const setClause = cols.map(c => `${c}=@${c}`).join(", ");
    const pool = await getPool();
    const reqst = pool.request().input("id", ent.cols[ent.idKey], id);
    for (const c of cols) reqst.input(c, ent.cols[c], req.body?.[c] ?? null);

    await reqst.query(`UPDATE ${ent.table} SET ${setClause} WHERE ${ent.idKey}=@id`);
    res.sendStatus(204);
  } catch (e) { next(e); }
});

// Delete
app.delete("/api/:entity/:id", async (req, res, next) => {
  try {
    const ent = ensureEntity(req.params.entity);
    const id = req.params.id;
    const pool = await getPool();
    await pool.request()
      .input("id", ent.cols[ent.idKey], id)
      .query(`DELETE FROM ${ent.table} WHERE ${ent.idKey}=@id`);
    res.sendStatus(204);
  } catch (e) { next(e); }
});

// ====== Phục vụ frontend tĩnh ======
const path = require("path");
app.use(express.static(path.join(__dirname, "../frontend")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ API running http://localhost:${PORT}`));
