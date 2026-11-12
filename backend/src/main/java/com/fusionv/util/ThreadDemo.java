package com.fusionv.util;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

/**
 * Module 7 demonstration. Run main() to see everything.
 * 1) Thread vs Runnable and the thread life cycle   2) synchronized counter
 * 3) wait()/notifyAll() producer-consumer           4) interrupt handling
 * 5) ExecutorService thread pool
 */
public class ThreadDemo {

    // ---------- 1) Thread life cycle ----------
    /** Returns the states a thread goes through: NEW, RUNNABLE/TIMED_WAITING, TERMINATED. */
    public static List<Thread.State> showLifeCycle() throws InterruptedException {
        List<Thread.State> states = new ArrayList<>();
        Thread worker = new Thread(() -> {
            try {
                Thread.sleep(200);                 // TIMED_WAITING while sleeping
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
        states.add(worker.getState());             // NEW
        worker.start();
        Thread.sleep(50);
        states.add(worker.getState());             // TIMED_WAITING
        worker.join();
        states.add(worker.getState());             // TERMINATED
        return states;
    }

    /** Creating a thread by extending Thread (the other way is a Runnable, used above). */
    static class GreetingThread extends Thread {
        private String message;

        @Override
        public void run() {
            message = "Hello from " + getName();
        }

        String getMessage() {
            return message;
        }
    }

    public static String runThreadSubclass() throws InterruptedException {
        GreetingThread thread = new GreetingThread();
        thread.start();
        thread.join();
        return thread.getMessage();
    }

    // ---------- 2) Synchronization ----------
    /** Without "synchronized" two threads would lose updates (count++ is read, add, write). */
    static class SafeCounter {
        private int value;

        synchronized void increment() {
            value++;
        }

        synchronized int get() {
            return value;
        }
    }

    public static int countWithTwoThreads() throws InterruptedException {
        SafeCounter counter = new SafeCounter();
        Runnable job = () -> {
            for (int i = 0; i < 10_000; i++) {
                counter.increment();
            }
        };
        Thread first = new Thread(job);
        Thread second = new Thread(job);
        first.start();
        second.start();
        first.join();
        second.join();
        return counter.get();       // always 20000
    }

    // ---------- 3) wait() / notifyAll() ----------
    /** A buffer with a maximum size. Producers wait when it is full, consumers wait when it is empty. */
    static class BoundedBuffer {
        private final Queue<String> items = new LinkedList<>();
        private final int capacity;

        BoundedBuffer(int capacity) {
            this.capacity = capacity;
        }

        public synchronized void put(String item) throws InterruptedException {
            while (items.size() == capacity) {      // "while", never "if": re-check after waking up
                wait();                            // gives up the lock and sleeps
            }
            items.add(item);
            notifyAll();                           // tell sleeping consumers there is something to take
        }

        public synchronized String take() throws InterruptedException {
            while (items.isEmpty()) {
                wait();
            }
            String item = items.remove();
            notifyAll();                           // tell sleeping producers there is free space
            return item;
        }
    }

    /** One producer thread sends "msg1..msgN"; the calling thread consumes them and returns the list. */
    public static List<String> producerConsumer(int messageCount) throws InterruptedException {
        BoundedBuffer buffer = new BoundedBuffer(3);
        Thread producer = new Thread(() -> {
            try {
                for (int i = 1; i <= messageCount; i++) {
                    buffer.put("msg" + i);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }, "producer");
        producer.start();

        List<String> received = new ArrayList<>();
        for (int i = 0; i < messageCount; i++) {
            received.add(buffer.take());
        }
        producer.join();
        return received;
    }

    // ---------- 4) Interrupt handling ----------
    /** Starts a long-sleeping thread, interrupts it and reports whether it stopped politely. */
    public static boolean interruptSleepingThread() throws InterruptedException {
        boolean[] stoppedPolitely = {false};
        Thread sleeper = new Thread(() -> {
            try {
                Thread.sleep(60_000);
            } catch (InterruptedException e) {
                stoppedPolitely[0] = true;          // we were asked to stop: clean up and leave
                Thread.currentThread().interrupt();
            }
        });
        sleeper.start();
        sleeper.interrupt();
        sleeper.join(2000);
        return stoppedPolitely[0] && !sleeper.isAlive();
    }

    // ---------- 5) ExecutorService ----------
    /** A pool of 3 threads computes 5 jobs. Future.get() waits for each result. */
    public static List<Integer> squaresWithThreadPool(int count) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(3);
        try {
            List<Future<Integer>> futures = new ArrayList<>();
            for (int i = 1; i <= count; i++) {
                final int number = i;
                futures.add(pool.submit(() -> number * number));
            }
            List<Integer> results = new ArrayList<>();
            for (Future<Integer> future : futures) {
                results.add(future.get());
            }
            return results;
        } finally {
            pool.shutdown();                                        // always stop the pool
            if (!pool.awaitTermination(2, TimeUnit.SECONDS)) {
                pool.shutdownNow();
            }
        }
    }

    public static void main(String[] args) throws Exception {
        System.out.println("Life cycle: " + showLifeCycle());
        System.out.println(runThreadSubclass());
        System.out.println("Counter: " + countWithTwoThreads());
        System.out.println("Producer/consumer: " + producerConsumer(5));
        System.out.println("Interrupt stopped politely: " + interruptSleepingThread());
        System.out.println("Thread pool squares: " + squaresWithThreadPool(5));
    }
}
