// @ts-nocheck
import { create } from 'zustand'

export type PowerupType = 'rapidfire' | 'multishot' | 'shield' | 'heal' | 'blast' | 'speed'
export type ClassType   = 'warrior' | 'assassin' | 'mage'

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
  bulletDamage: number

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

  // Upgrades (between-wave cards)
  upgrades: string[]
  pendingUpgrade: boolean

  // Class & session tracking
  selectedClass: ClassType | null
  blastCount: number       // blasts used this session
  xpMultiplier: number

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
  // New
  applyUpgrade: (id: string) => void
  setPendingUpgrade: (v: boolean) => void
  setClass: (c: ClassType | null) => void
  addBlast: () => void
}

function classStats(c: ClassType | null) {
  if (c === 'warrior')  return { hp: 8, maxHp: 8, playerSpeed: 0.11, shotCount: 1, fireRate: 30 }
  if (c === 'assassin') return { hp: 4, maxHp: 4, playerSpeed: 0.17, shotCount: 1, fireRate: 24 }
  if (c === 'mage')     return { hp: 5, maxHp: 5, playerSpeed: 0.12, shotCount: 2, fireRate: 38 }
  return                       { hp: 5, maxHp: 5, playerSpeed: 0.12, shotCount: 1, fireRate: 30 }
}

