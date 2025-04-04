package org.library.service;

import java.util.List;
import java.util.Optional;

import org.library.entity.User;
import org.library.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long Id) {
        return userRepository.findById(Id);
    }

    public User createUser(User user) {
        return userRepository.save(user);
    }

    public Optional<User> updateUser(Long Id, User updatedUser) {
        Optional<User> existingUser = userRepository.findById(Id);
        return existingUser.map(user -> {
            user.setFullName(updatedUser.getFullName()); // Use setFullName() instead of setName()
            user.setEmail(updatedUser.getEmail());
            return userRepository.save(user);
        });
    }

    public boolean deleteUser(Long Id) {
        if (userRepository.existsById(Id)) {
            userRepository.deleteById(Id);
            return true;
        }
        return false;

    }

}
