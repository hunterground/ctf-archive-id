import { LoginForm } from './LoginForm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  
  if (token) {
    redirect('/');
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Login
        </h1>
        <LoginForm />
      </div>
    </div>
  );
}