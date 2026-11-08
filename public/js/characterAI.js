import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let mixer; 
let activeAction; 
let actionsMap = {}; 
const timer = new THREE.Timer();

let characterModel = null;
let baseHeight = 0;
let customMovementFn = null; 
let scene;
let activeGltfCache = null; 

let selectModelElement = null;
let selectAnimElement = null;
let codeTextArea = null;
let toggleCodeCheckbox = null; 

const loader = new GLTFLoader();

const DB_NAME = "GlbViewerDB";
const DB_VERSION = 1;
const STORE_NAME = "models";
let db;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const database = e.target.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME, { keyPath: "id" });
            }
        };
        request.onsuccess = (e) => {
            db = e.target.result;
            resolve(db);
        };
        request.onerror = (e) => reject(e.target.error);
    });
}

function guardarModelInDB(id, name, fileBlob) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject("La base de datos no está inicializada.");
            return;
        }
        
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.openCursor();

        request.onsuccess = function(event) {
            const cursor = event.target.result;

            if (cursor) {
                if (cursor.value.name === name) {
                    const idExistente = cursor.value.id;
                    const updateRequest = store.put({ id: idExistente, name, blob: fileBlob });
                    
                    updateRequest.onsuccess = () => {
                        console.log(`El archivo '${name}' ya existía. Se ha reemplazado correctamente.`);
                        resolve(); // Indicamos que terminó con éxito
                    };
                    return; 
                }
                cursor.continue();
            } else {
                const insertRequest = store.put({ id, name, blob: fileBlob });
                
                insertRequest.onsuccess = () => {
                    console.log(`Archivo nuevo '${name}' guardado con éxito.`);
                    resolve(); // Indicamos que terminó con éxito
                };
            }
        };

        request.onerror = function(event) {
            console.error("Error al buscar duplicados:", event.target.error);
            reject(event.target.error);
        };
    });
}




function cargarListaModelosPersistidos( nameLoadedModel = '') {
 
    if (!selectModelElement) return;

    selectModelElement.innerHTML = '';
    const defaultOpt = document.createElement('option');
    defaultOpt.value = "none";
    defaultOpt.textContent = "-- Select a model... --";
    selectModelElement.appendChild(defaultOpt);

    if (!db) return;
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
        const modelosGuardados = request.result;
        modelosGuardados.forEach((item) => {
            if (selectModelElement) {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = item.name + " (Saved)";
                selectModelElement.appendChild(option);
                if (item.name===nameLoadedModel && nameLoadedModel!=='') option.selected = true;
            }
        });
    };
}

function cargarModeloDesdeDB(id) {
    if (!db) return;
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
        const item = request.result;
        if (!item) return;

        const blobURL = URL.createObjectURL(item.blob);
        loader.load(blobURL, (gltf) => {

                    let huesosDelModelo = [];

                    const personaje = gltf.scene;
                    
                    // Recorremos todo el modelo buscando los objetos tipo "Bone"
                    personaje.traverse((object) => {
                        if (object.isBone) {
                            huesosDelModelo.push(object.name);
                        }
                    });

                    console.log("Huesos detectados para la IA:", huesosDelModelo);


            cambiarModeloEscena(gltf);
            URL.revokeObjectURL(blobURL);
        }, undefined, (err) => {
            console.error("Error loading the model from the local DB : ", err);
            URL.revokeObjectURL(blobURL);
        });
    };
}

