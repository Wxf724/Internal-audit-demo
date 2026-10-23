import { Button } from '@/components/button'
import { LoginCard } from './components/LoginCard'
import { useLogin } from './hooks/useLogin'

export default function Login() {
  const {
    navigate,
    isLoading,
    showPassword,
    formData,
    setShowPassword,
    setFormData,
    handleLogin,
  } = useLogin()

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-white to-blue-50/30 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0F52BA]/5 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-100/40 rounded-full blur-3xl translate-y-1/4 -translate-x-1/4"></div>
      </div>
      <Button
        type="ghost"
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors text-sm group z-10 px-0 min-w-0 rounded-none"
      >
        <i className="ri-arrow-left-line group-hover:-translate-x-0.5 transition-transform"></i>
        返回首页
      </Button>

      <div className="w-full max-w-md mx-4 relative z-10">
        <LoginCard
          isLoading={isLoading}
          showPassword={showPassword}
          account={formData.account}
          password={formData.password}
          onAccountChange={(value) => setFormData((prev) => ({ ...prev, account: value }))}
          onPasswordChange={(value) => setFormData((prev) => ({ ...prev, password: value }))}
          onTogglePassword={() => setShowPassword(!showPassword)}
          onApplyAccount={() => navigate({ pathname: '/', hash: '#contact' })}
          onSubmit={handleLogin}
        />

        <p className="text-center text-xs text-gray-300 mt-4">© 2026 乾知 AI · 政企数智提效专家</p>
      </div>
    </div>
  )
}
