export async function api(path,{method='GET',body,signal}={}) {
  let res;try{res=await fetch(path,{method,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal});}catch(e){if(e.name==='AbortError')throw e;throw new Error('We could not connect. Check your connection and try again.');}
  const data=await res.json();if(!res.ok){const err=new Error(data.error??'Please try again.');err.status=res.status;throw err;}return data;
}
