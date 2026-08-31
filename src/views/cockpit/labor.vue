<template>
  <div class="cockpit-page">
    <div class="cockpit-header">
      <div class="header-left">
        <h1><el-icon style="margin-right:8px"><UserFilled /></el-icon>辖区劳动力资源概况</h1>
      </div>
      <div class="header-center">
        <span class="time-display">{{ currentTime }}</span>
      </div>
      <div class="header-right">
        <el-select v-model="areaFilter" placeholder="选择区域" size="small" style="width:140px;margin-right:12px">
          <el-option label="全市" value="all" />
          <el-option label="A区" value="a" />
          <el-option label="B区" value="b" />
          <el-option label="C区" value="c" />
        </el-select>
        <el-date-picker v-model="dateFilter" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" size="small" style="width:240px;margin-right:12px" />
        <el-button size="small" @click="refreshData"><el-icon><Refresh /></el-icon> 刷新</el-button>
        <el-button size="small" @click="toggleFullscreen"><el-icon><FullScreen /></el-icon> 全屏</el-button>
        <el-button size="small" @click="exportData"><el-icon><Download /></el-icon> 导出</el-button>
      </div>
    </div>

    <div class="cockpit-stats">
      <div class="stat-card">
        <div class="stat-icon" style="background:linear-gradient(135deg,#2563eb,#1e40af)">
          <el-icon :size="28"><User /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-label">劳动力总数</span>
          <span class="stat-value">{{ formatNum(stats.totalLabor) }}</span>
          <span class="stat-trend up">↑ 2.3%</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:linear-gradient(135deg,#10b981,#059669)">
          <el-icon :size="28"><Briefcase /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-label">就业人口</span>
          <span class="stat-value">{{ formatNum(stats.employed) }}</span>
          <span class="stat-trend up">↑ 1.8%</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:linear-gradient(135deg,#f59e0b,#d97706)">
          <el-icon :size="28"><TrendCharts /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-label">就业率</span>
          <span class="stat-value">{{ stats.employmentRate }}%</span>
          <span class="stat-trend up">↑ 0.5%</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:linear-gradient(135deg,#ef4444,#dc2626)">
          <el-icon :size="28"><WarningFilled /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-label">登记失业人数</span>
          <span class="stat-value">{{ formatNum(stats.unemployed) }}</span>
          <span class="stat-trend down">↓ 3.2%</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed)">
          <el-icon :size="28"><School /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-label">高校毕业生</span>
          <span class="stat-value">{{ formatNum(stats.graduates) }}</span>
          <span class="stat-trend up">↑ 5.1%</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:linear-gradient(135deg,#ec4899,#db2777)">
          <el-icon :size="28"><Female /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-label">女性就业人口</span>
          <span class="stat-value">{{ formatNum(stats.femaleEmployed) }}</span>
          <span class="stat-trend up">↑ 1.2%</span>
        </div>
      </div>
    </div>

    <div class="cockpit-charts">
      <div class="chart-card large">
        <div class="chart-title">
          <span>劳动力年龄结构分布</span>
          <el-radio-group v-model="ageChartType" size="small">
            <el-radio-button value="bar">柱状图</el-radio-button>
            <el-radio-button value="pie">饼图</el-radio-button>
          </el-radio-group>
        </div>
        <div ref="ageChartRef" class="chart-box"></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">
          <span>学历结构分布</span>
        </div>
        <div ref="eduChartRef" class="chart-box"></div>
      </div>
    </div>

    <div class="cockpit-charts">
      <div class="chart-card">
        <div class="chart-title">
          <span>各区县劳动力分布</span>
        </div>
        <div ref="districtChartRef" class="chart-box"></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">
          <span>劳动力技能等级分布</span>
        </div>
        <div ref="skillChartRef" class="chart-box"></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">
          <span>劳动力产业分布</span>
        </div>
        <div ref="industryChartRef" class="chart-box"></div>
      </div>
    </div>

    <div class="cockpit-table-card">
      <div class="table-title">
        <span>各区县劳动力资源明细</span>
      </div>
      <el-table :data="districtData" stripe style="width:100%" :header-cell-style="{background:'#f0f4ff',color:'#1f2937'}">
        <el-table-column prop="district" label="区县" width="120" />
        <el-table-column prop="totalLabor" label="劳动力总数" width="140" />
        <el-table-column prop="employed" label="就业人口" width="140" />
        <el-table-column prop="employmentRate" label="就业率" width="120" />
        <el-table-column prop="unemployed" label="失业人数" width="120" />
        <el-table-column prop="graduates" label="高校毕业生" width="140" />
        <el-table-column prop="femaleRate" label="女性占比" width="120" />
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import * as echarts from 'echarts'
import { UserFilled, User, Briefcase, TrendCharts, WarningFilled, School, Female, Refresh, FullScreen, Download } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'

const currentTime = ref(dayjs().format('YYYY-MM-DD HH:mm:ss'))
const areaFilter = ref('all')
const dateFilter = ref<[Date, Date]>([dayjs().subtract(1, 'month').toDate(), dayjs().toDate()])
const ageChartType = ref('bar')
const ageChartRef = ref<HTMLElement>()
const eduChartRef = ref<HTMLElement>()
const districtChartRef = ref<HTMLElement>()
const skillChartRef = ref<HTMLElement>()
const industryChartRef = ref<HTMLElement>()

let ageChart: echarts.ECharts | null = null
let eduChart: echarts.ECharts | null = null
let districtChart: echarts.ECharts | null = null
let skillChart: echarts.ECharts | null = null
let industryChart: echarts.ECharts | null = null
let timeTimer: ReturnType<typeof setInterval> | null = null

const formatNum = (n: number) => {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return n.toLocaleString()
}

const stats = {
  totalLabor: 3865000,
  employed: 3521000,
  employmentRate: 91.1,
  unemployed: 128000,
  graduates: 285000,
  femaleEmployed: 1680000
}

const districtData = [
  { district: 'A区', totalLabor: '68.5万', employed: '63.2万', employmentRate: '92.3%', unemployed: '1.2万', graduates: '5.8万', femaleRate: '46.2%' },
  { district: 'B区', totalLabor: '52.3万', employed: '47.8万', employmentRate: '91.4%', unemployed: '0.9万', graduates: '4.2万', femaleRate: '45.8%' },
  { district: 'C区', totalLabor: '45.8万', employed: '41.5万', employmentRate: '90.6%', unemployed: '0.8万', graduates: '3.6万', femaleRate: '44.9%' },
  { district: 'D区', totalLabor: '38.2万', employed: '34.6万', employmentRate: '90.6%', unemployed: '0.7万', graduates: '3.1万', femaleRate: '45.3%' },
  { district: 'E区', totalLabor: '35.6万', employed: '32.8万', employmentRate: '92.1%', unemployed: '0.5万', graduates: '2.8万', femaleRate: '46.8%' },
  { district: 'F区', totalLabor: '28.4万', employed: '25.6万', employmentRate: '90.1%', unemployed: '0.5万', graduates: '2.2万', femaleRate: '44.5%' },
  { district: 'G区', totalLabor: '22.7万', employed: '20.5万', employmentRate: '90.3%', unemployed: '0.4万', graduates: '1.7万', femaleRate: '45.1%' }
]

const renderAgeChart = () => {
  if (!ageChartRef.value) return
  if (!ageChart) ageChart = echarts.init(ageChartRef.value)
  const ageGroups = ['16-24岁', '25-34岁', '35-44岁', '45-54岁', '55-60岁']
  const values = [45.8, 98.6, 85.3, 42.1, 22.4]
  if (ageChartType.value === 'bar') {
    ageChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '8%', top: '8%', containLabel: true },
      xAxis: { type: 'category', data: ageGroups, axisLabel: { color: '#6b7280' }, axisLine: { lineStyle: { color: '#e5e7eb' } } },
      yAxis: { type: 'value', name: '万人', axisLabel: { color: '#6b7280' }, splitLine: { lineStyle: { color: '#f3f4f6' } } },
      series: [{
        type: 'bar', data: values,
        itemStyle: { borderRadius: [4, 4, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#2563eb' }, { offset: 1, color: '#93c5fd' }]) },
        barWidth: '40%'
      }]
    })
  } else {
    ageChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}万人 ({d}%)' },
      series: [{
        type: 'pie', radius: ['40%', '70%'], center: ['50%', '50%'],
        data: ageGroups.map((n, i) => ({ name: n, value: values[i] })),
        label: { color: '#6b7280', fontSize: 12 },
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' } }
      }]
    })
  }
}

