package com.fusionv.exception;

/** Thrown when a logged-in user tries to do something that belongs to somebody else (HTTP 403). */
public class NotAllowedException extends RuntimeException {
    public NotAllowedException(String message) {
        super(message);
    }
}
