var ANALYSIS_KEYS=['topic','hook','angle','keyPoints','structure','interactionReasons','reusablePattern','limitations'];
var VARIANT_KEYS=['angle','title','coverTitle','hook','body','cta','tags','estimatedDuration'];
function respond(data,status,origin){return new Response(JSON.stringify(data),{status:status||200,headers:{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':origin,'Vary':'Origin'}});}
function originFor(request,env){var origin=request.headers.get('Origin')||'',allowed=String(env.ALLOWED_ORIGINS||'').split(',').map(function(x){return x.trim();}).filter(Boolean);return allowed.indexOf(origin)>=0?origin:'';}
function filled(value){return typeof value==='string'&&!!value.trim();}
function validAnalysis(value){return value&&ANALYSIS_KEYS.every(function(key){return Array.isArray(value[key])?value[key].length>0&&value[key].every(filled):filled(value[key]);});}
function durationRange(duration){var seconds=Number(duration||60);if(seconds<=30)return [70,110];if(seconds<=60)return [120,190];return [190,290];}
function validVariants(value,count){return value&&Array.isArray(value.variants)&&value.variants.length===count&&value.variants.every(function(item){return VARIANT_KEYS.every(function(key){return filled(item[key]);});});}
function parseProviderJson(content){
  var text=String(content||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
  try{return JSON.parse(text);}catch(error){var start=text.indexOf('{'),end=text.lastIndexOf('}');if(start>=0&&end>start)return JSON.parse(text.slice(start,end+1));throw error;}
}
function normalizeVariants(value){
  if(!value||!Array.isArray(value.variants))return value;
  value.variants=value.variants.map(function(item){
    item=item||{};
    if(Array.isArray(item.tags))item.tags=item.tags.join(' ');
    if(item.estimatedDuration!=null)item.estimatedDuration=String(item.estimatedDuration);
    return item;
  });
  return value;
}
function instructions(action,payload){
  var common='你是短视频内容策略助手。只能根据输入中的真实字段工作，不得虚构原视频画面、逐字稿或事实。不得复刻原文、逐句同义替换或保留独特原句。只返回严格 JSON，不要 Markdown。';
  if(action==='analyzeContent')return common+' 分析主题、结构、表达策略和内容角度。返回 topic(string), hook(string), angle(string), keyPoints(string[]), structure(string), interactionReasons(string[]), reusablePattern(string), limitations(string)。'+(payload.contentAvailable?'正文存在，可以结合正文分析。':'没有完整正文，limitations 必须包含“当前仅基于标题和互动数据分析。”');
  var rewrite=payload.action&&payload.action!=='generate';
  var range=durationRange(payload.duration);
  var rewriteRules={
    'new-opening':'只替换开场钩子，其余核心观点保持一致。',
    colloquial:'改成更自然的口语表达，事实和核心观点保持一致。',
    professional:'改成更专业、克制的表达，事实和核心观点保持一致。',
    shorter:'明显压缩当前脚本，body 字数不得超过当前 body 的 70%，estimatedDuration 也要相应缩短。',
    'different-angle':'换一个不同的原创切入角度，不复用当前开场和论述顺序。'
  };
  var lengthRule=payload.action==='shorter'?'':('body 去除空白后目标为 '+range[0]+'-'+range[1]+' 个中文字符，匹配 '+payload.duration+' 秒。');
  return common+(rewrite?'只改写当前这一版，返回 {"variants":[一个版本]}。'+(rewriteRules[payload.action]||''):'生成三个真正不同的原创版本，依次为知识解释型、痛点切入型、观点表达型，返回 {"variants":[三个版本]}。')+' 每个版本包含 angle,title,coverTitle,hook,body,cta,tags,estimatedDuration，均为非空字符串。'+lengthRule+' 平台 '+payload.platform+'、语气 '+payload.tone+'。若输入没有正文，禁止声称知道原作过程、画面或方法，延伸内容必须表述为原创建议而非原作事实。';
}
async function providerCall(env,action,payload,repair){
  var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},Number(env.AI_TIMEOUT_MS||40000));
  try{
    var prompt=instructions(action,payload)+(repair?' 上一次输出未通过结构校验，请修复并完整返回，不要解释。':'');
    var response=await fetch(String(env.AI_BASE_URL||'https://api.xiaomimimo.com/v1').replace(/\/$/,'')+'/chat/completions',{method:'POST',signal:controller.signal,headers:{'Authorization':'Bearer '+env.AI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:env.AI_MODEL,messages:[{role:'system',content:prompt},{role:'user',content:JSON.stringify(payload)}],temperature:0.5})});
    if(!response.ok){var issue=new Error('Provider HTTP '+response.status);issue.status=response.status;throw issue;}
    var body=await response.json(),content=body&&body.choices&&body.choices[0]&&body.choices[0].message&&body.choices[0].message.content;
    if(typeof content!=='string')throw new Error('Provider response missing content');
    return normalizeVariants(parseProviderJson(content));
  }finally{clearTimeout(timer);}
}
async function handle(request,env){
  var origin=originFor(request,env);if(!origin)return respond({ok:false,error:'Origin not allowed'},403,'null');
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'86400','Vary':'Origin'}});
  if(request.method!=='POST')return respond({ok:false,error:'Method not allowed'},405,origin);
  if(!env.AI_API_KEY||!env.AI_MODEL)return respond({ok:false,error:'AI provider is not configured'},503,origin);
  var body;try{body=await request.json();}catch(e){return respond({ok:false,error:'Invalid JSON'},400,origin);}
  if(!body||['analyzeContent','generateScript'].indexOf(body.action)<0||!body.payload)return respond({ok:false,error:'Invalid request'},400,origin);
  var expected=body.action==='analyzeContent'?0:(body.payload.action==='generate'||!body.payload.action?3:1);
  for(var attempt=0;attempt<2;attempt++){
    try{
      var result=await providerCall(env,body.action,body.payload,attempt===1),valid=body.action==='analyzeContent'?validAnalysis(result):validVariants(result,expected);
      if(valid)return respond({ok:true,data:result,meta:{provider:env.AI_PROVIDER_LABEL||'configured-provider',model:env.AI_MODEL}},200,origin);
      if(attempt===1)return respond({ok:false,error:'Provider returned invalid structure'},502,origin);
    }catch(error){
      if(error&&error.status===429)return respond({ok:false,error:'Provider rate limited'},429,origin);
      if(error&&error.name==='AbortError')return respond({ok:false,error:'Provider timeout'},504,origin);
      if(attempt===1)return respond({ok:false,error:'Provider request failed'},502,origin);
    }
  }
}
export default {fetch:handle};
