/**
 * 天气数据采集测试脚本
 * 运行: npx tsx src/scripts/test-weather.ts
 */

import process from 'node:process'
import { prisma } from '../common/prisma.js'
import { WUAccuracyAnalyzer } from '../services/wu/wu-accuracy.service.js'
import { WUClientService } from '../services/wu/wu-client.service.js'

async function main() {
  const wuClient = new WUClientService()

  console.log('=== 1. 抓取 10 天预报 ===')
  const forecasts = await wuClient.getDailyForecasts()
  for (const f of forecasts) {
    console.log(`  ${f.date} (${f.dayOfWeek})  High=${f.highF}°F  Low=${f.lowF}°F  ${f.narrative.slice(0, 60)}`)
  }

  console.log(`\n=== 2. 抓取 30 天历史观测 ===`)
  const history = await wuClient.getHistoricalDaily()
  for (const h of history.slice(0, 10)) {
    const highStr = h.highF != null ? `${h.highF}°F` : 'N/A'
    const lowStr = h.lowF != null ? `${h.lowF}°F` : 'N/A'
    console.log(`  ${h.date} (${h.dayOfWeek})  High=${highStr}  Low=${lowStr}  ${h.weather}`)
  }
  console.log(`  ... 共 ${history.length} 条`)

  console.log('\n=== 3. DB 写入验证 ===')
  const fcCount = await prisma.weatherForecast.count()
  const obsCount = await prisma.weatherObservation.count()
  console.log(`  WeatherForecast: ${fcCount} 条`)
  console.log(`  WeatherObservation: ${obsCount} 条`)

  // 查看最新几条
  const recentForecasts = await prisma.weatherForecast.findMany({
    orderBy: { fetchedAt: 'desc' },
    take: 3,
  })
  console.log('\n  最近写入的预报:')
  for (const f of recentForecasts) {
    console.log(`    ${f.date} High=${f.highF}°F leadDays=${f.leadDays} fetchedAt=${f.fetchedAt.toISOString()}`)
  }

  const recentObs = await prisma.weatherObservation.findMany({
    orderBy: { date: 'desc' },
    take: 5,
  })
  console.log('\n  最近写入的观测:')
  for (const o of recentObs) {
    console.log(`    ${o.date} High=${o.highF}°F Low=${o.lowF}°F ${o.weather}`)
  }

  console.log('\n=== 4. 偏差分析 ===')
  const analyzer = new WUAccuracyAnalyzer(wuClient)
  await analyzer.collectDeviations()
  await analyzer.printSummary()

  const deviations = analyzer.getDeviations()
  if (deviations.length > 0) {
    console.log('\n偏差明细:')
    for (const d of deviations.slice(0, 10)) {
      console.log(`  ${d.date}  预报=${d.forecastHigh}°F  实际=${d.actualHigh}°F  偏差=${d.deviationHigh > 0 ? '+' : ''}${d.deviationHigh}°F`)
    }
  }

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('测试失败:', err)
  process.exit(1)
})
