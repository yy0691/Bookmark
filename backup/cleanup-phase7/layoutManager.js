import Sortable from '../../../node_modules/sortablejs/modular/sortable.esm.js';

let editMode = false;
let sortableInstances = [];

/**
 * Initializes the layout editor functionality.
 * @param {HTMLElement} editBtn - The button to toggle edit mode.
 * @param {HTMLElement} saveBtn - The button to save the layout.
 */
export function initLayoutEditor() {
    const editLayoutBtn = document.getElementById('edit-layout-btn');
    if (!editLayoutBtn) return;

    editLayoutBtn.addEventListener('click', toggleEditMode);

    // Load the saved layout on initial page load
    loadLayout();
}

/**
 * Toggles the layout edit mode on and off.
 */
function toggleEditMode() {
    editMode = !editMode;
    const body = document.body;
    const editLayoutBtn = document.getElementById('edit-layout-btn');
    const icon = editLayoutBtn.querySelector('i');

    body.classList.toggle('edit-mode', editMode);

    if (editMode) {
        icon.setAttribute('data-lucide', 'save');
        lucide.createIcons();
        editLayoutBtn.title = '保存布局';
        initSortable();
    } else {
        icon.setAttribute('data-lucide', 'edit');
        lucide.createIcons();
        editLayoutBtn.title = '编辑布局';
        destroySortable();
        saveLayout();
    }
}

/**
 * Initializes SortableJS on widget containers.
 */
function initSortable() {
    const containers = document.querySelectorAll('.left-sidebar, .right-sidebar');
    containers.forEach(container => {
        const sortable = new Sortable(container, {
            group: 'widgets', // Allow dragging between containers with the same group name
            animation: 150,
            handle: '.widget-drag-handle', // Use a handle to drag
            ghostClass: 'sortable-ghost', // Class for the drop placeholder
            forceFallback: true,
            onEnd: () => {
                // The save happens when exiting edit mode
            }
        });
        sortableInstances.push(sortable);
    });
}

/**
 * Destroys all SortableJS instances.
 */
function destroySortable() {
    sortableInstances.forEach(instance => instance.destroy());
    sortableInstances = [];
}

/**
 * Saves the current layout of widgets to localStorage.
 */
function saveLayout() {
    const layout = {
        left: [],
        right: []
    };
    document.querySelectorAll('.left-sidebar .widget').forEach(widget => {
        layout.left.push(widget.id);
    });
    document.querySelectorAll('.right-sidebar .widget').forEach(widget => {
        layout.right.push(widget.id);
    });

    localStorage.setItem('dashboardLayout', JSON.stringify(layout));
    console.log('Layout saved!');
}

/**
 * Loads the widget layout from localStorage and applies it.
 */
function loadLayout() {
    const savedLayout = localStorage.getItem('dashboardLayout');
    if (!savedLayout) return;

    const layout = JSON.parse(savedLayout);
    const leftSidebar = document.querySelector('.left-sidebar');
    const rightSidebar = document.querySelector('.right-sidebar');
    const allWidgets = new Map();

    // Create a map of all widgets for easy lookup
    document.querySelectorAll('.widget').forEach(widget => {
        allWidgets.set(widget.id, widget);
    });

    // Clear current content and append widgets in the saved order
    leftSidebar.innerHTML = '';
    rightSidebar.innerHTML = '';

    layout.left.forEach(widgetId => {
        if (allWidgets.has(widgetId)) {
            leftSidebar.appendChild(allWidgets.get(widgetId));
        }
    });

    layout.right.forEach(widgetId => {
        if (allWidgets.has(widgetId)) {
            rightSidebar.appendChild(allWidgets.get(widgetId));
        }
    });
    console.log('Layout loaded!');
}
