package org.library.controller;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/images")
public class ImageController {

    private static final String UPLOAD_DIR = "src/main/resources/static/images/";

    // ✅ Upload Image API
    @PostMapping("/upload")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            // ✅ Validate file type
            if (!isValidImage(file)) {
                return ResponseEntity.badRequest().body("Invalid file type! Only JPG, PNG, and JPEG are allowed.");
            }

            // ✅ Create upload directory if it doesn't exist
            File uploadDir = new File(UPLOAD_DIR);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            // ✅ Generate a unique filename
            String fileExtension = StringUtils.getFilenameExtension(file.getOriginalFilename());
            String uniqueFileName = UUID.randomUUID() + "." + fileExtension;

            // ✅ Save the file
            String filePath = UPLOAD_DIR + uniqueFileName;
            file.transferTo(new File(filePath));

            // ✅ Return image URL
            String imageUrl = "/images/" + uniqueFileName;
            return ResponseEntity.ok().body("Image uploaded successfully: " + imageUrl);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("❌ Failed to upload image.");
        }
    }

    // ✅ Image Validation
    private boolean isValidImage(MultipartFile file) {
        String contentType = file.getContentType();
        return contentType != null && (contentType.equals("image/jpeg") || contentType.equals("image/png")
                || contentType.equals("image/jpg"));
    }
}
