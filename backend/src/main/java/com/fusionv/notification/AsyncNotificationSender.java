package com.fusionv.notification;

import com.fusionv.service.NotificationService;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Module 3: implements the NotificationSender interface.
 * Module 7: uses a BOUNDED thread pool (ExecutorService). We never create one thread per request:
 * a fixed number of worker threads take jobs from a queue with a maximum size. When the queue is
 * full, the caller thread runs the job itself (CallerRunsPolicy), so no notification is lost.
 */
@Component
public class AsyncNotificationSender implements NotificationSender {

    private final ExecutorService executor;
    private final NotificationService notificationService;
    private final NotificationStats stats = new NotificationStats();

    public AsyncNotificationSender(NotificationService notificationService,
                                   @Value("${fusionv.notification.threads:2}") int threads,
                                   @Value("${fusionv.notification.queue-size:100}") int queueSize) {
        this.notificationService = notificationService;
        this.executor = new ThreadPoolExecutor(
                threads, threads, 0L, TimeUnit.MILLISECONDS,
                new ArrayBlockingQueue<>(queueSize),
                new NamedThreadFactory("fusionv-notify-"),
                new ThreadPoolExecutor.CallerRunsPolicy());
    }

    @Override
    public void send(Long recipientUserId, NotificationTemplate template) {
        stats.markQueued();
        executor.execute(new NotificationTask(recipientUserId, template, notificationService, stats));
    }

    public NotificationStats getStats() {
        return stats;
    }

    /** Called by Spring when the application stops: finish queued jobs, then stop the threads. */
    @PreDestroy
    public void shutdown() {
        executor.shutdown();                                   // no new jobs, finish the queued ones
        try {
            if (!executor.awaitTermination(5, TimeUnit.SECONDS)) {
                executor.shutdownNow();                        // interrupts the workers
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
            Thread.currentThread().interrupt();                // keep the interrupt signal alive
        }
    }

    /** Gives the worker threads readable names such as "fusionv-notify-1" (easy to find in logs). */
    private static class NamedThreadFactory implements ThreadFactory {
        private final String prefix;
        private final AtomicInteger counter = new AtomicInteger(1);

        NamedThreadFactory(String prefix) {
            this.prefix = prefix;
        }

        @Override
        public Thread newThread(Runnable job) {
            Thread thread = new Thread(job, prefix + counter.getAndIncrement());
            thread.setDaemon(true);
            return thread;
        }
    }
}
