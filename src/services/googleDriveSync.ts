const CONFIG_KEY='riderhub_phase3_drive_config'
const MODIFIED_KEY='riderhub_phase3_modified_at'
const STATE_FILE='riderhub_phase3_state.json'
const SCOPE='openid email profile https://www.googleapis.com/auth/drive.appdata'

export type DriveProfile={name:string;email:string;picture?:string}
export type DriveConfig={clientId?:string;profile?:DriveProfile;lastSync?:string}
type GoogleTokenResponse={access_token?:string;expires_in?:number;error?:string}

let token=''
let tokenExpires=0
let gisLoading:Promise<void>|null=null

const readConfig=():DriveConfig=>{try{return JSON.parse(localStorage.getItem(CONFIG_KEY)||'{}') as DriveConfig}catch{return{}}}
const writeConfig=(patch:Partial<DriveConfig>)=>{localStorage.setItem(CONFIG_KEY,JSON.stringify({...readConfig(),...patch}))}
export const getDriveConfig=readConfig
export const setDriveClientId=(clientId:string)=>writeConfig({clientId:clientId.trim()})
export const disconnectDrive=()=>{token='';tokenExpires=0;writeConfig({profile:undefined,lastSync:undefined})}
export const isDriveConnected=()=>Boolean(token&&Date.now()<tokenExpires-60_000)
export const markLocalModified=()=>localStorage.setItem(MODIFIED_KEY,String(Date.now()))
export const getLocalModified=()=>Number(localStorage.getItem(MODIFIED_KEY)||0)

function loadGIS(){
  if((window as any).google?.accounts?.oauth2)return Promise.resolve()
  if(gisLoading)return gisLoading
  gisLoading=new Promise<void>((resolve,reject)=>{const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;s.onload=()=>resolve();s.onerror=()=>reject(new Error('Google sign-in could not load'));document.head.appendChild(s)})
  return gisLoading
}

async function driveFetch(url:string,init:RequestInit={}){
  if(!isDriveConnected())throw new Error('Google Drive sync is not connected')
  const headers=new Headers(init.headers||{});headers.set('Authorization',`Bearer ${token}`)
  const r=await fetch(url,{...init,headers})
  if(r.status===401){token='';tokenExpires=0;throw new Error('Google session expired. Reconnect My Account.')}
  if(!r.ok)throw new Error((await r.text().catch(()=>''))||`Google Drive error ${r.status}`)
  return r
}

function escapeQuery(value:string){return value.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}
async function findFileByName(name:string){
  const q=encodeURIComponent(`name='${escapeQuery(name)}' and trashed=false`)
  const r=await driveFetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&orderBy=modifiedTime%20desc&fields=files(id,name,mimeType,modifiedTime,size)&pageSize=10`)
  const j=await r.json() as {files?:Array<{id:string;name:string;mimeType:string;modifiedTime:string;size?:string}>}
  return j.files?.[0]??null
}
async function findDocument(id:string){
  const prefix=`riderhub_doc_${id.replace(/[^a-z0-9_-]/gi,'_')}__`
  const q=encodeURIComponent(`name contains '${escapeQuery(prefix)}' and trashed=false`)
  const r=await driveFetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&orderBy=modifiedTime%20desc&fields=files(id,name,mimeType,modifiedTime,size)&pageSize=10`)
  const j=await r.json() as {files?:Array<{id:string;name:string;mimeType:string;modifiedTime:string;size?:string}>}
  return j.files?.[0]??null
}

async function upload(name:string,blob:Blob,existingId?:string){
  const boundary=`rh_${crypto.randomUUID()}`
  const metadata:Record<string,unknown>={name,mimeType:blob.type||'application/octet-stream'}
  if(!existingId)metadata.parents=['appDataFolder']
  const body=new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    `--${boundary}\r\nContent-Type: ${blob.type||'application/octet-stream'}\r\n\r\n`,blob,`\r\n--${boundary}--`
  ],{type:`multipart/related; boundary=${boundary}`})
  const url=existingId?`https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart&fields=id,name,modifiedTime`:'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime'
  const r=await driveFetch(url,{method:existingId?'PATCH':'POST',headers:{'Content-Type':`multipart/related; boundary=${boundary}`},body})
  return r.json()
}

async function loadProfile(){
  const r=await driveFetch('https://www.googleapis.com/oauth2/v3/userinfo')
  const j=await r.json() as {name?:string;email?:string;picture?:string}
  const profile={name:j.name||j.email||'Rider',email:j.email||'',picture:j.picture}
  writeConfig({profile})
  return profile
}

export async function connectDrive(forceConsent=false):Promise<DriveProfile>{
  const {clientId}=readConfig();if(!clientId)throw new Error('Add your Google Web Client ID first')
  await loadGIS()
  const response=await new Promise<GoogleTokenResponse>((resolve,reject)=>{
    const client=(window as any).google.accounts.oauth2.initTokenClient({client_id:clientId,scope:SCOPE,prompt:forceConsent?'consent':'',callback:(r:GoogleTokenResponse)=>r.error?reject(new Error(r.error)):resolve(r)})
    client.requestAccessToken()
  })
  if(!response.access_token)throw new Error('Google did not return an access token')
  token=response.access_token;tokenExpires=Date.now()+Number(response.expires_in||3600)*1000
  return loadProfile()
}

export async function uploadPrivateDocument(id:string,file:File){
  if(!isDriveConnected())return false
  const previous=await findDocument(id)
  const safeName=file.name.replace(/[\\/]/g,'_')
  const cloudName=`riderhub_doc_${id.replace(/[^a-z0-9_-]/gi,'_')}__${safeName}`
  await upload(cloudName,file,previous?.id)
  writeConfig({lastSync:new Date().toISOString()})
  return true
}

export async function downloadPrivateDocument(id:string):Promise<File|null>{
  if(!isDriveConnected())return null
  const found=await findDocument(id);if(!found)return null
  const r=await driveFetch(`https://www.googleapis.com/drive/v3/files/${found.id}?alt=media`)
  const blob=await r.blob();const marker='__';const name=found.name.includes(marker)?found.name.split(marker).slice(1).join(marker):found.name
  return new File([blob],name,{type:found.mimeType||blob.type||'application/octet-stream',lastModified:Date.now()})
}

export async function deletePrivateDocument(id:string){
  if(!isDriveConnected())return false
  const found=await findDocument(id);if(!found)return false
  await driveFetch(`https://www.googleapis.com/drive/v3/files/${found.id}`,{method:'DELETE'});return true
}

export type CloudStateEnvelope<T>={updatedAt:number;state:T}
export async function syncAppState<T>(localState:T,replace:(state:T)=>void){
  if(!isDriveConnected())throw new Error('Connect Google Drive first')
  const existing=await findFileByName(STATE_FILE);const localAt=getLocalModified()||Date.now()
  if(existing){
    const r=await driveFetch(`https://www.googleapis.com/drive/v3/files/${existing.id}?alt=media`)
    const remote=await r.json() as CloudStateEnvelope<T>
    if(Number(remote.updatedAt||0)>localAt){replace(remote.state);localStorage.setItem(MODIFIED_KEY,String(remote.updatedAt));writeConfig({lastSync:new Date().toISOString()});return 'downloaded' as const}
    await upload(STATE_FILE,new Blob([JSON.stringify({updatedAt:localAt,state:localState})],{type:'application/json'}),existing.id)
  }else{
    await upload(STATE_FILE,new Blob([JSON.stringify({updatedAt:localAt,state:localState})],{type:'application/json'}))
  }
  writeConfig({lastSync:new Date().toISOString()});return 'uploaded' as const
}
