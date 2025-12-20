<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCalculatorStore } from '@/stores/calculatorStore'

const store = useCalculatorStore()

// 表单数据
const formData = ref({
  startDate: '',
  endDate: '',
  allocationMethod: 'area'
})

// 计算属性
const tenants = computed(() => store.tenants)

// 更新表单数据
const updateFormData = (field, value) => {
  formData.value[field] = value
  // 同步到 store
  store[field] = value
}

// 更新账单金额
const updateBillAmount = (id, value) => {
  store.updateBillAmount(id, value)
}

// 更新租户信息
const updateTenant = (tenantId, field, value) => {
  const tenant = store.tenants.find(t => t.id === tenantId)
  if (tenant) {
    tenant[field] = value
  }
}

// 操作方法
const addBillType = () => {
  store.addBillType()
}

const removeBillType = (id) => {
  store.removeBillType(id)
}

const addTenant = () => {
  store.addTenant()
}

const removeTenant = (id) => {
  store.removeTenant(id)
}

const addDevice = (tenantId) => {
  store.addDevice(tenantId)
}

const removeDevice = (tenantId, deviceId) => {
  store.removeDevice(tenantId, deviceId)
}

// 初始化表单数据
onMounted(() => {
  // 设置默认日期
  if (!store.startDate && !store.endDate) {
    store.setDefaultDates()
  }
  
  formData.value.startDate = store.startDate
  formData.value.endDate = store.endDate
  formData.value.allocationMethod = store.allocationMethod
})
</script>

