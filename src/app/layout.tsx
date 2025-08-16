import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { Toaster } from 'react-hot-toast'
import NotificationToast from '@/components/NotificationToast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Advanced EMS - Employee Management System',
  description: 'A comprehensive employee management system with role-based access control',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <NotificationProvider>
            {children}
            <NotificationToast />
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
