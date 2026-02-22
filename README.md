### 📺 [WATCH THE DEMO VIDEO HERE](https://drive.google.com/file/d/1I7e8MeIXddesWvc-BadEkDMO4bo09a0j/view?usp=drive_link)
# 🌌 WARP RUSH

**Warp Rush** is a high-speed, 3D hyper-casual token hunt built for the **Solana Blitz v0 Hackathon**. It demonstrates high-frequency on-chain interactions with zero latency, powered by the vision of **MagicBlock Ephemeral Rollups**.

---

## 🚀 The Vision: Gaming at the Speed of Light
Mainstream Web3 gaming suffers from high latency and gas costs for every in-game action. **Warp Rush** solves this by conceptualizing a session-based state:
1. **On-Chain Entry:** Players stake $SOL to engage in a 10-second high-speed "Warp" session.
2. **Ephemeral Gameplay:** Every click, combo, and burst is processed at sub-millisecond speeds (simulating Ephemeral Rollup performance).
3. **Settlement:** High scores are recorded on the Solana Devnet.

## 🛠 Tech Stack
- **Frontend:** React + Vite, Tailwind CSS
- **3D Engine:** Custom CSS 3D Perspective Matrix (for ultra-high FPS without WebGL overhead)
- **Web3:** @solana/web3.js, @solana/wallet-adapter
- **State Management:** Ephemeral Session logic for instant feedback

## 🎮 Key Features
- **3D Spatial Awareness:** Targets fly towards the player in a simulated Z-axis.
- **Dynamic Combo System:** Reward precision. Hit consecutive targets to multiply your score up to x10.
- **Risk & Reward:** - **SOL/MAGIC:** Positive points + Combo boost.
  - **REKT (Bombs):** Point penalty + Time deduction + Combo reset.
  - **BOMB (Skulls):** Instant game over (Fatal Error).
- **Anti-Latency UI:** Optimistic state updates for instant visual feedback.

## ⚡ How it Works (Hackathon Focus)
The project utilizes a **Self-Signature Entry Mechanism**. Before the session starts, the player signs a transaction on **Solana Devnet**. This ensures:
- Secure entry fees.
- Verification of the player's identity.
- Potential for state settlement back to Layer 1 after the session ends.

---

## 🛠 Installation & Setup
1. Clone the repo: `git clone https://github.com/YOUR_NICKNAME/warp-rush`
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`

---

Built by **TylerR (Rank 27 MagicBlock Community)** for Solana Blitz 2026.
