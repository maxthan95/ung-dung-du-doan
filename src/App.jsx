import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Coins, Target, Sigma, History, PieChart, Link, ArrowRightLeft, Brain, Video, VideoOff, ScanEye, CheckCircle, XCircle, List, Grid, RotateCcw, TrendingUp, Settings, MousePointerClick, RefreshCw, PlayCircle, PauseCircle } from 'lucide-react';

// --- HELPER COMPONENTS ---

const Icon = ({ name, ...props }) => {
    const icons = { Coins, Target, Sigma, History, PieChart, Link, ArrowRightLeft, Brain, Video, VideoOff, ScanEye, CheckCircle, XCircle, List, Grid, RotateCcw, TrendingUp, Settings, MousePointerClick, RefreshCw, PlayCircle, PauseCircle };
    const LucideIcon = icons[name];
    return LucideIcon ? <LucideIcon {...props} /> : null;
};

const StatCard = ({ iconName, title, value, footer, color, children }) => (
    <div className={`stat-card bg-white p-5 rounded-xl shadow-lg flex flex-col justify-between border-l-4 ${color}`}>
        <div>
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-500">{title}</h3>
                <Icon name={iconName} className="w-6 h-6 text-gray-400" />
            </div>
            <div className="mt-2 text-3xl font-bold text-gray-800">{value}</div>
        </div>
        <div className="mt-4 text-xs text-gray-500">{footer || children}</div>
    </div>
);

