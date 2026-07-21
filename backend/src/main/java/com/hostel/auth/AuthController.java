package com.hostel.auth;
import com.hostel.model.Student;
import com.hostel.repository.StudentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
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
        String token = authService.login(body.get("username"), body.get("password"));
        if (token == null) return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        return ResponseEntity.ok(Map.of("token", token, "username", body.get("username")));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Student s) {
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
}
