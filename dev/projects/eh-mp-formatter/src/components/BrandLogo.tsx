export function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center justify-center"
        style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--orange-500)',
          boxShadow: '0 2px 8px rgba(249, 115, 22, 0.3)'
        }}
      >
        <span
          className="iconify"
          data-icon="lucide:pen-tool"
          style={{ fontSize: '20px', color: 'white' }}
        ></span>
      </div>
      <div className="flex flex-col">
        <span
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.2
          }}
        >
          排版助手
        </span>
        <span
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            marginTop: '2px'
          }}
        >
          公众号 Markdown 排版
        </span>
      </div>
    </div>
  )
}
