'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Camera, Droplets, History, Settings } from 'lucide-react'
import { ReactNode } from 'react'

const tabs = [
  { path: '/', icon: Camera, label: '홈' },
  { path: '/my-skin', icon: Droplets, label: '내 스킨' },
  { path: '/history', icon: History, label: '기록' },
  { path: '/settings', icon: Settings, label: '설정' },
]

const bottomNavPages = ['/', '/my-skin', '/history', '/settings', '/analysis-result']

export function BottomNavWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const showBottomNav = bottomNavPages.some(page => {
    if (page === '/') return pathname === '/'
    return pathname.startsWith(page)
  })

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  return (
    <div className="h-dvh bg-gray-50 flex flex-col max-w-[430px] mx-auto">
      <div className={`flex-1 overflow-auto ${showBottomNav ? 'pb-20' : ''}`}>
        {children}
        <footer className="px-5 py-6 text-[10px] text-gray-400 leading-relaxed">
          <p>상호: 마니 | 대표: 신민준</p>
          <p>사업자번호: 397-46-01084</p>
          <p>통신판매신고: 제2023-서울강남-05683호</p>
          <p>주소: 서울시 강남구 논현로2길 60, 2층 2252호</p>
          <p>이메일: manyee.official@gmail.com</p>
          <p>연락처: 02-423-5314</p>
        </footer>
      </div>

      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t max-w-[430px] mx-auto">
          <div className="flex items-center justify-around h-20">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const active = isActive(tab.path)
              return (
                <button
                  key={tab.path}
                  onClick={() => router.push(tab.path)}
                  className="flex flex-col items-center justify-center flex-1 h-full"
                >
                  <Icon className={`w-6 h-6 mb-1 ${active ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <span className={`text-xs ${active ? 'text-indigo-600 font-semibold' : 'text-gray-600'}`}>
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
