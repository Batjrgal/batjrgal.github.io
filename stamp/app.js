const MAX_FILE_SIZE = 15 * 1024 * 1024;
const STORAGE_KEY = "stamp-generator-settings";
const PENDING_IMAGE_KEY = "stamp_pending_image";
const PENDING_ORIGINAL_KEY = "stamp_pending_original";
const PENDING_ORDER_KEY = "stamp_pending_order";
const STAMP_IMAGE_ID_KEY = "stamp_current_image_id";
const PAID_IMAGES_KEY = "stamp_paid_image_ids";
const WATERMARK_TEXT = "Photostamp";

let currentImageId = null;

let paymentEnabled = window.__STAMP_PAYMENT__?.paymentEnabled ?? false;
let paymentAmountDisplay = window.__STAMP_PAYMENT__?.amountDisplay ?? 0;
let paymentConfigReady = Boolean(window.__STAMP_PAYMENT__);
const paymentConfigPromise = loadPaymentConfig();

const PRESETS = {
  standard: {
    border: 6,
    density: 5,
    hole: 100,
    color: "#ffffff",
    pattern: "solid",
    scale: 1,
  },
  imageOnly: {
    border: 0,
    density: 5,
    hole: 100,
    color: "#ffffff",
    pattern: "solid",
    scale: 1,
  },
  print: {
    border: 8,
    density: 4,
    hole: 90,
    color: "#f5f0e6",
    pattern: "linen",
    scale: 2,
  },
};

const TOOL_TAB_ACTIVE = [
  "border-stamp",
  "bg-stamp/10",
  "text-stamp",
  "ring-1",
  "ring-stamp/25",
];
const TOOL_TAB_INACTIVE = [
  "text-paper-muted",
  "hover:bg-ink-100/50",
  "hover:text-paper",
];
const CROP_RATIO_ACTIVE = ["border-stamp", "bg-stamp/10", "text-stamp"];
const CROP_RATIO_INACTIVE = [
  "border-ink-200",
  "bg-ink-100/50",
  "text-paper-muted",
];
const PATTERN_ACTIVE = ["border-stamp", "bg-stamp/10"];
const PATTERN_INACTIVE = ["border-ink-200", "bg-ink-100/50"];
const PATTERN_LABEL_ACTIVE = ["text-stamp"];
const PATTERN_LABEL_INACTIVE = ["text-paper-muted"];

const PRESET_ACTIVE = ["border-stamp", "bg-stamp/10"];
const PRESET_INACTIVE = ["border-ink-200", "bg-ink-100/50"];
const PRESET_TEXT_ACTIVE = ["text-stamp"];
const PRESET_TEXT_INACTIVE = ["text-paper-muted"];
const PRESET_ICON_ACTIVE = ["text-stamp"];
const PRESET_ICON_INACTIVE = ["text-paper-muted"];
const DL_BTN_HTML = `
      <span class="relative flex items-center gap-3">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 shadow-inner ring-1 ring-inset ring-white/25 backdrop-blur-sm">
              <i class="fa-solid fa-download text-base"></i>
          </span>
          <span class="flex flex-col items-start text-left leading-none">
              <span class="text-[15px] font-bold tracking-wide">Татаж авах</span>
              
          </span>
      </span>`;
const DL_BTN_HTML_MOBILE = `
      <span class="relative flex w-full items-center justify-center gap-2.5">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-1 ring-inset ring-white/25 backdrop-blur-sm">
              <i class="fa-solid fa-download text-sm"></i>
          </span>
          <span class="flex flex-col items-start text-left leading-none">
              <span class="text-sm font-bold tracking-wide">Татаж авах</span>
              <span class="mt-0.5 text-[10px] font-medium text-white/75">PNG файл</span>
          </span>
      </span>`;
const DL_LOADING_HTML = `
      <span class="relative flex items-center gap-3">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-1 ring-inset ring-white/25">
              <i class="fa-solid fa-spinner fa-spin text-base"></i>
          </span>
          <span class="text-sm font-bold tracking-wide">Бэлтгэж байна...</span>
      </span>`;
const DL_LOADING_HTML_MOBILE = `
      <span class="relative flex items-center gap-2.5">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-1 ring-inset ring-white/25">
              <i class="fa-solid fa-spinner fa-spin text-sm"></i>
          </span>
          <span class="text-sm font-bold">Бэлтгэж байна...</span>
      </span>`;
const SCALE_ACTIVE = ["border-stamp", "bg-stamp/10", "text-stamp"];
const SCALE_INACTIVE = ["border-ink-200", "bg-ink-100/50", "text-paper-muted"];
const SWATCH_ACTIVE = ["ring-stamp", "scale-110"];
const SWATCH_INACTIVE = ["ring-transparent", "scale-100"];
const DRAGOVER = ["border-stamp/50", "bg-stamp/5", "scale-[1.01]"];

const $ = (id) => document.getElementById(id);

const landingView = $("landingView");
const uploadZone = $("uploadZone");
const fileInput = $("fileInput");
const editor = $("editor");
const headerResetBtn = $("headerResetBtn");
const previewCanvas = $("previewCanvas");
const downloadBtn = $("downloadBtn");
const downloadBtnDesktop = $("downloadBtnDesktop");
const copyBtn = $("copyBtn");
const copyBtnDesktop = $("copyBtnDesktop");
const mobileActions = $("mobileActions");
const borderSlider = $("borderSlider");
const densitySlider = $("densitySlider");
const holeSlider = $("holeSlider");
const borderColorPicker = $("borderColorPicker");
const borderVal = $("borderVal");
const densityVal = $("densityVal");
const holeVal = $("holeVal");
const sizeInfo = $("sizeInfo");
const toast = $("toast");
const loadingOverlay = $("loadingOverlay");
const colorSwatches = $("colorSwatches");
const patternBtns = $("patternBtns");
const patternSection = $("patternSection");
const patternHint = $("patternHint");
const scaleBtns = $("scaleBtns");
const presetsEl = $("presets");
const cropModal = $("cropModal");
const cropImage = $("cropImage");
const cropBtn = $("cropBtn");
const cropApplyBtn = $("cropApplyBtn");
const cropCancelBtn = $("cropCancelBtn");
const cropCloseBtn = $("cropCloseBtn");
const cropRatioBtns = $("cropRatioBtns");
const textSection = $("textSection");
const textControls = $("textControls");
const textEnabled = $("textEnabled");
const textInput = $("textInput");
const textFont = $("textFont");
const textSizeSlider = $("textSizeSlider");
const textSizeVal = $("textSizeVal");
const textColorPicker = $("textColorPicker");
const textXSlider = $("textXSlider");
const textYSlider = $("textYSlider");
const textXVal = $("textXVal");
const textYVal = $("textYVal");
const textBold = $("textBold");
const textShadow = $("textShadow");
const textPosBtns = $("textPosBtns");
const mobileToolsTabs = $("mobileToolsTabs");
const toolsAside = $("toolsAside");
const textTabDot = $("textTabDot");
const textDragLayer = $("textDragLayer");
const textDragHandle = $("textDragHandle");
const previewProtect = $("previewProtect");

