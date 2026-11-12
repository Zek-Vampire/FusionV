package com.fusionv.service;

import com.fusionv.dto.HackathonRequest;
import com.fusionv.dto.HackathonResponse;
import com.fusionv.dto.ImportResult;
import com.fusionv.exception.BadRequestException;
import com.fusionv.exception.ResourceNotFoundException;
import com.fusionv.model.Hackathon;
import com.fusionv.model.HackathonMode;
import com.fusionv.repository.HackathonRepository;
import com.fusionv.repository.HackathonSpecs;
import com.fusionv.repository.TeamRepository;
import com.fusionv.util.ValidationUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** Search, details, administrator CRUD and imports of hackathons. */
@Service
public class HackathonService {

    private static final Logger log = LoggerFactory.getLogger(HackathonService.class);

    private final HackathonRepository hackathonRepository;
    private final TeamRepository teamRepository;
    private final List<HackathonDataSource> dataSources;   // Spring injects every HackathonDataSource bean

    public HackathonService(HackathonRepository hackathonRepository, TeamRepository teamRepository,
                            List<HackathonDataSource> dataSources) {
        this.hackathonRepository = hackathonRepository;
        this.teamRepository = teamRepository;
        this.dataSources = dataSources;
    }

    @Transactional(readOnly = true)
    public List<HackathonResponse> search(String name, String domain, String location, HackathonMode mode,
                                          Integer minTeamSize, Integer maxTeamSize,
                                          LocalDate deadlineFrom, LocalDate deadlineTo) {
        var spec = HackathonSpecs.filter(name, domain, location, mode, minTeamSize, maxTeamSize, deadlineFrom, deadlineTo);
        Sort sort = Sort.by(Sort.Order.asc("registrationDeadline").nullsLast(), Sort.Order.asc("name"));
        List<HackathonResponse> result = new ArrayList<>();
        for (Hackathon hackathon : hackathonRepository.findAll(spec, sort)) {
            result.add(DtoMapper.toHackathonResponse(hackathon));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public HackathonResponse getById(Long id) {
        return DtoMapper.toHackathonResponse(load(id));
    }

    @Transactional
    public HackathonResponse create(HackathonRequest request) {
        validate(request);
        Hackathon hackathon = new Hackathon(request.name().trim(), request.mode(), LocalDateTime.now());
        copyFields(hackathon, request);
        return DtoMapper.toHackathonResponse(hackathonRepository.save(hackathon));
    }

    @Transactional
    public HackathonResponse update(Long id, HackathonRequest request) {
        validate(request);
        Hackathon hackathon = load(id);
        hackathon.setName(request.name().trim());
        hackathon.setMode(request.mode());
        copyFields(hackathon, request);
        return DtoMapper.toHackathonResponse(hackathon);
    }

    @Transactional
    public void delete(Long id) {
        Hackathon hackathon = load(id);
        teamRepository.detachHackathon(id);        // teams stay, they only lose the link
        hackathonRepository.delete(hackathon);
    }

    /** All-or-nothing import: if one row is invalid nothing is saved. Existing (name + start date) are skipped. */
    @Transactional
    public ImportResult importAll(List<HackathonRequest> requests) {
        int created = 0;
        int skipped = 0;
        for (HackathonRequest request : requests) {
            validate(request);
            if (hackathonRepository.existsByNameIgnoreCaseAndStartDate(request.name().trim(), request.startDate())) {
                skipped++;
                continue;
            }
            Hackathon hackathon = new Hackathon(request.name().trim(), request.mode(), LocalDateTime.now());
            copyFields(hackathon, request);
            hackathonRepository.save(hackathon);
            created++;
        }
        return new ImportResult(created, skipped);
    }

    /** Asks every configured data source (CSV file, future partner APIs) for hackathons and imports them. */
    @Transactional
    public ImportResult syncAllSources() {
        int created = 0;
        int skipped = 0;
        boolean anyConfigured = false;
        for (HackathonDataSource source : dataSources) {
            if (!source.isConfigured()) {
                continue;
            }
            anyConfigured = true;
            try {
                ImportResult result = importAll(source.fetchHackathons());
                created += result.created();
                skipped += result.skipped();
                log.info("Hackathon source '{}' imported {} new, {} already known", source.getSourceName(), result.created(), result.skipped());
            } catch (IOException e) {
                throw new BadRequestException("Could not read hackathon source '" + source.getSourceName() + "': " + e.getMessage());
            }
        }
        if (!anyConfigured) {
            throw new BadRequestException("No hackathon data source is configured (see HACKATHON_CSV_PATH in the README)");
        }
        return new ImportResult(created, skipped);
    }

    // ---------------------------------------------------------------- helpers

    private Hackathon load(Long id) {
        return hackathonRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Hackathon", id));
    }

    private void copyFields(Hackathon h, HackathonRequest r) {
        h.setDomain(blankToNull(r.domain()));
        h.setOrganizer(blankToNull(r.organizer()));
        h.setLocation(blankToNull(r.location()));
        h.setDescription(blankToNull(r.description()));
        h.setEligibility(blankToNull(r.eligibility()));
        h.setStartDate(r.startDate());
        h.setEndDate(r.endDate());
        h.setRegistrationDeadline(r.registrationDeadline());
        h.setMinTeamSize(r.minTeamSize());
        h.setMaxTeamSize(r.maxTeamSize());
        h.setRegistrationUrl(blankToNull(r.registrationUrl()));
    }

    private void validate(HackathonRequest r) {
        if (r.name() == null || r.name().isBlank()) {
            throw new BadRequestException("Hackathon name is required");
        }
        if (r.mode() == null) {
            throw new BadRequestException("Mode is required (ONLINE, OFFLINE or HYBRID)");
        }
        if (r.name().trim().length() > 200) {
            throw new BadRequestException("Hackathon name is too long (maximum 200 characters)");
        }
        if (r.startDate() != null && r.endDate() != null && r.endDate().isBefore(r.startDate())) {
            throw new BadRequestException("The end date cannot be before the start date");
        }
        if (r.minTeamSize() != null && r.maxTeamSize() != null && r.minTeamSize() > r.maxTeamSize()) {
            throw new BadRequestException("Minimum team size cannot be bigger than maximum team size");
        }
        if (r.registrationUrl() != null && !r.registrationUrl().isBlank() && !ValidationUtil.isValidUrl(r.registrationUrl())) {
            throw new BadRequestException("The registration URL must start with http:// or https://");
        }
    }

    private String blankToNull(String text) {
        return (text == null || text.isBlank()) ? null : text.trim();
    }
}
