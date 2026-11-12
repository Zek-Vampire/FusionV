package com.fusionv.util;

import com.fusionv.dto.HackathonRequest;
import com.fusionv.exception.BadRequestException;
import com.fusionv.model.HackathonMode;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Reads hackathon rows from CSV text. The first line must be the header, for example:
 * name,domain,organizer,location,mode,description,eligibility,startDate,endDate,registrationDeadline,minTeamSize,maxTeamSize,registrationUrl
 * Dates look like 2026-12-31. Values may be wrapped in "double quotes" (so they can contain commas).
 * Limitation: a value cannot span several lines.
 */
public final class HackathonCsvParser {

    private HackathonCsvParser() {
    }

    public static List<HackathonRequest> parse(String csvText) {
        List<HackathonRequest> result = new ArrayList<>();
        String[] lines = csvText.replace("\r", "").split("\n");
        if (lines.length == 0 || lines[0].isBlank()) {
            throw new BadRequestException("The CSV file is empty");
        }
        List<String> header = splitLine(stripBom(lines[0]));
        Map<String, Integer> columnOf = new HashMap<>();
        for (int i = 0; i < header.size(); i++) {
            columnOf.put(header.get(i).trim().toLowerCase(Locale.ROOT), i);
        }
        if (!columnOf.containsKey("name") || !columnOf.containsKey("mode")) {
            throw new BadRequestException("The CSV header must contain at least the columns: name, mode");
        }
        for (int lineNumber = 1; lineNumber < lines.length; lineNumber++) {
            if (lines[lineNumber].isBlank()) {
                continue;
            }
            List<String> cells = splitLine(lines[lineNumber]);
            try {
                result.add(toRequest(cells, columnOf));
            } catch (IllegalArgumentException | DateTimeParseException e) {
                throw new BadRequestException("CSV line " + (lineNumber + 1) + " is invalid: " + e.getMessage());
            }
        }
        return result;
    }

    /** Splits one CSV line, understanding "quoted, values" and "" (an escaped quote). */
    static List<String> splitLine(String line) {
        List<String> cells = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean insideQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (insideQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    insideQuotes = !insideQuotes;
                }
            } else if (c == ',' && !insideQuotes) {
                cells.add(current.toString());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        cells.add(current.toString());
        return cells;
    }

    private static HackathonRequest toRequest(List<String> cells, Map<String, Integer> columnOf) {
        String name = text(cells, columnOf, "name");
        if (name == null) {
            throw new IllegalArgumentException("name is required");
        }
        String modeText = text(cells, columnOf, "mode");
        if (modeText == null) {
            throw new IllegalArgumentException("mode is required (ONLINE, OFFLINE or HYBRID)");
        }
        HackathonMode mode = HackathonMode.valueOf(modeText.toUpperCase(Locale.ROOT));
        return new HackathonRequest(name, text(cells, columnOf, "domain"), text(cells, columnOf, "organizer"),
                text(cells, columnOf, "location"), mode, text(cells, columnOf, "description"),
                text(cells, columnOf, "eligibility"), date(cells, columnOf, "startdate"),
                date(cells, columnOf, "enddate"), date(cells, columnOf, "registrationdeadline"),
                number(cells, columnOf, "minteamsize"), number(cells, columnOf, "maxteamsize"),
                text(cells, columnOf, "registrationurl"));
    }

    private static String text(List<String> cells, Map<String, Integer> columnOf, String column) {
        Integer index = columnOf.get(column);
        if (index == null || index >= cells.size()) {
            return null;
        }
        String value = cells.get(index).trim();
        return value.isEmpty() ? null : value;
    }

    private static LocalDate date(List<String> cells, Map<String, Integer> columnOf, String column) {
        String value = text(cells, columnOf, column);
        return value == null ? null : LocalDate.parse(value);
    }

    private static Integer number(List<String> cells, Map<String, Integer> columnOf, String column) {
        String value = text(cells, columnOf, column);
        return value == null ? null : Integer.valueOf(value);
    }

    private static String stripBom(String line) {
        return line.startsWith("\uFEFF") ? line.substring(1) : line;
    }
}
