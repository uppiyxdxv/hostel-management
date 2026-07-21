package com.hostel.controller;
import com.hostel.model.Visitor;
import com.hostel.repository.VisitorRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/visitors")
public class VisitorController {
    private final VisitorRepository repo;
    public VisitorController(VisitorRepository repo) { this.repo = repo; }

    @GetMapping public List<Visitor> getAll() { return repo.findAll(); }
    @GetMapping("/{id}") public ResponseEntity<?> get(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    @PostMapping public Visitor create(@RequestBody Visitor v) {
        v.setInTime(java.time.LocalTime.now());
        return repo.save(v);
    }
    @PutMapping("/{id}/checkout") public ResponseEntity<?> checkout(@PathVariable Long id) {
        return repo.findById(id).map(v -> {
            v.setOutTime(java.time.LocalTime.now()); v.setStatus("OUT");
            return ResponseEntity.ok(repo.save(v));
        }).orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/today") public List<Visitor> getToday() {
        return repo.findByDate(java.time.LocalDate.now());
    }
}