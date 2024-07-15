import multer from "multer";

const storage = multer.diskStorage({
    destination: function(req,file,cd){
        cb(null,'./public/temp')
    },
    filename: function(req,file,cd){
    //const uniqurSuffix = Date.now() + "-" + Math.round(Math.random()*189)
    cb(null,file.originalname)
    }
})

export const upload = multer({storage : storage})