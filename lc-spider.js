const pt=require("puppeteer")
// 导入设备描述库
//const devices = require('puppeteer/DeviceDescriptors');
const url="https://leetcode-cn.com/problems/groups-of-special-equivalent-strings/";

(async ()=>{
    function log() {
        console.log(new Date().toLocaleString(), arguments)
    }
    //log(devices)
    const browser=await  pt.launch({
        headless:false,
        slowMo:250,
        devTools:false
    })
    //await browser.evaluate(devices['ipad'])
     const page=await browser.newPage()
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
    //page.setDefaultTimeout(65000)
    await page.goto(url,{
        timeout:0
    })
    //await page.waitFor(30000);
    // page.on('console',async msg=>{
    //     log('console',msg.text())
    // })
    async function makeOne(p) {

       let vr=await p.evaluate(()=>{
           try {
               let tb = document.querySelector("#lang-select").getBoundingClientRect()
               let bb = {
                   x: tb.x,
                   y: tb.y,
                   w:tb.width,
                   h:tb.height
               }
               const rs = {
                   page: ".pagination-screen__DnGE",
                   h: ".css-tt3ivf-Title",
                   d: ".content__1Y2H",
                   l: ".css-1aope3n-Difficulty",
                   s: ".view-lines",
                   lang: ".ant-select-selection-selected-value"
               }

               var r = {
                   ls: []
               }
               for (var k in rs) {
                   let v = rs[k];
                   if (k == "l") {
                       r[k] = document.querySelectorAll(v)[1].innerText
                   } else if (k == "d") {
                       r[k] = document.querySelector(v).innerHTML
                   } else {
                       r[k] = document.querySelector(v).innerText
                   }
               }
               r.href = document.location.href;
               r.bb = bb;
               return r;
           }catch (e) {
               console.log("basic",JSON.stringify(e),e)
               return null;
           }
       })

       if(vr==null) return null;


        let bb=vr.bb;
        let delta=bb.y+50;
        for(let i=0;i<14;i++){
            await p.tap("#lang-select")
            delta+=30
            if(i==6){
                let tx=bb.x+bb.w-2;
                let ty=bb.y+bb.h+10;
                await p.mouse.move(tx,ty);
                await p.mouse.down();
                await p.mouse.move(tx,ty+100);
                await p.mouse.up();
                delta=bb.y+100;
            }
            await p.mouse.click(bb.x,delta)
            //await p.waitFor(1000)
            let tla= await p.evaluate(()=>{
                try {
                    const ls = {
                        s: ".view-lines",
                        lang: ".ant-select-selection-selected-value"
                    }
                    let la = {}
                    for (let k in ls) {

                        let v = ls[k]
                        la[k] = document.querySelector(v).innerText

                    }
                    return la;
                }catch (e) {
                    console.log("source",JSON.stringify(e),e)
                    return null;
                }
            })
            //log(i,JSON.stringify(tla))
            if(tla!=null) {
                vr.ls.push(tla)
            }
        }

        //log(vr);
        return vr;
    }

    let fs=require('fs');
    for(let i=893;i<1581;i++){
        try {
            log("start " + i)
            let ta = await makeOne(page)
            if(ta==null) {
                log(i+" get fail")
                await page.tap("#next-question-btn")
                continue;
            }
            let fa = "result4/r" + (ta.page.replace("/", "-")) + ".txt";
            fs.appendFile(fa, JSON.stringify(ta) + "\n\n", function (error) {
                if (error) {
                    log(i + "写入失败")
                }
            })
        }catch (e) {
            log("r0",JSON.stringify(e),e)
            continue;
        }
        await page.tap("#next-question-btn")
        //await page.waitFor(1000)
    }
    await browser.close();
})()
