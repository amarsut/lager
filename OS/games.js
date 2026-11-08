// games.js

window.GamesView = React.memo(() => {
    const [activeGame, setActiveGame] = React.useState(null);

    React.useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
            setTimeout(() => window.lucide.createIcons(), 50);
        }
    });

    if (activeGame === 'tictactoe') return <TicTacToe onBack={() => setActiveGame(null)} />;
    if (activeGame === 'memory') return <MemoryGame onBack={() => setActiveGame(null)} />;
    if (activeGame === 'reaction') return <ReactionTest onBack={() => setActiveGame(null)} />;
    
    // NYA SPEL
    if (activeGame === 'snake') return <SnakeGame onBack={() => setActiveGame(null)} />;
    if (activeGame === 'connect4') return <Connect4 onBack={() => setActiveGame(null)} />;
    if (activeGame === 'wordle') return <WordleGame onBack={() => setActiveGame(null)} />;
    if (activeGame === 'dino') return <DinoGame onBack={() => setActiveGame(null)} />;
    
    if (activeGame === 'sudoku') return <SudokuGame onBack={() => setActiveGame(null)} />;
    if (activeGame === 'flappy') return <FlappyGame onBack={() => setActiveGame(null)} />;
    if (activeGame === 'pong') return <PongGame onBack={() => setActiveGame(null)} />;
    if (activeGame === 'yatzy') return <YatzyGame onBack={() => setActiveGame(null)} />;
    if (activeGame === 'spotdiff') return <SpotDiffGame onBack={() => setActiveGame(null)} />;

    const btnClass = "bg-white dark:bg-[#1e293b] p-4 sm:p-6 rounded-3xl shadow-lg border border-zinc-200 dark:border-white/10 hover:border-orange-500 hover:shadow-orange-500/20 transition-all flex flex-col items-center gap-3 group active:scale-95";
    const iconWrapper = "w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110";

    return (
        <div className="flex flex-col items-center justify-start min-h-[60vh] p-4 pb-20 animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-widest mb-6 mt-4">Tidsfördriv</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 w-full max-w-[800px]">
                <button onClick={() => setActiveGame('tictactoe')} className={btnClass}>
                    <div className={`${iconWrapper} bg-orange-50 dark:bg-orange-500/10 text-orange-500`}><window.Icon name="grid" size={28} /></div>
                    <span className="font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-widest text-[10px] sm:text-[11px] text-center">Tre i rad</span>
                </button>
                <button onClick={() => setActiveGame('memory')} className={btnClass}>
                    <div className={`${iconWrapper} bg-sky-50 dark:bg-sky-500/10 text-sky-500`}><window.Icon name="layout-grid" size={28} /></div>
                    <span className="font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-widest text-[10px] sm:text-[11px] text-center">Memory</span>
                </button>
                <button onClick={() => setActiveGame('snake')} className={btnClass}>
                    <div className={`${iconWrapper} bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500`}><window.Icon name="activity" size={28} /></div>
                    <span className="font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-widest text-[10px] sm:text-[11px] text-center">Snake</span>
                </button>
                <button onClick={() => setActiveGame('connect4')} className={btnClass}>
                    <div className={`${iconWrapper} bg-blue-50 dark:bg-blue-500/10 text-blue-500`}><window.Icon name="align-justify" size={28} /></div>
                    <span className="font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-widest text-[10px] sm:text-[11px] text-center">Fyra i rad</span>
                </button>
                <button onClick={() => setActiveGame('wordle')} className={btnClass}>
                    <div className={`${iconWrapper} bg-violet-50 dark:bg-violet-500/10 text-violet-500`}><window.Icon name="spell-check" size={28} /></div>
                    <span className="font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-widest text-[10px] sm:text-[11px] text-center">Ord-Pussel</span>
                </button>
                <button onClick={() => setActiveGame('dino')} className={btnClass}>
                    <div className={`${iconWrapper} bg-amber-50 dark:bg-amber-500/10 text-amber-500`}><window.Icon name="truck" size={28} /></div>
                    <span className="font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-widest text-[10px] sm:text-[11px] text-center">Hinderbana</span>
                </button>
                <button onClick={() => setActiveGame('sudoku')} className={btnClass}>
                    <div className={`${iconWrapper} bg-rose-50 dark:bg-rose-500/10 text-rose-500`}><window.Icon name="hash" size={28} /></div>
                    <span className="font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-widest text-[10px] sm:text-[11px] text-center">Sudoku 9x9</span>
                </button>
                <button onClick={() => setActiveGame('flappy')} className={btnClass}>
                    <div className={`${iconWrapper} bg-teal-50 dark:bg-teal-500/10 text-teal-500`}><window.Icon name="arrow-up-right" size={28} /></div>
                    <span className="font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-widest text-[10px] sm:text-[11px] text-center">Flappy</span>
                </button>
                <button onClick={() => setActiveGame('yatzy')} className={btnClass}>
                    <div className={`${iconWrapper} bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500`}><window.Icon name="dice-5" size={28} /></div>
                    <span className="font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-widest text-[10px] sm:text-[11px] text-center">Yatzy</span>
                </button>
            </div>
        </div>
    );
});

