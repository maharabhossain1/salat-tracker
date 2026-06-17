import { redirect } from 'next/navigation';

import { RegisterForm } from '@/components/features/register-form';
import { registrationOpen } from '@/lib/auth/registration';

export const metadata = { title: 'Create account' };

export default function RegisterPage() {
  if (!registrationOpen) redirect('/login');
  return <RegisterForm />;
}
