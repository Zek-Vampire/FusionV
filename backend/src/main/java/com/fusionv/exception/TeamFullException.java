package com.fusionv.exception;

/** Thrown when somebody tries to join a team that already has its maximum number of members. */
public class TeamFullException extends RuntimeException {
    public TeamFullException(String teamName, int maxMembers) {
        super("Team '" + teamName + "' is full (" + maxMembers + " members maximum)");
    }
}
