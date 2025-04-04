package org.library.repository;

import java.util.Optional;

import org.library.entity.Book;
import org.library.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    Optional<Inventory> findByBook(Book book);
}
