import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { Button } from '@/components'

export type Tone = 'blue' | 'cyan' | 'green' | 'amber' | 'red' | 'gray'

const styleId = 'icm-page-kit-style'

const css = `
.icm-page{min-height:0;background:#f5f7fb;color:#172033;font-family:var(--font-sans),'Microsoft YaHei',Arial,sans-serif;padding:0}
.icm-page *{box-sizing:border-box}
.icm-page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:14px}
.icm-page-title{margin:0;color:#0b1f43;font-size:24px;line-height:1.25;letter-spacing:0;font-weight:850}
.icm-page-sub{margin:6px 0 0;color:#66758b;font-size:13px;line-height:1.7}
.icm-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.icm-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:#fff;border:1px solid #dbe5f1;border-radius:8px;padding:10px;margin-bottom:12px}
.icm-toolbar-spacer{flex:1}
.icm-input,.icm-select{height:34px;border:1px solid #d7e2f0;background:#fff;border-radius:8px;padding:0 10px;color:#243044;font-size:13px;outline:none}
.icm-input{min-width:220px}.icm-select{min-width:132px}
.icm-segment{display:inline-flex;gap:3px;border:1px solid #d7e2f0;background:#f7faff;border-radius:8px;padding:3px}
.icm-segment button{height:28px;border:0;border-radius:6px;background:transparent;color:#56677f;font-size:12px;padding:0 10px;cursor:pointer}
.icm-segment button.active{background:#155bd4;color:#fff;font-weight:700}
.icm-grid{display:grid;gap:12px}.cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}.cols-4{grid-template-columns:repeat(4,minmax(0,1fr))}.cols-5{grid-template-columns:repeat(5,minmax(0,1fr))}.cols-6{grid-template-columns:repeat(6,minmax(0,1fr))}.cols-7{grid-template-columns:repeat(7,minmax(0,1fr))}
.icm-card{background:#fff;border:1px solid #dbe5f1;border-radius:8px;box-shadow:0 10px 24px rgba(20,38,72,.06);min-width:0}
.icm-card{display:flex;flex-direction:column}.icm-card-body{flex:1}
.icm-card-fill{height:100%;min-height:0}.icm-card-fill>.icm-card-body.icm-card-body-fill{flex:1;min-height:0;display:flex;flex-direction:column}
.icm-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #e6edf7;padding:12px 14px}
.icm-card-title{font-weight:800;color:#172033;font-size:14px}.icm-card-note{color:#748299;font-size:12px}
.icm-card-body{padding:14px}
.icm-kpi{padding:13px 14px}.icm-kpi strong{display:block;color:#0b1f43;font-size:25px;line-height:1}.icm-kpi span{display:block;margin-top:8px;color:#607089;font-size:12px}.icm-kpi b{display:block;margin-top:7px;font-size:12px;font-weight:700}
.icm-process-card{display:grid;grid-template-columns:34px minmax(0,1fr);gap:4px 10px;padding:13px 14px;align-items:center}.icm-process-icon{grid-row:1/3;width:34px;height:34px;border-radius:8px;display:grid;place-items:center;background:#eaf2ff;color:#155bd4}.icm-process-card span{color:#607089;font-size:12px}.icm-process-card strong{color:#0b1f43;font-size:20px;line-height:1.2}.icm-list-row.active{border-color:#b8cdf3;background:#f6f9ff}.icm-step.active{background:#f6f9ff;margin:0 -8px;padding-left:8px;padding-right:8px;border-radius:8px}.icm-spin{animation:icm-spin 1s linear infinite}@keyframes icm-spin{to{transform:rotate(360deg)}}
.icm-subsection-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:16px 0 10px;padding-top:14px;border-top:1px solid #edf2f8}.icm-form-actions{display:flex;justify-content:flex-end;margin-top:12px}.icm-empty-inline{border:1px dashed #ccd9ea;border-radius:8px;background:#f8fbff;color:#728198;font-size:13px;padding:16px;text-align:center}.icm-approval-panel{margin-top:14px;border:1px solid #cddcf1;border-radius:8px;background:#fbfdff;padding:14px}
.icm-modal-mask{position:fixed;inset:0;z-index:80;display:grid;place-items:center;background:rgba(8,24,48,.34);padding:24px}.icm-modal{width:min(900px,calc(100vw - 48px));max-height:calc(100vh - 72px);display:flex;flex-direction:column;border:1px solid #c9d9ee;border-radius:8px;background:#fff;box-shadow:0 24px 70px rgba(8,24,48,.26)}.icm-modal-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 18px;border-bottom:1px solid #e2eaf5}.icm-modal-title{font-size:16px;font-weight:850;color:#0b1f43}.icm-modal-sub{margin-top:4px;color:#708097;font-size:12px}.icm-modal-close{width:30px;height:30px;display:grid;place-items:center;border:1px solid #d9e5f5;border-radius:8px;background:#fff;color:#607089;cursor:pointer}.icm-modal-tools{display:flex;gap:10px;padding:12px 18px;border-bottom:1px solid #edf2f8}.icm-modal-search{min-width:0;flex:1;height:34px;display:flex;align-items:center;gap:8px;border:1px solid #d7e2f0;border-radius:8px;background:#fff;padding:0 10px;color:#607089}.icm-modal-search input{min-width:0;flex:1;border:0;outline:0;color:#172033;font-size:13px}.icm-reference-list{overflow:auto;padding:8px 14px;display:grid;gap:4px}.icm-reference-row{min-height:48px;display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid #e1eaf5;border-radius:7px;background:#fbfdff;padding:7px 10px;text-align:left;cursor:pointer}.icm-reference-row.active{border-color:#9fbded;background:#f3f7ff}.icm-reference-check{width:18px;height:18px;border:1px solid #cbd8ea;border-radius:6px;display:grid;place-items:center;color:#155bd4;font-size:12px;font-weight:900;background:#fff}.icm-reference-row strong{display:block;color:#172033;font-size:13px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.icm-reference-row em{display:block;margin-top:3px;color:#748299;font-style:normal;font-size:12px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.icm-modal-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 18px;border-top:1px solid #e2eaf5;color:#607089;font-size:13px}
.icm-rule-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 10px;padding:13px 14px}.icm-rule-card strong{color:#172033;font-size:14px}.icm-rule-card span{color:#748299;font-size:12px}.icm-rule-card b{color:#334155;font-size:12px;font-weight:700;grid-column:1/3}.icm-sync-buttons{display:grid;gap:8px}.icm-sync-buttons button{display:grid;gap:4px;border:1px solid #dce6f3;border-radius:8px;background:#fbfdff;color:#172033;text-align:left;padding:10px;cursor:pointer}.icm-sync-buttons button:hover{border-color:#adc6ef;background:#f4f8ff}.icm-sync-buttons span{font-size:13px;font-weight:800}.icm-sync-buttons em{color:#718099;font-size:12px;font-style:normal}.icm-modal-small{width:min(460px,calc(100vw - 48px))}.icm-sync-detail{display:grid;justify-items:center;gap:10px;padding:26px;color:#607089;text-align:center}.icm-sync-detail svg{color:#155bd4}.icm-sync-detail strong{color:#0b1f43;font-size:18px}.icm-sync-detail p{margin:0 0 8px;line-height:1.7}.icm-knowledge-graph{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.icm-graph-node{min-height:68px;display:grid;place-items:center;border:1px solid #cdddf3;border-radius:8px;background:#f7fbff;color:#172033;font-size:13px;font-weight:800;text-align:center}.icm-graph-node span{width:24px;height:24px;border-radius:999px;display:grid;place-items:center;background:#155bd4;color:#fff;font-size:12px}
.icm-admin-nav{border:1px solid #dbe5f1;border-radius:8px;background:#fff;padding:14px;box-shadow:0 10px 24px rgba(20,38,72,.06)}.icm-admin-nav-title{color:#0b1f43;font-size:15px;font-weight:850}.icm-admin-nav-sub{margin-top:5px;color:#748299;font-size:12px;line-height:1.5}.icm-admin-nav-list{display:grid;gap:8px;margin-top:14px}.icm-admin-nav-list button{display:flex;align-items:center;gap:8px;border:1px solid #e1eaf5;border-radius:8px;background:#fbfdff;color:#334155;padding:10px;text-align:left;font-size:13px;font-weight:800;cursor:pointer}.icm-admin-nav-list button.active,.icm-admin-nav-list button:hover{border-color:#adc6ef;background:#eef5ff;color:#155bd4}.icm-control-line{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 10px;border:1px solid #e2eaf5;border-radius:8px;background:#fbfdff;padding:10px}.icm-control-line span{color:#172033;font-size:13px;font-weight:800}.icm-control-line strong{grid-column:1/3;color:#64748b;font-size:12px;font-weight:600;line-height:1.5}
.icm-report-board .icm-list-row{align-items:center;text-align:left;justify-items:stretch;cursor:pointer}.icm-report-board .icm-list-row>div{min-width:0}.icm-report-board .icm-list-title,.icm-report-board .icm-list-meta{text-align:left}.icm-report-source-grid{grid-template-columns:repeat(2,minmax(0,1fr));align-items:start}.icm-expand-btn{width:28px;height:28px;display:inline-grid;place-items:center;border:1px solid #d9e5f5;border-radius:7px;background:#fff;color:#64748b;transition:background .16s ease,border-color .16s ease,color .16s ease}.icm-expand-btn svg{transition:transform .16s ease}.icm-expand-btn.active{border-color:#adc6ef;background:#eef5ff;color:#155bd4}.icm-expand-btn.active svg{transform:rotate(180deg)}
.icm-material-group-row{width:100%;max-width:100%;min-height:44px;justify-self:stretch;align-items:center;background:#fff;padding:8px 10px}
.icm-report-current{display:grid;gap:12px}.icm-report-paper{border:1px solid #dbe5f1;border-radius:8px;background:#fff;padding:18px;color:#243044;line-height:1.8}.icm-report-paper h2{margin:0 0 10px;color:#0b1f43;font-size:20px}.icm-report-paper h3{margin:16px 0 6px;color:#155bd4;font-size:15px}.icm-report-paper p{margin:0 0 8px}.icm-report-empty{min-height:260px;display:grid;place-items:center;border:1px dashed #ccd9ea;border-radius:8px;background:#f8fbff;color:#64748b;font-size:13px;text-align:center}.icm-report-action-bar{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;border-top:1px solid #edf2f8;padding-top:12px}.icm-audit-row{display:grid;gap:8px;border:1px solid #e2eaf5;border-radius:8px;background:#fbfdff;padding:10px}.icm-audit-row-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.icm-audit-row-head strong{color:#172033;font-size:13px}.icm-audit-row-head span{color:#748299;font-size:12px}.icm-audit-progress{height:8px;border-radius:999px;background:#e7edf6;overflow:hidden}.icm-audit-progress b{display:block;height:100%;border-radius:999px;background:#155bd4;transition:width .35s ease}.icm-audit-row.done .icm-audit-progress b{background:#15803d}.icm-audit-row.running .icm-audit-progress b{background:linear-gradient(90deg,#155bd4,#38bdf8);animation:icm-progress-pulse 1s ease-in-out infinite}.icm-report-ledger{display:grid;gap:8px;border:1px solid #cdddf3;border-radius:8px;background:#f7fbff;padding:12px}.icm-report-ledger strong{color:#0b1f43;font-size:14px}.icm-report-ledger span{color:#64748b;font-size:12px}@keyframes icm-progress-pulse{0%,100%{filter:saturate(1)}50%{filter:saturate(1.5)}}
.icm-review-task-list{display:grid;border:1px solid #e2eaf5;border-radius:8px;overflow:hidden;background:#fff}.icm-review-task-row{width:100%;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;border:0;border-bottom:1px solid #edf2f8;background:#fff;padding:11px 12px;text-align:left;cursor:pointer}.icm-review-task-row:last-child{border-bottom:0}.icm-review-task-row:hover{background:#f8fbff}.icm-review-task-row.active{background:#f4f8ff;box-shadow:inset 3px 0 0 #155bd4}.icm-review-task-main{min-width:0}.icm-review-task-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.icm-review-task-name{color:#172033;font-size:13px;font-weight:800;text-align:left}.icm-review-task-meta{display:flex;flex-wrap:wrap;gap:4px 10px;margin-top:6px;color:#6f7f95;font-size:12px;line-height:1.45}.icm-review-task-meta span{position:relative}.icm-review-task-meta span+span::before{content:"";position:absolute;left:-6px;top:50%;width:3px;height:3px;border-radius:999px;background:#b6c3d3;transform:translateY(-50%)}.icm-review-task-status{display:inline-flex;align-items:center;justify-content:center;min-width:54px;border-radius:999px;border:1px solid transparent;padding:4px 8px;font-size:12px;font-weight:800;white-space:nowrap}.icm-review-task-status.ready{color:#15803d;background:#eefaf2;border-color:#ccefd7}.icm-review-task-status.blocked{color:#a16207;background:#fff8e8;border-color:#efd59b}.icm-agent-list{display:grid;gap:9px}.icm-agent-card{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:9px;align-items:start;border:1px solid #e0e9f5;border-radius:8px;background:#fbfdff;padding:10px;text-align:left;cursor:pointer}.icm-agent-card.active{border-color:#abc4ef;background:#f4f8ff}.icm-agent-check{width:20px;height:20px;border:1px solid #cbd8ea;border-radius:6px;display:grid;place-items:center;background:#fff;color:#155bd4;font-weight:900}.icm-agent-main strong{display:flex;align-items:center;gap:6px;color:#172033;font-size:13px}.icm-agent-main em{display:block;margin-top:5px;color:#6f7f95;font-size:12px;font-style:normal;line-height:1.45}.icm-agent-main b{display:block;margin-top:6px;color:#155bd4;font-size:12px;font-weight:800}.icm-agent-summary{display:flex;gap:8px;margin-top:12px;border:1px dashed #cbd8ea;border-radius:8px;background:#f8fbff;padding:10px;color:#64748b;font-size:12px;line-height:1.55}.icm-agent-summary svg{color:#155bd4;flex:0 0 auto}.icm-agent-config-btn{display:inline-flex;align-items:center;gap:3px;border:1px solid #d9e5f5;border-radius:6px;background:#fff;color:#607089;font-size:11px;font-weight:700;padding:3px 6px;cursor:pointer;white-space:nowrap}.icm-agent-config-btn:hover{border-color:#adc6ef;background:#eef5ff;color:#155bd4}.icm-row-actions{display:flex;gap:6px;flex-wrap:wrap}.icm-row-actions button{border:1px solid #d9e5f5;border-radius:7px;background:#fff;color:#155bd4;font-size:12px;font-weight:800;padding:5px 8px;cursor:pointer;white-space:nowrap}.icm-row-actions button:hover:not(:disabled){background:#eef5ff}.icm-row-actions button:disabled{border-color:#e8ecf2;color:#9aa9bb;background:#f7f9fb;cursor:default}
.icm-review-context{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;border:1px solid #e2eaf5;border-radius:8px;background:#fbfdff;padding:9px 10px}.icm-review-context strong{display:block;color:#172033;font-size:14px}.icm-review-context span{display:block;margin-top:4px;color:#728198;font-size:12px}.icm-review-context button{display:inline-flex;align-items:center;gap:6px;border:1px solid #d9e5f5;border-radius:8px;background:#fff;color:#155bd4;font-size:12px;font-weight:800;padding:6px 9px;cursor:pointer}.icm-review-status-grid{display:grid;grid-template-columns:repeat(6,minmax(96px,1fr));gap:6px}.icm-review-state{min-height:42px;position:relative;display:grid;grid-template-columns:18px minmax(0,1fr) auto;gap:6px;align-items:center;border:1px solid #e0e9f5;border-radius:8px;background:#fbfdff;padding:7px 8px;overflow:hidden}.icm-review-state span{width:18px;height:18px;border-radius:6px;display:grid;place-items:center;background:#edf3fb;color:#607089;font-size:11px;font-weight:900}.icm-review-state strong{min-width:0;color:#172033;font-size:12px;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.icm-review-state em{display:inline-flex;align-items:center;gap:3px;color:#718099;font-size:11px;font-style:normal;font-weight:800}.icm-review-state.active{border-color:#9cbdf0;background:#eef5ff}.icm-review-state.active::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(21,91,212,.08),transparent);animation:icm-scan 1.2s linear infinite}.icm-review-state.done{border-color:#bde7ca;background:#f0fbf4}.icm-review-state.done span{background:#dff6e8;color:#15803d}.icm-review-agent-line{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.icm-plan-preview{padding:18px;color:#334155;line-height:1.75}.icm-plan-preview h3{margin:0 0 10px;color:#0b1f43;font-size:18px}.icm-plan-preview p{margin:0 0 8px}.icm-reveal-panel{display:grid;gap:12px;animation:icm-reveal .24s ease-out both;transform-origin:top}.icm-reveal-panel>.icm-card{animation:icm-card-in .28s ease-out both}.icm-reveal-panel>.icm-card:nth-child(2){animation-delay:.08s}@keyframes icm-scan{to{transform:translateX(100%)}}@keyframes icm-reveal{from{opacity:0;transform:translateY(10px) scale(.99)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes icm-card-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@media(prefers-reduced-motion:reduce){.icm-reveal-panel,.icm-reveal-panel>.icm-card{animation:none}}
.icm-review-run-panel{display:grid;gap:7px;padding:14px 18px 18px}.icm-review-run-step{display:grid;grid-template-columns:20px minmax(0,1fr) auto;gap:8px;align-items:center;border:1px solid #e0e9f5;border-radius:8px;background:#fbfdff;padding:8px 10px}.icm-review-run-step span{width:20px;height:20px;border-radius:7px;display:grid;place-items:center;background:#edf3fb;color:#607089;font-size:11px;font-weight:900}.icm-review-run-step strong{font-size:12px;color:#172033;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.icm-review-run-step em{display:inline-flex;align-items:center;gap:4px;color:#718099;font-size:11px;font-style:normal;font-weight:800}.icm-review-run-step.active{border-color:#9cbdf0;background:#eef5ff}.icm-review-run-step.done{border-color:#bde7ca;background:#f0fbf4}.icm-review-run-step.done span{background:#dff6e8;color:#15803d}
.icm-review-layout{min-height:calc(100vh - 58px - 48px - 28px - 112px);align-items:stretch}.icm-review-layout>.icm-card,.icm-review-layout>.icm-review-middle{height:100%;min-height:0}.icm-review-middle{grid-template-rows:auto minmax(0,1fr)}.icm-review-middle>.icm-card:last-child{min-height:0}.icm-review-layout .icm-list{align-content:start}.icm-review-layout .icm-agent-list{align-content:start}
.tone-blue b,.tag-blue{color:#155bd4}.tone-cyan b,.tag-cyan{color:#047c95}.tone-green b,.tag-green{color:#15803d}.tone-amber b,.tag-amber{color:#a16207}.tone-red b,.tag-red{color:#b91c1c}.tone-gray b,.tag-gray{color:#475569}
.tag{display:inline-flex;align-items:center;justify-content:center;min-height:22px;border-radius:999px;padding:0 8px;font-size:12px;font-weight:700;white-space:nowrap}
.tag-blue{background:#eaf2ff;border:1px solid #c9dcff}.tag-cyan{background:#e7f8fb;border:1px solid #bdeaf1}.tag-green{background:#eaf8ef;border:1px solid #c7ebd2}.tag-amber{background:#fff7e6;border:1px solid #f3d499}.tag-red{background:#fff0f0;border:1px solid #f4c7c7}.tag-gray{background:#f1f5f9;border:1px solid #d9e2ec}
.icm-table-wrap{overflow:auto}.icm-table{width:100%;border-collapse:collapse;font-size:13px}.icm-table th{background:#f6f9fd;color:#5d6d84;text-align:left;font-weight:800;border-bottom:1px solid #dfe8f3;padding:9px 10px;white-space:nowrap}.icm-table td{border-bottom:1px solid #edf2f8;padding:10px;vertical-align:top;color:#263244}.icm-table tr:hover td{background:#fbfdff}
.icm-list{display:grid;gap:8px}.icm-list-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;border:1px solid #e2eaf5;border-radius:8px;padding:10px;background:#fbfdff}.icm-list-title{font-weight:800;color:#172033;font-size:13px}.icm-list-meta{margin-top:5px;color:#6f7f95;font-size:12px;line-height:1.55}
.icm-plan-list-row{width:100%;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;border:1px solid #e3ebf6;border-radius:9px;background:#fff;padding:11px 12px;text-align:left;cursor:pointer;transition:border-color .16s ease,background .16s ease,box-shadow .16s ease}.icm-plan-list-row:hover{border-color:#c3d5ee;background:#fbfdff}.icm-plan-list-row.active{border-color:#93b7ec;background:#f6f9ff;box-shadow:inset 3px 0 0 #155bd4}.icm-plan-list-main{min-width:0}.icm-plan-list-meta{display:flex;flex-wrap:wrap;gap:5px 12px;margin-top:7px;color:#6f7f95;font-size:12px;line-height:1.45}.icm-plan-list-meta span{position:relative}.icm-plan-list-meta span+span::before{content:"";position:absolute;left:-7px;top:50%;width:3px;height:3px;border-radius:999px;background:#b6c3d3;transform:translateY(-50%)}.icm-plan-status{display:inline-flex;align-items:center;gap:6px;min-width:68px;justify-content:center;border-radius:999px;padding:5px 9px;font-size:12px;font-weight:800;border:1px solid transparent;white-space:nowrap}.icm-plan-status i{width:6px;height:6px;border-radius:999px;background:currentColor}.icm-plan-status-blue{color:#155bd4;background:#edf5ff;border-color:#cfe1ff}.icm-plan-status-cyan{color:#047c95;background:#e9f9fb;border-color:#c4edf3}.icm-plan-status-green{color:#15803d;background:#eefaf2;border-color:#ccefd7}.icm-plan-status-amber{color:#a16207;background:#fff8e8;border-color:#efd59b}.icm-plan-status-red{color:#b91c1c;background:#fff1f1;border-color:#f3caca}.icm-plan-status-gray{color:#475569;background:#f4f7fb;border-color:#dbe4ee}
.icm-step{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px dashed #dce6f2}.icm-step:last-child{border-bottom:0}.icm-step-no{width:24px;height:24px;border-radius:8px;display:grid;place-items:center;background:#eaf2ff;color:#155bd4;font-weight:900;font-size:12px;flex:0 0 auto}
.icm-drawer{position:sticky;top:16px}.icm-detail-line{display:grid;grid-template-columns:86px minmax(0,1fr);gap:10px;padding:8px 0;border-bottom:1px solid #edf2f8;font-size:13px}.icm-detail-line span{color:#748299}.icm-detail-line strong{color:#243044;font-weight:700}
.icm-link{border:0;background:transparent;color:#155bd4;font-weight:700;cursor:pointer;padding:0;font-size:12px}.icm-clickable-row{cursor:pointer}.icm-clickable-row:hover{background:#eef5ff}
.icm-editor{min-height:320px;border:1px solid #dbe5f1;border-radius:8px;background:#fff;padding:18px;line-height:1.8;color:#243044}.icm-editor h2{margin:0 0 10px;color:#0b1f43;font-size:20px}.icm-editor h3{font-size:15px;color:#155bd4;margin:16px 0 6px}.icm-editor p{margin:0 0 8px}.icm-editor-compact{font-size:13px;line-height:1.7}.icm-editor-compact h2{font-size:18px;margin-bottom:8px}.icm-editor-compact h3{font-size:14px;margin:14px 0 5px}.icm-editor-compact p{margin:0 0 6px}
.icm-screen{background:#081a31;color:#eaf6ff;border-radius:8px;padding:14px;border:1px solid #163b68;box-shadow:inset 0 0 0 1px rgba(109,190,255,.12)}
.icm-screen .icm-card{background:#0c2441;border-color:#1d4976;box-shadow:none}.icm-screen .icm-card-title,.icm-screen .icm-table td{color:#eaf6ff}.icm-screen .icm-card-note,.icm-screen .icm-table th{color:#9bc5e8}.icm-screen .icm-table th{background:#102e50;border-color:#1d4976}.icm-screen .icm-table td{border-color:#193d66}
.heat-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px}.heat-cell{height:54px;border-radius:6px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:12px;font-weight:800;color:#fff}
.bar-row{display:grid;grid-template-columns:90px minmax(0,1fr) 42px;gap:8px;align-items:center;margin:9px 0;font-size:12px}.bar-track{height:10px;background:#e7edf6;border-radius:999px;overflow:hidden}.bar-fill{height:100%;border-radius:999px;background:#155bd4}
@media(max-width:1440px){.cols-6{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:1100px){.cols-4,.cols-3,.cols-2,.icm-report-source-grid{grid-template-columns:1fr}.cols-5,.cols-6{grid-template-columns:repeat(3,minmax(0,1fr))}.icm-page-header{display:block}.icm-actions{margin-top:10px}.icm-input{min-width:160px}}
@media(max-width:720px){.cols-5,.cols-6{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){.cols-5,.cols-6{grid-template-columns:1fr}}
.icm-chunk-panel{display:flex;flex-direction:column;gap:10px}
.icm-chunk-list{display:grid;gap:10px;max-height:calc(100vh - 220px);overflow:auto}
.icm-chunk-card{border:1px solid #dbe5f1;border-radius:8px;background:#fbfdff;padding:10px 12px}
.icm-chunk-card-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}
.icm-chunk-id{color:#155bd4;font-size:12px;font-weight:800;font-family:var(--font-mono,monospace)}
.icm-chunk-text{margin:0 0 6px;color:#243044;font-size:13px;line-height:1.6}
.icm-chunk-source{color:#748299;font-size:11px}

  /* Enterprise workbench system overrides. */
  .icm-page{min-height:100%;max-width:1680px;margin:0 auto;color:#1e293b;font-family:"Microsoft YaHei","Noto Sans SC",Arial,sans-serif}
  .icm-page-header{min-height:72px;align-items:center;margin:0 0 16px;padding:0 0 16px;border-bottom:1px solid #dbe3ed}
  .icm-page-header>div:first-child{min-width:0;padding-left:14px;border-left:3px solid #0f4c81}
  .icm-page-title{color:#0f172a;font-size:22px;font-weight:800;line-height:1.35}
  .icm-page-sub{max-width:840px;margin-top:5px;color:#64748b;font-size:13px;line-height:1.55}
  .icm-actions{gap:8px}
  .icm-toolbar{min-height:52px;margin-bottom:16px;border:1px solid #d8e1ec;border-radius:4px;background:#fff;padding:8px 10px;box-shadow:none}
  .icm-input,.icm-select{height:34px;border-color:#cbd5e1;border-radius:4px;background:#fff;color:#1e293b;font-size:13px}
  .icm-input:focus,.icm-select:focus{border-color:#0f5f9f;box-shadow:0 0 0 2px rgba(15,95,159,.12)}
  .icm-card{border-color:#d8e1ec;border-radius:4px;box-shadow:0 2px 8px rgba(15,23,42,.045)}
  .icm-card-head{min-height:48px;padding:11px 16px;border-bottom-color:#dfe7f0;background:#fbfcfe}
  .icm-card-title{color:#0f172a;font-size:14px;font-weight:800}
  .icm-card-note{margin-top:3px;color:#718096;font-size:12px;line-height:1.4}
  .icm-card-body{padding:16px}
  .icm-kpi{position:relative;min-height:104px;padding:15px 16px;border-top:2px solid #0f5f9f;box-shadow:none}
  .icm-kpi strong{color:#0f172a;font-size:27px}.icm-kpi span{margin-top:7px;color:#475569}.icm-kpi b{color:#718096}
  .icm-table{font-size:13px}.icm-table th{height:40px;background:#f2f5f8;color:#475569;border-bottom-color:#d8e1ec;padding:9px 12px;font-size:12px}.icm-table td{padding:11px 12px;border-bottom-color:#e6ebf1;color:#334155}.icm-table tr:hover td{background:#f8fbff}
  .icm-list-row{border-color:#dbe3ed;border-radius:4px;background:#fff}.icm-list-row:hover{border-color:#b8c9db;background:#fafcff}
  .icm-detail-line{grid-template-columns:94px minmax(0,1fr);padding:10px 0;border-bottom-color:#e6ebf1}.icm-detail-line span{color:#64748b}.icm-detail-line strong{color:#1e293b;font-weight:700}
  .tag{min-height:22px;border-radius:3px;padding:0 7px;font-size:12px;font-weight:700}.tag-blue{background:#eaf2f8;border-color:#c6d7e7;color:#0f5f9f}.tag-cyan{background:#edf7f8;border-color:#c9e5e8;color:#0f7180}.tag-green{background:#edf8f1;border-color:#c8e7d2;color:#1d7a46}.tag-amber{background:#fff7e8;border-color:#ead7a7;color:#9a6700}.tag-red{background:#fff1f0;border-color:#f0cac5;color:#b42318}.tag-gray{background:#f4f6f8;border-color:#dce3ea;color:#536274}
  .icm-link{color:#0f5f9f}.icm-link:hover{text-decoration:underline}.icm-clickable-row{cursor:pointer}.icm-clickable-row:focus-visible{outline:2px solid #0f5f9f;outline-offset:-2px}
  .icm-editor,.icm-report-paper{border-color:#d8e1ec;border-radius:4px;box-shadow:none}.icm-editor h2,.icm-report-paper h2{color:#0f172a}.icm-editor h3,.icm-report-paper h3{color:#0f5f9f}
  .icm-empty-inline{border-color:#cbd8e6;border-radius:4px;background:#fafcff;color:#64748b}
  .icm-modal{border-radius:4px;border-color:#cbd7e5}.icm-modal-head,.icm-modal-foot{background:#fbfcfe}
  .icm-segment{border-radius:4px;background:#f5f7fa}.icm-segment button{border-radius:3px}.icm-segment button.active{background:#0f5f9f}
  @media(max-width:900px){.icm-page-header{align-items:flex-start}.icm-page-header>div:first-child{padding-left:10px}.icm-page-title{font-size:20px}.icm-card-body{padding:12px}}`


