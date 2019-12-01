import React,{useState} from 'react';
import './App.css';

function App() {
  const [txt,setTxt]=useState("")
  const [content,setContent]=useState("")
  const upload=(e)=>{
    let f=e.target.files[0]
    if(!f) return;
    let fr=new FileReader();
    fr.onload=(t)=>{
      setContent(fr.result)
    }
    fr.readAsText(f); 
  }
  return (
     <div>
       <div style={{padding:"10px"}}> 
         
         <input id="tb" type="text" onChange={(e)=>{
           console.log("fuck")
           setTxt("输入了："+e.target.value)
            }
          }/>
        
       </div>
       <div  style={{padding:"10px"}} id="content">
         {new Date().getTime()}
       </div>
       <div style={{padding:"10px"}}>
         <input type="file" onChange={upload} id="inputFile"/>
         <button id="upload" onClick={()=>setTxt("上传文件内容："+content)}>上传</button>
       </div>
       <div  style={{padding:"10px"}}>{txt}</div>
     </div>
  );
}

export default App;
