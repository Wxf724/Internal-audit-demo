import { get, post } from './index.js'

/**
 * 第三方应用配置保存
 * 功能描述：创建/修改企微等平台应用配置
 */
export function saveOkrPmaConfig(body = {}) {
  return post('/third_plat/app_config/save', body)
}

/**
 * 第三方应用配置查询
 * 功能描述：按 app_type、status 查询配置列表
 */
export function getOkrPmaConfigDetail(body = {}) {
  return post('/third_plat/app_config/list', body)
}

/**
 * 部门树查询
 * 功能描述：部门树（data_id / data_name / children）
 */
export function postOkrPmaDepartmentsList(params = {}) {
  return post('/team_manage/depart/tree_list', {}, { params })
}

/**
 * 人员删除
 * 功能描述：按 id 删除人员
 */
export function postOkrPmaUserDelete(params = {}) {
  return post('/okr_pma/user/delect', {}, { params })
}

/**
 * 人员部门混合树
 * 功能描述：部门 + 人员树，用于下拉/树选择
 */
export function postTeamManageUserTreeList(body = {}) {
  return post('/team_manage/user/tree_list', body)
}

/**
 * 第三方通讯录同步
 * 功能描述：从企微/飞书/钉钉同步部门与人员
 */
export function postTeamManageThirdAppDataSync(body = {}) {
  return post('/team_manage/third_app/data_sync', body)
}

/**
 * 未映射人员查询
 * 功能描述：第三方未绑定用户树
 */
export function postTeamManageNoMappingList(body = {}) {
  return post('/team_manage/user/no_mapping_list', body)
}

/**
 * 未映射人员导入
 * 功能描述：将选中第三方用户导入为团队成员
 */
export function postTeamManageNoMappingImport(body = {}) {
  return post('/team_manage/user/no_mapping_import', body)
}

/**
 * 人员列表（分页）
 * 功能描述：关键词、部门、岗位筛选分页
 */
export function postTeamManageUserList(body = {}) {
  return post('/team_manage/user/list', body)
}

/**
 * 人员详情
 * 功能描述：按 id 查询单条
 */
export function getTeamManageUserDetail(params = {}) {
  return get('/team_manage/user/detail', params)
}

/**
 * 人员保存
 * 功能描述：修改已有人员（新增走 no_mapping_import）
 */
export function postTeamManageUserSave(body = {}) {
  return post('/team_manage/user/save', body)
}
