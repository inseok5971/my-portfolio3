/**
 * Floating Toolbar Controller (Images 1 & 2)
 * Seamlessly switches between Text formatting (Image 2) and Element formatting (Image 1)
 * Includes interactive 2D Color Spectrum Picker (Click & Drag) with HSV conversion
 */

class ToolbarController {
  constructor(canvasManager) {
    this.cm = canvasManager;
    this.canvas = canvasManager.fabricCanvas;
    this.toolbar = document.getElementById("floating-toolbar");

    this.activePopover = null;
    this.currentHSV = { h: 210, s: 50, v: 50 };
    this.isDraggingSpectrum = false;

    this.initElements();
    this.bindCanvasEvents();
    this.bindToolbarEvents();
    this.initColorSpectrumPicker();
  }

  initElements() {
    // Shape Only Elements (Image 1)
    this.btnShapeColor = document.getElementById("tb-shape-color-btn");
    this.shapeColorCircle = document.getElementById("shape-color-circle");
    this.btnShapeBorder = document.getElementById("tb-shape-border-btn");
    this.btnShapeRadius = document.getElementById("tb-shape-radius-btn");
    this.btnFlip = document.getElementById("tb-btn-flip");

    // Text Only Elements (Image 2)
    this.fontFamilyBtn = document.getElementById("tb-font-family");
    this.currentFontName = document.getElementById("current-font-name");
    this.fontSizeInput = document.getElementById("tb-font-size");
    this.btnFontMinus = document.getElementById("tb-font-minus");
    this.btnFontPlus = document.getElementById("tb-font-plus");
    this.textColorPicker = document.getElementById("tb-text-color-picker");
    this.textColorIndicator = document.getElementById("text-color-indicator");
    this.bgColorPicker = document.getElementById("tb-bg-color-picker");
    this.bgColorIndicator = document.getElementById("bg-color-indicator");

    this.btnBold = document.getElementById("tb-btn-bold");
    this.btnItalic = document.getElementById("tb-btn-italic");
    this.btnUnderline = document.getElementById("tb-btn-underline");
    this.btnLinethrough = document.getElementById("tb-btn-strike");
    this.btnAlign = document.getElementById("tb-btn-align");
    this.btnAdjustText = document.getElementById("tb-btn-adjust");

    // Universal Elements
    this.btnEffect = document.getElementById("tb-btn-effect");
    this.btnOpacity = document.getElementById("tb-btn-opacity");
    this.btnCanvasAlign = document.getElementById("tb-btn-align-canvas");
    this.btnTransform = document.getElementById("tb-btn-transform");
    this.btnArrange = document.getElementById("tb-btn-arrange");
    this.btnGroup = document.getElementById("tb-btn-group");
    this.groupBtnLabel = document.getElementById("tb-group-btn-label");
    this.btnChartData = document.getElementById("tb-btn-chart-data");
    this.btnLock = document.getElementById("tb-btn-lock");
    this.btnDuplicate = document.getElementById("tb-btn-duplicate");
    this.btnDelete = document.getElementById("tb-btn-delete");

    // Popovers
    this.popoverAdvColor = document.getElementById("popover-advanced-color");
    this.popoverBorder = document.getElementById("popover-shape-border");
    this.popoverRadius = document.getElementById("popover-shape-radius");
    this.popoverEffect = document.getElementById("popover-effect");
    this.popoverOpacity = document.getElementById("popover-opacity");
    this.popoverFlip = document.getElementById("popover-flip");
    this.popoverChartData = document.getElementById("popover-chart-data");
    this.popoverFont = document.getElementById("popover-fonts");
    this.popoverAdjust = document.getElementById("popover-text-adjust");
    this.popoverAlign = document.getElementById("popover-align-canvas");
    this.popoverTransform = document.getElementById("popover-transform");
    this.popoverArrange = document.getElementById("popover-arrange");

    // Chart Dynamic Popover Inputs
    this.chartTypeBadge = document.getElementById("chart-type-badge");
    this.chartGaugeGroup = document.getElementById("chart-gauge-control-group");
    this.inputChartGaugePct = document.getElementById("input-chart-gauge-pct");
    this.valChartGauge = document.getElementById("val-chart-gauge");
    this.inputChartGaugeNum = document.getElementById("input-chart-gauge-num");
    this.chartBarGroup = document.getElementById("chart-bar-control-group");
    this.inputBar1 = document.getElementById("input-bar-1");
    this.valBar1 = document.getElementById("val-bar-1");
    this.inputBar2 = document.getElementById("input-bar-2");
    this.valBar2 = document.getElementById("val-bar-2");
    this.inputBar3 = document.getElementById("input-bar-3");
    this.valBar3 = document.getElementById("val-bar-3");
    this.inputBar4 = document.getElementById("input-bar-4");
    this.valBar4 = document.getElementById("val-bar-4");

    // Popover Inputs
    this.inputHexCode = document.getElementById("input-hex-code");
    this.btnApplyHex = document.getElementById("btn-apply-hex");
    this.activeColorSwatch = document.getElementById("active-color-swatch");
    this.inputHueSlider = document.getElementById("input-hue-slider");
    this.colorSpectrumBox = document.getElementById("color-spectrum-area");
    this.spectrumPickerDot = document.getElementById("color-spectrum-picker");

    this.inputBorderWidth = document.getElementById("input-border-width");
    this.valBorderWidth = document.getElementById("val-border-width");
    this.inputBorderColor = document.getElementById("input-border-color");

    this.inputCornerRadius = document.getElementById("input-corner-radius");
    this.valCornerRadius = document.getElementById("val-corner-radius");

    this.chkShadow = document.getElementById("chk-shadow");
    this.shadowDetailsBox = document.getElementById("shadow-details-box");
    this.shadowColorPicker = document.getElementById("shadow-color-picker");
    this.inputShadowBlur = document.getElementById("input-shadow-blur");
    this.valShadowBlur = document.getElementById("val-shadow-blur");

    this.inputOpacity = document.getElementById("input-opacity");
    this.valOpacity = document.getElementById("val-opacity");

    this.inputRotation = document.getElementById("input-rotation");
    this.valRotation = document.getElementById("val-rotation");
    this.inputSkewX = document.getElementById("input-skew-x");
    this.valSkewX = document.getElementById("val-skew-x");
    this.inputSkewY = document.getElementById("input-skew-y");
    this.valSkewY = document.getElementById("val-skew-y");
  }

