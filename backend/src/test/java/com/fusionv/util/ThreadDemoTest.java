package com.fusionv.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Timeout(value = 10, unit = TimeUnit.SECONDS)   // a deadlock would fail the test instead of hanging forever
class ThreadDemoTest {

    @Test
    void threadGoesThroughItsLifeCycle() throws InterruptedException {
        assertEquals(List.of(Thread.State.NEW, Thread.State.TIMED_WAITING, Thread.State.TERMINATED), ThreadDemo.showLifeCycle());
    }

    @Test
    void threadSubclassRuns() throws InterruptedException {
        assertTrue(ThreadDemo.runThreadSubclass().startsWith("Hello from"));
    }

    @Test
    void synchronizedCounterNeverLosesUpdates() throws InterruptedException {
        assertEquals(20_000, ThreadDemo.countWithTwoThreads());
    }

    @Test
    void waitNotifyDeliversEveryMessageInOrder() throws InterruptedException {
        assertEquals(List.of("msg1", "msg2", "msg3", "msg4", "msg5", "msg6", "msg7"), ThreadDemo.producerConsumer(7));
    }

    @Test
    void interruptStopsSleepingThread() throws InterruptedException {
        assertTrue(ThreadDemo.interruptSleepingThread());
    }

    @Test
    void threadPoolReturnsAllResults() throws Exception {
        assertEquals(List.of(1, 4, 9, 16, 25), ThreadDemo.squaresWithThreadPool(5));
    }
}
