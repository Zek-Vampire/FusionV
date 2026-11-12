-- =====================================================================
-- DEMONSTRATION DATA ONLY (clearly fake, for screenshots and testing).
-- These are NOT real hackathons and the dates are placeholders.
-- Run after schema.sql:   psql -U postgres -d fusionv -f database/demo-data.sql
-- =====================================================================
INSERT INTO hackathons (name, domain, organizer, location, mode, description, eligibility,
                        start_date, end_date, registration_deadline, min_team_size, max_team_size, registration_url)
VALUES
 ('[DEMO] Sample Campus Hackathon', 'Web Development', 'Demo Organizer', 'Mumbai', 'OFFLINE',
  'Placeholder entry for testing the hackathon search.', 'Engineering students (demo)',
  DATE '2027-01-20', DATE '2027-01-21', DATE '2027-01-10', 2, 4, 'https://example.com/demo-hackathon-1'),
 ('[DEMO] Sample Online AI Sprint', 'AI/ML', 'Demo Organizer', 'Online', 'ONLINE',
  'Placeholder entry for testing filters by mode and domain.', 'Open to all students (demo)',
  DATE '2027-02-05', DATE '2027-02-07', DATE '2027-01-30', 1, 5, 'https://example.com/demo-hackathon-2'),
 ('[DEMO] Sample Hybrid Build Weekend', 'Cloud Computing', 'Demo Organizer', 'Pune', 'HYBRID',
  'Placeholder entry for testing team-size filters.', 'Second year and above (demo)',
  DATE '2027-03-12', DATE '2027-03-14', DATE '2027-03-01', 3, 6, 'https://example.com/demo-hackathon-3');

INSERT INTO skills (name) VALUES ('Java'), ('Spring Boot'), ('Python'), ('Web Development'), ('AI/ML'), ('UI/UX Design')
ON CONFLICT DO NOTHING;