  /**
   * HSV <-> RGB/HEX Color Utilities
   */
  hsvToHex(h, s, v) {
    s = s / 100;
    v = v / 100;
    let c = v * s;
    let x = c * (1 - Math.abs((h / 60) % 2 - 1));
    let m = v - c;
    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else if (h >= 300 && h <= 360) {
      r = c; g = 0; b = x;
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    const toHex = (n) => n.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  hexToHsv(hex) {
    if (!hex || typeof hex !== "string") return { h: 210, s: 50, v: 50 };
    let c = hex.replace("#", "");
    if (c.length === 3) c = c.split("").map(x => x + x).join("");
    if (c.length !== 6) return { h: 210, s: 50, v: 50 };

    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;

    if (max !== min) {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h = h * 60;
    }
    return { h: Math.round(h), s: Math.round(s * 100), v: Math.round(v * 100) };
  }

  /**
   * Interactive 2D Color Spectrum Picker (Click & Drag Support)
   */
  initColorSpectrumPicker() {
    if (!this.colorSpectrumBox) return;

    const updateColorFromPointer = (clientX, clientY) => {
      const rect = this.colorSpectrumBox.getBoundingClientRect();
      const w = rect.width > 0 ? rect.width : (this.colorSpectrumBox.offsetWidth || 260);
      const h = rect.height > 0 ? rect.height : (this.colorSpectrumBox.offsetHeight || 120);

      const x = Math.max(0, Math.min(clientX - rect.left, w));
      const y = Math.max(0, Math.min(clientY - rect.top, h));

      if (this.spectrumPickerDot) {
        this.spectrumPickerDot.style.left = `${x}px`;
        this.spectrumPickerDot.style.top = `${y}px`;
      }

      this.currentHSV.s = Math.round((x / w) * 100);
      this.currentHSV.v = Math.round((1 - (y / h)) * 100);
      const hVal = this.inputHueSlider ? parseInt(this.inputHueSlider.value, 10) : 210;
      this.currentHSV.h = isNaN(hVal) ? 210 : hVal;

      const hex = this.hsvToHex(this.currentHSV.h, this.currentHSV.s, this.currentHSV.v);
      this.applyColorToActive(hex, false);
    };

    // 1. Mouse interactions (Click & Drag)
    this.colorSpectrumBox.addEventListener("mousedown", (e) => {
      e.preventDefault();
      this.isDraggingSpectrum = true;
      updateColorFromPointer(e.clientX, e.clientY);
    });

    this.colorSpectrumBox.addEventListener("click", (e) => {
      updateColorFromPointer(e.clientX, e.clientY);
      this.cm.saveHistory();
    });

    window.addEventListener("mousemove", (e) => {
      if (this.isDraggingSpectrum) {
        updateColorFromPointer(e.clientX, e.clientY);
      }
    });

    window.addEventListener("mouseup", () => {
      if (this.isDraggingSpectrum) {
        this.isDraggingSpectrum = false;
        this.cm.saveHistory();
      }
    });

    // 2. Touch interactions (Trackpad & Mobile)
    this.colorSpectrumBox.addEventListener("touchstart", (e) => {
      if (e.touches && e.touches[0]) {
        this.isDraggingSpectrum = true;
        updateColorFromPointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
      if (this.isDraggingSpectrum && e.touches && e.touches[0]) {
        updateColorFromPointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener("touchend", () => {
      if (this.isDraggingSpectrum) {
        this.isDraggingSpectrum = false;
        this.cm.saveHistory();
      }
    });

    // 3. Hue Slider input
    if (this.inputHueSlider) {
      this.inputHueSlider.addEventListener("input", (e) => {
        const hue = parseInt(e.target.value, 10);
        this.currentHSV.h = isNaN(hue) ? 210 : hue;
        this.updateSpectrumGradient(this.currentHSV.h);
        const hex = this.hsvToHex(this.currentHSV.h, this.currentHSV.s, this.currentHSV.v);
        this.applyColorToActive(hex, false);
      });
      this.inputHueSlider.addEventListener("change", () => this.cm.saveHistory());
    }
  }

  updateSpectrumGradient(hue) {
    if (!this.colorSpectrumBox) return;
    this.colorSpectrumBox.style.background = `
      linear-gradient(to bottom, transparent, #000000),
      linear-gradient(to right, #ffffff, hsl(${hue}, 100%, 50%))
    `;
  }

  syncSpectrumWithColor(hex) {
    if (!hex || !this.colorSpectrumBox) return;
    const hsv = this.hexToHsv(hex);
    this.currentHSV = hsv;

    if (this.inputHueSlider) {
      this.inputHueSlider.value = hsv.h;
    }
    this.updateSpectrumGradient(hsv.h);

    const rect = this.colorSpectrumBox.getBoundingClientRect();
    const w = rect.width > 0 ? rect.width : (this.colorSpectrumBox.offsetWidth || 260);
    const h = rect.height > 0 ? rect.height : (this.colorSpectrumBox.offsetHeight || 120);
    const x = (hsv.s / 100) * w;
    const y = (1 - (hsv.v / 100)) * h;

    if (this.spectrumPickerDot) {
      this.spectrumPickerDot.style.left = `${x}px`;
      this.spectrumPickerDot.style.top = `${y}px`;
    }
  }

  bindCanvasEvents() {
    this.canvas.on("selection:created", (e) => this.updateToolbar(e.selected[0]));
    this.canvas.on("selection:updated", (e) => this.updateToolbar(e.selected[0]));
    this.canvas.on("selection:cleared", () => this.hideToolbar());
    this.canvas.on("object:modified", (e) => this.syncValues(e.target));
  }

  bindToolbarEvents() {
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".floating-toolbar-container") && !e.target.closest(".toolbar-popover")) {
        this.closeAllPopovers();
      }
    });

    // 1. Color Circle (Image 1, 2)
    if (this.btnShapeColor) {
      this.btnShapeColor.addEventListener("click", (e) => {
        e.stopPropagation();
        this.togglePopover(this.popoverAdvColor, this.btnShapeColor);
        const obj = this.canvas.getActiveObject();
        if (obj) {
          const fill = typeof obj.fill === "string" ? obj.fill : "#70798F";
          this.syncSpectrumWithColor(fill);
        }
      });
    }

    // Palette Dot Clicks
    document.querySelectorAll(".palette-dot").forEach(dot => {
      dot.addEventListener("click", () => {
        const color = dot.getAttribute("data-color");
        this.applyColorToActive(color, true);
        this.syncSpectrumWithColor(color);
      });
    });

    // Hex Input Apply
    if (this.btnApplyHex && this.inputHexCode) {
      const applyHex = () => {
        let hex = this.inputHexCode.value.trim();
        if (!hex.startsWith("#")) hex = "#" + hex;
        if (/^#[0-9A-Fa-f]{6}$/.test(hex) || /^#[0-9A-Fa-f]{3}$/.test(hex)) {
          this.applyColorToActive(hex, true);
          this.syncSpectrumWithColor(hex);
        } else {
          alert("올바른 HEX 색상 코드를 입력해주세요 (예: #70798F)");
        }
      };
      this.btnApplyHex.addEventListener("click", applyHex);
      this.inputHexCode.addEventListener("keydown", (e) => {
        if (e.key === "Enter") applyHex();
      });
      this.inputHexCode.addEventListener("input", (e) => {
        let val = e.target.value.trim();
        if (!val.startsWith("#")) val = "#" + val;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          this.applyColorToActive(val, false);
          this.syncSpectrumWithColor(val);
        }
      });
    }

    // Text Color button also uses rich color picker
    const btnTextColor = document.getElementById("tb-text-color-btn");
    if (btnTextColor) {
      btnTextColor.addEventListener("click", (e) => {
        e.stopPropagation();
        this.togglePopover(this.popoverAdvColor, btnTextColor);
        const obj = this.canvas.getActiveObject();
        if (obj) {
          const fill = typeof obj.fill === "string" ? obj.fill : "#000000";
          this.syncSpectrumWithColor(fill);
        }
      });
    }

    // 2. Border & Stroke Width (≡)
    if (this.btnShapeBorder) {
      this.btnShapeBorder.addEventListener("click", (e) => {
        e.stopPropagation();
        this.togglePopover(this.popoverBorder, this.btnShapeBorder);
      });
    }
    if (this.inputBorderWidth) {
      this.inputBorderWidth.addEventListener("input", (e) => {
        const w = parseInt(e.target.value, 10);
        this.valBorderWidth.innerText = `${w}px`;
        this.cm.setShapeBorder(w, this.inputBorderColor ? this.inputBorderColor.value : "#1e293b");
      });
    }
    if (this.inputBorderColor) {
      this.inputBorderColor.addEventListener("input", (e) => {
        this.cm.setShapeBorder(null, e.target.value);
      });
    }

    // 3. Corner Radius (꼭짓점 라운드 ◜)
    if (this.btnShapeRadius) {
      this.btnShapeRadius.addEventListener("click", (e) => {
        e.stopPropagation();
        this.togglePopover(this.popoverRadius, this.btnShapeRadius);
      });
    }
    if (this.inputCornerRadius) {
      this.inputCornerRadius.addEventListener("input", (e) => {
        const r = parseInt(e.target.value, 10);
        this.valCornerRadius.innerText = `${r}px`;
        this.cm.setCornerRadius(r);
      });
    }

    // 4. Effect (그림자 넣을건지 말건지)
    this.btnEffect.addEventListener("click", (e) => {
      e.stopPropagation();
      this.togglePopover(this.popoverEffect, this.btnEffect);
    });

    if (this.chkShadow) {
      this.chkShadow.addEventListener("change", () => {
        const checked = this.chkShadow.checked;
        if (this.shadowDetailsBox) {
          this.shadowDetailsBox.style.display = checked ? "block" : "none";
        }
        const color = this.shadowColorPicker ? this.shadowColorPicker.value : "rgba(0,0,0,0.35)";
        const blur = this.inputShadowBlur ? parseInt(this.inputShadowBlur.value, 10) : 15;
        this.cm.toggleShadow(checked, blur, color);
      });
    }
    if (this.shadowColorPicker) {
      this.shadowColorPicker.addEventListener("input", (e) => {
        if (this.chkShadow && this.chkShadow.checked) {
          this.cm.toggleShadow(true, this.inputShadowBlur ? this.inputShadowBlur.value : 15, e.target.value);
        }
      });
    }
    if (this.inputShadowBlur) {
      this.inputShadowBlur.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        if (this.valShadowBlur) this.valShadowBlur.innerText = `${val}`;
        if (this.chkShadow && this.chkShadow.checked) {
          this.cm.toggleShadow(true, val, this.shadowColorPicker ? this.shadowColorPicker.value : "rgba(0,0,0,0.35)");
        }
      });
    }

