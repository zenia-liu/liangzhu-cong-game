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
  "pan-workshop": { title: "巡视玉作工坊", instruction: "向左拖动画卷，跟随玉料穿过各工位", outcome: "抵达开料区" },
  "inspect-jade": { title: "为玉料避裂", instruction: "先擦去泥水，再从三道石纹里找出真裂", outcome: "决定开料时要避让的位置" },
  "line-cut": { title: "保持切割绳往复", instruction: "交替点按左、右玉工，不能让一侧连拉", outcome: "让砂随绳磨开玉料" },
  "mark-centers": { title: "给端面找中心", instruction: "依次点亮四角，交叉样线会汇到中点", outcome: "为两端管钻留下同一中心" },
  "steady-drill": { title: "把管钻扶正", instruction: "拖动偏离的圆环，套准中央靶心", outcome: "第一端可以开始下钻" },
  "feed-abrasive": { title: "续上水与砂", instruction: "先点水钵，再点砂盒", outcome: "管钻重新带砂磨玉" },
  "flip-blank": { title: "翻转玉坯", instruction: "按住玉坯向右拖，翻到另一端", outcome: "从另一端重新找中心" },
  "join-bore": { title: "推进第二端管钻", instruction: "沿圆环持续转动，让两端钻孔逐渐接近", outcome: "停在接通前，重新校准中心" },
  "focus-one": { title: "留下第一处记忆", instruction: "选择此刻最牵动你的事", outcome: "选择只改变最终收藏卡，不改变剧情" },
  "feel-ridge": { title: "摸出接钻台痕", instruction: "沿孔壁左右摩擦，找到凸起并磨低", outcome: "让两端接钻处变平" },
  "grind-sequence": { title: "从粗到细修孔", instruction: "依次选择粗砺石、中砺石、细砺石", outcome: "磨平孔壁，又不扩大偏差" },
  "align-motif": { title: "给神徽定中轴", instruction: "左右拖动纹样，让中轴与器面对齐", outcome: "眼、鼻与羽冠获得共同基准" },
  "assist-carving": { title: "跟上纹饰工的节奏", instruction: "亮点出现时依次添砂、润水、清屑", outcome: "细线继续刻进玉面" },
  "inspect-crack": { title: "沿裂隙检查走向", instruction: "顺着亮起的裂纹滑动", outcome: "决定让神徽中轴稍作避让" },
  "load-cargo": { title: "把堤上物资送上大船", instruction: "按亮起顺序交接粮、绳、木桩与草裹泥", outcome: "大船先去堤坝，小舟把细料送回工坊" },
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

const focusCopy: Record<Focus, string> = {
  器物: "这件大琮能不能顺利做成",
  众手: "工坊与堤坝上的人能不能接住彼此",
  归人: "岩能不能随退水的船回来",
};

function cardKey(a: Focus, b: Focus) { if (a === b) return `${a}+${b}`; const order: Focus[] = ["器物", "众手", "归人"]; return [a, b].sort((x, y) => order.indexOf(x) - order.indexOf(y)).join("+"); }
function JadeCong({ small = false, rotation }: { small?: boolean; rotation?: number }) { return <div className={`jade-cong ${small ? "small" : ""}`} style={rotation === undefined ? undefined : { transform: `perspective(900px) rotateX(5deg) rotateY(${rotation}deg)` }}><div className="jade-bore" /><div className="jade-groove left" /><div className="jade-groove right" /><div className="face-mark top"><i /><i /><b /><em /></div><div className="face-mark bottom"><i /><i /><b /><em /></div></div>; }
type JadeVariant = "final" | "raw" | "drilled" | "carving";
const jadeArt: Record<JadeVariant, string> = {
  final: "assets/jade_cong_final.png",
  raw: "assets/jade_raw.png",
  drilled: "assets/jade_drilled.png",
  carving: "assets/jade_carving.png",
};
function JadeImage({ variant, className = "", rotation }: { variant: JadeVariant; className?: string; rotation?: number }) {
  const tilt = rotation === undefined ? 0 : Math.sin(rotation * Math.PI / 90) * 18;
  return <img className={`jade-art jade-${variant} ${className}`} src={jadeArt[variant]} alt="" style={rotation === undefined ? undefined : { transform: `perspective(900px) rotateX(3deg) rotateY(${tilt}deg)`, filter: `brightness(${.82 + Math.abs(Math.cos(rotation * Math.PI / 180)) * .28})` }} />;
}
function People({ count = 5 }: { count?: number }) { return <div className="people">{Array.from({ length: count }).map((_, i) => <i key={i} />)}</div>; }
function Gesture({ kind = "drag" }: { kind?: "drag" | "tap" | "circle" | "swipe" }) { return <div className={`gesture ${kind}`} aria-hidden="true"><i /><span /></div>; }

