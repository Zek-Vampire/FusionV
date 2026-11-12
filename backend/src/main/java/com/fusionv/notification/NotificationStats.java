package com.fusionv.notification;

/**
 * Module 7: counters that are shared by many threads.
 * - synchronized methods make the updates thread-safe.
 * - awaitDelivered() uses wait() and markDelivered() uses notifyAll(): a thread can sleep until
 *   enough notifications have been delivered (used by tests and by the admin statistics).
 */
public class NotificationStats {

    private int queued;
    private int delivered;
    private int failed;

    public synchronized void markQueued() {
        queued++;
    }

    public synchronized void markDelivered() {
        delivered++;
        notifyAll();            // wake every thread waiting in awaitDelivered()
    }

    public synchronized void markFailed() {
        failed++;
        notifyAll();
    }

    public synchronized int getQueued() {
        return queued;
    }

    public synchronized int getDelivered() {
        return delivered;
    }

    public synchronized int getFailed() {
        return failed;
    }

    /**
     * Waits until at least "expected" notifications were delivered or the time is over.
     * wait() must be called inside a synchronized method and inside a while loop (the condition is
     * re-checked after every wake-up, because wake-ups can be spurious).
     *
     * @return true when the expected number was reached, false on timeout or interruption
     */
    public synchronized boolean awaitDelivered(int expected, long timeoutMillis) {
        long deadline = System.currentTimeMillis() + timeoutMillis;
        while (delivered < expected) {
            long remaining = deadline - System.currentTimeMillis();
            if (remaining <= 0) {
                return false;
            }
            try {
                wait(remaining);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();   // restore the interrupt flag, then stop waiting
                return false;
            }
        }
        return true;
    }
}
