const fs = require("fs");

function formatTime(ms) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const msPart = ms % 1000;

    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(msPart).padStart(3, "0")}`;
}

function appendWord(sentence, text) {

    if (!sentence)
        return text.trim();

    if (/^[,.;!?:"')\]]/.test(text))
        return sentence + text;

    return sentence + " " + text;
}

function cleanText(text) {

    return text
        .replace(/>>/g, "")
        .replace(/\[[^\]]*\]/gi, "")
        .replace(/[♪♫♬]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function isEndSentence(text) {

    text = text.trim();

    // Không kết thúc nếu là ...
    if (/\.\.\.["')\]]*$/.test(text))
        return false;

    return /[.!?]["')\]]*$/.test(text);
}

function saveSentence(result, start, text) {

    text = text
        .replace(/\s+/g, " ")
        .trim();

    if (!text)
        return;

    result.push(
        `${formatTime(start)} ${text}`
    );
}

function splitSentences(text){

    const result = [];
    let current = "";

    const abbreviations = new Set([
        "Mr.",
        "Mrs.",
        "Ms.",
        "Dr.",
        "Prof.",
        "Sr.",
        "Jr.",
        "St.",
        "vs.",
        "etc."
    ]);

    for(let i=0;i<text.length;i++){

        const ch = text[i];

        current += ch;

        // ...
        if(
            ch==="." &&
            text[i+1]==="." &&
            text[i+2]==="."
        ){
            current+="..";
            i+=2;
            continue;
        }

        // 24.000 hoặc 3.14
        if(
            ch==="." &&
            /\d/.test(text[i-1]||"") &&
            /\d/.test(text[i+1]||"")
        ){
            continue;
        }

        // Mr. Dr. ...
        if(ch === "."){

            const words = current.trim().split(/\s+/);
            const lastWord = words[words.length-1];

            if(abbreviations.has(lastWord)){
                continue;
            }
        }

        // ! ?
        if(ch==="!" || ch==="?"){
            result.push(current.trim());
            current="";
            continue;
        }

        // .
        if(ch==="."){

            const next = text.slice(i+1);

            if(
                /^\s+[A-ZÀ-Ỹ]/.test(next) ||
                next.trim()===""
            ){
                result.push(current.trim());
                current="";
            }
        }
    }

    if(current.trim()){
        result.push(current.trim());
    }

    return result;
}

const raw = fs.readFileSync(
    "../backend/subtitle.json",
    "utf8"
);

let data = raw;

while (typeof data === "string") {
    data = JSON.parse(data);
}

const result = [];

let current = "";
let startTime = null;

for (const event of data.events) {

    if (!event.segs)
        continue;

    for (const seg of event.segs) {

        if (!seg.utf8)
            continue;

        const text = cleanText(seg.utf8);

        if (!text)
            continue;

        const time =
            (event.tStartMs || 0) +
            (seg.tOffsetMs || 0);

        const pieces = splitSentences(text);

        for (const piece of pieces) {

            if (startTime === null) {
                startTime = time;
            }

            current = appendWord(
                current,
                piece
            );

            if (isEndSentence(piece)) {

                saveSentence(
                    result,
                    startTime,
                    current
                );

                current = "";
                startTime = null;
            }
        }
    }
}

// phần còn dư

if (current.trim()) {

    saveSentence(
        result,
        startTime || 0,
        current
    );
}

fs.writeFileSync(
    "subtitle_output.txt",
    result.join("\n"),
    "utf8"
);

console.log(
    `Done ${result.length} sentences`
);