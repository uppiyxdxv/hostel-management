package com.hostel.auth;
import com.hostel.model.Student;
import com.hostel.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {
    @Value("${admin.username:admin}")
    private String adminUsername;
    @Value("${admin.password:admin123}")
    private String adminPassword;
    private final StudentRepository studentRepo;
    private final ConcurrentHashMap<String, TokenInfo> tokens = new ConcurrentHashMap<>();

    public AuthService(StudentRepository studentRepo) { this.studentRepo = studentRepo; }

    public static class TokenInfo {
        public final String token;
        public final String username;
        public final String role;
        public final Long studentId;
        public TokenInfo(String token, String username, String role, Long studentId) {
            this.token = token; this.username = username; this.role = role; this.studentId = studentId;
        }
    }

    public TokenInfo login(String username, String password) {
        if (adminUsername.equals(username) && adminPassword.equals(password)) {
            String token = UUID.randomUUID().toString();
            TokenInfo info = new TokenInfo(token, username, "admin", null);
            tokens.put(token, info);
            return info;
        }
        Student s = studentRepo.findByEmailAndPassword(username, password).orElse(null);
        if (s != null) {
            String token = UUID.randomUUID().toString();
            TokenInfo info = new TokenInfo(token, s.getName(), "student", s.getId());
            tokens.put(token, info);
            return info;
        }
        return null;
    }

    public TokenInfo getTokenInfo(String token) {
        return tokens.get(token);
    }

    public boolean validateToken(String token) {
        return token != null && tokens.containsKey(token);
    }

    public void invalidateToken(String token) {
        tokens.remove(token);
    }
}