// --- TRE I RAD ---
const TicTacToe = ({ onBack }) => {
    const [board, setBoard] = React.useState(Array(9).fill(null));
    const [xIsNext, setXIsNext] = React.useState(true);

    React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

    const winner = (() => {
        const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
        }
        return null;
    })();
    const isDraw = !winner && !board.includes(null);

    const handleClick = (i) => {
        if (board[i] || winner) return;
        const newBoard = [...board];
        newBoard[i] = xIsNext ? 'X' : 'O';
        setBoard(newBoard);
        setXIsNext(!xIsNext);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in-95 duration-300 px-4 mt-8">
            <button onClick={onBack} className="mb-6 px-4 py-2 bg-white dark:bg-white/5 shadow-sm rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-orange-500 transition-colors flex items-center gap-2 active:scale-95 border border-zinc-200 dark:border-white/10">
                <window.Icon name="arrow-left" size={14} /> Tillbaka
            </button>
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-xl border border-zinc-200 dark:border-white/10 w-full max-w-[320px]">
                <div className="grid grid-cols-3 gap-2 mb-6">
                    {board.map((square, i) => (
                        <button key={i} onClick={() => handleClick(i)} className="w-full aspect-square bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-2xl text-4xl font-black flex items-center justify-center hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors focus:outline-none" style={{ color: square === 'X' ? '#f97316' : '#0ea5e9' }}>
                            {square}
                        </button>
                    ))}
                </div>
                <div className="text-center h-8 mb-4 font-bold text-lg text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">
                    {winner ? <span className="text-emerald-500">Vinnare: {winner}</span> : isDraw ? <span className="text-zinc-500">Oavgjort!</span> : <span>Tur: <span style={{ color: xIsNext ? '#f97316' : '#0ea5e9' }}>{xIsNext ? 'X' : 'O'}</span></span>}
                </div>
                <button onClick={() => { setBoard(Array(9).fill(null)); setXIsNext(true); }} className="w-full py-3.5 bg-zinc-100 dark:bg-white/5 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 rounded-xl text-zinc-600 dark:text-zinc-300 font-bold uppercase tracking-widest transition-colors active:scale-95">
                    Börja om
                </button>
            </div>
        </div>
    );
};

