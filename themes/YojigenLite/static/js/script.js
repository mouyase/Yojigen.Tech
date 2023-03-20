const config = window.hugoConfig

const setImageSrcset = () => {
    const gif = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    let images = document.getElementsByTagName('img')
    for (let i = 0; i < images.length; i++) {
        let image = images[i]
        if (`${image.className}`.indexOf('loading') !== -1) {
            if (image.attributes['data-srcset']) {
                if (`${window.location.host}`.indexOf("localhost") === -1 && !!config.cdn) {
                    image.srcset = `//${config.cdn}${image.attributes['data-srcset'].textContent}`
                } else {
                    image.srcset = image.attributes['data-srcset'].textContent
                }
                let isNotLoad = false
                const onNotLoad = () => {
                    isNotLoad = true
                    image.src = gif
                    image.srcset = gif
                }
                image.onload = () => {
                    if (!isNotLoad) {
                        image.classList.remove('loading')
                        image.classList.add('loaded')
                    }
                }
                image.onerror = onNotLoad
                image.onabort = onNotLoad
            }
        }
    }
}

const loadScript = (url, cb, isMoudule) => {
    let script = document.createElement('script');
    script.src = url;
    if (cb) script.onload = cb;
    if (isMoudule) script.type = 'module';
    script.async = true;
    document.body.appendChild(script);
}

const loadCss = (url, cb) => {
    let css = document.createElement('link');
    css.rel = 'stylesheet';
    css.type = 'text/css'
    css.href = url;
    if (cb) css.onload = cb;
    document.getElementsByTagName('head')[0].appendChild(css);
}

const init = () => {
    setImageSrcset()
    if (config.baiduhm) {
        loadScript(`https://hm.baidu.com/hm.js?${config.baiduhm}`)
    }
    if (config.disqusjs) {
        loadScript('/libs/disqus/disqusjs.js', () => {
            const disqusDiv = document.getElementById('disqus_thread')
            if (disqusDiv) {
                const disqusjs = new DisqusJS({
                    shortname: config.disqusjs.shortname,
                    siteName: config.disqusjs.siteName,
                    identifier: document.location.pathname + document.location.search,
                    url: document.location.origin + document.location.pathname + document.location.search,
                    title: document.title,
                    api: config.disqusjs.api,
                    apikey: config.disqusjs.apikey,
                    admin: config.disqusjs.admin,
                    adminLabel: config.disqusjs.adminLabel,
                });
                disqusjs.render(disqusDiv);
            }
        })
        loadCss('/libs/disqus/disqusjs.css')
    }
}

window.onload = () => {
    setTimeout(() => {
        init()
    }, 0)
}