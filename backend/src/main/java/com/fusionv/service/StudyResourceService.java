package com.fusionv.service;

import com.fusionv.dto.FileDownload;
import com.fusionv.dto.ResourceUpdateRequest;
import com.fusionv.dto.StudyResourceResponse;
import com.fusionv.exception.BadRequestException;
import com.fusionv.exception.FileStorageException;
import com.fusionv.exception.NotAllowedException;
import com.fusionv.exception.ResourceNotFoundException;
import com.fusionv.exception.UserNotFoundException;
import com.fusionv.model.ResourceCategory;
import com.fusionv.model.StudyResource;
import com.fusionv.model.User;
import com.fusionv.repository.StudyResourceRepository;
import com.fusionv.repository.StudyResourceSpecs;
import com.fusionv.repository.UserRepository;
import com.fusionv.util.FileValidator;
import com.fusionv.util.ValidationUtil;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** Study materials: upload, search, public download, edit and delete. */
@Service
public class StudyResourceService {

    private final StudyResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public StudyResourceService(StudyResourceRepository resourceRepository, UserRepository userRepository,
                                FileStorageService fileStorageService) {
        this.resourceRepository = resourceRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
    }

    /**
     * Saves the file on disk, then its metadata in PostgreSQL. "rollbackFor" is needed because
     * FileStorageException is a CHECKED exception, and Spring only rolls back unchecked exceptions by default.
     */
    @Transactional(rollbackFor = FileStorageException.class)
    public StudyResourceResponse upload(Long userId, MultipartFile file, String title, String description,
                                        String subject, ResourceCategory category, String tags)
            throws FileStorageException {
        checkText(title, description, subject, tags);
        User uploader = userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
        String storedName = fileStorageService.storeResource(file);          // validates and saves the file
        try {
            StudyResource resource = new StudyResource(uploader, title.trim(), blankToNull(description),
                    blankToNull(subject), category, ValidationUtil.normalizeTags(tags),
                    FileValidator.cleanFileName(file.getOriginalFilename()), storedName,
                    file.getContentType(), file.getSize(), LocalDateTime.now());
            resource.setDownloadCount(0);
            return DtoMapper.toResourceResponse(resourceRepository.saveAndFlush(resource));
        } catch (RuntimeException e) {
            fileStorageService.deleteResourceQuietly(storedName);            // no orphan file if the database fails
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public List<StudyResourceResponse> search(String text, ResourceCategory category, String subject, String tag,
                                              Long uploaderId) {
        var spec = StudyResourceSpecs.filter(text, category, subject, tag, uploaderId);
        List<StudyResourceResponse> result = new ArrayList<>();
        for (StudyResource resource : resourceRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"))) {
            result.add(DtoMapper.toResourceResponse(resource));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public StudyResourceResponse getById(Long id) {
        return DtoMapper.toResourceResponse(load(id));
    }

    /** Public download: counts the download and returns the file. */
    @Transactional
    public FileDownload download(Long id) {
        StudyResource resource = load(id);
        FileDownload file = fileStorageService.loadResource(resource.getStoredFileName(),
                resource.getOriginalFileName(), resource.getContentType());
        resourceRepository.incrementDownloadCount(id);
        return file;
    }

    @Transactional
    public StudyResourceResponse update(Long userId, boolean isAdmin, Long id, ResourceUpdateRequest request) {
        StudyResource resource = load(id);
        requireOwnerOrAdmin(resource, userId, isAdmin);
        resource.setTitle(request.title().trim());
        resource.setDescription(blankToNull(request.description()));
        resource.setSubject(blankToNull(request.subject()));
        resource.setCategory(request.category());
        resource.setTags(ValidationUtil.normalizeTags(request.tags()));
        return DtoMapper.toResourceResponse(resource);
    }

    @Transactional
    public void delete(Long userId, boolean isAdmin, Long id) {
        StudyResource resource = load(id);
        requireOwnerOrAdmin(resource, userId, isAdmin);
        String storedName = resource.getStoredFileName();
        resourceRepository.delete(resource);
        fileStorageService.deleteResourceQuietly(storedName);
    }

    private StudyResource load(Long id) {
        return resourceRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Study material", id));
    }

    private void requireOwnerOrAdmin(StudyResource resource, Long userId, boolean isAdmin) {
        if (!isAdmin && !resource.getUploader().getId().equals(userId)) {
            throw new NotAllowedException("Only the uploader can change or delete this material");
        }
    }

    /** Same limits as the database columns, checked here so the user gets a clear message. */
    private void checkText(String title, String description, String subject, String tags) {
        if (title == null || title.isBlank() || title.trim().length() > 150) {
            throw new BadRequestException("Title is required (maximum 150 characters)");
        }
        if (description != null && description.length() > 1000) {
            throw new BadRequestException("Description is too long (maximum 1000 characters)");
        }
        if (subject != null && subject.length() > 100) {
            throw new BadRequestException("Subject is too long (maximum 100 characters)");
        }
        if (tags != null && tags.length() > 200) {
            throw new BadRequestException("Tags are too long (maximum 200 characters)");
        }
    }

    private String blankToNull(String text) {
        return (text == null || text.isBlank()) ? null : text.trim();
    }
}
