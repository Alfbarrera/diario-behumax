const EX={
 A:["Press de pecho","Extensión de cuádriceps","Remo sentado","Curl de bíceps"],
 B:["Jalón al pecho","Press de piernas","Curl femoral de pie con polea (solo si se confirma montaje y ejecución)","Extensión de tríceps"],
 C:["Press de pecho","Remo sentado","Extensión de cuádriceps","Curl de bíceps","Extensión de tríceps"]
};
const ALL=[...new Set(Object.values(EX).flat())];
const $=id=>document.getElementById(id);
const today=()=>new Date().toISOString().slice(0,10);
let data=load();
function load(){try{return JSON.parse(localStorage.getItem("beh_daily_v1"))||{logs:[],measures:[]}}catch{return {logs:[],measures:[]}}}
function persist(){localStorage.setItem("beh_daily_v1",JSON.stringify(data));renderAll()}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function init(){
 $("date").value=today();$("measureDate").value=today();
 ["lumbar","shoulder"].forEach(id=>{$(id).innerHTML=Array.from({length:11},(_,i)=>`<option value="${i}">${i}</option>`).join("")});
 $("daySelect").addEventListener("click",e=>{const b=e.target.closest("button[data-day]");if(!b)return;document.querySelectorAll("#daySelect button").forEach(x=>x.classList.toggle("selected",x===b));fillExercises()});
 fillExercises();document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
 $("saveExercise").onclick=saveExercise;$("saveMeasure").onclick=saveMeasure;
 $("export").onclick=exportData;$("import").onclick=importData;$("clearAll").onclick=clearAll;
 renderAll();if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
}
function selectedDay(){return document.querySelector("#daySelect .selected")?.dataset.day||"A"}
function fillExercises(){const day=selectedDay();$("exercise").innerHTML=EX[day].map(x=>`<option>${esc(x)}</option>`).join("")}
function saveExercise(){
 const w=$("weight").value,sets=$("sets").value,reps=$("reps").value;
 if(w===""||Number(w)<0||!sets||Number(sets)<1||!reps||Number(reps)<1){alert("Indica un peso válido, series y repeticiones.");return}
 data.logs.unshift({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),date:$("date").value||today(),day:selectedDay(),exercise:$("exercise").value,weight:Number(w),sets:Number(sets),reps:Number(reps),effort:$("effort").value,lumbar:Number($("lumbar").value),shoulder:Number($("shoulder").value),notes:$("notes").value});
 persist();$("weight").value="";$("notes").value="";$("effort").value="";alert("Ejercicio guardado.");
}
function saveMeasure(){
 const bw=$("bodyWeight").value,waist=$("waist").value;if(bw===""&&waist===""){alert("Introduce al menos el peso o la cintura.");return}
 data.measures.unshift({id:Date.now(),date:$("measureDate").value||today(),bodyWeight:bw===""?null:Number(bw),waist:waist===""?null:Number(waist)});
 persist();$("bodyWeight").value="";$("waist").value="";
}
function showTab(tab){document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));["train","history","body","backup"].forEach(id=>$(id).classList.toggle("hidden",id!==tab));}
function renderAll(){renderHistory();renderMeasures();$("counts").textContent=`${data.logs.length} registros de ejercicios · ${data.measures.length} mediciones corporales`;}
function renderHistory(){
 $("historyStats").innerHTML=`<div class="stat"><b>${data.logs.length}</b><span>Registros</span></div><div class="stat"><b>${new Set(data.logs.map(x=>x.date)).size}</b><span>Días entrenados</span></div><div class="stat"><b>${data.logs.filter(x=>x.lumbar>0||x.shoulder>0).length}</b><span>Con molestias</span></div>`;
 $("historyList").innerHTML=data.logs.length?data.logs.map(x=>`<div class="entry"><div class="exercise-top"><strong>${esc(x.exercise)}</strong><span class="tag">${esc(x.date)} · Día ${esc(x.day)}</span></div><p>${x.weight} kg · ${x.sets} series × ${x.reps} rep. ${x.effort?`· Esfuerzo ${x.effort}/10`:""}</p><p>Lumbar ${x.lumbar}/10 · Hombro ${x.shoulder}/10</p>${x.notes?`<p>${esc(x.notes)}</p>`:""}<button class="danger" onclick="deleteLog('${x.id}')">Eliminar registro</button></div>`).join(""):'<p class="small">Todavía no hay ejercicios registrados.</p>';
}
function deleteLog(id){if(confirm("¿Eliminar este registro?")){data.logs=data.logs.filter(x=>x.id!==id);persist()}}
function renderMeasures(){$("measureList").innerHTML=data.measures.length?data.measures.map(x=>`<div class="entry"><strong>${esc(x.date)}</strong><p>Peso: ${x.bodyWeight??"—"} kg · Cintura: ${x.waist??"—"} cm</p><button class="danger" onclick="deleteMeasure(${x.id})">Eliminar</button></div>`).join(""):'<p class="small">Todavía no hay mediciones.</p>'}
function deleteMeasure(id){if(confirm("¿Eliminar esta medición?")){data.measures=data.measures.filter(x=>x.id!==id);persist()}}
function exportData(){const blob=new Blob([JSON.stringify({app:"Mi entrenamiento Behumax",version:1,exportedAt:new Date().toISOString(),...data},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`entrenamiento-copia-${today()}.json`;a.click();URL.revokeObjectURL(a.href);$("backupMsg").textContent="Copia descargada. Guárdala fuera del móvil."}
async function importData(){const f=$("importFile").files[0];if(!f){alert("Selecciona primero un archivo JSON.");return}try{const x=JSON.parse(await f.text());if(!Array.isArray(x.logs)||!Array.isArray(x.measures))throw Error();if(!confirm("La importación sustituirá los datos actuales. ¿Continuar?"))return;data={logs:x.logs,measures:x.measures};persist();$("backupMsg").textContent="Copia restaurada correctamente."}catch{$("backupMsg").textContent="No se pudo importar: archivo no válido."}}
function clearAll(){if(confirm("Esto borrará todos tus entrenamientos y mediciones de este dispositivo. ¿Estás seguro?")&&confirm("Última confirmación: ¿borrar definitivamente?")){data={logs:[],measures:[]};persist()}}
init();