<template>
  <div class="cockpit-page">
    <div class="cockpit-header">
      <div class="header-left"><h1><el-icon style="margin-right:8px"><SetUp /></el-icon>产业用工概况</h1></div>
      <div class="header-center"><span class="time-display">{{ currentTime }}</span></div>
      <div class="header-right">
        <el-select v-model="areaFilter" placeholder="选择区域" size="small" style="width:140px;margin-right:12px">
          <el-option label="全市" value="all" /><el-option label="A区" value="a" /><el-option label="B区" value="b" /><el-option label="C区" value="c" />
        </el-select>
        <el-button size="small" @click="refreshData"><el-icon><Refresh /></el-icon> 刷新</el-button>
        <el-button size="small" @click="toggleFullscreen"><el-icon><FullScreen /></el-icon> 全屏</el-button>
      </div>
    </div>
    <div class="cockpit-stats">
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#2563eb,#1e40af)"><el-icon :size="28"><SetUp /></el-icon></div><div class="stat-info"><span class="stat-label">产业用工总量</span><span class="stat-value">352.1万</span><span class="stat-trend up">↑ 2.1%</span></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#10b981,#059669)"><el-icon :size="28"><TrendCharts /></el-icon></div><div class="stat-info"><span class="stat-label">第一产业</span><span class="stat-value">42.5万</span><span class="stat-trend down">↓ 1.2%</span></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#f59e0b,#d97706)"><el-icon :size="28"><TrendCharts /></el-icon></div><div class="stat-info"><span class="stat-label">第二产业</span><span class="stat-value">128.3万</span><span class="stat-trend up">↑ 3.5%</span></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed)"><el-icon :size="28"><TrendCharts /></el-icon></div><div class="stat-info"><span class="stat-label">第三产业</span><span class="stat-value">181.3万</span><span class="stat-trend up">↑ 4.8%</span></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#ec4899,#db2777)"><el-icon :size="28"><DataBoard /></el-icon></div><div class="stat-info"><span class="stat-label">高新技术产业</span><span class="stat-value">28.5万</span><span class="stat-trend up">↑ 12.6%</span></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#ef4444,#dc2626)"><el-icon :size="28"><WarningFilled /></el-icon></div><div class="stat-info"><span class="stat-label">传统产业用工缺口</span><span class="stat-value">0.8万</span><span class="stat-trend up">↑ 6.5%</span></div></div>
    </div>
    <div class="cockpit-charts">
      <div class="chart-card large"><div class="chart-title"><span>三次产业用工趋势（近12月）</span><el-radio-group v-model="industryType" size="small"><el-radio-button value="all">全部</el-radio-button><el-radio-button value="first">第一产业</el-radio-button><el-radio-button value="second">第二产业</el-radio-button><el-radio-button value="third">第三产业</el-radio-button></el-radio-group></div><div ref="trendChartRef" class="chart-box"></div></div>
      <div class="chart-card"><div class="chart-title"><span>产业用工占比</span></div><div ref="ratioChartRef" class="chart-box"></div></div>
    </div>
    <div class="cockpit-charts" style="grid-template-columns:1fr 1fr 1fr">
      <div class="chart-card"><div class="chart-title"><span>制造业细分用工分布</span></div><div ref="manufactureChartRef" class="chart-box"></div></div>
      <div class="chart-card"><div class="chart-title"><span>服务业细分用工分布</span></div><div ref="serviceChartRef" class="chart-box"></div></div>
      <div class="chart-card"><div class="chart-title"><span>建筑业用工工种分布</span></div><div ref="constructionChartRef" class="chart-box"></div></div>
    </div>
    <div class="cockpit-table-card"><div class="table-title"><span>各产业用工明细（按区县）</span></div>
      <el-table :data="industryData" stripe style="width:100%" :header-cell-style="{background:'#f0f4ff',color:'#1f2937'}">
        <el-table-column prop="district" label="区县" width="100" />
        <el-table-column prop="first" label="第一产业" width="120" />
        <el-table-column prop="second" label="第二产业" width="120" />
        <el-table-column prop="third" label="第三产业" width="120" />
        <el-table-column prop="total" label="合计" width="120" />
        <el-table-column prop="highTech" label="高新技术" width="120" />
        <el-table-column prop="trend" label="同比变化" width="100">
          <template #default="{ row }"><span :style="{color:row.trend>0?'#10b981':'#ef4444'}">{{ row.trend > 0 ? '+' : '' }}{{ row.trend }}%</span></template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { SetUp, TrendCharts, WarningFilled, DataBoard, Refresh, FullScreen } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'

