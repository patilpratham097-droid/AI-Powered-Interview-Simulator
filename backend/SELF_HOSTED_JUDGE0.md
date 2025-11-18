# Self-Hosted Judge0 Setup (Free & Unlimited)

## 🎯 Why Self-Host?

RapidAPI free tier has strict limits. Self-hosting gives you:
- ✅ **Unlimited requests**
- ✅ **Faster execution**
- ✅ **No API key needed**
- ✅ **100% free**

---

## 🚀 Quick Setup (5 minutes)

### **Prerequisites:**
- Docker Desktop installed
- 4GB RAM available

### **Step 1: Install Docker Desktop**

If not installed:
1. Download: https://www.docker.com/products/docker-desktop
2. Install and restart computer
3. Open Docker Desktop
4. Wait for it to start (whale icon in system tray)

### **Step 2: Start Judge0**

Open **Command Prompt** or **PowerShell**:

```bash
# Pull Judge0 image
docker pull judge0/judge0:latest

# Run Judge0
docker run -p 2358:2358 -d judge0/judge0:latest
```

Wait 30 seconds for it to start.

### **Step 3: Update Backend .env**

Edit `backend/.env`:

```bash
# Judge0 Configuration (Self-Hosted)
JUDGE0_API_URL=http://localhost:2358
JUDGE0_API_KEY=
JUDGE0_API_HOST=
```

**Leave API_KEY and API_HOST empty!**

### **Step 4: Test**

```bash
cd backend
node test-judge0.js
```

---

## ✅ Done!

Judge0 is now running locally with unlimited requests!

To stop Judge0:
```bash
docker ps
docker stop <container_id>
```

To start again:
```bash
docker start <container_id>
```
