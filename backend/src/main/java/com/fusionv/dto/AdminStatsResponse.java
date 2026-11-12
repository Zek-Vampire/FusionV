package com.fusionv.dto;

/** Numbers for the administrator. */
public record AdminStatsResponse(
        long users,
        long teams,
        long resources,
        long posts,
        int notificationsQueued,
        int notificationsDelivered,
        int notificationsFailed
) {
}
