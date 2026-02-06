# FeedChain – Food Rescue & Distribution System

## Team Name
**CODE_AVENGERS**

## Team Members
- **Mohammed Aasif** – Database Design & Presenter  
- **Mohammed Ayaz A** – Backend Architecture & System Design  
- **T. Mohammed Nabeel** – Backend Logic & API Integration  
- **Mohammed Abuzar J** – Testing & Flow Validation  
- **Mohammed Aamir. T** – Documentation & Demo Flow  

---

## Problem Statement
Large amounts of edible food are wasted daily while NGOs and volunteers struggle to source food reliably.  
Existing solutions often stop at *listing food*, lacking accountability, verification, and measurable impact.

---

## Solution Overview
**FeedChain** is a backend-driven food rescue system that enforces the **complete lifecycle of food donation** — from posting to verified distribution — with strict role control, state transitions, and impact tracking.

Instead of being a simple CRUD application, FeedChain functions as a **state-driven system** ensuring transparency, safety, and accountability.

---

## Core Flow (End-to-End)

1. **Donor posts food**
   - Food type, quantity, expiry time, pickup location
2. **Verified NGO claims food**
   - Database-level locking prevents multiple claims
3. **Pickup initiation**
   - OTP generated for secure pickup verification
4. **Pickup verification**
   - OTP must match → food marked as picked
5. **Distribution**
   - NGO records where and to how many people food was distributed
6. **Closure**
   - Food post is closed and impact metrics are updated

---

## System Roles

### Donor
- Create food posts
- Track status (Posted → Claimed → Picked → Distributed)

### NGO
- Discover nearby food
- Claim food (exclusive lock)
- Verify pickup (OTP)
- Record distribution details

### Admin (optional)
- Monitor system activity
- Approve NGOs
- View impact metrics

---

## Key Features

- ✅ Role-based authentication (Donor / NGO / Admin)
- ✅ Race-condition safe food claiming
- ✅ OTP-based pickup verification
- ✅ Strict status transitions (state machine)
- ✅ Expiry-based food validation
- ✅ Impact tracking (people served, distribution location)
- ✅ Scalable REST API design
- ✅ Production-ready backend architecture

---

## Backend Tech Stack

- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL (Supabase)
- **Authentication:** Supabase Auth (JWT)
- **Hosting-ready:** Render / Railway compatible

---

## Backend Architecture Philosophy

- Stateless REST APIs
- Business logic enforced at API layer
- Data integrity ensured at database level
- Clear separation of concerns (auth, claims, distribution, impact)

---

## API Endpoints & Responsibilities

### Auth
| Endpoint | Responsibility |
|------|------|
| `POST /auth/login` | Authenticate user via Supabase |
| `GET /auth/me` | Fetch current user details |

---

### Food Posts
| Endpoint | Responsibility |
|------|------|
| `POST /food-posts` | Donor creates a food post |
| `GET /food-posts` | List available food (filtered by status, expiry, location) |
| `GET /food-posts/{id}` | View food post details |

---

### Claims
| Endpoint | Responsibility |
|------|------|
| `POST /food-posts/{post_id}/claim` | NGO claims a food post (locked) |
| `POST /claims/{claim_id}/cancel` | NGO cancels claim (before pickup) |

---

### Pickup & Verification
| Endpoint | Responsibility |
|------|------|
| `POST /claims/{claim_id}/pickup` | Initiate pickup & generate OTP |
| `POST /claims/{claim_id}/verify` | Verify pickup using OTP |

---

### Distribution
| Endpoint | Responsibility |
|------|------|
| `POST /claims/{claim_id}/distribute` | Record distribution details and close flow |

---

### Impact
| Endpoint | Responsibility |
|------|------|
| `GET /impact/summary` | Aggregate meals served & system impact |

---

## Status Lifecycle


Each transition is validated and enforced by the backend.

---

## Why FeedChain is Different

- Not just listing food — **verifying rescue**
- Prevents duplicate claims and misuse
- Converts donations into **measurable social impact**
- Designed for real NGO and government use cases

---

## Current Status
- Backend fully implemented and tested
- End-to-end flow verified
- React frontend with donor/NGO/admin flows and impact page

---

## Running the project

### Backend (FastAPI)
- **Port:** `8000` (e.g. `http://localhost:8000`)
- Copy `backend/.env.example` to `backend/.env` and set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and optionally `JWT_SECRET_KEY`.
- From repo root: `cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
- Health check: `GET http://localhost:8000/health`

### Frontend (React + Vite)
- **Port:** `5173` (e.g. `http://localhost:5173`)
- Create `frontend/.env` with `VITE_API_URL=http://localhost:8000`.
- From repo root: `cd frontend && npm install && npm run dev`
- Demo login: choose role (Donor / NGO / Admin) and click Continue; no password required.

---

## License
MIT (for hackathon / educational use)
