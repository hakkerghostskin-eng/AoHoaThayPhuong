const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = Number(process.env.PORT || 3001);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

app.use(express.json());

app.get("/health", function(request, response) {
    response.json({
        status: "ok",
        service: "auth-service"
    });
});

app.post("/auth/login", async function(request, response) {
    const email = String(request.body.email || "").trim().toLowerCase();
    const password = String(request.body.password || "");

    if (!email || !password) {
        response.status(400).json({
            error: "Email va mat khau la bat buoc."
        });
        return;
    }

    try {
        const result = await pool.query(
            `
                select id, email, name, role, role_name
                from app_users
                where email = $1 and password = $2
                limit 1
            `,
            [email, password]
        );

        if (result.rows.length === 0) {
            response.status(401).json({
                error: "Email hoac mat khau khong chinh xac."
            });
            return;
        }

        response.json({
            user: {
                id: result.rows[0].id,
                email: result.rows[0].email,
                name: result.rows[0].name,
                role: result.rows[0].role,
                roleName: result.rows[0].role_name
            }
        });
    } catch (error) {
        console.error("auth-service login error:", error.message);
        response.status(500).json({
            error: "Khong the xac thuc nguoi dung."
        });
    }
});

app.listen(port, function() {
    console.log("auth-service listening on port " + port);
});
