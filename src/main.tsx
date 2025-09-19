import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactDOM from "react-dom/client";

/**
 * 🎂 Amy's Birthday Game — compact, single-file React app
 * Flow: Wordle → Balloons → Beach Postcard → Candle → Finale
 * Notes: mobile-first (Galaxy S21 OK), concise code
 * Update: Global full-screen **black + glitter** background for EVERY page.
 */

// ---------- Constants & Palette -------------------------------------------
const TARGET = "BIRTHDAY"; // 8 letters
const ROWS = 6, COLS = TARGET.length;
const PAL = { ORANGE: "#FE5000", ORANGE_HI: "#FF6A21", BROWN: "#4F2C1D", BROWN_DK: "#3A2014", TAN: "#CDA077", CREAM: "#FFF5EC", CREAM2: "#FFE7D2" };
const keys1 = [..."QWERTYUIOP"], keys2 = [..."ASDFGHJKL"], keys3 = ["ENTER", ..."ZXCVBNM", "⌫"];

// ---------- Helpers --------------------------------------------------------
function evaluateGuess(guess: string, target: string) {
  const res = Array(COLS).fill("absent"), cnt: Record<string, number> = {};
  for (const c of target) cnt[c] = (cnt[c] || 0) + 1;
  for (let i = 0; i < COLS; i++) if (guess[i] === target[i]) { res[i] = "correct"; cnt[guess[i]]--; }
  for (let i = 0; i < COLS; i++) if (res[i] !== "correct" && cnt[guess[i]] > 0) { res[i] = "present"; cnt[guess[i]]--; }
  return res as Array<"correct"|"present"|"absent">;
}

// ---------- Global glitter (full-screen, matches pure black) ---------------
function Glitter({ density = 160 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = c.getContext('2d'); if (!ctx) return;
    let dpr = Math.max(1, window.devicePixelRatio || 1), w = c.clientWidth, h = c.clientHeight;
    const resize = () => { dpr = Math.max(1, window.devicePixelRatio || 1); w = c.clientWidth; h = c.clientHeight; c.width = Math.floor(w * dpr); c.height = Math.floor(h * dpr); ctx.setTransform(dpr,0,0,dpr,0,0); };
    resize(); addEventListener('resize', resize);
    const small = innerWidth < 480; const N = small ? Math.max(40, Math.round(density * .6)) : density;
    const parts = Array.from({ length: N }, () => ({ x: Math.random()*w, y: Math.random()*h, vx:(Math.random()-.5)*1.2, vy:(Math.random()-.6)*1.2, s: 2+Math.random()*3, hue: Math.floor(Math.random()*360), life: 0, max: 200+Math.random()*100 }));
    let raf = 0 as number; const step = () => { ctx.clearRect(0,0,w,h); for (const p of parts){ p.vy+=.01; p.x+=p.vx; p.y+=p.vy; p.life++; if(p.x<-20||p.x>w+20||p.y>h+20||p.life>p.max){ Object.assign(p,{ x:Math.random()*w, y:-10, vx:(Math.random()-.5)*1.2, vy:Math.random()*1.1+.3, s:2+Math.random()*3, hue:Math.floor(Math.random()*360), life:0, max:200+Math.random()*100 }); }
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.life*.05); ctx.fillStyle=`hsl(${p.hue} 95% 60% / ${1-p.life/p.max})`; ctx.fillRect(-p.s/2,-p.s/2,p.s,p.s); ctx.restore(); }
      raf = requestAnimationFrame(step);
    }; raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); };
  }, [density]);
  // Explicit black to ensure perfect match, sits behind everything
  return <canvas ref={ref} className="pointer-events-none w-full h-full" style={{ position:'fixed', inset:0, background:'#000', backgroundImage:'radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,.12), transparent 60%), radial-gradient(1px 1px at 60% 70%, rgba(255,255,255,.08), transparent 60%)', zIndex:0 }} />;
}

