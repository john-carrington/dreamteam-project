import React, { useEffect, useState } from 'react';
import { useMockData } from '@/store/MockDataContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, Filter, CheckCircle, Mail } from 'lucide-react';
import { SkillLevel, User } from '@/types';

export function SearchPage({ onUserClick }: { onUserClick: (id: string) => void }) {
  const { users, searchExperts, inviteCandidate, error } = useMockData();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<User[]>(users);
  const [levelFilter, setLevelFilter] = useState<SkillLevel | ''>('');
  const [sortBy, setSortBy] = useState<'relevance' | 'endorsements'>('relevance');
  const [activityFilter, setActivityFilter] = useState<'speaker' | 'mentor' | 'jury' | null>(null);
  const [inviteState, setInviteState] = useState<Record<string, 'idle' | 'sending' | 'sent' | 'error'>>({});

  useEffect(() => {
    let cancelled = false;

    const runSearch = async () => {
      setIsSearching(true);
      try {
        const data = await searchExperts({
          query,
          skill: query,
          level: levelFilter || undefined,
          activityType: activityFilter || undefined,
          readyOnly: true,
          sortBy,
        });
        if (!cancelled) {
          setResults(data);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    };

    void runSearch();

    return () => {
      cancelled = true;
    };
  }, [activityFilter, levelFilter, query, searchExperts, sortBy]);

  useEffect(() => {
    setResults(users);
  }, [users]);

  const toggleActivity = (activity: 'speaker' | 'mentor' | 'jury') => {
    setActivityFilter((prev) => (prev === activity ? null : activity));
  };

  const detectActivityType = (user: User): 'speaker' | 'mentor' | 'jury' => {
    if (activityFilter) {
      return activityFilter;
    }
    if (user.readiness.speaker) {
      return 'speaker';
    }
    if (user.readiness.mentor) {
      return 'mentor';
    }
    return 'jury';
  };

  const handleInvite = async (user: User) => {
    const activityType = detectActivityType(user);
    setInviteState((prev) => ({ ...prev, [user.id]: 'sending' }));

    try {
      await inviteCandidate({
        candidateUserId: user.id,
        activityType,
        queryText: query,
        message: query ? `Запрос HR: ${query}` : 'Приглашаем к участию',
      });
      setInviteState((prev) => ({ ...prev, [user.id]: 'sent' }));
    } catch {
      setInviteState((prev) => ({ ...prev, [user.id]: 'error' }));
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 pb-20">
      <div>
        <h2 className="text-3xl font-semibold italic text-text">Поиск экспертов</h2>
        <p className="text-text-muted text-sm mt-2">Найдите подходящих спикеров, менторов или жюри.</p>
      </div>

      <div className="bg-surface p-6 rounded-lg border border-border shadow-sm space-y-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
          <Input 
            className="pl-10 h-12 text-base shadow-none bg-background border-border text-text" 
            placeholder="Навык, имя или ключевое слово..." 
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-text-muted uppercase tracking-widest"><Filter className="w-3 h-3"/> Фильтры:</div>
          <Badge 
            variant={activityFilter === 'speaker' ? 'default' : 'outline'} 
            className="cursor-pointer px-4 py-1.5 transition-colors" 
            onClick={() => toggleActivity('speaker')}
          >Спикер</Badge>
          <Badge 
            variant={activityFilter === 'mentor' ? 'default' : 'outline'} 
            className="cursor-pointer px-4 py-1.5 transition-colors"
            onClick={() => toggleActivity('mentor')}
          >Ментор</Badge>
          <Badge 
            variant={activityFilter === 'jury' ? 'default' : 'outline'} 
            className="cursor-pointer px-4 py-1.5 transition-colors"
            onClick={() => toggleActivity('jury')}
          >Жюри</Badge>
          <select
            className="h-9 rounded-sm border border-border text-text text-xs px-3 focus:outline-none focus:ring-2 focus:ring-accent bg-background"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as SkillLevel | '')}
          >
            <option value="">Любой уровень</option>
            <option value="базовый">Базовый</option>
            <option value="уверенный">Уверенный</option>
            <option value="эксперт">Эксперт</option>
          </select>
          <select
            className="h-9 rounded-sm border border-border text-text text-xs px-3 focus:outline-none focus:ring-2 focus:ring-accent bg-background"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'relevance' | 'endorsements')}
          >
            <option value="relevance">Сортировка: релевантность</option>
            <option value="endorsements">Сортировка: подтверждения</option>
          </select>
        </div>
      </div>

      <div className="space-y-4 mt-8">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-widest">
          {isSearching ? 'Идёт поиск...' : `Найдено кандидатов: ${results.length}`}
        </p>
        {error && <p className="text-sm text-red-300">{error}</p>}
        
        {results.map((user: User) => (
          <Card key={user.id} className="overflow-hidden hover:border-accent transition-colors bg-surface border-border">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className="p-6 flex-1 cursor-pointer" onClick={() => onUserClick(user.id)}>
                  <div className="flex items-start gap-4">
                    <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full border border-border" />
                    <div>
                      <h3 className="text-lg font-semibold italic text-text">{user.name}</h3>
                      <p className="text-text-muted text-xs mt-1">{user.title} • {user.department}</p>
                      
                      <div className="flex flex-wrap gap-2 mt-4">
                        {user.skills.slice(0, 4).map((s) => (
                          <div key={s.id} className="flex flex-col bg-background border border-border rounded-sm px-2 py-1 text-[10px]">
                             <span className="font-semibold text-text">{s.name} <span className="text-text-muted font-normal">({s.level})</span></span>
                             <span className="flex items-center text-success mt-0.5"><CheckCircle className="w-3 h-3 mr-1"/> {s.endorsements.length} подтв.</span>
                          </div>
                        ))}
                        {user.skills.length > 4 && <div className="text-[10px] text-text-muted self-center">+{user.skills.length - 4} ещё</div>}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-surface-light p-6 md:w-64 border-l border-border flex flex-col justify-center">
                  <div className="space-y-3 mb-6 text-xs text-text-muted font-medium uppercase tracking-wider">
                    <div className="flex justify-between items-center"><span>Спикер</span> <CheckCircle className={user.readiness.speaker ? "text-success w-4 h-4" : "text-border w-4 h-4"} /></div>
                    <div className="flex justify-between items-center"><span>Ментор</span> <CheckCircle className={user.readiness.mentor ? "text-success w-4 h-4" : "text-border w-4 h-4"} /></div>
                    <div className="flex justify-between items-center"><span>Жюри</span> <CheckCircle className={user.readiness.jury ? "text-success w-4 h-4" : "text-border w-4 h-4"} /></div>
                  </div>
                  <Button className="w-full" disabled={inviteState[user.id] === 'sending' || inviteState[user.id] === 'sent'} onClick={() => void handleInvite(user)}>
                    <Mail className="w-4 h-4 mr-2"/> {inviteState[user.id] === 'sent' ? 'ОТПРАВЛЕНО' : inviteState[user.id] === 'sending' ? 'ОТПРАВКА...' : 'ПРИГЛАСИТЬ'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {results.length === 0 && !isSearching && (
          <div className="text-center py-20">
            <p className="text-text-muted">Кандидаты не найдены. Попробуйте изменить запрос.</p>
          </div>
        )}
      </div>
    </div>
  );
}
