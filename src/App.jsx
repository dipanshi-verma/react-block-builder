import React, { useState, useEffect, useRef } from 'react';
import {
  BlockEditorProvider,
  BlockList,
  BlockTools,
  WritingFlow,
  ObserveTyping,
  Inserter,
  BlockEditorKeyboardShortcuts,
  BlockInspector,
} from '@wordpress/block-editor';
// -d 
import { __experimentalListView as ListView } from '@wordpress/block-editor';
import { serialize, parse, createBlock } from '@wordpress/blocks';
import { SlotFillProvider, Popover } from '@wordpress/components';
import { ShortcutProvider } from '@wordpress/keyboard-shortcuts';

import { blockTemplates } from './data/blockTemplates';
import { savePage, loadPage, listPages } from './data/api';
import logoimage from './images/editor-icon.png';
import {
  FaColumns, FaEye, FaEdit, FaTrash, FaSave, FaGlobe, FaPlus, FaRegSquare
} from "react-icons/fa";

import { LuUndo, LuRedo } from "react-icons/lu";

// -d adding the styles
import '@wordpress/block-editor/build-style/style.css';
import '@wordpress/components/build-style/style.css';
import '@wordpress/block-library/build-style/style.css';
import '@wordpress/block-library/build-style/theme.css';
import '@wordpress/block-library/build-module';
// import '@wordpress/format-library';

// Database functions are now in src/data/api.js — swap the bodies there
// to point at any real backend (Express, WordPress REST API, Supabase, etc.)

const EDITOR_SETTINGS = {
  hasFixedToolbar: false,
  hasInlineToolbar: true,
  focusMode: false,
  isRTL: false,
  keepCaretInsideBlock: false,
  // bodyPlaceholder: 'Click + to add your first block...',
  supportsLayout: true,
  __experimentalFeatures: {
    color: {
      text: true,
      background: true,
      customColor: true,
    },
    typography: {
      fontSize: true,
      lineHeight: true,
    },
  },
  __experimentalBlockPatterns: [],
  __experimentalBlockPatternCategories: [],
  imageEditing: false,
  mediaUpload: null,
  allowedBlockTypes: true,
  // ✅ enables drag and drop
  __experimentalDragAndDrop: true,
  styles: [
    {
      css: `
        .wp-block { max-width: 100%; }
        body { font-family: "Montserrat", sans-serif; }
      `,
      isGlobalStyles: true,
    }
  ],
};

