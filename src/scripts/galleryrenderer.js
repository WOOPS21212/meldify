// TODO: Write galleryRenderer.js
// It should export a `render(groups)` function that displays grouped camera footage
export function render(groups) {
    const galleryContainer = document.getElementById('galleryContainer');
    galleryContainer.innerHTML = ''; // Clear previous content

    groups.forEach(group => {
        // Calculate total duration in seconds
        const totalDuration = group.clips.reduce((sum, clip) => sum + clip.duration, 0);
        
        // Convert to mm:ss format
        const minutes = Math.floor(totalDuration / 60);
        const seconds = Math.floor(totalDuration % 60);
        const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Create group container
        const groupElement = document.createElement('div');
        groupElement.className = 'camera-group';
        
        // Create group header with metadata
        const header = document.createElement('div');
        header.className = 'group-header';
        header.innerHTML = `
            <h3>${group.name}</h3>
            <span class="meta">${group.clips.length} clips • ${formattedDuration}</span>
            <button class="export-btn" data-group="${group.name}">Export Group</button>
        `;
        
        // Create clips container
        const clipsContainer = document.createElement('div');
        clipsContainer.className = 'clips-container';
        
        // Add each clip to the container
        group.clips.forEach(clip => {
            const clipElement = document.createElement('div');
            clipElement.className = 'clip';
            clipElement.innerHTML = `
                <video src="${clip.path}" controls></video>
                <div class="clip-info">
                    <span>${clip.name}</span>
                    <button class="export-btn" data-clip="${clip.path}">Export</button>
                </div>
            `;
            clipsContainer.appendChild(clipElement);
        });

        // Assemble the group element
        groupElement.appendChild(header);
        groupElement.appendChild(clipsContainer);
        galleryContainer.appendChild(groupElement);
    });
}