// --- MEMORY ---
const MemoryGame = ({ onBack }) => {
    const EMOJIS = ['🚗', '🔧', '⚙️', '🔋', '🏎️', '🛠️', '🛢️', '🛑'];
    const [cards, setCards] = React.useState([]);
    const [flipped, setFlipped] = React.useState([]);
    const [solved, setSolved] = React.useState([]);
    const [disabled, setDisabled] = React.useState(false);

    React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });
    React.useEffect(() => { reset(); }, []);

    const handleClick = (index) => {
        if (disabled || flipped.includes(index) || solved.includes(index)) return;
        const newFlipped = [...flipped, index];
        setFlipped(newFlipped);
        
        if (newFlipped.length === 2) {
            setDisabled(true);
            if (cards[newFlipped[0]].emoji === cards[newFlipped[1]].emoji) {
                setSolved([...solved, ...newFlipped]);
                setFlipped([]);
                setDisabled(false);
            } else {
                setTimeout(() => {
                    setFlipped([]);
                    setDisabled(false);
                }, 800);
            }
        }
    };

    const reset = () => {
        setCards([...EMOJIS, ...EMOJIS].sort(() => Math.random() - 0.5).map((emoji, id) => ({ id, emoji })));
        setFlipped([]);
        setSolved([]);
        setDisabled(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in-95 duration-300 px-4 mt-8">
            <button onClick={onBack} className="mb-6 px-4 py-2 bg-white dark:bg-white/5 shadow-sm rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-sky-500 transition-colors flex items-center gap-2 active:scale-95 border border-zinc-200 dark:border-white/10">
                <window.Icon name="arrow-left" size={14} /> Tillbaka
            </button>
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-xl border border-zinc-200 dark:border-white/10 w-full max-w-[320px]">
                <div className="grid grid-cols-4 gap-2 mb-6">
                    {cards.map((card, i) => {
                        const isFlipped = flipped.includes(i) || solved.includes(i);
                        return (
                            <button key={card.id} onClick={() => handleClick(i)} className={`w-full aspect-square rounded-xl text-2xl flex items-center justify-center transition-all duration-300 transform border focus:outline-none active:scale-95 ${isFlipped ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/30 shadow-inner' : 'bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-white/10'}`}>
                                <span className={`transition-all duration-300 ${isFlipped ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>{card.emoji}</span>
                            </button>
                        );
                    })}
                </div>
                <div className="text-center h-8 mb-4 font-bold text-lg uppercase tracking-widest text-sky-500">
                    {solved.length === cards.length && cards.length > 0 ? "Bra jobbat!" : ""}
                </div>
                <button onClick={reset} className="w-full py-3.5 bg-zinc-100 dark:bg-white/5 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-500 rounded-xl text-zinc-600 dark:text-zinc-300 font-bold uppercase tracking-widest transition-colors active:scale-95">
                    Börja om
                </button>
            </div>
        </div>
    );
};

// --- STEN SAX PÅSE ---
const RockPaperScissors = ({ onBack }) => {
    const [result, setResult] = React.useState(null);
    const [score, setScore] = React.useState({ player: 0, cpu: 0 });
    
    React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

    const play = (playerChoice) => {
        const choices = ['Sten', 'Sax', 'Påse'];
        const cpuChoice = choices[Math.floor(Math.random() * choices.length)];
        
        let msg = '';
        if (playerChoice === cpuChoice) {
            msg = `Oavgjort! Båda valde ${playerChoice}.`;
        } else if (
            (playerChoice === 'Sten' && cpuChoice === 'Sax') ||
            (playerChoice === 'Sax' && cpuChoice === 'Påse') ||
            (playerChoice === 'Påse' && cpuChoice === 'Sten')
        ) {
            msg = `Du vann! ${playerChoice} slår ${cpuChoice}.`;
            setScore(s => ({ ...s, player: s.player + 1 }));
        } else {
            msg = `Du förlorade! ${cpuChoice} slår ${playerChoice}.`;
            setScore(s => ({ ...s, cpu: s.cpu + 1 }));
        }
        setResult(msg);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in-95 duration-300 px-4 mt-8">
            <button onClick={onBack} className="mb-6 px-4 py-2 bg-white dark:bg-white/5 shadow-sm rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-emerald-500 transition-colors flex items-center gap-2 active:scale-95 border border-zinc-200 dark:border-white/10">
                <window.Icon name="arrow-left" size={14} /> Tillbaka
            </button>
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-xl border border-zinc-200 dark:border-white/10 w-full max-w-[320px] text-center">
                <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 px-4">
                    <span>Du: <span className="text-emerald-500 text-lg">{score.player}</span></span>
                    <span>CPU: <span className="text-red-500 text-lg">{score.cpu}</span></span>
                </div>
                <div className="flex justify-center gap-3 mb-6">
                    {['Sten', 'Sax', 'Påse'].map(c => (
                        <button key={c} onClick={() => play(c)} className="flex-1 aspect-square bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-2xl flex flex-col items-center justify-center transition-colors active:scale-95 text-zinc-600 dark:text-zinc-300 hover:text-emerald-500">
                            <span className="text-2xl mb-1">{c === 'Sten' ? '✊' : c === 'Sax' ? '✌️' : '✋'}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider">{c}</span>
                        </button>
                    ))}
                </div>
                <div className="min-h-[40px] text-[13px] font-bold text-zinc-700 dark:text-zinc-300 leading-tight">
                    {result || "Gör ditt drag!"}
                </div>
            </div>
        </div>
    );
};

// --- REAKTIONSTEST ---
const ReactionTest = ({ onBack }) => {
    const [state, setState] = React.useState('waiting'); // waiting, ready, finished, early
    const [time, setTime] = React.useState(0);
    const timerRef = React.useRef(null);
    const startTimeRef = React.useRef(0);

    React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });
    React.useEffect(() => { return () => clearTimeout(timerRef.current); }, []);

    const start = () => {
        setState('waiting');
        const delay = Math.floor(Math.random() * 3000) + 1500;
        timerRef.current = setTimeout(() => {
            setState('ready');
            startTimeRef.current = Date.now();
        }, delay);
    };

    const handleClick = () => {
        if (state === 'waiting') {
            clearTimeout(timerRef.current);
            setState('early');
        } else if (state === 'ready') {
            setTime(Date.now() - startTimeRef.current);
            setState('finished');
        } else {
            start();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in-95 duration-300 px-4 mt-8">
            <button onClick={onBack} className="mb-6 px-4 py-2 bg-white dark:bg-white/5 shadow-sm rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-rose-500 transition-colors flex items-center gap-2 active:scale-95 border border-zinc-200 dark:border-white/10">
                <window.Icon name="arrow-left" size={14} /> Tillbaka
            </button>
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-xl border border-zinc-200 dark:border-white/10 w-full max-w-[320px] text-center">
                <button 
                    onClick={handleClick}
                    className={`w-full aspect-square rounded-3xl flex flex-col items-center justify-center transition-colors active:scale-[0.98] border shadow-inner ${
                        state === 'waiting' ? 'bg-red-500 border-red-600 text-white' :
                        state === 'ready' ? 'bg-emerald-500 border-emerald-600 text-white' :
                        'bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300'
                    }`}
                >
                    <div className="text-xl font-black uppercase tracking-widest mb-2">
                        {state === 'waiting' ? 'Vänta...' : state === 'ready' ? 'Klicka!' : state === 'early' ? 'För tidigt!' : 'Klicka för att starta'}
                    </div>
                    {state === 'finished' && (
                        <div className="text-3xl font-black text-rose-500">
                            {time} <span className="text-sm">ms</span>
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
};

// --- 1. SNAKE ---
const SnakeGame = ({ onBack }) => {
    const GRID_SIZE = 15;
    const [snake, setSnake] = React.useState([{x: 7, y: 7}]);
    const [food, setFood] = React.useState({x: 5, y: 5});
    const [dir, setDir] = React.useState({x: 0, y: -1});
    const [gameOver, setGameOver] = React.useState(false);
    const [score, setScore] = React.useState(0);

    React.useEffect(() => {
        const handleKeyDown = (e) => {
            switch(e.key) {
                case 'ArrowUp': if (dir.y !== 1) setDir({x: 0, y: -1}); break;
                case 'ArrowDown': if (dir.y !== -1) setDir({x: 0, y: 1}); break;
                case 'ArrowLeft': if (dir.x !== 1) setDir({x: -1, y: 0}); break;
                case 'ArrowRight': if (dir.x !== -1) setDir({x: 1, y: 0}); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dir]);

    React.useEffect(() => {
        if (gameOver) return;
        const moveSnake = () => {
            setSnake(prev => {
                const head = { x: prev[0].x + dir.x, y: prev[0].y + dir.y };
                if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE || prev.some(seg => seg.x === head.x && seg.y === head.y)) {
                    setGameOver(true);
                    return prev;
                }
                const newSnake = [head, ...prev];
                if (head.x === food.x && head.y === food.y) {
                    setScore(s => s + 1);
                    setFood({ x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) });
                } else {
                    newSnake.pop();
                }
                return newSnake;
            });
        };
        const interval = setInterval(moveSnake, 150);
        return () => clearInterval(interval);
    }, [dir, food, gameOver]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 mt-8">
            <button onClick={onBack} className="mb-6 px-4 py-2 bg-white dark:bg-white/5 shadow-sm rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-emerald-500 border border-zinc-200 dark:border-white/10 active:scale-95 transition-colors">Tillbaka</button>
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-xl border border-zinc-200 dark:border-white/10">
                <div className="text-center font-black text-xl mb-4 text-emerald-500">POÄNG: {score}</div>
                <div className="relative bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-lg overflow-hidden" style={{ width: 300, height: 300 }}>
                    {snake.map((seg, i) => (
                        <div key={i} className="absolute bg-emerald-500 rounded-sm" style={{ left: `${(seg.x / GRID_SIZE) * 100}%`, top: `${(seg.y / GRID_SIZE) * 100}%`, width: `${100 / GRID_SIZE}%`, height: `${100 / GRID_SIZE}%` }} />
                    ))}
                    <div className="absolute bg-orange-500 rounded-full" style={{ left: `${(food.x / GRID_SIZE) * 100}%`, top: `${(food.y / GRID_SIZE) * 100}%`, width: `${100 / GRID_SIZE}%`, height: `${100 / GRID_SIZE}%` }} />
                    {gameOver && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-black text-2xl uppercase">Game Over</div>}
                </div>
                {/* Mobila kontroller */}
                <div className="grid grid-cols-3 gap-2 mt-4 md:hidden">
                    <div/>
                    <button onClick={() => dir.y !== 1 && setDir({x:0, y:-1})} className="bg-zinc-100 dark:bg-white/10 p-4 rounded-xl flex justify-center active:bg-zinc-200">⬆️</button>
                    <div/>
                    <button onClick={() => dir.x !== 1 && setDir({x:-1, y:0})} className="bg-zinc-100 dark:bg-white/10 p-4 rounded-xl flex justify-center active:bg-zinc-200">⬅️</button>
                    <button onClick={() => dir.y !== -1 && setDir({x:0, y:1})} className="bg-zinc-100 dark:bg-white/10 p-4 rounded-xl flex justify-center active:bg-zinc-200">⬇️</button>
                    <button onClick={() => dir.x !== -1 && setDir({x:1, y:0})} className="bg-zinc-100 dark:bg-white/10 p-4 rounded-xl flex justify-center active:bg-zinc-200">➡️</button>
                </div>
                {gameOver && <button onClick={() => { setSnake([{x:7, y:7}]); setDir({x:0, y:-1}); setScore(0); setGameOver(false); }} className="w-full mt-4 py-3 bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-widest active:scale-95 transition-transform">Spela Igen</button>}
            </div>
        </div>
    );
};

// --- 2. FYRA I RAD (Connect 4) ---
const Connect4 = ({ onBack }) => {
    const ROWS = 6; const COLS = 7;
    const [board, setBoard] = React.useState(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
    const [currentPlayer, setCurrentPlayer] = React.useState('R'); // R (Red/Orange) or Y (Yellow/Blue)
    const [winner, setWinner] = React.useState(null);

    const checkWin = (b) => {
        const checkLine = (r, c, dr, dc) => {
            const val = b[r][c];
            if (!val) return false;
            for (let i = 1; i < 4; i++) {
                if (r+dr*i < 0 || r+dr*i >= ROWS || c+dc*i < 0 || c+dc*i >= COLS || b[r+dr*i][c+dc*i] !== val) return false;
            }
            return val;
        };
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const w = checkLine(r, c, 0, 1) || checkLine(r, c, 1, 0) || checkLine(r, c, 1, 1) || checkLine(r, c, 1, -1);
                if (w) return w;
            }
        }
        return null;
    };

    const dropDisc = (col) => {
        if (winner) return;
        const newBoard = board.map(row => [...row]);
        for (let r = ROWS - 1; r >= 0; r--) {
            if (!newBoard[r][col]) {
                newBoard[r][col] = currentPlayer;
                setBoard(newBoard);
                const w = checkWin(newBoard);
                if (w) setWinner(w);
                else setCurrentPlayer(currentPlayer === 'R' ? 'Y' : 'R');
                break;
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 mt-8">
            <button onClick={onBack} className="mb-6 px-4 py-2 bg-white dark:bg-white/5 shadow-sm rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-blue-500 border border-zinc-200 dark:border-white/10 active:scale-95 transition-colors">Tillbaka</button>
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-xl border border-zinc-200 dark:border-white/10 max-w-[100%] overflow-x-auto">
                <div className="text-center font-black text-lg mb-4 tracking-widest uppercase">
                    {winner ? (winner === 'R' ? <span className="text-orange-500">Orange vann!</span> : <span className="text-sky-500">Blå vann!</span>) : (currentPlayer === 'R' ? <span className="text-orange-500">Oranges tur</span> : <span className="text-sky-500">Blås tur</span>)}
                </div>
                <div className="bg-zinc-800 dark:bg-black/60 p-2 sm:p-3 rounded-2xl flex gap-1 sm:gap-2">
                    {Array(COLS).fill(null).map((_, col) => (
                        <div key={col} className="flex flex-col gap-1 sm:gap-2 cursor-pointer group" onClick={() => dropDisc(col)}>
                            <div className="h-4 rounded-full group-hover:bg-zinc-600/50 transition-colors"></div>
                            {board.map((row, rIdx) => (
                                <div key={rIdx} className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-zinc-900 dark:bg-[#09090b] flex items-center justify-center shadow-inner relative overflow-hidden">
                                    {row[col] && (
                                        <div className={`w-full h-full rounded-full animate-in slide-in-from-top-4 duration-300 ${row[col] === 'R' ? 'bg-orange-500 shadow-[inset_0_-4px_rgba(0,0,0,0.2)]' : 'bg-sky-500 shadow-[inset_0_-4px_rgba(0,0,0,0.2)]'}`}></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                {winner && <button onClick={() => { setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null))); setWinner(null); setCurrentPlayer('R'); }} className="w-full mt-6 py-3 bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white rounded-xl font-bold uppercase tracking-widest active:scale-95 transition-transform">Spela Igen</button>}
            </div>
        </div>
    );
};

// --- 3. WORDLE (Fordonstema) ---
const WordleGame = ({ onBack }) => {
    const WORDS = ['MOTOR', 'ORDER', 'DELAR', 'SKRUV', 'BROMS', 'VÄXEL', 'HJULEN', 'SLANG', 'KUND', 'KVITTO']; // Korta verkstadsord (5 bokstäver, vi filtrerar till 5)
    const TARGET = React.useMemo(() => { const fives = WORDS.filter(w=>w.length===5); return fives[Math.floor(Math.random() * fives.length)]; }, []);
    
    const [guesses, setGuesses] = React.useState([]);
    const [currentGuess, setCurrentGuess] = React.useState('');
    const [gameOver, setGameOver] = React.useState(false);

    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (gameOver) return;
            if (e.key === 'Enter' && currentGuess.length === 5) {
                const newGuesses = [...guesses, currentGuess];
                setGuesses(newGuesses);
                setCurrentGuess('');
                if (currentGuess === TARGET || newGuesses.length === 6) setGameOver(true);
            } else if (e.key === 'Backspace') {
                setCurrentGuess(prev => prev.slice(0, -1));
            } else if (/^[a-zA-ZåäöÅÄÖ]$/.test(e.key) && currentGuess.length < 5) {
                setCurrentGuess(prev => (prev + e.key).toUpperCase());
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentGuess, gameOver, guesses, TARGET]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 mt-8">
            <button onClick={onBack} className="mb-4 px-4 py-2 bg-white dark:bg-white/5 shadow-sm rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-violet-500 border border-zinc-200 dark:border-white/10 active:scale-95 transition-colors">Tillbaka</button>
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-xl border border-zinc-200 dark:border-white/10 w-full max-w-[320px]">
                <h3 className="text-center font-black uppercase tracking-widest text-violet-500 mb-4 text-xs">Gissa Verkstadsordet (5 bokstäver)</h3>
                <div className="flex flex-col gap-2 mb-4">
                    {Array(6).fill(null).map((_, i) => {
                        const guess = guesses[i] || (i === guesses.length ? currentGuess : '');
                        return (
                            <div key={i} className="grid grid-cols-5 gap-2">
                                {Array(5).fill(null).map((_, j) => {
                                    const char = guess[j] || '';
                                    let bg = 'bg-zinc-100 dark:bg-black/20 text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/10';
                                    if (guesses[i]) {
                                        if (char === TARGET[j]) bg = 'bg-emerald-500 text-white border-transparent';
                                        else if (TARGET.includes(char)) bg = 'bg-amber-500 text-white border-transparent';
                                        else bg = 'bg-zinc-300 dark:bg-zinc-700 text-white border-transparent opacity-50';
                                    }
                                    return <div key={j} className={`h-12 flex items-center justify-center text-xl font-black rounded-lg ${bg} uppercase`}>{char}</div>
                                })}
                            </div>
                        );
                    })}
                </div>
                <div className="text-center text-[10px] text-zinc-400 uppercase tracking-widest mb-4">Använd tangentbordet</div>
                {gameOver && (
                    <div className="text-center">
                        <div className="font-black text-lg text-emerald-500 mb-4">{guesses.includes(TARGET) ? 'BRA JOBBAT!' : `Ordet var: ${TARGET}`}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- 4. DINO RUN (Hinderbana) ---
const DinoGame = ({ onBack }) => {
    const [isJumping, setIsJumping] = React.useState(false);
    const [obstaclePos, setObstaclePos] = React.useState(100); // procent
    const [score, setScore] = React.useState(0);
    const [gameOver, setGameOver] = React.useState(false);

    React.useEffect(() => {
        if (gameOver) return;
        const interval = setInterval(() => {
            setObstaclePos(prev => {
                if (prev <= -10) { setScore(s => s + 10); return 100; }
                return prev - 2; // Hastighet
            });
        }, 20);
        return () => clearInterval(interval);
    }, [gameOver]);

    React.useEffect(() => {
        if (obstaclePos > 5 && obstaclePos < 15 && !isJumping) {
            setGameOver(true);
        }
    }, [obstaclePos, isJumping]);

    const jump = () => {
        if (isJumping || gameOver) return;
        setIsJumping(true);
        setTimeout(() => setIsJumping(false), 500); // Hopp-tid
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 mt-8" onClick={jump}>
            <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="mb-6 px-4 py-2 bg-white dark:bg-white/5 shadow-sm rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-amber-500 border border-zinc-200 dark:border-white/10 active:scale-95 transition-colors">Tillbaka</button>
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-xl border border-zinc-200 dark:border-white/10 w-full max-w-[400px] overflow-hidden">
                <div className="flex justify-between items-center font-black uppercase tracking-widest text-amber-500 mb-4">
                    <span>Poäng: {score}</span>
                    {gameOver && <span className="text-red-500">Krasch!</span>}
                </div>
                
                <div className="relative h-40 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden border-b-4 border-b-zinc-300 dark:border-b-zinc-700">
                    {/* Bilen (Spelaren) */}
                    <div className="absolute left-[10%] bottom-0 w-8 h-8 text-3xl transition-transform duration-200" style={{ transform: `translateY(${isJumping ? '-80px' : '0px'})` }}>
                        🚙
                    </div>
                    {/* Hindret */}
                    <div className="absolute bottom-0 w-6 h-6 text-2xl" style={{ left: `${obstaclePos}%` }}>
                        🚧
                    </div>
                </div>

                {gameOver ? (
                    <button onClick={(e) => { e.stopPropagation(); setGameOver(false); setScore(0); setObstaclePos(100); }} className="w-full mt-6 py-3.5 bg-amber-500 text-white rounded-xl font-bold uppercase tracking-widest active:scale-95 transition-transform">Försök igen</button>
                ) : (
                    <div className="text-center text-[10px] text-zinc-400 uppercase tracking-widest mt-4">Klicka var som helst för att hoppa</div>
                )}
            </div>
        </div>
    );
};

// --- 5. SUDOKU (9x9) ---
const SudokuGame = ({ onBack }) => {
    // Ett statiskt "medelsvårt" pussel för att hålla koden kompakt
    const initialGrid = [
        5,3,0,0,7,0,0,0,0, 6,0,0,1,9,5,0,0,0, 0,9,8,0,0,0,0,6,0,
        8,0,0,0,6,0,0,0,3, 4,0,0,8,0,3,0,0,1, 7,0,0,0,2,0,0,0,6,
        0,6,0,0,0,0,2,8,0, 0,0,0,4,1,9,0,0,5, 0,0,0,0,8,0,0,7,9
    ];
    const [grid, setGrid] = React.useState([...initialGrid]);

    React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

    const handleChange = (index, value) => {
        if (initialGrid[index] !== 0) return; // Lås initiala siffror
        const val = parseInt(value.slice(-1)); // Ta bara sista inmatade siffran
        const newGrid = [...grid];
        newGrid[index] = isNaN(val) ? 0 : val;
        setGrid(newGrid);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 mt-8">
            <button onClick={onBack} className="mb-4 px-4 py-2 bg-white dark:bg-white/5 shadow-sm rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-rose-500 border border-zinc-200 dark:border-white/10 active:scale-95 transition-colors">Tillbaka</button>
            <div className="bg-white dark:bg-[#1e293b] p-4 sm:p-6 rounded-3xl shadow-xl border border-zinc-200 dark:border-white/10 w-full max-w-[360px]">
                <div className="grid grid-cols-9 gap-[1px] bg-zinc-400 dark:bg-zinc-600 border-2 border-zinc-400 dark:border-zinc-600">
                    {grid.map((cell, i) => {
                        const isLocked = initialGrid[i] !== 0;
                        // Skapa 3x3 block-gränser
                        const borderR = (i % 9 === 2 || i % 9 === 5) ? 'border-r-2 border-zinc-400 dark:border-zinc-600' : '';
                        const borderB = (Math.floor(i / 9) === 2 || Math.floor(i / 9) === 5) ? 'border-b-2 border-zinc-400 dark:border-zinc-600' : '';
                        
                        return (
                            <input 
                                key={i}
                                type="number"
                                value={cell === 0 ? '' : cell}
                                onChange={(e) => handleChange(i, e.target.value)}
                                readOnly={isLocked}
                                className={`w-full aspect-square text-center font-bold outline-none text-sm sm:text-base ${borderR} ${borderB} ${isLocked ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200' : 'bg-white dark:bg-black text-rose-500'} focus:bg-rose-50 dark:focus:bg-rose-500/10`}
                            />
                        );
                    })}
                </div>
                <button onClick={() => setGrid([...initialGrid])} className="w-full mt-6 py-3 bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 rounded-xl font-bold uppercase tracking-widest active:scale-95 transition-colors hover:text-rose-500">Börja om</button>
            </div>
        </div>
    );
};

// --- 6. FLAPPY BIRD-KLON ---
const FlappyGame = ({ onBack }) => {
    const [birdY, setBirdY] = React.useState(50);
    const [pipeX, setPipeX] = React.useState(100);
    const [pipeHeight, setPipeHeight] = React.useState(30); 
    const [gameOver, setGameOver] = React.useState(false);
    const [score, setScore] = React.useState(0);
    const gap = 30; 

    React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

    React.useEffect(() => {
        if (gameOver) return;
        const timer = setInterval(() => {
            setBirdY(y => y + 2.5); // Gravitation
            setPipeX(x => {
                if (x < -15) {
                    setScore(s => s + 1);
                    setPipeHeight(Math.random() * 40 + 10);
                    return 100;
                }
                return x - 2; // Hastighet
            });
        }, 30);
        return () => clearInterval(timer);
    }, [gameOver]);

    React.useEffect(() => {
        if (birdY > 100 || birdY < 0) setGameOver(true);
        if (pipeX > 5 && pipeX < 15) { // Om fågeln är i x-led med röret
            if (birdY < pipeHeight || birdY > pipeHeight + gap) setGameOver(true);
        }
    }, [birdY, pipeX, pipeHeight]);

    const jump = () => { if (!gameOver) setBirdY(y => Math.max(0, y - 15)); };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 mt-8" onClick={jump}>
            <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="mb-4 px-4 py-2 bg-white dark:bg-white/5 shadow-sm rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-teal-500 border border-zinc-200 dark:border-white/10 active:scale-95 transition-colors z-10">Tillbaka</button>
            <div className="bg-white dark:bg-[#1e293b] p-4 rounded-3xl shadow-xl border border-zinc-200 dark:border-white/10 w-full max-w-[320px]">
                <div className="text-center font-black text-xl mb-2 text-teal-500">POÄNG: {score}</div>
                <div className="relative bg-sky-200 dark:bg-sky-900 h-64 rounded-xl overflow-hidden cursor-pointer border border-zinc-200 dark:border-white/5">
                    {/* Fågeln */}
                    <div className="absolute left-[10%] w-6 h-6 bg-yellow-400 border-2 border-black rounded-full flex items-center justify-center transition-transform" style={{ top: `${birdY}%` }}><span className="text-[10px]">👁️</span></div>
                    {/* Övre Rör */}
                    <div className="absolute top-0 bg-green-500 border-2 border-green-700 w-10 rounded-b-md" style={{ left: `${pipeX}%`, height: `${pipeHeight}%` }}></div>
                    {/* Undre Rör */}
                    <div className="absolute bottom-0 bg-green-500 border-2 border-green-700 w-10 rounded-t-md" style={{ left: `${pipeX}%`, height: `${100 - pipeHeight - gap}%` }}></div>
                    
                    {gameOver && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                            <span className="text-white font-black text-2xl uppercase tracking-widest mb-4">Game Over</span>
                            <button onClick={(e) => { e.stopPropagation(); setBirdY(50); setPipeX(100); setScore(0); setGameOver(false); }} className="px-6 py-2 bg-teal-500 text-white rounded-xl font-bold uppercase active:scale-95">Spela igen</button>
                        </div>
                    )}
                </div>
                <div className="text-center text-[10px] text-zinc-400 uppercase tracking-widest mt-4">Klicka för att flaxa</div>
            </div>
        </div>
    );
};