const currentTime = ref(dayjs().format('YYYY-MM-DD HH:mm:ss'))
const areaFilter = ref('all')
const industryType = ref('all')
const trendChartRef = ref<HTMLElement>()
const ratioChartRef = ref<HTMLElement>()
const manufactureChartRef = ref<HTMLElement>()
const serviceChartRef = ref<HTMLElement>()
const constructionChartRef = ref<HTMLElement>()
let trendChart: echarts.ECharts|null=null, ratioChart: echarts.ECharts|null=null, manufactureChart: echarts.ECharts|null=null, serviceChart: echarts.ECharts|null=null, constructionChart: echarts.ECharts|null=null
let timer: ReturnType<typeof setInterval>|null=null

const industryData = [
  {district:'A区',first:'8.5万',second:'28.2万',third:'42.5万',total:'79.2万',highTech:'7.8万',trend:3.5},
  {district:'B区',first:'7.2万',second:'22.5万',third:'35.8万',total:'65.5万',highTech:'5.2万',trend:2.8},
  {district:'C区',first:'6.8万',second:'18.6万',third:'28.5万',total:'53.9万',highTech:'3.8万',trend:2.1},
  {district:'D区',first:'5.5万',second:'15.2万',third:'22.8万',total:'43.5万',highTech:'4.2万',trend:4.2},
  {district:'E区',first:'4.8万',second:'12.5万',third:'18.6万',total:'35.9万',highTech:'2.8万',trend:1.8},
  {district:'F区',first:'3.5万',second:'8.8万',third:'12.5万',total:'24.8万',highTech:'1.5万',trend:0.5},
  {district:'G区',first:'2.8万',second:'6.5万',third:'8.6万',total:'17.9万',highTech:'1.2万',trend:-0.8}
]

const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
const firstTrend = [43.2,42.8,42.5,42.3,42.0,42.5,42.8,42.3,42.5,42.2,42.5,42.5]
const secondTrend = [122.5,124.8,125.2,126.5,127.2,127.8,128.0,128.2,128.3,128.5,128.3,128.3]
const thirdTrend = [172.5,175.2,176.8,178.2,179.5,180.2,180.8,181.0,181.2,181.3,181.3,181.3]

