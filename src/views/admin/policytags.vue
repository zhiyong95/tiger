<template>
  <div class="policy-tags">
    <div class="page-header">
      <h2>政策标签管理</h2>
      <span class="subtitle">政策分类、适用对象、事项标签配置</span>
      <el-button type="primary" size="small" style="margin-left:auto">+ 新增标签</el-button>
    </div>
    <el-row :gutter="16">
      <el-col :span="8">
        <el-card shadow="never">
          <template #header><span style="font-weight:600">分类体系</span></template>
          <div v-for="cat in categories" :key="cat.name" class="cat-item" :class="{ active: activeCat === cat.name }" @click="activeCat = cat.name">
            <el-icon :color="cat.color" style="margin-right:8px"><component :is="cat.icon" /></el-icon>
            <span>{{ cat.name }}</span>
            <el-tag size="small" style="margin-left:auto">{{ cat.count }}</el-tag>
          </div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card shadow="never">
          <template #header><span style="font-weight:600">标签列表 - {{ activeCat }}</span></template>
          <el-table :data="tags" stripe style="width:100%">
            <el-table-column prop="name" label="标签名称" />
            <el-table-column prop="type" label="类型" width="100" />
            <el-table-column prop="count" label="关联文档" width="80" />
            <el-table-column label="操作" width="120">
              <template #default>
                <el-button size="small" text type="primary">编辑</el-button>
                <el-button size="small" text type="danger">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { Folder, User, Document, PriceTag, List } from '@element-plus/icons-vue'
const activeCat = ref('就业')
const categories = [
  { name: '就业', icon: Folder, color: '#2563eb', count: 28 },
  { name: '社保', icon: Folder, color: '#059669', count: 24 },
  { name: '劳动关系', icon: Folder, color: '#d97706', count: 16 },
  { name: '人才', icon: Folder, color: '#7c3aed', count: 20 },
  { name: '人事', icon: Folder, color: '#0891b2', count: 12 },
  { name: '综合', icon: Folder, color: '#6b7280', count: 18 },
]
const tags = [
  { name: '就业困难人员', type: '适用对象', count: 12 },
  { name: '高校毕业生', type: '适用对象', count: 18 },
  { name: '退役军人', type: '适用对象', count: 8 },
  { name: '灵活就业人员', type: '适用对象', count: 15 },
  { name: '社保补贴', type: '补贴类型', count: 10 },
  { name: '岗位补贴', type: '补贴类型', count: 6 },
  { name: '培训补贴', type: '补贴类型', count: 7 },
  { name: '技能提升', type: '事项标签', count: 5 },
]
</script>
<style scoped>
.policy-tags { padding: 0; }
.page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.page-header h2 { font-size: 20px; font-weight: 600; color: #1f2937; margin: 0; }
.subtitle { font-size: 13px; color: #9ca3af; }
.cat-item { display: flex; align-items: center; padding: 10px 12px; border-radius: 6px; cursor: pointer; margin-bottom: 4px; font-size: 14px; transition: all 0.2s; }
.cat-item:hover { background: #f3f4f6; }
.cat-item.active { background: #eff6ff; color: #2563eb; font-weight: 600; }
</style>