insert into app_users(id, email, password, name, role, role_name)
values
    ('admin-01', 'admin@medicloud.com', '123456', 'Admin', 'admin', 'Quan tri vien')
on conflict (id) do nothing;

insert into patients(id, name, age, gender, blood, phone, avatar, visits, doctors, medicines, last_visit)
values
    ('BN001', 'Nguyen Van A', '20', 'Nam', 'O+', '0901 234 567', 'N', '08', '05', '12', '12/09/2026'),
    ('BN002', 'Tran Thi B', '28', 'Nu', 'A+', '0912 345 678', 'B', '05', '03', '07', '08/09/2026'),
    ('BN003', 'Le Van C', '33', 'Nam', 'B+', '0987 654 321', 'C', '12', '06', '15', '05/09/2026'),
    ('BN004', 'Pham Thi D', '26', 'Nu', 'AB+', '0977 123 456', 'D', '04', '02', '06', '01/09/2026')
on conflict (id) do nothing;

insert into appointments(
    id, patient_id, patient_name, patient_avatar, doctor_name, doctor_avatar,
    department, reason, appointment_date, appointment_time, status
)
values
    ('AP001', 'BN001', 'Nguyen Van A', 'N', 'BS. Tran Minh', 'T', 'Noi khoa', 'Kham tong quat', '03/10/2026', '08:00', 'Đã xác nhận'),
    ('AP002', 'BN002', 'Tran Thi B', 'B', 'BS. Nguyen Ha', 'N', 'Tim mach', 'Dau nguc', '03/10/2026', '09:30', 'Đang chờ'),
    ('AP003', 'BN003', 'Le Van C', 'C', 'BS. Pham Nam', 'P', 'Ngoai khoa', 'Tai kham', '03/10/2026', '10:00', 'Đã khám'),
    ('AP004', 'BN004', 'Pham Thi D', 'D', 'BS. Le Anh', 'L', 'Nhi khoa', 'Kham dinh ky', '03/10/2026', '13:30', 'Đã xác nhận')
on conflict (id) do nothing;

insert into medical_records(id, patient_id, title, doctor_name, department, diagnosis, record_type, record_date, status)
values
    ('MR001', 'BN001', 'Kham suc khoe dinh ky', 'BS. Tran Minh Anh', 'Noi tong quat', 'Suc khoe on dinh', 'routine', '12/09/2026', 'Hoan tat'),
    ('MR002', 'BN001', 'Kham noi khoa', 'BS. Nguyen Ha', 'Noi khoa', 'Theo doi huyet ap', 'specialist', '28/08/2026', 'Da toa thuoc'),
    ('MR003', 'BN002', 'Kham tim mach', 'BS. Tran Minh', 'Tim mach', 'Nhip tim khong deu nhe', 'specialist', '08/09/2026', 'Theo doi'),
    ('MR004', 'BN003', 'Tai kham ngoai khoa', 'BS. Pham Nam', 'Ngoai khoa', 'Vet thuong hoi phuc tot', 'follow-up', '05/09/2026', 'Hoan tat')
on conflict (id) do nothing;
