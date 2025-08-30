import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Coins, Target, Sigma, History, PieChart, Link, ArrowRightLeft, Brain, CheckCircle, RotateCcw, TrendingUp, PlayCircle, PauseCircle } from 'lucide-react';

// --- HELPER COMPONENTS ---

const Icon = ({ name, ...props }) => {
    const icons = { Coins, Target, Sigma, History, PieChart, Link, ArrowRightLeft, Brain, CheckCircle, RotateCcw, TrendingUp, PlayCircle, PauseCircle };
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


// --- Manual Input Component ---
const ManualInput = ({ onNewResult }) => {
    const handleButtonClick = (redCount) => {
        onNewResult(redCount);
    };

    const buttonStyle = "flex-1 p-4 rounded-lg text-lg font-bold transition-transform transform hover:scale-105";
    const colors = [
        "bg-gray-200 text-gray-800", // 0
        "bg-blue-500 text-white",     // 1
        "bg-green-500 text-white",    // 2
        "bg-yellow-500 text-white",   // 3
        "bg-red-500 text-white"       // 4
    ];

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-teal-500">
            <h2 className="text-lg font-semibold text-teal-800 mb-4">Nhập Kết quả Lượt mới</h2>
            <div className="flex gap-4">
                {[0, 1, 2, 3, 4].map(num => (
                    <button key={num} onClick={() => handleButtonClick(num)} className={`${buttonStyle} ${colors[num]}`}>
                        {num}
                    </button>
                ))}
            </div>
        </div>
    );
};

// --- History Display Component ---
const HistoryDisplay = ({ results }) => {
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
         <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Lịch sử Kết quả</h2>
            <div className="max-h-96 overflow-y-auto pr-2">
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
                                    <td className="px-6 py-4">{result.redCount}</td>
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
            <ManualInput onNewResult={handleManualInput} />
            <HistoryDisplay results={results} />
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

