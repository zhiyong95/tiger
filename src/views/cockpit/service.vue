<template>
  <div class="cockpit-page">
    <div class="cockpit-header">
      <div class="header-left"><h1><el-icon style="margin-right:8px"><MapLocation /></el-icon>线下服务矩阵网络分布</h1></div>
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
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#2563eb,#1e40af)"><el-icon :size="28"><MapLocation /></el-icon></div><div class="stat-info"><span class="stat-label">服务网点总数</span><span class="stat-value">286个</span><span class="stat-trend up">↑ 8.5%</span></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#10b981,#059669)"><el-icon :size="28"><User /></el-icon></div><div class="stat-info"><span class="stat-label">年服务人次</span><span class="stat-value">128.5万</span><span class="stat-trend up">↑ 12.3%</span></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#f59e0b,#d97706)"><el-icon :size="28"><Folder /></el-icon></div><div class="stat-info"><span class="stat-label">服务事项数</span><span class="stat-value">156项</span><span class="stat-trend up">↑ 6.8%</span></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed)"><el-icon :size="28"><Clock /></el-icon></div><div class="stat-info"><span class="stat-label">平均办理时长</span><span class="stat-value">8.5分钟</span><span class="stat-trend down">↓ 15.2%</span></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#ec4899,#db2777)"><el-icon :size="28"><CircleCheck /></el-icon></div><div class="stat-info"><span class="stat-label">群众满意度</span><span class="stat-value">98.6%</span><span class="stat-trend up">↑ 0.8%</span></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#ef4444,#dc2626)"><el-icon :size="28"><WarningFilled /></el-icon></div><div class="stat-info"><span class="stat-label">待优化网点</span><span class="stat-value">12个</span><span class="stat-trend down">↓ 5.2%</span></div></div>
    </div>
    <div class="cockpit-charts">
      <div class="chart-card large"><div class="chart-title"><span>各区县网点分布</span></div><div ref="districtChartRef" class="chart-box"></div></div>
      <div class="chart-card"><div class="chart-title"><span>网点类型分布</span></div><div ref="typeChartRef" class="chart-box"></div></div>
    </div>
    <div class="cockpit-charts" style="grid-template-columns:1fr 1fr 1fr">
      <div class="chart-card"><div class="chart-title"><span>月服务量趋势</span></div><div ref="trendChartRef" class="chart-box"></div></div>
      <div class="chart-card"><div class="chart-title"><span>服务事项类别</span></div><div ref="serviceChartRef" class="chart-box"></div></div>
      <div class="chart-card"><div class="chart-title"><span>各网点满意度分布</span></div><div ref="satisfactionChartRef" class="chart-box"></div></div>
    </div>
    <div class="cockpit-table-card"><div class="table-title"><span>各区县网点明细</span></div>
      <el-table :data="networkData" stripe style="width:100%" :header-cell-style="{background:'#f0f4ff',color:'#1f2937'}">
        <el-table-column prop="district" label="区县" width="100" />
        <el-table-column prop="stations" label="网点数" width="100" />
        <el-table-column prop="serviceCount" label="年服务人次" width="120" />
        <el-table-column prop="items" label="服务事项" width="100" />
        <el-table-column prop="avgTime" label="平均时长" width="100" />
        <el-table-column prop="satisfaction" label="满意度" width="100">
          <template #default="{ row }"><el-tag :type="parseFloat(row.satisfaction)>=98?'success':parseFloat(row.satisfaction)>=95?'warning':'danger'" size="small">{{ row.satisfaction }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="coverage" label="覆盖率" width="100" />
      </el-table>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { MapLocation, User, Folder, Clock, CircleCheck, WarningFilled, Refresh, FullScreen } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'

const currentTime = ref(dayjs().format('YYYY-MM-DD HH:mm:ss'))
const areaFilter = ref('all')
const districtChartRef = ref<HTMLElement>()
const typeChartRef = ref<HTMLElement>()
const trendChartRef = ref<HTMLElement>()
const serviceChartRef = ref<HTMLElement>()
const satisfactionChartRef = ref<HTMLElement>()
let districtChart: echarts.ECharts|null=null, typeChart: echarts.ECharts|null=null, trendChart: echarts.ECharts|null=null, serviceChart: echarts.ECharts|null=null, satisfactionChart: echarts.ECharts|null=null
let timer: ReturnType<typeof setInterval>|null=null

const networkData = [
  {district:'A区',stations:'42个',serviceCount:'28.5万',items:'156项',avgTime:'7.8min',satisfaction:'99.2%',coverage:'98.5%'},
  {district:'B区',stations:'38个',serviceCount:'22.3万',items:'148项',avgTime:'8.2min',satisfaction:'98.8%',coverage:'96.2%'},
  {district:'C区',stations:'35个',serviceCount:'18.6万',items:'142项',avgTime:'8.5min',satisfaction:'98.5%',coverage:'95.8%'},
  {district:'D区',stations:'32个',serviceCount:'16.8万',items:'138项',avgTime:'8.8min',satisfaction:'98.2%',coverage:'94.5%'},
  {district:'E区',stations:'28个',serviceCount:'14.2万',items:'135项',avgTime:'9.0min',satisfaction:'97.8%',coverage:'93.2%'},
  {district:'F区',stations:'25个',serviceCount:'11.5万',items:'128项',avgTime:'9.2min',satisfaction:'97.5%',coverage:'91.8%'},
  {district:'G区',stations:'22个',serviceCount:'8.6万',items:'122项',avgTime:'9.5min',satisfaction:'97.2%',coverage:'90.5%'}
]

