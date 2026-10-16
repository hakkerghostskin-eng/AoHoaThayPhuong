# MediCloud Docker Demo

## Muc tieu

Du an nay demo he thong quan ly phong kham `MediCloud` theo mo hinh microservices chay bang Docker Compose.

Frontend khong goi truc tiep tung service. Tat ca request di qua Nginx proxy `/api` den `gateway-service`, sau do gateway tiep tuc route den:

- `auth-service`
- `patient-service`
- `appointment-service`
- `medical-record-service`
- `postgres`

## Kien truc

```text
Browser
  -> frontend (Nginx)
      -> /api
          -> gateway-service
              -> auth-service
              -> patient-service
              -> appointment-service
              -> medical-record-service
                  -> postgres
```

## Cau truc chinh

```text
.
|-- Dockerfile
|-- docker-compose.yml
|-- .env.example
|-- .dockerignore
|-- README.md
|-- docker/
|   |-- frontend/
|   |   |-- 40-generate-config.sh
|   |   |-- default.conf
|   |   `-- runtime-config.template.js
|   `-- postgres/
|       `-- init/
|           |-- 01-schema.sql
|           `-- 02-seed.sql
|-- services/
|   |-- gateway-service/
|   |-- auth-service/
|   |-- patient-service/
|   |-- appointment-service/
|   `-- medical-record-service/
`-- js/
    |-- backend-adapter.js
    |-- patients-page.js
    |-- appointments-page.js
    `-- medical-records-page.js
```

## Dich vu

### Frontend

- Container: `medicloud-frontend`
- Image base: `nginx:1.27-alpine`
- Vai tro: phuc vu HTML/CSS/JS va proxy `/api` sang `gateway-service`

### Gateway

- Container: `medicloud-gateway`
- Port host: `3000`
- Vai tro: diem vao duy nhat cho frontend, route request den service nghiep vu

### Business services

- `auth-service`: dang nhap Admin demo
- `patient-service`: danh sach benh nhan, tao benh nhan, cap nhat ho so
- `appointment-service`: danh sach lich hen, tao lich hen
- `medical-record-service`: doc ho so kham benh theo `patientId`

### Database

- Container: `medicloud-postgres`
- Image: `postgres:16-alpine`
- Seed SQL:
  - `docker/postgres/init/01-schema.sql`
  - `docker/postgres/init/02-seed.sql`

## Cach chay

### 1. Tao file `.env`

```powershell
Copy-Item .env.example .env
```

### 2. Build va start

```bash
docker compose up -d --build
```

### 3. Kiem tra nhanh

```bash
docker compose ps
docker compose logs gateway-service --tail=50
docker compose logs postgres --tail=50
```

### 4. URL demo

- Frontend: [http://localhost:8080/login.html](http://localhost:8080/login.html)
- Gateway health: [http://localhost:3000/api/health](http://localhost:3000/api/health)
- Gateway services: [http://localhost:3000/api/services](http://localhost:3000/api/services)

### 5. Tai khoan demo

- Email: `admin@medicloud.com`
- Password: `123456`

## Docker rubric

### Multi-container

He thong gom 7 container:

- `medicloud-frontend`
- `medicloud-gateway`
- `medicloud-auth`
- `medicloud-patient`
- `medicloud-appointment`
- `medicloud-medical-record`
- `medicloud-postgres`

### Network

Compose khai bao 2 Docker bridge network:

- `medicloud-edge`: cho `frontend` va `gateway-service`
- `medicloud-data`: cho `gateway-service`, 4 service backend va `postgres`

Lenh kiem tra:

```bash
docker network ls
docker network inspect medicloud_medicloud-edge
docker network inspect medicloud_medicloud-data
```

### Named volume

Named volume duoc dung de giu du lieu Postgres:

```yaml
volumes:
  medicloud_postgres_data:
```

Lenh kiem tra:

```bash
docker volume ls
docker volume inspect medicloud_medicloud_postgres_data
```

### Bind mount

He thong dung bind mount cho frontend va source code service:

```yaml
frontend:
  volumes:
    - ./js:/app/js
    - ./css:/app/css:ro

patient-service:
  volumes:
    - ./services/patient-service:/app
    - /app/node_modules
```

Y nghia:

- Sua file tren may host.
- Container nhin thay source moi sau khi refresh hoac restart.
- Phu hop demo phan biet bind mount va named volume.

## Chung minh persistence

### Cach 1: Tao benh nhan moi tu giao dien

1. Dang nhap vao `patients.html`.
2. Bam `+ Them benh nhan`.
3. Luu benh nhan moi.

### Cach 2: Kiem tra trong Postgres

```bash
docker exec -it medicloud-postgres psql -U medicloud -d medicloud -c "select id, name from patients order by id;"
```

### Cach 3: Xoa container, giu volume, start lai

```bash
docker rm -f medicloud-postgres
docker compose up -d postgres
```

Sau do chay lai lenh `select` o tren. Du lieu van con vi nam trong named volume `medicloud_postgres_data`.

## Tinh nang frontend da noi vao gateway

- Dang nhap goi `POST /api/auth/login`
- Trang benh nhan goi `GET /api/patients`, `POST /api/patients`, `PUT /api/patients/:id`
- Trang lich hen goi `GET /api/appointments`, `POST /api/appointments`
- Trang ho so goi `GET /api/medical-records?patientId=...`

## 3 tinh huong loi de demo

### Loi 1: Sai tai khoan dang nhap

- Dang nhap sai `admin@medicloud.com` hoac sai mat khau.
- Ket qua: frontend hien thong bao `Dang nhap that bai`.

### Loi 2: Gateway/backend dung

```bash
docker stop medicloud-gateway
```

- Mo lai trang login hoac benh nhan.
- Ket qua: frontend khong goi duoc `/api`.
- Cach xu ly:

```bash
docker start medicloud-gateway
```

### Loi 3: Xung dot cong

- Neu may da dung cong `8080`, `3000` hoac `5432`, `docker compose up` se bao loi bind port.
- Cach xu ly: sua `.env`:

```env
FRONTEND_PORT=8081
GATEWAY_PORT=3001
POSTGRES_PORT=5433
```

Sau do chay lai:

```bash
docker compose up -d --build
```

## Lenh Docker can demo

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f gateway-service
docker compose restart appointment-service
docker compose stop
docker compose down
docker compose down -v
```

## Ghi chu

- `docker compose down` chi xoa container/network, du lieu Postgres van con.
- `docker compose down -v` xoa ca volume va seed se duoc nap lai o lan khoi dong sau.
- Frontend duoc cau hinh de goi gateway qua `/api`, nen khi demo tren browser khong bi van de CORS.
