/*

########  ########   #######  ########  ##     ##  ######  ######## ####  #######  ##    ## 
##     ## ##     ## ##     ## ##     ## ##     ## ##    ##    ##     ##  ##     ## ###   ## 
##     ## ##     ## ##     ## ##     ## ##     ## ##          ##     ##  ##     ## ####  ## 
########  ########  ##     ## ##     ## ##     ## ##          ##     ##  ##     ## ## ## ## 
##        ##   ##   ##     ## ##     ## ##     ## ##          ##     ##  ##     ## ##  #### 
##        ##    ##  ##     ## ##     ## ##     ## ##    ##    ##     ##  ##     ## ##   ### 
##        ##     ##  #######  ########   #######   ######     ##    ####  #######  ##    ## 

   ###    ##     ## ########  #######  ##     ##    ###    ######## ####  ######            
  ## ##   ##     ##    ##    ##     ## ###   ###   ## ##      ##     ##  ##    ##           
 ##   ##  ##     ##    ##    ##     ## #### ####  ##   ##     ##     ##  ##                 
##     ## ##     ##    ##    ##     ## ## ### ## ##     ##    ##     ##  ##                 
######### ##     ##    ##    ##     ## ##     ## #########    ##     ##  ##                 
##     ## ##     ##    ##    ##     ## ##     ## ##     ##    ##     ##  ##    ##           
##     ##  #######     ##     #######  ##     ## ##     ##    ##    ####  ######  

##        #######   ######    ######   #### ##    ##  ######                                
##       ##     ## ##    ##  ##    ##   ##  ###   ## ##    ##                               
##       ##     ## ##        ##         ##  ####  ## ##                                     
##       ##     ## ##   #### ##   ####  ##  ## ## ## ##   ####                              
##       ##     ## ##    ##  ##    ##   ##  ##  #### ##    ##                               
##       ##     ## ##    ##  ##    ##   ##  ##   ### ##    ##                               
########  #######   ######    ######   #### ##    ##  ######                                

 ######  ##    ##  ######  ######## ######## ##     ##                                      
##    ##  ##  ##  ##    ##    ##    ##       ###   ###                                      
##         ####   ##          ##    ##       #### ####                                      
 ######     ##     ######     ##    ######   ## ### ##                                      
      ##    ##          ##    ##    ##       ##     ##                                      
##    ##    ##    ##    ##    ##    ##       ##     ##                                      
 ######     ##     ######     ##    ######## ##     ##                                      


        (C) ALL RIGHTS RESERVED 2026
        Developer   : Ze Yuan
        Version     : V2.1 Operational Hardened


*/

