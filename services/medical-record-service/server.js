const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = Number(process.env.PORT || 3004);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

function mapRecord(row) {
    return {
        id: row.id,
        patientId: row.patient_id,
        title: row.title,
        doctorName: row.doctor_name,
        department: row.department,
        diagnosis: row.diagnosis,
        type: row.record_type,
        recordDate: row.record_date,
        status: row.status
    };
}

app.get("/health", function(request, response) {
    response.json({
        status: "ok",
        service: "medical-record-service"
    });
});

app.get("/medical-records", async function(request, response) {
    const patientId = String(request.query.patientId || "").trim();

    if (!patientId) {
        response.status(400).json({
            error: "patientId la bat buoc."
        });
        return;
    }

    try {
        const result = await pool.query(
            `
                select id, patient_id, title, doctor_name, department, diagnosis, record_type, record_date, status
                from medical_records
                where patient_id = $1
                order by record_date desc
            `,
            [patientId]
        );

        response.json({
            records: result.rows.map(mapRecord)
        });
    } catch (error) {
        console.error("medical-record-service list error:", error.message);
        response.status(500).json({
            error: "Khong the tai ho so benh an."
        });
    }
});

app.listen(port, function() {
    console.log("medical-record-service listening on port " + port);
});
