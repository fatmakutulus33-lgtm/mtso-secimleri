export function registerElectionTools(selectGroup:(id:number)=>void,groups:{id:number;name:string}[],lists:{id:string;group:number;name:string}[]){
 const context=(document as Document & {modelContext?:{registerTool:(tool:unknown,options:{signal:AbortSignal})=>void|Promise<void>}}).modelContext;
 if(!context)return;
 const lifecycle=new AbortController();
 try{void Promise.resolve(context.registerTool({name:'open_election_group',description:'Open a Mersin 2026 profession group and return its available poll lists. Does not cast a vote.',inputSchema:{type:'object',properties:{group:{type:'integer'}},required:['group'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute(input:unknown){const g=(input as {group?:number})?.group;if(typeof g!=='number'||!groups.some(x=>x.id===g))throw Error('Invalid group');selectGroup(g);return {group:groups.find(x=>x.id===g),lists:lists.filter(x=>x.group===g).map(x=>({id:x.id,name:x.name}))}}},{signal:lifecycle.signal})).catch(console.error)}catch(e){console.error(e)}
 return ()=>lifecycle.abort();
}
