
# Heart Rate Monitor — Milestone README

## Overview

This milestone implements a basic heart-rate monitoring app:

- User signup and login
- Device registration (Heart Track)
- IoT device sends heart rate and SpO₂ data to backend
- Dashboard loads and displays measurements for a device

---

## Project Structure

```
heart-rate-monitor/
│
├── server/
│   ├── index.js
│   ├── db.js
│   ├── routes/
│   │     ├── authRoutes.js
│   │     ├── deviceRoutes.js
│   │     └── measurementRoutes.js
│   ├── models/
│         ├── user.js
│         ├── device.js
│         └── measurement.js
│
└── src/   (React frontend)
    ├── App.tsx
    ├── Login.tsx
    ├── Signup.tsx
    ├── DeviceRegister.tsx
    └── components/
          ├── dashboard/
          └── headerbar/
```

---

## 1. Prerequisites

Install the following on your machine:

- Node.js
- npm
- MongoDB Atlas account
- Particle Photon tools (for IoT device testing)

---

## 2. Backend Setup

From the project root:

1. Install dependencies
```bash
cd server
npm install
```

2. MongoDB Atlas

The MongoDB connection string is configured in `server/db.js`. Example:
```js
mongoose.connect(
  "mongodb+srv://amberparker_db_user:<password>@ece513.wbdx1wo.mongodb.net/hrm"
);
```

3. Run the backend
```bash
cd server
node index.js
```

Expected output:
```
Server running on port 5001
MongoDB connected
```

Backend base URL:
```
http://localhost:5001
```

---

## 3. Frontend Setup

From the project root (React project folder):

1. Install dependencies
```bash
npm install
```

2. Run the frontend
```bash
npm start
```

Frontend URL:
```
http://localhost:3000
```

---

## 4. Using the Application (Milestone)

Ensure backend and frontend are running.

### 4.1 Create an account
Open:
```
http://localhost:3000/signup
```
Enter email and password to create a user.

### 4.2 Log in
Open:
```
http://localhost:3000/login
```
On success:
- JWT token stored in `localStorage`
- User ID stored in `localStorage`
- App redirects to `/dashboard`

### 4.3 Register a device
On the dashboard:
- Enter a `deviceId` (e.g., `device123`)
- Click "Register Device" — calls:
```
POST /api/device/register
```
Device is linked to the authenticated user.

### 4.4 Load measurements
On the dashboard:
- Enter the same `deviceId`
- Click "Load Measurements" — calls:
```
GET /api/measurements/:deviceId
```
Response (list of measurements) is displayed in the UI (JSON or simple list/table).

---

## 5. IoT Device (Photon + MAX30102)

Device behavior:
- Reads heart rate and SpO₂ from MAX30102
- Prompts user on a fixed schedule (~30 minutes; shorter for testing)
- Sends measurements to backend

Measurement endpoint:
```
POST http://<server-ip>:5001/api/measurements
```

Example JSON body:
```json
{
  "deviceId": "device123",
  "heartRate": 75,
  "spo2": 98
}
```

When data is sent, new measurement documents appear in MongoDB Atlas and can be loaded on the dashboard.

---

## 6. API Endpoints (Summary)

Auth
- `POST /api/auth/signup` — create a new user
- `POST /api/auth/login` — log in, return token and user info

Devices
- `POST /api/device/register` — register a device to the authenticated user

Measurements
- `POST /api/measurements` — save a new measurement from the IoT device
- `GET /api/measurements/:deviceId` — get recent measurements for a device

---

## 7. Milestone Demo Flow

Suggested demo order:
1. Start backend: `node index.js` (in `server/`)
2. Start frontend: `npm start` (project root)
3. Show signup (`/signup`)
4. Show login (`/login`) and redirect to `/dashboard`
5. On dashboard, register a device
6. Trigger IoT device to send a measurement for that `deviceId`
7. Click "Load Measurements" and show new data

---

## 8. Notes

This README documents the milestone version only. Additional features (weekly summaries, daily views, HTTPS, physician portal, etc.) will be added for the final project.

