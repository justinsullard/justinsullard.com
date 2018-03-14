(() => {
    const $w = window;
    const $d = $w.document;
    const data = {};
    const emit = (t, d) => $w.dispatchEvent(new CustomEvent(t, { detail: d }));
    const addEv = (e, k, v) => e.addEventListener(k, v);
    const route = (href) => {
        const detail = data[href];
        emit('jss-render', detail);
        history.pushState({
            main: detail,
            title: $d.title
        }, $d.title, `${$w.location.origin}${detail.url}`);
    };
    const load = (href) => {
        if (data[href]) {
            route(href);
        } else {
            fetch(href).then((res) => res.json()).then((json) => {
                data[href] = json;
                route(href);
            });
        }
    };
    if (!history.state) {
        const tmp = $d.getElementById('json-ld').text;
        history.replaceState({
            main: JSON.parse(tmp),
            title: $d.title
        }, $d.title, $w.location.href);
    }
    addEv($w.document, 'click', (e) => {
        const t = e.target;
        if (`${t.tagName}`.toLowerCase() !== 'a') { return; }
        const href = t.getAttribute('href');
        if (href[0] !== '/') { return; }
        e.preventDefault();
        // load(`${href === '/' ? 'index' : href}.json`);
        load(`${href}index.json`);
    });
    addEv($w, 'popstate', ({ state }) => {
        if (!state) { return; }
        console.log('popstate', state);
        emit('jss-render', state.main);
    });
})();