import React, { useEffect, useState } from 'react';
import { useMockData } from '@/store/MockDataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckCircle, Plus, MessageSquare, Presentation, Star, Trash2, User2 } from 'lucide-react';
import { Skill, SkillLevel, SkillType } from '@/types';
import { cn } from '@/lib/utils';

export function ProfilePage({ viewUserId }: { viewUserId?: string }) {
  const { users, currentUser, updateCurrentProfile, addSkill, removeSkill, endorseSkill, error } = useMockData();
  const isViewingOther = !!viewUserId && viewUserId !== currentUser?.id;
  const targetUser = isViewingOther ? users.find(u => u.id === viewUserId) : currentUser;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Local edit state
  const [editName, setEditName] = useState(targetUser?.name || '');
  const [editAvatar, setEditAvatar] = useState(targetUser?.avatar || '');
  const [editTitle, setEditTitle] = useState(targetUser?.title || '');
  const [editDepartment, setEditDepartment] = useState(targetUser?.department || '');
  const [editProjects, setEditProjects] = useState(targetUser?.experience.projects || '');
  const [editSpeaking, setEditSpeaking] = useState(targetUser?.experience.speaking || '');
  const [editMentoring, setEditMentoring] = useState(targetUser?.experience.mentoring || '');
  const [editReadiness, setEditReadiness] = useState(targetUser?.readiness || { speaker: false, mentor: false, jury: false });
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillType, setNewSkillType] = useState<SkillType>('профессиональный');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('базовый');

  useEffect(() => {
    if (!targetUser) {
      return;
    }
    setEditName(targetUser.name);
    setEditAvatar(targetUser.avatar);
    setEditTitle(targetUser.title);
    setEditDepartment(targetUser.department);
    setEditProjects(targetUser.experience.projects);
    setEditSpeaking(targetUser.experience.speaking);
    setEditMentoring(targetUser.experience.mentoring);
    setEditReadiness(targetUser.readiness);
  }, [targetUser?.id]);
  
  if (!targetUser) return <div className="p-8">Пользователь не найден</div>;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateCurrentProfile({
        name: editName,
        avatar: editAvatar,
        title: editTitle,
        department: editDepartment,
        experience: {
          projects: editProjects,
          speaking: editSpeaking,
          mentoring: editMentoring,
        },
        readiness: editReadiness,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkillName.trim()) return;
    await addSkill({
      name: newSkillName.trim(),
      type: newSkillType,
      level: newSkillLevel,
    });
    setNewSkillName('');
    setNewSkillType('профессиональный');
    setNewSkillLevel('базовый');
  };

  const handleDeleteSkill = async (skillId: string) => {
    await removeSkill(skillId);
  };

  const hasEndorsed = (skill: Skill) => currentUser && skill.endorsements.includes(currentUser.id);

  const toggleReadiness = (key: 'speaker' | 'mentor' | 'jury') => {
    setEditReadiness(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <img src={targetUser.avatar} alt={targetUser.name} className="w-24 h-24 rounded-full border-4 border-surface shadow-md" />
          <div>
            <h1 className="text-3xl font-semibold italic text-text">{targetUser.name}</h1>
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
          <Button variant={isEditing ? 'outline' : 'default'} disabled={isSaving} onClick={() => isEditing ? void handleSave() : setIsEditing(true)}>
            {isEditing ? 'СОХРАНИТЬ' : 'РЕДАКТИРОВАТЬ'}
          </Button>
        )}
      </div>

      {!isViewingOther && isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Имя и фамилия" />
              <Input value={editAvatar} onChange={(e) => setEditAvatar(e.target.value)} placeholder="Ссылка на аватар" />
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Должность" />
              <Input value={editDepartment} onChange={(e) => setEditDepartment(e.target.value)} placeholder="Подразделение" />
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="rounded-sm border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

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
                  <label className="text-[11px] uppercase tracking-widest text-text-muted">Участие в проектах</label>
                  <textarea 
                    className="w-full rounded-sm border border-border bg-background text-text p-3 min-h-[120px] text-sm focus:ring-2 focus:ring-accent focus:outline-none transition-colors"
                    value={editProjects}
                    onChange={e => setEditProjects(e.target.value)}
                    placeholder="Опишите ваши проекты, задачи, опыт..."
                  />
                  <label className="text-[11px] uppercase tracking-widest text-text-muted">Опыт выступлений</label>
                  <textarea 
                    className="w-full rounded-sm border border-border bg-background text-text p-3 min-h-[100px] text-sm focus:ring-2 focus:ring-accent focus:outline-none transition-colors"
                    value={editSpeaking}
                    onChange={e => setEditSpeaking(e.target.value)}
                    placeholder="Доклады, митапы, конференции..."
                  />
                  <label className="text-[11px] uppercase tracking-widest text-text-muted">Опыт обучения и менторства</label>
                  <textarea 
                    className="w-full rounded-sm border border-border bg-background text-text p-3 min-h-[100px] text-sm focus:ring-2 focus:ring-accent focus:outline-none transition-colors"
                    value={editMentoring}
                    onChange={e => setEditMentoring(e.target.value)}
                    placeholder="Курсы, наставничество, внутреннее обучение..."
                  />
                </div>
              ) : (
                <div className="space-y-4 text-sm leading-relaxed">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-text-muted mb-1">Проекты</p>
                    <p className="text-text whitespace-pre-wrap">{targetUser.experience.projects || 'Не заполнено'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-text-muted mb-1">Выступления</p>
                    <p className="text-text whitespace-pre-wrap">{targetUser.experience.speaking || 'Не заполнено'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-text-muted mb-1">Менторство</p>
                    <p className="text-text whitespace-pre-wrap">{targetUser.experience.mentoring || 'Не заполнено'}</p>
                  </div>
                </div>
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
                    <h4 className="text-[11px] font-semibold tracking-[1px] uppercase text-text-muted mb-3">{type}</h4>
                    <div className="flex flex-wrap gap-2">
                      {filtered.map(skill => (
                        <div key={skill.id} className="flex items-center gap-2 border border-border rounded-[100px] pl-3 pr-1 py-1 bg-background cursor-default group hover:border-accent transition-colors">
                          <span className="text-[12px] font-medium text-text">{skill.name}</span>
                          <span className="text-[10px] text-text-muted px-1">{skill.level}</span>
                          {isEditing && !isViewingOther && (
                            <button
                              className="flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-surface text-text-muted hover:bg-red-500/10 hover:text-red-300 transition-colors"
                              onClick={() => void handleDeleteSkill(skill.id)}
                              title="Удалить навык"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
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
                    className="h-10 rounded-sm border border-border text-text text-sm px-3 focus:outline-none focus:ring-2 focus:ring-accent bg-background"
                    value={newSkillType}
                    onChange={(e) => setNewSkillType(e.target.value as SkillType)}
                  >
                    <option value="профессиональный">Профессиональный</option>
                    <option value="экспертный">Экспертный</option>
                  </select>
                  <select 
                    className="h-10 rounded-sm border border-border text-text text-sm px-3 focus:outline-none focus:ring-2 focus:ring-accent bg-background"
                    value={newSkillLevel}
                    onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)}
                  >
                    <option value="базовый">Базовый</option>
                    <option value="уверенный">Уверенный</option>
                    <option value="эксперт">Эксперт</option>
                  </select>
                  <Button variant="outline" size="icon" onClick={() => void handleAddSkill()}>
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
                    <Badge variant={(isEditing ? editReadiness.speaker : targetUser.readiness.speaker) ? "secondary" : "outline"} className={isEditing ? 'cursor-pointer' : ''} onClick={() => isEditing && toggleReadiness('speaker')}>
                    {(isEditing ? editReadiness.speaker : targetUser.readiness.speaker) ? 'Да' : 'Нет'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-text"><MessageSquare className="w-4 h-4 text-accent" /> Быть ментором</div>
                  <Badge variant={(isEditing ? editReadiness.mentor : targetUser.readiness.mentor) ? "secondary" : "outline"} className={isEditing ? 'cursor-pointer' : ''} onClick={() => isEditing && toggleReadiness('mentor')}>
                     {(isEditing ? editReadiness.mentor : targetUser.readiness.mentor) ? 'Да' : 'Нет'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-text"><User2 className="w-4 h-4 text-accent" /> Участие в жюри</div>
                  <Badge variant={(isEditing ? editReadiness.jury : targetUser.readiness.jury) ? "secondary" : "outline"} className={isEditing ? 'cursor-pointer' : ''} onClick={() => isEditing && toggleReadiness('jury')}>
                     {(isEditing ? editReadiness.jury : targetUser.readiness.jury) ? 'Да' : 'Нет'}
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