export function useIcmPageKitStyle() {
  useEffect(() => {
    if (document.getElementById(styleId)) return
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = css
    document.head.appendChild(style)
  }, [])
}

export function PageFrame({
  title,
  subtitle,
  actions,
  children,
}: {
  title: ReactNode
  subtitle: string
  actions?: ReactNode
  children: ReactNode
}) {
  useIcmPageKitStyle()
  return (
    <div className="icm-page">
      <header className="icm-page-header">
        <div>
          <h1 className="icm-page-title">{title}</h1>
          <p className="icm-page-sub">{subtitle}</p>
        </div>
        {actions ? <div className="icm-actions">{actions}</div> : null}
      </header>
      {children}
    </div>
  )
}

export function Card({
  title,
  note,
  children,
  action,
  compact,
  fill,
  bodyStyle,
}: {
  title: string
  note?: string
  children: ReactNode
  action?: ReactNode
  compact?: boolean
  fill?: boolean
  bodyStyle?: CSSProperties
}) {
  const pad = compact ? { padding: '5px 9px' } : undefined
  const bodyPad = compact ? { padding: '6px 9px' } : undefined
  return (
    <section className={`icm-card${fill ? ' icm-card-fill' : ''}`}>
      <div className="icm-card-head" style={pad}>
        <div>
          <div className="icm-card-title">{title}</div>
          {note ? <div className="icm-card-note">{note}</div> : null}
        </div>
        {action}
      </div>
      <div className={`icm-card-body${fill ? ' icm-card-body-fill' : ''}`} style={{ ...bodyPad, ...bodyStyle }}>{children}</div>
    </section>
  )
}

