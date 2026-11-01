import React, { useEffect, useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { auth } from '../firebase';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user && window.location.pathname === '/login') {
      window.location.href = '/dashboard';
    }
  }, [user]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: unknown) {
      console.error('Login failed:', err);
      const authError = err as { code?: string; message?: string };
      if (
        authError.code === 'auth/network-request-failed' ||
        authError.message?.includes('network-request-failed')
      ) {
        setError('Erreur réseau : vérifiez votre connexion Internet.');
      } else {
        setError('Identifiants incorrects ou compte inexistant.');
      }
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:py-16">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col justify-center">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold tracking-wide text-white shadow-lg shadow-slate-900/15">
            IK
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            I KOUE GUI A ITA
          </h1>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            Ensemble · Volonté · Engagement
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 ring-8 ring-indigo-50/60">
              <LockKeyhole aria-hidden="true" size={25} strokeWidth={1.8} />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Bienvenue
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Connectez-vous pour accéder à votre espace membre.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-slate-700">
                Adresse e-mail
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="nom@exemple.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="block min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-slate-700">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="Saisissez votre mot de passe"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="block min-h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-4 pr-12 text-base text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-500 transition hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600"
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" size={19} />
                  ) : (
                    <Eye aria-hidden="true" size={19} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-12 w-full items-center justify-center rounded-xl border border-transparent bg-slate-900 px-4 py-3 text-sm font-semibold tracking-wide text-white shadow-md shadow-slate-900/15 transition-colors hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-500 disabled:text-white"
            >
              {loading ? 'Connexion en cours…' : 'SE CONNECTER'}
            </button>
          </form>
          <p className="mt-6 text-center text-xs leading-5 text-slate-400">
            Accès réservé aux membres et aux administrateurs.
          </p>
        </section>

        <p className="mt-8 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} I KOUE GUI A ITA
        </p>
      </div>
    </main>
  );
}
