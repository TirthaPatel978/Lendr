import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

function ProtectedRoute({
    children,
    allowedRoles,
    disallowedRoles = []
}) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-sm text-slate-500">
                    Loading Lendr...
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (
        allowedRoles &&
        !allowedRoles.includes(user.role)
    ) {
        return (
            <Navigate
                to={user.role === 'ADMIN' ? '/admin' : '/dashboard'}
                replace
            />
        );
    }

    if (disallowedRoles.includes(user.role)) {
        return (
            <Navigate
                to={user.role === 'ADMIN' ? '/admin' : '/dashboard'}
                replace
            />
        );
    }

    return children;
}

export default ProtectedRoute;