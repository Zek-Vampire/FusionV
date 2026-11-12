package com.fusionv.util;

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.RandomAccessFile;
import java.io.Serializable;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

/**
 * File handling demonstration (separate from the real upload code):
 * serialization / deserialization, RandomAccessFile, FileInputStream/FileOutputStream with
 * try-catch-finally, and java.nio.file.Files (create, rename, read, delete).
 */
public class FileManagementDemo {

    /** A small serializable object: "implements Serializable" lets Java turn it into bytes. */
    public static class StudentCard implements Serializable {
        private static final long serialVersionUID = 1L;

        private final String name;
        private final int year;
        private transient String temporaryNote;   // "transient" fields are NOT saved

        public StudentCard(String name, int year, String temporaryNote) {
            this.name = name;
            this.year = year;
            this.temporaryNote = temporaryNote;
        }

        public String getName() {
            return name;
        }

        public int getYear() {
            return year;
        }

        public String getTemporaryNote() {
            return temporaryNote;
        }
    }

    /** Serialization: object to file. */
    public static void saveCard(StudentCard card, Path file) throws IOException {
        try (ObjectOutputStream out = new ObjectOutputStream(new FileOutputStream(file.toFile()))) {
            out.writeObject(card);
        }
    }

    /** Deserialization: file back to object. ClassNotFoundException is a CHECKED exception. */
    public static StudentCard loadCard(Path file) throws IOException, ClassNotFoundException {
        try (ObjectInputStream in = new ObjectInputStream(new FileInputStream(file.toFile()))) {
            return (StudentCard) in.readObject();
        }
    }

    /**
     * RandomAccessFile: jump to any position. We write fixed-size records (20 bytes of name + 4 bytes
     * of year) and then read record number 1 without reading record number 0.
     */
    public static String readSecondRecord(Path file, String[] names, int[] years) throws IOException {
        final int nameBytes = 20;
        final int recordSize = nameBytes + 4;
        try (RandomAccessFile raf = new RandomAccessFile(file.toFile(), "rw")) {
            for (int i = 0; i < names.length; i++) {
                byte[] padded = new byte[nameBytes];
                byte[] real = names[i].getBytes(StandardCharsets.UTF_8);
                System.arraycopy(real, 0, padded, 0, Math.min(real.length, nameBytes));
                raf.write(padded);
                raf.writeInt(years[i]);
            }
            raf.seek(recordSize);                 // jump straight to record number 1
            byte[] nameData = new byte[nameBytes];
            raf.readFully(nameData);
            int year = raf.readInt();
            return new String(nameData, StandardCharsets.UTF_8).trim() + " / year " + year;
        }
    }

    /** Classic try-catch-finally with FileInputStream: finally ALWAYS runs, so the stream is closed. */
    public static int countBytes(Path file) {
        FileInputStream in = null;
        int total = 0;
        try {
            in = new FileInputStream(file.toFile());
            while (in.read() != -1) {
                total++;
            }
        } catch (IOException e) {
            System.out.println("Could not read file: " + e.getMessage());
            return -1;
        } finally {
            if (in != null) {
                try {
                    in.close();
                } catch (IOException e) {
                    System.out.println("Could not close file: " + e.getMessage());
                }
            }
        }
        return total;
    }

    /** NIO: create, write, rename (move), read and delete a text file. Returns the text read back. */
    public static String nioLifecycle(Path folder) throws IOException {
        Path created = folder.resolve("notes.txt");
        Files.writeString(created, "FusionV notes");                          // create + write
        Path renamed = folder.resolve("notes-renamed.txt");
        Files.move(created, renamed, StandardCopyOption.REPLACE_EXISTING);    // rename
        String text = Files.readString(renamed);                              // read
        Files.delete(renamed);                                                // delete
        return text;
    }

    public static void main(String[] args) throws Exception {
        Path folder = Files.createTempDirectory("fusionv-demo");
        Path cardFile = folder.resolve("card.bin");
        saveCard(new StudentCard("Aryan", 2, "not saved"), cardFile);
        StudentCard loaded = loadCard(cardFile);
        System.out.println(loaded.getName() + ", year " + loaded.getYear() + ", note=" + loaded.getTemporaryNote());
        System.out.println(readSecondRecord(folder.resolve("records.dat"), new String[]{"Aryan", "Priya"}, new int[]{2, 3}));
        System.out.println("Bytes in card file: " + countBytes(cardFile));
        System.out.println(nioLifecycle(folder));
    }
}
