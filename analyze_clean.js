// 鍏ㄥ眬鍙橀噺
let bookmarks = [];
let categories = {};
let apiStatus = false;
let processingBatch = false;
let currentBatchIndex = 0;
let batchSize = 50;
let totalBookmarksCount = 0;
let logVisible = false;
const MAX_LOG_ENTRIES = 500; // 鏈€澶ф棩蹇楁潯鐩暟
let bookmarkWorker = null; // Web Worker寮曠敤

// 涔︾绠＄悊鍣ㄧ浉鍏冲彉閲?let bookmarkTreeData = [];
let selectedBookmarks = new Set();
let currentEditingItem = null;
let draggedElement = null; // 鎷栨嫿鍏冪礌
let inlineEditingElement = null; // 鍐呰仈缂栬緫鍏冪礌
let batchEditMode = false; // 鎵归噺缂栬緫妯″紡

// 鍒濆鍖栧垎鏋愰〉闈?document.addEventListener('DOMContentLoaded', () => {
  // 鍒濆鍖朩eb Worker
  initializeWorker();
  
  // 鑾峰彇API鐘舵€?  checkApiStatus();
  
  // 娣诲姞鎸夐挳浜嬩欢鐩戝惉
  document.getElementById('analyze-bookmarks').addEventListener('click', analyzeBookmarks);
  document.getElementById('cancel-analyze').addEventListener('click', cancelAnalyze);
  document.getElementById('organize-bookmarks').addEventListener('click', organizeBookmarks);
  document.getElementById('export-bookmarks').addEventListener('click', exportBookmarks);
  document.getElementById('setup-api').addEventListener('click', openOptions);
  document.getElementById('view-history').addEventListener('click', openHistoryPage);
  
  // 娣诲姞鏂板姛鑳界殑浜嬩欢鐩戝惉鍣?  document.getElementById('detect-duplicates').addEventListener('click', detectDuplicateBookmarks);
  document.getElementById('detect-invalid').addEventListener('click', detectInvalidBookmarks);
  document.getElementById('cleanup-bookmarks').addEventListener('click', cleanupBookmarks);
  document.getElementById('manage-bookmarks').addEventListener('click', openBookmarkManager);
  document.getElementById('import-bookmarks').addEventListener('click', importBookmarks);
  document.getElementById('backup-bookmarks').addEventListener('click', backupBookmarks);
  
  // 涔︾绠＄悊鍣ㄧ浉鍏充簨浠剁洃鍚櫒
  document.getElementById('expand-all-folders').addEventListener('click', () => expandAllFolders(true));
  document.getElementById('collapse-all-folders').addEventListener('click', () => expandAllFolders(false));
  document.getElementById('create-folder').addEventListener('click', createNewFolder);
  document.getElementById('refresh-manager').addEventListener('click', refreshBookmarkManager);
  
  // 鎵归噺鎿嶄綔浜嬩欢鐩戝惉鍣?  document.getElementById('batch-delete').addEventListener('click', batchDeleteItems);
  document.getElementById('batch-move').addEventListener('click', batchMoveItems);
  document.getElementById('batch-export').addEventListener('click', batchExportItems);
  document.getElementById('select-all-bookmarks').addEventListener('click', () => selectAllBookmarks(true));
  document.getElementById('deselect-all-bookmarks').addEventListener('click', () => selectAllBookmarks(false));
  
  // 娣诲姞鏂扮殑鎵归噺鎿嶄綔浜嬩欢鐩戝惉鍣?  document.getElementById('batch-rename').addEventListener('click', toggleBatchRenameMode);
  document.getElementById('save-batch-rename').addEventListener('click', saveBatchRenames);
  document.getElementById('cancel-batch-rename').addEventListener('click', cancelBatchRename);
  
  // 妯℃€佹浜嬩欢鐩戝惉鍣?  document.getElementById('modal-close').addEventListener('click', closeEditModal);
  document.getElementById('cancel-edit').addEventListener('click', closeEditModal);
  document.getElementById('save-edit').addEventListener('click', saveBookmarkEdit);
  document.getElementById('move-modal-close').addEventListener('click', closeMoveModal);
  document.getElementById('cancel-move').addEventListener('click', closeMoveModal);
  document.getElementById('confirm-move').addEventListener('click', confirmMoveItems);
  
  // 妫€娴嬬粨鏋滄搷浣滀簨浠剁洃鍚櫒
  document.getElementById('remove-duplicates').addEventListener('click', removeDuplicateBookmarks);
  document.getElementById('remove-invalid').addEventListener('click', removeInvalidBookmarks);
  document.getElementById('remove-empty-folders').addEventListener('click', removeEmptyFolders);
  document.getElementById('select-all-duplicates').addEventListener('click', () => selectAllDetectionItems('duplicates', true));
  document.getElementById('deselect-all-duplicates').addEventListener('click', () => selectAllDetectionItems('duplicates', false));
  document.getElementById('select-all-invalid').addEventListener('click', () => selectAllDetectionItems('invalid', true));
  document.getElementById('deselect-all-invalid').addEventListener('click', () => selectAllDetectionItems('invalid', false));
  document.getElementById('select-all-empty-folders').addEventListener('click', () => selectAllDetectionItems('empty-folders', true));
  document.getElementById('deselect-all-empty-folders').addEventListener('click', () => selectAllDetectionItems('empty-folders', false));
  
  // 鏂囦欢瀵煎叆浜嬩欢鐩戝惉鍣?  document.getElementById('bookmark-file-input').addEventListener('change', handleFileImport);
  
  // 娣诲姞鏃ュ織鎺у埗鎸夐挳浜嬩欢鐩戝惉
  document.getElementById('toggle-log').addEventListener('click', toggleLogVisibility);
  document.getElementById('clear-log').addEventListener('click', clearLog);
  
  // 娣诲姞鍙鍖栧垏鎹簨浠?  document.querySelectorAll('.viz-tab').forEach(tab => {
    tab.addEventListener('click', switchVisualizationTab);
  });
  
  // 娣诲姞绐楀彛鍏抽棴浜嬩欢锛岀粓姝orker
  window.addEventListener('beforeunload', terminateWorker);
});

// 鍒濆鍖朩eb Worker
function initializeWorker() {
  try {
    // 纭繚涔嬪墠鐨剋orker宸茬粓姝?    if (bookmarkWorker) {
      bookmarkWorker.terminate();
    }
    
    // 鍒涘缓鏂癢orker
    bookmarkWorker = new Worker('bookmarkProcessor.js');
    
    // 璁剧疆娑堟伅澶勭悊
    bookmarkWorker.onmessage = handleWorkerMessage;
    bookmarkWorker.onerror = handleWorkerError;
    
    addLogEntry('Web Worker鍒濆鍖栨垚鍔?- 鍚敤鍚庡彴澶勭悊浠ユ彁楂樻€ц兘', 'success');
  } catch (error) {
    console.error('鏃犳硶鍒濆鍖朩eb Worker:', error);
    addLogEntry('鏃犳硶鍒濆鍖朩eb Worker, 灏嗕娇鐢ㄤ富绾跨▼澶勭悊 - ' + error.message, 'warning');
  }
}

// 澶勭悊Worker娑堟伅
function handleWorkerMessage(e) {
  const { action, ...data } = e.data;
  
  switch (action) {
    case 'process-bookmarks-result':
      console.log('鏀跺埌Worker澶勭悊鐨勪功绛炬暟鎹?, data.processedBookmarks.length);
      // 澶勭悊Worker杩斿洖鐨勯澶勭悊涔︾鏁版嵁
      break;
      
    case 'merge-categories-result':
      categories = data.mergedCategories;
      console.log('鍒嗙被宸插湪Worker涓悎骞?, Object.keys(categories).length);
      displayCategories(categories, 20);
      break;
      
    case 'error':
      console.error('Worker閿欒:', data.error);
      addLogEntry(`Worker澶勭悊鍑洪敊: ${data.error}`, 'error');
      break;
      
    default:
      console.log('鏈鐞嗙殑Worker娑堟伅:', action, data);
  }
}

// 澶勭悊Worker閿欒
function handleWorkerError(error) {
  console.error('Worker杩愯閿欒:', error);
  addLogEntry(`Worker杩愯閿欒: ${error.message}`, 'error');
}

// 缁堟Worker
function terminateWorker() {
  if (bookmarkWorker) {
    bookmarkWorker.terminate();
    bookmarkWorker = null;
  }
}

// 鍒囨崲鏃ュ織鍙鎬?function toggleLogVisibility() {
  const logContainer = document.getElementById('log-container');
  logVisible = !logVisible;
  
  if (logVisible) {
    logContainer.classList.remove('hidden');
  } else {
    logContainer.classList.add('hidden');
  }
}

// 娓呯┖鏃ュ織
function clearLog() {
  document.getElementById('log-entries').innerHTML = '';
}

// 娣诲姞鏃ュ織鏉＄洰
function addLogEntry(message, type = 'info') {
  const logContainer = document.getElementById('log-entries');
  
  // 闄愬埗鏃ュ織鏉＄洰鏁伴噺锛岄伩鍏嶅唴瀛樺崰鐢ㄨ繃澶?  const entries = logContainer.querySelectorAll('.log-entry');
  if (entries.length >= MAX_LOG_ENTRIES) {
    // 绉婚櫎鏈€鏃╃殑20%鏃ュ織鏉＄洰
    const removeCount = Math.ceil(MAX_LOG_ENTRIES * 0.2);
    for (let i = 0; i < removeCount; i++) {
      if (logContainer.firstChild) {
        logContainer.removeChild(logContainer.firstChild);
      }
    }
    // 娣诲姞涓€鏉℃彁绀轰俊鎭?    if (logContainer.firstChild === logContainer.querySelector('.log-entry-trimmed')) {
      // 宸茬粡鏈夋彁绀猴紝涓嶉噸澶嶆坊鍔?    } else {
      const trimNotice = document.createElement('div');
      trimNotice.className = 'log-entry log-entry-trimmed warning';
      trimNotice.textContent = `涓烘彁楂樻€ц兘锛屽凡绉婚櫎 ${removeCount} 鏉¤緝鏃╃殑鏃ュ織...`;
      logContainer.insertBefore(trimNotice, logContainer.firstChild);
    }
  }
  
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  
  // 娣诲姞鏃堕棿鎴?  const timeStamp = new Date().toLocaleTimeString();
  const timeSpan = document.createElement('span');
  timeSpan.className = 'log-entry-time';
  timeSpan.textContent = `[${timeStamp}]`;
  
  entry.appendChild(timeSpan);
  entry.appendChild(document.createTextNode(` ${message}`));
  
  // 娣诲姞鍒版棩蹇楀鍣?  logContainer.appendChild(entry);
  
  // 鑷姩婊氬姩鍒板簳閮?  logContainer.scrollTop = logContainer.scrollHeight;
  
  // 濡傛灉鏃ュ織涓嶅彲瑙佷笖鏄噸瑕佷俊鎭紝鑷姩鏄剧ず
  if (!logVisible && (type === 'error' || type === 'warning')) {
    toggleLogVisibility();
  }
  
  // 鍚屾椂鍦ㄦ帶鍒跺彴璁板綍
  console.log(`[${type}] ${message}`);
}

// 妫€鏌PI杩炴帴鐘舵€?function checkApiStatus() {
  chrome.storage.sync.get(['apiProvider', 'apiKey'], (result) => {
    const apiStatusElement = document.getElementById('api-status');
    
    if (result.apiProvider && result.apiKey) {
      apiStatus = true;
      apiStatusElement.textContent = '宸茶繛鎺?;
      apiStatusElement.className = 'api-connected';
      addLogEntry(`API鐘舵€侊細宸茶繛鎺?(鎻愪緵鍟? ${result.apiProvider})`, 'success');
    } else {
      apiStatus = false;
      apiStatusElement.textContent = '鏈繛鎺?;
      apiStatusElement.className = 'api-not-connected';
      addLogEntry('API鐘舵€侊細鏈繛鎺ワ紝璇峰厛鍦ㄨ缃腑閰嶇疆API', 'warning');
    }
  });
}

// 鎵撳紑閫夐」椤甸潰
function openOptions() {
  chrome.runtime.openOptionsPage();
}

// 鍒嗘瀽涔︾
async function analyzeBookmarks() {
  if (!apiStatus) {
    showStatus('璇峰厛鍦ㄨ缃腑閰嶇疆API杩炴帴', 'error');
    addLogEntry('API鏈繛鎺ワ紝璇峰厛鍦ㄨ缃腑閰嶇疆API杩炴帴', 'error');
    return;
  }
  
  // 娓呯┖涔嬪墠鐨勬棩蹇?  clearLog();
  
  // 鏄剧ず鍔犺浇鍔ㄧ敾鍜岃繘搴︽潯
  showLoading(true);
  showProgress(true);
  showStatus('姝ｅ湪鑾峰彇涔︾...');
  addLogEntry('寮€濮嬩功绛惧垎鏋愯繃绋?..', 'info');
  
  // 鏄剧ず鍙栨秷鎸夐挳锛岄殣钘忓垎鏋愭寜閽?  toggleAnalyzeButtons(true);
  
  try {
    // 閲嶇疆鐘舵€?    categories = {};
    currentBatchIndex = 0;
    processingBatch = false;
    
    // 鑾峰彇鎵€鏈変功绛?    addLogEntry('姝ｅ湪鑾峰彇鎵€鏈変功绛?..', 'info');
    bookmarks = await getAllBookmarks();
    totalBookmarksCount = bookmarks.length;
    
    // 娣诲姞鏍囩灞傜骇缁熻
    addLogEntry('寮€濮嬪垎鏋愪功绛剧粨鏋?..', 'info');
    const folderStructure = {};
    
    bookmarks.forEach(bookmark => {
      if (bookmark.parentId) {
        folderStructure[bookmark.parentId] = folderStructure[bookmark.parentId] || [];
        folderStructure[bookmark.parentId].push(bookmark.id);
      }
    });
    
    // 缁熻涔︾鎵€鍦ㄧ殑鏂囦欢澶瑰垎甯?    const folderDistribution = Object.entries(folderStructure)
      .map(([folderId, bookmarkIds]) => ({
        folderId,
        count: bookmarkIds.length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    addLogEntry('涔︾鏂囦欢澶瑰垎甯?TOP5):', 'info');
    folderDistribution.forEach(folder => {
      addLogEntry(`  - 鏂囦欢澶笽D ${folder.folderId}: 鍖呭惈${folder.count}涓功绛綻, 'info');
    });
    
    addLogEntry(`鎴愬姛鑾峰彇 ${totalBookmarksCount} 涓功绛綻, 'success');
    showStatus(`宸茶幏鍙?${totalBookmarksCount} 涓功绛撅紝姝ｅ湪鍒嗘壒鍒嗘瀽...`);
    
    // 鑾峰彇API璁剧疆鍜屾壒澶勭悊澶у皬
    addLogEntry('姝ｅ湪鑾峰彇API璁剧疆...', 'info');
    const settings = await getApiSettings();
    batchSize = settings.batchSize;
    
    addLogEntry(`API鎻愪緵鍟? ${settings.provider}, 妯″瀷: ${settings.model}`, 'info');
    addLogEntry(`鎵瑰鐞嗗ぇ灏? ${batchSize}`, 'info');
    
    // 寮€濮嬫壒澶勭悊
    processingBatch = true;
    addLogEntry('寮€濮嬫壒閲忓鐞嗕功绛?..', 'info');
    await processBatches(settings);
    
  } catch (error) {
    console.error('鍒嗘瀽涔︾鏃跺嚭閿?', error);
    addLogEntry(`鍒嗘瀽鍑洪敊: ${error.message}`, 'error');
    showStatus(`鍒嗘瀽鍑洪敊: ${error.message}`, 'error');
    showLoading(false);
    showProgress(false);
    toggleAnalyzeButtons(false);
  }
}

// 鍙栨秷鍒嗘瀽
function cancelAnalyze() {
  processingBatch = false;
  addLogEntry('鐢ㄦ埛璇锋眰鍙栨秷鍒嗘瀽锛屾鍦ㄤ腑鏂鐞?..', 'warning');
  showStatus('姝ｅ湪鍙栨秷鍒嗘瀽...');
}

// 鍒囨崲鍒嗘瀽/鍙栨秷鎸夐挳
function toggleAnalyzeButtons(isProcessing) {
  const analyzeButton = document.getElementById('analyze-bookmarks');
  const cancelButton = document.getElementById('cancel-analyze');
  
  if (isProcessing) {
    analyzeButton.classList.add('hidden');
    cancelButton.classList.remove('hidden');
  } else {
    analyzeButton.classList.remove('hidden');
    cancelButton.classList.add('hidden');
  }
}

// 鏇存柊杩涘害鏉?function updateProgress(current, total) {
  const progressBar = document.getElementById('progress-bar');
  const percentage = Math.min(Math.round((current / total) * 100), 100);
  progressBar.style.width = `${percentage}%`;
}

// 鎵归噺澶勭悊涔︾
async function processBatches(settings) {
  try {
    const totalBatches = Math.ceil(bookmarks.length / batchSize);
    addLogEntry(`鎬诲叡灏嗗垎鎴?${totalBatches} 涓壒娆″鐞哷, 'info');
    
    // 璁板綍鍐呭瓨浣跨敤鎯呭喌
    if (window.performance && window.performance.memory) {
      const memoryInfo = window.performance.memory;
      addLogEntry(`鍒濆鍐呭瓨浣跨敤: ${Math.round(memoryInfo.usedJSHeapSize / (1024 * 1024))}MB / ${Math.round(memoryInfo.jsHeapSizeLimit / (1024 * 1024))}MB`, 'info');
    }
    
    while (currentBatchIndex < totalBatches && processingBatch) {
      const startIdx = currentBatchIndex * batchSize;
      const endIdx = Math.min(startIdx + batchSize, bookmarks.length);
      const currentBatch = bookmarks.slice(startIdx, endIdx);
      
      // 鏇存柊杩涘害鏉?      updateProgress(startIdx, bookmarks.length);
      
      const batchInfo = `鎵规 ${currentBatchIndex + 1}/${totalBatches} (${startIdx + 1}-${endIdx}/${totalBookmarksCount})`;
      showStatus(`姝ｅ湪澶勭悊绗?${currentBatchIndex + 1}/${totalBatches} 鎵逛功绛?(${startIdx + 1}-${endIdx}/${totalBookmarksCount})...`);
      addLogEntry(`寮€濮嬪鐞?{batchInfo}`, 'info');
      
      // 绛夊緟涓€灏忔鏃堕棿璁︰I鏇存柊
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // 鍒嗙被褰撳墠鎵规鐨勪功绛?      addLogEntry(`姝ｅ湪璋冪敤API瀵?{batchInfo}杩涜鍒嗙被...`, 'info');
      const startTime = Date.now();
      
      // 浣跨敤try-catch鍗曠嫭澶勭悊姣忔壒锛岄伩鍏嶄竴鎵瑰け璐ュ奖鍝嶆暣浣?      try {
        const batchCategories = await categorizeBookmarks(currentBatch, settings);
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        
        // 璁板綍鍒嗙被缁撴灉
        const categoryCount = Object.keys(batchCategories).length;
        addLogEntry(`${batchInfo}鍒嗙被瀹屾垚锛岀敤鏃?{elapsedTime}绉掞紝鍒嗕负${categoryCount}涓被鍒玚, 'success');
        
        // 鎵撳嵃姣忎釜绫诲埆鐨勪功绛炬暟閲忥紙浠呮墦鍗板墠10涓被鍒紝閬垮厤鏃ュ織杩囧锛?        const categoriesToLog = Object.entries(batchCategories).slice(0, 10);
        categoriesToLog.forEach(([category, items]) => {
          addLogEntry(`  - ${category}: ${items.length}涓功绛綻, 'info');
        });
        
        if (Object.keys(batchCategories).length > 10) {
          addLogEntry(`  - ... 浠ュ強 ${Object.keys(batchCategories).length - 10} 涓叾浠栫被鍒玚, 'info');
        }
        
        // 鍚堝苟鍒嗙被缁撴灉
        addLogEntry(`姝ｅ湪鍚堝苟${batchInfo}鍒嗙被缁撴灉...`, 'info');
        mergeCategoryResults(batchCategories);
        
      } catch (batchError) {
        addLogEntry(`澶勭悊${batchInfo}鏃跺嚭閿? ${batchError.message}锛岃烦杩囨鎵规`, 'error');
        console.error(`鎵规澶勭悊閿欒:`, batchError);
      }
      
      // 鎵规澶勭悊瀹屾垚鍚庯紝绛夊緟涓€娈垫椂闂磋UI鍒锋柊锛岄槻姝㈡祻瑙堝櫒鍗℃
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 闄愬埗鏄剧ず绫诲埆鏁伴噺锛岄伩鍏岲OM杩囧害鑶ㄨ儉
      displayCategories(categories, 20);
      
      // 姣忓鐞?鎵癸紝鎵嬪姩瑙﹀彂鍨冨溇鍥炴敹骞舵竻鐞嗕笉鍐嶉渶瑕佺殑鏁版嵁
      if (currentBatchIndex % 3 === 0) {
        addLogEntry('鎵ц鍐呭瓨浼樺寲...', 'info');
        
        // 娓呴櫎褰撳墠鎵规鐨勪复鏃跺彉閲?        const currentBatch = null;
        
        // 鍦ㄥ悗鍙颁换鍔′腑鎵ц鏄傝吹鐨勬竻鐞嗘搷浣?        setTimeout(() => {
          // 鎻愮ず娴忚鍣ㄨ繘琛屽瀮鍦惧洖鏀?          if (window.gc) {
            try {
              window.gc();
            } catch (e) {
              // 蹇界暐锛屾煇浜涙祻瑙堝櫒涓嶆敮鎸佹墜鍔ㄥ瀮鍦惧洖鏀?            }
          }
          
          // 璁板綍鍐呭瓨浣跨敤鎯呭喌
          if (window.performance && window.performance.memory) {
            const memoryInfo = window.performance.memory;
            console.log(`褰撳墠鍐呭瓨浣跨敤: ${Math.round(memoryInfo.usedJSHeapSize / (1024 * 1024))}MB / ${Math.round(memoryInfo.jsHeapSizeLimit / (1024 * 1024))}MB`);
          }
        }, 0);
      }
      
      // 鏇存柊杩涘害
      currentBatchIndex++;
    }
    
    // 鏇存柊鍒?00%
    updateProgress(bookmarks.length, bookmarks.length);
    
    if (processingBatch) {
      // 鍏ㄩ儴澶勭悊瀹屾垚
      const finalCategories = Object.keys(categories).length;
      showStatus(`鍒嗘瀽瀹屾垚锛佸叡 ${totalBookmarksCount} 涓功绛捐鍒嗕负 ${finalCategories} 绫籤, 'success');
      addLogEntry(`===============================`, 'success');
      addLogEntry(`鍒嗘瀽鍏ㄩ儴瀹屾垚锛佸叡 ${totalBookmarksCount} 涓功绛捐鍒嗕负 ${finalCategories} 绫籤, 'success');
      addLogEntry(`===============================`, 'success');
      
      // 淇濆瓨鍒嗘瀽鍘嗗彶鐗堟湰
      await saveBookmarkHistory();
      
      // 鐢熸垚鍙鍖栧浘琛?      generateVisualizations();
      
      // 閲婃斁鍐呭瓨
      setTimeout(() => {
        addLogEntry('姝ｅ湪浼樺寲鍐呭瓨浣跨敤...', 'info');
        // 浠呬繚鐣欏繀瑕佹暟鎹?        bookmarks = bookmarks.map(bookmark => ({
          id: bookmark.id,
          title: bookmark.title,
          url: bookmark.url,
          parentId: bookmark.parentId
        }));
        
        // 鎻愮ず娴忚鍣ㄨ繘琛屽瀮鍦惧洖鏀?        if (window.gc) {
          try {
            window.gc();
          } catch (e) {
            // 蹇界暐
          }
        }
      }, 1000);
      
      // 鏄剧ず鏈€缁堝垎绫荤粺璁★紙闄愬埗鏁伴噺锛?      const topCategories = Object.entries(categories)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 20);
      
      topCategories.forEach(([category, items]) => {
        addLogEntry(`${category}: ${items.length}涓功绛綻, 'success');
      });
      
      if (Object.keys(categories).length > 20) {
        addLogEntry(`... 浠ュ強 ${Object.keys(categories).length - 20} 涓叾浠栫被鍒玚, 'success');
      }
      
      // 瀹屾垚鍚庢樉绀哄叏閮ㄥ垎绫?      displayCategories(categories);
    } else {
      // 鐢ㄦ埛鍙栨秷浜嗗鐞?      showStatus('涔︾鍒嗘瀽宸蹭腑鏂?, 'error');
      addLogEntry('涔︾鍒嗘瀽琚敤鎴蜂腑鏂?, 'warning');
    }
  } catch (error) {
    console.error('鎵瑰鐞嗕功绛炬椂鍑洪敊:', error);
    showStatus(`鎵瑰鐞嗗嚭閿? ${error.message}`, 'error');
    addLogEntry(`鎵瑰鐞嗗嚭閿? ${error.message}`, 'error');
  } finally {
    processingBatch = false;
    showLoading(false);
    showProgress(false);
    toggleAnalyzeButtons(false);
  }
}

