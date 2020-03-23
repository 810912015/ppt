const pt=require("puppeteer")
    const url="https://leetcode-cn.com/problems/intersection-of-two-linked-lists/";

(async ()=>{
    function log() {
        console.log(new Date().toLocaleString(), arguments)
    }
    const browser=await  pt.launch({
        headless:true,
        slowMo:250,
        devTools:true
    })
    const page=await browser.newPage()
    //page.setDefaultTimeout(65000)
    await page.goto(url,{
        timeout:0
    })
    //await page.waitFor(30000);

    async function makeOne(p) {

       let vr=await p.evaluate(()=>{
           try {
               let tb = document.querySelector("#lang-select").getBoundingClientRect()
               let bb = {
                   x: tb.x,
                   y: tb.y
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
               return null;
           }
       })




        let bb=vr.bb;
        let delta=bb.y+50;
        for(let i=0;i<6;i++){
            delta+=30
            await p.tap("#lang-select")
            await p.mouse.click(bb.x,delta)
            await p.waitFor(1000)
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
                    return null;
                }
            })
            if(tla!=null) {
                vr.ls.push(tla)
            }
        }

        //log(vr);
        return vr;
    }

    let fs=require('fs');
    for(let i=0;i<1000;i++){
        try {
            log("start " + i)
            let ta = await makeOne(page)
            let fa = "result/r" + (ta.page.replace("/", "-")) + ".txt";
            fs.appendFile(fa, JSON.stringify(ta) + "\n\n", function (error) {
                if (error) {
                    log(i + "写入失败")
                }
            })
            await page.tap("#next-question-btn")
        }catch (e) {
            continue;
        }
    }
    await browser.close();
})()