let sourceImage = null;
let activeMobileTool = "border";
let previewLayout = null;
let textDragPointerId = null;
let textDragPreviewFrame = null;
let originalImageSrc = null;
let pendingFileName = "";
let cropper = null;
let cropIsFirstLoad = false;
let toastTimer = null;
let previewFrame = null;
let lastOutputSize = { width: 0, height: 0 };
let exportScale = 1;
let borderColor = "#ffffff";
let bgPattern = "solid";
let textColor = "#ffffff";
const patternTileCache = new Map();

function getPreviewLimits() {
  const container = $("previewProtect")?.parentElement;
  const containerW = container?.clientWidth || window.innerWidth;
  const w = window.innerWidth;
  let maxH;
  if (w >= 1024) maxH = Math.min(520, window.innerHeight * 0.7);
  else if (w >= 768) maxH = Math.min(480, window.innerHeight * 0.55);
  else maxH = Math.min(360, window.innerHeight * 0.45);
  return { maxW: Math.max(100, containerW), maxH };
}

function applyCanvasDisplaySize(canvas, outW, outH, limits) {
  const scale = Math.min(1, limits.maxW / outW, limits.maxH / outH);
  canvas.style.width = Math.round(outW * scale) + "px";
  canvas.style.height = Math.round(outH * scale) + "px";
  canvas.style.maxWidth = "100%";
}

function toggleClasses(el, classes, on) {
  classes.forEach((c) => el.classList.toggle(c, on));
}

function setToggleActive(el, active, activeCls, inactiveCls) {
  toggleClasses(el, activeCls, active);
  toggleClasses(el, inactiveCls, !active);
}

function setEditorOpen(open) {
  const wasOpen = !editor.classList.contains("hidden");
  document.body.classList.toggle("editor-open", open);
  landingView.classList.toggle("hidden", open);
  editor.classList.toggle("hidden", !open);
  headerResetBtn.classList.toggle("hidden", !open);
  headerResetBtn.classList.toggle("flex", open);
  mobileActions.classList.toggle("hidden", !open);
  mobileActions.classList.toggle("flex", open);

  const mobileToast = "bottom-[calc(5.5rem+env(safe-area-inset-bottom))]";
  const defaultToast = "bottom-[max(1.5rem,env(safe-area-inset-bottom))]";
  toast.classList.remove(mobileToast, defaultToast);
  toast.classList.add(
    open && window.innerWidth < 1024 ? mobileToast : defaultToast,
  );

  if (open && !wasOpen) {
    activeMobileTool = "border";
    syncMobileToolPanels();
  }
}

function setMobileToolTab(tab, scroll = false) {
  activeMobileTool = tab;
  syncMobileToolPanels();
  if (scroll && toolsAside && window.innerWidth < 1024) {
    toolsAside.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function syncMobileToolPanels() {
  const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
  mobileToolsTabs?.querySelectorAll(".tool-tab").forEach((btn) => {
    const active = btn.dataset.toolTab === activeMobileTool;
    btn.setAttribute("aria-selected", active ? "true" : "false");
    if (isDesktop) {
      btn.classList.remove(
        "border-stamp",
        "bg-stamp/10",
        "text-stamp",
        "ring-1",
        "ring-stamp/25",
      );
    } else {
      setToggleActive(btn, active, TOOL_TAB_ACTIVE, TOOL_TAB_INACTIVE);
    }
  });
  document.querySelectorAll("[data-tool-panel]").forEach((panel) => {
    if (isDesktop) {
      panel.classList.remove("hidden");
    } else {
      panel.classList.toggle(
        "hidden",
        panel.dataset.toolPanel !== activeMobileTool,
      );
    }
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("translate-y-8", "opacity-0");
  toast.classList.add("translate-y-0", "opacity-100");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add("translate-y-8", "opacity-0");
    toast.classList.remove("translate-y-0", "opacity-100");
  }, 2800);
}

function setLoading(on) {
  loadingOverlay.classList.toggle("hidden", !on);
  loadingOverlay.classList.toggle("flex", on);
}

function getOptions() {
  return {
    borderPercent: Number(borderSlider.value) / 100,
    densityPercent: Number(densitySlider.value) / 100,
    holeScale: Number(holeSlider.value) / 100,
    borderColor,
    bgPattern,
    exportScale,
    textOverlay: {
      enabled: textEnabled.checked,
      content: textInput.value,
      fontFamily: textFont.value,
      fontSize: Number(textSizeSlider.value),
      color: textColor,
      x: Number(textXSlider.value),
      y: Number(textYSlider.value),
      bold: textBold.checked,
      shadow: textShadow.checked,
    },
  };
}

function saveSettings() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        border: borderSlider.value,
        density: densitySlider.value,
        hole: holeSlider.value,
        color: borderColor,
        pattern: bgPattern,
        scale: exportScale,
        textEnabled: textEnabled.checked,
        text: textInput.value,
        textFont: textFont.value,
        textSize: textSizeSlider.value,
        textColor,
        textX: textXSlider.value,
        textY: textYSlider.value,
        textBold: textBold.checked,
        textShadow: textShadow.checked,
      }),
    );
  } catch (_) {
    /* ignore */
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (s.border != null) borderSlider.value = s.border;
    if (s.density != null) densitySlider.value = s.density;
    if (s.hole != null) holeSlider.value = s.hole;
    if (s.color) setBorderColor(s.color, false);
    if (s.pattern) setBgPattern(s.pattern, false);
    if (s.scale) setExportScale(Number(s.scale), false);
    if (s.textEnabled != null) textEnabled.checked = s.textEnabled;
    if (s.text != null) textInput.value = s.text;
    if (s.textFont) textFont.value = s.textFont;
    if (s.textSize != null) textSizeSlider.value = s.textSize;
    if (s.textColor) setTextColor(s.textColor, false);
    if (s.textX != null) textXSlider.value = s.textX;
    if (s.textY != null) textYSlider.value = s.textY;
    if (s.textBold != null) textBold.checked = s.textBold;
    if (s.textShadow != null) textShadow.checked = s.textShadow;
    updateTextControlsState();
    updateTextLabels();
    syncTextPosHighlight();
  } catch (_) {
    /* ignore */
  }
}