// 浣跨敤Worker鍚堝苟鍒嗙被缁撴灉
function mergeCategoryResults(batchCategories) {
  // 妫€鏌orker鏄惁鍙敤
  if (bookmarkWorker) {
    try {
      // 閫氳繃Worker鍚堝苟鍒嗙被
      bookmarkWorker.postMessage({
        action: 'merge-categories',
        data: {
          existingCategories: categories,
          newCategories: batchCategories
        }
      });
      return; // Worker浼氬紓姝ユ洿鏂癱ategories
    } catch (error) {
      console.error('Worker鍚堝苟鍒嗙被澶辫触锛屽洖閫€鍒颁富绾跨▼:', error);
      addLogEntry('Worker澶勭悊澶辫触锛屽垏鎹㈣嚦涓荤嚎绋?, 'warning');
    }
  }
  
  // 鍥為€€鍒颁富绾跨▼澶勭悊
  for (const [category, items] of Object.entries(batchCategories)) {
    if (!categories[category]) {
      categories[category] = [];
    }
    
    categories[category] = categories[category].concat(items);
  }
}

// 鑾峰彇鎵€鏈変功绛?function getAllBookmarks() {
  return new Promise((resolve) => {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      const bookmarks = [];
      
      // 娣诲姞璋冭瘯淇℃伅
      addLogEntry(`寮€濮嬭幏鍙栦功绛炬爲...`, 'info');
      console.log('涔︾鏍戞牴鑺傜偣:', bookmarkTreeNodes);
      
      // 閫掑綊鍑芥暟锛岄亶鍘嗕功绛炬爲
      function processNode(node) {
        // 濡傛灉鏄功绛撅紙鏈塽rl灞炴€э級
        if (node.url) {
          // 璁板綍鍘熷涔︾鏁版嵁锛岀敤浜庤皟璇?          console.log('澶勭悊涔︾:', { id: node.id, title: node.title, url: node.url });
          
          // 娣诲姞鏍囩淇℃伅鍒版棩蹇?          addLogEntry(`鑾峰彇涔︾: ID=${node.id}, 鏍囬="${node.title}", URL=${node.url.substring(0, 30)}...`, 'info');
          
          // 楠岃瘉骞跺鐞嗘爣棰?          let processedTitle = node.title || '';
          // 濡傛灉鏍囬涓虹┖鎴栧彧鍖呭惈鏁板瓧锛屽皾璇曚粠URL鐢熸垚鏇存湁鎰忎箟鐨勬爣棰?          if (!processedTitle || /^\d+$/.test(processedTitle)) {
            try {
              const url = new URL(node.url);
              // 浣跨敤涓绘満鍚嶄綔涓烘爣棰樼殑涓€閮ㄥ垎
              processedTitle = url.hostname.replace(/^www\./, '');
              addLogEntry(`鍙戠幇鏃犳晥涔︾鏍囬(${node.title})锛屽凡鑷姩鏇挎崲涓? ${processedTitle}`, 'warning');
            } catch (e) {
              // URL瑙ｆ瀽澶辫触锛屼繚鐣欏師鏍囬
              processedTitle = node.title || '鏈懡鍚嶄功绛?;
            }
          }
          
          bookmarks.push({
            id: node.id,
            title: processedTitle,
            url: node.url,
            parentId: node.parentId,
            originalTitle: node.title // 淇濆瓨鍘熷鏍囬浠ヤ究姣旇緝
          });
        }
        
        // 濡傛灉鏄枃浠跺す锛岃褰曟枃浠跺す淇℃伅
        if (!node.url && node.title) {
          addLogEntry(`鍙戠幇涔︾鏂囦欢澶? ID=${node.id}, 鏍囬="${node.title}"`, 'info');
        }
        
        // 濡傛灉鏈夊瓙鑺傜偣锛岀户缁鐞?        if (node.children) {
          addLogEntry(`澶勭悊鏂囦欢澶?${node.title || '鏍圭洰褰?}"鐨?{node.children.length}涓瓙椤筦, 'info');
          for (const child of node.children) {
            processNode(child);
          }
        }
      }
      
      // 浠庢牴鑺傜偣寮€濮嬪鐞?      for (const node of bookmarkTreeNodes) {
        processNode(node);
      }
      
      // 娣诲姞璋冭瘯淇℃伅
      const emptyTitles = bookmarks.filter(b => !b.title).length;
      const numericTitles = bookmarks.filter(b => /^\d+$/.test(b.title)).length;
      addLogEntry(`涔︾鑾峰彇瀹屾垚: 鎬昏${bookmarks.length}涓功绛? ${emptyTitles}涓┖鏍囬, ${numericTitles}涓函鏁板瓧鏍囬`, 'info');
      
      // 娣诲姞鏇磋缁嗙殑鍒嗙被缁熻
      const domainMap = {};
      bookmarks.forEach(bookmark => {
        try {
          const url = new URL(bookmark.url);
          const domain = url.hostname.replace(/^www\./, '');
          domainMap[domain] = (domainMap[domain] || 0) + 1;
        } catch (e) {
          // 蹇界暐鏃犳晥URL
        }
      });
      
      // 杈撳嚭鍓?0涓渶甯歌鐨勫煙鍚?      const topDomains = Object.entries(domainMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      if (topDomains.length > 0) {
        addLogEntry(`鏈€甯歌鐨勫煙鍚?`, 'info');
        topDomains.forEach(([domain, count]) => {
          addLogEntry(`  - ${domain}: ${count}涓功绛綻, 'info');
        });
      }
      
      resolve(bookmarks);
    });
  });
}

// 鑾峰彇API璁剧疆
function getApiSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get([
      'apiProvider', 
      'apiKey', 
      'customApiUrl', 
      'geminiModel', 
      'openaiModel', 
      'customModel', 
      'defaultCategories', 
      'batchSize'
    ], (result) => {
      const apiProvider = result.apiProvider || 'gemini';
      let model = '';
      
      // 鏍规嵁鎻愪緵鍟嗛€夋嫨瀵瑰簲鐨勬ā鍨?      switch (apiProvider) {
        case 'gemini':
          model = result.geminiModel || 'gemini-2.0-flash';
          break;
        case 'openai':
          model = result.openaiModel || 'gpt-3.5-turbo';
          break;
        case 'custom':
          model = result.customModel || '';
          break;
      }
      
      resolve({
        provider: apiProvider,
        apiKey: result.apiKey || '',
        customApiUrl: result.customApiUrl || '',
        model: model,
        defaultCategories: result.defaultCategories || '鎶€鏈?鏁欒偛,璐墿,绀句氦濯掍綋,鏂伴椈,濞变箰,宸ヤ綔,鍏朵粬',
        batchSize: result.batchSize || 50
      });
    });
  });
}

// 浣跨敤AI瀵逛功绛捐繘琛屽垎绫?async function categorizeBookmarks(bookmarks, settings) {
  // 澧炲己棰勫鐞嗭細妫€鏌ュ苟淇涔︾鏁版嵁
  addLogEntry(`寮€濮嬮澶勭悊涔︾鏁版嵁...`, 'info');
  
  // 缁熻鏈夋晥涔︾鏁伴噺
  const validBookmarks = bookmarks.filter(b => b.title && b.url).length;
  const totalBookmarks = bookmarks.length;
  if (validBookmarks < totalBookmarks) {
    addLogEntry(`璀﹀憡: 妫€娴嬪埌${totalBookmarks - validBookmarks}涓棤鏁堜功绛?(鏃犳爣棰樻垨URL)`, 'warning');
  }
  
  // 鏍囩闀垮害缁熻
  const titleLengths = bookmarks.map(b => b.title ? b.title.length : 0);
  const avgTitleLength = titleLengths.reduce((sum, len) => sum + len, 0) / titleLengths.length || 0;
  const maxTitleLength = Math.max(...titleLengths);
  const minTitleLength = Math.min(...(titleLengths.filter(len => len > 0) || [0]));
  
  addLogEntry(`鏍囩鏍囬缁熻: 骞冲潎闀垮害=${avgTitleLength.toFixed(1)}瀛楃, 鏈€闀?${maxTitleLength}瀛楃, 鏈€鐭?${minTitleLength}瀛楃`, 'info');
  
  // 妫€鏌ュ父瑙佺殑鐗规畩鏍囩
  const specialPatterns = {
    '绾暟瀛楁爣棰?: /^\d+$/,
    '鍖呭惈鐗规畩瀛楃': /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/,
    '闈炰腑鏂囨爣棰?: /^[^\u4e00-\u9fa5]+$/,
    '杩囬暱鏍囬(>30瀛楃)': title => title.length > 30
  };
  
  const specialStats = {};
  Object.keys(specialPatterns).forEach(key => {
    specialStats[key] = 0;
  });
  
  bookmarks.forEach(bookmark => {
    if (bookmark.title) {
      Object.entries(specialPatterns).forEach(([key, pattern]) => {
        if (typeof pattern === 'function') {
          if (pattern(bookmark.title)) specialStats[key]++;
        } else if (pattern.test(bookmark.title)) {
          specialStats[key]++;
        }
      });
    }
  });
  
  addLogEntry(`鏍囩鐗瑰緛缁熻:`, 'info');
  Object.entries(specialStats).forEach(([key, count]) => {
    const percentage = ((count / totalBookmarks) * 100).toFixed(1);
    addLogEntry(`  - ${key}: ${count}涓?(${percentage}%)`, 'info');
  });
  
  // 棰勫鐞嗭細鍒涘缓鏇村弸濂界殑鏁版嵁闆?  const bookmarkData = bookmarks.map(b => {
    // 灏濊瘯浠嶶RL鎻愬彇鍩熷悕浣滀负闄勫姞淇℃伅
    let domain = '';
    try {
      if (b.url) {
        const urlObj = new URL(b.url);
        domain = urlObj.hostname.replace(/^www\./, '');
      }
    } catch (e) {
      // URL瑙ｆ瀽澶辫触锛屽拷鐣?    }
    
    return {
      title: b.title || domain || '鏈懡鍚嶄功绛?,
      url: b.url || '',
      domain: domain
    };
  });
  
  // 绠€鍗曡嚜鍔ㄥ垎绫伙細灏濊瘯棰勫厛璇嗗埆涓€浜涘父瑙佺被鍒?  const preCategorized = {};
  const domainPatterns = {
    // AI宸ュ叿鍜屾湇鍔?    '閫氱敤AI宸ュ叿': [/gemini\.google\.com/, /openai\.com/, /chat\.openai\.com/, /perplexity\.ai/, /claude\.ai/, /poe\.com/],
    'AI寮€鍙戝钩鍙?: [/aistudio\.google\.com/, /platform\.openai\.com/, /colab\.research\.google/, /huggingface\.co/],
    'AI绗旇宸ュ叿': [/notebooklm\.google\.com/, /notion\.ai/, /obsidian\.md/],
    
    // 璁捐宸ュ叿鍜屽钩鍙?    'UI璁捐宸ュ叿': [/figma\.com/, /sketch\.com/, /adobe\.com/, /canva\.com/, /framer\.com/],
    '鍘熷瀷璁捐': [/gamma\.app/, /miro\.com/, /whimsical\.com/, /mockplus\.com/, /axure\.com/],
    '寮€鍙戣璁″伐鍏?: [/lovable\.dev/, /v0\.dev/, /bolt\.new/, /replit\.com/, /codesandbox\.io/],
    
    // 鏁欑▼鍜屽涔犺祫婧?    'UI璁捐鏁欑▼': [/uisdc\.com/, /uxdesign\.cc/, /dribbble\.com/, /behance\.net/, /designbetter\.co/],
    '鎶€鏈暀绋?: [/csdn\.net/, /juejin\.cn/, /segmentfault\.com/, /dev\.to/, /medium\.com/],
    '鍦ㄧ嚎璇剧▼': [/coursera\.org/, /udemy\.com/, /edx\.org/, /khan.*academy/, /freecodecamp\.org/],
    
    // 寮€鍙戝伐鍏?    '浠ｇ爜鎵樼': [/github\.com/, /gitlab\.com/, /gitee\.com/, /bitbucket\.org/],
    '鎶€鏈棶绛?: [/stackoverflow\.com/, /stackexchange\.com/, /zhihu\.com/],
    '鏂囨。宸ュ叿': [/gitbook\.com/, /docsify\.js\.org/, /vuepress\.vuejs\.org/],
    
    // 瀹炵敤宸ュ叿
    '缈昏瘧宸ュ叿': [/translate\.google\.com/, /deepl\.com/, /fanyi\.baidu\.com/, /youdao\.com/],
    '鍥剧墖宸ュ叿': [/tinypng\.com/, /remove\.bg/, /unsplash\.com/, /pexels\.com/],
    '鍦ㄧ嚎鍔炲叕': [/docs\.google\.com/, /office\.com/, /notion\.so/, /airtable\.com/],
    
    // 浼犵粺鍒嗙被锛堜繚鐣欎絾缁嗗寲锛?    '瑙嗛濞变箰': [/youtube\.com/, /bilibili\.com/, /netflix\.com/, /youku\.com/, /iqiyi\.com/],
    '绀句氦濯掍綋': [/twitter\.com/, /facebook\.com/, /instagram\.com/, /weibo\.com/, /linkedin\.com/, /reddit\.com/],
    '鐢靛晢璐墿': [/taobao\.com/, /jd\.com/, /amazon\.com/, /tmall\.com/, /pinduoduo\.com/],
    '閭鏈嶅姟': [/mail\./, /gmail\.com/, /outlook\.com/, /qq\.com.*mail/],
    '鏂伴椈璧勮': [/news\./, /sina\.com/, /qq\.com/, /163\.com/, /bbc\./, /cnn\./]
  };
  
  // 鍩轰簬涔︾鏍囬鐨勫叧閿瘝鍖归厤锛堝寮鸿瘑鍒兘鍔涳級
  const titleKeywords = {
    'AI宸ュ叿鏁欑▼': ['AI鏁欑▼', 'ChatGPT鏁欑▼', 'Gemini浣跨敤', '浜哄伐鏅鸿兘鏁欑▼', 'AI瀛︿範', 'machine learning'],
    'UI璁捐绱犳潗': ['璁捐绱犳潗', 'UI绱犳潗', '鍥炬爣', 'icon', '閰嶈壊', 'color', '瀛椾綋', 'font'],
    'UI璁捐妗堜緥': ['璁捐妗堜緥', 'UI妗堜緥', '鐣岄潰璁捐', '浜や簰璁捐', 'UX妗堜緥', '璁捐鐏垫劅'],
    'Figma鏁欑▼': ['Figma', 'figma鏁欑▼', '缁勪欢搴?, 'design system'],
    '娓告垙UI璁捐': ['娓告垙UI', '娓告垙鐣岄潰', 'game ui', 'game design'],
    '鍓嶇寮€鍙?: ['鍓嶇', 'frontend', 'Vue', 'React', 'Angular', 'JavaScript'],
    '鍚庣寮€鍙?: ['鍚庣', 'backend', 'API', 'Node.js', 'Python', 'Java'],
    '绉诲姩寮€鍙?: ['绉诲姩寮€鍙?, 'iOS', 'Android', 'Flutter', 'React Native']
  };
  
  // 灏濊瘯鍋氫竴浜涢鍒嗙被锛屽府鍔〢I鏇村ソ鐞嗚В
  bookmarkData.forEach(bookmark => {
    let categorized = false;
    
    // 棣栧厛灏濊瘯鍩熷悕鍖归厤
    for (const [category, patterns] of Object.entries(domainPatterns)) {
      if (patterns.some(pattern => pattern.test(bookmark.domain || bookmark.url))) {
        if (!preCategorized[category]) {
          preCategorized[category] = [];
        }
        preCategorized[category].push(bookmark);
        categorized = true;
        break; // 涓€涓功绛惧彧褰掑叆涓€涓鍒嗙被
      }
    }
    
    // 濡傛灉鍩熷悕娌℃湁鍖归厤鍒帮紝灏濊瘯鏍囬鍏抽敭璇嶅尮閰?    if (!categorized && bookmark.title) {
      const title = bookmark.title.toLowerCase();
      for (const [category, keywords] of Object.entries(titleKeywords)) {
        if (keywords.some(keyword => title.includes(keyword.toLowerCase()))) {
          if (!preCategorized[category]) {
            preCategorized[category] = [];
          }
          preCategorized[category].push(bookmark);
          break;
        }
      }
    }
  });
  
  // 杈撳嚭棰勫垎绫荤粨鏋?  addLogEntry(`棰勫垎绫荤粨鏋?`, 'info');
  Object.entries(preCategorized).forEach(([category, items]) => {
    addLogEntry(`  - ${category}: ${items.length}涓功绛綻, 'info');
  });
  
  // 缁熻鏈棰勫垎绫荤殑涔︾鏁伴噺
  const preCategorizedCount = Object.values(preCategorized).reduce((sum, items) => sum + items.length, 0);
  const uncategorizedCount = bookmarkData.length - preCategorizedCount;
  addLogEntry(`棰勫垎绫荤粺璁? 宸插垎绫?{preCategorizedCount}涓?(${((preCategorizedCount/bookmarkData.length)*100).toFixed(1)}%), 鏈垎绫?{uncategorizedCount}涓猔, 'info');
  
  // 娣诲姞棰勫垎绫讳俊鎭埌鎻愮ず璇嶄腑锛屽府鍔〢I鏇村ソ鍦扮悊瑙?  const preCategorizedInfo = Object.entries(preCategorized)
    .map(([category, items]) => `- ${category}: ${items.length}涓功绛撅紝渚嬪: ${items.slice(0, 3).map(b => b.title).join(', ')}...`)
    .join('\n');
  
  // 鏋勫缓鎻愮ず璇?  const prompt = `浣犳槸涓€涓笓涓氱殑涔︾鍒嗙被鍔╂墜銆傝瀵逛互涓嬩功绛捐繘琛岃缁嗗垎绫伙紝鍒涘缓鏈夋剰涔変笖缁嗚嚧鐨勫垎绫讳綋绯汇€?
鍒嗙被鎸囧鍘熷垯锛?1. 鍒嗙被鏁伴噺锛氶紦鍔卞垱寤?0-25涓粏鍒嗙被鍒紝鏍规嵁涔︾鍐呭鐨勪赴瀵岀▼搴︾伒娲昏皟鏁?2. 鍒嗙被缁嗗害锛氫紭鍏堝垱寤虹粏鑷淬€佷笓涓氱殑鍒嗙被锛岃€屼笉鏄娉涚殑澶х被
3. 鍒嗙被鍚嶇О锛氫娇鐢ㄥ噯纭€佷笓涓氱殑涓枃璇嶆眹锛屼綋鐜板叿浣撶敤閫旀垨棰嗗煙
4. 绂佹浣跨敤锛氭暟瀛?0,1,2...)銆佸瓧姣?A,B,C...)鎴栫壒娈婄鍙蜂綔涓哄垎绫诲悕
5. 杈撳嚭鏍煎紡锛氫弗鏍糐SON鏍煎紡锛屼笉娣诲姞鍏朵粬璇存槑鏂囧瓧

寤鸿鐨勭粏鍒嗙被鍒ず渚嬶紙鏍规嵁瀹為檯鍐呭璋冩暣锛夛細
- AI宸ュ叿绫伙細閫氱敤AI宸ュ叿銆丄I寮€鍙戝钩鍙般€丄I绗旇宸ュ叿銆丄I宸ュ叿鏁欑▼
- 璁捐绫伙細UI璁捐宸ュ叿銆佸師鍨嬭璁°€乁I璁捐鏁欑▼銆乁I璁捐绱犳潗銆佽璁℃渚嬨€丗igma鏁欑▼
- 寮€鍙戠被锛氫唬鐮佹墭绠°€佹妧鏈暀绋嬨€佸墠绔紑鍙戙€佸悗绔紑鍙戙€佹妧鏈棶绛?- 瀹炵敤宸ュ叿锛氱炕璇戝伐鍏枫€佸浘鐗囧伐鍏枫€佸湪绾垮姙鍏?- 瀛︿範璧勬簮锛氬湪绾胯绋嬨€佹妧鏈枃妗ｃ€佽璁″涔?
${preCategorizedInfo ? `鍙傝€冮鍒嗙被锛堝彲杩涗竴姝ョ粏鍒嗘垨璋冩暣锛夛細\n${preCategorizedInfo}\n` : ''}

