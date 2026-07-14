const search = require("../services/searchService");

exports.searchContr = async(req,res)=>{
    try{
        const { word, language, subtitle } = req.body;

        const result = await search.searchService(word, language, subtitle);

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
