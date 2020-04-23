const {log,start}=require("./pbp")

const url="https://translate.google.cn/";

async function translate(page,str){
    await page.type("#source",str)
    await page.waitFor(2000)
    const r=await page.evaluate(()=>
       document.querySelector(".tlid-translation").innerText
    )
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

(async ()=>{      
    const b=await prepare();
    var arguments = process.argv.splice(2);
    //await page.type("#source","The requirements for the RTX Voice App are fairly simple. You must own a Geforce or Quadro based RTX GPU (the tool presumably uses the AI Tensor cores on NVIDIA RTX cards). Secondly, your driver version must be 410.18 or newer. Of course, you must have a mic as well. The application is much more advanced than software-based noise cancellation features offered by Teams and Discord as it relies on AI technology to remove noise from given voice samples. To give you an idea of just how good it is, hear how it handles the removal of a sound gamers are very familiar with: mechanical keyboards.")
    for(let i=0;i<arguments.length;i++){
        let a=arguments[i]
        let ar=await translate(b.page,a)
        log(a,ar)
    }
    
    await b.browser.close();
})()