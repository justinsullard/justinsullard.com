console.time('build');

const addEventListener = (e, f) => process.on(e, f.detail || f);

const dispatchEvent = ({ e, d }) => process.emit(e, Object.assign({ type: e }, d));

class CustomEvent { constructor(e, d) { Object.assign(this, { e, d }); } }

Object.assign(global, { window: { addEventListener, dispatchEvent }, CustomEvent });

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const ensureDir = (targetDir) => {
    const initDir = path.isAbsolute(targetDir) ? '/' : '';
    targetDir.split('/').reduce((parentDir, childDir) => {
        const curDir = path.resolve(parentDir, childDir);
        if (!fs.existsSync(curDir)) {
            fs.mkdirSync(curDir);
        }
        return curDir;
    }, initDir);
};

const data = path.join(__dirname, '../data');
const src = path.join(__dirname, '../src');
const dist = path.join(__dirname, '../dist');
const img = path.join(__dirname, '../img');
const css = path.join(__dirname, '../css');
const misc = path.join(__dirname, '../misc');
// const icon = path.join(img, '/image.svg');

const dir = (p) => new Promise((resolve) => {
    fs.readdir(p, (e, list) => {
        const files = list.filter((f) => f.includes('.json'));
        const folders = list.filter((f) => !f.includes('.json'));
        Promise.all(folders.map((d) => dir(path.join(p, '/', d)))).then((F) => {
            resolve([].concat(files.map((f) => path.join(p, '/', f)), ...F));
        });
    });
});

const Page = require('./page');

exec(`rm -rf ${dist}/{*,.*}`, (m) => {
    console.log(`${dist} cleaned`, m);
    // process.exit();
    dir(data).then((files) => {
        files.forEach((p) => Page(p, files).then((page) => {
            // const { dest, pth, html, json } = page;
            const target = path.join(dist, page.dest);
            const folder = target.replace(/\/[^\/]+$/, '');
            ensureDir(folder);
            fs.writeFile(`${target}.html`, page.html, (e) => e && console.error(e));
            fs.writeFile(`${target}.json`, page.json, (e) => e && console.error(e));
            console.log('page', target, folder);
        }));
    });
    exec(`cp -a "${img}"/. ${dist}/`);
    exec(`cp -a "${css}"/. ${dist}/`);
    exec(`cp -a "${misc}"/. ${dist}/`);
    exec(`cp -a "${src}"/renderer.js ${dist}/`);
    exec(`cp -a "${src}"/vdom.js ${dist}/`);
    exec(`cp -a "${src}"/router.js ${dist}/`);
});

process.on('exit', () => console.timeEnd('build'));