<template>
  <div class="form-grid">
    <!-- 费用信息 -->
    <div class="form-group">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <label class="mb-0">
          <i class="fas fa-file-invoice-dollar"></i>
          费用信息
        </label>
        <button class="btn btn-sm btn-secondary" @click="addBillType">
          <i class="fas fa-plus-circle"></i> 添加费用类型
        </button>
      </div>
      
      <div class="bill-list">
        <div v-for="bill in store.bills" :key="bill.id" class="bill-item">
          <div class="bill-actions" v-if="store.bills.length > 1">
            <button 
              class="btn btn-sm btn-danger" 
              @click="removeBillType(bill.id)"
              title="删除费用类型"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
          
          <div class="form-group mb-0" style="flex: 1; min-width: 150px;">
            <label class="form-label">
              <i :class="bill.icon"></i>
              {{ bill.name }} (元)
            </label>
            <input 
              type="number" 
              class="form-control form-control-sm" 
              :value="bill.amount" 
              @input="updateBillAmount(bill.id, $event.target.value)"
              min="0" 
              step="0.01"
              placeholder="金额"
            >
          </div>
        </div>
      </div>
      
      <div class="mt-2">
        <div class="alert alert-info mb-0">
          <i class="fas fa-info-circle me-2"></i>
          <small>总费用: <strong>¥{{ store.totalBillAmount.toFixed(2) }}</strong></small>
        </div>
      </div>
    </div>
    
    <!-- 起始日期 -->
    <div class="form-group">
      <label for="startDate">
        <i class="fas fa-calendar-alt"></i>
        起始日期
      </label>
      <input 
        id="startDate"
        type="date" 
        class="form-control" 
        :value="formData.startDate" 
        @input="updateFormData('startDate', $event.target.value)"
      >
    </div>
    
    <!-- 结束日期 -->
    <div class="form-group">
      <label for="endDate">
        <i class="fas fa-calendar-check"></i>
        结束日期
      </label>
      <input 
        id="endDate"
        type="date" 
        class="form-control" 
        :value="formData.endDate" 
        @input="updateFormData('endDate', $event.target.value)"
      >
    </div>
  </div>
  
  <!-- 分摊方式 -->
  <div class="form-group">
    <label for="allocationMethod">
      <i class="fas fa-share-alt"></i>
      费用分摊方式
    </label>
    <select 
      id="allocationMethod"
      class="form-select" 
      :value="formData.allocationMethod" 
      @change="updateFormData('allocationMethod', $event.target.value)"
    >
      <option value="area">按房间面积比例分摊</option>
      <option value="headcount">按人头平均分摊</option>
      <option value="time">按居住天数比例分摊</option>
      <option value="device">按电器使用情况分摊</option>
      <option value="custom">自定义比例分摊</option>
    </select>
  </div>
  
  <!-- 租户信息 -->
  <div class="form-group">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <label class="mb-0">
        <i class="fas fa-users"></i>
        租户信息
      </label>
      <button class="btn btn-sm btn-secondary" @click="addTenant">
        <i class="fas fa-plus-circle"></i> 添加租户
      </button>
    </div>
    
    <div class="occupant-list">
      <div v-for="tenant in tenants" :key="tenant.id" class="occupant-card">
        <div class="occupant-actions">
          <button 
            class="btn btn-sm btn-danger" 
            @click="removeTenant(tenant.id)" 
            :disabled="tenants.length <= 1"
            title="删除租户"
          >
            <i class="fas fa-trash"></i>
          </button>
        </div>
        
        <div class="form-group mb-0" style="flex: 1; min-width: 150px;">
          <label class="form-label">姓名</label>
          <input 
            type="text" 
            class="form-control form-control-sm" 
            :value="tenant.name" 
            @input="updateTenant(tenant.id, 'name', $event.target.value)"
            placeholder="租户名称"
          >
        </div>
        
        <div class="form-group mb-0" style="flex: 1; min-width: 120px;">
          <label class="form-label">房间面积 (㎡)</label>
          <input 
            type="number" 
            class="form-control form-control-sm" 
            :value="tenant.roomArea" 
            @input="updateTenant(tenant.id, 'roomArea', $event.target.value)"
            min="1" 
            step="0.1"
            placeholder="面积"
          >
        </div>
        
        <div class="form-group mb-0" style="flex: 1; min-width: 120px;">
          <label class="form-label">居住天数</label>
          <input 
            type="number" 
            class="form-control form-control-sm" 
            :value="tenant.occupancyDays" 
            @input="updateTenant(tenant.id, 'occupancyDays', $event.target.value)"
            min="1" 
            max="31"
            placeholder="天数"
          >
        </div>
      </div>
    </div>
  </div>
  
  <!-- 电器使用情况 (按设备分摊时显示) -->
  <div v-if="formData.allocationMethod === 'device'" class="form-group">
    <label class="form-label">
      <i class="fas fa-plug"></i>
      电器使用情况
    </label>
    
    <div v-for="tenant in tenants" :key="`device-${tenant.id}`" class="card mb-3">
      <div class="card-body">
        <h5 class="card-title">{{ tenant.name }}的电器</h5>
        
        <div class="table-responsive">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>电器名称</th>
                <th>功率 (W)</th>
                <th>日均使用时长 (小时)</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="device in tenant.devices" :key="device.id">
                <td>
                  <input 
                    type="text" 
                    class="form-control form-control-sm" 
                    :value="device.name" 
                    @input="device.name = $event.target.value"
                    placeholder="电器名称"
                  >
                </td>
                <td>
                  <input 
                    type="number" 
                    class="form-control form-control-sm" 
                    :value="device.power" 
                    @input="device.power = $event.target.value"
                    min="1"
                    placeholder="功率"
                  >
                </td>
                <td>
                  <input 
                    type="number" 
                    class="form-control form-control-sm" 
                    :value="device.usageHours" 
                    @input="device.usageHours = $event.target.value"
                    min="0" 
                    step="0.5" 
                    max="24"
                    placeholder="时长"
                  >
                </td>
                <td>
                  <button class="btn btn-sm btn-danger" @click="removeDevice(tenant.id, device.id)">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <button class="btn btn-sm btn-secondary" @click="addDevice(tenant.id)">
          <i class="fas fa-plus-circle"></i> 添加电器
        </button>
      </div>
    </div>
  </div>
  
  <!-- 自定义分摊比例 (自定义分摊时显示) -->
  <div v-if="formData.allocationMethod === 'custom'" class="form-group">
    <label class="form-label">
      <i class="fas fa-sliders-h"></i>
      自定义分摊比例
    </label>
    
    <div class="card">
      <div class="card-body">
        <div v-for="(tenant, index) in tenants" :key="`ratio-${tenant.id}`" class="mb-3">
          <div class="d-flex align-items-center">
            <span class="me-3 fw-bold" style="min-width: 80px;">{{ tenant.name }}</span>
            <input 
              type="range" 
              class="form-range me-3" 
              :value="store.customRatios[index] * 100" 
              @input="store.customRatios[index] = $event.target.value / 100"
              min="0" 
              max="100"
            >
            <span style="min-width: 50px;">{{ Math.round(store.customRatios[index] * 100) }}%</span>
          </div>
        </div>
        
        <div class="alert alert-info mb-0">
          <i class="fas fa-info-circle me-2"></i>
          <small>系统会自动将比例调整为总和100%</small>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-control, .form-select {
  font-size: 1rem;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
}

.dark-mode .form-control, 
.dark-mode .form-select {
  background-color: #334155;
  border-color: #475569;
  color: white;
}

.form-label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.bill-item {
  background: #f8fafc;
  border-radius: 10px;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  position: relative;
  transition: all 0.3s ease;
  margin-bottom: 1rem;
}

.dark-mode .bill-item {
  background: #334155;
  border-color: #475569;
}

.bill-item:hover {
  transform: translateX(5px);
  border-color: var(--primary-color);
}

.bill-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 5px;
}

.occupant-card {
  background: #f8fafc;
  border-radius: 10px;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  position: relative;
  transition: all 0.3s ease;
}

.dark-mode .occupant-card {
  background: #334155;
  border-color: #475569;
}

.occupant-card:hover {
  transform: translateX(5px);
  border-color: var(--primary-color);
}

.occupant-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 5px;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .bill-item {
    flex-direction: column;
    align-items: stretch;
  }
  
  .bill-actions {
    position: absolute;
    top: 10px;
    right: 10px;
  }
  
  .occupant-card {
    flex-direction: column;
    align-items: stretch;
  }
  
  .occupant-actions {
    position: absolute;
    top: 10px;
    right: 10px;
  }
}
</style>