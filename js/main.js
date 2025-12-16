const { createApp, ref, onMounted, nextTick, watch } = Vue;

createApp({
  setup() {
    // 响应式数据
    const startDate = ref('');
    const endDate = ref('');
    const totalFee = ref(100);
    const meterReading = ref(0);
    const billNote = ref('');
    const result = ref(null);
    const error = ref('');
    const chart = ref(null);
    const chartCanvas = ref(null);
    const activeTab = ref('detail');
    const allocationMode = ref('days');
    const isDarkMode = ref(false);
    const shareLink = ref('');
    
    // 住户列表
    const occupants = ref([
      { id: 1, name: '室友A', days: 30, ratio: 33.33, area: 15.0, adjustment: 0 },
      { id: 2, name: '室友B', days: 30, ratio: 33.33, area: 15.0, adjustment: 0 },
      { id: 3, name: '室友C', days: 30, ratio: 33.34, area: 15.0, adjustment: 0 }
    ]);
    
    // 历史记录
    const history = ref([]);
    
    // Toast 通知
    const toast = ref({
      visible: false,
      message: '',
      type: 'success'
    });
    
    // 拖拽相关
    let dragStartIndex = null;
    
    // 设置分配模式
    const setAllocationMode = (mode) => {
      allocationMode.value = mode;
      calculate();
    };
    
    // 获取分配模式文本
    const getAllocationModeText = () => {
      const modes = {
        days: '按居住天数分摊',
        fixed: '按固定比例分摊',
        area: '按房间面积分摊'
      };
      return modes[allocationMode.value] || '未知模式';
    };
    
    // 添加新住户
    const addOccupant = () => {
      const newId = Math.max(...occupants.value.map(o => o.id), 0) + 1;
      const newName = `室友${occupants.value.length + 1}`;
      
      occupants.value.push({ 
        id: newId, 
        name: newName, 
        days: 30, 
        ratio: 0, 
        area: 15.0, 
        adjustment: 0 
      });
      
      // 在固定比例模式下，需要重新计算比例
      if (allocationMode.value === 'fixed') {
        adjustRatiosAfterAdd();
      }
      
      calculate();
      showToast('已添加新住户', 'success');
    };
    
    // 调整固定比例，确保总和为100%
    const adjustRatios = (changedIndex) => {
      if (allocationMode.value !== 'fixed') return;
      
      let totalRatio = occupants.value.reduce((sum, occupant) => sum + (occupant.ratio || 0), 0);
      
      // 如果总和超过100%，调整当前住户的值
      if (totalRatio > 100) {
        const excess = totalRatio - 100;
        occupants.value[changedIndex].ratio -= excess;
        totalRatio = 100;
      }
      
      // 如果总和不足100%，按比例分配差额
      if (totalRatio < 100 && changedIndex >= 0) {
        const remainingRatio = 100 - totalRatio;
        const otherOccupants = occupants.value.filter((_, i) => i !== changedIndex);
        
        if (otherOccupants.length > 0) {
          const ratioPerPerson = remainingRatio / otherOccupants.length;
          
          otherOccupants.forEach(occupant => {
            const index = occupants.value.indexOf(occupant);
            occupants.value[index].ratio += ratioPerPerson;
          });
        }
      }
      
      // 确保总和精确为100
      totalRatio = occupants.value.reduce((sum, occupant) => sum + (occupant.ratio || 0), 0);
      if (Math.abs(totalRatio - 100) > 0.001) {
        // 调整最后一个人的比例，确保总和为100
        if (occupants.value.length > 0) {
          occupants.value[occupants.value.length - 1].ratio += (100 - totalRatio);
        }
      }
      
      // 保留两位小数
      occupants.value.forEach(occupant => {
        occupant.ratio = Number(occupant.ratio.toFixed(2));
      });
      
      calculate();
    };
    
    // 添加新住户后调整比例
    const adjustRatiosAfterAdd = () => {
      const count = occupants.value.length;
      occupants.value.forEach((occupant, index) => {
        occupant.ratio = index === count - 1 
          ? Number((100 - (Math.floor(100 / count) * (count - 1))).toFixed(2))
          : Math.floor(100 / count);
      });
    };
    
    // 移除住户
    const removeOccupant = (index) => {
      if (occupants.value.length <= 1) {
        showToast('至少需要保留一位住户', 'warning');
        return;
      }
      
      const name = occupants.value[index].name;
      occupants.value.splice(index, 1);
      
      // 在固定比例模式下，需要重新调整比例
      if (allocationMode.value === 'fixed') {
        const totalRatio = occupants.value.reduce((sum, occupant) => sum + occupant.ratio, 0);
        if (totalRatio > 0) {
          const scale = 100 / totalRatio;
          occupants.value.forEach(occupant => {
            occupant.ratio = Number((occupant.ratio * scale).toFixed(2));
          });
        } else {
          // 如果没有比例，平均分配
          const ratioPerPerson = 100 / occupants.value.length;
          occupants.value.forEach((occupant, i) => {
            occupant.ratio = i === occupants.value.length - 1
              ? Number((100 - (ratioPerPerson * (occupants.value.length - 1))).toFixed(2))
              : ratioPerPerson;
          });
        }
      }
      
      calculate();
      showToast(`已移除住户: ${name}`, 'success');
    };
    
    // 格式化日期
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    // 保存到历史记录
    const saveToHistory = (calculationResult) => {
      const historyItem = {
        date: new Date().toISOString(),
        startDate: startDate.value,
        endDate: endDate.value,
        totalFee: totalFee.value,
        meterReading: meterReading.value,
        billNote: billNote.value,
        allocationMode: allocationMode.value,
        occupants: JSON.parse(JSON.stringify(occupants.value)),
        items: JSON.parse(JSON.stringify(calculationResult.items)),
        totalDays: calculationResult.totalDays,
        totalArea: calculationResult.totalArea,
        totalCalculated: calculationResult.totalCalculated
      };
      
      history.value.unshift(historyItem);
      
      // 限制历史记录数量
      if (history.value.length > 10) {
        history.value.pop();
      }
      
      // 保存到localStorage
      localStorage.setItem('feeCalculatorHistory', JSON.stringify(history.value));
    };
    
    // 从历史加载
    const loadHistory = (item) => {
      startDate.value = item.startDate;
      endDate.value = item.endDate;
      totalFee.value = item.totalFee;
      meterReading.value = item.meterReading || 0;
      billNote.value = item.billNote || '';
      allocationMode.value = item.allocationMode || 'days';
      
      // 深拷贝避免引用问题
      occupants.value = JSON.parse(JSON.stringify(item.occupants));
      
      calculate();
      activeTab.value = 'detail';
      showToast('已加载历史记录', 'success');
    };
    
    // 删除历史记录
    const deleteHistory = (index) => {
      history.value.splice(index, 1);
      localStorage.setItem('feeCalculatorHistory', JSON.stringify(history.value));
      showToast('已删除历史记录', 'success');
    };
    
    // 计算电费分摊
    const calculate = () => {
      error.value = '';
      
      // 验证日期
      const start = new Date(startDate.value);
      const end = new Date(endDate.value);

      if (!startDate.value || !endDate.value) {
        error.value = '请填写完整的日期';
        return;
      }

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        error.value = '日期格式错误';
        return;
      }

      if (start > end) {
        error.value = '开始日期不能晚于结束日期';
        return;
      }

      // 验证住户
      if (occupants.value.length === 0) {
        error.value = '至少需要一位住户';
        return;
      }
      
      // 验证住户姓名和天数
      for (const occupant of occupants.value) {
        if (!occupant.name.trim()) {
          error.value = '所有住户必须填写姓名';
          return;
        }
        
        if (allocationMode.value === 'days' && (occupant.days < 0 || isNaN(occupant.days))) {
          error.value = `住户 "${occupant.name}" 的居住天数无效`;
          return;
        }
        
        if (allocationMode.value === 'fixed' && (occupant.ratio < 0 || isNaN(occupant.ratio))) {
          error.value = `住户 "${occupant.name}" 的比例无效`;
          return;
        }
        
        if (allocationMode.value === 'area' && (occupant.area <= 0 || isNaN(occupant.area))) {
          error.value = `住户 "${occupant.name}" 的房间面积无效`;
          return;
        }
      }

      // 获取总电费
      const fee = parseFloat(totalFee.value) || 0;
      if (fee < 0) {
        error.value = '电费不能为负数';
        return;
      }
      
      // 计算
      let totalBase = 0;
      const items = [];
      
      if (allocationMode.value === 'days') {
        // 计算总天数
        for (const occupant of occupants.value) {
          totalBase += occupant.days;
        }
        
        if (totalBase === 0) {
          error.value = '总居住天数不能为零';
          return;
        }
      } 
      else if (allocationMode.value === 'fixed') {
        // 确保比例总和为100%
        totalBase = 100;
      } 
      else if (allocationMode.value === 'area') {
        // 计算总面积
        for (const occupant of occupants.value) {
          totalBase += occupant.area;
        }
        
        if (totalBase === 0) {
          error.value = '总面积不能为零';
          return;
        }
      }
      
      // 计算每个人的电费
      let totalCalculated = 0;
      
      for (const occupant of occupants.value) {
        let baseValue = 0;
        let percentage = 0;
        
        if (allocationMode.value === 'days') {
          baseValue = occupant.days;
          percentage = baseValue / totalBase;
        } 
        else if (allocationMode.value === 'fixed') {
          baseValue = occupant.ratio;
          percentage = baseValue / 100;
        } 
        else if (allocationMode.value === 'area') {
          baseValue = occupant.area;
          percentage = baseValue / totalBase;
        }
        
        let baseFee = fee * percentage;
        let finalFee = baseFee + (occupant.adjustment || 0);
        totalCalculated += finalFee;
        
        items.push({
          name: occupant.name,
          days: occupant.days,
          ratio: occupant.ratio,
          area: occupant.area,
          adjustment: occupant.adjustment || 0,
          percentage: percentage,
          baseFee: baseFee,
          finalFee: finalFee,
          finalPercentage: finalFee / fee
        });
      }
      
      // 调整最后一个人的金额，确保总和等于总电费（处理浮点数精度问题）
      if (items.length > 0) {
        const diff = fee - totalCalculated;
        items[items.length - 1].finalFee += diff;
        items[items.length - 1].finalPercentage = items[items.length - 1].finalFee / fee;
      }
      
      // 重新计算总额
      totalCalculated = items.reduce((sum, item) => sum + item.finalFee, 0);
      
      result.value = {
        totalDays: allocationMode.value === 'days' ? totalBase : null,
        totalArea: allocationMode.value === 'area' ? totalBase : null,
        totalFee: fee,
        totalCalculated: totalCalculated,
        items: items,
        calculationTime: new Date().toISOString()
      };
      
      // 下一轮 DOM 更新后渲染图表
      nextTick(() => {
        renderChart();
      });
      
      // 保存到历史
      saveToHistory(result.value);
      
      // 生成分享链接
      generateShareLink();
    };
    
    // 生成分享链接
    const generateShareLink = () => {
      try {
        const data = {
          startDate: startDate.value,
          endDate: endDate.value,
          totalFee: totalFee.value,
          meterReading: meterReading.value,
          billNote: billNote.value,
          allocationMode: allocationMode.value,
          occupants: occupants.value.map(o => ({
            name: o.name,
            days: o.days,
            ratio: o.ratio,
            area: o.area,
            adjustment: o.adjustment
          }))
        };
        
        const compressed = btoa(encodeURIComponent(JSON.stringify(data)));
        shareLink.value = `${window.location.origin}${window.location.pathname}?data=${compressed}`;
      } catch (e) {
        console.error('生成分享链接失败:', e);
        shareLink.value = '';
      }
    };
    
    // 复制分享链接
    const copyShareLink = () => {
      if (!shareLink.value) {
        showToast('请先计算分摊结果', 'warning');
        return;
      }
      
      navigator.clipboard.writeText(shareLink.value).then(() => {
        showToast('分享链接已复制到剪贴板！', 'success');
      }).catch(err => {
        console.error('复制失败:', err);
        showToast('复制失败，请手动复制链接', 'error');
      });
    };
    
    // 导出为CSV
    const exportToCSV = () => {
      if (!result.value) {
        showToast('请先计算分摊结果', 'warning');
        return;
      }
      
      const items = result.value.items;
      const headers = ['姓名', '居住天数', '占比', '基础电费', '调整金额', '最终电费'];
      
      let csvContent = headers.join(',') + '\n';
      
      items.forEach(item => {
        csvContent += [
          item.name,
          allocationMode.value === 'days' ? item.days : (allocationMode.value === 'area' ? item.area + '㎡' : item.ratio + '%'),
          (item.finalPercentage * 100).toFixed(1) + '%',
          item.baseFee.toFixed(2),
          item.adjustment.toFixed(2),
          item.finalFee.toFixed(2)
        ].join(',') + '\n';
      });
      
      csvContent += ['总计', '', '100%', '', '', result.value.totalCalculated.toFixed(2)].join(',') + '\n';
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `电费分摊_${startDate.value}_至_${endDate.value}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('CSV文件已导出', 'success');
    };
    
    // 打印结果
    const printResult = () => {
      if (!result.value) {
        showToast('请先计算分摊结果', 'warning');
        return;
      }
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
        <head>
          <title>电费分摊结果 - ${startDate.value} 至 ${endDate.value}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #42b983; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total-row { font-weight: bold; background-color: #f9f9f9; }
            .summary { display: flex; justify-content: space-around; margin: 20px 0; }
            .summary-item { text-align: center; }
            .summary-value { font-size: 1.5em; color: #42b983; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>电费分摊明细</h1>
          <div class="summary">
            <div class="summary-item">
              <div>计算周期</div>
              <div class="summary-value">${startDate.value} 至 ${endDate.value}</div>
            </div>
            <div class="summary-item">
              <div>总电费</div>
              <div class="summary-value">¥${result.value.totalFee.toFixed(2)}</div>
            </div>
            <div class="summary-item">
              <div>分摊方式</div>
              <div class="summary-value">${getAllocationModeText()}</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>${allocationMode.value === 'days' ? '居住天数' : (allocationMode.value === 'area' ? '面积(㎡)' : '比例(%)')}</th>
                <th>占比</th>
                <th>基础电费(元)</th>
                <th>调整(元)</th>
                <th>应缴电费(元)</th>
              </tr>
            </thead>
            <tbody>
      `);
      
      result.value.items.forEach(item => {
        printWindow.document.write(`
          <tr>
            <td>${item.name}</td>
            <td>${allocationMode.value === 'days' ? item.days : (allocationMode.value === 'area' ? item.area.toFixed(1) : item.ratio.toFixed(1) + '%')}</td>
            <td>${(item.finalPercentage * 100).toFixed(1)}%</td>
            <td>${item.baseFee.toFixed(2)}</td>
            <td>${item.adjustment.toFixed(2)}</td>
            <td>${item.finalFee.toFixed(2)}</td>
          </tr>
        `);
      });
      
      printWindow.document.write(`
            <tr class="total-row">
              <td>总计</td>
              <td></td>
              <td>100%</td>
              <td></td>
              <td></td>
              <td>${result.value.totalCalculated.toFixed(2)}</td>
            </tr>
          </tbody>
          </table>
          
          ${billNote.value ? `<div style="margin-top: 20px; padding: 15px; border: 1px solid #eee; border-radius: 5px;">
            <strong>备注:</strong> ${billNote.value}
          </div>` : ''}
          
          <div style="margin-top: 30px; text-align: center; color: #999; font-size: 0.9em;">
            生成时间: ${new Date().toLocaleString('zh-CN')}<br>
            电费分摊计算器
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.print();
      
      showToast('打印窗口已打开', 'success');
    };
    
    // 渲染图表
    const renderChart = () => {
      if (chart.value) {
        chart.value.destroy();
      }
      
      if (!result.value || !chartCanvas.value) return;
      
      const ctx = chartCanvas.value.getContext('2d');
      const data = result.value;
      
      // 生成随机颜色
      const generateColors = (count) => {
        const colors = [];
        for (let i = 0; i < count; i++) {
          const hue = (i * 360 / count + 30) % 360;
          const saturation = 60 + Math.random() * 20;
          const lightness = 60 + Math.random() * 10;
          colors.push(`hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`);
        }
        return colors;
      };
      
      const backgroundColors = generateColors(data.items.length);
      const borderColors = backgroundColors.map(color => color.replace('0.8', '1'));
      
      chart.value = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.items.map(item => item.name),
          datasets: [{
            label: '应缴电费 (元)',
            data: data.items.map(item => item.finalFee),
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const item = data.items[context.dataIndex];
                  return [
                    `居住天数: ${item.days} 天`,
                    `基础电费: ¥${item.baseFee.toFixed(2)}`,
                    `调整金额: ¥${item.adjustment.toFixed(2)}`,
                    `最终电费: ¥${item.finalFee.toFixed(2)}`,
                    `占比: ${(item.finalPercentage * 100).toFixed(1)}%`
                  ];
                }
              }
            },
            datalabels: {
              anchor: 'end',
              align: 'top',
              formatter: (value) => `¥${value.toFixed(2)}`,
              color: '#333',
              font: {
                weight: 'bold'
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: '金额 (元)'
              }
            },
            x: {
              title: {
                display: true,
                text: '住户'
              }
            }
          },
          onClick: (e, elements) => {
            if (elements.length > 0) {
              const index = elements[0].index;
              const item = data.items[index];
              showToast(`${item.name} 应缴: ¥${item.finalFee.toFixed(2)} (${(item.finalPercentage * 100).toFixed(1)}%)`, 'success');
            }
          }
        },
        plugins: [ChartDataLabels]
      });
    };
    
    // 拖拽排序开始
    const startDrag = (e) => {
      if (e.target.classList.contains('drag-handle') || e.target.closest('.drag-handle')) {
        dragStartIndex = parseInt(e.currentTarget.dataset.index);
        e.currentTarget.classList.add('dragging');
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
      }
    };
    
    // 拖拽中
    const doDrag = (e) => {
      const draggingElement = document.querySelector('.dragging');
      if (!draggingElement) return;
      
      const elements = document.querySelectorAll('.occupant-card');
      const dragTarget = document.elementFromPoint(e.clientX, e.clientY);
      
      if (dragTarget && dragTarget.classList.contains('occupant-card')) {
        const dragTargetIndex = parseInt(dragTarget.dataset.index);
        const startIndex = dragStartIndex;
        
        if (dragTargetIndex !== startIndex) {
          // 交换位置
          const temp = occupants.value[startIndex];
          occupants.value[startIndex] = occupants.value[dragTargetIndex];
          occupants.value[dragTargetIndex] = temp;
          
          dragStartIndex = dragTargetIndex;
          
          // 更新DOM顺序
          nextTick(() => {
            elements.forEach((el, i) => {
              el.dataset.index = i;
            });
          });
        }
      }
    };
    
    // 拖拽结束
    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
      const draggingElement = document.querySelector('.dragging');
      if (draggingElement) {
        draggingElement.classList.remove('dragging');
      }
    };
    
    // 显示Toast消息
    const showToast = (message, type = 'success') => {
      toast.value.message = message;
      toast.value.type = type;
      toast.value.visible = true;
      
      setTimeout(() => {
        toast.value.visible = false;
      }, 3000);
    };
    
    // 切换暗黑模式
    const toggleDarkMode = () => {
      isDarkMode.value = !isDarkMode.value;
      document.body.classList.toggle('dark-mode', isDarkMode.value);
      
      // 保存用户偏好
      localStorage.setItem('darkModePreference', isDarkMode.value);
      
      // 重新渲染图表
      nextTick(renderChart);
    };
    
    // 从URL加载数据
    const loadDataFromUrl = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const dataParam = urlParams.get('data');
      
      if (dataParam) {
        try {
          const decoded = decodeURIComponent(atob(dataParam));
          const data = JSON.parse(decoded);
          
          startDate.value = data.startDate || startDate.value;
          endDate.value = data.endDate || endDate.value;
          totalFee.value = data.totalFee || totalFee.value;
          meterReading.value = data.meterReading || meterReading.value;
          billNote.value = data.billNote || billNote.value;
          allocationMode.value = data.allocationMode || 'days';
          
          if (data.occupants && Array.isArray(data.occupants)) {
            occupants.value = data.occupants.map((o, index) => ({
              id: index + 1,
              name: o.name || `室友${index + 1}`,
              days: o.days || 30,
              ratio: o.ratio || 33.33,
              area: o.area || 15.0,
              adjustment: o.adjustment || 0
            }));
            
            // 确保比例总和为100
            if (allocationMode.value === 'fixed') {
              let totalRatio = occupants.value.reduce((sum, o) => sum + o.ratio, 0);
              if (Math.abs(totalRatio - 100) > 0.1) {
                const scale = 100 / totalRatio;
                occupants.value.forEach(o => {
                  o.ratio = Number((o.ratio * scale).toFixed(2));
                });
              }
            }
          }
          
          nextTick(calculate);
          showToast('已从链接加载数据', 'success');
        } catch (e) {
          console.error('加载数据失败:', e);
          showToast('加载分享数据失败', 'error');
        }
      }
    };
    
    // 初始化
    onMounted(() => {
      // 加载暗黑模式偏好
      const savedDarkMode = localStorage.getItem('darkModePreference');
      if (savedDarkMode !== null) {
        isDarkMode.value = savedDarkMode === 'true';
        document.body.classList.toggle('dark-mode', isDarkMode.value);
      } else {
        // 根据系统偏好设置
        isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.classList.toggle('dark-mode', isDarkMode.value);
      }
      
      // 加载历史记录
      const savedHistory = localStorage.getItem('feeCalculatorHistory');
      if (savedHistory) {
        try {
          history.value = JSON.parse(savedHistory);
        } catch (e) {
          console.error('加载历史记录失败:', e);
        }
      }
      
      // 设置默认日期（当月1日到今天）
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      startDate.value = firstDayOfMonth.toISOString().split('T')[0];
      endDate.value = today.toISOString().split('T')[0];
      
      // 从URL加载数据
      loadDataFromUrl();
      
      // 初始计算
      nextTick(calculate);
    });
    
    // 监听主题变化
    watch(isDarkMode, (newVal) => {
      document.body.classList.toggle('dark-mode', newVal);
    });
    
    return {
      startDate,
      endDate,
      totalFee,
      meterReading,
      billNote,
      result,
      error,
      chartCanvas,
      occupants,
      history,
      activeTab,
      allocationMode,
      isDarkMode,
      toast,
      shareLink,
      dragStartIndex,
      calculate,
      addOccupant,
      removeOccupant,
      adjustRatios,
      formatDate,
      loadHistory,
      deleteHistory,
      getAllocationModeText,
      setAllocationMode,
      copyShareLink,
      exportToCSV,
      printResult,
      toggleDarkMode,
      startDrag
    };
  }
}).mount('#app');

// 注册 ChartDataLabels 插件
const ChartDataLabels = {
  id: 'datalabels',
  beforeInit: function(chart) {
    chart.height = 400;
  }
};