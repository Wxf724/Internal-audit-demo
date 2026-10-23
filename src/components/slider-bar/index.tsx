import { Slider } from '@heroui/react'
import { sizePresets, type SizePreset } from '../theme'

export interface SliderBarProps {
  size?: SizePreset
  value: number
  onChange: (value: number) => void
  ariaLabel?: string
  className?: string
}

const clampPct = (n: number) => Math.min(100, Math.max(0, n))

/** 0–100 进度条（HeroUI Slider，紫色主题；标签由外层表单行提供） */
export function SliderBar({ size = 'sm', value, onChange, ariaLabel = '进度', className }: SliderBarProps) {
  const sz = sizePresets[size]
  const pct = clampPct(value)
  return (
    <div className={`flex items-center gap-3 ${className ?? ''}`}>
      <Slider
        value={pct}
        onChange={(v) => onChange(clampPct(Array.isArray(v) ? v[0]! : v))}
        minValue={0}
        maxValue={100}
        step={1}
        className="min-w-0 flex-1"
        aria-label={ariaLabel}
      >
        <Slider.Track className="slider-bar__track relative !h-2 w-full overflow-visible rounded-full !border-x-0 bg-gray-100">
          <Slider.Fill className="h-full rounded-full bg-(--accent)" />
          <Slider.Thumb className="slider-bar__thumb !size-3.5 !min-w-0 cursor-grab rounded-full border-2 border-white bg-(--accent-hover) shadow-sm after:hidden active:cursor-grabbing data-[focus-visible=true]:ring-2 data-[focus-visible=true]:ring-(--focus-ring)/50" />
        </Slider.Track>
      </Slider>
      <span className={`w-10 shrink-0 text-right ${sz.font} font-semibold text-(--accent-hover)`}>
        {pct}%
      </span>
    </div>
  )
}
