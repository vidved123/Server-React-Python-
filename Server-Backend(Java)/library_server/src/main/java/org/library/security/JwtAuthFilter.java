package org.library.security;

import java.io.IOException;

import javax.crypto.SecretKey;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.server.ResponseStatusException;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);
    private final JwtUtil jwtUtil;
    private final SecretKey JWT_SECRET_KEY;
    private final SecretKey UNIVERSAL_SECRET_KEY;

    public JwtAuthFilter(JwtUtil jwtUtil, String jwtSecret, String universalSecret) {
        this.jwtUtil = jwtUtil;
        this.JWT_SECRET_KEY = Keys.hmacShaKeyFor(jwtSecret.getBytes());
        this.UNIVERSAL_SECRET_KEY = Keys.hmacShaKeyFor(universalSecret.getBytes());
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain chain)
            throws ServletException, IOException {

        String token = null;
        String universalToken = null;

        // ✅ Extract tokens from cookies
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("token".equals(cookie.getName())) {
                    token = cookie.getValue();
                } else if ("universal_token".equals(cookie.getName())) {
                    universalToken = cookie.getValue();
                }
            }
        }

        // ✅ Extract token from Authorization header if missing in cookies
        if (token == null || token.isEmpty()) {
            String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
        }

        // 🚨 Reject request if no token is provided
        if (token == null && universalToken == null) {
            logger.warn("Unauthorized request - No token provided");
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token is missing!");
            return;
        }

        String userId = null;
        String role = "USER"; // Default role

        try {
            Claims claims = null;

            if (token != null) {
                claims = Jwts.parserBuilder()
                        .setSigningKey(JWT_SECRET_KEY)
                        .build()
                        .parseClaimsJws(token)
                        .getBody();
            } else if (universalToken != null) {
                claims = Jwts.parserBuilder()
                        .setSigningKey(UNIVERSAL_SECRET_KEY)
                        .build()
                        .parseClaimsJws(universalToken)
                        .getBody();
            }

            if (claims != null) {
                userId = claims.get("user_id", String.class);
                role = claims.get("role") != null ? claims.get("role", String.class) : role;

                // ✅ Validate token using JwtUtil (optional, based on your previous Python
                // logic)
                if (token != null && !jwtUtil.validateToken(token, userId)) {
                    logger.error("Invalid token for user: " + userId);
                    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token!");
                }

                // ✅ Set authentication in security context
                UserDetails userDetails = User.withUsername(userId)
                        .password("")
                        .roles(role.toUpperCase())
                        .build();

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authToken);
                logger.info("✅ Authenticated user: {} with role: {}", userId, role);
            }

        } catch (Exception e) {
            logger.error("JWT validation failed: {}", e.getMessage());
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired token!");
            return;
        }

        chain.doFilter(request, response);
    }
}
