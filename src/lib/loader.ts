import { basenameFromUrl, ready, toTagName } from "./utils";


const mapLinkedComponents = (links: Element[]) => {
    const componentsMap = new Map<string, string>()
    links.forEach(link => {
        const url = link.getAttribute('href') as string
        const explicit = link.getAttribute('data-name') || link.getAttribute('name')
        const base = explicit || basenameFromUrl(url)
        const name = toTagName(base)
        componentsMap.set(name as string, url)
    })
    return componentsMap
}

const loadComponent = async (url: string) => {
    const res = await fetch(url, { credentials: 'same-origin' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()
    return html
}

const getHtmlAndScripts = (html: string) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    const scripts = Array.from(doc.querySelectorAll('script'))
    scripts.forEach(script => script.remove());
    return {
        html: doc.body.innerHTML,
        scripts: scripts.map(script => script.textContent)
    }
}

const defineComponent = (name: string, html: string, scripts: string[]) => {
    if (!customElements.get(name)) {
        customElements.define(
        name,
        class extends HTMLElement {
            constructor() {
            super()
            this.innerHTML = html
            scripts.forEach(script => {
                const scriptElement = document.createElement('script')
                scriptElement.textContent = script
                document.body.appendChild(scriptElement)
            })
            }
        }
        )
    }
}

ready(async () => {
    const links = Array.from(
        document.head.querySelectorAll('link[rel="component"][href]')
    )

    if (!links.length) return

    const componentsMap = mapLinkedComponents(links)
    componentsMap.forEach(async (url: string, name: string) => {
        try {
            const htmlContent = await loadComponent(url)

            const { html, scripts } = getHtmlAndScripts(htmlContent)
            defineComponent(name, html, scripts)
        } catch (err) {
            console.error(`[component-loader] Failed to load ${url} as <${name}>:`, err)
        }
    })
})
