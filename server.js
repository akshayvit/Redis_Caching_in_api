const app=require('express')();
const axios=require('axios');
const redis=require('redis');

const port = process.env.PORT || 8000;


let redisclient;

(async()=>{
    redisclient=redis.createClient();
    redisclient.on("error",(err)=>console.error(err));
    await redisclient.connect();
})();

async function fetchapi(data) {
    const axiosdata=await axios.get(`https://www.fishwatch.gov/api/species/${data}`);
    console.log('Request sent to API');
    return axiosdata.data;
}


async function getdata(req,resp) {
    let data=req.params.data;
    let results;
    let iscache=false;
    try {
       // console.log("done");
        const cacheres=await redisclient.get(data);
        if(cacheres) {
            iscache=true;
            results=JSON.parse(cacheres);
        } else{
        results=await fetchapi(data);
        if(results.length==0) {
            throw "Not returned anything here";
        }
        }

        //console.log("Done");
        await redisclient.set(data,JSON.stringify(results),{EX:60,NX:true});
        resp.status(200).send({
            fromCache: iscache,
      data: results,
        });
    } catch(err) {
        console.log(err);
        resp.status(404).send(err);
    }

}

app.get('/fish/:data',getdata);

app.listen(8000,()=>{console.log(`Running on PORT ${port}`)});