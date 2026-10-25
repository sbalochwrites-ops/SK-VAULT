# Multi-File Selection, Bulk Action Bar & Sidebar Storage Doughnut Chart

Add interactive file selection with checkboxes across Grid and List views, a floating bottom bulk action bar with bulk download and deletion confirmation modal, and an interactive Recharts doughnut chart in the sidebar showing category storage breakdown.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and UX choices have been aligned based on user input:
> - **Bulk Deletion Flow**: When deleting multiple files, display a dedicated confirmation modal presenting the file count, list of targets, total storage freed, and permanent deletion warning before committing.
> - **Sidebar Storage Visualization**: Implement an interactive Recharts doughnut chart with a center metric (`GB used`) and custom tooltip displaying category name, exact data size, and percentage of vault consumed.
> - **Selection Controls**: Include global Select All / Deselect All toggles in both the top toolbar (adjacent to filter tabs) and the list table header for instant bulk selection.

---

## 1. Overview & Core Concept

- **What It Does**: Enhances the SK Vault cold-storage dashboard with batch item management. Users can toggle checkboxes on individual cards (Grid View) and rows (List View), select all items with one click, and perform bulk downloads or deletions via an animated floating bottom action bar. The sidebar storage section is upgraded with an interactive Recharts doughnut chart illustrating the exact distribution of storage across Photos, Videos, and Documents.
- **Target Audience**: Archival curators and users managing large quantities of preserved documents, media, and legal records who need rapid batch workflows and high-level capacity insights.
- **Key Value**: Eliminates one-by-one file actions, provides clear visibility into category capacity usage, and prevents accidental data loss through informative confirmation dialogues.

---

## 2. User Experience & Visual Design

### A. Selection State & Checkbox Controls
- **Grid View Checkbox**:
  - Discreet checkbox on top-left of each file card (next to the retention tag).
  - Subtle semi-transparent state on hover, solid violet/white check when selected (`ring-2 ring-violet-500 bg-violet-600 text-white`).
  - Selecting an item applies a subtle ring/border highlight to the entire card (`border-violet-500/50 bg-white/[0.08]`).
  - Clicking the checkbox toggles selection without opening the file detail modal.
- **List View Checkbox**:
  - Dedicated first column in the table with a master checkbox in the header.
  - Hover highlights row; selected rows display a tinted background (`bg-violet-500/[0.08] border-violet-500/20`).

### B. Floating Bottom Bulk Action Bar
- **Position & Animation**:
  - Fixed above the bottom viewport edge, sliding up smoothly (`translate-y-0 opacity-100 transition-all duration-300`).
  - Glassmorphic dark styling (`bg-[#0e1326]/95 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-2xl`).
- **Controls & Actions**:
  - **Counter Pill**: Displaying selected count (`X items selected`) and combined file size (`e.g., 2.1 GB`).
  - **Select All / Clear Buttons**: Quick toggle between selecting all filtered files and clearing current selection.
  - **Bulk Download Button**: Triggers sequential/batch simulated download of all selected assets with visual download feedback.
  - **Bulk Delete Button**: Prominent red/amber accent (`bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30`) that triggers the confirmation modal.

### C. Bulk Deletion Confirmation Modal
- **Warning & Summary Details**:
  - Danger header with Trash/Alert icon and title: *"Confirm Bulk Vault Deletion"*.
  - Warning explanation: *"This action permanently deletes X files from cold storage. This cannot be undone."*
  - Summary stats: Total files to remove and total storage freed (`MB / GB`).
  - Scrollable badge list of files slated for removal.
  - Action buttons: *"Cancel"* and *"Permanently Delete X Files"*.

### D. Recharts Category Doughnut Chart in Sidebar
- **Visual Composition**:
  - Responsive SVG container (`ResponsiveContainer` with 160px height).
  - `PieChart` with `Pie` component (`innerRadius={48}`, `outerRadius={68}`, `paddingAngle={4}`).
  - Category color palette matching vault retention and file themes:
    - **Videos**: Cyan / Blue (`#38bdf8`)
    - **Photos**: Violet / Purple (`#a78bfa`)
    - **Documents**: Emerald (`#34d399`)
    - **Free Capacity**: Subtle dark slate track (`#1e293b`)
  - Center label rendering current used GB and percentage.
  - Custom dark glass tooltip showing category name, volume (GB/MB), and share percentage.
  - Compact category legend below with real-time sizes.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Interactive Checkboxes vs. Modal Trigger Separation**
  - *Chosen Approach*: Clicking the checkbox strictly handles selection state via `e.stopPropagation()`. Clicking the card body or row text continues to open the detailed file preview modal.
  - *Why*: Allows rapid batch checking without unintentional modal interruptions.
- **Decision 2: Recharts Library Integration**
  - *Chosen Approach*: Install `recharts` for SVG-based vector rendering with built-in accessibility, hover tracking, and animations.
  - *Why*: Provides clean responsive resizing within the sticky 300px sidebar while maintaining full theme harmony.
- **Decision 3: Multi-File Download Handling**
  - *Chosen Approach*: Sequentially generate and dispatch blob downloads for each selected file with a brief staggered timeout, preventing browser download blocking while informing the user.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                               App State                                │
│  - files: VaultFile[]                                                  │
│  - selectedFileIds: Set<string>                                        │
│  - isDeleteModalOpen: boolean                                          │
│  - filteredFiles: VaultFile[]                                          │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
       ┌─────────────────────────┐      ┌─────────────────────────┐
       │   Sidebar (recharts)    │      │    Main Viewport        │
       │  - Category Breakdown   │      │  - Top Bar (Select All) │
       │  - Doughnut PieChart    │      │  - Grid / List Rows     │
       │  - Center GB label      │      │  - Row/Card Checkboxes  │
       │  - Category Legend      │      └────────────┬────────────┘
       └─────────────────────────┘                   │
                                                     ▼
                                        ┌─────────────────────────┐
                                        │ Floating Action Bar     │
                                        │  (shown when count > 0) │
                                        │  - Selected count & GB  │
                                        │  - Bulk Download        │
                                        │  - Bulk Delete Trigger  │
                                        └────────────┬────────────┘
                                                     │
                                                     ▼
                                        ┌─────────────────────────┐
                                        │ Delete Confirmation     │
                                        │  Modal (storage summary)│
                                        └─────────────────────────┘
```

### Data Model & State Mapping
- `selectedIds`: `Set<string>` tracking currently highlighted file IDs.
- `handleToggleSelect(id: string)`: Toggles individual file in selection set.
- `handleSelectAll()`: Selects all currently filtered and visible files; deselects if all are already selected.
- `handleBulkDownload()`: Creates mock preserved blobs for each selected file and triggers browser download.
- `handleBulkDelete()`: Permanently filters out all selected files from state, updates storage metrics dynamically, clears selection, and closes modal.
- `chartData`: Computed dynamically from `files` grouped by category plus remaining vault storage.

---

## 5. Verification Plan

1. Install `recharts` via `install_applet_package`.
2. Implement selection state and checkboxes in Grid and List views.
3. Build `FloatingActionBar` and `BulkDeleteModal` components.
4. Implement `StorageDoughnutChart` inside the sidebar with Recharts.
5. Verify build integrity with `compile_applet` and TypeScript linting with `lint_applet`.
6. Test selection interactions, bulk download, bulk delete, and chart hover tooltips in browser.
