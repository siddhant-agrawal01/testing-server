// This file help to handle all async functions 

// By promises
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise
        .resolve(requestHandler(req, res, next))
        .catch((err) => next(err))
    }
}

export { asyncHandler }





// By Try & catch

/* async handler is a higher order function.
   Meaning of () => () => {} :
   -> const asynchandler = () => {}
   -> const asynchandler = (func) => () => {} === const asynchandler =(func)=>{()=>{}}.
*/    
/*
const asyncHandler = (fn) => async (req, res, next) => {
    try {
        // fn executes
        await fn(req, res, next)
    } catch (error) {
        res.status(err.code || 500).json({
            success: false,
            message: error.message
        })
    }
}
*/