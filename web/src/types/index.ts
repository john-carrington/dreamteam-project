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
  setCurrentUser: (user: User | null) => void;
  updateUser: (user: User) => void;
  endorseSkill: (targetUserId: string, skillId: string) => void;
}
