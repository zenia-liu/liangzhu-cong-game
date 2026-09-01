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
  "feel-ridge": { title: "摸出接钻台痕", instruction: "按住孔壁，从左向右慢慢摸过三处触感带", outcome: "找到两端接钻时留下的细小台痕" },
  "grind-sequence": { title: "用砺石刻出神人兽面纹", instruction: "粗石走外轮廓，中石定神人，细石收兽面；顺着底纹拖动即可，不必描细线", outcome: "轮廓、神人与兽面依制作顺序显出" },
  "align-motif": { title: "给神徽定中轴", instruction: "从羽冠顶端向下画到兽面中央；线足够居中就能定准", outcome: "眼、鼻与羽冠获得共同基准" },
  "assist-carving": { title: "让纹线继续刻进玉面", instruction: "工料会不断落下；只接住工位当前需要的砂、水或清屑", outcome: "细线继续刻进玉面" },
  "inspect-crack": { title: "借侧光找出裂纹走向", instruction: "按住侧光在玉面缓慢移动，让断续暗线逐段显现", outcome: "看清裂纹斜穿兽面的位置，决定中轴如何避让" },
  "resource-dispatch": { title: "安排三艘先发船", instruction: "每轮选择一批最先运走的物资", outcome: "改变工坊、堤坝和聚落此刻获得的支援" },
  "follow-boats": { title: "跟船穿过水路", instruction: "向左拖动画面，让大小两船驶向各自目的地", outcome: "同时保住堤坝与玉作" },
  "polish-cong": { title: "完成最后抛光", instruction: "在玉面上来回擦拭，直到光泽铺开", outcome: "玉琮可以交器" },
  "follow-command": { title: "看命令如何抵达堤坝", instruction: "向左拖动画面，依次点亮人手、粮、船和木桩", outcome: "仪式上的命令转化为守堤行动" },
  "pass-baskets": { title: "把土筐传到缺口", instruction: "按住土筐，递到下一双手中，连续送往缺口", outcome: "最后一层草裹泥被压上堤坝" },
  "focus-two": { title: "留下第二处记忆", instruction: "选择你此刻最想记住的画面", outcome: "它将与第一次选择共同生成收藏卡" },
  "scan-boats": { title: "寻找岩的归舟", instruction: "依次检查三条靠岸的船", outcome: "确认岩没有随队回来" },
  "tie-knot": { title: "把短绳重新系起", instruction: "将两截绳头向中间拖拢", outcome: "岩的死讯不被说破，却被留下" },
  "compare-cong": { title: "比较六件玉琮", instruction: "逐件查看墓中不同位置的玉琮", outcome: "它们并非同一件器物的复制品" },
  "place-cong": { title: "安放大琮", instruction: "将玉琮拖入墓主头部近旁的虚线位置", outcome: "玉琮最终进入反山 M12" },
  "brush-soil": { title: "清理玉琮周边", instruction: "在土层上来回轻扫，不要直接提器", outcome: "器物位置和纹饰逐渐显露" },
  "touch-traces": { title: "从器物读回人的痕迹", instruction: "触摸孔壁、细线、裂隙与绳结四处痕迹", outcome: "让编号背后的声音重新出现" },
};

type StrategyValues = { aq: number; ss: number; memory: number; cooperation: number };
type StrategyEffect = Partial<StrategyValues>;

// All four records now carry through the whole journey.  These are deliberately
// modest starting points: the ending should be shaped by craft, shared labour,
// and what the player chooses to remember, rather than by one high default.
// Water level is a separate, scene-authored pressure and never enters this ledger.
const baseStrategy: StrategyValues = { aq: 18, ss: 45, memory: 8, cooperation: 25 };
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
  const ranked = [
    { key: "器物", value: values.aq },
    { key: "众手", value: together },
    { key: "归人", value: values.memory },
  ].sort((left, right) => right.value - left.value);
  const dominant = ranked[0].value - ranked[1].value >= 14;
  if (dominant) return cards[`${ranked[0].key}+${ranked[0].key}`];
  const pair = [ranked[0].key, ranked[1].key];
  if (pair.includes("器物") && pair.includes("众手")) return cards["器物+众手"];
  if (pair.includes("器物") && pair.includes("归人")) return cards["器物+归人"];
  return cards["众手+归人"];
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
  final: "assets/jade_cong_new.webp",
  raw: "assets/jade_raw.webp",
  drilled: "assets/jade_drilled.webp",
  carving: "assets/jade_carving.webp",
};
const scenePreloadAssets = [
  ["assets/bg_museum_hall.webp", "assets/jade_cong_new.webp", "assets/jade_motif_outline.webp"],
  ["assets/bg_workshop_scroll.webp", "assets/jade_raw.webp", "assets/master_portrait_v3.webp", "assets/yan_portrait_v2.webp", "assets/li_portrait_new.webp", "assets/arrival_new_01.webp", "assets/arrival_new_02.webp", "assets/arrival_new_03.webp", "assets/arrival_new_04.webp", "assets/arrival_new_05.webp"],
  ["assets/workers_cut.webp", "assets/li_work_complete.webp", "assets/role_linecutter.webp"],
  ["assets/role_driller.webp", "assets/jade_drilled.webp", "assets/tool_water_bowl.webp", "assets/tool_sand_basket.webp"],
  ["assets/role_shaper_female.webp", "assets/jade_drilled.webp", "assets/jade_motif_outline.webp"],
  ["assets/role_carver.webp", "assets/jade_carving.webp"],
  ["assets/bg_logistics_new.webp", "assets/jade_cong_new.webp"],
  ["assets/bg_ceremony_new.webp", "assets/bg_dam_new.webp", "assets/group_dam_workers.webp"],
  ["assets/bg_return_new.webp"],
  ["assets/bg_tomb_new.webp", "assets/tomb_diagram.webp"],
  ["assets/bg_excavation_new.webp", "assets/role_archaeology_lead.webp", "assets/role_archaeology_recorder.webp"],
];
function JadeImage({ variant, className = "", rotation }: { variant: JadeVariant; className?: string; rotation?: number }) {
  const tilt = rotation === undefined ? 0 : Math.sin(rotation * Math.PI / 90) * 18;
  return <img className={`jade-art jade-${variant} ${className}`} src={jadeArt[variant]} alt="" decoding="async" style={rotation === undefined ? undefined : { transform: `perspective(900px) rotateX(3deg) rotateY(${tilt}deg)`, filter: `brightness(${.82 + Math.abs(Math.cos(rotation * Math.PI / 180)) * .28})` }} />;
}
function Gesture({ kind = "drag" }: { kind?: "drag" | "tap" | "circle" | "swipe" }) { return <div className={`gesture ${kind}`} aria-hidden="true"><i /><span /></div>; }

function InteractionGuide({ id, detail, scene }: { id: string; detail?: string; scene: number }) {
  const guide = interactionGuides[id];
  if (!guide || id === "focus-one" || id === "focus-two") return null;
  return <aside className="interaction-guide" data-scene={scene} data-interaction={id} aria-live="polite"><small>此刻要做</small><strong>{guide.title}</strong><p>{detail ?? guide.instruction}</p><span>{guide.outcome}</span></aside>;
}

type PortraitMeta = { src?: string; side: "left" | "right"; role: string };

function portraitFor(speaker: string, scene: number): PortraitMeta {
  if (speaker === "砺") return { src: scene === 3 ? "assets/li_work_complete.webp" : "assets/li_portrait_new.webp", side: "right", role: "li" };
  if (speaker === "年长的砺") return { src: "assets/li_portrait_new.webp", side: "right", role: "li elder" };
  if (speaker === "岩") return { src: "assets/yan_portrait_v2.webp", side: "left", role: "yan" };
  if (speaker === "老玉工") return { src: "assets/master_portrait_v3.webp", side: "left", role: "master" };
  if (speaker === "工坊管事" || speaker === "墓葬管事" || speaker === "各处代表") return { src: "assets/role_steward.webp", side: "left", role: "steward full-role" };
  if (speaker === "线切割工") return { src: "assets/role_linecutter.webp", side: "left", role: "linecutter full-role" };
  if (speaker === "钻孔工") return { src: "assets/role_driller.webp", side: "left", role: "driller full-role" };
  if (speaker === "修形工") return { src: "assets/role_shaper_female.webp", side: "left", role: "shaper full-role" };
  if (speaker === "纹饰工") return { src: "assets/role_carver.webp", side: "left", role: "carver full-role" };
  if (speaker === "送料人" || speaker === "年轻助手") return { src: "assets/role_supplier.webp", side: "right", role: "supplier full-role" };
  if (speaker === "仪式主持者") return { src: "assets/role_ritual_host.webp", side: "left", role: "ritual-host full-role" };
  if (speaker === "最高等级权力者") return { src: "assets/role_authority.webp", side: "left", role: "authority full-role" };
  if (speaker === "守堤小队长") return { src: scene === 8 ? "assets/role_return_captain.webp" : "assets/role_dam_captain.webp", side: "left", role: "flood full-role" };
  if (speaker === "守堤者" || speaker === "传令者") return { src: "assets/role_dam_captain.webp", side: "left", role: "flood full-role" };
  if (speaker === "考古领队") return { src: "assets/role_archaeology_lead.webp", side: "left", role: "modern full-role" };
  if (speaker === "记录员") return { src: "assets/role_archaeology_recorder.webp", side: "left", role: "modern full-role" };
  return { side: "left", role: "artisan" };
}

