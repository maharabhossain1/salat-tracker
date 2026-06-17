import { LoginForm } from '@/components/features/login-form';
import { registrationOpen } from '@/lib/auth/registration';

export default function LoginPage() {
  return <LoginForm allowRegistration={registrationOpen} />;
}