const AIPredictionDisplay = ({ prediction, analysis, isAnalyzing, isPredictionRunning, onTogglePrediction }) => {
    let content;
    if (!isPredictionRunning) {
        content = <div className="text-center py-8 text-gray-500">Dự đoán đã tạm dừng.</div>;
    } else if (isAnalyzing) {
        content = <div className="text-center py-8 text-gray-500">🧠 AI đang phân tích...</div>;
    } else if (!prediction) {
        content = <div className="text-center py-8 text-gray-500">Chưa đủ dữ liệu để dự đoán.</div>;
    } else {
        const methodIcons = {
            'Tần suất Tổng thể': 'PieChart', 'Tần suất Gần đây': 'PieChart',
            'Chuỗi Markov (ngắn)': 'Link', 'Chuỗi Markov (dài)': 'Link',
            'Đảo ngược Xu thế': 'ArrowRightLeft', 'Theo Xu hướng': 'TrendingUp',
        };
        content = (
            <div>
                <div className="text-center mb-6">
                    <p className="text-sm text-gray-500">Dự đoán Tối ưu</p>
                    <div className="text-6xl font-bold text-purple-600 my-2">{prediction.value} Đỏ</div>
                    <div className="flex items-center justify-center space-x-2 bg-green-100 text-green-700 px-3 py-1 rounded-full w-fit mx-auto">
                        <Icon name="Target" className="w-4 h-4" />
                        <span className="text-sm font-medium">Độ tin cậy: {prediction.confidence}%</span>
                    </div>
                </div>
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phân tích Chi tiết từ các Mô hình</h4>
                    {analysis.methods.map(method => (
                        <div key={method.name} className={`p-3 rounded-lg ${method.agrees ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'}`}>
                           <div className="flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                    <Icon name={methodIcons[method.name] || 'Brain'} className={`w-5 h-5 ${method.agrees ? 'text-purple-600' : 'text-gray-400'}`} />
                                    <span className="text-sm text-gray-700 font-medium">{method.name}</span>
                                </div>
                                <div className={`text-sm font-bold ${method.agrees ? 'text-purple-600' : 'text-gray-500'}`}>{method.prediction !== null ? `${method.prediction} Đỏ` : 'N/A'}</div>
                           </div>
                           <div className="flex items-center gap-2 mt-2">
                                <div className="text-xs text-gray-500 w-20">Độ hiệu quả:</div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${method.weight * 100}%` }}></div>
                                </div>
                           </div>
                        </div>
                    ))}
                </div>
                {analysis.commentary && (
                    <p className="mt-4 text-xs text-center text-gray-600 bg-gray-100 p-3 rounded-lg">{analysis.commentary}</p>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
                 <h2 className="text-lg font-semibold text-purple-800">🔮 Dự Đoán AI</h2>
                 <button onClick={onTogglePrediction} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white ${isPredictionRunning ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'}`}>
                    {isPredictionRunning ? <Icon name="PauseCircle" size={16} /> : <Icon name="PlayCircle" size={16} />}
                    <span>{isPredictionRunning ? 'Dừng' : 'Bắt đầu'}</span>
                </button>
            </div>
            {content}
        </div>
    );
};

// --- NEW VISION SETTINGS MODAL (WITH GRID SETUP) ---
const VisionSettingsModal = ({ isOpen, onClose, onSave, stream, initialSettings }) => {
    const videoRef = useRef(null);
    const overlayRef = useRef(null);
    const [setupStep, setSetupStep] = useState('drawingLatest');
    const [tempRegion, setTempRegion] = useState(null);
    const [localSettings, setLocalSettings] = useState(initialSettings || { latest: null, history: null, rows: 3, cols: 5 });
    
    const [action, setAction] = useState({ type: 'none' });

    useEffect(() => {
        if (isOpen && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
        if (isOpen) {
            setLocalSettings(initialSettings || { latest: null, history: null, rows: 3, cols: 5 });
            setSetupStep('drawingLatest');
        }
    }, [isOpen, stream, initialSettings]);

    if (!isOpen) return null;

    const handleMouseDown = (e) => {
        const rect = overlayRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * 100;
        const y = (e.clientY - rect.top) / rect.height * 100;

        const handle = e.target.dataset.handle;
        const regionType = e.target.dataset.region;
        if (handle && regionType) {
            setAction({ type: 'resizing', region: regionType, handle: handle, startX: x, startY: y, initialRegion: localSettings[regionType] });
            return;
        }
        
        for (const type of ['latest', 'history']) {
            const region = localSettings[type];
            if (region && x > region.x && x < region.x + region.width && y > region.y && y < region.y + region.height) {
                setAction({ type: 'moving', region: type, startX: x, startY: y, initialRegion: region });
                return;
            }
        }
        
        setAction({ type: 'drawing', startX: x, startY: y });
        setTempRegion({ x: x, y: y, width: 0, height: 0 });
    };

    const handleMouseMove = (e) => {
        if (action.type === 'none') return;
        
        const rect = overlayRef.current.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / rect.width * 100;
        const mouseY = (e.clientY - rect.top) / rect.height * 100;
        const deltaX = mouseX - action.startX;
        const deltaY = mouseY - action.startY;

        if (action.type === 'drawing') {
            const newWidth = Math.abs(mouseX - action.startX);
            const newHeight = Math.abs(mouseY - action.startY);
            const newX = Math.min(mouseX, action.startX);
            const newY = Math.min(mouseY, action.startY);
            setTempRegion({ x: newX, y: newY, width: newWidth, height: newHeight });
        } else if (action.type === 'moving') {
            const newX = action.initialRegion.x + deltaX;
            const newY = action.initialRegion.y + deltaY;
            setLocalSettings(prev => ({ ...prev, [action.region]: { ...prev[action.region], x: newX, y: newY } }));
        } else if (action.type === 'resizing') {
            const { initialRegion, handle } = action;
            let { x, y, width, height } = initialRegion;

            if (handle.includes('right')) width = Math.max(5, initialRegion.width + deltaX);
            if (handle.includes('left')) {
                width = Math.max(5, initialRegion.width - deltaX);
                x = initialRegion.x + deltaX;
            }
            if (handle.includes('bottom')) height = Math.max(5, initialRegion.height + deltaY);
            if (handle.includes('top')) {
                height = Math.max(5, initialRegion.height - deltaY);
                y = initialRegion.y + deltaY;
            }
            setLocalSettings(prev => ({ ...prev, [action.region]: { x, y, width, height } }));
        }
    };

    const handleMouseUp = () => {
        if (action.type === 'drawing' && tempRegion && tempRegion.width > 1 && tempRegion.height > 1) {
            if (setupStep === 'drawingLatest') {
                setLocalSettings(prev => ({ ...prev, latest: tempRegion }));
                setSetupStep('drawingHistory');
            } else if (setupStep === 'drawingHistory') {
                setLocalSettings(prev => ({ ...prev, history: tempRegion }));
                setSetupStep('complete');
            }
        }
        setAction({ type: 'none' });
        setTempRegion(null);
    };

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    const handleRedraw = (regionToRedraw) => {
        setLocalSettings(prev => ({ ...prev, [regionToRedraw]: null }));
        setSetupStep(regionToRedraw === 'latest' ? 'drawingLatest' : 'drawingHistory');
    };

    const getRegionStyle = (region) => {
        if (!region) return {};
        return { left: `${region.x}%`, top: `${region.y}%`, width: `${region.width}%`, height: `${region.height}%` };
    };
    
    const ResizableBox = ({ region, type, color, grid }) => {
        if (!region) return null;
        const handles = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        return (
            <div className={`absolute border-4 ${color} z-10`} style={getRegionStyle(region)}>
                {handles.map(handle => (
                    <div 
                        key={handle}
                        data-handle={handle}
                        data-region={type}
                        className="absolute w-4 h-4 bg-white border-2 border-gray-800 rounded-full -m-2"
                        style={{
                            top: handle.includes('top') ? '0%' : '100%',
                            left: handle.includes('left') ? '0%' : '100%',
                            cursor: `${handle.split('-')[0] === 'top' ? 'n' : 's'}${handle.split('-')[1] === 'left' ? 'w' : 'e'}-resize`,
                        }}
                    />
                ))}
                {grid && (
                    <div className="absolute inset-0 grid" style={{gridTemplateColumns: `repeat(${grid.cols}, 1fr)`, gridTemplateRows: `repeat(${grid.rows}, 1fr)`}}>
                        {Array.from({ length: grid.rows * grid.cols }).map((_, i) => (
                            <div key={i} className="border border-dashed border-white/30"></div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Cài đặt Vùng quét</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 relative bg-gray-900 rounded-lg overflow-hidden w-full" style={{ paddingBottom: '56.25%' }}>
                        <video ref={videoRef} autoPlay muted className="absolute top-0 left-0 w-full h-full object-contain" />
                        <div ref={overlayRef} className="absolute inset-0 cursor-crosshair" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
                            <ResizableBox region={localSettings.latest} type="latest" color="border-blue-500" />
                            <ResizableBox region={localSettings.history} type="history" color="border-green-500" grid={{rows: localSettings.rows, cols: localSettings.cols}} />
                            {tempRegion && <div className="absolute border-4 border-dashed border-yellow-400 bg-yellow-400 bg-opacity-20 z-10" style={getRegionStyle(tempRegion)} />}
                        </div>
                    </div>
                    <div className="flex flex-col justify-center space-y-4">
                        <h3 className="font-bold text-gray-700">Hướng dẫn:</h3>
                        <div className={`p-4 rounded-lg border-2 ${setupStep === 'drawingLatest' ? 'border-yellow-400' : 'border-gray-600'} ${localSettings.latest ? 'bg-green-500/10' : 'bg-gray-100'}`}>
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold flex items-center gap-2">{localSettings.latest ? <Icon name="CheckCircle" className="text-green-600" /> : 'Bước 1:'} Vẽ vùng [Kết quả]</h4>
                                {localSettings.latest && <button onClick={() => handleRedraw('latest')} className="p-1 hover:bg-gray-200 rounded"><Icon name="RefreshCw" size={14} /></button>}
                            </div>
                        </div>
                        <div className={`p-4 rounded-lg border-2 ${setupStep === 'drawingHistory' ? 'border-yellow-400' : 'border-gray-600'} ${localSettings.history ? 'bg-green-500/10' : 'bg-gray-100'}`}>
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold flex items-center gap-2">{localSettings.history ? <Icon name="CheckCircle" className="text-green-600" /> : 'Bước 2:'} Vẽ vùng [Lịch sử]</h4>
                                {localSettings.history && <button onClick={() => handleRedraw('history')} className="p-1 hover:bg-gray-200 rounded"><Icon name="RefreshCw" size={14} /></button>}
                            </div>
                            <div className="mt-2 flex gap-2 items-center">
                                <input type="number" value={localSettings.rows} onChange={e => setLocalSettings(p => ({...p, rows: parseInt(e.target.value) || 1}))} className="w-full p-1 border rounded" /><span>hàng</span>
                                <input type="number" value={localSettings.cols} onChange={e => setLocalSettings(p => ({...p, cols: parseInt(e.target.value) || 1}))} className="w-full p-1 border rounded" /><span>cột</span>
                            </div>
                        </div>
                        <div className="mt-4 flex flex-col gap-2">
                            <button onClick={handleSave} disabled={!localSettings.latest || !localSettings.history} className="w-full px-4 py-2 rounded-lg text-sm text-white bg-teal-500 hover:bg-teal-600 disabled:bg-gray-400">Lưu & Áp dụng</button>
                            <button onClick={onClose} className="w-full px-4 py-2 rounded-lg text-sm bg-gray-200 hover:bg-gray-300">Hủy</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- VISION ANALYZER COMPONENT ---
const VisionAnalyzer = ({ onVisionUpdate, results }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [stream, setStream] = useState(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('visionSettings');
            return saved ? JSON.parse(saved) : { latest: null, history: null, rows: 3, cols: 5 };
        } catch { return { latest: null, history: null, rows: 3, cols: 5 }; }
    });

    const [lastResult, setLastResult] = useState(null);

    // UPDATED OCR LOGIC
    const recognizeDigit = (imageData) => {
        const data = imageData.data; let r = 0, g = 0, b = 0;
        for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; }
        const pixelCount = data.length / 4; r /= pixelCount; g /= pixelCount; b /= pixelCount;
        
        if (r > 180 && g > 180 && b > 180) return 0; // White
        if (b > r && b > g && b > 100) return 1;    // Blue
        if (g > r && g > b && g > 100) return 2;    // Green
        if (r > 150 && g > 120 && b < 100) return 3; // Yellow
        if (r > 150 && g < 100 && b < 100) return 4; // Red
        return null; // Undetermined
    };

    const startCapture = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "never" }, audio: false });
            setStream(mediaStream);
            if (videoRef.current) videoRef.current.srcObject = mediaStream;
            setIsCapturing(true);
            if (!settings.latest || !settings.history) {
                setIsSettingsOpen(true);
            }
        } catch (err) { alert("Không thể bắt đầu ghi hình. Vui lòng cấp quyền."); }
    };

    const stopCapture = () => {
        if (stream) stream.getTracks().forEach(track => track.stop());
        setStream(null); setIsCapturing(false); setLastResult(null);
    };

    const handleSaveSettings = (newSettings) => {
        setSettings(newSettings);
        localStorage.setItem('visionSettings', JSON.stringify(newSettings));
    };

    useEffect(() => {
        let intervalId;
        if (isCapturing && settings.latest && settings.history) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            intervalId = setInterval(() => {
                if (video.readyState < 2) return;
                canvas.width = video.videoWidth; canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const r = settings.latest;
                const latestImageData = ctx.getImageData((r.x / 100) * canvas.width, (r.y / 100) * canvas.height, (r.width / 100) * canvas.width, (r.height / 100) * canvas.height);
                const currentResult = recognizeDigit(latestImageData);

                if (currentResult !== null && (lastResult === null || currentResult !== lastResult)) {
                    setLastResult(currentResult);
                    if (lastResult !== null) {
                        const h = settings.history;
                        const historyResults = [];
                        const cellWidth = ((h.width / 100) * canvas.width) / settings.cols;
                        const cellHeight = ((h.height / 100) * canvas.height) / settings.rows;

                        for (let row = 0; row < settings.rows; row++) {
                            for (let col = 0; col < settings.cols; col++) {
                                const x = (h.x / 100) * canvas.width + col * cellWidth;
                                const y = (h.y / 100) * canvas.height + row * cellHeight;
                                const itemImageData = ctx.getImageData(x, y, cellWidth, cellHeight);
                                const digit = recognizeDigit(itemImageData);
                                if (digit !== null) historyResults.push(digit);
                            }
                        }
                        onVisionUpdate(currentResult, historyResults);
                    }
                }
            }, 1000);
        }
        return () => clearInterval(intervalId);
    }, [isCapturing, settings, lastResult, onVisionUpdate]);

    const getRegionStyle = (region) => {
        if (!region) return {};
        return { left: `${region.x}%`, top: `${region.y}%`, width: `${region.width}%`, height: `${region.height}%` };
    };
    
    // NEW COLOR FUNCTION
    const getDisplayColor = (count) => {
        switch(count) {
            case 0: return 'bg-gray-200 text-gray-800'; // White
            case 1: return 'bg-blue-500 text-white';   // Blue
            case 2: return 'bg-green-500 text-white';  // Green
            case 3: return 'bg-yellow-400 text-black'; // Yellow
            case 4: return 'bg-red-500 text-white';    // Red
            default: return 'bg-gray-200 text-gray-800';
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-teal-500">
            <VisionSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onSave={handleSaveSettings} stream={stream} initialSettings={settings} />
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-teal-800">🔬 Phân tích Vision AI</h2>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsSettingsOpen(true)} disabled={!isCapturing} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed" title="Cài đặt khu vực">
                        <Icon name="Settings" size={16} />
                        <span>Cài đặt</span>
                    </button>
                    <button onClick={isCapturing ? stopCapture : startCapture} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white ${isCapturing ? 'bg-red-500 hover:bg-red-600' : 'bg-teal-500 hover:bg-teal-600'}`}>
                        {isCapturing ? <Icon name="VideoOff" size={16} /> : <Icon name="Video" size={16} />}
                        {isCapturing ? 'Dừng Ghi' : 'Bắt đầu Ghi'}
                    </button>
                </div>
            </div>
            <div className="relative bg-gray-900 rounded-lg overflow-hidden w-full" style={{ paddingBottom: '56.25%' }}>
                <video ref={videoRef} autoPlay muted className="absolute top-0 left-0 w-full h-full object-contain" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0">
                    {settings.latest && <div className="absolute border-2 border-blue-500" style={getRegionStyle(settings.latest)} />}
                    {settings.history && <div className="absolute border-2 border-green-500" style={getRegionStyle(settings.history)} />}
                </div>
            </div>
            {/* NEW LATEST RESULTS DISPLAY */}
            <div className="mt-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">6 Kết quả Gần nhất (từ Vision)</h4>
                <div className="bg-gray-100 p-2 rounded-lg">
                    <div className="grid grid-cols-3 gap-2">
                        {results.slice(-6).map((result, index) => (
                            <div key={`${result.flip}-${index}`} className={`flex items-center justify-center w-full h-10 rounded font-mono font-bold text-lg ${getDisplayColor(result.redCount)}`}>
                                {result.redCount}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN APP COMPONENT ---

export default function App() {
  const [results, setResults] = useState(() => {
    try {
      const saved = localStorage.getItem('coinFlipHistory');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [prediction, setPrediction] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [patterns, setPatterns] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [visualHistory, setVisualHistory] = useState(false);
  const [isPredictionRunning, setIsPredictionRunning] = useState(true);
  
  const [modelPerformance, setModelPerformance] = useState(() => {
    try {
        const saved = localStorage.getItem('modelPerformance');
        return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const accuracyStats = useMemo(() => {
    const relevantResults = results.filter(r => r.predictionAtFlip);
    if (relevantResults.length === 0) return { correct: 0, total: 0, accuracy: 0 };
    const correct = relevantResults.filter(r => r.redCount === r.predictionAtFlip.value).length;
    const total = relevantResults.length;
    return { correct, total, accuracy: total > 0 ? (correct / total * 100) : 0 };
  }, [results]);

  const theoreticalProbabilities = useMemo(() => {
    const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));
    const probabilities = [];
    for (let redCount = 0; redCount <= 4; redCount++) {
      const combinations = factorial(4) / (factorial(redCount) * factorial(4 - redCount));
      probabilities.push({
        outcome: `${redCount} Đỏ`,
        probability: (combinations / 16) * 100,
      });
    }
    return probabilities;
  }, []);
  
  const statistics = useMemo(() => {
    if (results.length === 0) return {};
    const redCounts = results.map(r => r.redCount);
    const stats = {};
    for (let i = 0; i <= 4; i++) {
      const count = redCounts.filter(rc => rc === i).length;
      stats[i] = {
        observedPercent: (count / results.length * 100),
      };
    }
    return stats;
  }, [results]);

  const barChartData = useMemo(() => {
    if (!theoreticalProbabilities || Object.keys(statistics).length === 0) return [];
    return theoreticalProbabilities.map((prob, index) => ({
        name: prob.outcome,
        "Lý thuyết": prob.probability,
        "Thực tế": statistics[index]?.observedPercent || 0
    }));
  }, [theoreticalProbabilities, statistics]);

  const analyzeAndPredict = (currentResults) => {
    if (currentResults.length < 10) {
      setPrediction(null);
      setAnalysis(null);
      return;
    }
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const redCounts = currentResults.map(r => r.redCount);
      const models = {
        'Tần suất Tổng thể': (data) => {
            if (data.length === 0) return null;
            const freq = data.reduce((acc, val) => ({ ...acc, [val]: (acc[val] || 0) + 1 }), {});
            return parseInt(Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b));
        },
        'Tần suất Gần đây': (data) => models['Tần suất Tổng thể'](data.slice(-20)),
        'Chuỗi Markov (ngắn)': (data) => {
            if (data.length < 2) return null;
            const transitions = {};
            for (let i = 0; i < data.length - 1; i++) {
                const current = data[i]; const next = data[i + 1];
                if (!transitions[current]) transitions[current] = {};
                transitions[current][next] = (transitions[current][next] || 0) + 1;
            }
            const last = data[data.length - 1];
            if (transitions[last]) return parseInt(Object.keys(transitions[last]).reduce((a, b) => transitions[last][a] > transitions[last][b] ? a : b));
            return null;
        },
        'Chuỗi Markov (dài)': (data) => {
            if (data.length < 3) return null;
            const transitions = {};
            for (let i = 0; i < data.length - 2; i++) {
                const current = `${data[i]},${data[i+1]}`; const next = data[i + 2];
                if (!transitions[current]) transitions[current] = {};
                transitions[current][next] = (transitions[current][next] || 0) + 1;
            }
            const last = `${data[data.length-2]},${data[data.length-1]}`;
            if (transitions[last]) return parseInt(Object.keys(transitions[last]).reduce((a, b) => transitions[last][a] > transitions[last][b] ? a : b));
            return null;
        },
        'Đảo ngược Xu thế': (data) => 4 - data[data.length - 1],
        'Theo Xu hướng': (data) => {
            if (data.length < 3) return null;
            const lastThree = data.slice(-3);
            if (lastThree[2] > lastThree[1] && lastThree[1] > lastThree[0]) return Math.min(4, lastThree[2] + 1);
            if (lastThree[2] < lastThree[1] && lastThree[1] < lastThree[0]) return Math.max(0, lastThree[2] - 1);
            return null;
        },
      };

      const modelWeights = {};
      let totalWeight = 0;
      Object.keys(models).forEach(name => {
          const performance = modelPerformance[name] || [];
          const accuracy = performance.length > 0 ? performance.filter(p => p.correct).length / performance.length : 0.5;
          modelWeights[name] = accuracy;
          totalWeight += accuracy;
      });
      Object.keys(modelWeights).forEach(name => {
          modelWeights[name] = totalWeight > 0 ? modelWeights[name] / totalWeight : 1 / Object.keys(models).length;
      });

      const allPredictions = {};
      const weightedVotes = {};

      Object.keys(models).forEach(name => {
          const prediction = models[name](redCounts);
          allPredictions[name] = { prediction, weight: modelWeights[name] };
          if (prediction !== null) {
              weightedVotes[prediction] = (weightedVotes[prediction] || 0) + modelWeights[name];
          }
      });
      
      const mostCommon = Object.keys(weightedVotes).reduce((a, b) => weightedVotes[a] > weightedVotes[b] ? a : b, null);
      
      if (mostCommon !== null) {
        const finalPredictionValue = parseInt(mostCommon);
        const totalVotes = Object.values(weightedVotes).reduce((a,b)=>a+b,0);
        const confidence = totalVotes > 0 ? Math.round((weightedVotes[mostCommon] / totalVotes) * 100) : 0;

        setPrediction({ value: finalPredictionValue, confidence });
        
        let commentary = '';
        const last5Avg = redCounts.slice(-5).reduce((a,b)=>a+b,0)/5;
        const overallAvg = redCounts.length > 0 ? redCounts.reduce((a,b)=>a+b,0)/redCounts.length : 0;
        if(last5Avg > overallAvg + 0.5) commentary = "Gần đây có xu hướng ra nhiều Đỏ hơn trung bình.";
        if(last5Avg < overallAvg - 0.5) commentary = "Gần đây có xu hướng ra ít Đỏ hơn trung bình.";

        setAnalysis({
            methods: Object.entries(allPredictions).map(([name, {prediction, weight}]) => ({
                name,
                prediction,
                agrees: prediction === finalPredictionValue,
                weight
            })),
            commentary
        });
      }
      
      setPatterns({
        average: (redCounts.length > 0 ? redCounts.reduce((a, b) => a + b, 0) / redCounts.length : 0).toFixed(2),
        recent: redCounts.slice(-5),
      });
      setIsAnalyzing(false);
    }, 500);
  };

  const handleVisionUpdate = (latestResult, historyResults) => {
    const redCounts = results.map(r => r.redCount);
    
    const newPerformance = { ...modelPerformance };
    if (redCounts.length > 1) {
        const modelsToTest = {
            'Tần suất Tổng thể': (data) => data.length > 0 ? parseInt(Object.keys(data.reduce((acc, val) => ({ ...acc, [val]: (acc[val] || 0) + 1 }), {})).reduce((a, b) => data[a] > data[b] ? a : b)) : null,
            'Tần suất Gần đây': (data) => modelsToTest['Tần suất Tổng thể'](data.slice(-20)),
            'Chuỗi Markov (ngắn)': (data) => { if (data.length < 2) return null; const t = {}; for (let i = 0; i < data.length - 1; i++) { const c = data[i], n = data[i + 1]; if (!t[c]) t[c] = {}; t[c][n] = (t[c][n] || 0) + 1; } const l = data[data.length - 1]; if (t[l]) return parseInt(Object.keys(t[l]).reduce((a, b) => t[l][a] > t[l][b] ? a : b)); return null; },
            'Chuỗi Markov (dài)': (data) => { if (data.length < 3) return null; const t = {}; for (let i = 0; i < data.length - 2; i++) { const c = `${data[i]},${data[i+1]}`, n = data[i + 2]; if (!t[c]) t[c] = {}; t[c][n] = (t[c][n] || 0) + 1; } const l = `${data[data.length-2]},${data[data.length-1]}`; if (t[l]) return parseInt(Object.keys(t[l]).reduce((a, b) => t[l][a] > t[l][b] ? a : b)); return null; },
            'Đảo ngược Xu thế': (data) => 4 - data[data.length - 1],
            'Theo Xu hướng': (data) => { if (data.length < 3) return null; const l = data.slice(-3); if (l[2] > l[1] && l[1] > l[0]) return Math.min(4, l[2] + 1); if (l[2] < l[1] && l[1] < l[0]) return Math.max(0, l[2] - 1); return null; },
        };
        
        Object.keys(modelsToTest).forEach(name => {
            const predictionBefore = modelsToTest[name](redCounts);
            if (predictionBefore !== null) {
                if (!newPerformance[name]) newPerformance[name] = [];
                newPerformance[name].push({ prediction: predictionBefore, correct: predictionBefore === latestResult });
                if (newPerformance[name].length > 20) newPerformance[name].shift();
            }
        });
        setModelPerformance(newPerformance);
    }

    const newHistory = [...historyResults, latestResult];
    const newFullResults = newHistory.map((res, index) => ({
        flip: index + 1,
        outcome: Array(4).fill('Trắng').map((_, i) => i < res ? 'Đỏ' : 'Trắng').join(', '),
        redCount: res,
        timestamp: new Date().toLocaleTimeString(),
        isFromVision: true,
        predictionAtFlip: prediction
    }));
    setResults(newFullResults);
  };
  
  const resetResults = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử không?")) {
        setResults([]); setPrediction(null); setPatterns({}); setModelPerformance({});
        localStorage.removeItem('coinFlipHistory');
        localStorage.removeItem('modelPerformance');
    }
  };

  useEffect(() => {
    localStorage.setItem('coinFlipHistory', JSON.stringify(results));
    localStorage.setItem('modelPerformance', JSON.stringify(modelPerformance));
    if (isPredictionRunning) {
        analyzeAndPredict(results);
    }
  }, [results, isPredictionRunning]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="bg-white rounded-xl shadow-lg p-4 mb-6">
           <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Icon name="Coins" className="w-10 h-10 text-red-600" />
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">Trợ lý Dự đoán Thông minh</h1>
                <p className="text-xs md:text-sm text-gray-500">Phân tích & Dự đoán kết quả 4 đồng xu</p>
              </div>
            </div>
            <div className="flex items-center flex-wrap gap-2">
               <button onClick={resetResults} className="flex items-center gap-2 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm">
                <Icon name="RotateCcw" size={16} /> Reset
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <VisionAnalyzer onVisionUpdate={handleVisionUpdate} results={results} />
          </div>

          <div className="lg:col-span-1 space-y-6">
            <AIPredictionDisplay prediction={prediction} analysis={analysis} isAnalyzing={isAnalyzing} isPredictionRunning={isPredictionRunning} onTogglePrediction={() => setIsPredictionRunning(p => !p)} />
            <StatCard iconName="Target" title="Độ chính xác AI" value={`${accuracyStats.accuracy.toFixed(1)}%`} footer={`${accuracyStats.correct}/${accuracyStats.total} đúng`} color="border-green-500" />
            <StatCard iconName="Sigma" title="Trung bình (Đỏ/lần)" value={patterns.average || '0.00'} footer="Dựa trên toàn bộ lịch sử" color="border-blue-500" />
            <StatCard iconName="History" title="5 lần gần nhất" value="" color="border-yellow-500">
                <div className="flex items-center gap-2">
                    {(patterns.recent && patterns.recent.length > 0 ? patterns.recent : Array(5).fill('-')).map((res, i) => (
                        <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-gray-700 font-bold text-sm ${res !== '-' && res > 2 ? 'bg-red-100' : 'bg-gray-200'}`}>
                            {res}
                        </div>
                    ))}
                </div>
            </StatCard>
          </div>
        </div>
      </div>
    </div>
  );
}
