import { ReactNode } from 'react'

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 text-sm text-muted-foreground">
      {message}
    </div>
  )
}

export function LoadingState() {
  return (
    <div className="text-center py-16 text-sm text-muted-foreground">
      Carregando...
    </div>
  )
}
