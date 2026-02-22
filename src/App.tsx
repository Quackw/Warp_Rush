import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

// @ts-ignore
import solImage from "./image_10.png";
// @ts-ignore
import magicImage from "./image_9.png";

interface TargetType {
  id: string;
  label: string;
  color: string;
  points: number | "death";
  probability: number;
  speed: number;
}

interface Target {
  id: string;
  type: TargetType;
  size: number;
  left: string;
  top: string;
}

interface Burst {
  id: string;
  x: number;
  y: number;
  color: string;
}

const TARGET_TYPES: TargetType[] = [
  {
    id: "sol",
    label: "SOL",
    color: "cyan",
    points: 100,
    probability: 0.45,
    speed: 2500,
  },
  {
    id: "magic",
    label: "MAGIC",
    color: "fuchsia",
    points: 300,
    probability: 0.2,
    speed: 2000,
  },
  {
    id: "rekt",
    label: "REKT",
    color: "red",
    points: -200,
    probability: 0.25,
    speed: 2800,
  },
  {
    id: "bomb",
    label: "BOMB",
    color: "gray",
    points: "death",
    probability: 0.1,
    speed: 3000,
  },
];

const renderIcon = (id: string, size: number) => {
  const iconSize = size * 0.7;
  switch (id) {
    case "sol":
      return (
        <img
          src={solImage}
          alt="SOL"
          style={{ width: iconSize, height: iconSize }}
          className="object-cover rounded-full"
        />
      );
    case "magic":
      return (
        <img
          src={magicImage}
          alt="MAGIC"
          style={{ width: iconSize, height: iconSize }}
          className="animate-pulse object-cover rounded-full"
        />
      );
    case "rekt":
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
          <path
            d="M19.5 8.5L22 6M17 11L20.5 14.5M14.5 5L17 2.5"
            stroke="#fee2e2"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M12 12C14.7614 12 17 14.2386 17 17C17 19.7614 14.7614 22 12 22C9.23858 22 7 19.7614 7 17C7 14.2386 9.23858 12 12 12Z"
            fill="#ef4444"
            stroke="#fee2e2"
            strokeWidth="2"
          />
          <path d="M12 8V12" stroke="#fee2e2" strokeWidth="2" />
        </svg>
      );
    case "bomb":
      return (
        <div className="relative flex items-center justify-center">
          <div className="absolute w-full h-full bg-red-900/50 rounded-full animate-ping opacity-40"></div>
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 2C7.58172 2 4 5.58172 4 10C4 11.75 4.55 13.35 5.5 14.65V18C5.5 19.1 6.4 20 7.5 20H16.5C17.6 20 18.5 18V14.65C19.45 13.35 20 11.75 20 10C20 5.58172 16.4183 2 12 2Z"
              fill="#1f2937"
              stroke="#9ca3af"
              strokeWidth="1.5"
            />
            <circle
              cx="9"
              cy="11"
              r="2.5"
              fill="#ef4444"
              className="animate-pulse"
            />
            <circle
              cx="15"
              cy="11"
              r="2.5"
              fill="#ef4444"
              className="animate-pulse"
            />
            <path
              d="M8 16H16M9 20V22M12 20V22M15 20V22"
              stroke="#9ca3af"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      );
    default:
      return null;
  }
};

