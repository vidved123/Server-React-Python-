package org.library.service;

import java.util.Optional;

import org.library.entity.User;
import org.library.repository.UserRepository;
import org.library.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Autowired
    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public String registerUser(User user) {
        Optional<User> existingUser = userRepository.findByUsername(user.getUsername());
        if (existingUser.isPresent()) {
            throw new RuntimeException("User already exists");
        }

        // Debugging line to print the encoded password
        String encodedPassword = passwordEncoder.encode(user.getPassword());
        System.out.println("Encoded Password: " + encodedPassword); // This will print the encoded password

        // Set the encoded password for the user
        user.setPassword(encodedPassword);
        userRepository.save(user);

        return "User registered successfully, Please Login";
    }

    public String loginUser(String username, String password) {
        // Fetch the user from the database
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found!"));

        // Debug: Print the stored password and input password
        String encodedPassword = passwordEncoder.encode("Foulae0101@");
        System.out.println("Encoded Input Password: " + encodedPassword);
        System.out.println("Stored Password (Encoded): " + user.getPassword());
        System.out.println("Input Password: " + password);

        // Compare the passwords
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid Credentials");
        }

        return jwtUtil.generateToken(user.getUsername(), user.getRole()); // Pass role

    }
}
