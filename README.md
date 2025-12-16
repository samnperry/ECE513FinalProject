# ECE 513 Heart Rate Monitor

Team: Samantha Perry · Amber Parker · Seven Gilbert

Live site: https://sfwe513.publicvm.com  
API base: https://sfwe513.publicvm.com/api

## Accounts
- Patient with recent data: `testuser@example.com` / `1234`
- Physician account: `testphysician@example.com` / `123`
(Replace with your actual demo creds if different.)

## What’s included
- React SPA served by Nginx (`npm run build` output in `/var/www/heartapp`).
- Node/Express backend (`server/`) with MongoDB, JWT auth, device registration, measurements, physician routes.
- Photon 2 firmware (`photon/`) that posts measurements and fetches device config (frequency).
- Nginx reverse proxy + Let’s Encrypt TLS on EC2.

## Run locally
```bash
git clone https://github.com/your-org/ECE513FinalProject.git
cd ECE513FinalProject/heart-rate-monitor
npm install

# backend env (example)
export MONGO_URI="mongodb+srv://amberparker_db_user:<password>@ece513.wbdx1wo.mongodb.net/hrm"
export JWT_SECRET="your-jwt-secret"
export REACT_APP_API_BASE="http://localhost:5001"   # for local dev

# start backend
cd server
npm install  # if needed
node index.js

# start frontend (new shell)
cd ..
npm start
# open http://localhost:3000
```

## Build and deploy (EC2 steps we used)
1) Build frontend locally:
   ```bash
   npm run build
   ```
2) Copy `build/` to EC2 and place in `/var/www/heartapp`:
   ```bash
   # example with rsync + sudo on remote
   rsync -av --delete \
     --exclude=".DS_Store" --exclude="._*" \
     -e "ssh -i yourkey.pem" \
     --rsync-path="sudo rsync" \
     build/ ec2-user@your-ec2:/var/www/heartapp/
   ssh -i yourkey.pem ec2-user@your-ec2 "sudo chown -R nginx:nginx /var/www/heartapp"
   ```
3) Backend on EC2 (PM2):
   ```bash
   cd /home/ec2-user/ECE513FinalProject/heart-rate-monitor/server
   pm2 start index.js --name heart-api
   pm2 save
   pm2 startup   # run the printed command once
   ```
4) Nginx proxy (`/etc/nginx/conf.d/heart.conf`):
   - Port 80 -> 443 redirect; 443 serves `/var/www/heartapp`
   - `/api` proxy to `http://127.0.0.1:5001`
   - Let’s Encrypt certs in `/etc/letsencrypt/live/sfwe513.publicvm.com/`
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## Environment variables
- `MONGO_URI` – MongoDB connection string
- `JWT_SECRET` – JWT signing secret
- `REACT_APP_API_BASE` – API base for frontend build (use your domain in production: `https://sfwe513.publicvm.com`)

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
- Particle webhooks (Particle CLI):
  - `Photon2_SendEvent` -> `https://sfwe513.publicvm.com/api/measurements/`
  - `Photon2_Config_Request` -> `https://sfwe513.publicvm.com/api/device/config/{{PARTICLE_EVENT_VALUE}}`

## HTTPS
- Nginx terminates TLS with Let’s Encrypt certs at `/etc/letsencrypt/live/sfwe513.publicvm.com/`.
- Port 80 stays open for devices/ACME; 443 for browsers.

## Videos
- Pitch video: <add-link>
- Demo video: <add-link>

## Recent data accounts
- Patient: `testuser@example.com` / `1234`
- Physician: `testphysician@example.com` / `123`
