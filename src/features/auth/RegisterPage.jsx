
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../../services/authService';

export default function RegisterPage() {
    const navigate = useNavigate();
    const[name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            await registerUser({ name, email, password });
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    }

    return (
        <div className='max-w-sm mx-auto mt-20 p-6 bg-white rounded shadow'>
            <h2 className='text-2xl font-bold mb-4'>Register</h2>
            {error && <p className='text-red-500 mb-2'>{error}</p>}

            <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                    <label className='block text-sm'>Name:</label>
                    <input
                        type='text'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className='w-full mt-1 p-2 border rounded'
                        required
                    />
                </div>
                <div>
                    <label className='block text-sm'>Email:</label>
                    <input
                        type='email'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className='w-full mt-1 p-2 border rounded'
                        required
                    />
                </div>
                <div>
                    <label className='block text-sm'>Password:</label>
                    <input
                        type='password'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className='w-full mt-1 p-2 border rounded'
                        required
                    />
                </div>
                <button type='submit' className='w-full py-2 bg-green-600 text-white rounded'>
                    Register
                </button>
            </form>

            <p className='mt-4 text-center text-sm'>
                Already have an account? <Link to='/login' className='text-blue-500'>Login</Link>
            </p>
        </div>
    )
}