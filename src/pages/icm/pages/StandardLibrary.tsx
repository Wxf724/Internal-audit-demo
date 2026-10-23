import { useState } from 'react'
import { Input, Tabs, Textarea } from '@/components'
import { Card, DataTable, DetailLine, PageFrame, Tag, Toolbar, Button, type Tone } from '../components/IcmPageKit'
import { rules, toneByStatus } from '../data'

export default function StandardLibrary() {
  const [activeKey, setActiveKey] = useState('model')

  return (
    <PageFrame
      title="检查标准库"
      subtitle="维护检查要点、模型规则、来源权限、穿行测试模板、抽样规则、输出联动和变更留痕。"
      actions={<Button type="primary">新增集团补充规则</Button>}
    >
      <Toolbar>
        <Input search className="min-w-[280px]" placeholder="搜索规则 / 要点 / 法规依据" />
        <select className="icm-select"><option>采购</option><option>合同</option><option>资金</option></select>
        <Button type="info-soft">规则试算</Button>
        <Tag tone="blue">一体化规则底座</Tag>
      </Toolbar>

      <Tabs
        activeKey={activeKey}
        onChange={setActiveKey}
        items={[
          {
            key: 'model',
            label: '要点模型',
            children: (
              <div className="icm-grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 28%' }}>
                <Card title="要点模型一体化库" note="检查要点、判定条件、风险模型合并维护">
                  <DataTable
                    columns={['规则编号', '领域', '规则名称', '判定条件', '依据', '输出']}
                    rows={rules.map((rule) => [rule.id, rule.domain, rule.name, rule.condition, rule.source, rule.output])}
                  />
                </Card>
                <Card title="模型配置摘要" note="展示当前规则包的适用口径">
                  <DetailLine label="适用任务" value="采购围标风险专项检查" />
                  <DetailLine label="字段口径" value="合同、供应商、评分表、付款流水" />
                  <DetailLine label="风险阈值" value="金额接近招标线、报价差异小于 1%、预付比例超约定" />
                  <Textarea rows={4} defaultValue="模型说明：规则先形成疑似线索，再由人工复核确认，不直接生成问题定性。" />
                </Card>
              </div>
            ),
          },
          {
            key: 'source',
            label: '来源权限',
            children: (
              <Card title="规则来源与权限治理" note="预置规则、集团自定义、行业特色规则分级维护">
                <DataTable
                  columns={['来源', '权限', '处理规则', '审批要求']}
                  rows={[
                    ['监管预置', '只读', '不可删除、不可停用，仅允许补充适用说明', <Tag tone="gray">系统锁定</Tag>],
                    ['集团自定义', '可编辑', '需变更审批后生效', <Tag tone="amber">双人复核</Tag>],
                    ['行业特色', '可配置', '按受检单位范围启用', <Tag tone="blue">范围授权</Tag>],
                    ['项目临时规则', '项目内可用', '项目结束后归档复盘', <Tag tone="green">可沉淀</Tag>],
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'walk',
            label: '穿行模板',
            children: (
              <Card title="穿行测试模板与抽样规则" note="围绕业务流程节点验证控制设计与执行">
                <DataTable
                  columns={['模板', '流程范围', '样本来源', '抽样规则', '输出']}
                  rows={[
                    ['采购到付款穿行测试模板', '需求、招标、合同、验收、付款', '采购合同台账 + 付款流水', '高风险供应商、大额合同、异常付款优先', '控制点结论 / 取证单'],
                    ['合同签订穿行测试模板', '立项、谈判、审批、签署', '合同台账 + 审批记录', '金额接近阈值、补充协议频繁样本优先', '底稿草稿'],
                    ['供应商准入穿行测试模板', '准入、评审、维护、退出', '供应商档案', '联系人重复、账户重复、资质临期样本优先', '风险提示'],
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'output',
            label: '输出联动',
            children: (
              <Card title="规则输出与联动" note="规则命中后向数据、审查、底稿、报告传递结构化结果">
                <DataTable
                  columns={['下游模块', '输出内容', '触发方式', '回写']}
                  rows={[
                    ['数据采集中心', '采集字段需求、质量规则', '任务进场确认', '采集结果包'],
                    ['智能审查工作台', '规则命中条件、置信度口径', '运行智能体', '疑似问题'],
                    ['穿行测试工作台', '控制点、样本规则、证据要求', '计划分解', '测试结论'],
                    ['报告中心', '法规依据引用、问题依据', '报告生成', '引用清单'],
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'change',
            label: '变更留痕',
            children: (
              <Card title="变更审批与留痕" note="规则调整、字段变化、阈值变化均可追溯">
                <DataTable
                  columns={['变更项', '影响范围', '状态', '留痕']}
                  rows={[
                    ['R-BID-001 阈值说明补充', '采购专项规则包', <Tag tone="green">已生效</Tag>, '郑刚 2026-06-28'],
                    ['陪标识别规则新增联系人字段', '供应商关联核验', <Tag tone="amber">审批中</Tag>, '李娜 2026-06-29'],
                    ['付款比例异常规则更新', '资金审查智能体', <Tag tone="blue">待试算</Tag>, '王锐 2026-06-30'],
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />
    </PageFrame>
  )
}