function setTextColor(color, save = true) {
  textColor = color;
  textColorPicker.value = color;
  textSection.querySelectorAll(".text-color-swatch").forEach((el) => {
    const active = el.dataset.color.toLowerCase() === color.toLowerCase();
    setToggleActive(el, active, SWATCH_ACTIVE, SWATCH_INACTIVE);
  });
  if (save) {
    saveSettings();
    schedulePreview();
  }
}

function updateTextLabels() {
  textSizeVal.textContent = textSizeSlider.value + "%";
  textXVal.textContent = textXSlider.value + "%";
  textYVal.textContent = textYSlider.value + "%";
}

function isTextDragActive() {
  return textEnabled.checked && textInput.value.trim().length > 0;
}

function clampTextPercent(value) {
  return Math.round(Math.max(5, Math.min(95, value)));
}

function setTextPosition(x, y, { save = true, livePreview = true } = {}) {
  textXSlider.value = clampTextPercent(x);
  textYSlider.value = clampTextPercent(y);
  updateTextLabels();
  syncTextPosHighlight();
  updateTextDragUI();
  if (livePreview) schedulePreview();
  if (save) saveSettings();
}

function pointerToTextPercent(clientX, clientY) {
  const rect = textDragLayer.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return { x: Number(textXSlider.value), y: Number(textYSlider.value) };
  }
  return {
    x: ((clientX - rect.left) / rect.width) * 100,
    y: ((clientY - rect.top) / rect.height) * 100,
  };
}

function setTextPositionFromPointer(clientX, clientY, save = false) {
  const pos = pointerToTextPercent(clientX, clientY);
  textXSlider.value = clampTextPercent(pos.x);
  textYSlider.value = clampTextPercent(pos.y);
  updateTextLabels();
  syncTextPosHighlight();
  updateTextDragUI();
  if (save) saveSettings();
  cancelAnimationFrame(textDragPreviewFrame);
  textDragPreviewFrame = requestAnimationFrame(() => schedulePreview());
}

function updateTextDragUI() {
  const active = isTextDragActive() && previewLayout && sourceImage;
  textDragLayer.classList.toggle("hidden", !active);
  if (!active) return;

  const canvas = previewCanvas;
  if (!canvas.width || !canvas.height) return;

  const canvasRect = canvas.getBoundingClientRect();
  const protectRect = previewProtect.getBoundingClientRect();
  const scaleX = canvas.clientWidth / canvas.width;
  const scaleY = canvas.clientHeight / canvas.height;
  const imgLeft =
    canvasRect.left - protectRect.left + previewLayout.offsetX * scaleX;
  const imgTop =
    canvasRect.top - protectRect.top + previewLayout.offsetY * scaleY;
  const imgW = previewLayout.imgW * scaleX;
  const imgH = previewLayout.imgH * scaleY;

  textDragLayer.style.left = imgLeft + "px";
  textDragLayer.style.top = imgTop + "px";
  textDragLayer.style.width = imgW + "px";
  textDragLayer.style.height = imgH + "px";

  const handleX = imgW * (Number(textXSlider.value) / 100);
  const handleY = imgH * (Number(textYSlider.value) / 100);
  textDragHandle.style.left = handleX + "px";
  textDragHandle.style.top = handleY + "px";
}

function endTextDrag(e) {
  if (textDragPointerId === null || e.pointerId !== textDragPointerId) return;
  textDragLayer.releasePointerCapture(textDragPointerId);
  textDragPointerId = null;
  textDragLayer.classList.remove("dragging");
  saveSettings();
  schedulePreview();
}

function updateTextControlsState() {
  const on = textEnabled.checked;
  textControls.classList.toggle("opacity-40", !on);
  textControls.classList.toggle("pointer-events-none", !on);
  textTabDot?.classList.toggle("hidden", !on || !textInput.value.trim());
  updateTextDragUI();
}

function syncTextPosHighlight() {
  const y = Number(textYSlider.value);
  textPosBtns?.querySelectorAll(".text-pos-btn").forEach((btn) => {
    const active = Number(btn.dataset.y) === y;
    setToggleActive(btn, active, CROP_RATIO_ACTIVE, CROP_RATIO_INACTIVE);
  });
}

async function loadTextFontAndPreview() {
  const family = textFont.value;
  try {
    await document.fonts.load(`700 48px "${family}"`);
    await document.fonts.load(`400 48px "${family}"`);
  } catch (_) {
    /* ignore */
  }
  schedulePreview();
}

function setBorderColor(color, save = true) {
  borderColor = color;
  borderColorPicker.value = color;
  patternTileCache.clear();
  colorSwatches.querySelectorAll(".swatch").forEach((el) => {
    const active = el.dataset.color.toLowerCase() === color.toLowerCase();
    setToggleActive(el, active, SWATCH_ACTIVE, SWATCH_INACTIVE);
  });
  if (save) {
    saveSettings();
    schedulePreview();
  }
}

function setBgPattern(pattern, save = true) {
  bgPattern = pattern;
  patternBtns.querySelectorAll(".pattern-btn").forEach((el) => {
    const active = el.dataset.pattern === pattern;
    setToggleActive(el, active, PATTERN_ACTIVE, PATTERN_INACTIVE);
    const label = el.querySelector(".pattern-label");
    if (label)
      setToggleActive(
        label,
        active,
        PATTERN_LABEL_ACTIVE,
        PATTERN_LABEL_INACTIVE,
      );
  });
  if (save) {
    saveSettings();
    schedulePreview();
  }
}

function updatePatternSectionState() {
  const noBorder = Number(borderSlider.value) === 0;
  patternSection.classList.toggle("opacity-40", noBorder);
  patternSection.classList.toggle("pointer-events-none", noBorder);
  patternHint.classList.toggle("hidden", !noBorder);
}

function setExportScale(scale, save = true) {
  exportScale = scale;
  scaleBtns?.querySelectorAll(".scale-btn").forEach((el) => {
    setToggleActive(
      el,
      Number(el.dataset.scale) === scale,
      SCALE_ACTIVE,
      SCALE_INACTIVE,
    );
  });
  if (save) {
    saveSettings();
    schedulePreview();
  }
}

function setPresetActive(btn, active) {
  setToggleActive(btn, active, PRESET_ACTIVE, PRESET_INACTIVE);
  const label = btn.querySelector(".preset-label");
  const icon = btn.querySelector(".preset-icon");
  if (label)
    setToggleActive(label, active, PRESET_TEXT_ACTIVE, PRESET_TEXT_INACTIVE);
  if (icon)
    setToggleActive(icon, active, PRESET_ICON_ACTIVE, PRESET_ICON_INACTIVE);
}

function clearPresetActive() {
  presetsEl
    ?.querySelectorAll(".preset-btn")
    .forEach((b) => setPresetActive(b, false));
}

