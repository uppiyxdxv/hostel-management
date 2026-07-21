package com.hostel.controller;
import com.hostel.model.Attendance;
import com.hostel.repository.AttendanceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {
    private final AttendanceRepository repo;
    public AttendanceController(AttendanceRepository repo) { this.repo = repo; }

    @GetMapping public List<Attendance> getAll() { return repo.findAll(); }
    @GetMapping("/date/{date}") public List<Attendance> getByDate(@PathVariable String date) {
        return repo.findByDate(java.time.LocalDate.parse(date));
    }
    @GetMapping("/student/{studentId}") public List<Attendance> getByStudent(@PathVariable Long studentId) {
        return repo.findByStudentId(studentId);
    }
    @PostMapping public Attendance create(@RequestBody Attendance a) { return repo.save(a); }
    @PutMapping("/{id}") public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Attendance a) {
        return repo.findById(id).map(ex -> {
            ex.setStatus(a.getStatus()); ex.setInTime(a.getInTime()); ex.setOutTime(a.getOutTime()); ex.setRemark(a.getRemark());
            return ResponseEntity.ok(repo.save(ex));
        }).orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/stats/today") public Map<String,Object> todayStats() {
        var today = java.time.LocalDate.now();
        return Map.of("date",today.toString(),"present",repo.countByDateAndStatus(today,"PRESENT"),"absent",repo.countByDateAndStatus(today,"ABSENT"));
    }
}