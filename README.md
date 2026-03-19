# BoardCollab — Real-Time Collaborative Whiteboard
 
A real-time collaborative whiteboard built with the MERN stack. Multiple people can draw, add shapes, and collaborate together in the same room - changes appear instantly for everyone.

## Features
 
- JWT-based auth (register / login)
- Create rooms - share the code with whoever you want to invite
- Real-time drawing: freehand pen, rectangle, circle, text
- Per-user undo / redo (Ctrl+Z / Ctrl+Y)
- Clear canvas, export as PNG
- Auto-saves canvas to MongoDB every 5 seconds
- Device friendly

 ## Tech Stack
 
| Layer | What we used | Why |
|---|---|---|
| Database | MongoDB + Mongoose | Flexible schema for storing canvas elements as sub-documents |
| Backend | Express + Node.js | REST API for auth and rooms |
| Real-time | Socket.IO | WebSocket hub for broadcasting draw events instantly |
| Frontend | React + Vite | Component-based UI, fast dev experience |
| Canvas | Konva.js / react-konva | GPU-accelerated 2D canvas with React integration |
| State | Redux Toolkit | Centralized canvas state, clean undo/redo implementation |
| Auth | JWT + bcryptjs | Stateless auth, passwords hashed before storage |
 
---

### Prerequisites
- Node.js 18+
- MongoDB local

### 1. Clone the repo
 
```bash
git clone https://github.com/YOUR_USERNAME/BoardCollab.git
cd BoardCollab
```

### 2. Backend setup
 
```bash
cd server
npm install
```

Edit `.env`:
 
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/boardcollab
JWT_SECRET=any_random_secret_string
CLIENT_URL=http://localhost:5173
```

### 3. Frontend setup
 
```bash
cd client
npm install
npm run dev
```

## How it works
 
```
User draws on canvas
      ↓
Frontend emits "draw-stroke" via Socket.IO
      ↓
Server applies conflict resolution (last-write-wins per element)
      ↓
Broadcasts updated operation to all users in the room
      ↓
Batched save to MongoDB every 5 seconds
```
 
**Rooms are private** - only people with the room code can join.
 
**Undo/redo is per-user** - your undo only affects your own strokes.
 
**Conflict resolution** - uses last-write-wins per element ID with timestamp comparison. Two users editing simultaneously won't crash or rubber-band the canvas.
 
---
 
## Project Structure
 
```
BoardCollab/
├── server/
│   └── src/
│       ├── config/       # MongoDB connection
│       ├── models/       # User, Session schemas
│       ├── routes/       # /api/auth, /api/rooms
│       ├── middleware/   # JWT verification
│       ├── socket/       # Socket.IO handlers + batch writer
│       └── ot/           # Conflict resolution logic
│
└── client/
    └── src/
        ├── components/   # CanvasBoard, Toolbar, UserList
        ├── pages/        # Login, Register, Lobby, Room
        ├── store/        # Redux slices (canvas, auth)
        ├── hooks/        # useSocket, useCanvas
        └── socket/       # Socket.IO client singleton
```
 
---
