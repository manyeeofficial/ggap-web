'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar'
import { ArrowLeft, Camera } from 'lucide-react'
import { memberApi } from '@/lib/api'
import { useMemberStore } from '@/lib/store/member-store'
import { toast } from 'sonner'

export default function ProfileEditPage() {
  const router = useRouter()
  const { member, isLoaded, fetchMember, updateMember } = useMemberStore()
  const [nickname, setNickname] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER' | ''>('')
  const [isLoading, setIsLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isImageLoading, setIsImageLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isLoaded) {
      fetchMember()
    }
  }, [isLoaded, fetchMember])

  useEffect(() => {
    if (member) {
      setNickname(member.nickname)
      setPhone(member.phoneNumber.replace(/^\+\d+-/, ''))
      if (member.profileImage) {
        setPreviewUrl(member.profileImage)
      }
      if (member.birthYear) setBirthYear(String(member.birthYear))
      if (member.gender) setGender(member.gender)
    }
  }, [member])

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)
    setIsImageLoading(true)
    try {
      const updated = await memberApi.updateProfileImage(file)
      updateMember(updated)
      URL.revokeObjectURL(localUrl)
      setPreviewUrl(updated.profileImage ?? null)
      toast.success('프로필 이미지가 변경되었습니다.')
    } catch (err: any) {
      URL.revokeObjectURL(localUrl)
      setPreviewUrl(member?.profileImage ?? null)
      toast.error(err.response?.data?.message || '이미지 업로드에 실패했습니다.')
    } finally {
      setIsImageLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    if (!nickname.trim()) {
      toast.error('닉네임을 입력해주세요.')
      return
    }
    if (!password) {
      toast.error('비밀번호를 입력해주세요.')
      return
    }

    setIsLoading(true)
    try {
      const updated = await memberApi.updateProfile({
        nickname: nickname.trim(),
        phoneNumber: phone,
        emailAddress: member?.emailAddress ?? '',
        password,
        birthYear: birthYear ? Number(birthYear) : undefined,
        gender: gender || undefined,
      })
      updateMember(updated)
      toast.success('프로필이 저장되었습니다.')
      router.back()
    } catch (err: any) {
      toast.error(err.response?.data?.message || '저장에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-2 flex items-center justify-between">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">프로필 편집</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Profile Image */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <Avatar className="w-24 h-24">
              {previewUrl && <AvatarImage src={previewUrl} alt="프로필 이미지" className="object-cover" />}
              <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-3xl">
                {nickname[0] ?? '?'}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImageLoading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg disabled:opacity-50"
            >
              {isImageLoading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Camera className="w-4 h-4 text-white" />
              }
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-3">프로필 이미지 변경</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={handleImageSelect}
          />
        </div>

        {/* Form Fields */}
        <div className="space-y-5">
          <div>
            <Label htmlFor="nickname">닉네임</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="mt-2 h-12"
              placeholder="닉네임 (2-16자)"
              maxLength={16}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">{nickname.length}/16</p>
          </div>

          <div>
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              value={member?.emailAddress ?? ''}
              disabled
              className="mt-2 h-12 bg-gray-100 text-gray-500"
            />
          </div>

          <div>
            <Label htmlFor="phone">전화번호</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2 h-12"
              placeholder="01012345678"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="birthYear">출생년도</Label>
            <Input
              id="birthYear"
              type="number"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              className="mt-2 h-12"
              placeholder="예: 1995"
              min={1900}
              max={new Date().getFullYear()}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label>성별</Label>
            <div className="flex gap-2 mt-2">
              {([
                { value: 'MALE', label: '남성' },
                { value: 'FEMALE', label: '여성' },
                { value: 'OTHER', label: '기타' },
              ] as const).map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setGender(gender === item.value ? '' : item.value)}
                  disabled={isLoading}
                  className={`flex-1 h-12 rounded-lg border text-sm font-medium transition-colors ${
                    gender === item.value
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 h-12"
              placeholder="현재 비밀번호를 입력해주세요"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Bottom Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t">
        <Button
          onClick={handleSave}
          className="w-full h-12 bg-indigo-600 hover:bg-indigo-700"
          disabled={isLoading}
        >
          {isLoading ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  )
}
