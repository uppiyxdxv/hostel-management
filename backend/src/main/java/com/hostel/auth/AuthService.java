package com.hostel.auth;
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
    private final ConcurrentHashMap<String, String> tokens = new ConcurrentHashMap<>();

    public String login(String username, String password) {
        if (adminUsername.equals(username) && adminPassword.equals(password)) {
            String token = UUID.randomUUID().toString();
            tokens.put(token, username);
            return token;
        }
        return null;
    }

    public boolean validateToken(String token) {
        return token != null && tokens.containsKey(token);
    }

    public void invalidateToken(String token) {
        tokens.remove(token);
    }
}
