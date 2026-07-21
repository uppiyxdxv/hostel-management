package com.hostel.auth;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Component
public class AuthFilter implements Filter {
    private final AuthService authService;
    public AuthFilter(AuthService authService) { this.authService = authService; }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;
        String path = req.getRequestURI();
        String method = req.getMethod();

        if ("OPTIONS".equals(method) || path.equals("/api/auth/login") || path.equals("/api/auth/register") || path.startsWith("/h2-console")) {
            chain.doFilter(request, response);
            return;
        }

        if (path.startsWith("/api/")) {
            String auth = req.getHeader("Authorization");
            if (auth == null || !auth.startsWith("Bearer ") || !authService.validateToken(auth.substring(7))) {
                res.setStatus(401);
                res.setContentType("application/json");
                res.getWriter().write("{\"error\":\"Unauthorized\"}");
                return;
            }
        }

        chain.doFilter(request, response);
    }
}
