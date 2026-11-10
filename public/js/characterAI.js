import CharacterAnimationsAgent from './characterAnimationsAgent.js';



document.addEventListener('DOMContentLoaded', async () => {

    const container = document.getElementById('canvas-container');

    if (!container) return;

    const characterAnimationsAgent = new CharacterAnimationsAgent(container);

    const applyBtn = document.getElementById('apply-code-btn');
    const fileInput = document.getElementById('file-input');
    const nativeSelect = document.getElementById('animation-selector');
    const selectWrapper = document.getElementById('custom-select-wrapper');
    const selectTrigger = document.getElementById('custom-trigger');
    const selectedText = document.getElementById('custom-selected-text');
    const optionsBox = document.getElementById('custom-options-box');    
    const selectModelElement = document.getElementById('model-selector'); 
    const selectAnimElement = document.getElementById('animation-selector'); 
    const codeTextArea = document.getElementById('code-input');
    const toggleCodeCheckbox = document.getElementById('toggle-code-checkbox');

    try {

        await characterAnimationsAgent.initDB();

        // We add the first option to the models dropdown menu
        selectModelElement.innerHTML = '';
        const defaultOpt = document.createElement('option');
        defaultOpt.value = "none";
        defaultOpt.selected = true;
        defaultOpt.textContent = "-- Select a model... --";
        selectModelElement.appendChild(defaultOpt);

        try {

            const models = await characterAnimationsAgent.getModelListFromDB();

            models.forEach((item) => {

                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = item.name + " (Saved)";

                selectModelElement.appendChild(option);
            });

        } catch (error) {
            console.error("The models could not be loaded in the UI : ", error);
        }

    } catch (err) {
        console.error("Could not initialize IndexedDB : ", err);
    }

    if (selectModelElement) selectModelElement.value = "none";
    if (selectAnimElement) selectAnimElement.innerHTML = '<option value="">-- Select a model first --</option>';

    // EventListeners
    // Upload a file input file element
    if (fileInput) {

        fileInput.addEventListener('change', async (event) => {

            const files = event.target.files;
            if (!files || files.length === 0) return;

            const file = files[0]; 
    
            const timestamp = Date.now().toString(36); 
            const uuidSguro = crypto.randomUUID();
            const idUnico = `${timestamp}-${uuidSguro}`; 
            const nameArchivo = file.name;

            try {

                await characterAnimationsAgent.initDB(); 

                await characterAnimationsAgent.saveModelInDB(idUnico, nameArchivo, file);

                selectModelElement.innerHTML = '';
                const defaultOpt = document.createElement('option');
                defaultOpt.value = "none";
                defaultOpt.textContent = "-- Select a model... --";
                selectModelElement.appendChild(defaultOpt);

                try {

                    
                    const models = await characterAnimationsAgent.getModelListFromDB();

                    
                    models.forEach((item) => {

                        const option = document.createElement('option');
                        option.value = item.id;
                        option.textContent = item.name + " (Saved)";
            
                        if (item.name === nameArchivo && nameArchivo !== '') {
                            option.selected = true;
                        }
            
                        selectModelElement.appendChild(option);
                    });

                } catch (error) {
                    console.error("The models could not be loaded in the UI : ", error);
                }

            } catch (err) {
                console.error("Error in the database flow : ", err);
            }

            try {

                const datosmodel = await characterAnimationsAgent.getModelBlobFromDB(idUnico);
        
                const resultadoanimations = characterAnimationsAgent.loadNewModelInScene(datosmodel.gltf);

                if (selectAnimElement) {

                    selectAnimElement.innerHTML = '';

                    if (resultadoanimations.animations.length > 0) {

                        resultadoanimations.animations.forEach((nameClip) => {
                            const option = document.createElement('option');
                            option.value = nameClip;
                            option.textContent = nameClip;
                    
                            if (nameClip === resultadoanimations.default) {
                                option.selected = true;
                            }
                            selectAnimElement.appendChild(option);
                        });

                    } else {

                        const option = document.createElement('option');
                        option.value = "";
                        option.textContent = "Without animations";
                        selectAnimElement.appendChild(option);
                    }
                }
            } catch (error) {
                console.error("Error in the model change flow : ", error);
            }
        });
    }


    // Selected a diferent model
    if (selectModelElement) {

        selectModelElement.addEventListener('change', async (event) => {

            const idSeleccionado = event.target.value;

            if (idSeleccionado === 'none') {

                characterAnimationsAgent.removeCharacter();
                if (selectAnimElement) selectAnimElement.innerHTML = '<option value="">-- Select a model first --</option>';
                return;

            } else {

                try {

                    const datosmodel = await characterAnimationsAgent.getModelBlobFromDB(idSeleccionado);
                    const resultadoanimations = characterAnimationsAgent.loadNewModelInScene(datosmodel.gltf);
        
                    if (selectAnimElement) {

                        selectAnimElement.innerHTML = '';

                        if (resultadoanimations.animations.length > 0) {

                            resultadoanimations.animations.forEach((nameClip) => {

                                const option = document.createElement('option');
                                option.value = nameClip;
                                option.textContent = nameClip;
                    
                                if (nameClip === 'Idle') {
                                    option.selected = true;
                                }
                                selectAnimElement.appendChild(option);
                            });

                        } else {
                            const option = document.createElement('option');
                            option.value = "";
                            option.textContent = "Without animations";
                            selectAnimElement.appendChild(option);
                        }
                    }

                    const userCode = codeTextArea.textContent;
                    const esExitoso = characterAnimationsAgent.compileCustomCode(userCode);

                    if (esExitoso) {
                        codeTextArea.style.backgroundColor = '#e8f5e9';
                        if (toggleCodeCheckbox) {
                            toggleCodeCheckbox.disabled = false; 
                        }
                    } else {
                        codeTextArea.style.backgroundColor = '#ffebee';
                        if (toggleCodeCheckbox) {
                            toggleCodeCheckbox.disabled = true; 
                        }
                    }
                } catch (error) {
                    console.error("Error in the model change flow : ", error);
                }
            }
        });
    }


    // Animation selector changed
    if (selectAnimElement) {

        selectAnimElement.addEventListener('change', (event) => {
            characterAnimationsAgent.playAnimation(event.target.value);
        });
    }

    // The validate code button has been clicked
    if (applyBtn) applyBtn.addEventListener('click', () => { 

        applyBtn.disabled = true;
        applyBtn.style.opacity = "0.5";
        applyBtn.style.cursor = "not-allowed";

        const userCode = codeTextArea.textContent;
        const esExitoso = characterAnimationsAgent.compileCustomCode(userCode);

        if (esExitoso) {
            codeTextArea.style.backgroundColor = '#e8f5e9'; // Verde claro
            if (toggleCodeCheckbox) {
                toggleCodeCheckbox.disabled = false; 
            }
        } else {
            codeTextArea.style.backgroundColor = '#ffebee'; // Rojo claro
            if (toggleCodeCheckbox) {
                toggleCodeCheckbox.disabled = true; 
            }
        }
    });
    

    // The checkbox to stop the animation is checked
    // Enabling the checkbox triggers the code, provided it is validated
    // Disabling it stops the code from executing, and the animation must be restarted
    if (toggleCodeCheckbox) {
        toggleCodeCheckbox.addEventListener('change', () => {
            if (!toggleCodeCheckbox.checked) {
                characterAnimationsAgent.resetModelTransform();
            }
        });
    }

    // Each time code is written in the text box
    // The checkbox cannot be activated and the code cannot be executed until validation is complete.
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



    // Adjustments are made if the window is resized
    window.addEventListener('resize', () => {

        const w = container.clientWidth;
        const h = container.clientHeight;
        characterAnimationsAgent.resize(w,h);
    });

    // This code is for the animations dropdown 
    // The select element is kept, but it is handled in a smart way
    selectTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        selectWrapper.classList.toggle('open');
    });

    document.addEventListener('click', () => {
        selectWrapper.classList.remove('open');
    });

    function syncCustomSelect() {
        optionsBox.innerHTML = '';
        
        if (nativeSelect.selectedOptions.length > 0) {
            selectedText.innerText = nativeSelect.selectedOptions[0].text;
        }

        Array.from(nativeSelect.options).forEach((option) => {
            const item = document.createElement('div');
            item.className = 'custom-option-item';
            item.textContent = option.text;

            item.addEventListener('click', () => {
                selectedText.innerText = option.text;
                nativeSelect.value = option.value;
                selectWrapper.classList.remove('open');
                
                nativeSelect.dispatchEvent(new Event('change'));
            });

            optionsBox.appendChild(item);
        });
    }

    const observer = new MutationObserver(() => {
        syncCustomSelect();
    });

    if (nativeSelect) {
        observer.observe(nativeSelect, { childList: true });
        syncCustomSelect();
    }






    // This code block defines and executes the main animation loop (also known as a game loop or render loop) 
    // for the 3D application. Its purpose is to update the logic, handle any potential errors, and continuously 
    // redraw the screen at the maximum speed allowed by the monitor (typically 60 or 90 times per second).
    function animate(timestamp) { 

        // The most important native browser function for animations. It tells the browser: 
        // "As soon as you are ready to paint the next frame, run the animate function again."
        requestAnimationFrame(animate);

        // It is specified whether to execute the custom code or the animation
        const ejecutarCodigoPersonalizado = toggleCodeCheckbox && toggleCodeCheckbox.checked;
        const ejecucionExitosa = characterAnimationsAgent.tick(timestamp, ejecutarCodigoPersonalizado);

        // If you cannot execute the code...
        if (!ejecucionExitosa) {        
            if (toggleCodeCheckbox) toggleCodeCheckbox.checked = false;
            if (codeTextArea) codeTextArea.style.backgroundColor = '#ffebee';
        }

        // Updates the camera controls
        characterAnimationsAgent.updateControls();

        // Internally calls the renderer's method (this.renderer.render(scene, camera)) to physically draw the changes 
        // for this frame onto the <canvas>.
        characterAnimationsAgent.render();
    }

    animate(0);
});