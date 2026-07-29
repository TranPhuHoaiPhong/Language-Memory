const fs = require("fs");

console.log("Start script...");

// =======================
// ĐỌC FILE
// =======================

let englishRaw = JSON.parse(
    fs.readFileSync("backend/transcript.json", "utf8")
);

let vietnameseRaw = JSON.parse(
    fs.readFileSync("backend/subtitle.json", "utf8")
);

// Nếu JSON bị bọc string
if (typeof englishRaw === "string") {
    englishRaw = JSON.parse(englishRaw);
}

if (typeof vietnameseRaw === "string") {
    vietnameseRaw = JSON.parse(vietnameseRaw);
}

// =======================
// CLEAN TEXT
// =======================

function cleanText(text) {
    return text
        .replace(/\[[^\]]*\]/g, "")
        .replace(/>>/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

// =======================
// PARSE YOUTUBE EVENTS
// =======================

function parseEvents(events) {
    return events
        .filter(e => e.segs)
        .map(e => ({
            tStartMs: e.tStartMs,
            dDurationMs: e.dDurationMs || 0,
            text: e.segs
                .map(seg => seg.utf8 || "")
                .join("")
        }));
}

// =======================
// ENGLISH DATA
// =======================

let enData;

if (Array.isArray(englishRaw)) {
    enData = englishRaw.map(x => ({
        tStartMs: x.tStartMs,
        dDurationMs: x.dDurationMs || 0,
        text: x.english || ""
    }));
} else if (englishRaw.events) {
    enData = parseEvents(englishRaw.events);
} else {
    throw new Error("Không đọc được transcript.json");
}

// =======================
// VIETNAMESE DATA
// =======================

let viData = parseEvents(vietnameseRaw.events);

// =======================
// TÁCH CÂU
// =======================

function splitSentence(data) {
    let result = [];
    let current = null;

    for (let item of data) {
        let text = cleanText(item.text);

        // bỏ qua [âm nhạc], [music], ...
        if (
            !text ||
            /^\[[^\]]+\]$/.test(item.text.trim())
        ) {
            continue;
        }

        if (!current) {
            current = {
                tStartMs: item.tStartMs,
                dDurationMs: item.dDurationMs,
                text: text
            };
        } else {
            current.text += " " + text;
            current.dDurationMs =
                (item.tStartMs + item.dDurationMs) -
                current.tStartMs;
        }

        // tìm các câu kết thúc bằng . ! ?
        let matches = current.text.match(
            /[^.!?]+[.!?]+(?:["']|\)|\])*/g
        );

        if (matches) {
            let sentence = matches.join(" ").trim();

            result.push({
                tStartMs: current.tStartMs,
                dDurationMs:
                    (item.tStartMs + item.dDurationMs) -
                    current.tStartMs,
                text: sentence
            });

            let remain = current.text
                .slice(sentence.length)
                .trim();

            if (remain) {
                current = {
                    tStartMs: item.tStartMs,
                    dDurationMs: item.dDurationMs,
                    text: remain
                };
            } else {
                current = null;
            }
        }
    }

    if (current && current.text.trim()) {
        result.push(current);
    }

    return result;
}

// =======================
// TÁCH CÂU EN + VI
// =======================

let enSentence = splitSentence(enData);
let viSentence = splitSentence(viData);

// =======================
// GHÉP
// =======================

let result = [];

let length = Math.max(
    enSentence.length,
    viSentence.length
);

for (let i = 0; i < length; i++) {
    result.push({
        tStartMs:
            enSentence[i]?.tStartMs ??
            viSentence[i]?.tStartMs ??
            0,

        dDurationMs:
            enSentence[i]?.dDurationMs ??
            viSentence[i]?.dDurationMs ??
            0,

        english: enSentence[i]
            ? cleanText(enSentence[i].text)
            : "",

        vietnamese: viSentence[i]
            ? cleanText(viSentence[i].text)
            : ""
    });
}

// =======================
// XÓA DÒNG RỖNG
// =======================

result = result.filter(
    x => x.english || x.vietnamese
);

// =======================
// GHI FILE
// =======================

fs.writeFileSync(
    "output.json",
    JSON.stringify(result, null, 2),
    "utf8"
);

console.log("Đã tạo output.json thành công!");