璇锋牴鎹功绛剧殑鍏蜂綋鍐呭鍜岀敤閫旓紝鍒涘缓灏藉彲鑳藉噯纭拰缁嗚嚧鐨勫垎绫伙細

杈撳嚭鏍煎紡锛?{
  "閫氱敤AI宸ュ叿": [
    {"title": "Gemini", "url": "https://gemini.google.com/app"},
    {"title": "Perplexity", "url": "https://www.perplexity.ai/"}
  ],
  "AI寮€鍙戝钩鍙?: [
    {"title": "Google AI Studio", "url": "https://aistudio.google.com/"}
  ],
  "UI璁捐鏁欑▼": [
    {"title": "Figma缁勪欢搴撴暀绋?, "url": "https://www.uisdc.com/..."}
  ]
}

闇€瑕佸垎绫荤殑涔︾锛?${JSON.stringify(bookmarkData, null, 2)}`;

  // 鏍规嵁API鎻愪緵鍟嗛€夋嫨鍚堥€傜殑澶勭悊鏂规硶
  let categoryResult;
  try {
    addLogEntry(`寮€濮嬭皟鐢ˋI杩涜涔︾鍒嗙被...`, 'info');
    
    switch (settings.provider) {
      case 'gemini':
        categoryResult = await callGeminiApi(prompt, settings.apiKey, settings.model);
        break;
      case 'openai':
        categoryResult = await callOpenAiApi(prompt, settings.apiKey, settings.model);
        break;
      case 'custom':
        categoryResult = await callCustomApi(settings.apiKey, settings.customApiUrl, settings.model, prompt);
        break;
      default:
        throw new Error('涓嶆敮鎸佺殑API鎻愪緵鍟?);
    }
    
    addLogEntry(`AI鍒嗙被瀹屾垚锛岃幏寰?{Object.keys(categoryResult).length}涓垎绫籤, 'success');
    
    // 鍒嗘瀽鍒嗙被璐ㄩ噺
    const categoryNames = Object.keys(categoryResult);
    const numericCategories = categoryNames.filter(name => /^\d+$/.test(name)).length;
    const shortCategories = categoryNames.filter(name => name.length < 2).length;
    const longCategories = categoryNames.filter(name => name.length > 10).length;
    
    addLogEntry(`鍒嗙被璐ㄩ噺鍒嗘瀽:`, 'info');
    addLogEntry(`  - 绾暟瀛楀垎绫? ${numericCategories}涓猔, numericCategories > 0 ? 'warning' : 'info');
    addLogEntry(`  - 杩囩煭鍒嗙被(灏忎簬2瀛楃): ${shortCategories}涓猔, shortCategories > 0 ? 'warning' : 'info');
    addLogEntry(`  - 杩囬暱鍒嗙被(澶т簬10瀛楃): ${longCategories}涓猔, longCategories > 0 ? 'info' : 'info');
    
    // 濡傛灉API杩斿洖绌虹粨鏋滄垨娌℃湁鍒嗙被锛屽皾璇曚娇鐢ㄩ鍒嗙被缁撴灉
    if (!categoryResult || Object.keys(categoryResult).length === 0) {
      addLogEntry('API杩斿洖鐨勫垎绫荤粨鏋滀负绌猴紝灏濊瘯浣跨敤棰勫垎绫荤粨鏋?, 'warning');
      
      if (Object.keys(preCategorized).length > 0) {
        categoryResult = preCategorized;
        addLogEntry(`浣跨敤棰勫垎绫荤粨鏋? ${Object.keys(preCategorized).length}涓垎绫籤, 'info');
      } else {
        // 鍒涘缓涓€涓熀鏈垎绫?        categoryResult = { "鏈垎绫?: bookmarkData };
        addLogEntry(`鏃犳硶鑾峰彇鏈夋晥鍒嗙被锛屾墍鏈変功绛惧綊涓?鏈垎绫?`, 'error');
      }
    }
    
    // 楠岃瘉骞朵紭鍖栧垎绫荤粨鏋?    return validateAndOptimizeCategories(categoryResult, bookmarks.length);
  } catch (error) {
    console.error('鍒嗙被澶勭悊澶辫触:', error);
    addLogEntry(`鍒嗙被澶勭悊澶辫触: ${error.message}锛屽皾璇曚娇鐢ㄥ鐢ㄦ柟妗坄, 'error');
    
    // 鍑洪敊鏃朵娇鐢ㄩ鍒嗙被浣滀负澶囩敤鏂规
    if (Object.keys(preCategorized).length > 0) {
      // 灏嗘湭棰勫垎绫荤殑涔︾鏀惧叆"鍏朵粬"鍒嗙被
      const uncategorized = bookmarkData.filter(bookmark => {
        return !Object.values(preCategorized).some(items => 
          items.some(item => item.url === bookmark.url)
        );
      });
      
      if (uncategorized.length > 0) {
        preCategorized["鍏朵粬"] = uncategorized;
      }
      
      addLogEntry(`浣跨敤棰勫垎绫讳綔涓哄鐢ㄦ柟妗? ${Object.keys(preCategorized).length}涓垎绫籤, 'info');
      return preCategorized;
    }
    
    // 濡傛灉娌℃湁棰勫垎绫伙紝浣跨敤鍩烘湰鍒嗙被
    const basicCategories = {
      "甯哥敤缃戠珯": bookmarkData.slice(0, Math.min(20, bookmarkData.length)),
      "鍏朵粬涔︾": bookmarkData.slice(Math.min(20, bookmarkData.length))
    };
    
    addLogEntry(`鏃犳硶杩涜鍒嗙被锛屼娇鐢ㄥ熀鏈垎绫绘柟妗坄, 'warning');
    return basicCategories;
  }
}

// 楠岃瘉骞朵紭鍖栧垎绫荤粨鏋?function validateAndOptimizeCategories(categories, totalBookmarks) {
  // 鎻愰珮鍒嗙被鏁伴噺闄愬埗锛岄紦鍔辩粏鍒?  const MAX_CATEGORIES = 30; // 浠?0鎻愰珮鍒?0
  let categoriesCount = Object.keys(categories).length;
  
  // 鍙湁鍦ㄥ垎绫绘暟閲忎弗閲嶈秴鏍囨椂鎵嶈繘琛屽悎骞?  if (categoriesCount > MAX_CATEGORIES) {
    addLogEntry(`鍒嗙被鏁伴噺(${categoriesCount})瓒呰繃鏈€澶ч檺鍒?${MAX_CATEGORIES})锛屾鍦ㄩ€傚害浼樺寲...`, 'warning');
    
    // 鑾峰彇鎵€鏈夊垎绫诲強鍏朵功绛炬暟閲?    const categoriesWithCount = Object.entries(categories)
      .map(([name, items]) => ({ name, count: items.length }))
      .sort((a, b) => b.count - a.count);
    
    // 淇濈暀鍓?5涓垎绫伙紝鍙悎骞舵瀬灏忕殑鍒嗙被锛堝皯浜庣瓑浜?涓功绛剧殑锛?    const mainCategories = categoriesWithCount.slice(0, MAX_CATEGORIES - 5);
    const smallCategories = categoriesWithCount.slice(MAX_CATEGORIES - 5);
    
    // 鍙悎骞剁湡姝ｇ殑灏忓垎绫伙紙1涓功绛剧殑鍒嗙被锛?    const verySmallCategories = smallCategories.filter(cat => cat.count <= 1);
    const keepCategories = smallCategories.filter(cat => cat.count > 1);
    
    // 鍒涘缓鏂扮殑鍒嗙被缁撴灉
    const optimizedCategories = {};
    
    // 娣诲姞涓昏鍒嗙被
    mainCategories.forEach(cat => {
      optimizedCategories[cat.name] = categories[cat.name];
    });
    
    // 淇濈暀鏈夋剰涔夌殑灏忓垎绫伙紙瓒呰繃1涓功绛撅級
    keepCategories.forEach(cat => {
      optimizedCategories[cat.name] = categories[cat.name];
    });
    
    // 鍙悎骞舵瀬灏忕殑鍒嗙被
    if (verySmallCategories.length > 0) {
      optimizedCategories["鍏朵粬"] = optimizedCategories["鍏朵粬"] || [];
      verySmallCategories.forEach(cat => {
        optimizedCategories["鍏朵粬"] = optimizedCategories["鍏朵粬"].concat(categories[cat.name]);
      });
      addLogEntry(`宸插皢${verySmallCategories.length}涓崟涔︾鍒嗙被鍚堝苟鍒?鍏朵粬"`, 'info');
    }
    
    return optimizedCategories;
  }
  
  // 楠岃瘉鍒嗙被鍚嶇О锛屼慨澶嶇函鏁板瓧鎴栨棤鎰忎箟鐨勫垎绫诲悕
  const optimizedCategories = {};
  const numericPattern = /^[\d]+$/;  // 鍖归厤绾暟瀛?  
  Object.entries(categories).forEach(([categoryName, items]) => {
    let newName = categoryName;
    
    // 妫€鏌ユ槸鍚︿负绾暟瀛楁垨澶煭鐨勫垎绫诲悕
    if (numericPattern.test(categoryName) || categoryName.length < 2) {
      // 灏濊瘯鏍规嵁鍐呭鎺ㄦ柇鏇村ソ鐨勫悕绉?      newName = inferCategoryName(items) || "鍏朵粬";
      addLogEntry(`宸蹭慨姝ｆ棤鏁堢殑鍒嗙被鍚?${categoryName}"涓?${newName}"`, 'warning');
    }
    
    // 娣诲姞鍒颁紭鍖栧悗鐨勫垎绫?    if (!optimizedCategories[newName]) {
      optimizedCategories[newName] = [];
    }
    optimizedCategories[newName] = optimizedCategories[newName].concat(items);
  });
  
  addLogEntry(`鍒嗙被楠岃瘉瀹屾垚锛屼繚鐣?{Object.keys(optimizedCategories).length}涓垎绫籤, 'success');
  
  return optimizedCategories;
}

// 灏濊瘯鏍规嵁涔︾鍐呭鎺ㄦ柇鍒嗙被鍚嶇О
function inferCategoryName(bookmarks) {
  // 甯歌缃戠珯绫诲瀷鏄犲皠
  const domainCategories = {
    'github.com': '绋嬪簭寮€鍙?,
    'youtube.com': '瑙嗛濞变箰',
    'bilibili.com': '瑙嗛濞变箰',
    'zhihu.com': '闂瓟绀惧尯',
    'taobao.com': '缃戜笂璐墿',
    'jd.com': '缃戜笂璐墿',
    'tmall.com': '缃戜笂璐墿',
    'weibo.com': '绀句氦濯掍綋',
    'twitter.com': '绀句氦濯掍綋',
    'facebook.com': '绀句氦濯掍綋',
    'instagram.com': '绀句氦濯掍綋',
    'linkedin.com': '鑱屼笟绀句氦',
    'stackoverflow.com': '鎶€鏈棶绛?,
    'mail.': '鐢靛瓙閭',
    'gmail': '鐢靛瓙閭',
    'outlook': '鐢靛瓙閭',
    'docs.google.com': '鍦ㄧ嚎鍔炲叕',
    'notion.so': '鍦ㄧ嚎鍔炲叕',
    'edu.': '鏁欒偛瀛︿範',
    'csdn.net': '鎶€鏈崥瀹?,
    'juejin.cn': '鎶€鏈崥瀹?,
    'medium.com': '鍗氬骞冲彴'
  };
  
  // 鎻愬彇鎵€鏈変功绛剧殑鍩熷悕
  const domains = bookmarks.map(bm => {
    try {
      if (!bm.url) return '';
      const urlObj = new URL(bm.url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }).filter(Boolean);
  
  // 灏濊瘯鎵惧嚭鏈€甯歌鐨勫煙鍚嶇被鍨?  const categoryMatches = {};
  
  domains.forEach(domain => {
    for (const [pattern, category] of Object.entries(domainCategories)) {
      if (domain.includes(pattern)) {
        categoryMatches[category] = (categoryMatches[category] || 0) + 1;
      }
    }
  });
  
  // 鎵惧嚭鍖归厤鏈€澶氱殑鍒嗙被
  let bestCategory = null;
  let maxMatches = 0;
  
  for (const [category, matches] of Object.entries(categoryMatches)) {
    if (matches > maxMatches) {
      maxMatches = matches;
      bestCategory = category;
    }
  }
  
  // 濡傛灉鏈夎秴杩?0%鐨勪功绛惧尮閰嶅悓涓€涓垎绫伙紝浣跨敤璇ュ垎绫?  if (bestCategory && maxMatches >= domains.length * 0.2) {
    return bestCategory;
  }
  
  // 娌℃湁鎵惧埌鍚堥€傜殑鍒嗙被
  return null;
}

// 鍏变韩鐨凧SON瑙ｆ瀽鍜屼慨澶嶅嚱鏁?function parseJsonWithRecovery(jsonStr) {
  // 棣栧厛灏濊瘯鐩存帴瑙ｆ瀽
  try {
    const result = JSON.parse(jsonStr);
    return result;
  } catch (firstError) {
    addLogEntry(`鍒濇JSON瑙ｆ瀽澶辫触: ${firstError.message}`, 'warning');
    
    // 灏濊瘯淇甯歌鐨凧SON閿欒
    let fixedJson = jsonStr;
    
    // 淇1: 绉婚櫎鍙兘鐨勫墠瀵?灏鹃殢鏂囨湰
    const cleanMatch = fixedJson.match(/{[\s\S]*}/);
    if (cleanMatch) {
      fixedJson = cleanMatch[0];
    }
    
    // 淇2: 澶勭悊涓嶅畬鏁寸殑JSON锛堟坊鍔犵己澶辩殑澶ф嫭鍙锋垨鏂规嫭鍙凤級
    const openBraces = (fixedJson.match(/{/g) || []).length;
    const closeBraces = (fixedJson.match(/}/g) || []).length;
    const openBrackets = (fixedJson.match(/\[/g) || []).length;
    const closeBrackets = (fixedJson.match(/]/g) || []).length;
    
    // 娣诲姞缂哄け鐨勯棴鍚堟嫭鍙?    for (let i = 0; i < openBraces - closeBraces; i++) {
      fixedJson += '}';
    }
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      fixedJson += ']';
    }
    
    // 淇3: 澶勭悊灏鹃儴閫楀彿
    fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
    
    // 淇4: 澶勭悊缂哄け鐨勫紩鍙?    fixedJson = fixedJson.replace(/(\w+):/g, '"$1":');
    
    addLogEntry(`灏濊瘯淇鍚庣殑JSON: ${fixedJson.substring(0, 100)}...`, 'info');
    
    try {
      return JSON.parse(fixedJson);
    } catch (secondError) {
      addLogEntry(`JSON淇鍚庝粛鐒惰В鏋愬け璐? ${secondError.message}`, 'error');
      
      // 浣滀负鏈€鍚庣殑鎵嬫锛屽皾璇曟彁鍙栭敭鍊煎骞舵瀯寤哄熀鏈粨鏋?      try {
        const fallbackResult = {};
        const keyValueMatches = fixedJson.match(/"([^"]+)":\s*\[([^\]]*)\]/g);
        
        if (keyValueMatches && keyValueMatches.length > 0) {
          addLogEntry(`灏濊瘯浠庨敭鍊煎鏋勫缓JSON缁撴瀯...`, 'warning');
          
          keyValueMatches.forEach(match => {
            const kvMatch = match.match(/"([^"]+)":\s*\[([^\]]*)\]/);
            if (kvMatch) {
              const category = kvMatch[1];
              const content = kvMatch[2];
              
              // 灏濊瘯瑙ｆ瀽涔︾瀵硅薄
              const bookmarks = [];
              const bookmarkMatches = content.match(/{"title":\s*"([^"]+)",\s*"url":\s*"([^"]+)"}/g);
              
              if (bookmarkMatches) {
                bookmarkMatches.forEach(bmMatch => {
                  const bmParts = bmMatch.match(/{"title":\s*"([^"]+)",\s*"url":\s*"([^"]+)"}/);
                  if (bmParts) {
                    bookmarks.push({
                      title: bmParts[1],
                      url: bmParts[2]
                    });
                  }
                });
              }
              
              if (bookmarks.length > 0) {
                fallbackResult[category] = bookmarks;
              }
            }
          });
          
          if (Object.keys(fallbackResult).length > 0) {
            addLogEntry(`鎴愬姛浠庨敭鍊煎鏋勫缓浜?{Object.keys(fallbackResult).length}涓垎绫籤, 'success');
            return fallbackResult;
          }
        }
      } catch (fallbackError) {
        addLogEntry(`澶囩敤瑙ｆ瀽鏂规涔熷け璐ヤ簡: ${fallbackError.message}`, 'error');
      }
      
      // 濡傛灉鎵€鏈夊皾璇曢兘澶辫触浜嗭紝鎶涘嚭鍘熷閿欒
      throw new Error(`JSON瑙ｆ瀽澶辫触锛屽凡灏濊瘯澶氱淇鏂规: ${firstError.message}`);
    }
  }
}

// 閫氱敤JSON鎻愬彇鍑芥暟
function extractJsonFromText(responseText) {
  addLogEntry(`姝ｅ湪浠庡搷搴斾腑鎻愬彇JSON鏁版嵁...`, 'info');
  
  // 澶氱JSON鎻愬彇绛栫暐
  let jsonText = '';
  
  // 绛栫暐1: 瀵绘壘瀹屾暣鐨凧SON浠ｇ爜鍧?  const codeBlockMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                         responseText.match(/```\s*([\s\S]*?)\s*```/);
  
  if (codeBlockMatch) {
    jsonText = codeBlockMatch[1].trim();
    addLogEntry(`浠庝唬鐮佸潡涓彁鍙朖SON锛岄暱搴? ${jsonText.length}瀛楃`, 'success');
  } else {
    // 绛栫暐2: 瀵绘壘绗竴涓畬鏁寸殑JSON瀵硅薄
    const jsonObjectMatch = responseText.match(/{[\s\S]*}/);
    if (jsonObjectMatch) {
      jsonText = jsonObjectMatch[0];
      addLogEntry(`浠庢枃鏈腑鎻愬彇JSON瀵硅薄锛岄暱搴? ${jsonText.length}瀛楃`, 'success');
    } else {
      // 绛栫暐3: 浣跨敤鏁翠釜鍝嶅簲
      jsonText = responseText.trim();
      addLogEntry(`鏈壘鍒癑SON鏍煎紡鏍囪锛屼娇鐢ㄦ暣涓搷搴斾綔涓篔SON`, 'warning');
    }
  }
  
  return jsonText;
}

