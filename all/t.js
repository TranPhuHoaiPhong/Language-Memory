const axios = require("axios");
const fs = require("fs");



// =====================
// GOOGLE TRANSLATE
// =====================

async function translate(text){


    try{

        const response = await axios.get(
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
            .map(item=>item[0])
            .join("");


    }catch(error){

        console.log(
            "Lỗi dịch:",
            error.message
        );

        return "";

    }

}



// =====================
// ĐỌC FILE
// =====================

let content = fs.readFileSync(
    "transcript/transcript_output.txt",
    "utf8"
);



let lines = content
.split("\n")
.filter(x=>x.trim());



// =====================
// CHẠY TỪNG DÒNG
// =====================

async function run(){


    for(let line of lines){



        // tách time và text

        let match =
        line.match(
            /^(\S+)\s(.+)$/
        );


        if(!match)
            continue;



        let time = match[1];

        let english = match[2];



        console.log("\n================");

        console.log(
            time
        );


        console.log(
            "EN:",
            english
        );



        // gửi dịch ngay

        let vietnamese =
        await translate(english);



        // có kết quả in ngay

        console.log(
            "VI:",
            vietnamese
        );


    }


}



run();