const {log,start}=require("./pbp")
const parser=require("node-html-parser")
const gtrans =require("./gtrans")
let fs=require('fs')

async function transSingle(page,str){
    return await gtrans.translate(page, str).catch((e)=>str);
}

async function transArray(page,sa){
    let code=false;
    let r="";
    let mr="";
    let cache={};
    for(let i=0;i<sa.length;i++){
        let t=sa[i];
        let tmr="";
        if(!t||t.indexOf(">")>-1||t.indexOf("<")>-1){
            log("trans step:empty or element ",i,sa.length,t)
            tmr="\n"
            continue
        }else {
            let isCode = t.indexOf("<code>") > -1 || t.indexOf("</code>") > -1 ||
                t.indexOf("<pre>") > -1 || t.indexOf("</pre>") > -1 || t.indexOf("<ol>") > -1 || t.indexOf("</ol>") > -1

            if (!code) {
                if (isCode) {
                    code = true;
                    tmr= t;
                    log("trans step ", i, sa.length, code, isCode, t)
                } else {
                    let tr;
                    if (t in cache) {
                        tr = cache[t]
                    } else {
                        tr = await transSingle(page, t).catch((e) => t);
                        cache[t] = tr;
                    }
                    log("trans step ", i, sa.length, code, isCode, t, tr)
                    tmr= tr;
                }
            } else {
                if (isCode) {
                    code = false;
                    log("trans step ", i, sa.length, code, isCode, t)
                    tmr= t;
                } else {
                    log("trans step ", i, sa.length, code, isCode, t)
                    tmr= t;
                }

            }
        }
        mr+=t+"\n"+tmr+"\n"
        r+=tmr+"\n"
    }
    log("translated",r);
    return [r,mr];
}

async function transByLine(page,str){
    log("begin trans")
    let sa=str.split('\n')
    return await transArray(page,sa);
}

async function getLinks(page,pattern){
    return await page.evaluate((p)=>{
        let r=[]
        document.querySelectorAll(p)
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
    },pattern).catch(a=> {
        log("error in get link",a)
        return [];
    })
}
const ps={
    "https://stratechery.com":"header > h1 > a",
    "https://lobste.rs":".u-url",
    "https://betterdev.link":"div > a"
}
async function spideOne(url,fn,shouldTrans,ls) {
    log("begin",url,ls)
    let bp=await start(true);
    
    let page=bp.page;

    if(ls&&ls.length){
        for(let i=0;i<ls.length;i++){
            await makeByLink(ls[i],i)
        }
    }

    if(!url) return ;

    await page.goto(url,{timeout:0})
    log("opened",url,ps[url])
    let links=await getLinks(page,ps[url]||"a");
    if(!links||!links.length) {
        log("no links",links)
        return
    }
    log("links done",links.length)
    let r=links;

    async function getHtml(pt,t) {
        await pt.goto(t.l, {timeout: 60000})
        let html = await pt.evaluate(() => document.querySelector("body").innerHTML)
        return html;
    }

    function parseHtml(html) {
        let root=parser.parse(html,{
            lowerCaseTagName:true,
            script:false,
            style:false,
            pre:false,
            comment:false
        });
        return root.structuredText;
    }
    async function getCText(t) {
        let gt=await gtrans.prepare();
        if(t.n) {
            t.cname = await gtrans.translate(gt.page, t.n);
        }
        if(!t.text){
            return ;
        }
        let tr=await transByLine(gt.page,t.text);
        t.ctext=tr[0]
        t.cMixText=tr[1]
        await gt.browser.close();
    }

    async function makeByHtml(t) {
         t.text=parseHtml(t.html);
         if(shouldTrans){
             await getCText(t).catch(a=>{log("error in trans",a)});
         }

    }

    function save(t,i) {
        fs.appendFile(fn,JSON.stringify(t)+"\n\n",(e)=>{
            if(e){
                log("write file error",i,e)
            }else{
                log("write success",i)
            }
        })
    }

    async function makeByLink(t,i) {
        let pt=await bp.browser.newPage().catch(a=>null);
        if(pt==null) return ;
        try{
            t.html=await getHtml(pt,t).catch(a=>"");
            await makeByHtml(t).catch(a=>{t=null});
            if(t==null) return ;
            save(t,i);
        }catch(e){
            log(i,t,e)
        }finally{
            pt.close();
        }
    }

    for(let i=0;i<r.length;i++){
        let t=r[i];
        await makeByLink(t,i);
    }

   
    log("file done")
    //await bp.browser.close();
}

function createToday(){
    let dn="result/"+new Date().toLocaleDateString()+"/"
    let fs=require("fs")
    fs.stat(dn,function (e) {
        if(e){
            fs.mkdir(dn,function (e1) {
                if(e1){
                    log("mkdir",e1)
                }
            })
        }
    })
    return dn;
}

function getPrm(){
    let args=process.argv.splice(2);
    let shouldTrans=false;
    if(args.length>0){
        shouldTrans=!!args[0]
    }
    if(args.length>1) {
        let bySummary = args[1] === "-s"
        let byContent = args[1] === "-c"
        let urls = []
        if(args.length>2) {
            for (let i = 2; i < args.length; i++) {
                if (bySummary) {
                    urls.push(args[i])
                } else if (byContent) {
                    urls.push({
                        l: args[i]
                    })
                }
            }
        }
        return {
            shouldTrans: shouldTrans,
            byContent: byContent,
            bySummary: bySummary,
            urls: urls
        }
    }
    return shouldTrans;
}

(async ()=>{
    //汇总类地址：只包含链接地址的页面
    const targets=[
        "https://betterdev.link",
        "https://stratechery.com",
        "https://lobste.rs",
    ]
    //内容类地址：文章内容地址，l:链接地址，n:name，注意按格式
    const singleLinks=[
        // {
        //     l:"https://sookocheff.com/post/networking/how-does-dns-work/",
        //     n:"How Does DNS Work?"
        // }
    ]

    let p=getPrm();

    let dn=createToday();
    let shouldTrans=false;
    if(typeof p==="boolean"){
        shouldTrans=p;
        if(singleLinks.length>0){
            await spideOne(null,dn+"links.txt",shouldTrans,singleLinks)
        }
        if(targets.length>0) {
            for (let i = 0; i < targets.length; i++) {
                let url = targets[i]
                let fn = dn
                    + url.substr(8)
                        .replace(".", "_")
                        .replace("\\", "")
                        .replace("/", "")
                    + ".txt"
                await spideOne(url, fn, shouldTrans).catch(a => {
                    log("error", i, a);
                })
            }
        }
    }else{
        if(p.byContent){
            await spideOne(null,dn+"summary.txt",p.shouldTrans,p.urls)
        }else if(p.bySummary){
            for(let i=0;i<p.urls.length;i++){
                await spideOne(p.urls[i],dn+"content.txt",p.shouldTrans)
            }
        }
    }



})()