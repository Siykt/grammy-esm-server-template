/**
 * 天气市场发现测试脚本
 * 验证 Gamma API 查询和温度区间解析
 * 运行: npx tsx src/scripts/test-market-discovery.ts
 */

import type { TemperatureBucket } from '../services/wu/index.js'
import process from 'node:process'
import axios from 'axios'
import { WUAccuracyAnalyzer } from '../services/wu/wu-accuracy.service.js'
import { WUClientService } from '../services/wu/wu-client.service.js'

interface GammaEvent {
  slug: string
  title: string
  active: boolean
  closed: boolean
  tags: { label: string }[]
  markets: {
    question: string
    conditionId: string
    clobTokenIds: string[]
    outcomePrices?: string
  }[]
}

async function main() {
  // 1. 测试 Gamma API pagination 端点
  console.log('=== 1. Gamma API 市场发现 ===')
  const res = await axios.get('https://gamma-api.polymarket.com/events/pagination', {
    params: {
      tag_slug: 'weather',
      active: true,
      closed: false,
      archived: false,
      limit: 50,
      offset: 0,
    },
  })

  const events = (res.data as { data: GammaEvent[] }).data
  const nycEvents = events.filter((e: GammaEvent) =>
    e.slug.startsWith('highest-temperature-in-nyc-on-'),
  )

  console.log(`  总天气事件: ${events.length}`)
  console.log(`  NYC 温度事件: ${nycEvents.length}`)
  console.log()

  for (const e of nycEvents) {
    console.log(`  ${e.slug}`)
    console.log(`    title: ${e.title}`)
    console.log(`    markets: ${e.markets.length}`)
  }

  // 2. 测试温度区间解析
  if (nycEvents.length > 0) {
    const event = nycEvents[0] as GammaEvent
    console.log(`\n=== 2. 温度区间解析 (${event.slug}) ===`)

    for (const m of event.markets) {
      try {
        const bucket = WUAccuracyAnalyzer.parseBucketFromLabel(m.question)
        const prices = m.outcomePrices ? JSON.parse(m.outcomePrices) as string[] : []
        const yesPrice = prices[0] ? Number.parseFloat(prices[0]) : 0
        console.log(
          `  ${m.question}`
          + `\n    → 区间: [${bucket.lowerBound ?? '-∞'}, ${bucket.upperBound ?? '+∞'}]`
          + ` | YES价格: ${(yesPrice * 100).toFixed(1)}¢`
          + ` | tokenId: ${m.clobTokenIds?.[0]?.slice(0, 16)}...`,
        )
      }
      catch (err) {
        console.log(`  ✗ 解析失败: ${m.question}`)
        console.log(`    错误: ${err}`)
      }
    }
  }

  // 3. 测试 slug 日期提取
  console.log('\n=== 3. Slug 日期提取 ===')
  const testSlugs = [
    'highest-temperature-in-nyc-on-march-4-2026',
    'highest-temperature-in-nyc-on-march-5-2026',
    'highest-temperature-in-nyc-on-february-27-2026',
  ]
  for (const slug of testSlugs) {
    const match = slug.match(/on-(\w+)-(\d+)-(\d{4})$/)
    if (match) {
      const months: Record<string, string> = {
        january: '01',
        february: '02',
        march: '03',
        april: '04',
        may: '05',
        june: '06',
        july: '07',
        august: '08',
        september: '09',
        october: '10',
        november: '11',
        december: '12',
      }
      const month = months[match[1]?.toLowerCase() ?? '']
      const day = match[2]?.padStart(2, '0')
      console.log(`  ${slug} → ${match[3]}-${month}-${day}`)
    }
    else {
      console.log(`  ${slug} → 解析失败`)
    }
  }

  // 4. 测试概率计算（使用正态近似，因为偏差数据不足）
  if (nycEvents.length > 0) {
    const event = nycEvents[0] as GammaEvent
    console.log(`\n=== 4. 概率计算测试 ===`)

    const wuClient = new WUClientService()
    const analyzer = new WUAccuracyAnalyzer(wuClient)

    // 从 DB 加载偏差（可能为 0）
    const deviations = await analyzer.loadFromDB()
    console.log(`  偏差记录: ${deviations.length} 条`)

    const buckets = event.markets.map((m) => {
      try {
        return WUAccuracyAnalyzer.parseBucketFromLabel(m.question)
      }
      catch {
        return null
      }
    }).filter(Boolean) as import('../services/wu/wu.types.js').TemperatureBucket[]

    // 获取预报
    const forecasts = await wuClient.getDailyForecasts()
    const slug = event.slug
    const dateMatch = slug.match(/on-(\w+)-(\d+)-(\d{4})$/)
    if (dateMatch) {
      const months: Record<string, string> = {
        january: '01',
        february: '02',
        march: '03',
        april: '04',
        may: '05',
        june: '06',
        july: '07',
        august: '08',
        september: '09',
        october: '10',
        november: '11',
        december: '12',
      }
      const month = months[dateMatch[1]?.toLowerCase() ?? '']
      const day = dateMatch[2]?.padStart(2, '0')
      const targetDate = `${dateMatch[3]}-${month}-${day}`

      const forecast = forecasts.find(f => f.date === targetDate)
      if (forecast) {
        console.log(`  目标日期: ${targetDate}`)
        console.log(`  WU 预报高温: ${forecast.highF}°F`)

        const probs = analyzer.calculateBucketProbabilities(forecast.highF, buckets)
        console.log(`\n  概率分布:`)

        for (let i = 0; i < probs.length; i++) {
          const p = probs[i] as TemperatureBucket
          const m = event.markets[i]
          const prices = m?.outcomePrices ? JSON.parse(m.outcomePrices) as string[] : []
          const yesPrice = prices[0] ? Number.parseFloat(prices[0]) : 0
          const edge = p.probability - yesPrice
          const bar = '█'.repeat(Math.round(p.probability * 40))
          console.log(
            `    [${String(p.lowerBound ?? '-∞').padStart(4)}, ${String(p.upperBound ?? '+∞').padEnd(4)}]`
            + ` 模型=${(p.probability * 100).toFixed(1).padStart(5)}%`
            + ` 市场=${(yesPrice * 100).toFixed(1).padStart(5)}¢`
            + ` edge=${(edge * 100).toFixed(1).padStart(6)}%`
            + ` ${bar}`,
          )
        }
      }
      else {
        console.log(`  ✗ 无 ${targetDate} 的预报`)
      }
    }
  }
}

main().catch((err) => {
  console.error('测试失败:', err)
  process.exit(1)
})
