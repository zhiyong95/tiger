<template>
  <div class="perm-help-page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header-title">
          <el-icon :size="18"><InfoFilled /></el-icon>
          <span>公文模板权限使用说明</span>
        </div>
      </template>
      <el-collapse v-model="activeNames">
        <el-collapse-item title="权限三级架构说明" name="1">
          <ul class="help-list">
            <li><strong>个人私有：</strong>仅模板创建者本人可查看、编辑、使用，适合起草中未公开的内部草稿</li>
            <li><strong>部门内部：</strong>指定部门内所有用户可查看、使用，模板作者和管理员可编辑维护</li>
            <li><strong>公开共享：</strong>全系统所有用户均可查看、使用，仅模板作者和管理员拥有编辑权限</li>
          </ul>
        </el-collapse-item>
        <el-collapse-item title="角色权限矩阵" name="2">
          <el-table :data="permMatrix" stripe border style="width:100%">
            <el-table-column prop="role" label="角色" width="140" />
            <el-table-column prop="create" label="新建模板" width="140" />
            <el-table-column prop="edit" label="编辑共享模板" width="160" />
            <el-table-column prop="delete" label="删除模板" width="140" />
            <el-table-column prop="manage" label="管理公文类型" />
          </el-table>
        </el-collapse-item>
        <el-collapse-item title="常见问题" name="3">
          <el-space direction="vertical" style="width:100%">
            <div class="faq-item">
              <strong>Q1. 我新建的模板其他人看不到怎么办？</strong>
              <p>A. 检查"共享范围"设置，默认是"个人私有"。如需共享，改为"部门内部"或"公开共享"。</p>
            </div>
            <div class="faq-item">
              <strong>Q2. 系统内置模板可以修改吗？</strong>
              <p>A. 系统内置模板标记为"系统"级，不允许直接修改。建议复制副本后在副本上进行编辑。</p>
            </div>
            <div class="faq-item">
              <strong>Q3. 删除模板会影响已生成的公文文件吗？</strong>
              <p>A. 删除模板仅移除模板元数据，不会影响历史通过该模板生成的正式公文文件。</p>
            </div>
            <div class="faq-item">
              <strong>Q4. 怎么批量导入大量历史模板？</strong>
              <p>A. 联系系统管理员，通过后台 Excel 批量导入功能一次性导入。</p>
            </div>
          </el-space>
        </el-collapse-item>
      </el-collapse>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { InfoFilled } from '@element-plus/icons-vue'

const activeNames = ref(['1'])

const permMatrix = ref([
  { role: '普通工作人员', create: '✅ 允许', edit: '仅编辑本人创建', delete: '仅删除本人', manage: '❌ 无权限' },
  { role: '科室负责人', create: '✅ 允许', edit: '可编辑本部门', delete: '可删除本部门', manage: '❌ 无权限' },
  { role: '系统管理员', create: '✅ 允许', edit: '可编辑全部', delete: '可删除全部', manage: '✅ 完全控制' },
  { role: '业务管理员', create: '✅ 允许', edit: '可编辑业务相关', delete: '可删除业务相关', manage: '✅ 类型管理' },
])
</script>

<style scoped>
.perm-help-page {
  padding: 0;
}
.card-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}
.help-list {
  margin: 0;
  padding-left: 20px;
  line-height: 2;
}
.faq-item {
  padding: 10px 0;
  border-bottom: 1px solid #f3f4f6;
}
.faq-item strong {
  color: #0a1e5c;
}
.faq-item p {
  margin: 6px 0 0;
  color: #6b7280;
  padding-left: 1.5em;
}
</style>
