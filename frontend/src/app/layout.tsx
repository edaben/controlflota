import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'Control Bus - Sistema de Infracciones',
    description: 'Sistema multi-tenant de gestión de infracciones y multas',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="es">
            <body>{children}</body>
        </html>
    )
}
