import { defineStore } from 'pinia'

export const useCalculatorStore = defineStore('calculator', {
  state: () => ({
    // 费用基础数据
    bills: [
      {
        id: 'electricity',
        name: '电费',
        icon: 'fas fa-bolt',
        amount: 0
      }
    ],
    startDate: '',
    endDate: '',
    
    // 租户信息
    tenants: [
      { id: 1, name: '租户1', roomArea: 15, occupancyDays: 30, devices: [] },
      { id: 2, name: '租户2', roomArea: 12, occupancyDays: 30, devices: [] }
    ],
    
    // 分摊设置
    allocationMethod: 'area', // 'area', 'headcount', 'time', 'device', 'custom'
    customRatios: [0.5, 0.5],
    calculationHistory: [],
    
    // 计算结果
    calculationResult: null
  }),
  
  getters: {
    totalArea: (state) => {
      return state.tenants.reduce((sum, tenant) => sum + parseFloat(tenant.roomArea || 0), 0)
    },
    
    totalOccupancyDays: (state) => {
      return state.tenants.reduce((sum, tenant) => sum + parseInt(tenant.occupancyDays || 0), 0)
    },
    
    // 获取总费用
    totalBillAmount: (state) => {
      return state.bills.reduce((sum, bill) => sum + parseFloat(bill.amount || 0), 0)
    }
  },
  
  actions: {
    // 添加费用类型
    addBillType() {
      const billTypes = [
        { id: 'water', name: '水费', icon: 'fas fa-tint' },
        { id: 'gas', name: '燃气费', icon: 'fas fa-fire' },
        { id: 'property', name: '物业费', icon: 'fas fa-home' },
        { id: 'internet', name: '网络费', icon: 'fas fa-wifi' },
        { id: 'other', name: '其他费用', icon: 'fas fa-question-circle' }
      ]
      
      const existingIds = this.bills.map(bill => bill.id)
      const availableTypes = billTypes.filter(type => !existingIds.includes(type.id))
      
      if (availableTypes.length > 0) {
        const newType = availableTypes[0]
        this.bills.push({
          id: newType.id,
          name: newType.name,
          icon: newType.icon,
          amount: 0
        })
      }
    },
    
    // 删除费用类型
    removeBillType(id) {
      if (this.bills.length > 1) {
        this.bills = this.bills.filter(bill => bill.id !== id)
      }
    },
    
    // 更新费用金额
    updateBillAmount(id, amount) {
      const bill = this.bills.find(bill => bill.id === id)
      if (bill) {
        bill.amount = amount
      }
    },
    
    // 添加租户
    addTenant() {
      const newId = this.tenants.length > 0 ? Math.max(...this.tenants.map(t => t.id)) + 1 : 1
      this.tenants.push({
        id: newId,
        name: `租户${this.tenants.length + 1}`,
        roomArea: 10,
        occupancyDays: 30,
        devices: []
      })
      
      // 扩展自定义比例数组
      this.customRatios.push(0)
    },
    
    // 删除租户
    removeTenant(id) {
      if (this.tenants.length > 1) {
        this.tenants = this.tenants.filter(tenant => tenant.id !== id)
        // 同步删除自定义比例
        this.customRatios.pop()
      }
    },
    
    // 添加设备
    addDevice(tenantId) {
      const tenant = this.tenants.find(t => t.id === tenantId)
      if (tenant) {
        tenant.devices.push({
          id: Date.now(),
          name: '电器' + (tenant.devices.length + 1),
          power: 100,
          usageHours: 5
        })
      }
    },
    
    // 删除设备
    removeDevice(tenantId, deviceId) {
      const tenant = this.tenants.find(t => t.id === tenantId)
      if (tenant) {
        tenant.devices = tenant.devices.filter(d => d.id !== deviceId)
      }
    },
    
    // 设置默认日期
    setDefaultDates() {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      this.startDate = firstDay.toISOString().split('T')[0];
      this.endDate = lastDay.toISOString().split('T')[0];
    },
    
    // 验证输入数据
    validateInput() {
      // 验证必要字段
      if (this.totalBillAmount <= 0) return false
      if (!this.startDate || !this.endDate) return false
      if (new Date(this.startDate) >= new Date(this.endDate)) return false
      
      // 验证租户数据
      if (this.tenants.length === 0) return false
      for (const tenant of this.tenants) {
        if (!tenant.name) return false
        if (!tenant.roomArea || parseFloat(tenant.roomArea) <= 0) return false
        if (!tenant.occupancyDays || parseInt(tenant.occupancyDays) <= 0) return false
      }
      
      return true
    },
    
    // 计算费用分摊
    calculateAllocation() {
      if (!this.validateInput()) {
        return { success: false, message: '请填写所有必填字段，并确保起始日期早于结束日期。' }
      }
      
      const result = {
        allocationDetails: [],
        totalBill: this.totalBillAmount,
        calculationDate: new Date().toISOString()
      }
      
      switch (this.allocationMethod) {
        case 'area':
          result.allocationDetails = this.calculateByArea()
          break
        case 'headcount':
          result.allocationDetails = this.calculateByHeadcount()
          break
        case 'time':
          result.allocationDetails = this.calculateByTime()
          break
        case 'device':
          result.allocationDetails = this.calculateByDevice()
          break
        case 'custom':
          result.allocationDetails = this.calculateByCustomRatio()
          break
        default:
          result.allocationDetails = this.calculateByArea()
      }
      
      // 保存计算结果
      this.calculationResult = result
      
      // 保存到历史记录
      this.saveToHistory(result)
      
      return { success: true }
    },
    
    // 按面积分摊
    calculateByArea() {
      return this.tenants.map(tenant => {
        const areaRatio = parseFloat(tenant.roomArea) / this.totalArea
        return {
          tenantId: tenant.id,
          tenantName: tenant.name,
          amount: this.totalBillAmount * areaRatio,
          ratio: areaRatio,
          allocationBasis: '按面积分配',
          details: `房间面积: ${tenant.roomArea}平方米 (占比${(areaRatio * 100).toFixed(1)}%)`
        }
      })
    },
    
    // 按人头分摊
    calculateByHeadcount() {
      const perPersonAmount = this.totalBillAmount / this.tenants.length
      return this.tenants.map(tenant => ({
        tenantId: tenant.id,
        tenantName: tenant.name,
        amount: perPersonAmount,
        ratio: 1 / this.tenants.length,
        allocationBasis: '按人头分配',
        details: '平均分配'
      }))
    },
    
    // 按时间分摊
    calculateByTime() {
      return this.tenants.map(tenant => {
        const timeRatio = parseInt(tenant.occupancyDays) / this.totalOccupancyDays
        return {
          tenantId: tenant.id,
          tenantName: tenant.name,
          amount: this.totalBillAmount * timeRatio,
          ratio: timeRatio,
          allocationBasis: '按时长分配',
          details: `居住天数: ${tenant.occupancyDays}天 (占比${(timeRatio * 100).toFixed(1)}%)`
        }
      })
    },
    
    // 按设备使用分摊
    calculateByDevice() {
      // 计算每个租户的设备总功耗
      const tenantDeviceConsumptions = this.tenants.map(tenant => {
        const totalDevicePower = tenant.devices.reduce((sum, device) => 
          sum + (parseFloat(device.power) * parseFloat(device.usageHours)), 0)
        return {
          tenantId: tenant.id,
          totalDevicePower: totalDevicePower
        }
      })
      
      // 计算总功耗
      const totalDevicePower = tenantDeviceConsumptions.reduce((sum, item) => 
        sum + item.totalDevicePower, 0)
      
      if (totalDevicePower === 0) {
        // 如果没有设备数据，回退到面积分配
        return this.calculateByArea()
      }
      
      return this.tenants.map(tenant => {
        const deviceData = tenantDeviceConsumptions.find(d => d.tenantId === tenant.id)
        const ratio = deviceData.totalDevicePower / totalDevicePower
        return {
          tenantId: tenant.id,
          tenantName: tenant.name,
          amount: this.totalBillAmount * ratio,
          ratio: ratio,
          allocationBasis: '按设备使用分配',
          details: `设备总功耗: ${deviceData.totalDevicePower.toFixed(2)}瓦时 (占比${(ratio * 100).toFixed(1)}%)`
        }
      })
    },
    
    // 自定义比例分摊
    calculateByCustomRatio() {
      // 确保自定义比例数组长度与租户数量匹配
      while (this.customRatios.length < this.tenants.length) {
        this.customRatios.push(0)
      }
      
      while (this.customRatios.length > this.tenants.length) {
        this.customRatios.pop()
      }
      
      // 标准化比例，确保总和为1
      const ratioSum = this.customRatios.reduce((sum, ratio) => sum + parseFloat(ratio || 0), 0)
      
      // 如果总和为0，则平均分配
      if (ratioSum === 0) {
        return this.calculateByHeadcount()
      }
      
      const normalizedRatios = this.customRatios.map(ratio => parseFloat(ratio || 0) / ratioSum)
      
      return this.tenants.map((tenant, index) => {
        const ratio = normalizedRatios[index] || 0
        return {
          tenantId: tenant.id,
          tenantName: tenant.name,
          amount: this.totalBillAmount * ratio,
          ratio: ratio,
          allocationBasis: '自定义比例分配',
          details: `自定义比例: ${(ratio * 100).toFixed(1)}%`
        }
      })
    },
    
    // 保存到历史记录
    saveToHistory(result) {
      const historyEntry = {
        id: Date.now(),
        dateRange: `${this.startDate} 至 ${this.endDate}`,
        totalBill: this.totalBillAmount,
        bills: [...this.bills],
        allocationMethod: this.allocationMethod,
        details: result.allocationDetails,
        calculationDate: new Date().toLocaleString()
      }
      
      this.calculationHistory.unshift(historyEntry)
      // 限制历史记录数量
      if (this.calculationHistory.length > 10) {
        this.calculationHistory.pop()
      }
      
      // 保存到 localStorage
      localStorage.setItem('electricityCalculationHistory', JSON.stringify(this.calculationHistory))
    },
    
    // 清除结果
    clearResults() {
      this.calculationResult = null
    }
  }
})