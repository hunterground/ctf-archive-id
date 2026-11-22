import { RegisterForm } from './RegisterForm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function RegisterPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  
  if (token) {
    redirect('/notes'); 
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Register
        </h1>
        <RegisterForm />
      </div>
    </div>
  );
}