function cambiarModeloEscena(gltf) {
    if (characterModel) {
        scene.remove(characterModel);
        characterModel.traverse((object) => {
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

    activeGltfCache = gltf;
    characterModel = gltf.scene;
    
    const box = new THREE.Box3().setFromObject(characterModel);
    const center = box.getCenter(new THREE.Vector3());
    
    characterModel.position.x = -center.x;
    characterModel.position.z = -center.z;
    baseHeight = -box.min.y; 
    characterModel.position.y = baseHeight; 
    
    scene.add(characterModel);

    actionsMap = {};
    if (selectAnimElement) selectAnimElement.innerHTML = '';
    mixer = new THREE.AnimationMixer(characterModel);

    if (gltf.animations && gltf.animations.length > 0) {

        let actionToRun = null;

        gltf.animations.forEach((clip) => {
        
            const action = mixer.clipAction(clip);
            actionsMap[clip.name] = action;

            if (selectAnimElement) {
                const option = document.createElement('option');
                option.value = clip.name;
                if (clip.name=="Idle") { 
                    option.selected = true;
                    actionToRun = action;
                }
                option.textContent = clip.name;
                selectAnimElement.appendChild(option);

                console.log(clip.name)
            }
        });

        actionToRun .play();
        activeAction = actionToRun;

    } else {
        if (selectAnimElement) {
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "Without animations";
            selectAnimElement.appendChild(option);
        }
    }
    compileCustomCode();
}

function compileCustomCode() {
    if (!codeTextArea) return;
    
    if (toggleCodeCheckbox) {
        toggleCodeCheckbox.checked = false;
        // Fuerza el disparo del evento 'change' para que se ejecute su lógica
        toggleCodeCheckbox.dispatchEvent(new Event('change'));
    }

    const userCode = codeTextArea.value;
    try {
        customMovementFn = new Function('model', 'time', 'baseHeight', 'THREE', userCode);
        
        codeTextArea.style.backgroundColor = '#e8f5e9'; 
        if (toggleCodeCheckbox) {
            toggleCodeCheckbox.disabled = false; 
        }
    } catch (err) {
        customMovementFn = null;
        
        codeTextArea.style.backgroundColor = '#ffebee'; 
        if (toggleCodeCheckbox) {
            toggleCodeCheckbox.disabled = true; 
        }
    }
}

function ejecutarComandosIA(dataIA, personajeGLTF) {
  dataIA.acciones.forEach(accion => {
    const hueso = personajeGLTF.getObjectByName(accion.hueso);
    if (!hueso) return;

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

document.addEventListener('DOMContentLoaded', async () => {

    const container = document.getElementById('canvas-container');
    const applyBtn = document.getElementById('apply-code-btn');
    const fileInput = document.getElementById('file-input');
    
    selectModelElement = document.getElementById('model-selector'); 
    selectAnimElement = document.getElementById('animation-selector'); 
    codeTextArea = document.getElementById('code-input');
    toggleCodeCheckbox = document.getElementById('toggle-code-checkbox'); // Capturamos el checkbox

    if (!container) return;

    try {
        await initDB();
        cargarListaModelosPersistidos();
    } catch (err) {
        console.error("Could not initialize IndexedDB : ", err);
    }

    let width = container.getBoundingClientRect().width || container.clientWidth;
    let height = container.getBoundingClientRect().height || container.clientHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdcdcdc); 
    scene.fog = new THREE.FogExp2(0xdcdcdc, 0.05);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3, 6); 

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; 

    const gridHelper = new THREE.GridHelper(30, 30, 0x444444, 0x888888);
    gridHelper.position.y = 0; 
    scene.add(gridHelper);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2); 
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0); 
    directionalLight.position.set(5, 12, 8);
    scene.add(directionalLight);

    if (selectModelElement) selectModelElement.value = "none";
    if (selectAnimElement) selectAnimElement.innerHTML = '<option value="">-- Select a model first --</option>';

     if (fileInput) {

        fileInput.addEventListener('change', async (event) => {

            const files = event.target.files;
            if (!files || files.length === 0) return;

            const file = files[0]; 
    
            const timestamp = Date.now().toString(36); 
            const uuidSguro = crypto.randomUUID();
            const idUnico = `${timestamp}-${uuidSguro}`; 
            const nombreArchivo = file.name;

            try {

                await initDB(); 

                await guardarModelInDB(idUnico, nombreArchivo, file);

                cargarListaModelosPersistidos(file.name);

            } catch (err) {
                console.error("Error en el flujo de base de datos:", err);
            }

            const blobURL = URL.createObjectURL(file);
    
            loader.load(blobURL, function (gltf) {
                if (selectModelElement) {
                    let huesosDelModelo = [];
                    const personaje = gltf.scene;
            
                    personaje.traverse((object) => {
                        if (object.isBone) {
                            huesosDelModelo.push(object.name);
                        }
                    });

                    console.log("Huesos detectados para la IA:", huesosDelModelo);
                }
        
                cambiarModeloEscena(gltf);
            });
        });
    }

    if (selectModelElement) {
        selectModelElement.addEventListener('change', (event) => {
            const idSeleccionado = event.target.value;
            if (idSeleccionado === 'none') {
                if (characterModel) scene.remove(characterModel);
                if (selectAnimElement) selectAnimElement.innerHTML = '<option value="">-- Select a model first --</option>';
                return;
            } else {
                cargarModeloDesdeDB(idSeleccionado);
            }
        });
    }

    if (applyBtn) applyBtn.addEventListener('click', compileCustomCode);
    
    if (selectAnimElement) {
        selectAnimElement.addEventListener('change', (event) => {
            const nextAction = actionsMap[event.target.value];
            if (!nextAction || nextAction === activeAction) return;
            nextAction.reset().play();
            if (activeAction) activeAction.crossFadeTo(nextAction, 0.5, true);
            activeAction = nextAction;
        });
    }

    if (toggleCodeCheckbox) {
        toggleCodeCheckbox.addEventListener('change', () => {
            if (!toggleCodeCheckbox.checked && characterModel) {
                characterModel.position.set(-characterModel.position.x, baseHeight, -characterModel.position.z);
                characterModel.rotation.set(0, 0, 0);
            }
        });
    }

    window.addEventListener('resize', () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });

    function animate(timestamp) { 
        requestAnimationFrame(animate);
        timer.update(timestamp); 
        const delta = timer.getDelta(); 
        const elapsedTime = timer.getElapsed(); 

        const ejecutarCodigoPersonalizado = toggleCodeCheckbox && toggleCodeCheckbox.checked;

        if (ejecutarCodigoPersonalizado) {
            if (characterModel && customMovementFn) {
                try {
                    customMovementFn(characterModel, elapsedTime, baseHeight, THREE);
                } catch (err) {
                    customMovementFn = null; 
                    if (codeTextArea) codeTextArea.style.backgroundColor = '#ffebee';
                }
            }
        } else {
            if (mixer) mixer.update(delta);
        }

        controls.update(); 
        renderer.render(scene, camera);
    }

    codeTextArea = document.getElementById('code-input');

    if (applyBtn) {
        applyBtn.disabled = true;
        applyBtn.style.opacity = "0.5";
        applyBtn.style.cursor = "not-allowed";
    }

    if (codeTextArea) {
        codeTextArea.addEventListener('input', () => {
        
            codeTextArea.style.backgroundColor = '#ffebee'; 
        
            if (applyBtn) {
                applyBtn.disabled = false;
                applyBtn.style.opacity = "1";
                applyBtn.style.cursor = "pointer";
            }

            if (toggleCodeCheckbox) {
                toggleCodeCheckbox.checked = false;
                toggleCodeCheckbox.disabled = true;

                toggleCodeCheckbox.dispatchEvent(new Event('change'));
            }
        });
    }


    const nativeSelect = document.getElementById('animation-selector');
    const selectWrapper = document.getElementById('custom-select-wrapper');
    const selectTrigger = document.getElementById('custom-trigger');
    const selectedText = document.getElementById('custom-selected-text');
    const optionsBox = document.getElementById('custom-options-box');

    // 1. Abrir/Cerrar el menú visual al hacer clic
    selectTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        selectWrapper.classList.toggle('open');
    });

    document.addEventListener('click', () => {
        selectWrapper.classList.remove('open');
    });

    // 2. Función para redibujar el menú flotante leyendo tus <option> añadidos
    function syncCustomSelect() {
        optionsBox.innerHTML = ''; // Limpiar el menú visual
        
        // Si hay una opción seleccionada por defecto en tu select nativo, actualizamos el texto principal
        if (nativeSelect.selectedOptions.length > 0) {
            selectedText.innerText = nativeSelect.selectedOptions[0].text;
        }

        // Clonamos cada option nativo en un div flotante con scroll
        Array.from(nativeSelect.options).forEach((option) => {
            const item = document.createElement('div');
            item.className = 'custom-option-item';
            item.textContent = option.text;

            item.addEventListener('click', () => {
                selectedText.innerText = option.text;
                nativeSelect.value = option.value; // Sincroniza el valor con tu select original
                selectWrapper.classList.remove('open');
                
                // Dispara el evento change nativo por si tu código de Three.js lo escucha
                nativeSelect.dispatchEvent(new Event('change'));
            });

            optionsBox.appendChild(item);
        });
    }

    // 3. EL VIGILANTE: Detecta de forma automática cuándo añades "options" desde Three.js
    const observer = new MutationObserver(() => {
        syncCustomSelect();
    });

    // Le decimos al vigilante que observe los cambios de elementos dentro del select
    if (nativeSelect) {
        observer.observe(nativeSelect, { childList: true });
        syncCustomSelect(); // Ejecución inicial por si ya había datos
    }

    requestAnimationFrame(animate);
});