// --- 7. PONG (Touch-vänlig) ---
const PongGame = ({ onBack }) => {
    const [ball, setBall] = React.useState({ x: 50, y: 50 });
    const [ballDir, setBallDir] = React.useState({ x: 1.5, y: 1.5 });
    const [playerY, setPlayerY] = React.useState(40);
    const [cpuY, setCpuY] = React.useState(40);
    const [score, setScore] = React.useState({ p: 0, c: 0 });
    const [isPlaying, setIsPlaying] = React.useState(false);
    const containerRef = React.useRef(null);

    React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

    React.useEffect(() => {
        if (!isPlaying) return;
        const interval = setInterval(() => {
            setBall(prev => {
                let nx = prev.x + ballDir.x;
                let ny = prev.y + ballDir.y;
                let ndx = ballDir.x;
                let ndy = ballDir.y;

                if (ny <= 0 || ny >= 95) ndy = -ndy;
                
                // Träffar spelaren (vänster)
                if (nx <= 5 && ny >= playerY - 5 && ny <= playerY + 25) { nx = 5; ndx = Math.abs(ndx); }
                // Träffar CPU (höger)
                if (nx >= 92 && ny >= cpuY - 5 && ny <= cpuY + 25) { nx = 92; ndx = -Math.abs(ndx); }

                // Mål
                if (nx < 0) { setScore(s => ({...s, c: s.c+1})); return {x:50, y:50}; }
                if (nx > 100) { setScore(s => ({...s, p: s.p+1})); return {x:50, y:50}; }

                setBallDir({ x: ndx, y: ndy });
                setCpuY(cy => {
                    if (cy + 10 < ny) return cy + 1;
                    if (cy + 10 > ny) return cy - 1;
                    return cy;
                });
                return { x: nx, y: Math.max(0, Math.min(100, ny)) };
            });
        }, 20);
        return () => clearInterval(interval);
    }, [isPlaying, ballDir, playerY, cpuY]);

    const handleTouch = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const touchY = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        const percentage = (touchY / rect.height) * 100;
        setPlayerY(Math.max(0, Math.min(80, percentage - 10)));
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 mt-8">
            <button onClick={onBack} className="mb-4 px-4 py-2 bg-white dark:bg-white/5 shadow-sm rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 border border-zinc-200 dark:border-white/10 active:scale-95 transition-colors z-10">Tillbaka</button>
            <div className="bg-white dark:bg-[#1e293b] p-4 rounded-3xl shadow-xl border border-zinc-200 dark:border-white/10 w-full max-w-[400px]">
                <div className="flex justify-between items-center font-black text-2xl mb-4 px-4 text-zinc-400">
                    <span className="text-zinc-900 dark:text-white">{score.p}</span>
                    <span>{score.c}</span>
                </div>
                <div 
                    ref={containerRef}
                    onTouchMove={handleTouch}
                    onMouseMove={handleTouch}
                    className="relative bg-zinc-900 dark:bg-black h-64 rounded-xl overflow-hidden cursor-ns-resize border-2 border-zinc-700"
                >
                    {/* Spelare */}
                    <div className="absolute left-1 w-2 h-[20%] bg-white rounded-full" style={{ top: `${playerY}%` }}></div>
                    {/* CPU */}
                    <div className="absolute right-1 w-2 h-[20%] bg-white rounded-full" style={{ top: `${cpuY}%` }}></div>
                    {/* Mittlinje */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20 border-l border-dashed"></div>
                    {/* Boll */}
                    <div className="absolute w-3 h-3 bg-white rounded-full" style={{ left: `${ball.x}%`, top: `${ball.y}%` }}></div>
                    
                    {!isPlaying && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <button onClick={() => setIsPlaying(true)} className="px-6 py-2 bg-white text-black rounded-xl font-bold uppercase active:scale-95">Starta</button>
                        </div>
                    )}
                </div>
                <div className="text-center text-[10px] text-zinc-400 uppercase tracking-widest mt-4">Dra upp/ner på spelplanen</div>
            </div>
        </div>
    );
};

