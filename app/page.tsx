"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { scenes, scripts, type Focus, type Line } from "./story";

const cards: Record<string, { name: string; copy: string; tone: string }> = {
  "器物+器物": { name: "见微", copy: "你从细线与孔壁出发，看见一块玉怎样成为重器。", tone: "jade" },
  "众手+众手": { name: "众手", copy: "你记住的不是一位天才，而是一双手怎样接住另一双手。", tone: "earth" },
  "归人+归人": { name: "等归", copy: "水退了，岩没有回来。你记住了编号之外的人。", tone: "indigo" },
  "器物+众手": { name: "成器", copy: "你看见玉上的细线，也看见细线背后的手。", tone: "jade-earth" },
  "器物+归人": { name: "留痕", copy: "玉留下了，等在岸边的人没有等到归舟。", tone: "jade-indigo" },
  "众手+归人": { name: "未归", copy: "玉琮和堤坝留下了。把它们留下的人，有些没有回来。", tone: "earth-indigo" },
};

const interactionGuides: Record<string, { title: string; instruction: string; outcome: string }> = {
  "approach-exhibit": { title: "走近展柜", instruction: "点击展柜中的玉琮", outcome: "镜头靠近，器物细节逐渐显现" },
  "observe-light": { title: "转动玉琮", instruction: "按住玉琮左右拖动，查看转角上的神徽", outcome: "看清纹饰如何分布在四角" },
  "trace-motif": { title: "读懂一张神徽", instruction: "依次点亮纹样的四个部分", outcome: "辨认羽冠、神人、兽面与鸟爪" },
  "locate-faces": { title: "寻找可见神徽", instruction: "沿器身依次找出这一视角可见的六组神徽", outcome: "这一视角可见六组，背面还有两组" },
  "inspect-jade": { title: "为玉料避裂", instruction: "先擦去泥水，再从三道石纹里找出真裂", outcome: "决定开料时要避让的位置" },
  "line-cut": { title: "跟准左右工的节奏", instruction: "指针到最左端点左工，到最右端点右工", outcome: "让砂随绳稳定磨开玉料" },
  "allocate-workforce": { title: "分派十名机动人手", instruction: "决定这批人先去工坊还是堤坝", outcome: "改变制作余量与聚落稳定，不改变岩的去向" },
  "mark-centers": { title: "用砺石划出四面中心", instruction: "从亮起的角落按住砺石，划向对角；每面画出两条对角线", outcome: "四个器面获得共同的中轴基准" },
  "steady-drill": { title: "把管钻扶正", instruction: "拖动偏离的圆环，套准中央靶心", outcome: "第一端可以开始下钻" },
  "feed-abrasive": { title: "跟上水砂需求", instruction: "在二十秒内按提示添水或添砂，节奏会温和加快", outcome: "保持磨料湿润，让管钻不断砂" },
  "flip-blank": { title: "翻转玉坯", instruction: "按住玉坯向右拖，翻到另一端", outcome: "从另一端重新找中心" },
  "join-bore": { title: "推进第二端管钻", instruction: "按住钻轴周围持续画圆，跟随由慢到快的转钻节奏", outcome: "停在接通前，重新校准中心" },
  "focus-one": { title: "留下第一处记忆", instruction: "选择此刻最牵动你的事", outcome: "选择只改变最终收藏卡，不改变剧情" },
  "feel-ridge": { title: "摸出接钻台痕", instruction: "沿孔壁左右摩擦，找到凸起并磨低", outcome: "让两端接钻处变平" },
  "grind-sequence": { title: "从粗到细修孔", instruction: "依次选择粗砺石、中砺石、细砺石", outcome: "磨平孔壁，又不扩大偏差" },
  "align-motif": { title: "给神徽定中轴", instruction: "左右拖动纹样，让中轴与器面对齐", outcome: "眼、鼻与羽冠获得共同基准" },
  "assist-carving": { title: "跟上纹饰工的节奏", instruction: "亮点出现时依次添砂、润水、清屑", outcome: "细线继续刻进玉面" },
  "inspect-crack": { title: "沿裂隙检查走向", instruction: "顺着亮起的裂纹滑动", outcome: "决定让神徽中轴稍作避让" },
  "resource-dispatch": { title: "安排三艘先发船", instruction: "每轮选择一批最先运走的物资", outcome: "改变工坊、堤坝和聚落此刻获得的支援" },
  "follow-boats": { title: "跟船穿过水路", instruction: "向左拖动画面，让大小两船驶向各自目的地", outcome: "同时保住堤坝与玉作" },
  "polish-cong": { title: "完成最后抛光", instruction: "在玉面上来回擦拭，直到光泽铺开", outcome: "玉琮可以交器" },
  "follow-command": { title: "看命令如何抵达堤坝", instruction: "向左拖动画面，依次点亮人手、粮、船和木桩", outcome: "仪式上的命令转化为守堤行动" },
  "pass-baskets": { title: "把土筐传到缺口", instruction: "从左到右依次点按三名守堤者", outcome: "最后一层土被压上堤坝" },
  "focus-two": { title: "留下第二处记忆", instruction: "选择你此刻最想记住的画面", outcome: "它将与第一次选择共同生成收藏卡" },
  "scan-boats": { title: "寻找岩的归舟", instruction: "依次检查三条靠岸的船", outcome: "确认岩没有随队回来" },
  "tie-knot": { title: "把短绳重新系起", instruction: "将两截绳头向中间拖拢", outcome: "岩的死讯不被说破，却被留下" },
  "compare-cong": { title: "比较六件玉琮", instruction: "按亮起顺序查看大小、纹饰与做法", outcome: "它们并非同一件器物的复制品" },
  "place-cong": { title: "安放大琮", instruction: "将玉琮拖入墓主头部近旁的虚线位置", outcome: "玉琮最终进入反山 M12" },
  "brush-soil": { title: "清理玉琮周边", instruction: "在土层上来回轻扫，不要直接提器", outcome: "器物位置和纹饰逐渐显露" },
  "touch-traces": { title: "从器物读回人的痕迹", instruction: "触摸孔壁、细线、裂隙与绳结四处痕迹", outcome: "让编号背后的声音重新出现" },
};

type StrategyValues = { aq: number; ss: number; memory: number; cooperation: number };
type StrategyEffect = Partial<StrategyValues>;

const baseStrategy: StrategyValues = { aq: 50, ss: 80, memory: 20, cooperation: 60 };
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function resolveStrategy(effects: Record<string, StrategyEffect>): StrategyValues {
  const total = Object.values(effects).reduce<StrategyValues>((sum, effect) => ({
    aq: sum.aq + (effect.aq ?? 0),
    ss: sum.ss + (effect.ss ?? 0),
    memory: sum.memory + (effect.memory ?? 0),
    cooperation: sum.cooperation + (effect.cooperation ?? 0),
  }), baseStrategy);
  return { aq: clamp(total.aq), ss: clamp(total.ss), memory: clamp(total.memory), cooperation: clamp(total.cooperation) };
}

function resolveCard(values: StrategyValues) {
  const together = clamp(values.ss * .6 + values.cooperation * .4);
  if (values.aq >= 80 && together >= 80 && values.memory >= 90) return cards["众手+归人"];
  if (values.memory >= 82) return cards["归人+归人"];
  if (together >= 82 && values.memory >= 65) return cards["众手+众手"];
  if (values.aq >= 82 && values.memory < 55) return cards["器物+器物"];
  if (values.aq >= 78 && values.memory >= 72) return cards["器物+归人"];
  return cards["器物+众手"];
}

const focusCopy: Record<Focus, string> = {
  器物: "这件大琮能不能顺利做成",
  众手: "工坊与堤坝上的人能不能接住彼此",
  归人: "岩能不能随退水的船回来",
};

