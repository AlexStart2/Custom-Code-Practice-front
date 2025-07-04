import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../../services/authService'
import { useAuthStore } from '../../store/auth'


export default function LoginPage() {
    const navigate = useNavigate();
    const { setUser } = useAuthStore((state) => state.setUser);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            const userData = await loginUser({ email, password });
            setUser(userData);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    }

    return (
        <div className='max-w-sm mx-auto mt-20 p-6 bg-white rounded shadow'>
            <h2 className="text-2xl font-bold mb-4">Login</h2>
            {error && <p className='text-red-500 mb-2'>{error}</p>}

        <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
                <label className='block text-sm'>Email:</label>
                <input type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className='w-full mt-1 p-2 border rounded'
                />
            </div>
            <div>
                <label className='block text-sm'>Password: </label>
                <input type='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className='w-full mt-1 p-2 border rounded'
                />
            </div>
            <button
                type='submit'
                className="w-full py-2 bg-blue-600 text-white rounded"
            >
                Login
            </button>
        </form>
        <p className='mt-4 text-sm'>
            Don't have an account? <a href='/register' className='text-blue-600'>Register</a>
        </p>

    
    </div>
    );
}