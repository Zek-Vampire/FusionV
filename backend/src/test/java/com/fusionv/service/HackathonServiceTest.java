package com.fusionv.service;

import com.fusionv.dto.HackathonRequest;
import com.fusionv.dto.HackathonResponse;
import com.fusionv.dto.ImportResult;
import com.fusionv.exception.BadRequestException;
import com.fusionv.exception.ResourceNotFoundException;
import com.fusionv.model.Hackathon;
import com.fusionv.model.HackathonMode;
import com.fusionv.repository.HackathonRepository;
import com.fusionv.repository.TeamRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class HackathonServiceTest {

    @Mock HackathonRepository hackathonRepository;
    @Mock TeamRepository teamRepository;
    HackathonService service;

    @BeforeEach
    void setUp() {
        service = new HackathonService(hackathonRepository, teamRepository, List.of());
        when(hackathonRepository.save(any(Hackathon.class))).thenAnswer(call -> call.getArgument(0));
    }

    private HackathonRequest request(String name, LocalDate start, LocalDate end, Integer min, Integer max, String url) {
        return new HackathonRequest(name, "Web", "Org", "Mumbai", HackathonMode.OFFLINE, null, null, start, end, null, min, max, url);
    }

    @Test
    void createStoresHackathon() {
        HackathonResponse response = service.create(request("[DEMO] Event", LocalDate.of(2027, 1, 1), LocalDate.of(2027, 1, 2), 2, 4, "https://example.com"));
        assertEquals("[DEMO] Event", response.name());
        assertEquals("OFFLINE", response.mode());
    }

    @Test
    void endDateBeforeStartDateIsRejected() {
        assertThrows(BadRequestException.class,
                () -> service.create(request("X", LocalDate.of(2027, 1, 5), LocalDate.of(2027, 1, 1), null, null, null)));
    }

    @Test
    void minTeamSizeBiggerThanMaxIsRejected() {
        assertThrows(BadRequestException.class, () -> service.create(request("X", null, null, 5, 2, null)));
    }

    @Test
    void unsafeRegistrationUrlIsRejected() {
        assertThrows(BadRequestException.class, () -> service.create(request("X", null, null, null, null, "javascript:alert(1)")));
    }

    @Test
    void importSkipsAlreadyKnownHackathons() {
        LocalDate start = LocalDate.of(2027, 1, 1);
        when(hackathonRepository.existsByNameIgnoreCaseAndStartDate("Known", start)).thenReturn(true);
        ImportResult result = service.importAll(List.of(request("Known", start, null, null, null, null), request("New", start, null, null, null, null)));
        assertEquals(1, result.created());
        assertEquals(1, result.skipped());
    }

    @Test
    void syncWithoutConfiguredSourceExplainsWhat() {
        assertThrows(BadRequestException.class, () -> service.syncAllSources());
    }

    @Test
    void deleteDetachesTeamsFirst() {
        Hackathon hackathon = new Hackathon("X", HackathonMode.ONLINE, java.time.LocalDateTime.now());
        when(hackathonRepository.findById(3L)).thenReturn(Optional.of(hackathon));
        service.delete(3L);
        verify(teamRepository).detachHackathon(3L);
        verify(hackathonRepository).delete(hackathon);
    }

    @Test
    void unknownHackathonGivesNotFound() {
        when(hackathonRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.getById(99L));
    }
}