function App({ onViewSite }) {
  const DEFAULT_PAGE_ID = 'home';
  const [blocks, setBlocks] = useState([]);
  const [output, setOutput] = useState(null);
  const [preview, setPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pageTitle, setPageTitle] = useState('Home');
  const [pageId] = useState(DEFAULT_PAGE_ID);

  // Step 20 — Undo / Redo
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const historyRef = useRef({ past: [], future: [] });
  const blocksRef = useRef([]);
  // -d list view 
  const [listViewOpen, setListViewOpen] = useState(false);

  // Step 19 — Template picker
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [templateReplaceMode, setTemplateReplaceMode] = useState(false);

  // Keep blocksRef in sync so history closures always snapshot the latest state
  useEffect(() => { blocksRef.current = blocks; }, [blocks]);

  useEffect(() => {
    loadBlocks();
  }, []);
  async function loadBlocks() {
    try {
      // loadPage() is defined in src/data/api.js
      // Swap the body there to use fetch() against your real backend
      const page = await loadPage(pageId);
      if (page?.json) {
        setBlocks(JSON.parse(page.json));
        if (page.title) setPageTitle(page.title);
      } else if (page?.html) {
        setBlocks(parse(page.html));
      }
    } catch (e) {
      console.error('Failed to load blocks:', e);
    }
  }

  async function handleSave() {
    try {
      const html = serialize(blocks);
      const json = JSON.stringify(blocks, null, 2);

      // savePage() is defined in src/data/api.js
      // Swap the body there to use fetch() against your real backend
      await savePage(pageId, pageTitle, html, json);

      setOutput({ html, json });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Failed to save blocks:', e);
    }
  }

  async function handleClear() {
    try {
      setBlocks([]);
      setOutput(null);
      // Also persist the empty state so the viewer shows nothing
      await savePage(pageId, pageTitle, '', '[]');
    } catch (e) {
      console.error('Failed to clear blocks:', e);
    }
  }

  // ── Undo / Redo ────────────────────────────────────────────────────────────
  function pushHistory(snapshot) {
    historyRef.current.past.push(snapshot);
    historyRef.current.future = [];
    setCanUndo(true);
    setCanRedo(false);
  }

  function handleUndo() {
    if (!historyRef.current.past.length) return;
    historyRef.current.future.unshift(blocksRef.current);
    const prev = historyRef.current.past.pop();
    setBlocks(prev);
    setCanUndo(historyRef.current.past.length > 0);
    setCanRedo(true);
  }

  function handleRedo() {
    if (!historyRef.current.future.length) return;
    historyRef.current.past.push(blocksRef.current);
    const next = historyRef.current.future.shift();
    setBlocks(next);
    setCanUndo(true);
    setCanRedo(historyRef.current.future.length > 0);
  }

  // ── Templates ────────────────────────────────────────────────────────────────
  function makeBlock({ name, attributes = {}, innerBlocks = [] }) {
    return createBlock(name, attributes, innerBlocks.map(makeBlock));
  }

  function applyTemplate(tpl) {
    const newBlocks = tpl.blocks.map(makeBlock);
    const result = templateReplaceMode ? newBlocks : [...blocksRef.current, ...newBlocks];
    pushHistory(blocksRef.current);
    setBlocks(result);
    setTemplatePickerOpen(false);
  }

  return (
    <div className="editor-wrapper">

      {/* ---- HEADER ---- */}
      <div className="editor-header">
        <div className="fp-editor-title-row">
          <a href="/">
            <div className="logo-image">
              <img src={logoimage} alt="Logo" />
            </div>
          </a>
        </div>
        <div className="header-center">
          <input
            className="page-title-input"
            value={pageTitle}
            onChange={e => setPageTitle(e.target.value)}
            placeholder="Page title…"
          />
        </div>
        <div className="header-actions">
          <button className="sidebar-toggle-btn header-btn-wrap" onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <FaColumns />
            {sidebarOpen ? '' : ''}
          </button>

          <button className="preview-btn header-btn-wrap" onClick={() => setPreview(!preview)}
          >
            {preview ?
              <FaEdit /> :
              <FaEye />}
            {preview ? '' : ''}
          </button>

          <button className="clear-btn header-btn-wrap" onClick={handleClear}>
            <FaTrash />

          </button>

          <button className="save-btn header-btn-wrap" onClick={handleSave}>
            <FaSave />
            {saved ? '' : ''}
          </button>

          <button className="view-site-btn" onClick={onViewSite} title="View the saved page as a visitor would see it">
            <FaGlobe />
            View Site
          </button>
        </div>
      </div>

      {preview ? (
        /* ---- PREVIEW MODE ---- */
        <div className="preview-container">
          <div className="preview-label">Frontend Preview</div>
          <div
            className="preview-content"
            dangerouslySetInnerHTML={{ __html: serialize(blocks) }}
          />
        </div>
      ) : (
        /* ---- EDITOR MODE ---- */
        <SlotFillProvider>
          <ShortcutProvider>
            <BlockEditorProvider
              value={blocks}
              onInput={setBlocks}
              onChange={(newBlocks) => {
                if (newBlocks !== blocksRef.current) {
                  pushHistory(blocksRef.current);
                }
                setBlocks(newBlocks);
              }}
              settings={EDITOR_SETTINGS}
            >
              <BlockEditorKeyboardShortcuts.Register />

              <div className={`editor-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>

                {/* ---- MAIN EDITOR ---- */}
                <div className="editor-main">

                  {/* ✅ Fixed top toolbar with + inserter, Templates, Undo/Redo */}
                  <div className="editor-toolbar">
                    <Inserter
                      rootClientId={undefined}
                      clientId={undefined}
                      isAppender
                      renderToggle={({ onToggle }) => (
                        <button
                          className="toolbar-inserter-btn"
                          onClick={onToggle}
                          title="Add block"
                        >
                          <FaPlus />
                        </button>
                      )}
                    />

                    <div className="toolbar-divider" />

                    {/* Step 19 — Templates button */}
                    <button
                      className={`toolbar-btn${templatePickerOpen ? ' active' : ''}`}
                      onClick={() => setTemplatePickerOpen(o => !o)}
                      title="Insert a pre-built block template"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="#0F172A" strokeWidth="2" />

                        {/* Top full width */}
                        <rect x="6" y="6" width="12" height="3" stroke="#0F172A" strokeWidth="2" />

                        {/* Bottom split */}
                        <rect x="6" y="11" width="5" height="7" stroke="#0F172A" strokeWidth="2" />
                        <rect x="13" y="11" width="5" height="7" stroke="#0F172A" strokeWidth="2" />
                      </svg>
                    </button>

                    <div className="toolbar-divider" />

                    {/* Step 20 — Undo / Redo */}
                    <button
                      className="toolbar-btn"
                      onClick={handleUndo}
                      disabled={!canUndo}
                      title=""
                    >
                      <LuUndo />
                    </button>
                    <button
                      className="toolbar-btn"
                      onClick={handleRedo}
                      disabled={!canRedo}
                      title="Redo (Ctrl+Y)"
                    >
                      <LuRedo />
                    </button>
                    <button
                      className={`toolbar-btn ${listViewOpen ? 'active' : ''}`}
                      onClick={() => setListViewOpen(prev => !prev)}
                      title="List View"
                    >
                      ☰
                    </button>
                  </div>


                  {/* ── Template Picker Panel (Step 19) ── */}
                  {templatePickerOpen && (
                    <div className="template-picker">
                      <div className="template-picker-header">
                        <span className="template-picker-title">Choose a Template</span>
                        <label className="template-replace-toggle">
                          <input
                            type="checkbox"
                            checked={templateReplaceMode}
                            onChange={e => setTemplateReplaceMode(e.target.checked)}
                          />
                          Replace existing content
                        </label>
                        <button
                          className="template-picker-close"
                          onClick={() => setTemplatePickerOpen(false)}
                          title="Close"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="template-picker-grid">
                        {blockTemplates.map(tpl => (
                          <button
                            key={tpl.slug}
                            className="template-card"
                            onClick={() => applyTemplate(tpl)}
                            title={tpl.description}
                          >
                            <span className="template-card-icon">{tpl.icon}</span>
                            <span className="template-card-label">{tpl.label}</span>
                            <span className="template-card-meta">{tpl.category}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ✅ BlockTools wraps everything for drag and toolbar */}
                  <div className="editor-split-layout">

                    {/* LEFT: List View */}
                    {listViewOpen && (
                      <div className="editor-list-view">
                        <ListView />
                      </div>
                    )}

                    {/* RIGHT: Editor */}
                    <div className="editor-content">

                      <BlockTools>
                        <div className="editor-canvas-wrapper">
                          <WritingFlow>
                            <ObserveTyping>
                              <div className="editor-canvas">

                                {/* ✅ Empty state */}
                                {blocks.length === 0 && (
                                  <div className="empty-editor-hint">
                                    <Inserter
                                      rootClientId={undefined}
                                      clientId={undefined}
                                      isAppender
                                      renderToggle={({ onToggle }) => (
                                        <button
                                          className="empty-inserter-btn"
                                          onClick={onToggle}
                                        >
                                          <FaPlus />
                                          <span>Click to add your first block</span>
                                        </button>
                                      )}
                                    />
                                  </div>
                                )}

                                {/* ✅ Main block list — drag and drop built in */}
                                <BlockList />

                                {/* ✅ Bottom inline + inserter */}
                                {blocks.length > 0 && (
                                  <div className="bottom-inserter">
                                    <Inserter
                                      rootClientId={undefined}
                                      clientId={undefined}
                                      isAppender
                                      renderToggle={({ onToggle }) => (
                                        <button
                                          className="inline-inserter-btn"
                                          onClick={onToggle}
                                          title="Add block below"
                                        >
                                          +
                                        </button>
                                      )}
                                    />
                                  </div>
                                )}

                              </div>
                            </ObserveTyping>
                          </WritingFlow>
                        </div>
                      </BlockTools>

                    </div>
                  </div>
                </div>
                {/* ---- SIDEBAR ---- */}
                {sidebarOpen && (
                  <div className="editor-sidebar">
                    <div className="sidebar-header">
                      <span>Block Settings</span>
                    </div>
                    <div className="sidebar-body">
                      <BlockInspector />
                    </div>
                  </div>
                )}
              </div>
              <Popover.Slot />

            </BlockEditorProvider>
          </ShortcutProvider>
        </SlotFillProvider>
      )}

      {/* ---- OUTPUT PANEL ---- */}
      {output && !preview && (
        <div className="output-panel">
          <div className="output-section">
            <div className="output-header">
              <span>HTML Output</span>
              <button
                className="copy-btn"
                onClick={() => navigator.clipboard.writeText(output.html)}
              >
                Copy
              </button>
            </div>
            <pre className="output-code">{output.html}</pre>
          </div>

          <div className="output-section">
            <div className="output-header">
              <span>JSON Output</span>
              <button
                className="copy-btn"
                onClick={() => navigator.clipboard.writeText(output.json)}
              >
                Copy
              </button>
            </div>
            <pre className="output-code">{output.json}</pre>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;