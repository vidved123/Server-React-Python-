package org.library.service;

import java.time.LocalDateTime;

import org.library.entity.Book;
import org.library.entity.BorrowedBook;
import org.library.entity.User;
import org.library.entity.enums.Sex;
import org.library.entity.enums.Status;
import org.library.repository.BookRepository;
import org.library.repository.BorrowedBookRepository;
import org.library.repository.InventoryRepository;
import org.library.repository.UserRepository;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DatabaseInitService {

    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final BorrowedBookRepository borrowedBookRepository;
    private final InventoryRepository inventoryRepository;

    @PostConstruct
    public void initDatabase() {
        try {
            // ✅ Create Default User (if needed)
            if (userRepository.count() == 0) {
                User user = new User(null, "john_doe", "john@example.com", "password", "John Doe", Sex.Male,
                        "1234567890",
                        "+1");
                userRepository.save(user);
            }

            // ❌ Removed Default Book Creation

            // ✅ Simulate a Borrowed Book Entry (Only if books exist)
            if (borrowedBookRepository.count() == 0 && bookRepository.count() > 0) {
                User user = userRepository.findByUsername("john_doe").orElseThrow();
                Book book = bookRepository.findAll().get(0); // Pick first available book

                BorrowedBook borrowedBook = new BorrowedBook(null, book, user, LocalDateTime.now(), 1,
                        LocalDateTime.now().plusDays(14));
                borrowedBookRepository.save(borrowedBook);

                // ✅ Update inventory status (if book exists)
                inventoryRepository.findByBook(book).ifPresent(inventory -> {
                    inventory.setStatus(Status.BORROWED);
                    inventoryRepository.save(inventory);
                });
            }

            System.out.println("✅ Database initialized successfully.");
        } catch (Exception e) {
            System.err.println("❌ Database Initialization Failed: " + e.getMessage());
        }
    }
}
