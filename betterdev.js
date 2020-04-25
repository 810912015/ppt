const {log,start}=require("./pbp")
const parser=require("node-html-parser")
const gtrans =require("./gtrans")
const htmlparser=require("htmlparser2")
const simplifier=require("./hp2t")

const url="https://betterdev.link";

const htmlparser2 = require("htmlparser2");
const tags={
    html:"",
    cfg:{
        ignore: {
            noscript: true,
            script:true,
            form:true,
            input:true,
            label:true,
            button:true,
            style:true,
            footer:true,
            link:true
        },
        untouch:{
            pre:true,
            code:true,
            svg:true
        },
        attr:{
            a:["href"],
            img:["src","alt"]
        },

    },
    include:true,
    untouch:false
};
function isIgnore(name) {
    return name in tags.cfg.ignore;
}
function isUntouch(name) {
    return name in tags.cfg.untouch;
}
function writeOpen(name,attrs) {
    if(!(name in tags.cfg.attr)&&!isUntouch(name)&&!tags.untouch) return;
    tags.html+="<";
    tags.html+=name;
    if(name in tags.cfg.attr){
        let ta=tags.cfg.attr[name];
        ta.forEach(a=>{
            if(a in attrs){
                tags.html+=" "+a+"='"+attrs[a]+"'"
            }
        })
    }else if(tags.untouch){
        if(name!="pre"&&name!="code"){
            for(a in attrs){
                tags.html+=" "+a+"='"+attrs[a]+"'"
            }
        }

    }
    tags.html+=">"
}

async function simply(str,tf) {
    tags.html="";
    const parser = new htmlparser2.Parser(
        {
            onopentag(name, attribs) {
                if(isIgnore(name)){
                    tags.include=false
                    return;
                }
                if(isUntouch(name)){
                    tags.untouch=true;
                }
                writeOpen(name,attribs)
            },
            async ontext(text) {
                if(tags.include) {
                    let tr;
                    if(tf){
                        tr=await tf(text);
                    }else{
                        tr=text;
                    }
                    tags.html += text;
                }
            },
            onclosetag(name) {
                if(isIgnore(name)){
                    tags.include=true
                    return;
                }
                if(isUntouch(name)){
                    tags.untouch=false;
                }
                if(tags.untouch||(name in tags.cfg.attr)||name in tags.cfg.untouch){
                    tags.html+="</"+name+">";
                }else{
                    if(!tags.html.endsWith("\n")){
                        tags.html+="\n";
                    }
                }
            }
        },
        { decodeEntities: true }
    );
    parser.write(str);
    parser.end();
    let r=tags.html;
    return r;
}

async function transSingle(page,str){
    return await gtrans.translate(page, str);
}

async function transArray(page,sa){
    let code=false;
    let r="";
    let cache={};
    for(let i=0;i<sa.length;i++){
        let t=sa[i];
        if(!t||t.indexOf(">")>-1||t.indexOf("<")>-1){
            log("trans step:empty or element ",i,sa.length,t)
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
                let tr;
                if(t in cache){
                    tr=cache[t]
                }else {
                    tr = await transSingle(page,t);
                    cache[t]=tr;
                }
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

async function transByLine(page,str){
    log("begin trans")
    let sa=str.split('\n')
    return await transArray(page,sa);
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
    let fn="better-dev-20200425-0.txt"

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
            pre:true,
            comment:false
        });
        return root.structuredText;
    }
    async function getCText(t) {
        let gt=await gtrans.prepare();
        t.cname=await gtrans.translate(gt.page, t.n);
        if(!t.text){
            return ;
        }
        t.ctext=await transByLine(gt.page,t.text);
        await gt.browser.close();
    }

    function parseHtml2(html){
        let r= simplifier.simply(html);
        return r;
    }

    async function makeByHtml(t) {
         t.text=parseHtml(t.html);
         await getCText(t);
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

    for(let i=5;i<r.length;i++){
        let t=r[i];
        let pt=await bp.browser.newPage();

        try{
            t.html=await getHtml(pt,t);
            await makeByHtml(t);
            save(t,i);

        }catch(e){
            log(i,r[i],e)
        }finally{
            pt.close();
        }
    }   
   
    log("file done")
    await bp.browser.close();
})()