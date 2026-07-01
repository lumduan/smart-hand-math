import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { useDocumentMeta } from '@/i18n/useDocumentMeta'

// Lazy-loaded routes (code-split per page). Named exports need the `.default` shim.
const Home = lazy(() => import('@/pages/Home').then((m) => ({ default: m.Home })))
const Learn = lazy(() => import('@/pages/Learn').then((m) => ({ default: m.Learn })))
const Play = lazy(() => import('@/pages/Play').then((m) => ({ default: m.Play })))
const Lessons = lazy(() => import('@/pages/Lessons').then((m) => ({ default: m.Lessons })))
const LessonRunner = lazy(() => import('@/pages/LessonRunner').then((m) => ({ default: m.LessonRunner })))

export default function App() {
  useDocumentMeta()
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/play" element={<Play />} />
        <Route path="/lessons" element={<Lessons />} />
        <Route path="/lessons/:lessonId" element={<LessonRunner />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  )
}
