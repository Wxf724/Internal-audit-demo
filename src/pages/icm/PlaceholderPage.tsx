export default function PlaceholderPage({ title = '页面建设中' }: { title?: string }) {
  return (
    <div className="icm-panel">
      <div className="icm-panel-pad">
        <div className="icm-section-title">{title}</div>
        <p style={{ color: '#607089', margin: 0 }}>
          该页面正在按 MD 设计规格补充业务区块，最终会接入采购围标风险演示数据。
        </p>
      </div>
    </div>
  )
}
