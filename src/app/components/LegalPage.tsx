import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

const components: Components = {
  h2: ({ children }) => (
    <h2 className="text-base font-bold text-gray-900 mt-8 mb-2 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-gray-800 mt-5 mb-1.5">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-sm text-gray-700 leading-relaxed mb-3">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside space-y-1 mb-3 text-sm text-gray-700">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside space-y-1 mb-3 text-sm text-gray-700">{children}</ol>
  ),
  li: ({ children }) => <li className="text-sm text-gray-700">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
  hr: () => <hr className="my-6 border-gray-200" />,
  table: ({ children }) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-600">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-gray-200 px-3 py-2 text-sm text-gray-700">{children}</td>
  ),
}

interface LegalPageProps {
  title: string
  content: string
}

export default function LegalPage({ title, content }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
