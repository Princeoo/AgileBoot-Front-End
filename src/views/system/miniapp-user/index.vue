<script setup lang="ts">
import { ref } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { miniappUserStatusOptions, useMiniappUserHook } from "./hook";
import Search from "@iconify-icons/ep/search";
import Refresh from "@iconify-icons/ep/refresh";
import View from "@iconify-icons/ep/view";
import EditPen from "@iconify-icons/ep/edit-pen";

defineOptions({ name: "MiniappUser" });

const searchFormRef = ref();
const {
  searchFormParams,
  timeRange,
  dataList,
  pageLoading,
  detailLoading,
  detailVisible,
  currentDetail,
  currentStatus,
  pagination,
  columns,
  getList,
  onSearch,
  onSortChanged,
  resetForm,
  openDetail,
  changeStatus,
  formatTime
} = useMiniappUserHook();
</script>

<template>
  <div class="main">
    <el-form
      ref="searchFormRef"
      :inline="true"
      :model="searchFormParams"
      class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
    >
      <el-form-item label="用户昵称" prop="nickname">
        <el-input
          v-model="searchFormParams.nickname"
          placeholder="请输入昵称"
          clearable
          class="!w-[180px]"
        />
      </el-form-item>
      <el-form-item label="手机号码" prop="phoneNumber">
        <el-input
          v-model="searchFormParams.phoneNumber"
          placeholder="请输入手机号"
          clearable
          class="!w-[180px]"
        />
      </el-form-item>
      <el-form-item label="账号状态" prop="status">
        <el-select
          v-model="searchFormParams.status"
          placeholder="全部状态"
          clearable
          class="!w-[140px]"
        >
          <el-option
            v-for="item in miniappUserStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="员工绑定" prop="bound">
        <el-select
          v-model="searchFormParams.bound"
          placeholder="全部"
          clearable
          class="!w-[130px]"
        >
          <el-option label="已绑定" :value="true" />
          <el-option label="未绑定" :value="false" />
        </el-select>
      </el-form-item>
      <el-form-item label="注册时间">
        <el-date-picker
          v-model="timeRange"
          value-format="YYYY-MM-DD"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="!w-[240px]"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          :icon="useRenderIcon(Search)"
          :loading="pageLoading"
          @click="onSearch"
        >
          搜索
        </el-button>
        <el-button
          :icon="useRenderIcon(Refresh)"
          @click="resetForm(searchFormRef)"
        >
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <PureTableBar title="小程序用户" :columns="columns" @refresh="onSearch">
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          border
          adaptive
          align-whole="center"
          showOverflowTooltip
          table-layout="auto"
          :loading="pageLoading"
          :size="size"
          :data="dataList"
          :columns="dynamicColumns"
          :pagination="pagination"
          :default-sort="{ prop: 'createTime', order: 'descending' }"
          :paginationSmall="size === 'small'"
          :header-cell-style="{
            background: 'var(--el-table-row-hover-bg-color)',
            color: 'var(--el-text-color-primary)'
          }"
          @page-size-change="getList"
          @page-current-change="getList"
          @sort-change="onSortChanged"
        >
          <template #operation="{ row }">
            <el-button
              v-auth="'system:miniapp-user:query'"
              link
              type="primary"
              :size="size"
              :icon="useRenderIcon(View)"
              @click="openDetail(row)"
            >
              详情
            </el-button>
            <el-dropdown
              v-auth="'system:miniapp-user:edit'"
              trigger="click"
              @command="status => changeStatus(row, status)"
            >
              <el-button
                link
                type="primary"
                :size="size"
                :icon="useRenderIcon(EditPen)"
              >
                修改状态
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="item in miniappUserStatusOptions"
                    :key="item.value"
                    :command="item.value"
                    :disabled="row.status === item.value"
                  >
                    {{ item.label }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </pure-table>
      </template>
    </PureTableBar>

    <el-drawer
      v-model="detailVisible"
      title="小程序用户详情"
      size="min(520px, 92vw)"
      destroy-on-close
    >
      <div v-loading="detailLoading" class="detail-content">
        <template v-if="currentDetail">
          <div class="user-summary">
            <el-avatar :size="56" :src="currentDetail.avatar">
              {{ (currentDetail.nickname || "微").slice(0, 1) }}
            </el-avatar>
            <div>
              <div class="summary-name">
                {{ currentDetail.nickname || "微信用户" }}
              </div>
              <div class="summary-id">
                账号 ID：{{ currentDetail.iamUserId }}
              </div>
            </div>
            <el-tag :type="currentStatus?.tagType" effect="plain">
              {{ currentStatus?.label || "未知" }}
            </el-tag>
          </div>

          <el-descriptions :column="1" border>
            <el-descriptions-item label="手机号码">
              {{ currentDetail.phoneNumber || "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="绑定员工">
              <template v-if="currentDetail.boundSysUserId">
                {{ currentDetail.boundSysUserNickname || "-" }}
                （{{ currentDetail.boundSysUsername }}）
              </template>
              <span v-else>未绑定</span>
            </el-descriptions-item>
            <el-descriptions-item label="员工工作台">
              {{ currentDetail.boundWorkbenchEnabled ? "已启用" : "未启用" }}
            </el-descriptions-item>
            <el-descriptions-item label="最近登录">
              {{ formatTime(currentDetail.lastLoginTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="注册时间">
              {{ formatTime(currentDetail.createTime) }}
            </el-descriptions-item>
          </el-descriptions>

          <div class="section-title">微信身份</div>
          <el-table
            :data="currentDetail.wechatIdentities || []"
            border
            empty-text="暂无微信身份"
          >
            <el-table-column prop="appId" label="AppID" min-width="150" />
            <el-table-column
              prop="maskedOpenId"
              label="OpenID（脱敏）"
              min-width="150"
            />
            <el-table-column label="绑定时间" min-width="165">
              <template #default="scope">
                {{ formatTime(scope.row.createTime) }}
              </template>
            </el-table-column>
          </el-table>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.search-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.detail-content {
  min-height: 240px;
}

.user-summary {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
}

.summary-name {
  overflow: hidden;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-id {
  margin-top: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.section-title {
  margin: 24px 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

@media (width <= 640px) {
  .user-summary {
    grid-template-columns: 48px minmax(0, 1fr);
  }

  .user-summary > .el-tag {
    grid-column: 2;
    justify-self: start;
  }
}
</style>
