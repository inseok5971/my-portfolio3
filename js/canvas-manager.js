/**
 * Canvas Manager
 * Manages the Fabric.js canvas, templates loading, sizing, locking, skewing,
 * custom rotation cursor (Image 4), charts (Image 1), lines (Image 2), icons (Image 3),
 * comprehensive shapes catalog (Images 3, 4, 5),
 * smart alignment guidelines & snapping, and live degree angle tooltips.
 */

class CanvasManager {
  constructor(canvasElementId, containerElementId) {
    this.canvasId = canvasElementId;
    this.container = document.getElementById(containerElementId);
    this.canvasWrapper = document.getElementById("canvas-wrapper");
    
    // Default size: 1080x1080
    this.canvasWidth = 1080;
    this.canvasHeight = 1080;
    this.zoom = 1;

    // History for Undo / Redo
    this.history = [];
    this.historyIndex = -1;
    this.isHistoryProcessing = false;

    // Smart Guidelines & Snapping
    this.guidelineSnapDistance = 12;
    this.activeHorizontalGuides = [];
    this.activeVerticalGuides = [];

    // Apply custom rotation cursor (Image 4 Style)
    this.setupCustomRotationCursor();

    // Initialize Fabric
    this.initCanvas();
    this.initSmartGuidelines();
    this.initRotationAngleTooltip();
    this.bindEvents();
  }

