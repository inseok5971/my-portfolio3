/**
 * Main Application Script
 * Orchestrates canvas, UI navigation, template loader, image upload with strict format checks,
 * custom size modal (Image 3), multi-slide management, charts (Image 1), lines (Image 2),
 * and comprehensive shapes catalog (Images 3, 4, 5).
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize Canvas Manager & Toolbar Controller
  const cm = new CanvasManager("main-fabric-canvas", "canvas-stage-area");
  const tb = new ToolbarController(cm);

  // 2. Global State
  const state = {
    currentTemplateId: "character-main",
    aspectRatioLocked: false,
    currentRatio: 1,
    slides: [
      { id: 1, json: null, thumbnail: null }
    ],
    activeSlideIndex: 0,
    uploadedImages: []
  };

  // 3. Load Initial Template (Image 1 - Character Card News)
  const defaultTemplate = CARD_TEMPLATES[0];
  cm.loadTemplate(defaultTemplate);
  state.currentRatio = defaultTemplate.width / defaultTemplate.height;

  // 4. Render Recommended Templates in Sidebar
  const templatesGrid = document.getElementById("templates-grid");
  function renderTemplatesList() {
    if (!templatesGrid) return;
    templatesGrid.innerHTML = "";

    CARD_TEMPLATES.forEach(tpl => {
      const card = document.createElement("div");
      card.className = `template-card ${tpl.id === state.currentTemplateId ? "active" : ""}`;
      card.setAttribute("data-id", tpl.id);

      card.innerHTML = `
        <div class="template-thumb" style="background: ${tpl.previewBg || '#f8fafc'};">
          <div style="text-align: center; padding: 12px; pointer-events: none;">
            <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 4px;">${tpl.badge || "추천"}</div>
            <div style="font-size: 14px; font-weight: 900; color: #1e293b; line-height: 1.2;">
              ${tpl.name.replace(" 카드뉴스", "<br><span style='font-size:11px; color:#00c4cc;'>카드뉴스</span>")}
            </div>
          </div>
        </div>
        <div class="template-info">
          <span class="template-name">${tpl.name}</span>
          <span class="template-badge">${tpl.badge || "인기"}</span>
        </div>
      `;

      card.addEventListener("click", () => {
        state.currentTemplateId = tpl.id;
        document.querySelectorAll(".template-card").forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        cm.loadTemplate(tpl);
        showToast(`'${tpl.name}' 템플릿이 적용되었습니다.`, "success");
      });

      templatesGrid.appendChild(card);
    });
  }
  renderTemplatesList();

  // 4-1. User Saved Templates Management (Checklist Requirement 4: 생성·수정·삭제 영구 유지)
  const STORAGE_KEY_USER_TPL = "cardnews_studio_user_templates";
  const userTemplatesSec = document.getElementById("sec-user-templates");
  const userTemplatesGrid = document.getElementById("user-templates-grid");
  const userTemplateCountBadge = document.getElementById("user-template-count");
  const btnSaveAsTemplate = document.getElementById("btn-save-as-template");

  function getUserTemplates() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_USER_TPL);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn("Failed to load user templates from localStorage:", e);
      return [];
    }
  }

  function setUserTemplates(templates) {
    try {
      localStorage.setItem(STORAGE_KEY_USER_TPL, JSON.stringify(templates));
    } catch (e) {
      console.warn("Failed to save user templates to localStorage:", e);
    }
  }

  function renderUserTemplatesList() {
    if (!userTemplatesGrid) return;
    const list = getUserTemplates();
    userTemplatesGrid.innerHTML = "";

    if (list.length === 0) {
      if (userTemplatesSec) userTemplatesSec.style.display = "none";
      return;
    }

    if (userTemplatesSec) userTemplatesSec.style.display = "block";
    if (userTemplateCountBadge) userTemplateCountBadge.textContent = list.length;

    list.forEach(tpl => {
      const card = document.createElement("div");
      card.className = "user-template-card";
      card.setAttribute("data-id", tpl.id);

      card.innerHTML = `
        <img class="user-template-thumb" src="${tpl.thumbnail || ''}" alt="${tpl.name}" />
        <div class="user-template-info">
          <span class="user-template-name" title="${tpl.name}">${tpl.name}</span>
          <span style="font-size: 10px; color: #00c4cc; font-weight: 700;">내 템플릿</span>
        </div>
        <div class="user-template-actions">
          <button class="user-template-action-btn edit-btn" title="템플릿 수정 (현재 디자인으로 덮어쓰기 또는 이름 변경)">✏️</button>
          <button class="user-template-action-btn delete-btn" title="템플릿 삭제">✕</button>
        </div>
      `;

      // 1. 불러오기 (Read)
      card.addEventListener("click", () => {
        cm.setCanvasSize(tpl.width || 1080, tpl.height || 1080);
        cm.fabricCanvas.loadFromJSON(tpl.canvas, () => {
          cm.fabricCanvas.renderAll();
          cm.saveHistory();
          showToast(`'${tpl.name}' 템플릿을 불러왔습니다. 자유롭게 수정하세요!`, "success");
        });
      });

      // 2. 수정 (Update): 현재 캔버스 디자인으로 덮어쓰거나 이름 변경
      const editBtn = card.querySelector(".edit-btn");
      if (editBtn) {
        editBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const choice = confirm(`'${tpl.name}' 템플릿을 현재 작업 중인 캔버스 디자인으로 덮어쓰시겠습니까?\n\n- 확인: 현재 캔버스 디자인으로 템플릿 수정 저장\n- 취소: 템플릿 이름만 변경`);
          if (choice) {
            // 현재 캔버스 디자인으로 덮어쓰기
            const canvasEl = cm.fabricCanvas.lowerCanvasEl || cm.fabricCanvas.getElement();
            const thumbCanvas = document.createElement("canvas");
            thumbCanvas.width = 240;
            thumbCanvas.height = Math.round(240 * (cm.canvasHeight / cm.canvasWidth));
            const thumbCtx = thumbCanvas.getContext("2d");
            thumbCtx.drawImage(canvasEl, 0, 0, thumbCanvas.width, thumbCanvas.height);
            const thumbnailDataUrl = thumbCanvas.toDataURL("image/jpeg", 0.85);

            tpl.thumbnail = thumbnailDataUrl;
            tpl.canvas = cm.fabricCanvas.toJSON();
            tpl.width = cm.canvasWidth;
            tpl.height = cm.canvasHeight;
            tpl.updatedAt = new Date().toISOString();

            const currentList = getUserTemplates();
            const idx = currentList.findIndex(t => t.id === tpl.id);
            if (idx !== -1) {
              currentList[idx] = tpl;
              setUserTemplates(currentList);
              renderUserTemplatesList();
              showToast(`'${tpl.name}' 템플릿이 현재 디자인으로 수정되었습니다!`, "success");
            }
          } else {
            // 이름만 변경
            const newName = prompt("변경할 새 템플릿 이름을 입력해주세요:", tpl.name);
            if (newName && newName.trim() && newName.trim() !== tpl.name) {
              tpl.name = newName.trim();
              const currentList = getUserTemplates();
              const idx = currentList.findIndex(t => t.id === tpl.id);
              if (idx !== -1) {
                currentList[idx] = tpl;
                setUserTemplates(currentList);
                renderUserTemplatesList();
                showToast(`템플릿 이름이 '${tpl.name}'(으)로 변경되었습니다!`, "success");
              }
            }
          }
        });
      }

      // 3. 삭제 (Delete)
      const delBtn = card.querySelector(".delete-btn");
      if (delBtn) {
        delBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (confirm(`'${tpl.name}' 템플릿을 삭제하시겠습니까?`)) {
            const updated = getUserTemplates().filter(t => t.id !== tpl.id);
            setUserTemplates(updated);
            renderUserTemplatesList();
            showToast("템플릿이 삭제되었습니다.");
          }
        });
      }

      userTemplatesGrid.appendChild(card);
    });
  }

  // Save current canvas as new template (생성 기능)
  if (btnSaveAsTemplate) {
    btnSaveAsTemplate.addEventListener("click", () => {
      const titleInput = document.getElementById("doc-title");
      const currentTitle = (titleInput && titleInput.value.trim()) || "나만의 카드뉴스";
      const templateName = prompt("새 템플릿의 이름을 입력해주세요:", currentTitle);
      if (!templateName || !templateName.trim()) return;

      // Generate thumbnail
      const canvasEl = cm.fabricCanvas.lowerCanvasEl || cm.fabricCanvas.getElement();
      const thumbCanvas = document.createElement("canvas");
      thumbCanvas.width = 240;
      thumbCanvas.height = Math.round(240 * (cm.canvasHeight / cm.canvasWidth));
      const thumbCtx = thumbCanvas.getContext("2d");
      thumbCtx.drawImage(canvasEl, 0, 0, thumbCanvas.width, thumbCanvas.height);
      const thumbnailDataUrl = thumbCanvas.toDataURL("image/jpeg", 0.85);

      const newTemplate = {
        id: "user_" + Date.now(),
        name: templateName.trim(),
        createdAt: new Date().toISOString(),
        width: cm.canvasWidth,
        height: cm.canvasHeight,
        thumbnail: thumbnailDataUrl,
        canvas: cm.fabricCanvas.toJSON()
      };

      const existing = getUserTemplates();
      existing.unshift(newTemplate);
      setUserTemplates(existing);
      renderUserTemplatesList();
      showToast(`'${newTemplate.name}' 템플릿이 성공적으로 저장되었습니다!`, "success");
    });
  }

  renderUserTemplatesList();

  // 5. Sidebar Tab Switching
  const navTabs = document.querySelectorAll(".nav-tab-btn");
  const panelContainers = document.querySelectorAll(".sub-panel-view");
  const panelTitle = document.getElementById("current-panel-title");

  const tabTitles = {
    templates: "비슷한 템플릿",
    text: "텍스트 추가",
    elements: "요소 (도형, 선, 아이콘)",
    charts: "차트 및 그래프",
    uploads: "내 이미지 업로드"
  };

  navTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-tab");
      navTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      panelContainers.forEach(p => {
        p.style.display = p.id === `panel-${target}` ? "block" : "none";
      });

      if (panelTitle && tabTitles[target]) {
        panelTitle.innerText = tabTitles[target];
      }
    });
  });

  // 6. Sub-category Tabs inside Elements Panel
  const subCatBtns = document.querySelectorAll(".sub-cat-btn");
  const secShapes = document.getElementById("sec-shapes");
  const secLines = document.getElementById("sec-lines");
  const secIcons = document.getElementById("sec-icons");

  subCatBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      subCatBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const cat = btn.getAttribute("data-cat");
      if (cat === "all") {
        if (secShapes) secShapes.style.display = "block";
        if (secLines) secLines.style.display = "block";
        if (secIcons) secIcons.style.display = "block";
      } else if (cat === "shapes") {
        if (secShapes) secShapes.style.display = "block";
        if (secLines) secLines.style.display = "none";
        if (secIcons) secIcons.style.display = "none";
      } else if (cat === "lines") {
        if (secShapes) secShapes.style.display = "none";
        if (secLines) secLines.style.display = "block";
        if (secIcons) secIcons.style.display = "none";
      } else if (cat === "icons") {
        if (secShapes) secShapes.style.display = "none";
        if (secLines) secLines.style.display = "none";
        if (secIcons) secIcons.style.display = "block";
      }
    });
  });

  // 7. Shapes Click Handlers (Images 3, 4, 5)
  document.querySelectorAll(".shape-card-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const shapeKey = btn.getAttribute("data-shape");
      cm.addShape(shapeKey);
      showToast("도형 요소가 추가되었습니다.");
    });
  });

  // 8. Lines Click Handlers (Image 2)
  document.querySelectorAll(".line-item-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const lineType = btn.getAttribute("data-line");
      cm.addLine(lineType);
      showToast("선 요소가 추가되었습니다.");
    });
  });

  // 9. Icons Click Handlers
  document.querySelectorAll(".icon-item-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const iconType = btn.getAttribute("data-icon");
      cm.addIcon(iconType);
      showToast("아이콘이 추가되었습니다.");
    });
  });

  // 10. Charts Click Handlers (Images 1 & 2 Style)
  document.querySelectorAll(".chart-card-item").forEach(item => {
    item.addEventListener("click", () => {
      const chartType = item.getAttribute("data-chart");
      cm.addChart(chartType);
      showToast("차트 요소가 추가되었습니다. (상단 '데이터 편집' 버튼으로 수치를 변경해보세요)", "success");
    });
  });

  // Chart Live Search Filter
  const chartSearchInput = document.getElementById("chart-search-input");
  if (chartSearchInput) {
    chartSearchInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      document.querySelectorAll("#panel-charts .chart-card-item").forEach(card => {
        const text = (card.innerText + " " + (card.getAttribute("title") || "")).toLowerCase();
        card.style.display = text.includes(q) ? "flex" : "none";
      });
    });
  }

  // 11. Text Add Handlers
  document.querySelectorAll(".add-text-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.getAttribute("data-type");
      cm.addText(type);
      showToast("텍스트가 추가되었습니다.");
    });
  });

  // 12. Strict Multi-Image Upload (Max 10 per batch, Max 40 capacity)
  const fileInput = document.getElementById("image-file-input");
  const dropzone = document.getElementById("upload-dropzone");
  const uploadsGallery = document.getElementById("uploads-gallery");
  const uploadCountLabel = document.getElementById("upload-count-label");
  const btnClearUploads = document.getElementById("btn-clear-uploads");

  const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png"];
  const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];
  const MAX_PER_BATCH = 10;
  const MAX_CAPACITY = 40;

  function validateImageFile(file) {
    if (!file) return false;
    const name = file.name.toLowerCase();
    const ext = name.substring(name.lastIndexOf(".") + 1);
    
    const isExtensionValid = ALLOWED_EXTENSIONS.includes(ext);
    const isMimeValid = ALLOWED_MIME_TYPES.includes(file.type);

    if (!isExtensionValid || !isMimeValid) {
      showToast(`'${file.name}'은(는) 허용되지 않는 확장자입니다. (JPG, JPEG, PNG만 가능)`, "error");
      return false;
    }
    return true;
  }

  function updateUploadCountUI() {
    if (uploadCountLabel) {
      uploadCountLabel.innerText = `내 업로드 목록 (${state.uploadedImages.length}/${MAX_CAPACITY})`;
    }
  }

  function renderUploadsGallery() {
    if (!uploadsGallery) return;
    uploadsGallery.innerHTML = "";
    state.uploadedImages.forEach((imgObj, idx) => {
      const thumb = document.createElement("div");
      thumb.className = "uploaded-thumb";
      thumb.style.position = "relative";
      thumb.title = imgObj.name;
      thumb.innerHTML = `
        <img src="${imgObj.dataUrl}" alt="${imgObj.name}" />
        <button class="thumb-delete-btn" title="사진 삭제" style="position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; border-radius: 50%; background: rgba(15,23,42,0.75); color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; transition: background 0.15s;">✕</button>
      `;
      // Click thumbnail to add onto canvas
      thumb.querySelector("img").addEventListener("click", () => {
        cm.addImageFromDataUrl(imgObj.dataUrl);
        showToast("사진이 캔버스에 추가되었습니다.", "success");
      });
      // Delete button
      thumb.querySelector(".thumb-delete-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        state.uploadedImages.splice(idx, 1);
        renderUploadsGallery();
      });
      uploadsGallery.appendChild(thumb);
    });
    updateUploadCountUI();
  }

  if (btnClearUploads) {
    btnClearUploads.addEventListener("click", () => {
      if (state.uploadedImages.length === 0) return;
      if (confirm("보관함의 모든 사진을 삭제하시겠습니까?")) {
        state.uploadedImages = [];
        renderUploadsGallery();
        showToast("사진 보관함이 비워졌습니다.");
      }
    });
  }

  function readAndOptimizeImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1920;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", 0.92));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleMultipleFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    let files = Array.from(fileList);

    if (files.length > MAX_PER_BATCH) {
      showToast(`한 번에 최대 ${MAX_PER_BATCH}장까지만 업로드할 수 있습니다. (첫 ${MAX_PER_BATCH}장만 추가됩니다)`, "error");
      files = files.slice(0, MAX_PER_BATCH);
    }

    const availableSlots = MAX_CAPACITY - state.uploadedImages.length;
    if (availableSlots <= 0) {
      showToast(`사진 보관함이 가득 찼습니다 (최대 ${MAX_CAPACITY}장). 기존 사진을 삭제 후 업로드해주세요.`, "error");
      return;
    }

    if (files.length > availableSlots) {
      showToast(`남은 보관 슬롯(${availableSlots}장)만큼만 추가됩니다.`, "error");
      files = files.slice(0, availableSlots);
    }

    let addedCount = 0;
    for (const file of files) {
      if (!validateImageFile(file)) continue;
      try {
        const optimizedDataUrl = await readAndOptimizeImage(file);
        state.uploadedImages.unshift({
          id: Date.now() + Math.random(),
          name: file.name,
          dataUrl: optimizedDataUrl
        });
        if (addedCount === 0) {
          cm.addImageFromDataUrl(optimizedDataUrl);
        }
        addedCount++;
      } catch (err) {
        console.error("Image load error:", err);
      }
    }

    renderUploadsGallery();
    if (addedCount > 0) {
      showToast(`${addedCount}장의 사진이 보관함에 추가되었습니다.`, "success");
    }
  }

  if (dropzone && fileInput) {
    dropzone.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleMultipleFiles(e.target.files);
      }
      fileInput.value = "";
    });

    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });

    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("dragover");
    });

    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
      if (e.dataTransfer && e.dataTransfer.files) {
        handleMultipleFiles(e.dataTransfer.files);
      }
    });
  }

  // 13. Size Popover & Custom Resizing (Image 3 Style)
  const sizeTriggerBtn = document.getElementById("btn-size-trigger");
  const sizePopover = document.getElementById("size-popover");
  const popoverBackdrop = document.getElementById("popover-backdrop");
  const inputCustomW = document.getElementById("custom-width-input");
  const inputCustomH = document.getElementById("custom-height-input");
  const btnRatioLock = document.getElementById("btn-ratio-lock");
  const btnApplySize = document.getElementById("btn-apply-size");

  function openSizePopover() {
    inputCustomW.value = cm.canvasWidth;
    inputCustomH.value = cm.canvasHeight;
    state.currentRatio = cm.canvasWidth / cm.canvasHeight;
    sizePopover.classList.add("active");
    popoverBackdrop.classList.add("active");
  }

  function closeSizePopover() {
    sizePopover.classList.remove("active");
    popoverBackdrop.classList.remove("active");
  }

  if (sizeTriggerBtn && sizePopover) {
    sizeTriggerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (sizePopover.classList.contains("active")) {
        closeSizePopover();
      } else {
        openSizePopover();
      }
    });

    popoverBackdrop.addEventListener("click", () => {
      closeSizePopover();
      tb.closeAllPopovers();
    });

    btnRatioLock.addEventListener("click", () => {
      state.aspectRatioLocked = !state.aspectRatioLocked;
      btnRatioLock.classList.toggle("locked", state.aspectRatioLocked);
      btnRatioLock.title = state.aspectRatioLocked ? "비율 고정됨" : "비율 고정 해제";
    });

    inputCustomW.addEventListener("input", () => {
      if (state.aspectRatioLocked && state.currentRatio) {
        const w = parseInt(inputCustomW.value, 10);
        if (!isNaN(w) && w > 0) {
          inputCustomH.value = Math.round(w / state.currentRatio);
        }
      }
    });

    inputCustomH.addEventListener("input", () => {
      if (state.aspectRatioLocked && state.currentRatio) {
        const h = parseInt(inputCustomH.value, 10);
        if (!isNaN(h) && h > 0) {
          inputCustomW.value = Math.round(h * state.currentRatio);
        }
      }
    });

    document.querySelectorAll(".size-preset-btn").forEach(preset => {
      preset.addEventListener("click", () => {
        const w = parseInt(preset.getAttribute("data-w"), 10);
        const h = parseInt(preset.getAttribute("data-h"), 10);
        inputCustomW.value = w;
        inputCustomH.value = h;
        state.currentRatio = w / h;
        cm.setCanvasSize(w, h);
        closeSizePopover();
        showToast(`캔버스 크기가 ${w}×${h}px 로 변경되었습니다.`, "success");
      });
    });

    btnApplySize.addEventListener("click", () => {
      const w = parseInt(inputCustomW.value, 10);
      const h = parseInt(inputCustomH.value, 10);
      if (isNaN(w) || isNaN(h) || w < 100 || h < 100 || w > 4000 || h > 4000) {
        showToast("너비와 높이는 100~4000px 사이로 입력해주세요.", "error");
        return;
      }
      cm.setCanvasSize(w, h);
      closeSizePopover();
      showToast(`사이즈가 ${w}×${h}px 로 적용되었습니다.`, "success");
    });
  }

  // 14. Zoom Controls
  document.getElementById("btn-zoom-in").addEventListener("click", () => cm.zoomIn());
  document.getElementById("btn-zoom-out").addEventListener("click", () => cm.zoomOut());
  document.getElementById("btn-zoom-fit").addEventListener("click", () => cm.zoomFit());

  // 15. Undo / Redo & Download Modal (Images 1 & 2 Style)
  document.getElementById("btn-undo").addEventListener("click", () => cm.undo());
  document.getElementById("btn-redo").addEventListener("click", () => cm.redo());

  // Download Modal Elements
  const downloadBtn = document.getElementById("btn-download");
  const modalDownload = document.getElementById("modal-download");
  const downloadBackdrop = document.getElementById("download-modal-backdrop");
  const btnCloseDownload = document.getElementById("btn-close-download-modal");
  const formatTrigger = document.getElementById("format-select-trigger");
  const selectedFormatName = document.getElementById("selected-format-name");
  const formatArrowIcon = document.getElementById("format-arrow-icon");
  const formatDropdownMenu = document.getElementById("format-dropdown-menu");
  const formatOptionItems = document.querySelectorAll(".format-option-item");
  const rowTransparentBg = document.getElementById("row-transparent-bg");
  const chkTransparentBg = document.getElementById("chk-transparent-bg");
  const selectDownloadScale = document.getElementById("select-download-scale");
  const selectDownloadPages = document.getElementById("select-download-pages");
  const chkMergeSlides = document.getElementById("chk-merge-slides");
  const inputDownloadFilename = document.getElementById("input-download-filename");
  const labelDownloadExt = document.getElementById("label-download-ext");
  const infoPageCount = document.getElementById("info-page-count");
  const infoResolution = document.getElementById("info-resolution");
  const btnExecuteDownload = document.getElementById("btn-execute-download");

  // Selected format state
  let currentFormat = "png";
  let currentFormatExt = "png";
  let currentFormatMime = "image/png";

  function updateDownloadResolution() {
    const scale = parseFloat(selectDownloadScale ? selectDownloadScale.value : 1) || 1;
    const w = Math.round(cm.canvasWidth * scale);
    const h = Math.round(cm.canvasHeight * scale);
    if (infoResolution) {
      infoResolution.textContent = `${w} × ${h} px`;
    }
  }

  function updateDownloadPagesInfo() {
    const totalPages = state.slides.length;
    const isAll = selectDownloadPages && selectDownloadPages.value === "all";
    if (infoPageCount) {
      infoPageCount.textContent = isAll ? `${totalPages} 페이지` : "1 페이지";
    }
  }

  function openDownloadModal() {
    if (!modalDownload) return;

    // Sync title with doc title input
    const titleInput = document.getElementById("doc-title");
    const title = (titleInput && titleInput.value.trim()) || "카드뉴스_디자인";
    if (inputDownloadFilename) {
      inputDownloadFilename.value = title;
    }

    // Sync pages dropdown options with current slide count
    if (selectDownloadPages) {
      const totalPages = state.slides.length;
      const currentPageNum = state.activeSlideIndex + 1;
      selectDownloadPages.innerHTML = `
        <option value="all">모든 페이지 (1~${totalPages})</option>
        <option value="current">현재 페이지만 (${currentPageNum}페이지)</option>
      `;
    }

    // Update scale option labels with current canvas dimensions
    if (selectDownloadScale) {
      const w = cm.canvasWidth;
      const h = cm.canvasHeight;
      selectDownloadScale.innerHTML = `
        <option value="1">1배 (${w} × ${h} px)</option>
        <option value="1.5">1.5배 (${Math.round(w * 1.5)} × ${Math.round(h * 1.5)} px)</option>
        <option value="2">2배 (${w * 2} × ${h * 2} px, 초고화질)</option>
        <option value="3">3배 (${w * 3} × ${h * 3} px, 인쇄급)</option>
      `;
      selectDownloadScale.value = "1";
    }

    updateDownloadResolution();
    updateDownloadPagesInfo();

    modalDownload.style.display = "block";
    if (downloadBackdrop) downloadBackdrop.style.display = "block";
    closeFormatDropdown();
  }

  function closeDownloadModal() {
    if (modalDownload) modalDownload.style.display = "none";
    if (downloadBackdrop) downloadBackdrop.style.display = "none";
    closeFormatDropdown();
  }

  function toggleFormatDropdown() {
    if (!formatDropdownMenu) return;
    const isOpen = formatDropdownMenu.style.display === "block";
    if (isOpen) {
      closeFormatDropdown();
    } else {
      openFormatDropdown();
    }
  }

  function openFormatDropdown() {
    if (!formatDropdownMenu) return;
    formatDropdownMenu.style.display = "block";
    if (formatArrowIcon) {
      formatArrowIcon.style.transform = "rotate(180deg)";
    }
  }

  function closeFormatDropdown() {
    if (!formatDropdownMenu) return;
    formatDropdownMenu.style.display = "none";
    if (formatArrowIcon) {
      formatArrowIcon.style.transform = "rotate(0deg)";
    }
  }

  if (downloadBtn) {
    downloadBtn.addEventListener("click", openDownloadModal);
  }

  if (btnCloseDownload) {
    btnCloseDownload.addEventListener("click", closeDownloadModal);
  }

  if (downloadBackdrop) {
    downloadBackdrop.addEventListener("click", closeDownloadModal);
  }

  if (formatTrigger) {
    formatTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFormatDropdown();
    });
  }

  // Format Selection Items (PNG, JPG, PDF-web, PDF-print, PPTX, MP4, GIF)
  formatOptionItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      const format = item.getAttribute("data-format");
      const name = item.getAttribute("data-name");
      const ext = item.getAttribute("data-ext");
      const mime = item.getAttribute("data-mime");

      currentFormat = format;
      currentFormatExt = ext;
      currentFormatMime = mime;

      // Update trigger button text
      if (selectedFormatName) {
        selectedFormatName.textContent = name;
      }

      // Update extension suffix
      if (labelDownloadExt) {
        labelDownloadExt.textContent = `.${ext}`;
      }

      // Active state on dropdown items & checkmark
      formatOptionItems.forEach((opt) => {
        opt.classList.remove("active");
        const check = opt.querySelector(".format-opt-check");
        if (check) check.style.display = "none";
      });
      item.classList.add("active");
      const currentCheck = item.querySelector(".format-opt-check");
      if (currentCheck) currentCheck.style.display = "block";

      // Transparent BG is only for PNG
      if (rowTransparentBg) {
        if (format === "png") {
          rowTransparentBg.style.display = "flex";
        } else {
          rowTransparentBg.style.display = "none";
        }
      }

      // JSON format info adjustments
      const scaleRow = selectDownloadScale ? selectDownloadScale.closest(".download-form-group") : null;
      if (scaleRow) {
        if (format === "json") {
          scaleRow.style.display = "none";
        } else {
          scaleRow.style.display = "block";
        }
      }

      closeFormatDropdown();
    });
  });

  // Close format dropdown on outside click
  document.addEventListener("click", (e) => {
    if (formatDropdownMenu && formatDropdownMenu.style.display === "block") {
      if (!formatDropdownMenu.contains(e.target) && !formatTrigger.contains(e.target)) {
        closeFormatDropdown();
      }
    }
  });

  if (selectDownloadScale) {
    selectDownloadScale.addEventListener("change", updateDownloadResolution);
  }

  if (selectDownloadPages) {
    selectDownloadPages.addEventListener("change", updateDownloadPagesInfo);
  }

  // Execute High-Res Download with Native OS Save Picker
  if (btnExecuteDownload) {
    btnExecuteDownload.addEventListener("click", async () => {
      const originalText = btnExecuteDownload.innerHTML;
      btnExecuteDownload.disabled = true;
      btnExecuteDownload.innerHTML = `
        <span style="display:inline-flex; align-items:center; gap:8px;">
          <svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.3"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg>
          파일 저장 중...
        </span>
      `;

      try {
        const rawFileName = (inputDownloadFilename && inputDownloadFilename.value.trim()) || "카드뉴스_디자인";
        const scale = parseFloat(selectDownloadScale ? selectDownloadScale.value : 1) || 1;
        const transparent = currentFormat === "png" && chkTransparentBg && chkTransparentBg.checked;

        const success = await cm.exportFileWithOptions({
          format: currentFormat,
          fileName: rawFileName,
          extension: currentFormatExt,
          mimeType: currentFormatMime,
          scale: scale,
          transparentBg: transparent
        });

        if (success) {
          closeDownloadModal();
        }
      } catch (err) {
        console.error("Export error:", err);
        showToast("파일 내보내기 중 문제가 발생했습니다: " + (err.message || err), "error");
      } finally {
        btnExecuteDownload.disabled = false;
        btnExecuteDownload.innerHTML = originalText;
      }
    });
  }

  // 15-1. Top Header JSON Import & Export (Checklist Requirement 5: JSON 복원 및 원본 안전)
  const btnJsonImport = document.getElementById("btn-json-import");
  const btnJsonExport = document.getElementById("btn-json-export");
  const inputJsonImport = document.getElementById("input-json-import");

  if (btnJsonExport) {
    btnJsonExport.addEventListener("click", async () => {
      const titleInput = document.getElementById("doc-title");
      const currentTitle = (titleInput && titleInput.value.trim()) || "카드뉴스_프로젝트";
      try {
        await cm.exportFileWithOptions({
          format: "json",
          fileName: currentTitle,
          extension: "json",
          mimeType: "application/json"
        });
      } catch (err) {
        console.error("JSON Export error:", err);
        showToast("JSON 파일 저장 실패: " + (err.message || err), "error");
      }
    });
  }

  if (btnJsonImport && inputJsonImport) {
    btnJsonImport.addEventListener("click", () => {
      inputJsonImport.value = "";
      inputJsonImport.click();
    });

    inputJsonImport.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (!file.name.toLowerCase().endsWith(".json") && file.type !== "application/json") {
        showToast("올바른 JSON 프로젝트 백업 파일을 선택해주세요.", "error");
        return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const rawContent = event.target.result;
          await cm.importProjectJson(rawContent);

          // Update title if available
          const fileNameWithoutExt = file.name.replace(/\.json$/i, "");
          const titleInput = document.getElementById("doc-title");
          if (titleInput && fileNameWithoutExt) {
            titleInput.value = fileNameWithoutExt;
          }

          showToast("JSON 프로젝트가 캔버스에 100% 성공적으로 복원되었습니다!", "success");
        } catch (err) {
          console.error("JSON Import restoration error:", err);
          showToast("JSON 복원 실패: 파일이 손상되었거나 호환되지 않는 형식입니다.", "error");
        }
      };

      reader.onerror = () => {
        showToast("파일을 읽는 중 문제가 발생했습니다.", "error");
      };

      reader.readAsText(file);
    });
  }

  // 16. Multi-slide Pages Management
  const slidesListContainer = document.getElementById("slides-list");
  const addSlideBtn = document.getElementById("btn-add-slide");

  function renderSlides() {
    if (!slidesListContainer) return;
    slidesListContainer.innerHTML = "";

    state.slides.forEach((slide, index) => {
      const slideCard = document.createElement("div");
      slideCard.className = `slide-thumb-card ${index === state.activeSlideIndex ? "active" : ""}`;
      slideCard.innerHTML = `
        <span style="font-size:14px;">📄</span>
        <span class="slide-thumb-num">${index + 1}</span>
      `;

      slideCard.addEventListener("click", () => {
        if (index === state.activeSlideIndex) return;
        state.slides[state.activeSlideIndex].json = JSON.stringify(cm.fabricCanvas.toJSON());
        state.activeSlideIndex = index;

        if (state.slides[index].json) {
          cm.fabricCanvas.loadFromJSON(state.slides[index].json, () => {
            cm.fabricCanvas.renderAll();
          });
        } else {
          cm.fabricCanvas.clear();
          cm.fabricCanvas.setBackgroundColor("#ffffff", () => cm.fabricCanvas.renderAll());
        }
        renderSlides();
      });

      slidesListContainer.appendChild(slideCard);
    });
  }
  renderSlides();

  if (addSlideBtn) {
    addSlideBtn.addEventListener("click", () => {
      state.slides[state.activeSlideIndex].json = JSON.stringify(cm.fabricCanvas.toJSON());
      state.slides.push({ id: state.slides.length + 1, json: null });
      state.activeSlideIndex = state.slides.length - 1;
      cm.fabricCanvas.clear();
      cm.fabricCanvas.setBackgroundColor("#ffffff", () => cm.fabricCanvas.renderAll());
      renderSlides();
      showToast("새 슬라이드가 추가되었습니다.");
    });
  }

  // 17. Global Keyboard Shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    if (e.key === "Delete" || e.key === "Backspace") {
      const activeObj = cm.fabricCanvas.getActiveObject();
      if (activeObj && !activeObj.isEditing) {
        e.preventDefault();
        cm.deleteSelected();
      }
    }

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) cm.redo();
      else cm.undo();
    }

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
      e.preventDefault();
      cm.duplicateSelected();
    }
  });

  // 18. Toast Notification Utility
  function showToast(message, type = "normal") {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s";
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  window.showToast = showToast;
});
