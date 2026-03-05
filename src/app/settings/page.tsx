'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar'
import { ChevronRight, User, Sparkles, Bell, Globe, HelpCircle, FileText, LogOut, UserX } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/app/components/ui/alert-dialog'
import { memberApi } from '@/lib/api'
import { useMemberStore } from '@/lib/store/member-store'

const settingsSections = [
  {
    title: '계정 관리',
    items: [
      { icon: User, label: '내 프로필 편집', path: '/profile-edit' },
      { icon: Sparkles, label: '스킨 프로필 설정', path: '/skin-profile-edit' },
    ],
  },
  {
    title: '앱 설정',
    items: [
      { icon: Bell, label: '알림 설정', path: '/notification-settings' },
      { icon: Globe, label: '언어 설정', path: '/language-settings', value: '한국어' },
    ],
  },
  {
    title: '고객 지원',
    items: [
      { icon: HelpCircle, label: 'FAQ', path: '/faq' },
      { icon: FileText, label: '1:1 문의', path: '/contact' },
      { icon: FileText, label: '공지사항', path: '/notices', badge: 'N' },
    ],
  },
  {
    title: '약관 및 정책',
    items: [
      { icon: FileText, label: '이용약관', path: '/terms' },
      { icon: FileText, label: '개인정보처리방침', path: '/privacy' },
    ],
  },
]

export default function SettingsPage() {
  const router = useRouter()
  const { member, isLoaded, fetchMember, clearMember } = useMemberStore()

  useEffect(() => {
    if (!isLoaded) {
      fetchMember()
    }
  }, [isLoaded, fetchMember])

  const handleLogout = async () => {
    try {
      await memberApi.logout()
    } finally {
      clearMember()
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 프로필 헤더 */}
      <div className="px-5 pt-8 pb-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            {member?.profileImage && <AvatarImage src={member.profileImage} alt="프로필 이미지" className="object-cover" />}
            <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-xl font-bold">
              {member?.nickname?.[0] ?? '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{member?.nickname ?? ''}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{member?.emailAddress ?? ''}</p>
          </div>
        </div>
      </div>

      {/* 설정 섹션 */}
      <div className="pb-10">
        {settingsSections.map((section, sIdx) => (
          <div key={sIdx} className="mt-6">
            <div className="px-5 pb-1.5">
              <span className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                {section.title}
              </span>
            </div>
            <div className="border-t border-gray-100">
              {section.items.map((item, iIdx) => {
                const Icon = item.icon
                return (
                  <button
                    key={iIdx}
                    onClick={() => router.push(item.path)}
                    className="w-full px-5 py-4 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100"
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-gray-500" />
                    </div>
                    <span className="flex-1 text-left font-medium text-gray-900">{item.label}</span>
                    {(item as any).badge && (
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-1 min-w-[18px] text-center">
                        {(item as any).badge}
                      </span>
                    )}
                    {(item as any).value && (
                      <span className="text-sm text-gray-400 mr-1">{(item as any).value}</span>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* 계정 액션 */}
        <div className="mt-8 px-5 pt-4 border-t border-gray-100 space-y-1">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="w-full flex items-center gap-3 py-3 text-gray-600 hover:text-gray-900 transition-colors">
                <LogOut className="w-4 h-4" />
                <span className="font-medium">로그아웃</span>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>로그아웃</AlertDialogTitle>
                <AlertDialogDescription>로그아웃하시겠습니까?</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>로그아웃</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="w-full flex items-center gap-3 py-3 text-rose-500 hover:text-rose-600 transition-colors">
                <UserX className="w-4 h-4" />
                <span className="font-medium">회원탈퇴</span>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>회원탈퇴</AlertDialogTitle>
                <AlertDialogDescription>
                  정말 탈퇴하시겠습니까?<br />
                  이 작업은 되돌릴 수 없습니다.
                  <br /><br />
                  • 저장된 모든 분석 데이터가 삭제됩니다
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={async () => {
                    try {
                      await memberApi.withdraw()
                    } finally {
                      clearMember()
                      router.push('/login')
                    }
                  }}
                >
                  탈퇴하기
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
