# Smart Hostel Management System

A full-stack hostel management system with Spring Boot backend and clean HTML/CSS/JS frontend.

## Modules
- **Student Registration** — Add, edit, delete students
- **Room Allocation** — Add rooms, track occupancy
- **Fee Management** — Create fees, mark payments
- **Visitor Records** — Check-in/check-out visitors
- **Complaint Management** — Register, track, resolve complaints
- **Attendance** — Mark daily attendance per student

## Tech Stack
- **Backend**: Java 17, Spring Boot 3.2, JPA/Hibernate, H2 Database
- **Frontend**: HTML5, CSS3, Vanilla JS

## How to Run

### Backend
```bash
cd backend
mvn spring-boot:run
```
Server starts at `http://localhost:8080`
H2 Console: `http://localhost:8080/h2-console` (JDBC: `jdbc:h2:file:./data/hostel`)

### Frontend
Open `frontend/index.html` in browser (via Live Server on port 5500 recommended)
Or use VS Code Live Server extension.
