const baseUrl = require("../services/baseUrlService");

exports.transcriptContr = async(req,res)=>{
    try{
        const {transcript, language} = req.body;

        const result = await baseUrl.transcriptSer(transcript, language);

        res.json({
            success:true,
            data:result
        });
    }catch(error){
        res.status(500).json({
            success:false,
            message:error.message
        });
    }
};
