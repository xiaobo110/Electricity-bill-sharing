<template>
  <div class="print-report" ref="printReport">
    <div class="report-header">
      <h1>房租费用分摊报表</h1>
      <div class="report-meta">
        <p><strong>计费周期：</strong>{{ store.startDate }} 至 {{ store.endDate }}</p>
        <p><strong>分摊方式：</strong>{{ allocationMethodText }}</p>
        <p><strong>总费用：</strong>¥{{ store.calculationResult.totalBill.toFixed(2) }}</p>
      </div>
    </div>

    <div class="report-content">
      <h2>租户分摊明细</h2>
      <table class="report-table">
        <thead>
          <tr>
            <th>租户</th>
            <th>分摊金额 (元)</th>
            <th>占比</th>
            <th>分摊依据</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in store.calculationResult.allocationDetails" :key="index">
            <td>{{ item.tenantName }}</td>
            <td class="amount">¥{{ item.amount.toFixed(2) }}</td>
            <td>{{ (item.ratio * 100).toFixed(1) }}%</td>
            <td>{{ item.allocationBasis }}</td>
            <td>{{ item.details }}</td>
          </tr>
          <tr class="total-row">
            <td><strong>总计</strong></td>
            <td class="amount"><strong>¥{{ store.calculationResult.totalBill.toFixed(2) }}</strong></td>
            <td><strong>100%</strong></td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="report-footer">
      <p>说明：以上分摊结果仅供参考，实际分摊应根据租赁合同约定执行。</p>
      <p class="timestamp">生成时间：{{ new Date().toLocaleString() }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCalculatorStore } from '@/stores/calculatorStore'

const store = useCalculatorStore()
const printReport = ref(null)

// 获取分摊方式文本
const allocationMethodText = (() => {
  if (!store.calculationResult || !store.calculationResult.allocationDetails) return ''
  
  const basis = store.calculationResult.allocationDetails[0].allocationBasis
  const mapping = {
    '按面积分配': '按房间面积比例分摊',
    '按人头分配': '按人头平均分摊',
    '按时长分配': '按居住天数比例分摊',
    '按设备使用分配': '按电器使用情况分摊',
    '自定义比例分配': '自定义比例分摊'
  }
  return mapping[basis] || basis
})()

// 页面加载完成后自动打印
onMounted(() => {
  // 等待DOM渲染完成后再打印
  setTimeout(() => {
    window.print()
  }, 100)
})
</script>

<style scoped>
.print-report {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.report-header {
  text-align: center;
  margin-bottom: 30px;
  border-bottom: 2px solid #6366f1;
  padding-bottom: 20px;
}

.report-header h1 {
  color: #6366f1;
  margin-bottom: 20px;
}

.report-meta {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
}

.report-meta p {
  margin: 5px 10px;
}

.report-content h2 {
  color: #334155;
  margin: 20px 0;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
}

.report-table th,
.report-table td {
  border: 1px solid #cbd5e1;
  padding: 12px 15px;
  text-align: left;
}

.report-table th {
  background-color: #f1f5f9;
  font-weight: bold;
  color: #334155;
}

.report-table tbody tr:nth-child(even) {
  background-color: #f8fafc;
}

.report-table tbody tr:hover {
  background-color: #f1f5f9;
}

.report-table .amount {
  text-align: right;
}

.report-table .total-row {
  background-color: #e2e8f0 !important;
  font-weight: bold;
}

.report-footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #cbd5e1;
}

.report-footer p {
  margin: 10px 0;
  color: #64748b;
}

.timestamp {
  text-align: right;
  font-style: italic;
}

/* 打印样式 */
@media print {
  body {
    margin: 0;
    padding: 0;
  }
  
  .print-report {
    margin: 0;
    padding: 20px;
  }
}
</style>