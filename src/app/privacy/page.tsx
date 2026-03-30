import fs from 'fs'
import path from 'path'
import type { Metadata } from 'next'
import LegalPage from '@/app/components/LegalPage'
import LegalHeader from '@/app/components/LegalHeader'

export default function PrivacyPage() {
  const filePath = path.join(process.cwd(), 'src/content/legal/privacy.md')
  const content = fs.readFileSync(filePath, 'utf8')

  return (
    <>
      <LegalHeader title="개인정보처리방침" />
      <LegalPage title="개인정보처리방침" content={content} />
    </>
  )
}
