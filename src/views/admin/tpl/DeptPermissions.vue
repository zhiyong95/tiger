<template>
  <div class="dept-permissions-page">
    <el-row :gutter="20">
      <el-col :span="7">
        <el-tree :data="deptTree" show-checkbox node-key="id" :default-checked-keys="checkedDepts" />
      </el-col>
      <el-col :span="17">
        <div class="right-panel">
          <div class="panel-header">
            <h3>权限配置</h3>
            <el-select v-model="currentTplId" placeholder="选择模板">
              <el-option v-for="tpl in templates" :key="tpl.id" :label="tpl.name" :value="tpl.id" />
            </el-select>
          </div>
          <div class="perm-config" v-if="currentTpl">
            <el-form label-width="160px">
              <el-form-item label="公开范围">
                <el-radio-group v-model="currentScope">
                  <el-radio label="public">全系统公开</el-radio>
                  <el-radio label="dept">指定部门</el-radio>
                  <el-radio label="private">仅本人</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="可编辑用户">
                <el-select v-model="editableUserIds" multiple placeholder="选择可编辑用户" style="width:100%">
                  <el-option v-for="u in allUsers" :key="u.id" :label="u.name" :value="u.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="可查看用户">
                <el-select v-model="visibleUserIds" multiple placeholder="选择可查看用户" style="width:100%">
                  <el-option v-for="u in allUsers" :key="u.id" :label="u.name" :value="u.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="启用状态">
                <el-switch v-model="currentEnabled" />
              </el-form-item>
            </el-form>
            <div class="action-footer">
              <el-button type="primary" @click="savePerm">保存权限配置</el-button>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

interface DeptNode {
  id: string
  label: string
  children?: DeptNode[]
}

interface UserItem { id: string; name: string }

const deptTree = ref<DeptNode[]>([
  { id: 'd1', label: '市局机关', children: [
    { id: 'd1-1', label: '办公室' },
    { id: 'd1-2', label: '人事科' },
    { id: 'd1-3', label: '就业促进科' },
    { id: 'd1-4', label: '社会保险科' },
    { id: 'd1-5', label: '劳动监察科' },
  ]},
  { id: 'd2', label: '下属事业单位', children: [
    { id: 'd2-1', label: '就业服务中心' },
    { id: 'd2-2', label: '社保中心' },
    { id: 'd2-3', label: '人才服务中心' },
  ]},
])

const allUsers = ref<UserItem[]>([
  { id: 'u1', name: '张三（办公室主任）' },
  { id: 'u2', name: '李四（就业科科长）' },
  { id: 'u3', name: '王五（社保科科员）' },
  { id: 'u4', name: '赵六（监察科科员）' },
  { id: 'u5', name: '孙七（就业中心管理员）' },
  { id: 'u6', name: '周八（社保中心管理员）' },
])

const checkedDepts = ref<string[]>([])
const currentTplId = ref('')
const currentScope = ref('public')
const editableUserIds = ref<string[]>([])
const visibleUserIds = ref<string[]>([])
const currentEnabled = ref(true)

const templates = ref<{ id: string; name: string }[]>([
  { id: 'tpl-1', name: '请示模板 - 就业资金申请' },
  { id: 'tpl-2', name: '通知模板 - 业务培训安排' },
  { id: 'tpl-3', name: '报告模板 - 月度就业形势分析' },
  { id: 'tpl-4', name: '审批表模板 - 补贴申请审批' },
])

const currentTpl = computed(() => templates.value.find(t => t.id === currentTplId.value) || null)

watch(currentTplId, tplId => {
  if (!tplId) return
  // mock 加载权限数据
  currentScope.value = Math.random() > 0.3 ? 'public' : 'dept'
  editableUserIds.value = allUsers.value.slice(0, 2).map(u => u.id)
  visibleUserIds.value = allUsers.value.slice(0, 4).map(u => u.id)
  currentEnabled.value = true
  checkedDepts.value = ['d1', 'd1-1', 'd1-2']
})

function savePerm() {
  ElMessage.success('权限配置已保存')
}
</script>

<style scoped>
.dept-permissions-page {
  padding: 0;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.panel-header h3 {
  margin: 0;
  font-size: 16px;
}
.perm-config {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}
.action-footer {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}
</style>
