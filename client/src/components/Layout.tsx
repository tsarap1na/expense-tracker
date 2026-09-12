import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
    { to: '/', label: 'Dashboard' },
    { to: '/categories', label: 'Categories' },
    { to: '/transactions', label: 'Transactions' },
    { to: '/budgets', label: 'Budgets' },
    { to: '/recurring', label: 'Recurring' },
    { to: '/import-export', label: 'Import / Export' },
];

export function Layout() {
    const { logout } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50">
            <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-1 sticky top-0 z-10">
                <span className="font-semibold text-slate-800 mr-6">Expense Tracker</span>
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.to === '/'}
                        className={({ isActive }) =>
                            `px-3 py-1.5 rounded-md text-sm transition-colors ${
                                isActive
                                    ? 'bg-indigo-50 text-indigo-600 font-medium'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`
                        }
                    >
                        {link.label}
                    </NavLink>
                ))}
                <button
                    onClick={logout}
                    className="ml-auto text-sm text-slate-500 hover:text-red-500 transition-colors"
                >
                    Sign out
                </button>
            </nav>
            <main className="max-w-5xl mx-auto p-6">
                <Outlet />
            </main>
        </div>
    );
}