package com.fusionv.exception;

/** Thrown for duplicates: same email, same like, same join request, already a member... (HTTP 409). */
public class DuplicateEntryException extends RuntimeException {
    public DuplicateEntryException(String message) {
        super(message);
    }
}
