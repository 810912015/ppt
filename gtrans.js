const {log,start}=require("./pbp")

const url="https://translate.google.cn/";

async function translate(page,str){
    await page.$eval("#source",input => input.value='')
    await page.type("#source",str)
    let td=(str.length/50)*1000+1000;
    if(td>10000) td=10000;
    await page.waitFor(td)
    const r=await page.evaluate(()=>
       document.querySelector(".tlid-translation").innerText
    )
    if(r.startsWith("翻译时出错")||r==="翻译时出错") return r;
    if(!!r&&r.indexOf("...")<0) return r;

    for(let i=0;i<20;i++){
        await page.waitFor(td);
        const r1=await page.evaluate(()=>{
            document.querySelector(".tlid-translation").innerText
        })
        if(!!r1&&r1.indexOf("...")<0) return r1;
    }
    return r;
}

async function prepare(){
    const b=await start(true);
    let page=b.page;
    const filter=["log?","cb=","so?",".ico",".png"]
    await page.on("request",request=>{
        let to=request.url().toString();
        for(let i=0;i<filter.length;i++){
            let a=filter[i]; 
            if(to.indexOf(a)>-1){
                request.failure();
                break;
            }
        }
        request.continue;
    })
    //page.setDefaultTimeout(65000)
    await page.goto(url,{
        timeout:0
    })
    return b;
}
module.exports={prepare,translate}
// (async ()=>{      
//     const b=await prepare();
//
//     //await page.type("#source","The requirements for the RTX Voice App are fairly simple. You must own a Geforce or Quadro based RTX GPU (the tool presumably uses the AI Tensor cores on NVIDIA RTX cards). Secondly, your driver version must be 410.18 or newer. Of course, you must have a mic as well. The application is much more advanced than software-based noise cancellation features offered by Teams and Discord as it relies on AI technology to remove noise from given voice samples. To give you an idea of just how good it is, hear how it handles the removal of a sound gamers are very familiar with: mechanical keyboards.")
//     for(let i=0;i<arguments.length;i++){
//         let a=arguments[i]
//         let ar=await translate(b.page,a)
//         log(a,ar)
//     }
    
//     await b.browser.close();
// })()