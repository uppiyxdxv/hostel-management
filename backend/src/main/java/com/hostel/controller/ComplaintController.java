package com.hostel.controller;
import com.hostel.model.Complaint;
import com.hostel.repository.ComplaintRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {
    private final ComplaintRepository repo;
    public ComplaintController(ComplaintRepository repo) { this.repo = repo; }

    @GetMapping public List<Complaint> getAll() { return repo.findAll(); }
    @GetMapping("/{id}") public ResponseEntity<?> get(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/student/{studentId}") public List<Complaint> getByStudent(@PathVariable Long studentId) {
        return repo.findByStudentId(studentId);
    }
    @PostMapping public Complaint create(@RequestBody Complaint c) { return repo.save(c); }
    @PutMapping("/{id}/status") public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String,String> b) {
        return repo.findById(id).map(c -> {
            c.setStatus(b.get("status"));
            if ("RESOLVED".equals(b.get("status"))) { c.setResolvedAt(java.time.LocalDate.now()); c.setResolution(b.get("resolution")); }
            return ResponseEntity.ok(repo.save(c));
        }).orElse(ResponseEntity.notFound().build());
    }
}