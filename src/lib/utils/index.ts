export function parseStringToObject(str: string) {
  // First, convert unquoted keys to quoted keys
  let jsonStr = str.replace(/([{,])\s*(\w+)\s*:/g, '$1"$2":');

  // Then, convert single quotes to double quotes for string values
  jsonStr = jsonStr.replace(/'([^']*)'/g, '"$1"');

  return JSON.parse(jsonStr);
}

export function isEmptyObject(obj: Record<string, unknown>) {
  return Object.keys(obj).length === 0 || obj === null;
}

export const ready = (fn: () => void) =>
  document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', fn, { once: true })
  : fn()

export const basenameFromUrl = (url: string) => {
  const { pathname } = new URL(url, location.href)
  const last = pathname.substring(pathname.lastIndexOf('/') + 1).split(/[?#]/)[0]
  return last.replace(/\.[^.]+$/, '')
}

export const toTagName = (base: string) => {
  let tag = String(base || 'component')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-]+/g, '-') // normalize
    .replace(/^-+|-+$/g, '') // trim dashes
    .replace(/--+/g, '-') // collapse
  if (!tag.includes('-')) tag = `x-${tag}`
  return tag
}