function applyPreset(name) {
  const p = PRESETS[name];
  if (!p) return;
  borderSlider.value = p.border;
  densitySlider.value = p.density;
  holeSlider.value = p.hole;
  setBorderColor(p.color, false);
  setBgPattern(p.pattern || "solid", false);
  setExportScale(p.scale, false);
  presetsEl?.querySelectorAll(".preset-btn").forEach((b) => {
    setPresetActive(b, b.dataset.preset === name);
  });
  saveSettings();
  schedulePreview();
}

function matchesPreset(name) {
  const p = PRESETS[name];
  return (
    Number(borderSlider.value) === p.border &&
    Number(densitySlider.value) === p.density &&
    Number(holeSlider.value) === p.hole &&
    borderColor.toLowerCase() === p.color.toLowerCase() &&
    bgPattern === (p.pattern || "solid") &&
    exportScale === p.scale
  );
}

function syncPresetHighlight() {
  if (!presetsEl) return;
  let matched = false;
  for (const name of Object.keys(PRESETS)) {
    if (matchesPreset(name)) {
      presetsEl.querySelectorAll(".preset-btn").forEach((b) => {
        setPresetActive(b, b.dataset.preset === name);
      });
      matched = true;
      break;
    }
  }
  if (!matched) clearPresetActive();
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((v) =>
        Math.max(0, Math.min(255, Math.round(v)))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

function shadeColor(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  const t = amount < 0 ? 0 : 255;
  const p = Math.abs(amount);
  return rgbToHex(r + (t - r) * p, g + (t - g) * p, b + (t - b) * p);
}

function createPatternTile(type, baseColor, size) {
  const key = type + "|" + baseColor + "|" + size;
  if (patternTileCache.has(key)) return patternTileCache.get(key);

  const tile = document.createElement("canvas");
  tile.width = size;
  tile.height = size;
  const t = tile.getContext("2d");
  const dark = shadeColor(baseColor, -0.14);
  const light = shadeColor(baseColor, 0.12);
  const mid = shadeColor(baseColor, -0.07);

  t.fillStyle = baseColor;
  t.fillRect(0, 0, size, size);

  switch (type) {
    case "dots":
      t.fillStyle = mid;
      for (let y = size / 4; y < size; y += size / 2) {
        for (let x = size / 4; x < size; x += size / 2) {
          t.beginPath();
          t.arc(x, y, size * 0.09, 0, Math.PI * 2);
          t.fill();
        }
      }
      break;
    case "stripes":
      t.strokeStyle = mid;
      t.lineWidth = Math.max(1, size * 0.1);
      for (let i = -size; i < size * 2; i += size * 0.35) {
        t.beginPath();
        t.moveTo(i, 0);
        t.lineTo(i + size, size);
        t.stroke();
      }
      break;
    case "grid":
      t.strokeStyle = mid;
      t.lineWidth = Math.max(1, size * 0.04);
      const step = size / 4;
      for (let i = 0; i <= size; i += step) {
        t.beginPath();
        t.moveTo(i, 0);
        t.lineTo(i, size);
        t.stroke();
        t.beginPath();
        t.moveTo(0, i);
        t.lineTo(size, i);
        t.stroke();
      }
      break;
    case "crosshatch":
      t.strokeStyle = mid;
      t.lineWidth = Math.max(1, size * 0.05);
      for (let i = -size; i < size * 2; i += size * 0.35) {
        t.beginPath();
        t.moveTo(i, 0);
        t.lineTo(i + size, size);
        t.stroke();
        t.beginPath();
        t.moveTo(i, size);
        t.lineTo(i + size, 0);
        t.stroke();
      }
      break;
    case "waves":
      t.strokeStyle = mid;
      t.lineWidth = Math.max(1, size * 0.07);
      for (let row = 0; row < 3; row++) {
        const baseY = ((row + 0.5) * size) / 3;
        t.beginPath();
        for (let x = 0; x <= size; x++) {
          const y = baseY + Math.sin((x / size) * Math.PI * 2) * size * 0.12;
          x === 0 ? t.moveTo(x, y) : t.lineTo(x, y);
        }
        t.stroke();
      }
      break;
    case "diamond":
      t.strokeStyle = mid;
      t.lineWidth = Math.max(1, size * 0.06);
      const h = size / 2;
      t.beginPath();
      t.moveTo(h, 0);
      t.lineTo(size, h);
      t.lineTo(h, size);
      t.lineTo(0, h);
      t.closePath();
      t.stroke();
      break;
    case "gradient": {
      const g = t.createLinearGradient(0, 0, size, size);
      g.addColorStop(0, light);
      g.addColorStop(0.5, baseColor);
      g.addColorStop(1, shadeColor(baseColor, -0.1));
      t.fillStyle = g;
      t.fillRect(0, 0, size, size);
      break;
    }
    case "linen":
      t.strokeStyle = shadeColor(baseColor, -0.08);
      t.lineWidth = Math.max(1, size * 0.03);
      for (let i = 0; i <= size; i += size / 5) {
        t.beginPath();
        t.moveTo(0, i);
        t.lineTo(size, i);
        t.stroke();
        t.beginPath();
        t.moveTo(i, 0);
        t.lineTo(i, size);
        t.stroke();
      }
      break;
    case "circles":
      t.strokeStyle = mid;
      t.lineWidth = Math.max(1, size * 0.05);
      for (let y = size / 4; y < size; y += size / 2) {
        for (let x = size / 4; x < size; x += size / 2) {
          t.beginPath();
          t.arc(x, y, size * 0.18, 0, Math.PI * 2);
          t.stroke();
        }
      }
      break;
  }

  patternTileCache.set(key, tile);
  return tile;
}

function fillBorderBackground(ctx, w, h, color, pattern) {
  if (!pattern || pattern === "solid") {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    return;
  }
  const tileSize = Math.max(16, Math.round(Math.max(w, h) * 0.028));
  const tile = createPatternTile(pattern, color, tileSize);
  ctx.fillStyle = ctx.createPattern(tile, "repeat");
  ctx.fillRect(0, 0, w, h);
}

function drawTextOverlay(ctx, offsetX, offsetY, imgW, imgH, textOpts) {
  if (!textOpts?.enabled) return;
  const content = (textOpts.content || "").trim();
  if (!content) return;

  const fontSize = Math.max(
    10,
    Math.min(imgW, imgH) * (textOpts.fontSize / 100),
  );
  const weight = textOpts.bold ? "700" : "400";
  const family = textOpts.fontFamily || "Outfit";
  const x = offsetX + imgW * (textOpts.x / 100);
  const y = offsetY + imgH * (textOpts.y / 100);

  ctx.save();
  ctx.font = `${weight} ${fontSize}px "${family}", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (textOpts.shadow) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    const off = Math.max(1, fontSize * 0.05);
    ctx.fillText(content, x + off, y + off);
  }

  ctx.fillStyle = textOpts.color || "#ffffff";
  ctx.fillText(content, x, y);
  ctx.restore();
}

function drawCanvasWatermark(ctx, w, h) {
  const fontSize = Math.max(10, Math.round(Math.max(w, h) * 0.03));
  const stepX = fontSize * 11;
  const stepY = fontSize * 8;

  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = "#141210";
  ctx.font = `600 ${fontSize}px Outfit, Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.translate(-w / 2, -h / 2);

  let row = 0;
  for (let y = -h; y < h * 2; y += stepY, row++) {
    const offsetX = (row % 2) * (stepX / 2);
    for (let x = -w + offsetX; x < w * 2; x += stepX) {
      ctx.fillText(WATERMARK_TEXT, x, y);
    }
  }
  ctx.restore();
}

function calculateDimensions(img, options) {
  const scale = options.exportScale || 1;
  const imgW = Math.round(img.width * scale);
  const imgH = Math.round(img.height * scale);
  const borderSize = Math.max(imgW, imgH) * options.borderPercent;
  const baseWidth = imgW + borderSize * 2;
  const baseHeight = imgH + borderSize * 2;
  const targetSpacing = Math.max(imgW, imgH) * options.densityPercent;
  const xCount = Math.max(2, Math.round(baseWidth / targetSpacing));
  const yCount = Math.max(2, Math.round(baseHeight / targetSpacing));
  return {
    width: Math.round(xCount * (baseWidth / xCount)),
    height: Math.round(yCount * (baseHeight / yCount)),
    imgW,
    imgH,
  };
}

function renderStamp(targetCanvas, img, options, maxDisplaySize) {
  const dims = calculateDimensions(img, options);
  const { width: outW, height: outH, imgW, imgH } = dims;

  const borderSize = Math.max(imgW, imgH) * options.borderPercent;
  const baseWidth = imgW + borderSize * 2;
  const baseHeight = imgH + borderSize * 2;
  const targetSpacing = Math.max(imgW, imgH) * options.densityPercent;
  const holeRadius = targetSpacing * 0.28 * (options.holeScale || 1);

  const xCount = Math.max(2, Math.round(baseWidth / targetSpacing));
  const yCount = Math.max(2, Math.round(baseHeight / targetSpacing));
  const xSpacing = outW / xCount;
  const ySpacing = outH / yCount;

  targetCanvas.width = outW;
  targetCanvas.height = outH;

  const ctx = targetCanvas.getContext("2d", { alpha: true });
  ctx.clearRect(0, 0, outW, outH);

  if (options.borderPercent > 0) {
    fillBorderBackground(
      ctx,
      outW,
      outH,
      options.borderColor || "#ffffff",
      options.bgPattern || "solid",
    );
  }

  const offsetX = (outW - imgW) / 2;
  const offsetY = (outH - imgH) / 2;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, offsetX, offsetY, imgW, imgH);

  if (options.textOverlay) {
    drawTextOverlay(ctx, offsetX, offsetY, imgW, imgH, options.textOverlay);
  }

  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "#000";

  for (let i = 0; i <= xCount; i++) {
    if (i === 0 || i === xCount) continue;
    const x = i * xSpacing;
    ctx.beginPath();
    ctx.arc(x, 0, holeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, outH, holeRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let j = 1; j < yCount; j++) {
    const y = j * ySpacing;
    ctx.beginPath();
    ctx.arc(0, y, holeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(outW, y, holeRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = "source-over";

  if (options.watermark) {
    drawCanvasWatermark(ctx, outW, outH);
  }

  if (maxDisplaySize) {
    const limits =
      typeof maxDisplaySize === "object"
        ? maxDisplaySize
        : { maxW: maxDisplaySize, maxH: maxDisplaySize };
    applyCanvasDisplaySize(targetCanvas, outW, outH, limits);
  } else {
    targetCanvas.style.width = "";
    targetCanvas.style.height = "";
    targetCanvas.style.maxWidth = "";
  }

  return { width: outW, height: outH, imgW, imgH, offsetX, offsetY };
}

function updateLabels() {
  borderVal.textContent =
    Number(borderSlider.value) === 0 ? "Байхгүй" : borderSlider.value + "%";
  densityVal.textContent = densitySlider.value + "%";
  holeVal.textContent = holeSlider.value + "%";
  updatePatternSectionState();
  if (sourceImage && lastOutputSize.width) {
    sizeInfo.textContent =
      sourceImage.width +
      "×" +
      sourceImage.height +
      " → " +
      lastOutputSize.width +
      "×" +
      lastOutputSize.height;
  }
}

function updatePreview() {
  if (!sourceImage) return;
  const opts = getOptions();
  const draw = () => {
    previewLayout = renderStamp(
      previewCanvas,
      sourceImage,
      { ...opts, exportScale: 1, watermark: true },
      getPreviewLimits(),
    );
    lastOutputSize = calculateDimensions(sourceImage, opts);
    updateLabels();
    syncPresetHighlight();
    updateTextDragUI();
  };
  const t = opts.textOverlay;
  if (t?.enabled && t.content?.trim()) {
    const weight = t.bold ? "700" : "400";
    document.fonts
      .load(`${weight} 48px "${t.fontFamily}"`)
      .then(draw)
      .catch(draw);
  } else {
    draw();
  }
}

function schedulePreview() {
  cancelAnimationFrame(previewFrame);
  previewFrame = requestAnimationFrame(updatePreview);
}

function onControlChange() {
  saveSettings();
  schedulePreview();
}

function destroyCropper() {
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
}

function setCropRatioActive(btn) {
  cropRatioBtns?.querySelectorAll(".crop-ratio-btn").forEach((el) => {
    const active = el === btn;
    setToggleActive(el, active, CROP_RATIO_ACTIVE, CROP_RATIO_INACTIVE);
  });
}

function initCropper() {
  destroyCropper();
  if (typeof Cropper === "undefined") {
    showToast("Crop хэрэгсэл ачаалагдаагүй байна");
    return;
  }
  cropper = new Cropper(cropImage, {
    viewMode: 1,
    dragMode: "move",
    aspectRatio: NaN,
    autoCropArea: 0.92,
    responsive: true,
    background: false,
    guides: true,
    center: true,
    highlight: true,
    movable: true,
    zoomable: true,
    scalable: false,
    rotatable: false,
  });
  const firstBtn = cropRatioBtns?.querySelector('[data-ratio="free"]');
  if (firstBtn) setCropRatioActive(firstBtn);
}

function openCropModal(src, isFirstLoad = false) {
  cropIsFirstLoad = isFirstLoad;
  cropModal.classList.remove("hidden");
  cropModal.classList.add("flex");
  document.body.style.overflow = "hidden";
  destroyCropper();
  cropImage.onload = () => initCropper();
  cropImage.src = src;
  if (cropImage.complete && cropImage.naturalWidth) initCropper();
}

function closeCropModal(cancelled = false) {
  destroyCropper();
  cropModal.classList.add("hidden");
  cropModal.classList.remove("flex");
  document.body.style.overflow = "";
  cropImage.removeAttribute("src");
  if (cancelled && cropIsFirstLoad) {
    fileInput.value = "";
  }
  cropIsFirstLoad = false;
}

function applyCrop() {
  if (!cropper) return;
  const canvas = cropper.getCroppedCanvas({
    maxWidth: 4096,
    maxHeight: 4096,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high",
  });
  if (!canvas) {
    showToast("Таслахад алдаа гарлаа");
    return;
  }
  setLoading(true);
  const wasFirstLoad = cropIsFirstLoad;
  const fileName = pendingFileName;
  const img = new Image();
  img.onload = () => {
    sourceImage = img;
    if (wasFirstLoad) {
      issueNewImageId();
      invalidatePaymentSession();
    } else {
      updateDownloadButtonLabels();
    }
    closeCropModal(false);
    setEditorOpen(true);
    setLoading(false);
    schedulePreview();
    showToast(
      wasFirstLoad && fileName ? fileName + " бэлэн" : "Зураг тасагдлаа",
    );
  };
  img.onerror = () => {
    setLoading(false);
    showToast("Зургийг уншиж чадсангүй");
  };
  img.src = canvas.toDataURL("image/png");
}

function loadImageFromSrc(src, name) {
  invalidatePaymentSession();
  originalImageSrc = src;
  pendingFileName = name || "";
  openCropModal(src, true);
}

function loadImage(file) {
  if (!file.type.startsWith("image/")) {
    showToast("Зөвхөн зураг файл оруулна уу");
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    showToast("Файл хэт том байна (15 MB хязгаар)");
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => loadImageFromSrc(e.target.result, file.name);
  reader.onerror = () => showToast("Файлыг уншиж чадсангүй");
  reader.readAsDataURL(file);
}

function reset() {
  sourceImage = null;
  originalImageSrc = null;
  currentImageId = null;
  invalidatePaymentSession();
  clearPaidImages();
  try {
    sessionStorage.removeItem(STAMP_IMAGE_ID_KEY);
  } catch (_) {
    /* ignore */
  }
  pendingFileName = "";
  destroyCropper();
  fileInput.value = "";
  textEnabled.checked = false;
  textInput.value = "";
  textFont.value = "Outfit";
  textSizeSlider.value = 8;
  textXSlider.value = 50;
  textYSlider.value = 86;
  textBold.checked = false;
  textShadow.checked = true;
  setTextColor("#ffffff", false);
  updateTextControlsState();
  updateTextLabels();
  syncTextPosHighlight();
  setEditorOpen(false);
  sizeInfo.textContent = "";
}

async function buildExportCanvasAsync() {
  const opts = getOptions();
  const t = opts.textOverlay;
  if (t?.enabled && t.content?.trim()) {
    const weight = t.bold ? "700" : "400";
    try {
      await document.fonts.load(`${weight} 48px "${t.fontFamily}"`);
    } catch (_) {
      /* ignore */
    }
  }
  const canvas = document.createElement("canvas");
  renderStamp(canvas, sourceImage, opts);
  return canvas;
}

function setDownloadLoading(loading) {
  downloadBtn.disabled = loading;
  downloadBtnDesktop.disabled = loading;
  if (loading) {
    downloadBtn.innerHTML = DL_LOADING_HTML_MOBILE;
    downloadBtnDesktop.innerHTML = DL_LOADING_HTML;
  } else {
    downloadBtn.innerHTML = DL_BTN_HTML_MOBILE;
    downloadBtnDesktop.innerHTML = DL_BTN_HTML;
  }
}

async function loadPaymentConfig() {
  try {
    const res = await fetch("/api/config", { cache: "no-store" });
    if (!res.ok) return false;
    const cfg = await res.json();
    paymentEnabled = Boolean(cfg.paymentEnabled);
    paymentAmountDisplay = cfg.amountDisplay ?? 0;
    paymentConfigReady = true;
    updateDownloadButtonLabels();
    return true;
  } catch (_) {
    return false;
  }
}

function isServedByAppServer() {
  return location.protocol === "http:" || location.protocol === "https:";
}

function updateDownloadButtonLabels() {
  if (!paymentEnabled) return;
  const paid = isImagePaid(getCurrentImageId());
  const label = paid
    ? "Татаж авах"
    : paymentAmountDisplay
      ? `Төлж татах · ${paymentAmountDisplay}₮`
      : "Төлж татах";
  for (const btn of [downloadBtn, downloadBtnDesktop]) {
    if (!btn) continue;
    const title = btn.querySelector(".font-bold.tracking-wide");
    if (title) title.textContent = label;
  }
}

function saveStampSessionForCheckout() {
  if (!sourceImage) return;
  saveSettings();
  try {
    const canvas = document.createElement("canvas");
    canvas.width = sourceImage.naturalWidth || sourceImage.width;
    canvas.height = sourceImage.naturalHeight || sourceImage.height;
    canvas.getContext("2d").drawImage(sourceImage, 0, 0);
    sessionStorage.setItem(PENDING_IMAGE_KEY, canvas.toDataURL("image/png"));
    if (originalImageSrc) {
      sessionStorage.setItem(PENDING_ORIGINAL_KEY, originalImageSrc);
    }
  } catch (_) {
    /* ignore quota errors */
  }
}

function restoreStampSessionIfNeeded() {
  return new Promise((resolve) => {
    if (sourceImage) {
      resolve();
      return;
    }
    const dataUrl = sessionStorage.getItem(PENDING_IMAGE_KEY);
    if (!dataUrl) {
      resolve();
      return;
    }
    const img = new Image();
    img.onload = () => {
      sourceImage = img;
      originalImageSrc =
        sessionStorage.getItem(PENDING_ORIGINAL_KEY) || dataUrl;
      setEditorOpen(true);
      schedulePreview();
      resolve();
    };
    img.onerror = () => resolve();
    img.src = dataUrl;
  });
}

function clearStampPendingSession() {
  sessionStorage.removeItem(PENDING_IMAGE_KEY);
  sessionStorage.removeItem(PENDING_ORIGINAL_KEY);
}

function getCurrentImageId() {
  return currentImageId || sessionStorage.getItem(STAMP_IMAGE_ID_KEY) || null;
}

function getPaidImageIds() {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(PAID_IMAGES_KEY) || "[]"));
  } catch (_) {
    return new Set();
  }
}

function markImagePaid(imageId) {
  if (!imageId) return;
  const set = getPaidImageIds();
  set.add(imageId);
  try {
    sessionStorage.setItem(PAID_IMAGES_KEY, JSON.stringify([...set]));
  } catch (_) {
    /* ignore */
  }
  updateDownloadButtonLabels();
}

function isImagePaid(imageId) {
  return Boolean(imageId && getPaidImageIds().has(imageId));
}

function clearPaidImages() {
  try {
    sessionStorage.removeItem(PAID_IMAGES_KEY);
  } catch (_) {
    /* ignore */
  }
}

function issueNewImageId() {
  currentImageId = crypto.randomUUID();
  try {
    sessionStorage.setItem(STAMP_IMAGE_ID_KEY, currentImageId);
  } catch (_) {
    /* ignore */
  }
  updateDownloadButtonLabels();
  return currentImageId;
}

function invalidatePaymentSession() {
  clearPaymentFromUrl();
  clearPendingOrderSession();
}

function getPendingOrder() {
  try {
    return JSON.parse(sessionStorage.getItem(PENDING_ORDER_KEY) || "null");
  } catch (_) {
    return null;
  }
}

function getPendingPaymentIntentId(orderId) {
  const fromUrl = new URLSearchParams(location.search).get("pi");
  if (fromUrl) return fromUrl;
  const pending = getPendingOrder();
  if (pending?.orderId === orderId && pending.paymentIntentId) {
    return pending.paymentIntentId;
  }
  return null;
}

function clearPendingOrderSession() {
  sessionStorage.removeItem(PENDING_ORDER_KEY);
}

function clearPaymentFromUrl() {
  if (location.search) {
    history.replaceState({}, "", location.pathname);
  }
}

async function claimOrderForDownload(orderId, paymentIntentId, imageId) {
  const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentIntentId: paymentIntentId || null,
      imageId: imageId || null,
    }),
  });
  const data = await res.json().catch(() => ({}));
  return {
    ok: res.ok && Boolean(data.allowed),
    error: data.error || null,
  };
}

