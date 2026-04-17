import { useEffect, useState } from 'react';
import { MockDataProvider } from './store/MockDataContext';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { ProfilePage } from './pages/ProfilePage';
import { SearchPage } from './pages/SearchPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { AuthPage } from './pages/AuthPage';
import {
  TokensModel,
  clearStoredTokens,
  getCurrentUser,
  loadStoredTokens,
  saveStoredTokens,
} from './services/authService';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthCheckFinished, setIsAuthCheckFinished] = useState(false);
  const [currentPath, setCurrentPath] = useState('dashboard');
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    void bootstrapAuth();
  }, []);

  const bootstrapAuth = async () => {
    const storedTokens = loadStoredTokens();
    if (!storedTokens) {
      setIsAuthCheckFinished(true);
      return;
    }

    try {
      await getCurrentUser(storedTokens.access_token);
      setIsAuthenticated(true);
    } catch {
      clearStoredTokens();
      setIsAuthenticated(false);
    } finally {
      setIsAuthCheckFinished(true);
    }
  };

  const navigateToProfile = (userId: string) => {
    setSelectedUserId(userId);
    setCurrentPath('profile-view');
  };

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    if (path !== 'profile-view') {
      setSelectedUserId(undefined);
    }
  };

  const handleAuthSuccess = (tokens: TokensModel) => {
    saveStoredTokens(tokens);
    setIsAuthenticated(true);
    setCurrentPath('dashboard');
  };

  const handleLogout = () => {
    clearStoredTokens();
    setIsAuthenticated(false);
    setCurrentPath('dashboard');
    setSelectedUserId(undefined);
  };

  if (!isAuthCheckFinished) {
    return (
      <div className="min-h-screen bg-background text-text flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[3px] text-text-muted">Naumen Expertise</p>
          <p className="mt-3 text-lg font-semibold italic">Проверяем сессию...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <MockDataProvider>
      <Layout currentPath={currentPath} onNavigate={handleNavigate} onLogout={handleLogout}>
        {currentPath === 'dashboard' && <Dashboard onNavigate={handleNavigate} onUserClick={navigateToProfile} />}
        {currentPath === 'search' && <SearchPage onUserClick={navigateToProfile} />}
        {currentPath === 'profile' && <ProfilePage />}
        {currentPath === 'profile-view' && <ProfilePage viewUserId={selectedUserId} />}
        {currentPath === 'leaderboard' && <LeaderboardPage onUserClick={navigateToProfile} />}
      </Layout>
    </MockDataProvider>
  );
}