// Simple confetti burst (DOM divs)
function burstConfetti(container: HTMLElement | null, count=120, y="50%", jewel=false){ if(!container) return; for(let i=0;i<count;i++){ const p=document.createElement('div'); p.className='pointer-events-none fixed left-1/2 top-1/2 w-1.5 h-1.5 rotate-45'; p.style.left='50%'; p.style.top=y; p.style.background=jewel?`hsl(${Math.random()*360} 90% ${40+Math.random()*30}%)`:'white'; p.style.filter=jewel?'drop-shadow(0 0 6px rgba(255,255,255,.7))':''; const a=Math.random()*Math.PI*2, s=4+Math.random()*8, vx=Math.cos(a)*s, vy=Math.sin(a)*s; container.appendChild(p); let life=0; const step=()=>{ life++; const dx=vx*life*.5, dy=vy*life*.5+life*.4; (p as HTMLDivElement).style.transform=`translate(${dx}px,${dy}px) rotate(${life*8}deg)`; (p as HTMLDivElement).style.opacity=String(1-life/120); if(life<120) requestAnimationFrame(step); else p.remove(); }; requestAnimationFrame(step);} }

// ---------- Small UI bits --------------------------------------------------
const Header = () => (<header className="w-full flex items-center justify-center py-3 text-3xl select-none relative z-10"><span role="img" aria-label="cake">🎂</span></header>);
const Accents = () => (
  <div className="relative mb-3 -mt-1">
    <div className="h-[6px] w-full rounded-full" style={{ background: `linear-gradient(90deg, ${PAL.ORANGE_HI}, ${PAL.ORANGE})` }}/>
    <motion.span className="absolute -top-2 -left-1" animate={{ scale:[.9,1.1,.95,1] }} transition={{ duration:2.2, repeat:Infinity }}>✨</motion.span>
    <motion.span className="absolute -top-3 left-1/3" animate={{ scale:[1,1.15,.95,1] }} transition={{ duration:2.6, repeat:Infinity }}>✨</motion.span>
    <motion.span className="absolute -top-2 right-6" animate={{ rotate:[0,12,-8,0] }} transition={{ duration:2.1, repeat:Infinity }}>✨</motion.span>
  </div>
);

function Tile({ ch, state, k }: { ch: string; state: string; k: string }){
  const base: React.CSSProperties = state==="correct" ? { background:`linear-gradient(180deg, ${PAL.ORANGE_HI}, ${PAL.ORANGE})`, borderColor:'#b33e00', color:'#fff', boxShadow:'0 8px 18px rgba(254,80,0,.35), inset 0 1px 0 rgba(255,255,255,.25)' } : state==="present" ? { background:`linear-gradient(180deg, ${PAL.TAN}, #eac09a)`, borderColor:PAL.BROWN, color:PAL.BROWN_DK, boxShadow:'0 8px 16px rgba(205,160,119,.35), inset 0 1px 0 rgba(255,255,255,.4)' } : state==="absent" ? { background:'linear-gradient(180deg, rgba(79,44,29,.75), rgba(79,44,29,.55))', borderColor:PAL.BROWN, color:'#fff' } : { background:'linear-gradient(180deg, rgba(79,44,29,.35), rgba(79,44,29,.2))', borderColor:'#6b4a38', color:'#fff' };
  return <motion.div key={k} initial={{scale:.9,opacity:.9}} animate={{scale:1,opacity:1}} transition={{type:'spring',stiffness:420,damping:22}} className="grid place-items-center rounded-2xl border font-extrabold tracking-wide" style={{ ...base, width:'clamp(36px,10vw,64px)', height:'clamp(36px,10vw,64px)', fontSize:'clamp(18px,4.6vw,28px)' }}>{ch||''}</motion.div>;
}

