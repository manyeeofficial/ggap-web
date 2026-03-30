import fs from 'fs'
import path from 'path'
import type { Metadata } from 'next'
import LegalPage from '@/app/components/LegalPage'
import LegalHeader from '@/app/components/LegalHeader'

export default function TermsPage() {
  const filePath = path.join(process.cwd(), 'src/content/legal/terms.md')
  const content = fs.readFileSync(filePath, 'utf8')

  return (
    <>
      <LegalHeader title="이용약관" />
      <LegalPage title="이용약관" content={content} />
    </>
  )
}
