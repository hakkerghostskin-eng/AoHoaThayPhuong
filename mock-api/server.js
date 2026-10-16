const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;
const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "store.json");

const defaultStore = {
    users: [
        {
            id: "admin-01",
            email: "admin@medicloud.com",
            password: "123456",
            name: "Admin",
            role: "admin",
            roleName: "Quan tri vien"
        }
    ],
    patients: {
        BN001: { id: "BN001", name: "Nguyen Van A", age: "20", gender: "Nam", blood: "O+", phone: "0901 234 567", avatar: "N", visits: "08", doctors: "05", medicines: "12", lastVisit: "12/09/2026" },
        BN002: { id: "BN002", name: "Tran Thi B", age: "28", gender: "Nu", blood: "A+", phone: "0912 345 678", avatar: "B", visits: "05", doctors: "03", medicines: "07", lastVisit: "08/09/2026" },
        BN003: { id: "BN003", name: "Le Van C", age: "33", gender: "Nam", blood: "B+", phone: "0987 654 321", avatar: "C", visits: "12", doctors: "06", medicines: "15", lastVisit: "05/09/2026" },
        BN004: { id: "BN004", name: "Pham Thi D", age: "26", gender: "Nu", blood: "AB+", phone: "0977 123 456", avatar: "D", visits: "04", doctors: "02", medicines: "06", lastVisit: "01/09/2026" }
    }
};

function ensureDataFile() {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(dataFile)) {
        fs.writeFileSync(dataFile, JSON.stringify(defaultStore, null, 2), "utf8");
    }
}

function readStore() {
    ensureDataFile();
    return JSON.parse(fs.readFileSync(dataFile, "utf8"));
}

function writeStore(store) {
    ensureDataFile();
    fs.writeFileSync(dataFile, JSON.stringify(store, null, 2), "utf8");
}

app.use(cors());
app.use(express.json());

app.get("/api/health", function(request, response) {
    response.json({
        status: "ok",
        service: "mock-api"
    });
});

app.get("/api/services", function(request, response) {
    response.json({
        services: [
            { name: "frontend", status: "online" },
            { name: "mock-api", status: "online" }
        ]
    });
});

app.post("/api/auth/login", function(request, response) {
    const email = String(request.body.email || "").trim().toLowerCase();
    const password = String(request.body.password || "");
    const store = readStore();

    const user = store.users.find(function(item) {
        return item.email === email && item.password === password;
    });

    if (!user) {
        response.status(401).json({
            error: "Email hoac mat khau khong chinh xac."
        });
        return;
    }

    response.json({
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            roleName: user.roleName
        }
    });
});

app.get("/api/patients", function(request, response) {
    const store = readStore();
    response.json({
        patients: Object.values(store.patients)
    });
});

app.get("/api/patients/:id", function(request, response) {
    const store = readStore();
    const patient = store.patients[request.params.id];

    if (!patient) {
        response.status(404).json({
            error: "Khong tim thay benh nhan."
        });
        return;
    }

    response.json({ patient: patient });
});

app.put("/api/patients/:id", function(request, response) {
    const store = readStore();
    const id = request.params.id;
    const payload = Object.assign({}, request.body, {
        id: id
    });

    store.patients[id] = payload;
    writeStore(store);

    response.json({
        message: "Luu ho so thanh cong.",
        patient: store.patients[id]
    });
});

app.listen(port, function() {
    ensureDataFile();
    console.log("Mock API is running on port " + port);
});
