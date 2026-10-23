import { Button } from '@/components/button'
import { Input } from '@/components/input'
import { Card } from '@heroui/react'

interface LoginCardProps {
  isLoading: boolean
  showPassword: boolean
  account: string
  password: string
  onAccountChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onTogglePassword: () => void
  onApplyAccount: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function LoginCard(props: LoginCardProps) {
  const {
    isLoading,
    showPassword,
    account,
    password,
    onAccountChange,
    onPasswordChange,
    onTogglePassword,
    onApplyAccount,
    onSubmit,
  } = props

  return (
    <Card className="bg-(--surface) rounded-2xl border border-gray-100 p-8 shadow-sm">
      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center bg-[#0F52BA]/8 rounded-2xl">
          <img
            src="https://static.readdy.ai/image/ef95b83776c013c4a1c3d783d82ec693/790fa4d64762eea3565205595e6b025d.png"
            alt="乾知AI"
            className="w-10 h-10 object-contain"
          />
        </div>
        <h1 className="text-xl font-bold text-(--foreground)">欢迎回来</h1>
        <p className="text-sm text-gray-400 mt-1">登录乾知 AI 工作台</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">账号</label>
          <Input
            value={account}
            onChange={onAccountChange}
            placeholder="请输入手机号"
            leftIcon={<i className="ri-user-3-line"></i>}
            inputGroupClassName="bg-gray-50"
            size="md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">密码</label>
          <Input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={onPasswordChange}
            placeholder="请输入密码"
            leftIcon={<i className="ri-lock-2-line"></i>}
            rightIcon={
              <button
                type="button"
                onClick={onTogglePassword}
                className="text-gray-300 hover:text-gray-500 cursor-pointer focus:outline-none"
              >
                <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
              </button>
            }
            inputGroupClassName="bg-gray-50"
            size="md"
          />
        </div>

        <Button
          size="md"
          type="primary"
          disabled={isLoading || !account || !password}
          loading={isLoading}
          icon={!isLoading ? <i className="ri-login-box-line"></i> : undefined}
          className="mt-2 w-full"
        >
          {isLoading ? '登录中...' : '登录'}
        </Button>
      </form>
    </Card>
  )
}