// Compute base values considering stacked upgrades
function computeBases(upgrades: string[], cls: ClassType | null) {
  const base = classStats(cls)
  const stackFR  = upgrades.filter(u => u === 'fast_reload').length
  const stackSC  = upgrades.filter(u => u === 'triple_shot').length
  const stackSpd = upgrades.filter(u => u === 'speed_boost').length
  return {
    fireRate:    Math.max(10, base.fireRate - stackFR * 4),
    shotCount:   Math.min(5,  base.shotCount + stackSC),
    playerSpeed: base.playerSpeed + stackSpd * 0.02,
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  hp: 5, maxHp: 5, score: 0, kills: 0, wave: 1,
  xp: 0, xpNext: 10,
  fireRate: 30, shotCount: 1, playerSpeed: 0.12, bulletDamage: 1,
  fireTimer: 0, dashTimer: 0, dashCooldown: 60,
  waveTimer: 0, waveDelay: 180,
  spawnQueue: 0, spawnTimer: 0, enemiesLeft: 0,
  activeEffects: {},
  upgrades: [],
  pendingUpgrade: false,
  selectedClass: null,
  blastCount: 0,
  xpMultiplier: 1,
  running: false, gameOver: false, waveMessage: '',

  setRunning: (v) => set({ running: v }),
  setGameOver: (v) => set({ gameOver: v }),
  setWaveMessage: (msg) => set({ waveMessage: msg }),

  addScore: (n) => set((s) => ({ score: s.score + n })),
  addKill:  ()  => set((s) => ({ kills: s.kills + 1 })),

  addXp: () => set((s) => {
    const gain = s.xpMultiplier
    const newXp = s.xp + gain
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
    if (type === 'rapidfire') updates.fireRate    = 10
    if (type === 'multishot') updates.shotCount   = 3
    if (type === 'speed')     updates.playerSpeed = 0.22
    if (type === 'heal')      updates.hp = Math.min(s.maxHp, s.hp + 2)
    if (type === 'blast')     { updates.blastCount = s.blastCount + 1 }
    return updates
  }),

  tickEffects: () => set((s) => {
    const effs = { ...s.activeEffects }
    const bases = computeBases(s.upgrades, s.selectedClass)
    let { fireRate, shotCount, playerSpeed } = s

    for (const k of Object.keys(effs) as PowerupType[]) {
      effs[k] = (effs[k] || 0) - 1
      if ((effs[k] || 0) <= 0) {
        delete effs[k]
        if (k === 'rapidfire') fireRate    = bases.fireRate
        if (k === 'multishot') shotCount   = bases.shotCount
        if (k === 'speed')     playerSpeed = bases.playerSpeed
      }
    }
    return { activeEffects: effs, fireRate, shotCount, playerSpeed }
  }),

  startWave: () => set((s) => {
    const count = 8 + s.wave * 3
    // Regen upgrade: heal 1 HP every 3 waves
    const regenCount = s.upgrades.filter(u => u === 'regen').length
    const regenHeal = (s.wave % 3 === 0) ? regenCount : 0
    // Shield start upgrade: give shield at wave start
    const shieldStart = s.upgrades.includes('shield_start')
    const effs = shieldStart
      ? { ...s.activeEffects, shield: Math.max(s.activeEffects.shield || 0, 120) }
      : s.activeEffects
    return {
      enemiesLeft: count, spawnQueue: count,
      spawnTimer: 0, waveTimer: 0,
      waveMessage: `WAVE ${s.wave}!`,
      hp: Math.min(s.maxHp, s.hp + regenHeal),
      activeEffects: effs,
    }
  }),

  nextWave: () => set((s) => ({
    wave: s.wave + 1,
    waveTimer: s.waveDelay,
    waveMessage: `WAVE ${s.wave + 1} EM BREVE...`,
    pendingUpgrade: true,
    running: false,
  })),

  tickWave: () => set((s) => ({ waveTimer: Math.max(0, s.waveTimer - 1) })),

  tickFire:    ()  => set((s) => ({ fireTimer: s.fireTimer + 1 })),
  resetFire:   ()  => set({ fireTimer: 0 }),
  tickDash:    ()  => set((s) => ({ dashTimer: Math.max(0, s.dashTimer - 1) })),
  triggerDash: ()  => set({ dashTimer: 60 }),

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

  // ── New actions ───────────────────────────────────────────────────────────────

  applyUpgrade: (id) => set((s) => {
    const upgrades = [...s.upgrades, id]
    const updates: Partial<GameState> = { upgrades, pendingUpgrade: false, running: true }
    // Permanent stat changes (only when no powerup active that overrides)
    const noRapidfire = !(s.activeEffects.rapidfire && s.activeEffects.rapidfire > 0)
    const noMultishot = !(s.activeEffects.multishot && s.activeEffects.multishot > 0)
    const noSpeed     = !(s.activeEffects.speed     && s.activeEffects.speed     > 0)
    if (id === 'extra_hp')       { updates.maxHp = s.maxHp + 1; updates.hp = Math.min(s.maxHp + 1, s.hp + 1) }
    if (id === 'triple_shot'  && noMultishot) updates.shotCount   = Math.min(5, s.shotCount + 1)
    if (id === 'fast_reload'  && noRapidfire) updates.fireRate    = Math.max(10, s.fireRate - 4)
    if (id === 'speed_boost'  && noSpeed)     updates.playerSpeed = s.playerSpeed + 0.02
    if (id === 'fire_bullets')    updates.bulletDamage = (s.bulletDamage || 1) + 1
    if (id === 'double_xp')       updates.xpMultiplier = Math.min(4, s.xpMultiplier + 1)
    return updates
  }),

  setPendingUpgrade: (v) => set({ pendingUpgrade: v }),

  setClass: (c) => set({ selectedClass: c }),

  addBlast: () => set((s) => ({ blastCount: s.blastCount + 1 })),

  reset: () => set((s) => {
    const base = classStats(s.selectedClass)
    return {
      ...base,
      score: 0, kills: 0, wave: 1,
      xp: 0, xpNext: 10,
      bulletDamage: 1,
      fireTimer: 0, dashTimer: 0, dashCooldown: 60,
      waveTimer: 0, waveDelay: 180,
      spawnQueue: 0, spawnTimer: 0, enemiesLeft: 0,
      activeEffects: {},
      upgrades: [],
      pendingUpgrade: false,
      blastCount: 0,
      xpMultiplier: 1,
      running: true,
      gameOver: false,
      waveMessage: '',
      selectedClass: s.selectedClass,
    }
  }),
}))
