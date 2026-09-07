# Agents Guide — Fighting Game 2D (Arcade Portal)

Panduan ini ditujukan untuk AI coding assistant agar memahami struktur proyek, arsitektur, dan konvensi yang digunakan.

---

## Project Overview

Arcade Portal berisi **dua game** yang diakses dari satu halaman web:

| Game | Nama | Genre | Deskripsi |
|------|------|-------|-----------|
| 1 | **Shinobi vs Samurai** | Fighting (1v1 lokal) | Game pertarungan serius bergaya piksel Jepang |
| 2 | **Shadow of Destiny** | Action-Platformer Troll | Terlihat serius seperti Dark Souls, tapi lama-kelamaan kocak dan gajelas |

---

## Tech Stack

- **Build Tool**: Vite 5.4.x
- **Language**: Vanilla JavaScript ES Modules (tidak ada framework)
- **Rendering**: Canvas 2D API (`ctx.fillRect`, `ctx.arc`, dll)
- **Audio**: Web Audio API — semua suara di-synthesize via `OscillatorNode`, **tidak ada file audio eksternal**
- **Entry Point**: `index.html` → `src/main.js`

---

## Build Commands

```bash
npm run dev       # Dev server (biasanya port 5173 atau 5174)
npm run build     # Production build → output ke dist/
npm run preview   # Preview production build
```

---

## Project Structure

```
/home/isaac/Testing/
├── index.html                  # Entry HTML — 3-view layout (hub, fighting, game2)
├── package.json
├── agents.md                   # File ini
├── src/
│   ├── main.js                 # Router utama — switchView() mengatur game mana yang aktif
│   ├── assets/                 # Asset statis (jika ada)
│   ├── core/
│   │   └── Game.js             # Base game loop untuk Game 1 (fighting)
│   ├── systems/
│   │   ├── CombatSystem.js     # Sistem pertarungan Game 1
│   │   ├── InputManager.js     # Keyboard handler Game 1 (punya destroy())
│   │   ├── PhysicsEngine.js    # Fisika Game 1
│   │   └── TwoDRenderer.js     # Renderer piksel art Game 1
│   ├── entities/
│   │   ├── Fighter.js          # Entitas karakter Game 1
│   │   └── Stage.js            # Arena/stage Game 1
│   ├── ui/                     # Komponen UI (jika ada)
│   └── games/
│       ├── fighting/
│       │   └── index.js        # startFightingGame() / stopFightingGame()
│       └── game2/
│           ├── index.js        # startGame2() / stopGame2()
│           └── Game2.js        # Seluruh logika Game 2 (~1000+ baris, self-contained)
└── dist/                       # Output production build (jangan edit manual)
```

---

## Arsitektur Router (`src/main.js`)

```js
switchView('hub')       // Tampilkan menu pilihan game
switchView('fighting')  // Mulai Game 1
switchView('game2')     // Mulai Game 2
```

- Sebelum pindah view, game yang sedang aktif di-`stop()` terlebih dahulu
- Debug helper tersedia di `window.arcadePortal`

---

## Game 1 — Shinobi vs Samurai

**Entry**: `src/games/fighting/index.js` → `startFightingGame()`

**Arsitektur**:
- `Game.js` → base class dengan game loop (`requestAnimationFrame`), `start()`, `stop()`
- `Fighter.js` → entitas karakter (player & enemy)
- `CombatSystem.js` → deteksi hit, damage, combo
- `InputManager.js` → keyboard input (punya `destroy()` untuk cleanup listener)
- `PhysicsEngine.js` → gravitasi, collision
- `TwoDRenderer.js` → render piksel art

**Stop/Cleanup**: `Game.js` punya method `stop()` yang cancel animation frame dan remove event listener via `_onResize`.

---

## Game 2 — Shadow of Destiny (Troll Game)

**Entry**: `src/games/game2/index.js` → `startGame2()`
**Logika utama**: `src/games/game2/Game2.js` (class `Game2`, self-contained)

**Konsep**: Awalnya terlihat seperti game action serius, tapi makin lama makin kocak dan gajelas. Semua teks/dialog dalam **Bahasa Indonesia**.

### 6 Phase Gameplay

