const extensionUrl = {
    chrome: 'https://chromewebstore.google.com/detail/kpilimchjedgnlefadbjcpknhnlgnhmp',
    edge: 'https://microsoftedge.microsoft.com/addons/detail/phpfefdnepkjdihobpdegfpnghnkcdka'
}

function isEdge() {
    return window.navigator.userAgent.toLowerCase().indexOf('edg') > -1
}

function goDownloadPage() {
    if(isEdge()){
        window.open(extensionUrl.edge, '_blank')
    }else{
        window.open(extensionUrl.chrome, '_blank')
    }
}

function installScript(url) {
    if (typeof dog === 'undefined') {
        goDownloadPage()
    } else {
        dog.installScript(url)
    }
}

document.querySelectorAll('a[download]').forEach(el => {
    el.addEventListener('mousedown', e => {
        e.preventDefault()
        const url = location.href.replace(location.pathname, '') + e.currentTarget.getAttribute('href')
        installScript(url)
    })
})