function doDownload() {
  if (!sourceImage) return;
  setDownloadLoading(true);

  requestAnimationFrame(async () => {
    const canvas = await buildExportCanvasAsync();
    canvas.toBlob((blob) => {
      setDownloadLoading(false);
      if (!blob) {
        showToast("Татаж авахад алдаа гарлаа");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "stamp-" + Date.now() + ".png";
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      showToast("Амжилттай татагдлаа!");
    }, "image/png");
  });
}

async function startCheckout() {
  if (!sourceImage) return;
  setDownloadLoading(true);
  saveStampSessionForCheckout();

  await loadPaymentConfig();
  if (!paymentEnabled) {
    setDownloadLoading(false);
    showToast("API_KEY олдсонгүй");
    return;
  }

  try {
    const imageId = getCurrentImageId();
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setDownloadLoading(false);
      showToast(data.error || "Төлбөр эхлүүлж чадсангүй");
      return;
    }
    try {
      sessionStorage.setItem(
        PENDING_ORDER_KEY,
        JSON.stringify({
          orderId: data.orderId,
          paymentIntentId: data.paymentIntentId,
          imageId: imageId || data.imageId,
        }),
      );
    } catch (_) {
      /* ignore */
    }
    window.location.href = data.checkoutUrl;
  } catch (_) {
    setDownloadLoading(false);
    showToast("Серверт холбогдож чадсангүй");
  }
}

