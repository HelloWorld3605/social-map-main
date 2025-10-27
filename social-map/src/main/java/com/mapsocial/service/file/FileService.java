package com.mapsocial.service.file;


import com.mapsocial.entity.FileResource;
import com.mapsocial.repository.FileResourceRepository;
import com.mapsocial.service.cloudinary.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.security.MessageDigest;

@Service
@RequiredArgsConstructor
public class FileService {
    private final FileResourceRepository fileRepo;
    private final CloudinaryService cloudinaryService;

    // Hàm tính hash SHA-256
    private String getFileHash(MultipartFile file) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] buffer = new byte[1024];
        int bytesRead;

        try (var is = file.getInputStream()) {
            while ((bytesRead = is.read(buffer)) != -1) {
                digest.update(buffer, 0, bytesRead);
            }
        }

        byte[] hashBytes = digest.digest();
        StringBuilder sb = new StringBuilder();
        for (byte b : hashBytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    public FileResource uploadFile(MultipartFile file) throws Exception {
        String hash = getFileHash(file);

        // Check DB: nếu hash đã tồn tại -> trả về bản ghi cũ
        return fileRepo.findByHash(hash).orElseGet(() -> {
            try {
                // Upload mới lên Cloudinary
                String url = cloudinaryService.uploadFileToCloudinary(file);

                // Lưu vào DB
                FileResource resource = FileResource.builder()
                        .hash(hash)
                        .url(url)
                        .build();
                return fileRepo.save(resource);
            } catch (Exception e) {
                throw new RuntimeException("Upload failed", e);
            }
        });
    }
}
