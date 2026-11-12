package com.fusionv.exception;

/** Unchecked custom exception: a team, hackathon, study material, post... was not found. */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String what, Long id) {
        super(what + " not found with id " + id);
    }

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
