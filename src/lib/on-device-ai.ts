import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
export type LocalAIStatus = {status:string;message:string};
export type LocalModel = {
  getAvailability():Promise<LocalAIStatus>;
  generate(requestId:string,instructions:string,prompt:string):Promise<string>;
  cancel(requestId:string):Promise<boolean>;
};
const native = Platform.OS==='ios' ? requireOptionalNativeModule<LocalModel>('DugoutOnDeviceAI') : null;
export async function getLocalAIAvailability():Promise<LocalAIStatus> {
  if(Platform.OS!=='ios')return{status:'platform-not-supported',message:'On-device AI currently supports compatible iPhones and iPads. Saved Rules work here.'};
  if(!native)return{status:'native-build-required',message:'On-device AI needs the Dugout Pilot native build. It is not included in Expo Go. Saved Rules still work.'};
  try{return await native.getAvailability();}catch{return{status:'unavailable',message:'Could not check Apple Intelligence. Use Saved Rules or check again.'};}
}
export function runLocalModel(instructions:string,prompt:string,signal:AbortSignal,model:LocalModel|null=native):Promise<string> {
  if(!model)return Promise.reject(new Error('A native build with on-device AI is required.'));
  if(signal.aborted)return Promise.reject(new Error('Answer stopped.'));
  const id=`dugout-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return new Promise((resolve,reject)=>{
    let settled=false;
    const complete=(result?:string,error?:unknown)=>{if(settled)return;settled=true;signal.removeEventListener('abort',abort);if(error)reject(error);else resolve(result??'');};
    const abort=()=>{try{void model.cancel(id).catch(()=>{});}catch{/* Native runtime may already have stopped. */}complete(undefined,new Error('Answer stopped.'));};
    signal.addEventListener('abort',abort,{once:true});
    // Close the small race between the initial signal check and listener registration.
    if(signal.aborted){abort();return;}
    try{void model.generate(id,instructions,prompt).then(text=>complete(text),error=>complete(undefined,error));}catch(error){complete(undefined,error);}
  });
}
