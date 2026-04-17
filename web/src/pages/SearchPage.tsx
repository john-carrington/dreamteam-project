import React, { useState, useMemo } from 'react';
import { useMockData } from '@/store/MockDataContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, Filter, CheckCircle, Mail } from 'lucide-react';

export function SearchPage({ onUserClick }: { onUserClick: (id: string) => void }) {
  const { users } = useMockData();
  const [query, setQuery] = useState('');

  // Filters
  const [filterSpeaker, setFilterSpeaker] = useState(false);
  const [filterMentor, setFilterMentor] = useState(false);
  const [filterJury, setFilterJury] = useState(false);

  const filteredCandidates = useMemo(() => {
    let result = users;

    if (query) {
      const q = query.toLowerCase();
      result = result.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.skills.some(s => s.name.toLowerCase().includes(q)) ||
        u.experience.projects.toLowerCase().includes(q)
      );
    }

    if (filterSpeaker) result = result.filter(u => u.readiness.speaker);
    if (filterMentor) result = result.filter(u => u.readiness.mentor);
    if (filterJury) result = result.filter(u => u.readiness.jury);

    return result.sort((a,b) => b.skills.reduce((acc,s)=>acc+s.endorsements.length,0) - a.skills.reduce((acc,s)=>acc+s.endorsements.length,0));
  }, [users, query, filterSpeaker, filterMentor, filterJury]);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 pb-20">
      <div>
        <h2 className="text-3xl font-[Georgia] italic text-text">Поиск экспертов</h2>
        <p className="text-text-muted text-sm mt-2">Найдите подходящих спикеров, менторов или жюри.</p>
      </div>

      <div className="bg-surface p-6 rounded-[8px] border border-border shadow-sm space-y-4">
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
          <div className="flex items-center gap-2 text-[11px] font-[600] text-text-muted uppercase tracking-widest"><Filter className="w-3 h-3"/> Фильтры:</div>
          <Badge 
            variant={filterSpeaker ? 'default' : 'outline'} 
            className="cursor-pointer px-4 py-1.5 transition-colors" 
            onClick={() => setFilterSpeaker(!filterSpeaker)}
          >Спикер</Badge>
          <Badge 
            variant={filterMentor ? 'default' : 'outline'} 
            className="cursor-pointer px-4 py-1.5 transition-colors"
            onClick={() => setFilterMentor(!filterMentor)}
          >Ментор</Badge>
          <Badge 
            variant={filterJury ? 'default' : 'outline'} 
            className="cursor-pointer px-4 py-1.5 transition-colors"
            onClick={() => setFilterJury(!filterJury)}
          >Жюри</Badge>
        </div>
      </div>

      <div className="space-y-4 mt-8">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-widest">Найдено кандидатов: {filteredCandidates.length}</p>
        
        {filteredCandidates.map((user: any) => (
          <Card key={user.id} className="overflow-hidden hover:border-accent transition-colors bg-surface border-border">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className="p-6 flex-1 cursor-pointer" onClick={() => onUserClick(user.id)}>
                  <div className="flex items-start gap-4">
                    <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full border border-border" />
                    <div>
                      <h3 className="text-lg font-[Georgia] italic text-text">{user.name}</h3>
                      <p className="text-text-muted text-xs mt-1">{user.title} • {user.department}</p>
                      
                      <div className="flex flex-wrap gap-2 mt-4">
                        {user.skills.slice(0, 4).map((s: any) => (
                          <div key={s.id} className="flex flex-col bg-background border border-border rounded-[4px] px-2 py-1 text-[10px]">
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
                  <Button className="w-full" onClick={() => alert(`Приглашение отправлено: ${user.name}`)}>
                    <Mail className="w-4 h-4 mr-2"/> ПРИГЛАСИТЬ
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredCandidates.length === 0 && (
          <div className="text-center py-20">
            <p className="text-text-muted">Кандидаты не найдены. Попробуйте изменить запрос.</p>
          </div>
        )}
      </div>
    </div>
  );
}
