
import { Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export default function Layout() {
    const { isLoggedIn, logout, user } = useAuthStore();

    return (
        <div className='min-h-screen bg-gray-100'>
            <header className='bg-white shadow p-4 flex justify-between'>
                <Link to='/' className='font-bold text-xl'>Trainify</Link>
                <nav>
                    {isLoggedIn ? (
                        <>
                            <span className='mr-4'>Hello, {user?.name}</span>
                            <button onClick={logout} className='text-red-600'>Logout</button>
                        </>
                    ) : (<Link to='/login' className='mr-4'>Login</Link>)}
                    {!isLoggedIn && (<Link to='/register'>Register</Link>)}
                </nav>
            </header>

            <main className='p-4'>
                <Outlet />
            </main>
        </div>
    );
}