async function download() {
  if (!sourceImage) return;

  if (!paymentConfigReady) {
    const ok = await paymentConfigPromise;
    if (!ok && !paymentConfigReady) {
      if (!isServedByAppServer()) {
        showToast(
          "Серверээр нээнэ үү: http://localhost:3000/stamp_generator.html",
        );
      } else {
        showToast("Төлбөрийн тохиргоо ачааллаагүй");
      }
      return;
    }
  }

  if (!paymentEnabled) {
    doDownload();
    return;
  }

  const imageId = getCurrentImageId();
  if (isImagePaid(imageId)) {
    doDownload();
    return;
  }

  await startCheckout();
}

async function handleReturnFromPayment() {
  const params = new URLSearchParams(location.search);

  if (params.get("cancel") === "1") {
    showToast("Төлбөр цуцлагдлаа");
    clearPaymentFromUrl();
    return;
  }

  const orderId = params.get("order");
  if (!orderId) return;

  await restoreStampSessionIfNeeded();

  const currentId = getCurrentImageId();

  if (currentId && isImagePaid(currentId)) {
    clearPaymentFromUrl();
    clearPendingOrderSession();
    doDownload();
    return;
  }

  const pending = getPendingOrder();
  if (pending?.imageId && currentId && pending.imageId !== currentId) {
    invalidatePaymentSession();
    showToast("Шинэ зураг оруулсан — дахин төлнө");
    return;
  }

  showToast("Төлбөр шалгаж байна...");
  const piId = getPendingPaymentIntentId(orderId);
  const result = await claimOrderForDownload(orderId, piId, currentId);
  clearPaymentFromUrl();
  if (result.ok) {
    markImagePaid(currentId);
    clearStampPendingSession();
    clearPendingOrderSession();
    showToast("Төлбөр амжилттай! Татаж авна уу...");
    doDownload();
  } else {
    showToast(result.error || "Төлбөр баталгаажаагүй — дахин оролдоно уу");
  }
}