// 璋冪敤Gemini API
async function callGeminiApi(prompt, apiKey, model) {
  try {
    // 鏋勫缓URL锛屾敞鎰忕増鏈彿
    const apiVersion = model.startsWith('gemini-1.5') ? 'v1' : 'v1beta';
    const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;
    
    console.log(`姝ｅ湪璋冪敤Gemini API锛屾ā鍨? ${model}`);
    addLogEntry(`姝ｅ湪璋冪敤Gemini API锛屾ā鍨? ${model}`, 'info');
    
    // 璁板綍鍙戦€佺殑鏁版嵁锛岀敤浜庤皟璇?    const requestData = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048
      }
    };
    
    // 璁板綍鎻愮ず璇嶇殑涓€閮ㄥ垎锛堥伩鍏嶈繃闀匡級
    const promptPreview = prompt.substring(0, 200) + "...";
    addLogEntry(`API鎻愮ず璇嶉瑙? ${promptPreview}`, 'info');
    console.log('瀹屾暣鎻愮ず璇?', prompt);
    
    addLogEntry(`鍙戦€佽姹傚埌: ${apiVersion} 鐗堟湰API...`, 'info');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API閿欒鍝嶅簲:', errorData);
      addLogEntry(`Gemini API閿欒: ${response.status} ${response.statusText}`, 'error');
      throw new Error(`API閿欒: ${response.status} ${response.statusText}`);
    }
    
    addLogEntry(`Gemini API璇锋眰鎴愬姛锛屾鍦ㄥ鐞嗗搷搴?..`, 'info');
    const data = await response.json();
    
    // 妫€鏌ュ搷搴旀牸寮?    if (!data.candidates || data.candidates.length === 0) {
      console.error('Gemini API杩斿洖鏃犳晥鏁版嵁:', data);
      addLogEntry(`Gemini API杩斿洖鏃犳晥鏁版嵁锛屾病鏈塩andidates`, 'error');
      throw new Error('API杩斿洖鏁版嵁鏃犳晥锛屾病鏈塩andidates');
    }
    
    // 鎻愬彇鍝嶅簲鏂囨湰
    const responseText = data.candidates[0].content.parts[0].text;
    addLogEntry(`鎴愬姛鑾峰彇API鍝嶅簲锛屽唴瀹归暱搴? ${responseText.length}瀛楃`, 'success');
    
    // 淇濆瓨瀹屾暣鍝嶅簲浠ヤ究璋冭瘯
    console.log('API瀹屾暣鍝嶅簲:', responseText);
    
    // 浠庡搷搴斾腑鎻愬彇JSON锛屼娇鐢ㄥ叡浜嚱鏁?    const jsonText = extractJsonFromText(responseText);
    console.log('鎻愬彇鐨凧SON鏁版嵁:', jsonText);
    addLogEntry(`鍑嗗瑙ｆ瀽鐨凧SON鏂囨湰: ${jsonText.substring(0, 100)}...`, 'info');

    try {
      // 浣跨敤鏀硅繘鐨勮В鏋愬嚱鏁?      const result = parseJsonWithRecovery(jsonText);
      
      // 楠岃瘉瑙ｆ瀽缁撴灉鐨勬湁鏁堟€?      if (!result || typeof result !== 'object') {
        throw new Error('瑙ｆ瀽缁撴灉涓嶆槸鏈夋晥鐨勫璞?);
      }
      
      const categoryNames = Object.keys(result);
      if (categoryNames.length === 0) {
        throw new Error('瑙ｆ瀽缁撴灉涓虹┖瀵硅薄');
      }
      
      // 妫€鏌ュ垎绫绘槸鍚﹀叏涓烘暟瀛?      const numericCategories = categoryNames.filter(cat => /^\d+$/.test(cat)).length;
      const totalCategories = categoryNames.length;
      
      addLogEntry(`JSON瑙ｆ瀽鎴愬姛锛屽寘鍚?{totalCategories}涓垎绫伙紝鍏朵腑${numericCategories}涓负绾暟瀛楀垎绫籤, 'success');
      
      if (numericCategories > 0) {
        addLogEntry(`璀﹀憡: 妫€娴嬪埌${numericCategories}涓函鏁板瓧鍒嗙被鍚嶏紝杩欏彲鑳借〃绀篈I鏈兘鐞嗚В涔︾鍐呭`, 'warning');
        console.log('绾暟瀛楀垎绫诲悕:', categoryNames.filter(cat => /^\d+$/.test(cat)));
      }
      
      // 妫€鏌ュ垎绫诲唴瀹规槸鍚︽湁鏁?      let validCategories = 0;
      for (const [categoryName, items] of Object.entries(result)) {
        if (Array.isArray(items) && items.length > 0) {
          validCategories++;
          const sampleBookmark = items[0];
          if (validCategories === 1) { // 鍙褰曠涓€涓垎绫荤殑璇︾粏淇℃伅
            addLogEntry(`鍒嗙被鍐呭鏍煎紡妫€鏌? "${categoryName}" - title="${sampleBookmark.title}", url="${sampleBookmark.url}"`, 'info');
          }
        }
      }
      
      addLogEntry(`鏈夋晥鍒嗙被鏁伴噺: ${validCategories}/${totalCategories}`, validCategories === totalCategories ? 'success' : 'warning');
      
      return result;
    } catch (jsonError) {
      console.error('JSON瑙ｆ瀽澶辫触:', jsonError);
      addLogEntry(`JSON瑙ｆ瀽澶辫触: ${jsonError.message}`, 'error');
      addLogEntry(`鍘熷JSON鏂囨湰锛堝墠500瀛楃锛? ${jsonText.substring(0, 500)}...`, 'error');
      throw new Error(`鏃犳硶瑙ｆ瀽AI杩斿洖鐨凧SON: ${jsonError.message}`);
    }
  } catch (error) {
    console.error('Gemini API璋冪敤鍑洪敊:', error);
    addLogEntry(`Gemini API璋冪敤澶辫触: ${error.message}`, 'error');
    throw new Error(`Gemini API璋冪敤澶辫触: ${error.message}`);
  }
}

// 璋冪敤OpenAI API
async function callOpenAiApi(prompt, apiKey, model) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: '浣犳槸涓€涓功绛惧垎绫诲姪鎵嬶紝璇峰皢鐢ㄦ埛鎻愪緵鐨勪功绛惧垎绫伙紝骞朵互JSON鏍煎紡杩斿洖銆?
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      })
    });
    
    if (!response.ok) {
      throw new Error(`API閿欒: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // 鎻愬彇鍝嶅簲鏂囨湰
    const responseText = data.choices[0].message.content;
    addLogEntry(`鎴愬姛鑾峰彇OpenAI API鍝嶅簲锛屽唴瀹归暱搴? ${responseText.length}瀛楃`, 'success');
    console.log('OpenAI API瀹屾暣鍝嶅簲:', responseText);
    
    // 浠庡搷搴斾腑鎻愬彇JSON锛屼娇鐢ㄥ叡浜嚱鏁?    const jsonText = extractJsonFromText(responseText);
    console.log('鎻愬彇鐨凧SON鏁版嵁:', jsonText);
    addLogEntry(`鍑嗗瑙ｆ瀽鐨凧SON鏂囨湰: ${jsonText.substring(0, 100)}...`, 'info');

    try {
      // 浣跨敤鏀硅繘鐨勮В鏋愬嚱鏁?      const result = parseJsonWithRecovery(jsonText);
      
      // 楠岃瘉瑙ｆ瀽缁撴灉鐨勬湁鏁堟€?      if (!result || typeof result !== 'object') {
        throw new Error('瑙ｆ瀽缁撴灉涓嶆槸鏈夋晥鐨勫璞?);
      }
      
      const categoryNames = Object.keys(result);
      if (categoryNames.length === 0) {
        throw new Error('瑙ｆ瀽缁撴灉涓虹┖瀵硅薄');
      }
      
      addLogEntry(`OpenAI JSON瑙ｆ瀽鎴愬姛锛屽寘鍚?{categoryNames.length}涓垎绫籤, 'success');
      
      return result;
    } catch (jsonError) {
      console.error('OpenAI JSON瑙ｆ瀽澶辫触:', jsonError);
      addLogEntry(`OpenAI JSON瑙ｆ瀽澶辫触: ${jsonError.message}`, 'error');
      addLogEntry(`鍘熷JSON鏂囨湰锛堝墠500瀛楃锛? ${jsonText.substring(0, 500)}...`, 'error');
      throw new Error(`鏃犳硶瑙ｆ瀽AI杩斿洖鐨凧SON: ${jsonError.message}`);
    }
  } catch (error) {
    console.error('OpenAI API璋冪敤鍑洪敊:', error);
    throw new Error(`OpenAI API璋冪敤澶辫触: ${error.message}`);
  }
}

// 璋冪敤鑷畾涔堿PI鍒嗘瀽涔︾
async function callCustomApi(apiKey, customApiUrl, model, prompt) {
  try {
    console.log('璋冪敤鑷畾涔堿PI锛孶RL:', customApiUrl);
    addLogEntry(`姝ｅ湪璋冪敤鑷畾涔堿PI锛屾ā鍨? ${model}`, 'info');
    
    // 鍑嗗璇锋眰鍐呭 - 鎻愪緵澶氱鍙兘鐨勬秷鎭牸寮忥紝澧炲姞鍏煎鎬?    const requestData = {
      model: model,
      prompt: prompt,
      message: prompt,
      // 鍏煎鏇村API鏍煎紡
      messages: [
        { role: "user", content: prompt }
      ],
      content: prompt,
      input: prompt
    };

    // 璁板綍鎻愮ず璇嶇殑涓€閮ㄥ垎锛堥伩鍏嶈繃闀匡級
    const promptPreview = prompt.substring(0, 200) + "...";
    addLogEntry(`API鎻愮ず璇嶉瑙? ${promptPreview}`, 'info');
    console.log('瀹屾暣鎻愮ず璇?', prompt);

    addLogEntry(`鍙戦€佽姹傚埌鑷畾涔堿PI...`, 'info');
    const response = await fetch(customApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestData)
    });

    const responseData = await response.json();
    if (!response.ok) {
      console.error('鑷畾涔堿PI閿欒鍝嶅簲:', responseData);
      addLogEntry(`鑷畾涔堿PI閿欒: ${response.status} ${response.statusText}`, 'error');
      throw new Error(`API鍝嶅簲閿欒: ${response.status} - ${JSON.stringify(responseData)}`);
    }

    addLogEntry(`鑷畾涔堿PI璇锋眰鎴愬姛锛屾鍦ㄥ鐞嗗搷搴?..`, 'info');
    console.log('API瀹屾暣鍝嶅簲:', responseData);

    // 澶勭悊涓嶅悓鏍煎紡鐨凙PI鍝嶅簲锛屾彁鍙栨枃鏈唴瀹?    let resultText = '';
    
    // 1. 鐩存帴杩斿洖瀛楃涓?    if (typeof responseData === 'string') {
      resultText = responseData;
    }
    // 2. 鏈夋爣鍑嗗瓧娈电殑鎯呭喌
    else if (responseData.text || responseData.content || responseData.message || responseData.response) {
      resultText = responseData.text || responseData.content || responseData.message || responseData.response;
    }
    // 3. OpenAI鏍煎紡
    else if (responseData.choices && responseData.choices.length > 0) {
      resultText = responseData.choices[0].text || responseData.choices[0].message?.content;
    }
    // 4. 鏈塺esult瀛楁鐨勬儏鍐?    else if (responseData.result) {
      if (typeof responseData.result === 'string') {
        resultText = responseData.result;
      } else {
        // 濡傛灉result鏄璞★紝鍙兘鐩存帴灏辨槸鍒嗙被缁撴灉
        console.log('妫€娴嬪埌result瀛楁涓哄璞★紝鐩存帴杩斿洖:', responseData.result);
        addLogEntry(`妫€娴嬪埌result瀛楁涓哄璞★紝鐩存帴杩斿洖`, 'info');
        return responseData.result;
      }
    }
    // 5. 鏁翠釜鍝嶅簲灏辨槸缁撴灉
    else {
      console.log('鏈壘鍒版爣鍑嗙粨鏋滃瓧娈碉紝灏濊瘯浣跨敤鏁翠釜鍝嶅簲');
      addLogEntry(`鏈壘鍒版爣鍑嗙粨鏋滃瓧娈碉紝灏濊瘯浣跨敤鏁翠釜鍝嶅簲`, 'warning');
      resultText = JSON.stringify(responseData);
    }

    if (!resultText) {
      throw new Error('鏃犳硶浠嶢PI鍝嶅簲涓彁鍙栨枃鏈唴瀹?);
    }

    addLogEntry(`鎴愬姛鑾峰彇API鍝嶅簲锛屽唴瀹归暱搴? ${resultText.length}瀛楃`, 'success');
    console.log('鎻愬彇鐨勫搷搴旀枃鏈?', resultText);

    // 浠庡搷搴斾腑鎻愬彇JSON锛屼娇鐢ㄥ叡浜嚱鏁?    const jsonText = extractJsonFromText(resultText);
    console.log('鎻愬彇鐨凧SON鏁版嵁:', jsonText);
    addLogEntry(`鍑嗗瑙ｆ瀽鐨凧SON鏂囨湰: ${jsonText.substring(0, 100)}...`, 'info');

    try {
      // 浣跨敤鍏变韩鐨勮В鏋愬嚱鏁?      const result = parseJsonWithRecovery(jsonText);
      
      // 楠岃瘉瑙ｆ瀽缁撴灉鐨勬湁鏁堟€?      if (!result || typeof result !== 'object') {
        throw new Error('瑙ｆ瀽缁撴灉涓嶆槸鏈夋晥鐨勫璞?);
      }
      
      const categoryNames = Object.keys(result);
      if (categoryNames.length === 0) {
        throw new Error('瑙ｆ瀽缁撴灉涓虹┖瀵硅薄');
      }
      
      // 妫€鏌ュ垎绫绘槸鍚﹀叏涓烘暟瀛?      const numericCategories = categoryNames.filter(cat => /^\d+$/.test(cat)).length;
      const totalCategories = categoryNames.length;
      
      addLogEntry(`JSON瑙ｆ瀽鎴愬姛锛屽寘鍚?{totalCategories}涓垎绫伙紝鍏朵腑${numericCategories}涓负绾暟瀛楀垎绫籤, 'success');
      
      if (numericCategories > 0) {
        addLogEntry(`璀﹀憡: 妫€娴嬪埌${numericCategories}涓函鏁板瓧鍒嗙被鍚嶏紝杩欏彲鑳借〃绀篈I鏈兘鐞嗚В涔︾鍐呭`, 'warning');
        console.log('绾暟瀛楀垎绫诲悕:', categoryNames.filter(cat => /^\d+$/.test(cat)));
      }
      
      // 妫€鏌ュ垎绫诲唴瀹规槸鍚︽湁鏁?      let validCategories = 0;
      for (const [categoryName, items] of Object.entries(result)) {
        if (Array.isArray(items) && items.length > 0) {
          validCategories++;
          const sampleBookmark = items[0];
          if (validCategories === 1) { // 鍙褰曠涓€涓垎绫荤殑璇︾粏淇℃伅
            addLogEntry(`鍒嗙被鍐呭鏍煎紡妫€鏌? "${categoryName}" - title="${sampleBookmark.title}", url="${sampleBookmark.url}"`, 'info');
          }
        }
      }
      
      addLogEntry(`鏈夋晥鍒嗙被鏁伴噺: ${validCategories}/${totalCategories}`, validCategories === totalCategories ? 'success' : 'warning');
      
      return result;
    } catch (jsonError) {
      console.error('JSON瑙ｆ瀽澶辫触:', jsonError);
      addLogEntry(`JSON瑙ｆ瀽澶辫触: ${jsonError.message}`, 'error');
      addLogEntry(`鍘熷JSON鏂囨湰锛堝墠500瀛楃锛? ${jsonText.substring(0, 500)}...`, 'error');
      throw new Error(`鏃犳硶瑙ｆ瀽AI杩斿洖鐨凧SON: ${jsonError.message}`);
    }
  } catch (error) {
    console.error('鑷畾涔堿PI璋冪敤鍑洪敊:', error);
    addLogEntry(`鑷畾涔堿PI璋冪敤澶辫触: ${error.message}`, 'error');
    throw new Error(`鑷畾涔堿PI璋冪敤澶辫触: ${error.message}`);
  }
}

// 鏄剧ず鍒嗙被缁撴灉
function displayCategories(categories, maxCategories = Infinity) {
  const resultsContainer = document.getElementById('results');
  resultsContainer.innerHTML = '';
  
  // 璁板綍璇︾粏鍒嗙被缁撴灉鍒版棩蹇?  addLogEntry(`寮€濮嬫樉绀哄垎绫荤粨鏋?..`, 'info');
  addLogEntry(`鎬诲叡鏈?${Object.keys(categories).length} 涓垎绫籤, 'info');
  
  // 浼樺寲锛氬鏋滅被鍒お澶氾紝鎸夊ぇ灏忔帓搴忓苟闄愬埗鏄剧ず鏁伴噺
  const allCategories = Object.entries(categories)
    .sort((a, b) => b[1].length - a[1].length);
  
  const totalCategories = allCategories.length;
  
  // 杈撳嚭璇︾粏鍒嗙被淇℃伅鍒版棩蹇?  addLogEntry(`鍒嗙被璇︽儏:`, 'info');
  allCategories.forEach(([category, items], index) => {
    addLogEntry(`  ${index+1}. ${category}: ${items.length}涓功绛綻, 'info');
    
    // 鍙湪鏃ュ織涓樉绀哄墠3涓功绛剧ず渚?    if (items.length > 0) {
      const examples = items.slice(0, 3);
      examples.forEach((item, i) => {
        addLogEntry(`    ${i+1}) "${item.title}" (${item.url ? item.url.substring(0, 30) + '...' : '鏃燯RL'})`, 'info');
      });
      
      if (items.length > 3) {
        addLogEntry(`    ... 浠ュ強${items.length - 3}涓叾浠栦功绛綻, 'info');
      }
    }
  });
  
  // 濡傛灉绫诲埆瓒呰繃闄愬埗锛屾樉绀哄垎椤垫帶鍒?  if (totalCategories > maxCategories && maxCategories !== Infinity) {
    const paginationInfo = document.createElement('div');
    paginationInfo.className = 'pagination-info';
    paginationInfo.textContent = `鏄剧ず${Math.min(maxCategories, totalCategories)}涓被鍒腑鐨勫墠${maxCategories}涓紙鎸変功绛炬暟閲忔帓搴忥級`;
    
    const showAllButton = document.createElement('button');
    showAllButton.className = 'btn-small';
    showAllButton.textContent = '鏄剧ず鍏ㄩ儴';
    showAllButton.onclick = () => displayCategories(categories);
    
    paginationInfo.appendChild(document.createTextNode(' '));
    paginationInfo.appendChild(showAllButton);
    resultsContainer.appendChild(paginationInfo);
    
    addLogEntry(`鐢变簬绫诲埆杩囧锛孶I涓粎鏄剧ず鍓?{maxCategories}涓被鍒玚, 'info');
  }

  // 鍦ㄥ垎鏋愬畬鎴愬悗娣诲姞浼樺寲鎸夐挳
  if (maxCategories === Infinity) {
    const optimizeInfo = document.createElement('div');
    optimizeInfo.className = 'pagination-info';
    
    const optimizeForBrowserButton = document.createElement('button');
    optimizeForBrowserButton.className = 'btn-small';
    optimizeForBrowserButton.textContent = '浼樺寲涓烘祻瑙堝櫒鏍囩椤电粨鏋?;
    optimizeForBrowserButton.onclick = () => optimizeForBrowserTabs(categories);
    
    optimizeInfo.appendChild(optimizeForBrowserButton);
    resultsContainer.appendChild(optimizeInfo);
  }
  
  // 浠呮樉绀洪檺鍒舵暟閲忕殑绫诲埆
  const displayedCategories = allCategories.slice(0, maxCategories);
  
  // 鎬ц兘浼樺寲锛氫娇鐢ㄦ枃妗ｇ墖娈佃€屼笉鏄洿鎺ユ搷浣淒OM
  const fragment = document.createDocumentFragment();
  
  for (const [category, items] of displayedCategories) {
    const categoryElement = document.createElement('div');
    categoryElement.className = 'category';
    
    const categoryName = document.createElement('div');
    categoryName.className = 'category-name';
    categoryName.textContent = `${category} (${items.length})`;
    categoryElement.appendChild(categoryName);
    
    // 鍙樉绀哄墠8涓功绛撅紝濡傛灉瓒呰繃8涓紝鏄剧ず"鏇村..."
    const displayCount = Math.min(items.length, 8);
    
    // 浣跨敤鍐呴儴鏂囨。鐗囨杩涗竴姝ヤ紭鍖?    const itemsFragment = document.createDocumentFragment();
    
    for (let i = 0; i < displayCount; i++) {
      const item = items[i];
      const bookmarkItem = document.createElement('div');
      bookmarkItem.className = 'bookmark-item';
      
      const link = document.createElement('a');
      link.href = item.url;
      link.textContent = item.title || item.url;
      link.title = item.url;
      link.target = '_blank';
      
      bookmarkItem.appendChild(link);
      itemsFragment.appendChild(bookmarkItem);
    }
    
    // 濡傛灉鏈夋洿澶氫功绛撅紝鏄剧ず"鏇村..."骞舵坊鍔犲睍寮€鍔熻兘
    if (items.length > 8) {
      const moreItem = document.createElement('div');
      moreItem.className = 'bookmark-item more-item';
      moreItem.textContent = `...杩樻湁 ${items.length - 8} 涓功绛綻;
      
      // 娣诲姞鐐瑰嚮灞曞紑鍔熻兘
      moreItem.onclick = function() {
        // 宸茬粡灞曞紑鐨勬儏鍐典笅鎶樺彔
        if (this.expanded) {
          // 绉婚櫎棰濆涔︾
          const extras = categoryElement.querySelectorAll('.extra-bookmark');
          extras.forEach(item => item.remove());
          
          // 鎭㈠鏂囨湰鍜岀姸鎬?          this.textContent = `...杩樻湁 ${items.length - 8} 涓功绛綻;
          this.expanded = false;
          return;
        }
        
        // 鏈睍寮€鐨勬儏鍐典笅灞曞紑鏄剧ず鎵€鏈変功绛?        const extraItemsFragment = document.createDocumentFragment();
        
        for (let i = 8; i < items.length; i++) {
          const item = items[i];
          const bookmarkItem = document.createElement('div');
          bookmarkItem.className = 'bookmark-item extra-bookmark';
          
          const link = document.createElement('a');
          link.href = item.url;
          link.textContent = item.title || item.url;
          link.title = item.url;
          link.target = '_blank';
          
          bookmarkItem.appendChild(link);
          extraItemsFragment.appendChild(bookmarkItem);
        }
        
        // 鎻掑叆棰濆涔︾
        categoryElement.insertBefore(extraItemsFragment, this);
        
        // 鏇存柊"鏇村"椤规枃鏈拰鐘舵€?        this.textContent = "鎶樺彔";
        this.expanded = true;
      };
      
      itemsFragment.appendChild(moreItem);
    }
    
    categoryElement.appendChild(itemsFragment);
    fragment.appendChild(categoryElement);
  }
  
  resultsContainer.appendChild(fragment);
  
  // 濡傛灉杩樻湁鏇村绫诲埆鏈樉绀猴紝娣诲姞"鏌ョ湅鏇村绫诲埆"鎸夐挳
  if (allCategories.length > maxCategories && maxCategories !== Infinity) {
    const viewMoreButton = document.createElement('button');
    viewMoreButton.className = 'btn';
    viewMoreButton.textContent = `鏌ョ湅鍓╀綑 ${allCategories.length - maxCategories} 涓被鍒玚;
    viewMoreButton.onclick = () => displayCategories(categories);
    
    resultsContainer.appendChild(viewMoreButton);
  }
  
  addLogEntry(`鍒嗙被缁撴灉鏄剧ず瀹屾垚`, 'success');
}

// 浼樺寲涓烘祻瑙堝櫒鏍囩椤电粨鏋?async function optimizeForBrowserTabs(categories) {
  if (Object.keys(categories).length === 0) {
    showStatus('璇峰厛鍒嗘瀽涔︾', 'error');
    return;
  }
  
  // 纭鎿嶄綔
  if (!confirm('姝ゆ搷浣滃皢閲嶆柊缁勭粐鍒嗙被锛屽垱寤烘洿绗﹀悎娴忚鍣ㄦ爣绛鹃〉缁撴瀯鐨勫垎缁勩€傛槸鍚︾户缁紵')) {
    return;
  }
  
  addLogEntry('姝ｅ湪浼樺寲鍒嗙被缁撴瀯涓烘祻瑙堝櫒鏍囩椤?..', 'info');
  showLoading(true);
  
  try {
    // 榛樿鏍囩椤垫暟閲忥紝閫氬父娴忚鍣ㄦ湁7-8涓爣绛鹃〉
    const TARGET_TAB_COUNT = 7;
    
    // 鏍规嵁鍐呭鐩镐技鎬у皢鐜版湁鍒嗙被鏁村悎鎴愮害7涓ぇ鍒嗙被
    const primaryCategories = [
      {name: "宸ヤ綔涓庣敓浜у姏", patterns: ["宸ヤ綔", "鍔炲叕", "鏂囨。", "鐢熶骇鍔?, "鏁堢巼", "绠＄悊", "浼氳", "閭", "鍗忎綔"]},
      {name: "鎶€鏈笌寮€鍙?, patterns: ["鎶€鏈?, "缂栫▼", "寮€鍙?, "浠ｇ爜", "绋嬪簭", "璁捐", "鍗氬", "github", "stack"]},
      {name: "瀛︿範涓庢暀鑲?, patterns: ["瀛︿範", "鏁欒偛", "璇剧▼", "鍩硅", "鐭ヨ瘑", "鏁欑▼", "瀛︽牎", "鐮旂┒", "绉戝"]},
      {name: "濞变箰涓庝紤闂?, patterns: ["濞变箰", "瑙嗛", "闊充箰", "娓告垙", "鐢靛奖", "鐢佃", "鍔ㄦ极", "鐩存挱", "浣撹偛"]},
      {name: "绀句氦涓庡獟浣?, patterns: ["绀句氦", "濯掍綋", "鏂伴椈", "璧勮", "璁哄潧", "绀惧尯", "寰崥", "鏈嬪弸", "浜ゅ弸"]},
      {name: "璐墿涓庢秷璐?, patterns: ["璐墿", "鐢靛晢", "娑堣垂", "鍟嗗煄", "缃戣喘", "浼樻儬", "鍥㈣喘", "搴楅摵", "鍟嗗搧"]},
      {name: "鐢熸椿涓庢湇鍔?, patterns: ["鐢熸椿", "鏈嶅姟", "椁愰ギ", "缇庨", "鏃呮父", "鍑鸿", "鍋ュ悍", "鍖荤枟", "閾惰"]}
    ];
    
    // 鍒涘缓鏂扮殑鍒嗙被缁撴瀯
    const optimizedCategories = {};
    primaryCategories.forEach(pc => {
      optimizedCategories[pc.name] = [];
    });
    optimizedCategories["鍏朵粬"] = []; // 榛樿鍏滃簳鍒嗙被
    
    // 灏嗘墍鏈変功绛惧垎閰嶅埌鏂扮殑鍒嗙被涓?    for (const [category, bookmarks] of Object.entries(categories)) {
      // 涓哄綋鍓嶅垎绫绘壘鍒版渶鍖归厤鐨勪富鍒嗙被
      let bestMatch = null;
      let highestScore = 0;
      
      // 璁＄畻褰撳墠鍒嗙被涓庢瘡涓富鍒嗙被鐨勫尮閰嶅害
      for (const pc of primaryCategories) {
        let score = 0;
        // 鍒嗙被鍚嶇О鍖归厤
        for (const pattern of pc.patterns) {
          if (category.toLowerCase().includes(pattern)) {
            score += 3;  // 鍒嗙被鍚嶅尮閰嶆潈閲嶉珮
            break;
          }
        }
        
        // 涔︾鍐呭鍖归厤
        for (const bookmark of bookmarks) {
          const title = bookmark.title?.toLowerCase() || '';
          const url = bookmark.url?.toLowerCase() || '';
          
          for (const pattern of pc.patterns) {
            if (title.includes(pattern) || url.includes(pattern)) {
              score += 1;  // 姣忎釜涔︾鍖归厤鍔?鍒?            }
          }
        }
        
        // 鏇存柊鏈€浣冲尮閰?        if (score > highestScore) {
          highestScore = score;
          bestMatch = pc.name;
        }
      }
      
      // 鍒嗛厤涔︾
      if (bestMatch && highestScore > 0) {
        optimizedCategories[bestMatch] = optimizedCategories[bestMatch].concat(bookmarks);
      } else {
        optimizedCategories["鍏朵粬"] = optimizedCategories["鍏朵粬"].concat(bookmarks);
      }
    }
    
    // 绉婚櫎绌哄垎绫?    Object.keys(optimizedCategories).forEach(key => {
      if (optimizedCategories[key].length === 0) {
        delete optimizedCategories[key];
      }
    });
    
    // 淇濆瓨浼樺寲鍚庣殑鍒嗙被
    categories = optimizedCategories;
    
    // 鏇存柊鍘嗗彶鐗堟湰
    await saveBookmarkHistory('娴忚鍣ㄦ爣绛鹃〉浼樺寲');
    
    // 鏄剧ず浼樺寲鍚庣殑鍒嗙被
    displayCategories(categories);
    
    // 鏇存柊鐘舵€?    showStatus(`宸蹭紭鍖栦负${Object.keys(categories).length}涓富瑕佸垎绫伙紝鏇寸鍚堟祻瑙堝櫒鏍囩椤电粨鏋刞, 'success');
    addLogEntry(`浼樺寲瀹屾垚锛屽凡灏嗕功绛鹃噸缁勪负${Object.keys(categories).length}涓富瑕佸垎绫籤, 'success');
  } catch (error) {
    console.error('浼樺寲鍒嗙被缁撴瀯澶辫触:', error);
    showStatus(`浼樺寲澶辫触: ${error.message}`, 'error');
    addLogEntry(`浼樺寲鍒嗙被缁撴瀯澶辫触: ${error.message}`, 'error');
  } finally {
    showLoading(false);
  }
}

// 鏁寸悊涔︾
async function organizeBookmarks() {
  if (Object.keys(categories).length === 0) {
    showStatus('璇峰厛鍒嗘瀽涔︾', 'error');
    addLogEntry('鏃犳硶鏁寸悊涔︾锛氳鍏堣繘琛屽垎鏋?, 'error');
    return;
  }
  
  addLogEntry('寮€濮嬫暣鐞嗕功绛惧埌鏂囦欢澶?..', 'info');
  showLoading(true);
  showProgress(true);
  showStatus('姝ｅ湪鏁寸悊涔︾...');
  
  try {
    // 鑾峰彇"鍏朵粬涔︾"鏂囦欢澶笽D
    const otherBookmarksId = '2';
    addLogEntry(`鐩爣鏂囦欢澶癸細"鍏朵粬涔︾" (ID: ${otherBookmarksId})`, 'info');
    
    let organizedCount = 0;
    const totalCount = Object.values(categories).reduce((sum, items) => sum + items.length, 0);
    addLogEntry(`鎬诲叡闇€瑕佹暣鐞?${totalCount} 涓功绛惧埌 ${Object.keys(categories).length} 涓垎绫绘枃浠跺す`, 'info');
    
    // 瀵规瘡涓垎绫诲垱寤烘枃浠跺す
    for (const category of Object.keys(categories)) {
      // 鍒涘缓鍒嗙被鏂囦欢澶?      addLogEntry(`姝ｅ湪鍒涘缓/妫€鏌ュ垎绫绘枃浠跺す: "${category}"`, 'info');
      const categoryFolder = await createBookmarkFolder(category, otherBookmarksId);
      addLogEntry(`鍒嗙被鏂囦欢澶?"${category}" 宸插氨缁?(ID: ${categoryFolder.id})`, 'success');
      
      // 绉诲姩涔︾鍒板搴旀枃浠跺す
      const itemsInCategory = categories[category].length;
      addLogEntry(`寮€濮嬬Щ鍔?${itemsInCategory} 涓功绛惧埌 "${category}" 鏂囦欢澶筦, 'info');
      
      for (const bookmark of categories[category]) {
        // 鏌ユ壘涔︾鍘熷ID
        const originalBookmark = bookmarks.find(b => b.url === bookmark.url && b.title === bookmark.title);
        
        if (originalBookmark) {
          await moveBookmark(originalBookmark.id, categoryFolder.id);
          organizedCount++;
          
          // 鏇存柊杩涘害鏉?          updateProgress(organizedCount, totalCount);
          
          // 姣忔暣鐞?0涓功绛炬洿鏂颁竴娆＄姸鎬?          if (organizedCount % 10 === 0) {
            showStatus(`姝ｅ湪鏁寸悊涔︾...${organizedCount}/${totalCount}`);
            addLogEntry(`宸叉暣鐞?${organizedCount}/${totalCount} 涓功绛綻, 'info');
          }
        } else {
          addLogEntry(`璀﹀憡锛氭棤娉曟壘鍒颁功绛?"${bookmark.title}" 鐨勫師濮婭D`, 'warning');
        }
      }
      
      addLogEntry(`瀹屾垚 "${category}" 绫诲埆鐨勬暣鐞哷, 'success');
    }
    
    showStatus(`涔︾鏁寸悊瀹屾垚锛佸叡鏁寸悊 ${organizedCount} 涓功绛惧埌 ${Object.keys(categories).length} 涓垎绫绘枃浠跺す`, 'success');
    addLogEntry(`===============================`, 'success');
    addLogEntry(`鏁寸悊瀹屾垚锛佸叡鏁寸悊 ${organizedCount}/${totalCount} 涓功绛惧埌 ${Object.keys(categories).length} 涓垎绫绘枃浠跺す`, 'success');
    addLogEntry(`===============================`, 'success');
    
    // 淇濆瓨鍘嗗彶鐗堟湰
    await saveBookmarkHistory('鏁寸悊鍚?);
    
  } catch (error) {
    console.error('鏁寸悊涔︾鏃跺嚭閿?', error);
    showStatus(`鏁寸悊鍑洪敊: ${error.message}`, 'error');
    addLogEntry(`鏁寸悊鍑洪敊: ${error.message}`, 'error');
  } finally {
    showLoading(false);
    showProgress(false);
  }
}