const renderEduChart = () => {
  if (!eduChartRef.value) return
  if (!eduChart) eduChart = echarts.init(eduChartRef.value)
  eduChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}万人 ({d}%)' },
    series: [{
      type: 'pie', radius: ['45%', '70%'], center: ['50%', '50%'],
      data: [
        { name: '本科及以上', value: 78.5, itemStyle: { color: '#2563eb' } },
        { name: '大专', value: 95.2, itemStyle: { color: '#3b82f6' } },
        { name: '高中/中专', value: 112.6, itemStyle: { color: '#60a5fa' } },
        { name: '初中及以下', value: 82.3, itemStyle: { color: '#93c5fd' } }
      ],
      label: { color: '#6b7280', fontSize: 12 },
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' } }
    }]
  })
}

const renderDistrictChart = () => {
  if (!districtChartRef.value) return
  if (!districtChart) districtChart = echarts.init(districtChartRef.value)
  districtChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '8%', top: '6%', containLabel: true },
    xAxis: { type: 'category', data: districtData.map(d => d.district), axisLabel: { color: '#6b7280', rotate: 30, fontSize: 11 }, axisLine: { lineStyle: { color: '#e5e7eb' } } },
    yAxis: { type: 'value', name: '万人', axisLabel: { color: '#6b7280' }, splitLine: { lineStyle: { color: '#f3f4f6' } } },
    series: [{
      type: 'bar', data: districtData.map(d => parseFloat(d.totalLabor)),
      itemStyle: { borderRadius: [4, 4, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#10b981' }, { offset: 1, color: '#a7f3d0' }]) },
      barWidth: '35%'
    }]
  })
}

