const defaultPatients = {
    BN001: { name: "Nguyen Van A", age: "20", gender: "Nam", blood: "O+", phone: "0901 234 567", avatar: "N", visits: "08", doctors: "05", medicines: "12", lastVisit: "12/09/2026" },
    BN002: { name: "Tran Thi B", age: "28", gender: "Nu", blood: "A+", phone: "0912 345 678", avatar: "B", visits: "05", doctors: "03", medicines: "07", lastVisit: "08/09/2026" },
    BN003: { name: "Le Van C", age: "33", gender: "Nam", blood: "B+", phone: "0987 654 321", avatar: "C", visits: "12", doctors: "06", medicines: "15", lastVisit: "05/09/2026" },
    BN004: { name: "Pham Thi D", age: "26", gender: "Nu", blood: "AB+", phone: "0977 123 456", avatar: "D", visits: "04", doctors: "02", medicines: "06", lastVisit: "01/09/2026" }
};

let patients = Object.assign({}, defaultPatients);
let currentPatientId = null;

function getPatientId() {
    return new URLSearchParams(window.location.search).get("id") || "BN001";
}

function renderPatient(patient) {
    document.getElementById("patientName").textContent = patient.name;
    document.getElementById("patientAvatar").textContent = patient.avatar;
    document.getElementById("patientAge").textContent = "Age: " + patient.age;
    document.getElementById("patientGender").textContent = "Gender: " + patient.gender;
    document.getElementById("patientBlood").textContent = "Blood: " + patient.blood;
    document.getElementById("patientPhone").textContent = "Phone: " + patient.phone;

    document.getElementById("visitCount").textContent = patient.visits;
    document.getElementById("doctorCount").textContent = patient.doctors;
    document.getElementById("medicineCount").textContent = patient.medicines;
    document.getElementById("lastVisit").textContent = patient.lastVisit;

    document.title = "Ho so " + patient.name + " - MediCloud";
}

async function loadSelectedPatient() {
    currentPatientId = getPatientId();
    const fallbackPatient = defaultPatients[currentPatientId] || defaultPatients.BN001;
    const patient = await window.MediCloudBackend.getPatient(currentPatientId, fallbackPatient);

    patients[currentPatientId] = patient;
    renderPatient(patient);
}

window.openEditForm = function() {
    const patient = patients[currentPatientId];

    if (!patient) {
        return;
    }

    document.getElementById("editName").value = patient.name;
    document.getElementById("editAge").value = patient.age;
    document.getElementById("editGender").value = patient.gender;
    document.getElementById("editBlood").value = patient.blood;
    document.getElementById("editPhone").value = patient.phone;
    document.getElementById("editVisits").value = patient.visits;
    document.getElementById("editDoctors").value = patient.doctors;
    document.getElementById("editMedicines").value = patient.medicines;
    document.getElementById("editLastVisit").value = patient.lastVisit;

    document.getElementById("editModal").classList.add("show");
};

window.closeEditForm = function() {
    document.getElementById("editModal").classList.remove("show");
};

window.savePatient = async function(event) {
    event.preventDefault();

    const name = document.getElementById("editName").value.trim();
    const patientPayload = {
        name: name,
        age: document.getElementById("editAge").value,
        gender: document.getElementById("editGender").value,
        blood: document.getElementById("editBlood").value,
        phone: document.getElementById("editPhone").value.trim(),
        avatar: name.charAt(0).toUpperCase(),
        visits: document.getElementById("editVisits").value.padStart(2, "0"),
        doctors: document.getElementById("editDoctors").value.padStart(2, "0"),
        medicines: document.getElementById("editMedicines").value.padStart(2, "0"),
        lastVisit: document.getElementById("editLastVisit").value.trim()
    };

    try {
        const savedPatient = await window.MediCloudBackend.savePatient(currentPatientId, patientPayload);
        patients[currentPatientId] = savedPatient;
        renderPatient(savedPatient);
        window.closeEditForm();
        alert("Da luu thay doi ho so cua " + savedPatient.name);
    } catch (error) {
        alert("Khong the luu ho so: " + error.message);
    }
};

window.filterRecords = function() {
    const year = document.getElementById("yearFilter").value;
    const type = document.getElementById("typeFilter").value;
    const records = document.querySelectorAll(".record-card");
    let count = 0;

    records.forEach(function(record) {
        const recordYear = record.dataset.year;
        const recordType = record.dataset.type;
        const yearMatch = year === "all" || recordYear === year;
        const typeMatch = type === "all" || recordType === type;

        if (yearMatch && typeMatch) {
            record.style.display = "flex";
            count += 1;
        } else {
            record.style.display = "none";
        }
    });

    document.getElementById("emptyRecords").style.display = count === 0 ? "block" : "none";
};

window.viewRecord = function(name) {
    const patient = patients[currentPatientId] || defaultPatients.BN001;

    alert(
        name + "\n\n" +
        "Benh nhan: " + patient.name + "\n" +
        "Chan doan/chi tiet: xem noi dung kham ben duoi."
    );
};

window.viewPrescription = function() {
    alert("Dang mo don thuoc...");
};

window.downloadRecords = function() {
    alert("Ho so benh an dang duoc chuan bi de tai xuong.");
};

document.addEventListener("DOMContentLoaded", loadSelectedPatient);
