// MindAR Configuration and Setup
function initializeMindAR(container) {
    console.log('Initializing MindAR...');
    
    try {
        // Check if MindAR is loaded
        if (typeof window.MINDAR === 'undefined') {
            throw new Error('MindAR library not loaded');
        }
        
        // Initialize MindAR with your target images
        const mindarThree = new window.MINDAR.IMAGE.MindARThree({
            container: container,
            imageTargetSrc: './assets/models/targets.mind', // Update this path
            maxTrack: 1, // Number of targets to track simultaneously
            filterMinCF: 0.0001,
            filterBeta: 0.001,
            warmupTolerance: 5,
            missTolerance: 5
        });

        const { renderer, scene, camera } = mindarThree;
        
        // Add lighting to the scene
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);
        
        // Create anchor for target 0
        const anchor = mindarThree.addAnchor(0);
        
        // Add a simple 3D object (replace with your 3D models)
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(0, 0, 0.5);
        cube.scale.set(0.5, 0.5, 0.5);
        anchor.group.add(cube);
        
        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            
            // Rotate the cube for demo
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.02;
            
            renderer.render(scene, camera);
        };
        
        // Start MindAR
        const start = async () => {
            try {
                await mindarThree.start();
                animate();
                console.log('MindAR started successfully');
            } catch (error) {
                console.error('Failed to start MindAR:', error);
                throw error;
            }
        };
        
        start();
        
        // Return MindAR instance for external control
        return {
            mindarThree: mindarThree,
            stop: () => {
                console.log('Stopping MindAR...');
                mindarThree.stop();
            },
            addModel: (modelUrl, anchorIndex = 0) => {
                // Function to add 3D models dynamically
                const loader = new THREE.GLTFLoader();
                loader.load(modelUrl, (gltf) => {
                    const model = gltf.scene;
                    const anchor = mindarThree.addAnchor(anchorIndex);
                    anchor.group.add(model);
                });
            }
        };
        
    } catch (error) {
        console.error('Error initializing MindAR:', error);
        throw error;
    }
}

// Audio Guide Class
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

// Export for use in main script
window.AudioGuide = AudioGuide;
window.audioGuide = audioGuide;
