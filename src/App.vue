<script setup>
import { ref, onMounted } from 'vue'
import { useCalculatorStore } from '@/stores/calculatorStore'
import CalculatorForm from './components/CalculatorForm.vue'
import ResultDisplay from './components/ResultDisplay.vue'

const store = useCalculatorStore()
const showResult = ref(false)
const darkMode = ref(false)

// 切换暗黑模式
const toggleDarkMode = () => {
  darkMode.value = !darkMode.value
  if (darkMode.value) {
    document.body.classList.add('dark-mode')
  } else {
    document.body.classList.remove('dark-mode')
  }
}

const calculate = () => {
  const success = store.calculateElectricityAllocation()
  showResult.value = success
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
    
    <div class="container">
      <header>
        <div class="logo">
          <i class="logo-icon fas fa-home"></i>
        </div>
        <h1>✨ 智能房租电费分摊计算器</h1>
        <p class="subtitle">轻松计算合租费用，让分摊更公平透明</p>
      </header>
      
      <main>
        <div class="card">
          <div class="card-header">
            <i class="fas fa-calculator"></i>
            电费信息录入
          </div>
          <div class="card-body">
            <CalculatorForm />
            
            <div class="btn-group">
              <button class="btn btn-primary" @click="calculate">
                <i class="fas fa-bolt"></i>
                计算电费分摊
              </button>
            </div>
          </div>
        </div>
        
        <div v-if="showResult && store.calculationResult" class="result-container">
          <ResultDisplay :result="store.calculationResult" />
        </div>
        
        <div v-else-if="!showResult && store.totalElectricityBill > 0" class="card">
          <div class="card-body">
            <div class="alert alert-info mb-0">
              <i class="fas fa-info-circle me-2"></i>
              填写完所有信息后，点击上方按钮查看分摊结果
            </div>
          </div>
        </div>
      </main>
    </div>
    
    <footer>
      <p>© 2025 智能房租电费分摊计算器 | 让合租更简单</p>
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

footer {
  text-align: center;
  margin-top: 40px;
  padding: 20px;
  color: #64748b;
  font-size: 0.9rem;
}
</style>