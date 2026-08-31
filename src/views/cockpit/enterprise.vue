<template>
  <div class="cockpit-page">
    <div class="cockpit-header">
      <div class="header-left"><h1><el-icon style="margin-right:8px"><OfficeBuilding /></el-icon>市场主体用工概况</h1></div>
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
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#2563eb,#1e40af)"><el-icon :size="28"><OfficeBuilding /></el-icon></div><div class="stat-info"><span class="stat-label">企业总数</span><span class="stat-value">12.8万</span><span class="stat-trend up">↑ 4.2%</span></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#10b981,#059669)"><el-icon :size="28"><User /></el-icon></div><div class="stat-info"><span class="stat-label">用工总人数</span><span class="stat-value">168.5万</span><span class="stat-trend up">↑ 2.1%</span></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#f59e0b,#d97706)"><el-icon :size="28"><TrendCharts /></el-icon></div><div class="stat-info"><span class="stat-label">用工满足率</span><span class="stat-value">87.3%</span><span class="stat-trend down">↓ 0.8%</span></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed)"><el-icon :size="28"><Coin /></el-icon></div><div class="stat-info"><span class="stat-label">平均薪酬</span><span class="stat-value">6,850元</span><span class="stat-trend up">↑ 3.5%</span></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#ec4899,#db2777)"><el-icon :size="28"><Check /></el-icon></div><div class="stat-info"><span class="stat-label">参保企业</span><span class="stat-value">8.6万</span><span class="stat-trend up">↑ 5.8%</span></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#ef4444,#dc2626)"><el-icon :size="28"><WarningFilled /></el-icon></div><div class="stat-info"><span class="stat-label">缺工企业</span><span class="stat-value">1.2万</span><span class="stat-trend up">↑ 12.3%</span></div></div>
    </div>
    <div class="cockpit-charts">
      <div class="chart-card large"><div class="chart-title"><span>企业规模分布</span></div><div ref="scaleChartRef" class="chart-box"></div></div>
      <div class="chart-card"><div class="chart-title"><span>行业用工分布</span></div><div ref="industryChartRef" class="chart-box"></div></div>
    </div>
    <div class="cockpit-charts" style="grid-template-columns:1fr 1fr 1fr">
      <div class="chart-card"><div class="chart-title"><span>用工需求量TOP10行业</span></div><div ref="demandChartRef" class="chart-box"></div></div>
      <div class="chart-card"><div class="chart-title"><span>缺工岗位TOP10</span></div><div ref="shortageChartRef" class="chart-box"></div></div>
      <div class="chart-card"><div class="chart-title"><span>企业招聘渠道分布</span></div><div ref="channelChartRef" class="chart-box"></div></div>
    </div>
    <div class="cockpit-table-card"><div class="table-title"><span>各区县企业用工情况</span></div>
      <el-table :data="districtData" stripe style="width:100%" :header-cell-style="{background:'#f0f4ff',color:'#1f2937'}">
        <el-table-column prop="district" label="区县" width="100" />
        <el-table-column prop="enterprises" label="企业数" width="120" />
        <el-table-column prop="employees" label="用工人数" width="120" />
        <el-table-column prop="satisfaction" label="用工满足率" width="120" />
        <el-table-column prop="avgSalary" label="平均薪酬" width="120" />
        <el-table-column prop="shortage" label="缺工人数" width="120" />
        <el-table-column prop="trend" label="同比变化" width="100">
          <template #default="{ row }"><span :style="{color:row.trend>0?'#10b981':'#ef4444'}">{{ row.trend > 0 ? '+' : '' }}{{ row.trend }}%</span></template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { OfficeBuilding, User, TrendCharts, Coin, WarningFilled, Check, Refresh, FullScreen } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'

const currentTime = ref(dayjs().format('YYYY-MM-DD HH:mm:ss'))
const areaFilter = ref('all')
const scaleChartRef = ref<HTMLElement>()
const industryChartRef = ref<HTMLElement>()
const demandChartRef = ref<HTMLElement>()
const shortageChartRef = ref<HTMLElement>()
const channelChartRef = ref<HTMLElement>()
let scaleChart: echarts.ECharts|null=null, industryChart: echarts.ECharts|null=null, demandChart: echarts.ECharts|null=null, shortageChart: echarts.ECharts|null=null, channelChart: echarts.ECharts|null=null
let timer: ReturnType<typeof setInterval>|null=null

const districtData = [
  {district:'A区',enterprises:'2.8万',employees:'42.5万',satisfaction:'89.2%',avgSalary:'7,280元',shortage:'3,200人',trend:3.2},
  {district:'B区',enterprises:'2.1万',employees:'35.8万',satisfaction:'86.5%',avgSalary:'6,950元',shortage:'2,800人',trend:2.1},
  {district:'C区',enterprises:'1.8万',employees:'28.6万',satisfaction:'85.8%',avgSalary:'6,580元',shortage:'2,500人',trend:1.8},
  {district:'D区',enterprises:'1.5万',employees:'22.3万',satisfaction:'88.1%',avgSalary:'7,120元',shortage:'1,800人',trend:4.5},
  {district:'E区',enterprises:'1.2万',employees:'18.5万',satisfaction:'87.6%',avgSalary:'6,720元',shortage:'1,500人',trend:2.8},
  {district:'F区',enterprises:'1.0万',employees:'12.8万',satisfaction:'84.3%',avgSalary:'6,350元',shortage:'1,200人',trend:-0.5},
  {district:'G区',enterprises:'0.8万',employees:'8.0万',satisfaction:'86.2%',avgSalary:'6,180元',shortage:'800人',trend:1.2}
]

