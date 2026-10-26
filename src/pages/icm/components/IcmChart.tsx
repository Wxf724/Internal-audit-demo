import { useEffect, useRef, useState } from 'react'
import type { EChartsOption } from 'echarts'
import ReactECharts from 'echarts-for-react'

/**
 * 图表容器：跟随父容器尺寸自适应。
 * 大屏看板用 flex/grid 定高布局，ECharts 的 100% 高度在不确定高度的父级里会塌陷，
 * 因此这里用 ResizeObserver 量出真实像素再交给图表，并在容器尺寸变化时主动 resize。
 */
export interface ChartClick { dataIndex: number; name: string; seriesName: string; value: unknown }
export function EChart({ option, className, style, onEvents }: { option: EChartsOption; className?: string; style?: React.CSSProperties; onEvents?: Record<string, (event: ChartClick) => void> }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReactECharts>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const measure = () => {
      const rect = el.getBoundingClientRect()
      const width = Math.max(0, Math.round(rect.width))
      const height = Math.max(0, Math.round(rect.height))
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }))
      const instance = chartRef.current?.getEchartsInstance()
      if (instance && width > 0 && height > 0) instance.resize({ width, height })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={boxRef} className={className} style={{ position: 'relative', flex: 1, minWidth: 0, minHeight: 0, ...style }}>
      {size.width > 0 && size.height > 0 ? (
        <ReactECharts
          ref={chartRef}
          option={option}
          onEvents={onEvents}
          notMerge
          lazyUpdate
          style={{ width: size.width, height: size.height }}
        />
      ) : null}
    </div>
  )
}
