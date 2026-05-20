# 🚀 CollabEdit: Real-Time Collaborative Code Workspace

CollabEdit is a feature-rich, high-performance collaborative code editor and real-time communication platform. It enables multiple developers to write, edit, and review code simultaneously while communicating through an integrated, WhatsApp-inspired chat interface. Built on a premium, responsive glassmorphic UI, CollabEdit combines structural editing tools with full-featured messaging.

---

## ✨ Key Features

### 💻 Real-Time Collaborative Editor
* **Yjs & Monaco Synchronization**: Conflict-free collaborative text editing powered by CRDTs (`yjs` and `y-monaco`).
* **Active Cursor Awareness**: Visual indicators with custom carets, color-coded name flags, and real-time selection highlighting for every connected user.
* **Passcode-Protected & Lockable Rooms**: Create secure workspace rooms with optional password protection. Room hosts/admins can lock or unlock rooms in real-time to prevent new joins.
* **Instant Workspace Export**: Download the entire workspace's code, chat logs, and room settings bundled as a zip file in one click.

### 💬 WhatsApp-Inspired Live Chat Panel
* **Dynamic Bubble Layout**: Fully responsive, collapsible drawer layout docked to the right of the editor code space.
* **Tick Status Indicators**: 
  * Sent (`✓`)
  * Delivered (`✓✓`)
  * Read (`✓✓` in blue) - updates instantly when the recipient opens the room or toggles their panel.
* **Unread Message Notifications**: Real-time counter badges and sound-effect toast alerts for new messages.
* **Media & Image Sharing**: Drag-and-drop or select images to send. Features a premium lightbox preview and hidden quick-delete actions.
* **Unsend & Deletion Actions**: 
  * *Delete for Me* (hides the message locally).
  * *Delete for Everyone* (removes the message from the database and active clients, with admin-override privilege for room owners).

### 🎨 Premium UI & Custom Themes
* **Monaco Theme Switcher**: Easily toggle between custom registered **VS Code Dark Plus** and **VS Code Light Plus** themes.
* **Flash-Free Initial Rendering**: Theme assets are defined before mounting using hooks, eliminating fallback blinks.
* **Role-Based Styling**: Distinct colors, borders, and bold italic labels help identify the Room Admin (Host) from other collaborators.
* **Responsive Dashboard**: Beautiful mobile-friendly lobby page featuring live active room lists, keyboard-driven search (`/` shortcut), and interactive profile cards.
* **Username Settings & Validation**: Securely update your identity across active rooms. Enforces character validation (length $\ge$ 3, letters and underscores only).

---

## 🛠️ Technology Stack

### **Frontend**
* **Framework**: React 18 with Vite (HMR)
* **Styling**: Tailwind CSS (Glassmorphism & animations)
* **Code Editor**: `@monaco-editor/react`
* **Real-time Sync**: `yjs`, `y-socket.io`, `y-monaco`
* **File Management**: `JSZip`

### **Backend**
* **Runtime**: Node.js & Express
* **Database**: MongoDB & Mongoose ORM
* **Sockets**: Socket.IO (Namespaced rooms & custom event listeners)
* **Security**: Bcrypt.js (Password hashing)

---

## ⚙️ Environment Configuration

Ensure both frontend and backend directories have their respective environment configurations defined before running.

### **Backend (`backend/.env`)**
```env
# MongoDB Connection URI
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/database_name

# Listening Port
PORT=3000
```

### **Frontend (`frontend/.env`)**
```env
# Backend API Endpoint URL
VITE_API_URL=http://localhost:3000
```

---

## 🚀 Getting Started

### **Prerequisites**
* Node.js (v18+)
* npm or yarn
* MongoDB instance (or Atlas account)

### **Backend Setup**
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the backend development server:
   ```bash
   npm run dev
   ```

### **Frontend Setup**
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the client development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛡️ License

This project is licensed under the MIT License.