function requestedSceneIndex() {
  if (typeof window === "undefined") return 0;
  const requested = Number(new URLSearchParams(window.location.search).get("scene"));
  return Number.isInteger(requested) && requested >= 1 && requested <= scenes.length ? requested - 1 : 0;
}
type JadeVariant = "final" | "raw" | "drilled" | "carving";
const jadeArt: Record<JadeVariant, string> = {
  final: "assets/jade_cong_new.png",
  raw: "assets/jade_raw.png",
  drilled: "assets/jade_drilled.png",
  carving: "assets/jade_carving.png",
};
function JadeImage({ variant, className = "", rotation }: { variant: JadeVariant; className?: string; rotation?: number }) {
  const tilt = rotation === undefined ? 0 : Math.sin(rotation * Math.PI / 90) * 18;
  return <img className={`jade-art jade-${variant} ${className}`} src={jadeArt[variant]} alt="" style={rotation === undefined ? undefined : { transform: `perspective(900px) rotateX(3deg) rotateY(${tilt}deg)`, filter: `brightness(${.82 + Math.abs(Math.cos(rotation * Math.PI / 180)) * .28})` }} />;
}
function Gesture({ kind = "drag" }: { kind?: "drag" | "tap" | "circle" | "swipe" }) { return <div className={`gesture ${kind}`} aria-hidden="true"><i /><span /></div>; }

function InteractionGuide({ id, detail, scene }: { id: string; detail?: string; scene: number }) {
  const guide = interactionGuides[id];
  if (!guide || id === "focus-one" || id === "focus-two") return null;
  return <aside className="interaction-guide" data-scene={scene} data-interaction={id} aria-live="polite"><small>此刻要做</small><strong>{guide.title}</strong><p>{detail ?? guide.instruction}</p><span>{guide.outcome}</span></aside>;
}

type PortraitMeta = { src?: string; side: "left" | "right"; role: string };

function portraitFor(speaker: string, scene: number): PortraitMeta {
  if (speaker === "砺") return { src: scene === 3 ? "assets/li_work_complete.png" : "assets/li_stand_clean.png", side: "right", role: "li" };
  if (speaker === "年长的砺") return { src: "assets/li_stand_clean.png", side: "right", role: "li elder" };
  if (speaker === "岩") return { src: scene >= 2 ? "assets/yan_depart_clean.png" : "assets/yan_portrait_clean.png", side: "left", role: "yan" };
  if (speaker === "老玉工") return { src: "assets/master_portrait_new.png", side: "left", role: "master" };
  if (speaker === "工坊管事" || speaker === "墓葬管事" || speaker === "各处代表") return { src: "assets/role_steward.png", side: "left", role: "steward full-role" };
  if (speaker === "线切割工") return { src: "assets/role_linecutter.png", side: "left", role: "linecutter full-role" };
  if (speaker === "钻孔工") return { src: "assets/role_driller.png", side: "left", role: "driller full-role" };
  if (speaker === "修形工") return { src: "assets/role_shaper.png", side: "left", role: "shaper full-role" };
  if (speaker === "纹饰工") return { src: "assets/role_carver.png", side: "left", role: "carver full-role" };
  if (speaker === "送料人" || speaker === "年轻助手") return { src: "assets/role_supplier.png", side: "right", role: "supplier full-role" };
  if (speaker === "仪式主持者") return { src: "assets/role_ritual_host.png", side: "left", role: "ritual-host full-role" };
  if (speaker === "最高等级权力者") return { src: "assets/role_authority.png", side: "left", role: "authority full-role" };
  if (speaker === "守堤小队长") return { src: scene === 8 ? "assets/role_return_captain.png" : "assets/role_dam_captain.png", side: "left", role: "flood full-role" };
  if (speaker === "守堤者" || speaker === "传令者") return { src: "assets/role_dam_captain.png", side: "left", role: "flood full-role" };
  if (speaker === "考古领队") return { src: "assets/role_archaeology_lead.png", side: "left", role: "modern full-role" };
  if (speaker === "记录员") return { src: "assets/role_archaeology_recorder.png", side: "left", role: "modern full-role" };
  return { side: "left", role: "artisan" };
}

function StoryLine({ line, opening, scene, onNext }: { line: Line; opening?: boolean; scene: number; onNext: () => void }) {
  const content = <><div className="line-row"><span>{line.speaker}</span><p>{line.text}</p></div><i className="next-mark" /></>;
  if (opening) return <button className="story-line opening" onClick={onNext}>{content}</button>;
  const portrait = portraitFor(line.speaker, scene);
  return <div className={`vn-dialogue side-${portrait.side}`} data-scene={scene}><div className={`vn-portrait ${portrait.role}`} aria-hidden="true">{portrait.src ? <img src={portrait.src} alt="" /> : <div className="role-standee"><i className="role-head" /><i className="role-body" /><i className="role-prop" /></div>}<span>{line.speaker}</span></div><button className="story-line vn-box" onClick={onNext} aria-label={`${line.speaker}：${line.text} 点击继续`}>{content}<small>点击继续</small></button></div>;
}

