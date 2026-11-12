import CharacterAnimationsAgent from './characterAnimationsAgent.js';

document.addEventListener('DOMContentLoaded', async () => {

    // We get the canvas where the character animations will be displayed
    const container = document.getElementById('canvas-container');

    if (!container) return;

    // The character's animation agent is created, and the canvas is passed to it
    const characterAnimationsAgent = new CharacterAnimationsAgent(container);

    // We obtain references to the DOM elements on the page
    const applyBtn = document.getElementById('apply-code-btn');
    const fileInput = document.getElementById('file-input');
    const nativeSelect = document.getElementById('animation-selector');
    const selectWrapper = document.getElementById('custom-select-wrapper');
    const selectTrigger = document.getElementById('custom-trigger');
    const selectedText = document.getElementById('custom-selected-text');
    const optionsBox = document.getElementById('custom-options-box');    
    const selectModelElement = document.getElementById('model-selector'); 
    const selectAnimElement = document.getElementById('animation-selector'); 
    const selectBonesElement = document.getElementById('bone-selector'); 
    const codeTextArea = document.getElementById('code-input');
    const toggleCodeCheckbox = document.getElementById('toggle-code-checkbox');


    try {

        // Initialize the local database for storing character models
        // It is initialized only once
        await characterAnimationsAgent.initDB();

        // We add the first option to the models dropdown menu
        selectModelElement.innerHTML = '';
        const defaultOpt = document.createElement('option');
        defaultOpt.value = "none";
        defaultOpt.selected = true;
        defaultOpt.textContent = "-- Select a model... --";
        selectModelElement.appendChild(defaultOpt);

        try {

            // We retrieve the list of models from the database
            const models = await characterAnimationsAgent.getModelListFromDB();

            // We populate the dropdown menu for the models
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

    // In the animation and bone dropdown menus, we indicate that a model must be selected.
    if (selectAnimElement) selectAnimElement.innerHTML = '<option value="">-- Select a model first --</option>';
    if (selectBonesElement) selectBonesElement.innerHTML = '<option value="">-- Select a model first --</option>';

    // EventListeners...
    if (fileInput) {

        // Upload a file input file element
        fileInput.addEventListener('change', async (event) => {

            const files = event.target.files;
            if (!files || files.length === 0) return;

            // We take only the first of the uploaded files
            const file = files[0]; 
    
            // We generate the timestamp in base 36
            const timestamp = Date.now().toString(36);

            // We generate 8 random characters (letters and numbers)
            const randomChars = Math.random().toString(36).substring(2, 10);

            const id = `${timestamp}-${randomChars}`;
            const filename = file.name;

            try {

                // We store the uploaded model in the local database
                await characterAnimationsAgent.saveModelInDB(id, filename, file);

                // Load the models into the model dropdown menu
                // Initially, add a first entry indicating that a model must be selected, but do not select it
                selectModelElement.innerHTML = '';
                const defaultOpt = document.createElement('option');
                defaultOpt.value = "none";
                defaultOpt.textContent = "-- Select a model... --";
                selectModelElement.appendChild(defaultOpt);

                try {

                    // We retrieve the list of models from the database
                    const models = await characterAnimationsAgent.getModelListFromDB();

                    // We finish populating the models dropdown menu
                    models.forEach((item) => {

                        const option = document.createElement('option');
                        option.value = item.id;
                        option.textContent = item.name + " (Saved)";
            
                        // We select the option that matches the name of the uploaded model
                        if (item.name === filename && filename !== '') option.selected = true;
            
                        selectModelElement.appendChild(option);
                    });

                } catch (error) {
                    console.error("The models could not be loaded in the UI : ", error);
                }

            } catch (err) {
                console.error("Error in the database flow : ", err);
            }

            try {

                // We populate the dropdown menus for the model's animations and bones by passing in the character's ID.
                await fillAnimationsAndBones(id);   
                
                // We verify that the code provided by the user is correct
                checkUserCode();

            } catch (error) {
                console.error("Error in the model change flow : ", error);
            }
        });
    }


    if (selectModelElement) {

        // Selected a different model
        selectModelElement.addEventListener('change', async (event) => {

            const id = event.target.value;

            if (id === 'none') {

                // If we do not select any model
                characterAnimationsAgent.removeCharacter();
                if (selectAnimElement) selectAnimElement.innerHTML = '<option value="">-- Select a model first --</option>';
                if (selectBonesElement) selectBonesElement.innerHTML = '<option value="">-- Select a model first --</option>';
                return;

            } else {

                try {

                    // We populate the dropdown menus for the model's animations and bones by passing in the character ID.
                    await fillAnimationsAndBones(id);                  

                    // We verify that the code provided by the user is correct
                    checkUserCode();

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
        checkUserCode();
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


    selectBonesElement.addEventListener('change', (event) => {
        const boneName = event.target.value;
        characterAnimationsAgent.remarkBone(boneName);
    });


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







    async function fillAnimationsAndBones(id) {
        
        // We obtain the binary for the model we have selected
        const datamodel = await characterAnimationsAgent.getModelBlobFromDB(id);

        // We retrieve the animations for the selected model
        const animations = characterAnimationsAgent.loadNewModelInScene(datamodel.gltf);
                    
        // We load the animations dropdown menu
        if (selectAnimElement) {

            selectAnimElement.innerHTML = '';

            if (animations.animations.length > 0) {

                animations.animations.forEach((nameClip) => {

                    const option = document.createElement('option');
                    option.value = nameClip;
                    option.textContent = nameClip;
                    
                    // We select the one provided by default by the animation agent ('Idle')
                    if (nameClip === animations.default) option.selected = true;

                    selectAnimElement.appendChild(option);
                            
                });

            } else {

                // In the case that there are no animations
                const option = document.createElement('option');
                option.value = "";
                option.textContent = "Without animations";
                selectAnimElement.appendChild(option);
            }
        }

        // Load the bone dropdown menu
        if (selectBonesElement) {

            selectBonesElement.innerHTML = '';

            const defaultOpt = document.createElement('option');
            defaultOpt.value = "none";
            defaultOpt.textContent = "-- Select a bone... --";
            selectBonesElement.appendChild(defaultOpt);

            const allOpt = document.createElement('option');
            allOpt.value = "all";
            allOpt.textContent = "ALL Bones selected";
            selectBonesElement.appendChild(allOpt);


            if (datamodel.bones.length > 0) {

                datamodel.bones.forEach((bone) => {
                    const option = document.createElement('option');
                    option.value = bone;
                    option.textContent = bone;
                    selectBonesElement.appendChild(option);
                });

            } else {

                // In the case that there is no bone at all
                const option = document.createElement('option');
                option.value = "";
                option.textContent = "Without bones";
                selectBonesElement.appendChild(option);
            }
        }
    }    






    function checkUserCode() {

        // we verify the code provided by the user
        const userCode = codeTextArea.textContent;
        const isOk = characterAnimationsAgent.compileCustomCode(userCode);

        if (isOk) {
            codeTextArea.style.backgroundColor = '#e8f5e9';
            if (toggleCodeCheckbox) toggleCodeCheckbox.disabled = false; 
            applyBtn.disabled = true;
            applyBtn.style.opacity = "0.5";
            applyBtn.style.cursor = "not-allowed";
        } else {
            codeTextArea.style.backgroundColor = '#ffebee';
            if (toggleCodeCheckbox) toggleCodeCheckbox.disabled = true; 
        }

    }







    // This code block defines and executes the main animation loop (also known as a game loop or render loop) 
    // for the 3D application. Its purpose is to update the logic, handle any potential errors, and continuously 
    // redraw the screen at the maximum speed allowed by the monitor (typically 60 or 90 times per second).
    function animate(timestamp = performance.now()) { 

        // The most important native browser function for animations. It tells the browser: 
        // As soon as you are ready to paint the next frame, run the animate function again.
        requestAnimationFrame(animate);

        // It is specified whether to execute the custom code or the animation
        const executeCode = toggleCodeCheckbox && toggleCodeCheckbox.checked;
        const isOk = characterAnimationsAgent.tick(timestamp, executeCode);

        // If you cannot execute the code...
        if (!isOk) {        
            if (toggleCodeCheckbox) toggleCodeCheckbox.checked = false;
            if (codeTextArea) codeTextArea.style.backgroundColor = '#ffebee';
        }

        // Updates the camera controls
        characterAnimationsAgent.updateControls();

        // Internally calls the renderer's method (this.renderer.render(scene, camera)) to physically draw the changes 
        // for this frame onto the <canvas>.
        characterAnimationsAgent.render();
    }

    requestAnimationFrame(animate);
});