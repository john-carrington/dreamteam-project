import { type FormEvent, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { BadgeCheck, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { AuthApiError, TokensModel, loginUser, registerUser } from '@/services/authService';

interface AuthPageProps {
  onAuthSuccess: (tokens: TokensModel) => void;
}

function normalizeError(error: unknown) {
  if (error instanceof AuthApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Не удалось выполнить запрос. Проверьте соединение с сервером.';
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isRegister = mode === 'register';

  const canSubmit = useMemo(() => {
    if (!email.trim() || !password.trim()) {
      return false;
    }

    if (!isRegister) {
      return true;
    }

    return Boolean(name.trim() && surname.trim() && confirmPassword.trim());
  }, [email, password, isRegister, name, surname, confirmPassword]);

  const handleLogin = async () => {
    const tokens = await loginUser({ email: email.trim(), password });
    onAuthSuccess(tokens);
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      throw new Error('Пароли не совпадают.');
    }

    const fullName = `${name.trim()} ${surname.trim()}`.trim();

    await registerUser({
      email: email.trim(),
      password,
      full_name: fullName || undefined,
    });

    const tokens = await loginUser({ email: email.trim(), password });
    onAuthSuccess(tokens);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);
    setIsSubmitting(true);

    try {
      if (isRegister) {
        await handleRegister();
      } else {
        await handleLogin();
      }
    } catch (submitError) {
      setError(normalizeError(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[rgba(255,107,0,0.15)] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-[rgba(255,255,255,0.06)] blur-3xl" />
      </div>

      <div className="relative min-h-screen grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden lg:flex flex-col justify-center p-14 border-r border-border bg-[radial-gradient(circle_at_20%_20%,rgba(255,107,0,0.22),transparent_42%)]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-xl"
          >
            <p className="text-xs uppercase tracking-[4px] text-text-muted">Naumen Expertise Map</p>
            <h1 className="mt-5 text-5xl leading-tight font-semibold italic">
              Внутренняя карта экспертизы
              <br />
              для команд роста
            </h1>
            <p className="mt-6 text-sm text-text-muted leading-relaxed max-w-lg">
              Найдите подходящего спикера, ментора или эксперта в жюри за несколько кликов и сразу
              поймите, почему именно этот сотрудник подходит под задачу.
            </p>

            <div className="mt-8 space-y-3 text-sm">
              <div className="flex items-center gap-3 rounded-[8px] border border-border bg-surface px-4 py-3">
                <BadgeCheck className="w-4 h-4 text-success" /> Подтвержденная экспертиза и прозрачные навыки
              </div>
              <div className="flex items-center gap-3 rounded-[8px] border border-border bg-surface px-4 py-3">
                <BadgeCheck className="w-4 h-4 text-success" /> Умный поиск кандидатов под HR-сценарии
              </div>
              <div className="flex items-center gap-3 rounded-[8px] border border-border bg-surface px-4 py-3">
                <BadgeCheck className="w-4 h-4 text-success" /> Быстрое приглашение в один клик
              </div>
            </div>
          </motion.div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-md"
          >
            <Card className="border-border bg-surface/95 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold italic text-center">Вход в систему</CardTitle>
                <CardDescription className="text-center text-sm">
                  Авторизуйтесь или создайте новый аккаунт
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                <Tabs
                  value={mode}
                  onValueChange={(value) => {
                    setMode(value as 'login' | 'register');
                    setError(null);
                  }}
                >
                  <TabsList className="grid grid-cols-2 w-full h-11">
                    <TabsTrigger value="login" className="text-xs uppercase tracking-[1px]">
                      Вход
                    </TabsTrigger>
                    <TabsTrigger value="register" className="text-xs uppercase tracking-[1px]">
                      Регистрация
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <form onSubmit={handleSubmit} className="space-y-3">
                  {isRegister && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="relative">
                        <UserRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <Input
                          placeholder="Имя"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-9 h-11"
                          autoComplete="given-name"
                          required
                        />
                      </div>

                      <div className="relative">
                        <UserRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <Input
                          placeholder="Фамилия"
                          value={surname}
                          onChange={(e) => setSurname(e.target.value)}
                          className="pl-9 h-11"
                          autoComplete="family-name"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-11"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="relative">
                    <LockKeyhole className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <Input
                      type="password"
                      placeholder="Пароль"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 h-11"
                      autoComplete={isRegister ? 'new-password' : 'current-password'}
                      required
                    />
                  </div>

                  {isRegister && (
                    <div className="relative">
                      <LockKeyhole className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      <Input
                        type="password"
                        placeholder="Повторите пароль"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-9 h-11"
                        autoComplete="new-password"
                        required
                      />
                    </div>
                  )}

                  {error && (
                    <div className="rounded-[4px] border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full h-11" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting
                      ? 'ОТПРАВКА...'
                      : isRegister
                        ? 'СОЗДАТЬ АККАУНТ'
                        : 'ВОЙТИ'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
