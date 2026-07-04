const { YoutubeTranscript } = require("youtube-transcript");
const { split } = require("sentence-splitter");


function formatTime(seconds){

    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);

    return `00:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;

}



async function main(){


    const videoId = "lFLgKw83d4I";


    const transcript =
        await YoutubeTranscript.fetchTranscript(videoId);



    let sentences = [];

    let currentText = "";
    let currentTime = null;



    for(const item of transcript){


        const text = item.text
            .replace(/\[[^\]]*\]/g, "")
            .replace(/\s+/g, " ")
            .trim();

        if (!text) continue;


        if(!currentText){

            currentTime = item.offset / 1000;

        }



        currentText += " " + text;



        if(
            text.endsWith(".") ||
            text.endsWith("?") ||
            text.endsWith("!")
        ){


            const result = split(
                currentText.trim()
            );



            const sentencesResult = Array.isArray(result)
    ? result
    : [result];


for (const sentence of sentencesResult) {


    if(sentence.type === "Sentence"){

        sentences.push({

            time: currentTime,

            text: sentence.raw.trim()

        });

    }

}



            currentText = "";
            currentTime = null;

        }

    }



    if(currentText){

        sentences.push({

            time: currentTime,

            text: currentText.trim()

        });

    }



    for(const s of sentences){

        console.log(
            formatTime(s.time),
            s.text
        );

    }


}



main();