// --- 8. YATZY (Förenklad) ---
const YatzyGame = ({ onBack }) => {
    const [dice, setDice] = React.useState([1,2,3,4,5]);
    const [held, setHeld] = React.useState([false,false,false,false,false]);
    const [rollsLeft, setRollsLeft] = React.useState(3);

    React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

    const roll = () => {
        if (rollsLeft > 0) {
            setDice(d => d.map((v, i) => held[i] ? v : Math.ceil(Math.random() * 6)));
            setRollsLeft(r => r - 1);
        }
    };

    const reset = () => { setRollsLeft(3); setHeld([false,false,false,false,false]); roll(); };
    const sum = dice.reduce((a,b)=>a+b, 0);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 mt-8">
            <button onClick={onBack} className="mb-4 px-4 py-2 bg-white dark:bg-white/5 shadow-sm rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-indigo-500 border border-zinc-200 dark:border-white/10 active:scale-95 transition-colors">Tillbaka</button>
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-xl border border-zinc-200 dark:border-white/10 w-full max-w-[320px] text-center">
                <div className="font-black text-xl text-indigo-500 mb-6 uppercase tracking-widest">Yatzy Roll</div>
                <div className="flex justify-center gap-2 mb-8">
                    {dice.map((val, i) => (
                        <button 
                            key={i} 
                            onClick={() => setHeld(h => { const nh = [...h]; nh[i] = !nh[i]; return nh; })}
                            className={`w-12 h-12 rounded-xl text-2xl font-black flex items-center justify-center border-2 transition-all active:scale-90 ${held[i] ? 'bg-indigo-500 text-white border-indigo-600 shadow-inner' : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-white border-zinc-200 dark:border-zinc-600 shadow-sm'}`}
                        >
                            {val}
                        </button>
                    ))}
                </div>
                <div className="flex justify-between items-center bg-zinc-100 dark:bg-black/20 p-4 rounded-xl mb-6">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Summa: <span className="text-lg text-zinc-900 dark:text-white">{sum}</span></div>
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Kast kvar: <span className="text-lg text-indigo-500">{rollsLeft}</span></div>
                </div>
                {rollsLeft > 0 ? (
                    <button onClick={roll} className="w-full py-4 bg-indigo-500 text-white rounded-xl font-bold uppercase tracking-widest active:scale-95 transition-transform shadow-md">Kasta Tärningar</button>
                ) : (
                    <button onClick={reset} className="w-full py-4 bg-zinc-200 dark:bg-white/10 text-zinc-800 dark:text-zinc-200 rounded-xl font-bold uppercase tracking-widest active:scale-95 transition-transform">Börja om</button>
                )}
            </div>
        </div>
    );
};

