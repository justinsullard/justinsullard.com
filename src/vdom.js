(() => {
    const $w = window;
    const addEv = (e, k, v) => e.addEventListener(k, v);

    const defd = (x) => x !== null && x !== undefined;

    const flatten = (arr) => {
        const flat = [].concat(arr);
        for (let i = 0; i < flat.length; i++) {
            if (Array.isArray(flat[i])) { flat.splice(i, 1, ...flat[i--]); }
        }
        return flat.filter(defd);
    };

    const El = (type, props = {}, ...children) => ({ type, props, children: flatten(children) });

    const isEvProp = (k) => /^on/.test(k);
    const isBool = (v) => typeof v === 'boolean';

    const sProp = (el, k, v) => {
        const ev = isEvProp(k);
        if (isBool(v)) { return el[k] = Boolean(v); }
        if (!ev) { el.setAttribute(k, v); }
        return el[k] = v;
    };

    const dProp = (el, k, v) => {
        if (isEvProp(k)) { el[k] = null; }
        el.removeAttribute(k);
        if (isBool(v)) { el[k] = Boolean(v); }
    };

    const sProps = (el, p = {}) => {
        for (const k in p) { sProp(el, k, p[k]); }
    };

    const uProp = (el, name, newVal, oldVal) => {
        if (!defd(newVal) || isBool(newVal) && !newVal) {
            dProp(el, name, oldVal);
        } else if (!defd(oldVal) || isBool(oldVal) && !oldVal || newVal !== oldVal) {
            sProp(el, name, newVal);
        }
    };

    const uProps = (el, n, o = {}) => {
        const m = Object.assign({}, n, o);
        for (const k in m) { uProp(el, k, n[k], o[k]); }
    };

    const SVGNS = 'http://www.w3.org/2000/svg';
    const HTMLNS = 'http://www.w3.org/1999/xhtml';
    const namespaces = { svg: SVGNS, foreignObject: HTMLNS };
    const createElement = (doc, n, pns = HTMLNS) => {
        if (typeof n === 'string') { return doc.createTextNode(n); }
        const { type } = n;
        const { props = {}, children = [] } = n;
        const ns = namespaces[type] || pns;
        const el = doc.createElementNS(ns, type);
        sProps(el, props);
        const l = children.length;
        for (let i = 0; i < l; i++) {
            el.appendChild(createElement(doc, children[i], ns));
        }
        return el;
    };

    const changed = (a, b) => typeof a !== typeof b || typeof a === 'string' && a !== b || a.type !== b.type;

    const render = (doc, p, n, o, i = 0) => {
        if (i === 0 && !defd(o)) { p.innerText = ''; }
        if (!defd(p)) { throw new Error('No parent element provided to render'); }
        const ns = p.namespaceURI || HTMLNS;
        if (!defd(o)) { return p.appendChild(createElement(doc, n, ns)); }
        if (!defd(n)) { return p.lastChild.remove(); }
        if (changed(n, o)) { return p.replaceChild(createElement(doc, n, ns), p.childNodes[i]); }
        if (typeof n !== 'string' && n.type) {
            uProps(p.childNodes[i], n.props, o.props);
            const l = Math.max(n.children.length, o.children.length);
            for (let j = 0; j < l; j++) {
                render(doc, p.childNodes[i], n.children[j], o.children[j], j);
            }
        }
        return p;
    };

    addEv($w, 'jss-vdom', ({ detail }) => detail({ render, El }));
})();
