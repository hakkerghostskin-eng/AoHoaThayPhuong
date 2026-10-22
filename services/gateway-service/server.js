const express = require("express");
const cors = require("cors");

const app = express();
const port = Number(process.env.PORT || 3000);

// Bật CORS cho phép mọi nguồn truy cập từ Frontend
app.use(cors());
app.use(express.json());

const targets = {
    auth: process.env.AUTH_SERVICE_URL || "http://auth-service:3001",
    patients: process.env.PATIENT_SERVICE_URL || "http://patient-service:3002",
    appointments: process.env.APPOINTMENT_SERVICE_URL || "http://appointment-service:3003",
    medicalRecords: process.env.MEDICAL_RECORD_SERVICE_URL || "http://medical-record-service:3004"
};

function cleanHeaders(headers) {
    const nextHeaders = Object.assign({}, headers);
    delete nextHeaders.host;
    delete nextHeaders.connection;
    delete nextHeaders["content-length"];
    return nextHeaders;
}

async function safeJsonFetch(url) {
    try {
        const response = await fetch(url);
        const payload = await response.json();
        return {
            status: response.ok ? "online" : "degraded",
            details: payload
        };
    } catch (error) {
        return {
            status: "offline",
            details: {
                error: error.message
            }
        };
    }
}

async function forwardRequest(request, response, targetUrl, serviceName) {
    const method = request.method.toUpperCase();
    const hasBody = !["GET", "HEAD"].includes(method);
    const outgoingHeaders = cleanHeaders(request.headers);
    const outgoingBody = hasBody ? JSON.stringify(request.body || {}) : undefined;

    if (hasBody) {
        outgoingHeaders["content-type"] = "application/json";
    }

    try {
        const upstreamResponse = await fetch(targetUrl, {
            method: method,
            headers: outgoingHeaders,
            body: outgoingBody
        });

        const text = await upstreamResponse.text();
        const contentType = upstreamResponse.headers.get("content-type") || "application/json";

        response.status(upstreamResponse.status);
        response.setHeader("Content-Type", contentType);
        response.send(text);
    } catch (error) {
        response.status(502).json({
            error: "Gateway khong the ket noi den " + serviceName + ".",
            service: serviceName
        });
    }
}

app.get("/api/health", function(request, response) {
    response.json({
        status: "ok",
        service: "gateway-service"
    });
});

app.get("/api/services", async function(request, response) {
    const [auth, patients, appointments, medicalRecords] = await Promise.all([
        safeJsonFetch(targets.auth + "/health"),
        safeJsonFetch(targets.patients + "/health"),
        safeJsonFetch(targets.appointments + "/health"),
        safeJsonFetch(targets.medicalRecords + "/health")
    ]);

    response.json({
        services: [
            { name: "gateway-service", status: "online" },
            { name: "auth-service", status: auth.status },
            { name: "patient-service", status: patients.status },
            { name: "appointment-service", status: appointments.status },
            { name: "medical-record-service", status: medicalRecords.status },
            { name: "postgres", status: "online" }
        ]
    });
});

// Sử dụng request.url để tự động map chuẩn xác các endpoint sang service con
app.use("/api/auth", function(request, response) {
    const targetUrl = targets.auth + request.url;
    forwardRequest(request, response, targetUrl, "auth-service");
});

app.use("/api/patients", function(request, response) {
    const targetUrl = targets.patients + request.url;
    forwardRequest(request, response, targetUrl, "patient-service");
});

app.use("/api/appointments", function(request, response) {
    const targetUrl = targets.appointments + request.url;
    forwardRequest(request, response, targetUrl, "appointment-service");
});

app.use("/api/medical-records", function(request, response) {
    const targetUrl = targets.medicalRecords + request.url;
    forwardRequest(request, response, targetUrl, "medical-record-service");
});

app.listen(port, function() {
    console.log("gateway-service listening on port " + port);
});
