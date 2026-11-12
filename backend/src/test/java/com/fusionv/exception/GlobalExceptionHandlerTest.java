package com.fusionv.exception;

import com.fusionv.dto.ErrorResponse;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void notFoundGives404() {
        ResponseEntity<ErrorResponse> response = handler.handleNotFound(new ResourceNotFoundException("Team", 5L));
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Team not found with id 5", response.getBody().message());
    }

    @Test
    void userNotFoundGives404() {
        assertEquals(HttpStatus.NOT_FOUND, handler.handleNotFound(new UserNotFoundException(3L)).getStatusCode());
    }

    @Test
    void teamFullGives409() {
        ResponseEntity<ErrorResponse> response = handler.handleConflict(new TeamFullException("Alpha", 4));
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals(409, response.getBody().status());
    }

    @Test
    void invalidFileGives400() {
        assertEquals(HttpStatus.BAD_REQUEST, handler.handleBadRequest(new InvalidFileException("bad")).getStatusCode());
    }

    @Test
    void notAllowedGives403() {
        assertEquals(HttpStatus.FORBIDDEN, handler.handleForbidden(new NotAllowedException("no")).getStatusCode());
    }

    @Test
    void badCredentialsGive401() {
        assertEquals(HttpStatus.UNAUTHORIZED, handler.handleBadCredentials(new InvalidCredentialsException()).getStatusCode());
    }

    @Test
    void checkedFileExceptionGives500WithoutTechnicalDetails() {
        FileStorageException problem = new FileStorageException("Could not save", new java.io.IOException("disk /secret/path full"));
        ResponseEntity<ErrorResponse> response = handler.handleFileStorage(problem);
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertFalse(response.getBody().message().contains("/secret/path"));
    }

    @Test
    void databaseDuplicateGives409WithoutSql() {
        ResponseEntity<ErrorResponse> response = handler.handleIntegrity(
                new DataIntegrityViolationException("duplicate key value violates unique constraint \"uk_users_email\""));
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertFalse(response.getBody().message().contains("uk_users_email"));
    }

    @Test
    void unexpectedErrorGives500() {
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, handler.handleUnexpected(new IllegalStateException("boom")).getStatusCode());
    }
}
