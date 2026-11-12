package com.fusionv.controller;

import com.fusionv.dto.ResourceUpdateRequest;
import com.fusionv.dto.StudyResourceResponse;
import com.fusionv.exception.FileStorageException;
import com.fusionv.model.ResourceCategory;
import com.fusionv.security.UserPrincipal;
import com.fusionv.service.StudyResourceService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

import java.util.List;

/** Searching and downloading is public; uploading, editing and deleting needs a login. */
@RestController
@RequestMapping("/api/v1/resources")
public class ResourceController {

    private final StudyResourceService resourceService;

    public ResourceController(StudyResourceService resourceService) {
        this.resourceService = resourceService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<StudyResourceResponse> upload(
            @AuthenticationPrincipal UserPrincipal me,
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "subject", required = false) String subject,
            @RequestParam(value = "category", defaultValue = "NOTES") ResourceCategory category,
            @RequestParam(value = "tags", required = false) String tags) throws FileStorageException {
        StudyResourceResponse created = resourceService.upload(me.getId(), file, title, description, subject, category, tags);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public List<StudyResourceResponse> search(@RequestParam(required = false) String q,
                                              @RequestParam(required = false) ResourceCategory category,
                                              @RequestParam(required = false) String subject,
                                              @RequestParam(required = false) String tag) {
        return resourceService.search(q, category, subject, tag, null);
    }

    @GetMapping("/mine")
    public List<StudyResourceResponse> mine(@AuthenticationPrincipal UserPrincipal me) {
        return resourceService.search(null, null, null, null, me.getId());
    }

    @GetMapping("/{id}")
    public StudyResourceResponse getById(@PathVariable Long id) {
        return resourceService.getById(id);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        return DownloadResponses.asAttachment(resourceService.download(id));
    }

    @PutMapping("/{id}")
    public StudyResourceResponse update(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long id,
                                        @Valid @RequestBody ResourceUpdateRequest request) {
        return resourceService.update(me.getId(), me.isAdmin(), id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long id) {
        resourceService.delete(me.getId(), me.isAdmin(), id);
        return ResponseEntity.noContent().build();
    }
}
