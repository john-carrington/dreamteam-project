export type SkillLevel = 'базовый' | 'уверенный' | 'эксперт';
export type SkillType = 'профессиональный' | 'экспертный';

export interface Skill {
  id: string;
  name: string;
  type: SkillType;
  level: SkillLevel;
  endorsements: string[]; // userIds
}

export interface Readiness {
  speaker: boolean;
  mentor: boolean;
  jury: boolean;
}

export interface Experience {
  projects: string;
  speaking: string;
  mentoring: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  title: string;
  department: string;
  skills: Skill[];
  experience: Experience;
  readiness: Readiness;
  badges: string[];
}

export interface AppState {
  users: User[];
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  setCurrentUser: (user: User | null) => void;
  refreshData: () => Promise<void>;
  updateCurrentProfile: (payload: {
    name?: string;
    avatar?: string;
    title?: string;
    department?: string;
    experience?: Experience;
    readiness?: Readiness;
  }) => Promise<void>;
  addSkill: (payload: {
    name: string;
    type: SkillType;
    level: SkillLevel;
  }) => Promise<void>;
  updateSkill: (
    skillId: string,
    payload: Partial<{
      name: string;
      type: SkillType;
      level: SkillLevel;
    }>
  ) => Promise<void>;
  removeSkill: (skillId: string) => Promise<void>;
  endorseSkill: (targetUserId: string, skillId: string) => void;
  searchExperts: (params: {
    query?: string;
    skill?: string;
    level?: SkillLevel;
    activityType?: 'speaker' | 'mentor' | 'jury';
    readyOnly?: boolean;
    sortBy?: 'endorsements' | 'relevance';
  }) => Promise<User[]>;
  inviteCandidate: (payload: {
    candidateUserId: string;
    activityType: 'speaker' | 'mentor' | 'jury';
    queryText?: string;
    message?: string;
  }) => Promise<void>;
}