function StoryLine({ line, opening, scene, onNext }: { line: Line; opening?: boolean; scene: number; onNext: () => void }) {
  const content = <><div className="line-row"><span>{line.speaker}</span><p>{line.text}</p></div><i className="next-mark" /></>;
  if (opening) return <button className="story-line opening" onClick={onNext}>{content}</button>;
  const portrait = portraitFor(line.speaker, scene);
  return <div className={`vn-dialogue side-${portrait.side}`} data-scene={scene}><div className={`vn-portrait ${portrait.role}`} aria-hidden="true">{portrait.src ? <img src={portrait.src} alt="" decoding="async" fetchPriority="high" /> : <div className="role-standee"><i className="role-head" /><i className="role-body" /><i className="role-prop" /></div>}<span>{line.speaker}</span></div><button className="story-line vn-box" onClick={onNext} aria-label={`${line.speaker}：${line.text} 点击继续`}>{content}<small>点击继续</small></button></div>;
}

function DragSurface({ children, className = "", onMotion }: { children: ReactNode; className?: string; onMotion: (dx: number, dy: number) => void }) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const down = (e: PointerEvent<HTMLDivElement>) => { start.current = { x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId); };
  const move = (e: PointerEvent<HTMLDivElement>) => { if (!start.current) return; onMotion(e.clientX - start.current.x, e.clientY - start.current.y); start.current = { x: e.clientX, y: e.clientY }; };
  const up = () => { start.current = null; };
  return <div className={`drag-surface ${className}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>{children}</div>;
}

const tombCongPieces = [
  { src: "assets/jade_carving.webp", name: "玉琮王", className: "cong-king" },
  { src: "assets/cong_tall.webp", name: "细高琮", className: "cong-tall" },
  { src: "assets/cong_wide.webp", name: "中型宽琮", className: "cong-wide" },
  { src: "assets/cong_low.webp", name: "小型矮琮", className: "cong-plain" },
  { src: "assets/cong_double.webp", name: "双节琮", className: "cong-small" },
  { src: "assets/cong_simple.webp", name: "小型简纹琮", className: "cong-slim" },
] as const;

function TombCongComparison({ seen, onSelect }: { seen: number[]; onSelect: (index: number) => void }) {
  return <div className="tomb-cong-comparison" aria-label="墓中六件玉琮">
    {tombCongPieces.map((piece, index) => <button key={piece.name} className={`${piece.className}${seen.includes(index) ? " seen" : ""}`} onClick={() => onSelect(index)} aria-label={`查看${piece.name}`}>
      <img src={piece.src} alt={piece.name} />
    </button>)}
  </div>;
}

function PlaceCongGame({ onComplete }: { onComplete: () => void }) {
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef<number | null>(null);
  const completed = useRef(false);
  const [position, setPosition] = useState({ x: 27, y: 69 });
  const positionRef = useRef({ x: 27, y: 69 });
  const [placed, setPlaced] = useState(false);
  const target = { x: 54, y: 22 };
  const point = (event: PointerEvent<HTMLDivElement>) => {
    const rect = fieldRef.current?.getBoundingClientRect();
    if (!rect) return positionRef.current;
    return { x: Math.max(4, Math.min(96, (event.clientX - rect.left) / rect.width * 100)), y: Math.max(5, Math.min(95, (event.clientY - rect.top) / rect.height * 100)) };
  };
  const moveKing = (next: { x: number; y: number }) => { positionRef.current = next; setPosition(next); };
  const release = () => {
    if (pointerRef.current === null) return;
    pointerRef.current = null;
    if (Math.hypot(positionRef.current.x - target.x, positionRef.current.y - target.y) < 17) {
      moveKing(target);
      setPlaced(true);
      if (!completed.current) { completed.current = true; window.setTimeout(onComplete, 650); }
    } else moveKing({ x: 27, y: 69 });
  };
  return <div ref={fieldRef} className="place-cong-game" onPointerMove={event => { if (pointerRef.current !== null) moveKing(point(event)); }} onPointerUp={release} onPointerCancel={release}>
    <div className="cong-placement-recess" aria-hidden="true" />
    <button className={`place-cong-king${placed ? " placed" : ""}`} style={{ left: `${position.x}%`, top: `${position.y}%` }} aria-label="拖动玉琮王安放到头部近旁" onPointerDown={event => { if (placed) return; pointerRef.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); }}>
      <img src="assets/jade_carving.webp" alt="玉色玉琮王" draggable={false} />
    </button>
  </div>;
}

function ScratchJade({ progress, onProgress, onComplete, variant = "raw", coverWholeSurface = false, className = "", showProgress = true }: { progress: number; onProgress: (value: number) => void; onComplete: () => void; variant?: JadeVariant; coverWholeSurface?: boolean; className?: string; showProgress?: boolean }) {
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
    // jadeArt already contains the public asset path. Prefixing it again made
    // the scratch canvas load `/assets/assets/...`, leaving a transparent,
    // non-interactive layer above the jade.
    source.src = jadeArt[variant];
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
      context.globalCompositeOperation = coverWholeSurface ? "source-over" : "source-atop";
      const shade = context.createRadialGradient(rect.width * .44, rect.height * .38, 8, rect.width * .5, rect.height * .5, rect.width * .62);
      shade.addColorStop(0, coverWholeSurface ? "rgba(157,112,65,1)" : "rgba(65,55,42,.7)");
      shade.addColorStop(.68, coverWholeSurface ? "rgba(103,70,40,1)" : "rgba(31,31,27,.82)");
      shade.addColorStop(1, coverWholeSurface ? "rgba(63,43,27,1)" : "rgba(10,13,12,.92)");
      context.fillStyle = shade;
      context.fillRect(0, 0, rect.width, rect.height);
      // Multiple grain sizes and compacted clods make this read as excavated
      // soil rather than a single flat brown veil.
      const grains = coverWholeSurface ? 310 : 84;
      for (let index = 0; index < grains; index += 1) {
        const x = (index * 73 + index * index * 3) % Math.max(1, rect.width);
        const y = (index * 47 + index * index * 5) % Math.max(1, rect.height);
        const size = coverWholeSurface ? 1.2 + (index % 6) * .82 : 1 + index % 3;
        context.fillStyle = index % 5 === 0 ? "rgba(43,29,17,.38)" : index % 3 === 0 ? "rgba(203,161,102,.22)" : "rgba(75,48,27,.28)";
        context.beginPath();
        context.ellipse(x, y, size * 1.45, size, (index % 7) * .38, 0, Math.PI * 2);
        context.fill();
      }
      if (coverWholeSurface) {
        for (let index = 0; index < 26; index += 1) {
          const x = (index * 127 + 31) % Math.max(1, rect.width);
          const y = (index * 83 + 19) % Math.max(1, rect.height);
          const clod = context.createRadialGradient(x - 2, y - 2, 1, x, y, 8 + index % 7);
          clod.addColorStop(0, "rgba(189,139,78,.22)");
          clod.addColorStop(.7, "rgba(74,45,24,.2)");
          clod.addColorStop(1, "rgba(43,27,16,0)");
          context.fillStyle = clod;
          context.beginPath();
          context.arc(x, y, 8 + index % 7, 0, Math.PI * 2);
          context.fill();
        }
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
  }, [coverWholeSurface, onProgress, variant]);

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
    // Progress follows the genuinely cleared portion of the soil mask. This
    // avoids a fast, artificial jump near 80% and keeps the whole sweep even.
    const next = remaining === 0 ? 100 : Math.min(99, Math.round((1 - remaining / totalOpaqueSamples.current) * 100));
    onProgress(next);
    if (next >= 80 || remaining === 0) finishAutomatically();
  };

  const scratchAt = (event: { clientX: number; clientY: number }) => {
    const canvas = canvasRef.current;
    if (!canvas || finished.current) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    // A broad brush is forgiving on a phone and makes each stroke visibly
    // remove soil instead of leaving imperceptibly thin tracks.
    const radius = Math.max(31, Math.min(rect.width, rect.height) * .13);
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.globalCompositeOperation = "destination-out";
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
    moveCount.current += 1;
    // Keep the feedback close to the hand movement. The excavation surface is
    // small enough that sampling every second stroke stays responsive.
    if (moveCount.current % 2 === 0) measureCoverage();
  };

  return <div className={`jade-inspection-surface jade-scratch ${className} ${autoCleaning ? "auto-clean" : ""}`}><JadeImage variant={variant} className="interactive-jade-raw" /><canvas ref={canvasRef} aria-label="刮开玉琮周边的覆土" onPointerDown={event => { if (autoCleaning) return; dragging.current = true; event.currentTarget.setPointerCapture(event.pointerId); scratchAt(event); }} onPointerMove={event => dragging.current && scratchAt(event)} onPointerUp={() => { dragging.current = false; measureCoverage(); }} onPointerCancel={() => { dragging.current = false; measureCoverage(); }} onMouseDown={event => { if (!dragging.current && !autoCleaning) scratchAt(event); }} onClick={event => { if (!autoCleaning) { scratchAt(event); measureCoverage(); } }} />{showProgress && <span className="scratch-progress">{autoCleaning ? "残余泥水正在自行退去…" : `已清理 ${progress}%`}</span>}</div>;
}

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: "landscape") => Promise<void>;
};

export function LandscapeGate() {
  const [portrait, setPortrait] = useState(false);
  const [needsManualRotation, setNeedsManualRotation] = useState(false);

  useEffect(() => {
    const compactQuery = window.matchMedia("(max-width: 900px)");
    const portraitQuery = window.matchMedia("(orientation: portrait)");
    const sync = () => {
      // Safari and some embedded browsers do not reliably update the combined
      // orientation media query. The viewport comparison is the reliable fallback.
      const isPortrait = compactQuery.matches && (portraitQuery.matches || window.innerHeight > window.innerWidth);
      setPortrait(isPortrait);
      if (!isPortrait) setNeedsManualRotation(false);
    };
    sync();
    compactQuery.addEventListener("change", sync);
    portraitQuery.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    screen.orientation?.addEventListener?.("change", sync);
    window.visualViewport?.addEventListener("resize", sync);
    return () => {
      compactQuery.removeEventListener("change", sync);
      portraitQuery.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      screen.orientation?.removeEventListener?.("change", sync);
      window.visualViewport?.removeEventListener("resize", sync);
    };
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
      setNeedsManualRotation(window.matchMedia("(max-width: 900px)").matches && window.innerHeight > window.innerWidth);
    }, 450);
  };

  if (!portrait) return null;
  return <div className="landscape-gate" role="dialog" aria-modal="true" aria-label="横屏体验提示"><div className="orientation-phone"><i /></div><div><small>良渚玉琮王 · 横屏体验</small><h2>{needsManualRotation ? "请将手机横过来" : "横屏观看，才能完整进入工坊"}</h2><p>{needsManualRotation ? "当前浏览器不允许网页直接旋转系统方向，横放手机后游戏会自动继续。" : "点击后将尝试进入全屏横屏；若系统没有自动旋转，请横放手机。"}</p><button onClick={enterLandscape}>{needsManualRotation ? "再次尝试横屏" : "进入横屏体验"}</button></div></div>;
}

function StrategyHUD({ values, flood }: { values: StrategyValues; flood: number }) {
  const together = clamp(values.ss * .6 + values.cooperation * .4);
  const items = [
    { key: "aq", label: "玉成", value: values.aq },
    { key: "together", label: "众成", value: together },
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
  const [expected, setExpected] = useState<0 | 1>(0);
  const [progress, setProgress] = useState(0);
  const [misses, setMisses] = useState(0);
  const [response, setResponse] = useState("");
  const markerRef = useRef<HTMLElement | null>(null);
  const motionRef = useRef<Animation | null>(null);
  const responseTimerRef = useRef<number | null>(null);
  const finished = useRef(false);

  useEffect(() => {
    const marker = markerRef.current;
    const meter = marker?.parentElement;
    if (!marker || !meter) return;

    let measuredWidth = meter.clientWidth;
    const startMotion = (time = 0) => {
      const travel = Math.max(0, meter.clientWidth - 28);
      const motion = marker.animate([
        { transform: "translate3d(0, 0, 0)" },
        { transform: `translate3d(${travel}px, 0, 0)` },
      ], {
        duration: 780,
        direction: "alternate",
        iterations: Infinity,
        easing: "linear",
      });
      motion.currentTime = time;
      motionRef.current = motion;
    };

    startMotion();
    const observer = new ResizeObserver(() => {
      const nextWidth = meter.clientWidth;
      if (Math.abs(nextWidth - measuredWidth) < 1) return;
      measuredWidth = nextWidth;
      const currentTime = motionRef.current?.currentTime;
      const preservedTime = typeof currentTime === "number" ? currentTime : 0;
      motionRef.current?.cancel();
      startMotion(preservedTime);
    });
    observer.observe(meter);

    return () => {
      observer.disconnect();
      motionRef.current?.cancel();
      motionRef.current = null;
      if (responseTimerRef.current !== null) window.clearTimeout(responseTimerRef.current);
    };
  }, []);

  const showResponse = (message: string, duration: number) => {
    if (responseTimerRef.current !== null) window.clearTimeout(responseTimerRef.current);
    setResponse(message);
    responseTimerRef.current = window.setTimeout(() => {
      setResponse("");
      responseTimerRef.current = null;
    }, duration);
  };

  const pull = (side: 0 | 1) => {
    if (finished.current) return;
    const marker = markerRef.current;
    const meter = marker?.parentElement;
    const transform = marker ? window.getComputedStyle(marker).transform : "none";
    const values = transform.match(/^matrix\(([^)]+)\)$/)?.[1].split(",").map(Number);
    const offset = values?.[4] ?? 0;
    const travel = Math.max(1, (meter?.clientWidth ?? 28) - 28);
    const position = Math.max(0, Math.min(1, offset / travel));
    const atEndpoint = side === 0 ? position <= .18 : position >= .82;
    if (side !== expected || !atEndpoint) {
      setMisses(value => value + 1);
      showResponse(side !== expected ? "还没轮到这一侧" : "等指针抵达端点", 650);
      return;
    }
    const next = Math.min(100, progress + 10);
    setProgress(next);
    onProgress(next);
    setExpected(side === 0 ? 1 : 0);
    showResponse("合拍", 380);
    if (next === 100) {
      finished.current = true;
      onComplete(clamp(100 - misses * 7));
    }
  };

  return <div className="dual-cut" data-expected={expected === 0 ? "left" : "right"}>
    <div className="rhythm-meter" aria-label="往复节奏指针"><span>左</span><b>看准端点</b><span>右</span><i ref={markerRef} /></div>
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
      <span className={`scribe-stone ${drawing ? "drawing" : ""}`} style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}><img src="assets/jade_raw.webp" alt="划线砺石" /><b>砺石</b></span>
      {!drawing && strokeProgress === 0 && <small className={`stone-cue cue-${stroke + 1}`}>按住砺石</small>}
      {drawing && <span className="stone-dust" style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }} />}
    </div>
  </div>;
}

function RidgeSearchGame({ onProgress, onComplete }: { onProgress: (value: number) => void; onComplete: () => void }) {
  const [active, setActive] = useState(false);
  const [finger, setFinger] = useState({ x: 50, y: 50 });
  const [explored, setExplored] = useState<number[]>([]);
  const [bumps, setBumps] = useState<number[]>([]);
  const [message, setMessage] = useState("用指腹在孔壁各处慢慢摸一遍");
  const pointer = useRef<number | null>(null);
  const completeTimer = useRef<number | null>(null);
  const finished = useRef(false);
  const exploredRef = useRef(new Set<number>());
  const bumpsRef = useRef(new Set<number>());
  const raisedPoints = [{ x: 27, y: 34 }, { x: 69, y: 43 }, { x: 48, y: 71 }];
  const raisedCells = [5, 6, 9];

  useEffect(() => () => { if (completeTimer.current !== null) window.clearTimeout(completeTimer.current); }, []);
  useEffect(() => {
    if (finished.current || bumps.length !== 3 || explored.length < 8) return;
    finished.current = true;
    setMessage("三处触感连成一圈：找到了接钻台痕");
    onProgress(100);
    completeTimer.current = window.setTimeout(onComplete, 720);
  }, [bumps.length, explored.length, onComplete, onProgress]);

  const point = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)), y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)) };
  };
  const feelAt = (event: PointerEvent<HTMLDivElement>) => {
    if (pointer.current !== event.pointerId || finished.current) return;
    const current = point(event);
    setFinger(current);
    const ellipse = ((current.x - 50) / 50) ** 2 + ((current.y - 50) / 44) ** 2;
    if (ellipse > 1) return;
    const column = Math.min(3, Math.floor(current.x / 25));
    const row = Math.min(2, Math.floor(current.y / (100 / 3)));
    const cell = row * 4 + column;
    if (!exploredRef.current.has(cell)) {
      exploredRef.current.add(cell);
      setExplored([...exploredRef.current]);
    }
    const bump = raisedPoints.findIndex(point => Math.hypot(current.x - point.x, current.y - point.y) < 12);
    if (bump >= 0 && !bumpsRef.current.has(bump)) {
      bumpsRef.current.add(bump);
      setBumps([...bumpsRef.current]);
      setMessage("指腹一颤——这里有一道高起的台痕");
      if (navigator.vibrate) navigator.vibrate([12, 35, 12]);
    } else if (bump < 0 && bumpsRef.current.size < 3) setMessage("平整，没有明显阻力");
    onProgress(Math.min(92, Math.round((exploredRef.current.size / 8) * 45 + (bumpsRef.current.size / 3) * 47)));
  };

  return <div className={`ridge-search-game ${active ? "feeling" : ""} ${finished.current ? "found" : ""}`}>
    <div className="ridge-jade"><JadeImage variant="drilled" /></div>
    <div className="ridge-inner-wall" aria-hidden="true">{bumps.map(index => <i key={index} className={`ridge-bump bump-${index}`} />)}</div>
    <div className="ridge-status"><span>已摸 {explored.length} 处</span><b>{message}</b></div>
    <div className="ridge-touch-surface" aria-label="按住并在玉孔内壁各处触摸，寻找高起的台痕" onPointerDown={event => { if (finished.current) return; pointer.current = event.pointerId; setFinger(point(event)); event.currentTarget.setPointerCapture(event.pointerId); setActive(true); feelAt(event); }} onPointerMove={feelAt} onPointerUp={() => { pointer.current = null; setActive(false); }} onPointerCancel={() => { pointer.current = null; setActive(false); }}>
      <span className="tactile-finger" style={{ left: `${finger.x}%`, top: `${finger.y}%` }} />
      {explored.map(cell => <i key={cell} className={`touch-imprint imprint-${cell} ${bumps.some(index => raisedCells[index] === cell) ? "rough" : ""}`} />)}
    </div>
  </div>;
}

function MotifCarvingGame({ onProgress, onComplete }: { onProgress: (value: number) => void; onComplete: () => void }) {
  const stones = ["粗砺石", "中砺石", "细砺石"];
  const phaseNames = ["第一步 · 外轮廓", "第二步 · 神人", "第三步 · 兽面"];
  const phaseHints = ["拿粗砺石，沿羽冠与两侧外缘走一圈", "换中砺石，顺着中间的冠、鼻与人形拖动", "换细砺石，围住两只眼和下方兽面收线"];
  const paths = [
    [{ x1: 13, y1: 41, x2: 28, y2: 26 }, { x1: 28, y1: 26, x2: 46, y2: 11 }, { x1: 54, y1: 11, x2: 72, y2: 26 }, { x1: 72, y1: 26, x2: 87, y2: 41 }, { x1: 16, y1: 52, x2: 25, y2: 78 }, { x1: 84, y1: 52, x2: 75, y2: 78 }],
    [{ x1: 37, y1: 28, x2: 50, y2: 20 }, { x1: 50, y1: 20, x2: 63, y2: 28 }, { x1: 38, y1: 39, x2: 50, y2: 54 }, { x1: 62, y1: 39, x2: 50, y2: 54 }, { x1: 50, y1: 32, x2: 50, y2: 67 }],
    [{ x1: 25, y1: 54, x2: 42, y2: 54 }, { x1: 58, y1: 54, x2: 75, y2: 54 }, { x1: 34, y1: 66, x2: 50, y2: 77 }, { x1: 50, y1: 77, x2: 66, y2: 66 }, { x1: 42, y1: 70, x2: 58, y2: 70 }],
  ];
  const [phase, setPhase] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [strokes, setStrokes] = useState<number[]>([]);
  const [finishedLayers, setFinishedLayers] = useState<number[]>([]);
  const [cursor, setCursor] = useState({ x: 50, y: 50 });
  const [message, setMessage] = useState("先选砺石");
  const pointer = useRef<number | null>(null);
  const previous = useRef<{ x: number; y: number } | null>(null);
  const completed = useRef(false);
  const advancing = useRef(false);
  const strokesRef = useRef(new Set<number>());

  const startStone = (index: number) => {
    if (completed.current || index !== phase) { setMessage(index < phase ? "这块砺石已经用过" : "先完成眼前这一层"); return; }
    setSelected(index);
    setMessage(`用${stones[index]}沿亮纹刻画`);
  };
  const localPoint = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)), y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)) };
  };
  const markStroke = (event: PointerEvent<HTMLDivElement>) => {
    if (pointer.current !== event.pointerId || selected !== phase || completed.current || advancing.current) return;
    const current = localPoint(event);
    setCursor(current);
    previous.current = current;
    const hit = (path: typeof paths[number][number]) => {
      const dx = path.x2 - path.x1, dy = path.y2 - path.y1;
      const t = Math.max(0, Math.min(1, ((current.x - path.x1) * dx + (current.y - path.y1) * dy) / (dx * dx + dy * dy)));
      return Math.hypot(current.x - (path.x1 + dx * t), current.y - (path.y1 + dy * t)) < 12;
    };
    const index = paths[phase].findIndex((path, index) => !strokesRef.current.has(index) && hit(path));
    if (index < 0) return;
    strokesRef.current.add(index);
    const nextStrokes = [...strokesRef.current];
    setStrokes(nextStrokes);
    setMessage("刻痕落稳了");
    onProgress(Math.round((phase * 33) + (nextStrokes.length / paths[phase].length) * 33));
    if (nextStrokes.length !== paths[phase].length) return;
    advancing.current = true;
    window.setTimeout(() => {
      if (phase === 2) {
            completed.current = true;
            setFinishedLayers(value => [...value, phase]);
        setMessage("神人兽面纹已刻成");
        onProgress(100);
        window.setTimeout(onComplete, 620);
      } else {
        setFinishedLayers(value => [...value, phase]);
        setPhase(value => value + 1);
        setSelected(null);
        strokesRef.current.clear();
        setStrokes([]);
        setMessage("换下一块砺石");
        advancing.current = false;
      }
    }, 280);
  };

  return <div className={`motif-carving-game phase-${phase} ${selected !== null ? "carving" : ""}`}>
    <div className="carving-motif" aria-hidden="true"><img src="assets/jade_motif_outline.webp" alt="" />{[0, 1, 2].map(index => <img key={index} className={`motif-engraving engraving-${index} ${finishedLayers.includes(index) ? "revealed" : ""}`} src="assets/jade_motif_outline.webp" alt="" />)}</div>
    <div className="carving-status"><b>{phaseNames[Math.min(phase, 2)]}</b><span>{completed.current ? message : selected === null ? `先拿起${stones[phase]}` : phaseHints[phase]}</span></div>
    <div className="carving-surface" aria-label="按住砺石，沿神人兽面纹上宽容的亮纹拖动刻画" onPointerDown={event => { if (selected !== phase || completed.current) return; pointer.current = event.pointerId; previous.current = localPoint(event); setCursor(previous.current); event.currentTarget.setPointerCapture(event.pointerId); markStroke(event); }} onPointerMove={markStroke} onPointerUp={() => { pointer.current = null; previous.current = null; }} onPointerCancel={() => { pointer.current = null; previous.current = null; }}>
      {selected !== null && <span className="carving-stone" style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }} />}
      {selected === phase && paths[phase].map((path, index) => <i key={index} className={`motif-trace-lane ${strokes.includes(index) ? "done" : ""}`} style={{ left: `${path.x1}%`, top: `${path.y1}%`, width: `${Math.hypot(path.x2 - path.x1, path.y2 - path.y1)}%`, transform: `rotate(${Math.atan2(path.y2 - path.y1, path.x2 - path.x1)}rad)` }} />)}
    </div>
    <div className="carving-stones">{stones.map((stone, index) => <button key={stone} className={index === phase ? "ready" : index < phase ? "done" : ""} onClick={() => startStone(index)}><i /><span>{stone}</span></button>)}</div>
  </div>;
}

function MotifAxisGame({ onProgress, onComplete }: { onProgress: (value: number) => void; onComplete: () => void }) {
  const labels = ["羽冠", "双眼", "鼻梁"];
  const [offsets, setOffsets] = useState([-48, 34, -27]);
  const active = useRef<number | null>(null);
  const done = useRef(false);
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (active.current === null || done.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const next = Math.max(-48, Math.min(48, ((event.clientX - rect.left) / rect.width - .5) * 110));
    setOffsets(values => {
      const copy = [...values]; copy[active.current!] = Math.abs(next) < 7 ? 0 : next;
      const locked = copy.filter(value => value === 0).length;
      onProgress(locked * 33);
      if (locked === 3) { done.current = true; window.setTimeout(onComplete, 520); }
      return copy;
    });
  };
  return <div className="motif-axis-game"><img src="assets/jade_motif_outline.webp" alt="神人兽面纹描样" /><div className="axis-string" />{labels.map((label, index) => <div key={label} className={`axis-row ${offsets[index] === 0 ? "locked" : ""}`} style={{ top: `${31 + index * 19}%` }}><span>{label}</span><i /><button aria-label={`拖动${label}到中轴`} style={{ transform: `translateX(${offsets[index]}px)` }} onPointerDown={event => { active.current = index; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={move} onPointerUp={() => { active.current = null; }} onPointerCancel={() => { active.current = null; }} /></div>)}</div>;
}

function MotifCenterStrokeGame({ onProgress, onComplete }: { onProgress: (value: number) => void; onComplete: () => void }) {
  const [stroke, setStroke] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);
  const [note, setNote] = useState("从羽冠顶端向下划到兽面的中央");
  const pointer = useRef<number | null>(null);
  const strokeRef = useRef<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);
  const point = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 };
  };
  const finish = () => {
    if (!strokeRef.current) return;
    const { start, end } = strokeRef.current;
    const centered = Math.abs(start.x - 50) < 14 && Math.abs(end.x - 50) < 14 && Math.abs(start.x - end.x) < 18;
    if (start.y < 20 && end.y > 79 && centered) { setNote("中轴定准"); onProgress(100); window.setTimeout(onComplete, 520); }
    else { setNote("从顶端到下方中央，尽量画直一些"); strokeRef.current = null; setStroke(null); }
  };
  return <div className="motif-center-stroke"><img src="assets/jade_motif_outline.webp" alt="神人兽面纹描样" /><div className="stroke-note">{note}</div><div className="stroke-surface" aria-label="在神人兽面纹上从上到下画出中轴线" onPointerDown={event => { pointer.current = event.pointerId; const start = point(event); strokeRef.current = { start, end: start }; setStroke(strokeRef.current); event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={event => { if (pointer.current === event.pointerId && strokeRef.current) { const next = { ...strokeRef.current, end: point(event) }; strokeRef.current = next; setStroke(next); } }} onPointerUp={event => { if (pointer.current === event.pointerId) { pointer.current = null; finish(); } }} onPointerCancel={() => { pointer.current = null; strokeRef.current = null; setStroke(null); }}>
    {stroke && <i className="center-stroke-line" style={{ left: `${stroke.start.x}%`, top: `${stroke.start.y}%`, width: `${Math.hypot(stroke.end.x - stroke.start.x, stroke.end.y - stroke.start.y)}%`, transform: `rotate(${Math.atan2(stroke.end.y - stroke.start.y, stroke.end.x - stroke.start.x)}rad)` }} />}
  </div></div>;
}

function CrackLightGame({ onProgress, onComplete }: { onProgress: (value: number) => void; onComplete: () => void }) {
  const segments = [
    { x: 24, y: 61, angle: 28, length: 9 },
    { x: 38, y: 74, angle: -19, length: 15 },
    { x: 52, y: 65, angle: 41, length: 10 },
    { x: 64, y: 82, angle: -33, length: 13 },
    { x: 77, y: 71, angle: 16, length: 8 },
  ];
  const [light, setLight] = useState({ x: 50, y: 50 });
  const [revealed, setRevealed] = useState<number[]>([]);
  const [note, setNote] = useState("按住侧光，在玉面寻找断续暗线");
  const activePointer = useRef<number | null>(null);
  const finished = useRef(false);
  const locate = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100)),
      y: Math.max(0, Math.min(100, (event.clientY - rect.top) / rect.height * 100)),
    };
  };
  const scan = (point: { x: number; y: number }) => {
    if (finished.current) return;
    setLight(point);
    setRevealed(previous => {
      const next = segments.reduce<number[]>((found, segment, index) => {
        const distance = Math.hypot(point.x - segment.x, (point.y - segment.y) * 1.2);
        return distance < 12 && !found.includes(index) ? [...found, index] : found;
      }, previous);
      if (next.length !== previous.length) {
        onProgress(Math.round(next.length / segments.length * 100));
        setNote(next.length === segments.length ? "裂纹走向已显出" : `已找到 ${next.length} 段，继续沿暗线移动`);
        if (next.length === segments.length) {
          finished.current = true;
          window.setTimeout(onComplete, 780);
        }
      }
      return next;
    });
  };
  return <div className={`crack-light-game ${revealed.length === segments.length ? "complete" : ""}`}>
    <div className="crack-light-copy"><b>{note}</b><span>侧光照出裂纹 · {revealed.length} / {segments.length}</span></div>
    <JadeImage variant="carving" className="crack-light-jade" />
    <div className="crack-light-surface" aria-label="按住侧光，在玉面上寻找裂纹" onPointerDown={event => { activePointer.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); scan(locate(event)); }} onPointerMove={event => { if (activePointer.current === event.pointerId) scan(locate(event)); }} onPointerUp={() => { activePointer.current = null; }} onPointerCancel={() => { activePointer.current = null; }}>
      {segments.map((segment, index) => <i key={index} className={`crack-light-segment ${revealed.includes(index) ? "found" : ""}`} style={{ "--x": `${segment.x}%`, "--y": `${segment.y}%`, "--angle": `${segment.angle}deg`, "--length": `${segment.length}%` } as React.CSSProperties} />)}
      <b className="raking-light" style={{ left: `${light.x}%`, top: `${light.y}%` }} />
    </div>
  </div>;
}

function CarvingStationGame({ onProgress, onComplete }: { onProgress: (value: number) => void; onComplete: () => void }) {
  const sequence = ["添砂", "润水", "清屑", "添砂", "润水", "清屑"] as const;
  const [step, setStep] = useState(0);
  const [note, setNote] = useState("纹线要继续向前，先给刻槽添砂");
  const choose = (item: typeof sequence[number]) => {
    if (item !== sequence[step]) { setNote("先按工位提示做这一道"); return; }
    const next = step + 1;
    onProgress(Math.round(next / sequence.length * 100));
    if (next === sequence.length) { setNote("这一段纹线刻稳了"); window.setTimeout(onComplete, 600); }
    else { setStep(next); setNote(`纹线继续，接着${sequence[next]}`); }
  };
  return <div className="carving-station"><div className="station-jade"><JadeImage variant="carving" /><i className={`station-cut cut-${step}`} /></div><div className="station-copy"><b>正在刻一段兽面纹</b><span>{note}</span></div><div className="station-tools">{sequence.slice(0, 3).map((item, index) => <button key={item} className={sequence[step] === item ? "ready" : ""} onClick={() => choose(item)}><i className={`tool-${index}`} /><span>{item}</span></button>)}</div></div>;
}

function CarvingRainGame({ onProgress, onComplete }: { onProgress: (value: number) => void; onComplete: () => void }) {
  const kinds = ["砂", "水", "清"] as const;
  const totalRounds = 6;
  const [round, setRound] = useState(0);
  const [miss, setMiss] = useState(0);
  const needed = kinds[round % kinds.length];
  const hit = (kind: typeof kinds[number]) => {
    if (kind !== needed) { setMiss(value => value + 1); return; }
    const next = round + 1;
    onProgress(Math.round(next / totalRounds * 100));
    if (next === totalRounds) window.setTimeout(onComplete, 520);
    else setRound(next);
  };
  return <div className="carving-rain"><div className="rain-copy"><b>工位此刻需要：{needed === "砂" ? "添砂" : needed === "水" ? "润水" : "清屑"}</b><span>接住正确工料 · {round + 1} / {totalRounds}{miss ? ` · 误点 ${miss}` : ""}</span></div><div className="rain-field">{kinds.map((kind, index) => <button key={`${round}-${kind}`} className={`rain-drop ${kind === needed ? "needed" : ""} ${kind === "砂" ? "sand" : kind === "水" ? "water" : "clear"}`} style={{ "--x": `${16 + ((round * 23 + index * 31) % 67)}%`, "--delay": `${index * .18}s`, "--speed": `${Math.max(.9, 2.1 - round * .06)}s` } as React.CSSProperties} aria-label={`${kind === "砂" ? "添砂" : kind === "水" ? "润水" : "清屑"}`} onClick={() => hit(kind)}><i /><span>{kind === "砂" ? "砂" : kind === "水" ? "水" : "清"}</span></button>)}</div></div>;
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
    <div className="feed-pair"><button className={prompt === "water" && !result ? "ready" : ""} aria-label="添水" onClick={() => answer("water")}><img src="assets/tool_water_bowl.webp" alt="" /><span>水钵</span></button><button className={prompt === "sand" && !result ? "ready" : ""} aria-label="添砂" onClick={() => answer("sand")}><img src="assets/tool_sand_basket.webp" alt="" /><span>砂盒</span></button></div>
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

function BasketRelayGame({ onProgress, onComplete }: { onProgress: (value: number) => void; onComplete: () => void }) {
  const stops = [{ x: 25, y: 46 }, { x: 44, y: 47 }, { x: 61, y: 55 }, { x: 76, y: 73 }];
  const [leg, setLeg] = useState(0);
  const [position, setPosition] = useState(stops[0]);
  const [dragging, setDragging] = useState(false);
  const pointer = useRef<number | null>(null);
  const complete = useRef(false);
  const field = useRef<HTMLDivElement | null>(null);
  const positionRef = useRef(stops[0]);
  const point = (event: PointerEvent<HTMLDivElement>) => {
    const rect = field.current?.getBoundingClientRect();
    if (!rect) return positionRef.current;
    return { x: Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100)), y: Math.max(0, Math.min(100, (event.clientY - rect.top) / rect.height * 100)) };
  };
  const moveBasket = (next: { x: number; y: number }) => { positionRef.current = next; setPosition(next); };
  const release = () => {
    if (pointer.current === null) return;
    pointer.current = null;
    setDragging(false);
    const target = stops[leg + 1];
    if (Math.hypot(positionRef.current.x - target.x, positionRef.current.y - target.y) < 26) {
      const next = leg + 1;
      moveBasket(target);
      onProgress(Math.round(next / (stops.length - 1) * 100));
      if (next === stops.length - 1) {
        complete.current = true;
        window.setTimeout(onComplete, 560);
      } else setLeg(next);
    } else moveBasket(stops[leg]);
  };
  return <div ref={field} className={`basket-relay ${dragging ? "dragging" : ""} ${complete.current ? "complete" : ""}`} aria-label="把土筐递到下一名守堤者手中" onPointerMove={event => { if (pointer.current === event.pointerId) moveBasket(point(event)); }} onPointerUp={release} onPointerCancel={release}>
    {stops.slice(1).map((stop, index) => <i key={index} className={`relay-hand ${index === leg ? "next" : index < leg ? "passed" : ""}`} style={{ left: `${stop.x}%`, top: `${stop.y}%` }} />)}
    <button className="relay-basket" aria-label="按住土筐拖到下一双手" style={{ left: `${position.x}%`, top: `${position.y}%` }} onPointerDown={event => { if (complete.current || pointer.current !== null) return; pointer.current = event.pointerId; setDragging(true); event.currentTarget.setPointerCapture(event.pointerId); }}><img src="assets/tool_sand_basket.webp" alt="装满草裹泥的竹筐" /></button>
  </div>;
}

function HomeGame() {
  const [scene, setScene] = useState(0), [beat, setBeat] = useState(0), [selector, setSelector] = useState(false);
  const [action, setAction] = useState(0), [pan, setPan] = useState(0), [marks, setMarks] = useState<number[]>([]), [substep, setSubstep] = useState(0);
  const [dialogueLine, setDialogueLine] = useState(0);
  const [transition, setTransition] = useState<"to-past" | "to-present" | null>(null);
  const [workshopIntro, setWorkshopIntro] = useState<"haul" | "pan" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [strategyFeedback, setStrategyFeedback] = useState("");
  const [effects, setEffects] = useState<Record<string, StrategyEffect>>({});
  const [, setChoice1] = useState<Focus | null>(null), [, setChoice2] = useState<Focus | null>(null);
  const preloadedAssets = useRef(new Set<string>());
  const current = scripts[scene][beat];
  const done = beat >= scripts[scene].length;
  const interactionId = current?.kind === "interaction" ? current.id : "";
  const strategy = useMemo(() => resolveStrategy(effects), [effects]);
  const together = clamp(strategy.ss * .6 + strategy.cooperation * .4);
  const card = useMemo(() => resolveCard(strategy), [strategy]);
  const floodPressure = [0, 12, 24, 38, 46, 56, 70, 90, 48, 0, 0][scene];

  useEffect(() => {
    const viewport = document.querySelector<HTMLElement>(".stage");
    if (!viewport) return;
    const syncScale = () => {
      const availableWidth = viewport.parentElement?.getBoundingClientRect().width ?? window.innerWidth;
      const availableHeight = Math.max(260, window.innerHeight - 86);
      viewport.style.setProperty("--stage-scale", String(Math.min(1, availableWidth / 1500, availableHeight / 820)));
    };
    window.addEventListener("resize", syncScale);
    syncScale();
    return () => window.removeEventListener("resize", syncScale);
  }, []);

  useEffect(() => {
    [scene, scene + 1].forEach(index => {
      scenePreloadAssets[index]?.forEach(source => {
        if (preloadedAssets.current.has(source)) return;
        preloadedAssets.current.add(source);
        const image = new window.Image();
        image.decoding = "async";
        image.src = source;
      });
    });
  }, [scene]);

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

  const choose = (which: 1 | 2) => {
    const question = which === 1 ? "孔即将接通。此刻，你最牵挂什么？" : "玉琮将成、堤坝将合。此刻，你最想记住什么？";
    const focusEffects: Record<Focus, { effect: StrategyEffect; message: string }> = {
      器物: { effect: { aq: 6, memory: 2 }, message: "玉成 +6 · 留痕 +2" },
      众手: { effect: { ss: 3, cooperation: 8, memory: 4 }, message: "众成提升 · 留痕 +4" },
      归人: { effect: { memory: 20 }, message: "留痕 +20" },
    };
    return <section className="focus-choice-panel"><small>你把目光停在哪里 · 没有标准答案</small><h3>{question}</h3><div>{(["器物", "众手", "归人"] as Focus[]).map((value, index) => <button key={value} aria-label={focusCopy[value]} onClick={() => { if (which === 1) setChoice1(value); else setChoice2(value); const selected = focusEffects[value]; applyEffect(`focus-${which}`, selected.effect, selected.message); nextBeat(); }}><i className={`focus-symbol s${index}`} /><span>{focusCopy[value]}</span></button>)}</div></section>;
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
    if (interactionId === "pass-baskets") return `把土筐递到下一双手中 · 已传递 ${Math.round(action / 33)} / 3`;
    if (["trace-motif", "locate-faces", "assist-carving", "compare-cong", "touch-traces"].includes(interactionId)) return `${interactionGuides[interactionId].instruction} · 已完成 ${marks.length}`;
    return undefined;
  };

  const interaction = () => {
    if (interactionId === "approach-exhibit") return <button className="exhibit-cong-hotspot" aria-label="点击展柜中的玉琮，靠近观察" onClick={nextBeat}><Gesture kind="tap" /></button>;
    if (interactionId === "observe-light") return <DragSurface className="cong-rotate-drag" onMotion={dx => { setPan(v => v + dx * 1.8); setAction(v => { const next = Math.min(360, v + Math.abs(dx) * 1.8); if (v < 330 && next >= 330) queueMicrotask(nextBeat); return next; }); }}>{action === 0 && <Gesture kind="swipe" />}</DragSurface>;
    if (interactionId === "trace-motif") return tapSeries(4, "motif-trace-points", "勾勒纹样", ["羽冠", "神人", "兽面", "鸟爪"], () => applyEffect("observe-motif", { memory: 3 }, "留痕 +3 · 你读懂了神徽的层次"));
    if (interactionId === "locate-faces") return tapSeries(6, "face-location-grid", "定位神徽", ["左上", "正上", "右上", "左下", "正下", "右下"], () => applyEffect("observe-faces", { memory: 3 }, "留痕 +3 · 八组神徽不再只是纹样"));
    if (interactionId === "follow-boats" || interactionId === "follow-command") return <DragSurface className="pan-drag" onMotion={dx => setPan(v => { const next = Math.max(0, Math.min(100, v - dx / 5)); if (next > 86) queueMicrotask(nextBeat); return next; })} />;
    if (interactionId === "inspect-jade") {
      if (action < 100) return <ScratchJade progress={action} onProgress={setAction} onComplete={() => setAction(100)} />;
      if (substep < 3) return <div className="jade-inspection-surface crack-points jade-raw-hotspots"><JadeImage variant="raw" className="interactive-jade-raw" /><span className="inspection-bridge">泥水清尽 · 石纹显露</span>{[0, 1, 2].map((index) => <button key={index} className={`vein-choice vein-${index + 1}`} aria-label={`石纹${index + 1}`} onClick={() => { if (index === 0) setFeedback("老玉工：只是颜色不同，不是裂。"); else if (index === 1) setFeedback("老玉工：只在表面。开料以后再看。"); else { setFeedback(""); setSubstep(3); } }}><i /><span>{index + 1}</span></button>)}</div>;
      return <DecisionPanel eyebrow="玉料取舍" title="真裂已经找出，第一刀从哪里避开？" note="两种做法都能成器；差别在于体量余量与工期压力。" options={[
        { title: "沿裂外多留一指", copy: "稳妥避裂，保留后续修整余地。", hint: "玉成稳步提升 · 留下观察记录", onClick: () => { applyEffect("jade-choice", { aq: 5, memory: 4 }, "玉成 +5 · 留痕 +4"); nextBeat(); } },
        { title: "贴近裂边保体量", copy: "尽量留下大料，但后续工序更紧。", hint: "玉成提升更多 · 聚落承压", onClick: () => { applyEffect("jade-choice", { aq: 10, ss: -8 }, "玉成 +10 · 聚落 -8"); nextBeat(); } },
      ]} />;
    }
    if (interactionId === "line-cut") return <LineCutGame onProgress={setAction} onComplete={score => { const aqGain = score >= 80 ? 8 : score >= 50 ? 4 : 0; const cooperation = score >= 80 ? 6 : score >= 50 ? 2 : -3; applyEffect("line-cut", { aq: aqGain, cooperation }, `切割稳定 ${score} · 玉成 ${aqGain ? `+${aqGain}` : "不变"} · 协作 ${cooperation > 0 ? `+${cooperation}` : cooperation}`); window.setTimeout(nextBeat, 420); }} />;
    if (interactionId === "mark-centers") return <CenterMarkingGame onProgress={setAction} onComplete={() => window.setTimeout(nextBeat, 420)} />;
    if (interactionId === "allocate-workforce") return <DecisionPanel eyebrow="人力调度 · 机动十人" title="北堤告急，工坊也不能停。" note="岩因会走船、筑埂，仍会随守堤队出发；这里决定的是其余十人的去向。" options={[
      { title: "留在玉作", copy: "守住熟练工位，尽量不打断工序。", hint: "玉成明显上升 · 聚落承压", onClick: () => { applyEffect("workforce", { aq: 8, ss: -12 }, "玉成 +8 · 聚落 -12"); nextBeat(); } },
      { title: "增援北堤", copy: "抽调可筑埂的人，工坊放慢。", hint: "众成明显上升 · 玉成下降", onClick: () => { applyEffect("workforce", { aq: -6, ss: 16, cooperation: 8 }, "聚落 +16 · 协作 +8 · 玉成 -6"); nextBeat(); } },
      { title: "两边各五人", copy: "工序与堤防都保留最低余量。", hint: "玉成、众成都温和改善", onClick: () => { applyEffect("workforce", { aq: 2, ss: 6, cooperation: 4 }, "玉成 +2 · 聚落 +6 · 协作 +4"); nextBeat(); } },
    ]} />;
    if (interactionId === "steady-drill") { const x = pan === 0 ? -70 : pan, y = action === 0 ? 32 : action; return <DragSurface className="center-calibrate" onMotion={(dx, dy) => { const nextX = Math.max(-80, Math.min(80, x + dx)); const nextY = Math.max(-60, Math.min(60, y + dy)); setPan(nextX); setAction(nextY); if (Math.abs(nextX) < 7 && Math.abs(nextY) < 7) queueMicrotask(() => { applyEffect("drill-center", { aq: 3 }, "孔道校准 · 玉成 +3"); nextBeat(); }); }}><div className="moving-center" style={{ transform: `translate(${x}px,${y}px)` }} /></DragSurface>; }
    if (interactionId === "feed-abrasive") return <AbrasiveRhythmGame onProgress={setAction} onComplete={({ hits, misses, bestCombo }) => { const aqGain = hits >= 18 ? 8 : hits >= 13 ? 5 : 2; const cooperation = bestCombo >= 8 ? 6 : bestCombo >= 4 ? 3 : 0; applyEffect("feed-abrasive", { aq: aqGain, cooperation }, `水砂准确 ${hits} · 失误 ${misses} · 玉成 +${aqGain}${cooperation ? ` · 协作 +${cooperation}` : ""}`); nextBeat(); }} />;
    if (interactionId === "place-cong") return <PlaceCongGame onComplete={() => { applyEffect("place-cong", { memory: 4 }, "玉琮王安放完成 · 留痕 +4"); nextBeat(); }} />;
    if (interactionId === "flip-blank" || interactionId === "tie-knot") return <DragSurface className={`${interactionId}-drag`} onMotion={dx => addMotion(dx / 5)}>{interactionId !== "tie-knot" && <div className="object-motion jade-object-motion" style={{ transform: `translateX(${Math.min(100, action)}px) rotate(${interactionId === "flip-blank" ? action * 1.8 : 0}deg)` }}><JadeImage variant="drilled" /></div>}{interactionId === "tie-knot" && <><img className={`short-rope-art left${action > 70 ? " tightened" : ""}`} src="assets/short_rope.webp" alt="左侧短麻绳" draggable={false} style={{ transform: `translateX(${Math.min(34, action * .34)}px)` }} /><img className={`short-rope-art right${action > 70 ? " tightened" : ""}`} src="assets/short_rope.webp" alt="右侧短麻绳" draggable={false} style={{ transform: `translateX(${-Math.min(34, action * .34)}px) scaleX(-1)` }} /></>}{interactionId !== "tie-knot" && action === 0 && <Gesture />}</DragSurface>;
    if (interactionId === "join-bore") return <CircularDrillGame progress={action} onProgress={setAction} onComplete={() => { applyEffect("join-bore", { aq: 4 }, "双端接钻完成 · 玉成 +4"); nextBeat(); }} />;
    if (interactionId === "focus-one") return choose(1);
    if (interactionId === "feel-ridge") return <RidgeSearchGame onProgress={setAction} onComplete={() => { applyEffect("feel-ridge", { aq: 3 }, "接钻台痕已找出 · 玉成 +3"); nextBeat(); }} />;
    if (interactionId === "grind-sequence") return <MotifCarvingGame onProgress={setAction} onComplete={() => { applyEffect("grind", { aq: 4 }, "神人兽面纹刻成 · 玉成 +4"); nextBeat(); }} />;
    if (interactionId === "align-motif") return <MotifCenterStrokeGame onProgress={setAction} onComplete={() => { applyEffect("motif-align", { aq: 3 }, "神徽中轴对齐 · 玉成 +3"); nextBeat(); }} />;
    if (interactionId === "assist-carving") return <CarvingRainGame onProgress={setAction} onComplete={() => { applyEffect("assist-carving", { aq: 4 }, "一段纹线刻稳 · 玉成 +4"); nextBeat(); }} />;
    if (interactionId === "inspect-crack") return <CrackLightGame onProgress={setAction} onComplete={() => { applyEffect("inspect-crack", { aq: 3 }, "裂纹走向已看清 · 玉成 +3"); nextBeat(); }} />;
    if (interactionId === "resource-dispatch") {
      const cargo = [
        { title: "粮食", copy: "先稳住聚落与守堤者的口粮。", hint: `余 ${5 - marks.filter(item => item === 0).length} 批`, effect: { ss: 4 } },
        { title: "木桩", copy: "先送往堤坝缺口。", hint: `余 ${5 - marks.filter(item => item === 1).length} 批`, effect: { ss: 6, cooperation: 3 } },
        { title: "细砂", copy: "小舟送回工坊续作。", hint: `余 ${3 - marks.filter(item => item === 2).length} 批`, effect: { aq: 5 } },
      ];
      return <DecisionPanel eyebrow={`先发船 ${marks.length + 1} / 3`} title="这一艘先装什么？" note="这里只安排三艘先发船；其余物资随后仍会运输，历史不会因一次选择中断。" options={cargo.map((item, index) => ({ ...item, onClick: () => { const next = [...marks, index]; setMarks(next); if (next.length === 3) { const total = next.reduce<StrategyEffect>((sum, cargoIndex) => ({ aq: (sum.aq ?? 0) + (cargo[cargoIndex].effect.aq ?? 0), ss: (sum.ss ?? 0) + (cargo[cargoIndex].effect.ss ?? 0), cooperation: (sum.cooperation ?? 0) + (cargo[cargoIndex].effect.cooperation ?? 0) }), {}); applyEffect("dispatch", total, `三艘先发船已离岸 · 玉成 ${total.aq ? `+${total.aq}` : "不变"} · 聚落 ${total.ss ? `+${total.ss}` : "不变"}`); window.setTimeout(nextBeat, 650); } } }))} />;
    }
    if (interactionId === "polish-cong") return <DragSurface className="polish-drag" onMotion={(dx, dy) => addMotion((Math.abs(dx) + Math.abs(dy)) / 18, 100, () => applyEffect("polish", { aq: 4 }, "最后抛光 · 玉成 +4"))}><div className="polish-sheen" style={{ opacity: action / 100 }} /></DragSurface>;
    if (interactionId === "pass-baskets") return <BasketRelayGame onProgress={setAction} onComplete={() => { applyEffect("dam-baskets", { ss: 10, cooperation: 6 }, "聚落 +10 · 协作 +6"); nextBeat(); }} />;
    if (interactionId === "focus-two") return choose(2);
    if (interactionId === "scan-boats") return tapSeries(3, "return-boat-check", "查看归舟", ["", "", ""]);
    if (interactionId === "compare-cong") return <TombCongComparison seen={marks} onSelect={index => { if (marks.includes(index)) return; const next = [...marks, index]; setMarks(next); setFeedback(`${tombCongPieces[index].name}的位置与形制已记下`); if (next.length === tombCongPieces.length) { applyEffect("compare-cong", { memory: 6 }, "留痕 +6 · 你看见了六件器物之间的差异"); window.setTimeout(nextBeat, 760); } }} />;
    // Use the same silhouette-bound cover as the second act: soil exists only
    // on the jade itself, so every scratched part of the object reveals clean
    // jade instead of exposing an unrelated rectangular backdrop.
    if (interactionId === "brush-soil") return <ScratchJade progress={action} onProgress={setAction} onComplete={() => window.setTimeout(nextBeat, 320)} variant="final" className="excavation-scratch" />;
    if (interactionId === "touch-traces") { const echoes = ["钻孔工：中间谁也看不见，只能从两头一点点靠近。", "纹饰工：一件工具，做不完整张神徽。", "老玉工：眼一偏，整张神像都会散。", "岩：水退了就回来。"]; const labels = ["孔壁", "羽冠细线", "圆眼", "器身磨痕"]; return <div className="memory-points visual">{echoes.map((echo, index) => <button key={echo} aria-label={`触摸${labels[index]}`} className={marks.includes(index) ? "seen" : ""} onClick={() => { if (marks.includes(index)) return; const next = [...marks, index]; setMarks(next); setFeedback(echo); if (next.length === 4) { applyEffect("touch-traces", { memory: 14 }, "留痕 +14 · 编号重新连回人的声音"); window.setTimeout(nextBeat, 1700); } }}><i /><span>{labels[index]}</span></button>)}</div>; }
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
        <img className="motif-base" src="assets/jade_motif_outline.webp" alt="" />
        {[0, 1, 2, 3].map(index => <img key={index} className={`motif-light motif-light-${index + 1} ${marks.includes(index) ? "lit" : ""}`} src="assets/jade_motif_outline.webp" alt="" />)}
      </div>
      <div className="motif-legend"><span className={marks.includes(0) ? "lit" : ""}>羽冠</span><span className={marks.includes(1) ? "lit" : ""}>神人</span><span className={marks.includes(2) ? "lit" : ""}>兽面</span><span className={marks.includes(3) ? "lit" : ""}>鸟爪</span></div>
      {interactionId !== "locate-faces" && play}
    </div>;
    if (scene === 1) return <div className={`scroll-world world art-world ${workshopIntro ? `arrival-${workshopIntro}` : "arrival-complete"} ${interactionId ? `interaction-${interactionId}` : ""}`}><div className="workshop-pan" /><div className="flood-atmosphere" /><div className="rain-lines" />{workshopIntro === "haul" && <div className="jade-arrival-sequence" role="img" aria-label="远景中，众人将玉料从舟船搬运到工坊码头">{Array.from({ length: 5 }).map((_, index) => <img key={index} className={`arrival-frame fixed-frame frame-${index + 1}`} src={`assets/arrival_new_${String(index + 1).padStart(2, "0")}.webp`} alt="" />)}<div className="arrival-film-caption"><span>舟船靠岸</span><i /><span>合力移玉</span></div></div>}{play}</div>;
    if (scene === 2) return <div className={`workshop-world world art-world ${interactionId ? `interaction-${interactionId}` : ""}`}><div className="workshop-close" />{interactionId !== "mark-centers" && <img className="workers-cut-art scene-three-cut" src="assets/workers_cut.webp" alt="左右玉工在玉料两侧往复拉绳切割" />}<div className="rain-lines" />{play}</div>;
    if (scene === 3) {
      const showDriller = ["steady-drill", "feed-abrasive", "join-bore"].includes(interactionId);
      const playOnDrillHandle = interactionId === "steady-drill" || interactionId === "join-bore";
      const showLi = interactionId === "focus-one" || done;
      return <div className={`drilling-world world art-world ${interactionId ? `interaction-${interactionId}` : ""}`}><div className="workshop-close drilling-close" />{showDriller && <div className="driller-station"><img className="process-figure driller" src="assets/role_driller.webp" alt="钻孔工操作管钻" />{playOnDrillHandle && play}</div>}{showLi && <img className="li-work-art li-world-figure" src="assets/li_work_complete.webp" alt="砺在工坊岸边看守玉料" />}<div className="drill-machine"><div className="tube" /><JadeImage variant="drilled" className="drill-jade-art" /></div>{!playOnDrillHandle && play}</div>;
    }
    if (scene === 4) return <div className={`grind-world world art-world ${interactionId ? `interaction-${interactionId}` : ""}`}><div className="workshop-close grind-close" />{play}</div>;
    if (scene === 5) return <div className={`carve-world world art-world ${interactionId ? `interaction-${interactionId}` : ""}`}><div className="workshop-close carve-close" /><div className="daylight" />{play}</div>;
    if (scene === 6) return <div className={`logistics-world world art-world ${interactionId ? `interaction-${interactionId}` : ""}`}><div className="logistics-background" style={{ transform: `translateX(${interactionId === "follow-boats" ? -pan * 1.7 : 0}px) scale(1.14)` }} /><div className="scene-cinematic-shade" /><div className="flood-atmosphere strong" /><div className="route-label dam-route">大船 · 去堤坝</div><div className="route-label workshop-route">小舟 · 回工坊</div><div className="polish-mini" style={{ filter: interactionId === "polish-cong" ? `brightness(${.7 + action / 170})` : undefined }}><JadeImage variant="carving" /></div>{play}</div>;
    if (scene === 7) { const damOpacity = beat >= 8 || interactionId === "pass-baskets" ? 1 : interactionId === "follow-command" ? pan / 100 : 0; return <div className={`ceremony-world world art-world ${interactionId ? `interaction-${interactionId}` : ""}`}><div className="ceremony-background" /><div className="dam-background" style={{ opacity: damOpacity }} /><div className="scene-cinematic-shade" /><img className="dam-workers-art" src="assets/group_dam_workers.webp" alt="" style={{ opacity: damOpacity }} />{play}</div>; }
    if (scene === 8) return <div className={`return-world world art-world ${interactionId ? `interaction-${interactionId}` : ""}`}><div className="return-background" /><div className="scene-cinematic-shade" />{play}</div>;
    if (scene === 9) return <div className={`tomb-world world art-world ${interactionId ? `interaction-${interactionId}` : ""}`}><div className="tomb-comparison-ground" /><div className="scene-cinematic-shade" />{play}</div>;
    const foundVisible = beat >= 1;
    return <div className={`excavate-world world art-world ${interactionId ? `interaction-${interactionId}` : ""}`}><div className="excavation-background" /><div className="scene-cinematic-shade" />{foundVisible && <div className="found-cong"><JadeImage variant="final" /></div>}<div className="record-tag"><span>反山 M12</span><b>M12:98</b><small>高约 8.8—8.9 cm · 重约 6.5 kg</small></div>{play}{done && <div className={`collection-card ${card.tone}`}><div className="card-art"><JadeImage variant="final" /><div className="card-knot" /></div><div className="card-copy"><small>M12:98 · 良渚文化玉琮王</small><h3>《{card.name}》</h3><p>{card.copy}</p><div className="result-values"><span>玉成度 <b>{strategy.aq}</b></span><span>众成度 <b>{together}</b></span><span>留痕度 <b>{strategy.memory}</b></span></div><div><span>神人兽面纹</span><span>双端管钻</span><span>反山 M12</span></div></div></div>}</div>;
  };

  const visibleLine = !workshopIntro && current?.kind === "dialogue" ? current.lines[dialogueLine] : null;
  return <main className="app-shell"><header className="topbar"><div><p className="eyebrow">良渚玉琮王 · 横屏交互预览</p><h1>众手成琮</h1></div><div className="top-actions"><button onClick={() => goScene(scene)}>重置本幕</button><button className="primary" onClick={() => setSelector(true)}>选幕预览 · {String(scene + 1).padStart(2, "0")}</button></div></header><section className={`stage ${strategy.ss < 60 ? "stability-low" : ""}`}><div className={`scene-slate ${beat === 0 ? "visible" : ""}`}><span>{scenes[scene].act} · {scenes[scene].place}</span><h2>{scenes[scene].title}</h2></div>{world()}{scene > 0 && !transition && <StrategyHUD values={strategy} flood={floodPressure} />}{current?.kind === "interaction" && <InteractionGuide id={interactionId} detail={guideDetail()} scene={scene} />}{visibleLine && <StoryLine key={`${scene}-${beat}-${dialogueLine}`} line={visibleLine} opening={scene === 0} scene={scene} onNext={nextDialogueLine} />}{feedback && <div className="interaction-feedback">{feedback}</div>}{strategyFeedback && <div className="strategy-feedback">{strategyFeedback}</div>}{done && scene < 10 && <button className="scene-complete" onClick={advanceScene} aria-label="进入下一幕"><i /></button>}{transition && <div className={`time-transition ${transition}`} aria-live="polite"><div className="transition-object"><JadeImage variant="final" /></div><div className="transition-copy"><small>{transition === "to-past" ? "纹饰沉入阴影" : "土层合拢，时间继续"}</small><strong>{transition === "to-past" ? "五千年前 · 水边玉作工坊" : "1986 · 反山 M12"}</strong></div><div className="transition-rings" /></div>}<div className="beat-dots" aria-hidden="true">{scripts[scene].map((_, index) => <i key={index} className={index < beat ? "past" : index === beat ? "now" : ""} />)}</div><div className="stage-nav"><button disabled={scene === 0} onClick={() => goScene(scene - 1)}>←</button><button onClick={() => setSelector(true)}>{scene + 1} / {scenes.length}</button><button disabled={scene === 10} onClick={() => goScene(scene + 1)}>→</button></div></section>{selector && <div className="selector-backdrop" role="button" tabIndex={0} onClick={event => { if (event.target === event.currentTarget) setSelector(false); }} onKeyDown={event => { if (event.key === "Escape" || event.key === "Enter") setSelector(false); }}><section className="selector"><header><div><span>DIRECTOR&apos;S PREVIEW</span><h2>选择一幕直接体验</h2><p>数值会随本次体验继续保留；点击“新开一局”可清空全部策略记录。</p></div><div className="selector-actions"><button onClick={() => { setEffects({}); setChoice1(null); setChoice2(null); goScene(0); }}>新开一局</button><button onClick={() => setSelector(false)}>关闭</button></div></header><div className="scene-grid">{scenes.map((item, index) => <button key={item.title} className={scene === index ? "active" : ""} onClick={() => goScene(index)}><i>{String(index + 1).padStart(2, "0")}</i><span>{item.act}</span><h3>{item.title}</h3><p>{item.place} · {scripts[index].filter(beat => beat.kind === "interaction").length}项互动</p></button>)}</div></section></div>}</main>;
}

export default function Home() {
  return <><HomeGame /><LandscapeGate /></>;
}
