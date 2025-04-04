package org.library.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.scrypt.SCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // Password encoder bean for bcrypt hashing
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new SCryptPasswordEncoder(32768, 8, 1, 64, 16); // These should match exactly the encoding parameters
    }

    // AuthenticationManager bean
    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        return http.getSharedObject(AuthenticationManager.class);
    }

    // Security filter chain for HTTP security configuration
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // ❌ Disable CSRF for APIs
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/login", "/register").permitAll() // ✅ Allow login/register
                        .anyRequest().authenticated()) // 🔒 Require auth for other endpoints
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // 🚀 Stateless API
                .formLogin(form -> form.disable()) // ❌ Disable default login form
                .httpBasic(basic -> basic.disable()); // ❌ Disable basic auth

        return http.build();
    }
}
