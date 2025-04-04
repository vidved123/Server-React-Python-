package org.library.controller;

import org.library.service.DatabaseInitService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/database")
@RequiredArgsConstructor
public class DatabaseController {

    private final DatabaseInitService databaseInitService;

    @PostMapping("/init")
    public String initializeDatabase() {
        databaseInitService.initDatabase();
        return "✅ Database initialized.";
    }
}
