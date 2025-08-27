import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Coins, Target, Sigma, History, PieChart, Link, ArrowRightLeft, Brain, Video, VideoOff, ScanEye, CheckCircle, XCircle, List, Grid, RotateCcw } from 'lucide-react';

const Icon = ({ name, ...props }) => {
    const icons = { Coins, Target, Sigma, History, PieChart, Link, ArrowRightLeft, Brain, Video, VideoOff, ScanEye, CheckCircle, XCircle, List, Grid, RotateCcw };
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
        return <div className="text-center py-8 text-gray-500">Đang phân tích...</div>;
    }
    if (!prediction) {
        return <div className="text-center py-8 text-gray-500">Chưa đủ dữ liệu để dự đoán.</div>;
    }
    
    const methodIcons = {
        'Tần suất cao nhất': 'PieChart',
        'Chuỗi Markov': 'Link',
        'Đảo ngược xu thế': 'ArrowRightLeft'
    };

    return (
        <div>
            <div className="text-center mb-6">
                <p className="text-sm text-gray-500">Dự đoán cho lần tiếp theo</p>
                <div className="text-6xl font-bold text-purple-600 my-2">{prediction.value} Đỏ</div>
                <div className="flex items-center justify-center space-x-2 bg-green-100 text-green-700 px-3 py-1 rounded-full w-fit mx-auto">
                    <Icon name="Target" className="w-4 h-4" />
                    <span className="text-sm font-medium">Độ tin cậy: {prediction.confidence}%</span>
                </div>
            </div>
            <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase">Lý do phân tích</h4>
                {analysis.methods.map(method => (
                    <div key={method.name} className={`flex items-center justify-between p-3 rounded-lg ${method.agrees ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                            <Icon name={methodIcons[method.name] || 'Brain'} className={`w-5 h-5 ${method.agrees ? 'text-purple-600' : 'text-gray-400'}`} />
                            <span className="text-sm text-gray-700">{method.name}</span>
                        </div>
                        <div className={`text-sm font-bold ${method.agrees ? 'text-purple-600' : 'text-gray-500'}`}>{method.prediction !== null ? `${method.prediction} Đỏ` : 'N/A'}</div>
                    </div>
                ))}
            </div>
            {analysis.commentary && (
                <p className="mt-4 text-xs text-center text-gray-600 bg-gray-100 p-3 rounded-lg">{analysis.commentary}</p>
            )}
        </div>
    );
};

const VisionAnalyzer = ({ onNewResult }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [stream, setStream] = useState(null);
    const [analysisRegions, setAnalysisRegions] = useState([
        { x: 25, y: 25, color: null }, { x: 75, y: 25, color: null },
        { x: 25, y: 75, color: null }, { x: 75, y: 75, color: null },
    ]);
    const [lastResult, setLastResult] = useState(null);

    const startCapture = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "never" }, audio: false });
            setStream(mediaStream);
            if (videoRef.current) videoRef.current.srcObject = mediaStream;
            setIsCapturing(true);
        } catch (err) {
            console.error("Error starting screen capture:", err);
            alert("Không thể bắt đầu ghi hình. Vui lòng cấp quyền chia sẻ màn hình.");
        }
    };

    const stopCapture = () => {
        if (stream) stream.getTracks().forEach(track => track.stop());
        setStream(null);
        setIsCapturing(false);
        setLastResult(null);
    };

    useEffect(() => {
        let intervalId;
        if (isCapturing && videoRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            intervalId = setInterval(() => {
                if (video.readyState < 2) return;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                let currentRedCount = 0;
                const newRegions = analysisRegions.map(region => {
                    const pixelX = Math.floor((region.x / 100) * canvas.width);
                    const pixelY = Math.floor((region.y / 100) * canvas.height);
                    const pixelData = ctx.getImageData(pixelX, pixelY, 1, 1).data;
                    const [r, g, b] = pixelData;
                    
                    if (r > 150 && g < 100 && b < 100) currentRedCount++;
                    return { ...region, color: `rgb(${r},${g},${b})` };
                });
                
                setAnalysisRegions(newRegions);

                if (lastResult === null || currentRedCount !== lastResult) {
                    setLastResult(currentRedCount);
                    if (lastResult !== null) onNewResult(currentRedCount);
                }
            }, 500);
        }
        return () => clearInterval(intervalId);
    }, [isCapturing, analysisRegions, lastResult, onNewResult]);

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-teal-500">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-teal-800">🔬 Phân tích Vision AI</h2>
                <button onClick={isCapturing ? stopCapture : startCapture} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white ${isCapturing ? 'bg-red-500 hover:bg-red-600' : 'bg-teal-500 hover:bg-teal-600'}`}>
                    {isCapturing ? <Icon name="VideoOff" size={16} /> : <Icon name="Video" size={16} />}
                    {isCapturing ? 'Dừng Ghi' : 'Bắt đầu Ghi'}
                </button>
            </div>
            <div className="relative bg-gray-200 rounded-lg overflow-hidden aspect-video">
                <video ref={videoRef} autoPlay muted className="w-full h-full object-contain" />
                <canvas ref={canvasRef} className="hidden" />
                {isCapturing && (
                    <div className="absolute inset-0">
                        {analysisRegions.map((region, i) => (
                            <div key={i} className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 border-2 rounded-full flex items-center justify-center" style={{ left: `${region.x}%`, top: `${region.y}%`, borderColor: region.color || 'magenta' }}>
                               <div className="w-1 h-1 bg-white rounded-full"></div>
                            </div>
                        ))}
                    </div>
                )}
                {!isCapturing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-4 text-center">
                        <Icon name="ScanEye" size={48} className="mb-2 opacity-50"/>
                        <p className="font-medium">Chưa ghi hình</p>
                        <p className="text-xs">Chọn cửa sổ ứng dụng bạn muốn phân tích.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const CompactHistoryItem = ({ result }) => (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
        <div className="flex items-center gap-3">
            <span className="font-medium text-gray-600">#{result.flip}</span>
            <div className="flex gap-1">
                {result.outcome.split(', ').map((coin, i) => (
                    <div key={i} className={`w-5 h-5 rounded-full ${coin === 'Đỏ' ? 'bg-red-500' : 'bg-gray-300'}`} />
                ))}
            </div>
            <span className="font-bold text-blue-600">{result.redCount} Đỏ</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
            {result.predictionAtFlip && (
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${result.redCount === result.predictionAtFlip.value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {result.redCount === result.predictionAtFlip.value ? <Icon name="CheckCircle" size={12}/> : <Icon name="XCircle" size={12}/>}
                    <span>Dự đoán: {result.predictionAtFlip.value}</span>
                </div>
            )}
            {result.isFromVision && <Icon name="ScanEye" size={12} className="text-purple-500" title="Kết quả từ Vision AI"/>}
            <span>{result.timestamp}</span>
        </div>
    </div>
);

const VisualHistoryItem = ({ result }) => (
    <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg mb-2 shadow-sm">
        <div className="flex items-center gap-4">
            <span className="font-bold text-gray-700 text-base w-10 text-center">#{result.flip}</span>
            <div className="flex gap-2">
                {result.outcome.split(', ').map((coin, i) => (
                    <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-inner ${coin === 'Đỏ' ? 'bg-red-500 text-white' : 'bg-gray-300 text-gray-700'}`}>
                        {coin === 'Đỏ' ? 'ĐỎ' : 'TRẮNG'}
                    </div>
                ))}
            </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs text-gray-500">
            <div className="font-bold text-lg text-blue-600">{result.redCount} Đỏ</div>
            {result.predictionAtFlip && (
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${result.redCount === result.predictionAtFlip.value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {result.redCount === result.predictionAtFlip.value ? <Icon name="CheckCircle" size={12}/> : <Icon name="XCircle" size={12}/>}
                    <span>Dự đoán: {result.predictionAtFlip.value}</span>
                </div>
            )}
            {result.isFromVision && <Icon name="ScanEye" size={12} className="text-purple-500" title="Kết quả từ Vision AI"/>}
            <span>{result.timestamp}</span>
        </div>
    </div>
);

export default function App() {
  const [results, setResults] = useState(() => {
    try {
      const savedResults = localStorage.getItem('coinFlipHistory');
      return savedResults ? JSON.parse(savedResults) : [];
    } catch (error) { return []; }
  });
  const [prediction, setPrediction] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [patterns, setPatterns] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [visualHistory, setVisualHistory] = useState(false);
  
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
    if (currentResults.length < 5) {
      setPrediction(null);
      setAnalysis(null);
      return;
    }
    setIsAnalyzing(true);
    setTimeout(() => {
      const redCounts = currentResults.map(r => r.redCount);
      
      const predictByFrequency = (data) => {
          if (data.length === 0) return null;
          const freq = data.reduce((acc, val) => ({ ...acc, [val]: (acc[val] || 0) + 1 }), {});
          return parseInt(Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b));
      };

      const predictByMarkov = (data) => {
        if (data.length < 2) return null;
        const transitions = {};
        for (let i = 0; i < data.length - 1; i++) {
            if (!transitions[data[i]]) transitions[data[i]] = {};
            transitions[data[i]][data[i+1]] = (transitions[data[i]][data[i+1]] || 0) + 1;
        }
        const last = data[data.length - 1];
        if (transitions[last]) return parseInt(Object.keys(transitions[last]).reduce((a, b) => transitions[last][a] > transitions[last][b] ? a : b));
        return null;
      };

      const allPredictions = {
        'Tần suất cao nhất': predictByFrequency(redCounts),
        'Chuỗi Markov': predictByMarkov(redCounts.slice(-20)),
        'Đảo ngược xu thế': 4 - redCounts[redCounts.length - 1]
      };
      
      const validPredictions = Object.values(allPredictions).filter(p => p !== null);
      const counts = validPredictions.reduce((acc, p) => ({ ...acc, [p]: (acc[p] || 0) + 1 }), {});
      const mostCommon = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, null);
      
      if (mostCommon !== null) {
        const finalPredictionValue = parseInt(mostCommon);
        setPrediction({
          value: finalPredictionValue,
          confidence: Math.round((counts[mostCommon] / validPredictions.length) * 100),
        });
        
        let commentary = '';
        const last5Avg = redCounts.slice(-5).reduce((a,b)=>a+b,0)/5;
        const overallAvg = redCounts.length > 0 ? redCounts.reduce((a,b)=>a+b,0)/redCounts.length : 0;
        if(last5Avg > overallAvg + 0.5) commentary = "Gần đây có xu hướng ra nhiều Đỏ hơn trung bình.";
        if(last5Avg < overallAvg - 0.5) commentary = "Gần đây có xu hướng ra ít Đỏ hơn trung bình.";

        setAnalysis({
            methods: Object.entries(allPredictions).map(([name, prediction]) => ({
                name,
                prediction,
                agrees: prediction === finalPredictionValue
            })),
            commentary
        });
      }
      
      setPatterns({
        average: (currentResults.length > 0 ? redCounts.reduce((a, b) => a + b, 0) / redCounts.length : 0).toFixed(2),
        recent: redCounts.slice(-5),
      });
      setIsAnalyzing(false);
    }, 500);
  };

  const addNewResult = (redCount, isFromVision = false) => {
    const outcome = Array(4).fill('Trắng').map((_, i) => i < redCount ? 'Đỏ' : 'Trắng');
    setResults(prev => {
        const newResult = {
            flip: (prev[prev.length - 1]?.flip || 0) + 1,
            outcome: outcome.join(', '),
            redCount: redCount,
            timestamp: new Date().toLocaleTimeString(),
            isImported: !isFromVision,
            isFromVision: isFromVision,
            predictionAtFlip: prediction
        };
        return [...prev, newResult].slice(-100);
    });
  };
  
  const resetResults = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử không?")) {
        setResults([]); setPrediction(null); setPatterns({});
        localStorage.removeItem('coinFlipHistory');
    }
  };

  useEffect(() => {
    localStorage.setItem('coinFlipHistory', JSON.stringify(results));
    analyzeAndPredict(results);
  }, [results]);

  const flipCount = results.length;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="bg-white rounded-xl shadow-lg p-4 mb-6">
           <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Icon name="Coins" className="w-10 h-10 text-red-600" />
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">Trợ lý Dự đoán Xác suất</h1>
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
            <VisionAnalyzer onNewResult={(redCount) => addNewResult(redCount, true)} />
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