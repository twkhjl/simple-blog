export function extractStaticBodyHtml(rawHtml: string) {
  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser()
    const doc = parser.parseFromString(rawHtml, 'text/html')

    doc.querySelectorAll('script').forEach(script => script.remove())

    return doc.body.innerHTML.trim()
  }

  const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const bodyHtml = bodyMatch?.[1] ?? rawHtml

  return bodyHtml.replace(/<script[\s\S]*?<\/script>/gi, '').trim()
}
