import { useEffect } from 'react'
import { useStrings } from './useStrings'

/**
 * Keep the document `<title>`, `<html lang>`, and the description `<meta>` in
 * sync with the active-locale strings. The static `index.html` values can't be
 * reached by React otherwise, so this effect updates them at runtime. Call once
 * near the root (e.g. in `App`).
 */
export function useDocumentMeta(): void {
  const t = useStrings()
  useEffect(() => {
    document.title = t.doc.title
    document.documentElement.lang = t.doc.lang
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', t.doc.description)
  }, [t.doc.title, t.doc.description, t.doc.lang])
}
