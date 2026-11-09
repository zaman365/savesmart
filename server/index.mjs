import {resolve} from 'node:path';
import {createApp} from './app.mjs';
const host=process.env.HOST??'127.0.0.1',port=Number(process.env.PORT??3000),demoMode=process.env.DEMO_MODE==='true',production=process.env.NODE_ENV==='production';
if(demoMode&&!['127.0.0.1','localhost','::1'].includes(host))throw new Error('Demo mode is loopback-only.');
const app=await createApp({databasePath:resolve(process.env.DATABASE_PATH??'var/savesmart.sqlite'),demoMode,production,appOrigin:process.env.APP_ORIGIN??''});
app.server.listen(port,host,()=>{console.log(`SaveSmart is ready at http://${host}:${port}`);console.log(demoMode?'Local demo: all catalogue offers and merchants are illustrative.':'Live mode: only approved merchant content is public.');});
for(const sig of ['SIGINT','SIGTERM'])process.once(sig,async()=>{await app.close();process.exit(0);});
