import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@heroui/react'
import JSEncrypt from 'jsencrypt'
import { useUserStore } from '@/stores'
import { getPublicKey } from '@/api/AuthAPI'

interface LoginFormData {
  account: string
  password: string
}

const INITIAL_LOGIN_FORM: LoginFormData = { account: '', password: '' }

export function useLogin() {
  const navigate = useNavigate()
  const login = useUserStore((state) => state.login)

  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<LoginFormData>(INITIAL_LOGIN_FORM)
  const [loginPublicKey, setLoginPublicKey] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.account || !formData.password) {
      toast.warning('请输入账号和密码')
      return
    }
    const encrypt = new JSEncrypt()
    if (!loginPublicKey) {
      toast.warning('公钥加载中，请稍后再试')
      return
    }
    encrypt.setPublicKey(loginPublicKey)
    const encryptedPassword = encrypt.encrypt(formData.password)
    if (!encryptedPassword) {
      toast.danger('密码加密失败，请检查公钥配置')
      return
    }

    setIsLoading(true)
    try {
      await login({
        username: formData.account,
        password: encryptedPassword,
      })
      navigate('/dashboard')
    } catch {
      // 错误提示由 src/api/index.js 或接口返回统一处理
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const loadLoginPublicKey = async () => {
      try {
        const res = await getPublicKey({})
        const publicKey = String(res?.data?.public_key || '').trim()
        if (!publicKey) {
          toast.danger('获取登录公钥失败')
          return
        }
        setLoginPublicKey(publicKey)
      } catch {
        toast.danger('获取登录公钥失败')
      }
    }
    loadLoginPublicKey()
  }, [])

  return {
    navigate,
    isLoading,
    showPassword,
    formData,
    setShowPassword,
    setFormData,
    handleLogin,
  }
}
