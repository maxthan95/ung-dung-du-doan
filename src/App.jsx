import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Coins, Target, Sigma, History, PieChart, Link, ArrowRightLeft, Brain, Video, VideoOff, ScanEye, CheckCircle, XCircle, Grid, RotateCcw, TrendingUp, Settings, MousePointerClick, RefreshCw, PlayCircle, PauseCircle, Timer } from 'lucide-react';

// --- HELPER COMPONENTS ---

const Icon = ({ name, ...props }) => {
    const icons = { Coins, Target, Sigma, History, PieChart, Link, ArrowRightLeft, Brain, Video, VideoOff, ScanEye, CheckCircle, XCircle, Grid, RotateCcw, TrendingUp, Settings, MousePointerClick, RefreshCw, PlayCircle, PauseCircle, Timer };
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
            'Theo Bệt': 'TrendingUp', 'Bẻ Bệt': 'ArrowRightLeft',
        };
        const isChan = prediction.value === 'Chẵn';
        content = (
            <div>
                <div className="text-center mb-6">
                    <p className="text-sm text-gray-500">Dự đoán Tối ưu</p>
                    <div className={`text-6xl font-bold my-2 ${isChan ? 'text-blue-600' : 'text-orange-500'}`}>{prediction.value.toUpperCase()}</div>
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
                                <div className={`text-sm font-bold ${method.agrees ? 'text-purple-600' : 'text-gray-500'}`}>{method.prediction || 'N/A'}</div>
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

// --- VISION SETTINGS MODAL ---
const VisionSettingsModal = ({ isOpen, onClose, onSave, stream, initialSettings }) => {
    const videoRef = useRef(null);
    const overlayRef = useRef(null);
    const [setupStep, setSetupStep] = useState('drawingLatest');
    const [tempRegion, setTempRegion] = useState(null);
    const [localSettings, setLocalSettings] = useState(initialSettings || { latest: null, history: null, timer: null, cellWidth: 2, cellHeight: 4 });
    
    const [action, setAction] = useState({ type: 'none' });

    useEffect(() => {
        if (isOpen && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
        if (isOpen) {
            setLocalSettings(initialSettings || { latest: null, history: null, timer: null, cellWidth: 2, cellHeight: 4 });
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
        
        for (const type of ['latest', 'history', 'timer']) {
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

            if (handle.includes('right')) width = Math.max(1, initialRegion.width + deltaX);
            if (handle.includes('left')) {
                width = Math.max(1, initialRegion.width - deltaX);
                x = initialRegion.x + deltaX;
            }
            if (handle.includes('bottom')) height = Math.max(1, initialRegion.height + deltaY);
            if (handle.includes('top')) {
                height = Math.max(1, initialRegion.height - deltaY);
                y = initialRegion.y + deltaY;
            }
            setLocalSettings(prev => ({ ...prev, [action.region]: { x, y, width, height } }));
        }
    };

    const handleMouseUp = () => {
        if (action.type === 'drawing' && tempRegion && tempRegion.width > 0.5 && tempRegion.height > 0.5) {
            if (setupStep === 'drawingLatest') {
                setLocalSettings(prev => ({ ...prev, latest: tempRegion }));
                setSetupStep('drawingHistory');
            } else if (setupStep === 'drawingHistory') {
                setLocalSettings(prev => ({ ...prev, history: tempRegion }));
                setSetupStep('drawingTimer');
            } else if (setupStep === 'drawingTimer') {
                setLocalSettings(prev => ({...prev, timer: tempRegion}));
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
        setSetupStep(
            regionToRedraw === 'latest' ? 'drawingLatest' : 
            regionToRedraw === 'history' ? 'drawingHistory' : 'drawingTimer'
        );
    };

    const getRegionStyle = (region) => {
        if (!region) return {};
        return { left: `${region.x}%`, top: `${region.y}%`, width: `${region.width}%`, height: `${region.height}%` };
    };
    
    const ResizableBox = ({ region, type, color }) => {
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
            </div>
        );
    };

    const Step = ({ title, isComplete, isActive, onRedraw, children }) => (
        <div className={`p-4 rounded-lg border-2 ${isActive ? 'border-yellow-400' : 'border-gray-200'} ${isComplete ? 'bg-green-50' : 'bg-gray-50'}`}>
            <div className="flex justify-between items-center">
                <h4 className="font-bold flex items-center gap-2">{isComplete ? <Icon name="CheckCircle" className="text-green-600" /> : title}</h4>
                {isComplete && <button onClick={onRedraw} className="p-1 hover:bg-gray-200 rounded"><Icon name="RefreshCw" size={14} /></button>}
            </div>
            {children && <div className="mt-2 text-sm">{children}</div>}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Cài đặt Vùng quét</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 relative bg-gray-900 rounded-lg overflow-hidden w-full" style={{ paddingBottom: '56.25%' }}>
                        <video ref={videoRef} autoPlay muted className="absolute top-0 left-0 w-full h-full object-contain" />
                        <div ref={overlayRef} className="absolute inset-0 cursor-crosshair" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
                            <ResizableBox region={localSettings.latest} type="latest" color="border-yellow-400" />
                            <ResizableBox region={localSettings.history} type="history" color="border-purple-400" />
                            <ResizableBox region={localSettings.timer} type="timer" color="border-cyan-400" />
                            {tempRegion && <div className="absolute border-4 border-dashed border-white bg-white bg-opacity-20 z-10" style={getRegionStyle(tempRegion)} />}
                        </div>
                    </div>
                    <div className="flex flex-col justify-center space-y-4">
                        <Step title="Bước 1: Vẽ vùng [4 Đồng xu]" isComplete={!!localSettings.latest} isActive={setupStep === 'drawingLatest'} onRedraw={() => handleRedraw('latest')} />
                        <Step title="Bước 2: Vẽ vùng [Lịch sử]" isComplete={!!localSettings.history} isActive={setupStep === 'drawingHistory'} onRedraw={() => handleRedraw('history')}>
                            <div className="mt-2 flex gap-2 items-center text-sm">
                                <label>Kích thước ô (%):</label>
                                <input type="number" placeholder="Rộng" value={localSettings.cellWidth} onChange={e => setLocalSettings(p => ({...p, cellWidth: parseFloat(e.target.value) || 1}))} className="w-full p-1 border rounded" />
                                <input type="number" placeholder="Cao" value={localSettings.cellHeight} onChange={e => setLocalSettings(p => ({...p, cellHeight: parseFloat(e.target.value) || 1}))} className="w-full p-1 border rounded" />
                            </div>
                        </Step>
                        <Step title="Bước 3: Vẽ vùng [Đồng hồ]" isComplete={!!localSettings.timer} isActive={setupStep === 'drawingTimer'} onRedraw={() => handleRedraw('timer')} />
                        <div className="mt-4 flex flex-col gap-2">
                            <button onClick={handleSave} disabled={!localSettings.latest || !localSettings.history || !localSettings.timer} className="w-full px-4 py-2 rounded-lg text-sm text-white bg-teal-500 hover:bg-teal-600 disabled:bg-gray-400">Lưu & Áp dụng</button>
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
    const [scanState, setScanState] = useState('IDLE');
    
    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('visionSettingsChanLe');
            return saved ? JSON.parse(saved) : { latest: null, history: null, timer: null, cellWidth: 2, cellHeight: 4 };
        } catch { return { latest: null, history: null, timer: null, cellWidth: 2, cellHeight: 4 }; }
    });

    const [debugInfo, setDebugInfo] = useState({ status: 'Đã dừng', latestCoinCount: 'N/A', historyChar: 'N/A' });
    
    const recognizeCoinColor = (imageData) => {
        const data = imageData.data;
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < data.length; i += 4) {
            r += data[i]; g += data[i + 1]; b += data[i + 2];
        }
        const pixelCount = data.length / 4;
        r /= pixelCount; g /= pixelCount; b /= pixelCount;

        if (r > 150 && g < 100 && b < 100) return 'Red';
        if (r > 180 && g > 180 && b > 180) return 'White';
        return 'Unknown';
    };

    const recognizeHistoryChar = (imageData) => {
        const data = imageData.data;
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < data.length; i += 4) {
            r += data[i]; g += data[i + 1]; b += data[i + 2];
        }
        const pixelCount = data.length / 4;
        r /= pixelCount; g /= pixelCount; b /= pixelCount;

        if (b > r + 20 && b > g + 20) return 'Chẵn';
        if (r > 150 && g < 100 && b < 100) return 'Lẻ';
        return null;
    };
    
    const toChanLe = (digit) => {
        if (digit === null) return null;
        return [0, 2, 4].includes(digit) ? 'Chẵn' : 'Lẻ';
    };

    const startCapture = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "never" }, audio: false });
            setStream(mediaStream);
            if (videoRef.current) videoRef.current.srcObject = mediaStream;
            setIsCapturing(true);
            setScanState('WAITING_FOR_TIMER_TO_DISAPPEAR');
            setDebugInfo({ status: 'Chờ đồng hồ chạy...', latestCoinCount: 'N/A', historyChar: 'N/A' });
            if (!settings.latest || !settings.history || !settings.timer) {
                setIsSettingsOpen(true);
            }
        } catch (err) { alert("Không thể bắt đầu ghi hình. Vui lòng cấp quyền."); }
    };

    const stopCapture = () => {
        if (stream) stream.getTracks().forEach(track => track.stop());
        setStream(null); setIsCapturing(false); setScanState('IDLE');
        setDebugInfo({ status: 'Đã dừng', latestCoinCount: 'N/A', historyChar: 'N/A' });
    };

    const handleSaveSettings = (newSettings) => {
        setSettings(newSettings);
        localStorage.setItem('visionSettingsChanLe', JSON.stringify(newSettings));
    };

    useEffect(() => {
        let intervalId;
        if (isCapturing && settings.timer && settings.latest && settings.history) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            intervalId = setInterval(() => {
                if (!video || video.readyState < 2) return;
                canvas.width = video.videoWidth; canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const t = settings.timer;
                const timerImageData = ctx.getImageData((t.x / 100) * canvas.width, (t.y / 100) * canvas.height, (t.width / 100) * canvas.width, (t.height / 100) * canvas.height);
                
                const averageBrightness = (imageData) => {
                    const data = imageData.data; let sum = 0;
                    for(let i=0; i<data.length; i+=4) sum += (data[i]+data[i+1]+data[i+2])/3;
                    return sum / (data.length/4);
                }
                const isTimerVisible = averageBrightness(timerImageData) > 50; 

                switch (scanState) {
                    case 'WAITING_FOR_TIMER_TO_DISAPPEAR':
                        if (!isTimerVisible) {
                            setDebugInfo(prev => ({ ...prev, status: 'Quét và đối chiếu...' }));
                            setScanState('SCANNING_AND_VALIDATING');
                        }
                        break;

                    case 'SCANNING_AND_VALIDATING':
                        // Scan latest result (coins)
                        const r = settings.latest;
                        const latestRegionWidth = (r.width / 100) * canvas.width;
                        const latestRegionHeight = (r.height / 100) * canvas.height;
                        const coinWidth = latestRegionWidth / 2;
                        const coinHeight = latestRegionHeight / 2;
                        let redCoinCount = 0;
                        const coinPositions = [{x: 0, y: 0}, {x: coinWidth, y: 0}, {x: 0, y: coinHeight}, {x: coinWidth, y: coinHeight}];
                        for (const pos of coinPositions) {
                            const imgData = ctx.getImageData((r.x / 100) * canvas.width + pos.x, (r.y / 100) * canvas.height + pos.y, coinWidth, coinHeight);
                            if (recognizeCoinColor(imgData) === 'Red') redCoinCount++;
                        }
                        const latestChanLe = toChanLe(redCoinCount);

                        // Scan history (character)
                        const h = settings.history;
                        const cellPixelWidth = (settings.cellWidth / 100) * canvas.width;
                        const cellPixelHeight = (settings.cellHeight / 100) * canvas.height;
                        const itemImageData = ctx.getImageData((h.x / 100) * canvas.width, (h.y / 100) * canvas.height, cellPixelWidth, cellPixelHeight);
                        const historyChanLe = recognizeHistoryChar(itemImageData);
                        
                        setDebugInfo({ status: 'Quét và đối chiếu...', latestCoinCount: `${redCoinCount} (${latestChanLe || ''})`, historyChar: historyChanLe || 'N/A' });
                        
                        const lastAppResult = results.length > 0 ? results[results.length - 1].outcome : null;

                        if (latestChanLe && historyChanLe && latestChanLe === historyChanLe && latestChanLe !== lastAppResult) {
                            // Validated!
                             const fullHistoryResults = [];
                             const historyPixelWidth = (h.width / 100) * canvas.width;
                             const foundChars = [];
                             for (let y = 0; y < (h.height / 100) * canvas.height - cellPixelHeight; y += cellPixelHeight / 2) {
                                 for (let x = 0; x < historyPixelWidth - cellPixelWidth; x += cellPixelWidth / 2) {
                                     const imgData = ctx.getImageData((h.x / 100) * canvas.width + x, (h.y / 100) * canvas.height + y, cellPixelWidth, cellPixelHeight);
                                     const outcome = recognizeHistoryChar(imgData);
                                     if (outcome) {
                                         const isDuplicate = foundChars.some(c => Math.abs(c.x - x) < cellPixelWidth / 2 && Math.abs(c.y - y) < cellPixelHeight / 2);
                                         if (!isDuplicate) foundChars.push({ outcome, x, y });
                                     }
                                 }
                             }
                             foundChars.sort((a, b) => {
                                 const colA = Math.floor(a.x / cellPixelWidth); const colB = Math.floor(b.x / cellPixelWidth);
                                 if (colA !== colB) return colA - colB;
                                 return a.y - b.y;
                             });

                            onVisionUpdate({ outcome: latestChanLe, redCount }, foundChars.map(c => ({ outcome: c.outcome })));
                            setDebugInfo({ status: `Đã ghi nhận: ${latestChanLe}. Chờ lượt mới...`, latestCoinCount: redCoinCount, historyChar: historyChanLe });
                            setScanState('WAITING_FOR_TIMER_TO_APPEAR');
                        }
                        
                        if (isTimerVisible) {
                            setScanState('WAITING_FOR_TIMER_TO_DISAPPEAR');
                        }
                        break;
                    
                    case 'WAITING_FOR_TIMER_TO_APPEAR':
                        if (isTimerVisible) {
                            setScanState('WAITING_FOR_TIMER_TO_DISAPPEAR');
                            setDebugInfo(prev => ({...prev, status: 'Chờ đồng hồ chạy...'}));
                        }
                        break;

                    default:
                        setScanState('IDLE');
                }
            }, 1000); 
        }
        return () => clearInterval(intervalId);
    }, [isCapturing, settings, scanState, results]); 

    const getRegionStyle = (region) => {
        if (!region) return {};
        return { left: `${region.x}%`, top: `${region.y}%`, width: `${region.width}%`, height: `${region.height}%` };
    };
    
    const getDisplayClass = (outcome) => {
        if (outcome === 'Chẵn') return 'bg-blue-500 text-white';
        if (outcome === 'Lẻ') return 'bg-red-600 text-white';
        return 'bg-gray-200 text-gray-800';
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
                    {settings.latest && <div className="absolute border-2 border-yellow-400" style={getRegionStyle(settings.latest)} />}
                    {settings.history && <div className="absolute border-2 border-purple-400" style={getRegionStyle(settings.history)} />}
                    {settings.timer && <div className="absolute border-2 border-cyan-400" style={getRegionStyle(settings.timer)} />}
                </div>
            </div>
             <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">6 Kết quả Gần nhất</h4>
                    <div className="bg-gray-100 p-2 rounded-lg">
                        <div className="grid grid-cols-6 gap-2">
                            {results.slice(-6).map((result, index) => (
                                <div key={`${result.flip}-${index}`} className={`flex flex-col items-center justify-center w-full h-12 rounded font-mono font-bold text-lg ${getDisplayClass(result.outcome)}`}>
                                     <span>{result.outcome === 'Chẵn' ? 'C' : 'L'}</span>
                                     <span className="text-xs opacity-80">{result.redCount}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg text-sm">
                     <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bảng Trạng thái AI</h4>
                     <div className="space-y-1">
                        <p><strong>Trạng thái:</strong> <span className="font-mono text-blue-600">{debugInfo.status}</span></p>
                        <p><strong>Quét Đồng xu:</strong> <span className="font-mono text-blue-600">{debugInfo.latestCoinCount}</span></p>
                        <p><strong>Quét Lịch sử:</strong> <span className="font-mono text-blue-600">{debugInfo.historyChar}</span></p>
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
      const saved = localStorage.getItem('chanLeHistory');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [prediction, setPrediction] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [patterns, setPatterns] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPredictionRunning, setIsPredictionRunning] = useState(true);
  
  const [modelPerformance, setModelPerformance] = useState(() => {
    try {
        const saved = localStorage.getItem('chanLeModelPerformance');
        return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const accuracyStats = useMemo(() => {
    const relevantResults = results.filter(r => r.predictionAtFlip);
    if (relevantResults.length === 0) return { correct: 0, total: 0, accuracy: 0 };
    const correct = relevantResults.filter(r => r.outcome === r.predictionAtFlip.value).length;
    const total = relevantResults.length;
    return { correct, total, accuracy: total > 0 ? (correct / total * 100) : 0 };
  }, [results]);
  
  const chartData = useMemo(() => {
    let chanCount = 0;
    let leCount = 0;
    return results.map((r, i) => {
        if(r.outcome === 'Chẵn') chanCount++;
        else leCount++;
        return {
            name: `Lần ${i+1}`,
            Chẵn: chanCount,
            Lẻ: leCount,
            Balance: chanCount - leCount
        }
    });
  }, [results]);


  const analyzeAndPredict = (currentResults) => {
    if (currentResults.length < 10) {
      setPrediction(null);
      setAnalysis(null);
      return;
    }
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const outcomes = currentResults.map(r => r.outcome);
      const models = {
        'Tần suất Tổng thể': (data) => {
            if (data.length === 0) return null;
            const freq = data.reduce((acc, val) => ({ ...acc, [val]: (acc[val] || 0) + 1 }), {});
            const keys = Object.keys(freq);
            if (keys.length === 0) return null;
            return keys.reduce((a, b) => freq[a] > freq[b] ? a : b);
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
            if (transitions[last]) {
                 const keys = Object.keys(transitions[last]);
                 if(keys.length === 0) return null;
                 return keys.reduce((a, b) => transitions[last][a] > transitions[last][b] ? a : b);
            }
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
            if (transitions[last]) {
                const keys = Object.keys(transitions[last]);
                if(keys.length === 0) return null;
                return keys.reduce((a, b) => transitions[last][a] > transitions[last][b] ? a : b);
            }
            return null;
        },
        'Theo Bệt': (data) => data.length > 0 ? data[data.length - 1] : null,
        'Bẻ Bệt': (data) => data.length > 0 ? (data[data.length - 1] === 'Chẵn' ? 'Lẻ' : 'Chẵn') : null,
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
          const prediction = models[name](outcomes);
          allPredictions[name] = { prediction, weight: modelWeights[name] };
          if (prediction !== null) {
              weightedVotes[prediction] = (weightedVotes[prediction] || 0) + modelWeights[name];
          }
      });
      
      const mostCommon = Object.keys(weightedVotes).length > 0 ? Object.keys(weightedVotes).reduce((a, b) => weightedVotes[a] > weightedVotes[b] ? a : b, null) : null;
      
      if (mostCommon !== null) {
        const finalPredictionValue = mostCommon;
        const totalVotes = Object.values(weightedVotes).reduce((a,b)=>a+b,0);
        const confidence = totalVotes > 0 ? Math.round((weightedVotes[mostCommon] / totalVotes) * 100) : 0;

        setPrediction({ value: finalPredictionValue, confidence });
        
        setAnalysis({
            methods: Object.entries(allPredictions).map(([name, {prediction, weight}]) => ({
                name,
                prediction,
                agrees: prediction === finalPredictionValue,
                weight
            })),
        });
      }
      
      setPatterns({
        recent: outcomes.slice(-5),
        ratio: {
            chan: outcomes.filter(o => o === 'Chẵn').length,
            le: outcomes.filter(o => o === 'Lẻ').length
        }
      });
      setIsAnalyzing(false);
    }, 500);
  };

  const handleVisionUpdate = (latestResult, historyResults) => {
    const currentFullHistory = results;
    const outcomes = currentFullHistory.map(r => r.outcome);
    
    const newPerformance = { ...modelPerformance };
    if (outcomes.length > 1) {
        const modelsToTest = {
            'Tần suất Tổng thể': (data) => {
                if (data.length === 0) return null;
                const freq = data.reduce((acc, val) => ({ ...acc, [val]: (acc[val] || 0) + 1 }), {});
                const keys = Object.keys(freq);
                if (keys.length === 0) return null;
                return keys.reduce((a, b) => freq[a] > freq[b] ? a : b);
            },
            'Tần suất Gần đây': (data) => modelsToTest['Tần suất Tổng thể'](data.slice(-20)),
            'Chuỗi Markov (ngắn)': (data) => { 
                if (data.length < 2) return null; 
                const t = {}; 
                for (let i = 0; i < data.length - 1; i++) { 
                    const c = data[i], n = data[i + 1]; 
                    if (!t[c]) t[c] = {}; 
                    t[c][n] = (t[c][n] || 0) + 1; 
                } 
                const l = data[data.length - 1]; 
                if (t[l]) {
                    const keys = Object.keys(t[l]);
                    if (keys.length === 0) return null;
                    return keys.reduce((a, b) => t[l][a] > t[l][b] ? a : b);
                } 
                return null; 
            },
            'Chuỗi Markov (dài)': (data) => { 
                if (data.length < 3) return null; 
                const t = {}; 
                for (let i = 0; i < data.length - 2; i++) { 
                    const c = `${data[i]},${data[i+1]}`, n = data[i + 2]; 
                    if (!t[c]) t[c] = {}; 
                    t[c][n] = (t[c][n] || 0) + 1; 
                } 
                const l = `${data[data.length-2]},${data[data.length-1]}`; 
                if (t[l]) {
                    const keys = Object.keys(t[l]);
                    if (keys.length === 0) return null;
                    return keys.reduce((a, b) => t[l][a] > t[l][b] ? a : b);
                } 
                return null; 
            },
            'Theo Bệt': (data) => data.length > 0 ? data[data.length-1] : null,
            'Bẻ Bệt': (data) => data.length > 0 ? (data[data.length - 1] === 'Chẵn' ? 'Lẻ' : 'Chẵn') : null,
        };
        
        Object.keys(modelsToTest).forEach(name => {
            const predictionBefore = modelsToTest[name](outcomes);
            if (predictionBefore !== null) {
                if (!newPerformance[name]) newPerformance[name] = [];
                newPerformance[name].push({ prediction: predictionBefore, correct: predictionBefore === latestResult.outcome });
                if (newPerformance[name].length > 20) newPerformance[name].shift();
            }
        });
        setModelPerformance(newPerformance);
    }

    const newHistory = [...historyResults, latestResult];
    const newFullResults = newHistory.map((res, index) => ({
        flip: index + 1,
        outcome: res.outcome,
        redCount: res.redCount,
        timestamp: new Date().toLocaleTimeString(),
        isFromVision: true,
        predictionAtFlip: (index === newHistory.length - 1) ? prediction : null
    }));
    setResults(newFullResults);
  };
  
  const resetResults = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử không?")) {
        setResults([]); setPrediction(null); setPatterns({}); setModelPerformance({});
        localStorage.removeItem('chanLeHistory');
        localStorage.removeItem('chanLeModelPerformance');
    }
  };

  useEffect(() => {
    localStorage.setItem('chanLeHistory', JSON.stringify(results));
    localStorage.setItem('chanLeModelPerformance', JSON.stringify(modelPerformance));
    if (isPredictionRunning) {
        analyzeAndPredict(results);
    } else {
        setPrediction(null);
        setAnalysis(null);
    }
  }, [results, isPredictionRunning]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="bg-white rounded-xl shadow-lg p-4 mb-6">
           <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Icon name="Coins" className="w-10 h-10 text-blue-600" />
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">Trợ lý Phân tích Chẵn Lẻ</h1>
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
             <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Xu hướng Chẵn / Lẻ</h2>
                {results.length > 2 ? (
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Chẵn" stroke="#3b82f6" strokeWidth={2} />
                        <Line type="monotone" dataKey="Lẻ" stroke="#f97316" strokeWidth={2} />
                        <Line type="monotone" dataKey="Balance" stroke="#82ca9d" strokeDasharray="3 3" name="Cân bằng (Chẵn-Lẻ)" />
                    </LineChart>
                </ResponsiveContainer>
                ) : <div className="text-center text-gray-500 py-16">Chưa đủ dữ liệu để vẽ biểu đồ.</div>}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <AIPredictionDisplay prediction={prediction} analysis={analysis} isAnalyzing={isAnalyzing} isPredictionRunning={isPredictionRunning} onTogglePrediction={() => setIsPredictionRunning(p => !p)} />
            <StatCard iconName="Target" title="Độ chính xác AI" value={`${accuracyStats.accuracy.toFixed(1)}%`} footer={`${accuracyStats.correct}/${accuracyStats.total} đúng`} color="border-green-500" />
            <StatCard iconName="Sigma" title="Tỷ lệ Chẵn / Lẻ" value={`${patterns.ratio?.chan || 0} / ${patterns.ratio?.le || 0}`} footer="Dựa trên toàn bộ lịch sử" color="border-purple-500" />
            <StatCard iconName="History" title="5 lần gần nhất" value="" color="border-yellow-500">
                <div className="flex items-center gap-2">
                    {(patterns.recent && patterns.recent.length > 0 ? patterns.recent : Array(5).fill('-')).map((res, i) => (
                        <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${res === 'Chẵn' ? 'bg-blue-500 text-white' : res === 'Lẻ' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                            {res === 'Chẵn' ? 'C' : res === 'Lẻ' ? 'L' : '-'}
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
}

