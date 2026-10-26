import { useId } from 'react'

interface RobotAvatarProps {
  size?: number
  className?: string
}

/** 审计智能助手头像：深色底 + 机芯眼睛的机器人识别符号，纯 SVG，随尺寸无损缩放 */
export default function RobotAvatar({ size = 40, className = '' }: RobotAvatarProps) {
  const rawId = useId()
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, '')
  const bgId = `icm-robot-bg-${uid}`
  const faceId = `icm-robot-face-${uid}`
  return (
    <svg
      aria-hidden="true"
      className={`icm-robot-avatar ${className}`.trim()}
      focusable="false"
      height={size}
      role="img"
      viewBox="0 0 64 64"
      width={size}
    >
      <defs>
        <linearGradient id={bgId} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#1f6bb0" />
          <stop offset="55%" stopColor="#0d3b70" />
          <stop offset="100%" stopColor="#071c3d" />
        </linearGradient>
        <linearGradient id={faceId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d3e7fa" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" fill={`url(#${bgId})`} r="32" />
      <circle
        cx="32"
        cy="32"
        fill="none"
        r="30.5"
        stroke="rgba(255, 255, 255, 0.22)"
        strokeWidth="1.2"
      />
      <ellipse cx="21" cy="12" fill="#ffffff" opacity="0.1" rx="13" ry="8" />
      <path d="M32 18.5V14" stroke="#8fe8ff" strokeLinecap="round" strokeWidth="2.4" />
      <circle cx="32" cy="11.4" fill="#45e0bd" r="3" />
      <rect fill="#8fe8ff" height="12" opacity="0.8" rx="2" width="4" x="10.4" y="27" />
      <rect fill="#8fe8ff" height="12" opacity="0.8" rx="2" width="4" x="49.6" y="27" />
      <rect fill={`url(#${faceId})`} height="30" rx="10.5" width="34" x="15" y="18.4" />
      <rect fill="#0a2d59" height="9.4" rx="3.2" width="6.6" x="23.4" y="27.6" />
      <rect fill="#0a2d59" height="9.4" rx="3.2" width="6.6" x="34" y="27.6" />
      <circle cx="25.6" cy="30.6" fill="#8fe8ff" r="1.5" />
      <circle cx="36.2" cy="30.6" fill="#8fe8ff" r="1.5" />
      <path
        d="M26.8 41.2a6.2 6.2 0 0 0 10.4 0"
        fill="none"
        stroke="#0a2d59"
        strokeLinecap="round"
        strokeWidth="2.4"
      />
    </svg>
  )
}
