import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Coins, Target, Sigma, History, PieChart, Link, ArrowRightLeft, Brain, Video, VideoOff, ScanEye, CheckCircle, XCircle, List, Grid, RotateCcw, TrendingUp, Settings, MousePointerClick } from 'lucide-react';

// --- HELPER COMPONENTS ---

const Icon = ({ name, ...props }) => {
    const icons = { Coins, Target, Sigma, History, PieChart, Link, ArrowRightLeft, Brain, Video, VideoOff, ScanEye, CheckCircle, XCircle, List, Grid, RotateCcw, TrendingUp, Settings, MousePointerClick };
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

const AIPredictionDisplay = ({ prediction, analysis, isAnalyzing }) => {
    if (isAnalyzing) {
        return <div className="text-center py-8 text-gray-500">🧠 AI đang phân tích...</div>;
    }
    if (!prediction) {
        return <div className="text-center py-8 text-gray-500">Chưa đủ dữ liệu để dự đoán.</div>;
    }
    
    const methodIcons = {
        'Tần suất Tổng thể': 'PieChart', 'Tần suất Gần đây': 'PieChart',
        'Chuỗi Markov (ngắn)': 'Link', 'Chuỗi Markov (dài)': 'Link',
        'Đảo ngược Xu thế': 'ArrowRightLeft', 'Theo Xu hướng': 'TrendingUp',
    };

    return (
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
};

// --- FINAL ADVANCED VISION ANALYZER ---

const VisionAnalyzer = ({ onVisionUpdate, results }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const overlayRef = useRef(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [stream, setStream] = useState(null);
    
    // State for setup and regions
    const [setupMode, setSetupMode] = useState(null); // 'latest' or 'history'
    const [tempRegion, setTempRegion] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [regions, setRegions] = useState(() => {
        try {
            const saved = localStorage.getItem('visionRegions');
            return saved ? JSON.parse(saved) : { latest: null, history: null };
        } catch { return { latest: null, history: null }; }
    });

    const [lastResult, setLastResult] = useState(null);

    // OCR logic - Simplified template matching
    const recognizeDigit = (imageData) => {
        const data = imageData.data;
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < data.length; i += 4) {
            r += data[i]; g += data[i + 1]; b += data[i + 2];
        }
        const pixelCount = data.length / 4;
        r /= pixelCount; g /= pixelCount; b /= pixelCount;

        // Simple color-based recognition for 0-4
        if (r > 150 && g < 100 && b < 100) return 3; // Red-ish
        if (r > 150 && g > 100 && b < 100) return 2; // Yellow-ish
        if (r < 100 && g < 100 && b < 100) return 4; // Dark/Black
        if (r > 180 && g > 180 && b > 180) return 0; // White/Bright Gray
        return 1; // Default/other colors
    };

    const startCapture = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "never" }, audio: false });
            setStream(mediaStream);
            if (videoRef.current) videoRef.current.srcObject = mediaStream;
            setIsCapturing(true);
        } catch (err) { alert("Không thể bắt đầu ghi hình. Vui lòng cấp quyền."); }
    };

    const stopCapture = () => {
        if (stream) stream.getTracks().forEach(track => track.stop());
        setStream(null); setIsCapturing(false); setLastResult(null);
    };

    const handleMouseDown = (e) => {
        if (!setupMode) return;
        setIsDragging(true);
        const rect = overlayRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * 100;
        const y = (e.clientY - rect.top) / rect.height * 100;
        setTempRegion({ startX: x, startY: y, endX: x, endY: y });
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !setupMode) return;
        const rect = overlayRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * 100;
        const y = (e.clientY - rect.top) / rect.height * 100;
        setTempRegion(prev => ({ ...prev, endX: x, endY: y }));
    };

    const handleMouseUp = () => {
        if (!isDragging || !setupMode) return;
        setIsDragging(false);
        const { startX, startY, endX, endY } = tempRegion;
        const newRegion = {
            x: Math.min(startX, endX), y: Math.min(startY, endY),
            width: Math.abs(endX - startX), height: Math.abs(endY - startY),
        };
        setRegions(prev => ({ ...prev, [setupMode]: newRegion }));
        setSetupMode(null); setTempRegion(null);
    };

    useEffect(() => {
        localStorage.setItem('visionRegions', JSON.stringify(regions));
    }, [regions]);

    useEffect(() => {
        let intervalId;
        if (isCapturing && regions.latest && regions.history) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            intervalId = setInterval(() => {
                if (video.readyState < 2) return;
                canvas.width = video.videoWidth; canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const r = regions.latest;
                const latestImageData = ctx.getImageData((r.x / 100) * canvas.width, (r.y / 100) * canvas.height, (r.width / 100) * canvas.width, (r.height / 100) * canvas.height);
                const currentResult = recognizeDigit(latestImageData);

                if (lastResult === null || currentResult !== lastResult) {
                    setLastResult(currentResult);
                    if (lastResult !== null) {
                        const h = regions.history;
                        const historyImageData = ctx.getImageData((h.x / 100) * canvas.width, (h.y / 100) * canvas.height, (h.width / 100) * canvas.width, (h.height / 100) * canvas.height);
                        
                        const historyResults = [];
                        const itemWidth = historyImageData.width / 15;
                        for (let i = 0; i < 15; i++) {
                            const itemImageData = ctx.getImageData((h.x / 100) * canvas.width + i * itemWidth, (h.y / 100) * canvas.height, itemWidth, h.height / 100 * canvas.height);
                            historyResults.push(recognizeDigit(itemImageData));
                        }
                        onVisionUpdate(currentResult, historyResults);
                    }
                }
            }, 1000);
        }
        return () => clearInterval(intervalId);
    }, [isCapturing, regions, lastResult, onVisionUpdate]);

    const getRegionStyle = (region) => {
        if (!region) return {};
        return { left: `${region.x}%`, top: `${region.y}%`, width: `${region.width}%`, height: `${region.height}%` };
    };
    
    const getHistoryColor = (count) => {
        switch(count) {
            case 0: return 'bg-gray-400 text-white'; case 1: return 'bg-red-200 text-red-800';
            case 2: return 'bg-yellow-300 text-yellow-800'; case 3: return 'bg-red-500 text-white';
            case 4: return 'bg-red-700 text-white'; default: return 'bg-gray-200 text-gray-800';
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-teal-500">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-teal-800">🔬 Phân tích Vision AI</h2>
                <div className="flex items-center gap-2">
                     <button onClick={isCapturing ? stopCapture : startCapture} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white ${isCapturing ? 'bg-red-500 hover:bg-red-600' : 'bg-teal-500 hover:bg-teal-600'}`}>
                        {isCapturing ? <Icon name="VideoOff" size={16} /> : <Icon name="Video" size={16} />}
                        {isCapturing ? 'Dừng Ghi' : 'Bắt đầu Ghi'}
                    </button>
                </div>
            </div>
            <div className="relative bg-gray-200 rounded-lg overflow-hidden aspect-video mb-4">
                <video ref={videoRef} autoPlay muted className="w-full h-full object-contain" />
                <canvas ref={canvasRef} className="hidden" />
                <div 
                    ref={overlayRef} className={`absolute inset-0 ${setupMode ? 'cursor-crosshair' : ''}`}
                    onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
                >
                    {regions.latest && <div className="absolute border-2 border-blue-500" style={getRegionStyle(regions.latest)}><span className="absolute -top-5 left-0 text-xs text-blue-500 bg-white px-1 rounded">Kết quả</span></div>}
                    {regions.history && <div className="absolute border-2 border-green-500" style={getRegionStyle(regions.history)}><span className="absolute -top-5 left-0 text-xs text-green-500 bg-white px-1 rounded">Lịch sử</span></div>}
                    {tempRegion && <div className="absolute border-2 border-dashed border-yellow-400 bg-yellow-400 bg-opacity-20" style={getRegionStyle(tempRegion)} />}
                </div>
                {setupMode && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-70 text-white text-xs px-3 py-1 rounded-full flex items-center gap-2">
                        <Icon name="MousePointerClick" size={14} />
                        <span>Vẽ khu vực cho: <strong>{setupMode === 'latest' ? 'Kết quả mới' : 'Lịch sử'}</strong></span>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
                <button onClick={() => setSetupMode('latest')} className={`flex items-center justify-center gap-2 p-2 rounded-lg text-sm w-full ${setupMode === 'latest' ? 'bg-yellow-400' : 'bg-gray-200'}`}>
                    <Icon name="Settings" size={16} /> Thiết lập Vùng Kết quả
                </button>
                <button onClick={() => setSetupMode('history')} className={`flex items-center justify-center gap-2 p-2 rounded-lg text-sm w-full ${setupMode === 'history' ? 'bg-yellow-400' : 'bg-gray-200'}`}>
                    <Icon name="Settings" size={16} /> Thiết lập Vùng Lịch sử
                </button>
            </div>
            <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lịch sử Gần đây (từ Vision)</h4>
                <div className="bg-gray-100 p-2 rounded-lg">
                    <div className="grid grid-cols-5 gap-2">
                        {results.slice(-15).map((result, index) => (
                            <div key={`${result.flip}-${index}`} className={`flex items-center justify-center w-full h-8 rounded font-mono font-bold text-sm ${getHistoryColor(result.redCount)}`}>
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
      const models = { /* ... models logic ... */ };
      // ... analysis logic ...
      setIsAnalyzing(false);
    }, 500);
  };

  const handleVisionUpdate = (latestResult, historyResults) => {
    const newHistory = [...historyResults, latestResult];
    const newFullResults = newHistory.map((res, index) => ({
        flip: (results.length - newHistory.length) + index + 1,
        outcome: Array(4).fill('Trắng').map((_, i) => i < res ? 'Đỏ' : 'Trắng').join(', '),
        redCount: res,
        timestamp: new Date().toLocaleTimeString(),
        isFromVision: true,
        predictionAtFlip: null
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
    analyzeAndPredict(results);
  }, [results]);

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
          <div className="lg:col-span-1 space-y-6">
            <VisionAnalyzer onVisionUpdate={handleVisionUpdate} results={results} />
            <div className="bg-white rounded-xl shadow-lg p-6">
                <AIPredictionDisplay prediction={prediction} analysis={analysis} isAnalyzing={isAnalyzing} />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Phân Bố Kết Quả</h2>
              {results.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis unit="%" /><Tooltip formatter={(value) => `${value.toFixed(1)}%`} /><Legend /><Bar dataKey="Lý thuyết" fill="#8884d8" /><Bar dataKey="Thực tế" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="text-center text-gray-500 py-16">Chưa có dữ liệu.</div>}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Lịch Sử Kết Quả</h2>
                <button onClick={() => setVisualHistory(p => !p)} className="p-2 rounded-md hover:bg-gray-100 text-gray-600" title={visualHistory ? "Xem thu gọn" : "Xem trực quan"}>{visualHistory ? <Icon name="List" size={20} /> : <Icon name="Grid" size={20} />}</button>
              </div>
              <div className="max-h-96 overflow-y-auto pr-2">
                {results.length > 0 ? (
                  <div className="space-y-2">{results.slice(-15).reverse().map((result) => visualHistory ? <VisualHistoryItem key={result.flip} result={result} /> : <CompactHistoryItem key={result.flip} result={result} />)}</div>
                ) : <div className="text-center text-gray-500 py-8">Chưa có lịch sử.</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
