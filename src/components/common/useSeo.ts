import { useEffect } from "react";
export const SITE = "https://hourcap.app";
function meta(sel: string, attr: string, val: string, create: () => HTMLElement) {
  let el = document.head.querySelector<HTMLElement>(sel); if (!el) { el = create(); document.head.appendChild(el); } el.setAttribute(attr, val);
}
export function useSeo(o: { title: string; description: string; path: string; noindex?: boolean }) {
  useEffect(() => {
    document.title = o.title;
    const m = (n: string, v: string, p = false) => meta(`meta[${p ? "property" : "name"}="${n}"]`, "content", v, () => { const e = document.createElement("meta"); e.setAttribute(p ? "property" : "name", n); return e; });
    m("description", o.description); m("robots", o.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large");
    m("og:title", o.title, true); m("og:description", o.description, true); m("og:url", SITE + o.path, true);
    m("twitter:title", o.title); m("twitter:description", o.description);
    meta('link[rel="canonical"]', "href", SITE + o.path, () => { const e = document.createElement("link"); e.rel = "canonical"; return e; });
  }, [o.title, o.description, o.path, o.noindex]);
}
