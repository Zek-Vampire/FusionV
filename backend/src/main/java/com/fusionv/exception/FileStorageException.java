package com.fusionv.exception;

/**
 * CHECKED custom exception (extends Exception, not RuntimeException).
 * The compiler forces every caller to catch it or declare "throws", which is how
 * Java tells us "this file operation can fail, you must think about it".
 */
public class FileStorageException extends Exception {
    public FileStorageException(String message, Throwable cause) {
        super(message, cause);
    }

    public FileStorageException(String message) {
        super(message);
    }
}
