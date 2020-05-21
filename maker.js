const express = require('express')
const maker=require('./betterdev.js')
const app = express()
const port = 7070

app.post('/translate', (req, res) => {
    req.on('data',function(data){

        let obj=JSON.parse(data);
        if(!obj||!obj.url){
            res.json({success:false,msg:"url required"})
            return;
        }
        let p={
            shouldTrans:true,
            byContent:"c"===obj.type||true,
            bySummary:"s"===obj.type||false,
            report:true,
            to:obj.to||"192.168.16.102",
            pattern:obj.pattern||"a",
            urls:[obj.url]
        };
        console.log(obj,p);
        maker.makeArticle(p).catch((e)=>{
            console.log(e)
        })
        res.json({success:true})
    })
})
app.listen(port, () => console.log(`Example app listening on port ${port}!`))