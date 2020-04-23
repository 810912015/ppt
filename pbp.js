const pt=require("puppeteer")

function log(){
    console.log(new Date().toLocaleString(),arguments);
}

async function start(hl){
    //console.log(hl,hl||false)
    const browser=await pt.launch({headless:(hl||false)});
    const page=await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36")
    await page.setRequestInterception(true);
    await page.on('request',request=>{
        let url=request.url().toString();
        if(url.indexOf(".gif?")>-1){
            request.abort();
            return;
        }
        request.continue();
    }) 
    return {browser,page}
}

module.exports= {log,start}



