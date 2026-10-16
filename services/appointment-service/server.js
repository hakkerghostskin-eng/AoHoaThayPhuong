const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = Number(process.env.PORT || 3003);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

app.use(express.json());

function mapAppointment(row) {
    return {
        id: row.id,
        patientId: row.patient_id,
        patientName: row.patient_name,
        patientAvatar: row.patient_avatar,
        doctorName: row.doctor_name,
        doctorAvatar: row.doctor_avatar,
        department: row.department,
        reason: row.reason,
        appointmentDate: row.appointment_date,
        appointmentTime: row.appointment_time,
        status: row.status
    };
}

async function nextAppointmentId() {
    const result = await pool.query(
        `
            select coalesce(max(cast(substring(id from 3) as integer)), 0) + 1 as next_id
            from appointments
            where id ~ '^AP[0-9]+$'
        `
    );

    return "AP" + String(result.rows[0].next_id).padStart(3, "0");
}

app.get("/health", function(request, response) {
    response.json({
        status: "ok",
        service: "appointment-service"
    });
});

app.get("/appointments", async function(request, response) {
    const patientId = String(request.query.patientId || "").trim();

    try {
        const query = patientId
            ? {
                text: `
                    select id, patient_id, patient_name, patient_avatar, doctor_name, doctor_avatar,
                           department, reason, appointment_date, appointment_time, status
                    from appointments
                    where patient_id = $1
                    order by appointment_date, appointment_time
                `,
                values: [patientId]
            }
            : {
                text: `
                    select id, patient_id, patient_name, patient_avatar, doctor_name, doctor_avatar,
                           department, reason, appointment_date, appointment_time, status
                    from appointments
                    order by appointment_date, appointment_time
                `,
                values: []
            };

        const result = await pool.query(query.text, query.values);

        response.json({
            appointments: result.rows.map(mapAppointment)
        });
    } catch (error) {
        console.error("appointment-service list error:", error.message);
        response.status(500).json({
            error: "Khong the tai danh sach lich hen."
        });
    }
});

app.post("/appointments", async function(request, response) {
    const payload = request.body || {};
    const patientName = String(payload.patientName || "").trim();
    const doctorName = String(payload.doctorName || "").trim();

    if (!patientName || !doctorName) {
        response.status(400).json({
            error: "Ten benh nhan va ten bac si la bat buoc."
        });
        return;
    }

    try {
        const appointmentId = await nextAppointmentId();
        const appointment = {
            id: appointmentId,
            patientId: String(payload.patientId || appointmentId.replace("AP", "BN")).trim().toUpperCase(),
            patientName: patientName,
            patientAvatar: String(payload.patientAvatar || patientName.charAt(0).toUpperCase()),
            doctorName: doctorName,
            doctorAvatar: String(payload.doctorAvatar || doctorName.replace(/^BS\.\s*/i, "").charAt(0).toUpperCase()),
            department: String(payload.department || "Tong quat"),
            reason: String(payload.reason || "Kham tong quat"),
            appointmentDate: String(payload.appointmentDate || ""),
            appointmentTime: String(payload.appointmentTime || ""),
            status: String(payload.status || "Đã xác nhận")
        };

        const result = await pool.query(
            `
                insert into appointments(
                    id, patient_id, patient_name, patient_avatar, doctor_name, doctor_avatar,
                    department, reason, appointment_date, appointment_time, status
                )
                values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                returning id, patient_id, patient_name, patient_avatar, doctor_name, doctor_avatar,
                          department, reason, appointment_date, appointment_time, status
            `,
            [
                appointment.id,
                appointment.patientId,
                appointment.patientName,
                appointment.patientAvatar,
                appointment.doctorName,
                appointment.doctorAvatar,
                appointment.department,
                appointment.reason,
                appointment.appointmentDate,
                appointment.appointmentTime,
                appointment.status
            ]
        );

        response.status(201).json({
            message: "Them lich hen thanh cong.",
            appointment: mapAppointment(result.rows[0])
        });
    } catch (error) {
        console.error("appointment-service create error:", error.message);
        response.status(500).json({
            error: "Khong the them lich hen."
        });
    }
});

app.listen(port, function() {
    console.log("appointment-service listening on port " + port);
});
