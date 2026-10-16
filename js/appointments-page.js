document.addEventListener("DOMContentLoaded", function() {
    const backend = window.MediCloudBackend;
    const tableBody = document.getElementById("appointmentTableBody");
    const searchInput = document.getElementById("appointmentSearch");
    const statusFilter = document.getElementById("statusFilter");
    const departmentFilter = document.getElementById("departmentFilter");
    const periodFilter = document.getElementById("periodFilter");
    const addButton = document.getElementById("addAppointmentButton");
    const countBox = document.getElementById("appointmentCount");
    const state = {
        appointments: [],
        patients: []
    };

    if (!backend || !tableBody) {
        return;
    }

    injectAppointmentModal();
    bindFilters();
    loadData();

    function bindFilters() {
        [searchInput, statusFilter, departmentFilter, periodFilter].forEach(function(element) {
            if (!element) {
                return;
            }

            element.addEventListener("input", renderAppointments);
            element.addEventListener("change", renderAppointments);
        });

        if (addButton) {
            addButton.addEventListener("click", openModal);
        }
    }

    async function loadData() {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px">Dang tai lich hen...</td></tr>';

        try {
            const results = await Promise.all([
                backend.getAppointments(),
                backend.getPatients()
            ]);

            state.appointments = sortAppointments(results[0] || []);
            state.patients = (results[1] || []).slice().sort(function(a, b) {
                return a.name.localeCompare(b.name, "vi");
            });

            populatePatientOptions();
            renderAppointments();
        } catch (error) {
            tableBody.innerHTML =
                '<tr><td colspan="7" style="text-align:center;padding:24px;color:#dc2626">Khong the tai lich hen: ' +
                escapeHtml(error.message) +
                "</td></tr>";
        }
    }

    function renderAppointments() {
        const filtered = state.appointments.filter(function(appointment) {
            return matchesKeyword(appointment) &&
                matchesStatus(appointment) &&
                matchesDepartment(appointment) &&
                matchesPeriod(appointment);
        });

        if (countBox) {
            countBox.textContent = "Hiển thị " + filtered.length + " lịch hẹn trong tổng số " + state.appointments.length;
        }

        if (filtered.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px">Khong co lich hen phu hop.</td></tr>';
            return;
        }

        tableBody.innerHTML = filtered.map(function(appointment) {
            const statusClass = getStatusClass(appointment.status);

            return [
                "<tr>",
                "  <td>",
                '    <div class="patient-info">',
                '      <div class="avatar">' + escapeHtml(appointment.patientAvatar || "BN") + "</div>",
                "      <div>",
                '        <div class="patient-name">' + escapeHtml(appointment.patientName) + "</div>",
                '        <div class="patient-id">' + escapeHtml(appointment.patientId) + "</div>",
                "      </div>",
                "    </div>",
                "  </td>",
                "  <td>",
                '    <div class="appointment-time">' + escapeHtml(appointment.appointmentTime || "--:--") + "</div>",
                '    <div class="appointment-date">' + escapeHtml(appointment.appointmentDate || "Chua cap nhat") + "</div>",
                "  </td>",
                "  <td>",
                '    <div class="doctor-info">',
                '      <div class="avatar">' + escapeHtml(appointment.doctorAvatar || "BS") + "</div>",
                '      <div class="doctor-name">' + escapeHtml(appointment.doctorName) + "</div>",
                "    </div>",
                "  </td>",
                '  <td><span class="department">' + escapeHtml(appointment.department || "Tong quat") + "</span></td>",
                "  <td>" + escapeHtml(appointment.reason || "Kham tong quat") + "</td>",
                '  <td><span class="status ' + statusClass + '">' + escapeHtml(appointment.status || "Đã xác nhận") + "</span></td>",
                "  <td>",
                '    <div class="action-buttons">',
                '      <button class="action-btn appointment-view-btn" data-patient-id="' + escapeHtml(appointment.patientId) + '" title="Xem ho so">👁</button>',
                '      <button class="action-btn appointment-info-btn" data-appointment-id="' + escapeHtml(appointment.id) + '" title="Chi tiet">ℹ</button>',
                '      <button class="action-btn delete appointment-cancel-btn" data-appointment-id="' + escapeHtml(appointment.id) + '" title="Thong bao">🗑</button>',
                "    </div>",
                "  </td>",
                "</tr>"
            ].join("");
        }).join("");

        tableBody.querySelectorAll(".appointment-view-btn").forEach(function(button) {
            button.addEventListener("click", function() {
                window.location.href = "medical-records.html?id=" + encodeURIComponent(button.dataset.patientId);
            });
        });

        tableBody.querySelectorAll(".appointment-info-btn").forEach(function(button) {
            button.addEventListener("click", function() {
                const appointment = findAppointment(button.dataset.appointmentId);

                if (!appointment) {
                    return;
                }

                alert(
                    "Ma lich: " + appointment.id + "\n" +
                    "Benh nhan: " + appointment.patientName + " (" + appointment.patientId + ")\n" +
                    "Bac si: " + appointment.doctorName + "\n" +
                    "Thoi gian: " + appointment.appointmentTime + " " + appointment.appointmentDate + "\n" +
                    "Ly do: " + appointment.reason + "\n" +
                    "Trang thai: " + appointment.status
                );
            });
        });

        tableBody.querySelectorAll(".appointment-cancel-btn").forEach(function(button) {
            button.addEventListener("click", function() {
                const appointment = findAppointment(button.dataset.appointmentId);

                if (!appointment) {
                    return;
                }

                alert(
                    "Demo hien chi mo phong tao va xem lich hen.\n" +
                    "Neu can huy lich `" + appointment.id + "`, hay bo sung API DELETE/PATCH cho appointment-service."
                );
            });
        });
    }

    function injectAppointmentModal() {
        if (document.getElementById("appointmentModal")) {
            return;
        }

        const wrapper = document.createElement("div");
        wrapper.id = "appointmentModal";
        wrapper.style.display = "none";
        wrapper.style.position = "fixed";
        wrapper.style.inset = "0";
        wrapper.style.background = "rgba(15, 23, 42, 0.55)";
        wrapper.style.zIndex = "9999";
        wrapper.style.padding = "20px";
        wrapper.innerHTML = [
            '<div style="max-width:720px;margin:30px auto;background:#fff;border-radius:18px;padding:24px;box-shadow:0 20px 50px rgba(15,23,42,.2)">',
            '  <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:18px">',
            "    <div>",
            '      <h2 style="margin:0 0 6px">Them lich hen moi</h2>',
            '      <p style="margin:0;color:#64748b">Lich hen se duoc tao qua gateway `/api/appointments`.</p>',
            "    </div>",
            '    <button id="closeAppointmentModal" type="button" style="border:0;background:#e2e8f0;border-radius:10px;padding:8px 10px;cursor:pointer">Dong</button>',
            "  </div>",
            '  <form id="appointmentForm" style="display:grid;grid-template-columns:1fr 1fr;gap:14px">',
            '    <select name="patientId" style="padding:12px;border:1px solid #dbe3ef;border-radius:10px" required></select>',
            '    <input name="doctorName" placeholder="BS. Tran Minh" style="padding:12px;border:1px solid #dbe3ef;border-radius:10px" required>',
            '    <input name="department" placeholder="Noi khoa" style="padding:12px;border:1px solid #dbe3ef;border-radius:10px" required>',
            '    <input name="reason" placeholder="Kham tong quat" style="padding:12px;border:1px solid #dbe3ef;border-radius:10px" required>',
            '    <input name="appointmentDate" placeholder="03/10/2026" style="padding:12px;border:1px solid #dbe3ef;border-radius:10px" required>',
            '    <input name="appointmentTime" placeholder="08:30" style="padding:12px;border:1px solid #dbe3ef;border-radius:10px" required>',
            '    <select name="status" style="padding:12px;border:1px solid #dbe3ef;border-radius:10px;grid-column:1 / span 2">',
            '      <option>Đã xác nhận</option>',
            '      <option>Đang chờ</option>',
            '      <option>Đã khám</option>',
            '      <option>Đã hủy</option>',
            "    </select>",
            '    <div style="grid-column:1 / span 2;display:flex;justify-content:flex-end;gap:10px">',
            '      <button type="button" id="cancelAppointmentModal" style="border:0;background:#e2e8f0;color:#334155;padding:12px 14px;border-radius:10px;cursor:pointer">Huy</button>',
            '      <button type="submit" style="border:0;background:#2563eb;color:#fff;padding:12px 14px;border-radius:10px;cursor:pointer;font-weight:700">Luu lich hen</button>',
            "    </div>",
            "  </form>",
            "</div>"
        ].join("");

        document.body.appendChild(wrapper);

        document.getElementById("closeAppointmentModal").addEventListener("click", closeModal);
        document.getElementById("cancelAppointmentModal").addEventListener("click", closeModal);
        document.getElementById("appointmentForm").addEventListener("submit", submitAppointment);
    }

    function populatePatientOptions() {
        const select = document.querySelector('#appointmentForm select[name="patientId"]');

        if (!select) {
            return;
        }

        if (state.patients.length === 0) {
            select.innerHTML = '<option value="">Khong co benh nhan</option>';
            return;
        }

        select.innerHTML = state.patients.map(function(patient) {
            return '<option value="' + escapeHtml(patient.id) + '">' +
                escapeHtml(patient.id + " - " + patient.name) +
                "</option>";
        }).join("");
    }

    function openModal() {
        const modal = document.getElementById("appointmentModal");

        if (!modal) {
            return;
        }

        populatePatientOptions();
        modal.style.display = "block";
    }

    function closeModal() {
        const modal = document.getElementById("appointmentModal");

        if (!modal) {
            return;
        }

        modal.style.display = "none";
    }

    async function submitAppointment(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);
        const patientId = String(formData.get("patientId") || "").trim().toUpperCase();
        const patient = state.patients.find(function(item) {
            return item.id === patientId;
        });

        if (!patient) {
            alert("Khong tim thay benh nhan da chon.");
            return;
        }

        const appointmentPayload = {
            patientId: patient.id,
            patientName: patient.name,
            patientAvatar: patient.avatar || patient.name.charAt(0).toUpperCase(),
            doctorName: String(formData.get("doctorName") || "").trim(),
            doctorAvatar: String(formData.get("doctorName") || "").trim().replace(/^BS\.\s*/i, "").charAt(0).toUpperCase(),
            department: String(formData.get("department") || "").trim(),
            reason: String(formData.get("reason") || "").trim(),
            appointmentDate: String(formData.get("appointmentDate") || "").trim(),
            appointmentTime: String(formData.get("appointmentTime") || "").trim(),
            status: String(formData.get("status") || "Đã xác nhận").trim()
        };

        try {
            const appointment = await backend.createAppointment(appointmentPayload);
            state.appointments.push(appointment);
            state.appointments = sortAppointments(state.appointments);
            form.reset();
            populatePatientOptions();
            closeModal();
            renderAppointments();
            alert("Da them lich hen cho " + appointment.patientName + ".");
        } catch (error) {
            alert("Khong the them lich hen: " + error.message);
        }
    }

    function matchesKeyword(appointment) {
        const keyword = String(searchInput && searchInput.value || "").trim().toLowerCase();

        if (!keyword) {
            return true;
        }

        const haystack = [
            appointment.id,
            appointment.patientId,
            appointment.patientName,
            appointment.doctorName,
            appointment.department,
            appointment.reason,
            appointment.status
        ].join(" ").toLowerCase();

        return haystack.includes(keyword);
    }

    function matchesStatus(appointment) {
        const selected = String(statusFilter && statusFilter.value || "Tất cả trạng thái");
        return selected === "Tất cả trạng thái" || appointment.status === selected;
    }

    function matchesDepartment(appointment) {
        const selected = String(departmentFilter && departmentFilter.value || "Tất cả chuyên khoa");
        return selected === "Tất cả chuyên khoa" || appointment.department === selected;
    }

    function matchesPeriod(appointment) {
        const selected = String(periodFilter && periodFilter.value || "Tất cả thời gian");
        const date = parseDisplayDate(appointment.appointmentDate);

        if (selected === "Tất cả thời gian" || !date) {
            return true;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() + 7);
        const monthEnd = new Date(today);
        monthEnd.setMonth(today.getMonth() + 1);

        if (selected === "Hôm nay") {
            return isSameDay(date, today);
        }

        if (selected === "Ngày mai") {
            return isSameDay(date, tomorrow);
        }

        if (selected === "Tuần này") {
            return date >= today && date < weekEnd;
        }

        if (selected === "Tháng này") {
            return date >= today && date < monthEnd;
        }

        return true;
    }

    function findAppointment(id) {
        return state.appointments.find(function(item) {
            return item.id === id;
        });
    }

    function sortAppointments(items) {
        return items.slice().sort(function(a, b) {
            const dateA = parseDisplayDate(a.appointmentDate);
            const dateB = parseDisplayDate(b.appointmentDate);

            if (dateA && dateB && dateA.getTime() !== dateB.getTime()) {
                return dateA - dateB;
            }

            return String(a.appointmentTime || "").localeCompare(String(b.appointmentTime || ""));
        });
    }

    function parseDisplayDate(value) {
        const parts = String(value || "").trim().split("/");

        if (parts.length !== 3) {
            return null;
        }

        const day = Number(parts[0]);
        const month = Number(parts[1]) - 1;
        const year = Number(parts[2]);
        const date = new Date(year, month, day);

        if (Number.isNaN(date.getTime())) {
            return null;
        }

        date.setHours(0, 0, 0, 0);
        return date;
    }

    function isSameDay(a, b) {
        return a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate();
    }

    function getStatusClass(status) {
        switch (status) {
            case "Đang chờ":
                return "status-waiting";
            case "Đã khám":
                return "status-completed";
            case "Đã hủy":
                return "status-cancelled";
            default:
                return "status-confirmed";
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
