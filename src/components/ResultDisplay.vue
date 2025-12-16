<script setup>
import { computed, ref } from 'vue'
import { Chart, registerables } from 'chart.js'
import { Bar } from 'vue-chartjs'
import { useCalculatorStore } from '@/stores/calculatorStore'

Chart.register(...registerables)

const props = defineProps({
  result: {
    type: Object,
    required: true
  }
})

const store = useCalculatorStore()

// 计算图表数据
const chartData = computed(() => {
  if (!props.result || !props.result.allocationDetails) return null
  
  return {
    labels: props.result.allocationDetails.map(item => item.tenantName),
    datasets: [
      {
        label: '应缴电费 (元)',
        backgroundColor: [
          '#6366f1',
          '#8b5cf6',
          '#10b981',
          '#f59e0b',
          '#ef4444'
        ],
        borderColor: 'white',
        borderWidth: 2,
        data: props.result.allocationDetails.map(item => item.amount)
      }
    ]
  }
})

const chartOptions = computed(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(31, 41, 55, 0.9)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: function(tooltipItems) {
            return props.result.allocationDetails[tooltipItems[0].dataIndex].tenantName
          },
          label: function(context) {
            const tenant = props.result.allocationDetails[context.dataIndex]
            return [
              `金额: ¥${context.raw.toFixed(2)}`,
              `占比: ${(tenant.ratio * 100).toFixed(1)}%`,
              `分摊依据: ${tenant.allocationBasis}`,
              `说明: ${tenant.details}`
            ]
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: '#64748b'
        },
        title: {
          display: true,
          text: '金额 (元)',
          color: '#64748b',
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#64748b'
        }
      }
    }
  }
})

// 获取分摊方式文本
const getAllocationMethodText = (basis) => {
  const mapping = {
    '按面积分配': '按房间面积比例分摊',
    '按人头分配': '按人头平均分摊',
    '按时长分配': '按居住天数比例分摊',
    '按设备使用分配': '按电器使用情况分摊',
    '自定义比例分配': '自定义比例分摊'
  }
  return mapping[basis] || basis
}

// 重新计算
const recalculate = () => {
  store.clearResults()
}
</script>

<template>
  <div class="card">
    <div class="card-header">
      <div class="d-flex justify-content-between align-items-center">
        <span>
          <i class="fas fa-chart-bar"></i>
          电费分摊结果
        </span>
        <button class="btn btn-sm btn-secondary" @click="recalculate">
          <i class="fas fa-redo"></i> 重新计算
        </button>
      </div>
    </div>
    
    <div class="card-body">
      <!-- 摘要卡片 -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="summary-label">电费总额</div>
          <div class="summary-value">¥{{ result.totalBill.toFixed(2) }}</div>
          <div class="summary-label">总费用</div>
        </div>
        
        <div class="summary-card success">
          <div class="summary-label">分摊方式</div>
          <div class="summary-value" style="font-size: 1rem; white-space: normal;">
            {{ getAllocationMethodText(result.allocationDetails[0].allocationBasis) }}
          </div>
          <div class="summary-label">计费周期</div>
        </div>
      </div>
      
      <!-- 时间范围 -->
      <div class="alert alert-info">
        <i class="fas fa-calendar-alt me-2"></i>
        计费周期: <strong>{{ store.startDate }}</strong> 至 <strong>{{ store.endDate }}</strong>
      </div>
      
      <!-- 租户分摊明细 -->
      <h3 class="mb-3">
        <i class="fas fa-table me-2"></i>
        租户分摊明细
      </h3>
      
      <div class="table-responsive">
        <table class="result-table">
          <thead>
            <tr>
              <th>租户</th>
              <th>分摊金额</th>
              <th>占比</th>
              <th>分摊依据</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in result.allocationDetails" :key="index">
              <td>
                <div class="d-flex align-items-center">
                  <div class="rounded-circle me-2 d-flex align-items-center justify-content-center" 
                       style="width: 30px; height: 30px; background-color: #6366f1; color: white; font-weight: bold;">
                    {{ item.tenantName.charAt(0) }}
                  </div>
                  {{ item.tenantName }}
                </div>
              </td>
              <td class="fw-bold text-success">¥{{ item.amount.toFixed(2) }}</td>
              <td>
                <div class="d-flex align-items-center">
                  <div class="progress flex-grow-1 me-2" style="height: 8px;">
                    <div class="progress-bar" 
                         :style="{ width: (item.ratio * 100) + '%', backgroundColor: ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][index % 5] }"></div>
                  </div>
                  <span>{{ (item.ratio * 100).toFixed(1) }}%</span>
                </div>
              </td>
              <td>
                <span class="badge bg-primary">{{ item.allocationBasis }}</span>
              </td>
            </tr>
            <tr class="total-row">
              <td><strong>总计</strong></td>
              <td><strong class="text-primary">¥{{ result.totalBill.toFixed(2) }}</strong></td>
              <td><strong>100%</strong></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- 图表 -->
      <h3 class="mt-4 mb-3">
        <i class="fas fa-chart-pie me-2"></i>
        分摊可视化
      </h3>
      
      <div class="chart-container">
        <Bar 
          v-if="chartData" 
          :data="chartData" 
          :options="chartOptions" 
        />
      </div>
      
      <!-- 说明 -->
      <div class="alert alert-light mb-0">
        <i class="fas fa-info-circle me-2"></i>
        <strong>说明:</strong> 以上分摊结果仅供参考，实际分摊应根据租赁合同约定执行。
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  margin-bottom: 25px;
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.card-header {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  padding: 18px 24px;
  font-size: 1.2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 12px 12px 0 0 !important;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin: 25px 0;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border-top: 4px solid #6366f1;
}

