import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState, User } from '../types';
import {
  createInvitationApi,
  createMySkill,
  deleteMySkill,
  endorseSkillApi,
  fetchExpertUsers,
  fetchMyExpertProfile,
  patchMySkill,
  removeEndorsementApi,
  searchExpertsApi,
  updateMyExpertProfile,
} from '@/services/expertiseService';

const MockDataContext = createContext<AppState | undefined>(undefined);

export function MockDataProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upsertUser = useCallback((updatedUser: User) => {
    setUsers((prev) => {
      const exists = prev.some((user) => user.id === updatedUser.id);
      if (!exists) {
        return [updatedUser, ...prev];
      }
      return prev.map((user) => (user.id === updatedUser.id ? updatedUser : user));
    });
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allUsers, me] = await Promise.all([fetchExpertUsers(), fetchMyExpertProfile()]);
      setUsers(allUsers);
      setCurrentUser(me);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить данные.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const updateCurrentProfile: AppState['updateCurrentProfile'] = async (payload) => {
    setError(null);
    const updated = await updateMyExpertProfile(payload);
    setCurrentUser(updated);
    upsertUser(updated);
  };

  const addSkill: AppState['addSkill'] = async (payload) => {
    setError(null);
    const updated = await createMySkill(payload);
    setCurrentUser(updated);
    upsertUser(updated);
  };

  const updateSkill: AppState['updateSkill'] = async (skillId, payload) => {
    setError(null);
    const updated = await patchMySkill(skillId, payload);
    setCurrentUser(updated);
    upsertUser(updated);
  };

  const removeSkill: AppState['removeSkill'] = async (skillId) => {
    setError(null);
    await deleteMySkill(skillId);
    await refreshData();
  };

  const endorseSkill: AppState['endorseSkill'] = (targetUserId, skillId) => {
    if (!currentUser || currentUser.id === targetUserId) {
      return;
    }

    const targetUser = users.find((user) => user.id === targetUserId);
    const targetSkill = targetUser?.skills.find((skill) => skill.id === skillId);
    const hasEndorsed = Boolean(targetSkill?.endorsements.includes(currentUser.id));

    void (async () => {
      setError(null);
      try {
        if (hasEndorsed) {
          await removeEndorsementApi(skillId);
        } else {
          await endorseSkillApi(skillId);
        }
        await refreshData();
      } catch (endorseError) {
        setError(endorseError instanceof Error ? endorseError.message : 'Не удалось обновить подтверждение.');
      }
    })();
  };

  const searchExperts: AppState['searchExperts'] = async (params) => {
    const usersResult = await searchExpertsApi(params);
    return usersResult;
  };

  const inviteCandidate: AppState['inviteCandidate'] = async (payload) => {
    await createInvitationApi(payload);
  };

  return (
    <MockDataContext.Provider
      value={{
        users,
        currentUser,
        loading,
        error,
        setCurrentUser,
        refreshData,
        updateCurrentProfile,
        addSkill,
        updateSkill,
        removeSkill,
        endorseSkill,
        searchExperts,
        inviteCandidate,
      }}
    >
      {children}
    </MockDataContext.Provider>
  );
}

export function useMockData() {
  const context = useContext(MockDataContext);
  if (context === undefined) {
    throw new Error('useMockData must be used within a MockDataProvider');
  }
  return context;
}
