package com.fusionv.exception;

/** Wrong email or password. The message is deliberately vague so attackers learn nothing. */
public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException() {
        super("Invalid email or password");
    }
}