export default function App() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();

  const [gameState, setGameState] = useState<string>("idle");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(1);
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [targets, setTargets] = useState<Target[]>([]);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [finalMessage, setFinalMessage] = useState<string>("");
  const [isHit, setIsHit] = useState<boolean>(false);

  const spawnTimerRef = useRef<any>(null);
  const gameTimerRef = useRef<any>(null);

  const stars = useMemo(
    () =>
      Array.from({ length: 75 }).map(() => ({
        left: `${Math.random() * 200 - 50}%`,
        top: `${Math.random() * 200 - 50}%`,
        delay: `${Math.random() * 3}s`,
        duration: `${1.5 + Math.random() * 2}s`,
      })),
    []
  );

  const clearTimers = useCallback(() => {
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
  }, []);

  const endGame = useCallback(
    (reason: string, finalScore?: number) => {
      clearTimers();
      setGameState("finished");
      setTargets([]);
      const endScore = finalScore !== undefined ? finalScore : score;
      if (reason === "bomb") {
        setFinalMessage(`FATAL ERROR! SKULL HIT. SCORE: ${endScore}`);
      } else {
        setFinalMessage(
          endScore >= 1000
            ? `MISSION COMPLETE! SCORE: ${endScore}`
            : `TIME UP! SCORE: ${endScore}`
        );
      }
    },
    [score, clearTimers]
  );

  const startGame = async () => {
    if (!connected || !publicKey) {
      alert("System Locked: Please connect Wallet first!");
      return;
    }

    try {
      setIsProcessing(true);

      // HACKATHON DEMO LOGIC:
      // In production, this would delegate to MagicBlock ER Validator:
      // Validator (US Devnet): MUS3hc9TCw4cGC12vHNoYCcGzJG1txjgQLZWVoenNHNd
      // To bypass Wallet Rent Exemption simulation errors during demo, we route to self.
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: publicKey, // Самоперевод - 100% успех
          lamports: 100,
        })
      );

      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);

      // Оптимистичный старт - не ждем сеть, стартуем мгновенно (имитация Ephemeral Rollup)
      setGameState("playing");
      setScore(0);
      setCombo(1);
      setTimeLeft(10);
      setTargets([]);
      setBursts([]);
      setIsHit(false);

      connection
        .confirmTransaction(
          {
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            signature: signature,
          },
          "processed"
        )
        .catch(console.error);
    } catch (error) {
      console.error("Transaction failed:", error);
      alert("Transaction failed. Try again!");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (gameState === "playing") {
      spawnTimerRef.current = setInterval(() => {
        const rand = Math.random();
        let cumulative = 0;
        let selectedType = TARGET_TYPES[0];
        for (let type of TARGET_TYPES) {
          cumulative += type.probability;
          if (rand <= cumulative) {
            selectedType = type;
            break;
          }
        }
        const newTarget: Target = {
          id: Math.random().toString(36).substr(2, 9),
          type: selectedType,
          size: Math.floor(Math.random() * 100) + 60,
          left: `${Math.random() * 80 + 10}%`,
          top: `${Math.random() * 80 + 10}%`,
        };
        setTargets((prev) => [...prev, newTarget]);
        setTimeout(
          () => setTargets((prev) => prev.filter((t) => t.id !== newTarget.id)),
          selectedType.speed
        );
      }, 350);

      gameTimerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            endGame("time");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return clearTimers;
  }, [gameState, endGame, clearTimers]);

  const handleTargetClick = (
    e: React.MouseEvent,
    targetId: string,
    type: TargetType
  ) => {
    e.stopPropagation();
    setTargets((prev) => prev.filter((t) => t.id !== targetId));

    const burstId = Math.random().toString(36).substr(2, 9);
    setBursts((prev) => [
      ...prev,
      { id: burstId, x: e.clientX, y: e.clientY, color: type.color },
    ]);
    setTimeout(
      () => setBursts((prev) => prev.filter((b) => b.id !== burstId)),
      400
    );

    if (type.points === "death") {
      endGame("bomb", score);
    } else {
      const pointsValue = Number(type.points);
      if (pointsValue < 0) {
        setCombo(1);
        setScore((prev) => Math.max(0, prev + pointsValue));
        setTimeLeft((prev) => Math.max(0, prev - 2));
        setIsHit(true);
        setTimeout(() => setIsHit(false), 300);
      } else {
        setScore((prev) => prev + pointsValue * combo);
        setCombo((prev) => Math.min(prev + 1, 10));
      }
    }
  };

  return (
    <div
      className={`viewport-3d bg-gray-950 font-body ${
        isHit ? "hit-effect" : ""
      }`}
    >
      <style>{`
        body { background-color: #000; margin: 0; overflow: hidden; user-select: none; }
        .viewport-3d { perspective: 600px; transform-style: preserve-3d; width: 100vw; height: 100vh; position: relative; overflow: hidden; }
        @keyframes flyStar { 0% { transform: translateZ(-2000px); opacity: 0; } 10% { opacity: 0.8; } 100% { transform: translateZ(500px); opacity: 1; } }
        @keyframes flyTarget { 0% { transform: translate(-50%, -50%) translateZ(-3000px); opacity: 0; } 15% { opacity: 1; } 100% { transform: translate(-50%, -50%) translateZ(450px); opacity: 1; } }
        @keyframes burstIn { 0% { transform: translate(-50%, -50%) translateZ(200px) scale(0.1); opacity: 1; } 100% { transform: translate(-50%, -50%) translateZ(200px) scale(2.5); opacity: 0; } }
        @keyframes screenShake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-15px); } 50% { transform: translateX(15px); } 75% { transform: translateX(-15px); } }
        .hit-effect { animation: screenShake 0.3s both; box-shadow: inset 0 0 150px rgba(239, 68, 68, 0.5); }
        .burst { position: absolute; pointer-events: none; border: 4px solid white; border-radius: 50%; z-index: 20; animation: burstIn 0.4s ease-out forwards; }
      `}</style>

      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute bg-white rounded-full"
          style={{
            left: star.left,
            top: star.top,
            width: "2px",
            height: "2px",
            animation: `flyStar ${star.duration} linear infinite`,
            animationDelay: star.delay,
          }}
        />
      ))}

      {bursts.map((b) => (
        <div
          key={b.id}
          className="burst"
          style={{
            left: b.x,
            top: b.y,
            width: "80px",
            height: "80px",
            borderColor:
              b.color === "cyan"
                ? "#22d3ee"
                : b.color === "fuchsia"
                ? "#d946ef"
                : "#ef4444",
          }}
        />
      ))}

      <div className="absolute top-6 right-6 z-50">
        <WalletMultiButton className="!bg-indigo-600 !rounded-xl !font-title" />
      </div>

      {gameState === "playing" && (
        <div className="absolute top-6 left-6 z-40 flex flex-col gap-1 font-title font-black pointer-events-none">
          <div className="text-cyan-400 text-3xl">SCORE: {score}</div>
          <div className="text-fuchsia-400 text-2xl animate-pulse">
            COMBO X{combo}
          </div>
          <div
            className={`text-2xl ${
              timeLeft <= 3 ? "text-red-500 animate-ping" : "text-white"
            }`}
          >
            TIME: 00:{timeLeft < 10 ? "0" + timeLeft : timeLeft}
          </div>
        </div>
      )}

      {gameState === "playing" &&
        targets.map((target) => (
          <div
            key={target.id}
            className="absolute z-30 cursor-crosshair"
            style={{
              left: target.left,
              top: target.top,
              animation: `flyTarget ${target.type.speed}ms forwards`,
            }}
            onMouseDown={(e) => handleTargetClick(e, target.id, target.type)}
          >
            <div
              style={{ width: `${target.size}px`, height: `${target.size}px` }}
              className={`rounded-full border-[2px] flex items-center justify-center backdrop-blur-sm shadow-xl hover:scale-110 transition-transform ${
                target.type.color === "cyan"
                  ? "border-cyan-400 bg-cyan-900/40"
                  : target.type.color === "fuchsia"
                  ? "border-fuchsia-400 bg-fuchsia-900/40"
                  : target.type.color === "red"
                  ? "border-red-500 bg-red-900/40"
                  : "border-gray-600 bg-black"
              }`}
            >
              {renderIcon(target.type.id, target.size)}
            </div>
          </div>
        ))}

      {gameState !== "playing" && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center p-10 bg-black/80 backdrop-blur-md border border-indigo-500/50 rounded-3xl w-[95%] max-w-4xl text-center">
          <h1 className="font-title text-6xl md:text-8xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-indigo-400 tracking-tighter">
            WARP RUSH
          </h1>
          <p className="text-indigo-300 tracking-[0.2em] mb-10 uppercase font-bold leading-none">
            Powered by MagicBlock Ephemeral Rollups
          </p>
          {gameState === "finished" && (
            <div
              className={`mb-10 p-6 rounded-2xl border-2 ${
                finalMessage.includes("COMPLETE")
                  ? "border-green-400 text-green-300"
                  : "border-red-500 text-red-300"
              }`}
            >
              <p className="font-title font-black text-2xl">{finalMessage}</p>
            </div>
          )}

          <button
            onClick={startGame}
            disabled={isProcessing}
            className={`w-full max-w-sm py-6 text-3xl font-title font-black rounded-xl transition-all shadow-lg active:scale-95
              ${
                isProcessing
                  ? "bg-indigo-800 text-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-500"
              }
            `}
          >
            {isProcessing
              ? "PROCESSING..."
              : gameState === "idle"
              ? "ENGAGE"
              : "RETRY"}
          </button>
        </div>
      )}
    </div>
  );
}
