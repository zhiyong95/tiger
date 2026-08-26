<template>
  <div class="perm-help">
    <div class="section-title">权限体系说明</div>
    <div class="help-card">
      <h3>一、角色说明</h3>
      <el-table :data="roles" border stripe>
        <el-table-column prop="role" label="角色" />
        <el-table-column prop="desc" label="说明" />
        <el-table-column prop="scope" label="管理范围" />
      </el-table>
    </div>
    <div class="help-card">
      <h3>二、可见范围</h3>
      <el-table :data="scopes" border stripe>
        <el-table-column prop="name" label="范围" />
        <el-table-column prop="desc" label="说明" />
        <el-table-column prop="icon" label="图标" />
      </el-table>
    </div>
    <div class="help-card">
      <h3>三、权限核心规则</h3>
      <ul class="rule-list">
        <li>✅ 列表只展示当前身份<strong>可见</strong>的模板，无权限的模板不出现在列表中</li>
        <li>✅ 可见即可查看、预览、复制使用</li>
        <li>✅ 所有登录成员均可新建模板</li>
        <li>✅ 编辑、修改可见范围：系统管理员 / 创建人 / 本部门科室管理员（限本部门模板）</li>
        <li>✅ 删除：系统管理员 / 创建人可删除</li>
        <li>✅ 系统管理员拥有全局管理权限，不受科室限制</li>
        <li>✅ 无权限访问时给出明确提示（而非报错）</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
const roles = [
  { role: '系统管理员', desc: '全局管理，拥有所有权限', scope: '全系统' },
  { role: '科室管理员', desc: '可维护本部门范围内的模板', scope: '本部门' },
  { role: '科室成员', desc: '可查看 / 复制 / 新建模板', scope: '本部门可见' },
]

const scopes = [
  { name: '公开', desc: '全单位所有科室成员可见、可使用', icon: '🌐' },
  { name: '本部门', desc: '仅创建人所在科室成员可见', icon: '🏢' },
  { name: '仅自己', desc: '仅创建人本人可见', icon: '🔒' },
  { name: '系统模板', desc: '平台预置，全员可见，仅系统管理员维护', icon: '⚙️' },
]
</script>

<style scoped>
.perm-help { padding: 4px 0; max-width: 800px; }
.section-title { font-size: 16px; font-weight: 600; color: #0a1e5c; margin-bottom: 16px; }
.help-card {
  background: #fff; border: 1px solid #e5e7eb; border-radius: 10px;
  padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.help-card h3 { font-size: 15px; color: #0a1e5c; margin: 0 0 12px; }
.rule-list { margin: 0; padding-left: 0; list-style: none; }
.rule-list li {
  padding: 6px 0; font-size: 13px; color: #374151;
  border-bottom: 1px solid #f3f4f6;
}
.rule-list li:last-child { border-bottom: none; }
</style>