create table if not exists app_users (
    id text primary key,
    email text unique not null,
    password text not null,
    name text not null,
    role text not null,
    role_name text not null
);

create table if not exists patients (
    id text primary key,
    name text not null,
    age text,
    gender text,
    blood text,
    phone text,
    avatar text,
    visits text,
    doctors text,
    medicines text,
    last_visit text
);

create table if not exists appointments (
    id text primary key,
    patient_id text not null,
    patient_name text not null,
    patient_avatar text,
    doctor_name text not null,
    doctor_avatar text,
    department text,
    reason text,
    appointment_date text,
    appointment_time text,
    status text,
    constraint fk_appointments_patient
        foreign key (patient_id)
        references patients(id)
        on update cascade
        on delete restrict
);

create table if not exists medical_records (
    id text primary key,
    patient_id text not null,
    title text not null,
    doctor_name text not null,
    department text,
    diagnosis text,
    record_type text,
    record_date text,
    status text,
    constraint fk_medical_records_patient
        foreign key (patient_id)
        references patients(id)
        on update cascade
        on delete cascade
);
