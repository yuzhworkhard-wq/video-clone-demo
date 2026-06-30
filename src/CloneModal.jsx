import React, { useState, useEffect, useRef } from 'react';
import {
  X, Upload, ChevronRight, ChevronDown, ChevronUp,
  Loader2, Check, RefreshCw, Lock, SkipForward,
  Image, User, Palette, Smartphone, Edit3,
  ToggleLeft, ToggleRight, Play, ExternalLink,
  FileVideo, MapPin, Package, Type, Globe2,
  ImagePlus, Sparkles, Clock, Camera, MessageSquare,
  Eye, Pencil, CheckCircle2, Circle, ArrowLeft,
  Dices, Send, AlertTriangle, Pause,
} from 'lucide-react';

const STEPS = [
  { key: 'upload', label: '上传与产品信息' },
  { key: 'assets', label: '基础素材生成' },
  { key: 'storyboard', label: '分镜编辑' },
  { key: 'generate', label: '一键生成' },
];

export function CloneModal({ onClose }) {
  const [step, setStep] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);

  const startAnalyze = () => {
    setAnalyzing(true);
    setAnalyzeProgress(0);
    const stages = [
      { p: 15, delay: 400 }, { p: 35, delay: 600 }, { p: 55, delay: 500 },
      { p: 75, delay: 700 }, { p: 90, delay: 400 }, { p: 100, delay: 300 },
    ];
    let total = 0;
    stages.forEach(({ p, delay }) => {
      total += delay;
      setTimeout(() => setAnalyzeProgress(p), total);
    });
    setTimeout(() => { setAnalyzing(false); setStep(1); }, total + 400);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-top-bar">
          <span className="modal-title">视频克隆</span>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <StepIndicator steps={STEPS} current={step} />

        <div className="modal-body">
          {analyzing ? (
            <div className="step-content analyze-overlay">
              <div className="analyze-box">
                <Loader2 size={28} className="spinner" />
                <h3>正在拆解视频...</h3>
                <div className="progress-bar-wrap">
                  <div className="progress-bar" style={{ width: `${analyzeProgress}%` }} />
                </div>
                <p className="analyze-stage">
                  {analyzeProgress < 20 ? '提取视频帧...' :
                   analyzeProgress < 50 ? '分析镜头切点...' :
                   analyzeProgress < 80 ? '识别角色与场景...' :
                   analyzeProgress < 100 ? '生成分镜脚本...' : '拆解完成'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {step === 0 && <StepUpload onNext={startAnalyze} />}
              {step === 1 && <StepAssets onNext={() => setStep(2)} onBack={() => setStep(0)} />}
              {step === 2 && <StepStoryboard onNext={() => setStep(3)} onBack={() => setStep(1)} />}
              {step === 3 && <StepGenerate onBack={() => setStep(2)} onClose={onClose} />}
            </>
          )}
        </div>
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

/* ── Step 1: Upload ── */
function StepUpload({ onNext }) {
  const [file, setFile] = useState({ name: 'demo-source.mp4', size: 2.8 * 1024 * 1024 });
  const [videoUrl, setVideoUrl] = useState('demo.mp4');
  const [form, setForm] = useState({
    sourceCategory: '网赚', sourceSubtype: '短剧推广',
    targetSubtype: '短剧推广', targetRegion: '巴西 (pt-BR)',
    logo: null, productName: 'ReelCash', extra: '',
    aspectRatio: '9:16',
  });
  const fileRef = useRef();
  const logoRef = useRef();

  const canProceed = file && form.sourceCategory && form.sourceSubtype
    && form.targetSubtype && form.targetRegion;

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setVideoUrl(URL.createObjectURL(f));
  };

  const removeFile = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setFile(null);
    setVideoUrl(null);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="step-content">
      <div className="upload-split">
        <div className="upload-split-left">
          {!file ? (
            <div
              className="upload-zone upload-zone-portrait"
              onDragOver={e => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept="video/*" hidden
                onChange={e => handleFile(e.target.files[0])} />
              <div className="upload-placeholder">
                <Upload size={28} strokeWidth={1.5} />
                <span>拖拽或点击上传源视频</span>
                <span className="upload-hint">MP4 / MOV, 15s 以内, 500MB 以内</span>
              </div>
            </div>
          ) : (
            <div className="upload-done-col">
              <div className="upload-done-video-portrait">
                <video src={videoUrl} controls className="upload-done-player-portrait" />
                <button className="upload-remove-btn" onClick={removeFile} title="移除视频">
                  <X size={14} />
                </button>
                <div className="upload-done-info-overlay">
                  <FileVideo size={13} />
                  <span className="upload-filename">{file.name}</span>
                  <span className="upload-meta">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="upload-split-right">
          <div className="form-stack">
            <div className="form-row-2">
              <div className="form-field">
                <label>源产品大类 <span className="required">*</span></label>
                <select value={form.sourceCategory}
                  onChange={e => setForm({ ...form, sourceCategory: e.target.value })}>
                  <option value="">请选择</option>
                  <option>网赚</option>
                  <option>互娱</option>
                  <option>社交</option>
                  <option>其他</option>
                </select>
              </div>
              <div className="form-field">
                <label>源产品子类 <span className="required">*</span></label>
                <input placeholder="如：消除游戏" value={form.sourceSubtype}
                  onChange={e => setForm({ ...form, sourceSubtype: e.target.value })} />
              </div>
            </div>
            <div className="form-row-2">
              <div className="form-field">
                <label>目标产品子类 <span className="required">*</span></label>
                <input placeholder="如：短剧" value={form.targetSubtype}
                  onChange={e => setForm({ ...form, targetSubtype: e.target.value })} />
              </div>
              <div className="form-field">
                <label>目标地区 <span className="required">*</span></label>
                <input placeholder="如：pt-BR 巴西、es-MX 墨西哥" value={form.targetRegion}
                  onChange={e => setForm({ ...form, targetRegion: e.target.value })} />
              </div>
            </div>
            <div className="form-field">
              <label>画面比例 <span className="required">*</span></label>
              <div className="ratio-picker">
                {['9:16', '16:9', '1:1', '4:3'].map(r => (
                  <button key={r} type="button"
                    className={`ratio-chip ${form.aspectRatio === r ? 'ratio-chip--active' : ''}`}
                    onClick={() => setForm({ ...form, aspectRatio: r })}>
                    <span className={`ratio-icon ratio-icon--${r.replace(':', 'x')}`} />
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-row-2">
              <div className="form-field">
                <label>产品 Logo</label>
                <div className="logo-upload" onClick={() => logoRef.current?.click()}>
                  <input ref={logoRef} type="file" accept="image/*" hidden
                    onChange={e => setForm({ ...form, logo: e.target.files[0] })} />
                  {form.logo ? (
                    <span className="logo-name">{form.logo.name}</span>
                  ) : (
                    <span className="logo-placeholder"><ImagePlus size={16} /> 上传 Logo</span>
                  )}
                </div>
              </div>
              <div className="form-field">
                <label>产品名称</label>
                <input placeholder="配合 Logo 使用" value={form.productName}
                  onChange={e => setForm({ ...form, productName: e.target.value })} />
              </div>
            </div>
            <div className="form-field">
              <label>额外上下文</label>
              <textarea rows={2} placeholder="补充说明（可选）" value={form.extra}
                onChange={e => setForm({ ...form, extra: e.target.value })} />
            </div>
          </div>
        </div>
      </div>

      <div className="step-actions">
        <div />
        <button className="btn-primary" disabled={!canProceed} onClick={onNext}>
          开始拆解 <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

/* ── Step 2: Base Assets ── */
function StepAssets({ onNext, onBack }) {
  const [sub, setSub] = useState(0);
  const [sceneLocked, setSceneLocked] = useState(false);
  const [sceneSkipped, setSceneSkipped] = useState(false);
  const [uiLocked, setUiLocked] = useState(false);
  const [uiSkipped, setUiSkipped] = useState(false);
  const [sceneLoading, setSceneLoading] = useState(false);
  const [uiLoading, setUiLoading] = useState(false);

  const initChars = [
    { id: 1, role: '老板', gender: '男', age: '35-45', trait: '成熟稳重', locked: false, loading: false },
    { id: 2, role: '路人', gender: '女', age: '20-28', trait: '年轻活泼', locked: false, loading: false },
  ];
  const [characters, setCharacters] = useState(initChars);
  const [activeCharId, setActiveCharId] = useState(1);
  const activeChar = characters.find(c => c.id === activeCharId);
  const allCharsHandled = characters.every(c => c.locked || c.skipped);

  const rerollChar = (id) => {
    setCharacters(prev => prev.map(c => c.id === id ? { ...c, loading: true } : c));
    setTimeout(() => setCharacters(prev => prev.map(c => c.id === id ? { ...c, loading: false } : c)), 1200);
  };
  const lockChar = (id) => setCharacters(prev => prev.map(c => c.id === id ? { ...c, locked: true } : c));
  const skipChar = (id) => setCharacters(prev => prev.map(c => c.id === id ? { ...c, skipped: true } : c));
  const rerollScene = () => { setSceneLoading(true); setTimeout(() => setSceneLoading(false), 1200); };
  const rerollUI = () => { setUiLoading(true); setTimeout(() => setUiLoading(false), 1200); };

  const sceneDone = sceneLocked || sceneSkipped;
  const uiDone = uiLocked || uiSkipped;

  const subTabs = [
    { label: '角色 IP', icon: User, done: allCharsHandled },
    { label: '场景风格', icon: Palette, done: sceneDone },
    { label: '产品界面', icon: Smartphone, done: uiDone },
  ];

  return (
    <div className="step-content">
      <div className="asset-layout">
        <div className="asset-sidebar">
          {subTabs.map((t, i) => (
            <button key={i}
              className={`asset-sidebar-tab ${sub === i ? 'active' : ''} ${t.done ? 'done' : ''}`}
              onClick={() => setSub(i)}>
              <span className="asset-sidebar-num">{t.done ? <Check size={12} /> : i + 1}</span>
              {t.done ? <Lock size={13} /> : <t.icon size={13} />}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="asset-main">
          {sub === 0 && (
            <div className="asset-card-area">
              <div className="char-tabs">
                {characters.map(c => (
                  <button key={c.id}
                    className={`char-tab ${activeCharId === c.id ? 'active' : ''} ${c.locked ? 'char-locked' : ''} ${c.skipped ? 'char-skipped' : ''}`}
                    onClick={() => setActiveCharId(c.id)}>
                    <User size={12} />
                    <span>角色 {c.id}: {c.role}</span>
                    {c.locked && <Lock size={10} />}
                    {c.skipped && <SkipForward size={10} />}
                  </button>
                ))}
              </div>
              {activeChar && (
                <>
                  <div className="char-info-row">
                    <h3 className="asset-heading">角色 {activeChar.id} — {activeChar.role}</h3>
                    <div className="char-attrs">
                      <span className="char-attr">{activeChar.gender}</span>
                      <span className="char-attr">{activeChar.age}岁</span>
                      <span className="char-attr">{activeChar.trait}</span>
                    </div>
                  </div>
                  <p className="asset-desc">
                    系统识别源视频中 {characters.length} 个角色，基于目标地区自动生成符合当地人群特征的角色形象
                  </p>
                  <div className="asset-compare">
                    <div className="compare-col">
                      <span className="compare-label">原角色</span>
                      <div className="preview-placeholder small">
                        <User size={28} strokeWidth={1} />
                        <span>源视频角色截图</span>
                        <span className="char-role-tag">{activeChar.role} / {activeChar.gender} / {activeChar.age}岁</span>
                      </div>
                    </div>
                    <ChevronRight size={18} className="compare-arrow" />
                    <div className="compare-col">
                      <span className="compare-label">新角色 IP</span>
                      <div className="preview-placeholder small">
                        {activeChar.loading ? (
                          <><Loader2 size={22} className="spinner" /> 生成中...</>
                        ) : (
                          <><Sparkles size={28} strokeWidth={1} /><span>AI 生成全身参考图</span></>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="scene-prompt-row">
                    <input placeholder="输入角色提示词重新生成（如：30岁东南亚男性、戴眼镜）"
                      className="scene-prompt-input"
                      disabled={activeChar.locked || activeChar.skipped} />
                    <button className="btn-outline btn-sm" onClick={() => rerollChar(activeChar.id)}
                      disabled={activeChar.locked || activeChar.skipped || activeChar.loading}>
                      <Dices size={13} /> 重新生成
                    </button>
                  </div>
                  <div className="asset-actions">
                    <button className="btn-primary btn-sm" onClick={() => lockChar(activeChar.id)}
                      disabled={activeChar.locked || activeChar.skipped}>
                      {activeChar.locked ? <><Lock size={13} /> 已锁定</> : <><Lock size={13} /> 锁定角色</>}
                    </button>
                    <button className="btn-ghost btn-sm" onClick={() => skipChar(activeChar.id)}
                      disabled={activeChar.locked || activeChar.skipped}>
                      <SkipForward size={13} /> 跳过（沿用原角色）
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {sub === 1 && (
            <div className="asset-card-area">
              <h3 className="asset-heading">物理场景 — 街头ATM旁</h3>
              <p className="asset-desc">保持源视频亮度/布光/真实感，在约束范围内微调背景元素</p>
              <div className="asset-compare">
                <div className="compare-col">
                  <span className="compare-label">原场景</span>
                  <div className="preview-placeholder small">
                    <Camera size={28} strokeWidth={1} />
                    <span>原视频场景截图</span>
                  </div>
                </div>
                <ChevronRight size={18} className="compare-arrow" />
                <div className="compare-col">
                  <span className="compare-label">新场景</span>
                  <div className="preview-placeholder small">
                    {sceneLoading ? (
                      <><Loader2 size={22} className="spinner" /> 生成中...</>
                    ) : (
                      <><Palette size={28} strokeWidth={1} /><span>生成的场景预览</span></>
                    )}
                  </div>
                </div>
              </div>
              <div className="scene-prompt-row">
                <input placeholder="输入场景提示词重新生成（如：换成咖啡店门口）" className="scene-prompt-input" />
                <button className="btn-outline btn-sm" onClick={rerollScene} disabled={sceneDone || sceneLoading}>
                  <RefreshCw size={13} /> 重新生成
                </button>
              </div>
              <div className="asset-actions">
                <button className="btn-primary btn-sm" onClick={() => setSceneLocked(true)} disabled={sceneDone}>
                  {sceneLocked ? <><Lock size={13} /> 已确认</> : <><Check size={13} /> 确认</>}
                </button>
                <button className="btn-ghost btn-sm" onClick={() => setSceneSkipped(true)} disabled={sceneDone}>
                  {sceneSkipped ? <><SkipForward size={13} /> 已跳过</> : <><SkipForward size={13} /> 跳过</>}
                </button>
              </div>
            </div>
          )}

          {sub === 2 && (
            <div className="asset-card-area">
              <h3 className="asset-heading">产品界面图</h3>
              <p className="asset-desc">基于产品 Logo 和名称，截取源视频手机屏幕关键帧并生成目标产品界面</p>
              <div className="asset-compare">
                <div className="compare-col">
                  <span className="compare-label">原截图</span>
                  <div className="preview-placeholder small">
                    <Smartphone size={28} strokeWidth={1} />
                    <span>源视频手机屏幕截图</span>
                  </div>
                </div>
                <ChevronRight size={18} className="compare-arrow" />
                <div className="compare-col">
                  <span className="compare-label">生成界面</span>
                  <div className="preview-placeholder small">
                    {uiLoading ? (
                      <><Loader2 size={22} className="spinner" /> 生成中...</>
                    ) : (
                      <><Sparkles size={28} strokeWidth={1} /><span>目标产品界面参考图</span></>
                    )}
                  </div>
                </div>
              </div>
              <div className="asset-actions">
                <button className="btn-outline btn-sm" onClick={rerollUI} disabled={uiDone || uiLoading}>
                  <RefreshCw size={13} /> 重新生成
                </button>
                <button className="btn-outline btn-sm" disabled={uiDone}>
                  <Upload size={13} /> 上传替代
                </button>
                <button className="btn-primary btn-sm" onClick={() => setUiLocked(true)} disabled={uiDone}>
                  {uiLocked ? <><Lock size={13} /> 已确认</> : <><Check size={13} /> 确认</>}
                </button>
                <button className="btn-ghost btn-sm" onClick={() => setUiSkipped(true)} disabled={uiDone}>
                  {uiSkipped ? <><SkipForward size={13} /> 已跳过</> : <><SkipForward size={13} /> 跳过</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="step-actions">
        <button className="btn-ghost" onClick={onBack}>
          <ArrowLeft size={16} /> 上一步
        </button>
        <button className="btn-primary" onClick={onNext}>
          进入分镜编辑 <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

/* ── Step 3: Storyboard ── */
function formatMs(ms) {
  const s = Math.floor(ms / 1000);
  const frac = Math.floor((ms % 1000) / 100);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}.${frac}`;
}

function StepStoryboard({ onNext, onBack }) {
  const initShots = [
    { id: 1, time: '0:00-0:02', startMs: 0, endMs: 2000, kfMs: 0, angle: '中景 / 正面平角', content: '角色在街边ATM旁说话', line: 'Voce sabia que pode ganhar...', zh: '你知道你可以赚钱吗...', type: 'frozen', keyframe: true, refVersion: 1,
      refDesc: '角色 IP + 街头ATM场景，中景正面', frameImg: 'frames/frame_01.jpg' },
    { id: 2, time: '0:02-0:04', startMs: 2000, endMs: 4000, kfMs: 2000, angle: '中景 / 正面平角', content: '角色继续面对镜头讲述', line: 'Olha so, ...', zh: '你看...', type: 'frozen', keyframe: false, refVersion: 0,
      refDesc: '角色面对镜头讲述，中景正面', frameImg: 'frames/frame_02.jpg' },
    { id: 3, time: '0:04-0:06', startMs: 4000, endMs: 6000, kfMs: 4000, angle: '特写 / 俯拍15', content: '手机屏幕展示App界面', line: 'Assista um episodio e ganhe R$2...', zh: '看一集可以获得2雷亚尔...', type: 'rewrite', keyframe: true, refVersion: 1,
      refDesc: '手机屏幕特写，展示短剧App界面', frameImg: 'frames/frame_03.jpg',
      rewrites: ['Assista um episodio e ganhe R$2 na hora!', 'Veja um capitulo e receba R$2 direto!', 'Cada episodio vale R$2 pra voce!'],
      rewritesZh: ['看一集马上赚2雷亚尔!', '看一章直接拿2雷亚尔!', '每集价值2雷亚尔!'] },
    { id: 4, time: '0:06-0:08', startMs: 6000, endMs: 8000, kfMs: 6000, angle: '特写 / 俯拍15', content: '金额展示: R$2/4/6/10', line: '...assista dois e ganhe R$4...', zh: '...看两集获得4雷亚尔...', type: 'rewrite', keyframe: true, money: true, refVersion: 1,
      refDesc: '手机屏幕特写，金额 R$2/4/6/10 清晰可读', frameImg: 'frames/frame_04.jpg',
      rewrites: ['...assista dois capitulos e ganhe R$4...', '...dois episodios, R$4 garantido...', '...veja dois e receba R$4 na conta...'],
      rewritesZh: ['...看两章获得4雷亚尔...', '...两集, 4雷亚尔到手...', '...看两集直接到账4雷亚尔...'] },
    { id: 5, time: '0:08-0:09', startMs: 8000, endMs: 9000, kfMs: 8000, angle: '中景 / 正面平角', content: '角色展示手机屏幕', line: 'E olha aqui o quanto ja ganhei...', zh: '你看我赚了多少...', type: 'frozen', keyframe: false, refVersion: 0,
      refDesc: '角色手持手机展示屏幕', frameImg: 'frames/frame_05.jpg' },
    { id: 6, time: '0:09-0:11', startMs: 9000, endMs: 11000, kfMs: 9000, angle: '特写 / 俯拍15', content: '银行到账通知画面', line: 'Recebi R$500 direto na conta!', zh: '直接收到500雷亚尔!', type: 'frozen', keyframe: true, money: true, refVersion: 1,
      refDesc: '手机特写，银行到账通知 R$500', frameImg: 'frames/frame_06.jpg' },
    { id: 7, time: '0:11-0:13', startMs: 11000, endMs: 13000, kfMs: 11000, angle: '中景 / 正面平角', content: '角色指向手机说明', line: 'Baixa o app agora e comeca...', zh: '现在就下载App...', type: 'rewrite', keyframe: true, refVersion: 1,
      refDesc: '角色指向手机，CTA动作', frameImg: 'frames/frame_07.jpg',
      rewrites: ['Baixa o app agora e comeca a ganhar!', 'Instala o app e comeca a lucrar hoje!', 'Corre, baixa agora e ganha dinheiro!'],
      rewritesZh: ['现在下载App开始赚钱!', '安装App今天就开始赚!', '快下载，马上赚钱!'] },
    { id: 8, time: '0:13-0:14', startMs: 13000, endMs: 14000, kfMs: 13000, angle: '中景 / 正面平角', content: 'CTA收尾画面', line: 'Corre la!', zh: '快去吧!', type: 'frozen', keyframe: false, refVersion: 0,
      refDesc: 'CTA收尾，角色正面', frameImg: 'frames/frame_08.jpg' },
  ];

  const [shots, setShots] = useState(initShots);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedRewrite, setSelectedRewrite] = useState({});
  const [refLoading, setRefLoading] = useState({});
  const scrubDebounce = useRef({});

  const keyframeCount = shots.filter(s => s.keyframe).length;
  const maxKeyframes = 9;

  const toggleKeyframe = (id) => {
    setShots(prev => prev.map(s => {
      if (s.id !== id) return s;
      if (s.keyframe) return { ...s, keyframe: false, refVersion: 0 };
      if (keyframeCount >= maxKeyframes) return s;
      setRefLoading(rl => ({ ...rl, [id]: true }));
      setTimeout(() => {
        setRefLoading(rl => ({ ...rl, [id]: false }));
        setShots(p => p.map(x => x.id === id ? { ...x, refVersion: (x.refVersion || 0) + 1 } : x));
      }, 1500);
      return { ...s, keyframe: true };
    }));
  };

  const regenerateRef = (id) => {
    setRefLoading(rl => ({ ...rl, [id]: true }));
    setTimeout(() => {
      setRefLoading(rl => ({ ...rl, [id]: false }));
      setShots(prev => prev.map(s => s.id === id ? { ...s, refVersion: (s.refVersion || 0) + 1 } : s));
    }, 1500);
  };

  const seekKeyframe = (id, newMs) => {
    const frameIndex = Math.min(9, Math.max(1, Math.round((newMs / 15000) * 9)));
    const newFrameImg = `frames/frame_${String(frameIndex).padStart(2, '0')}.jpg`;
    setShots(prev => prev.map(s => s.id === id ? { ...s, kfMs: newMs, frameImg: newFrameImg } : s));
    clearTimeout(scrubDebounce.current[id]);
    scrubDebounce.current[id] = setTimeout(() => regenerateRef(id), 800);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="step-content">
      <div className="storyboard-header">
        <span className="keyframe-counter">
          <Image size={14} /> 已选关键帧 {keyframeCount}/{maxKeyframes}
        </span>
        <span className="storyboard-hint">点击行展开编辑台词和调整关键帧</span>
      </div>

      <div className="shot-card-list">
        {shots.map(s => {
          const isExpanded = expandedId === s.id;
          const isLoading = refLoading[s.id];
          return (
            <div key={s.id} className={`shot-card ${s.money ? 'shot-card--money' : ''} ${isExpanded ? 'shot-card--expanded' : ''}`}>
              <div className="shot-card-row" onClick={() => toggleExpand(s.id)}>
                <div className="shot-card-col">
                  <div className={`shot-ref-thumb ${s.keyframe ? '' : 'shot-ref-thumb--empty'} ${isLoading ? 'shot-ref-thumb--loading' : ''}`}>
                    {s.keyframe && s.frameImg ? (
                      <img src={s.frameImg} alt="" className="shot-ref-img" />
                    ) : s.keyframe ? (
                      isLoading ? <Loader2 size={14} className="spinner" /> : <Sparkles size={14} strokeWidth={1} />
                    ) : null}
                    {isLoading && s.keyframe && s.frameImg && <div className="shot-ref-loading"><Loader2 size={14} className="spinner" /></div>}
                  </div>
                </div>
                <div className="shot-card-col">
                  <div className="shot-card-time">{s.time}</div>
                  <div className="shot-card-meta">
                    <div className="shot-card-content">{s.content}</div>
                    <div className="shot-card-angle">{s.angle}</div>
                  </div>
                </div>
                <div className="shot-card-col">
                  <div className="shot-card-line">
                    <span className={s.type === 'rewrite' ? 'rewrite-text' : 'frozen-text'}>
                      {selectedRewrite[s.id] || s.line}
                    </span>
                    <span className="shot-card-zh">{s.zh}</span>
                  </div>
                </div>
                <div className="shot-card-col shot-card-col--actions">
                  <button className="toggle-btn" onClick={e => { e.stopPropagation(); toggleKeyframe(s.id); }}
                    disabled={!s.keyframe && keyframeCount >= maxKeyframes}
                    title={s.keyframe ? '关闭关键帧' : '开启关键帧'}>
                    {s.keyframe
                      ? <ToggleRight size={20} className="toggle-on" />
                      : <ToggleLeft size={20} className="toggle-off" />}
                  </button>
                  <ChevronDown size={14} className={`shot-card-chevron ${isExpanded ? 'rotated' : ''}`} />
                </div>
              </div>

              {isExpanded && (
                <div className="shot-expand">
                  <div className="shot-expand-sections">
                    {/* Reference image section */}
                    <div className="shot-expand-ref">
                      <div className="shot-expand-label">
                        <Image size={13} />
                        <span>参考图</span>
                        <span className={`kf-status ${s.keyframe ? 'kf-on' : 'kf-off'}`}>
                          {s.keyframe ? '关键帧已开启' : '关键帧未开启'}
                        </span>
                      </div>
                      {s.keyframe ? (
                        <>
                          {/* Frame scrubber with inline preview */}
                          <div className="kf-scrubber-with-preview">
                            <div className="kf-frame-preview">
                              {s.frameImg ? (
                                <img src={s.frameImg} alt="" className="kf-frame-img" />
                              ) : (
                                <Camera size={20} strokeWidth={1} />
                              )}
                              <div className="kf-frame-text-overlay">
                                <span className="kf-frame-label">@ {formatMs(s.kfMs)}</span>
                                <span className="kf-frame-desc">{s.angle}</span>
                              </div>
                            </div>
                            <div className="kf-scrubber">
                              <div className="kf-scrubber-label">
                                <Clock size={12} />
                                <span>帧定位</span>
                                <span className="kf-time-display">{formatMs(s.kfMs)}</span>
                              </div>
                              <div className="kf-scrubber-track-wrap">
                                <span className="kf-scrubber-bound">{formatMs(s.startMs)}</span>
                                <div className="kf-scrubber-track">
                                  <div className="kf-scrubber-fill" style={{ width: `${((s.kfMs - s.startMs) / (s.endMs - s.startMs)) * 100}%` }} />
                                  <div className="kf-scrubber-ticks">
                                    {Array.from({ length: 10 }).map((_, i) => (
                                      <div key={i} className="kf-tick" />
                                    ))}
                                  </div>
                                  <input type="range"
                                    className="kf-scrubber-input"
                                    min={s.startMs} max={s.endMs} step={100}
                                    value={s.kfMs}
                                    onChange={e => seekKeyframe(s.id, Number(e.target.value))}
                                    onClick={e => e.stopPropagation()} />
                                </div>
                                <span className="kf-scrubber-bound">{formatMs(s.endMs)}</span>
                              </div>
                              <p className="kf-scrubber-hint">拖动滑块定位关键帧，松手后自动刷新参考图</p>
                            </div>
                          </div>

                          <div className="ref-compare">
                            <div className="ref-compare-images">
                              <div className="ref-compare-col">
                                <span className="compare-label">原帧 @ {formatMs(s.kfMs)}</span>
                                <div className="ref-thumb">
                                  {s.frameImg ? (
                                    <img src={s.frameImg} alt="" className="ref-thumb-img" />
                                  ) : (
                                    <><Camera size={24} strokeWidth={1} /><span className="ref-thumb-text">{s.angle}</span></>
                                  )}
                                </div>
                              </div>
                              <ChevronRight size={16} className="compare-arrow" />
                              <div className="ref-compare-col">
                                <span className="compare-label">合成参考图 {isLoading ? '' : `V${s.refVersion}`}</span>
                                <div className={`ref-thumb ref-thumb--new ${isLoading ? 'ref-thumb--loading' : ''}`}>
                                  {isLoading ? (
                                    <><Loader2 size={20} className="spinner" /><span className="ref-thumb-text">生成中...</span></>
                                  ) : s.frameImg ? (
                                    <><img src={s.frameImg} alt="" className="ref-thumb-img ref-thumb-img--synth" /><span className="ref-thumb-overlay">{s.refDesc}</span></>
                                  ) : (
                                    <><Sparkles size={24} strokeWidth={1} /><span className="ref-thumb-text">{s.refDesc}</span></>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="ref-compare-info">
                              <div className="ref-info-card">
                                <div className="ref-info-row">
                                  <span className="ref-info-label">镜头</span>
                                  <span className="ref-info-value">{s.angle}</span>
                                </div>
                                <div className="ref-info-row">
                                  <span className="ref-info-label">画面</span>
                                  <span className="ref-info-value">{s.content}</span>
                                </div>
                                <div className="ref-info-row">
                                  <span className="ref-info-label">时间段</span>
                                  <span className="ref-info-value">{s.time}</span>
                                </div>
                                <div className="ref-info-row">
                                  <span className="ref-info-label">关键帧</span>
                                  <span className="ref-info-value">@ {formatMs(s.kfMs)}</span>
                                </div>
                                <div className="ref-info-row">
                                  <span className="ref-info-label">生成描述</span>
                                  <span className="ref-info-value ref-info-desc">{s.refDesc}</span>
                                </div>
                                <div className="ref-info-row">
                                  <span className="ref-info-label">版本</span>
                                  <span className="ref-info-value">V{s.refVersion}</span>
                                </div>
                              </div>
                              <div className="ref-actions">
                                <button className="btn-outline btn-sm" onClick={() => regenerateRef(s.id)} disabled={isLoading}>
                                  <RefreshCw size={13} /> 重新生成参考图
                                </button>
                                <button className="btn-outline btn-sm" disabled={isLoading}>
                                  <Upload size={13} /> 上传替代
                                </button>
                                <button className="btn-ghost btn-sm" onClick={e => { e.stopPropagation(); toggleKeyframe(s.id); }}>
                                  <ToggleLeft size={13} /> 关闭关键帧
                                </button>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="ref-off-hint">
                          <p>该镜头未设为关键帧，生成时靠 prompt 文字描述 + 相邻参考图自然过渡</p>
                          <button className="btn-outline btn-sm"
                            onClick={e => { e.stopPropagation(); toggleKeyframe(s.id); }}
                            disabled={keyframeCount >= maxKeyframes}>
                            <ToggleRight size={13} /> 开启关键帧并生成参考图
                            {keyframeCount >= maxKeyframes && <span className="ref-limit-hint">（已达上限 {maxKeyframes}）</span>}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Script edit section */}
                    <div className="shot-expand-script">
                      <div className="shot-expand-label">
                        <MessageSquare size={13} />
                        <span>台词</span>
                      </div>
                      {s.type === 'frozen' ? (
                        <div className="script-frozen">
                          <Lock size={12} />
                          <span>冻结台词，不可编辑</span>
                          <p className="script-frozen-text">{s.line}</p>
                          <p className="script-zh-text">{s.zh}</p>
                        </div>
                      ) : (
                        <div className="script-rewrite">
                          <div className="script-original-row">
                            <span className="rewrite-label">原台词：</span>
                            <span className="script-original-line">{s.line}</span>
                            <span className="script-original-zh">{s.zh}</span>
                          </div>
                          <span className="rewrite-label">选择重写方案：</span>
                          <div className="rewrite-options">
                            {s.rewrites.map((rw, ri) => (
                              <label key={ri} className="rewrite-option">
                                <input type="radio" name={`rw-${s.id}`}
                                  checked={selectedRewrite[s.id] === rw}
                                  onChange={() => setSelectedRewrite({ ...selectedRewrite, [s.id]: rw })} />
                                <div className="rewrite-option-text">
                                  <span>{rw}</span>
                                  <span className="rewrite-option-zh">{s.rewritesZh?.[ri] || ''}</span>
                                </div>
                              </label>
                            ))}
                          </div>
                          <input placeholder="或手动微调台词..." className="rewrite-input"
                            onKeyDown={e => {
                              if (e.key === 'Enter' && e.target.value) {
                                setSelectedRewrite({ ...selectedRewrite, [s.id]: e.target.value });
                              }
                            }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="step-actions">
        <button className="btn-ghost" onClick={onBack}>
          <ArrowLeft size={16} /> 上一步
        </button>
        <button className="btn-primary" onClick={onNext}>
          <Sparkles size={16} /> 确认无误，开始生成
        </button>
      </div>
    </div>
  );
}

/* ── Step 5: Generate ── */
function StepGenerate({ onBack, onClose }) {
  const [phase, setPhase] = useState('generating');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(iv); setPhase('done'); return 100; }
        return p + 2;
      });
    }, 120);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="step-content">
      {phase === 'generating' && (
        <div className="generate-progress">
          <Loader2 size={36} className="spinner" />
          <h3>正在生成克隆视频...</h3>
          <div className="progress-bar-wrap">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-text">{progress}%</span>
          <p className="hint">
            {progress < 30 ? '正在合成角色 IP...' :
             progress < 60 ? '逐镜头生成画面中...' :
             progress < 85 ? '拼接视频片段...' :
             '最终渲染与质检...'}
          </p>
        </div>
      )}

      {phase === 'done' && (
        <div className="generate-done">
          <div className="done-icon"><CheckCircle2 size={48} /></div>
          <h3>克隆视频生成完成</h3>
          <p className="done-desc">任务已自动保存，可随时在任务中心查看和下载</p>
          <div className="done-preview">
            <div className="video-placeholder">
              <Play size={36} />
              <span>点击播放预览</span>
            </div>
          </div>
          <div className="done-actions">
            <button className="btn-outline" onClick={onBack}>
              <RefreshCw size={14} /> 调整后重新生成
            </button>
            <button className="btn-primary" onClick={onClose}>
              <Check size={14} /> 完成
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
