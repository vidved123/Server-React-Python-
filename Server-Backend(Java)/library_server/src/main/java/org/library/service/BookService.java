package org.library.service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

import org.library.entity.Book;
import org.library.repository.BookRepository;
import org.springframework.stereotype.Service;

@Service
public class BookService {

    private final BookRepository bookRepository;
    private static final String IMAGE_DIR = "src/main/resources/static/images/";

    public BookService(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    // ✅ Get All Books (With Base64 Image)
    public List<Book> getAllBooks() {
        List<Book> books = bookRepository.findAll();
        books.forEach(book -> book.setImage(getImageAsBase64(book.getImage())));
        return books;
    }

    // ✅ Get Book By ID (With Base64 Image)
    public Optional<Book> getBookById(Long id) {
        return bookRepository.findById(id).map(book -> {
            book.setImage(getImageAsBase64(book.getImage()));
            return book;
        });
    }

    // ✅ Add New Book (With Image)
    public Book addBook(Book book, String imageFilename) {
        book.setImage(imageFilename); // Store the filename in DB
        return bookRepository.save(book);
    }

    // ✅ Update Book (With Image)
    public Optional<Book> updateBook(Long id, Book updatedBook, String imageFilename) {
        return bookRepository.findById(id).map(existingBook -> {
            existingBook.setTitle(updatedBook.getTitle());
            existingBook.setAuthor(updatedBook.getAuthor());
            existingBook.setAvailable(updatedBook.isAvailable());

            if (imageFilename != null && !imageFilename.isEmpty()) {
                existingBook.setImage(imageFilename); // Update image filename
            }

            return bookRepository.save(existingBook);
        });
    }

    // ✅ Convert Image to Base64
    private String getImageAsBase64(String imageName) {
        if (imageName == null || imageName.isEmpty()) {
            return null;
        }
        try {
            File imageFile = new File(IMAGE_DIR + imageName);
            if (!imageFile.exists()) {
                return null;
            }
            byte[] imageBytes = Files.readAllBytes(Paths.get(IMAGE_DIR + imageName));
            return Base64.getEncoder().encodeToString(imageBytes);
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }

    public boolean deleteBook(Long id) {
        if (bookRepository.existsById(id)) {
            bookRepository.deleteById(id);
            return true;
        }
        return false;

    }
}
