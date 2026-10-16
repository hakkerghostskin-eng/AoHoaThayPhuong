document.addEventListener("DOMContentLoaded", function() {
    const backend = window.MediCloudBackend;
    const patientTable = document.getElementById("patientTable");
    const searchInput = document.getElementById("searchPatient");
    const cardHeader = document.querySelector(".card-header");
    const state = {
        patients: []
    };

    if (!backend || !patientTable) {
        return;
    }

    injectAddButton();
    injectModal();
    bindSearch();
    loadPatients();

    function injectAddButton() {
        if (!cardHeader || cardHeader.querySelector(".add-patient-btn")) {
            return;
        }

        const button = document.createElement("button");
        button.type = "button";
        button.className = "add-patient-btn";
        button.textContent = "+ Them benh nhan";
        button.style.border = "0";
        button.style.background = "#16a34a";
        button.style.color = "#fff";
        button.style.padding = "10px 14px";
        button.style.borderRadius = "10px";
        button.style.cursor = "pointer";
        button.style.fontWeight = "700";
        button.addEventListener("click", openModal);
        cardHeader.appendChild(button);
    }

    function injectModal() {
        if (document.getElementById("patientModal")) {
            return;
        }

        const wrapper = document.createElement("div");
        wrapper.id = "patientModal";
        wrapper.style.display = "none";
        wrapper.style.position = "fixed";
        wrapper.style.inset = "0";
        wrapper.style.background = "rgba(15, 23, 42, 0.55)";
        wrapper.style.zIndex = "9999";
        wrapper.style.padding = "20px";
        wrapper.innerHTML = [
            '<div style="max-width:640px;margin:40px auto;background:#fff;border-radius:18px;padding:24px;box-shadow:0 20px 50px rgba(15,23,42,.2)">',
            '  <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:18px">',
            "    <div>",
            "      <h2 style=\"margin:0 0 6px\">Them benh nhan moi</h2>",
            "      <p style=\"margin:0;color:#64748b\">Du lieu se duoc luu vao backend dang chay.</p>",
            "    </div>",
            '    <button id="closePatientModal" type="button" style="border:0;background:#e2e8f0;border-radius:10px;padding:8px 10px;cursor:pointer">Dong</button>',
            "  </div>",
            '  <form id="patientForm" style="display:grid;grid-template-columns:1fr 1fr;gap:14px">',
            '    <input name="id" placeholder="Ma BN, vd BN005" style="padding:12px;border:1px solid #dbe3ef;border-radius:10px" required>',
            '    <input name="name" placeholder="Ho ten" style="padding:12px;border:1px solid #dbe3ef;border-radius:10px" required>',
            '    <input name="age" placeholder="Tuoi" style="padding:12px;border:1px solid #dbe3ef;border-radius:10px">',
            '    <select name="gender" style="padding:12px;border:1px solid #dbe3ef;border-radius:10px"><option value="Nam">Nam</option><option value="Nu">Nu</option></select>',
            '    <input name="blood" placeholder="Nhom mau" style="padding:12px;border:1px solid #dbe3ef;border-radius:10px">',
            '    <input name="phone" placeholder="So dien thoai" style="padding:12px;border:1px solid #dbe3ef;border-radius:10px">',
            '    <input name="lastVisit" placeholder="Ngay kham gan nhat" style="padding:12px;border:1px solid #dbe3ef;border-radius:10px;grid-column:1 / span 2">',
            '    <div style="grid-column:1 / span 2;display:flex;justify-content:flex-end;gap:10px">',
            '      <button type="button" id="cancelPatientModal" style="border:0;background:#e2e8f0;color:#334155;padding:12px 14px;border-radius:10px;cursor:pointer">Huy</button>',
            '      <button type="submit" style="border:0;background:#2563eb;color:#fff;padding:12px 14px;border-radius:10px;cursor:pointer;font-weight:700">Luu benh nhan</button>',
            "    </div>",
            "  </form>",
            "</div>"
        ].join("");

        document.body.appendChild(wrapper);

        document.getElementById("closePatientModal").addEventListener("click", closeModal);
        document.getElementById("cancelPatientModal").addEventListener("click", closeModal);
        document.getElementById("patientForm").addEventListener("submit", submitPatient);
    }

    function openModal() {
        document.getElementById("patientModal").style.display = "block";
    }

    function closeModal() {
        document.getElementById("patientModal").style.display = "none";
    }

    function bindSearch() {
        window.searchPatients = renderPatients;

        if (searchInput) {
            searchInput.addEventListener("input", renderPatients);
        }
    }

    async function loadPatients() {
        patientTable.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px">Dang tai du lieu...</td></tr>';

        try {
            state.patients = await backend.getPatients();
            renderPatients();
        } catch (error) {
            patientTable.innerHTML =
                '<tr><td colspan="7" style="text-align:center;padding:20px;color:#dc2626">Khong the tai danh sach benh nhan: ' +
                error.message +
                "</td></tr>";
        }
    }

    function renderPatients() {
        const keyword = (searchInput ? searchInput.value : "").trim().toLowerCase();
        const filtered = state.patients.filter(function(patient) {
            const haystack = [
                patient.id,
                patient.name,
                patient.gender,
                patient.phone,
                patient.lastVisit
            ].join(" ").toLowerCase();

            return haystack.includes(keyword);
        });

        if (filtered.length === 0) {
            patientTable.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px">Khong co benh nhan phu hop.</td></tr>';
            return;
        }

        patientTable.innerHTML = filtered.map(function(patient) {
            return [
                "<tr>",
                "  <td><strong>" + escapeHtml(patient.id) + "</strong></td>",
                "  <td>" + escapeHtml(patient.name) + "</td>",
                "  <td>" + escapeHtml(patient.gender || "-") + "</td>",
                "  <td>" + escapeHtml(patient.age || "-") + "</td>",
                "  <td>" + escapeHtml(patient.phone || "-") + "</td>",
                '  <td><span class="status success">Dang hoat dong</span></td>',
                '  <td><button data-patient-id="' + escapeHtml(patient.id) + '" class="view-record-btn" style="border:0;background:#2563eb;color:white;padding:8px 12px;border-radius:8px;cursor:pointer;font-weight:600">Xem ho so</button></td>',
                "</tr>"
            ].join("");
        }).join("");

        patientTable.querySelectorAll(".view-record-btn").forEach(function(button) {
            button.addEventListener("click", function() {
                window.location.href = "medical-records.html?id=" + encodeURIComponent(button.dataset.patientId);
            });
        });
    }

    async function submitPatient(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const payload = {
            id: String(formData.get("id") || "").trim().toUpperCase(),
            name: String(formData.get("name") || "").trim(),
            age: String(formData.get("age") || "").trim(),
            gender: String(formData.get("gender") || "").trim(),
            blood: String(formData.get("blood") || "").trim(),
            phone: String(formData.get("phone") || "").trim(),
            lastVisit: String(formData.get("lastVisit") || "").trim(),
            visits: "00",
            doctors: "00",
            medicines: "00"
        };

        try {
            const patient = await backend.createPatient(payload);
            state.patients.push(patient);
            state.patients.sort(function(a, b) {
                return a.id.localeCompare(b.id);
            });
            event.target.reset();
            closeModal();
            renderPatients();
            alert("Da them benh nhan " + patient.name);
        } catch (error) {
            alert("Khong the them benh nhan: " + error.message);
        }
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }
});