const renderCharts = () => {
  if(districtChartRef.value){
    if(!districtChart) districtChart=echarts.init(districtChartRef.value)
    districtChart.setOption({
      tooltip:{trigger:'axis'},grid:{left:'3%',right:'4%',bottom:'8%',top:'6%',containLabel:true},
      xAxis:{type:'category',data:networkData.map(d=>d.district),axisLabel:{color:'#6b7280'},axisLine:{lineStyle:{color:'#e5e7eb'}}},
      yAxis:{type:'value',name:'个数',axisLabel:{color:'#6b7280'},splitLine:{lineStyle:{color:'#f3f4f6'}}},
      series:[{type:'bar',data:networkData.map(d=>parseInt(d.stations)),itemStyle:{borderRadius:[4,4,0,0],color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#2563eb'},{offset:1,color:'#93c5fd'}])},barWidth:'40%'}]
    })
  }
  if(typeChartRef.value){
    if(!typeChart) typeChart=echarts.init(typeChartRef.value)
    typeChart.setOption({
      tooltip:{trigger:'item',formatter:'{b}: {c}个 ({d}%)'},
      series:[{type:'pie',radius:['45%','70%'],center:['50%','50%'],
        data:[{name:'人社服务中心',value:85,itemStyle:{color:'#2563eb'}},{name:'街道便民中心',value:68,itemStyle:{color:'#10b981'}},{name:'社区服务站',value:52,itemStyle:{color:'#f59e0b'}},{name:'零工市场',value:28,itemStyle:{color:'#8b5cf6'}},{name:'人才市场',value:22,itemStyle:{color:'#ec4899'}},{name:'自助服务终端',value:31,itemStyle:{color:'#6366f1'}}],
        label:{color:'#6b7280',fontSize:12},emphasis:{itemStyle:{shadowBlur:10,shadowOffsetX:0,shadowColor:'rgba(0,0,0,0.2)'}}}
      ]
    })
  }
  if(trendChartRef.value){
    if(!trendChart) trendChart=echarts.init(trendChartRef.value)
    trendChart.setOption({
      tooltip:{trigger:'axis'},grid:{left:'3%',right:'4%',bottom:'8%',top:'6%',containLabel:true},
      xAxis:{type:'category',data:['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],axisLabel:{color:'#6b7280',fontSize:11},axisLine:{lineStyle:{color:'#e5e7eb'}}},
      yAxis:{type:'value',name:'万人次',axisLabel:{color:'#6b7280'},splitLine:{lineStyle:{color:'#f3f4f6'}}},
      series:[{type:'line',data:[8.5,7.2,9.8,10.2,11.5,12.8,13.5,12.2,11.8,10.5,9.8,10.7],smooth:true,lineStyle:{width:3,color:'#2563eb'},itemStyle:{color:'#2563eb'},areaStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'rgba(37,99,235,0.2)'},{offset:1,color:'rgba(37,99,235,0.02)'}])}}]
    })
  }
  if(serviceChartRef.value){
    if(!serviceChart) serviceChart=echarts.init(serviceChartRef.value)
    serviceChart.setOption({
      tooltip:{trigger:'item',formatter:'{b}: {c}项 ({d}%)'},
      series:[{type:'pie',radius:['45%','70%'],center:['50%','50%'],
        data:[{name:'就业服务',value:42,itemStyle:{color:'#2563eb'}},{name:'社保服务',value:38,itemStyle:{color:'#10b981'}},{name:'人才服务',value:28,itemStyle:{color:'#f59e0b'}},{name:'劳动维权',value:22,itemStyle:{color:'#ef4444'}},{name:'政策咨询',value:18,itemStyle:{color:'#8b5cf6'}},{name:'其他服务',value:8,itemStyle:{color:'#9ca3af'}}],
        label:{color:'#6b7280',fontSize:12},emphasis:{itemStyle:{shadowBlur:10,shadowOffsetX:0,shadowColor:'rgba(0,0,0,0.2)'}}}
      ]
    })
  }
  if(satisfactionChartRef.value){
    if(!satisfactionChart) satisfactionChart=echarts.init(satisfactionChartRef.value)
    satisfactionChart.setOption({
      tooltip:{trigger:'axis'},grid:{left:'3%',right:'10%',bottom:'8%',top:'6%',containLabel:true},
      xAxis:{type:'value',min:90,max:100,axisLabel:{color:'#6b7280',formatter:'{value}%'},splitLine:{lineStyle:{color:'#f3f4f6'}}},
      yAxis:{type:'category',data:networkData.map(d=>d.district).reverse(),axisLabel:{color:'#6b7280',fontSize:11},axisLine:{lineStyle:{color:'#e5e7eb'}}},
      series:[{type:'bar',data:networkData.map(d=>parseFloat(d.satisfaction)).reverse(),itemStyle:{borderRadius:[0,4,4,0],color:new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:'#10b981'},{offset:1,color:'#a7f3d0'}])},barWidth:'40%',
        label:{show:true,position:'right',formatter:'{c}%',color:'#6b7280',fontSize:11}}]
    })
  }
}

const refreshData = () => renderCharts()
const toggleFullscreen = () => { if(!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen() }

onMounted(() => {
  timer=setInterval(()=>{currentTime.value=dayjs().format('YYYY-MM-DD HH:mm:ss')},1000)
  nextTick(()=>setTimeout(renderCharts,100))
  window.addEventListener('resize',()=>{[districtChart,typeChart,trendChart,serviceChart,satisfactionChart].forEach(c=>c?.resize())})
})
onUnmounted(()=>{if(timer)clearInterval(timer);[districtChart,typeChart,trendChart,serviceChart,satisfactionChart].forEach(c=>c?.dispose())})
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