function DragSurface({ children, className = "", onMotion }: { children: ReactNode; className?: string; onMotion: (dx: number, dy: number) => void }) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const down = (e: PointerEvent<HTMLDivElement>) => { start.current = { x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId); };
  const move = (e: PointerEvent<HTMLDivElement>) => { if (!start.current) return; onMotion(e.clientX - start.current.x, e.clientY - start.current.y); start.current = { x: e.clientX, y: e.clientY }; };
  const up = () => { start.current = null; };
  return <div className={`drag-surface ${className}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>{children}</div>;
}

function ScratchJade({ progress, onProgress, onComplete }: { progress: number; onProgress: (value: number) => void; onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [autoCleaning, setAutoCleaning] = useState(false);
  const dragging = useRef(false);
  const finished = useRef(false);
  const totalOpaqueSamples = useRef(0);
  const moveCount = useRef(0);
  const finishTimer = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const source = new Image();
    source.src = "/assets/jade_raw.png";
    const drawCover = () => {
      if (!source.complete || !source.naturalWidth) return;
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.globalCompositeOperation = "source-over";
      context.clearRect(0, 0, rect.width, rect.height);
      const sourceAspect = source.naturalWidth / source.naturalHeight;
      const targetAspect = rect.width / rect.height;
      const drawWidth = sourceAspect > targetAspect ? rect.width : rect.height * sourceAspect;
      const drawHeight = sourceAspect > targetAspect ? rect.width / sourceAspect : rect.height;
      const drawX = (rect.width - drawWidth) / 2;
      const drawY = (rect.height - drawHeight) / 2;
      context.filter = "grayscale(.82) brightness(.19) contrast(1.12)";
      context.drawImage(source, drawX, drawY, drawWidth, drawHeight);
      context.filter = "none";
      context.globalCompositeOperation = "source-atop";
      const shade = context.createRadialGradient(rect.width * .44, rect.height * .38, 8, rect.width * .5, rect.height * .5, rect.width * .62);
      shade.addColorStop(0, "rgba(65,55,42,.7)");
      shade.addColorStop(.68, "rgba(31,31,27,.82)");
      shade.addColorStop(1, "rgba(10,13,12,.92)");
      context.fillStyle = shade;
      context.fillRect(0, 0, rect.width, rect.height);
      context.fillStyle = "rgba(210,197,158,.08)";
      for (let index = 0; index < 84; index += 1) {
        const x = (index * 73) % Math.max(1, rect.width);
        const y = (index * 47) % Math.max(1, rect.height);
        context.beginPath();
        context.arc(x, y, 1 + index % 3, 0, Math.PI * 2);
        context.fill();
      }
      context.globalCompositeOperation = "source-over";
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const step = Math.max(5, Math.round(ratio * 4));
      let total = 0;
      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          if (pixels[(y * canvas.width + x) * 4 + 3] > 24) total += 1;
        }
      }
      totalOpaqueSamples.current = total;
      moveCount.current = 0;
      finished.current = false;
      onProgress(0);
    };
    source.addEventListener("load", drawCover);
    if (source.complete) drawCover();
    const observer = new ResizeObserver(drawCover);
    observer.observe(canvas);
    return () => { observer.disconnect(); source.removeEventListener("load", drawCover); if (finishTimer.current) window.clearTimeout(finishTimer.current); };
  }, [onProgress]);

  const finishAutomatically = () => {
    if (finished.current) return;
    finished.current = true;
    dragging.current = false;
    setAutoCleaning(true);
    onProgress(80);
    finishTimer.current = window.setTimeout(() => {
      onProgress(100);
      onComplete();
    }, 1050);
  };

  const measureCoverage = () => {
    const canvas = canvasRef.current;
    if (!canvas || finished.current || !totalOpaqueSamples.current) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const step = Math.max(5, Math.round(ratio * 4));
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let remaining = 0;
    for (let y = 0; y < canvas.height; y += step) {
      for (let x = 0; x < canvas.width; x += step) {
        if (pixels[(y * canvas.width + x) * 4 + 3] > 24) remaining += 1;
      }
    }
    const next = remaining === 0 ? 100 : Math.min(99, Math.floor((1 - remaining / totalOpaqueSamples.current) * 100));
    onProgress(next);
    if (next >= 80 || remaining === 0) finishAutomatically();
  };

  const scratchAt = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || finished.current) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const radius = Math.max(23, Math.min(rect.width, rect.height) * .09);
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.globalCompositeOperation = "destination-out";
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
    moveCount.current += 1;
    if (moveCount.current % 3 === 0) measureCoverage();
  };

  return <div className={`jade-inspection-surface jade-scratch ${autoCleaning ? "auto-clean" : ""}`}><JadeImage variant="raw" className="interactive-jade-raw" /><canvas ref={canvasRef} aria-label="刮开玉料表面的泥水阴影" onPointerDown={event => { if (autoCleaning) return; dragging.current = true; event.currentTarget.setPointerCapture(event.pointerId); scratchAt(event); }} onPointerMove={event => dragging.current && scratchAt(event)} onPointerUp={() => { dragging.current = false; measureCoverage(); }} onPointerCancel={() => { dragging.current = false; measureCoverage(); }} /><span className="scratch-progress">{autoCleaning ? "残余泥水正在自行退去…" : `已清理 ${progress}%`}</span></div>;
}

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: "landscape") => Promise<void>;
};

export function LandscapeGate() {
  const [portrait, setPortrait] = useState(false);
  const [needsManualRotation, setNeedsManualRotation] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 900px) and (orientation: portrait)");
    const sync = () => {
      setPortrait(query.matches);
      if (!query.matches) setNeedsManualRotation(false);
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const enterLandscape = async () => {
    const root = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
    try {
      if (!document.fullscreenElement) {
        if (root.requestFullscreen) await root.requestFullscreen();
        else if (root.webkitRequestFullscreen) await root.webkitRequestFullscreen();
      }
    } catch {
      // Some mobile browsers do not expose page fullscreen; orientation may still lock.
    }
    try {
      const orientation = screen.orientation as LockableOrientation;
      if (orientation?.lock) await orientation.lock("landscape");
    } catch {
      // iOS Safari and some embedded browsers require a physical device rotation.
    }
    window.setTimeout(() => {
      setNeedsManualRotation(window.matchMedia("(max-width: 900px) and (orientation: portrait)").matches);
    }, 450);
  };

  if (!portrait) return null;
  return <div className="landscape-gate" role="dialog" aria-modal="true" aria-label="横屏体验提示"><div className="orientation-phone"><i /></div><div><small>良渚玉琮王 · 横屏体验</small><h2>{needsManualRotation ? "请将手机横过来" : "横屏观看，才能完整进入工坊"}</h2><p>{needsManualRotation ? "当前浏览器不允许网页直接旋转系统方向，横放手机后游戏会自动继续。" : "点击后将尝试进入全屏横屏；若系统没有自动旋转，请横放手机。"}</p><button onClick={enterLandscape}>{needsManualRotation ? "再次尝试横屏" : "进入横屏体验"}</button></div></div>;
}

function StrategyHUD({ values, flood }: { values: StrategyValues; flood: number }) {
  const items = [
    { key: "aq", label: "玉成", value: values.aq },
    { key: "ss", label: "聚落", value: values.ss },
    { key: "memory", label: "留痕", value: values.memory },
  ];
  return <aside className="strategy-hud" aria-label="当前局势">
    <div className="strategy-pressure"><span>水势</span><i><b style={{ width: `${flood}%` }} /></i><em>{flood}</em></div>
    <div className="strategy-values">{items.map(item => <div key={item.key}><span>{item.label}</span><i><b style={{ width: `${item.value}%` }} /></i><strong>{item.value}</strong></div>)}</div>
  </aside>;
}

function DecisionPanel({ eyebrow, title, note, options }: { eyebrow: string; title: string; note: string; options: { title: string; copy: string; hint: string; onClick: () => void }[] }) {
  return <section className="strategy-decision"><small>{eyebrow}</small><h3>{title}</h3><div>{options.map(option => <button key={option.title} onClick={option.onClick}><strong>{option.title}</strong><span>{option.copy}</span><em>{option.hint}</em></button>)}</div><p>{note}</p></section>;
}

function LineCutGame({ onProgress, onComplete }: { onProgress: (value: number) => void; onComplete: (score: number) => void }) {
  const [position, setPosition] = useState(0);
  const [expected, setExpected] = useState<0 | 1>(0);
  const [progress, setProgress] = useState(0);
  const [misses, setMisses] = useState(0);
  const [response, setResponse] = useState("");
  const positionRef = useRef(0);
  const finished = useRef(false);

  useEffect(() => {
    let frame = 0;
    const started = performance.now();
    const animate = (now: number) => {
      const phase = ((now - started) % 1560) / 1560;
      const next = phase < .5 ? phase * 2 : (1 - phase) * 2;
      positionRef.current = next;
      setPosition(next);
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const pull = (side: 0 | 1) => {
    if (finished.current) return;
    const atEndpoint = side === 0 ? positionRef.current <= .14 : positionRef.current >= .86;
    if (side !== expected || !atEndpoint) {
      setMisses(value => value + 1);
      setResponse(side !== expected ? "还没轮到这一侧" : "等指针抵达端点");
      window.setTimeout(() => setResponse(""), 650);
      return;
    }
    const next = Math.min(100, progress + 10);
    setProgress(next);
    onProgress(next);
    setExpected(side === 0 ? 1 : 0);
    setResponse("合拍");
    window.setTimeout(() => setResponse(""), 380);
    if (next === 100) {
      finished.current = true;
      onComplete(clamp(100 - misses * 7));
    }
  };

  return <div className="dual-cut" data-expected={expected === 0 ? "left" : "right"}>
    <div className="rhythm-meter" aria-label="往复节奏指针"><span>左</span><b>看准端点</b><span>右</span><i style={{ left: `calc(7px + ${position} * (100% - 28px))` }} /></div>
    <button aria-label="指针到最左端时点击左侧玉工" onClick={() => pull(0)} />
    <button aria-label="指针到最右端时点击右侧玉工" onClick={() => pull(1)} />
    <div className="cut-seam" style={{ width: `${progress * .28}%` }} />
    {response && <em className="rhythm-response">{response}</em>}
  </div>;
}

function CenterMarkingGame({ onProgress, onComplete }: { onProgress: (value: number) => void; onComplete: () => void }) {
  const [face, setFace] = useState(0);
  const [stroke, setStroke] = useState<0 | 1>(0);
  const [strokeProgress, setStrokeProgress] = useState(0);
  const [completed, setCompleted] = useState<[boolean, boolean]>([false, false]);
  const [drawing, setDrawing] = useState(false);
  const [turning, setTurning] = useState(false);
  const [cursor, setCursor] = useState({ x: 18, y: 18 });
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const activePointer = useRef<number | null>(null);
  const strokeProgressRef = useRef(0);
  const points = stroke === 0 ? { start: { x: 18, y: 18 }, end: { x: 82, y: 82 } } : { start: { x: 82, y: 18 }, end: { x: 18, y: 82 } };

  const localPoint = (event: PointerEvent<HTMLDivElement>) => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 };
  };
  const updateStroke = (point: { x: number; y: number }) => {
    const vx = points.end.x - points.start.x;
    const vy = points.end.y - points.start.y;
    const projection = ((point.x - points.start.x) * vx + (point.y - points.start.y) * vy) / (vx * vx + vy * vy);
    const next = Math.max(0, Math.min(1, projection));
    strokeProgressRef.current = next;
    setCursor({ x: points.start.x + vx * next, y: points.start.y + vy * next });
    setStrokeProgress(next);
  };
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (turning) return;
    const point = localPoint(event);
    if (Math.hypot(point.x - points.start.x, point.y - points.start.y) > 16) return;
    activePointer.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrawing(true);
    updateStroke(point);
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (activePointer.current !== event.pointerId) return;
    updateStroke(localPoint(event));
  };
  const finishStroke = (event: PointerEvent<HTMLDivElement>) => {
    if (activePointer.current !== event.pointerId) return;
    activePointer.current = null;
    setDrawing(false);
    if (strokeProgressRef.current < .8) {
      strokeProgressRef.current = 0;
      setStrokeProgress(0);
      setCursor(points.start);
      return;
    }
    const nextCompleted: [boolean, boolean] = stroke === 0 ? [true, completed[1]] : [completed[0], true];
    setCompleted(nextCompleted);
    setStrokeProgress(1);
    const finishedStrokes = face * 2 + stroke + 1;
    onProgress(Math.round((finishedStrokes / 8) * 100));
    if (stroke === 0) {
      window.setTimeout(() => {
        setStroke(1);
        strokeProgressRef.current = 0;
        setStrokeProgress(0);
        setCursor({ x: 82, y: 18 });
      }, 420);
      return;
    }
    setTurning(true);
    window.setTimeout(() => {
      if (face === 3) {
        onProgress(100);
        onComplete();
        return;
      }
      setFace(value => value + 1);
      setStroke(0);
      setCompleted([false, false]);
      strokeProgressRef.current = 0;
      setStrokeProgress(0);
      setCursor({ x: 18, y: 18 });
      setTurning(false);
    }, 900);
  };

  return <div className={`center-marking-game face-${face + 1} ${turning ? "turning" : ""}`}>
    <div className="center-marking-art"><JadeImage variant="raw" className="center-jade-art" /></div>
    <div className="face-counter"><span>器面 {face + 1} / 4</span><b>{stroke === 0 ? "先划第一条对角线" : "再交叉划第二条"}</b></div>
    <div ref={surfaceRef} className="scribe-surface" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={finishStroke} onPointerCancel={finishStroke}>
      <i className={`scribe-start start-${stroke + 1}`} />
      <i className="scribe-target" />
      <span className={`scribe-line diagonal-a ${completed[0] ? "complete" : ""}`} style={{ "--draw": stroke === 0 ? strokeProgress : completed[0] ? 1 : 0 } as React.CSSProperties} />
      <span className={`scribe-line diagonal-b ${completed[1] ? "complete" : ""}`} style={{ "--draw": stroke === 1 ? strokeProgress : completed[1] ? 1 : 0 } as React.CSSProperties} />
      <span className={`scribe-center ${completed[0] && completed[1] ? "visible" : ""}`} />
      <span className={`scribe-stone ${drawing ? "drawing" : ""}`} style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}><img src="assets/jade_raw.png" alt="划线砺石" /></span>
      {!drawing && strokeProgress === 0 && <small className={`stone-cue cue-${stroke + 1}`}>按住砺石</small>}
      {drawing && <span className="stone-dust" style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }} />}
    </div>
  </div>;
}

function AbrasiveRhythmGame({ onProgress, onComplete }: { onProgress: (value: number) => void; onComplete: (result: { hits: number; misses: number; bestCombo: number }) => void }) {
  const [round, setRound] = useState(0);
  const [prompt, setPrompt] = useState<"water" | "sand">("water");
  const [combo, setCombo] = useState(0);
  const [remaining, setRemaining] = useState(20);
  const [flash, setFlash] = useState("");
  const [result, setResult] = useState<{ hits: number; misses: number; bestCombo: number } | null>(null);
  const hitsRef = useRef(0), missesRef = useRef(0), comboRef = useRef(0), bestComboRef = useRef(0);
  const promptRef = useRef<"water" | "sand">("water");
  const finished = useRef(false);
  const progressCallback = useRef(onProgress);
  const completeCallback = useRef(onComplete);
  const sequence: ("water" | "sand")[] = ["water", "sand", "water", "water", "sand", "water", "sand", "sand"];

  useEffect(() => { progressCallback.current = onProgress; completeCallback.current = onComplete; });

  useEffect(() => {
    const started = performance.now();
    const timer = window.setInterval(() => {
      const elapsed = performance.now() - started;
      const nextRemaining = Math.max(0, 20 - elapsed / 1000);
      setRemaining(nextRemaining);
      progressCallback.current(Math.min(100, elapsed / 200));
      if (elapsed < 20000 || finished.current) return;
      finished.current = true;
      window.clearInterval(timer);
      const finalResult = { hits: hitsRef.current, misses: missesRef.current, bestCombo: bestComboRef.current };
      setResult(finalResult);
      window.setTimeout(() => completeCallback.current(finalResult), 950);
    }, 80);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (finished.current) return;
    const nextPrompt = sequence[round % sequence.length];
    promptRef.current = nextPrompt;
    setPrompt(nextPrompt);
    const windowMs = Math.max(620, 1120 - round * 20);
    const timeout = window.setTimeout(() => {
      if (finished.current) return;
      missesRef.current += 1;
      comboRef.current = 0;
      setCombo(0);
      setFlash("漏过");
      window.setTimeout(() => setFlash(""), 260);
      setRound(value => value + 1);
    }, windowMs);
    return () => window.clearTimeout(timeout);
  }, [round]);

  const answer = (value: "water" | "sand") => {
    if (finished.current || result) return;
    if (value !== promptRef.current) {
      missesRef.current += 1;
      comboRef.current = 0;
      setCombo(0);
      setFlash("点错");
      window.setTimeout(() => setFlash(""), 260);
      return;
    }
    hitsRef.current += 1;
    comboRef.current += 1;
    bestComboRef.current = Math.max(bestComboRef.current, comboRef.current);
    setCombo(comboRef.current);
    setFlash("正好");
    window.setTimeout(() => setFlash(""), 220);
    setRound(value => value + 1);
  };

  return <div className={`abrasive-rhythm prompt-${prompt}`}>
    <div className="abrasive-status"><span>余 {remaining.toFixed(1)} 秒</span><b>{result ? "本轮完成" : prompt === "water" ? "现在添水" : "现在添砂"}</b><em>连击 {combo}</em></div>
    {!result && <i key={round} className={`falling-cue ${prompt}`} style={{ "--cue-speed": `${Math.max(.62, 1.12 - round * .02)}s` } as React.CSSProperties}>{prompt === "water" ? "水" : "砂"}</i>}
    <div className="feed-pair"><button className={prompt === "water" && !result ? "ready" : ""} aria-label="添水" onClick={() => answer("water")}><img src="assets/tool_water_bowl.png" alt="" /><span>水钵</span></button><button className={prompt === "sand" && !result ? "ready" : ""} aria-label="添砂" onClick={() => answer("sand")}><img src="assets/tool_sand_basket.png" alt="" /><span>砂盒</span></button></div>
    {flash && <strong className={`abrasive-flash ${flash === "正好" ? "good" : "miss"}`}>{flash}</strong>}
    {result && <div className="abrasive-result"><b>{result.hits} 次准确</b><span>最高连击 {result.bestCombo} · 失误 {result.misses}</span></div>}
  </div>;
}

function CircularDrillGame({ progress, onProgress, onComplete }: { progress: number; onProgress: (value: number) => void; onComplete: () => void }) {
  const [dragging, setDragging] = useState(false);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const activePointer = useRef<number | null>(null);
  const lastAngle = useRef(0);
  const progressRef = useRef(progress);
  const finished = useRef(false);
  const phase = progress < 34 ? "起钻" : progress < 70 ? "稳钻" : "接近";
  const speed = Math.max(.86, 2.4 - progress * .015);

  const pointAt = (event: PointerEvent<HTMLDivElement>) => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return { angle: 0, radius: 0 };
    const x = event.clientX - (rect.left + rect.width / 2);
    const y = event.clientY - (rect.top + rect.height / 2);
    return { angle: Math.atan2(y, x), radius: Math.hypot(x, y) };
  };
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const point = pointAt(event);
    if (point.radius < 32 || point.radius > 82) return;
    activePointer.current = event.pointerId;
    lastAngle.current = point.angle;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (activePointer.current !== event.pointerId || finished.current) return;
    const nextAngle = pointAt(event).angle;
    let delta = nextAngle - lastAngle.current;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    lastAngle.current = nextAngle;
    if (Math.abs(delta) > .9) return;
    const next = Math.min(100, progressRef.current + Math.abs(delta) / (Math.PI * 2) * 25);
    progressRef.current = next;
    onProgress(next);
    if (next >= 100) {
      finished.current = true;
      window.setTimeout(onComplete, 420);
    }
  };
  const pointerUp = () => { activePointer.current = null; setDragging(false); };

  return <div ref={surfaceRef} className={`drill-drag circular-drill ${dragging ? "is-turning" : ""}`} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} aria-label="按住钻轴圆环并持续画圈">
    <div className="drill-ring" style={{ "--spin-speed": `${speed}s` } as React.CSSProperties}><i /></div>
    <div className="bore-progress" style={{ "--bore-progress": `${progress}%` } as React.CSSProperties} />
    <b className="drill-center-dot" />
    <strong className="drill-howto">{dragging ? "继续转，不要松手" : "按住圆环 · 顺着光点画圈"}</strong>
    <span className="drill-phase">{phase} · {Math.round(progress)}%</span>
  </div>;
}

export default function Home() {
  const [scene, setScene] = useState(0), [beat, setBeat] = useState(0), [selector, setSelector] = useState(false);
  const [action, setAction] = useState(0), [pan, setPan] = useState(0), [marks, setMarks] = useState<number[]>([]), [substep, setSubstep] = useState(0);
  const [dialogueLine, setDialogueLine] = useState(0);
  const [transition, setTransition] = useState<"to-past" | "to-present" | null>(null);
  const [workshopIntro, setWorkshopIntro] = useState<"haul" | "pan" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [strategyFeedback, setStrategyFeedback] = useState("");
  const [effects, setEffects] = useState<Record<string, StrategyEffect>>({});
  const [, setChoice1] = useState<Focus | null>(null), [, setChoice2] = useState<Focus | null>(null);
  const current = scripts[scene][beat];
  const done = beat >= scripts[scene].length;
  const interactionId = current?.kind === "interaction" ? current.id : "";
  const strategy = useMemo(() => resolveStrategy(effects), [effects]);
  const together = clamp(strategy.ss * .6 + strategy.cooperation * .4);
  const card = useMemo(() => resolveCard(strategy), [strategy]);
  const floodPressure = [0, 12, 24, 38, 46, 56, 70, 90, 48, 0, 0][scene];

  const applyEffect = (key: string, effect: StrategyEffect, message: string) => {
    setEffects(previous => ({ ...previous, [key]: effect }));
    setStrategyFeedback(message);
    window.setTimeout(() => setStrategyFeedback(""), 2200);
  };

  const resetBeatState = () => { setAction(0); setPan(0); setMarks([]); setSubstep(0); setFeedback(""); setDialogueLine(0); };
  const nextBeat = () => { resetBeatState(); setBeat(v => v + 1); };
  const goScene = (index: number) => { setScene(index); setBeat(0); setSelector(false); setTransition(null); setWorkshopIntro(index === 1 ? "haul" : null); resetBeatState(); };

  useEffect(() => {
    const requested = requestedSceneIndex();
    if (requested > 0) goScene(requested);
    // Deep links are read only after hydration so server and browser render the same first frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const nextDialogueLine = () => {
    if (current?.kind === "dialogue" && dialogueLine < current.lines.length - 1) setDialogueLine(value => value + 1);
    else nextBeat();
  };
  const advanceScene = () => {
    if (scene === 0) setTransition("to-past");
    else if (scene === 9) setTransition("to-present");
    else goScene(scene + 1);
  };
  const addMotion = (amount: number, target = 100, onComplete?: () => void) => setAction(v => { const next = Math.min(target, v + Math.abs(amount)); if (v < target && next >= target) queueMicrotask(() => { onComplete?.(); nextBeat(); }); return next; });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const requested = requestedSceneIndex();
      setScene(requested);
      setWorkshopIntro(requested === 1 ? "haul" : null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!transition) return;
    const target = transition === "to-past" ? 1 : 10;
    const timer = window.setTimeout(() => goScene(target), 2800);
    return () => window.clearTimeout(timer);
    // The transition owns this one scene change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transition]);

  useEffect(() => {
    if (scene !== 1 || !workshopIntro || transition) return;
    const nextPhase = workshopIntro === "haul" ? "pan" : null;
    const timer = window.setTimeout(() => setWorkshopIntro(nextPhase), workshopIntro === "haul" ? 5700 : 3600);
    return () => window.clearTimeout(timer);
  }, [scene, workshopIntro, transition]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (scene === 6) setEffects(previous => ({ ...previous, "flood-rise": { ss: -18 } }));
      if (scene === 7) setEffects(previous => ({ ...previous, "flood-crest": { ss: -14 } }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [scene]);

  const choose = (which: 1 | 2) => {
    const question = which === 1 ? "孔即将接通。此刻，你最牵挂什么？" : "玉琮将成、堤坝将合。此刻，你最想记住什么？";
    return <section className="focus-choice-panel"><small>你把目光停在哪里 · 没有标准答案</small><h3>{question}</h3><div>{(["器物", "众手", "归人"] as Focus[]).map((value, index) => <button key={value} aria-label={focusCopy[value]} onClick={() => { if (which === 1) setChoice1(value); else setChoice2(value); const gain = value === "归人" ? 14 : value === "众手" ? 10 : 4; applyEffect(`focus-${which}`, { memory: gain, cooperation: value === "众手" ? 4 : 0 }, `留痕 +${gain}${value === "众手" ? " · 协作 +4" : ""}`); nextBeat(); }}><i className={`focus-symbol s${index}`} /><span>{focusCopy[value]}</span></button>)}</div></section>;
  };
  const tapSeries = (count: number, className: string, label: string, labels?: string[], onComplete?: () => void) => <div className={className}>{Array.from({ length: count }).map((_, index) => <button key={index} aria-label={`${label}${index + 1}`} className={marks.includes(index) ? "seen" : marks.length === index ? "active" : ""} onClick={() => { if (marks.includes(index) || marks.length !== index) return; const next = [...marks, index]; setMarks(next); if (next.length === count) queueMicrotask(() => { onComplete?.(); nextBeat(); }); }}><i /><span>{labels?.[index] ?? index + 1}</span></button>)}{marks.length === 0 && <Gesture kind="tap" />}</div>;

  const guideDetail = () => {
    if (interactionId === "approach-exhibit") return "先在展柜中找到玉琮，再点击靠近";
    if (interactionId === "observe-light") return `左右拖动器身 · 已观察 ${Math.min(100, Math.round(action / 3.3))}%`;
    if (interactionId === "inspect-jade") return action < 100 ? `刮开覆盖玉料的泥水阴影 · 已清理 ${Math.round(action)}%` : substep < 3 ? "泥水已清除 · 检查三道明显亮起的石纹，找出真裂" : "真裂已找到 · 决定第一刀的避让方式";
    if (interactionId === "line-cut") return `指针到最左端点左工，到最右端点右工 · 切缝 ${Math.round(action)}%`;
    if (interactionId === "feed-abrasive") return `按当前提示添水或添砂，坚持二十秒 · ${Math.round(action)}%`;
    if (interactionId === "grind-sequence") return `按粗、中、细顺序换砺石 · 当前第 ${Math.min(3, substep + 1)} 步`;
    if (interactionId === "resource-dispatch") return `安排三艘先发船 · 已决定 ${marks.length} / 3`;
    if (interactionId === "scan-boats") return `依次检查靠岸归舟 · 已检查 ${marks.length} / 3`;
    if (interactionId === "mark-centers") return `按住砺石沿亮起方向划到对角 · 已完成 ${Math.floor(action / 25)} / 4 面`;
    if (["trace-motif", "locate-faces", "assist-carving", "pass-baskets", "compare-cong", "touch-traces"].includes(interactionId)) return `${interactionGuides[interactionId].instruction} · 已完成 ${marks.length}`;
    return undefined;
  };

  const interaction = () => {
    if (interactionId === "approach-exhibit") return <button className="exhibit-cong-hotspot" aria-label="点击展柜中的玉琮，靠近观察" onClick={nextBeat}><Gesture kind="tap" /></button>;
    if (interactionId === "observe-light") return <DragSurface className="cong-rotate-drag" onMotion={dx => { setPan(v => v + dx * 1.8); setAction(v => { const next = Math.min(360, v + Math.abs(dx) * 1.8); if (v < 330 && next >= 330) queueMicrotask(nextBeat); return next; }); }}>{action === 0 && <Gesture kind="swipe" />}</DragSurface>;
    if (interactionId === "trace-motif") return tapSeries(4, "motif-trace-points", "勾勒纹样", ["羽冠", "神人", "兽面", "鸟爪"], () => applyEffect("observe-motif", { memory: 8 }, "留痕 +8 · 你读懂了神徽的层次"));
    if (interactionId === "locate-faces") return tapSeries(6, "face-location-grid", "定位神徽", ["左上", "正上", "右上", "左下", "正下", "右下"], () => applyEffect("observe-faces", { memory: 8 }, "留痕 +8 · 八组神徽不再只是纹样"));
    if (interactionId === "follow-boats" || interactionId === "follow-command") return <DragSurface className="pan-drag" onMotion={dx => setPan(v => { const next = Math.max(0, Math.min(100, v - dx / 5)); if (next > 86) queueMicrotask(nextBeat); return next; })}>{pan === 0 && <Gesture kind="swipe" />}</DragSurface>;
    if (interactionId === "inspect-jade") {
      if (action < 100) return <ScratchJade progress={action} onProgress={setAction} onComplete={() => setAction(100)} />;
      if (substep < 3) return <div className="jade-inspection-surface crack-points jade-raw-hotspots"><JadeImage variant="raw" className="interactive-jade-raw" /><span className="inspection-bridge">泥水清尽 · 石纹显露</span>{[0, 1, 2].map((index) => <button key={index} className={`vein-choice vein-${index + 1}`} aria-label={`石纹${index + 1}`} onClick={() => { if (index === 0) setFeedback("老玉工：只是颜色不同，不是裂。"); else if (index === 1) setFeedback("老玉工：只在表面。开料以后再看。"); else { setFeedback(""); setSubstep(3); } }}><i /><span>{index + 1}</span></button>)}</div>;
      return <DecisionPanel eyebrow="玉料取舍" title="真裂已经找出，第一刀从哪里避开？" note="两种做法都能成器；差别在于体量余量与工期压力。" options={[
        { title: "沿裂外多留一指", copy: "稳妥避裂，保留后续修整余地。", hint: "玉成稳步提升", onClick: () => { applyEffect("jade-choice", { aq: 8, memory: 4 }, "玉成 +8 · 留痕 +4"); nextBeat(); } },
        { title: "贴近裂边保体量", copy: "尽量留下大料，但后续工序更紧。", hint: "玉成提升更多，聚落承压", onClick: () => { applyEffect("jade-choice", { aq: 14, ss: -6, memory: 4 }, "玉成 +14 · 聚落 -6"); nextBeat(); } },
      ]} />;
    }
    if (interactionId === "line-cut") return <LineCutGame onProgress={setAction} onComplete={score => { const aqGain = score >= 80 ? 10 : score >= 50 ? 6 : 2; applyEffect("line-cut", { aq: aqGain, cooperation: Math.round((score - 50) / 10) }, `切割稳定 ${score} · 玉成 +${aqGain}`); window.setTimeout(nextBeat, 420); }} />;
    if (interactionId === "mark-centers") return <CenterMarkingGame onProgress={setAction} onComplete={() => window.setTimeout(nextBeat, 420)} />;
    if (interactionId === "allocate-workforce") return <DecisionPanel eyebrow="人力调度 · 机动十人" title="北堤告急，工坊也不能停。" note="岩因会走船、筑埂，仍会随守堤队出发；这里决定的是其余十人的去向。" options={[
      { title: "留在玉作", copy: "守住熟练工位，尽量不打断工序。", hint: "玉成上升 · 聚落承压", onClick: () => { applyEffect("workforce", { aq: 8, ss: -10 }, "玉成 +8 · 聚落 -10"); nextBeat(); } },
      { title: "增援北堤", copy: "抽调可筑埂的人，工坊放慢。", hint: "聚落上升 · 玉成小幅下降", onClick: () => { applyEffect("workforce", { aq: -4, ss: 15, cooperation: 5 }, "聚落 +15 · 协作 +5 · 玉成 -4"); nextBeat(); } },
      { title: "两边各五人", copy: "工序与堤防都保留最低余量。", hint: "两端温和改善", onClick: () => { applyEffect("workforce", { aq: 3, ss: 6, cooperation: 3 }, "玉成 +3 · 聚落 +6 · 协作 +3"); nextBeat(); } },
    ]} />;
    if (interactionId === "steady-drill") { const x = pan === 0 ? -70 : pan, y = action === 0 ? 32 : action; return <DragSurface className="center-calibrate" onMotion={(dx, dy) => { const nextX = Math.max(-80, Math.min(80, x + dx)); const nextY = Math.max(-60, Math.min(60, y + dy)); setPan(nextX); setAction(nextY); if (Math.abs(nextX) < 7 && Math.abs(nextY) < 7) queueMicrotask(() => { applyEffect("drill-center", { aq: 8 }, "孔道校准 · 玉成 +8"); nextBeat(); }); }}><div className="moving-center" style={{ transform: `translate(${x}px,${y}px)` }} /></DragSurface>; }
    if (interactionId === "feed-abrasive") return <AbrasiveRhythmGame onProgress={setAction} onComplete={({ hits, misses, bestCombo }) => { const aqGain = hits >= 18 ? 10 : hits >= 13 ? 7 : 4; const cooperation = bestCombo >= 8 ? 4 : bestCombo >= 4 ? 2 : 0; applyEffect("feed-abrasive", { aq: aqGain, cooperation }, `水砂准确 ${hits} · 失误 ${misses} · 玉成 +${aqGain}${cooperation ? ` · 协作 +${cooperation}` : ""}`); nextBeat(); }} />;
    if (interactionId === "flip-blank" || interactionId === "tie-knot" || interactionId === "place-cong") return <DragSurface className={`${interactionId}-drag`} onMotion={dx => addMotion(dx / 5)}>{interactionId !== "tie-knot" && <div className="object-motion jade-object-motion" style={{ transform: `translateX(${Math.min(100, action)}px) rotate(${interactionId === "flip-blank" ? action * 1.8 : 0}deg)` }}><JadeImage variant={interactionId === "flip-blank" ? "drilled" : "final"} /></div>}{interactionId === "tie-knot" && <><i className="rope-a" style={{ transform: `translateX(${Math.min(62, action * .62)}px) rotate(8deg)` }} /><i className="rope-b" style={{ transform: `translateX(${-Math.min(62, action * .62)}px) rotate(-8deg)` }} /><b className={action > 70 ? "knot-formed" : ""}>绳结</b></>}{interactionId === "place-cong" && <div className="placement-target"><span>头部近旁</span></div>}{action === 0 && <Gesture />}</DragSurface>;
    if (interactionId === "join-bore") return <CircularDrillGame progress={action} onProgress={setAction} onComplete={() => { applyEffect("join-bore", { aq: 8 }, "双端接钻完成 · 玉成 +8"); nextBeat(); }} />;
    if (interactionId === "focus-one") return choose(1);
    if (interactionId === "feel-ridge") return <DragSurface className="feel-ridge-drag" onMotion={(dx, dy) => addMotion((Math.abs(dx) + Math.abs(dy)) / 16)}><div className="ridge-pulse" style={{ opacity: 1 - action / 110, transform: `scaleY(${1 - action / 160})` }} />{action === 0 && <Gesture kind="swipe" />}</DragSurface>;
    if (interactionId === "grind-sequence") return <div className="grind-tools">{["粗砺石", "中砺石", "细砺石"].map((name, index) => <button key={name} className={substep === index ? "ready" : substep > index ? "done" : ""} aria-label={name} onClick={() => { if (substep !== index) { setFeedback(index > substep ? "修形工：粗痕还在。" : "这块已经用过了。"); return; } setFeedback(""); if (index === 2) { applyEffect("grind", { aq: 6 }, "孔壁修平 · 玉成 +6"); nextBeat(); } else setSubstep(index + 1); }}><i /><span>{name}</span></button>)}{substep === 0 && <Gesture kind="tap" />}</div>;
    if (interactionId === "align-motif") return <DragSurface className="motif-drag" onMotion={dx => setPan(v => { const next = Math.max(-80, Math.min(80, (v || -70) + dx)); if (Math.abs(next) < 5) queueMicrotask(() => { applyEffect("motif-align", { aq: 8 }, "神徽中轴对齐 · 玉成 +8"); nextBeat(); }); return next; })}><div className="motif-centerline" /><div className="floating-motif" style={{ transform: `translateX(${pan || -70}px)` }}><i /><i /><b /></div>{pan === 0 && <Gesture />}</DragSurface>;
    if (interactionId === "assist-carving") return tapSeries(3, "carving-rhythm", "纹饰工抬手后操作", ["砂", "水", "清"]);
    if (interactionId === "inspect-crack") return <DragSurface className="crack-trace-drag" onMotion={(dx, dy) => addMotion((Math.abs(dx) + Math.abs(dy)) / 12)}><div className="crack-line" /><div className="trace-fill" style={{ width: `${action}%` }} />{action === 0 && <Gesture kind="swipe" />}</DragSurface>;
    if (interactionId === "resource-dispatch") {
      const cargo = [
        { title: "粮食", copy: "先稳住聚落与守堤者的口粮。", hint: `余 ${5 - marks.filter(item => item === 0).length} 批`, effect: { ss: 4 } },
        { title: "木桩", copy: "先送往堤坝缺口。", hint: `余 ${5 - marks.filter(item => item === 1).length} 批`, effect: { ss: 7, cooperation: 2 } },
        { title: "细砂", copy: "小舟送回工坊续作。", hint: `余 ${3 - marks.filter(item => item === 2).length} 批`, effect: { aq: 6 } },
      ];
      return <DecisionPanel eyebrow={`先发船 ${marks.length + 1} / 3`} title="这一艘先装什么？" note="这里只安排三艘先发船；其余物资随后仍会运输，历史不会因一次选择中断。" options={cargo.map((item, index) => ({ ...item, onClick: () => { const next = [...marks, index]; setMarks(next); if (next.length === 3) { const total = next.reduce<StrategyEffect>((sum, cargoIndex) => ({ aq: (sum.aq ?? 0) + (cargo[cargoIndex].effect.aq ?? 0), ss: (sum.ss ?? 0) + (cargo[cargoIndex].effect.ss ?? 0), cooperation: (sum.cooperation ?? 0) + (cargo[cargoIndex].effect.cooperation ?? 0) }), {}); applyEffect("dispatch", total, `三艘先发船已离岸 · 玉成 ${total.aq ? `+${total.aq}` : "不变"} · 聚落 ${total.ss ? `+${total.ss}` : "不变"}`); window.setTimeout(nextBeat, 650); } } }))} />;
    }
    if (interactionId === "polish-cong") return <DragSurface className="polish-drag" onMotion={(dx, dy) => addMotion((Math.abs(dx) + Math.abs(dy)) / 18, 100, () => applyEffect("polish", { aq: 6 }, "最后抛光 · 玉成 +6"))}><div className="polish-sheen" style={{ opacity: action / 100 }} />{action === 0 && <Gesture kind="swipe" />}</DragSurface>;
    if (interactionId === "pass-baskets") return tapSeries(3, "basket-chain", "传递土筐", ["接", "传", "压"], () => applyEffect("dam-baskets", { ss: 10, cooperation: 5 }, "聚落 +10 · 协作 +5"));
    if (interactionId === "focus-two") return choose(2);
    if (interactionId === "scan-boats") return tapSeries(3, "boat-check", "查看归舟", ["一号舟", "二号舟", "三号舟"]);
    if (interactionId === "compare-cong") return tapSeries(4, "cong-taps", "比较玉琮", ["大琮", "矮琮", "素面", "简纹"], () => applyEffect("compare-cong", { memory: 8 }, "留痕 +8 · 你看见了器物之间的差异"));
    if (interactionId === "brush-soil") return <DragSurface className="brush-drag" onMotion={(dx, dy) => addMotion((Math.abs(dx) + Math.abs(dy)) / 14)}><div className="soil-mask" style={{ opacity: 1 - action / 100 }} /><div className="brush-reveal" style={{ opacity: action / 100 }} />{action === 0 && <Gesture kind="swipe" />}</DragSurface>;
    if (interactionId === "touch-traces") { const echoes = ["钻孔工：中间谁也看不见，只能从两头一点点靠近。", "纹饰工：一件工具，做不完整张神徽。", "老玉工：眼一偏，整张神像都会散。", "岩：水退了就回来。"]; const labels = ["孔壁", "羽冠细线", "圆眼", "器身磨痕"]; return <div className="memory-points visual">{echoes.map((echo, index) => <button key={echo} aria-label={`触摸${labels[index]}`} className={marks.includes(index) ? "seen" : ""} onClick={() => { if (marks.includes(index)) return; const next = [...marks, index]; setMarks(next); setFeedback(echo); if (next.length === 4) { applyEffect("touch-traces", { memory: 18 }, "留痕 +18 · 编号重新连回人的声音"); window.setTimeout(nextBeat, 1700); } }}><i /><span>{labels[index]}</span></button>)}</div>; }
    return null;
  };

  const world = () => {
    const play = current?.kind === "interaction" ? interaction() : null;
    if (scene === 0) return <div className={`museum-world world art-world ${beat === 0 ? "exhibit-overview" : "artifact-closeup"} ${interactionId ? `interaction-${interactionId}` : ""}`}>
      <div className="museum-vignette" />
      <div className="display-case"><i className="case-glass" /><i className="case-mount" /><i className="case-plinth" /></div>
      <div className={`hero-cong artifact-hero ${beat > 1 || action > 45 ? "revealed" : ""}`}>
        <JadeImage variant="final" rotation={interactionId === "observe-light" ? pan : undefined} />
        {interactionId === "locate-faces" && play}
      </div>
      <div className="exhibit-caption"><b>玉琮王</b><span>良渚文化 · 反山M12</span></div>
      <div className="motif-study" role="img" aria-label="神人兽面纹结构线稿">
        <img className="motif-base" src="assets/jade_motif_outline.png" alt="" />
        {[0, 1, 2, 3].map(index => <img key={index} className={`motif-light motif-light-${index + 1} ${marks.includes(index) ? "lit" : ""}`} src="assets/jade_motif_outline.png" alt="" />)}
      </div>
      <div className="motif-legend"><span className={marks.includes(0) ? "lit" : ""}>羽冠</span><span className={marks.includes(1) ? "lit" : ""}>神人</span><span className={marks.includes(2) ? "lit" : ""}>兽面</span><span className={marks.includes(3) ? "lit" : ""}>鸟爪</span></div>
      {interactionId !== "locate-faces" && play}
    </div>;
    if (scene === 1) return <div className={`scroll-world world art-world ${workshopIntro ? `arrival-${workshopIntro}` : "arrival-complete"} ${interactionId ? `interaction-${interactionId}` : ""}`}><div className="workshop-pan" /><div className="flood-atmosphere" /><div className="rain-lines" />{workshopIntro === "haul" && <div className="jade-arrival-sequence" role="img" aria-label="远景中，众人将玉料从舟船搬运到工坊码头">{Array.from({ length: 5 }).map((_, index) => <img key={index} className={`arrival-frame fixed-frame frame-${index + 1}`} src={`assets/arrival_new_${String(index + 1).padStart(2, "0")}.png`} alt="" />)}<div className="arrival-film-caption"><span>舟船靠岸</span><i /><span>合力移玉</span></div></div>}{play}</div>;
    if (scene === 2) return <div className={`workshop-world world art-world ${interactionId ? `interaction-${interactionId}` : ""}`}><div className="workshop-close" />{interactionId !== "mark-centers" && <img className="workers-cut-art scene-three-cut" src="assets/workers_cut.png" alt="左右玉工在玉料两侧往复拉绳切割" />}<div className="rain-lines" />{play}</div>;
    if (scene === 3) {
      const showDriller = ["steady-drill", "feed-abrasive", "join-bore"].includes(interactionId);
      const playOnDrillHandle = interactionId === "steady-drill" || interactionId === "join-bore";
      const showLi = interactionId === "focus-one" || done;
      return <div className={`drilling-world world art-world ${interactionId ? `interaction-${interactionId}` : ""}`}><div className="workshop-close drilling-close" />{showDriller && <div className="driller-station"><img className="process-figure driller" src="assets/role_driller.png" alt="钻孔工操作管钻" />{playOnDrillHandle && play}</div>}{showLi && <img className="li-work-art li-world-figure" src="assets/li_work_complete.png" alt="砺在工坊岸边看守玉料" />}<div className="drill-machine"><div className="tube" /><JadeImage variant="drilled" className="drill-jade-art" /></div>{!playOnDrillHandle && play}</div>;
    }
    if (scene === 4) return <div className={`grind-world world art-world ${interactionId ? `interaction-${interactionId}` : ""}`}><div className="workshop-close grind-close" /><img className="process-figure shaper" src="assets/role_shaper.png" alt="" /><JadeImage variant="drilled" className="grind-jade-art" /><div className="section-cong"><div className="inner-ridge" style={{ opacity: interactionId === "grind-sequence" ? 1 - substep / 3 : 1 }} /></div><div className="hand-probe" />{play}</div>;
    if (scene === 5) return <div className={`carve-world world art-world ${interactionId ? `interaction-${interactionId}` : ""}`}><div className="workshop-close carve-close" /><div className="daylight" /><img className="process-figure carver" src="assets/role_carver.png" alt="" /><div className={`carve-cong carved-${marks.length}`}><JadeImage variant="carving" /></div><div className="carver-hand" />{play}</div>;
    if (scene === 6) return <div className={`logistics-world world art-world ${interactionId ? `interaction-${interactionId}` : ""}`}><div className="logistics-background" style={{ transform: `translateX(${interactionId === "follow-boats" ? -pan * 1.7 : 0}px) scale(1.14)` }} /><div className="scene-cinematic-shade" /><div className="flood-atmosphere strong" /><div className="route-label dam-route">大船 · 去堤坝</div><div className="route-label workshop-route">小舟 · 回工坊</div><div className="polish-mini" style={{ filter: interactionId === "polish-cong" ? `brightness(${.7 + action / 170})` : undefined }}><JadeImage variant="final" /></div>{play}</div>;
    if (scene === 7) { const damOpacity = beat >= 8 ? 1 : interactionId === "follow-command" ? pan / 100 : 0; return <div className={`ceremony-world world art-world ${interactionId ? `interaction-${interactionId}` : ""}`}><div className="ceremony-background" /><div className="dam-background" style={{ opacity: damOpacity }} /><div className="scene-cinematic-shade" /><div className="flood-atmosphere strong" /><div className="ceremony-focus" style={{ opacity: 1 - damOpacity }}><JadeImage variant="final" /></div><img className="dam-workers-art" src="assets/group_dam_workers.png" alt="" style={{ opacity: damOpacity }} /><div className="command-line"><span className="on" /><i /><span className={pan > 25 ? "on" : ""} /><i /><span className={pan > 55 ? "on" : ""} /><i /><span className={pan > 82 ? "on" : ""} /></div>{play}</div>; }
    if (scene === 8) return <div className={`return-world world art-world ${interactionId ? `interaction-${interactionId}` : ""}`}><div className="return-background" /><div className="scene-cinematic-shade" /><img className="li-sad-art" src="assets/li_stand_clean.png" alt="" />{play}</div>;
    if (scene === 9) return <div className={`tomb-world world art-world ${interactionId ? `interaction-${interactionId}` : ""}`}><div className="tomb-background" /><div className="scene-cinematic-shade" /><img className="tomb-diagram-art" src="assets/tomb_diagram.png" alt="反山M12玉器分布示意" />{play}</div>;
    return <div className={`excavate-world world art-world ${interactionId ? `interaction-${interactionId}` : ""}`}><div className="excavation-background" /><div className="scene-cinematic-shade" /><div className="found-cong"><JadeImage variant="final" /></div><div className="record-tag"><span>反山 M12</span><b>M12:98</b><small>高约 8.8—8.9 cm · 重约 6.5 kg</small></div>{play}{done && <div className={`collection-card ${card.tone}`}><div className="card-art"><JadeImage variant="final" /><div className="card-knot" /></div><div className="card-copy"><small>M12:98 · 良渚文化玉琮王</small><h3>《{card.name}》</h3><p>{card.copy}</p><div className="result-values"><span>玉成度 <b>{strategy.aq}</b></span><span>众成度 <b>{together}</b></span><span>留痕度 <b>{strategy.memory}</b></span></div><div><span>神人兽面纹</span><span>双端管钻</span><span>反山 M12</span></div></div></div>}</div>;
  };

  const visibleLine = !workshopIntro && current?.kind === "dialogue" ? current.lines[dialogueLine] : null;
  return <main className="app-shell"><header className="topbar"><div><p className="eyebrow">良渚玉琮王 · 横屏交互预览</p><h1>众手成琮</h1></div><div className="top-actions"><button onClick={() => goScene(scene)}>重置本幕</button><button className="primary" onClick={() => setSelector(true)}>选幕预览 · {String(scene + 1).padStart(2, "0")}</button></div></header><section className={`stage ${strategy.ss < 60 ? "stability-low" : ""}`}><div className={`scene-slate ${beat === 0 ? "visible" : ""}`}><span>{scenes[scene].act} · {scenes[scene].place}</span><h2>{scenes[scene].title}</h2></div>{world()}{scene > 0 && !transition && <StrategyHUD values={strategy} flood={floodPressure} />}{current?.kind === "interaction" && <InteractionGuide id={interactionId} detail={guideDetail()} scene={scene} />}{visibleLine && <StoryLine key={`${scene}-${beat}-${dialogueLine}`} line={visibleLine} opening={scene === 0} scene={scene} onNext={nextDialogueLine} />}{feedback && <div className="interaction-feedback">{feedback}</div>}{strategyFeedback && <div className="strategy-feedback">{strategyFeedback}</div>}{done && scene < 10 && <button className="scene-complete" onClick={advanceScene} aria-label="进入下一幕"><i /></button>}{transition && <div className={`time-transition ${transition}`} aria-live="polite"><div className="transition-object"><JadeImage variant="final" /></div><div className="transition-copy"><small>{transition === "to-past" ? "纹饰沉入阴影" : "土层合拢，时间继续"}</small><strong>{transition === "to-past" ? "五千年前 · 水边玉作工坊" : "1986 · 反山 M12"}</strong></div><div className="transition-rings" /></div>}<div className="beat-dots" aria-hidden="true">{scripts[scene].map((_, index) => <i key={index} className={index < beat ? "past" : index === beat ? "now" : ""} />)}</div><div className="stage-nav"><button disabled={scene === 0} onClick={() => goScene(scene - 1)}>←</button><button onClick={() => setSelector(true)}>{scene + 1} / {scenes.length}</button><button disabled={scene === 10} onClick={() => goScene(scene + 1)}>→</button></div></section>{selector && <div className="selector-backdrop" role="button" tabIndex={0} onClick={event => { if (event.target === event.currentTarget) setSelector(false); }} onKeyDown={event => { if (event.key === "Escape" || event.key === "Enter") setSelector(false); }}><section className="selector"><header><div><span>DIRECTOR&apos;S PREVIEW</span><h2>选择一幕直接体验</h2><p>数值会随本次体验继续保留；点击“新开一局”可清空全部策略记录。</p></div><div className="selector-actions"><button onClick={() => { setEffects({}); setChoice1(null); setChoice2(null); goScene(0); }}>新开一局</button><button onClick={() => setSelector(false)}>关闭</button></div></header><div className="scene-grid">{scenes.map((item, index) => <button key={item.title} className={scene === index ? "active" : ""} onClick={() => goScene(index)}><i>{String(index + 1).padStart(2, "0")}</i><span>{item.act}</span><h3>{item.title}</h3><p>{item.place} · {scripts[index].filter(beat => beat.kind === "interaction").length}项互动</p></button>)}</div></section></div>}</main>;
}
