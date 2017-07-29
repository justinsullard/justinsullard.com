(() => {
    const $w = window;
    const $d = document;
    const $ = $d.querySelector.bind($d);
    const $b = $d.body;
    const $j = $d.getElementById('json-ld');

    const defd = (x) => x !== null && x !== undefined;

    const flatten = (arr) => {
        const flat = [].concat(arr);
        for (let i = 0; i < flat.length; i++) {
            if (Array.isArray(flat[i])) { flat.splice(i, 1, ...flat[i--]); }
        }
        return flat.filter(defd);
    };

    const El = (type, props = {}, ...children) => ({ type, props, children: flatten(children) });

    const sBoolProp = (el, k, v) => {
        if (v) {
            el.setAttribute(k, v);
            return el[k] = true;
        }
        el[k] = false;
    };

    const dBoolProp = (el, k) => el[k] = false;

    const EV_REGEX = /^on/;
    const isEvProp = (k) => EV_REGEX.test(k);

    const sProp = (el, k, v) => {
        if (isEvProp(k)) { return el[k] = v; }
        if (typeof v === 'boolean') { return sBoolProp(el, k, v); }
        el.setAttribute(k, v);
        if (k === 'value') { el[k] = v; }
    };

    const dProp = (el, k, v) => {
        if (isEvProp(k)) { return el[k] = null; }
        el.removeAttribute(k);
        if (typeof v === 'boolean') { dBoolProp(el, k); }
    };

    const sProps = (el, p = {}) => {
        for (const k in p) { sProp(el, k, p[k]); }
    };

    const uProp = (el, name, newVal, oldVal) => {
        if (!defd(newVal) || typeof newVal === 'boolean' && !newVal) { return dProp(el, name, oldVal); }
        if (!defd(oldVal) || typeof oldVal === 'boolean' && !oldVal || newVal !== oldVal) { sProp(el, name, newVal); }
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

    const emit = (t, d) => $w.dispatchEvent(new CustomEvent(t, { detail: d }));
    const addEv = (e, k, v) => e.addEventListener(k, v);
    const route = (href) => emit('jss-page', href);

    const load = (href) => {
        const $s = document.createElement('script');
        sProp($s, 'async', true);
        sProp($s, 'src', `${href}.js`);
        sProp($s, 'data-script', `${href}`);
        sProp($s, 'onload', () => route(href));
        $b.appendChild($s);
    };
    addEv($d, 'click', (e) => {
        const t = e.target;
        if (`${t.tagName}`.toLowerCase() !== 'a') { return; }
        const href = t.getAttribute('href');
        if (href[0] !== '/') { return; }
        e.preventDefault();
        ($(`[data-script="${href}"]`) ? route : load)(href);
    });

    const merge = (...x) => Object.assign({}, ...x);
    const has = (x, y) => Object.prototype.hasOwnProperty.apply(x, [y]);

    const MD = {
        '#': (x) => El(`h${x.indexOf(' ')}`, {}, x.replace(/^#+ /, '')),
        '*': (x) => El(x[0] === '*' ? 'ul' : 'ol', {},
                x.split('\n').map((y) => El('li', {}, y.slice(y.indexOf(' '))))
            ),
        '_': (x) => El('p', {}, x)
    };
    MD['1'] = MD['*'];

    const meta = (x) => ({ itemprop: x, property: x });
    const md = (field, value) => El('section', meta(field),
        value.split(/\n\n+/).map((x) => (MD[x[0]] || MD._)(x)));
    const img = (field, src) => El('img', merge(meta(field), { src: src }));
    const link = (field, href) => El('a', merge(meta(field), { href: href}, href[0] !== '/' ? { target: '_blank' } : {}), href);
    const date = () => El('code', meta(field), date);
    const fields = [
        ['name', 'h2'],
        ['alternateName', 'h3'],
        ['headline', 'h3'],
        ['alternativeHeadline', 'h4'],
        ['disambiguationDescription', 'p'],
        ['image', img],
        ['dateCreated', date],
        ['dateModified', date],
        ['datePublished', date],
        ['description', md],
        ['codeRepository', link],
        ['programmingLanaguage', 'p'],
        ['text', md],
        ['comment', 'blockquote'],
        ['keywords', link]
    ];
    const isFunc = (x) => typeof x === 'function';
    const renderFields = (thing) => fields.map(([field, t]) => {
        if (!has(thing, field)) { return; }
        const v = thing[field];
        const f = isFunc(t) ? (x) => t(field, x) : (x) => El(t, meta(field), x);
        return Array.isArray(v) ? v.map(f) : f(v);
    });
    const renderThing = (thing) => El('article', {
        itemscope: true,
        'data-id': thing['@id'],
        itemtype: `${thing['@context']}${thing['@type']}`,
        vocab: thing['@context'],
        typeof: thing['@type']
    },
    ...renderFields(thing)
    );

    let last = null;
    const renderPage = ({ detail }, skip) => {
        const $m = $d.querySelector('main');
        sProp($m, 'data-id', detail['@id']);
        $d.title = `${detail.name} - justinsullard.com`;
        const next = renderThing(detail);
        render($d, $m, next, last);
        console.log('renderPage', { last, next });
        last = next;
        $j.text = JSON.stringify(detail);
        if (skip === true) { return; }
        history.pushState({
            main: { detail },
            title: $d.title,
            json: $j.text
        }, $d.title, `${$w.location.origin}${detail.url}`);
    };
    addEv($w, 'jss-render', renderPage);
    addEv($w, 'popstate', ({ state }) => {
        if (!state) { return; }
        renderPage(state.main, true);
    });

    const url = '/';
    const data = {
        "@id": url,
        "@context": "http://schema.org/",
        "@type": "Person",
        "name": "Justin Sullard",
        "disambiguationDescription": "Father. Husband. Musician. Developer. Thinker.",
        "description": "Hello, and welcome to my website.\n\nThis website, just like myself, is a perpetual work in progress. I intend on keeping it in perpetual beta forever, or will die trying.\n\nTake a look around, bookmark it, check back periodically, drop me a line, let me know what you think.\n\nAnywho, that's enough of my blabbering, get on with your browsing.",
        "image": "/image.svg",
        "potentialAction": [
            "ReviewAction",
            "ListenAction",
            "ReadAction",
            "CommunicatAction"
        ],
        "url": url,
        "mainEntityOfPage": url,
        "givenName": "Justin",
        "familyName": "Sullard",
        "email": "justin@justinsullard.com",
        "birthDate": "1983-01-01T06:28:00.000Z",
        "gender": "http://schema.org/Male"
    };
    if (!history.state) {
        history.replaceState({
            main: { detail: data },
            title: $d.title,
            json: $j.text
        }, $d.title, $w.location.href);
    }
    addEv($w, 'jss-page', ({ detail }) => {
        if (detail !== url || $('main').getAttribute('data-id') === url) { return; }
        emit('jss-render', Object.freeze(data));
    });
})();
