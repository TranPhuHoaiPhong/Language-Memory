const save = require("../services/saveService");

exports.saveContr = async(req,res)=>{
    try{
        const { data } = req.body;

        console.log("data", data)

        const result = await save.saveService(data);
        
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
