package com.fusionv.util;

import com.fusionv.dto.HackathonRequest;
import com.fusionv.exception.BadRequestException;
import com.fusionv.model.HackathonMode;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class HackathonCsvParserTest {

    private static final String HEADER = "name,domain,mode,startDate,maxTeamSize,description\n";

    @Test
    void parsesRowsAndQuotedCommas() {
        String csv = HEADER + "\"Demo Event, Edition 1\",Web,online,2027-01-20,4,\"Build, test, ship\"\n";
        List<HackathonRequest> rows = HackathonCsvParser.parse(csv);
        assertEquals(1, rows.size());
        HackathonRequest row = rows.get(0);
        assertEquals("Demo Event, Edition 1", row.name());
        assertEquals(HackathonMode.ONLINE, row.mode());
        assertEquals(LocalDate.of(2027, 1, 20), row.startDate());
        assertEquals(4, row.maxTeamSize());
        assertEquals("Build, test, ship", row.description());
        assertNull(row.location());
    }

    @Test
    void skipsBlankLines() {
        assertEquals(1, HackathonCsvParser.parse(HEADER + "\nDemo,Web,OFFLINE,,,\n\n").size());
    }

    @Test
    void headerMustContainNameAndMode() {
        assertThrows(BadRequestException.class, () -> HackathonCsvParser.parse("title,domain\nx,y\n"));
    }

    @Test
    void invalidDateReportsLineNumber() {
        BadRequestException e = assertThrows(BadRequestException.class,
                () -> HackathonCsvParser.parse(HEADER + "Demo,Web,ONLINE,not-a-date,,\n"));
        assertTrue(e.getMessage().contains("line 2"));
    }

    @Test
    void invalidModeIsRejected() {
        assertThrows(BadRequestException.class, () -> HackathonCsvParser.parse(HEADER + "Demo,Web,MOON,,,\n"));
    }
}
