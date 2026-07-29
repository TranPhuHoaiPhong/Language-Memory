const fs = require("fs");


function formatTime(ms) {

    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const msPart = ms % 1000;

    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}.${String(msPart).padStart(3,"0")}`;
}



function appendWord(sentence,text){

    if(!sentence)
        return text.trim();


    if(/^\s/.test(text))
        return sentence + text;


    if(/^[,.;!?:"')\]]/.test(text))
        return sentence + text;


    return sentence + " " + text;

}



function cleanText(text){

    return text
    .replace(/>>/g,"")
    .replace(/\[[^\]]*\]/gi,"")
    .replace(/[♪♫♬]/g,"")
    .trim();

}




function wordCount(text){

    return text
    .split(/\s+/)
    .filter(Boolean)
    .length;

}



function isEndSentence(text){

    return /[,.!?]["')\]]*$/.test(text.trim());

}




function saveSentence(result,start,text){

    text=text
    .replace(/\s+/g," ")
    .trim();


    if(!text)
        return;


    result.push(
        `${formatTime(start)} ${text}`
    );

}




const raw = fs.readFileSync(
    "../backend/transcript.json",
    "utf8"
);


let data = raw;


while(typeof data==="string"){
    data = JSON.parse(data);
}




let result=[];

let current="";
let startTime=null;

let buffer=[];



for(const event of data.events){


    if(!event.segs)
        continue;



    for(const seg of event.segs){


        if(!seg.utf8)
            continue;



        let text = cleanText(seg.utf8);



        if(!text)
            continue;



        let time =
        (event.tStartMs || 0)
        +
        (seg.tOffsetMs || 0);



        if(!startTime)
            startTime=time;



        current =
        appendWord(current,text);




        /*
            chỉ kết thúc khi:
            - có dấu câu
            - câu đủ dài
            - không phải câu cụt
        */


        if(isEndSentence(text)){


            let count = wordCount(current);



            // câu quá ngắn giữ lại nối tiếp
            




            if(buffer.length){

                current =
                buffer.join(" ")
                +" "
                +current;


                buffer=[];
            }



            saveSentence(
                result,
                startTime,
                current
            );



            current="";
            startTime=null;

        }



    }

}





// còn dư

if(current.trim()){


    if(buffer.length){

        current =
        buffer.join(" ")
        +" "
        +current;

    }


    saveSentence(
        result,
        startTime || 0,
        current
    );

}




fs.writeFileSync(
    "transcript_output.txt",
    result.join("\n"),
    "utf8"
);



console.log(
`Done ${result.length} sentences`
);