const fs = require('fs');
const path = require('path');

const data_path = path.join(__dirname, '../data');

require('./vdoc');
require('./vdom');
require('./renderer');

const style = ($d, href) => {
    const $link = $d.createElement('link');
    $link.setAttribute('rel', 'stylesheet');
    $link.setAttribute('href', href);
    $d.head.appendChild($link);
};

const data = ($d, id, json, type = 'application/json') => {
    const $script = $d.createElement('script');
    $script.setAttribute('type', type);
    $script.setAttribute('id', id);
    $script.appendChild($d.createTextNode(json));
    $d.body.appendChild($script);
};

const script = ($d, src) => {
    const id = src.replace(/\W/g, '-').slice(1);
    const $script = $d.createElement('script');
    $script.setAttribute('src', src);
    $script.setAttribute('id', id);
    $script.setAttribute('async', true);
    $d.body.appendChild($script);
};

const Header = (El) => El('header', {},
    El('h1', {},
        El('a', { href: '/' }, 'justinsullard.com'))
);
const Footer = (El) => El('footer', {},
    // El('a', { href: '/' }, 'https://justinsullard.com')
    El('strong', {}, '"I seem to be a function."')
);

const Nav = (El, files) => El('nav', {},
    ...files.filter(
        (f) => !f.includes('index.json')
    ).map(
        (f) => f.replace(data_path, '').replace(/\.json$/, '')
    ).filter(
        (f) => !f.match(/^\/.*\/.*$/)
    ).map(
        (f) => El('a', { href: `${f}/` }, f.replace(/\W+/g, ' ').trim())
    ),
    El('a', { href: 'mailto:justin@justinsullard.com' }, 'email')
);

let $d = null;

const Page = (pth, files) => new Promise((resolve) => {
    const sequence = [
        new Promise((detail) => {
            window.dispatchEvent(new CustomEvent('jss-vdoc', { detail }));
        }),
        new Promise((detail) => {
            window.dispatchEvent(new CustomEvent('jss-vdom', { detail }));
        })
    ];
    Promise.all(sequence.filter(Boolean)).then(([Doc, vdom]) => {
        if (!$d) {
            $d = Doc();
            window.document = $d;
        }
        const { render, El } = vdom;
        fs.readFile(pth, (e, src) => {
            if (e) {
                console.error('Boohoo', e);
                return;
            }
            const detail = JSON.parse(src);
            const json = JSON.stringify(detail);
            $d.head.empty();
            $d.body.empty();
            $d.title = `${detail.name} - justinsullard.com`;
            style($d, '/index.css');
            [
                Header(El),
                Nav(El, files),
                El('hr'),
                El('main'),
                Footer(El)
            ].forEach((el, i) => render($d, $d.body, el, null, i));

            data($d, 'json-ld', json, 'application/ld+json');
            script($d, '/vdom.js');
            script($d, '/renderer.js');
            script($d, '/router.js');
            window.dispatchEvent(new CustomEvent('jss-render', { detail }));
            resolve({
                dest: pth.replace(data_path, '').replace(/\.\w+$/, '/index').replace(/^\/index\/index$/, '/index'),
                // dest: pth.replace(data_path, '').replace(/\.json$/, ''),
                pth,
                json,
                html: $d.render()
            });
        });
    });
});

require('./vdoc');

require('./vdom');

module.exports = Page;
