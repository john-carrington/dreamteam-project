import React, { createContext, useContext, useState } from 'react';
import { User, AppState, Skill, SkillType, SkillLevel } from '../types';

// Mock Initial Data
const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Алина Медведева',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
    title: 'HR Business Partner',
    department: 'HR',
    skills: [],
    experience: { projects: '', speaking: '', mentoring: '' },
    readiness: { speaker: false, mentor: false, jury: false },
    badges: [],
  },
  {
    id: 'u2',
    name: 'Сергей Иванов',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    title: 'Senior Frontend Developer',
    department: 'Web Development',
    skills: [
      { id: 's1', name: 'React', type: 'профессиональный', level: 'эксперт', endorsements: ['u3', 'u4', 'u5'] },
      { id: 's2', name: 'UI/UX Design', type: 'профессиональный', level: 'уверенный', endorsements: ['u3'] },
      { id: 's3', name: 'Публичные выступления', type: 'экспертный', level: 'уверенный', endorsements: ['u4', 'u5'] }
    ],
    experience: { 
      projects: 'Разработка корпоративного портала, миграция легаси кода на React', 
      speaking: 'Выступал на Frontend Conf 2023 "Оптимизация React приложений"', 
      mentoring: 'Обучил 3 джуниоров до миддлов' 
    },
    readiness: { speaker: true, mentor: true, jury: false },
    badges: ['Спикер', 'Ментор'],
  },
  {
    id: 'u3',
    name: 'Елена Смирнова',
    avatar: 'https://i.pravatar.cc/150?u=a04258114e29026702d',
    title: 'UX Researcher',
    department: 'Product Design',
    skills: [
      { id: 's4', name: 'Usability Testing', type: 'профессиональный', level: 'эксперт', endorsements: ['u2', 'u4', 'u5', 'u6'] },
      { id: 's5', name: 'JTBD', type: 'профессиональный', level: 'уверенный', endorsements: ['u4'] },
      { id: 's6', name: 'Менторство', type: 'экспертный', level: 'эксперт', endorsements: ['u2', 'u5'] }
    ],
    experience: { 
      projects: 'Исследования для новых продуктов B2B', 
      speaking: '', 
      mentoring: 'Внутренний курс для продактов по основам исследований' 
    },
    readiness: { speaker: false, mentor: true, jury: true },
    badges: ['Эксперт', 'Ментор'],
  },
  {
    id: 'u4',
    name: 'Алексей Петров',
    avatar: 'https://i.pravatar.cc/150?u=a048581f4e29026701d',
    title: 'Lead Java Developer',
    department: 'Backend',
    skills: [
      { id: 's7', name: 'Java', type: 'профессиональный', level: 'эксперт', endorsements: ['u2', 'u3', 'u5', 'u6', 'u1'] },
      { id: 's8', name: 'Spring Boot', type: 'профессиональный', level: 'эксперт', endorsements: ['u2', 'u5'] },
      { id: 's9', name: 'Архитектура высоких нагрузок', type: 'профессиональный', level: 'уверенный', endorsements: [] },
      { id: 's10', name: 'Оценка проектов (Жюри)', type: 'экспертный', level: 'эксперт', endorsements: ['u1', 'u3'] }
    ],
    experience: { 
      projects: 'Ядро биллинга, интеграция с платежными системами', 
      speaking: 'JUG.ru митапы: внутреннее устройство JVM', 
      mentoring: '' 
    },
    readiness: { speaker: true, mentor: false, jury: true },
    badges: ['Спикер', 'Эксперт'],
  }
];

const MockDataContext = createContext<AppState | undefined>(undefined);

export function MockDataProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  // Default logged in as HR for testing
  const [currentUser, setCurrentUser] = useState<User | null>(MOCK_USERS[0]);

  const updateUser = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const endorseSkill = (targetUserId: string, skillId: string) => {
    if (!currentUser) return;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === targetUserId) {
          return {
            ...u,
            skills: u.skills.map((s) => {
              if (s.id === skillId) {
                // Toggle endorsement
                if (s.endorsements.includes(currentUser.id)) {
                  return { ...s, endorsements: s.endorsements.filter((id) => id !== currentUser.id) };
                } else {
                  return { ...s, endorsements: [...s.endorsements, currentUser.id] };
                }
              }
              return s;
            }),
          };
        }
        return u;
      })
    );
  };

  return (
    <MockDataContext.Provider value={{ users, currentUser, setCurrentUser, updateUser, endorseSkill }}>
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
