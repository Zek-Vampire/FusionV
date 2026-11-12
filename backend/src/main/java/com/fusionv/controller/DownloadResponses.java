package com.fusionv.controller;

import com.fusionv.dto.FileDownload;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.InvalidMediaTypeException;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.nio.charset.StandardCharsets;

/** Builds the HTTP answer that makes the browser download a file. */
final class DownloadResponses {

    private DownloadResponses() {
    }

    static ResponseEntity<Resource> asAttachment(FileDownload file) {
        MediaType type;
        try {
            type = MediaType.parseMediaType(file.contentType());
        } catch (InvalidMediaTypeException e) {
            type = MediaType.APPLICATION_OCTET_STREAM;
        }
        String disposition = ContentDisposition.attachment().filename(file.fileName(), StandardCharsets.UTF_8).build().toString();
        return ResponseEntity.ok()
                .contentType(type)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                .header("X-Content-Type-Options", "nosniff")
                .body(file.resource());
    }
}
