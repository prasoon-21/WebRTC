# Asesino Meet 🔐  
**Privacy-First One-on-One Video Calling**

Asesino Meet is a **secure, peer-to-peer one-on-one video calling web application** built with a single goal:

> **No servers. No logs. No storage. No one in the middle.**

Unlike traditional platforms such as **Google Meet** and **Zoom**, Asesino Meet does **not route your audio or video through centralized media servers**. Communication happens **directly between two peers**, ensuring maximum privacy and control.

This repository contains the **MVP (Minimum Viable Product)** of the first product by **Binary Asesino**.  
The full version is launching soon.

---

## 🚫 Why Not Google Meet or Zoom?

Most popular video conferencing tools:
- Use centralized infrastructure
- Route calls through servers
- Can store metadata, logs, or recordings
- Are optimized for group meetings, not privacy

**Asesino Meet is different by design.**

---

## ✅ Why Asesino Meet?

- 🔒 **Pure Peer-to-Peer Communication**
- 🛑 **No media servers**
- 🕵️ **No call logs, no recordings**
- 🚫 **No third-party access**
- 🎯 **Built specifically for one-on-one conversations**
- 🌐 **Browser-based (no downloads required)**

This makes Asesino Meet ideal for:
- Confidential discussions  
- Founder–investor calls  
- Interviews  
- Personal or sensitive conversations  
- Anyone who prioritizes privacy over feature bloat  

---
## 🧭 How to Use Asesino Meet

Asesino Meet is designed to be simple, fast, and private.  
You can start a secure one-on-one video call in just a few steps.

### Step 1: Enter Your Email
- Open Asesino Meet in your browser
- Enter your **email address**
- No account creation required
- Email is used only for **session identification**, not storage

### Step 2: Generate or Enter a Unique Room ID
- Create a **unique room ID** or share an existing one
- Room IDs are **temporary and session-based**
- Only users with the exact room ID can join

### Step 3: Share the Room ID Securely
- Share the room ID with the other participant
- Once both participants join, a **direct peer-to-peer connection** is established

### Step 4: Start the Private Call
- Audio and video streams flow **directly between participants**
- No media is routed through servers
- No conversations are recorded or stored

> Asesino Meet enables secure communication using only an email and a unique room ID — nothing more is required.

--- 

## 🛠️ Tech Stack

### Frontend
- React.js  
- HTML5  
- CSS3  

### Backend
- Node.js  
- Express.js  
- WebSocket / Socket.IO (for signaling)

### Communication
- WebRTC  
  - RTCPeerConnection  
  - MediaStream  
  - ICE Candidates  

---

## 🔐 Privacy Philosophy

Asesino Meet follows a **zero-trust, zero-storage** approach:

- Servers are used **only for signaling**
- Media streams flow **directly between peers**
- Nothing is **stored, logged, or recorded**

> If there is nothing to store, there is nothing to leak.

---

## 🚀 Project Status

- ✅ **MVP completed**
- 🚧 **Full version releasing soon**
- 📌 **Focus:** security, privacy, and reliability for one-on-one calls

---

## 📎 Repository

**MVP source code:**  
👉 https://github.com/prasoon-21/WebRTC.git

---

## © Copyright

© 2025 **Binary Asesino**. All rights reserved.

Unauthorized copying, modification, distribution, or use of this software, via any medium, is strictly prohibited without explicit permission from the owner.


```bash
npm install
