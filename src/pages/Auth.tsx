import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button, Input, Checkbox, useToast } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema, mfaVerifySchema, type LoginFormValues, type MfaVerifyFormValues } from '@/schemas/auth.schema';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-700 via-brand-800 to-accent-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center font-bold text-lg">R</div>
            <span className="text-title font-bold tracking-tight">RAISE</span>
          </div>
          <div>
            <h1 className="text-display font-bold leading-tight max-w-md">Enterprise Asset Management, redefined.</h1>
            <p className="text-body text-white/70 mt-4 max-w-sm">Track, manage, and optimize your organization's assets with a platform built for scale.</p>
            <div className="flex flex-col gap-3 mt-8">
              {[
                'Real-time asset tracking and lifecycle management',
                'Automated maintenance scheduling and alerts',
                'Comprehensive audit trails and compliance reporting',
              ].map((f) => (
                <div key={f} className="flex items-center gap-2.5 text-body text-white/80">
                  <CheckCircle2 className="h-4.5 w-4.5 text-success-300 shrink-0" style={{ width: 18, height: 18 }} />
                  {f}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-caption text-white/50">
            <ShieldCheck className="h-4 w-4" />
            SOC 2 Type II Certified · ISO 27001 Compliant
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-surface-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8 justify-center">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-brand-600 to-accent-600 flex items-center justify-center text-white font-bold">R</div>
            <span className="text-title font-bold text-surface-900">RAISE</span>
          </div>

          <h2 className="text-heading font-bold text-surface-900">{title}</h2>
          <p className="text-body text-surface-500 mt-1.5">{subtitle}</p>

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-6 text-center text-body text-surface-500">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

interface LoginProps {
  onNavigate: (id: string) => void;
}

export function Login({ onNavigate }: LoginProps) {
  const { push } = useToast();
  const { login, mfaRequired } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  if (mfaRequired) {
    return <MfaVerifyStep onNavigate={onNavigate} />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values);
      onNavigate('dashboard');
    } catch (error) {
      push({
        variant: 'error',
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        message: error instanceof Error ? error.message : 'กรุณาตรวจสอบชื่อผู้ใช้และรหัสผ่านอีกครั้ง',
      });
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your RAISE account to continue."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Username" placeholder="you@company.com" error={errors.username?.message} {...register('username')} />
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register('password')}
          />
          <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-[34px] text-surface-400 hover:text-surface-600">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="flex items-center justify-between">
          <Checkbox id="remember" label="Remember me" defaultChecked />
          <button type="button" onClick={() => onNavigate('forgot-password')} className="text-caption text-brand-600 font-medium hover:underline">Forgot password?</button>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting} rightIcon={<ArrowRight className="h-4 w-4" />}>Sign In</Button>
      </form>
    </AuthLayout>
  );
}

function MfaVerifyStep({ onNavigate }: LoginProps) {
  const { push } = useToast();
  const { verifyMfa, cancelMfaChallenge } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MfaVerifyFormValues>({ resolver: zodResolver(mfaVerifySchema) });

  const onSubmit = async (values: MfaVerifyFormValues) => {
    try {
      await verifyMfa(values.code);
      onNavigate('dashboard');
    } catch (error) {
      push({
        variant: 'error',
        title: 'ยืนยันรหัสไม่สำเร็จ',
        message: error instanceof Error ? error.message : 'กรุณาตรวจสอบรหัสยืนยันอีกครั้ง',
      });
    }
  };

  return (
    <AuthLayout
      title="Verify your identity"
      subtitle="Enter the 6-digit code from your authenticator app."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Verification Code"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          error={errors.code?.message}
          {...register('code')}
        />
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting} rightIcon={<ArrowRight className="h-4 w-4" />}>Verify</Button>
        <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => { cancelMfaChallenge(); onNavigate('login'); }}>ยกเลิก</Button>
      </form>
    </AuthLayout>
  );
}

export function ForgotPassword({ onNavigate }: LoginProps) {
  const { push } = useToast();
  const [sent, setSent] = useState(false);

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
      footer={<>Remember your password? <button onClick={() => onNavigate('login')} className="text-brand-600 font-medium hover:underline">Sign in</button></>}
    >
      {sent ? (
        <div className="flex flex-col items-center text-center py-6">
          <div className="h-14 w-14 rounded-full bg-success-50 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-7 w-7 text-success-600" />
          </div>
          <p className="text-title font-semibold text-surface-900">Check your email</p>
          <p className="text-body text-surface-500 mt-1.5">We've sent a password reset link to your email address.</p>
          <Button variant="outline" className="mt-6 w-full" onClick={() => onNavigate('login')}>Back to sign in</Button>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); setSent(true); push({ variant: 'info', title: 'Reset link sent', message: 'Check your inbox' }); }} className="flex flex-col gap-4">
          <Input label="Email Address" type="email" placeholder="you@company.com" helpText="We'll send a link to this address" />
          <Button type="submit" size="lg" className="w-full">Send Reset Link</Button>
        </form>
      )}
    </AuthLayout>
  );
}

export function Register({ onNavigate }: LoginProps) {
  const { push } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start managing your enterprise assets today."
      footer={<>Already have an account? <button onClick={() => onNavigate('login')} className="text-brand-600 font-medium hover:underline">Sign in</button></>}
    >
      <form onSubmit={(e) => { e.preventDefault(); push({ variant: 'success', title: 'Account created', message: 'Welcome to RAISE!' }); setTimeout(() => onNavigate('dashboard'), 500); }} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="First Name" placeholder="Alex" />
          <Input label="Last Name" placeholder="Morgan" />
        </div>
        <Input label="Work Email" type="email" placeholder="you@company.com" />
        <Input label="Company" placeholder="Company name" />
        <div className="relative">
          <Input label="Password" type={showPassword ? 'text' : 'password'} placeholder="Create a password" helpText="At least 12 characters with mixed case" />
          <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-[34px] text-surface-400 hover:text-surface-600">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <Checkbox id="terms" label="I agree to the Terms of Service and Privacy Policy" />
        <Button type="submit" size="lg" className="w-full">Create Account</Button>
      </form>
    </AuthLayout>
  );
}