function Keyboard({ onKey }: { onKey:(k:string)=>void }){
  const Key = ({ k }: { k:string }) => {
    const isE = k==="ENTER", isB = k==="⌫";
    const style: React.CSSProperties = isE ? { background:`linear-gradient(180deg, ${PAL.ORANGE_HI}, ${PAL.ORANGE})`, color:'#fff', borderColor:'#b33e00', boxShadow:'0 6px 14px rgba(254,80,0,.35)' } : isB ? { background:`linear-gradient(180deg, ${PAL.TAN}, #e7bb93)`, color:PAL.BROWN_DK, borderColor:PAL.BROWN } : { background:`linear-gradient(180deg, ${PAL.BROWN}, #3d2418)`, color:'#fff', borderColor:'rgba(255,255,255,.18)', boxShadow:'0 6px 14px rgba(79,44,29,.35)' };
    return <button onClick={()=>onKey(k)} className="px-3 py-2 sm:px-5 sm:py-3 rounded-2xl border active:scale-95 transition text-base sm:text-xl hover:brightness-110 hover:-translate-y-[1px]" style={style}>{k}</button>;
  };
  return (
    <div className="mt-5 space-y-3">
      <div className="flex gap-2 justify-center flex-wrap">{keys1.map(k=> <Key key={k} k={k}/>)}</div>
      <div className="flex gap-2 justify-center flex-wrap">{keys2.map(k=> <Key key={k} k={k}/>)}</div>
      <div className="flex gap-2 justify-center flex-wrap">{keys3.map(k=> <Key key={k} k={k}/>)}</div>
    </div>
  );
}