| Phase | Nama | Mekanik |
|-------|------|---------|
| 1 | Duel Serius | Katana slash (J), parry (L), shadow dash (Shift/K), jump (W/Space/↑). Boss: Triple Dark Wave, Heavy Strike, Shadow Teleport. Target: kurangi HP boss ke 700. |
| 2 | Kangkung + Sandal | Pedang jadi kangkung lemas. Tembak 10 sandal homing swallow (J). Boss lempar shuriken + jatuhkan kulit pisang (player bisa terpeleset). |
| 3 | Baseball Bar + Tahu Bulat | Boss cabut health bar-nya sendiri dan pakai sebagai baseball bat. Player siram 8 ember air (J). Pick-up truck Tahu Bulat lewat arena tiap 10–16 detik (ada peringatan klakson 2.5s) — bisa stun boss jika kena. |
| 4 | Paylater Bullet-Hell + Iklan YouTube Palsu | Boss tembak surat tagihan paylater (stun player). Overlay iklan YouTube palsu muncul dengan tombol skip yang kabur — klik 3x untuk dismiss. Survive 25 detik. |
| 5 | Rhythm Kerokan | Minigame: tekan K saat cursor ada di sweet-spot (0.4–0.6) untuk kerokan punggung boss. Butuh 100% progress. Miss = boss complain dan dorong player. |
| 6 | Ending Dangdut Hajatan | Mama boss telepon suruh pulang cuci piring. Layar tenda biru hajatan, disco light, duet dangdut. |

### Checkpoint System

- `this.checkpointPhase` menyimpan phase terjauh yang dicapai
- Saat Game Over, player restart dari checkpoint-nya (bukan dari Phase 1)
- `resetToCheckpoint(phaseNum)` set ulang HP boss, senjata player, dan objective

### Canvas & Rendering

- Resolusi internal: `1280 × 720`
- CSS `style.width/height` di-set terpisah di `resize()` agar fill parent
- Semua rendering manual via Canvas 2D API (tidak ada sprite sheet eksternal)
- Gunakan `ctx.roundRect()` — hanya didukung browser modern, tidak ada polyfill

### Physics (Game 2)

- Jump velocity: `-760 px/s` (negatif = ke atas)
- Gravity: `1750 px/s²` (dikalikan `dt` per frame)
- PENTING: Jangan ubah jump velocity ke nilai kecil seperti -16 — akan dibatalkan gravity dalam 1 frame

### Audio (Game 2)

- `initAudio()` harus dipanggil saat interaksi pengguna pertama (untuk resume `AudioContext`)
- Semua sound di-synthesize: `OscillatorNode` → `GainNode` → `AudioContext.destination`

---

## Konvensi Penting

1. **Bahasa Indonesia** — semua teks dialog, notifikasi, dan UI Game 2 dalam Bahasa Indonesia
2. **Tidak ada file audio** — semua suara di-generate secara programatik
3. **No external libraries** — murni Vanilla JS + Canvas 2D
4. **Menu card Game 2** harus terlihat **100% serius** (Dark Souls-like) — tidak boleh ada spoiler bahwa gamenya kocak
5. **Cleanup wajib** — setiap game harus punya `stop()` agar tidak ada memory leak saat pindah game

---

## Known Quirks & Troubleshooting

### Git Index Corruption
Jika muncul error `fatal: .git/index: index file smaller than expected`:
```bash
rm -f .git/index
git reset
```

### Vite Build Gagal (Syntax Error Tersembunyi)
Jika Vite gagal parse tapi `node -c` tidak mendeteksi error, cek apakah closing brace `}` method di `Game2.js` hilang. Biasanya terjadi di bagian `render()` → `renderPlayer()`.

### Port Conflict
Jika port 5173 sudah dipakai, Vite otomatis pindah ke 5174. Cek output `npm run dev` untuk port aktual.

---

## Cara Menambah Game Baru

1. Buat folder `src/games/game3/`
2. Buat `index.js` dengan `startGame3()` dan `stopGame3()`
3. Tambah view baru di `index.html` (`#game3-view`)
4. Daftarkan di `src/main.js` → `switchView()` dan import entry function
5. Tambah card game di hub (`#game-hub-view`) di `index.html`