function InteractionGuide({ id, detail }: { id: string; detail?: string }) {
  const guide = interactionGuides[id];
  if (!guide || id === "focus-one" || id === "focus-two") return null;
  return <aside className="interaction-guide" aria-live="polite"><small>当前操作</small><strong>{guide.title}</strong><p>{detail ?? guide.instruction}</p><span>完成后 · {guide.outcome}</span></aside>;
}

type PortraitMeta = { src?: string; side: "left" | "right"; role: string };

function portraitFor(speaker: string, scene: number): PortraitMeta {
  if (speaker === "砺") return { src: scene === 8 ? "assets/li_sad.png" : scene >= 3 && scene <= 5 ? "assets/li_work_v2.png" : "assets/li_stand.png", side: "right", role: "li" };
  if (speaker === "年长的砺") return { src: "assets/li_sad.png", side: "right", role: "li elder" };
  if (speaker === "岩") return { src: scene >= 2 ? "assets/yan_depart_v2.png" : "assets/yan_stand.png", side: "left", role: "yan" };
  if (speaker === "老玉工") return { src: "assets/master_portrait_v2.png", side: "left", role: "master" };
  if (/考古|记录员/.test(speaker)) return { side: "left", role: "modern" };
  if (/仪式|最高等级|各处代表|墓葬管事/.test(speaker)) return { side: "left", role: "ritual" };
  if (/守堤|传令者/.test(speaker)) return { side: "left", role: "flood" };
  if (/年轻助手/.test(speaker)) return { side: "right", role: "assistant" };
  if (/工坊管事/.test(speaker)) return { side: "left", role: "steward" };
  return { side: speaker === "送料人" ? "right" : "left", role: "artisan" };
}

function StoryLine({ line, opening, scene, onNext }: { line: Line; opening?: boolean; scene: number; onNext: () => void }) {
  const content = <><div className="line-row"><span>{line.speaker}</span><p>{line.text}</p></div><i className="next-mark" /></>;
  if (opening) return <button className="story-line opening" onClick={onNext}>{content}</button>;
  const portrait = portraitFor(line.speaker, scene);
  return <div className={`vn-dialogue side-${portrait.side}`}><div className={`vn-portrait ${portrait.role}`} aria-hidden="true">{portrait.src ? <img src={portrait.src} alt="" /> : <div className="role-standee"><i className="role-head" /><i className="role-body" /><i className="role-prop" /></div>}<span>{line.speaker}</span></div><button className="story-line vn-box" onClick={onNext} aria-label={`${line.speaker}：${line.text} 点击继续`}>{content}<small>点击继续</small></button></div>;
}

