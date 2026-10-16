const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = Number(process.env.PORT || 3002);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

app.use(express.json());

function mapPatient(row) {
    return {
        id: row.id,
        name: row.name,
        age: row.age,
        gender: row.gender,
        blood: row.blood,
        phone: row.phone,
        avatar: row.avatar,
        visits: row.visits,
        doctors: row.doctors,
        medicines: row.medicines,
        lastVisit: row.last_visit
    };
}

app.get("/health", function(request, response) {
    response.json({
        status: "ok",
        service: "patient-service"
    });
});

app.get("/patients", async function(request, response) {
    try {
        const result = await pool.query(
            `
                select id, name, age, gender, blood, phone, avatar, visits, doctors, medicines, last_visit
                from patients
                order by id
            `
        );

        response.json({
            patients: result.rows.map(mapPatient)
        });
    } catch (error) {
        console.error("patient-service list error:", error.message);
        response.status(500).json({
            error: "Khong the tai danh sach benh nhan."
        });
    }
});

app.get("/patients/:id", async function(request, response) {
    try {
        const result = await pool.query(
            `
                select id, name, age, gender, blood, phone, avatar, visits, doctors, medicines, last_visit
                from patients
                where id = $1
                limit 1
            `,
            [request.params.id]
        );

        if (result.rows.length === 0) {
            response.status(404).json({
                error: "Khong tim thay benh nhan."
            });
            return;
        }

        response.json({
            patient: mapPatient(result.rows[0])
        });
    } catch (error) {
        console.error("patient-service get error:", error.message);
        response.status(500).json({
            error: "Khong the tai thong tin benh nhan."
        });
    }
});

app.post("/patients", async function(request, response) {
    const payload = request.body || {};
    const id = String(payload.id || "").trim().toUpperCase();
    const name = String(payload.name || "").trim();

    if (!id || !name) {
        response.status(400).json({
            error: "Ma benh nhan va ho ten la bat buoc."
        });
        return;
    }

    const patient = {
        id: id,
        name: name,
        age: String(payload.age || ""),
        gender: String(payload.gender || ""),
        blood: String(payload.blood || ""),
        phone: String(payload.phone || ""),
        avatar: String(payload.avatar || name.charAt(0).toUpperCase()),
        visits: String(payload.visits || "00").padStart(2, "0"),
        doctors: String(payload.doctors || "00").padStart(2, "0"),
        medicines: String(payload.medicines || "00").padStart(2, "0"),
        lastVisit: String(payload.lastVisit || "")
    };

    try {
        const result = await pool.query(
            `
                insert into patients(id, name, age, gender, blood, phone, avatar, visits, doctors, medicines, last_visit)
                values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                returning id, name, age, gender, blood, phone, avatar, visits, doctors, medicines, last_visit
            `,
            [
                patient.id,
                patient.name,
                patient.age,
                patient.gender,
                patient.blood,
                patient.phone,
                patient.avatar,
                patient.visits,
                patient.doctors,
                patient.medicines,
                patient.lastVisit
            ]
        );

        response.status(201).json({
            message: "Them benh nhan thanh cong.",
            patient: mapPatient(result.rows[0])
        });
    } catch (error) {
        const message = error.code === "23505"
            ? "Ma benh nhan da ton tai."
            : "Khong the them benh nhan.";

        console.error("patient-service create error:", error.message);
        response.status(error.code === "23505" ? 409 : 500).json({
            error: message
        });
    }
});

app.put("/patients/:id", async function(request, response) {
    const payload = request.body || {};
    const name = String(payload.name || "").trim();

    if (!name) {
        response.status(400).json({
            error: "Ho ten benh nhan la bat buoc."
        });
        return;
    }

    const patient = {
        id: request.params.id,
        name: name,
        age: String(payload.age || ""),
        gender: String(payload.gender || ""),
        blood: String(payload.blood || ""),
        phone: String(payload.phone || ""),
        avatar: String(payload.avatar || name.charAt(0).toUpperCase()),
        visits: String(payload.visits || "00").padStart(2, "0"),
        doctors: String(payload.doctors || "00").padStart(2, "0"),
        medicines: String(payload.medicines || "00").padStart(2, "0"),
        lastVisit: String(payload.lastVisit || "")
    };

    try {
        const result = await pool.query(
            `
                update patients
                set name = $2,
                    age = $3,
                    gender = $4,
                    blood = $5,
                    phone = $6,
                    avatar = $7,
                    visits = $8,
                    doctors = $9,
                    medicines = $10,
                    last_visit = $11
                where id = $1
                returning id, name, age, gender, blood, phone, avatar, visits, doctors, medicines, last_visit
            `,
            [
                patient.id,
                patient.name,
                patient.age,
                patient.gender,
                patient.blood,
                patient.phone,
                patient.avatar,
                patient.visits,
                patient.doctors,
                patient.medicines,
                patient.lastVisit
            ]
        );

        if (result.rows.length === 0) {
            response.status(404).json({
                error: "Khong tim thay benh nhan."
            });
            return;
        }

        response.json({
            message: "Cap nhat benh nhan thanh cong.",
            patient: mapPatient(result.rows[0])
        });
    } catch (error) {
        console.error("patient-service update error:", error.message);
        response.status(500).json({
            error: "Khong the cap nhat benh nhan."
        });
    }
});

app.listen(port, function() {
    console.log("patient-service listening on port " + port);
});
