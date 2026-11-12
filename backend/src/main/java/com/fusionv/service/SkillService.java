package com.fusionv.service;

import com.fusionv.exception.BadRequestException;
import com.fusionv.model.Skill;
import com.fusionv.repository.SkillRepository;
import com.fusionv.util.ValidationUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** Finds skills by name and creates them when they do not exist yet. */
@Service
public class SkillService {

    private final SkillRepository skillRepository;

    public SkillService(SkillRepository skillRepository) {
        this.skillRepository = skillRepository;
    }

    @Transactional
    public Skill findOrCreate(String rawName) {
        String name = rawName.trim().replaceAll("\\s+", " ");
        if (!ValidationUtil.isValidSkillName(name)) {
            throw new BadRequestException("Invalid name '" + name + "'. Use letters, digits and + # . / - only (max 50).");
        }
        return skillRepository.findByNameIgnoreCase(name).orElseGet(() -> skillRepository.save(new Skill(name)));
    }

    @Transactional
    public Set<Skill> findOrCreateAll(List<String> names) {
        Set<Skill> skills = new HashSet<>();
        for (String name : ValidationUtil.cleanNames(names)) {
            skills.add(findOrCreate(name));
        }
        return skills;
    }

    @Transactional(readOnly = true)
    public List<String> listAllNames() {
        return skillRepository.findAllByOrderByNameAsc().stream().map(Skill::getName).toList();
    }
}
