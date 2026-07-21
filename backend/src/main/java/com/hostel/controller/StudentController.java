package com.hostel.controller;
import com.hostel.model.Student;
import com.hostel.repository.StudentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/students")
public class StudentController {
    private final StudentRepository repo;
    public StudentController(StudentRepository repo) { this.repo = repo; }

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
        repo.deleteById(id); return ResponseEntity.ok(Map.of("success",true));
    }
    @GetMapping("/stats") public Map<String,Object> stats() {
        return Map.of("total",repo.count(),"active",repo.countByStatus("ACTIVE"));
    }
}