export function Kpi({ value, label, note, tone = 'blue', compact }: { value: string; label: string; note: string; tone?: Tone; compact?: boolean }) {
  const pad = compact ? { padding: '8px 10px' } : undefined
  return (
    <div className={`icm-card icm-kpi tone-${tone}`} style={pad}>
      <strong style={compact ? { fontSize: 20 } : undefined}>{value}</strong>
      <span style={compact ? { marginTop: 4, fontSize: 11 } : undefined}>{label}</span>
      <b style={compact ? { marginTop: 3, fontSize: 10 } : undefined}>{note}</b>
    </div>
  )
}

export function Tag({ children, tone = 'blue' }: { children: ReactNode; tone?: Tone }) {
  return <span className={`tag tag-${tone}`}>{children}</span>
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="icm-toolbar">{children}</div>
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { label: string; value: T }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="icm-segment">
      {options.map((item) => (
        <button className={value === item.value ? 'active' : ''} key={item.value} onClick={() => onChange(item.value)}>
          {item.label}
        </button>
      ))}
    </div>
  )
}

export function DataTable({ columns, rows, onRowClick, compact }: { columns: ReactNode[]; rows: ReactNode[][]; onRowClick?: (index: number) => void; compact?: boolean }) {
  const thStyle = compact ? { padding: '4px 7px', fontSize: 11 } : undefined
  const tdStyle = compact ? { padding: '4px 7px', fontSize: 11 } : undefined
  return (
    <div className="icm-table-wrap">
      <table className="icm-table">
        <thead>
          <tr>{columns.map((column, index) => <th key={index} style={thStyle}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={index}
              className={onRowClick ? 'icm-clickable-row' : undefined}
              onClick={onRowClick ? () => onRowClick(index) : undefined}
            >{row.map((cell, cellIndex) => <td key={cellIndex} style={tdStyle}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DetailLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="icm-detail-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export function StepList({ steps }: { steps: { title: string; text: string }[] }) {
  return (
    <div>
      {steps.map((step, index) => (
        <div className="icm-step" key={step.title}>
          <div className="icm-step-no">{index + 1}</div>
          <div>
            <div className="icm-list-title">{step.title}</div>
            <div className="icm-list-meta">{step.text}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function downloadWord(filename: string, html: string) {
  const blob = new Blob([html], { type: 'application/msword;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function printHtml(html: string) {
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 240)
}

export { Button }
