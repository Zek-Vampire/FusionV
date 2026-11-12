package com.fusionv.service;

import com.fusionv.dto.FileDownload;
import com.fusionv.exception.FileStorageException;
import com.fusionv.exception.InvalidFileException;
import com.fusionv.exception.ResourceNotFoundException;
import com.fusionv.util.AppConstants;
import com.fusionv.util.FileValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Saves, reads and deletes uploaded files on the local disk (outside the Java source folder).
 * Uses Java I/O streams (FileOutputStream) and Java NIO (Files, Path). Files are saved under a random
 * name (UUID), so a user-supplied name can never be used for path traversal ("../../x").
 */
@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);

    private final Path resourcesDir;
    private final Path resumesDir;
    private final long maxSizeBytes;

    public FileStorageService(@Value("${fusionv.upload.dir}") String uploadDir,
                              @Value("${fusionv.upload.max-size-bytes}") long maxSizeBytes) {
        Path base = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.resourcesDir = base.resolve("resources");
        this.resumesDir = base.resolve("resumes");
        this.maxSizeBytes = maxSizeBytes;
        try {
            Files.createDirectories(resourcesDir);
            Files.createDirectories(resumesDir);
        } catch (IOException e) {
            // Without upload folders the application cannot work: fail fast at startup.
            throw new IllegalStateException("Cannot create upload folders under " + base, e);
        }
    }

    public String storeResource(MultipartFile file) throws FileStorageException {
        return store(file, resourcesDir, AppConstants.RESOURCE_EXTENSIONS);
    }

    public String storeResume(MultipartFile file) throws FileStorageException {
        return store(file, resumesDir, AppConstants.RESUME_EXTENSIONS);
    }

    public FileDownload loadResource(String storedName, String downloadName, String contentType) {
        return load(resourcesDir, storedName, downloadName, contentType);
    }

    public FileDownload loadResume(String storedName, String downloadName) {
        return load(resumesDir, storedName, downloadName, "application/octet-stream");
    }

    public void deleteResource(String storedName) throws FileStorageException {
        delete(resourcesDir, storedName);
    }

    public void deleteResume(String storedName) throws FileStorageException {
        delete(resumesDir, storedName);
    }

    /** For clean-up after a database change: a missing file must not break the request, so we only log. */
    public void deleteResourceQuietly(String storedName) {
        try {
            delete(resourcesDir, storedName);
        } catch (FileStorageException e) {
            log.warn("Could not delete stored file {}: {}", storedName, e.getMessage());
        }
    }

    public void deleteResumeQuietly(String storedName) {
        try {
            delete(resumesDir, storedName);
        } catch (FileStorageException e) {
            log.warn("Could not delete stored resume {}: {}", storedName, e.getMessage());
        }
    }

    // ---------------------------------------------------------------- private helpers

    private String store(MultipartFile file, Path folder, String[] allowedExtensions) throws FileStorageException {
        byte[] data;
        try {
            data = file.getBytes();
        } catch (IOException e) {
            throw new FileStorageException("Could not read the uploaded file", e);
        }
        FileValidator.validate(file.getOriginalFilename(), file.getContentType(), data, maxSizeBytes, allowedExtensions);

        String extension = FileValidator.getExtension(file.getOriginalFilename());
        String storedName = UUID.randomUUID() + "." + extension;
        Path target = folder.resolve(storedName).normalize();
        if (!target.startsWith(folder)) {
            throw new InvalidFileException("Invalid file name");
        }
        Path tempFile = folder.resolve(storedName + ".part");

        OutputStream out = null;
        try {
            out = new FileOutputStream(tempFile.toFile());                  // Java I/O: write the bytes ...
            out.write(data);
            out.flush();
            out.close();
            out = null;
            Files.move(tempFile, target, StandardCopyOption.ATOMIC_MOVE);   // ... NIO: rename the finished file
            return storedName;
        } catch (IOException e) {
            throw new FileStorageException("Could not save the file", e);
        } finally {
            closeQuietly(out);                                              // always runs, even after an error
            try {
                Files.deleteIfExists(tempFile);                             // remove a half-written temp file
            } catch (IOException e) {
                log.warn("Could not delete temp file {}", tempFile.getFileName());
            }
        }
    }

    private FileDownload load(Path folder, String storedName, String downloadName, String contentType) {
        Path file = folder.resolve(storedName).normalize();
        if (!file.startsWith(folder) || !Files.isRegularFile(file)) {
            throw new ResourceNotFoundException("The file is no longer available on the server");
        }
        return new FileDownload(new FileSystemResource(file), downloadName, contentType);
    }

    private void delete(Path folder, String storedName) throws FileStorageException {
        if (storedName == null || storedName.isBlank()) {
            return;
        }
        Path file = folder.resolve(storedName).normalize();
        if (!file.startsWith(folder)) {
            throw new InvalidFileException("Invalid file name");
        }
        try {
            Files.deleteIfExists(file);
        } catch (IOException e) {
            throw new FileStorageException("Could not delete the file", e);
        }
    }

    private void closeQuietly(OutputStream out) {
        if (out != null) {
            try {
                out.close();
            } catch (IOException e) {
                log.warn("Could not close output stream: {}", e.getMessage());
            }
        }
    }
}
