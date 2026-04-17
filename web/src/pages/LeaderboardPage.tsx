import React from 'react';
import { useMockData } from '@/store/MockDataContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Trophy, Medal, Star, Target } from 'lucide-react';

export function LeaderboardPage({ onUserClick }: { onUserClick: (id: string) => void }) {
  const { users } = useMockData();

  const sortedUsers = [...users].sort((a, b) => {
    const aScore = a.skills.reduce((acc, s) => acc + s.endorsements.length, 0);
    const bScore = b.skills.reduce((acc, s) => acc + s.endorsements.length, 0);
    return bScore - aScore;
  });

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-8 h-8 text-accent" />;
    if (index === 1) return <Medal className="w-8 h-8 text-gray-400" />;
    if (index === 2) return <Medal className="w-8 h-8 text-amber-700" />;
    return <div className="w-8 h-8 flex items-center justify-center font-bold text-text-muted rounded-full bg-surface border border-border">{index + 1}</div>;
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 pb-20">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-semibold italic text-text">Лидерборд Экспертов</h2>
        <p className="text-text-muted text-sm">Участвуйте в развитии компании и получайте признание коллег!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="bg-surface-light border-border">
          <CardContent className="p-6 text-center space-y-2">
            <Trophy className="w-10 h-10 mx-auto text-accent" />
            <h3 className="font-bold text-text text-sm uppercase tracking-wider">1 место</h3>
            <p className="text-xs text-text-muted">Награда "Главный Эксперт месяца"</p>
          </CardContent>
        </Card>
        <Card className="bg-surface-light border-border">
          <CardContent className="p-6 text-center space-y-2">
            <Medal className="w-10 h-10 mx-auto text-gray-400" />
            <h3 className="font-bold text-text text-sm uppercase tracking-wider">Топ 3</h3>
            <p className="text-xs text-text-muted">Знак отличия в профиле</p>
          </CardContent>
        </Card>
        <Card className="bg-surface-light border-border">
          <CardContent className="p-6 text-center space-y-2">
            <Target className="w-10 h-10 mx-auto text-success" />
            <h3 className="font-bold text-text text-sm uppercase tracking-wider">Зарабатывайте баллы</h3>
            <p className="text-xs text-text-muted">Получая подтверждения навыков</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {sortedUsers.map((user, index) => {
          const score = user.skills.reduce((acc, s) => acc + s.endorsements.length, 0);
          
          return (
            <div 
              key={user.id} 
              className="flex items-center gap-6 p-4 rounded-[8px] border border-border bg-surface hover:border-accent transition-colors cursor-pointer"
              onClick={() => onUserClick(user.id)}
            >
              <div className="w-12 flex justify-center">
                {getRankIcon(index)}
              </div>
              
              <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-full border border-border" />
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold italic text-text flex items-center gap-2">
                  {user.name}
                  {user.badges.map(b => (
                    <Badge key={b} variant="secondary" className="text-[10px] h-5"><Star className="w-3 h-3 mr-1 text-accent"/>{b}</Badge>
                  ))}
                </h3>
                <p className="text-text-muted text-xs uppercase tracking-widest mt-1">{user.department}</p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-semibold italic focus:outline-none text-success">{score}</div>
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-[1px]">баллов</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