const renderCharts = () => {
  if(scaleChartRef.value){
    if(!scaleChart) scaleChart=echarts.init(scaleChartRef.value)
    scaleChart.setOption({
      tooltip:{trigger:'axis'},grid:{left:'3%',right:'4%',bottom:'8%',top:'6%',containLabel:true},
      xAxis:{type:'category',data:['微型企业(≤10人)','小型企业(10-50人)','中型企业(50-300人)','大型企业(>300人)'],axisLabel:{color:'#6b7280',fontSize:11},axisLine:{lineStyle:{color:'#e5e7eb'}}},
      yAxis:{type:'value',name:'万家',axisLabel:{color:'#6b7280'},splitLine:{lineStyle:{color:'#f3f4f6'}}},
      series:[{type:'bar',data:[5.2,4.8,2.1,0.7],itemStyle:{borderRadius:[4,4,0,0],color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#2563eb'},{offset:1,color:'#93c5fd'}])},barWidth:'40%'}]
    })
  }
  if(industryChartRef.value){
    if(!industryChart) industryChart=echarts.init(industryChartRef.value)
    industryChart.setOption({
      tooltip:{trigger:'item',formatter:'{b}: {c}万人 ({d}%)'},
      series:[{type:'pie',radius:['45%','70%'],center:['50%','50%'],
        data:[{name:'制造业',value:52.3,itemStyle:{color:'#2563eb'}},{name:'服务业',value:45.8,itemStyle:{color:'#10b981'}},{name:'建筑业',value:28.5,itemStyle:{color:'#f59e0b'}},{name:'批发零售',value:22.6,itemStyle:{color:'#8b5cf6'}},{name:'IT/科技',value:12.3,itemStyle:{color:'#ec4899'}},{name:'其他',value:7.0,itemStyle:{color:'#9ca3af'}}],
        label:{color:'#6b7280',fontSize:12},emphasis:{itemStyle:{shadowBlur:10,shadowOffsetX:0,shadowColor:'rgba(0,0,0,0.2)'}}}
      ]
    })
  }
  if(demandChartRef.value){
    if(!demandChart) demandChart=echarts.init(demandChartRef.value)
    demandChart.setOption({
      tooltip:{trigger:'axis'},grid:{left:'3%',right:'4%',bottom:'8%',top:'6%',containLabel:true},
      xAxis:{type:'category',data:['制造业','信息技术','住宿餐饮','批发零售','建筑业','交通运输','教育','医疗卫生','金融','房地产'],axisLabel:{color:'#6b7280',fontSize:10,rotate:30},axisLine:{lineStyle:{color:'#e5e7eb'}}},
      yAxis:{type:'value',name:'岗位数',axisLabel:{color:'#6b7280'},splitLine:{lineStyle:{color:'#f3f4f6'}}},
      series:[{type:'bar',data:[28500,22300,18600,15200,12800,9600,8500,7200,5800,4200],itemStyle:{borderRadius:[4,4,0,0],color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#10b981'},{offset:1,color:'#a7f3d0'}])},barWidth:'40%'}]
    })
  }
  if(shortageChartRef.value){
    if(!shortageChart) shortageChart=echarts.init(shortageChartRef.value)
    shortageChart.setOption({
      tooltip:{trigger:'axis'},grid:{left:'3%',right:'10%',bottom:'8%',top:'6%',containLabel:true},
      xAxis:{type:'value',axisLabel:{color:'#6b7280'},splitLine:{lineStyle:{color:'#f3f4f6'}}},
      yAxis:{type:'category',data:['普工/操作工','销售代表','技术工程师','客服专员','焊工/电工','厨师/服务员','司机/配送','保安/保洁','会计/财务','行政文员'],axisLabel:{color:'#6b7280',fontSize:10},axisLine:{lineStyle:{color:'#e5e7eb'}}},
      series:[{type:'bar',data:[6800,5200,3800,3200,2800,2400,2100,1800,1500,1200],itemStyle:{borderRadius:[0,4,4,0],color:new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:'#f59e0b'},{offset:1,color:'#fde68a'}])},barWidth:'40%'}]
    })
  }
  if(channelChartRef.value){
    if(!channelChart) channelChart=echarts.init(channelChartRef.value)
    channelChart.setOption({
      tooltip:{trigger:'item',formatter:'{b}: {d}%'},
      series:[{type:'pie',radius:['45%','70%'],center:['50%','50%'],
        data:[{name:'线上招聘平台',value:38,itemStyle:{color:'#2563eb'}},{name:'线下招聘会',value:22,itemStyle:{color:'#10b981'}},{name:'内部推荐',value:18,itemStyle:{color:'#f59e0b'}},{name:'劳务派遣',value:12,itemStyle:{color:'#8b5cf6'}},{name:'校园招聘',value:7,itemStyle:{color:'#ec4899'}},{name:'其他',value:3,itemStyle:{color:'#9ca3af'}}],
        label:{color:'#6b7280',fontSize:12},emphasis:{itemStyle:{shadowBlur:10,shadowOffsetX:0,shadowColor:'rgba(0,0,0,0.2)'}}}
      ]
    })
  }
}

const refreshData = () => renderCharts()
const toggleFullscreen = () => { if(!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen() }

onMounted(() => {
  timer=setInterval(()=>{currentTime.value=dayjs().format('YYYY-MM-DD HH:mm:ss')},1000)
  nextTick(()=>setTimeout(renderCharts,100))
  window.addEventListener('resize',()=>{[scaleChart,industryChart,demandChart,shortageChart,channelChart].forEach(c=>c?.resize())})
})
onUnmounted(()=>{if(timer)clearInterval(timer);[scaleChart,industryChart,demandChart,shortageChart,channelChart].forEach(c=>c?.dispose())})
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