# ECE 513 Heart Rate Monitor

Team: Samantha Perry · Amber Parker · Seven Gilbert

Live site: https://sfwe513.publicvm.com  
API base: https://sfwe513.publicvm.com/api

## Accounts
- Patient (example): `testuser@example.com` / `1234!`
- Physician (example): `testphysician@example.com` / `123` 

## What’s included
- React frontend (SPA) built from `npm run build`, served by Nginx.
- Node/Express backend (`server/`) with MongoDB, JWT auth, device registration, measurements, and physician routes.
- Photon 2 firmware (`photon/`) that posts measurements and fetches device config (frequency).
- Nginx reverse proxy + Let’s Encrypt TLS termination on EC2.

## Run locally (dev)
```bash
git clone https://github.com/your-org/ECE513FinalProject.git
cd ECE513FinalProject/heart-rate-monitor
npm install

# backend env (example)
export MONGO_URI="your-mongo-uri"
export JWT_SECRET="your-jwt-secret"
export REACT_APP_API_BASE="http://localhost:5001"

# start backend
cd server
npm install  # if needed
node index.js

# start frontend (in another shell)
cd ..
npm start
# open http://localhost:3000
```

## Build and deploy (what we did on EC2)
1) Build frontend locally:
   ```bash
   npm run build
   ```
2) Copy `build/` to EC2 and place in `/var/www/heartapp`:
   ```bash
   scp -i yourkey.pem -r build ec2-user@your-ec2:/home/ec2-user/
   sudo rm -rf /var/www/heartapp/*
   sudo cp -r /home/ec2-user/build/* /var/www/heartapp/
   sudo chown -R nginx:nginx /var/www/heartapp
   ```
3) Backend on EC2 (PM2):
   ```bash
   cd /home/ec2-user/ECE513FinalProject/heart-rate-monitor/server
   pm2 start index.js --name heart-api
   pm2 save
   pm2 startup   # run the printed command once
   ```
4) Nginx proxy (`/etc/nginx/conf.d/heart.conf`):
   - Port 80/443 serve `/var/www/heartapp`
   - `/api` proxies to `http://127.0.0.1:5001`
   - HTTPS with Let’s Encrypt certs
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## Environment variables
- `MONGO_URI` – MongoDB connection string
- `JWT_SECRET` – JWT signing secret
- `REACT_APP_API_BASE` – API base for frontend build (use your domain in production)

## Key endpoints (REST)
- Auth: `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/physician/signup`
- Account: `PUT /api/account/update` (password)
- Devices: `POST /api/device/register` (returns `apiKey`), `GET /api/device/list`, `GET /api/device/config/:deviceId`
- Measurements: `POST /api/measurements` (with `x-api-key`), `GET /api/measurements/:deviceId`
- Physicians: `GET /api/physician/list`, `PUT /api/physician/assign`, `GET /api/physician/patients`, `GET /api/physician/patient/:id/summary`, `GET /api/physician/patient/:id/daily`, `PUT /api/physician/device/:deviceId/frequency`

## Photon / Device notes
- Firmware: `photon/513Photon2.ino` (or `.cpp`) uses:
  - `API_HOST` = `sfwe513.publicvm.com`, `API_PORT` = `80` (HTTP for device)
  - `API_KEY` = per-device key from `/api/device/register`
  - Fetches config at `/api/device/config/:deviceId` to set measurement interval
  - Posts measurements to `/api/measurements` with `x-api-key`
- Webhooks (Particle CLI):
  - Event: `Photon2_SendEvent` -> `https://sfwe513.publicvm.com/api/measurements/`
  - Event: `Photon2_Config_Request` -> `https://sfwe513.publicvm.com/api/device/config/{{PARTICLE_EVENT_VALUE}}`

## HTTPS
- Nginx terminates TLS with Let’s Encrypt certs at `/etc/letsencrypt/live/sfwe513.publicvm.com/`.
- Both 80 and 443 are open; 80 serves devices/ACME, 443 for browsers.

## Videos
- Pitch video: <add-link>
- Demo video: <add-link>

## Recent data accounts
- Patient with recent data: <email> / <password>
- Physician account: <email> / <password>

*(Replace placeholders above with actual credentials and video links before submission.)*
