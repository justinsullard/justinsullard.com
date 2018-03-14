(() => {
    const $w = window;

    let El;
    let render;

    const emit = (t, d) => $w.dispatchEvent(new CustomEvent(t, { detail: d }));
    const addEv = (e, k, v) => e.addEventListener(k, v);

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
    const renderFields = (thing) => fields.filter(([field]) => has(thing, field)).map(([field, t]) => {
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

    const renderPage = ({ detail }) => {
        const $d = $w.document;
        const $j = $d.getElementById('json-ld');
        const $m = $d.querySelector('main');
        $m.setAttribute('data-id', detail['@id']);
        $d.title = `${detail.name} - justinsullard.com`;
        const next = renderThing(detail);
        render($d, $m, next);
        $j.text = JSON.stringify(detail);
    };

    setTimeout(() => emit('jss-vdom', (vdom) => {
        El = vdom.El;
        render = vdom.render;
    }), 0);
    addEv($w, 'jss-render', renderPage);
})();
