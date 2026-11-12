package com.fusionv.exception;

/** Unchecked custom exception: thrown when a user id/email does not exist. */
public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(String message) {
        super(message);
    }

    public UserNotFoundException(Long userId) {
        super("User not found with id " + userId);
    }
}
