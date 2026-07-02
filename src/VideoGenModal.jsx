import React, { useState, useEffect, useRef } from 'react';
import {
  X, Upload, ChevronRight, ArrowLeft, ArrowUp, Loader2, Check, RefreshCw,
  Lock, SkipForward, Sparkles, ImagePlus, Play, Plus, Trash2,
  ToggleLeft, ToggleRight, CheckCircle2, RotateCcw, Coins, Dices,
  Clapperboard, Film,
} from 'lucide-react';

const STEPS = [
  { key: 'input', label: '输入' },
  { key: 'confirm', label: '确认' },
  { key: 'result', label: '生成与结果' },
];

/* ── 模式判定（与 PRD 6.2 的规则一致，写死规则、零成本） ── */
function detectMode(text, hasImg) {
  const t = (text || '').trim();
  if (/[「」“”"]/.test(t) || /说|口播|台词|介绍/.test(t))
    return { mode: 'script', reason: '描述里有台词信号（引号 / “说”）' };
  if (/然后|接着|第二个镜头|先.+再/.test(t))
    return { mode: 'script', reason: '描述提到多个镜头' };
  if (hasImg && t.length <= 30)
    return { mode: 'motion', reason: '传了图 + 描述短 + 无台词' };
  if (!hasImg)
    return { mode: 'script', reason: '没传图片，走镜头卡（台词栏可留空）' };
  return { mode: 'script', reason: '描述较长，拆成镜头卡更稳' };
}

/* ── 图片动效：动法与描述模板 ── */
const MOTION_GROUPS = [
  { label: '镜头运动', opts: ['推近', '拉远', '环绕'] },
  { label: '主体动作', opts: ['摆姿势', '转身', '走动', '挥手'] },
  { label: '氛围微动', opts: ['风吹', '光影流动'] },
];

function motionDesc(opt, subject) {
  const s = subject || '画面主体';
  const map = {
    '推近': `镜头缓慢推近${s}，主体逐渐占满画面，背景保持不变`,
    '拉远': `镜头缓慢拉远，${s}保持在画面中央，逐渐露出完整背景`,
    '环绕': `镜头围绕${s}缓慢环绕半圈，主体清晰，背景自然移动`,
    '摆姿势': `${s}原地换两三个自然姿势（坐正、歪头、抬头看镜头），镜头固定，背景保持不变`,
    '转身': `${s}原地自然转身面向镜头，动作流畅，镜头固定`,
    '走动': `${s}向镜头方向自然走近两步，背景保持不变`,
    '挥手': `${s}抬起手臂向镜头挥手，表情自然，镜头固定`,
    '风吹': `微风吹动${s}的毛发和背景植物，整体轻微律动，镜头固定`,
    '光影流动': `光影在${s}和背景上缓慢流动，画面其余保持静止`,
  };
  return map[opt] || '';
}

/* ── 示例数据 ── */
const SAMPLE_A = { text: '让这只柴犬动起来，摆几个姿势', imgKind: 'dog' };
const SAMPLE_B = {
  text: '一位28岁印尼女子在ATM机前对着镜头说：「Kata APP ini bisa hasilin uang beneran」，然后展示手机到账画面',
  imgKind: null,
};

function sampleBCards() {
  return [
    {
      id: 1,
      alts: ['Kata APP ini bisa hasilin uang beneran!', 'Aplikasi ini beneran bisa hasilin uang!', 'Denger-denger APP ini bisa dapetin uang asli!'],
      altsZh: ['听说这个APP真能赚到钱！', '这个APP真的能赚钱！', '听说这APP能拿到真钱！'],
      altIdx: 0,
      line: 'Kata APP ini bisa hasilin uang beneran!',
      zh: '听说这个APP真能赚到钱！',
      scene: '28岁印尼女子在ATM机前，手持手机面向镜头',
      action: '女子举起手机贴近镜头，手持自然微晃',
      shotType: '近景 · 手持', mood: '兴奋', dur: 4,
    },
    {
      id: 2,
      alts: ['Beneran masuk ke DANA!', 'Uangnya beneran masuk!', 'Cair! Langsung masuk DANA!'],
      altsZh: ['真的到账DANA了！', '钱真的到了！', '到账了！直接进DANA！'],
      altIdx: 0,
      line: 'Beneran masuk ke DANA!',
      zh: '真的到账DANA了！',
      scene: '手机屏幕特写，DANA余额从Rp200.000涨到Rp1.500.000',
      action: '画外手指点击提现按钮，余额数字滚动上涨',
      shotType: '特写 · 固定', mood: '惊讶', dur: 3,
    },
  ];
}

function cardsFromText(text) {
  const m = (text || '').match(/[「“"]([^」”"]+)[」”"]/);
  const scene = (text || '').replace(/[「“"][^」”"]*[」”"]/g, '').replace(/说：?/g, '').trim();
  return [{
    id: 1,
    alts: m ? [m[1]] : [], altsZh: [], altIdx: 0,
    line: m ? m[1] : '',
    zh: m ? '（中文对照将自动生成）' : '',
    scene: scene ? scene.slice(0, 50) : '按描述自动生成画面',
    action: '人物自然动作，镜头固定',
    shotType: '近景 · 固定', mood: '平静', dur: 4,
  }];
}

/* ── 参考图候选（占位：色相 + 构图标签模拟每一批的差异） ── */
const COMP_LABELS = ['主体居中', '左三分构图', '右三分构图', '景别更近', '俯拍视角', '光线偏暖', '背景更虚化', '平视视角'];
function makeCandidates(round, cardIdx) {
  const baseH = (cardIdx * 70 + round * 37) % 360;
  return [0, 1, 2, 3].map(i => ({
    h: (baseH + i * 25) % 360,
    label: COMP_LABELS[(round * 3 + i * 2 + cardIdx) % COMP_LABELS.length],
  }));
}
function tileEmoji(card, imgKind) {
  if (imgKind === 'dog') return '🐕';
  const s = card?.scene || '';
  if (/ATM/i.test(s)) return '🏧';
  if (/手机|屏幕|余额/.test(s)) return '📱';
  return '🎬';
}

const SHOT_TYPES = ['特写 · 固定', '特写 · 手持', '近景 · 固定', '近景 · 手持', '中景 · 固定', '中景 · 手持', '全景 · 固定'];
const MOODS = ['平静', '兴奋', '惊讶', '恳切', '搞笑'];
const REASONS = [
  { key: 'mismatch', label: '画面和想要的不一样', hint: '意图没传达到 → 说明确认物还不够' },
  { key: 'broken', label: '质量崩了（脸 / 手 / 字 / 台词）', hint: '模型翻车 → 归因给质检评估' },
  { key: 'picking', label: '只是多生成几条挑一挑', hint: '抽卡型 → 应该发生在参考图层' },
  { key: 'other', label: '其他', hint: '' },
];

export function VideoGenModal({ onClose }) {
  const [step, setStep] = useState(0);

  /* 额度 */
  const [quota, setQuota] = useState(12);
  const [quotaFlash, setQuotaFlash] = useState(0);
  const spendQuota = () => { setQuota(q => q - 1); setQuotaFlash(f => f + 1); };

  /* 输入 */
  const [text, setText] = useState('');
  const [imgKind, setImgKind] = useState(null);   // null | 'dog' | 'user'
  const [imgUrl, setImgUrl] = useState(null);
  const fileRef = useRef();
  const hasImg = !!imgKind;
  const auto = detectMode(text, hasImg);
  const [manualMode, setManualMode] = useState(null);
  const mode = manualMode || auto.mode;

  /* 图片动效 */
  const subject = imgKind === 'dog' ? '柴犬' : '画面主体';
  const [motionOpt, setMotionOpt] = useState(null);
  const [motionText, setMotionText] = useState('');
  const [duration, setDuration] = useState('5s');

  /* 镜头脚本 */
  const [cards, setCards] = useState([]);
  const [builtFrom, setBuiltFrom] = useState(null);
  const [skipConfirm, setSkipConfirm] = useState(false);
  const [refStage, setRefStage] = useState(false);
  const [refs, setRefs] = useState({});

  /* 生成与结果 */
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [versions, setVersions] = useState([]);
  const [activeV, setActiveV] = useState(0);
  const [status, setStatus] = useState('fresh');   // fresh | adopted | discarded
  const [refilled, setRefilled] = useState(false);
  const [reasonFor, setReasonFor] = useState(null); // null | 'regen' | 'discard'
  const [lastReason, setLastReason] = useState(null);

  useEffect(() => {
    if (!reasonFor) return;
    const onKey = (e) => { if (e.key === 'Escape') resolveReason(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const applySample = (s) => {
    setText(s.text);
    setImgKind(s.imgKind);
    setImgUrl(null);
    setManualMode(null);
    setMotionOpt(null); setMotionText('');
    setCards([]); setBuiltFrom(null); setRefStage(false); setRefs({});
  };

  const handleUpload = (f) => {
    if (!f) return;
    setImgKind('user');
    setImgUrl(URL.createObjectURL(f));
  };

  const enterConfirm = () => {
    if (mode === 'script' && builtFrom !== text) {
      setCards(text === SAMPLE_B.text ? sampleBCards() : cardsFromText(text));
      setBuiltFrom(text);
      setRefStage(false);
      setRefs({});
    }
    if (mode === 'motion' && imgKind === 'dog' && !motionOpt) {
      setMotionOpt('摆姿势');
      setMotionText(motionDesc('摆姿势', subject));
    }
    setStep(1);
  };

  /* ── 镜头卡编辑 ── */
  const patchCard = (id, patch) =>
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));

  const cycleLine = (c) => {
    if (!c.alts.length) return;
    const next = (c.altIdx + 1) % c.alts.length;
    patchCard(c.id, {
      altIdx: next, line: c.alts[next],
      zh: c.altsZh[next] || c.zh,
      dur: Math.max(2, Math.round(c.alts[next].length / 8)),
    });
  };

  const addCard = () => {
    const id = Math.max(0, ...cards.map(c => c.id)) + 1;
    setCards([...cards, {
      id, alts: [], altsZh: [], altIdx: 0, line: '', zh: '',
      scene: '', action: '', shotType: '近景 · 固定', mood: '平静', dur: 3,
    }]);
  };

  const removeCard = (id) => {
    setCards(prev => prev.filter(c => c.id !== id));
    setRefs(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  /* ── 参考图抽卡 ── */
  const startRefs = () => {
    setRefStage(true);
    const init = {};
    cards.forEach((c, i) => { init[c.id] = { round: 1, cands: [], locked: null, skipped: false, loading: true }; });
    setRefs(init);
    setTimeout(() => {
      setRefs(prev => {
        const n = { ...prev };
        cards.forEach((c, i) => { n[c.id] = { ...n[c.id], cands: makeCandidates(1, i), loading: false }; });
        return n;
      });
    }, 700);
  };

  const rerollRefs = (cardId, cardIdx) => {
    setRefs(prev => ({ ...prev, [cardId]: { ...prev[cardId], loading: true, locked: null } }));
    setTimeout(() => {
      setRefs(prev => {
        const r = prev[cardId];
        return { ...prev, [cardId]: { ...r, round: r.round + 1, cands: makeCandidates(r.round + 1, cardIdx), loading: false } };
      });
    }, 600);
  };

  const lockRef = (cardId, idx) =>
    setRefs(prev => ({ ...prev, [cardId]: { ...prev[cardId], locked: idx, skipped: false } }));
  const skipRef = (cardId) =>
    setRefs(prev => ({ ...prev, [cardId]: { ...prev[cardId], skipped: true, locked: null } }));

  const allRefsResolved = cards.length > 0 &&
    cards.every(c => refs[c.id] && (refs[c.id].locked !== null || refs[c.id].skipped));

  /* ── 生成 ── */
  const generate = () => {
    if (quota <= 0) return;
    spendQuota();
    setGenerating(true);
    setGenProgress(0);
    const stages = [{ p: 20, d: 500 }, { p: 45, d: 700 }, { p: 70, d: 700 }, { p: 92, d: 600 }, { p: 100, d: 400 }];
    let t = 0;
    stages.forEach(({ p, d }) => { t += d; setTimeout(() => setGenProgress(p), t); });
    setTimeout(() => {
      const v = {
        v: versions.length + 1,
        mode,
        shots: mode === 'script' ? cards.length : 1,
        dur: mode === 'script' ? cards.reduce((s, c) => s + (Number(c.dur) || 3), 0) : parseInt(duration),
        refCount: mode === 'script' ? cards.filter(c => refs[c.id]?.locked !== null && refs[c.id] && !refs[c.id].skipped).length : 0,
      };
      setVersions(prev => [...prev, v]);
      setActiveV(versions.length);
      setStatus('fresh');
      setRefilled(false);
      setGenerating(false);
      setStep(2);
    }, t + 400);
  };

  /* ── 弃用原因 ── */
  const resolveReason = (reasonKey) => {
    const action = reasonFor;
    setReasonFor(null);
    if (reasonKey) setLastReason(REASONS.find(r => r.key === reasonKey)?.label);
    if (action === 'regen') { setRefilled(true); setStep(1); }
    if (action === 'discard') setStatus('discarded');
  };

  const totalSpent = versions.length;
  const cur = versions[activeV];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-top-bar">
          <span className="modal-title">视频生成</span>
          <div className="vg-topbar-right">
            <span className="vg-quota" key={quotaFlash} title="视频生成扣 1 条；脚本、台词、参考图怎么抽都不扣">
              <Coins size={13} />
              本周剩余额度 <b className="vg-quota-num">{quota}</b>
              <span className="vg-quota-rule">视频扣 1 · 图文免费</span>
            </span>
            <button className="icon-btn" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        {step > 0 && <StepIndicator steps={STEPS} current={step} />}

        <div className="modal-body">
          {generating ? (
            <div className="step-content analyze-overlay">
              <div className="analyze-box">
                <Loader2 size={28} className="spinner" />
                <h3>正在生成视频...</h3>
                <div className="progress-bar-wrap">
                  <div className="progress-bar" style={{ width: `${genProgress}%` }} />
                </div>
                <p className="analyze-stage">
                  {genProgress < 25 ? '组装提示词与参考图...' :
                   genProgress < 55 ? '逐镜头生成画面...' :
                   genProgress < 95 ? '渲染与拼接...' : '完成'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {step === 0 && (
                <StepInput
                  text={text} setText={t => { setText(t); setManualMode(null); }}
                  imgKind={imgKind} imgUrl={imgUrl}
                  onUploadClick={() => fileRef.current?.click()}
                  onRemoveImg={() => { setImgKind(null); setImgUrl(null); }}
                  fileRef={fileRef} handleUpload={handleUpload}
                  auto={auto} mode={mode} setManualMode={setManualMode}
                  applySample={applySample}
                  onNext={enterConfirm}
                />
              )}
              {step === 1 && mode === 'motion' && (
                <StepMotion
                  imgKind={imgKind} imgUrl={imgUrl} subject={subject}
                  motionOpt={motionOpt}
                  onPick={(opt) => { setMotionOpt(opt); setMotionText(motionDesc(opt, subject)); }}
                  motionText={motionText} setMotionText={setMotionText}
                  duration={duration} setDuration={setDuration}
                  refilled={refilled}
                  onBack={() => setStep(0)}
                  onGenerate={generate}
                  quota={quota}
                />
              )}
              {step === 1 && mode === 'script' && (
                <StepScript
                  cards={cards} patchCard={patchCard} cycleLine={cycleLine}
                  addCard={addCard} removeCard={removeCard}
                  skipConfirm={skipConfirm} setSkipConfirm={setSkipConfirm}
                  refStage={refStage} refs={refs} imgKind={imgKind}
                  startRefs={startRefs} rerollRefs={rerollRefs}
                  lockRef={lockRef} skipRef={skipRef}
                  allRefsResolved={allRefsResolved}
                  refilled={refilled}
                  onBack={() => setStep(0)}
                  onGenerate={generate}
                  quota={quota}
                />
              )}
              {step === 2 && cur && (
                <StepResult
                  versions={versions} activeV={activeV} setActiveV={setActiveV}
                  status={status} totalSpent={totalSpent} lastReason={lastReason}
                  imgKind={imgKind} cards={cards}
                  onAdopt={() => setStatus('adopted')}
                  onRegen={() => setReasonFor('regen')}
                  onDiscard={() => setReasonFor('discard')}
                  onClose={onClose}
                />
              )}
            </>
          )}
        </div>

        {reasonFor && (
          <div className="modal-overlay vg-reason-overlay" onClick={() => resolveReason(null)}>
            <div className="vg-reason-box" onClick={e => e.stopPropagation()}>
              <h4>这条为什么不行？</h4>
              <p className="vg-reason-sub">3 秒归因，帮工具搞清楚钱浪费在哪（Esc 跳过）</p>
              {REASONS.map(r => (
                <button key={r.key} className="vg-reason-opt" onClick={() => resolveReason(r.key)}>
                  <span>{r.label}</span>
                  {r.hint && <span className="vg-reason-hint">{r.hint}</span>}
                </button>
              ))}
              <button className="btn-ghost btn-sm vg-reason-skip" onClick={() => resolveReason(null)}>
                <SkipForward size={13} /> 跳过
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepIndicator({ steps, current }) {
  return (
    <div className="step-indicator">
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          <div className={`step-dot ${i < current ? 'done' : ''} ${i === current ? 'active' : ''}`}>
            {i < current ? <Check size={12} /> : <span>{i + 1}</span>}
          </div>
          <span className={`step-label ${i === current ? 'active' : ''}`}>{s.label}</span>
          {i < steps.length - 1 && <div className={`step-line ${i < current ? 'done' : ''}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ══ Step 0 输入（对话式大输入框入口） ══ */
function StepInput({
  text, setText, imgKind, imgUrl, onUploadClick, onRemoveImg, fileRef, handleUpload,
  auto, mode, setManualMode, applySample, onNext,
}) {
  const hasContent = text.trim().length > 0 || imgKind;
  const switched = hasContent && mode !== auto.mode;
  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && hasContent) { e.preventDefault(); onNext(); }
  };
  return (
    <div className="step-content vg-hero">
      <p className="vg-hero-greet">Hey，今天出什么素材？</p>
      <h2 className="vg-hero-title">想生成什么视频？</h2>

      <div className="vg-hero-box">
        <textarea rows={3} className="vg-hero-textarea" value={text} onKeyDown={onKey}
          placeholder={'一句话描述，或直接丢一张图进来\n例：让这只柴犬动起来，摆几个姿势'}
          onChange={e => setText(e.target.value)} />
        <div className="vg-hero-bar">
          <input ref={fileRef} type="file" accept="image/*" hidden
            onChange={e => handleUpload(e.target.files[0])} />
          {!imgKind ? (
            <button className="vg-attach-chip" onClick={onUploadClick}>
              <ImagePlus size={13} /> 传图
            </button>
          ) : (
            <span className="vg-attach-chip vg-attach-chip--filled">
              {imgKind === 'dog'
                ? <>🐕 柴犬素材图</>
                : <><img src={imgUrl} alt="" className="vg-attach-thumb" /> 已传图片</>}
              <button className="vg-attach-x" onClick={onRemoveImg}><X size={11} /></button>
            </span>
          )}
          {hasContent && (
            <span className="vg-hero-modes">
              <button className={`vg-mode-pill ${mode === 'motion' ? 'active' : ''}`}
                onClick={() => setManualMode('motion')}>
                <Film size={11} /> 图片动效
              </button>
              <button className={`vg-mode-pill ${mode === 'script' ? 'active' : ''}`}
                onClick={() => setManualMode('script')}>
                <Clapperboard size={11} /> 镜头脚本
              </button>
            </span>
          )}
          <button className="vg-send" disabled={!hasContent} onClick={onNext} title="进入确认（Enter）">
            <ArrowUp size={16} />
          </button>
        </div>
      </div>

      <p className="vg-reason-line vg-hero-reason">
        {hasContent
          ? <>系统判定：{auto.reason} → <b>{auto.mode === 'motion' ? '图片动效' : '镜头脚本'}</b>
              {switched && <>（已手动切换为 <b>{mode === 'motion' ? '图片动效' : '镜头脚本'}</b>，切换已记录）</>}</>
          : ' '}
      </p>

      <div className="vg-hero-chips">
        <span className="vg-examples-label">试试</span>
        <button className="vg-example-chip" onClick={() => applySample(SAMPLE_A)}>
          🐕 让图动起来 · 柴犬摆姿势
        </button>
        <button className="vg-example-chip" onClick={() => applySample(SAMPLE_B)}>
          🏧 带台词口播 · 印尼ATM
        </button>
      </div>
    </div>
  );
}

/* ══ Step 1a 图片动效 ══ */
function StepMotion({
  imgKind, imgUrl, subject, motionOpt, onPick, motionText, setMotionText,
  duration, setDuration, refilled, onBack, onGenerate, quota,
}) {
  return (
    <div className="step-content">
      {refilled && (
        <div className="vg-banner">
          <RotateCcw size={14} /> 已回填上一版的全部参数——只改出问题的地方，再生成
        </div>
      )}
      <div className="vg-motion-layout">
        <div className="vg-motion-left">
          <div className="vg-upload-tile vg-upload-tile--filled vg-upload-tile--lg">
            {imgKind === 'dog'
              ? <span className="vg-img-emoji">🐕</span>
              : imgUrl ? <img src={imgUrl} alt="" className="vg-img-real" />
              : <span className="vg-img-emoji">🖼</span>}
            <span className="vg-img-tag">{imgKind === 'dog' ? '柴犬素材图' : '你的图片'}</span>
          </div>
          <p className="vg-hint">你传的图就是画面本身，不再出脚本、不再出参考图</p>
        </div>

        <div className="vg-motion-right">
          {MOTION_GROUPS.map(g => (
            <div key={g.label}>
              <div className="vg-chip-group-label">{g.label}</div>
              <div className="vg-chip-row">
                {g.opts.map(o => (
                  <button key={o}
                    className={`vg-chip ${motionOpt === o ? 'active' : ''}`}
                    onClick={() => onPick(o)}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="form-field vg-motion-desc">
            <label>动作描述（选动法后自动填好，可改可不改）</label>
            <textarea rows={2} value={motionText}
              placeholder="先在上面选一个动法"
              onChange={e => setMotionText(e.target.value)} />
          </div>

          <div className="vg-chip-group-label">时长</div>
          <div className="vg-chip-row">
            {['5s', '10s'].map(d => (
              <button key={d} className={`vg-chip ${duration === d ? 'active' : ''}`}
                onClick={() => setDuration(d)}>{d}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="step-actions">
        <button className="btn-ghost" onClick={onBack}><ArrowLeft size={16} /> 上一步</button>
        <button className="btn-primary" disabled={!motionText.trim() || quota <= 0} onClick={onGenerate}>
          <Sparkles size={15} /> 生成视频 · 扣 1 条
        </button>
      </div>
    </div>
  );
}

/* ══ Step 1b 镜头脚本 ══ */
function StepScript({
  cards, patchCard, cycleLine, addCard, removeCard,
  skipConfirm, setSkipConfirm, refStage, refs, imgKind,
  startRefs, rerollRefs, lockRef, skipRef, allRefsResolved,
  refilled, onBack, onGenerate, quota,
}) {
  return (
    <div className="step-content">
      {refilled && (
        <div className="vg-banner">
          <RotateCcw size={14} /> 已回填上一版的镜头卡和参考图——只改出问题的那一层，再生成
        </div>
      )}

      <div className="vg-script-head">
        <div>
          <h3 className="asset-heading">镜头卡（{cards.length} 个镜头）</h3>
          <p className="asset-desc">台词逐字锁死传给模型；画面先用参考图便宜地定下来，再生成视频</p>
        </div>
        <button className="toggle-btn" onClick={() => setSkipConfirm(!skipConfirm)}
          title="跳过行为会被记录，用来验证确认环节值不值">
          {skipConfirm ? <ToggleRight size={18} className="toggle-on" /> : <ToggleLeft size={18} className="toggle-off" />}
          跳过确认直接生成
        </button>
      </div>

      <div className="vg-card-list">
        {cards.map((c, idx) => {
          const r = refs[c.id];
          return (
            <div key={c.id} className="vg-card">
              <div className="vg-card-head">
                <span className="vg-card-num">镜头 {idx + 1}</span>
                <span className="vg-card-dur">~{c.dur}s（按台词字数估）</span>
                <div className="vg-card-head-right">
                  <div className="form-field vg-field-inline">
                    <select value={c.shotType} onChange={e => patchCard(c.id, { shotType: e.target.value })}>
                      {SHOT_TYPES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-field vg-field-inline">
                    <select value={c.mood} onChange={e => patchCard(c.id, { mood: e.target.value })}>
                      {MOODS.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  {cards.length > 1 && (
                    <button className="icon-btn-sm" onClick={() => removeCard(c.id)} title="删除镜头">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              <div className="form-field">
                <label>台词逐字稿（锁死后模型不得改词）<span className="vg-lock-tag"><Lock size={9} /> 逐字锁定</span></label>
                <div className="vg-line-row">
                  <input value={c.line} placeholder="没有台词可留空"
                    onChange={e => patchCard(c.id, { line: e.target.value })} />
                  {c.alts.length > 1 && (
                    <button className="btn-outline btn-sm" onClick={() => cycleLine(c)}>
                      <Dices size={13} /> 换一版 <FreeTag />
                    </button>
                  )}
                </div>
                {c.zh && <span className="vg-zh">中文对照：{c.zh}</span>}
              </div>

              <div className="form-row-2">
                <div className="form-field">
                  <label>画面内容（谁 + 在哪 + 做什么）</label>
                  <input value={c.scene} onChange={e => patchCard(c.id, { scene: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>动作与运镜（图管不住“动”，写在这里）</label>
                  <input value={c.action} onChange={e => patchCard(c.id, { action: e.target.value })} />
                </div>
              </div>

              {refStage && r && (
                <div className="vg-ref-block">
                  <div className="vg-ref-bar">
                    <span className="vg-ref-title">首帧参考图 · 点一张锁定</span>
                    <span className="vg-ref-round">第 {r.round} 批</span>
                    <button className="btn-outline btn-sm" onClick={() => rerollRefs(c.id, idx)} disabled={r.loading}>
                      <RefreshCw size={13} /> 换一批 <FreeTag />
                    </button>
                    <button className="btn-ghost btn-sm" onClick={() => skipRef(c.id)} disabled={r.skipped}>
                      <SkipForward size={13} /> {r.skipped ? '已跳过' : '跳过参考图'}
                    </button>
                  </div>
                  {r.loading ? (
                    <div className="vg-ref-loading"><Loader2 size={18} className="spinner" /> 出图中（约 10 秒 / 批，免费）...</div>
                  ) : r.skipped ? (
                    <p className="vg-hint">该镜头不用参考图，生成时靠文字描述</p>
                  ) : (
                    <div className="vg-ref-grid">
                      {r.cands.map((cand, i) => (
                        <button key={i}
                          className={`vg-ref-tile ${r.locked === i ? 'locked' : ''} ${r.locked !== null && r.locked !== i ? 'dimmed' : ''}`}
                          style={{ background: `linear-gradient(150deg, hsl(${cand.h} 42% 20%), hsl(${(cand.h + 40) % 360} 48% 32%))` }}
                          onClick={() => lockRef(c.id, i)}>
                          <span className="vg-ref-emoji">{tileEmoji(c, imgKind)}</span>
                          <span className="vg-ref-label">候选 {i + 1} · {cand.label}</span>
                          {r.locked === i && <span className="vg-ref-locked"><Lock size={11} /> 已锁定</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button className="btn-ghost btn-sm vg-add-card" onClick={addCard}>
        <Plus size={14} /> 添加镜头
      </button>

      <div className="step-actions">
        <button className="btn-ghost" onClick={onBack}><ArrowLeft size={16} /> 上一步</button>
        <div className="vg-actions-right">
          {!refStage && !skipConfirm && (
            <button className="btn-outline" onClick={startRefs}>
              <ImagePlus size={15} /> 出参考图 <FreeTag />
            </button>
          )}
          {(refStage || skipConfirm) && (
            <button className="btn-primary"
              disabled={quota <= 0 || (!skipConfirm && !allRefsResolved)}
              title={!skipConfirm && !allRefsResolved ? '每个镜头锁定或跳过参考图后可生成' : ''}
              onClick={onGenerate}>
              <Sparkles size={15} /> 开始生成视频 · 扣 1 条
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FreeTag() { return <span className="vg-free">免费</span>; }

/* ══ Step 2 生成与结果 ══ */
function StepResult({
  versions, activeV, setActiveV, status, totalSpent, lastReason,
  imgKind, cards, onAdopt, onRegen, onDiscard, onClose,
}) {
  const v = versions[activeV];
  const isLatest = activeV === versions.length - 1;
  return (
    <div className="step-content">
      <div className="vg-result-layout">
        <div className="vg-result-left">
          <div className="vg-video-tile"
            style={{ background: `linear-gradient(160deg, hsl(${(v.v * 57 + 200) % 360} 35% 18%), hsl(${(v.v * 57 + 250) % 360} 40% 30%))` }}>
            <span className="vg-video-emoji">{imgKind === 'dog' ? '🐕' : tileEmoji(cards[0], imgKind)}</span>
            <button className="vg-play"><Play size={20} /></button>
            <span className="vg-video-time">{v.dur}s</span>
            {status === 'adopted' && <span className="vg-video-badge vg-video-badge--ok"><CheckCircle2 size={12} /> 已采用</span>}
            {status === 'discarded' && <span className="vg-video-badge vg-video-badge--off">已弃用</span>}
          </div>
        </div>

        <div className="vg-result-right">
          <div className="vg-version-tabs">
            {versions.map((ver, i) => (
              <button key={ver.v} className={`vg-version-tab ${i === activeV ? 'active' : ''}`}
                onClick={() => setActiveV(i)}>
                V{ver.v}{i === versions.length - 1 && ' · 最新'}
              </button>
            ))}
          </div>

          <div className="char-attrs vg-meta-row">
            <span className="char-attr">{v.mode === 'motion' ? '图片动效' : '镜头脚本'}</span>
            <span className="char-attr">{v.shots} 个镜头</span>
            {v.mode === 'script' && <span className="char-attr">{v.refCount} 张参考图</span>}
            <span className="char-attr">本条累计消耗 {totalSpent} 次生成</span>
          </div>

          {status === 'adopted' ? (
            <div className="vg-banner vg-banner--success">
              <CheckCircle2 size={14} /> 已采用，计入本周产出。这条一共花了 {totalSpent} 次生成——看板上的核心指标就是它
            </div>
          ) : status === 'discarded' ? (
            <div className="vg-banner">
              已弃用{lastReason ? `（原因：${lastReason}）` : ''}，原因已进归因看板。还可以回去改了重新生成
            </div>
          ) : (
            <p className="asset-desc">自己看片：能用就采用；有问题点「重新生成」，所有参数原样回填，只改出问题的那一层。</p>
          )}

          {lastReason && status !== 'discarded' && (
            <p className="vg-hint">上一版弃用原因已记录：{lastReason}</p>
          )}

          <div className="vg-result-actions">
            <button className="btn-primary" onClick={onAdopt} disabled={status === 'adopted' || !isLatest}>
              <Check size={15} /> 采用
            </button>
            <button className="btn-outline" onClick={onRegen} disabled={!isLatest}>
              <RefreshCw size={15} /> 重新生成（回填参数 · 再扣 1 条）
            </button>
            <button className="btn-ghost" onClick={status === 'adopted' ? onClose : onDiscard} >
              {status === 'adopted' ? '完成' : <><Trash2 size={14} /> 弃用</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