.dark-mode .summary-card {
  background: #334155;
}

.summary-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.summary-card.warning {
  border-top-color: #f59e0b;
}

.summary-card.success {
  border-top-color: #10b981;
}

.summary-value {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 10px 0;
  color: #6366f1;
}

.summary-label {
  color: #64748b;
  font-size: 0.95rem;
}

.result-table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.result-table th,
.result-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.dark-mode .result-table th,
.dark-mode .result-table td {
  border-bottom-color: #475569;
}

.result-table th {
  background-color: #f1f5f9;
  font-weight: 600;
  color: #1f2937;
}

.dark-mode .result-table th {
  background-color: #334155;
  color: white;
}

.result-table tr:last-child td {
  border-bottom: none;
}

.result-table tr:hover {
  background-color: #f8fafc;
}

.dark-mode .result-table tr:hover {
  background-color: #334155;
}

.total-row {
  font-weight: 700;
  background-color: #f1f5f9 !important;
}

.dark-mode .total-row {
  background-color: #334155 !important;
}

.chart-container {
  height: 400px;
  margin: 30px 0;
  position: relative;
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.dark-mode .chart-container {
  background: #334155;
}

.progress {
  background-color: #e2e8f0;
}

.dark-mode .progress {
  background-color: #475569;
}

.badge {
  font-size: 0.75rem;
  padding: 0.4em 0.6em;
}

.alert {
  border-radius: 8px;
}

.alert-info {
  background-color: #dbeafe;
  border-color: #bfdbfe;
  color: #1e40af;
}

.dark-mode .alert-info {
  background-color: #1e3a8a;
  border-color: #1e40af;
  color: #dbeafe;
}

.alert-light {
  background-color: #f8fafc;
  border-color: #e2e8f0;
  color: #64748b;
}

.dark-mode .alert-light {
  background-color: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}

.btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-secondary {
  background-color: #e2e8f0;
  color: #1f2937;
  border: none;
}

.dark-mode .btn-secondary {
  background-color: #475569;
  color: white;
}

.btn-secondary:hover {
  background-color: #cbd5e1;
  transform: translateY(-2px);
}

.dark-mode .btn-secondary:hover {
  background-color: #64748b;
}

@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    height: 300px;
    padding: 15px;
  }
  
  .result-table {
    font-size: 0.9rem;
  }
  
  .result-table th,
  .result-table td {
    padding: 10px 12px;
  }
}
</style>