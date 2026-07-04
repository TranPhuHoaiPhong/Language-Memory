const idService = require("../services/idService");

exports.receiveId = async(req,res)=>{
    try{
        const {id} = req.body;

        const result = await idService.processId(id);

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