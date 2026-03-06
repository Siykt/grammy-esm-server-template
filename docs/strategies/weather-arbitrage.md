# 天气预报套利策略（Weather Arbitrage）

## 概述

基于 Weather Underground（WU）KLGA 站点预报与历史偏差，对 Polymarket 纽约高温天气市场做概率估计，在 YES/NO 两侧寻找正期望值（EV）机会并下单。

- **结算源一致**：Polymarket 天气市场以 WU KLGA 数据结算，策略使用同一数据源建模。
- **市场结构**：每个事件下 9 个子市场，对应 9 个温度区间（如 40–41°F），尾部为开放区间（≤39°F、≥54°F 等）。
- **双侧扫描**：同时评估 YES（该区间发生）和 NO（该区间不发生）的 edge。

---

## 核心流程

### 1. 初始化（onStart）

1. **历史回填**：调用 `backfillHistory(90)`，逐日抓取 WU 历史页面，将过去 90 天观测写入 `WeatherObservation`，请求间隔 2 秒。
2. **偏差采集**：`collectDeviations()` 抓取当前 10 天预报与 30 天历史，与 DB 中观测对比，生成预报–实际偏差并加载到内存。
3. **摘要输出**：打印高温预报准确率（样本量、均值/标准差、±2°F / ±5°F 命中率等）。

### 2. 扫描机会（scan）

1. **获取预报**：`getDailyForecasts()` 拉取 WU 10 天逐日预报。
2. **数据新鲜度**：若最近一次成功抓取超过 2 小时（`isForecastStale()`），或连续抓取失败 ≥3 次，则跳过本次扫描并告警。
3. **最小样本量**：若偏差记录数 `< minSampleSize`（默认 15），跳过扫描并打日志。
4. **查找事件**：按 `tag_slug: 'weather'` 与 `eventSlugPrefix: 'highest-temperature-in-nyc-on-'` 筛选未关闭事件。
5. **逐事件处理**：
   - 从 event slug 解析目标日期，取该日 WU 预报高温。
   - 解析子市场（温度区间、YES/NO token、orderbook 买卖价）。
   - 计算 **lead days** = 目标日期 − 今日（天数）。
   - 调用 **按 lead days 分层的概率**：`calculateBucketProbabilitiesForLeadDays(forecastHigh, buckets, leadDays)`。
   - 对每个区间的 YES / NO 分别计算公平概率、bestAsk、edge、EV；通过价格与 edge 过滤后，用凯利公式计算下注额并生成机会。

### 3. 概率模型（WUAccuracyAnalyzer）

- **Lead days 分档**：
  - **近期** 0–2 天
  - **中期** 3–5 天
  - **远期** 6+ 天  
  仅使用与当前目标日期同档的历史偏差，避免远期预报被高估。

- **档内样本 ≥5**：用该档偏差做**频率法**：对每条偏差得到「实际温度 = 预报 − 偏差」，统计落入各温度区间的频率；再对每个区间的频率做 **Wilson 分数区间下界**（保守概率），并归一化。
- **档内样本 <5**：用**正态近似**，均值 = 预报 − 该档均值偏差，标准差取该档 std 与档位下限的最大值：
  - 近期 std 下限 2.0°F
  - 中期 3.5°F
  - 远期 5.0°F  

  再对各区间用正态 CDF 求概率。

### 4. 仓位与机会筛选（evaluateSide）

- **价格过滤**：`minPrice ≤ bestAsk ≤ maxPrice`（默认 3¢–95¢）。
- **Edge 过滤**：`edge = fairProbability − bestAsk ≥ minEdge`（默认 5%）。
- **凯利下注**：
  - 公式：`kellyBet = maxBetSize * (edge / (1 - bestAsk)) * kellyFraction`
  - `kellyFraction` 默认 0.25（1/4 Kelly）。
  - 实际下注额：`betSize = clamp(minBetSize, maxBetSize, kellyBet)`，默认最小 $2、最大 $50。

### 5. 执行（execute）

1. **每日熔断**：查询当日该策略在 DB 中的成交记录，汇总 `price × size`；若 ≥ `maxDailyLoss`（默认 $50），直接返回失败并告警。
2. **余额与挂单**：检查可用余额、该 token 已有挂单占用，得到可用预算。
3. **VWAP 验证**：按订单簿 asks 计算能吃掉目标数量 80% 以上的成交量加权均价（VWAP）；若流动性不足则失败。
4. **Edge 再校验**：用 VWAP 重算 `adjustedEdge = fairProbability − vwap`，若 `< minEdge` 则放弃。
5. **下单**：以 VWAP 价格（四舍五入到分）发限价单，数量不超过预算与原定 size。

---

## 配置项

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `minEdge` | 0.05 | 最小 edge（5%），低于不建仓 |
| `maxBetSize` | 50 | 单笔最大下注金额（美元） |
| `minPrice` | 0.03 | bestAsk 下限，过滤低流动性 |
| `maxPrice` | 0.95 | bestAsk 上限 |
| `eventSlugPrefix` | `highest-temperature-in-nyc-on-` | 事件 slug 前缀 |
| `stationCode` | KLGA | WU 站点 |
| `kellyFraction` | 0.25 | 凯利比例（1/4 Kelly） |
| `minBetSize` | 2 | 单笔最小下注（美元） |
| `minSampleSize` | 15 | 偏差样本数低于此值不扫描 |
| `maxDailyLoss` | 50 | 当日累计投入上限，超过则熔断 |

---

## 数据与风控要点

- **偏差数据**：来自 DB 的 `WeatherForecast` 与 `WeatherObservation`，按 (date, leadDays) 保留多条，供分档使用。
- **Wilson 下界**：对频率法得到的各区间概率做 95% 置信区间下界，再归一化，减少小样本下的虚假 edge。
- **数据健康**：连续抓取失败 ≥3 次或预报数据超过 2 小时未更新时，本次扫描跳过并告警。
- **每日熔断**：按 DB 中当日、本策略的成交汇总投入，超过 `maxDailyLoss` 则不再执行新单。

---

## 相关代码

- 策略实现：`src/strategies/arbitrage/weather.strategy.ts`
- 准确率与分层概率：`src/services/wu/wu-accuracy.service.ts`
- WU 数据与回填：`src/services/wu/wu-client.service.ts`
