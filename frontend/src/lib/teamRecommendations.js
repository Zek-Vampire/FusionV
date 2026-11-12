/** Scores open teams by overlap with the signed-in student's skills and interests. */
export function recommendTeams(teams, me) {
  const userSkills = (me?.skills || []).map((skill) => String(skill).toLowerCase());
  const interests = (me?.interests || []).map((interest) => String(interest).toLowerCase());
  if (!userSkills.length && !interests.length) return [];

  return (teams || [])
    .filter(
      (team) =>
        team &&
        team.myStatus === 'NONE' &&
        (team.memberCount || 0) < (team.maxMembers || 0),
    )
    .map((team) => {
      const teamSkills = team.skills || [];
      const matchedSkills = teamSkills.filter((skill) =>
        userSkills.includes(String(skill).toLowerCase()),
      );
      const matchedInterests = teamSkills.filter(
        (skill) =>
          interests.includes(String(skill).toLowerCase()) &&
          !matchedSkills.includes(skill),
      );
      const score = matchedSkills.length * 3 + matchedInterests.length * 2;
      const reasons = [];
      if (matchedSkills.length) reasons.push(`Needs ${matchedSkills.slice(0, 2).join(', ')}`);
      if (matchedInterests.length) {
        reasons.push(`Matches your interest in ${matchedInterests.slice(0, 2).join(', ')}`);
      }
      return { team, score, matchedSkills, reasons };
    })
    .filter((match) => match.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || String(a.team.name).localeCompare(String(b.team.name)),
    )
    .slice(0, 3);
}