const renderCharts = () => {
  if(trendChartRef.value){
    if(!trendChart) trendChart=echarts.init(trendChartRef.value)
    let series: any[] = []
    if(industryType.value==='all'||industryType.value==='first') series.push({name:'第一产业',type:'line',data:firstTrend,smooth:true,lineStyle:{width:3,color:'#10b981'},itemStyle:{color:'#10b981'},areaStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'rgba(16,185,129,0.2)'},{offset:1,color:'rgba(16,185,129,0.02)'}])}})
    if(industryType.value==='all'||industryType.value==='second') series.push({name:'第二产业',type:'line',data:secondTrend,smooth:true,lineStyle:{width:3,color:'#2563eb'},itemStyle:{color:'#2563eb'},areaStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'rgba(37,99,235,0.2)'},{offset:1,color:'rgba(37,99,235,0.02)'}])}})
    if(industryType.value==='all'||industryType.value==='third') series.push({name:'第三产业',type:'line',data:thirdTrend,smooth:true,lineStyle:{width:3,color:'#8b5cf6'},itemStyle:{color:'#8b5cf6'},areaStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'rgba(139,92,246,0.2)'},{offset:1,color:'rgba(139,92,246,0.02)'}])}})
    trendChart.setOption({
      tooltip:{trigger:'axis'},legend:{data:['第一产业','第二产业','第三产业'],bottom:0,textStyle:{color:'#6b7280',fontSize:12}},
      grid:{left:'3%',right:'4%',bottom:'15%',top:'6%',containLabel:true},
      xAxis:{type:'category',data:months,axisLabel:{color:'#6b7280'},axisLine:{lineStyle:{color:'#e5e7eb'}}},
      yAxis:{type:'value',name:'万人',axisLabel:{color:'#6b7280'},splitLine:{lineStyle:{color:'#f3f4f6'}}},series
    })
  }
  if(ratioChartRef.value){
    if(!ratioChart) ratioChart=echarts.init(ratioChartRef.value)
    ratioChart.setOption({
      tooltip:{trigger:'item',formatter:'{b}: {c}万人 ({d}%)'},
      series:[{type:'pie',radius:['45%','70%'],center:['50%','50%'],
        data:[{name:'第一产业',value:42.5,itemStyle:{color:'#10b981'}},{name:'第二产业',value:128.3,itemStyle:{color:'#2563eb'}},{name:'第三产业',value:181.3,itemStyle:{color:'#8b5cf6'}}],
        label:{color:'#6b7280',fontSize:12},emphasis:{itemStyle:{shadowBlur:10,shadowOffsetX:0,shadowColor:'rgba(0,0,0,0.2)'}}}
      ]
    })
  }
  if(manufactureChartRef.value){
    if(!manufactureChart) manufactureChart=echarts.init(manufactureChartRef.value)
    manufactureChart.setOption({
      tooltip:{trigger:'item',formatter:'{b}: {c}万人 ({d}%)'},
      series:[{type:'pie',radius:['45%','70%'],center:['50%','50%'],
        data:[{name:'电子信息',value:22.5,itemStyle:{color:'#2563eb'}},{name:'装备制造',value:18.3,itemStyle:{color:'#3b82f6'}},{name:'食品加工',value:12.8,itemStyle:{color:'#60a5fa'}},{name:'纺织服装',value:8.5,itemStyle:{color:'#93c5fd'}},{name:'化工建材',value:6.2,itemStyle:{color:'#bfdbfe'}}],
        label:{color:'#6b7280',fontSize:11},emphasis:{itemStyle:{shadowBlur:10,shadowOffsetX:0,shadowColor:'rgba(0,0,0,0.2)'}}}
      ]
    })
  }
  if(serviceChartRef.value){
    if(!serviceChart) serviceChart=echarts.init(serviceChartRef.value)
    serviceChart.setOption({
      tooltip:{trigger:'item',formatter:'{b}: {c}万人 ({d}%)'},
      series:[{type:'pie',radius:['45%','70%'],center:['50%','50%'],
        data:[{name:'批发零售',value:45.6,itemStyle:{color:'#10b981'}},{name:'住宿餐饮',value:32.5,itemStyle:{color:'#34d399'}},{name:'交通运输',value:28.3,itemStyle:{color:'#6ee7b7'}},{name:'信息技术',value:22.5,itemStyle:{color:'#a7f3d0'}},{name:'教育医疗',value:18.6,itemStyle:{color:'#d1fae5'}},{name:'金融地产',value:15.8,itemStyle:{color:'#ecfdf5'}}],
        label:{color:'#6b7280',fontSize:11},emphasis:{itemStyle:{shadowBlur:10,shadowOffsetX:0,shadowColor:'rgba(0,0,0,0.2)'}}}
      ]
    })
  }
  if(constructionChartRef.value){
    if(!constructionChart) constructionChart=echarts.init(constructionChartRef.value)
    constructionChart.setOption({
      tooltip:{trigger:'axis'},grid:{left:'3%',right:'10%',bottom:'8%',top:'6%',containLabel:true},
      xAxis:{type:'value',axisLabel:{color:'#6b7280'},splitLine:{lineStyle:{color:'#f3f4f6'}}},
      yAxis:{type:'category',data:['木工/瓦工','钢筋工','水电工','焊工','架子工','油漆工','机械操作','其他'],axisLabel:{color:'#6b7280',fontSize:11},axisLine:{lineStyle:{color:'#e5e7eb'}}},
      series:[{type:'bar',data:[3.8,3.2,2.8,2.2,1.8,1.5,1.2,2.5],itemStyle:{borderRadius:[0,4,4,0],color:new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:'#f59e0b'},{offset:1,color:'#fde68a'}])},barWidth:'40%'}]
    })
  }
}

const refreshData = () => renderCharts()
const toggleFullscreen = () => { if(!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen() }
watch(industryType,()=>nextTick(renderCharts))

onMounted(() => {
  timer=setInterval(()=>{currentTime.value=dayjs().format('YYYY-MM-DD HH:mm:ss')},1000)
  nextTick(()=>setTimeout(renderCharts,100))
  window.addEventListener('resize',()=>{[trendChart,ratioChart,manufactureChart,serviceChart,constructionChart].forEach(c=>c?.resize())})
})
onUnmounted(()=>{if(timer)clearInterval(timer);[trendChart,ratioChart,manufactureChart,serviceChart,constructionChart].forEach(c=>c?.dispose())})
</script>
<style scoped>
.cockpit-page { padding: 16px; background: #f0f4ff; min-height: calc(100vh - 100px); }
.cockpit-header { display:flex; align-items:center; justify-content:space-between; background:#fff; padding:12px 20px; border-radius:12px; margin-bottom:16px; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
.header-left h1 { font-size:18px; color:#1f2937; font-weight:600; display:flex; align-items:center; margin:0; }
.header-center .time-display { font-size:14px; color:#6b7280; font-family:monospace; }
.header-right { display:flex; align-items:center; gap:6px; }
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
}
</style>