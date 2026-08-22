const idService = require("../services/idService");

exports.receiveId = async(req,res)=>{
    try{
        const {id, language} = req.body;

        // console.log("Received ID:", id);

        const { dta, lang } = await idService.processId(id, language);

        res.json({
            success: true,
            dta,
            lang
        });
    }catch(error){
        res.status(500).json({
            success:false,
            message:error.message
        });
    }
};