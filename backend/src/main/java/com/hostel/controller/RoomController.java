package com.hostel.controller;
import com.hostel.model.Room;
import com.hostel.repository.RoomRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {
    private final RoomRepository repo;
    public RoomController(RoomRepository repo) { this.repo = repo; }

    @GetMapping public List<Room> getAll() { return repo.findAll(); }
    @GetMapping("/{id}") public ResponseEntity<?> get(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    @PostMapping public ResponseEntity<?> create(@RequestBody Room r) {
        if (repo.findByRoomNumber(r.getRoomNumber()).isPresent())
            return ResponseEntity.badRequest().body(Map.of("error","Room already exists"));
        r.setStatus(r.getOccupied() >= r.getCapacity() ? "FULL" : "AVAILABLE");
        return ResponseEntity.ok(repo.save(r));
    }
    @PutMapping("/{id}") public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Room r) {
        return repo.findById(id).map(ex -> {
            ex.setFloor(r.getFloor()); ex.setType(r.getType()); ex.setCapacity(r.getCapacity());
            ex.setOccupied(r.getOccupied()); ex.setRent(r.getRent());
            ex.setStatus(r.getOccupied() >= r.getCapacity() ? "FULL" : r.getStatus());
            return ResponseEntity.ok(repo.save(ex));
        }).orElse(ResponseEntity.notFound().build());
    }
    @DeleteMapping("/{id}") public ResponseEntity<?> delete(@PathVariable Long id) {
        repo.deleteById(id); return ResponseEntity.ok(Map.of("success",true));
    }
    @GetMapping("/empty") public List<Room> getAvailable() {
        return repo.findByStatus("AVAILABLE");
    }
}