import React, { useState } from 'react';
import { useMockData } from '@/store/MockDataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckCircle, Plus, MessageSquare, Presentation, Star, User2 } from 'lucide-react';
import { Skill, SkillLevel } from '@/types';
import { cn } from '@/lib/utils';

export function ProfilePage({ viewUserId }: { viewUserId?: string }) {
  const { users, currentUser, updateUser, endorseSkill } = useMockData();
  const isViewingOther = !!viewUserId && viewUserId !== currentUser?.id;
  const targetUser = isViewingOther ? users.find(u => u.id === viewUserId) : currentUser;

  const [isEditing, setIsEditing] = useState(false);
  
  // Local edit state
  const [editExperience, setEditExperience] = useState(targetUser?.experience.projects || '');
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('базовый');
  
  if (!targetUser) return <div className="p-8">Пользователь не найден</div>;

  const handleSave = () => {
    updateUser({
      ...targetUser,
      experience: { ...targetUser.experience, projects: editExperience }
    });
    setIsEditing(false);
  };

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    const skill: Skill = {
      id: Math.random().toString(36).substr(2, 9),
      name: newSkillName.trim(),
      type: 'профессиональный',
      level: newSkillLevel,
      endorsements: []
    };
    updateUser({ ...targetUser, skills: [...targetUser.skills, skill] });
    setNewSkillName('');
  };

  const hasEndorsed = (skill: Skill) => currentUser && skill.endorsements.includes(currentUser.id);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <img src={targetUser.avatar} alt={targetUser.name} className="w-24 h-24 rounded-full border-4 border-surface shadow-md" />
          <div>
            <h1 className="text-3xl font-[Georgia] italic text-text">{targetUser.name}</h1>
            <p className="text-text-muted text-sm mt-1">{targetUser.title} • {targetUser.department}</p>
            <div className="flex gap-2 mt-3">
              {targetUser.badges.map(b => (
                <Badge key={b} variant="default" className="bg-surface-light border border-border text-text-muted hover:bg-surface">
                  <Star className="w-3 h-3 mr-1 text-accent" /> {b}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        {!isViewingOther && (
          <Button variant={isEditing ? 'outline' : 'default'} onClick={() => isEditing ? handleSave() : setIsEditing(true)}>
            {isEditing ? 'СОХРАНИТЬ' : 'РЕДАКТИРОВАТЬ'}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          {/* EXP */}
          <Card>
            <CardHeader>
              <CardTitle>Опыт и проекты</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <textarea 
                    className="w-full rounded-[4px] border border-border bg-background text-text p-3 min-h-[120px] text-sm focus:ring-2 focus:ring-accent focus:outline-none transition-colors"
                    value={editExperience}
                    onChange={e => setEditExperience(e.target.value)}
                    placeholder="Опишите ваши проекты, задачи, опыт..."
                  />
                </div>
              ) : (
                <p className="text-text text-sm whitespace-pre-wrap leading-relaxed">{targetUser.experience.projects || 'Опыт не заполнен'}</p>
              )}
            </CardContent>
          </Card>

          {/* SKILLS */}
          <Card>
            <CardHeader>
              <CardTitle>Навыки</CardTitle>
              <CardDescription>Профессиональная и экспертная компетенция</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {['профессиональный', 'экспертный'].map(type => {
                const filtered = targetUser.skills.filter(s => s.type === type);
                if (filtered.length === 0 && !isEditing) return null;

                return (
                  <div key={type}>
                    <h4 className="text-[11px] font-[600] tracking-[1px] uppercase text-text-muted mb-3">{type}</h4>
                    <div className="flex flex-wrap gap-2">
                      {filtered.map(skill => (
                        <div key={skill.id} className="flex items-center gap-2 border border-border rounded-[100px] pl-3 pr-1 py-1 bg-background cursor-default group hover:border-accent transition-colors">
                          <span className="text-[12px] font-medium text-text">{skill.name}</span>
                          <span className="text-[10px] text-text-muted px-1">{skill.level}</span>
                          <button 
                            className={cn(
                              "flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors",
                              hasEndorsed(skill) ? "bg-[rgba(39,174,96,0.15)] text-success" : "bg-surface text-text-muted hover:bg-surface-light hover:text-text",
                              !isViewingOther && "cursor-default pointer-events-none"
                            )}
                            onClick={() => isViewingOther && endorseSkill(targetUser.id, skill.id)}
                            title={isViewingOther ? "Подтвердить навык" : "Количество подтверждений"}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {skill.endorsements.length}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {isEditing && (
                <div className="flex items-center gap-3 pt-4 border-t border-border mt-4">
                  <Input 
                    placeholder="Новый навык..." 
                    value={newSkillName} 
                    onChange={e => setNewSkillName(e.target.value)} 
                    className="max-w-[200px]"
                  />
                  <select 
                    className="h-10 rounded-[4px] border border-border text-text text-sm px-3 focus:outline-none focus:ring-2 focus:ring-accent bg-background"
                    value={newSkillLevel}
                    onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)}
                  >
                    <option value="базовый">Базовый</option>
                    <option value="уверенный">Уверенный</option>
                    <option value="эксперт">Эксперт</option>
                  </select>
                  <Button variant="outline" size="icon" onClick={handleAddSkill}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* SIDEBAR: READINESS */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Готовность</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-text"><Presentation className="w-4 h-4 text-accent" /> Выступать (Спикер)</div>
                  <Badge variant={targetUser.readiness.speaker ? "secondary" : "outline"}>
                    {targetUser.readiness.speaker ? 'Да' : 'Нет'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-text"><MessageSquare className="w-4 h-4 text-accent" /> Быть ментором</div>
                  <Badge variant={targetUser.readiness.mentor ? "secondary" : "outline"}>
                     {targetUser.readiness.mentor ? 'Да' : 'Нет'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-text"><User2 className="w-4 h-4 text-accent" /> Участие в жюри</div>
                  <Badge variant={targetUser.readiness.jury ? "secondary" : "outline"}>
                     {targetUser.readiness.jury ? 'Да' : 'Нет'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
