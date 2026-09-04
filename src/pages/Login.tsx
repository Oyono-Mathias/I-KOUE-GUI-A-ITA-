import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import '../styles/Login.css'; // ou globals.css si tu as tout dedans

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user && window.location.pathname === '/login') {
      window.location.href = '/dashboard';
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // La redirection sera gérée par le useEffect
    } catch (err: any) {
      console.error(err);
      setError("Identifiants incorrects ou compte inexistant.");
      setLoading(false);
    }
  };

  return (
    <div className="page active" style={{ minHeight: '100vh' }}>
      <header className="header">
        <div className="header-top">
          <div className="logo-container">
            <div className="logo">IK</div>
            <div className="logo-text">
              <h1>I KOUE GUI A ITA</h1>
              <div className="devise">ENSEMBLE · VOLONTÉ · ENGAGEMENT</div>
            </div>
          </div>
        </div>
      </header>

      <div className="page-header" style={{ padding: '40px 20px' }}>
        <h2>🔒 Connexion</h2>
        <p>Accès réservé aux membres et administrateurs</p>
      </div>

      <section className="section">
        <div className="login-container" style={{ maxWidth: '400px', margin: '0 auto' }}>
          <div className="login-card" style={{ background: 'var(--blanc-pur)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
            <div style={{ width: '80px', height: '80px', margin: '0 auto 20px', background: '#FFF3E0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
              🔒
            </div>

            {error && (
              <div style={{ background: '#FFEBEE', color: '#C62828', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600 }}>Email</label>
                <input
                  type="email"
                  required
                  placeholder="associationikoueguiaita@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid var(--bordure)', minHeight: '48px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600 }}>Mot de passe</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid var(--bordure)', minHeight: '48px' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px', background: 'var(--orange-energie)', color: 'white',
                  border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', minHeight: '48px'
                }}
              >
                {loading ? '⏳ Connexion...' : 'SE CONNECTER'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