// --- 9. HITTA FELET ---
const SpotDiffGame = ({ onBack }) => {
    const [level, setLevel] = React.useState(1);
    const [grid, setGrid] = React.useState([]);
    const [diffIdx, setDiffIdx] = React.useState(0);
    const [gameOver, setGameOver] = React.useState(false);
    const EMOJIS = ['🚗','🚕','🚙','🚌','🏎️','🚓','🚑','🚒','🚐','🛻','🚜'];

    React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

    React.useEffect(() => {
        const size = Math.min(16 + (level * 4), 64); // Ökar svårighetsgraden
        const target = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
        let wrong = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
        while (wrong === target) wrong = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
        
        const newGrid = Array(size).fill(target);
        const idx = Math.floor(Math.random() * size);
        newGrid[idx] = wrong;
        setGrid(newGrid);
        setDiffIdx(idx);
    }, [level]);

    const handleClick = (idx) => {
        if (gameOver) return;
        if (idx === diffIdx) setLevel(l => l + 1);
        else setGameOver(true);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 mt-8">
            <button onClick={onBack} className="mb-4 px-4 py-2 bg-white dark:bg-white/5 shadow-sm rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-rose-500 border border-zinc-200 dark:border-white/10 active:scale-95 transition-colors">Tillbaka</button>
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-xl border border-zinc-200 dark:border-white/10 w-full max-w-[400px] text-center">
                <div className="font-black text-xl text-rose-500 mb-4 uppercase tracking-widest">Nivå: {level}</div>
                <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Klicka på ikonen som sticker ut!</div>
                
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {grid.map((emoji, i) => (
                        <button key={i} onClick={() => handleClick(i)} className="w-8 h-8 sm:w-10 sm:h-10 text-xl sm:text-2xl hover:scale-125 transition-transform focus:outline-none">
                            {emoji}
                        </button>
                    ))}
                </div>

                {gameOver && (
                    <div className="animate-in fade-in zoom-in duration-200">
                        <div className="text-red-500 font-black uppercase mb-4">Fel! Spelet är över.</div>
                        <button onClick={() => { setLevel(1); setGameOver(false); }} className="w-full py-3 bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white rounded-xl font-bold uppercase tracking-widest active:scale-95 transition-transform">Börja om</button>
                    </div>
                )}
            </div>
        </div>
    );
};
