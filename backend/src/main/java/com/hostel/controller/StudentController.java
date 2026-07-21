package com.hostel.controller;
import com.hostel.model.Student;
import com.hostel.model.Room;
import com.hostel.repository.StudentRepository;
import com.hostel.repository.RoomRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/students")
public class StudentController {
    private final StudentRepository repo;
    private final RoomRepository roomRepo;
    public StudentController(StudentRepository repo, RoomRepository roomRepo) { this.repo = repo; this.roomRepo = roomRepo; }

    @GetMapping public List<Student> getAll() { return repo.findAll(); }
    @GetMapping("/{id}") public ResponseEntity<?> get(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    @PostMapping public ResponseEntity<?> create(@RequestBody Student s) {
        if (repo.findByEmail(s.getEmail()).isPresent())
            return ResponseEntity.badRequest().body(Map.of("error","Email already exists"));
        s.setRegistrationDate(java.time.LocalDate.now());
        return ResponseEntity.ok(repo.save(s));
    }
    @PutMapping("/{id}") public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Student s) {
        return repo.findById(id).map(ex -> {
            ex.setName(s.getName()); ex.setPhone(s.getPhone()); ex.setAddress(s.getAddress());
            ex.setGender(s.getGender()); ex.setDob(s.getDob()); ex.setStatus(s.getStatus());
            if (s.getRoomNumber() != null) ex.setRoomNumber(s.getRoomNumber());
            return ResponseEntity.ok(repo.save(ex));
        }).orElse(ResponseEntity.notFound().build());
    }
    @DeleteMapping("/{id}") public ResponseEntity<?> delete(@PathVariable Long id) {
        Student s = repo.findById(id).orElse(null);
        if (s != null && s.getRoomNumber() != null) {
            roomRepo.findByRoomNumber(s.getRoomNumber()).ifPresent(r -> {
                r.setOccupied(Math.max(0, r.getOccupied() - 1));
                if (r.getOccupied() < r.getCapacity()) r.setStatus("AVAILABLE");
                roomRepo.save(r);
            });
        }
        repo.deleteById(id);
        return ResponseEntity.ok(Map.of("success",true));
    }
    @PutMapping("/{id}/allot-room")
    public ResponseEntity<?> allotRoom(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return repo.findById(id).map(student -> {
            Object roomIdObj = body.get("roomId");
            if (roomIdObj == null) return ResponseEntity.badRequest().body(Map.of("error", "roomId required"));
            Long roomId = roomIdObj instanceof Number ? ((Number) roomIdObj).longValue() : Long.parseLong(roomIdObj.toString());
            Room room = roomRepo.findById(roomId).orElse(null);
            if (room == null) return ResponseEntity.badRequest().body(Map.of("error", "Room not found"));
            if (room.getOccupied() >= room.getCapacity())
                return ResponseEntity.badRequest().body(Map.of("error", "Room is full"));

            if (student.getRoomNumber() != null) {
                roomRepo.findByRoomNumber(student.getRoomNumber()).ifPresent(oldRoom -> {
                    oldRoom.setOccupied(Math.max(0, oldRoom.getOccupied() - 1));
                    if (oldRoom.getOccupied() < oldRoom.getCapacity()) oldRoom.setStatus("AVAILABLE");
                    roomRepo.save(oldRoom);
                });
            }

            student.setRoomNumber(room.getRoomNumber());
            room.setOccupied(room.getOccupied() + 1);
            if (room.getOccupied() >= room.getCapacity()) room.setStatus("FULL");
            roomRepo.save(room);
            return ResponseEntity.ok(repo.save(student));
        }).orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/stats") public Map<String,Object> stats() {
        return Map.of("total",repo.count(),"active",repo.countByStatus("ACTIVE"));
    }
}
