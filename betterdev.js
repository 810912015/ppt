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
async function spideOne(ops) {
    let {url,fn,shouldTrans,ls,pattern,report,to}=ops
    log("begin",url,ls)
    let bp=await start(true);
    
    let page=bp.page;

    if(ls&&ls.length){
        for(let i=0;i<ls.length;i++){
            await makeByLink({l:ls[i]},i)
        }
        await bp.browser.close();
    }

    if(!url){
        await bp.browser.close();
        return ;
    }

    await page.goto(url,{timeout:0})
    log("opened",url,ps[url])
    let links=await getLinks(page,pattern||ps[url]||"a");
    if(!links||!links.length) {
        log("no links",links)
        return
    }
    log("links done",links.length)
    let r=links;

    async function getHtml(pt,t) {
        await pt.goto(t.l, {timeout: 0})
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

    function callWebService(t) {
        let http=require('http')

        let data={
            url:t.l,
            json:JSON.stringify(t)
        }

        let content=JSON.stringify(data)
        log("before",t,data,content)
        let ops={
            hostname:to,
            port:8081,
            path:"/admin/translate/done",
            method:"POST",
            headers:{
                "Content-Type":"application/json;charset=UTF-8"
            }
        }
        let req = http.request(ops, function (res) {
            console.log('STATUS: ' + res.statusCode);
            console.log('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log('BODY: ' + chunk);
                //JSON.parse(chunk)
            });
        });

        req.on('error', function (e) {
            console.log('problem with request: ' + e.message);
        });

// write data to request body
        req.write(content);

        req.end();
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
        if(pt==null) {
            return ;
        }
        try{
            t.html=await getHtml(pt,t).catch(a=> {
                log(a)
                return "";
            });

            await makeByHtml(t).catch(a=>{t=null});
            if(t==null){
                return ;
            }

            if(report){
                callWebService(t);
            }else {
                save(t, i);
            }
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
    await bp.browser.close();
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
    let cmd={}
    let prm=[]
    args.map(a=>{
        if(a.startsWith("-")){
            let ta=a.substr(1);
            if(ta.indexOf("=")>-1){
                let arr=ta.split("=")
                cmd[arr[0]]=arr[1]
            }else{
                cmd[ta]=""
            }
        }else{
            prm.push(a)
        }
    })
    return {
        shouldTrans: "t" in cmd,
        byContent: "c" in cmd,
        bySummary: "s" in cmd,
        pattern:"p" in cmd&&cmd["p"],
        report:"r" in cmd,
        to:"to" in cmd&&cmd["to"],
        urls: prm
    }
}

async function makeArticle(p) {
    let dn=createToday();
    if(p.byContent){
        await spideOne({url:null,fn:dn+"summary.txt",shouldTrans:p.shouldTrans,ls:p.urls,report:p.report,to:p.to}).catch((a)=>log(a))
    }else if(p.bySummary){
        for(let i=0;i<p.urls.length;i++){
            await spideOne({url:p.urls[i],fn:dn+"content.txt",shouldTrans:p.shouldTrans,pattern:p.pattern,report:p.report,to:p.to}).catch((a)=>log(a))
        }
    }
}

module.exports={makeArticle,getPrm}