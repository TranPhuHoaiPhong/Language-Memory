const axios = require("axios");
const fs = require("fs");



async function translate(text){


    const response =
    await axios.get(
        "https://translate.googleapis.com/translate_a/single",
        {
            params:{
                client:"gtx",
                sl:"en",
                tl:"vi",
                dt:"t",
                q:text
            }
        }
    );


    return response.data[0]
    .map(x=>x[0])
    .join("");

}




let content =
fs.readFileSync(
    "transcript/transcript_output.txt",
    "utf8"
);


let lines =
content
.split("\n")
.filter(x=>x.trim());




// chia 10 câu

function chunk(arr,size){

    let result=[];

    for(let i=0;i<arr.length;i+=size){

        result.push(
            arr.slice(i,i+size)
        );

    }

    return result;

}



let batches =
chunk(lines,10);



let results=[];



async function run(){


    for(let batch of batches){



        await Promise.all(

            batch.map(async line=>{


                let match =
                line.match(
                    /^(\S+)\s(.+)$/
                );


                if(!match)
                    return;



                let time =
                match[1];


                let english =
                match[2];



                let vietnamese =
                await translate(
                    english
                );



                results.push({

                    time: time,

                    english: english,

                    vietnamese: vietnamese

                });



            })

        );



        console.log(
            "Xong batch 10"
        );


    }



    // ======================
    // SẮP XẾP THEO THỜI GIAN
    // ======================


    results.sort((a,b)=>{


        function toMs(time){

            let p =
            time.split(":");


            return (
                Number(p[0])*3600000+
                Number(p[1])*60000+
                Number(p[2].split(".")[0])*1000+
                Number(p[2].split(".")[1])
            );

        }


        return toMs(a.time)
             -
             toMs(b.time);


    });




    fs.writeFileSync(

        "subtitle_vi.json",

        JSON.stringify(
            results,
            null,
            2
        ),

        "utf8"

    );


    console.log(
        "DONE",
        results.length
    );


}



run();