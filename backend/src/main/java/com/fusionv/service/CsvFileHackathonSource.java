package com.fusionv.service;

import com.fusionv.dto.HackathonRequest;
import com.fusionv.util.HackathonCsvParser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

/** Reads hackathons from a CSV file whose path is set in HACKATHON_CSV_PATH (disabled when empty). */
@Component
public class CsvFileHackathonSource implements HackathonDataSource {

    private final String csvPath;

    public CsvFileHackathonSource(@Value("${fusionv.hackathons.csv-path:}") String csvPath) {
        this.csvPath = csvPath;
    }

    @Override
    public String getSourceName() {
        return "CSV file";
    }

    @Override
    public boolean isConfigured() {
        return csvPath != null && !csvPath.isBlank();
    }

    @Override
    public List<HackathonRequest> fetchHackathons() throws IOException {
        String text = Files.readString(Paths.get(csvPath), StandardCharsets.UTF_8);
        return HackathonCsvParser.parse(text);
    }
}
