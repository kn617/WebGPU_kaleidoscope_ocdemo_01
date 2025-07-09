(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))t(e);new MutationObserver(e=>{for(const r of e)if(r.type==="childList")for(const i of r.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&t(i)}).observe(document,{childList:!0,subtree:!0});function f(e){const r={};return e.integrity&&(r.integrity=e.integrity),e.referrerPolicy&&(r.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?r.credentials="include":e.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function t(e){if(e.ep)return;e.ep=!0;const r=f(e);fetch(e.href,r)}})();function C(){const o=document.createElement("video");return o.autoplay=!0,o.playsInline=!0,o.muted=!0,o.style.display="none",document.body.appendChild(o),o}const O=`
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  var positions = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0)
  );
  let pos = positions[vertexIndex];
  var output: VertexOutput;

  let screenAspect = f32(${window.innerWidth}) / f32(${window.innerHeight});
  let aspectCorrection = select(
    vec2<f32>(1.0 / screenAspect, 1.0),
    vec2<f32>(1.0, screenAspect),
    screenAspect > 1.0
  );

  let correctedPos = pos * aspectCorrection;
  output.position = vec4<f32>(correctedPos, 0.0, 1.0);
  output.uv = (correctedPos + vec2<f32>(1.0)) * 0.5;
  return output;
}

@group(0) @binding(0) var cameraTexture: texture_2d<f32>;
@group(0) @binding(1) var cameraSampler: sampler;
@group(0) @binding(2) var<uniform> rotation: f32;
@group(0) @binding(3) var<uniform> parts: u32;

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
  var uv = in.uv - vec2<f32>(0.5);
  let angle = atan2(uv.y, uv.x) + rotation;
  let radius = length(uv);
  let slice = 6.28318530718 / f32(parts);

  let reflectedAngle = angle - slice * floor(angle / slice);
  let mirror = step(0.5, fract(reflectedAngle / slice));
  let finalAngle = mix(reflectedAngle, slice - reflectedAngle, mirror);

  var kaleidoUV = vec2<f32>(cos(finalAngle), sin(finalAngle)) * radius + vec2<f32>(0.5);

  // fractを除去し境界切替反射感をなくし外側も滑らかに表示
  kaleidoUV = clamp(kaleidoUV, vec2<f32>(0.0), vec2<f32>(1.0));

  let color = textureSample(cameraTexture, cameraSampler, kaleidoUV);
  let enhancedColor = pow(color.rgb, vec3<f32>(0.8)) * 1.2;
  return vec4<f32>(enhancedColor, 1.0);
}`;async function S(o){try{const n=document.getElementById("kaleidoscopeCanvas"),t=await(await navigator.gpu.requestAdapter()).requestDevice(),e=n.getContext("webgpu"),r=navigator.gpu.getPreferredCanvasFormat();e.configure({device:t,format:r});const i=C(),b=o?{video:{deviceId:{exact:o}}}:{video:!0},w=await navigator.mediaDevices.getUserMedia(b);i.srcObject=w,await i.play();const d=t.createTexture({size:[640,480],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT}),A=t.createSampler({magFilter:"linear",minFilter:"linear"}),p=t.createShaderModule({code:O}),g=t.createRenderPipeline({vertex:{module:p,entryPoint:"vs_main"},fragment:{module:p,entryPoint:"fs_main",targets:[{format:r}]},primitive:{topology:"triangle-list"},layout:"auto"}),c=t.createBuffer({size:512,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),P=t.createBindGroup({layout:g.getBindGroupLayout(0),entries:[{binding:0,resource:d.createView()},{binding:1,resource:A},{binding:2,resource:{buffer:c,offset:0,size:4}},{binding:3,resource:{buffer:c,offset:256,size:4}}]});let m=0,l=.002;const v=localStorage.getItem("kaleidoscopeSettings");if(v){const a=JSON.parse(v);typeof a.partCount=="number"&&t.queue.writeBuffer(c,256,new Uint32Array([a.partCount])),typeof a.rotationSpeed=="number"&&(l=a.rotationSpeed*.05)}async function y(){const a=localStorage.getItem("kaleidoscopeSettings");if(a){const u=JSON.parse(a);typeof u.partCount=="number"&&t.queue.writeBuffer(c,256,new Uint32Array([u.partCount])),typeof u.rotationSpeed=="number"&&(l=u.rotationSpeed*.001)}m+=l,t.queue.writeBuffer(c,0,new Float32Array([m])),t.queue.copyExternalImageToTexture({source:i},{texture:d},[640,480]);const x=t.createCommandEncoder(),s=x.beginRenderPass({colorAttachments:[{view:e.getCurrentTexture().createView(),loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:1}}]});s.setPipeline(g),s.setBindGroup(0,P),s.draw(6),s.end(),t.queue.submit([x.finish()]),requestAnimationFrame(y)}requestAnimationFrame(y)}catch(n){console.error("❌ Initialization error in Kaleidoscope:",n)}}window.addEventListener("DOMContentLoaded",()=>{S()});
