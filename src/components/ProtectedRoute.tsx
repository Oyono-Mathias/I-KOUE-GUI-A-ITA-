import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const [isActive, setIsActive] = React.useState(false);

    React.useEffect(() => {
        const dashboardPage = document.getElementById('page-dashboard');
        if (!dashboardPage) return;

        const checkActive = () => {
            setIsActive(dashboardPage.classList.contains('active') || window.location.pathname.startsWith('/dashboard'));
        };
        
        checkActive();

        const observer = new MutationObserver(checkActive);
        observer.observe(dashboardPage, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    // Si on n'est pas sur le dashboard, on ne bloque rien et on ne redirige pas
    if (!isActive && !window.location.pathname.startsWith('/dashboard')) {
        return null;
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--fond-alterne)' }}>
                <div style={{ color: 'var(--bleu-rca)', fontSize: '20px', fontWeight: 'bold' }}>
                    ⏳ Chargement sécurisé...
                </div>
            </div>
        );
    }

    if (!user) {
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
        return null;
    }

    return <>{children}</>;
}