document.addEventListener('DOMContentLoaded', () => {

    // Version      : 2.8 Complete Custom UI Framework Build
    // Developer    : Ze Yuan
    // (C) All Rights Reserved 2026

    const taskButtons = document.querySelectorAll('.btn-task');
    const ingredientLabel = document.getElementById('ingredient-label');
    const prereqInput = document.getElementById('prereq-id');
    const verifyButton = document.getElementById('btn-verify');
    const statusMessage = document.getElementById('validation-status');
    const submitButton = document.getElementById('btn-submit');
    const loadingOverlay = document.getElementById('page-loading');
    const loadingMsg = document.getElementById('loading-msg');
    
    // Confirmation UI Modal Hooks
    const confirmModal = document.getElementById('custom-confirm-modal');
    const modalCancelBtn = document.getElementById('btn-modal-cancel');
    const modalConfirmBtn = document.getElementById('btn-modal-confirm');
    const modalSummaryType = document.getElementById('modal-summary-type');
    const modalSummaryId = document.getElementById('modal-summary-id');
    const modalSummaryConsumed = document.getElementById('modal-summary-consumed');

    // Alert UI Modal Hooks
    const alertModal = document.getElementById('custom-alert-modal');
    const alertCard = alertModal.querySelector('.alert-modal-card');
    const alertTitle = document.getElementById('alert-modal-title');
    const alertMessage = document.getElementById('alert-modal-message');
    const alertCloseBtn = document.getElementById('btn-alert-close');

    const webAppUrl = "https://script.google.com/macros/s/AKfycbzQHcl3RHOXFLHPvco_CoN28quRFDxzK_LvxTjhbHq4szfdD50sg-ukODvANkIKIBzs/exec";

    let currentTask = 'RY';
    let securelyGeneratedId = '';
    let isFetchingId = false;

    const activeUser = localStorage.getItem('session_staff_id');
    const activeUserName = localStorage.getItem('session_staff_name');

    if (!activeUser) {
        window.location.href = 'login.html';
        return;
    }

    const logoutButton = document.getElementById('btn-logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            // Optional: You could upgrade this to a custom modal too if required later!
            if (confirm("Are you sure you want to log out of this production terminal session?")) {
                localStorage.removeItem('session_staff_id');
                localStorage.removeItem('session_staff_name');
                window.location.href = 'login.html';
            }
        });
    }

    const staffBadgeElement = document.querySelector('.user-badge .val');
    if (staffBadgeElement) {
        staffBadgeElement.textContent = `${activeUserName} (${activeUser})`;
    }

    statusMessage.style.display = 'none';
    updateUiForTask('RY');

    // ========================================
    // | CUSTOM ALERT INTERFACES ROUTING CORE |
    // ========================================
    function showAlertUI(title, message, visualType = 'info') {
        alertTitle.textContent = title;
        alertMessage.textContent = message;
        
        // Reset classes
        alertCard.classList.remove('alert-success', 'alert-error');
        
        if (visualType === 'success') {
            alertCard.classList.add('alert-success');
        } else if (visualType === 'error') {
            alertCard.classList.add('alert-error');
        }
        
        alertModal.classList.add('active');
    }

    alertCloseBtn.addEventListener('click', () => {
        alertModal.classList.remove('active');
    });

    function showLoading(message) {
        loadingMsg.textContent = message;
        loadingOverlay.classList.add('active');
    }

    function hideLoading() {
        loadingOverlay.classList.remove('active');
    }

    taskButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (isFetchingId) return; 

            taskButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            currentTask = button.getAttribute('data-task');
            updateUiForTask(currentTask);
        });
    });

    function updateUiForTask(task) {
        prereqInput.value = '';
        prereqInput.removeAttribute('data-validated-id');
        statusMessage.style.display = 'none';
        prereqInput.style.borderColor = '';
        prereqInput.style.backgroundColor = '';
        
        submitButton.disabled = true; 
        securelyGeneratedId = '';
        
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        const yyyymm = today.getFullYear() + String(today.getMonth() + 1).padStart(2, '0');

        const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        document.getElementById('summary-time').textContent = today.toLocaleDateString(undefined, options);

        const summaryType = document.getElementById('summary-type');
        const summaryConsumed = document.getElementById('summary-consumed');

        let targetFullTitle = "";
        if (task === 'RY') {
            prereqInput.disabled = true;
            verifyButton.disabled = true;
            ingredientLabel.textContent = 'Enter Prerequisite Batch ID (Not Required for RY)';
            prereqInput.placeholder = 'N/A';
            targetFullTitle = 'Raw Yogurt (RY)';
            summaryConsumed.textContent = 'None (Primary Step)';
            summaryConsumed.classList.add('text-muted');
            
            isFetchingId = true;
            showLoading('Generating next available unique batch ID sequence...');
            document.getElementById('generated-id-display').textContent = `${yyyymm}....`;

            fetch(webAppUrl, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    action: 'getNextId',
                    dateStr: dateStr,
                    batchType: targetFullTitle
                })
            })
            .then(response => response.json())
            .then(result => {
                isFetchingId = false;
                hideLoading();
                if (result.status === 'success') {
                    securelyGeneratedId = `${yyyymm}${result.sequence}`;
                    document.getElementById('generated-id-display').textContent = securelyGeneratedId;
                    submitButton.disabled = false; 
                } else {
                    document.getElementById('generated-id-display').textContent = 'Error loading ID';
                }
            })
            .catch(error => {
                isFetchingId = false;
                hideLoading();
                console.error('Error fetching sequence row:', error);
                document.getElementById('generated-id-display').textContent = 'Error loading ID';
            });

        } else {
            prereqInput.disabled = false;
            verifyButton.disabled = false;
            submitButton.disabled = true;
            prereqInput.placeholder = 'Type or double-click to select...';
            document.getElementById('generated-id-display').textContent = 'Pending Selection & Verification...';
            
            const datalist = document.getElementById('available-batches-list');
            if (datalist) datalist.innerHTML = ''; 
            
            let queryType = '';
            if (task === 'YB') {
                ingredientLabel.textContent = 'Enter or Select Prerequisite RY Batch';
                targetFullTitle = 'Yogurt Base (YB)';
                queryType = 'RY'; 
            } else if (task === 'FY') {
                ingredientLabel.textContent = 'Enter or Select Prerequisite YB Batch';
                targetFullTitle = 'Finished Yogurt (FY)';
                queryType = 'YB'; 
            }
            summaryConsumed.textContent = 'Pending verification...';
            summaryConsumed.classList.remove('text-muted');

            showLoading('Retrieving matching staging inventory lists...');
            
            fetch(webAppUrl + "?t=" + Date.now(), {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    action: 'getAvailableBatches',
                    requiredType: queryType 
                })
            })
            .then(response => response.json())
            .then(result => {
                hideLoading();
                
                console.log("FRONTEND SENT:", queryType, "| BACKEND RETURNED:", result);
                
                const panel = document.getElementById('custom-dropdown-panel');
                if (!panel) return;
                
                panel.innerHTML = ''; 
                
                if (result.status === 'success' && result.batches && result.batches.length > 0) {
                    
                    result.batches.forEach(batchId => {
                        const item = document.createElement('div');
                        item.className = 'custom-dropdown-item';
                        item.textContent = batchId;
                        
                        item.addEventListener('click', (e) => {
                            prereqInput.value = batchId;
                            panel.style.display = 'none';
                            document.querySelector('.custom-select-wrapper').classList.remove('open');
                            e.stopPropagation();
                        });
                        
                        panel.appendChild(item);
                    });

                    const showPanel = () => {
                        panel.style.display = 'block';
                        document.querySelector('.custom-select-wrapper').classList.add('open');
                        filterDropdownItems(); 
                    };

                    prereqInput.onfocus = showPanel;
                    prereqInput.onclick = showPanel;

                    function filterDropdownItems() {
                        const filterText = prereqInput.value.trim().toLowerCase();
                        const items = panel.querySelectorAll('.custom-dropdown-item');
                        let visibleCount = 0;

                        items.forEach(item => {
                            if (item.textContent.toLowerCase().includes(filterText)) {
                                item.style.display = 'block';
                                visibleCount++;
                            } else {
                                item.style.display = 'none';
                            }
                        });

                        const existingMsg = panel.querySelector('.dropdown-status-msg');
                        if (existingMsg) existingMsg.remove();

                        if (visibleCount === 0) {
                            const noMatchRow = document.createElement('div');
                            noMatchRow.className = 'dropdown-status-msg';
                            noMatchRow.textContent = 'No matching batches in storage.';
                            panel.appendChild(noMatchRow);
                        }
                    }

                    prereqInput.oninput = filterDropdownItems;

                    document.onclick = function(e) {
                        if (!e.target.closest('.custom-select-wrapper')) {
                            panel.style.display = 'none';
                            document.querySelector('.custom-select-wrapper').classList.remove('open');
                        }
                    };

                } else {
                    panel.innerHTML = '<div class="dropdown-status-msg">No available staging stock entries found</div>';
                    prereqInput.onfocus = () => panel.style.display = 'block';
                }
            })
            .catch(error => {
                hideLoading();
                console.error('Error fetching inventory arrays:', error);
            });
        }
        summaryType.textContent = targetFullTitle;
    }

    function checkPrerequisiteId() {
        const idValue = prereqInput.value.trim();
        if (!idValue) {
            statusMessage.innerHTML = `<strong>Error:</strong> Please enter a Batch ID to verify.`;
            statusMessage.className = 'status-msg status-error';
            statusMessage.style.display = 'block';
            prereqInput.style.borderColor = '#ef4444';
            prereqInput.style.backgroundColor = '#fef2f2';
            return;
        }

        verifyButton.disabled = true;
        showLoading('Verifying inventory matrix status...');

        fetch(webAppUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'check',
                batchId: idValue,
                currentTask: currentTask 
            })
        })
        .then(response => response.json())
        .then(result => {
            verifyButton.disabled = false;
            hideLoading();

            if (result.status === 'valid') {
                statusMessage.style.display = 'none';
                prereqInput.style.borderColor = '#16a34a';
                prereqInput.style.backgroundColor = '#f0fdf4';
                
                prereqInput.setAttribute('data-validated-id', idValue);
                document.getElementById('summary-consumed').textContent = idValue;
                
                securelyGeneratedId = idValue; 
                document.getElementById('generated-id-display').textContent = securelyGeneratedId;
                submitButton.disabled = false;
            } else {
                let errorMessage = 'Batch ID not found or invalid for this phase.';
                if (result.status === 'consumed') {
                    errorMessage = 'Batch ID status is already "Consumed".';
                }
                statusMessage.innerHTML = `<strong>Error:</strong> ${errorMessage}`;
                statusMessage.className = 'status-msg status-error';
                statusMessage.style.display = 'block';
                prereqInput.style.borderColor = '#ef4444';
                prereqInput.style.backgroundColor = '#fef2f2';
                prereqInput.removeAttribute('data-validated-id');
                
                document.getElementById('generated-id-display').textContent = 'Pending Verification...';
                submitButton.disabled = true;
            }
        })
        .catch(error => {
            verifyButton.disabled = false;
            hideLoading();
            console.error('Verification error:', error);
        });
    }

    function logBatchToGoogleSheets() {
        const validatedId = prereqInput.getAttribute('data-validated-id');

        if (currentTask !== 'RY' && !validatedId) {
            showAlertUI('Action Blocked', 'You must successfully verify your prerequisite ingredient batch before logging.', 'error');
            return;
        }
        if (!securelyGeneratedId || isFetchingId) {
            showAlertUI('Action Blocked', 'System is still generating a secure Batch ID. Please wait.', 'error');
            return;
        }

        submitButton.disabled = true;
        showLoading('Writing production logs to registry...');

        let logType = 'RY';
        if (currentTask === 'YB') logType = 'YB';
        if (currentTask === 'FY') logType = 'FY';

        const payload = {
            action: 'log',
            date: new Date().toISOString(),
            batchType: logType, 
            batchId: securelyGeneratedId,
            staffId: activeUser, 
            consumedId: currentTask === 'RY' ? 'None (Primary Step)' : validatedId
        };

        fetch(webAppUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(result => {
            hideLoading();
            if (result.status === 'success') {
                showAlertUI('Success', 'Batch successfully logged and tracked!', 'success');
                updateUiForTask(currentTask); 
            } else {
                showAlertUI('Error', 'Error logging batch: ' + result.message, 'error');
                submitButton.disabled = false;
            }
        })
        .catch(error => {
            hideLoading();
            console.error('Error logging batch:', error);
            showAlertUI('System Failure', 'Could not establish connection to registry servers.', 'error');
            submitButton.disabled = false;
        });
    }

    // MODAL WINDOW INTERACTION TRIGGERS
    submitButton.addEventListener('click', () => {
        const validatedId = prereqInput.getAttribute('data-validated-id');
        
        modalSummaryType.textContent = currentTask === 'RY' ? 'Raw Yogurt (RY)' : (currentTask === 'YB' ? 'Yogurt Base (YB)' : 'Finished Yogurt (FY)');
        modalSummaryId.textContent = securelyGeneratedId;
        modalSummaryConsumed.textContent = currentTask === 'RY' ? 'None (Primary Step)' : validatedId;

        confirmModal.classList.add('active');
    });

    modalCancelBtn.addEventListener('click', () => {
        confirmModal.classList.remove('active');
    });

    modalConfirmBtn.addEventListener('click', () => {
        confirmModal.classList.remove('active');
        logBatchToGoogleSheets();
    });

    verifyButton.addEventListener('click', () => {
        checkPrerequisiteId();
    });

    prereqInput.addEventListener('focus', () => {
        if (prereqInput.value === '') {
            prereqInput.setAttribute('placeholder', 'Type to search available entries...');
        }
    });
});