const extensionUrl = {
    chrome: 'https://chromewebstore.google.com/detail/%E8%84%9A%E6%9C%AC%E7%8B%97/peoieokehoempafaofbiahjgeecfmmlb'
}

function isChrome() {
    return window.navigator.userAgent.indexOf('Chrome') > -1
}

function goDownloadPage() {
    window.open(extensionUrl.chrome, '_blank')
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