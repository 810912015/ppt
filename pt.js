const puppeteer = require('puppeteer');


(async () => {
    const sourceUrl = [
        'https://wenshu.court.gov.cn/List/List?sorttype=1&conditions=searchWord+1++%E5%88%91%E4%BA%8B%E6%A1%88%E4%BB%B6+%E6%A1%88%E4%BB%B6%E7%B1%BB%E5%9E%8B:%E5%88%91%E4%BA%8B%E6%A1%88%E4%BB%B6',
        "https://wenshu.court.gov.cn/"
    ]

    function log() {
        console.log(new Date().toLocaleString(), arguments)
    }

    const pathToExtension=require('path').join(__dirname,'ext');
    const browser = await puppeteer.launch(
        {
            headless: true,
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

    // browser.on('targetchanged',t=>{
    //     log("tchanged")
    // })
    // let firstPage=true;
    // browser.on('targetcreated', async (t) => {
    //     if (t.type() !== 'page') return;
    //     if(firstPage){
    //         firstPage=false;
    //         return;
    //     }
    //     let p = await t.page();
    //     p.on('console', async msg => {
    //
    //         log('IN2--', msg.text())
    //
    //     });
    //     p.on('dialog', async (d) => {
    //         console.log(d.type())
    //         await d.accept();
    //     })
    //     log("tc", t.type(), t.url())
    // })
    const page = await browser.newPage();
    page.setDefaultTimeout(35000)

    async function closeOther() {
        let p = await page.browser().pages()
        if (p.length > 1) {
            for (let i = 0; i < p.length; i++) {
                if (p[i] !== page) {
                    p[i].close();
                }
            }
        }
    }

    async function cs(){
        let path="screen/"+new Date().getTime()
        let p=await browser.pages();
        for(let i=0;i<p.length;i++){
            let pi=path+"_"+i+'.png'
            await p[i].screenshot({path:pi,fullPage:true});
            log('screenshot',pi)
        }
    }
    page.on('console', async msg => {
        if (msg.text() === 'begin') {
            await cs();
            await closeOther();

        }else if(msg.text()==='click'){
            //page.waitForNavigation();
            // log('mc1')
            //
            // let url='https://wenshu.court.gov.cn/CreateContentJS/CreateListDocZip.aspx?action=1'
            // let nt=await browser.waitForTarget((t)=>t.url()===url,{timeout:120000});
            // let np=await nt.page();
            // log('mc3',nt.url())
            // await np.mouse.click(650,65);
            // await np.mouse.click(650,65);

            // let ps= await browser.pages();
            // log('mc',ps.length)
            // if(ps.length>1){
            //     let p=ps[ps.length-1]
            //     await p.mouse.move(650, 65);
            //     await p.mouse.down();
            //     await p.mouse.up();
            // }

        } else {
            log('IN--', msg.text())
        }

    });

    // page.on('popup',(p)=>{
    //     log('popup')
    // })
    // const es=['frameattached','load','domcontentloaded', 'framenavigated','dialog']
    // es.forEach((pg)=>{
    //     page.on(pg,(p)=>{
    //         log(pg)
    //     })
    // })


    await page.goto(sourceUrl[0], {});

    log("开始等待加载文档");

    async function waitReady(msg) {
        const selector = '.scxz';
        await page.waitFor(selector => !!document.querySelector(selector), {}, selector);
        log("加载完毕:" + (msg | ''))
    }

    await waitReady("文档")

    function next() {

        return page.evaluate(() => {
            console.log('点击下一页')
            let el = document.querySelector('.next');
            if (!el) return false;
            let cl = el.classList.length;
            if (cl.length > 1) {
                return true;
            }

            var e = document.createEvent('HTMLEvents');
            e.initEvent('click', true, true);
            e.eventType = 'onClick';

            el.dispatchEvent(e);
            return false;
        })
    }

    async function download() {
        let wl = []
        return await page.evaluate(async (h) => {

            var l = document.querySelectorAll('.scxz');
            console.log('可下载:', l.length)

            setTimeout(async () => {
                for (let i = 0; i <l.length;
                     i++) {
                    let tw = setTimeout(async () => {
                        console.log('begin')
                        var e = document.createEvent('HTMLEvents');
                        e.initEvent('click', true, true);
                        e.eventType = 'onClick';
                        let br = l[i].children[1].children[0].dispatchEvent(e);
                        console.log("click")
                        // setTimeout(()=>{
                        //     console.log("click")
                        // },29000)
                        console.log("开始下载:", i, br, e)
                    }, (i) * 35000)
                    h.w.push(tw)
                }
            }, 0)
            return l.length;
        }, {w: wl});
    }


    let finished = false;
    let index = 1;
    while (!finished) {
        log("开始下载,页码:", index);
        let count = await download();
        if (count > 0) {
            await page.waitFor(35000*10);
        }
        next();
        index++;
        await page.waitFor(30000);
        await cs();
        log("翻页到第" + index + "页");
    }

    log("done")
    await browser.close();
})();
