import assert from 'node:assert/strict';
const digest=async t=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t))).toString('hex');
const secret='test-only-private-teacher-secret-123456789';
const tables={vm_settings:[{singleton:true,teacher_hash:await digest(secret)}],vm_rooms:[],vm_students:[]};
globalThis.Deno={env:{get:k=>({SUPABASE_URL:'https://database.test',SUPABASE_SERVICE_ROLE_KEY:'test-service-key'})[k]},serve:()=>{}};
globalThis.fetch=async(url,options={})=>{assert(String(url).startsWith('https://database.test/rest/v1/'));assert.equal(options.headers.Authorization,'Bearer test-service-key');const u=new URL(url),name=u.pathname.split('/').at(-1),data=tables[name],method=options.method||'GET';let rows=data.filter(row=>[...u.searchParams].every(([k,v])=>['select','limit','order'].includes(k)||v==='eq.'+String(row[k])));let result;
 if(method==='POST'){const body=JSON.parse(options.body);if(name==='vm_students'&&data.some(r=>r.room_id===body.room_id&&r.nickname===body.nickname))return Response.json({message:'duplicate'},{status:409});const row={id:crypto.randomUUID(),created_at:new Date().toISOString(),closed:false,revision:0,last_seen:new Date().toISOString(),...body};data.push(row);result=[row];}
 else if(method==='PATCH'){const body=JSON.parse(options.body);rows.forEach(row=>Object.assign(row,body));result=rows;}
 else result=rows;
 const projection=u.searchParams.get('select');if(projection&&projection!=='*')result=result.map(row=>Object.fromEntries(projection.split(',').map(k=>[k,row[k]])));
 return Response.json(result);
};
const {handle}=await import('../backend/supabase/functions/vm-classroom/index.ts');
async function call(body,headers={}){const r=await handle(new Request('https://function.test',{method:'POST',headers:{Origin:'https://zholdaskali.github.io','Content-Type':'application/json',...headers},body:JSON.stringify(body)}));return {status:r.status,data:await r.json()};}
assert.equal((await call({op:'rooms'})).status,403);
assert.equal((await call({op:'rooms'},{'X-Teacher-Key':'invalid-long-teacher-key-12345'})).status,403);
const t={'X-Teacher-Key':secret};const room=await call({op:'create-room'},t);assert.equal(room.status,200);assert.equal(room.data.room.code.length,8);
const join=await call({op:'join',code:room.data.room.code,name:'Первый'});assert.equal(join.status,200);assert.equal(join.data.token.length,64);const student={'X-Student-Token':join.data.token};assert.notEqual(tables.vm_students[0].token_hash,join.data.token);
assert.equal((await call({op:'state'},{'X-Student-Token':'f'.repeat(64)})).status,401);
assert.equal((await call({op:'action',revision:0,action:{type:'complete',score:100}},student)).status,409);
const done=await call({op:'action',revision:0,action:{type:'hardware',hardware:{cpu:4,ram:16,disk:32}}},student);assert.equal(done.status,200);assert.equal(done.data.state.score,10);assert.equal(done.data.revision,1);
const stale=await call({op:'action',revision:0,action:{type:'hypervisor'}},student);assert.equal(stale.status,409);assert.equal(stale.data.revision,1);
const roster=await call({op:'roster',roomId:room.data.room.id},t);assert.equal(roster.status,200);assert.equal(roster.data.students[0].state.score,10);assert(!JSON.stringify(roster).includes(join.data.token));assert(!JSON.stringify(roster).includes('token_hash'));
assert.equal((await call({op:'rooms'},{Origin:'https://evil.test','X-Teacher-Key':secret})).status,403);
const options=await handle(new Request('https://function.test',{method:'OPTIONS',headers:{Origin:'https://zholdaskali.github.io'}}));assert.equal(options.status,204);assert.equal(options.headers.get('Access-Control-Allow-Origin'),'https://zholdaskali.github.io');
console.log('PASS Edge Function contract: private teacher access, opaque hashed student tokens, server-side actions/scoring, stale revision protection, CORS, no tokens in roster. Database mocked; real deployment not yet verified.');
