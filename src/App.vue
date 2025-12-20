<script setup>
import { ref, onMounted } from 'vue'
import { useCalculatorStore } from '@/stores/calculatorStore'
import CalculatorForm from './components/CalculatorForm.vue'
import ResultDisplay from './components/ResultDisplay.vue'

const store = useCalculatorStore()
const showResult = ref(false)
const darkMode = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const activeTab = ref('calculator')

// 切换暗黑模式
const toggleDarkMode = () => {
  darkMode.value = !darkMode.value
  if (darkMode.value) {
    document.body.classList.add('dark-mode')
  } else {
    document.body.classList.remove('dark-mode')
  }
}

// 显示提示消息
const showMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  
  // 3秒后自动隐藏
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

const calculate = () => {
  const result = store.calculateAllocation()
  if (result.success) {
    showResult.value = true
    showMessage('计算完成！', 'success')
  } else {
    showMessage(result.message, 'error')
  }
}

// 切换标签页
const switchTab = (tab) => {
  activeTab.value = tab
  // 如果切换到历史记录标签页，从localStorage加载历史记录
  if (tab === 'history') {
    const savedHistory = localStorage.getItem('electricityCalculationHistory')
    if (savedHistory) {
      try {
        store.calculationHistory = JSON.parse(savedHistory)
      } catch (e) {
        console.error('Failed to parse history', e)
      }
    }
  }
}

// 加载历史记录项
const loadHistoryItem = (item) => {
  // 恢复历史记录的数据
  store.bills = item.bills
  store.startDate = item.dateRange.split(' 至 ')[0]
  store.endDate = item.dateRange.split(' 至 ')[1]
  store.allocationMethod = item.allocationMethod
  
  // 显示结果
  store.calculationResult = {
    allocationDetails: item.details,
    totalBill: item.totalBill,
    calculationDate: item.calculationDate
  }
  
  showResult.value = true
  activeTab.value = 'calculator'
  showMessage('历史记录加载成功！', 'success')
}

// 页面加载时检查系统偏好
onMounted(() => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (prefersDark) {
    toggleDarkMode()
  }
})
</script>

<template>
  <div class="app-container">
    <!-- 主题切换按钮 -->
    <div class="theme-toggle" @click="toggleDarkMode">
      <i class="toggle-icon" :class="darkMode ? 'fas fa-sun' : 'fas fa-moon'"></i>
    </div>
    
    <!-- Toast 消息提示 -->
    <div class="toast" :class="[toastType, { show: showToast }]">
      <i :class="toastType === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
      <span>{{ toastMessage }}</span>
    </div>
    
    <div class="container">
      <header>
        <div class="logo">
          <i class="logo-icon fas fa-home"></i>
        </div>
        <h1>✨ 智能房租费用分摊计算器</h1>
        <p class="subtitle">轻松计算合租费用，让分摊更公平透明</p>
      </header>
      
      <!-- 标签页 -->
      <div class="tabs">
        <div 
          class="tab" 
          :class="{ active: activeTab === 'calculator' }" 
          @click="switchTab('calculator')"
        >
          计算器
        </div>
        <div 
          class="tab" 
          :class="{ active: activeTab === 'history' }" 
          @click="switchTab('history')"
        >
          历史记录
        </div>
      </div>
      
      <main>
        <!-- 计算器标签页内容 -->
        <div v-show="activeTab === 'calculator'">
          <div class="card">
            <div class="card-header">
              <i class="fas fa-calculator"></i>
              费用信息录入
            </div>
            <div class="card-body">
              <CalculatorForm />
              
              <div class="btn-group">
                <button class="btn btn-primary" @click="calculate">
                  <i class="fas fa-calculator"></i>
                  计算费用分摊
                </button>
              </div>
            </div>
          </div>
          
          <div v-if="showResult && store.calculationResult" class="result-container">
            <ResultDisplay :result="store.calculationResult" />
          </div>
          
          <div v-else-if="!showResult && store.totalBillAmount > 0" class="card">
            <div class="card-body">
              <div class="alert alert-info mb-0">
                <i class="fas fa-info-circle me-2"></i>
                填写完所有信息后，点击上方按钮查看分摊结果
              </div>
            </div>
          </div>
        </div>
        
        <!-- 历史记录标签页内容 -->
        <div v-show="activeTab === 'history'">
          <div class="card">
            <div class="card-header">
              <i class="fas fa-history"></i>
              历史记录
            </div>
            <div class="card-body">
              <div v-if="store.calculationHistory && store.calculationHistory.length > 0">
                <div 
                  v-for="item in store.calculationHistory" 
                  :key="item.id"
                  class="history-item"
                  @click="loadHistoryItem(item)"
                >
                  <div class="history-date">
                    {{ item.dateRange }}
                  </div>
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <div class="fw-bold">{{ item.details[0]?.tenantName ? `共${item.details.length}个租户` : '无租户信息' }}</div>
                      <div class="text-muted small">分摊方式: {{ item.allocationMethod }}</div>
                    </div>
                    <div class="history-total">
                      ¥{{ item.totalBill.toFixed(2) }}
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-5">
                <i class="fas fa-inbox fa-2x mb-3" style="color: #ccc;"></i>
                <p class="text-muted">暂无历史记录</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    
    <footer>
      <p>© 2025 智能房租费用分摊计算器 | 让合租更简单</p>
    </footer>
  </div>
</template>

<style scoped>
.theme-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  background: white;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  z-index: 100;
  transition: var(--transition);
}

.dark-mode .theme-toggle {
  background: #334155;
}

.theme-toggle:hover {
  transform: rotate(30deg);
}

.toggle-icon {
  font-size: 1.5rem;
}

.tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 2px solid #e2e8f0;
}

.dark-mode .tabs {
  border-bottom-color: #475569;
}

.tab {
  padding: 12px 20px;
  cursor: pointer;
  font-weight: 600;
  color: #64748b;
  position: relative;
}

.dark-mode .tab {
  color: #94a3b8;
}

.tab.active {
  color: var(--primary-color);
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--primary-color);
  border-radius: 3px 3px 0 0;
}

footer {
  text-align: center;
  margin-top: 40px;
  padding: 20px;
  color: #64748b;
  font-size: 0.9rem;
}
</style>