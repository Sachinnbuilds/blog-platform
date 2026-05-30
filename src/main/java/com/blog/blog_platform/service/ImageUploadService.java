package com.blog.blog_platform.service;

import java.io.IOException;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;

@Service
public class ImageUploadService {

    private static final long MAX_IMAGE_SIZE_BYTES = 5L * 1024 * 1024;

    private final Cloudinary cloudinary;

    public ImageUploadService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public String uploadImage(MultipartFile file) {
        validateFile(file);
        ensureConfigured();

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    Map.of("folder", "blog-platform/posts"));

            Object secureUrl = uploadResult.get("secure_url");
            if (secureUrl == null) {
                throw new RuntimeException("Cloudinary did not return an image URL");
            }

            return secureUrl.toString();
        } catch (IOException ex) {
            throw new RuntimeException("Failed to read image for upload");
        } catch (Exception ex) {
            throw new RuntimeException("Image upload failed");
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Image file is required");
        }

        if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new RuntimeException("Image must be 5MB or smaller");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Only image files are allowed");
        }
    }

    private void ensureConfigured() {
        Object cloudName = cloudinary.config.cloudName;
        Object apiKey = cloudinary.config.apiKey;
        Object apiSecret = cloudinary.config.apiSecret;

        if (isBlank(cloudName) || isBlank(apiKey) || isBlank(apiSecret)) {
            throw new RuntimeException("Cloudinary is not configured on the server");
        }
    }

    private boolean isBlank(Object value) {
        return value == null || value.toString().trim().isEmpty();
    }
}