// 鍒涘缓涔︾鏂囦欢澶?function createBookmarkFolder(title, parentId) {
  return new Promise((resolve, reject) => {
    // 鍏堟鏌ユ槸鍚﹀凡瀛樺湪鍚屽悕鏂囦欢澶?    chrome.bookmarks.getChildren(parentId, (children) => {
      const existingFolder = children.find(child => 
        child.title === title && !child.url
      );
      
      if (existingFolder) {
        resolve(existingFolder);
      } else {
        // 鍒涘缓鏂版枃浠跺す
        chrome.bookmarks.create({
          parentId: parentId,
          title: title
        }, (newFolder) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(newFolder);
          }
        });
      }
    });
  });
}

// 绉诲姩涔︾
function moveBookmark(bookmarkId, newParentId) {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.move(bookmarkId, { parentId: newParentId }, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(result);
      }
    });
  });
}

// 瀵煎嚭鍒嗙被缁撴灉涓篊SV鏂囦欢
function exportBookmarks() {
  if (Object.keys(categories).length === 0) {
    showStatus('璇峰厛鍒嗘瀽涔︾', 'error');
    addLogEntry('鏃犳硶瀵煎嚭锛氳鍏堣繘琛屽垎鏋?, 'error');
    return;
  }
  
  addLogEntry('寮€濮嬪鍑哄垎绫荤粨鏋滀负CSV鏂囦欢...', 'info');
  
  try {
    // 鍒涘缓CSV鍐呭
    let csvContent = '绫诲埆,鏍囬,URL\n';
    let totalRows = 0;
    
    for (const [category, items] of Object.entries(categories)) {
      addLogEntry(`姝ｅ湪澶勭悊"${category}"绫诲埆 (${items.length}涓功绛?...`, 'info');
      
      for (const item of items) {
        // 澶勭悊CSV鐗规畩瀛楃
        const safeTitle = item.title ? `"${item.title.replace(/"/g, '""')}"` : '';
        const safeUrl = `"${item.url.replace(/"/g, '""')}"`;
        
        csvContent += `"${category}",${safeTitle},${safeUrl}\n`;
        totalRows++;
      }
    }
    
    addLogEntry(`CSV鍐呭鍑嗗瀹屾垚锛屾€诲叡 ${totalRows} 琛屾暟鎹甡, 'success');
    
    // 鍒涘缓涓嬭浇閾炬帴
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // 璁剧疆涓嬭浇灞炴€?    const fileName = `涔︾鍒嗙被_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.display = 'none';
    
    // 娣诲姞鍒癉OM, 瑙﹀彂涓嬭浇, 鐒跺悗绉婚櫎
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addLogEntry(`CSV鏂囦欢"${fileName}"涓嬭浇宸插紑濮媊, 'success');
    showStatus('CSV鏂囦欢瀵煎嚭鎴愬姛', 'success');
  } catch (error) {
    console.error('瀵煎嚭CSV鏃跺嚭閿?', error);
    addLogEntry(`瀵煎嚭CSV澶辫触: ${error.message}`, 'error');
    showStatus('瀵煎嚭澶辫触', 'error');
  }
}

// 鏄剧ず鐘舵€佷俊鎭?function showStatus(message, type = '') {
  const statusElement = document.getElementById('status');
  statusElement.textContent = message;
  statusElement.style.display = 'block';
  
  // 娓呴櫎鎵€鏈夌被
  statusElement.className = 'status';
  
  // 娣诲姞绫诲瀷绫?  if (type) {
    statusElement.classList.add(type);
  }
}

// 鏄剧ず/闅愯棌鍔犺浇鎸囩ず鍣?function showLoading(show) {
  document.getElementById('loading').style.display = show ? 'block' : 'none';
}

// 鏄剧ず/闅愯棌杩涘害鏉?function showProgress(show) {
  const progressElement = document.getElementById('progress');
  
  if (show) {
    progressElement.style.display = 'block';
    // 閲嶇疆杩涘害鏉?    document.getElementById('progress-bar').style.width = '0%';
  } else {
    progressElement.style.display = 'none';
  }
}

// 淇濆瓨涔︾鍒嗙被鍘嗗彶鐗堟湰
async function saveBookmarkHistory(suffix = '') {
  try {
    const timestamp = Date.now();
    const historyId = `history_${timestamp}`;
    
    // 鍒涘缓鐗堟湰鎻忚堪
    const categoryCount = Object.keys(categories).length;
    const description = `${totalBookmarksCount}涓功绛惧垎涓?{categoryCount}涓被鍒?{suffix ? ` (${suffix})` : ''}`;
    
    // 鏋勫缓鍘嗗彶璁板綍瀵硅薄
    const historyEntry = {
      id: historyId,
      timestamp,
      description,
      categories: JSON.parse(JSON.stringify(categories)),
      bookmarkCount: totalBookmarksCount,
      dateString: new Date(timestamp).toLocaleString()
    };
    
    // 鑾峰彇鐜版湁鍘嗗彶璁板綍
    const result = await chrome.storage.local.get('bookmarkHistory');
    const history = result.bookmarkHistory || [];
    
    // 娣诲姞鏂扮増鏈苟淇濆瓨
    history.unshift(historyEntry);
    
    // 闄愬埗鍘嗗彶璁板綍鏁伴噺锛堜繚鐣欐渶杩?0鏉★級
    const limitedHistory = history.slice(0, 10);
    
    await chrome.storage.local.set({ bookmarkHistory: limitedHistory });
    addLogEntry(`鍘嗗彶鐗堟湰宸蹭繚瀛? ${description}`, 'success');
  } catch (error) {
    console.error('淇濆瓨鍘嗗彶鐗堟湰澶辫触:', error);
    addLogEntry(`淇濆瓨鍘嗗彶鐗堟湰澶辫触: ${error.message}`, 'error');
  }
}

// 鎵撳紑鍘嗗彶鐗堟湰椤甸潰
function openHistoryPage() {
  chrome.tabs.create({ url: 'history.html' });
}

// 鐢熸垚鍙鍖栧浘琛?function generateVisualizations() {
  setTimeout(() => {
    try {
      // 鏄剧ず鍙鍖栧鍣?      document.querySelector('.visualization-container').classList.remove('hidden');
      
      let successCount = 0;
      let totalAttempts = 3;
      
      // 妫€鏌hart.js鏄惁鍙敤
      if (typeof Chart === 'undefined') {
        addLogEntry('Chart.js搴撴湭鍔犺浇锛岃烦杩囬ゼ鍥剧敓鎴?, 'warning');
      } else {
        try {
          // 鐢熸垚楗煎浘
          generateCategoryPieChart();
          successCount++;
          addLogEntry('楗煎浘鐢熸垚鎴愬姛', 'success');
        } catch (chartError) {
          addLogEntry(`楗煎浘鐢熸垚澶辫触: ${chartError.message}`, 'error');
        }
      }
      
      // 妫€鏌3鏄惁鍙敤
      if (typeof d3 === 'undefined') {
        addLogEntry('D3.js搴撴湭鍔犺浇锛岃烦杩囨爲褰㈠浘鐢熸垚', 'warning');
      } else {
        try {
          // 鐢熸垚鏍戝舰鍥?          generateCategoryTreeView();
          successCount++;
          addLogEntry('鏍戝舰鍥剧敓鎴愭垚鍔?, 'success');
        } catch (d3Error) {
          addLogEntry(`鏍戝舰鍥剧敓鎴愬け璐? ${d3Error.message}`, 'error');
        }
      }
      
      // 鐢熸垚鏍囩浜戯紙涓嶄緷璧栧閮ㄥ簱锛?      try {
        generateTagCloud();
        successCount++;
        addLogEntry('鏍囩浜戠敓鎴愭垚鍔?, 'success');
      } catch (tagCloudError) {
        addLogEntry(`鏍囩浜戠敓鎴愬け璐? ${tagCloudError.message}`, 'error');
      }
      
      if (successCount > 0) {
        addLogEntry(`鍙鍖栧浘琛ㄧ敓鎴愬畬鎴愶紝鎴愬姛鐢熸垚 ${successCount}/${totalAttempts} 涓浘琛╜, 'success');
      } else {
        addLogEntry('鎵€鏈夊彲瑙嗗寲鍥捐〃鐢熸垚鍧囧け璐?, 'error');
        // 鏄剧ず涓€涓畝鍗曠殑鏂囨湰缁熻浣滀负澶囩敤
        showSimpleStatistics();
      }
      
    } catch (error) {
      console.error('鐢熸垚鍙鍖栧浘琛ㄥけ璐?', error);
      addLogEntry(`鐢熸垚鍙鍖栧浘琛ㄥけ璐? ${error.message}`, 'error');
      
      // 鏄剧ず绠€鍗曠粺璁′綔涓哄鐢?      showSimpleStatistics();
    }
  }, 500);
}

// 鏄剧ず绠€鍗曠殑鏂囨湰缁熻锛堝鐢ㄦ柟妗堬級
function showSimpleStatistics() {
  try {
    const container = document.querySelector('.visualization-content');
    if (!container) return;
    
    // 鍒涘缓绠€鍗曠粺璁￠潰鏉?    const statsDiv = document.createElement('div');
    statsDiv.innerHTML = `
      <h3>涔︾鍒嗙被缁熻</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px;">
        ${Object.entries(categories)
          .sort((a, b) => b[1].length - a[1].length)
          .slice(0, 10)
          .map(([category, items]) => `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #4285f4;">
              <div style="font-weight: bold; color: #1a73e8; margin-bottom: 5px;">${category}</div>
              <div style="font-size: 24px; font-weight: bold; color: #34a853;">${items.length}</div>
              <div style="font-size: 12px; color: #5f6368;">涓功绛?/div>
            </div>
          `).join('')}
      </div>
    `;
    
    // 鏇挎崲鍙鍖栧唴瀹?    container.innerHTML = '';
    container.appendChild(statsDiv);
    
    addLogEntry('鏄剧ず绠€鍗曟枃鏈粺璁′綔涓哄鐢ㄦ柟妗?, 'info');
  } catch (error) {
    addLogEntry(`澶囩敤缁熻鏄剧ず澶辫触: ${error.message}`, 'error');
  }
}

// 鍒囨崲鍙鍖栭€夐」鍗?function switchVisualizationTab(event) {
  // 绉婚櫎鎵€鏈夋爣绛鹃〉鍜屽唴瀹圭殑active绫?  document.querySelectorAll('.viz-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.viz-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  
  // 璁剧疆褰撳墠鏍囩椤典负active
  event.target.classList.add('active');
  
  // 鏄剧ず瀵瑰簲鐨勫唴瀹归潰鏉?  const tabName = event.target.dataset.tab;
  document.getElementById(`${tabName}-container`).classList.add('active');
}

// ======== 涔︾妫€娴嬪姛鑳?========

// 妫€娴嬮噸澶嶄功绛?async function detectDuplicateBookmarks() {
  addLogEntry('寮€濮嬫娴嬮噸澶嶄功绛?..', 'info');
  showLoading(true);
  showStatus('姝ｅ湪妫€娴嬮噸澶嶄功绛?..');
  
  try {
    // 鑾峰彇鎵€鏈変功绛?    const allBookmarks = await getAllBookmarks();
    addLogEntry(`鑾峰彇鍒?${allBookmarks.length} 涓功绛撅紝寮€濮嬪垎鏋愰噸澶嶉」`, 'info');
    
    // 鎸塙RL鍒嗙粍妫€娴嬮噸澶?    const urlGroups = {};
    const titleGroups = {};
    
    allBookmarks.forEach(bookmark => {
      // 鎸塙RL鍒嗙粍
      const normalizedUrl = normalizeUrl(bookmark.url);
      if (!urlGroups[normalizedUrl]) {
        urlGroups[normalizedUrl] = [];
      }
      urlGroups[normalizedUrl].push(bookmark);
      
      // 鎸夋爣棰樺垎缁勶紙鐢ㄤ簬妫€娴嬪彲鑳界殑閲嶅锛?      const normalizedTitle = bookmark.title.toLowerCase().trim();
      if (normalizedTitle && normalizedTitle.length > 3) {
        if (!titleGroups[normalizedTitle]) {
          titleGroups[normalizedTitle] = [];
        }
        titleGroups[normalizedTitle].push(bookmark);
      }
    });
    
    // 鎵惧嚭閲嶅椤?    const duplicateGroups = [];
    
    // URL閲嶅
    Object.entries(urlGroups).forEach(([url, bookmarks]) => {
      if (bookmarks.length > 1) {
        duplicateGroups.push({
          type: 'url',
          key: url,
          bookmarks: bookmarks,
          reason: 'URL鐩稿悓'
        });
      }
    });
    
    // 鏍囬閲嶅锛堟帓闄ゅ凡缁忓湪URL閲嶅涓殑锛?    Object.entries(titleGroups).forEach(([title, bookmarks]) => {
      if (bookmarks.length > 1) {
        // 妫€鏌ユ槸鍚﹀凡缁忓湪URL閲嶅缁勪腑
        const urls = bookmarks.map(b => normalizeUrl(b.url));
        const isAlreadyDetected = duplicateGroups.some(group => 
          group.type === 'url' && urls.some(url => url === group.key)
        );
        
        if (!isAlreadyDetected) {
          duplicateGroups.push({
            type: 'title',
            key: title,
            bookmarks: bookmarks,
            reason: '鏍囬鐩稿悓'
          });
        }
      }
    });
    
    addLogEntry(`妫€娴嬪畬鎴愶紝鍙戠幇 ${duplicateGroups.length} 缁勯噸澶嶄功绛綻, 'success');
    
    // 鏄剧ず妫€娴嬬粨鏋?    displayDuplicateResults(duplicateGroups);
    showStatus(`妫€娴嬪畬鎴愶紝鍙戠幇 ${duplicateGroups.length} 缁勯噸澶嶄功绛綻, 'success');
    
  } catch (error) {
    console.error('妫€娴嬮噸澶嶄功绛惧け璐?', error);
    addLogEntry(`妫€娴嬮噸澶嶄功绛惧け璐? ${error.message}`, 'error');
    showStatus(`妫€娴嬪け璐? ${error.message}`, 'error');
  } finally {
    showLoading(false);
  }
}

// 鏍囧噯鍖朥RL锛堝幓闄ゆ煡璇㈠弬鏁般€侀敋鐐圭瓑锛?function normalizeUrl(url) {
  try {
    const urlObj = new URL(url);
    // 绉婚櫎www鍓嶇紑
    let hostname = urlObj.hostname.replace(/^www\./, '');
    // 绉婚櫎灏鹃殢鏂滄潬
    let pathname = urlObj.pathname.replace(/\/$/, '') || '/';
    
    return `${urlObj.protocol}//${hostname}${pathname}`;
  } catch (e) {
    return url.toLowerCase().trim();
  }
}

