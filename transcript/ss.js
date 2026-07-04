const fs = require("fs");


// đọc file
const en = fs.readFileSync("transcript_output.txt", "utf8")
    .split("\n")
    .filter(line => line.trim() !== "");


const vi = fs.readFileSync("subtitle_output.txt", "utf8")
    .split("\n")
    .filter(line => line.trim() !== "");



// lấy text bỏ timestamp
function getText(line){

    return line.replace(
        /^\d{2}:\d{2}:\d{2}\.\d+\s+/,
        ""
    ).trim();

}


// ghép tuần tự
const max = Math.max(en.length, vi.length);


for(let i = 0; i < max; i++){

    console.log("================================");

    console.log(
        "EN:",
        en[i] ? getText(en[i]) : ""
    );


    console.log(
        "VI:",
        vi[i] ? getText(vi[i]) : ""
    );

}