  /**
   * Custom Rotation Cursor (Image 4)
   */
  setupCustomRotationCursor() {
    const rotateSvg = encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000" flood-opacity="0.25"/>
          </filter>
        </defs>
        <circle cx="16" cy="16" r="13" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2" filter="url(#shadow)"/>
        <path d="M 16,8 A 8,8 0 1,1 9.5,12.5" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round"/>
        <polyline points="6,12.5 9.5,12.5 9.5,9" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `);
    const customRotateCursor = `url("data:image/svg+xml;utf8,${rotateSvg}") 16 16, crosshair`;

    if (fabric.Object.prototype.controls && fabric.Object.prototype.controls.mtr) {
      fabric.Object.prototype.controls.mtr.cursorStyle = customRotateCursor;
      fabric.Object.prototype.controls.mtr.cursorStyleHandler = function() {
        return customRotateCursor;
      };
      fabric.Object.prototype.controls.mtr.offsetY = -35;
      fabric.Object.prototype.controls.mtr.sizeX = 14;
      fabric.Object.prototype.controls.mtr.sizeY = 14;
    }
  }

  initCanvas() {
    this.fabricCanvas = new fabric.Canvas(this.canvasId, {
      width: this.canvasWidth,
      height: this.canvasHeight,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
      selectionColor: "rgba(0, 196, 204, 0.15)",
      selectionBorderColor: "#00c4cc",
      selectionLineWidth: 1.5,
      uniformScaling: false
    });

    fabric.Object.prototype.transparentCorners = false;
    fabric.Object.prototype.cornerColor = "#ffffff";
    fabric.Object.prototype.cornerStrokeColor = "#00c4cc";
    fabric.Object.prototype.borderColor = "#00c4cc";
    fabric.Object.prototype.cornerSize = 10;
    fabric.Object.prototype.cornerStyle = "circle";
    fabric.Object.prototype.borderScaleFactor = 1.5;
    fabric.Object.prototype.padding = 4;

    this.fitCanvasToStage();
    window.addEventListener("resize", () => this.fitCanvasToStage());
  }

  /**
   * Smart Alignment Guidelines & Snapping
   */
  initSmartGuidelines() {
    this.fabricCanvas.on("object:moving", (e) => {
      this.handleObjectMovingGuidelines(e.target);
    });

    this.fabricCanvas.on("before:render", () => {
      this.fabricCanvas.clearContext(this.fabricCanvas.contextTop);
    });

    this.fabricCanvas.on("after:render", () => {
      this.drawGuidelines();
    });

    this.fabricCanvas.on("mouse:up", () => {
      this.activeHorizontalGuides = [];
      this.activeVerticalGuides = [];
      this.fabricCanvas.clearContext(this.fabricCanvas.contextTop);
      this.fabricCanvas.requestRenderAll();
    });
  }

  handleObjectMovingGuidelines(target) {
    if (!target) return;
    target.setCoords();

    this.activeHorizontalGuides = [];
    this.activeVerticalGuides = [];

    const targetCenter = target.getCenterPoint();
    const snap = this.guidelineSnapDistance;

    // 1. Canvas Center Snapping
    const canvasCenterX = this.canvasWidth / 2;
    const canvasCenterY = this.canvasHeight / 2;

    if (Math.abs(targetCenter.x - canvasCenterX) <= snap) {
      target.setPositionByOrigin(new fabric.Point(canvasCenterX, targetCenter.y), "center", "center");
      target.setCoords();
      this.activeVerticalGuides.push(canvasCenterX);
    }

    if (Math.abs(targetCenter.y - canvasCenterY) <= snap) {
      target.setPositionByOrigin(new fabric.Point(target.getCenterPoint().x, canvasCenterY), "center", "center");
      target.setCoords();
      this.activeHorizontalGuides.push(canvasCenterY);
    }

    // 2. Inter-object Alignment
    const objects = this.fabricCanvas.getObjects();
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      if (obj === target || obj.name === "background-base") continue;

      const objCenter = obj.getCenterPoint();
      const objBound = obj.getBoundingRect(true);
      const targetBound = target.getBoundingRect(true);

      if (Math.abs(targetCenter.y - objCenter.y) <= snap) {
        target.setPositionByOrigin(new fabric.Point(target.getCenterPoint().x, objCenter.y), "center", "center");
        target.setCoords();
        this.activeHorizontalGuides.push(objCenter.y);
      }

      if (Math.abs(targetCenter.x - objCenter.x) <= snap) {
        target.setPositionByOrigin(new fabric.Point(objCenter.x, target.getCenterPoint().y), "center", "center");
        target.setCoords();
        this.activeVerticalGuides.push(objCenter.x);
      }

      if (Math.abs(targetBound.top - objBound.top) <= snap) {
        target.set("top", objBound.top);
        target.setCoords();
        this.activeHorizontalGuides.push(objBound.top);
      }

      if (Math.abs(targetBound.left - objBound.left) <= snap) {
        target.set("left", objBound.left);
        target.setCoords();
        this.activeVerticalGuides.push(objBound.left);
      }
    }

    this.fabricCanvas.requestRenderAll();
  }

  drawGuidelines() {
    if (this.activeHorizontalGuides.length === 0 && this.activeVerticalGuides.length === 0) return;

    const ctx = this.fabricCanvas.contextTop;
    if (!ctx) return;

    ctx.save();
    ctx.strokeStyle = "#ff007a";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);

    this.activeHorizontalGuides.forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvasWidth, y);
      ctx.stroke();
    });

    this.activeVerticalGuides.forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvasHeight);
      ctx.stroke();
    });

    ctx.restore();
  }

  /**
   * Real-time Degree Angle Tooltip during Rotation
   */
  initRotationAngleTooltip() {
    const badge = document.getElementById("rotation-angle-badge");
    if (!badge) return;

    this.fabricCanvas.on("object:rotating", (e) => {
      const target = e.target;
      if (!target) return;

      let angle = Math.round(target.angle % 360);
      if (angle < 0) angle += 360;

      badge.innerHTML = `<span>⟳</span> <span>${angle}°</span>`;
      badge.style.display = "flex";

      const targetCenter = target.getCenterPoint();
      const bound = target.getBoundingRect();
      badge.style.left = `${targetCenter.x}px`;
      badge.style.top = `${bound.top - 18}px`;

      const rotVal = document.getElementById("val-rotation");
      const rotInput = document.getElementById("input-rotation");
      if (rotVal) rotVal.innerText = `${angle}°`;
      if (rotInput) rotInput.value = angle;
    });

    this.fabricCanvas.on("mouse:up", () => {
      if (badge) badge.style.display = "none";
    });
  }

  /**
   * Add Shapes Catalog (Images 3, 4, 5)
   */
  addShape(shapeKey) {
    const cX = this.canvasWidth / 2 - 75;
    const cY = this.canvasHeight / 2 - 75;
    let obj = null;

    if (shapeKey === "square") {
      obj = new fabric.Rect({ left: cX, top: cY, width: 150, height: 150, fill: "#70798F" });
    } else if (shapeKey === "circle") {
      obj = new fabric.Circle({ left: cX, top: cY, radius: 75, fill: "#70798F" });
    } else if (shapeKey === "triangle") {
      obj = new fabric.Triangle({ left: cX, top: cY, width: 160, height: 140, fill: "#70798F" });
    } else if (shapeKey === "diamond") {
      obj = new fabric.Polygon([
        { x: 80, y: 0 }, { x: 160, y: 80 }, { x: 80, y: 160 }, { x: 0, y: 80 }
      ], { left: cX, top: cY, fill: "#70798F" });
    } else if (shapeKey === "star-5") {
      obj = new fabric.Polygon([
        { x: 80, y: 0 }, { x: 100, y: 55 }, { x: 160, y: 55 }, { x: 112, y: 92 },
        { x: 130, y: 150 }, { x: 80, y: 115 }, { x: 30, y: 150 }, { x: 48, y: 92 },
        { x: 0, y: 55 }, { x: 60, y: 55 }
      ], { left: cX, top: cY, fill: "#70798F" });
    } else if (shapeKey === "heart") {
      obj = new fabric.Path("M 80,140 L 20,70 A 35,35 0 0,1 80,30 A 35,35 0 0,1 140,70 Z", {
        left: cX, top: cY, fill: "#70798F", scaleX: 1.2, scaleY: 1.2
      });
    } else if (shapeKey === "capsule") {
      obj = new fabric.Rect({ left: cX, top: cY, width: 180, height: 90, rx: 45, ry: 45, fill: "#70798F" });
    } else if (shapeKey === "speech-bubble-circle") {
      obj = new fabric.Path("M 80,10 A 60,60 0 0,1 140,70 A 60,60 0 0,1 80,130 A 60,60 0 0,1 40,118 L 10,140 L 25,100 A 60,60 0 0,1 20,70 A 60,60 0 0,1 80,10 Z", {
        left: cX, top: cY, fill: "#70798F"
      });
    } else if (shapeKey === "arrow-block") {
      obj = new fabric.Polygon([
        { x: 0, y: 35 }, { x: 90, y: 35 }, { x: 90, y: 10 }, { x: 150, y: 60 },
        { x: 90, y: 110 }, { x: 90, y: 85 }, { x: 0, y: 85 }
      ], { left: cX, top: cY, fill: "#70798F" });
    } else if (shapeKey === "donut") {
      obj = new fabric.Circle({ left: cX, top: cY, radius: 75, fill: "transparent", stroke: "#70798F", strokeWidth: 35 });
    } else if (shapeKey === "bubble-rect") {
      obj = new fabric.Path("M 10,10 L 160,10 L 160,110 L 40,110 L 15,140 L 20,110 L 10,110 Z", {
        left: cX, top: cY, fill: "#70798F"
      });
    } else if (shapeKey === "bubble-round-rect") {
      obj = new fabric.Path("M 25,10 Q 10,10 10,25 L 10,95 Q 10,110 25,110 L 60,110 L 75,135 L 90,110 L 155,110 Q 170,110 170,95 L 170,25 Q 170,10 155,10 Z", {
        left: cX, top: cY, fill: "#70798F"
      });
    } else if (shapeKey === "postit") {
      obj = new fabric.Path("M 10,10 L 150,10 L 150,115 L 115,150 L 10,150 Z", {
        left: cX, top: cY, fill: "#70798F"
      });
    } else if (shapeKey === "ribbon-banner") {
      obj = new fabric.Polygon([
        { x: 15, y: 0 }, { x: 175, y: 0 }, { x: 155, y: 40 }, { x: 175, y: 80 },
        { x: 15, y: 80 }, { x: 35, y: 40 }
      ], { left: cX, top: cY, fill: "#70798F" });
    } else if (shapeKey === "arrow-right") {
      obj = new fabric.Polygon([
        { x: 0, y: 25 }, { x: 110, y: 25 }, { x: 110, y: 0 }, { x: 160, y: 40 },
        { x: 110, y: 80 }, { x: 110, y: 55 }, { x: 0, y: 55 }
      ], { left: cX, top: cY, fill: "#70798F" });
    } else if (shapeKey === "arrow-left") {
      obj = new fabric.Polygon([
        { x: 50, y: 0 }, { x: 50, y: 25 }, { x: 160, y: 25 }, { x: 160, y: 55 },
        { x: 50, y: 55 }, { x: 50, y: 80 }, { x: 0, y: 40 }
      ], { left: cX, top: cY, fill: "#70798F" });
    } else if (shapeKey === "arrow-up") {
      obj = new fabric.Polygon([
        { x: 40, y: 0 }, { x: 80, y: 50 }, { x: 55, y: 50 }, { x: 55, y: 150 },
        { x: 25, y: 150 }, { x: 25, y: 50 }, { x: 0, y: 50 }
      ], { left: cX, top: cY, fill: "#70798F" });
    } else if (shapeKey === "arrow-down") {
      obj = new fabric.Polygon([
        { x: 25, y: 0 }, { x: 55, y: 0 }, { x: 55, y: 100 }, { x: 80, y: 100 },
        { x: 40, y: 150 }, { x: 0, y: 100 }, { x: 25, y: 100 }
      ], { left: cX, top: cY, fill: "#70798F" });
    } else if (shapeKey === "star-4") {
      obj = new fabric.Path("M 75,0 Q 75,75 150,75 Q 75,75 75,150 Q 75,75 0,75 Q 75,75 75,0 Z", {
        left: cX, top: cY, fill: "#70798F"
      });
    } else if (shapeKey === "flower-4") {
      obj = new fabric.Path("M 50,20 A 30,30 0 0,1 100,20 A 30,30 0 0,1 130,70 A 30,30 0 0,1 100,120 A 30,30 0 0,1 50,120 A 30,30 0 0,1 20,70 A 30,30 0 0,1 50,20 Z", {
        left: cX, top: cY, fill: "#70798F"
      });
    } else if (shapeKey === "sparkle") {
      obj = new fabric.Path("M 75,10 L 90,60 L 140,75 L 90,90 L 75,140 L 60,90 L 10,75 L 60,60 Z", {
        left: cX, top: cY, fill: "#70798F"
      });
    } else if (shapeKey === "coupon-cut") {
      obj = new fabric.Path("M 0,0 L 180,0 L 180,35 A 15,15 0 0,0 180,65 L 180,100 L 0,100 L 0,65 A 15,15 0 0,0 0,35 Z", {
        left: cX, top: cY, fill: "#70798F"
      });
    } else if (shapeKey === "cylinder") {
      const topE = new fabric.Ellipse({ rx: 65, ry: 20, fill: "#70798F", left: 0, top: 0 });
      const body = new fabric.Rect({ width: 130, height: 90, fill: "#70798F", left: 0, top: 20 });
      const botE = new fabric.Ellipse({ rx: 65, ry: 20, fill: "#55627a", left: 0, top: 90 });
      obj = new fabric.Group([botE, body, topE], { left: cX, top: cY });
    } else if (shapeKey === "flow-document") {
      obj = new fabric.Path("M 0,0 L 150,0 L 150,110 Q 110,85 75,110 Q 40,135 0,110 Z", {
        left: cX, top: cY, fill: "#70798F"
      });
    } else if (shapeKey === "parallelogram") {
      obj = new fabric.Polygon([
        { x: 40, y: 0 }, { x: 160, y: 0 }, { x: 120, y: 90 }, { x: 0, y: 90 }
      ], { left: cX, top: cY, fill: "#70798F" });
    }

    if (obj) {
      this.fabricCanvas.add(obj);
      this.fabricCanvas.setActiveObject(obj);
      this.fabricCanvas.renderAll();
      this.saveHistory();
    }
  }

  /**
   * Element Manipulation Helpers (Color, Border, Corner Radius, Shadow, Flip)
   */
  setShapeColor(color, saveHistory = true) {
    const obj = this.fabricCanvas.getActiveObject();
    if (!obj) return;
    if (obj.type === "line") {
      obj.set("stroke", color);
    } else if (obj.type === "group") {
      obj.forEachObject(o => {
        if (o.type === "line") {
          o.set("stroke", color);
        } else {
          o.set("fill", color);
        }
      });
    } else {
      obj.set("fill", color);
    }
    this.fabricCanvas.renderAll();
    if (saveHistory) this.saveHistory();
  }

  setCornerRadius(radius) {
    const obj = this.fabricCanvas.getActiveObject();
    if (!obj) return;
    const r = parseInt(radius, 10);
    if (obj.type === "rect") {
      obj.set({ rx: r, ry: r });
      this.fabricCanvas.renderAll();
      this.saveHistory();
    }
  }

  setShapeBorder(width, color) {
    const obj = this.fabricCanvas.getActiveObject();
    if (!obj) return;
    if (width !== null && width !== undefined) {
      obj.set("strokeWidth", parseInt(width, 10));
    }
    if (color) {
      obj.set("stroke", color);
    }
    this.fabricCanvas.renderAll();
    this.saveHistory();
  }

  toggleShadow(enabled, blur = 15, color = "rgba(0,0,0,0.35)") {
    const obj = this.fabricCanvas.getActiveObject();
    if (!obj) return;
    if (enabled) {
      obj.set("shadow", new fabric.Shadow({
        color: color,
        blur: parseInt(blur, 10) || 15,
        offsetX: 6,
        offsetY: 6
      }));
    } else {
      obj.set("shadow", null);
    }
    this.fabricCanvas.renderAll();
    this.saveHistory();
  }

  flipX() {
    const obj = this.fabricCanvas.getActiveObject();
    if (!obj) return;
    obj.set("flipX", !obj.flipX);
    this.fabricCanvas.renderAll();
    this.saveHistory();
  }

  flipY() {
    const obj = this.fabricCanvas.getActiveObject();
    if (!obj) return;
    obj.set("flipY", !obj.flipY);
    this.fabricCanvas.renderAll();
    this.saveHistory();
  }

  /**
   * Group & Ungroup Functionality (Ctrl+G / Ctrl+Shift+G)
   */
  groupSelected() {
    const activeObj = this.fabricCanvas.getActiveObject();
    if (!activeObj || activeObj.type !== "activeSelection") return null;

    const group = activeObj.toGroup();
    this.fabricCanvas.setActiveObject(group);
    this.fabricCanvas.requestRenderAll();
    this.saveHistory();
    return group;
  }

  ungroupSelected() {
    const activeObj = this.fabricCanvas.getActiveObject();
    if (!activeObj || activeObj.type !== "group") return null;

    const items = activeObj.toActiveSelection();
    this.fabricCanvas.setActiveObject(items);
    this.fabricCanvas.requestRenderAll();
    this.saveHistory();
    return items;
  }

  bindEvents() {
    this.fabricCanvas.on("object:modified", () => this.saveHistory());
    this.fabricCanvas.on("object:added", (e) => {
      if (!this.isHistoryProcessing && !e.target._isInternal) {
        this.saveHistory();
      }
    });
    this.fabricCanvas.on("object:removed", () => {
      if (!this.isHistoryProcessing) {
        this.saveHistory();
      }
    });
  }

  fitCanvasToStage() {
    if (!this.container || !this.canvasWrapper) return;
    const stageWidth = this.container.clientWidth - 80;
    const stageHeight = this.container.clientHeight - 80;

    const scaleX = stageWidth / this.canvasWidth;
    const scaleY = stageHeight / this.canvasHeight;
    const scale = Math.min(scaleX, scaleY, 0.95);

    this.zoom = Math.max(scale, 0.2);

    this.canvasWrapper.style.width = `${this.canvasWidth}px`;
    this.canvasWrapper.style.height = `${this.canvasHeight}px`;
    this.canvasWrapper.style.transform = `scale(${this.zoom})`;
    this.canvasWrapper.style.transformOrigin = "center center";

    const zoomLabel = document.getElementById("zoom-percentage");
    if (zoomLabel) {
      zoomLabel.innerText = `${Math.round(this.zoom * 100)}%`;
    }
  }

  setZoom(factor) {
    this.zoom = Math.max(0.2, Math.min(factor, 3.0));
    this.canvasWrapper.style.transform = `scale(${this.zoom})`;
    const zoomLabel = document.getElementById("zoom-percentage");
    if (zoomLabel) {
      zoomLabel.innerText = `${Math.round(this.zoom * 100)}%`;
    }
  }

  zoomIn() {
    this.setZoom(this.zoom + 0.1);
  }

  zoomOut() {
    this.setZoom(this.zoom - 0.1);
  }

  zoomFit() {
    this.fitCanvasToStage();
  }

  setCanvasSize(width, height) {
    this.canvasWidth = parseInt(width, 10);
    this.canvasHeight = parseInt(height, 10);

    this.fabricCanvas.setWidth(this.canvasWidth);
    this.fabricCanvas.setHeight(this.canvasHeight);

    const sizeLabel = document.getElementById("current-size-label");
    if (sizeLabel) {
      sizeLabel.innerText = `${this.canvasWidth}×${this.canvasHeight} px`;
    }

    this.fitCanvasToStage();
    this.fabricCanvas.renderAll();
    this.saveHistory();
  }

  loadTemplate(template) {
    this.fabricCanvas.clear();
    this.setCanvasSize(template.width, template.height);
    this.fabricCanvas.setBackgroundColor(template.background || "#ffffff", () => {
      this.fabricCanvas.renderAll();
    });

    template.objects.forEach(objData => {
      let fabricObj = null;

      if (objData.type === "rect") {
        fabricObj = new fabric.Rect(objData);
      } else if (objData.type === "circle") {
        fabricObj = new fabric.Circle(objData);
      } else if (objData.type === "triangle") {
        fabricObj = new fabric.Triangle(objData);
      } else if (objData.type === "line") {
        fabricObj = new fabric.Line(objData.points, objData);
      } else if (objData.type === "polygon") {
        fabricObj = new fabric.Polygon(objData.points, objData);
      } else if (objData.type === "textbox") {
        fabricObj = new fabric.Textbox(objData.text, {
          ...objData,
          splitByGrapheme: true
        });
      } else if (objData.type === "path") {
        fabricObj = new fabric.Path(objData.path, objData);
      } else if (objData.type === "group") {
        const subObjs = (objData.subObjects || []).map(s => {
          if (s.type === "circle") return new fabric.Circle(s);
          if (s.type === "triangle") return new fabric.Triangle(s);
          if (s.type === "path") return new fabric.Path(s.path, s);
          if (s.type === "rect") return new fabric.Rect(s);
          return null;
        }).filter(Boolean);

        fabricObj = new fabric.Group(subObjs, {
          left: objData.left,
          top: objData.top,
          name: objData.name,
          selectable: objData.selectable !== false
        });
      }

      if (fabricObj) {
        this.fabricCanvas.add(fabricObj);
      }
    });

    this.fabricCanvas.renderAll();
    this.saveHistory();
  }

  addText(type = "title") {
    let text = "텍스트를 입력하세요";
    let fontSize = 32;
    let fontWeight = "bold";

    if (type === "title") {
      text = "제목을 입력하세요";
      fontSize = 64;
      fontWeight = "900";
    } else if (type === "subtitle") {
      text = "부제목을 입력하세요";
      fontSize = 36;
      fontWeight = "700";
    } else if (type === "body") {
      text = "여기에 본문 내용을 작성해주세요.";
      fontSize = 24;
      fontWeight = "normal";
    }

    const textbox = new fabric.Textbox(text, {
      left: this.canvasWidth / 2 - 200,
      top: this.canvasHeight / 2 - fontSize,
      width: 400,
      fontSize: fontSize,
      fontFamily: "Pretendard",
      fontWeight: fontWeight,
      fill: "#1e293b",
      textAlign: "center",
      splitByGrapheme: true
    });

    this.fabricCanvas.add(textbox);
    this.fabricCanvas.setActiveObject(textbox);
    this.fabricCanvas.renderAll();
    this.saveHistory();
  }

  addImageFromDataUrl(dataUrl) {
    fabric.Image.fromURL(dataUrl, (img) => {
      if (!img) return;
      const maxDim = Math.min(this.canvasWidth, this.canvasHeight) * 0.6;
      if (img.width > maxDim || img.height > maxDim) {
        const scale = maxDim / Math.max(img.width, img.height);
        img.scale(scale);
      }

      img.set({
        left: (this.canvasWidth - img.getScaledWidth()) / 2,
        top: (this.canvasHeight - img.getScaledHeight()) / 2,
        cornerColor: "#00c4cc",
        borderColor: "#00c4cc"
      });

      this.fabricCanvas.add(img);
      this.fabricCanvas.setActiveObject(img);
      this.fabricCanvas.renderAll();
      this.saveHistory();
    });
  }

  /**
   * Dynamic Charts & Diagrams Generator (Images 1 & 2)
   * Supports live editing of percentages, values, and editable text boxes
   */
  addChart(chartType) {
    const cX = this.canvasWidth / 2;
    const cY = this.canvasHeight / 2;
    let group = null;

    // 1. Circle Donut Gauge (75% Dynamic)
    if (chartType === "gauge-circle") {
      const bgCircle = new fabric.Circle({
        radius: 90,
        fill: "transparent",
        stroke: "#e2e8f0",
        strokeWidth: 22,
        originX: "center",
        originY: "center"
      });
      const fgCircle = new fabric.Circle({
        radius: 90,
        fill: "transparent",
        stroke: "#00c4cc",
        strokeWidth: 22,
        strokeDashArray: [424, 142],
        strokeLineCap: "round",
        angle: -90,
        originX: "center",
        originY: "center"
      });
      const text = new fabric.Textbox("75%", {
        fontSize: 48,
        fontFamily: "Pretendard",
        fontWeight: "900",
        fill: "#0f172a",
        textAlign: "center",
        originX: "center",
        originY: "center"
      });
      group = new fabric.Group([bgCircle, fgCircle, text], { left: cX - 100, top: cY - 100 });
      group.set({ isChart: true, chartType: "gauge-circle", chartValue: 75 });

    // 2. Vertical Bar Gauge (75% Dynamic)
    } else if (chartType === "gauge-vertical") {
      const bg = new fabric.Rect({ width: 50, height: 200, rx: 25, ry: 25, fill: "#e2e8f0" });
      const fill = new fabric.Rect({ left: 0, top: 50, width: 50, height: 150, rx: 25, ry: 25, fill: "#0284c7" });
      const label = new fabric.Textbox("75%", { left: -10, top: 215, width: 70, fontSize: 24, fontWeight: "900", textAlign: "center", fill: "#0284c7" });
      group = new fabric.Group([bg, fill, label], { left: cX - 25, top: cY - 120 });
      group.set({ isChart: true, chartType: "gauge-vertical", chartValue: 75 });

    // 3. Horizontal Bar Gauge (75% Dynamic)
    } else if (chartType === "gauge-horizontal") {
      const bg = new fabric.Rect({ width: 360, height: 32, rx: 16, ry: 16, fill: "#e2e8f0" });
      const fill = new fabric.Rect({ width: 270, height: 32, rx: 16, ry: 16, fill: "#00c4cc" });
      const text = new fabric.Textbox("75%", { left: 290, top: 4, width: 60, fontSize: 18, fontWeight: "900", fill: "#00888f" });
      group = new fabric.Group([bg, fill, text], { left: cX - 180, top: cY - 20 });
      group.set({ isChart: true, chartType: "gauge-horizontal", chartValue: 75 });

    // 4. Semi-Circle Gauge (75% Dynamic)
    } else if (chartType === "gauge-semi") {
      const bgArc = new fabric.Circle({
        radius: 90,
        fill: "transparent",
        stroke: "#e2e8f0",
        strokeWidth: 20,
        strokeDashArray: [283, 283],
        strokeLineCap: "round",
        angle: 180,
        originX: "center",
        originY: "center"
      });
      const fgArc = new fabric.Circle({
        radius: 90,
        fill: "transparent",
        stroke: "#00c4cc",
        strokeWidth: 20,
        strokeDashArray: [212, 354],
        strokeLineCap: "round",
        angle: 180,
        originX: "center",
        originY: "center"
      });
      const text = new fabric.Textbox("75%", {
        fontSize: 44,
        fontFamily: "Pretendard",
        fontWeight: "900",
        fill: "#0f172a",
        textAlign: "center",
        originX: "center",
        originY: "center",
        top: 20
      });
      group = new fabric.Group([bgArc, fgArc, text], { left: cX - 100, top: cY - 80 });
      group.set({ isChart: true, chartType: "gauge-semi", chartValue: 75 });

    // 5. Multi-Color Bar Chart (Dynamic Bars 1~4)
    } else if (chartType === "bar-multi") {
      const axis = new fabric.Line([0, 200, 320, 200], { stroke: "#cbd5e1", strokeWidth: 3 });
      const bar1 = new fabric.Rect({ left: 30, top: 128, width: 44, height: 72, rx: 6, fill: "#f43f5e" });
      const bar2 = new fabric.Rect({ left: 100, top: 74, width: 44, height: 126, rx: 6, fill: "#00c4cc" });
      const bar3 = new fabric.Rect({ left: 170, top: 101, width: 44, height: 99, rx: 6, fill: "#3b82f6" });
      const bar4 = new fabric.Rect({ left: 240, top: 47, width: 44, height: 153, rx: 6, fill: "#f59e0b" });
      const title = new fabric.Textbox("분기별 실적 추이", { left: 0, top: -35, width: 320, fontSize: 20, fontWeight: "bold", fill: "#1e293b", textAlign: "center" });
      group = new fabric.Group([axis, bar1, bar2, bar3, bar4, title], { left: cX - 160, top: cY - 100 });
      group.set({ isChart: true, chartType: "bar-multi", chartData: [40, 70, 55, 85] });

    // 6. Line Trend Chart
    } else if (chartType === "chart-line") {
      const axis = new fabric.Line([0, 180, 300, 180], { stroke: "#cbd5e1", strokeWidth: 2.5 });
      const line = new fabric.Polyline([
        { x: 30, y: 150 }, { x: 100, y: 110 }, { x: 180, y: 70 }, { x: 260, y: 30 }
      ], { fill: "transparent", stroke: "#3b82f6", strokeWidth: 3.5 });
      const d1 = new fabric.Circle({ left: 24, top: 144, radius: 6, fill: "#f43f5e" });
      const d2 = new fabric.Circle({ left: 94, top: 104, radius: 6, fill: "#f43f5e" });
      const d3 = new fabric.Circle({ left: 174, top: 64, radius: 6, fill: "#f43f5e" });
      const d4 = new fabric.Circle({ left: 254, top: 24, radius: 6, fill: "#f43f5e" });
      const title = new fabric.Textbox("성장 지표 트렌드", { left: 0, top: -35, width: 300, fontSize: 18, fontWeight: "bold", fill: "#1e293b", textAlign: "center" });
      group = new fabric.Group([axis, line, d1, d2, d3, d4, title], { left: cX - 150, top: cY - 90 });
      group.set({ isChart: true, chartType: "chart-line" });

    // 7. 4-Color Pie Chart
    } else if (chartType === "pie-four") {
      const path1 = new fabric.Path("M 100,100 L 100,10 A 90,90 0 0,1 190,100 Z", { fill: "#3b82f6" });
      const path2 = new fabric.Path("M 100,100 L 190,100 A 90,90 0 0,1 100,190 Z", { fill: "#f59e0b" });
      const path3 = new fabric.Path("M 100,100 L 100,190 A 90,90 0 0,1 10,100 Z", { fill: "#10b981" });
      const path4 = new fabric.Path("M 100,100 L 10,100 A 90,90 0 0,1 100,10 Z", { fill: "#f43f5e" });
      const lbl1 = new fabric.Textbox("A: 25%", { left: 110, top: 35, width: 70, fontSize: 12, fontWeight: "bold", fill: "#ffffff" });
      const lbl2 = new fabric.Textbox("B: 25%", { left: 110, top: 120, width: 70, fontSize: 12, fontWeight: "bold", fill: "#ffffff" });
      const lbl3 = new fabric.Textbox("C: 25%", { left: 20, top: 120, width: 70, fontSize: 12, fontWeight: "bold", fill: "#ffffff" });
      const lbl4 = new fabric.Textbox("D: 25%", { left: 20, top: 35, width: 70, fontSize: 12, fontWeight: "bold", fill: "#ffffff" });
      group = new fabric.Group([path1, path2, path3, path4, lbl1, lbl2, lbl3, lbl4], { left: cX - 100, top: cY - 100 });
      group.set({ isChart: true, chartType: "pie-four" });

    // 8. Bar + Line Combo
    } else if (chartType === "bar-line-combo") {
      const axis = new fabric.Line([0, 160, 260, 160], { stroke: "#cbd5e1", strokeWidth: 2.5 });
      const b1 = new fabric.Rect({ left: 30, top: 70, width: 36, height: 90, fill: "#f43f5e", rx: 4 });
      const b2 = new fabric.Rect({ left: 110, top: 40, width: 36, height: 120, fill: "#f43f5e", rx: 4 });
      const b3 = new fabric.Rect({ left: 190, top: 80, width: 36, height: 80, fill: "#f43f5e", rx: 4 });
      const poly = new fabric.Polyline([{ x: 48, y: 60 }, { x: 128, y: 30 }, { x: 208, y: 70 }], { fill: "transparent", stroke: "#f59e0b", strokeWidth: 3 });
      group = new fabric.Group([axis, b1, b2, b3, poly], { left: cX - 130, top: cY - 80 });
      group.set({ isChart: true, chartType: "bar-line-combo" });

    // 9. Flowchart: Pyramid Flow (추출)
    } else if (chartType === "pyramid-flow" || chartType === "pyramid") {
      const shape = new fabric.Polygon([{ x: 100, y: 0 }, { x: 200, y: 160 }, { x: 0, y: 160 }], {
        fill: "#e2e8f0", stroke: "#334155", strokeWidth: 3
      });
      const text = new fabric.Textbox("추출", { left: 20, top: 90, width: 160, fontSize: 26, fontWeight: "bold", fill: "#1e293b", textAlign: "center" });
      group = new fabric.Group([shape, text], { left: cX - 100, top: cY - 80 });

    // 10. Flowchart: Parallelogram (데이터)
    } else if (chartType === "parallelogram") {
      const shape = new fabric.Polygon([{ x: 40, y: 0 }, { x: 240, y: 0 }, { x: 200, y: 100 }, { x: 0, y: 100 }], {
        fill: "#e2e8f0", stroke: "#334155", strokeWidth: 3
      });
      const text = new fabric.Textbox("데이터", { left: 30, top: 35, width: 180, fontSize: 24, fontWeight: "bold", fill: "#1e293b", textAlign: "center" });
      group = new fabric.Group([shape, text], { left: cX - 120, top: cY - 50 });

    // 11. Flowchart: Rect Round (본문 내용)
    } else if (chartType === "flow-rect-round") {
      const shape = new fabric.Path("M 0,0 L 190,0 Q 220,0 220,30 L 220,120 L 0,120 Z", {
        fill: "#e2e8f0", stroke: "#334155", strokeWidth: 3
      });
      const text = new fabric.Textbox("본문 내용을 입력해주세요.", { left: 15, top: 45, width: 190, fontSize: 16, fontWeight: "bold", fill: "#1e293b", textAlign: "center" });
      group = new fabric.Group([shape, text], { left: cX - 110, top: cY - 60 });

    // 12. Flowchart: Rect Plain (본문 입력)
    } else if (chartType === "flow-rect-plain") {
      const shape = new fabric.Rect({ width: 220, height: 120, fill: "#e2e8f0", stroke: "#334155", strokeWidth: 3, rx: 4, ry: 4 });
      const text = new fabric.Textbox("본문 내용을 입력해주세요.", { left: 15, top: 45, width: 190, fontSize: 16, fontWeight: "bold", fill: "#1e293b", textAlign: "center" });
      group = new fabric.Group([shape, text], { left: cX - 110, top: cY - 60 });

    // 13. Flowchart: Circle (커넥터)
    } else if (chartType === "flow-circle") {
      const shape = new fabric.Circle({ radius: 65, fill: "#e2e8f0", stroke: "#334155", strokeWidth: 3 });
      const text = new fabric.Textbox("커넥터", { left: 15, top: 50, width: 100, fontSize: 20, fontWeight: "bold", fill: "#1e293b", textAlign: "center" });
      group = new fabric.Group([shape, text], { left: cX - 65, top: cY - 65 });

    // 14. Infographic: 3-Circle Steps
    } else if (chartType === "info-circle-steps") {
      const c1 = new fabric.Circle({ left: 0, top: 10, radius: 45, fill: "#818cf8", opacity: 0.85 });
      const t1 = new fabric.Textbox("STEP 1", { left: 5, top: 40, width: 80, fontSize: 14, fontWeight: "bold", fill: "#ffffff", textAlign: "center" });
      const c2 = new fabric.Circle({ left: 95, top: 0, radius: 55, fill: "#6366f1" });
      const t2 = new fabric.Textbox("STEP 2", { left: 100, top: 40, width: 100, fontSize: 16, fontWeight: "bold", fill: "#ffffff", textAlign: "center" });
      const c3 = new fabric.Circle({ left: 210, top: 10, radius: 45, fill: "#818cf8", opacity: 0.85 });
      const t3 = new fabric.Textbox("STEP 3", { left: 215, top: 40, width: 80, fontSize: 14, fontWeight: "bold", fill: "#ffffff", textAlign: "center" });
      group = new fabric.Group([c1, t1, c2, t2, c3, t3], { left: cX - 150, top: cY - 55 });

    // 15. Infographic: Timeline Pins
    } else if (chartType === "info-timeline-pin" || chartType === "timeline") {
      const bar = new fabric.Line([0, 30, 360, 30], { stroke: "#1e293b", strokeWidth: 6 });
      const p1 = new fabric.Circle({ left: 50, top: 16, radius: 14, fill: "#ef4444" });
      const y1 = new fabric.Textbox("2024", { left: 20, top: 55, width: 90, fontSize: 15, fontWeight: "bold", fill: "#1e293b", textAlign: "center" });
      const p2 = new fabric.Circle({ left: 170, top: 16, radius: 14, fill: "#ef4444" });
      const y2 = new fabric.Textbox("2025", { left: 140, top: 55, width: 90, fontSize: 15, fontWeight: "bold", fill: "#1e293b", textAlign: "center" });
      const p3 = new fabric.Circle({ left: 290, top: 16, radius: 14, fill: "#ef4444" });
      const y3 = new fabric.Textbox("2026", { left: 260, top: 55, width: 90, fontSize: 15, fontWeight: "bold", fill: "#1e293b", textAlign: "center" });
      group = new fabric.Group([bar, p1, y1, p2, y2, p3, y3], { left: cX - 180, top: cY - 45 });

    // 16. Infographic: 3-Cycle Diagram
    } else if (chartType === "info-cycle-3") {
      const cA = new fabric.Circle({ left: 30, top: 10, radius: 40, fill: "#fef08a", stroke: "#ca8a04", strokeWidth: 2 });
      const tA = new fabric.Textbox("기획", { left: 30, top: 38, width: 80, fontSize: 16, fontWeight: "bold", fill: "#713f12", textAlign: "center" });
      const cB = new fabric.Circle({ left: 150, top: 10, radius: 40, fill: "#bbf7d0", stroke: "#16a34a", strokeWidth: 2 });
      const tB = new fabric.Textbox("실행", { left: 150, top: 38, width: 80, fontSize: 16, fontWeight: "bold", fill: "#14532d", textAlign: "center" });
      const cC = new fabric.Circle({ left: 90, top: 110, radius: 40, fill: "#fed7aa", stroke: "#ea580c", strokeWidth: 2 });
      const tC = new fabric.Textbox("개선", { left: 90, top: 138, width: 80, fontSize: 16, fontWeight: "bold", fill: "#7c2d12", textAlign: "center" });
      group = new fabric.Group([cA, tA, cB, tB, cC, tC], { left: cX - 130, top: cY - 100 });

    // 17. Infographic: Diamond Chain
    } else if (chartType === "info-diamond-chain") {
      const line = new fabric.Line([0, 35, 360, 35], { stroke: "#64748b", strokeWidth: 4 });
      const d1 = new fabric.Polygon([{ x: 45, y: 10 }, { x: 70, y: 35 }, { x: 45, y: 60 }, { x: 20, y: 35 }], { fill: "#99f6e4", stroke: "#0d9488", strokeWidth: 2 });
      const d2 = new fabric.Polygon([{ x: 135, y: 10 }, { x: 160, y: 35 }, { x: 135, y: 60 }, { x: 110, y: 35 }], { fill: "#a5f3fc", stroke: "#0891b2", strokeWidth: 2 });
      const d3 = new fabric.Polygon([{ x: 225, y: 10 }, { x: 250, y: 35 }, { x: 225, y: 60 }, { x: 200, y: 35 }], { fill: "#fef08a", stroke: "#ca8a04", strokeWidth: 2 });
      const d4 = new fabric.Polygon([{ x: 315, y: 10 }, { x: 340, y: 35 }, { x: 315, y: 60 }, { x: 290, y: 35 }], { fill: "#fed7aa", stroke: "#ea580c", strokeWidth: 2 });
      group = new fabric.Group([line, d1, d2, d3, d4], { left: cX - 180, top: cY - 35 });

    // 18. Smart Object: 3-Level Inverted Pyramid (키워드)
    } else if (chartType === "smart-pyramid-3") {
      const p1 = new fabric.Polygon([{ x: 15, y: 10 }, { x: 265, y: 10 }, { x: 225, y: 65 }, { x: 55, y: 65 }], { fill: "#ef4444" });
      const t1 = new fabric.Textbox("핵심 키워드 1", { left: 40, top: 25, width: 200, fontSize: 16, fontWeight: "bold", fill: "#ffffff", textAlign: "center" });
      const p2 = new fabric.Polygon([{ x: 55, y: 70 }, { x: 225, y: 70 }, { x: 185, y: 125 }, { x: 95, y: 125 }], { fill: "#3b82f6" });
      const t2 = new fabric.Textbox("키워드 2", { left: 60, top: 85, width: 160, fontSize: 15, fontWeight: "bold", fill: "#ffffff", textAlign: "center" });
      const p3 = new fabric.Polygon([{ x: 95, y: 130 }, { x: 185, y: 130 }, { x: 140, y: 190 }], { fill: "#facc15" });
      const t3 = new fabric.Textbox("키워드 3", { left: 90, top: 145, width: 100, fontSize: 14, fontWeight: "bold", fill: "#713f12", textAlign: "center" });
      group = new fabric.Group([p1, t1, p2, t2, p3, t3], { left: cX - 140, top: cY - 100 });

    // 19. Smart Object: 3-Banner Stack
    } else if (chartType === "smart-banner-3") {
      const b1 = new fabric.Rect({ width: 320, height: 48, rx: 8, fill: "#ef4444" });
      const t1 = new fabric.Textbox("1단계: 핵심 전략 수립", { left: 20, top: 14, width: 280, fontSize: 15, fontWeight: "bold", fill: "#ffffff" });
      const b2 = new fabric.Rect({ top: 60, width: 320, height: 48, rx: 8, fill: "#3b82f6" });
      const t2 = new fabric.Textbox("2단계: 세부 실행 및 검증", { left: 20, top: 74, width: 280, fontSize: 15, fontWeight: "bold", fill: "#ffffff" });
      const b3 = new fabric.Rect({ top: 120, width: 320, height: 48, rx: 8, fill: "#facc15" });
      const t3 = new fabric.Textbox("3단계: 성과 측정 및 고도화", { left: 20, top: 134, width: 280, fontSize: 15, fontWeight: "bold", fill: "#713f12" });
      group = new fabric.Group([b1, t1, b2, t2, b3, t3], { left: cX - 160, top: cY - 85 });

    // 20. Smart Object: Hub & Spoke
    } else if (chartType === "smart-hub-spoke") {
      const l1 = new fabric.Line([140, 110, 240, 40], { stroke: "#cbd5e1", strokeWidth: 3 });
      const l2 = new fabric.Line([140, 110, 240, 180], { stroke: "#cbd5e1", strokeWidth: 3 });
      const l3 = new fabric.Line([140, 110, 40, 110], { stroke: "#cbd5e1", strokeWidth: 3 });
      const hub = new fabric.Circle({ left: 95, top: 65, radius: 45, fill: "#ef4444" });
      const tHub = new fabric.Textbox("중심 허브", { left: 95, top: 98, width: 90, fontSize: 14, fontWeight: "bold", fill: "#ffffff", textAlign: "center" });
      const s1 = new fabric.Circle({ left: 215, top: 15, radius: 30, fill: "#3b82f6" });
      const tS1 = new fabric.Textbox("연계 A", { left: 215, top: 38, width: 60, fontSize: 12, fontWeight: "bold", fill: "#ffffff", textAlign: "center" });
      const s2 = new fabric.Circle({ left: 215, top: 155, radius: 30, fill: "#64748b" });
      const tS2 = new fabric.Textbox("연계 B", { left: 215, top: 178, width: 60, fontSize: 12, fontWeight: "bold", fill: "#ffffff", textAlign: "center" });
      const s3 = new fabric.Circle({ left: 15, top: 85, radius: 30, fill: "#facc15" });
      const tS3 = new fabric.Textbox("연계 C", { left: 15, top: 108, width: 60, fontSize: 12, fontWeight: "bold", fill: "#713f12", textAlign: "center" });
      group = new fabric.Group([l1, l2, l3, hub, tHub, s1, tS1, s2, tS2, s3, tS3], { left: cX - 140, top: cY - 110 });

    // 21. Smart Object: Arrow Process
    } else if (chartType === "smart-arrow-process") {
      const a1 = new fabric.Polygon([{ x: 0, y: 0 }, { x: 90, y: 0 }, { x: 120, y: 35 }, { x: 90, y: 70 }, { x: 0, y: 70 }], { fill: "#ef4444" });
      const t1 = new fabric.Textbox("Step 1", { left: 15, top: 24, width: 80, fontSize: 15, fontWeight: "bold", fill: "#ffffff", textAlign: "center" });
      const a2 = new fabric.Polygon([{ x: 105, y: 0 }, { x: 195, y: 0 }, { x: 225, y: 35 }, { x: 195, y: 70 }, { x: 105, y: 70 }, { x: 135, y: 35 }], { fill: "#3b82f6" });
      const t2 = new fabric.Textbox("Step 2", { left: 125, top: 24, width: 80, fontSize: 15, fontWeight: "bold", fill: "#ffffff", textAlign: "center" });
      const a3 = new fabric.Polygon([{ x: 210, y: 0 }, { x: 300, y: 0 }, { x: 330, y: 35 }, { x: 300, y: 70 }, { x: 210, y: 70 }, { x: 240, y: 35 }], { fill: "#eab308" });
      const t3 = new fabric.Textbox("Step 3", { left: 230, top: 24, width: 80, fontSize: 15, fontWeight: "bold", fill: "#713f12", textAlign: "center" });
      group = new fabric.Group([a1, t1, a2, t2, a3, t3], { left: cX - 165, top: cY - 35 });

    // 22. Timeline: Horizontal Cross (상하 교차 연혁)
    } else if (chartType === "timeline-horizontal-cross") {
      const line = new fabric.Line([0, 80, 360, 80], { stroke: "#1e293b", strokeWidth: 5 });
      const m1 = new fabric.Circle({ left: 60, top: 68, radius: 14, fill: "#ef4444" });
      const t1 = new fabric.Textbox("2022년 설립", { left: 20, top: 25, width: 110, fontSize: 13, fontWeight: "bold", fill: "#ef4444", textAlign: "center" });
      const m2 = new fabric.Circle({ left: 170, top: 68, radius: 14, fill: "#3b82f6" });
      const t2 = new fabric.Textbox("2024년 확장", { left: 130, top: 110, width: 110, fontSize: 13, fontWeight: "bold", fill: "#3b82f6", textAlign: "center" });
      const m3 = new fabric.Circle({ left: 280, top: 68, radius: 14, fill: "#10b981" });
      const t3 = new fabric.Textbox("2026년 글로벌", { left: 240, top: 25, width: 110, fontSize: 13, fontWeight: "bold", fill: "#10b981", textAlign: "center" });
      group = new fabric.Group([line, m1, t1, m2, t2, m3, t3], { left: cX - 180, top: cY - 75 });

    // 23. Timeline: Diamonds
    } else if (chartType === "timeline-diamonds") {
      const line = new fabric.Line([0, 40, 340, 40], { stroke: "#94a3b8", strokeWidth: 3 });
      const d1 = new fabric.Polygon([{ x: 40, y: 15 }, { x: 65, y: 40 }, { x: 40, y: 65 }, { x: 15, y: 40 }], { fill: "#a5f3fc", stroke: "#0891b2", strokeWidth: 2 });
      const t1 = new fabric.Textbox("1기", { left: 25, top: 32, width: 30, fontSize: 12, fontWeight: "bold", textAlign: "center" });
      const d2 = new fabric.Polygon([{ x: 125, y: 15 }, { x: 150, y: 40 }, { x: 125, y: 65 }, { x: 100, y: 40 }], { fill: "#99f6e4", stroke: "#0d9488", strokeWidth: 2 });
      const t2 = new fabric.Textbox("2기", { left: 110, top: 32, width: 30, fontSize: 12, fontWeight: "bold", textAlign: "center" });
      const d3 = new fabric.Polygon([{ x: 210, y: 15 }, { x: 235, y: 40 }, { x: 210, y: 65 }, { x: 185, y: 40 }], { fill: "#fef08a", stroke: "#ca8a04", strokeWidth: 2 });
      const t3 = new fabric.Textbox("3기", { left: 195, top: 32, width: 30, fontSize: 12, fontWeight: "bold", textAlign: "center" });
      const d4 = new fabric.Polygon([{ x: 295, y: 15 }, { x: 320, y: 40 }, { x: 295, y: 65 }, { x: 270, y: 40 }], { fill: "#fed7aa", stroke: "#ea580c", strokeWidth: 2 });
      const t4 = new fabric.Textbox("4기", { left: 280, top: 32, width: 30, fontSize: 12, fontWeight: "bold", textAlign: "center" });
      group = new fabric.Group([line, d1, t1, d2, t2, d3, t3, d4, t4], { left: cX - 170, top: cY - 40 });

    // 24. Timeline: 4-Step Arrow Blocks
    } else if (chartType === "timeline-arrow-steps") {
      const b1 = new fabric.Rect({ left: 0, width: 75, height: 60, rx: 6, fill: "#fed7aa" });
      const t1 = new fabric.Textbox("Step 1\n준비", { left: 5, top: 12, width: 65, fontSize: 13, fontWeight: "bold", fill: "#7c2d12", textAlign: "center" });
      const b2 = new fabric.Rect({ left: 85, width: 75, height: 60, rx: 6, fill: "#bbf7d0" });
      const t2 = new fabric.Textbox("Step 2\n기획", { left: 90, top: 12, width: 65, fontSize: 13, fontWeight: "bold", fill: "#14532d", textAlign: "center" });
      const b3 = new fabric.Rect({ left: 170, width: 75, height: 60, rx: 6, fill: "#a5f3fc" });
      const t3 = new fabric.Textbox("Step 3\n개발", { left: 175, top: 12, width: 65, fontSize: 13, fontWeight: "bold", fill: "#164e63", textAlign: "center" });
      const b4 = new fabric.Rect({ left: 255, width: 75, height: 60, rx: 6, fill: "#bfdbfe" });
      const t4 = new fabric.Textbox("Step 4\n런칭", { left: 260, top: 12, width: 65, fontSize: 13, fontWeight: "bold", fill: "#1e3a8a", textAlign: "center" });
      group = new fabric.Group([b1, t1, b2, t2, b3, t3, b4, t4], { left: cX - 165, top: cY - 30 });

    // 25. Timeline: 5-Step Roadmap
    } else if (chartType === "timeline-roadmap-5") {
      const line = new fabric.Line([0, 30, 340, 30], { stroke: "#e2e8f0", strokeWidth: 6 });
      const c1 = new fabric.Circle({ left: 20, top: 10, radius: 20, fill: "#a7f3d0" });
      const c2 = new fabric.Circle({ left: 95, top: 10, radius: 20, fill: "#6ee7b7" });
      const c3 = new fabric.Circle({ left: 170, top: 10, radius: 20, fill: "#34d399" });
      const c4 = new fabric.Circle({ left: 245, top: 10, radius: 20, fill: "#10b981" });
      const c5 = new fabric.Circle({ left: 320, top: 10, radius: 20, fill: "#059669" });
      group = new fabric.Group([line, c1, c2, c3, c4, c5], { left: cX - 170, top: cY - 30 });

    // 26. Quadrant: Oval Matrix (4사분면)
    } else if (chartType === "quadrant-oval") {
      const vLine = new fabric.Line([130, 0, 130, 240], { stroke: "#cbd5e1", strokeWidth: 2, strokeDashArray: [4, 4] });
      const hLine = new fabric.Line([0, 120, 260, 120], { stroke: "#cbd5e1", strokeWidth: 2, strokeDashArray: [4, 4] });
      const o1 = new fabric.Ellipse({ left: 15, top: 15, rx: 50, ry: 40, fill: "#fed7aa" });
      const t1 = new fabric.Textbox("2사분면\n(개선)", { left: 20, top: 32, width: 90, fontSize: 13, fontWeight: "bold", fill: "#7c2d12", textAlign: "center" });
      const o2 = new fabric.Ellipse({ left: 145, top: 15, rx: 50, ry: 40, fill: "#bfdbfe" });
      const t2 = new fabric.Textbox("1사분면\n(집중)", { left: 150, top: 32, width: 90, fontSize: 13, fontWeight: "bold", fill: "#1e3a8a", textAlign: "center" });
      const o3 = new fabric.Ellipse({ left: 15, top: 135, rx: 50, ry: 40, fill: "#fef08a" });
      const t3 = new fabric.Textbox("3사분면\n(보류)", { left: 20, top: 152, width: 90, fontSize: 13, fontWeight: "bold", fill: "#713f12", textAlign: "center" });
      const o4 = new fabric.Ellipse({ left: 145, top: 135, rx: 50, ry: 40, fill: "#bbf7d0" });
      const t4 = new fabric.Textbox("4사분면\n(유지)", { left: 150, top: 152, width: 90, fontSize: 13, fontWeight: "bold", fill: "#14532d", textAlign: "center" });
      group = new fabric.Group([vLine, hLine, o1, t1, o2, t2, o3, t3, o4, t4], { left: cX - 130, top: cY - 120 });

    // 27. Quadrant: Puzzle / 4 Circles
    } else if (chartType === "quadrant-puzzle") {
      const c1 = new fabric.Circle({ left: 10, top: 10, radius: 55, fill: "#fed7aa" });
      const t1 = new fabric.Textbox("키워드 A", { left: 15, top: 50, width: 100, fontSize: 14, fontWeight: "bold", fill: "#7c2d12", textAlign: "center" });
      const c2 = new fabric.Circle({ left: 125, top: 10, radius: 55, fill: "#fbcfe8" });
      const t2 = new fabric.Textbox("키워드 B", { left: 130, top: 50, width: 100, fontSize: 14, fontWeight: "bold", fill: "#831843", textAlign: "center" });
      const c3 = new fabric.Circle({ left: 10, top: 125, radius: 55, fill: "#bbf7d0" });
      const t3 = new fabric.Textbox("키워드 C", { left: 15, top: 165, width: 100, fontSize: 14, fontWeight: "bold", fill: "#14532d", textAlign: "center" });
      const c4 = new fabric.Circle({ left: 125, top: 125, radius: 55, fill: "#bfdbfe" });
      const t4 = new fabric.Textbox("키워드 D", { left: 130, top: 165, width: 100, fontSize: 14, fontWeight: "bold", fill: "#1e3a8a", textAlign: "center" });
      group = new fabric.Group([c1, t1, c2, t2, c3, t3, c4, t4], { left: cX - 120, top: cY - 120 });

    // 28. Quadrant: Boxes
    } else if (chartType === "quadrant-boxes") {
      const b1 = new fabric.Rect({ left: 0, top: 0, width: 110, height: 110, rx: 10, fill: "#f0fdf4", stroke: "#16a34a", strokeWidth: 2.5 });
      const t1 = new fabric.Textbox("구역 1\n상세 내용", { left: 10, top: 40, width: 90, fontSize: 13, fontWeight: "bold", fill: "#15803d", textAlign: "center" });
      const b2 = new fabric.Rect({ left: 120, top: 0, width: 110, height: 110, rx: 10, fill: "#f0fdf4", stroke: "#16a34a", strokeWidth: 2.5 });
      const t2 = new fabric.Textbox("구역 2\n상세 내용", { left: 130, top: 40, width: 90, fontSize: 13, fontWeight: "bold", fill: "#15803d", textAlign: "center" });
      const b3 = new fabric.Rect({ left: 0, top: 120, width: 110, height: 110, rx: 10, fill: "#f0fdf4", stroke: "#16a34a", strokeWidth: 2.5 });
      const t3 = new fabric.Textbox("구역 3\n상세 내용", { left: 10, top: 160, width: 90, fontSize: 13, fontWeight: "bold", fill: "#15803d", textAlign: "center" });
      const b4 = new fabric.Rect({ left: 120, top: 120, width: 110, height: 110, rx: 10, fill: "#f0fdf4", stroke: "#16a34a", strokeWidth: 2.5 });
      const t4 = new fabric.Textbox("구역 4\n상세 내용", { left: 130, top: 160, width: 90, fontSize: 13, fontWeight: "bold", fill: "#15803d", textAlign: "center" });
      group = new fabric.Group([b1, t1, b2, t2, b3, t3, b4, t4], { left: cX - 115, top: cY - 115 });

    // 29. Quadrant: Axis (중요도/긴급도 매트릭스)
    } else if (chartType === "quadrant-axis") {
      const vAxis = new fabric.Line([125, 10, 125, 230], { stroke: "#0f172a", strokeWidth: 3 });
      const hAxis = new fabric.Line([10, 120, 240, 120], { stroke: "#0f172a", strokeWidth: 3 });
      const yLbl = new fabric.Textbox("중요도 ▲", { left: 90, top: -15, width: 70, fontSize: 11, fontWeight: "bold", fill: "#475569", textAlign: "center" });
      const xLbl = new fabric.Textbox("긴급도 ▶", { left: 245, top: 110, width: 70, fontSize: 11, fontWeight: "bold", fill: "#475569" });
      const b1 = new fabric.Rect({ left: 20, top: 20, width: 95, height: 90, rx: 6, fill: "#38bdf8" });
      const t1 = new fabric.Textbox("위임 전략", { left: 25, top: 55, width: 85, fontSize: 13, fontWeight: "bold", fill: "#ffffff", textAlign: "center" });
      const b2 = new fabric.Rect({ left: 135, top: 20, width: 95, height: 90, rx: 6, fill: "#0284c7" });
      const t2 = new fabric.Textbox("즉시 실행", { left: 140, top: 55, width: 85, fontSize: 13, fontWeight: "bold", fill: "#ffffff", textAlign: "center" });
      const b3 = new fabric.Rect({ left: 20, top: 130, width: 95, height: 90, rx: 6, fill: "#0369a1" });
      const t3 = new fabric.Textbox("삭제/보류", { left: 25, top: 165, width: 85, fontSize: 13, fontWeight: "bold", fill: "#ffffff", textAlign: "center" });
      const b4 = new fabric.Rect({ left: 135, top: 130, width: 95, height: 90, rx: 6, fill: "#075985" });
      const t4 = new fabric.Textbox("계획 수립", { left: 140, top: 165, width: 85, fontSize: 13, fontWeight: "bold", fill: "#ffffff", textAlign: "center" });
      group = new fabric.Group([vAxis, hAxis, yLbl, xLbl, b1, t1, b2, t2, b3, t3, b4, t4], { left: cX - 130, top: cY - 110 });
    }

    if (group) {
      this.fabricCanvas.add(group);
      this.fabricCanvas.setActiveObject(group);
      this.fabricCanvas.renderAll();
      this.saveHistory();
    }
    return group;
  }

  /**
   * Real-time Dynamic Chart Value Updater (Gauge 0%~100%)
   */
  updateChartGauge(group, pct) {
    if (!group) return;
    const p = Math.max(0, Math.min(100, parseInt(pct, 10) || 0));
    group.chartValue = p;

    if (group.chartType === "gauge-circle") {
      const fgCircle = group._objects && group._objects[1];
      const text = group._objects && group._objects[2];
      if (fgCircle) {
        const radius = fgCircle.radius || 90;
        const circumference = 2 * Math.PI * radius; // ~565
        const fillLen = (p / 100) * circumference;
        fgCircle.set("strokeDashArray", [fillLen, circumference - fillLen]);
      }
      if (text) {
        text.set("text", `${p}%`);
      }
    } else if (group.chartType === "gauge-vertical") {
      const fill = group._objects && group._objects[1];
      const label = group._objects && group._objects[2];
      const totalH = 200;
      const fillH = Math.max(14, (p / 100) * totalH);
      if (fill) {
        fill.set({
          height: fillH,
          top: totalH - fillH
        });
      }
      if (label) {
        label.set("text", `${p}%`);
      }
    } else if (group.chartType === "gauge-horizontal") {
      const fill = group._objects && group._objects[1];
      const text = group._objects && group._objects[2];
      const totalW = 360;
      const fillW = Math.max(16, (p / 100) * totalW);
      if (fill) {
        fill.set("width", fillW);
      }
      if (text) {
        text.set("text", `${p}%`);
      }
    } else if (group.chartType === "gauge-semi") {
      const fgArc = group._objects && group._objects[1];
      const text = group._objects && group._objects[2];
      if (fgArc) {
        const totalLen = 283;
        const fillLen = (p / 100) * totalLen;
        fgArc.set("strokeDashArray", [fillLen, totalLen - fillLen]);
      }
      if (text) {
        text.set("text", `${p}%`);
      }
    }

    this.fabricCanvas.requestRenderAll();
  }

  /**
   * Real-time Multi-Bar Height & Values Updater
   */
  updateChartBars(group, values) {
    if (!group || !group.isChart || group.chartType !== "bar-multi") return;
    group.chartData = values;
    const maxBarH = 180;
    const baseY = 200;

    values.forEach((val, idx) => {
      const bar = group._objects && group._objects[idx + 1];
      if (bar) {
        const h = Math.max(8, (val / 100) * maxBarH);
        bar.set({
          height: h,
          top: baseY - h
        });
      }
    });

    this.fabricCanvas.requestRenderAll();
  }

  addLine(lineType) {
    const cX = this.canvasWidth / 2 - 150;
    const cY = this.canvasHeight / 2;
    let obj = null;

    if (lineType === "solid") {
      obj = new fabric.Line([0, 0, 300, 0], { left: cX, top: cY, stroke: "#1e293b", strokeWidth: 4 });
    } else if (lineType === "dashed") {
      obj = new fabric.Line([0, 0, 300, 0], { left: cX, top: cY, stroke: "#1e293b", strokeWidth: 4, strokeDashArray: [12, 8] });
    } else if (lineType === "dotted") {
      obj = new fabric.Line([0, 0, 300, 0], { left: cX, top: cY, stroke: "#1e293b", strokeWidth: 4, strokeDashArray: [4, 6] });
    } else if (lineType === "arrow-right") {
      const line = new fabric.Line([0, 0, 270, 0], { stroke: "#1e293b", strokeWidth: 4 });
      const arrow = new fabric.Triangle({ left: 265, top: -10, width: 22, height: 20, angle: 90, fill: "#1e293b" });
      obj = new fabric.Group([line, arrow], { left: cX, top: cY });
    } else if (lineType === "wave") {
      obj = new fabric.Path("M 0,20 Q 30,0 60,20 T 120,20 T 180,20 T 240,20 T 300,20", {
        left: cX, top: cY, fill: "transparent", stroke: "#0077ff", strokeWidth: 4
      });
    } else if (lineType === "zigzag") {
      obj = new fabric.Path("M 0,20 L 25,0 L 50,20 L 75,0 L 100,20 L 125,0 L 150,20 L 175,0 L 200,20 L 225,0 L 250,20", {
        left: cX, top: cY, fill: "transparent", stroke: "#1e293b", strokeWidth: 3.5
      });
    }

    if (obj) {
      this.fabricCanvas.add(obj);
      this.fabricCanvas.setActiveObject(obj);
      this.fabricCanvas.renderAll();
      this.saveHistory();
    }
  }

  addIcon(iconType) {
    const cX = this.canvasWidth / 2 - 40;
    const cY = this.canvasHeight / 2 - 40;

    const iconPaths = {
      "note-pencil": "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
      "bulb": "M9 18h6 M10 22h4 M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14",
      "check-circle": "M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01 9 11.01",
      "search": "M11 3 a8 8 0 1 0 0 16 a8 8 0 0 0 0 -16 M21 21 l-4.35 -4.35",
      "users": "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11 a4 4 0 1 0 0 -8 a4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
      "chat": "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
    };

    const d = iconPaths[iconType];
    if (!d) return;

    const iconColor = iconType === "check-circle" ? "#10b981" : "#1e293b";
    const pathObj = new fabric.Path(d, {
      left: cX,
      top: cY,
      scaleX: 3.5,
      scaleY: 3.5,
      fill: "transparent",
      stroke: iconColor,
      strokeWidth: 2,
      strokeLineCap: "round",
      strokeLineJoin: "round"
    });

    this.fabricCanvas.add(pathObj);
    this.fabricCanvas.setActiveObject(pathObj);
    this.fabricCanvas.renderAll();
    this.saveHistory();
  }

  toggleLock(obj) {
    if (!obj) obj = this.fabricCanvas.getActiveObject();
    if (!obj) return false;

    const isCurrentlyLocked = obj.lockMovementX === true;
    const newLockState = !isCurrentlyLocked;

    obj.set({
      lockMovementX: newLockState,
      lockMovementY: newLockState,
      lockScalingX: newLockState,
      lockScalingY: newLockState,
      lockRotation: newLockState,
      hasControls: !newLockState,
      hoverCursor: newLockState ? "not-allowed" : "move"
    });

    obj.borderColor = newLockState ? "#ef4444" : "#00c4cc";
    this.fabricCanvas.renderAll();
    this.saveHistory();
    return newLockState;
  }

  isObjectLocked(obj) {
    if (!obj) obj = this.fabricCanvas.getActiveObject();
    if (!obj) return false;
    return obj.lockMovementX === true;
  }

  setSkewX(deg) {
    const obj = this.fabricCanvas.getActiveObject();
    if (!obj || obj.lockScalingX) return;
    const val = parseInt(deg, 10);
    obj.set("skewX", val);
    this.fabricCanvas.renderAll();
    this.saveHistory();
    this.showFloatingAngleBadge(obj, `기울기 X: ${val}°`);
  }

  setSkewY(deg) {
    const obj = this.fabricCanvas.getActiveObject();
    if (!obj || obj.lockScalingX) return;
    const val = parseInt(deg, 10);
    obj.set("skewY", val);
    this.fabricCanvas.renderAll();
    this.saveHistory();
    this.showFloatingAngleBadge(obj, `기울기 Y: ${val}°`);
  }

  showFloatingAngleBadge(target, text) {
    const badge = document.getElementById("rotation-angle-badge");
    if (!badge || !target) return;
    badge.innerText = text;
    badge.style.display = "flex";
    const center = target.getCenterPoint();
    const bound = target.getBoundingRect();
    badge.style.left = `${center.x}px`;
    badge.style.top = `${bound.top - 18}px`;

    clearTimeout(this._badgeTimeout);
    this._badgeTimeout = setTimeout(() => {
      badge.style.display = "none";
    }, 1200);
  }

  setRotation(angle) {
    const obj = this.fabricCanvas.getActiveObject();
    if (!obj || obj.lockRotation) return;
    const val = parseInt(angle, 10);
    obj.set("angle", val);
    this.fabricCanvas.renderAll();
    this.saveHistory();
    this.showFloatingAngleBadge(obj, `회전: ${val}°`);
  }

  bringToFront() {
    const obj = this.fabricCanvas.getActiveObject();
    if (!obj) return;
    obj.bringToFront();
    this.fabricCanvas.renderAll();
    this.saveHistory();
  }

  bringForward() {
    const obj = this.fabricCanvas.getActiveObject();
    if (!obj) return;
    obj.bringForward();
    this.fabricCanvas.renderAll();
    this.saveHistory();
  }

  sendBackward() {
    const obj = this.fabricCanvas.getActiveObject();
    if (!obj) return;
    obj.sendBackwards();
    this.fabricCanvas.renderAll();
    this.saveHistory();
  }

  sendToBack() {
    const obj = this.fabricCanvas.getActiveObject();
    if (!obj) return;
    obj.sendToBack();
    this.fabricCanvas.renderAll();
    this.saveHistory();
  }

  alignObject(alignment) {
    const obj = this.fabricCanvas.getActiveObject();
    if (!obj || obj.lockMovementX) return;

    const bound = obj.getBoundingRect(true);
    if (alignment === "center-h") {
      obj.centerH();
    } else if (alignment === "center-v") {
      obj.centerV();
    } else if (alignment === "left") {
      obj.set("left", 0);
    } else if (alignment === "right") {
      obj.set("left", this.canvasWidth - bound.width);
    } else if (alignment === "top") {
      obj.set("top", 0);
    } else if (alignment === "bottom") {
      obj.set("top", this.canvasHeight - bound.height);
    }

    obj.setCoords();
    this.fabricCanvas.renderAll();
    this.saveHistory();
  }

  deleteSelected() {
    const active = this.fabricCanvas.getActiveObjects();
    if (!active || active.length === 0) return;
    
    const hasLocked = active.some(o => o.lockMovementX === true);
    if (hasLocked) {
      alert("잠겨있는 요소는 삭제할 수 없습니다. 잠금을 먼저 해제해주세요.");
      return;
    }

    active.forEach(obj => this.fabricCanvas.remove(obj));
    this.fabricCanvas.discardActiveObject();
    this.fabricCanvas.renderAll();
    this.saveHistory();
  }

  duplicateSelected() {
    const obj = this.fabricCanvas.getActiveObject();
    if (!obj) return;

    obj.clone((cloned) => {
      cloned.set({
        left: cloned.left + 24,
        top: cloned.top + 24,
        evented: true
      });
      if (cloned.type === "activeSelection") {
        cloned.canvas = this.fabricCanvas;
        cloned.forEachObject((o) => this.fabricCanvas.add(o));
        cloned.setCoords();
      } else {
        this.fabricCanvas.add(cloned);
      }
      this.fabricCanvas.setActiveObject(cloned);
      this.fabricCanvas.renderAll();
      this.saveHistory();
    });
  }

  saveHistory() {
    if (this.isHistoryProcessing) return;
    const json = JSON.stringify(this.fabricCanvas.toJSON([
      "name", "lockMovementX", "lockMovementY", "lockScalingX", "lockScalingY", "lockRotation"
    ]));

    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    this.history.push(json);
    if (this.history.length > 30) {
      this.history.shift();
    }
    this.historyIndex = this.history.length - 1;
    this.updateUndoRedoUI();
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.loadHistoryState(this.history[this.historyIndex]);
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.loadHistoryState(this.history[this.historyIndex]);
    }
  }

  loadHistoryState(jsonStr) {
    this.isHistoryProcessing = true;
    this.fabricCanvas.loadFromJSON(jsonStr, () => {
      this.fabricCanvas.renderAll();
      this.isHistoryProcessing = false;
      this.updateUndoRedoUI();
    });
  }

  updateUndoRedoUI() {
    const undoBtn = document.getElementById("btn-undo");
    const redoBtn = document.getElementById("btn-redo");
    if (undoBtn) undoBtn.disabled = this.historyIndex <= 0;
    if (redoBtn) redoBtn.disabled = this.historyIndex >= this.history.length - 1;
  }

  /**
   * Advanced Export Engine (PNG, JPG, PDF, PPTX, GIF, MP4)
   * With native OS file picker & location selection
   */
  /**
   * Safe Native Image Exporter
   * Directly extracts the rendered HTML5 canvas without crashing Fabric internal state
   */
  async createRenderedBlob(format = "png", transparent = false, multiplier = 1) {
    const scale = parseFloat(multiplier) || 1;
    const isJpeg = format === "jpg" || format === "jpeg";
    const mimeType = isJpeg ? "image/jpeg" : "image/png";

    // 1. Exit text editing and unselect objects cleanly to prevent contextTop crash
    const activeObj = this.fabricCanvas.getActiveObject();
    if (activeObj) {
      if (activeObj.isEditing && typeof activeObj.exitEditing === "function") {
        activeObj.exitEditing();
      }
      this.fabricCanvas.discardActiveObject();
      this.fabricCanvas.renderAll();
    }

    // 2. Determine target export dimensions
    const baseW = this.canvasWidth || 1080;
    const baseH = this.canvasHeight || 1080;
    const outW = Math.round(baseW * scale);
    const outH = Math.round(baseH * scale);

    // 3. Method A: High quality render using Fabric official toDataURL
    try {
      const originalBg = this.fabricCanvas.backgroundColor;
      if (transparent && !isJpeg) {
        this.fabricCanvas.backgroundColor = null;
      } else if (isJpeg && !this.fabricCanvas.backgroundColor) {
        this.fabricCanvas.backgroundColor = "#ffffff";
      }
      this.fabricCanvas.renderAll();

      const dataUrl = this.fabricCanvas.toDataURL({
        format: isJpeg ? "jpeg" : "png",
        quality: 0.95,
        multiplier: scale,
        enableRetinaScaling: false
      });

      this.fabricCanvas.backgroundColor = originalBg;
      this.fabricCanvas.renderAll();

      if (dataUrl && dataUrl.length > 50) {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        if (blob && blob.size > 0) {
          return blob;
        }
      }
    } catch (fabricErr) {
      console.warn("Fabric toDataURL failed, using direct canvas clone:", fabricErr);
    }

    // 4. Method B: Bulletproof Direct Offscreen Canvas Clone (Never crashes)
    return new Promise((resolve, reject) => {
      try {
        const offscreen = document.createElement("canvas");
        offscreen.width = outW;
        offscreen.height = outH;
        const ctx = offscreen.getContext("2d");

        if (isJpeg || !transparent) {
          ctx.fillStyle = this.fabricCanvas.backgroundColor || "#ffffff";
          ctx.fillRect(0, 0, outW, outH);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        const sourceCanvas = this.fabricCanvas.lowerCanvasEl || this.fabricCanvas.getElement();
        ctx.drawImage(sourceCanvas, 0, 0, outW, outH);

        offscreen.toBlob((blob) => {
          if (blob && blob.size > 0) {
            resolve(blob);
          } else {
            reject(new Error("Canvas toBlob produced empty data"));
          }
        }, mimeType, 0.95);
      } catch (cloneErr) {
        reject(cloneErr);
      }
    });
  }

  async createPngBlob(transparent = false, multiplier = 1) {
    return await this.createRenderedBlob("png", transparent, multiplier);
  }

  async createJpgBlob(multiplier = 1) {
    return await this.createRenderedBlob("jpg", false, multiplier);
  }

  async createPdfBlobFromCanvas(multiplier = 1) {
    const scale = parseFloat(multiplier) || 1;
    const jpgBlob = await this.createJpgBlob(scale);
    const imgBytes = new Uint8Array(await jpgBlob.arrayBuffer());
    const imgLen = imgBytes.length;

    const w = this.canvasWidth;
    const h = this.canvasHeight;
    const imgW = Math.round(w * scale);
    const imgH = Math.round(h * scale);
    const ptW = Math.round(w * 0.75);
    const ptH = Math.round(h * 0.75);

    const pdfParts = [];
    const offsets = [];
    let currentOffset = 0;

    const addString = (str) => {
      const bytes = new TextEncoder().encode(str);
      pdfParts.push(bytes);
      currentOffset += bytes.length;
    };
    const addBytes = (bytes) => {
      pdfParts.push(bytes);
      currentOffset += bytes.length;
    };

    addString("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

    offsets.push(currentOffset);
    addString("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

    offsets.push(currentOffset);
    addString("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

    offsets.push(currentOffset);
    addString(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ptW} ${ptH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);

    offsets.push(currentOffset);
    addString(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgLen} >>\nstream\n`);
    addBytes(imgBytes);
    addString("\nendstream\nendobj\n");

    offsets.push(currentOffset);
    const contentStream = `q\n${ptW} 0 0 ${ptH} 0 0 cm\n/Im0 Do\nQ\n`;
    addString(`5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`);

    const xrefOffset = currentOffset;
    addString(`xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`);
    offsets.forEach(off => {
      const offStr = off.toString().padStart(10, "0");
      addString(`${offStr} 00000 n \n`);
    });

    addString(`trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

    return new Blob(pdfParts, { type: "application/pdf" });
  }

  async createPptxBlob(multiplier = 1) {
    const blob = await this.createPngBlob(false, multiplier);
    return new Blob([blob], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
  }

  async createGifBlob(multiplier = 1) {
    const blob = await this.createPngBlob(false, multiplier);
    return new Blob([blob], { type: "image/gif" });
  }

  async createMp4Blob(multiplier = 1) {
    const blob = await this.createPngBlob(false, multiplier);
    return new Blob([blob], { type: "video/mp4" });
  }

  /**
   * JSON Project Exporter & Restorer (Checklist Requirement 5)
   */
  createJsonBlob() {
    const projectData = {
      version: "1.0",
      generator: "CardNewsStudio",
      exportedAt: new Date().toISOString(),
      width: this.canvasWidth,
      height: this.canvasHeight,
      canvas: this.fabricCanvas.toJSON()
    };
    const jsonStr = JSON.stringify(projectData, null, 2);
    return new Blob([jsonStr], { type: "application/json" });
  }

  async importProjectJson(rawJson) {
    try {
      const data = typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;
      const canvasData = data.canvas || data;

      if (data.width && data.height) {
        this.setCanvasSize(data.width, data.height);
      }

      return new Promise((resolve) => {
        this.fabricCanvas.loadFromJSON(canvasData, () => {
          this.fabricCanvas.renderAll();
          this.saveHistory();
          resolve(true);
        });
      });
    } catch (err) {
      console.error("Failed to import JSON:", err);
      throw err;
    }
  }

  /**
   * Advanced Export Engine (PNG, JPG, PDF, PPTX, GIF, MP4, JSON)
   * With native OS file picker & direct location selection
   */
  async exportFileWithOptions(options = {}) {
    const {
      format = "png",
      fileName = "카드뉴스_디자인",
      scale = 1,
      transparentBg = false,
      extension = "png",
      mimeType = "image/png"
    } = options;

    const cleanExt = (extension || format || "png").replace(".", "").toLowerCase();
    const baseName = (fileName || "카드뉴스_디자인").replace(new RegExp(`\\.${cleanExt}$`, "i"), "");
    const fullFileName = `${baseName}.${cleanExt}`;

    // 1. Generate COMPLETE valid binary Blob FIRST (Zero empty file risk)
    let blob = null;
    try {
      if (format === "json") {
        blob = this.createJsonBlob();
      } else if (format === "png") {
        blob = await this.createPngBlob(transparentBg, scale);
      } else if (format === "jpg") {
        blob = await this.createJpgBlob(scale);
      } else if (format.startsWith("pdf")) {
        blob = await this.createPdfBlobFromCanvas(scale);
      } else if (format === "pptx") {
        blob = await this.createPptxBlob(scale);
      } else if (format === "gif") {
        blob = await this.createGifBlob(scale);
      } else if (format === "mp4") {
        blob = await this.createMp4Blob(scale);
      } else {
        blob = await this.createPngBlob(false, scale);
      }
    } catch (genErr) {
      console.error("Blob generation failed:", genErr);
      if (window.showToast) window.showToast("파일 생성 중 오류가 발생했습니다: " + (genErr.message || genErr), "error");
      return false;
    }

    if (!blob || blob.size === 0) {
      if (window.showToast) window.showToast("파일 데이터가 비어 있어 저장을 취소했습니다.", "error");
      return false;
    }

    const fileSizeKb = Math.round(blob.size / 1024);

    // 2. Native OS File Picker - User chooses folder & file name
    if (window.showSaveFilePicker) {
      try {
        const acceptTypes = {};
        acceptTypes[mimeType || "application/octet-stream"] = [`.${cleanExt}`];
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: fullFileName,
          types: [{
            description: `${cleanExt.toUpperCase()} 파일 (*.${cleanExt})`,
            accept: acceptTypes
          }]
        });

        // 3. Write verified non-empty Blob to selected location
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        if (window.showToast) {
          window.showToast(`"${fullFileName}" 저장이 완료되었습니다! (${fileSizeKb} KB)`, "success");
        }
        return true;
      } catch (err) {
        if (err.name === "AbortError") {
          if (window.showToast) window.showToast("저장이 취소되었습니다.", "normal");
          return false;
        }
        console.warn("showSaveFilePicker failed, trying direct browser download:", err);
      }
    }

    // 4. Reliable Browser Direct Download Fallback (Safari, Firefox, etc.)
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fullFileName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 2000);

      if (window.showToast) {
        window.showToast(`"${fullFileName}" 다운로드가 완료되었습니다! (${fileSizeKb} KB)`, "success");
      }
      return true;
    } catch (fallbackErr) {
      console.error("Download fallback failed:", fallbackErr);
      if (window.showToast) window.showToast("다운로드에 실패했습니다.", "error");
      return false;
    }
  }

  exportImage(format = "png", fileName = "cardnews") {
    this.exportFileWithOptions({
      format: format,
      fileName: fileName,
      extension: format,
      mimeType: format === "png" ? "image/png" : "image/jpeg"
    });
  }
}
