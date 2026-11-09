// 高仙机器人助手 —— 实时状态通道
//
// 平台实时页用的是 escafe 的 socket.io 通道：登录后 emit createRealtimeViewSession，
// 服务端持续推送 forwardRealtimeViewData，其中 deviceStatus 带电量、充电电流、
// 清扫状态、水箱、定位状态等。这里复用同一套协议，只订阅状态、不订阅点云和视频。

import { io } from 'socket.io-client'

const ESCAFE_URL = 'https://escafe.gs-robot.com'

function decodeUserId(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const claims = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
    return claims?.sub || ''
  } catch {
    return ''
  }
}

export function normalizeStatus(raw, receivedAt) {
  if (!raw) return null
  return {
    battery: Number(raw.battery) || 0,
    charging: raw.chargerStatus === true,
    chargerCurrent: Number(raw.chargerCurrent) || 0,
    cleaning: raw.cleaningWorking === true,
    autoMode: raw.autoMode === true,
    located: raw.locationStatus === true,
    waterLevel: Number(raw.waterLevel) || 0,
    cleanWater: Number(raw.cleanWaterLevel) || 0,
    dirtyWater: Number(raw.sewageLevel) || 0,
    emergency: raw.emergency === true || raw.emergencyStop === true,
    fanLevel: Number(raw.fanLevel),
    receivedAt: receivedAt ?? Date.now(),
  }
}

export class LiveFeed {
  #token
  #socket = null
  #sn = ''
  #state = null
  #pose = null
  #receivedAt = 0
  #startedAt = 0

  constructor(token) {
    this.#token = token
  }

  get sn() {
    return this.#sn
  }

  state() {
    if (!this.#state && !this.#pose) return null
    return {
      ...(this.#state ?? {}),
      pose: this.#pose ? { x: this.#pose.x, y: this.#pose.y, theta: this.#pose.theta } : null,
      sn: this.#sn,
      ageMs: Date.now() - this.#receivedAt,
    }
  }

  // 同一时间只订阅一台设备；切换设备时关掉旧连接
  async watch(sn, token = this.#token) {
    if (this.#sn === sn && this.#socket?.connected) return
    this.close()
    this.#sn = sn
    this.#state = null
    this.#pose = null
    this.#startedAt = Date.now()

    const userId = decodeUserId(token)
    const socket = io(ESCAFE_URL, {
      transports: ['websocket'],
      auth: { accessToken: `bearer ${token}` },
      reconnection: true,
      reconnectionDelay: 2000,
      timeout: 15000,
    })
    this.#socket = socket

    socket.on('connect', () => {
      socket.emit('createRealtimeViewSession', {
        productId: sn,
        userId: userId ? `${userId}@gs-robot.gas` : '',
        config: { cameras: { include: false }, laserMatrix: { include: false } },
      })
    })
    socket.on('forwardRealtimeViewData', (payload) => {
      if (payload?.productId && payload.productId !== this.#sn) return
      const data = payload?.data ?? {}
      const receivedAt = Number(payload?.escaReceiveTime) || Date.now()
      // eventType 1 带机器人实时位姿；eventType 2 带 deviceStatus
      const pos = data.robotPosition
      if (pos && Number.isFinite(Number(pos.x))) {
        // 平台这一路坐标是厘米，统一换算成米（与地图 origin 单位一致）
        const scale = Math.abs(Number(pos.x)) > 500 || Math.abs(Number(pos.y)) > 500 ? 0.01 : 1
        this.#pose = {
          x: Number(pos.x) * scale,
          y: Number(pos.y) * scale,
          theta: Number(pos.theta) || 0,
          receivedAt,
        }
      }
      if (data.deviceStatus) {
        this.#state = normalizeStatus(data.deviceStatus, receivedAt)
        this.#receivedAt = Date.now()
      }
    })
    socket.on('connect_error', () => {
      // 由外部按“无实时数据”处理，不抛给调用方
    })
  }

  close() {
    if (this.#socket) {
      try {
        this.#socket.close()
      } catch {
        // 忽略关闭异常
      }
    }
    this.#socket = null
    this.#sn = ''
  }
}