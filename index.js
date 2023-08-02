const express = require('express')
const app = express()
const geolib = require('geolib')



let getdata  = () =>{
    return new Promise(async(resolve,reject)=>{
        let result = await fetch('https://ignite.zook.top/data.json')
        let data = result.json()
        resolve(data)
    })
}

let check =() =>{
  return new Promise(async(resolve,reject)=>{
    getdata()
    .then((data)=>data.map((x)=>{
      let res = {}
      res.name = x.fullName
      res.loc = x.address.geo
      return res
  }))
  .then( (x)=>{
    let obj ={}
    let fin = []
    let grp = 1
    let b=[]
    for(let i =0;i<x.length;i++){
     if(fin.includes(i))
      continue
     else{
      for(let j=i+1;j<x.length;j++)
            {
              if(fin.includes(j))
              continue
              else
              {
                let res = geolib.isPointWithinRadius(x[i].loc,x[j].loc,1000000)
              if(res){
                let dis = geolib.getDistance(x[i].loc,x[j].loc)
                b.push({sid:j,name:x[j].name,dis})
                fin.push(j)
              }
              }
              
            }b.push({fid:i,name:x[i].name})
            obj['group'+grp] = b
            grp++
             b=[]
     }
          
    }
    resolve(obj)
    
  })
  })

     }



app.set('view engine','hbs')

app.get('/', async (req,res)=>{
  check()
  .then((x)=>{
    res.render('view',{data:x})
console.log(x)
  })
 
  })
  

app.listen(3000,()=>{
    console.log("server running on port 3000")
})