import { http } from "@/utils/http";

export interface MiniappUserQuery extends BasePageQuery {
  nickname?: string;
  phoneNumber?: string;
  status?: number;
  bound?: boolean;
}

export interface WechatIdentitySummaryDTO {
  identityId: number;
  appId: string;
  maskedOpenId: string;
  createTime?: string;
}

export interface MiniappUserDTO {
  iamUserId: number;
  nickname: string;
  avatar?: string;
  phoneNumber?: string;
  status: number;
  createTime?: string;
  lastLoginTime?: string;
  boundSysUserId?: number;
  boundSysUsername?: string;
  boundSysUserNickname?: string;
  boundWorkbenchEnabled?: boolean;
  wechatIdentityCount?: number;
  wechatIdentities?: WechatIdentitySummaryDTO[];
}

export const getMiniappUserListApi = (params?: MiniappUserQuery) => {
  return http.request<ResponseData<PageDTO<MiniappUserDTO>>>(
    "get",
    "/system/iam-users",
    { params }
  );
};

export const getMiniappUserDetailApi = (userId: number) => {
  return http.request<ResponseData<MiniappUserDTO>>(
    "get",
    `/system/iam-users/${userId}`
  );
};

export const updateMiniappUserStatusApi = (userId: number, status: number) => {
  return http.request<ResponseData<void>>(
    "put",
    `/system/iam-users/${userId}/status`,
    { data: { status } }
  );
};
