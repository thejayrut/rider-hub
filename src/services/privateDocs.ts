const DB_NAME='riderhub_phase3_private_docs'
const STORE='docs'

function openDb():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const q=indexedDB.open(DB_NAME,1);q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains(STORE))q.result.createObjectStore(STORE)};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)})}

export async function savePrivateDoc(id:string,file:File){const db=await openDb();return new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(file,id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}
export async function getPrivateDoc(id:string){const db=await openDb();return new Promise<File|undefined>((resolve,reject)=>{const q=db.transaction(STORE).objectStore(STORE).get(id);q.onsuccess=()=>resolve(q.result as File|undefined);q.onerror=()=>reject(q.error)})}
export async function deletePrivateDoc(id:string){const db=await openDb();return new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}
export async function openPrivateDoc(id:string){const f=await getPrivateDoc(id);if(!f)return false;const url=URL.createObjectURL(f);window.open(url,'_blank','noopener');setTimeout(()=>URL.revokeObjectURL(url),60_000);return true}