// 鏄剧ず閲嶅涔︾妫€娴嬬粨鏋?function displayDuplicateResults(duplicateGroups) {
  const container = document.getElementById('detection-container');
  const duplicateResults = document.getElementById('duplicate-results');
  const duplicateList = document.getElementById('duplicate-list');
  
  container.classList.remove('hidden');
  
  if (duplicateGroups.length === 0) {
    duplicateResults.classList.add('hidden');
    return;
  }
  
  duplicateResults.classList.remove('hidden');
  duplicateList.innerHTML = '';
  
  let totalDuplicates = 0;
  
  duplicateGroups.forEach((group, groupIndex) => {
    const groupElement = document.createElement('div');
    groupElement.className = 'duplicate-group';
    
    const groupHeader = document.createElement('div');
    groupHeader.className = 'duplicate-group-header';
    groupHeader.textContent = `${group.reason} - ${group.bookmarks.length} 涓噸澶嶉」`;
    groupElement.appendChild(groupHeader);
    
    group.bookmarks.forEach((bookmark, index) => {
      const item = document.createElement('div');
      item.className = 'detection-item';
      
      // 璺宠繃绗竴涓紙淇濈暀鍘熷锛夛紝鍏朵綑鏍囪涓洪噸澶?      const isDuplicate = index > 0;
      if (isDuplicate) {
        totalDuplicates++;
      }
      
      item.innerHTML = `
        <input type="checkbox" class="detection-checkbox" 
               data-type="duplicate" 
               data-id="${bookmark.id}" 
               ${isDuplicate ? 'checked' : 'disabled'}>
        <div class="detection-info">
          <div class="detection-title">${bookmark.title || '鏃犳爣棰?}</div>
          <div class="detection-url">${bookmark.url}</div>
          <div class="detection-meta">
            ${isDuplicate ? '馃搫 閲嶅椤? : '鉁?鍘熷椤?} | 
            ID: ${bookmark.id} | 
            鐖舵枃浠跺す: ${bookmark.parentId}
          </div>
        </div>
      `;
      
      groupElement.appendChild(item);
    });
    
    duplicateList.appendChild(groupElement);
  });
  
  // 鏄剧ず鎿嶄綔鎸夐挳
  document.getElementById('remove-duplicates').classList.remove('hidden');
  document.getElementById('select-all-duplicates').classList.remove('hidden');
  document.getElementById('deselect-all-duplicates').classList.remove('hidden');
  
  addLogEntry(`鏄剧ず閲嶅妫€娴嬬粨鏋滐細${duplicateGroups.length} 缁勶紝鍏?${totalDuplicates} 涓噸澶嶉」`, 'info');
}

// 妫€娴嬪け鏁堜功绛?async function detectInvalidBookmarks() {
  addLogEntry('寮€濮嬫娴嬪け鏁堜功绛?..', 'info');
  showLoading(true);
  showStatus('姝ｅ湪妫€娴嬪け鏁堜功绛?..');
  
  try {
    // 鑾峰彇鎵€鏈変功绛?    const allBookmarks = await getAllBookmarks();
    addLogEntry(`鑾峰彇鍒?${allBookmarks.length} 涓功绛撅紝寮€濮嬫娴嬪け鏁堥摼鎺, 'info');
    
    const invalidBookmarks = [];
    const batchSize = 10; // 骞跺彂妫€娴嬫暟閲?    let checkedCount = 0;
    
    // 鍒嗘壒妫€娴嬩功绛炬湁鏁堟€?    for (let i = 0; i < allBookmarks.length; i += batchSize) {
      const batch = allBookmarks.slice(i, i + batchSize);
      
      // 骞跺彂妫€娴嬪綋鍓嶆壒娆?      const batchPromises = batch.map(async (bookmark) => {
        try {
          const isValid = await checkBookmarkValidity(bookmark.url);
          checkedCount++;
          
          // 鏇存柊杩涘害
          if (checkedCount % 20 === 0) {
            showStatus(`姝ｅ湪妫€娴嬪け鏁堜功绛?.. ${checkedCount}/${allBookmarks.length}`);
            addLogEntry(`宸叉娴?${checkedCount}/${allBookmarks.length} 涓功绛綻, 'info');
          }
          
          if (!isValid) {
            invalidBookmarks.push(bookmark);
          }
        } catch (error) {
          addLogEntry(`妫€娴嬩功绛?"${bookmark.title}" 鏃跺嚭閿? ${error.message}`, 'warning');
          // 妫€娴嬪嚭閿欑殑涔熻涓哄彲鑳藉け鏁?          invalidBookmarks.push(bookmark);
        }
      });
      
      await Promise.all(batchPromises);
      
      // 鎵规闂寸◢浣滃欢杩燂紝閬垮厤杩囦簬棰戠箒鐨勮姹?      if (i + batchSize < allBookmarks.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    addLogEntry(`妫€娴嬪畬鎴愶紝鍙戠幇 ${invalidBookmarks.length} 涓け鏁堜功绛綻, 'success');
    
    // 鏄剧ず妫€娴嬬粨鏋?    displayInvalidResults(invalidBookmarks);
    showStatus(`妫€娴嬪畬鎴愶紝鍙戠幇 ${invalidBookmarks.length} 涓け鏁堜功绛綻, 'success');
    
  } catch (error) {
    console.error('妫€娴嬪け鏁堜功绛惧け璐?', error);
    addLogEntry(`妫€娴嬪け鏁堜功绛惧け璐? ${error.message}`, 'error');
    showStatus(`妫€娴嬪け璐? ${error.message}`, 'error');
  } finally {
    showLoading(false);
  }
}

// 妫€鏌ュ崟涓功绛剧殑鏈夋晥鎬?async function checkBookmarkValidity(url) {
  return new Promise((resolve) => {
    // 璁剧疆瓒呮椂鏃堕棿
    const timeout = 10000; // 10绉掕秴鏃?    
    const timeoutId = setTimeout(() => {
      resolve(false); // 瓒呮椂瑙嗕负澶辨晥
    }, timeout);
    
    // 浣跨敤fetch妫€娴婾RL鍙闂€?    fetch(url, {
      method: 'HEAD', // 鍙幏鍙栧ご閮ㄤ俊鎭紝鍑忓皯鏁版嵁浼犺緭
      mode: 'no-cors', // 閬垮厤CORS闂
      cache: 'no-cache'
    })
    .then(response => {
      clearTimeout(timeoutId);
      // 瀵逛簬no-cors妯″紡锛宺esponse.ok鍙兘涓嶅噯纭紝鎵€浠ユ鏌ype
      resolve(response.type !== 'error');
    })
    .catch(error => {
      clearTimeout(timeoutId);
      // 缃戠粶閿欒鎴栧叾浠栭棶棰?      resolve(false);
    });
  });
}

// 鏄剧ず澶辨晥涔︾妫€娴嬬粨鏋?function displayInvalidResults(invalidBookmarks) {
  const container = document.getElementById('detection-container');
  const invalidResults = document.getElementById('invalid-results');
  const invalidList = document.getElementById('invalid-list');
  
  container.classList.remove('hidden');
  
  if (invalidBookmarks.length === 0) {
    invalidResults.classList.add('hidden');
    return;
  }
  
  invalidResults.classList.remove('hidden');
  invalidList.innerHTML = '';
  
  invalidBookmarks.forEach(bookmark => {
    const item = document.createElement('div');
    item.className = 'detection-item';
    
    item.innerHTML = `
      <input type="checkbox" class="detection-checkbox" 
             data-type="invalid" 
             data-id="${bookmark.id}" 
             checked>
      <div class="detection-info">
        <div class="detection-title">${bookmark.title || '鏃犳爣棰?}</div>
        <div class="detection-url">${bookmark.url}</div>
        <div class="detection-meta">
          鉂?澶辨晥閾炬帴 | 
          ID: ${bookmark.id} | 
          鐖舵枃浠跺す: ${bookmark.parentId}
        </div>
      </div>
    `;
    
    invalidList.appendChild(item);
  });
  
  // 鏄剧ず鎿嶄綔鎸夐挳
  document.getElementById('remove-invalid').classList.remove('hidden');
  document.getElementById('select-all-invalid').classList.remove('hidden');
  document.getElementById('deselect-all-invalid').classList.remove('hidden');
  
  addLogEntry(`鏄剧ず澶辨晥妫€娴嬬粨鏋滐細${invalidBookmarks.length} 涓け鏁堜功绛綻, 'info');
}

// 娓呯悊涔︾锛堟娴嬬┖鏂囦欢澶癸級
async function cleanupBookmarks() {
  addLogEntry('寮€濮嬫竻鐞嗕功绛撅紝妫€娴嬬┖鏂囦欢澶?..', 'info');
  showLoading(true);
  showStatus('姝ｅ湪妫€娴嬬┖鏂囦欢澶?..');
  
  try {
    // 鑾峰彇涔︾鏍?    const bookmarkTree = await new Promise((resolve) => {
      chrome.bookmarks.getTree(resolve);
    });
    
    const emptyFolders = [];
    
    // 閫掑綊妫€鏌ョ┖鏂囦欢澶?    function checkEmptyFolders(node) {
      if (!node.url && node.children) {
        // 杩欐槸涓€涓枃浠跺す
        const hasBookmarks = node.children.some(child => child.url);
        const hasNonEmptySubfolders = node.children.some(child => 
          !child.url && child.children && child.children.length > 0
        );
        
        if (!hasBookmarks && !hasNonEmptySubfolders && node.children.length === 0) {
          // 绌烘枃浠跺す
          emptyFolders.push(node);
        }
        
        // 閫掑綊妫€鏌ュ瓙鏂囦欢澶?        node.children.forEach(checkEmptyFolders);
      }
    }
    
    bookmarkTree.forEach(checkEmptyFolders);
    
    addLogEntry(`妫€娴嬪畬鎴愶紝鍙戠幇 ${emptyFolders.length} 涓┖鏂囦欢澶筦, 'success');
    
    // 鏄剧ず妫€娴嬬粨鏋?    displayEmptyFolderResults(emptyFolders);
    showStatus(`妫€娴嬪畬鎴愶紝鍙戠幇 ${emptyFolders.length} 涓┖鏂囦欢澶筦, 'success');
    
  } catch (error) {
    console.error('娓呯悊涔︾澶辫触:', error);
    addLogEntry(`娓呯悊涔︾澶辫触: ${error.message}`, 'error');
    showStatus(`娓呯悊澶辫触: ${error.message}`, 'error');
  } finally {
    showLoading(false);
  }
}

// 鏄剧ず绌烘枃浠跺す妫€娴嬬粨鏋?function displayEmptyFolderResults(emptyFolders) {
  const container = document.getElementById('detection-container');
  const emptyFolderResults = document.getElementById('empty-folders-results');
  const emptyFolderList = document.getElementById('empty-folders-list');
  
  container.classList.remove('hidden');
  
  if (emptyFolders.length === 0) {
    emptyFolderResults.classList.add('hidden');
    return;
  }
  
  emptyFolderResults.classList.remove('hidden');
  emptyFolderList.innerHTML = '';
  
  emptyFolders.forEach(folder => {
    const item = document.createElement('div');
    item.className = 'detection-item';
    
    item.innerHTML = `
      <input type="checkbox" class="detection-checkbox" 
             data-type="empty-folder" 
             data-id="${folder.id}" 
             checked>
      <div class="detection-info">
        <div class="detection-title">馃搧 ${folder.title || '鏃犳爣棰樻枃浠跺す'}</div>
        <div class="detection-url">绌烘枃浠跺す</div>
        <div class="detection-meta">
          馃梻锔?绌烘枃浠跺す | 
          ID: ${folder.id} | 
          鐖舵枃浠跺す: ${folder.parentId}
        </div>
      </div>
    `;
    
    emptyFolderList.appendChild(item);
  });
  
  // 鏄剧ず鎿嶄綔鎸夐挳
  document.getElementById('remove-empty-folders').classList.remove('hidden');
  document.getElementById('select-all-empty-folders').classList.remove('hidden');
  document.getElementById('deselect-all-empty-folders').classList.remove('hidden');
  
  addLogEntry(`鏄剧ず绌烘枃浠跺す妫€娴嬬粨鏋滐細${emptyFolders.length} 涓┖鏂囦欢澶筦, 'info');
}

// ======== 妫€娴嬬粨鏋滄搷浣滃姛鑳?========

// 绉婚櫎閲嶅涔︾
async function removeDuplicateBookmarks() {
  const selectedItems = document.querySelectorAll('.detection-checkbox[data-type="duplicate"]:checked');
  
  if (selectedItems.length === 0) {
    showStatus('璇烽€夋嫨瑕佸垹闄ょ殑閲嶅涔︾', 'warning');
    return;
  }
  
  if (!confirm(`纭畾瑕佸垹闄?${selectedItems.length} 涓噸澶嶄功绛惧悧锛熸鎿嶄綔涓嶅彲鎾ら攢銆俙)) {
    return;
  }
  
  addLogEntry(`寮€濮嬪垹闄?${selectedItems.length} 涓噸澶嶄功绛?..`, 'info');
  showLoading(true);
  
  try {
    let deletedCount = 0;
    
    for (const item of selectedItems) {
      const bookmarkId = item.dataset.id;
      
      try {
        await new Promise((resolve, reject) => {
          chrome.bookmarks.remove(bookmarkId, () => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve();
            }
          });
        });
        
        deletedCount++;
        item.closest('.detection-item').remove();
        
      } catch (error) {
        addLogEntry(`鍒犻櫎涔︾ ${bookmarkId} 澶辫触: ${error.message}`, 'error');
      }
    }
    
    addLogEntry(`鎴愬姛鍒犻櫎 ${deletedCount} 涓噸澶嶄功绛綻, 'success');
    showStatus(`鎴愬姛鍒犻櫎 ${deletedCount} 涓噸澶嶄功绛綻, 'success');
    
  } catch (error) {
    addLogEntry(`鍒犻櫎閲嶅涔︾澶辫触: ${error.message}`, 'error');
    showStatus(`鍒犻櫎澶辫触: ${error.message}`, 'error');
  } finally {
    showLoading(false);
  }
}

// 绉婚櫎澶辨晥涔︾
async function removeInvalidBookmarks() {
  const selectedItems = document.querySelectorAll('.detection-checkbox[data-type="invalid"]:checked');
  
  if (selectedItems.length === 0) {
    showStatus('璇烽€夋嫨瑕佸垹闄ょ殑澶辨晥涔︾', 'warning');
    return;
  }
  
  if (!confirm(`纭畾瑕佸垹闄?${selectedItems.length} 涓け鏁堜功绛惧悧锛熸鎿嶄綔涓嶅彲鎾ら攢銆俙)) {
    return;
  }
  
  addLogEntry(`寮€濮嬪垹闄?${selectedItems.length} 涓け鏁堜功绛?..`, 'info');
  showLoading(true);
  
  try {
    let deletedCount = 0;
    
    for (const item of selectedItems) {
      const bookmarkId = item.dataset.id;
      
      try {
        await new Promise((resolve, reject) => {
          chrome.bookmarks.remove(bookmarkId, () => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve();
            }
          });
        });
        
        deletedCount++;
        item.closest('.detection-item').remove();
        
      } catch (error) {
        addLogEntry(`鍒犻櫎涔︾ ${bookmarkId} 澶辫触: ${error.message}`, 'error');
      }
    }
    
    addLogEntry(`鎴愬姛鍒犻櫎 ${deletedCount} 涓け鏁堜功绛綻, 'success');
    showStatus(`鎴愬姛鍒犻櫎 ${deletedCount} 涓け鏁堜功绛綻, 'success');
    
  } catch (error) {
    addLogEntry(`鍒犻櫎澶辨晥涔︾澶辫触: ${error.message}`, 'error');
    showStatus(`鍒犻櫎澶辫触: ${error.message}`, 'error');
  } finally {
    showLoading(false);
  }
}

// 绉婚櫎绌烘枃浠跺す
async function removeEmptyFolders() {
  const selectedItems = document.querySelectorAll('.detection-checkbox[data-type="empty-folder"]:checked');
  
  if (selectedItems.length === 0) {
    showStatus('璇烽€夋嫨瑕佸垹闄ょ殑绌烘枃浠跺す', 'warning');
    return;
  }
  
  if (!confirm(`纭畾瑕佸垹闄?${selectedItems.length} 涓┖鏂囦欢澶瑰悧锛熸鎿嶄綔涓嶅彲鎾ら攢銆俙)) {
    return;
  }
  
  addLogEntry(`寮€濮嬪垹闄?${selectedItems.length} 涓┖鏂囦欢澶?..`, 'info');
  showLoading(true);
  
  try {
    let deletedCount = 0;
    
    for (const item of selectedItems) {
      const folderId = item.dataset.id;
      
      try {
        await new Promise((resolve, reject) => {
          chrome.bookmarks.removeTree(folderId, () => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve();
            }
          });
        });
        
        deletedCount++;
        item.closest('.detection-item').remove();
        
      } catch (error) {
        addLogEntry(`鍒犻櫎鏂囦欢澶?${folderId} 澶辫触: ${error.message}`, 'error');
      }
    }
    
    addLogEntry(`鎴愬姛鍒犻櫎 ${deletedCount} 涓┖鏂囦欢澶筦, 'success');
    showStatus(`鎴愬姛鍒犻櫎 ${deletedCount} 涓┖鏂囦欢澶筦, 'success');
    
  } catch (error) {
    addLogEntry(`鍒犻櫎绌烘枃浠跺す澶辫触: ${error.message}`, 'error');
    showStatus(`鍒犻櫎澶辫触: ${error.message}`, 'error');
  } finally {
    showLoading(false);
  }
}

// 閫夋嫨/鍙栨秷閫夋嫨妫€娴嬮」鐩?function selectAllDetectionItems(type, select) {
  const checkboxes = document.querySelectorAll(`.detection-checkbox[data-type="${type}"]`);
  checkboxes.forEach(checkbox => {
    if (!checkbox.disabled) {
      checkbox.checked = select;
    }
  });
  
  addLogEntry(`${select ? '閫夋嫨' : '鍙栨秷閫夋嫨'}浜?${checkboxes.length} 涓?{type}椤圭洰`, 'info');
}

// ======== 涔︾绠＄悊鍣ㄥ姛鑳?========

