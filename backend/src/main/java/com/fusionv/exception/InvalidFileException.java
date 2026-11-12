package com.fusionv.exception;

/** Thrown when an uploaded file is empty, too big, has a bad extension or a fake content. */
public class InvalidFileException extends RuntimeException {
    public InvalidFileException(String message) {
        super(message);
    }
}
