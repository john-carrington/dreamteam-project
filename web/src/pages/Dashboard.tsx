import React, { useMemo } from 'react';
import { useMockData } from '@/store/MockDataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Search, Trophy, CheckCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Dashboard({ onNavigate, onUserClick }: { onNavigate: (v: string) => void, onUserClick: (id: string) => void }) {
  const { users } = useMockData();

  // Analytics derivation
  const analyticsData = useMemo(() => {
    const readyToSpeak = users.filter(u => u.readiness.speaker).length;
    const readyToMentor = users.filter(u => u.readiness.mentor).length;
    
    const skillCounts: Record<string, number> = {};
    users.forEach(u => {
      u.skills.forEach(s => {
        skillCounts[s.name] = (skillCounts[s.name] || 0) + 1;
      });
    });

    const topSkills = Object.entries(skillCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Leaderboard derivation based on badges or endorsements
    const leaderboard = [...users].sort((a, b) => {
      const aScore = a.skills.reduce((acc, s) => acc + s.endorsements.length, 0);
      const bScore = b.skills.reduce((acc, s) => acc + s.endorsements.length, 0);
      return bScore - aScore;
    }).slice(0, 3);

    return { readyToSpeak, readyToMentor, topSkills, leaderboard };
  }, [users]);

  return (
    <div className="p-8 space-y-8 pb-20">
      <div>
        <h2 className="text-3xl font-semibold italic text-text">Дашборд</h2>
        <p className="text-text-muted mt-2 text-sm">Аналитика по экспертизе сотрудников и лидерборд.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] uppercase tracking-widest text-text-muted">Готовы выступать (Спикеры)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold italic text-text">{analyticsData.readyToSpeak}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] uppercase tracking-widest text-text-muted">Готовы менторить</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold italic text-text">{analyticsData.readyToMentor}</div>
          </CardContent>
        </Card>
        <Card className="bg-surface-light border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] uppercase tracking-widest text-text-muted">Найти эксперта</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="default" className="w-full justify-between" onClick={() => onNavigate('search')}>
              ПЕРЕЙТИ К ПОИСКУ <Search className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-accent" /> Топ навыков в компании</CardTitle>
            <CardDescription>Распределение сотрудников по ключевым навыкам</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.topSkills} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#2A2A2A" />
                <XAxis type="number" stroke="#888888" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fill: '#888888' }} />
                <Tooltip contentStyle={{ backgroundColor: '#141414', borderColor: '#2A2A2A', borderRadius: '4px', color: '#fff' }} />
                <Bar dataKey="count" fill="#FF6B00" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> Топ экспертов месяца</CardTitle>
            <CardDescription>Сотрудники с наибольшим количеством подтвержденных навыков</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyticsData.leaderboard.map((user, idx) => (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-[8px] border border-border bg-background hover:border-accent transition-colors cursor-pointer" onClick={() => onUserClick(user.id)}>
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface font-bold text-text-muted">
                    {idx + 1}
                  </div>
                  <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-border" />
                  <div>
                    <p className="text-sm font-bold text-text">{user.name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-text-muted">{user.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-1">
                    {user.badges.slice(0,2).map(b => (
                      <Badge key={b} variant="secondary" className="text-[10px] px-1.5 h-5">{b}</Badge>
                    ))}
                  </div>
                  <div className="text-xs font-bold text-success bg-[rgba(39,174,96,0.1)] px-2 py-1 rounded-[100px] flex items-center">
                     <CheckCircle className="w-3 h-3 mr-1" />
                     {user.skills.reduce((acc, s) => acc + s.endorsements.length, 0)}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