function DragSurface({ children, className = "", onMotion }: { children: ReactNode; className?: string; onMotion: (dx: number, dy: number) => void }) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const down = (e: PointerEvent<HTMLDivElement>) => { start.current = { x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId); };
  const move = (e: PointerEvent<HTMLDivElement>) => { if (!start.current) return; onMotion(e.clientX - start.current.x, e.clientY - start.current.y); start.current = { x: e.clientX, y: e.clientY }; };
  const up = () => { start.current = null; };
  return <div className={`drag-surface ${className}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>{children}</div>;
}

export default function Home() {
  const [scene, setScene] = useState(0), [beat, setBeat] = useState(0), [selector, setSelector] = useState(false);
  const [action, setAction] = useState(0), [pan, setPan] = useState(0), [marks, setMarks] = useState<number[]>([]), [substep, setSubstep] = useState(0);
  const [dialogueLine, setDialogueLine] = useState(0);
  const [transition, setTransition] = useState<"to-past" | "to-present" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [choice1, setChoice1] = useState<Focus | null>(null), [choice2, setChoice2] = useState<Focus | null>(null);
  const current = scripts[scene][beat];
  const done = beat >= scripts[scene].length;
  const interactionId = current?.kind === "interaction" ? current.id : "";
  const card = useMemo(() => cards[cardKey(choice1 ?? "众手", choice2 ?? "归人")], [choice1, choice2]);

  const resetBeatState = () => { setAction(0); setPan(0); setMarks([]); setSubstep(0); setFeedback(""); setDialogueLine(0); };
  const nextBeat = () => { resetBeatState(); setBeat(v => v + 1); };
  const goScene = (index: number) => { setScene(index); setBeat(0); setSelector(false); setTransition(null); resetBeatState(); };
  const nextDialogueLine = () => {
    if (current?.kind === "dialogue" && dialogueLine < current.lines.length - 1) setDialogueLine(value => value + 1);
    else nextBeat();
  };
  const advanceScene = () => {
    if (scene === 0) setTransition("to-past");
    else if (scene === 9) setTransition("to-present");
    else goScene(scene + 1);
  };
  const addMotion = (amount: number, target = 100) => setAction(v => { const next = Math.min(target, v + Math.abs(amount)); if (v < target && next >= target) queueMicrotask(nextBeat); return next; });

  useEffect(() => {
    if (!transition) return;
    const target = transition === "to-past" ? 1 : 10;
    const timer = window.setTimeout(() => goScene(target), 2800);
    return () => window.clearTimeout(timer);
    // The transition owns this one scene change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transition]);

  const choose = (which: 1 | 2) => {
    const question = which === 1 ? "孔即将接通。此刻，你最牵挂什么？" : "玉琮将成、堤坝将合。此刻，你最想记住什么？";
    return <section className="focus-choice-panel"><small>你的选择 · 没有标准答案</small><h3>{question}</h3><div>{(["器物", "众手", "归人"] as Focus[]).map((value, index) => <button key={value} aria-label={focusCopy[value]} onClick={() => { which === 1 ? setChoice1(value) : setChoice2(value); nextBeat(); }}><i className={`focus-symbol s${index}`} /><span>{focusCopy[value]}</span></button>)}</div></section>;
  };
  const tapSeries = (count: number, className: string, label: string, labels?: string[]) => <div className={className}>{Array.from({ length: count }).map((_, index) => <button key={index} aria-label={`${label}${index + 1}`} className={marks.includes(index) ? "seen" : marks.length === index ? "active" : ""} onClick={() => { if (marks.includes(index) || marks.length !== index) return; const next = [...marks, index]; setMarks(next); if (next.length === count) queueMicrotask(nextBeat); }}><i /><span>{labels?.[index] ?? index + 1}</span></button>)}{marks.length === 0 && <Gesture kind="tap" />}</div>;

  const guideDetail = () => {
    if (interactionId === "approach-exhibit") return "先在展柜中找到玉琮，再点击靠近";
    if (interactionId === "observe-light") return `左右拖动器身 · 已观察 ${Math.min(100, Math.round(action / 3.3))}%`;
    if (interactionId === "inspect-jade") return action < 45 ? `来回擦拭原石 · 泥水已清除 ${Math.round(action / 45 * 100)}%` : "泥水已清除 · 点按三道亮起的石纹，找出真裂";
    if (interactionId === "line-cut") return `交替点按左右玉工 · 切缝 ${Math.round(action)}%`;
    if (interactionId === "feed-abrasive") return substep === 0 ? "先点左侧水钵，让砂保持湿润" : "水已添 · 再点右侧砂盒补充磨料";
    if (interactionId === "grind-sequence") return `按粗、中、细顺序换砺石 · 当前第 ${Math.min(3, substep + 1)} 步`;
    if (interactionId === "load-cargo") return `按亮起顺序装船 · 已交接 ${marks.length} / 4`;
    if (interactionId === "scan-boats") return `依次检查靠岸归舟 · 已检查 ${marks.length} / 3`;
    if (["trace-motif", "locate-faces", "mark-centers", "assist-carving", "pass-baskets", "compare-cong", "touch-traces"].includes(interactionId)) return `${interactionGuides[interactionId].instruction} · 已完成 ${marks.length}`;
    return undefined;
  };

  const interaction = () => {
    if (interactionId === "approach-exhibit") return <button className="exhibit-cong-hotspot" aria-label="点击展柜中的玉琮，靠近观察" onClick={nextBeat}><Gesture kind="tap" /></button>;
    if (interactionId === "observe-light") return <DragSurface className="cong-rotate-drag" onMotion={dx => { setPan(v => v + dx * 1.8); setAction(v => { const next = Math.min(360, v + Math.abs(dx) * 1.8); if (v < 330 && next >= 330) queueMicrotask(nextBeat); return next; }); }}>{action === 0 && <Gesture kind="swipe" />}</DragSurface>;
    if (interactionId === "trace-motif") return tapSeries(4, "motif-trace-points", "勾勒纹样", ["羽冠", "神人", "兽面", "鸟爪"]);
    if (interactionId === "locate-faces") return tapSeries(6, "face-location-grid", "定位神徽", ["左上", "正上", "右上", "左下", "正下", "右下"]);
    if (interactionId === "pan-workshop" || interactionId === "follow-boats" || interactionId === "follow-command") return <DragSurface className="pan-drag" onMotion={dx => setPan(v => { const next = Math.max(0, Math.min(100, v - dx / 5)); if (next > 86) queueMicrotask(nextBeat); return next; })}>{pan === 0 && <Gesture kind="swipe" />}</DragSurface>;
    if (interactionId === "inspect-jade") return action < 45 ? <DragSurface className="jade-clean" onMotion={(dx, dy) => setAction(v => Math.min(45, v + (Math.abs(dx) + Math.abs(dy)) / 16))}><JadeImage variant="raw" className="interactive-jade-raw" /><div className="mud-film" style={{ opacity: 1 - action / 50 }} />{action === 0 && <Gesture kind="swipe" />}</DragSurface> : <div className="crack-points jade-raw-hotspots"><JadeImage variant="raw" className="interactive-jade-raw" />{[0, 1, 2].map((index) => <button key={index} aria-label={`石纹${index + 1}`} onClick={() => { if (index === 0) setFeedback("老玉工：只是颜色不同，不是裂。"); else if (index === 1) setFeedback("老玉工：只在表面。开料以后再看。"); else { setFeedback("老玉工：这道要避。开料时多留一点。"); window.setTimeout(nextBeat, 1200); } }}><i /><span>{index + 1}</span></button>)}</div>;
    if (interactionId === "line-cut") return <div className="dual-cut"><button className={substep % 2 === 0 ? "ready" : ""} aria-label="左侧玉工拉绳" onClick={() => { if (substep % 2 !== 0) return; const next = action + 10; setAction(next); setSubstep(v => v + 1); if (next >= 100) nextBeat(); }}><span>左工</span></button><button className={substep % 2 === 1 ? "ready" : ""} aria-label="右侧玉工拉绳" onClick={() => { if (substep % 2 !== 1) return; const next = action + 10; setAction(next); setSubstep(v => v + 1); if (next >= 100) nextBeat(); }}><span>右工</span></button><div className="cut-seam" style={{ width: `${action * .62}%` }} />{action === 0 && <Gesture kind="tap" />}</div>;
    if (interactionId === "mark-centers") return tapSeries(4, "sample-corners", "连接端面点");
    if (interactionId === "steady-drill") { const x = pan === 0 ? -70 : pan, y = action === 0 ? 32 : action; return <DragSurface className="center-calibrate" onMotion={(dx, dy) => { const nextX = Math.max(-80, Math.min(80, x + dx)); const nextY = Math.max(-60, Math.min(60, y + dy)); setPan(nextX); setAction(nextY); if (Math.abs(nextX) < 7 && Math.abs(nextY) < 7) queueMicrotask(nextBeat); }}><div className="moving-center" style={{ transform: `translate(${x}px,${y}px)` }} />{pan === 0 && action === 0 && <Gesture />}</DragSurface>; }
    if (interactionId === "feed-abrasive") return <div className="feed-pair"><button className={substep === 0 ? "ready" : "done"} aria-label="从水钵添水" onClick={() => substep === 0 && setSubstep(1)}><i className="water-surface" /><span>水钵</span></button><button className={substep === 1 ? "ready" : ""} aria-label="从砂盒添砂" onClick={() => substep === 1 && nextBeat()}><i className="sand-grain" /><span>砂盒</span></button>{substep === 0 && <Gesture kind="tap" />}</div>;
    if (interactionId === "flip-blank" || interactionId === "tie-knot" || interactionId === "place-cong") return <DragSurface className={`${interactionId}-drag`} onMotion={dx => addMotion(dx / 5)}>{interactionId !== "tie-knot" && <div className="object-motion jade-object-motion" style={{ transform: `translateX(${Math.min(100, action)}px) rotate(${interactionId === "flip-blank" ? action * 1.8 : 0}deg)` }}><JadeImage variant={interactionId === "flip-blank" ? "drilled" : "final"} /></div>}{interactionId === "tie-knot" && <><i className="rope-a" style={{ transform: `translateX(${Math.min(62, action * .62)}px) rotate(8deg)` }} /><i className="rope-b" style={{ transform: `translateX(${-Math.min(62, action * .62)}px) rotate(-8deg)` }} /><b className={action > 70 ? "knot-formed" : ""}>绳结</b></>}{interactionId === "place-cong" && <div className="placement-target"><span>头部近旁</span></div>}{action === 0 && <Gesture />}</DragSurface>;
    if (interactionId === "join-bore") return <DragSurface className="drill-drag" onMotion={(dx, dy) => addMotion((Math.abs(dx) + Math.abs(dy)) / 14)}><div className="drill-ring" style={{ transform: `rotate(${action * 7}deg)` }} /><div className="bore-progress" style={{ height: `${action}%` }} />{action === 0 && <Gesture kind="circle" />}</DragSurface>;
    if (interactionId === "focus-one") return choose(1);
    if (interactionId === "feel-ridge") return <DragSurface className="feel-ridge-drag" onMotion={(dx, dy) => addMotion((Math.abs(dx) + Math.abs(dy)) / 16)}><div className="ridge-pulse" style={{ opacity: 1 - action / 110, transform: `scaleY(${1 - action / 160})` }} />{action === 0 && <Gesture kind="swipe" />}</DragSurface>;
    if (interactionId === "grind-sequence") return <div className="grind-tools">{["粗砺石", "中砺石", "细砺石"].map((name, index) => <button key={name} className={substep === index ? "ready" : substep > index ? "done" : ""} aria-label={name} onClick={() => { if (substep !== index) { setFeedback(index > substep ? "修形工：粗痕还在。" : "这块已经用过了。"); return; } setFeedback(""); if (index === 2) nextBeat(); else setSubstep(index + 1); }}><i /><span>{name}</span></button>)}{substep === 0 && <Gesture kind="tap" />}</div>;
    if (interactionId === "align-motif") return <DragSurface className="motif-drag" onMotion={dx => setPan(v => { const next = Math.max(-80, Math.min(80, (v || -70) + dx)); if (Math.abs(next) < 5) queueMicrotask(nextBeat); return next; })}><div className="motif-centerline" /><div className="floating-motif" style={{ transform: `translateX(${pan || -70}px)` }}><i /><i /><b /></div>{pan === 0 && <Gesture />}</DragSurface>;
    if (interactionId === "assist-carving") return tapSeries(3, "carving-rhythm", "纹饰工抬手后操作", ["砂", "水", "清"]);
    if (interactionId === "inspect-crack") return <DragSurface className="crack-trace-drag" onMotion={(dx, dy) => addMotion((Math.abs(dx) + Math.abs(dy)) / 12)}><div className="crack-line" /><div className="trace-fill" style={{ width: `${action}%` }} />{action === 0 && <Gesture kind="swipe" />}</DragSurface>;
    if (interactionId === "load-cargo") return tapSeries(4, "cargo-play", "交接物资", ["粮袋", "绳捆", "木桩", "草裹泥"]);
    if (interactionId === "polish-cong") return <DragSurface className="polish-drag" onMotion={(dx, dy) => addMotion((Math.abs(dx) + Math.abs(dy)) / 18)}><div className="polish-sheen" style={{ opacity: action / 100 }} />{action === 0 && <Gesture kind="swipe" />}</DragSurface>;
    if (interactionId === "pass-baskets") return tapSeries(3, "basket-chain", "传递土筐", ["接", "传", "压"]);
    if (interactionId === "focus-two") return choose(2);
    if (interactionId === "scan-boats") return tapSeries(3, "boat-check", "查看归舟", ["一号舟", "二号舟", "三号舟"]);
    if (interactionId === "compare-cong") return tapSeries(4, "cong-taps", "比较玉琮", ["大琮", "矮琮", "素面", "简纹"]);
    if (interactionId === "brush-soil") return <DragSurface className="brush-drag" onMotion={(dx, dy) => addMotion((Math.abs(dx) + Math.abs(dy)) / 14)}><div className="soil-mask" style={{ opacity: 1 - action / 100 }} /><div className="brush-reveal" style={{ opacity: action / 100 }} />{action === 0 && <Gesture kind="swipe" />}</DragSurface>;
    if (interactionId === "touch-traces") { const echoes = ["钻孔工：中间谁也看不见，只能从两头一点点靠近。", "纹饰工：一件工具，做不完整张神徽。", "老玉工：眼一偏，整张神像都会散。", "岩：水退了就回来。"]; const labels = ["孔壁", "羽冠细线", "圆眼", "器身磨痕"]; return <div className="memory-points visual">{echoes.map((echo, index) => <button key={echo} aria-label={`触摸${labels[index]}`} className={marks.includes(index) ? "seen" : ""} onClick={() => { if (marks.includes(index)) return; const next = [...marks, index]; setMarks(next); setFeedback(echo); if (next.length === 4) window.setTimeout(nextBeat, 1700); }}><i /><span>{labels[index]}</span></button>)}</div>; }
    return null;
  };

  const world = () => {
    const play = current?.kind === "interaction" ? interaction() : null;
    if (scene === 0) return <div className={`museum-world world art-world ${beat === 0 ? "exhibit-overview" : "artifact-closeup"} ${interactionId ? `interaction-${interactionId}` : ""}`}><div className="museum-vignette" /><div className="display-case"><i className="case-glass" /><i className="case-plinth" /></div><div className={`hero-cong artifact-hero ${beat > 1 || action > 45 ? "revealed" : ""}`}><JadeImage variant="final" rotation={interactionId === "observe-light" ? pan : undefined} /></div><div className="exhibit-caption"><b>玉琮王</b><span>良渚文化 · 反山M12</span></div><img className="motif-study" src="assets/jade_motif_outline.png" alt="神人兽面纹结构线稿" /><div className="motif-legend"><span>羽冠</span><span>神人</span><span>兽面</span><span>鸟爪</span></div>{play}</div>;
    if (scene === 1) return <div className={`scroll-world world art-world ${interactionId ? `interaction-${interactionId}` : ""}`}><div className="workshop-pan" style={{ transform: `translateX(${-pan * 1.02}%)` }} /><img className="art-character li-look" src="assets/li_stand.png" alt="" /><img className="art-character yan-watch" src="assets/yan_stand.png" alt="" /><div className="flood-atmosphere" /><div className="rain-lines" />{play}</div>;
    if (scene === 2) return <div className={`workshop-world world art-world ${interactionId ? `interaction-${interactionId}` : ""}`}><div className="workshop-close" /><img className="workers-cut-art" src="assets/workers_cut.png" alt="" />{beat >= 5 && <img className="brothers-art" src="assets/brothers_v2.png" alt="" />}<div className="rain-lines" />{play}</div>;
    if (scene === 3) return <div className={`drilling-world world art-world ${interactionId ? `interaction-${interactionId}` : ""}`}><div className="workshop-close drilling-close" /><img className="sand-workers-art" src="assets/workers_sand_water_v2.png" alt="" /><img className="li-work-art" src="assets/li_work_v2.png" alt="" /><div className="drill-machine"><div className="tube" /><JadeImage variant="drilled" className="drill-jade-art" /></div>{play}</div>;
    if (scene === 4) return <div className="grind-world world art-world"><div className="workshop-close grind-close" /><img className="master-work-art" src="assets/master_work_v2.png" alt="" /><JadeImage variant="drilled" className="grind-jade-art" /><div className="section-cong"><div className="inner-ridge" style={{ opacity: interactionId === "grind-sequence" ? 1 - substep / 3 : 1 }} /></div><div className="hand-probe" />{play}</div>;
    if (scene === 5) return <div className={`carve-world world art-world ${interactionId ? `interaction-${interactionId}` : ""}`}><div className="workshop-close carve-close" /><div className="daylight" /><img className="master-stand-art" src="assets/master_stand_v2.png" alt="" /><div className={`carve-cong carved-${marks.length}`}><JadeImage variant="carving" /></div><div className="carver-hand" />{play}</div>;
    if (scene === 6) return <div className={`logistics-world world art-world ${interactionId ? `interaction-${interactionId}` : ""}`}><div className="workshop-close logistics-close" /><div className="flood-atmosphere strong" /><img className="carry-workers-art" src="assets/workers_carry_v2.png" alt="" /><div className="split-water"><div className="boat-route dam-route">去堤坝</div><div className="boat-route workshop-route">回工坊</div><div className={`big-boat loaded-${marks.length}`} style={{ transform: `translateX(${interactionId === "follow-boats" ? pan * 3.7 : 0}px)` }}><i className="cargo-stack" /><span>粮 · 绳 · 木桩</span></div><div className="small-boat" style={{ transform: `translateX(${interactionId === "follow-boats" ? pan * 2.1 : 0}px)` }}><span>细砂 · 工具</span></div></div><div className="dam-mini"><People count={6} /></div><div className="polish-mini" style={{ filter: interactionId === "polish-cong" ? `brightness(${.7 + action / 170})` : undefined }}><JadeImage variant="final" /></div>{play}</div>;
    if (scene === 7) { const damOpacity = beat >= 8 ? 1 : interactionId === "follow-command" ? pan / 100 : 0; return <div className="ceremony-world world art-world"><div className="ceremony-background" /><div className="dam-background" style={{ opacity: damOpacity }} /><div className="scene-cinematic-shade" /><div className="flood-atmosphere strong" /><div className="ceremony"><JadeImage variant="final" /><People count={8} /></div><div className="command-line"><span className="on" /><i /><span className={pan > 25 ? "on" : ""} /><i /><span className={pan > 55 ? "on" : ""} /><i /><span className={pan > 82 ? "on" : ""} /></div><div className="dam-full"><People count={9} /><div className="water-rise" /></div>{play}</div>; }
    if (scene === 8) return <div className="return-world world art-world"><div className="return-background" /><div className="scene-cinematic-shade" /><img className="li-sad-art" src="assets/li_sad.png" alt="" /><div className="empty-bank"><div className="captain-figure" /></div>{play}</div>;
    if (scene === 9) return <div className="tomb-world world art-world"><div className="tomb-background" /><div className="scene-cinematic-shade" /><div className="grave"><div className="burial" /></div>{play}</div>;
    return <div className="excavate-world world art-world"><div className="excavation-background" /><div className="scene-cinematic-shade" /><div className="found-cong"><JadeImage variant="final" /></div><div className="record-tag"><span>反山 M12</span><b>M12:98</b><small>高约 8.8—8.9 cm · 重约 6.5 kg</small></div>{play}{done && <div className={`collection-card ${card.tone}`}><div className="card-art"><JadeImage variant="final" /><div className="card-knot" /></div><div className="card-copy"><small>M12:98 · 良渚文化玉琮王</small><h3>《{card.name}》</h3><p>{card.copy}</p><div><span>神人兽面纹</span><span>双端管钻</span><span>反山 M12</span></div></div></div>}</div>;
  };

  const visibleLine = current?.kind === "dialogue" ? current.lines[dialogueLine] : null;
  return <main className="app-shell"><header className="topbar"><div><p className="eyebrow">良渚玉琮王 · 横屏交互预览</p><h1>众手成琮</h1></div><div className="top-actions"><button onClick={() => goScene(scene)}>重置本幕</button><button className="primary" onClick={() => setSelector(true)}>选幕预览 · {String(scene + 1).padStart(2, "0")}</button></div></header><section className="stage"><div className={`scene-slate ${beat === 0 ? "visible" : ""}`}><span>{scenes[scene].act} · {scenes[scene].place}</span><h2>{scenes[scene].title}</h2></div>{world()}{current?.kind === "interaction" && <InteractionGuide id={interactionId} detail={guideDetail()} />}{visibleLine && <StoryLine key={`${scene}-${beat}-${dialogueLine}`} line={visibleLine} opening={scene === 0} scene={scene} onNext={nextDialogueLine} />}{feedback && <div className="interaction-feedback">{feedback}</div>}{done && scene < 10 && <button className="scene-complete" onClick={advanceScene} aria-label="进入下一幕"><i /></button>}{transition && <div className={`time-transition ${transition}`} aria-live="polite"><div className="transition-object"><JadeImage variant="final" /></div><div className="transition-copy"><small>{transition === "to-past" ? "纹饰沉入阴影" : "土层合拢，时间继续"}</small><strong>{transition === "to-past" ? "五千年前 · 水边玉作工坊" : "1986 · 反山 M12"}</strong></div><div className="transition-rings" /></div>}<div className="beat-dots" aria-hidden="true">{scripts[scene].map((_, index) => <i key={index} className={index < beat ? "past" : index === beat ? "now" : ""} />)}</div><div className="stage-nav"><button disabled={scene === 0} onClick={() => goScene(scene - 1)}>←</button><button onClick={() => setSelector(true)}>{scene + 1} / {scenes.length}</button><button disabled={scene === 10} onClick={() => goScene(scene + 1)}>→</button></div></section>{selector && <div className="selector-backdrop" onClick={() => setSelector(false)}><section className="selector" onClick={event => event.stopPropagation()}><header><div><span>DIRECTOR&apos;S PREVIEW</span><h2>选择一幕直接体验</h2><p>每一幕从本幕时间轴起点开始；圆点显示对白与操作节拍。</p></div><button onClick={() => setSelector(false)}>关闭</button></header><div className="scene-grid">{scenes.map((item, index) => <button key={item.title} className={scene === index ? "active" : ""} onClick={() => goScene(index)}><i>{String(index + 1).padStart(2, "0")}</i><span>{item.act}</span><h3>{item.title}</h3><p>{item.place} · {scripts[index].filter(beat => beat.kind === "interaction").length}项互动</p></button>)}</div></section></div>}</main>;
}
