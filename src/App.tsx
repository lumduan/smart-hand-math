import { Route, Routes } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { Home } from '@/pages/Home'
import { Learn } from '@/pages/Learn'
import { Play } from '@/pages/Play'
import { useDocumentMeta } from '@/i18n/useDocumentMeta'

export default function App() {
  useDocumentMeta()
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/play" element={<Play />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  )
}