// 鎵撳紑涔︾绠＄悊鍣?async function openBookmarkManager() {
  addLogEntry('鎵撳紑涔︾绠＄悊鍣?..', 'info');
  showLoading(true);
  
  try {
    // 楠岃瘉娴忚鍣ˋPI鍙敤鎬?    if (!chrome || !chrome.bookmarks) {
      throw new Error('Chrome涔︾API涓嶅彲鐢紝璇锋鏌ユ墿灞曟潈闄?);
    }
    
    addLogEntry('Chrome涔︾API楠岃瘉閫氳繃', 'success');
    
    // 鍔犺浇涔︾鏍?    await loadBookmarkTree();
    
    // 楠岃瘉鏁版嵁瀹屾暣鎬?    if (!bookmarkTreeData || bookmarkTreeData.length === 0) {
      throw new Error('鏈幏鍙栧埌涔︾鏁版嵁鎴栦功绛炬暟鎹负绌?);
    }
    
    addLogEntry(`涔︾鏁版嵁楠岃瘉閫氳繃锛屽寘鍚?${bookmarkTreeData.length} 涓牴鑺傜偣`, 'success');
    
    // 鏄剧ず涔︾绠＄悊鍣ㄥ鍣?    const container = document.getElementById('bookmark-manager-container');
    if (!container) {
      throw new Error('鎵句笉鍒颁功绛剧鐞嗗櫒瀹瑰櫒鍏冪礌');
    }
    
    container.classList.remove('hidden');
    addLogEntry('涔︾绠＄悊鍣ㄥ鍣ㄦ樉绀烘垚鍔?, 'success');
    
    // 娓叉煋涔︾鏍?    renderBookmarkTree();
    
    // 楠岃瘉娓叉煋缁撴灉
    const treeContainer = document.getElementById('bookmark-tree');
    const renderedNodes = treeContainer.querySelectorAll('.tree-node');
    addLogEntry(`涔︾鏍戞覆鏌撳畬鎴愶紝鍏辨覆鏌?${renderedNodes.length} 涓妭鐐筦, 'success');
    
    // 楠岃瘉缁熻闈㈡澘
    const statsPanel = document.querySelector('.bookmark-stats-panel');
    if (statsPanel) {
      addLogEntry('缁熻闈㈡澘鍒涘缓鎴愬姛', 'success');
    } else {
      addLogEntry('璀﹀憡: 缁熻闈㈡澘鏈纭垱寤?, 'warning');
    }
    
    addLogEntry('涔︾绠＄悊鍣ㄥ姞杞藉畬鎴?, 'success');
    showStatus('涔︾绠＄悊鍣ㄥ凡鎵撳紑', 'success');
    
  } catch (error) {
    console.error('鎵撳紑涔︾绠＄悊鍣ㄥけ璐?', error);
    addLogEntry(`鎵撳紑涔︾绠＄悊鍣ㄥけ璐? ${error.message}`, 'error');
    showStatus(`鎵撳紑澶辫触: ${error.message}`, 'error');
    
    // 鏄剧ず璇︾粏鐨勯敊璇瘖鏂俊鎭?    addLogEntry('寮€濮嬮敊璇瘖鏂?..', 'info');
    
    // 妫€鏌PI鏉冮檺
    if (!chrome) {
      addLogEntry('閿欒: Chrome鎵╁睍API涓嶅彲鐢?, 'error');
    } else if (!chrome.bookmarks) {
      addLogEntry('閿欒: Chrome涔︾API涓嶅彲鐢紝璇锋鏌anifest.json涓殑鏉冮檺閰嶇疆', 'error');
    } else {
      addLogEntry('Chrome API鍙敤锛岄敊璇彲鑳芥潵鑷叾浠栧師鍥?, 'info');
    }
    
    // 妫€鏌OM鍏冪礌
    const container = document.getElementById('bookmark-manager-container');
    if (!container) {
      addLogEntry('閿欒: 鎵句笉鍒颁功绛剧鐞嗗櫒瀹瑰櫒鍏冪礌 #bookmark-manager-container', 'error');
    }
    
    const treeContainer = document.getElementById('bookmark-tree');
    if (!treeContainer) {
      addLogEntry('閿欒: 鎵句笉鍒颁功绛炬爲瀹瑰櫒鍏冪礌 #bookmark-tree', 'error');
    }
    
  } finally {
    showLoading(false);
  }
}

// 鍔犺浇涔︾鏍戞暟鎹?async function loadBookmarkTree() {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      
      bookmarkTreeData = bookmarkTreeNodes;
      addLogEntry(`涔︾鏍戝姞杞藉畬鎴愶紝鏍硅妭鐐规暟: ${bookmarkTreeNodes.length}`, 'info');
      
      // 娣诲姞璇︾粏鐨勪功绛剧粺璁′俊鎭?      const stats = analyzeBookmarkTree(bookmarkTreeNodes);
      addLogEntry(`涔︾缁熻: 鎬昏${stats.totalBookmarks}涓功绛? ${stats.totalFolders}涓枃浠跺す, ${stats.maxDepth}灞傛繁搴, 'success');
      addLogEntry(`鏂囦欢澶瑰垎甯? 涔︾鏍?{stats.bookmarkBar}涓? 鍏朵粬涔︾${stats.otherBookmarks}涓? 绉诲姩璁惧涔︾${stats.mobileBookmarks}涓猔, 'info');
      
      resolve(bookmarkTreeNodes);
    });
  });
}

// 鍒嗘瀽涔︾鏍戠粺璁′俊鎭?function analyzeBookmarkTree(nodes) {
  const stats = {
    totalBookmarks: 0,
    totalFolders: 0,
    maxDepth: 0,
    bookmarkBar: 0,
    otherBookmarks: 0,
    mobileBookmarks: 0
  };
  
  function analyzeNode(node, depth = 0) {
    stats.maxDepth = Math.max(stats.maxDepth, depth);
    
    if (node.url) {
      // 杩欐槸涓€涓功绛?      stats.totalBookmarks++;
      
      // 鏍规嵁鐖惰妭鐐笽D缁熻鍒嗗竷
      if (node.parentId === '1') {
        stats.bookmarkBar++;
      } else if (node.parentId === '2') {
        stats.otherBookmarks++;
      } else if (node.parentId === '3') {
        stats.mobileBookmarks++;
      }
    } else if (node.children) {
      // 杩欐槸涓€涓枃浠跺す
      if (node.id !== '0') { // 鎺掗櫎鏍硅妭鐐?        stats.totalFolders++;
      }
      
      // 閫掑綊鍒嗘瀽瀛愯妭鐐?      node.children.forEach(child => analyzeNode(child, depth + 1));
    }
  }
  
  nodes.forEach(node => analyzeNode(node));
  return stats;
}

// 娓叉煋涔︾鏍?function renderBookmarkTree() {
  const container = document.getElementById('bookmark-tree');
  container.innerHTML = '';
  
  // 娓呯┖閫夋嫨鐘舵€?  selectedBookmarks.clear();
  
  // 娣诲姞缁熻淇℃伅闈㈡澘
  const statsPanel = document.createElement('div');
  statsPanel.className = 'bookmark-stats-panel';
  statsPanel.innerHTML = `
    <div class="stats-header">馃搳 涔︾缁熻</div>
    <div class="stats-content" id="bookmark-stats-content">姝ｅ湪璁＄畻...</div>
  `;
  container.appendChild(statsPanel);
  
  // 娓叉煋姣忎釜鏍硅妭鐐?  bookmarkTreeData.forEach(rootNode => {
    const treeElement = createTreeNode(rootNode, 0);
    container.appendChild(treeElement);
  });
  
  // 鏇存柊缁熻淇℃伅
  updateBookmarkStats();
  
  addLogEntry('涔︾鏍戞覆鏌撳畬鎴?, 'info');
  
  // 鑷姩灞曞紑绗竴绾ф枃浠跺す锛堜功绛炬爮銆佸叾浠栦功绛剧瓑锛?  setTimeout(() => {
    expandFirstLevelFolders();
  }, 100);
}

// 鏇存柊涔︾缁熻淇℃伅
function updateBookmarkStats() {
  const stats = analyzeBookmarkTree(bookmarkTreeData);
  const statsContent = document.getElementById('bookmark-stats-content');
  
  if (statsContent) {
    statsContent.innerHTML = `
      <div class="stat-item">馃摎 鎬讳功绛? <strong>${stats.totalBookmarks}</strong></div>
      <div class="stat-item">馃搧 鎬绘枃浠跺す: <strong>${stats.totalFolders}</strong></div>
      <div class="stat-item">馃搳 鏈€澶ф繁搴? <strong>${stats.maxDepth}</strong>灞?/div>
      <div class="stat-breakdown">
        <div>涔︾鏍? ${stats.bookmarkBar} | 鍏朵粬涔︾: ${stats.otherBookmarks} | 绉诲姩璁惧: ${stats.mobileBookmarks}</div>
      </div>
    `;
  }
}

// 灞曞紑绗竴绾ф枃浠跺す
function expandFirstLevelFolders() {
  // 鎵惧埌鎵€鏈夌涓€绾ф枃浠跺す锛堜功绛炬爮銆佸叾浠栦功绛俱€佺Щ鍔ㄨ澶囦功绛剧瓑锛?  const firstLevelFolders = document.querySelectorAll('.tree-node[style*="margin-left: 0px"] .tree-expand-btn, .tree-node[style*="margin-left: 20px"] .tree-expand-btn');
  
  let expandedCount = 0;
  firstLevelFolders.forEach(button => {
    const nodeElement = button.closest('.tree-node');
    const childrenContainer = nodeElement.querySelector('.tree-children');
    
    if (childrenContainer && childrenContainer.classList.contains('hidden')) {
      childrenContainer.classList.remove('hidden');
      button.textContent = '鈻?;
      expandedCount++;
    }
  });
  
  addLogEntry(`鑷姩灞曞紑浜?{expandedCount}涓富瑕佹枃浠跺す`, 'info');
}

// 鍒涘缓鏍戣妭鐐?function createTreeNode(node, level) {
  const nodeElement = document.createElement('div');
  nodeElement.className = 'tree-node';
  nodeElement.style.marginLeft = `${level * 20}px`;
  nodeElement.dataset.nodeId = node.id;
  nodeElement.dataset.nodeType = node.url ? 'bookmark' : 'folder';
  
  // 娣诲姞鎷栨嫿鍔熻兘
  nodeElement.draggable = true;
  nodeElement.addEventListener('dragstart', handleDragStart);
  nodeElement.addEventListener('dragover', handleDragOver);
  nodeElement.addEventListener('drop', handleDrop);
  nodeElement.addEventListener('dragend', handleDragEnd);
  
  // 娣诲姞璋冭瘯淇℃伅
  if (level === 0) {
    addLogEntry(`鍒涘缓鏍硅妭鐐? ${node.title} (ID: ${node.id})`, 'info');
  }
  
  // 鑺傜偣鍐呭瀹瑰櫒
  const nodeContent = document.createElement('div');
  nodeContent.className = 'tree-node-content';
  
  // 灞曞紑/鎶樺彔鎸夐挳锛堜粎鏂囦欢澶癸級
  if (!node.url && node.children) {
    const expandButton = document.createElement('button');
    expandButton.className = 'tree-expand-btn';
    expandButton.textContent = '鈻?;
    expandButton.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleNodeExpansion(nodeElement, expandButton);
    });
    nodeContent.appendChild(expandButton);
    
    // 娣诲姞鏂囦欢澶逛功绛炬暟閲忔樉绀?    const bookmarkCount = countBookmarksInFolder(node);
    if (bookmarkCount > 0) {
      const countSpan = document.createElement('span');
      countSpan.className = 'folder-count';
      countSpan.textContent = ` (${bookmarkCount})`;
      countSpan.title = `鍖呭惈 ${bookmarkCount} 涓功绛綻;
    }
  } else {
    // 涔︾椤圭殑鍗犱綅绗?    const spacer = document.createElement('span');
    spacer.className = 'tree-spacer';
    spacer.textContent = '  ';
    nodeContent.appendChild(spacer);
  }
  
  // 澶嶉€夋
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'tree-checkbox';
  checkbox.addEventListener('change', (e) => {
    e.stopPropagation();
    toggleBookmarkSelection(node.id, checkbox.checked);
  });
  nodeContent.appendChild(checkbox);
  
  // 鎷栨嫿鎵嬫焺
  const dragHandle = document.createElement('span');
  dragHandle.className = 'drag-handle';
  dragHandle.textContent = '鈰嫯';
  dragHandle.title = '鎷栨嫿浠ラ噸鏂版帓搴?;
  nodeContent.appendChild(dragHandle);
  
  // 鍥炬爣鍜屾爣棰?  const icon = document.createElement('span');
  icon.className = 'tree-icon';
  icon.textContent = node.url ? '馃敄' : '馃搧';
  nodeContent.appendChild(icon);
  
  // 鏍囬瀹瑰櫒锛堟敮鎸佸唴鑱旂紪杈戯級
  const titleContainer = document.createElement('div');
  titleContainer.className = 'tree-title-container';
  
  const title = document.createElement('span');
  title.className = 'tree-title';
  title.textContent = node.title || '鏃犳爣棰?;
  title.dataset.originalTitle = node.title || '';
  
  // 娣诲姞鍙屽嚮缂栬緫鍔熻兘
  title.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    startInlineEdit(title, node);
  });
  
  // 娣诲姞URL宸ュ叿鎻愮ず锛堜粎涔︾锛?  if (node.url) {
    title.title = node.url;
  }
  
  titleContainer.appendChild(title);
  
  // 鍐呰仈缂栬緫杈撳叆妗嗭紙鍒濆闅愯棌锛?  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.className = 'tree-title-edit hidden';
  editInput.value = node.title || '';
  editInput.addEventListener('blur', () => finishInlineEdit(editInput, title, node));
  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      finishInlineEdit(editInput, title, node);
    } else if (e.key === 'Escape') {
      cancelInlineEdit(editInput, title);
    }
  });
  
  titleContainer.appendChild(editInput);
  nodeContent.appendChild(titleContainer);
  
  // 鎿嶄綔鎸夐挳
  const actions = document.createElement('div');
  actions.className = 'tree-actions';
  
  // 鍐呰仈缂栬緫鎸夐挳
  const inlineEditBtn = document.createElement('button');
  inlineEditBtn.className = 'tree-action-btn inline-edit-btn';
  inlineEditBtn.textContent = '鉁忥笍';
  inlineEditBtn.title = '蹇€熼噸鍛藉悕';
  inlineEditBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    startInlineEdit(title, node);
  });
  actions.appendChild(inlineEditBtn);
  
  // 缂栬緫鎸夐挳
  const editBtn = document.createElement('button');
  editBtn.className = 'tree-action-btn edit-btn';
  editBtn.textContent = '鈿欙笍';
  editBtn.title = '璇︾粏缂栬緫';
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    try {
      addLogEntry(`缂栬緫椤圭洰: ${node.title} (ID: ${node.id})`, 'info');
      editBookmarkItem(node);
    } catch (error) {
      addLogEntry(`缂栬緫澶辫触: ${error.message}`, 'error');
    }
  });
  actions.appendChild(editBtn);
  
  // 鍒犻櫎鎸夐挳
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'tree-action-btn delete-btn';
  deleteBtn.textContent = '馃棏锔?;
  deleteBtn.title = '鍒犻櫎';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    try {
      addLogEntry(`鍑嗗鍒犻櫎椤圭洰: ${node.title} (ID: ${node.id})`, 'info');
      deleteBookmarkItem(node);
    } catch (error) {
      addLogEntry(`鍒犻櫎澶辫触: ${error.message}`, 'error');
    }
  });
  actions.appendChild(deleteBtn);
  
  nodeContent.appendChild(actions);
  nodeElement.appendChild(nodeContent);
  
  // 瀛愯妭鐐瑰鍣紙浠呮枃浠跺す锛?  if (!node.url && node.children) {
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'tree-children hidden'; // 榛樿闅愯棌锛屼絾浼氬湪renderBookmarkTree涓嚜鍔ㄥ睍寮€涓昏鏂囦欢澶?    
    let childBookmarkCount = 0;
    let childFolderCount = 0;
    
    node.children.forEach(child => {
      const childElement = createTreeNode(child, level + 1);
      childrenContainer.appendChild(childElement);
      
      if (child.url) {
        childBookmarkCount++;
      } else if (child.children) {
        childFolderCount++;
      }
    });
    
    nodeElement.appendChild(childrenContainer);
    
    // 璁板綍鏂囦欢澶瑰唴瀹圭粺璁?    if (level <= 2) { // 鍙褰曞墠涓ょ骇鐨勮缁嗕俊鎭?      addLogEntry(`鏂囦欢澶?${node.title}"鍖呭惈: ${childBookmarkCount}涓功绛? ${childFolderCount}涓瓙鏂囦欢澶筦, 'info');
    }
  }
  
  return nodeElement;
}

// 璁＄畻鏂囦欢澶逛腑鐨勪功绛炬暟閲?function countBookmarksInFolder(folderNode) {
  let count = 0;
  
  function countRecursive(node) {
    if (node.url) {
      count++;
    } else if (node.children) {
      node.children.forEach(countRecursive);
    }
  }
  
  if (folderNode.children) {
    folderNode.children.forEach(countRecursive);
  }
  
  return count;
}

// 鍒囨崲鑺傜偣灞曞紑/鎶樺彔
function toggleNodeExpansion(nodeElement, expandButton) {
  const childrenContainer = nodeElement.querySelector('.tree-children');
  if (!childrenContainer) return;
  
  const isExpanded = !childrenContainer.classList.contains('hidden');
  
  if (isExpanded) {
    childrenContainer.classList.add('hidden');
    expandButton.textContent = '鈻?;
  } else {
    childrenContainer.classList.remove('hidden');
    expandButton.textContent = '鈻?;
  }
}

// 灞曞紑/鎶樺彔鎵€鏈夋枃浠跺す
function expandAllFolders(expand) {
  const expandButtons = document.querySelectorAll('.tree-expand-btn');
  const childrenContainers = document.querySelectorAll('.tree-children');
  
  expandButtons.forEach(button => {
    button.textContent = expand ? '鈻? : '鈻?;
  });
  
  childrenContainers.forEach(container => {
    if (expand) {
      container.classList.remove('hidden');
    } else {
      container.classList.add('hidden');
    }
  });
  
  addLogEntry(`${expand ? '灞曞紑' : '鎶樺彔'}浜嗘墍鏈夋枃浠跺す`, 'info');
}

// 鍒囨崲涔︾閫夋嫨鐘舵€?function toggleBookmarkSelection(nodeId, selected) {
  if (selected) {
    selectedBookmarks.add(nodeId);
  } else {
    selectedBookmarks.delete(nodeId);
  }
  
  // 鏇存柊鎵归噺鎿嶄綔鎸夐挳鐘舵€?  updateBatchActionButtons();
}

// 閫夋嫨/鍙栨秷閫夋嫨鎵€鏈変功绛?function selectAllBookmarks(select) {
  const checkboxes = document.querySelectorAll('.tree-checkbox');
  
  checkboxes.forEach(checkbox => {
    checkbox.checked = select;
    const nodeElement = checkbox.closest('.tree-node');
    const nodeId = nodeElement.dataset.nodeId;
    
    if (select) {
      selectedBookmarks.add(nodeId);
    } else {
      selectedBookmarks.delete(nodeId);
    }
  });
  
  updateBatchActionButtons();
  addLogEntry(`${select ? '閫夋嫨' : '鍙栨秷閫夋嫨'}浜嗘墍鏈変功绛綻, 'info');
}

// 鏇存柊鎵归噺鎿嶄綔鎸夐挳鐘舵€?function updateBatchActionButtons() {
  const hasSelection = selectedBookmarks.size > 0;
  const batchButtons = document.querySelectorAll('.batch-action-btn');
  
  batchButtons.forEach(button => {
    button.disabled = !hasSelection;
  });
  
  // 鏇存柊閫夋嫨璁℃暟鏄剧ず
  const selectionCount = document.getElementById('selected-count');
  if (selectionCount) {
    selectionCount.textContent = `宸查€夋嫨 ${selectedBookmarks.size} 椤筦;
  }
  
  // 鏄剧ず/闅愯棌鎵归噺鎿嶄綔宸ュ叿鏍?  const batchOperations = document.getElementById('batch-operations');
  if (batchOperations) {
    if (hasSelection) {
      batchOperations.classList.remove('hidden');
    } else {
      batchOperations.classList.add('hidden');
    }
  }
}

// 缂栬緫涔︾椤圭洰
function editBookmarkItem(node) {
  currentEditingItem = node;
  
  // 濉厖缂栬緫琛ㄥ崟
  document.getElementById('edit-title').value = node.title || '';
  document.getElementById('edit-url').value = node.url || '';
  
  // 鍔犺浇鐖舵枃浠跺す閫夐」
  loadParentFolderOptions(node.parentId);
  
  // 鏄剧ず缂栬緫妯℃€佹
  document.getElementById('edit-modal').classList.remove('hidden');
  
  addLogEntry(`寮€濮嬬紪杈戦」鐩? ${node.title}`, 'info');
}

// 鍔犺浇鐖舵枃浠跺す閫夐」
function loadParentFolderOptions(currentParentId) {
  const select = document.getElementById('edit-parent');
  select.innerHTML = '';
  
  // 閫掑綊娣诲姞鏂囦欢澶归€夐」
  function addFolderOptions(nodes, level = 0) {
    nodes.forEach(node => {
      if (!node.url && node.children) {
        // 杩欐槸涓€涓枃浠跺す
        const option = document.createElement('option');
        option.value = node.id;
        option.textContent = '  '.repeat(level) + (node.title || '鏃犳爣棰樻枃浠跺す');
        
        if (node.id === currentParentId) {
          option.selected = true;
        }
        
        select.appendChild(option);
        
        // 閫掑綊娣诲姞瀛愭枃浠跺す
        addFolderOptions(node.children, level + 1);
      }
    });
  }
  
  addFolderOptions(bookmarkTreeData);
}

