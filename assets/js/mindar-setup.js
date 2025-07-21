// assets/js/mindar-setup.js
// NOTE: This file must be loaded AFTER MindAR and Three.js scripts in your HTML.
// Do NOT use ES6 import/export here. Use only global variables (window.MINDAR, window.THREE).
// If you see 'Cannot use import statement outside a module', check your script tags and do not use import/export in this file.
// Also, verify the path to './assets/models/targets.mind' and your audio files are correct and exist.

// MindAR Configuration and Setup
function initializeMindAR(container) {
    console.log('MindAR: Initializing MindAR...');
    
    try {
        // Check if MindAR library is loaded onto the window object
        if (typeof window.MINDAR === 'undefined' || typeof window.THREE === 'undefined') {
            let missing = [];
            if (typeof window.MINDAR === 'undefined') missing.push('MindAR');
            if (typeof window.THREE === 'undefined') missing.push('Three.js');
            throw new Error((missing.length ? missing.join(' and ') : 'MindAR or Three.js') + ' library not loaded. Check script tags in HTML and their order.');
        }
        
        // Initialize MindAR with your target images
        const mindarThree = new window.MINDAR.IMAGE.MindARThree({
            container: container, // This is the HTML element where MindAR will render
            imageTargetSrc: './assets/models/targets.mind', // **CRITICAL: VERIFY THIS PATH**
            maxTrack: 1, // Number of targets to track simultaneously
            filterMinCF: 0.0001,
            filterBeta: 0.001,
            warmupTolerance: 5,
            missTolerance: 5,
            // You can add more MindAR options here if needed, e.g., uiScanning, uiError
        });

        const { renderer, scene, camera } = mindarThree; // Destructure MindAR's core components
        
        // Add lighting to the scene so 3D objects are visible
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);
        
        // Create an anchor for your first target (index 0)
        const anchor = mindarThree.addAnchor(0);
        
        // --- TEST OBJECT: A simple rotating green cube ---
        // This is to quickly check if the 3D scene is rendering.
        // If you see the camera feed but not this cube, then your 3D model loading is the issue.
        // If you see neither, then the camera/renderer setup is still the issue.
        const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1); // Small cube
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x00ff00, // Green color
            transparent: true,
            opacity: 0.8
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(0, 0, 0.05); // Position slightly in front of the target
        anchor.group.add(cube);
        // --- END TEST OBJECT ---
        
        // Animation loop function
        let animationFrameId = null; // To store the requestAnimationFrame ID
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate); // Keep looping
            
            // Rotate the cube for a visual demo
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.02;
            
            renderer.render(scene, camera); // Render the scene
        };
        
        // This object is returned to the main script (index.html)
        // It provides control methods for the MindAR instance.
        return {
            mindarThree: mindarThree, // The actual MindAR instance
            
            // Method to start the MindAR experience (including camera and rendering)
            start: async () => { 
                try {
                    console.log('MindAR: Starting MindAR engine...');
                    await mindarThree.start(); // Await the MindAR start process
                    animate(); // Start the Three.js animation loop only after MindAR has started
                    console.log('MindAR: Engine started successfully, animation running.');
                    return mindarThree; // Return the mindarThree instance itself on success
                } catch (error) {
                    console.error('MindAR: Failed to start MindAR engine:', error);
                    // MindAR might provide more specific error details in `error` object
                    throw error; // Re-throw the error to be caught in index.html's launchMindAR
                }
            },
            
            // Method to stop the MindAR experience
            stop: () => {
                console.log('MindAR: Stopping MindAR engine...');
                mindarThree.stop(); // Stop the MindAR engine
                // Stop the Three.js animation loop
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
                // MindAR should clean up its own video and canvas elements, but you can add
                // explicit cleanup here if you notice orphaned elements:
                // if (container) {
                //     const videoEl = container.querySelector('video');
                //     const canvasEl = container.querySelector('canvas');
                //     if (videoEl) videoEl.remove();
                //     if (canvasEl) canvasEl.remove();
                // }
            },
            
            // Example function to add 3D models dynamically
            addModel: (modelUrl, anchorIndex = 0) => {
                const loader = new THREE.GLTFLoader();
                loader.load(modelUrl, (gltf) => {
                    const model = gltf.scene;
                    const modelAnchor = mindarThree.addAnchor(anchorIndex); // Use a new anchor if different target
                    modelAnchor.group.add(model);
                    console.log(`MindAR: Added model ${modelUrl} to anchor ${anchorIndex}.`);
                }, undefined, (error) => {
                    console.error('MindAR: Error loading GLTF model:', error);
                });
            }
        };
        
    } catch (error) {
        console.error('MindAR: Error during MindAR initialization setup:', error);
        throw error; // Propagate critical initialization errors
    }
}

// --- Audio Guide Class (Your existing code, unchanged) ---
class AudioGuide {
    constructor() {
        this.currentTrack = null;
        this.isPlaying = false;
        this.tracks = {};
        this.volume = 0.7;
    }
    
    addTrack(id, audioUrl, title, description) {
        this.tracks[id] = {
            url: audioUrl,
            title: title,
            description: description,
            audio: new Audio(audioUrl)
        };
        this.tracks[id].audio.volume = this.volume;
    }
    
    play(trackId) {
        if (this.tracks[trackId]) {
            this.stop(); // Stop current track
            this.currentTrack = this.tracks[trackId];
            this.currentTrack.audio.play();
            this.isPlaying = true;
            
            this.currentTrack.audio.onended = () => {
                this.isPlaying = false;
                this.currentTrack = null;
            };
        }
    }
    
    stop() {
        if (this.currentTrack) {
            this.currentTrack.audio.pause();
            this.currentTrack.audio.currentTime = 0;
            this.isPlaying = false;
            this.currentTrack = null;
        }
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        Object.values(this.tracks).forEach(track => {
            track.audio.volume = this.volume;
        });
    }
}

// Initialize audio guide
const audioGuide = new AudioGuide();

// Example audio tracks (replace with your audio files)
audioGuide.addTrack('exhibit1', './assets/audio/exhibit1.mp3', 'Ancient Artifact', 'Discover the history behind this ancient piece...');
audioGuide.addTrack('exhibit2', './assets/audio/exhibit2.mp3', 'Medieval Painting', 'Learn about the techniques used in this masterpiece...');

// Export for use in main script (index.html)
window.AudioGuide = AudioGuide;
window.audioGuide = audioGuide;
