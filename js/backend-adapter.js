(function() {
    const config = window.MediCloudConfig || {};
    const currentUserKey = "currentUser";
    const firebaseAuthKey = "medicloudFirebaseAuth";

    function getProvider() {
        return (config.backendProvider || "local").toLowerCase();
    }

    function parseStoredJson(raw) {
        if (!raw) {
            return null;
        }

        try {
            return JSON.parse(raw);
        } catch (error) {
            return null;
        }
    }

    function getCurrentUser() {
        return parseStoredJson(
            localStorage.getItem(currentUserKey) ||
            sessionStorage.getItem(currentUserKey)
        );
    }

    function persistCurrentUser(user, rememberMe) {
        const serialized = JSON.stringify(user);

        if (rememberMe) {
            localStorage.setItem(currentUserKey, serialized);
            sessionStorage.removeItem(currentUserKey);
            return;
        }

        sessionStorage.setItem(currentUserKey, serialized);
        localStorage.removeItem(currentUserKey);
    }

    function getFirebaseAuth() {
        return parseStoredJson(
            localStorage.getItem(firebaseAuthKey) ||
            sessionStorage.getItem(firebaseAuthKey)
        );
    }

    function persistFirebaseAuth(authData, rememberMe) {
        const serialized = JSON.stringify(authData);

        if (rememberMe) {
            localStorage.setItem(firebaseAuthKey, serialized);
            sessionStorage.removeItem(firebaseAuthKey);
            return;
        }

        sessionStorage.setItem(firebaseAuthKey, serialized);
        localStorage.removeItem(firebaseAuthKey);
    }

    function requireConfig(name, value) {
        if (!value) {
            throw new Error("Thieu cau hinh " + name + ".");
        }
    }

    async function requestJson(url, options) {
        const response = await fetch(url, options);
        let payload = null;

        try {
            payload = await response.json();
        } catch (error) {
            payload = null;
        }

        if (!response.ok) {
            const message =
                payload && (payload.error || payload.message)
                    ? payload.error || payload.message
                    : "Khong the ket noi den backend.";

            throw new Error(message);
        }

        return payload;
    }

    function getSupabaseHeaders() {
        requireConfig("SUPABASE_URL", config.supabaseUrl);
        requireConfig("SUPABASE_ANON_KEY", config.supabaseAnonKey);

        return {
            apikey: config.supabaseAnonKey,
            Authorization: "Bearer " + config.supabaseAnonKey,
            "Content-Type": "application/json"
        };
    }

    function createClientId(prefix) {
        return prefix + String(Date.now()).slice(-6);
    }

    function toFirebaseUrl(path, token) {
        requireConfig("FIREBASE_DATABASE_URL", config.firebaseDatabaseUrl);

        return (
            config.firebaseDatabaseUrl.replace(/\/$/, "") +
            path +
            ".json?auth=" +
            encodeURIComponent(token)
        );
    }

    function ensureFirebaseToken() {
        const auth = getFirebaseAuth();

        if (!auth || !auth.idToken) {
            throw new Error("Chua dang nhap Firebase.");
        }

        return auth.idToken;
    }

    function normalizePatient(id, patient) {
        const safePatient = patient || {};
        const name = safePatient.name || "Benh nhan";

        return {
            id: id,
            name: name,
            age: String(safePatient.age || ""),
            gender: safePatient.gender || "",
            blood: safePatient.blood || "",
            phone: safePatient.phone || "",
            avatar: safePatient.avatar || name.charAt(0).toUpperCase(),
            visits: String(safePatient.visits || "00").padStart(2, "0"),
            doctors: String(safePatient.doctors || "00").padStart(2, "0"),
            medicines: String(safePatient.medicines || "00").padStart(2, "0"),
            lastVisit: safePatient.lastVisit || safePatient.last_visit || ""
        };
    }

    function normalizeAppointment(id, appointment) {
        const safeAppointment = appointment || {};
        const patientName = safeAppointment.patientName || safeAppointment.patient_name || "Benh nhan";
        const doctorName = safeAppointment.doctorName || safeAppointment.doctor_name || "BS. Chua cap nhat";

        return {
            id: id,
            patientId: safeAppointment.patientId || safeAppointment.patient_id || "",
            patientName: patientName,
            patientAvatar: safeAppointment.patientAvatar || safeAppointment.patient_avatar || patientName.charAt(0).toUpperCase(),
            doctorName: doctorName,
            doctorAvatar: safeAppointment.doctorAvatar || safeAppointment.doctor_avatar || doctorName.replace(/^BS\.\s*/i, "").charAt(0).toUpperCase(),
            department: safeAppointment.department || "Tong quat",
            reason: safeAppointment.reason || "Kham tong quat",
            appointmentDate: safeAppointment.appointmentDate || safeAppointment.appointment_date || "",
            appointmentTime: safeAppointment.appointmentTime || safeAppointment.appointment_time || "",
            status: safeAppointment.status || "Đã xác nhận"
        };
    }

    function normalizeRecord(id, record) {
        const safeRecord = record || {};

        return {
            id: id,
            patientId: safeRecord.patientId || safeRecord.patient_id || "",
            title: safeRecord.title || "Ho so kham",
            doctorName: safeRecord.doctorName || safeRecord.doctor_name || "",
            department: safeRecord.department || "",
            diagnosis: safeRecord.diagnosis || "",
            type: safeRecord.type || safeRecord.record_type || "routine",
            recordDate: safeRecord.recordDate || safeRecord.record_date || "",
            status: safeRecord.status || "Hoan tat"
        };
    }

    function normalizeFirebaseCollection(payload, mapper) {
        if (!payload) {
            return [];
        }

        return Object.keys(payload).map(function(key) {
            return mapper(key, payload[key]);
        });
    }

    function toSupabasePatientPayload(id, patient) {
        return {
            id: id,
            name: patient.name,
            age: patient.age,
            gender: patient.gender,
            blood: patient.blood,
            phone: patient.phone,
            avatar: patient.avatar,
            visits: patient.visits,
            doctors: patient.doctors,
            medicines: patient.medicines,
            last_visit: patient.lastVisit
        };
    }

    function toSupabaseAppointmentPayload(appointment) {
        return {
            id: appointment.id,
            patient_id: appointment.patientId,
            patient_name: appointment.patientName,
            patient_avatar: appointment.patientAvatar,
            doctor_name: appointment.doctorName,
            doctor_avatar: appointment.doctorAvatar,
            department: appointment.department,
            reason: appointment.reason,
            appointment_date: appointment.appointmentDate,
            appointment_time: appointment.appointmentTime,
            status: appointment.status
        };
    }

    const providers = {
        async login(credentials) {
            const provider = getProvider();

            if (provider === "supabase") {
                return providers.loginWithSupabase(credentials);
            }

            if (provider === "firebase") {
                return providers.loginWithFirebase(credentials);
            }

            return providers.loginWithLocalApi(credentials);
        },

        async loginWithLocalApi(credentials) {
            const payload = await requestJson(
                (config.apiBaseUrl || "/api") + "/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: credentials.email,
                        password: credentials.password
                    })
                }
            );

            persistCurrentUser(payload.user, credentials.rememberMe);
            return payload.user;
        },

        async loginWithSupabase(credentials) {
            const headers = getSupabaseHeaders();
            const url =
                config.supabaseUrl +
                "/rest/v1/app_users" +
                "?select=id,email,name,role,role_name" +
                "&email=eq." + encodeURIComponent(credentials.email) +
                "&password=eq." + encodeURIComponent(credentials.password) +
                "&limit=1";

            const users = await requestJson(url, {
                method: "GET",
                headers: headers
            });

            if (!Array.isArray(users) || users.length === 0) {
                throw new Error("Email hoac mat khau khong chinh xac.");
            }

            const user = {
                id: users[0].id,
                email: users[0].email,
                name: users[0].name,
                role: users[0].role,
                roleName: users[0].role_name
            };

            persistCurrentUser(user, credentials.rememberMe);
            return user;
        },

        async loginWithFirebase(credentials) {
            requireConfig("FIREBASE_API_KEY", config.firebaseApiKey);

            const authPayload = await requestJson(
                "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" +
                    encodeURIComponent(config.firebaseApiKey),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: credentials.email,
                        password: credentials.password,
                        returnSecureToken: true
                    })
                }
            );

            const user = {
                id: authPayload.localId,
                email: authPayload.email,
                name: "Firebase User",
                role: "admin",
                roleName: "Quan tri vien"
            };

            persistCurrentUser(user, credentials.rememberMe);
            persistFirebaseAuth(
                {
                    idToken: authPayload.idToken,
                    localId: authPayload.localId
                },
                credentials.rememberMe
            );

            return user;
        },

        async getPatients() {
            const provider = getProvider();

            if (provider === "supabase") {
                return providers.getPatientsFromSupabase();
            }

            if (provider === "firebase") {
                return providers.getPatientsFromFirebase();
            }

            return providers.getPatientsFromLocalApi();
        },

        async createPatient(patient) {
            const provider = getProvider();

            if (provider === "supabase") {
                return providers.createPatientInSupabase(patient);
            }

            if (provider === "firebase") {
                return providers.createPatientInFirebase(patient);
            }

            return providers.createPatientInLocalApi(patient);
        },

        async getPatient(id, fallbackPatient) {
            const provider = getProvider();

            if (provider === "supabase") {
                return providers.getPatientFromSupabase(id, fallbackPatient);
            }

            if (provider === "firebase") {
                return providers.getPatientFromFirebase(id, fallbackPatient);
            }

            return providers.getPatientFromLocalApi(id, fallbackPatient);
        },

        async savePatient(id, patient) {
            const provider = getProvider();

            if (provider === "supabase") {
                return providers.savePatientToSupabase(id, patient);
            }

            if (provider === "firebase") {
                return providers.savePatientToFirebase(id, patient);
            }

            return providers.savePatientToLocalApi(id, patient);
        },

        async getAppointments() {
            const provider = getProvider();

            if (provider === "supabase") {
                return providers.getAppointmentsFromSupabase();
            }

            if (provider === "firebase") {
                return providers.getAppointmentsFromFirebase();
            }

            return providers.getAppointmentsFromLocalApi();
        },

        async createAppointment(appointment) {
            const provider = getProvider();

            if (provider === "supabase") {
                return providers.createAppointmentInSupabase(appointment);
            }

            if (provider === "firebase") {
                return providers.createAppointmentInFirebase(appointment);
            }

            return providers.createAppointmentInLocalApi(appointment);
        },

        async getMedicalRecords(patientId) {
            const provider = getProvider();

            if (provider === "supabase") {
                return providers.getMedicalRecordsFromSupabase(patientId);
            }

            if (provider === "firebase") {
                return providers.getMedicalRecordsFromFirebase(patientId);
            }

            return providers.getMedicalRecordsFromLocalApi(patientId);
        },

        async getPatientsFromLocalApi() {
            const payload = await requestJson((config.apiBaseUrl || "/api") + "/patients", {
                method: "GET"
            });

            return (payload.patients || []).map(function(patient) {
                return normalizePatient(patient.id, patient);
            });
        },

        async createPatientInLocalApi(patient) {
            const payload = await requestJson((config.apiBaseUrl || "/api") + "/patients", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(patient)
            });

            return normalizePatient(payload.patient.id, payload.patient);
        },

        async getPatientFromLocalApi(id, fallbackPatient) {
            try {
                const payload = await requestJson(
                    (config.apiBaseUrl || "/api") + "/patients/" + encodeURIComponent(id),
                    {
                        method: "GET"
                    }
                );

                return normalizePatient(id, payload.patient);
            } catch (error) {
                return normalizePatient(id, fallbackPatient);
            }
        },

        async savePatientToLocalApi(id, patient) {
            const payload = await requestJson(
                (config.apiBaseUrl || "/api") + "/patients/" + encodeURIComponent(id),
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(patient)
                }
            );

            return normalizePatient(id, payload.patient);
        },

        async getAppointmentsFromLocalApi() {
            const payload = await requestJson((config.apiBaseUrl || "/api") + "/appointments", {
                method: "GET"
            });

            return (payload.appointments || []).map(function(appointment) {
                return normalizeAppointment(appointment.id, appointment);
            });
        },

        async createAppointmentInLocalApi(appointment) {
            const payload = await requestJson((config.apiBaseUrl || "/api") + "/appointments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(appointment)
            });

            return normalizeAppointment(payload.appointment.id, payload.appointment);
        },

        async getMedicalRecordsFromLocalApi(patientId) {
            const payload = await requestJson(
                (config.apiBaseUrl || "/api") + "/medical-records?patientId=" + encodeURIComponent(patientId),
                {
                    method: "GET"
                }
            );

            return (payload.records || []).map(function(record) {
                return normalizeRecord(record.id, record);
            });
        },

        async getPatientsFromSupabase() {
            const rows = await requestJson(
                config.supabaseUrl +
                    "/rest/v1/patients?select=id,name,age,gender,blood,phone,avatar,visits,doctors,medicines,last_visit&order=id.asc",
                {
                    method: "GET",
                    headers: getSupabaseHeaders()
                }
            );

            return (rows || []).map(function(row) {
                return normalizePatient(row.id, row);
            });
        },

        async createPatientInSupabase(patient) {
            const payload = toSupabasePatientPayload(patient.id, patient);
            const rows = await requestJson(config.supabaseUrl + "/rest/v1/patients", {
                method: "POST",
                headers: Object.assign({}, getSupabaseHeaders(), {
                    Prefer: "return=representation"
                }),
                body: JSON.stringify(payload)
            });

            return normalizePatient(patient.id, Array.isArray(rows) ? rows[0] : payload);
        },

        async getPatientFromSupabase(id, fallbackPatient) {
            const headers = getSupabaseHeaders();
            const url =
                config.supabaseUrl +
                "/rest/v1/patients" +
                "?id=eq." + encodeURIComponent(id) +
                "&select=id,name,age,gender,blood,phone,avatar,visits,doctors,medicines,last_visit" +
                "&limit=1";

            try {
                const rows = await requestJson(url, {
                    method: "GET",
                    headers: headers
                });

                if (!Array.isArray(rows) || rows.length === 0) {
                    return normalizePatient(id, fallbackPatient);
                }

                return normalizePatient(id, rows[0]);
            } catch (error) {
                return normalizePatient(id, fallbackPatient);
            }
        },

        async savePatientToSupabase(id, patient) {
            const body = JSON.stringify(toSupabasePatientPayload(id, patient));

            await requestJson(
                config.supabaseUrl + "/rest/v1/patients?id=eq." + encodeURIComponent(id),
                {
                    method: "PATCH",
                    headers: Object.assign({}, getSupabaseHeaders(), {
                        Prefer: "return=representation"
                    }),
                    body: body
                }
            ).catch(function() {
                return requestJson(config.supabaseUrl + "/rest/v1/patients", {
                    method: "POST",
                    headers: Object.assign({}, getSupabaseHeaders(), {
                        Prefer: "return=representation"
                    }),
                    body: body
                });
            });

            return normalizePatient(id, patient);
        },

        async getAppointmentsFromSupabase() {
            const rows = await requestJson(
                config.supabaseUrl +
                    "/rest/v1/appointments?select=id,patient_id,patient_name,patient_avatar,doctor_name,doctor_avatar,department,reason,appointment_date,appointment_time,status&order=appointment_date.asc,appointment_time.asc",
                {
                    method: "GET",
                    headers: getSupabaseHeaders()
                }
            );

            return (rows || []).map(function(row) {
                return normalizeAppointment(row.id, row);
            });
        },

        async createAppointmentInSupabase(appointment) {
            const safeAppointment = normalizeAppointment(appointment.id || createClientId("AP"), appointment);
            const rows = await requestJson(config.supabaseUrl + "/rest/v1/appointments", {
                method: "POST",
                headers: Object.assign({}, getSupabaseHeaders(), {
                    Prefer: "return=representation"
                }),
                body: JSON.stringify(toSupabaseAppointmentPayload(safeAppointment))
            });

            return normalizeAppointment(safeAppointment.id, Array.isArray(rows) ? rows[0] : safeAppointment);
        },

        async getMedicalRecordsFromSupabase(patientId) {
            const rows = await requestJson(
                config.supabaseUrl +
                    "/rest/v1/medical_records" +
                    "?patient_id=eq." + encodeURIComponent(patientId) +
                    "&select=id,patient_id,title,doctor_name,department,diagnosis,record_type,record_date,status" +
                    "&order=record_date.desc",
                {
                    method: "GET",
                    headers: getSupabaseHeaders()
                }
            );

            return (rows || []).map(function(row) {
                return normalizeRecord(row.id, row);
            });
        },

        async getPatientsFromFirebase() {
            const token = ensureFirebaseToken();
            const payload = await requestJson(toFirebaseUrl("/patients", token), {
                method: "GET"
            });

            return normalizeFirebaseCollection(payload, function(id, patient) {
                return normalizePatient(id, patient);
            });
        },

        async createPatientInFirebase(patient) {
            const token = ensureFirebaseToken();
            const safePatient = normalizePatient(patient.id, patient);

            await requestJson(toFirebaseUrl("/patients/" + encodeURIComponent(safePatient.id), token), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(safePatient)
            });

            return safePatient;
        },

        async getPatientFromFirebase(id, fallbackPatient) {
            try {
                const token = ensureFirebaseToken();
                const patient = await requestJson(
                    toFirebaseUrl("/patients/" + encodeURIComponent(id), token),
                    {
                        method: "GET"
                    }
                );

                return normalizePatient(id, patient || fallbackPatient);
            } catch (error) {
                return normalizePatient(id, fallbackPatient);
            }
        },

        async savePatientToFirebase(id, patient) {
            const token = ensureFirebaseToken();
            const safePatient = normalizePatient(id, patient);

            await requestJson(
                toFirebaseUrl("/patients/" + encodeURIComponent(id), token),
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(safePatient)
                }
            );

            return safePatient;
        },

        async getAppointmentsFromFirebase() {
            const token = ensureFirebaseToken();
            const payload = await requestJson(toFirebaseUrl("/appointments", token), {
                method: "GET"
            });

            return normalizeFirebaseCollection(payload, function(id, appointment) {
                return normalizeAppointment(id, appointment);
            });
        },

        async createAppointmentInFirebase(appointment) {
            const token = ensureFirebaseToken();
            const appointmentId = appointment.id || createClientId("AP");
            const safeAppointment = normalizeAppointment(appointmentId, appointment);

            await requestJson(
                toFirebaseUrl("/appointments/" + encodeURIComponent(appointmentId), token),
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(safeAppointment)
                }
            );

            return safeAppointment;
        },

        async getMedicalRecordsFromFirebase(patientId) {
            const token = ensureFirebaseToken();
            const payload = await requestJson(
                toFirebaseUrl("/medicalRecords/" + encodeURIComponent(patientId), token),
                {
                    method: "GET"
                }
            );

            return normalizeFirebaseCollection(payload, function(id, record) {
                return normalizeRecord(id, record);
            });
        }
    };

    window.MediCloudBackend = {
        config: config,
        getProvider: getProvider,
        getCurrentUser: getCurrentUser,
        login: providers.login,
        getPatients: providers.getPatients,
        createPatient: providers.createPatient,
        getPatient: providers.getPatient,
        savePatient: providers.savePatient,
        getAppointments: providers.getAppointments,
        createAppointment: providers.createAppointment,
        getMedicalRecords: providers.getMedicalRecords
    };
})();
