const fs = require("fs");


// file json gốc
const input = "backend/subtitle.json";


// file sau khi format
const output = "subtitle_beauty.json";



let raw = fs.readFileSync(
    input,
    "utf8"
);



// xử lý trường hợp JSON bị stringify nhiều lần
let data = raw;


while(typeof data === "string"){

    data = JSON.parse(data);

}



// ghi JSON đẹp

fs.writeFileSync(
    output,
    JSON.stringify(data, null, 2),
    "utf8"
);



console.log("Done format JSON!");