    // 5. Opacity (0%~100% 일자 그래프 슬라이더)
    this.btnOpacity.addEventListener("click", (e) => {
      e.stopPropagation();
      this.togglePopover(this.popoverOpacity, this.btnOpacity);
    });

    this.inputOpacity.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      this.valOpacity.innerText = `${val}%`;
      const obj = this.canvas.getActiveObject();
      if (obj) {
        obj.set("opacity", val / 100);
        this.canvas.renderAll();
      }
    });
    this.inputOpacity.addEventListener("change", () => this.cm.saveHistory());

    // 6. Flip (좌우 / 상하 반전)
    if (this.btnFlip) {
      this.btnFlip.addEventListener("click", (e) => {
        e.stopPropagation();
        this.togglePopover(this.popoverFlip, this.btnFlip);
      });
    }
    const btnFlipX = document.getElementById("btn-flip-x");
    const btnFlipY = document.getElementById("btn-flip-y");
    if (btnFlipX) btnFlipX.addEventListener("click", () => this.cm.flipX());
    if (btnFlipY) btnFlipY.addEventListener("click", () => this.cm.flipY());

    // Align to Canvas
    this.btnCanvasAlign.addEventListener("click", (e) => {
      e.stopPropagation();
      this.togglePopover(this.popoverAlign, this.btnCanvasAlign);
    });
    document.querySelectorAll(".align-option-btn").forEach(btn => {
      btn.addEventListener("click", () => this.cm.alignObject(btn.getAttribute("data-align")));
    });

    // Transform Popover (Size, Angle, Skew)
    this.btnTransform.addEventListener("click", (e) => {
      e.stopPropagation();
      this.togglePopover(this.popoverTransform, this.btnTransform);
    });
    this.inputRotation.addEventListener("input", (e) => {
      const angle = parseInt(e.target.value, 10);
      this.valRotation.innerText = `${angle}°`;
      this.cm.setRotation(angle);
    });
    this.inputSkewX.addEventListener("input", (e) => {
      const sx = parseInt(e.target.value, 10);
      this.valSkewX.innerText = `${sx}°`;
      this.cm.setSkewX(sx);
    });
    this.inputSkewY.addEventListener("input", (e) => {
      const sy = parseInt(e.target.value, 10);
      this.valSkewY.innerText = `${sy}°`;
      this.cm.setSkewY(sy);
    });

    // Arrange Popover
    this.btnArrange.addEventListener("click", (e) => {
      e.stopPropagation();
      this.togglePopover(this.popoverArrange, this.btnArrange);
    });
    document.getElementById("btn-order-front").addEventListener("click", () => this.cm.bringToFront());
    document.getElementById("btn-order-forward").addEventListener("click", () => this.cm.bringForward());
    document.getElementById("btn-order-backward").addEventListener("click", () => this.cm.sendBackward());
    document.getElementById("btn-order-back").addEventListener("click", () => this.cm.sendToBack());

    // Lock Toggle
    this.btnLock.addEventListener("click", () => {
      const obj = this.canvas.getActiveObject();
      if (!obj) return;
      const isLocked = this.cm.toggleLock(obj);
      this.updateLockUI(isLocked);
    });

    // Duplicate & Delete
    this.btnDuplicate.addEventListener("click", () => this.cm.duplicateSelected());
    this.btnDelete.addEventListener("click", () => this.cm.deleteSelected());

    // Group / Ungroup Button Click
    if (this.btnGroup) {
      this.btnGroup.addEventListener("click", () => {
        const activeObj = this.canvas.getActiveObject();
        if (!activeObj) return;
        if (activeObj.type === "activeSelection") {
          this.cm.groupSelected();
        } else if (activeObj.type === "group") {
          this.cm.ungroupSelected();
        }
      });
    }

    // Chart Data Edit Button Click
    if (this.btnChartData) {
      this.btnChartData.addEventListener("click", (e) => {
        e.stopPropagation();
        this.togglePopover(this.popoverChartData, this.btnChartData);
        this.syncChartDataControls();
      });
    }

    // Global Keyboard Shortcuts for Group (Ctrl+G / Cmd+G) and Ungroup (Ctrl+Shift+G / Cmd+Shift+G)
    window.addEventListener("keydown", (e) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && e.key.toLowerCase() === "g") {
        const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
        if (tag === "input" || tag === "textarea") return;

        e.preventDefault();
        const activeObj = this.canvas.getActiveObject();
        if (!activeObj) return;

        if (e.shiftKey) {
          // Shift + Ctrl/Cmd + G: 그룹 해제
          if (activeObj.type === "group") {
            this.cm.ungroupSelected();
          }
        } else {
          // Ctrl/Cmd + G: 그룹화
          if (activeObj.type === "activeSelection") {
            this.cm.groupSelected();
          }
        }
      }
    });

    // Chart Dynamic Gauge Controls
    if (this.inputChartGaugePct && this.valChartGauge && this.inputChartGaugeNum) {
      const handleGaugeChange = (val, isEnd = false) => {
        const p = Math.max(0, Math.min(100, parseInt(val, 10) || 0));
        this.valChartGauge.innerText = `${p}%`;
        this.inputChartGaugePct.value = p;
        this.inputChartGaugeNum.value = p;
        const activeObj = this.canvas.getActiveObject();
        if (activeObj && activeObj.isChart) {
          this.cm.updateChartGauge(activeObj, p);
          if (isEnd) this.cm.saveHistory();
        }
      };

      this.inputChartGaugePct.addEventListener("input", (e) => handleGaugeChange(e.target.value, false));
      this.inputChartGaugePct.addEventListener("change", (e) => handleGaugeChange(e.target.value, true));
      this.inputChartGaugeNum.addEventListener("input", (e) => handleGaugeChange(e.target.value, true));
    }

    // Chart Dynamic Bar Controls (Bars 1~4)
    const barInputs = [this.inputBar1, this.inputBar2, this.inputBar3, this.inputBar4];
    const barVals = [this.valBar1, this.valBar2, this.valBar3, this.valBar4];
    barInputs.forEach((input, idx) => {
      if (input) {
        input.addEventListener("input", () => {
          const val = parseInt(input.value, 10) || 0;
          if (barVals[idx]) barVals[idx].innerText = `${val}`;
          const activeObj = this.canvas.getActiveObject();
          if (activeObj && activeObj.isChart && activeObj.chartType === "bar-multi") {
            const vals = barInputs.map(inp => parseInt(inp ? inp.value : 50, 10) || 0);
            this.cm.updateChartBars(activeObj, vals);
          }
        });
        input.addEventListener("change", () => this.cm.saveHistory());
      }
    });

    // Text specific events
    this.bindTextEvents();
  }

  syncChartDataControls() {
    const activeObj = this.canvas.getActiveObject();
    if (!activeObj || !activeObj.isChart) return;

    const isGauge = activeObj.chartType && activeObj.chartType.startsWith("gauge");
    const isBar = activeObj.chartType === "bar-multi";

    if (this.chartGaugeGroup) {
      this.chartGaugeGroup.style.display = isGauge ? "block" : "none";
    }
    if (this.chartBarGroup) {
      this.chartBarGroup.style.display = isBar ? "block" : "none";
    }

    if (this.chartTypeBadge) {
      this.chartTypeBadge.innerText = isGauge ? "게이지 차트" : isBar ? "막대 차트" : "스마트 차트";
    }

    if (isGauge) {
      const p = activeObj.chartValue !== undefined ? activeObj.chartValue : 75;
      if (this.inputChartGaugePct) this.inputChartGaugePct.value = p;
      if (this.inputChartGaugeNum) this.inputChartGaugeNum.value = p;
      if (this.valChartGauge) this.valChartGauge.innerText = `${p}%`;
    } else if (isBar) {
      const data = activeObj.chartData || [40, 70, 55, 85];
      const inputs = [this.inputBar1, this.inputBar2, this.inputBar3, this.inputBar4];
      const vals = [this.valBar1, this.valBar2, this.valBar3, this.valBar4];
      data.forEach((d, i) => {
        if (inputs[i]) inputs[i].value = d;
        if (vals[i]) vals[i].innerText = `${d}`;
      });
    }
  }

  bindTextEvents() {
    this.fontFamilyBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.togglePopover(this.popoverFont, this.fontFamilyBtn);
    });

    document.querySelectorAll(".font-choice-item").forEach(item => {
      item.addEventListener("click", () => {
        const font = item.getAttribute("data-font");
        const obj = this.canvas.getActiveObject();
        if (obj && (obj.type === "textbox" || obj.type === "i-text")) {
          obj.set("fontFamily", font);
          this.currentFontName.innerText = item.innerText;
          this.canvas.renderAll();
          this.cm.saveHistory();
        }
        this.closeAllPopovers();
      });
    });

    this.btnFontMinus.addEventListener("click", () => this.changeFontSize(-2));
    this.btnFontPlus.addEventListener("click", () => this.changeFontSize(2));
    this.fontSizeInput.addEventListener("change", () => {
      const size = parseInt(this.fontSizeInput.value, 10);
      if (!isNaN(size) && size > 5) this.changeFontSize(0, size);
    });

    this.textColorPicker.addEventListener("input", (e) => {
      const color = e.target.value;
      this.textColorIndicator.style.background = color;
      const obj = this.canvas.getActiveObject();
      if (obj && (obj.type === "textbox" || obj.type === "i-text")) {
        obj.set("fill", color);
        this.canvas.renderAll();
      }
    });

    this.btnBold.addEventListener("click", () => {
      const obj = this.canvas.getActiveObject();
      if (!obj) return;
      const isBold = obj.fontWeight === "bold" || obj.fontWeight === "900";
      obj.set("fontWeight", isBold ? "normal" : "bold");
      this.btnBold.classList.toggle("active", !isBold);
      this.canvas.renderAll();
      this.cm.saveHistory();
    });

    this.btnItalic.addEventListener("click", () => {
      const obj = this.canvas.getActiveObject();
      if (!obj) return;
      const isItalic = obj.fontStyle === "italic";
      obj.set("fontStyle", isItalic ? "normal" : "italic");
      this.btnItalic.classList.toggle("active", !isItalic);
      this.canvas.renderAll();
      this.cm.saveHistory();
    });

    this.btnUnderline.addEventListener("click", () => {
      const obj = this.canvas.getActiveObject();
      if (!obj) return;
      obj.set("underline", !obj.underline);
      this.btnUnderline.classList.toggle("active", !!obj.underline);
      this.canvas.renderAll();
      this.cm.saveHistory();
    });

    this.btnLinethrough.addEventListener("click", () => {
      const obj = this.canvas.getActiveObject();
      if (!obj) return;
      obj.set("linethrough", !obj.linethrough);
      this.btnLinethrough.classList.toggle("active", !!obj.linethrough);
      this.canvas.renderAll();
      this.cm.saveHistory();
    });

    this.btnAlign.addEventListener("click", () => {
      const obj = this.canvas.getActiveObject();
      if (!obj) return;
      const current = obj.textAlign || "left";
      const next = current === "left" ? "center" : current === "center" ? "right" : "left";
      obj.set("textAlign", next);
      this.canvas.renderAll();
      this.cm.saveHistory();
    });
  }

  applyColorToActive(hex, saveHistory = false) {
    const obj = this.canvas.getActiveObject();
    if (obj && (obj.type === "textbox" || obj.type === "i-text")) {
      obj.set("fill", hex);
      if (this.textColorIndicator) this.textColorIndicator.style.background = hex;
      this.canvas.renderAll();
      if (saveHistory) this.cm.saveHistory();
    } else {
      this.cm.setShapeColor(hex, saveHistory);
    }
    if (this.shapeColorCircle) this.shapeColorCircle.style.background = hex;
    if (this.activeColorSwatch) this.activeColorSwatch.style.background = hex;
    if (this.inputHexCode) this.inputHexCode.value = hex.replace("#", "").toUpperCase();
  }

  changeFontSize(delta, directVal = null) {
    const obj = this.canvas.getActiveObject();
    if (!obj || (obj.type !== "textbox" && obj.type !== "i-text")) return;

    let newSize = directVal !== null ? directVal : (obj.fontSize || 32) + delta;
    newSize = Math.max(8, Math.min(newSize, 300));

    obj.set("fontSize", newSize);
    this.fontSizeInput.value = Math.round(newSize);
    this.canvas.renderAll();
    this.cm.saveHistory();
  }

  /**
   * Seamlessly Switch Toolbar between Text (Image 2), Elements/Shapes (Image 1), and Photos/Images
   */
  updateToolbar(obj) {
    if (!obj) {
      this.hideToolbar();
      return;
    }

    this.toolbar.classList.remove("hidden");
    const isText = obj.type === "textbox" || obj.type === "i-text";
    const isImage = obj.type === "image";
    const isShape = !isText && !isImage && !obj.isChart;

    // 1. Text tools: Show only if text
    document.querySelectorAll(".text-only-tool").forEach(el => {
      el.style.display = isText ? "flex" : "none";
    });

    // 2. Element/Shape tools (Color circle, Border, Radius): Show ONLY if shape (hide on photos!)
    document.querySelectorAll(".shape-only-tool").forEach(el => {
      el.style.display = isShape ? "flex" : "none";
    });

    // 3. Flip button: Show for both shapes and photos
    if (this.btnFlip) {
      this.btnFlip.style.display = (isShape || isImage) ? "flex" : "none";
    }

    // 4. Group / Ungroup button toggle (Images 1 & 2 Request)
    if (this.btnGroup) {
      if (obj.type === "activeSelection") {
        this.btnGroup.style.display = "flex";
        if (this.groupBtnLabel) this.groupBtnLabel.innerText = "그룹화 (Ctrl+G)";
        this.btnGroup.title = "선택된 여러 요소를 하나로 그룹화합니다 (Ctrl+G / Cmd+G)";
      } else if (obj.type === "group") {
        this.btnGroup.style.display = "flex";
        if (this.groupBtnLabel) this.groupBtnLabel.innerText = "그룹 해제 (Ctrl+Shift+G)";
        this.btnGroup.title = "그룹을 개별 요소들로 해제합니다 (Ctrl+Shift+G / Cmd+Shift+G)";
      } else {
        this.btnGroup.style.display = "none";
      }
    }

    // 5. Chart Data Edit button toggle
    if (this.btnChartData) {
      if (obj.isChart) {
        this.btnChartData.style.display = "flex";
      } else {
        this.btnChartData.style.display = "none";
      }
    }

    this.syncValues(obj);
  }

  syncValues(obj) {
    if (!obj) return;
    const isText = obj.type === "textbox" || obj.type === "i-text";
    const isImage = obj.type === "image";

    if (isText) {
      this.currentFontName.innerText = obj.fontFamily || "Pretendard";
      this.fontSizeInput.value = Math.round(obj.fontSize || 32);
      this.textColorIndicator.style.background = obj.fill || "#000000";
      this.btnBold.classList.toggle("active", obj.fontWeight === "bold" || obj.fontWeight === "900");
      this.btnItalic.classList.toggle("active", obj.fontStyle === "italic");
      this.btnUnderline.classList.toggle("active", !!obj.underline);
      this.btnLinethrough.classList.toggle("active", !!obj.linethrough);
    } else if (!isImage) {
      // Shape / Vector Element sync (Only when NOT a photo)
      const fill = typeof obj.fill === "string" ? obj.fill : "#70798F";
      if (this.shapeColorCircle) this.shapeColorCircle.style.background = fill;
      if (this.activeColorSwatch) this.activeColorSwatch.style.background = fill;
      if (this.inputHexCode && fill.startsWith("#")) {
        this.inputHexCode.value = fill.replace("#", "").toUpperCase();
      }

      const sw = Math.round(obj.strokeWidth || 0);
      if (this.inputBorderWidth) this.inputBorderWidth.value = sw;
      if (this.valBorderWidth) this.valBorderWidth.innerText = `${sw}px`;

      const cr = Math.round(obj.rx || 0);
      if (this.inputCornerRadius) this.inputCornerRadius.value = cr;
      if (this.valCornerRadius) this.valCornerRadius.innerText = `${cr}px`;

      const hasShadow = !!obj.shadow;
      if (this.chkShadow) this.chkShadow.checked = hasShadow;
      if (this.shadowDetailsBox) this.shadowDetailsBox.style.display = hasShadow ? "block" : "none";
    }

    // Common properties
    const opacityPct = Math.round((obj.opacity !== undefined ? obj.opacity : 1) * 100);
    this.inputOpacity.value = opacityPct;
    this.valOpacity.innerText = `${opacityPct}%`;

    const angle = Math.round(obj.angle || 0);
    this.inputRotation.value = angle;
    this.valRotation.innerText = `${angle}°`;

    const skewX = Math.round(obj.skewX || 0);
    this.inputSkewX.value = skewX;
    this.valSkewX.innerText = `${skewX}°`;

    const skewY = Math.round(obj.skewY || 0);
    this.inputSkewY.value = skewY;
    this.valSkewY.innerText = `${skewY}°`;

    const isLocked = this.cm.isObjectLocked(obj);
    this.updateLockUI(isLocked);
  }

  updateLockUI(isLocked) {
    if (isLocked) {
      this.btnLock.classList.add("locked");
      this.btnLock.title = "잠금 해제";
      this.btnLock.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      `;
    } else {
      this.btnLock.classList.remove("locked");
      this.btnLock.title = "요소 잠금 (위치/크기/순서 고정)";
      this.btnLock.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
        </svg>
      `;
    }
  }

  hideToolbar() {
    this.toolbar.classList.add("hidden");
    this.closeAllPopovers();
  }

  /**
   * Safe Popover Placement (Effect window location, no clipping)
   */
  togglePopover(popoverEl, anchorEl) {
    if (this.activePopover === popoverEl) {
      this.closeAllPopovers();
      return;
    }
    this.closeAllPopovers();
    if (!popoverEl) return;

    popoverEl.classList.add("active");
    this.activePopover = popoverEl;

    const toolbarRect = this.toolbar.getBoundingClientRect();
    popoverEl.style.top = `${toolbarRect.bottom + 8}px`;

    const anchorRect = anchorEl ? anchorEl.getBoundingClientRect() : toolbarRect;
    const effectRect = this.btnEffect ? this.btnEffect.getBoundingClientRect() : toolbarRect;
    const popoverWidth = popoverEl.offsetWidth || 260;

    let targetLeft = anchorRect.left;

    // Align like effect window for right-side tools
    if (
      anchorEl === this.btnTransform ||
      anchorEl === this.btnCanvasAlign ||
      anchorEl === this.btnArrange ||
      anchorEl === this.btnOpacity ||
      anchorEl === this.btnFlip ||
      anchorEl === this.btnChartData ||
      anchorEl === this.btnGroup
    ) {
      targetLeft = effectRect.left;
    }

    const maxLeft = window.innerWidth - popoverWidth - 24;
    if (targetLeft > maxLeft) targetLeft = maxLeft;
    if (targetLeft < 16) targetLeft = 16;

    popoverEl.style.left = `${Math.round(targetLeft)}px`;
  }

  closeAllPopovers() {
    document.querySelectorAll(".toolbar-popover").forEach(p => p.classList.remove("active"));
    this.activePopover = null;
  }
}
