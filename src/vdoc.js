(() => {
    const $w = window;
    const addEv = (e, k, v) => e.addEventListener(k, v);

    const MUST_CLOSE = ['script'];
    const NO_CLOSE = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
    const HTML_REG = /["'&<>]/g;
    const HTML_ENT = { 34: '&quot;', 38: '&amp;', 39: '&#39;', 60: '&lt;', 62: '&gt;' };
    const escape = (str) => HTML_REG.test(str) ? str.replace(HTML_REG, (c) => HTML_ENT[c.charCodeAt(0)] || c) : str;
    const BOOL = ['allowFullScreen', 'async', 'autofocus', 'autoplay', 'checked', 'controls', 'defer', 'disabled', 'formNoValidate', 'hidden', 'loop', 'multiple', 'muted', 'noValidate', 'readOnly', 'required', 'seamless', 'selected', 'itemScope'];
    const BOOL_FORCE = ['download'];

    const Element = (type) => {
        const tag = `${type}`.toLowerCase();
        const tagName = tag.toUpperCase();
        const no_close = NO_CLOSE.includes(tag);
        const must_close = MUST_CLOSE.includes(tag);
        const props = {};
        const children = [];
        let parent = null;
        const el = Object.freeze({
            render() {
                let ret = `<${tag}`;
                ret += Object.keys(props).map((k) => {
                    const v = props[k];
                    const h = ` ${escape(k)}`;
                    if (BOOL.includes(k)) { return v ? h : ''; }
                    if (BOOL_FORCE.includes(k)) { return `${h}="${v ? 'true' : 'false'}"`; }
                    return `${h}="${escape(v)}"`;
                }).join('');
                if (no_close) {
                    ret += '>';
                } else if (children.length) {
                    ret += `>${children.map((c) => c.render()).join('')}</${tag}>`;
                } else if (must_close) {
                    ret += `></${tag}>`;
                } else {
                    ret += '/>';
                }
                return ret;
            },
            setAttribute(k, v) { props[k] = v; },
            getAttribute(k) { return props[k]; },
            removeAttribute(k) { props[k] = undefined; },
            appendChild(c) {
                if (!no_close) {
                    children.push(c);
                    c.parent = el;
                }
            },
            replaceChild: (n, o) => {
                const i = children.indexOf(o);
                if (i < 0) { return; }
                children.splice(i, 1, n);
                o.parent = null;
                n.parent = el;
            },
            get tagName() { return tagName; },
            get parent() { return parent; },
            set parent(p) { return parent = p; },
            get lastChild() { return children[children.length - 1]; },
            get childNodes() { return [...children]; },
            get innerText() { return ''; },
            set innerText(t) { return t === '' ? this.empty() : t; },
            empty: () => children.splice(0, children.length)
        });
        return el;
    };

    const Text = (t) => Object.freeze({ render() { return t; } });

    const Doc = (dt = '') => {
        const $html = Element('html');
        const $head = Element('head');
        const $title = Element('title');
        const $body = Element('body');
        let title = dt;
        $title.appendChild(Text(title));
        $html.appendChild($head);
        $head.appendChild($title);
        $html.appendChild($body);
        const query = (q) => {
            const r = $body.childNodes.filter((c) => c.tagName.toLowerCase().includes(q))[0];
            return r;
        };
        const get = (id) => {
            const r = $body.childNodes.filter((c) => c.getAttribute('id') === id)[0];
            return r;
        };
        return Object.freeze({
            render: () => `<!DOCTYPE html>${$html.render()}`,
            get body() { return $body; },
            get head() { return $head; },
            get title() { return title; },
            set title(t) {
                title = t;
                $title.empty();
                $title.appendChild(Text(title));
            },
            createTextNode: (t) => Text(t),
            createElement: (t) => Element(t),
            createElementNS: (ns, t) => Element(t, ns),
            querySelector: (q) => query(q),
            getElementById: (id) => get(id)
        });
    };

    addEv($w, 'jss-vdoc', ({ detail }) => {
        detail(Doc);
    });
})();