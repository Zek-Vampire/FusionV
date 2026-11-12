import { useCallback, useEffect, useState } from 'react';
import {
  clearSavedTeams,
  readSavedTeamIds,
  removeLegacySavedTeams,
  toggleSavedTeam,
} from '@/lib/savedTeams';

/**
 * Saved teams intentionally live in this browser only. The backend has no
 * bookmark table or endpoint, so this hook never pretends they are synced.
 */
export function useSavedTeams(userId) {
  const [ids, setIds] = useState(() => readSavedTeamIds(userId));

  useEffect(() => {
    removeLegacySavedTeams();
    setIds(readSavedTeamIds(userId));
  }, [userId]);

  useEffect(() => {
    function sync() {
      setIds(readSavedTeamIds(userId));
    }
    window.addEventListener('storage', sync);
    window.addEventListener('fusionv:saved-teams', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('fusionv:saved-teams', sync);
    };
  }, [userId]);

  const toggle = useCallback(
    (teamId) => {
      const saved = toggleSavedTeam(userId, teamId);
      setIds(readSavedTeamIds(userId));
      window.dispatchEvent(new Event('fusionv:saved-teams'));
      return saved;
    },
    [userId],
  );

  const clear = useCallback(() => {
    clearSavedTeams(userId);
    setIds([]);
    window.dispatchEvent(new Event('fusionv:saved-teams'));
  }, [userId]);

  return {
    ids,
    has: (teamId) => ids.includes(Number(teamId)),
    toggle,
    clear,
  };
}
