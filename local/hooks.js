//hooks to run before a call 
const PRE = {}
//hooks to run after
const POST = {}

//first called to register all call ids 
const RegisterCalls = (calls) => {
  calls.forEach(id => {
    PRE[id] = []
    POST[id] = []
  })
}

/*
  Register Hooks for use later
*/
const RegisterPreHook = (call, f) => {
  PRE[call].push(f)
}
const RegisterPostHook = (call, f) => {
  POST[call].push(f)
}

/*
  Running hooks based upon when 
*/
const RunPreHooks = (call, data) => {
  PRE[call].forEach(f => f(data))
}
const RunPostHooks = (call, data) => {
  POST[call].forEach(f => f(data))
}

export {RegisterCalls, RegisterPreHook, RegisterPostHook, RunPreHooks, RunPostHooks}