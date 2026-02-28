'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-2 flex items-center justify-between">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">개인정보처리방침</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-lg prose prose-sm max-w-none">
          <h2>1. 개인정보의 수집 및 이용 목적</h2>
          <p>ㅇㄱㄱ(이하 "회사")은 다음의 목적을 위하여 개인정보를 처리합니다.</p>
          <ul>
            <li>회원 가입 및 관리</li>
            <li>서비스 제공 (얼굴 분석, 제품 추천)</li>
            <li>고객 상담 및 불만 처리</li>
            <li>마케팅 및 광고 활용 (동의 시)</li>
          </ul>

          <h2>2. 수집하는 개인정보 항목</h2>
          <p>회사는 다음과 같은 개인정보를 수집합니다.</p>

          <h3>필수 항목</h3>
          <ul>
            <li>이메일 주소</li>
            <li>비밀번호 (암호화 저장)</li>
            <li>닉네임</li>
            <li>출생년도</li>
            <li>성별</li>
            <li>얼굴 이미지 (분석 목적)</li>
          </ul>

          <h3>선택 항목</h3>
          <ul>
            <li>전화번호</li>
            <li>프로필 이미지</li>
            <li>피부 타입 및 고민 정보</li>
          </ul>

          <h3>자동 수집 항목</h3>
          <ul>
            <li>서비스 이용 기록</li>
            <li>접속 로그</li>
            <li>쿠키</li>
            <li>기기 정보</li>
          </ul>

          <h2>3. 개인정보의 보유 및 이용 기간</h2>
          <p>
            회사는 회원 탈퇴 시 또는 개인정보 수집 및 이용목적이 달성된 후에는
            해당 정보를 지체 없이 파기합니다. 단, 관련 법령에 의한 정보보유 사유가 있는 경우
            일정 기간 동안 보관합니다.
          </p>

          <h2>4. 개인정보의 파기 절차 및 방법</h2>
          <p>
            회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는
            지체없이 해당 개인정보를 파기합니다.
          </p>
          <ul>
            <li>파기 절차: 불필요한 정보는 내부 방침에 따라 즉시 파기</li>
            <li>파기 방법: 전자적 파일 형태는 복구 불가능한 방법으로 삭제</li>
          </ul>

          <h2>5. 개인정보의 제3자 제공</h2>
          <p>
            회사는 원칙적으로 회원의 개인정보를 제3자에게 제공하지 않습니다.
            다만, 다음의 경우는 예외로 합니다.
          </p>
          <ul>
            <li>회원이 사전에 동의한 경우</li>
            <li>법령의 규정에 의거하거나 수사 목적으로 법령에 정해진 절차와 방법에 따라 요구가 있는 경우</li>
          </ul>

          <h2>6. 개인정보 처리의 위탁</h2>
          <p>회사는 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.</p>
          <table className="min-w-full border">
            <thead>
              <tr>
                <th className="border p-2">수탁업체</th>
                <th className="border p-2">위탁업무 내용</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">AWS</td>
                <td className="border p-2">데이터 저장 및 서버 관리</td>
              </tr>
              <tr>
                <td className="border p-2">Google</td>
                <td className="border p-2">AI 분석 (Gemini Vision API)</td>
              </tr>
            </tbody>
          </table>

          <h2>7. 정보주체의 권리·의무 및 행사방법</h2>
          <p>회원은 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다.</p>
          <ul>
            <li>개인정보 열람 요구</li>
            <li>개인정보 정정 요구</li>
            <li>개인정보 삭제 요구</li>
            <li>개인정보 처리정지 요구</li>
          </ul>

          <h2>8. 개인정보 보호책임자</h2>
          <p>
            회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고,
            개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제를 위하여
            아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
          </p>
          <ul>
            <li>개인정보 보호책임자: ㅇㄱㄱ 팀</li>
            <li>이메일: privacy@ggap.ai</li>
          </ul>

          <h2>9. 개인정보의 안전성 확보조치</h2>
          <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
          <ul>
            <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육</li>
            <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 암호화, 보안프로그램 설치</li>
            <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
          </ul>

          <h2>10. 개인정보처리방침의 변경</h2>
          <p>
            이 개인정보처리방침은 2026년 2월 9일부터 적용됩니다.
            법령, 정책 또는 보안기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 시에는
            변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
          </p>

          <p className="mt-8 text-gray-500">
            <strong>공고일자:</strong> 2026년 2월 9일<br />
            <strong>시행일자:</strong> 2026년 2월 9일
          </p>
        </div>
      </div>
    </div>
  )
}
