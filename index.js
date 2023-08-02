// const express = require('express')
// const app = express()
// const geolib = require('geolib')



// let getdata  = () =>{
//     return new Promise(async(resolve,reject)=>{
//         let result = await fetch('https://ignite.zook.top/data.json')
//         let data = result.json()
//         resolve(data)
//     })
// }

// let check =() =>{
//   return new Promise(async(resolve,reject)=>{
//     getdata()
//     .then((data)=>data.map((x)=>{
//       let res = {}
//       res.name = x.fullName
//       res.loc = x.address.geo
//       return res
//   }))
//   .then( (x)=>{
//     let obj ={}
//     let fin = []
//     let grp = 1
//     let b=[]
//     for(let i =0;i<x.length;i++){
//      if(fin.includes(i))
//       continue
//      else{
//       for(let j=i+1;j<x.length;j++)
//             {
//               if(fin.includes(j))
//               continue
//               else
//               {
//                 let res = geolib.isPointWithinRadius(x[i].loc,x[j].loc,1000000)
//               if(res){
//                 let dis = geolib.getDistance(x[i].loc,x[j].loc)
//                 b.push({sid:j,name:x[j].name,dis})
//                 fin.push(j)
//               }
//               }
              
//             }b.push({fid:i,name:x[i].name})
//             obj['group'+grp] = b
//             grp++
//              b=[]
//      }
          
//     }
//     resolve(obj)
    
//   })
//   })

//      }

//      let fun = (x) =>{
//       let gr =[]
//       let sm =[]
//       let o = 0
//       let h = x['group1'].length
//       for (const [key, value] of Object.entries(x)) {
//         // console.log(key,value.length)
//         if(o<value.length){
//           o = value.length
//         gr=[]
//           gr[0]=key
//         }else if(value.length===o){
//           gr.push(key)
//         }if(value.length<h){
//           h=value.length
//           sm=[]
//           sm[0]=key
//         }else if(value.length===h){
//           sm.push(key)
//         }
//       }
//       let base = {
//         group : Object.keys(x).length,
//         biggroup : gr,
//         bglen :x[gr[0]].length,
//         smallgroup : sm,
//         smlen:x[sm[0]].length,
//       }
//       return base
//     }
// let f = () =>{
//   check()
//   .then((x)=>{
//     let res = fun(x)
//     console.log(res)
//   })
// }
// // f()

// app.set('view engine','hbs')

// app.get('/', async (req,res)=>{
//   check()
//   .then((x)=>{
//     let s = fun(x)
//     let base = fun(x)
//     res.render('view',{data:x,base})
// console.log(base)
//   })
 
//   })
  

// app.listen(3000,()=>{
//     console.log("server running on port 3000")
// })



















const express = require('express');
const app = express();
const geolib = require('geolib');

const getData = async () => {
  const result = await fetch('https://ignite.zook.top/data.json');
  const data = await result.json();
  return data;
};

const groupData = async () => {
  const data = await getData();

  const transformedData = data.map((x) => ({
    name: x.fullName,
    loc: x.address.geo,
  }));

  let obj = {};
  let fin = [];
  let grp = 1;
  let b = [];

  for (let i = 0; i < transformedData.length; i++) {
    if (fin.includes(i)) continue;

    for (let j = i + 1; j < transformedData.length; j++) {
      if (fin.includes(j)) continue;
      let radius = 25000
      const res = geolib.isPointWithinRadius(transformedData[i].loc, transformedData[j].loc, (radius*1000)/2);
      if (res) {
        const dis = geolib.getDistance(transformedData[i].loc, transformedData[j].loc);
        b.push({ sid: j, name: transformedData[j].name, dis });
        fin.push(j);
      }
    }

    b.push({ fid: i, name: transformedData[i].name });
    obj['group' + grp] = b;
    grp++;
    b = [];
  }

  return obj;
};

const getGroupSummary = (x) => {
  let gr = [];
  let sm = [];
  let o = 0;
  let h = x['group1'].length;

  for (const [key, value] of Object.entries(x)) {
    if (o < value.length) {
      o = value.length;
      gr = [key];
    } else if (value.length === o) {
      gr.push(key);
    }

    if (value.length < h) {
      h = value.length;
      sm = [key];
    } else if (value.length === h) {
      sm.push(key);
    }
  }

  return {
    group: Object.keys(x).length,
    biggroup: gr,
    bglen: x[gr[0]].length,
    smallgroup: sm,
    smlen: x[sm[0]].length,
  };
};

app.set('view engine', 'hbs');

app.get('/', async (req, res) => {
  try {
    const data = await groupData();
    const base = getGroupSummary(data);
    res.render('view', { data, base });
    console.log(base);
  } catch (err) {
    res.status(500).send('Internal Server Error');
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
