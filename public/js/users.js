document.addEventListener('DOMContentLoaded', () => {

    console.log("Testing users.js... " + Math.floor(Math.random() * 100000));

    const btnToggle = document.getElementById('btn-toggle-status');
    const usersContainer = document.getElementById('users-container');
    const usersCount = document.getElementById('users-count');

    btnToggle.addEventListener('click', async () => {

        console.log("Testing btnToggle.addEventListener... " + Math.floor(Math.random() * 100000));

        // Read the current state from the data attribute
        const showingActive = btnToggle.getAttribute('data-showing-active') === 'true';
        
        // If we were showing active items (true), now we want to request inactive ones (active=false)
        const targetActiveStatus = !showingActive;

        try {

            

            // AJAX request to your API controller class
            const response = await fetch(`/api/users?activeUser=${targetActiveStatus}`);
            const result = await response.json();

            

            if (result.success) {

                // Clear the current container
                usersContainer.innerHTML = '';

                // Inject the new users returned by the API
                result.data.forEach(user => {
                    usersContainer.innerHTML += `
                        <div style="padding: 1rem; border: 1px solid #ccc; border-radius: 8px;">
                            <strong>ID: ${user.id} - NAME : ${user.name}</strong> — 
                            <span style="color: #666">${user.email}</span> — 
                            <span style="color: #666">${user.role}</span>
                        </div>
                    `;
                });

                // Update the numeric counter in the h1 title
                usersCount.textContent = result.data.length;

                // Change the button's state and text for the next click
                btnToggle.setAttribute('data-showing-active', targetActiveStatus.toString());
                btnToggle.textContent = targetActiveStatus ? 'Show Inactive Users' : 'Show Active Users';
            }
        } catch (error) {
            console.error('Error performing the AJAX request : ', error);
        }
    });
});