const renderSkillChart = () => {
  if (!skillChartRef.value) return
  if (!skillChart) skillChart = echarts.init(skillChartRef.value)
  skillChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '8%', top: '6%', containLabel: true },
    xAxis: { type: 'category', data: ['高级技师', '技师', '高级工', '中级工', '初级工', '无技能等级'], axisLabel: { color: '#6b7280', fontSize: 11 }, axisLine: { lineStyle: { color: '#e5e7eb' } } },
    yAxis: { type: 'value', name: '万人', axisLabel: { color: '#6b7280' }, splitLine: { lineStyle: { color: '#f3f4f6' } } },
    series: [{
      type: 'bar', data: [12.5, 28.3, 65.8, 85.2, 96.5, 115.6],
      itemStyle: { borderRadius: [4, 4, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#f59e0b' }, { offset: 1, color: '#fde68a' }]) },
      barWidth: '35%'
    }]
  })
}

const renderIndustryChart = () => {
  if (!industryChartRef.value) return
  if (!industryChart) industryChart = echarts.init(industryChartRef.value)
  industryChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}万人 ({d}%)' },
    series: [{
      type: 'pie', radius: ['45%', '70%'], center: ['50%', '50%'],
      data: [
        { name: '第一产业', value: 42.5, itemStyle: { color: '#10b981' } },
        { name: '第二产业', value: 128.3, itemStyle: { color: '#3b82f6' } },
        { name: '第三产业', value: 181.3, itemStyle: { color: '#8b5cf6' } }
      ],
      label: { color: '#6b7280', fontSize: 12 },
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' } }
    }]
  })
}

const refreshData = () => {
  renderAgeChart()
  renderEduChart()
  renderDistrictChart()
  renderSkillChart()
  renderIndustryChart()
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

const exportData = () => {
  ElMessage.success('报表数据导出中，请稍候...')
}

watch(ageChartType, () => nextTick(renderAgeChart))

onMounted(() => {
  timeTimer = setInterval(() => { currentTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss') }, 1000)
  nextTick(() => { setTimeout(refreshData, 100) })
  window.addEventListener('resize', () => { [ageChart, eduChart, districtChart, skillChart, industryChart].forEach(c => c?.resize()) })
})

onUnmounted(() => {
  if (timeTimer) clearInterval(timeTimer)
  ;[ageChart, eduChart, districtChart, skillChart, industryChart].forEach(c => c?.dispose())
})
</script>

<style scoped>
.cockpit-page { padding: 16px; background: #f0f4ff; min-height: calc(100vh - 100px); }
.cockpit-header { display:flex; align-items:center; justify-content:space-between; background:#fff; padding:12px 20px; border-radius:12px; margin-bottom:16px; box-shadow:0 1px 3px rgba(0,0,0,0.04); flex-wrap:wrap; gap:8px; }
.header-left h1 { font-size:18px; color:#1f2937; font-weight:600; display:flex; align-items:center; margin:0; }
.header-center .time-display { font-size:14px; color:#6b7280; font-family:monospace; }
.header-right { display:flex; align-items:center; flex-wrap:wrap; gap:6px; }
.cockpit-stats { display:grid; grid-template-columns:repeat(6,1fr); gap:12px; margin-bottom:16px; }
.stat-card { background:#fff; border-radius:12px; padding:16px; display:flex; align-items:center; gap:14px; box-shadow:0 1px 3px rgba(0,0,0,0.04); transition:all 0.3s; }
.stat-card:hover { transform:translateY(-2px); box-shadow:0 4px 12px rgba(0,0,0,0.08); }
.stat-icon { width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; color:#fff; flex-shrink:0; }
.stat-info { display:flex; flex-direction:column; }
.stat-label { font-size:12px; color:#6b7280; margin-bottom:2px; }
.stat-value { font-size:22px; font-weight:700; color:#1f2937; line-height:1.2; }
.stat-trend { font-size:11px; font-weight:500; }
.stat-trend.up { color:#10b981; }
.stat-trend.down { color:#ef4444; }
.cockpit-charts { display:grid; grid-template-columns:2fr 1fr; gap:12px; margin-bottom:16px; }
.cockpit-charts:last-of-type { grid-template-columns:1fr 1fr 1fr; }
.chart-card { background:#fff; border-radius:12px; padding:16px; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
.chart-card.large { grid-column:auto; }
.chart-title { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.chart-title span { font-size:14px; font-weight:600; color:#1f2937; }
.chart-box { width:100%; height:280px; }
.cockpit-table-card { background:#fff; border-radius:12px; padding:16px; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
.table-title { font-size:14px; font-weight:600; color:#1f2937; margin-bottom:12px; }
@media (max-width:1200px) {
  .cockpit-stats { grid-template-columns:repeat(3,1fr); }
  .cockpit-charts { grid-template-columns:1fr; }
  .cockpit-charts:last-of-type { grid-template-columns:1fr; }
}
</style>