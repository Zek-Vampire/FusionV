package com.fusionv.controller;

import com.fusionv.dto.HackathonRequest;
import com.fusionv.dto.HackathonResponse;
import com.fusionv.dto.ImportResult;
import com.fusionv.exception.BadRequestException;
import com.fusionv.model.HackathonMode;
import com.fusionv.service.HackathonService;
import com.fusionv.util.HackathonCsvParser;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

/** Reading is public. Creating, changing, deleting and importing needs the ADMIN role. */
@RestController
@RequestMapping("/api/v1/hackathons")
public class HackathonController {

    private final HackathonService hackathonService;

    public HackathonController(HackathonService hackathonService) {
        this.hackathonService = hackathonService;
    }

    @GetMapping
    public List<HackathonResponse> search(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String domain,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) HackathonMode mode,
            @RequestParam(required = false) Integer minTeamSize,
            @RequestParam(required = false) Integer maxTeamSize,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate deadlineFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate deadlineTo) {
        return hackathonService.search(name, domain, location, mode, minTeamSize, maxTeamSize, deadlineFrom, deadlineTo);
    }

    @GetMapping("/{id}")
    public HackathonResponse getById(@PathVariable Long id) {
        return hackathonService.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HackathonResponse> create(@Valid @RequestBody HackathonRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(hackathonService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public HackathonResponse update(@PathVariable Long id, @Valid @RequestBody HackathonRequest request) {
        return hackathonService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        hackathonService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** JSON import: body is a list of hackathons. */
    @PostMapping("/import")
    @PreAuthorize("hasRole('ADMIN')")
    public ImportResult importJson(@RequestBody List<HackathonRequest> requests) {
        return hackathonService.importAll(requests);
    }

    /** CSV import: multipart field "file". */
    @PostMapping(value = "/import/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ImportResult importCsv(@RequestParam("file") MultipartFile file) {
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        if (!name.endsWith(".csv")) {
            throw new BadRequestException("Please upload a .csv file");
        }
        try {
            String text = new String(file.getBytes(), StandardCharsets.UTF_8);
            return hackathonService.importAll(HackathonCsvParser.parse(text));
        } catch (IOException e) {
            throw new BadRequestException("Could not read the uploaded CSV file");
        }
    }

    /** Reads every configured data source (for example the CSV file set in HACKATHON_CSV_PATH). */
    @PostMapping("/sync")
    @PreAuthorize("hasRole('ADMIN')")
    public ImportResult sync() {
        return hackathonService.syncAllSources();
    }
}
