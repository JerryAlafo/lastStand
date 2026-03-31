// @ts-nocheck
import { create } from 'zustand'

export type PowerupType = 'rapidfire' | 'multishot' | 'shield' | 'heal' | 'blast' | 'speed'

export interface ActiveEffect {
  type: PowerupType
  remaining: number
}

export interface GameState {
  // Player
  hp: number
  maxHp: number
  score: number
  kills: number
  wave: number
  xp: number
  xpNext: number

  // Weapon
  fireRate: number
  shotCount: number
  playerSpeed: number

  // Timers
  fireTimer: number
  dashTimer: number
  dashCooldown: number
  waveTimer: number
  waveDelay: number
  spawnQueue: number
  spawnTimer: number
  enemiesLeft: number

  // Effects
  activeEffects: Partial<Record<PowerupType, number>>

  // Status
  running: boolean
  gameOver: boolean
  waveMessage: string

  // Actions
  setRunning: (v: boolean) => void
  setGameOver: (v: boolean) => void
  setWaveMessage: (msg: string) => void
  addScore: (n: number) => void
  addKill: () => void
  addXp: () => void
  damage: (n: number) => void
  heal: (n: number) => void
  applyEffect: (type: PowerupType) => void
  tickEffects: () => void
  startWave: () => void
  nextWave: () => void
  tickWave: () => void
  tickFire: () => void
  resetFire: () => void
  tickDash: () => void
  triggerDash: () => void
  tickSpawn: () => boolean
  enemyDied: () => void
  reset: () => void
}

const INITIAL: Omit<GameState, keyof { [K in keyof GameState]: GameState[K] extends Function ? K : never }> = {
  hp: 5, maxHp: 5, score: 0, kills: 0, wave: 1,
  xp: 0, xpNext: 10,
  fireRate: 30, shotCount: 1, playerSpeed: 0.12,
  fireTimer: 0, dashTimer: 0, dashCooldown: 60,
  waveTimer: 0, waveDelay: 180,
  spawnQueue: 0, spawnTimer: 0, enemiesLeft: 0,
  activeEffects: {},
  running: false, gameOver: false, waveMessage: '',
}

export const useGameStore = create<GameState>((set, get) => ({
  ...INITIAL,

  setRunning: (v) => set({ running: v }),
  setGameOver: (v) => set({ gameOver: v }),
  setWaveMessage: (msg) => set({ waveMessage: msg }),

  addScore: (n) => set((s) => ({ score: s.score + n })),
  addKill: () => set((s) => ({ kills: s.kills + 1 })),

  addXp: () => set((s) => {
    const newXp = s.xp + 1
    if (newXp >= s.xpNext) {
      return { xp: 0, xpNext: Math.floor(s.xpNext * 1.4), hp: Math.min(s.maxHp, s.hp + 1) }
    }
    return { xp: newXp }
  }),

  damage: (n) => set((s) => {
    if (s.activeEffects.shield && s.activeEffects.shield > 0) return {}
    const hp = s.hp - n
    if (hp <= 0) return { hp: 0, gameOver: true, running: false }
    return { hp }
  }),

  heal: (n) => set((s) => ({ hp: Math.min(s.maxHp, s.hp + n) })),

  applyEffect: (type) => set((s) => {
    const effs = { ...s.activeEffects }
    const duration = 300
    effs[type] = (effs[type] || 0) + duration

    const updates: Partial<GameState> = { activeEffects: effs }
    if (type === 'rapidfire') updates.fireRate = 10
    if (type === 'multishot') updates.shotCount = 3
    if (type === 'speed') updates.playerSpeed = 0.22
    if (type === 'heal') updates.hp = Math.min(s.maxHp, s.hp + 2)
    return updates
  }),

  tickEffects: () => set((s) => {
    const effs = { ...s.activeEffects }
    let fireRate = s.fireRate
    let shotCount = s.shotCount
    let playerSpeed = s.playerSpeed

    for (const k of Object.keys(effs) as PowerupType[]) {
      effs[k] = (effs[k] || 0) - 1
      if ((effs[k] || 0) <= 0) {
        delete effs[k]
        if (k === 'rapidfire') fireRate = 30
        if (k === 'multishot') shotCount = 1
        if (k === 'speed') playerSpeed = 0.12
      }
    }
    return { activeEffects: effs, fireRate, shotCount, playerSpeed }
  }),

  startWave: () => set((s) => {
    const count = 8 + s.wave * 3
    return {
      enemiesLeft: count, spawnQueue: count,
      spawnTimer: 0, waveTimer: 0,
      waveMessage: `WAVE ${s.wave}!`
    }
  }),

  nextWave: () => set((s) => ({
    wave: s.wave + 1,
    waveTimer: s.waveDelay,
    waveMessage: `WAVE ${s.wave + 1} EM BREVE...`
  })),

  tickWave: () => set((s) => ({
    waveTimer: Math.max(0, s.waveTimer - 1)
  })),

  tickFire: () => set((s) => ({ fireTimer: s.fireTimer + 1 })),
  resetFire: () => set({ fireTimer: 0 }),

  tickDash: () => set((s) => ({ dashTimer: Math.max(0, s.dashTimer - 1) })),
  triggerDash: () => set({ dashTimer: 60 }),

  tickSpawn: () => {
    const s = get()
    if (s.spawnQueue <= 0) return false
    const interval = Math.max(8, 28 - s.wave * 2)
    if (s.spawnTimer + 1 >= interval) {
      set({ spawnTimer: 0, spawnQueue: s.spawnQueue - 1 })
      return true
    }
    set({ spawnTimer: s.spawnTimer + 1 })
    return false
  },

  enemyDied: () => set((s) => ({ enemiesLeft: s.enemiesLeft - 1 })),

  reset: () => set({
    ...INITIAL,
    running: true,
    wave: 1,
    activeEffects: {},
  }),
}))