// ---------- Tiny built-in music (no files; starts on first tap) ----------
function useBirthdaySynth(){
  const ctxRef = useRef<any>(null), gainRef = useRef<any>(null), loopRef = useRef<number|undefined>(undefined);
  const ensure = () => { const AC=(window as any).AudioContext||(window as any).webkitAudioContext; if(!AC) return null; if(!ctxRef.current){ const ctx=new AC(); const g=ctx.createGain(); g.gain.value=0.12; g.connect(ctx.destination); ctxRef.current=ctx; gainRef.current=g; } return ctxRef.current; };
  const toHz=(n:string)=>{ const m=n.match(/^([A-G])([#b]?)([0-9])$/); if(!m) return 440; const base:any={C:-9,D:-7,E:-5,F:-4,G:-2,A:0,B:2}; const semi=base[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0)+(parseInt(m[3],10)-4)*12; return 440*Math.pow(2,semi/12); };
  const blip=(t:number,hz:number,d:number)=>{ const ctx=ctxRef.current, g=gainRef.current; const o=ctx.createOscillator(), eg=ctx.createGain(); o.type='sine'; o.frequency.setValueAtTime(hz,t); eg.gain.setValueAtTime(0,t); eg.gain.linearRampToValueAtTime(0.12,t+0.03); eg.gain.setTargetAtTime(0,t+d*0.7,0.06); o.connect(eg); eg.connect(g); o.start(t); o.stop(t+d+0.08); };
  const play=()=>{ const ctx=ensure(); if(!ctx) return false; if(ctx.state==='suspended') ctx.resume(); const beat=0.55; let t=ctx.currentTime+0.05; const seq:[string,number][]= [ ['G4',1],['G4',1],['A4',2/3],['G4',2/3],['C5',2/3],['B4',4/3], ['G4',1],['G4',1],['A4',2/3],['G4',2/3],['D5',2/3],['C5',4/3], ['G4',1],['G4',1],['G5',2/3],['E5',2/3],['C5',2/3],['B4',2/3],['A4',4/3], ['F5',1],['F5',1],['E5',2/3],['C5',2/3],['D5',2/3],['C5',4/3] ];
    for(const [nn,beats] of seq){ const d=Math.max(0.22, beat*beats); blip(t,toHz(nn),d); t+=d; }
    const ms=Math.max(60,(t-ctx.currentTime)*1000-20); if(loopRef.current) clearTimeout(loopRef.current); loopRef.current=window.setTimeout(play, ms); return true; };
  const start=()=>{ try{ if(loopRef.current) clearTimeout(loopRef.current); return play(); }catch{ return false; } };
  const stop = ()=>{ if(loopRef.current) clearTimeout(loopRef.current); const ctx=ctxRef.current; if(ctx && ctx.state==='running'){ try{ ctx.suspend(); }catch{} } };
  useEffect(()=>()=>stop(),[]);
  return { start, stop } as const;
}

// ---------- Scenes --------------------------------------------------------- ---------------------------------------------------------
function WordleScene({ onSolved }: { onSolved: () => void }){
  const [board,setBoard] = useState(Array.from({length:ROWS},()=>Array(COLS).fill('')));
  const [state,setState] = useState(Array.from({length:ROWS},()=>Array(COLS).fill('empty')));
  const [r,setR] = useState(0); const [c,setC] = useState(0);
  const [msg,setMsg] = useState('Guess the word to start the party!');
  const [shake,setShake] = useState(-1); const [win,setWin] = useState(false);

  useEffect(()=>{ const h=(e:KeyboardEvent)=>{ const k=(e.key||'').toUpperCase(); if(k>='A'&&k<='Z'&&k.length===1) type(k); else if(k==='BACKSPACE') type('⌫'); else if(k==='ENTER') type('ENTER'); }; window.addEventListener('keydown',h); return()=>window.removeEventListener('keydown',h); },[r,c,board]);

  const submit=()=>{ const g=board[r].join(''); const res=evaluateGuess(g,TARGET); setState(state.map((row,i)=> i===r?res:row)); if(g===TARGET){ setWin(true); setMsg('You did it! 🎉'); setTimeout(onSolved,900); } else if(r+1===ROWS){ setMsg(`It was ${TARGET}. But we'll let it slide 😅`); setTimeout(onSolved,1200); } else { setR(r+1); setC(0); setMsg('Close! Try again.'); } };
  const type=(k:string)=>{ if(win) return; if(k==='ENTER'){ if(c!==COLS){ setMsg('Need all letters'); return; } submit(); return; } if(k==='⌫'){ if(c>0){ const b=board.map(r=>r.slice()); b[r][c-1]=''; setBoard(b); setC(c-1);} return; } if(c<COLS && /^[A-Z]$/.test(k)){ const b=board.map(r=>r.slice()); b[r][c]=k; const nc=c+1; setBoard(b); setC(nc); if(nc===COLS && b[r].join('')===TARGET) setTimeout(()=>type('ENTER'),60); return; } if(c>=COLS){ setShake(r); setTimeout(()=>setShake(-1),200);} };

  return (
    <div className="flex flex-col items-center">
      <Accents/>
      <div className="text-sm mb-3" style={{ color: PAL.BROWN, textShadow:'0 1px 2px rgba(0,0,0,.6)' }}>Type or use the keyboard below. Target is 8 letters.</div>
      <div className="grid gap-2">
        {board.map((row,i)=> (
          <motion.div key={i} animate={i===shake?{x:[0,-5,5,-5,5,0]}:{x:0}} transition={{duration:.2}} className="grid grid-cols-8 gap-1 sm:gap-2">
            {row.map((ch,j)=> <Tile key={`${i}-${j}-${ch}`} ch={ch} state={state[i][j]} k={`${i}-${j}-${ch}`}/>) }
          </motion.div>
        ))}
      </div>
      <div className="mt-3 min-h-[1.5rem]" style={{ color: PAL.BROWN_DK, textShadow:'0 1px 2px rgba(0,0,0,.6)' }}>{msg}</div>
      <Keyboard onKey={type}/>
      {!win && c===COLS && (<button onClick={()=>type('ENTER')} className="mt-3 sm:hidden px-4 py-2 rounded-xl bg-orange-500 text-white font-semibold shadow active:scale-95">Submit</button>)}
    </div>
  );
}

function Balloons({ onDone }: { onDone: () => void }){
  const small = typeof window!=='undefined' && (innerWidth<480 || (window.screen && window.screen.width<480));
  const count = small ? 90 : 172;
  const items = useMemo(()=> Array.from({length:count},(_,i)=>({ id:i, size:(small?50:70)+Math.round(Math.random()*(small?60:80)), x:5+Math.random()*90, y:60+Math.random()*30, hue:Math.floor(Math.random()*360), dur:(small?7:8)+Math.random()*(small?10:14), delay:Math.random()*3.5, drift:8+Math.random()*14, ease:(['easeOut','easeInOut','anticipate'] as const)[Math.floor(Math.random()*3)] })),[count,small]);
  useEffect(()=>{ const id=setTimeout(onDone, small?6500:8000); return()=>clearTimeout(id); },[onDone,small]);
  return (
    <div className="fixed inset-0 overflow-hidden">{/* transparent to show global glitter */}
      {items.map(b=> (
        <motion.div key={b.id} initial={{ y:`${b.y}vh`, opacity:.98 }} animate={{ y:'-20vh' }} transition={{ duration:b.dur, delay:b.delay, ease:b.ease }} className="absolute rounded-full shadow-2xl pointer-events-none will-change-transform" style={{ left:`calc(${b.x}% - ${b.size/2}px)`, top:0, width:b.size, height:b.size, background:`radial-gradient(40% 40% at 30% 30%, hsl(${b.hue} 98% 78%), hsl(${b.hue} 88% 55%))`, filter:'saturate(1.5) brightness(1.05)' }}>
          <motion.div className="absolute inset-0 rounded-full will-change-transform" animate={{ x:[-b.drift,b.drift,-b.drift*.6,b.drift*.6,0], rotate:[-6,6,-3,3,0] }} transition={{ duration:4+Math.random()*2, repeat:Infinity, ease:'easeInOut' }} style={{ background:'radial-gradient(20% 20% at 25% 25%, rgba(255,255,255,.55), rgba(255,255,255,0) 60%)', borderRadius:'9999px' }}/>
          <motion.div className="absolute left-1/2 -translate-x-1/2 bg-white/70 will-change-transform" style={{ bottom:-Math.round(b.size*.8), width:2, height:Math.round(b.size*.9) }} animate={{ opacity:[.7,1,.7] }} transition={{ duration:2, repeat:Infinity }}/>
        </motion.div>
      ))}
    </div>
  );
}

function Postcard({ onContinue }: { onContinue: () => void }){
  useEffect(()=>{ burstConfetti(document.body, 120, '60%'); },[]);
  return (
    <div className="min-h-[60vh] grid place-items-center">
      <motion.div
        initial={{ y:40, opacity:0 }}
        animate={{ y:0, opacity:1 }}
        transition={{ type:'spring', stiffness:120, damping:14 }}
        className="w-[min(96vw,720px)] sm:aspect-[3/2] rounded-3xl shadow-2xl border border-sky-200 relative overflow-hidden bg-gradient-to-b from-sky-100 via-sky-200 to-amber-100 cursor-pointer"
        role="button"
        tabIndex={0}
        onClick={onContinue}
        onKeyDown={(e)=>{ if(e.key==='Enter' || e.key===' ') onContinue(); }}
      >
        {/* Decorative ocean bits (card stays on top of black+glitter bg) */}
        <div className="absolute inset-0 rounded-3xl pointer-events-none">
          <div className="absolute top-2 left-2 w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-yellow-200 to-amber-300 shadow-[0_0_60px_rgba(255,215,0,.5)]"/>
          <svg className="absolute bottom-24 sm:bottom-20 left-0 w-full opacity-70" viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M0,40 C150,120 350,0 600,60 C850,120 1050,20 1200,60 L1200,120 L0,120 Z" fill="rgba(14,165,233,0.3)"/></svg>
          <svg className="absolute bottom-16 sm:bottom-14 left-0 w-full opacity-80" viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M0,20 C200,100 400,0 600,40 C800,80 1000,10 1200,40 L1200,120 L0,120 Z" fill="rgba(56,189,248,0.35)"/></svg>
          <motion.span className="absolute" style={{ bottom:76, left:'12%', fontSize:18 }} animate={{ y:[0,-2,0] }} transition={{ duration:2.4, repeat:Infinity }}>🐬</motion.span>
          <motion.span className="absolute" style={{ bottom:82, left:'30%', fontSize:18 }} animate={{ y:[0,-1.5,0] }} transition={{ duration:2.1, repeat:Infinity, delay:.2 }}>🐟</motion.span>
          <motion.span className="absolute" style={{ bottom:78, left:'52%', fontSize:18 }} animate={{ y:[0,-2.2,0] }} transition={{ duration:2.6, repeat:Infinity, delay:.1 }}>🐠</motion.span>
          <motion.span className="absolute" style={{ bottom:74, left:'72%', fontSize:18 }} animate={{ y:[0,-1.8,0] }} transition={{ duration:2.3, repeat:Infinity, delay:.15 }}>🐙</motion.span>
          <div className="absolute bottom-0 left-0 right-0 h-14 sm:h-16 bg-gradient-to-t from-amber-200/90 to-transparent"/>
          <div className="absolute bottom-2 left-4 text-xl sm:text-2xl rotate-[-10deg]">🐚</div>
          <div className="absolute bottom-3 left-16 text-xl sm:text-2xl rotate-[8deg]">⭐</div>
          <div className="absolute bottom-2 right-6 text-xl sm:text-2xl rotate-[6deg]">🐚</div>
        </div>
        {/* Content */}
        <div className="relative z-10 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-stretch">
            <div className="sm:w-2/3 text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-sky-700 leading-tight">Happy Birthday AJ!!!</h2>
              <p className="mt-2 sm:mt-3 text-rose-900/90 leading-relaxed text-base sm:text-lg">Amy, you are such a light—blessed to know you, pure delight.<br className="hidden sm:block"/>Seventy‑two and shining bright.</p>
              <div className="mt-3 text-rose-500 text-sm">— B</div>
            </div>
            <div className="sm:w-1/3 grid place-items-center">
              <motion.div className="text-5xl sm:text-6xl" animate={{ y:[0,-4,0] }} transition={{ duration:2.2, repeat:Infinity, ease:"easeInOut" }} title="Seahorse">🩵🪼</motion.div>
            </div>
          </div>
          <div className="mt-4 text-center sm:text-right text-xs text-rose-500/80">Tap the postcard to continue</div>
        </div>
        <button onClick={onContinue} aria-label="Continue" className="absolute inset-0 z-30 cursor-pointer bg-transparent"/>
      </motion.div>
    </div>
  );
}

function Candle({ onBlown }: { onBlown: () => void }){
  const Sparkles = ({ n=26 }: { n?: number }) => <> {Array.from({length:n},(_,i)=>{ const left=Math.random()*60-30, top=Math.random()*80-40, size=4+Math.random()*6, delay=Math.random()*1.5, hue=Math.floor(Math.random()*40)+20; return <motion.div key={i} initial={{opacity:0,scale:.6}} animate={{opacity:[0,1,0],scale:[.6,1.1,.6],y:[-4,0,-6]}} transition={{duration:1.8,repeat:Infinity,delay}} className="absolute rounded-full shadow" style={{ left:`calc(50% + ${left}px)`, top:`calc(38% + ${top}px)`, width:size, height:size, background:`hsl(${hue} 90% 80%)`, filter:'drop-shadow(0 0 6px rgba(255,255,200,.9))' }}/>; }) } </>;
  const BaseOrbs = ({ y=120 }) => <> {Array.from({length:12},(_,i)=>{ const t=i/12*2*Math.PI, r=22, cx=140, cy=165+y, x=cx+Math.cos(t)*r, yy=cy+Math.sin(t)*r, hue=180+Math.random()*50, size=6+Math.random()*3; return <motion.div key={i} className="absolute rounded-full pointer-events-none" style={{ left:x-size/2, top:yy-size/2, width:size, height:size, background:`radial-gradient(circle at 30% 30%, hsl(${hue} 95% 85%), hsl(${hue} 80% 55%))`, filter:'drop-shadow(0 0 8px rgba(0,255,240,.8))' }} animate={{ y:[0,-2,0], opacity:[.85,1,.85] }} transition={{ duration:1.8+Math.random()*.8, repeat:Infinity, delay:Math.random()*.4 }}/>; }) } </>;
  return (
    <div className="relative min-h-[72vh] grid place-items-center rounded-3xl overflow-visible p-6">{/* transparent to show global glitter */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative w-[280px] h-[440px] mt-6 flex flex-col items-center">
          {/* Candle on top of cupcake */}
          <div className="relative mt-[120px] flex flex-col items-center">
            <div className="w-10 h-36 bg-gradient-to-b from-teal-400 to-cyan-700 rounded-t-2xl shadow-[0_0_40px_rgba(0,200,200,.55)]">
              <div className="absolute top-8 left-1/2 -translate-x-1/2 w-6 h-5 bg-cyan-300/80 rounded-b-xl"/>
              <div className="absolute top-14 left-2 w-4 h-4 bg-cyan-300/80 rounded-b-xl"/>
              <div className="absolute top-[4.5rem] right-2 w-4 h-4 bg-cyan-300/80 rounded-b-xl"/>
            </div>
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-[2px] h-6 bg-zinc-900 rounded-full"/>
            <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-24 h-32" style={{ marginLeft: '10px' }}>{/* Wrapper keeps translateX(-50%) separate from Motion transforms */}
  <motion.div className="w-full h-full" animate={{ y:[0,-2,0,2,0], scaleX:[1,1.06,.96,1.04,1], rotate:[-2,2,-1,1,0] }} transition={{ duration:1.6, repeat:Infinity }} style={{ transformOrigin:'50% 85%' }}>
    <svg viewBox="0 0 100 140" className="w-full h-full drop-shadow-[0_0_46px_rgba(255,200,120,.95)]">
      <defs>
        <radialGradient id="flameCore" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#fffdf0"/><stop offset="45%" stopColor="#ffe680"/><stop offset="80%" stopColor="#ff9d3c"/><stop offset="100%" stopColor="transparent"/></radialGradient>
        <radialGradient id="flameOuter" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#fff6cc"/><stop offset="60%" stopColor="#ffd966"/><stop offset="100%" stopColor="transparent"/></radialGradient>
      </defs>
      <path d="M50 6 C22 48 24 92 50 120 C76 92 78 48 50 6 Z" fill="url(#flameOuter)"/>
      <path d="M50 12 C30 44 30 82 50 108 C70 82 70 44 50 12 Z" fill="url(#flameCore)"/>
    </svg>
  </motion.div>
</div>
          </div>
          <Sparkles n={26}/>
          <BaseOrbs y={120}/>
          {/* Cupcake */}
          <div className="absolute bottom-0 w-[280px] h-[180px]">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[230px] h-[120px] bg-white rounded-full shadow-lg"/>
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[200px] h-[95px] bg-white rounded-full shadow"/>
            {Array.from({length:60}).map((_,i)=> <div key={i} className="absolute rounded-full" style={{ left:`${18+Math.random()*64}%`, top:`${-28+Math.random()*52}%`, width:6, height:6, background:`hsl(${Math.floor(Math.random()*360)} 90% 60%)` }}/>) }
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[260px] h-[130px] bg-gradient-to-t from-rose-500 to-rose-300 rounded-b-3xl"/>
            <div className="absolute" style={{ left:'50%', transform:'translateX(-50%)', bottom:52 }}>
              <div className="flex items-center gap-6">
                <div className="w-4 h-4 bg-zinc-900/80 rounded-full"/>
                <div className="w-12 h-6 rounded-b-full border-b-4 border-zinc-900/70 -mb-1"/>
                <div className="w-4 h-4 bg-zinc-900/80 rounded-full"/>
              </div>
            </div>
            <div className="absolute w-3 h-3 bg-rose-300/70 rounded-full" style={{ left:'calc(50% - 70px)', bottom:58 }}/>
            <div className="absolute w-3 h-3 bg-rose-300/70 rounded-full" style={{ left:'calc(50% + 70px)', bottom:58 }}/>
          </div>
        </div>
        <div className="mt-8 z-10"><button onClick={onBlown} className="px-6 py-3 rounded-full bg-white/15 text-white border border-white/40 backdrop-blur hover:bg-white/25 shadow font-semibold">Make a wish ✨</button></div>
      </div>
    </div>
  );
}

function Finale({ onReplay }: { onReplay: () => void }){
  return (
    <section className="relative min-h-[70vh] grid place-items-center overflow-hidden">{/* transparent to show global glitter */}
      <div className="text-center relative z-10">
        <div className="text-6xl sm:text-8xl font-extrabold tracking-tight drop-shadow-[0_6px_24px_rgba(255,255,255,.2)]">HAPPY BIRTHDAY AMY AMY AMY!!!</div>
        <div className="mt-8 text-6xl">🎂🍸🌸</div>
        <motion.button
          onClick={onReplay}
          whileTap={{ scale: 0.96 }}
          whileHover={{ y: -2 }}
          className="mt-10 px-6 py-3 rounded-full bg-white/15 text-white border border-white/40 backdrop-blur hover:bg-white/25 shadow font-semibold lowercase tracking-wide"
          aria-label="Replay"
        >
          replay
        </motion.button>
      </div>
    </section>
  );
}

// ---------- Main App -------------------------------------------------------
export default function App(){
  const [scene,setScene] = useState<"intro"|"wordle"|"balloons"|"postcard"|"candle"|"final">('intro');
  const synth = useBirthdaySynth();
  const goto = (s: typeof scene)=> setScene(s);
  return (
    <div className="min-h-screen text-white bg-black relative overflow-hidden">
      {/* Global full-screen glitter under everything */}
      <Glitter density={120}/>

      <Header/>
      <main className="px-4 pb-16 max-w-3xl mx-auto relative z-10">
        <AnimatePresence mode="wait">
          {scene==='intro' && (
            <motion.section key="intro" initial={{opacity:0,scale:.98}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.98}} className="relative min-h-[70vh] grid place-items-center rounded-3xl">
              <button aria-label="Start" onClick={() => { try{ synth.start(); } catch {} goto('wordle'); }} className="relative z-10 text-7xl sm:text-8xl rounded-full p-8 sm:p-10 shadow-2xl hover:scale-105 active:scale-95 transition" style={{ background:'radial-gradient(circle at 30% 30%, #ffffff 0%, #ffe5c4 45%, #ffb347 70%, #fe5000 100%)' }}>🎁</button>
            </motion.section>
          )}
          {scene==='wordle' && (
            <motion.section key="wordle" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}} transition={{duration:.35}} className="rounded-3xl p-5 sm:p-7 shadow-2xl border text-zinc-900 bg-white/90 backdrop-blur" style={{ borderColor:'rgba(255,255,255,.15)' }}>
              <WordleScene onSolved={()=>goto('balloons')}/>
            </motion.section>
          )}
          {scene==='balloons' && (
            <motion.section key="balloons" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="relative"><Balloons onDone={()=>goto('postcard')}/></motion.section>
          )}
          {scene==='postcard' && (
            <motion.section key="postcard" initial={{opacity:0,scale:.98}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.98}} transition={{duration:.35}} className="mt-6"><Postcard onContinue={()=>goto('candle')}/></motion.section>
          )}
          {scene==='candle' && (
            <motion.section key="candle" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="mt-6"><Candle onBlown={()=>{ 
              // Jump to finale immediately, then fire confetti async (lighter load)
              goto('final');
              setTimeout(()=> burstConfetti(document.body,140,'40%',true), 60);
            }}/></motion.section>
          )}
          {scene==='final' && (
            <motion.section key="final" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}>
              <Finale onReplay={()=>{ try{ window.scrollTo({ top: 0, behavior: 'smooth' }); }catch{} setScene('intro'); }} />
            </motion.section>
          )}
        </AnimatePresence>
      </main>
      <footer className="fixed bottom-3 inset-x-0 flex items-center justify-center text-xs text-white/60 z-10"><div>Built with ❤️ by B.</div></footer>
    </div>
  );
}

// ---------- Lightweight self-tests (optional) ------------------------------
function runSelfTests(){
  const ok = (b:boolean,msg:string)=>{ if(!b) throw new Error(msg); };
  const allCorrect = evaluateGuess("BIRTHDAY", TARGET); ok(allCorrect.every(s=>s==='correct'), 'All letters correct');
  const singleB = evaluateGuess("BBBBBBBB", TARGET); ok(singleB.filter(s=>s==='correct').length===1 && singleB.filter(s=>s==='present').length===0, 'Only first B correct');
  const reversed = evaluateGuess("YADTRIHB", TARGET); ok(reversed.every(s=>s==='present'), 'Reversed should be all present');
  ok(COLS===8, 'COLS must be 8'); ok(keys3[0]==='ENTER' && keys3.at(-1)==='⌫', 'Keyboard control keys present');
  // eslint-disable-next-line no-console
  console.log('✅ Self-tests passed');
}
try { if (typeof window!=='undefined' && new URLSearchParams(window.location.search).has('selftest')) setTimeout(runSelfTests,0); } catch {}

// ---- Mount app (this renders to #root) ----
const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
