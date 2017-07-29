(() => {
    const url = '/code';
    const $main = document.querySelector('main');
    const data = {
        "@id": url,
        "@context": "http://schema.org/",
        "@type": "SoftwareSourceCode",
        "name": "Code",
        "description": "I like solving problems with software. As a result, I tend to write a lot of code. Most of it few people will ever see, save those that maintain it.\n\nHowever, I have several open source projects, and am getting more involved in the open source community.",
        "potentialAction": [
            "ReviewAction",
            "ListenAction",
            "ReadAction",
            "CommunicatAction"
        ],
        "url": url,
        "mainEntityOfPage": url,
        "codeRepository": "http://github.com/justinsullard"
    };
    window.addEventListener('jss-page', ({ detail }) => {
        if (detail !== url || $main.getAttribute('data-id') === url) { return; }
        window.dispatchEvent(new CustomEvent('jss-render', { detail: Object.freeze(data) }));
    });
})();
