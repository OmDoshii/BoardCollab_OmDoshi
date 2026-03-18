# BoardCollab — Real-Time Collaborative Whiteboard

A full-stack MERN collaborative whiteboard app.

## Quick Start

### 1. MongoDB Atlas (Free Cloud DB)
1. Go to https://www.mongodb.com/atlas → Create free account
2. Create free cluster (M0) → Add DB user → Allow all IPs (0.0.0.0/0)
3. Click Connect → Drivers → Copy connection string

### 2. Backend
```bash
cd server
npm install
cp .env.example .env   # then fill in your MongoDB URI + JWT secret
npm run dev            # runs on http://localhost:5000
```

### 3. Frontend
```bash
cd client
npm install
npm run dev            # runs on http://localhost:5173
```
