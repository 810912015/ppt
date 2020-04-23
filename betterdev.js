const {log,start}=require("./pbp")
const parser=require("node-html-parser")
const gtrans =require("./gtrans")

const url="https://betterdev.link/issues/145";

async function trans(tor,str){
    log("begin trans")
    let sa=str.split('\n')
    let code=false;
    let r="";    
    for(let i=0;i<sa.length;i++){        
        let t=sa[i];        
        if(!t){
            log("trans step ",i,sa.length,t)
            r+="\n"
            continue
        }
        let isCode=t.indexOf("<code>")>-1||t.indexOf("</code>")>-1||
        t.indexOf("<pre>")>-1||t.indexOf("</pre>")>-1||t.indexOf("<ol>")>-1||t.indexOf("</ol>")>-1

        if(!code){
            if(isCode){
                code=true;
                r+=t; 
                log("trans step ",i,sa.length,code,isCode,t)               
            }else{
                let tr=await gtrans.translate(tor.page,t);
               
                log("trans step ",i,sa.length,code,isCode,t,tr)
                r+=tr;
            }
        }else{
            if(isCode){
                code=false;
                log("trans step ",i,sa.length,code,isCode,t)
                r+=t;
            }else{
                log("trans step ",i,sa.length,code,isCode,t)
                r+=t;
            }
           
        }
        r+="\n"
    }
    log("translated",r);
    return r;
}

(async()=>{
    log("begin")
    let bp=await start(true);
    
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
    let fn="better-dev-20200423-8.txt"
    for(let i=0;i<r.length;i++){
       
        let t=r[i];
        let pt=await bp.browser.newPage();
        log("start page",i,r.length,r[i].n)
        try{
        await pt.goto(t.l,{timeout:60000})
        log("goto page",i,r.length)
        let html= await pt.evaluate(()=>document.querySelector("body").innerHTML)
        log("get html",i,r.length)
        let gt=await gtrans.prepare();
        log("make trans",i,r.length)
        let root=parser.parse(html,{
            lowerCaseTagName:true,
            script:false,
            style:false,
            pre:true,
            comment:false
        });

        t.html=html;
        t.text=root.structuredText;
        log("begin trans",i,r.length)
        t.ctext=await trans(gt,t.text);
        log("end trans",i,r.length)
        await gt.browser.close();
        log("close trans",i,r.length)
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