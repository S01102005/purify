# PureAir Vayurakshak — Backend Setup Guide

## Project Structure

```
vayurakshak-backend/
├── server.js               ← Express app entry point
├── package.json
├── .env.example            ← Copy to .env and fill in values
├── models/
│   ├── Waitlist.js         ← MongoDB schema for waitlist entries
│   └── Subscriber.js       ← MongoDB schema for newsletter subscribers
├── routes/
│   ├── waitlist.js         ← POST/GET /api/waitlist
│   └── newsletter.js       ← POST/DELETE/GET /api/newsletter
└── index.html              ← Frontend (already wired to the API)
```

---

## Step 1 — Install Dependencies

```bash
cd vayurakshak-backend
npm install
```

---

## Step 2 — Set Up MongoDB

### Option A: MongoDB Atlas (recommended — free tier available)
1. Go to https://cloud.mongodb.com and create a free account
2. Create a new **Cluster** (M0 free tier is fine)
3. Under **Database Access**, create a user with read/write permissions
4. Under **Network Access**, add your IP (or `0.0.0.0/0` for all)
5. Click **Connect → Drivers** and copy the connection string
6. It looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`

### Option B: Local MongoDB
```bash
# Install MongoDB Community (macOS)
brew tap mongodb/brew && brew install mongodb-community
brew services start mongodb-community

# Ubuntu / Debian
sudo apt install mongodb
sudo systemctl start mongodb
```
Use: `mongodb://localhost:27017/vayurakshak`

---

## Step 3 — Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
MONGO_URI=mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/vayurakshak?retryWrites=true&w=majority
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:5500
ADMIN_SECRET=pick_a_strong_random_secret_here
```

---

## Step 4 — Run the Server

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

You should see:
```
✅  MongoDB connected
🚀  Server running on http://localhost:5000
📋  Endpoints:
    POST   /api/waitlist
    GET    /api/waitlist/count
    GET    /api/waitlist         (admin)
    POST   /api/newsletter
    DELETE /api/newsletter/unsubscribe
    GET    /api/newsletter        (admin)
    GET    /api/health
```

---

## Step 5 — Open the Frontend

Open `index.html` in your browser (or serve via VS Code Live Server on port 5500).

The `API_BASE` at the top of the `<script>` in `index.html` points to `http://localhost:5000/api` by default — no changes needed for local dev.

---

## API Reference

### POST /api/waitlist
Submit a waitlist entry.

**Request body:**
```json
{
  "name": "Ravi Kumar",
  "email": "ravi@example.com",
  "phone": "9876543210",      // optional
  "intendedUse": "hostel"    // hostel | home | office | other
}
```

**Success (201):**
```json
{ "success": true, "message": "Welcome, Ravi! You're on the waitlist.", "data": { "id": "...", "name": "Ravi Kumar", "email": "ravi@example.com" } }
```

**Duplicate (409):**
```json
{ "success": false, "message": "This email is already on the waitlist." }
```

---

### GET /api/waitlist/count
Public endpoint — returns total signups for social proof.
```json
{ "success": true, "count": 42 }
```

---

### GET /api/waitlist  *(admin)*
Returns all waitlist entries, paginated.

**Headers:** `X-Admin-Secret: your_secret`

**Query params:** `?page=1&limit=50`

---

### POST /api/newsletter
Subscribe to newsletter.

**Request body:**
```json
{ "email": "ravi@example.com" }
```

---

### DELETE /api/newsletter/unsubscribe
Unsubscribe from newsletter.

**Request body:**
```json
{ "email": "ravi@example.com" }
```

---

### GET /api/newsletter  *(admin)*
Returns all subscribers.

**Headers:** `X-Admin-Secret: your_secret`

**Query params:** `?status=active&page=1&limit=50` (status: `active` | `unsubscribed` | `all`)

---

### GET /api/health
Server/DB status check — no auth required.

```json
{ "success": true, "status": "ok", "timestamp": "...", "db": "connected" }
```

---

## Deploying to Production

### Railway (easiest — free tier)
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```
Set env vars in the Railway dashboard.

### Render
1. Push repo to GitHub
2. New Web Service → connect repo
3. Build command: `npm install`
4. Start command: `npm start`
5. Add env vars in the dashboard

### VPS / DigitalOcean
```bash
# Install PM2 for process management
npm install -g pm2
pm2 start server.js --name vayurakshak
pm2 startup
pm2 save
```
Use Nginx as a reverse proxy for port 80/443.

---

## Viewing Your Data

### MongoDB Atlas
Go to **Browse Collections** in the Atlas dashboard — you'll see `waitlists` and `subscribers` collections.

### MongoDB Compass (GUI — free)
Download from https://www.mongodb.com/products/compass  
Connect with your MONGO_URI.

### Admin API (curl)
```bash
# View waitlist
curl http://localhost:5000/api/waitlist \
  -H "X-Admin-Secret: your_secret_here"

# View newsletter subscribers
curl http://localhost:5000/api/newsletter \
  -H "X-Admin-Secret: your_secret_here"
```