async function copyToClipboard() {
  if (!sourceImage) return;
  copyBtn.disabled = true;
  copyBtnDesktop.disabled = true;

  try {
    const canvas = await buildExportCanvasAsync();
    const blob = await new Promise((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej()), "image/png"),
    );
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    showToast("Clipboard-д хуулагдлаа!");
  } catch {
    showToast("Хуулах боломжгүй — татаж аваарай");
  } finally {
    copyBtn.disabled = false;
    copyBtnDesktop.disabled = false;
  }
}

uploadZone.addEventListener("click", () => fileInput.click());
uploadZone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fileInput.click();
  }
});

["dragenter", "dragover"].forEach((evt) => {
  uploadZone.addEventListener(evt, (e) => {
    e.preventDefault();
    toggleClasses(uploadZone, DRAGOVER, true);
  });
});

["dragleave", "drop"].forEach((evt) => {
  uploadZone.addEventListener(evt, (e) => {
    e.preventDefault();
    toggleClasses(uploadZone, DRAGOVER, false);
  });
});

uploadZone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  if (file) loadImage(file);
});

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) loadImage(file);
});

document.addEventListener("paste", (e) => {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith("image/")) {
      e.preventDefault();
      const file = item.getAsFile();
      if (file) loadImage(file);
      return;
    }
  }
});

