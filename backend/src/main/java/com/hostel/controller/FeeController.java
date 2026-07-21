package com.hostel.controller;
import com.hostel.model.Fee;
import com.hostel.repository.FeeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fees")
public class FeeController {
    private final FeeRepository repo;
    public FeeController(FeeRepository repo) { this.repo = repo; }

    @GetMapping public List<Fee> getAll() { return repo.findAll(); }
    @GetMapping("/{id}") public ResponseEntity<?> get(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/student/{studentId}") public List<Fee> getByStudent(@PathVariable Long studentId) {
        return repo.findByStudentId(studentId);
    }
    @PostMapping public Fee create(@RequestBody Fee f) { return repo.save(f); }
    @PutMapping("/{id}/pay") public ResponseEntity<?> pay(@PathVariable Long id) {
        return repo.findById(id).map(f -> {
            f.setStatus("PAID"); f.setPaidDate(java.time.LocalDate.now());
            return ResponseEntity.ok(repo.save(f));
        }).orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/stats") public Map<String,Object> stats() {
        return Map.of("total",repo.count(),"paid",repo.countByStatus("PAID"),"unpaid",repo.countByStatus("UNPAID"));
    }
}