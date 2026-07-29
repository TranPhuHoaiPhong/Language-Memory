const fs = require("fs");



function formatTime(ms){

    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000)/60000);
    const s = Math.floor((ms % 60000)/1000);
    const msPart = ms % 1000;


    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}.${String(msPart).padStart(3,"0")}`;

}







function readJSON(path){

    let data =
    fs.readFileSync(path,"utf8");


    while(typeof data==="string"){

        data = JSON.parse(data);

    }


    return data;

}








function clean(text){


    return text

    // bỏ nhạc

    .replace(/\[music\]/gi,"")

    .replace(/\[âm nhạc\]/gi,"")

    .replace(/\[nhạc\]/gi,"")

    .replace(/>>/g,"")

    .replace(/\n/g," ")

    .replace(/\s+/g," ")

    .trim();

}









// lấy từng word + timestamp

function extractWords(json){

    let words=[];

    for(const event of json.events){

        if(!event.segs)
            continue;

        for(const seg of event.segs){

            if(!seg.utf8)
                continue;

            let text = clean(seg.utf8);

            if(!text)
                continue;

            let baseTime =
                (event.tStartMs || 0)
                +
                (seg.tOffsetMs || 0);

            // tách các câu bên trong cùng 1 seg
            let parts =
            text
            .split(
                /(?<=[.!?])\s+(?=[A-ZÀÁẠẢÃĂẮẰẲẴẶÂẤẦẨẪẬĐÈÉẸẺẼÊẾỀỂỄỆÌÍỊỈĨÒÓỌỎÕÔỐỒỔỖỘƠỚỜỞỠỢÙÚỤỦŨƯỨỪỬỮỰỲÝỴỶỸ])/u
            )
            .filter(Boolean);

            if(parts.length===1){

                words.push({
                    text:parts[0],
                    time:baseTime
                });

            }else{

                const step =
                Math.max(
                    500,
                    Math.floor(1500 / parts.length)
                );

                parts.forEach((part,index)=>{

                    words.push({

                        text:part.trim(),

                        time:
                        baseTime
                        +
                        (index * step)

                    });

                });

            }

        }

    }

    return words;

}









// tách câu chuẩn

function splitSentence(words){

    let result=[];
    let temp=[];

    for(const w of words){

        temp.push(w);

        let check =
        w.text
        .replace(/\.\.\./g,"");

        if(
            /[.!?]["')\]]*$/
            .test(check)
        ){

            result.push({

                start:
                temp[0].time,

                text:
                temp
                .map(x=>x.text)
                .join(" ")

            });

            temp=[];

        }

    }

    if(temp.length){

        result.push({

            start:
            temp[0].time,

            text:
            temp
            .map(x=>x.text)
            .join(" ")

        });

    }

    return result;

}













let english =

splitSentence(

extractWords(

readJSON(
"backend/transcript.json"
)

)

);







let vietnamese =

splitSentence(

extractWords(

readJSON(
"backend/subtitle.json"
)

)

);











// ==========================
// ghép câu
// ==========================


// ==========================
// ghép câu
// ==========================

let output=[];

let viIndex=0;

for(const en of english){

    let viText="";

    while(
        viIndex < vietnamese.length
    ){

        let vi =
        vietnamese[viIndex];

        if(
            vi.start <= en.start + 300
        ){

            viText =
            vi.text;

            viIndex++;

        }
        else{

            break;

        }

    }

    output.push({

        tStartMs:
        en.start,

        time:
        formatTime(en.start),

        english:
        clean(en.text),

        vietnamese:
        clean(viText)

    });

}









fs.writeFileSync(


"subtitle_compare.json",



JSON.stringify(

output,

null,

2

),



"utf8"


);







console.log(
"DONE",
output.length
);