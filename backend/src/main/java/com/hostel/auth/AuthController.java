package com.hostel.auth;
import com.hostel.auth.AuthService.TokenInfo;
import com.hostel.model.Student;
import com.hostel.repository.StudentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final StudentRepository studentRepo;

    public AuthController(AuthService authService, StudentRepository studentRepo) {
        this.authService = authService;
        this.studentRepo = studentRepo;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        TokenInfo info = authService.login(body.get("username"), body.get("password"));
        if (info == null) return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        Map<String, Object> res = new HashMap<>();
        res.put("token", info.token); res.put("username", info.username);
        res.put("role", info.role); res.put("studentId", info.studentId);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Student s) {
        if (s.getPassword() == null || s.getPassword().isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Password is required"));
        if (studentRepo.findByEmail(s.getEmail()).isPresent())
            return ResponseEntity.badRequest().body(Map.of("error", "Email already registered"));
        s.setRegistrationDate(java.time.LocalDate.now());
        s.setStatus("ACTIVE");
        return ResponseEntity.ok(studentRepo.save(s));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader("Authorization") String auth) {
        if (auth != null && auth.startsWith("Bearer "))
            authService.invalidateToken(auth.substring(7));
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader("Authorization") String auth) {
        if (auth == null || !auth.startsWith("Bearer "))
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        TokenInfo info = authService.getTokenInfo(auth.substring(7));
        if (info == null) return ResponseEntity.status(401).body(Map.of("error", "Invalid token"));
        if ("student".equals(info.role) && info.studentId != null) {
            return studentRepo.findById(info.studentId)
                .map(s -> ResponseEntity.ok((Object) s))
                .orElse(ResponseEntity.status(404).body(Map.of("error", "Student not found")));
        }
        return ResponseEntity.ok(Map.of("username", info.username, "role", info.role));
    }
}
