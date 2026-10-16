FROM nginx:1.27-alpine

RUN apk add --no-cache gettext

COPY docker/frontend/default.conf /etc/nginx/conf.d/default.conf
COPY docker/frontend/40-generate-config.sh /docker-entrypoint.d/40-generate-config.sh
COPY docker/frontend/runtime-config.template.js /opt/medicloud/runtime-config.template.js

RUN mkdir -p /app/js

COPY index.html /app/index.html
COPY login.html /app/login.html
COPY patients.html /app/patients.html
COPY doctors.html /app/doctors.html
COPY appointments.html /app/appointments.html
COPY medical-records.html /app/medical-records.html
COPY css /app/css
COPY js /app/js

RUN chmod +x /docker-entrypoint.d/40-generate-config.sh

EXPOSE 80
