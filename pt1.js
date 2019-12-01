const puppeteer = require('puppeteer');


(async () => {
    const sourceUrl = [
        "http://localhost:3000"
    ]

    function log() {
        console.log(new Date().toLocaleString(), arguments)
    }

    const pathToExtension=require('path').join(__dirname,'ext');
    const browser = await puppeteer.launch(
        {
            headless: false,
            args:[
                `--disable-extensions-except=${pathToExtension}`,
                `--load-extension=${pathToExtension}`
            ],
            slowMo: 250,

            defaultViewport: {
                width: 1300,
                height: 900
            },
            devTools:false
        });

    
    const page = await browser.newPage();
    page.setDefaultTimeout(35000)
   
    page.on('console', async msg => {
        if (msg.text() === 'begin') {
            await cs();
            await closeOther();

        }else if(msg.text()==='click'){
           log(msg)

        } else {
            log('IN--', msg.text())
        }

    });

    await page.goto(sourceUrl[0], {});

    log("开始等待加载文档");

    async function waitReady(msg) {
        const selector = '#tb';
        await page.waitFor(selector => !!document.querySelector(selector), {}, selector);
        log("加载完毕:" + (msg | ''))
    }

    await waitReady("文档")

    const c = await page.evaluate(() =>
     document.querySelector('#content').innerText);
     
   
    await page.type("#tb",c)
    
    const fileInput =await page.$("#inputFile")
    await fileInput.uploadFile("/home/zxf/lawfiles2/360kr项目要点.txt")

    await page.tap("#upload")
    log("done")
    await page.waitFor(5000);
    await browser.close();
})();