borderSlider.addEventListener("input", onControlChange);
densitySlider.addEventListener("input", onControlChange);
holeSlider.addEventListener("input", onControlChange);

textEnabled.addEventListener("change", () => {
  updateTextControlsState();
  if (textEnabled.checked && window.innerWidth < 1024) setMobileToolTab("text");
  onControlChange();
});
textInput.addEventListener("input", () => {
  if (textInput.value.trim() && !textEnabled.checked) {
    textEnabled.checked = true;
    updateTextControlsState();
    if (window.innerWidth < 1024) setMobileToolTab("text");
  } else {
    updateTextControlsState();
  }
  onControlChange();
});
textFont.addEventListener("change", () => {
  saveSettings();
  loadTextFontAndPreview();
});
textSizeSlider.addEventListener("input", () => {
  updateTextLabels();
  onControlChange();
});
textXSlider.addEventListener("input", () => {
  updateTextLabels();
  syncTextPosHighlight();
  updateTextDragUI();
  onControlChange();
});
textYSlider.addEventListener("input", () => {
  updateTextLabels();
  syncTextPosHighlight();
  updateTextDragUI();
  onControlChange();
});
textBold.addEventListener("change", onControlChange);
textShadow.addEventListener("change", onControlChange);
textColorPicker.addEventListener("input", (e) => setTextColor(e.target.value));
textSection.addEventListener("click", (e) => {
  const swatch = e.target.closest(".text-color-swatch");
  if (!swatch) return;
  setTextColor(swatch.dataset.color);
});
textPosBtns?.addEventListener("click", (e) => {
  const btn = e.target.closest(".text-pos-btn");
  if (!btn) return;
  textYSlider.value = btn.dataset.y;
  updateTextLabels();
  syncTextPosHighlight();
  updateTextDragUI();
  onControlChange();
});

mobileToolsTabs?.addEventListener("click", (e) => {
  const btn = e.target.closest(".tool-tab");
  if (!btn) return;
  setMobileToolTab(btn.dataset.toolTab);
});

textDragLayer.addEventListener("pointerdown", (e) => {
  if (!isTextDragActive()) return;
  e.preventDefault();
  textDragPointerId = e.pointerId;
  textDragLayer.setPointerCapture(e.pointerId);
  textDragLayer.classList.add("dragging");
  setTextPositionFromPointer(e.clientX, e.clientY, false);
});
textDragLayer.addEventListener("pointermove", (e) => {
  if (textDragPointerId !== e.pointerId) return;
  setTextPositionFromPointer(e.clientX, e.clientY, false);
});
textDragLayer.addEventListener("pointerup", endTextDrag);
textDragLayer.addEventListener("pointercancel", endTextDrag);

borderColorPicker.addEventListener("input", (e) => {
  setBorderColor(e.target.value);
  clearPresetActive();
});

colorSwatches.addEventListener("click", (e) => {
  const swatch = e.target.closest(".swatch");
  if (!swatch) return;
  setBorderColor(swatch.dataset.color);
  syncPresetHighlight();
});

patternBtns.addEventListener("click", (e) => {
  const btn = e.target.closest(".pattern-btn");
  if (!btn || Number(borderSlider.value) === 0) return;
  setBgPattern(btn.dataset.pattern);
  clearPresetActive();
});

scaleBtns?.addEventListener("click", (e) => {
  const btn = e.target.closest(".scale-btn");
  if (!btn) return;
  setExportScale(Number(btn.dataset.scale));
});

presetsEl?.addEventListener("click", (e) => {
  const btn = e.target.closest(".preset-btn");
  if (!btn) return;
  applyPreset(btn.dataset.preset);
});

cropBtn.addEventListener("click", () => {
  if (!originalImageSrc) return;
  openCropModal(originalImageSrc, false);
});
cropApplyBtn.addEventListener("click", applyCrop);
cropCancelBtn.addEventListener("click", () => closeCropModal(true));
cropCloseBtn.addEventListener("click", () => closeCropModal(true));
cropModal.addEventListener("click", (e) => {
  if (e.target === cropModal) closeCropModal(true);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !cropModal.classList.contains("hidden"))
    closeCropModal(true);
});
cropRatioBtns?.addEventListener("click", (e) => {
  const btn = e.target.closest(".crop-ratio-btn");
  if (!btn || !cropper) return;
  setCropRatioActive(btn);
  const ratio = btn.dataset.ratio;
  cropper.setAspectRatio(ratio === "free" ? NaN : Number(ratio));
});

downloadBtn.addEventListener("click", download);
downloadBtnDesktop.addEventListener("click", download);
copyBtn.addEventListener("click", copyToClipboard);
copyBtnDesktop.addEventListener("click", copyToClipboard);
headerResetBtn.addEventListener("click", reset);

document.addEventListener("keydown", (e) => {
  if (!sourceImage) return;
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    download();
  }
});

try {
  const savedImageId = sessionStorage.getItem(STAMP_IMAGE_ID_KEY);
  if (savedImageId) currentImageId = savedImageId;
} catch (_) {
  /* ignore */
}

loadSettings();
updateLabels();
updateTextLabels();
syncTextPosHighlight();
syncMobileToolPanels();

updateDownloadButtonLabels();
paymentConfigPromise.then(handleReturnFromPayment);

window.addEventListener(
  "resize",
  () => {
    syncMobileToolPanels();
    if (sourceImage) schedulePreview();
  },
  { passive: true },
);

if (typeof ResizeObserver !== "undefined") {
  const previewWrap = $("previewProtect")?.parentElement;
  if (previewWrap) {
    new ResizeObserver(() => {
      if (sourceImage) schedulePreview();
    }).observe(previewWrap);
  }
}

(function () {
  const GUARD = ".protected-wrap, #previewProtect";

  function isProtected(target) {
    if (target?.closest?.("#textDragLayer")) return false;
    return target && target.closest && target.closest(GUARD);
  }

  document.addEventListener("contextmenu", (e) => {
    if (isProtected(e.target)) e.preventDefault();
  });

  document.addEventListener("dragstart", (e) => {
    if (isProtected(e.target)) e.preventDefault();
  });

  document.addEventListener("copy", (e) => {
    if (isProtected(e.target)) e.preventDefault();
  });

  document.addEventListener("cut", (e) => {
    if (isProtected(e.target)) e.preventDefault();
  });

  document.addEventListener("selectstart", (e) => {
    if (isProtected(e.target)) e.preventDefault();
  });
})();

let resizeTimer;
window.addEventListener(
  "resize",
  () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (sourceImage && !editor.classList.contains("hidden")) {
        setEditorOpen(true);
        schedulePreview();
      }
    }, 150);
  },
  { passive: true },
);
