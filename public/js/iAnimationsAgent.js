import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export default class IAnimationsAgent {

    // static constants
    static DB_NAME="GlbViewerDB";
    static DB_VERSION=1;
    static STORE_NAME="models";

    static loader = new GLTFLoader();
    static timer = new THREE.Timer();

    // Class constructor
    // Receives the width and height of the rendering window
    constructor(width, height) {

        this.mixer = null; 
        this.activeAction = null; 
        this.actionsMap = {}; 

        this.characterModel = null;
        this.baseHeight = 0;
        this.customMovementFn = null; 
        this.activeGltfCache = null; 

        this.db = null;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xdcdcdc); 
        this.scene.fog = new THREE.FogExp2(0xdcdcdc, 0.05);

        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        this.camera.position.set(0, 3, 6); 

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.05; 

        const gridHelper = new THREE.GridHelper(30, 30, 0x444444, 0x888888);
        gridHelper.position.y = 0; 
        this.scene.add(gridHelper);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2); 
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0); 
        directionalLight.position.set(5, 12, 8);
        this.scene.add(directionalLight);

    }

    // We initialize IndexedDB, where we will store the models instead of saving them on the server.
    // This is a client-side library, so it has direct access to IndexedDB.
    // In a more advanced version, we will implement a feature to upload the model to the application server.
    initDB() {

        return new Promise((resolve, reject) => {

            const request = indexedDB.open(IAnimationsAgent.DB_NAME, IAnimationsAgent.DB_VERSION);
        
            request.onupgradeneeded = (e) => {
                const database = e.target.result;
                if (!database.objectStoreNames.contains(IAnimationsAgent.STORE_NAME)) {
                    database.createObjectStore(IAnimationsAgent.STORE_NAME, { keyPath: "id" });
                }
            };
        
            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve(this.db);
            };
        
            request.onerror = (e) => {
                reject(e.target.error);
            };
        });
    }


    // Store the model contained in fileBlob with the specified ID and name
    guardarModelInDB(id, name, fileBlob) {

        return new Promise((resolve, reject) => {

            if (!this.db) {
                reject("The database is not initialized.");
                return;
            }
        
            const transaction = this.db.transaction([IAnimationsAgent.STORE_NAME], "readwrite");
            const store = transaction.objectStore(IAnimationsAgent.STORE_NAME);
            const request = store.openCursor();

            request.onsuccess = (event) => {

                const cursor = event.target.result;

                if (cursor) {
                    if (cursor.value.name === name) {
                        const idExistente = cursor.value.id;

                        const deleteRequest = store.delete(idExistente);;
                        const updateRequest = store.put({ id: id, name, blob: fileBlob });
                    
                        updateRequest.onsuccess = () => {
                            resolve(); 
                        };
                        return; 
                    }
                    cursor.continue();

                } else {

                    const insertRequest = store.put({ id, name, blob: fileBlob });
                
                    insertRequest.onsuccess = () => {
                        resolve(); 
                    };
                }
            };

            request.onerror = (event) => {
                console.error("Error while searching for duplicates:", event.target.error);
                reject(event.target.error);
            };
        });
    }


    // We retrieve the list of models {id,name} stored in this IndexedDB
    cargarListaModelosPersistidos() {
    
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject("The database is not initialized.");
                return;
            }

            const transaction = this.db.transaction([IAnimationsAgent.STORE_NAME], "readonly");
            const store = transaction.objectStore(IAnimationsAgent.STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
    
                const modelosGuardados = request.result;
            
                const listaModelos = modelosGuardados.map(item => ({
                    id: item.id,
                    name: item.name
                }));
            
                resolve(listaModelos);
            };

            request.onerror = (event) => {
                console.error("Error retrieving the list of models : ", event.target.error);
                reject(event.target.error);
            };
        });
    }

    

    // Retrieve the binary code for the model specified by the ID
    // We also obtain the list of bones for this model, which is needed to pass it to the AI
    cargarModeloDesdeDB(id) {
    
        return new Promise((resolve, reject) => {
    
            if (!this.db) {
                reject("The database is not initialized.");
                return;
            }

            const transaction = this.db.transaction([IAnimationsAgent.STORE_NAME], "readonly");
            const store = transaction.objectStore(IAnimationsAgent.STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => {

                const item = request.result;
                if (!item) {
                    reject(`No model was found with the ID: ${id}`);
                    return;
                }

                const blobURL = URL.createObjectURL(item.blob);

                IAnimationsAgent.loader.load(
                    blobURL, 
                    (gltf) => {
                        const huesosDelModelo = [];
                        const personaje = gltf.scene;
                        
                        personaje.traverse((object) => {
                            if (object.isBone) {
                                huesosDelModelo.push(object.name);
                            }
                        });

                        URL.revokeObjectURL(blobURL);

                        resolve({
                            gltf: gltf,
                            huesos: huesosDelModelo,
                            nombre: item.name
                        });
                    }, 
                    undefined, 
                    (err) => {
                        URL.revokeObjectURL(blobURL);
                        console.error("Error loading the model with GLTFLoader from the local DB : ", err);
                        reject(err);
                    }
                );
            };

            request.onerror = (event) => {
                console.error("Error querying the model in the database : ", event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Changes the character model in the scene
    // If the scene is not provided—which is the usual case—it uses the scene `this.scene`.
    cambiarModeloEscena(gltf, sceneInstance) {
    
        const sceneToUse = sceneInstance || this.scene;

        if (!sceneToUse) {
            console.error("No Three.js scene has been provided for mounting the model");
            return null;
        }

        if (this.characterModel) {
            sceneToUse.remove(this.characterModel);
            this.characterModel.traverse((object) => {
                if (object.isMesh) {
                    object.geometry.dispose();
                    if (Array.isArray(object.material)) {
                        object.material.forEach((mat) => mat.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        }

        this.activeGltfCache = gltf;
        this.characterModel = gltf.scene;
    
        const box = new THREE.Box3().setFromObject(this.characterModel);
        const center = box.getCenter(new THREE.Vector3());
    
        this.characterModel.position.x = -center.x;
        this.characterModel.position.z = -center.z;
        this.baseHeight = -box.min.y; 
        this.characterModel.position.y = this.baseHeight; 
    

        sceneToUse.add(this.characterModel);

        this.actionsMap = {};
        this.mixer = new THREE.AnimationMixer(this.characterModel);

        const listaAnimaciones = [];
        let nombreAnimacionPorDefecto = "";
        let actionToRun = null;

        if (gltf.animations && gltf.animations.length > 0) {
            gltf.animations.forEach((clip) => {
                const action = this.mixer.clipAction(clip);
                this.actionsMap[clip.name] = action;
                
                listaAnimaciones.push(clip.name);

                if (clip.name === "Idle") { 
                    nombreAnimacionPorDefecto = clip.name;
                    actionToRun = action;
                }
            });

            if (!actionToRun && gltf.animations.length > 0) {
                nombreAnimacionPorDefecto = gltf.animations[0].name;
                actionToRun = this.actionsMap[nombreAnimacionPorDefecto];
            }

            if (actionToRun) {
                actionToRun.play();
                this.activeAction = actionToRun;
            }
        }

        return {
            animaciones: listaAnimaciones,
            default: nombreAnimacionPorDefecto
        };
    }

    // Check that the code provided by the user is correct
    compileCustomCode(userCode) {

        if (!userCode || userCode.trim() === "") {
            this.customMovementFn = null;
            return true;
        }

        try {
            this.customMovementFn = new Function('model', 'time', 'baseHeight', 'THREE', userCode);
            return true;
        } catch (err) {
            console.error("Error compiling the user's dynamic code : ", err);
            this.customMovementFn = null;
            return false;
        }
    }

    // ToDo: Method to execute the data provided by the AI
    ejecutarComandosIA(dataIA, personajeGLTF = null) {
    
        const modelo = personajeGLTF || this.characterModel;
    
        if (!modelo) {
            console.warn("There is no model loaded or provided for executing AI commands.");
            return;
        }

        if (!dataIA || !Array.isArray(dataIA.acciones)) {
            console.warn("The AI ​​data lacks a valid structure, or the 'actions' array is missing.");
            return;
        }

        dataIA.acciones.forEach(accion => {
    
            const hueso = modelo.getObjectByName(accion.hueso);
            if (!hueso) {
                console.warn(`The bone '${accion.hueso}' was not found in the model.`);
                return;
            }

            if (accion.rotacion !== undefined) {
                const targetRotation = { ...hueso.rotation };
                targetRotation[accion.eje] = accion.rotacion;

                new TWEEN.Tween(hueso.rotation)
                    .to(targetRotation, accion.duracion)
                    .easing(TWEEN.Easing.Cubic.Out)
                    .start();
            }
        
            if (accion.posicion !== undefined) {
                const targetPosition = { ...hueso.position };
                targetPosition[accion.eje] = accion.posicion;

                new TWEEN.Tween(hueso.position)
                    .to(targetPosition, accion.duracion)
                    .easing(TWEEN.Easing.Cubic.Out)
                    .start();
            }
        });
    }

    // Remove the character from the scene
    removeCharacter() {

        if (this.characterModel) 
        {
            this.scene.remove(this.characterModel);
            this.characterModel.traverse((object) => {
                if (object.isMesh) {
                    object.geometry.dispose();
                    if (Array.isArray(object.material)) {
                        object.material.forEach((mat) => mat.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
        
            });
        }
    }
    
    // Method that enables the execution of code or runs the selected animation
    actualizar(timestamp, ejecutarCodigoPersonalizado) {

        IAnimationsAgent.timer.update(timestamp); 
        const delta = IAnimationsAgent.timer.getDelta(); 
        const elapsedTime = IAnimationsAgent.timer.getElapsed(); 

        if (ejecutarCodigoPersonalizado) {
            if (this.characterModel && this.customMovementFn) {
                try {
                    this.customMovementFn(this.characterModel, elapsedTime, this.baseHeight, THREE);
                } catch (err) {
                    console.error("Runtime error in user code : ", err);
                    this.customMovementFn = null; 
                    return false; 
                }
            }
        } else {
            if (this.mixer) {
                this.mixer.update(delta);
            }
        }

        return true;
    }

    // Method that plays an animation
    playAction(id) {
        const nextAction = this.actionsMap[id];
        if (!nextAction || nextAction === this.activeAction) return;
        nextAction.reset().play();
        if (this.activeAction) this.activeAction.crossFadeTo(nextAction, 0.5, true);
        this.activeAction = nextAction;
    }




    // Additional methods can be added as needed
    // Getter and setter methods...
    setRendererSize(w, h) {
        this.renderer.setSize(w, h);
    }

    getRendererDomElement() {
        return this.renderer.domElement
    }

    updateControls() {
        if (this.controls) this.controls.update(); 
    }

    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    updateCamera(w, h) {
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    }

    restartAnimation() {
        if (this.characterModel) {
            this.characterModel.position.set(-this.characterModel.position.x, this.baseHeight, -this.characterModel.position.z);
            this.characterModel.rotation.set(0, 0, 0);
        }
    }
}