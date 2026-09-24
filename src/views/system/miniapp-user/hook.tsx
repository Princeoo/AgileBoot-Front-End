import dayjs from "dayjs";
import { computed, onMounted, reactive, ref, toRaw } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import type { Sort } from "element-plus";
import { ElMessageBox } from "element-plus";
import {
  getMiniappUserDetailApi,
  getMiniappUserListApi,
  MiniappUserDTO,
  MiniappUserQuery,
  updateMiniappUserStatusApi
} from "@/api/system/miniapp-user";
import { CommonUtils } from "@/utils/common";
import { message } from "@/utils/message";

export const miniappUserStatusOptions = [
  { label: "正常", value: 1, tagType: "success" },
  { label: "停用", value: 2, tagType: "info" },
  { label: "冻结", value: 3, tagType: "warning" }
] as const;

const statusMap = Object.fromEntries(
  miniappUserStatusOptions.map(item => [item.value, item])
);

function formatTime(value?: string) {
  return value ? dayjs(value).format("YYYY-MM-DD HH:mm:ss") : "-";
}

export function useMiniappUserHook() {
  const searchFormParams = reactive<MiniappUserQuery>({
    nickname: undefined,
    phoneNumber: undefined,
    status: undefined,
    bound: undefined
  });
  const timeRange = ref<[string, string]>();
  const dataList = ref<MiniappUserDTO[]>([]);
  const pageLoading = ref(false);
  const detailLoading = ref(false);
  const detailVisible = ref(false);
  const currentDetail = ref<MiniappUserDTO>();
  const sortState = ref<Sort>({ prop: "createTime", order: "descending" });
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const columns: TableColumnList = [
    { label: "账号ID", prop: "iamUserId", width: 90, fixed: "left" },
    {
      label: "小程序用户",
      prop: "nickname",
      minWidth: 180,
      cellRenderer: ({ row }) => (
        <div class="flex items-center gap-2 text-left">
          <el-avatar size={32} src={row.avatar}>
            {(row.nickname || "微").slice(0, 1)}
          </el-avatar>
          <span>{row.nickname || "微信用户"}</span>
        </div>
      )
    },
    {
      label: "手机号",
      prop: "phoneNumber",
      minWidth: 130,
      formatter: ({ phoneNumber }) => phoneNumber || "-"
    },
    {
      label: "状态",
      prop: "status",
      minWidth: 90,
      cellRenderer: ({ row, props }) => {
        const status = statusMap[row.status];
        return (
          <el-tag size={props.size} type={status?.tagType} effect="plain">
            {status?.label || "未知"}
          </el-tag>
        );
      }
    },
    {
      label: "绑定员工",
      prop: "boundSysUsername",
      minWidth: 170,
      cellRenderer: ({ row, props }) =>
        row.boundSysUserId ? (
          <div class="text-left">
            <div>{row.boundSysUserNickname || row.boundSysUsername}</div>
            <el-tag size={props.size} effect="plain">
              {row.boundSysUsername}
            </el-tag>
          </div>
        ) : (
          <span class="text-[var(--el-text-color-secondary)]">未绑定</span>
        )
    },
    {
      label: "员工工作台",
      prop: "boundWorkbenchEnabled",
      minWidth: 105,
      cellRenderer: ({ row, props }) => (
        <el-tag
          size={props.size}
          type={row.boundWorkbenchEnabled ? "success" : "info"}
          effect="plain"
        >
          {row.boundWorkbenchEnabled ? "已启用" : "未启用"}
        </el-tag>
      )
    },
    {
      label: "微信身份",
      prop: "wechatIdentityCount",
      minWidth: 95,
      formatter: ({ wechatIdentityCount }) => `${wechatIdentityCount || 0} 个`
    },
    {
      label: "最近登录",
      prop: "lastLoginTime",
      minWidth: 165,
      sortable: "custom",
      formatter: ({ lastLoginTime }) => formatTime(lastLoginTime)
    },
    {
      label: "注册时间",
      prop: "createTime",
      minWidth: 165,
      sortable: "custom",
      formatter: ({ createTime }) => formatTime(createTime)
    },
    { label: "操作", fixed: "right", width: 190, slot: "operation" }
  ];

  const currentStatus = computed(() =>
    currentDetail.value ? statusMap[currentDetail.value.status] : undefined
  );

  async function getList() {
    pageLoading.value = true;
    CommonUtils.fillPaginationParams(searchFormParams, pagination);
    CommonUtils.fillSortParams(searchFormParams, sortState.value);
    CommonUtils.fillTimeRangeParams(searchFormParams, timeRange.value);
    try {
      const { data } = await getMiniappUserListApi(toRaw(searchFormParams));
      dataList.value = data.rows;
      pagination.total = data.total;
    } finally {
      pageLoading.value = false;
    }
  }

  function onSearch() {
    pagination.currentPage = 1;
    getList();
  }

  function onSortChanged(sort: Sort) {
    sortState.value = sort?.order
      ? sort
      : { prop: "createTime", order: "descending" };
    pagination.currentPage = 1;
    getList();
  }

  function resetForm(formEl) {
    if (!formEl) return;
    formEl.resetFields();
    timeRange.value = undefined;
    onSearch();
  }

  async function openDetail(row: MiniappUserDTO) {
    detailVisible.value = true;
    detailLoading.value = true;
    currentDetail.value = undefined;
    try {
      const { data } = await getMiniappUserDetailApi(row.iamUserId);
      currentDetail.value = data;
    } finally {
      detailLoading.value = false;
    }
  }

  async function changeStatus(row: MiniappUserDTO, status: number) {
    if (row.status === status) return;
    const targetStatus = statusMap[status];
    try {
      await ElMessageBox.confirm(
        `确认将小程序用户“${row.nickname || row.iamUserId}”设为${
          targetStatus.label
        }吗？状态修改后，该用户当前登录会话将立即失效。`,
        "修改账号状态",
        {
          confirmButtonText: "确认修改",
          cancelButtonText: "取消",
          type: "warning",
          draggable: true
        }
      );
    } catch {
      return;
    }
    await updateMiniappUserStatusApi(row.iamUserId, status);
    message("小程序用户状态已更新", { type: "success" });
    await getList();
    if (currentDetail.value?.iamUserId === row.iamUserId) {
      const { data } = await getMiniappUserDetailApi(row.iamUserId);
      currentDetail.value = data;
    }
  }

  onMounted(getList);

  return {
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
  };
}
