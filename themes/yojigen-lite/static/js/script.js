const setImageSrcset = () => {
    const gif = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    let images = document.getElementsByTagName('img')
    for (let i = 0; i < images.length; i++) {
        let image = images[i]
        if (`${image.className}`.indexOf('loading') !== -1) {
            if (image.attributes['data-srcset']) {
                image.srcset = image.attributes['data-srcset'].textContent.replace(/i\.imgur\.com/, 'image.yojigen.tech')
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

window.onload = () => {
    setTimeout(() => {
        setImageSrcset()
        loadScript('https://hm.baidu.com/hm.js?d3ff7ea286266918b251a247df20c5a9')
    }, 0)
}