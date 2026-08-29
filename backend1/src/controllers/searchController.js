const search = require("../services/searchService");

exports.searchContr = async(req,res)=>{
    try{
        const { word, language, subtitle, sourceLanguage } = req.body;

        const result = await search.searchService(word, language, subtitle, sourceLanguage);
        
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
