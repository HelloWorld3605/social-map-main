package com.mapsocial.controller;

import com.mapsocial.entity.FileResource;
import com.mapsocial.service.file.FileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@Tag(name = "Upload File", description = "API cho người dùng upload file (ảnh, nhạc, video) lên Cloudinary")
public class UploadController {

    private final FileService fileService;
    @PostMapping(consumes = { "multipart/form-data" })
    @Operation(summary = "Upload file", description = "Upload file (ảnh, nhạc, video) lên Cloudinary và trả về URL")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Upload thành công"),
            @ApiResponse(responseCode = "400", description = "File không hợp lệ hoặc lỗi upload"),
            @ApiResponse(responseCode = "409", description = "Xung đột khi upload")
    })
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) {
        try {
            System.out.println("Upload endpoint hit! File: " + (file != null ? file.getOriginalFilename() : "null"));

            if (file == null || file.isEmpty()) {
                System.out.println("File validation failed: empty or null");
                return ResponseEntity.badRequest().body("File không được để trống");
            }

            System.out.println("File details - Name: " + file.getOriginalFilename() +
                    ", Size: " + file.getSize() +
                    ", Type: " + file.getContentType());

            if (file.getSize() > 50 * 1024 * 1024) {
                System.out.println("File too large: " + file.getSize());
                return ResponseEntity.badRequest().body("File quá lớn. Kích thước tối đa: 50MB");
            }

            System.out.println("Starting upload to Cloudinary...");
            FileResource saved = fileService.uploadFile(file);
            System.out.println("Upload successful! URL: " + saved.getUrl());
            return ResponseEntity.ok(saved.getUrl());
        } catch (Exception e) {
            System.err.println("Upload error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Upload error: " + e.getMessage());
        }
    }
}
