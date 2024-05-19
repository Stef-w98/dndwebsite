// uiHelpers.js
export function openSidebar(content) {
    const sidebarContent = document.getElementById('sidebar-content');
    sidebarContent.innerHTML = content;
    document.getElementById('sidebar').classList.add('open');
}

export function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
}

export function openSidebarWithRegionInfo(region) {
    const sidebarContent = document.getElementById('sidebar-content');
    sidebarContent.innerHTML = `<h2>${region.regionname}</h2><p>${region.regioninfo}</p>`;
    // Include other information from the region object as needed
    document.getElementById('sidebar').classList.add('open');
}
