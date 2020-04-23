const {log,start}=require("./pbp")
const url="https://betterdev.link/";

(async()=>{
    log("begin")
    let bp=await start();
    let page=bp.page;
    await page.goto(url,{timeout:0})
    log("opened")
    let links=await page.evaluate(()=>{
        let r=[]
        document.querySelectorAll("div > a")        
        .forEach(a=>{
            if((!!a.outerText)&&a.href.indexOf("github")<0&&
                a.href.indexOf("youtube")<0&&
                a.href.indexOf("betterdev")<0&&
                a.href.indexOf("twitter")<0)
             {
                let t={
                    l:a.href,
                    n:a.outerText
                }
                r.push(t)                
             } 
        })
        return r;
    })
    log("links done")
    let r=links;
    let fs=require('fs')
    let fn="better-dev-20200423-1.txt"
    for(let i=0;i<r.length;i++){
            log("start page",i,r[i])
        let t=r[i];
        let pt=await bp.browser.newPage();
        try{
        await pt.goto(t.l,{timeout:60000})
        let html= await pt.evaluate(()=>document.querySelector("body").innerHTML)
        let text=await pt.evaluate(()=>document.querySelector("body").innerText)
        t.html=html;
        t.text=text;
        fs.appendFile(fn,JSON.stringify(t)+"\n\n",(e)=>{
            if(e){
                log("write file error",i,e)
            }else{
                log("write success",i)
            }
        })
        log("done page",i)
        }catch(e){
            log(i,r[i],e)
        }finally{
           pt.close();
        }
    }   
   
    log("file done")
    await bp.browser.close();
})()