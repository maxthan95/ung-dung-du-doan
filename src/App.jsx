import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Coins, Target, Sigma, History, PieChart, Link, ArrowRightLeft, Brain, CheckCircle, RotateCcw, TrendingUp, PlayCircle, PauseCircle, Video, VideoOff, List, Grid as GridIcon } from 'lucide-react';

// --- HELPER COMPONENTS ---

const Icon = ({ name, ...props }) => {
    const icons = { Coins, Target, Sigma, History, PieChart, Link, ArrowRightLeft, Brain, CheckCircle, RotateCcw, TrendingUp, PlayCircle, PauseCircle, Video, VideoOff, List, Grid: GridIcon };
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
                    <div className={`text-5xl font-bold my-2 ${isChan ? 'text-blue-600' : 'text-orange-500'}`}>{prediction.value.toUpperCase()}</div>
                    <div className="flex items-center justify-center space-x-2 bg-green-100 text-green-700 px-3 py-1 rounded-full w-fit mx-auto">
                        <Icon name="Target" className="w-4 h-4" />
                        <span className="text-sm font-medium">Độ tin cậy: {prediction.confidence}%</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phân tích Chi tiết</h4>
                    {analysis.methods.map(method => (
                        <div key={method.name} className={`p-2 rounded-lg ${method.agrees ? 'bg-purple-50' : 'bg-gray-50'}`}>
                           <div className="flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                    <Icon name={methodIcons[method.name] || 'Brain'} className={`w-4 h-4 ${method.agrees ? 'text-purple-600' : 'text-gray-400'}`} />
                                    <span className="text-xs text-gray-700 font-medium">{method.name}</span>
                                </div>
                                <div className={`text-xs font-bold ${method.agrees ? 'text-purple-600' : 'text-gray-500'}`}>{method.prediction || 'N/A'}</div>
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


// --- Manual Input Component ---
const ManualInput = ({ onNewResult }) => {
    const handleButtonClick = (redCount) => {
        onNewResult(redCount);
    };

    const buttonStyle = "flex-1 p-3 rounded-lg text-base font-bold transition-transform transform hover:scale-105";
    const colors = [
        "bg-gray-200 text-gray-800", // 0
        "bg-blue-500 text-white",     // 1
        "bg-green-500 text-white",    // 2
        "bg-yellow-500 text-white",   // 3
        "bg-red-500 text-white"       // 4
    ];

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-teal-500">
            <h2 className="text-lg font-semibold text-teal-800 mb-4">Nhập Kết quả</h2>
            <div className="flex gap-2">
                {[0, 1, 2, 3, 4].map(num => (
                    <button key={num} onClick={() => handleButtonClick(num)} className={`${buttonStyle} ${colors[num]}`}>
                        {num}
                    </button>
                ))}
            </div>
        </div>
    );
};

// --- History Display Components ---
const GridHistoryDisplay = ({ results }) => {
    const gridRef = useRef(null);

    const getOutcomeClass = (outcome) => {
        if (outcome === 'Chẵn') return 'bg-blue-500 text-white';
        if (outcome === 'Lẻ') return 'bg-orange-500 text-white';
        return 'bg-gray-200 text-gray-400';
    };

    const gridColumns = useMemo(() => {
        const columns = [];
        if (results.length === 0) return columns;

        let currentColumn = [];
        for (let i = 0; i < results.length; i++) {
            if (i > 0 && results[i].outcome !== results[i-1].outcome) {
                columns.push(currentColumn);
                currentColumn = [];
            }
            currentColumn.push(results[i]);
        }
        columns.push(currentColumn);
        return columns;
    }, [results]);
    
    useEffect(() => {
        if (gridRef.current) {
            gridRef.current.scrollLeft = gridRef.current.scrollWidth;
        }
    }, [gridColumns]);

    return (
        <div ref={gridRef} className="bg-gray-100 p-2 rounded-lg overflow-x-auto flex flex-row-reverse gap-1">
            {results.length > 0 ? (
                gridColumns.slice().reverse().map((column, colIndex) => (
                    <div key={colIndex} className="flex flex-col gap-1">
                       {column.map(result => (
                           <div 
                               key={result.flip} 
                               className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm ${getOutcomeClass(result.outcome)}`}
                               title={`Lần #${result.flip}: ${result.redCount} đỏ`}
                           >
                               {result.outcome === 'Chẵn' ? 'C' : 'L'}
                           </div>
                       ))}
                    </div>
                ))
            ) : <div className="text-center text-gray-500 py-8 w-full">Chưa có lịch sử.</div>}
        </div>
    );
};

const TableHistoryDisplay = ({ results }) => {
    const endOfHistoryRef = useRef(null);

    useEffect(() => {
        endOfHistoryRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [results]);

    const getOutcomeClass = (outcome) => {
        if (outcome === 'Chẵn') return 'bg-blue-100 text-blue-800';
        if (outcome === 'Lẻ') return 'bg-orange-100 text-orange-800';
        return '';
    };

    return (
        <div className="max-h-[30rem] overflow-y-auto pr-2">
            {results.length > 0 ? (
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                        <tr>
                            <th scope="col" className="px-6 py-3">Lần</th>
                            <th scope="col" className="px-6 py-3">Số Đỏ</th>
                            <th scope="col" className="px-6 py-3">Kết quả</th>
                            <th scope="col" className="px-6 py-3">Thời gian</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((result) => (
                            <tr key={result.flip} className="bg-white border-b">
                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                    #{result.flip}
                                </th>
                                <td className="px-6 py-4 font-bold">{result.redCount}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 font-semibold rounded-full ${getOutcomeClass(result.outcome)}`}>
                                        {result.outcome}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{result.timestamp}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : <div className="text-center text-gray-500 py-8">Chưa có lịch sử.</div>}
            <div ref={endOfHistoryRef} />
        </div>
    );
};


// --- Vision Monitor Component (Simplified) ---
const VisionMonitor = () => {
    const videoRef = useRef(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [stream, setStream] = useState(null);

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
        setStream(null); 
        setIsCapturing(false);
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-indigo-500 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-indigo-800">📺 Màn hình Theo dõi</h2>
                <button onClick={isCapturing ? stopCapture : startCapture} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white ${isCapturing ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-500 hover:bg-indigo-600'}`}>
                    {isCapturing ? <Icon name="VideoOff" size={16} /> : <Icon name="Video" size={16} />}
                    {isCapturing ? 'Dừng Ghi' : 'Bắt đầu Ghi'}
                </button>
            </div>
            <div className="relative bg-gray-900 rounded-lg overflow-hidden w-full flex-1">
                <video ref={videoRef} autoPlay muted className="absolute top-0 left-0 w-full h-full object-contain" />
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
  const [historyView, setHistoryView] = useState('grid'); // 'grid' or 'table'
  
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

  const handleManualInput = (redCount) => {
    const toChanLe = (digit) => [0, 2, 4].includes(digit) ? 'Chẵn' : 'Lẻ';
    const newOutcome = toChanLe(redCount);

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
                newPerformance[name].push({ prediction: predictionBefore, correct: predictionBefore === newOutcome });
                if (newPerformance[name].length > 20) newPerformance[name].shift();
            }
        });
        setModelPerformance(newPerformance);
    }
    
    setResults(prev => [...prev, {
        flip: (prev[prev.length - 1]?.flip || 0) + 1,
        outcome: newOutcome,
        redCount: redCount,
        timestamp: new Date().toLocaleTimeString(),
        predictionAtFlip: prediction
    }]);
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
      <div className="max-w-screen-2xl mx-auto">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
                <VisionMonitor />
            </div>
            <div className="space-y-6">
                <ManualInput onNewResult={handleManualInput} />
                <AIPredictionDisplay prediction={prediction} analysis={analysis} isAnalyzing={isAnalyzing} isPredictionRunning={isPredictionRunning} onTogglePrediction={() => setIsPredictionRunning(p => !p)} />
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Lịch sử Kết quả</h2>
                    <div className="flex items-center gap-1 p-1 bg-gray-200 rounded-lg">
                       <button onClick={() => setHistoryView('grid')} className={`px-3 py-1 text-sm font-semibold rounded-md ${historyView === 'grid' ? 'bg-white shadow' : 'text-gray-600'}`}>Dạng Bệt</button>
                       <button onClick={() => setHistoryView('table')} className={`px-3 py-1 text-sm font-semibold rounded-md ${historyView === 'table' ? 'bg-white shadow' : 'text-gray-600'}`}>Dạng Bảng</button>
                    </div>
                </div>
                {historyView === 'grid' ? <GridHistoryDisplay results={results} /> : <TableHistoryDisplay results={results} />}
            </div>
             <div className="space-y-6">
                <StatCard iconName="Target" title="Độ chính xác AI" value={`${accuracyStats.accuracy.toFixed(1)}%`} footer={`${accuracyStats.correct}/${accuracyStats.total} đúng`} color="border-green-500" />
                <StatCard iconName="Sigma" title="Tỷ lệ Chẵn / Lẻ" value={`${patterns.ratio?.chan || 0} / ${patterns.ratio?.le || 0}`} footer="Dựa trên toàn bộ lịch sử" color="border-purple-500" />
             </div>
        </div>
      </div>
    </div>
  );
}