// 淇濆瓨涔︾缂栬緫
async function saveBookmarkEdit() {
  if (!currentEditingItem) return;
  
  const newTitle = document.getElementById('edit-title').value.trim();
  const newUrl = document.getElementById('edit-url').value.trim();
  const newParentId = document.getElementById('edit-parent').value;
  
  if (!newTitle) {
    showStatus('鏍囬涓嶈兘涓虹┖', 'error');
    return;
  }
  
  if (currentEditingItem.url && !newUrl) {
    showStatus('涔︾URL涓嶈兘涓虹┖', 'error');
    return;
  }
  
  try {
    showLoading(true);
    
    // 鏇存柊涔︾
    const updateData = { title: newTitle };
    if (currentEditingItem.url) {
      updateData.url = newUrl;
    }
    
    await new Promise((resolve, reject) => {
      chrome.bookmarks.update(currentEditingItem.id, updateData, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
    
    // 濡傛灉鐖舵枃浠跺す鏀瑰彉锛岀Щ鍔ㄤ功绛?    if (newParentId !== currentEditingItem.parentId) {
      await new Promise((resolve, reject) => {
        chrome.bookmarks.move(currentEditingItem.id, { parentId: newParentId }, (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(result);
          }
        });
      });
    }
    
    addLogEntry(`鎴愬姛鏇存柊椤圭洰: ${newTitle}`, 'success');
    showStatus('淇濆瓨鎴愬姛', 'success');
    
    // 鍏抽棴妯℃€佹骞跺埛鏂版爲
    closeEditModal();
    await refreshBookmarkManager();
    
  } catch (error) {
    console.error('淇濆瓨缂栬緫澶辫触:', error);
    addLogEntry(`淇濆瓨缂栬緫澶辫触: ${error.message}`, 'error');
    showStatus(`淇濆瓨澶辫触: ${error.message}`, 'error');
  } finally {
    showLoading(false);
  }
}

// 鍏抽棴缂栬緫妯℃€佹
function closeEditModal() {
  document.getElementById('edit-modal').classList.add('hidden');
  currentEditingItem = null;
}

// 鍒犻櫎涔︾椤圭洰
async function deleteBookmarkItem(node) {
  const itemType = node.url ? '涔︾' : '鏂囦欢澶?;
  
  if (!confirm(`纭畾瑕佸垹闄?{itemType}"${node.title}"鍚楋紵姝ゆ搷浣滀笉鍙挙閿€銆俙)) {
    return;
  }
  
  try {
    showLoading(true);
    
    await new Promise((resolve, reject) => {
      if (node.url) {
        // 鍒犻櫎涔︾
        chrome.bookmarks.remove(node.id, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      } else {
        // 鍒犻櫎鏂囦欢澶癸紙鍖呮嫭鎵€鏈夊瓙椤癸級
        chrome.bookmarks.removeTree(node.id, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      }
    });
    
    addLogEntry(`鎴愬姛鍒犻櫎${itemType}: ${node.title}`, 'success');
    showStatus(`鍒犻櫎${itemType}鎴愬姛`, 'success');
    
    // 鍒锋柊涔︾绠＄悊鍣?    await refreshBookmarkManager();
    
  } catch (error) {
    console.error(`鍒犻櫎${itemType}澶辫触:`, error);
    addLogEntry(`鍒犻櫎${itemType}澶辫触: ${error.message}`, 'error');
    showStatus(`鍒犻櫎澶辫触: ${error.message}`, 'error');
  } finally {
    showLoading(false);
  }
}

// 鍒锋柊涔︾绠＄悊鍣?async function refreshBookmarkManager() {
  try {
    await loadBookmarkTree();
    renderBookmarkTree();
    addLogEntry('涔︾绠＄悊鍣ㄥ凡鍒锋柊', 'info');
  } catch (error) {
    addLogEntry(`鍒锋柊涔︾绠＄悊鍣ㄥけ璐? ${error.message}`, 'error');
  }
}

// 鍒涘缓鏂版枃浠跺す
async function createNewFolder() {
  const folderName = prompt('璇疯緭鍏ユ枃浠跺す鍚嶇О:');
  if (!folderName || !folderName.trim()) {
    return;
  }
  
  try {
    showLoading(true);
    
    // 榛樿鍦?鍏朵粬涔︾"鏂囦欢澶逛腑鍒涘缓
    const parentId = '2'; // 鍏朵粬涔︾鏂囦欢澶笽D
    
    await new Promise((resolve, reject) => {
      chrome.bookmarks.create({
        parentId: parentId,
        title: folderName.trim()
      }, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
    
    addLogEntry(`鎴愬姛鍒涘缓鏂囦欢澶? ${folderName}`, 'success');
    showStatus('鏂囦欢澶瑰垱寤烘垚鍔?, 'success');
    
    // 鍒锋柊涔︾绠＄悊鍣?    await refreshBookmarkManager();
    
  } catch (error) {
    console.error('鍒涘缓鏂囦欢澶瑰け璐?', error);
    addLogEntry(`鍒涘缓鏂囦欢澶瑰け璐? ${error.message}`, 'error');
    showStatus(`鍒涘缓澶辫触: ${error.message}`, 'error');
  } finally {
    showLoading(false);
  }
}

// ======== 鎵归噺鎿嶄綔鍔熻兘 ========

// 鎵归噺鍒犻櫎椤圭洰
async function batchDeleteItems() {
  if (selectedBookmarks.size === 0) {
    showStatus('璇峰厛閫夋嫨瑕佸垹闄ょ殑椤圭洰', 'warning');
    return;
  }
  
  if (!confirm(`纭畾瑕佸垹闄ら€変腑鐨?${selectedBookmarks.size} 涓」鐩悧锛熸鎿嶄綔涓嶅彲鎾ら攢銆俙)) {
    return;
  }
  
  try {
    showLoading(true);
    addLogEntry(`寮€濮嬫壒閲忓垹闄?${selectedBookmarks.size} 涓」鐩?..`, 'info');
    
    let deletedCount = 0;
    const selectedArray = Array.from(selectedBookmarks);
    
    for (const nodeId of selectedArray) {
      try {
        // 鏌ユ壘鑺傜偣淇℃伅
        const node = findNodeById(nodeId);
        
        await new Promise((resolve, reject) => {
          if (node && node.url) {
            // 鍒犻櫎涔︾
            chrome.bookmarks.remove(nodeId, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          } else {
            // 鍒犻櫎鏂囦欢澶?            chrome.bookmarks.removeTree(nodeId, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          }
        });
        
        deletedCount++;
        selectedBookmarks.delete(nodeId);
        
      } catch (error) {
        addLogEntry(`鍒犻櫎椤圭洰 ${nodeId} 澶辫触: ${error.message}`, 'error');
      }
    }
    
    addLogEntry(`鎵归噺鍒犻櫎瀹屾垚锛屾垚鍔熷垹闄?${deletedCount} 涓」鐩甡, 'success');
    showStatus(`鎵归噺鍒犻櫎瀹屾垚锛屾垚鍔熷垹闄?${deletedCount} 涓」鐩甡, 'success');
    
    // 鍒锋柊涔︾绠＄悊鍣?    await refreshBookmarkManager();
    
  } catch (error) {
    addLogEntry(`鎵归噺鍒犻櫎澶辫触: ${error.message}`, 'error');
    showStatus(`鎵归噺鍒犻櫎澶辫触: ${error.message}`, 'error');
  } finally {
    showLoading(false);
  }
}

// 鎵归噺绉诲姩椤圭洰
function batchMoveItems() {
  if (selectedBookmarks.size === 0) {
    showStatus('璇峰厛閫夋嫨瑕佺Щ鍔ㄧ殑椤圭洰', 'warning');
    return;
  }
  
  // 鍔犺浇鐩爣鏂囦欢澶归€夐」
  loadMoveTargetFolders();
  
  // 鏄剧ず绉诲姩妯℃€佹
  document.getElementById('move-modal').classList.remove('hidden');
  
  addLogEntry(`鍑嗗鎵归噺绉诲姩 ${selectedBookmarks.size} 涓」鐩甡, 'info');
}

// 鍔犺浇绉诲姩鐩爣鏂囦欢澶?function loadMoveTargetFolders() {
  const select = document.getElementById('target-folder');
  select.innerHTML = '';
  
  // 閫掑綊娣诲姞鏂囦欢澶归€夐」
  function addFolderOptions(nodes, level = 0) {
    nodes.forEach(node => {
      if (!node.url && node.children) {
        // 杩欐槸涓€涓枃浠跺す
        const option = document.createElement('option');
        option.value = node.id;
        option.textContent = '  '.repeat(level) + (node.title || '鏃犳爣棰樻枃浠跺す');
        select.appendChild(option);
        
        // 閫掑綊娣诲姞瀛愭枃浠跺す
        addFolderOptions(node.children, level + 1);
      }
    });
  }
  
  addFolderOptions(bookmarkTreeData);
}

// 纭鎵归噺绉诲姩
async function confirmMoveItems() {
  const targetFolderId = document.getElementById('target-folder').value;
  
  if (!targetFolderId) {
    showStatus('璇烽€夋嫨鐩爣鏂囦欢澶?, 'warning');
    return;
  }
  
  try {
    showLoading(true);
    addLogEntry(`寮€濮嬫壒閲忕Щ鍔?${selectedBookmarks.size} 涓」鐩埌鐩爣鏂囦欢澶?..`, 'info');
    
    let movedCount = 0;
    const selectedArray = Array.from(selectedBookmarks);
    
    for (const nodeId of selectedArray) {
      try {
        await new Promise((resolve, reject) => {
          chrome.bookmarks.move(nodeId, { parentId: targetFolderId }, (result) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(result);
            }
          });
        });
        
        movedCount++;
        
      } catch (error) {
        addLogEntry(`绉诲姩椤圭洰 ${nodeId} 澶辫触: ${error.message}`, 'error');
      }
    }
    
    addLogEntry(`鎵归噺绉诲姩瀹屾垚锛屾垚鍔熺Щ鍔?${movedCount} 涓」鐩甡, 'success');
    showStatus(`鎵归噺绉诲姩瀹屾垚锛屾垚鍔熺Щ鍔?${movedCount} 涓」鐩甡, 'success');
    
    // 鍏抽棴妯℃€佹骞跺埛鏂?    closeMoveModal();
    await refreshBookmarkManager();
    
  } catch (error) {
    addLogEntry(`鎵归噺绉诲姩澶辫触: ${error.message}`, 'error');
    showStatus(`鎵归噺绉诲姩澶辫触: ${error.message}`, 'error');
  } finally {
    showLoading(false);
  }
}

// 鍏抽棴绉诲姩妯℃€佹
function closeMoveModal() {
  document.getElementById('move-modal').classList.add('hidden');
}

// 鎵归噺瀵煎嚭椤圭洰
function batchExportItems() {
  if (selectedBookmarks.size === 0) {
    showStatus('璇峰厛閫夋嫨瑕佸鍑虹殑椤圭洰', 'warning');
    return;
  }
  
  try {
    const exportData = [];
    const selectedArray = Array.from(selectedBookmarks);
    
    selectedArray.forEach(nodeId => {
      const node = findNodeById(nodeId);
      if (node) {
        exportData.push({
          id: node.id,
          title: node.title,
          url: node.url,
          parentId: node.parentId,
          type: node.url ? 'bookmark' : 'folder'
        });
      }
    });
    
    // 鍒涘缓CSV鍐呭
    let csvContent = '绫诲瀷,鏍囬,URL,ID,鐖舵枃浠跺すID\n';
    exportData.forEach(item => {
      const type = item.type === 'bookmark' ? '涔︾' : '鏂囦欢澶?;
      const title = `"${(item.title || '').replace(/"/g, '""')}"`;
      const url = `"${(item.url || '').replace(/"/g, '""')}"`;
      csvContent += `${type},${title},${url},${item.id},${item.parentId}\n`;
    });
    
    // 涓嬭浇鏂囦欢
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const fileName = `閫変腑涔︾_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addLogEntry(`鎴愬姛瀵煎嚭 ${exportData.length} 涓€変腑椤圭洰`, 'success');
    showStatus(`瀵煎嚭鎴愬姛: ${fileName}`, 'success');
    
  } catch (error) {
    addLogEntry(`鎵归噺瀵煎嚭澶辫触: ${error.message}`, 'error');
    showStatus(`瀵煎嚭澶辫触: ${error.message}`, 'error');
  }
}

// 鏌ユ壘鑺傜偣by ID
function findNodeById(nodeId) {
  function searchNode(nodes) {
    if (!nodes || !Array.isArray(nodes)) {
      return null;
    }
    
    for (const node of nodes) {
      if (node.id === nodeId) {
        addLogEntry(`鎵惧埌鑺傜偣: ${node.title} (ID: ${node.id})`, 'info');
        return node;
      }
      if (node.children && Array.isArray(node.children)) {
        const found = searchNode(node.children);
        if (found) return found;
      }
    }
    return null;
  }
  
  try {
    const result = searchNode(bookmarkTreeData);
    if (!result) {
      addLogEntry(`璀﹀憡: 鏈壘鍒癐D涓?${nodeId} 鐨勮妭鐐筦, 'warning');
    }
    return result;
  } catch (error) {
    addLogEntry(`鏌ユ壘鑺傜偣鏃跺嚭閿? ${error.message}`, 'error');
    return null;
  }
}

// ======== 瀵煎叆瀵煎嚭鍔熻兘 ========

// 瀵煎叆涔︾
function importBookmarks() {
  // 瑙﹀彂鏂囦欢閫夋嫨
  document.getElementById('bookmark-file-input').click();
}

// 澶勭悊鏂囦欢瀵煎叆
async function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  addLogEntry(`寮€濮嬪鍏ユ枃浠? ${file.name}`, 'info');
  showLoading(true);
  
  try {
    const fileContent = await readFileContent(file);
    
    if (file.name.endsWith('.json')) {
      await importJsonBookmarks(fileContent);
    } else if (file.name.endsWith('.html')) {
      await importHtmlBookmarks(fileContent);
    } else {
      throw new Error('涓嶆敮鎸佺殑鏂囦欢鏍煎紡锛岃閫夋嫨JSON鎴朒TML鏂囦欢');
    }
    
  } catch (error) {
    addLogEntry(`瀵煎叆鏂囦欢澶辫触: ${error.message}`, 'error');
    showStatus(`瀵煎叆澶辫触: ${error.message}`, 'error');
  } finally {
    showLoading(false);
    // 娓呯┖鏂囦欢杈撳叆
    event.target.value = '';
  }
}

// 璇诲彇鏂囦欢鍐呭
function readFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('鏂囦欢璇诲彇澶辫触'));
    reader.readAsText(file, 'utf-8');
  });
}

// 瀵煎叆JSON鏍煎紡涔︾
async function importJsonBookmarks(jsonContent) {
  try {
    const bookmarkData = JSON.parse(jsonContent);
    
    if (!Array.isArray(bookmarkData)) {
      throw new Error('JSON鏍煎紡涓嶆纭紝搴斾负涔︾鏁扮粍');
    }
    
    let importedCount = 0;
    const targetFolderId = '2'; // 鍏朵粬涔︾鏂囦欢澶?    
    for (const bookmark of bookmarkData) {
      if (bookmark.url && bookmark.title) {
        try {
          await new Promise((resolve, reject) => {
            chrome.bookmarks.create({
              parentId: targetFolderId,
              title: bookmark.title,
              url: bookmark.url
            }, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });
          
          importedCount++;
        } catch (error) {
          addLogEntry(`瀵煎叆涔︾"${bookmark.title}"澶辫触: ${error.message}`, 'warning');
        }
      }
    }
    
    addLogEntry(`JSON瀵煎叆瀹屾垚锛屾垚鍔熷鍏?${importedCount} 涓功绛綻, 'success');
    showStatus(`瀵煎叆鎴愬姛: ${importedCount} 涓功绛綻, 'success');
    
    // 鍒锋柊涔︾绠＄悊鍣?    if (document.getElementById('bookmark-manager-container').classList.contains('hidden') === false) {
      await refreshBookmarkManager();
    }
    
  } catch (error) {
    throw new Error(`JSON瑙ｆ瀽澶辫触: ${error.message}`);
  }
}

// 瀵煎叆HTML鏍煎紡涔︾
async function importHtmlBookmarks(htmlContent) {
  try {
    // 鍒涘缓涓存椂DOM鏉ヨВ鏋怘TML
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    const bookmarkLinks = doc.querySelectorAll('a[href]');
    let importedCount = 0;
    const targetFolderId = '2'; // 鍏朵粬涔︾鏂囦欢澶?    
    for (const link of bookmarkLinks) {
      const url = link.getAttribute('href');
      const title = link.textContent.trim();
      
      if (url && title) {
        try {
          await new Promise((resolve, reject) => {
            chrome.bookmarks.create({
              parentId: targetFolderId,
              title: title,
              url: url
            }, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });
          
          importedCount++;
        } catch (error) {
          addLogEntry(`瀵煎叆涔︾"${title}"澶辫触: ${error.message}`, 'warning');
        }
      }
    }
    
    addLogEntry(`HTML瀵煎叆瀹屾垚锛屾垚鍔熷鍏?${importedCount} 涓功绛綻, 'success');
    showStatus(`瀵煎叆鎴愬姛: ${importedCount} 涓功绛綻, 'success');
    
    // 鍒锋柊涔︾绠＄悊鍣?    if (document.getElementById('bookmark-manager-container').classList.contains('hidden') === false) {
      await refreshBookmarkManager();
    }
    
  } catch (error) {
    throw new Error(`HTML瑙ｆ瀽澶辫触: ${error.message}`);
  }
}

// 澶囦唤涔︾
async function backupBookmarks() {
  addLogEntry('寮€濮嬪浠芥墍鏈変功绛?..', 'info');
  showLoading(true);
  
  try {
    // 鑾峰彇鎵€鏈変功绛?    const allBookmarks = await getAllBookmarks();
    
    // 鍒涘缓澶囦唤鏁版嵁
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      bookmarkCount: allBookmarks.length,
      bookmarks: allBookmarks
    };
    
    // 鍒涘缓JSON鏂囦欢
    const jsonContent = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const fileName = `涔︾澶囦唤_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addLogEntry(`澶囦唤瀹屾垚锛屽叡澶囦唤 ${allBookmarks.length} 涓功绛綻, 'success');
    showStatus(`澶囦唤鎴愬姛: ${fileName}`, 'success');
    
  } catch (error) {
    addLogEntry(`澶囦唤澶辫触: ${error.message}`, 'error');
    showStatus(`澶囦唤澶辫触: ${error.message}`, 'error');
  } finally {
    showLoading(false);
  }
}

// 灏嗗叧閿嚱鏁版毚闇插埌鍏ㄥ眬浣滅敤鍩燂紝浠ヤ究onclick浜嬩欢澶勭悊鍣ㄥ彲浠ヨ闂?window.editBookmarkItem = editBookmarkItem;
window.deleteBookmarkItem = deleteBookmarkItem;
window.toggleNodeExpansion = toggleNodeExpansion;
window.toggleBookmarkSelection = toggleBookmarkSelection;

// 娣诲姞璋冭瘯鍜岃瘖鏂姛鑳?window.debugBookmarkManager = function() {
  console.log('=== 涔︾绠＄悊鍣ㄨ皟璇曚俊鎭?===');
  
  // 1. 妫€鏌hrome API
  console.log('1. Chrome API妫€鏌?');
  console.log('- chrome:', !!chrome);
  console.log('- chrome.bookmarks:', !!chrome?.bookmarks);
  console.log('- chrome.bookmarks.getTree:', typeof chrome?.bookmarks?.getTree);
  
  // 2. 妫€鏌OM鍏冪礌
  console.log('2. DOM鍏冪礌妫€鏌?');
  const managerContainer = document.getElementById('bookmark-manager-container');
  const treeContainer = document.getElementById('bookmark-tree');
  console.log('- bookmark-manager-container:', !!managerContainer, managerContainer?.classList?.contains('hidden') ? '闅愯棌' : '鏄剧ず');
  console.log('- bookmark-tree:', !!treeContainer);
  
  // 3. 妫€鏌ユ暟鎹姸鎬?  console.log('3. 鏁版嵁鐘舵€佹鏌?');
  console.log('- bookmarkTreeData:', !!bookmarkTreeData, bookmarkTreeData?.length || 0);
  console.log('- selectedBookmarks:', selectedBookmarks?.size || 0);
  
  // 4. 灏濊瘯鑾峰彇涔︾鏁版嵁
  console.log('4. 灏濊瘯鑾峰彇涔︾鏁版嵁:');
  if (chrome?.bookmarks?.getTree) {
    chrome.bookmarks.getTree((nodes) => {
      if (chrome.runtime.lastError) {
        console.error('鑾峰彇涔︾澶辫触:', chrome.runtime.lastError);
      } else {
        console.log('鎴愬姛鑾峰彇涔︾鏍?', nodes);
        const stats = analyzeBookmarkTree(nodes);
        console.log('涔︾缁熻:', stats);
      }
    });
  }
  
  // 5. 妫€鏌ユ覆鏌撶殑鑺傜偣
  console.log('5. 娓叉煋鑺傜偣妫€鏌?');
  const renderedNodes = document.querySelectorAll('.tree-node');
  console.log('- 娓叉煋鐨勮妭鐐规暟:', renderedNodes.length);
  
  if (renderedNodes.length > 0) {
    console.log('- 鍓?涓妭鐐圭殑璇︽儏:');
    Array.from(renderedNodes).slice(0, 5).forEach((node, index) => {
      const title = node.querySelector('.tree-title')?.textContent;
      const nodeId = node.dataset.nodeId;
      console.log(`  ${index + 1}. "${title}" (ID: ${nodeId})`);
    });
  }
  
  // 6. 妫€鏌ヤ簨浠剁粦瀹?  console.log('6. 浜嬩欢缁戝畾妫€鏌?');
  const editButtons = document.querySelectorAll('.edit-btn');
  const deleteButtons = document.querySelectorAll('.delete-btn');
  console.log('- 缂栬緫鎸夐挳鏁?', editButtons.length);
  console.log('- 鍒犻櫎鎸夐挳鏁?', deleteButtons.length);
  
  // 7. 妫€鏌ユ墿灞曟潈闄?  console.log('7. 鎵╁睍鏉冮檺妫€鏌?');
  chrome.permissions?.getAll?.((permissions) => {
    console.log('- 褰撳墠鏉冮檺:', permissions);
  });
  
  console.log('=== 璋冭瘯淇℃伅缁撴潫 ===');
  
  return {
    chromeApi: !!chrome?.bookmarks,
    domElements: {
      managerContainer: !!managerContainer,
      treeContainer: !!treeContainer
    },
    data: {
      bookmarkTreeData: !!bookmarkTreeData,
      selectedBookmarks: selectedBookmarks?.size || 0
    },
    renderedNodes: renderedNodes.length
  };
};

// 鑷姩涔︾绠＄悊鍣ㄤ慨澶嶅嚱鏁?window.fixBookmarkManager = async function() {
  console.log('寮€濮嬭嚜鍔ㄤ慨澶嶄功绛剧鐞嗗櫒...');
  addLogEntry('鍚姩涔︾绠＄悊鍣ㄨ嚜鍔ㄤ慨澶嶇▼搴?..', 'info');
  
  try {
    // 1. 閲嶆柊鍔犺浇鏁版嵁
    addLogEntry('姝ラ1: 閲嶆柊鍔犺浇涔︾鏁版嵁...', 'info');
    await loadBookmarkTree();
    
    // 2. 閲嶆柊娓叉煋鐣岄潰
    addLogEntry('姝ラ2: 閲嶆柊娓叉煋鐣岄潰...', 'info');
    renderBookmarkTree();
    
    // 3. 鑷姩灞曞紑涓昏鏂囦欢澶?    addLogEntry('姝ラ3: 鑷姩灞曞紑涓昏鏂囦欢澶?..', 'info');
    setTimeout(() => {
      expandFirstLevelFolders();
      expandAllFolders(true); // 灞曞紑鎵€鏈夋枃浠跺す浠ョ‘淇濈敤鎴疯兘鐪嬪埌鎵€鏈変功绛?    }, 500);
    
    // 4. 楠岃瘉淇缁撴灉
    setTimeout(() => {
      const renderedNodes = document.querySelectorAll('.tree-node');
      const visibleNodes = document.querySelectorAll('.tree-node:not(.tree-children.hidden .tree-node)');
      
      addLogEntry(`淇瀹屾垚! 鍏辨覆鏌?${renderedNodes.length} 涓妭鐐癸紝鍏朵腑 ${visibleNodes.length} 涓彲瑙乣, 'success');
      
      if (renderedNodes.length === 0) {
        addLogEntry('璀﹀憡: 娌℃湁娓叉煋浠讳綍鑺傜偣锛屽彲鑳藉瓨鍦ㄦ暟鎹棶棰?, 'warning');
      }
    }, 1000);
    
  } catch (error) {
    addLogEntry(`鑷姩淇澶辫触: ${error.message}`, 'error');
    throw error;
  }
};

console.log('涔︾绠＄悊鍣ㄨ皟璇曞姛鑳藉凡鍔犺浇銆備娇鐢?debugBookmarkManager() 鏌ョ湅璋冭瘯淇℃伅锛屼娇鐢?fixBookmarkManager() 灏濊瘯鑷姩淇銆?);

// ======== 鎷栨嫿鎺掑簭鍔熻兘 ========

// 寮€濮嬫嫋鎷?function handleDragStart(e) {
  draggedElement = e.target;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', e.target.outerHTML);
  
  // 娣诲姞鎷栨嫿鏍峰紡
  e.target.classList.add('dragging');
  
  addLogEntry(`寮€濮嬫嫋鎷? ${draggedElement.querySelector('.tree-title').textContent}`, 'info');
}

// 鎷栨嫿鎮仠
function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  const target = e.currentTarget;
  if (target !== draggedElement && target.classList.contains('tree-node')) {
    // 鏄剧ず鏀剧疆鎸囩ず鍣?    target.classList.add('drag-over');
  }
}

// 澶勭悊鏀剧疆
async function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const target = e.currentTarget;
  target.classList.remove('drag-over');
  
  if (target === draggedElement || !draggedElement) {
    return;
  }
  
  try {
    const draggedNodeId = draggedElement.dataset.nodeId;
    const targetNodeId = target.dataset.nodeId;
    const targetNodeType = target.dataset.nodeType;
    
    if (targetNodeType === 'folder') {
      // 绉诲姩鍒版枃浠跺す鍐?      await moveBookmarkToFolder(draggedNodeId, targetNodeId);
      addLogEntry(`鎴愬姛灏嗛」鐩Щ鍔ㄥ埌鏂囦欢澶逛腑`, 'success');
    } else {
      // 閲嶆柊鎺掑簭 - 灏嗘嫋鎷介」鐩Щ鍔ㄥ埌鐩爣椤圭洰涔嬪墠
      await reorderBookmarks(draggedNodeId, targetNodeId);
      addLogEntry(`鎴愬姛閲嶆柊鎺掑簭涔︾`, 'success');
    }
    
    // 鍒锋柊绠＄悊鍣?    await refreshBookmarkManager();
    showStatus('鎷栨嫿鎿嶄綔瀹屾垚', 'success');
    
  } catch (error) {
    addLogEntry(`鎷栨嫿鎿嶄綔澶辫触: ${error.message}`, 'error');
    showStatus(`鎷栨嫿澶辫触: ${error.message}`, 'error');
  }
}

// 缁撴潫鎷栨嫿
function handleDragEnd(e) {
  e.target.classList.remove('dragging');
  
  // 娓呴櫎鎵€鏈夋嫋鎷芥牱寮?  document.querySelectorAll('.drag-over').forEach(el => {
    el.classList.remove('drag-over');
  });
  
  draggedElement = null;
}

// 绉诲姩涔︾鍒版枃浠跺す
async function moveBookmarkToFolder(bookmarkId, folderId) {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.move(bookmarkId, { parentId: folderId }, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(result);
      }
    });
  });
}

// 閲嶆柊鎺掑簭涔︾
async function reorderBookmarks(sourceId, targetId) {
  try {
    // 鑾峰彇鐩爣涔︾鐨勪俊鎭?    const targetNode = findNodeById(targetId);
    if (!targetNode) {
      throw new Error('鎵句笉鍒扮洰鏍囦功绛?);
    }
    
    // 鑾峰彇鐩爣涔︾鐨勭储寮?    const parentId = targetNode.parentId;
    const siblings = await new Promise((resolve, reject) => {
      chrome.bookmarks.getChildren(parentId, (children) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(children);
        }
      });
    });
    
    const targetIndex = siblings.findIndex(child => child.id === targetId);
    
    // 绉诲姩婧愪功绛惧埌鐩爣浣嶇疆
    await new Promise((resolve, reject) => {
      chrome.bookmarks.move(sourceId, { 
        parentId: parentId, 
        index: targetIndex 
      }, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
