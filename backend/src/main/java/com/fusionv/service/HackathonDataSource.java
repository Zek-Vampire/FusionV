package com.fusionv.service;

import com.fusionv.dto.HackathonRequest;

import java.io.IOException;
import java.util.List;

/**
 * Module 3: interface. Anything that can deliver hackathons (a CSV file today, an authorized partner API
 * tomorrow) implements it. HackathonImportService calls every configured source, so adding a new source
 * means writing one new class, without touching the rest of the application.
 */
public interface HackathonDataSource {

    /** Short name shown in logs/errors. */
    String getSourceName();

    /** False when the administrator has not configured this source. */
    boolean isConfigured();

    /** Reads the hackathons. Throws IOException when the source cannot be read. */
    List<HackathonRequest> fetchHackathons() throws IOException;
}
